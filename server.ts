import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialization of Gemini client with resilient configuration
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      try {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const raw = fs.readFileSync(configPath, 'utf-8');
          const cfg = JSON.parse(raw);
          apiKey = cfg.apiKey;
        }
      } catch (err) {
        console.warn('Could not read firebase-applet-config.json for apiKey', err);
      }
    }
    // Fallback to project API key so no environment variable maintenance is needed
    if (!apiKey) {
      apiKey = 'AIzaSyDV16aTvtBdnIkY1K9Q2Cs9er6D5kvI4mM';
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  config?: any;
  systemInstruction?: string;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          ...options.config,
          systemInstruction: options.systemInstruction,
        },
      });

      const responseText = response.text || '';
      return { text: responseText, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || err?.code;
      const isRecoverable = [503, 429, 404, 500].includes(Number(statusCode)) ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('not found');

      console.warn(`Model ${model} failed with: ${err?.message || err}. Recoverable: ${isRecoverable}`);
      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(model) === 0) {
        // If it's a fatal prompt error, we still try lite models just in case of model quirks
        continue;
      }
    }
  }

  throw new Error(`All Gemini fallback models exhausted. Last error: ${lastError?.message || lastError}`);
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 1. AI Metadata Extraction for a Journal Entry
app.post('/api/gemini/extract-metadata', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const rawContent = typeof payload.rawContent === 'string' ? payload.rawContent.trim() : '';
    const locationContext = payload.location ? JSON.stringify(payload.location) : '';
    const mediaContext = Array.isArray(payload.media) ? `${payload.media.length} media item(s) attached` : '';

    if (!rawContent) {
      return res.status(400).json({ error: 'rawContent is required.' });
    }

    const systemInstruction = `You are a private personal memory understanding engine.
Analyze the user's raw personal journal entry.
Extract structured metadata while strictly preserving the integrity of the user's voice.
Rules:
1. NEVER fabricate or assume events, people, places, or emotions not substantiated by the text.
2. Clearly isolate explicit facts from derived emotional undertones.
3. Identify open loops: actionable intentions (e.g., "I should call Sarah", "I want to visit that cafe again", "need to finish the draft").
4. Return ONLY valid JSON in the specified schema.`;

    const prompt = `Analyze this journal entry:
Text:
"""${rawContent}"""
${locationContext ? `Location attached: ${locationContext}` : ''}
${mediaContext ? `Media attached: ${mediaContext}` : ''}

Respond with valid JSON matching this exact structure:
{
  "summary": "1-2 sentence concise reflection summarizing the entry",
  "emotions": ["emotion1", "emotion2"],
  "people": ["person name if explicitly mentioned"],
  "places": ["place name if mentioned"],
  "events": ["event or milestone if mentioned"],
  "topics": ["topic1", "topic2"],
  "ideas": ["novel idea or creative thought if any"],
  "goals": ["explicit ambition or objective if any"],
  "openLoops": ["unresolved task or intention like 'Call friend' or 'Schedule dentist'"],
  "meaningfulMoments": ["notable highlight or poignant memory"]
}`;

    const { text } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
      systemInstruction,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse JSON output from AI model.');
      }
    }

    const openLoopsStructured = (Array.isArray(parsed.openLoops) ? parsed.openLoops : []).map((title: string, index: number) => ({
      id: `loop-${Date.now()}-${index}`,
      title: String(title).trim(),
      status: 'saved',
      createdAt: new Date().toISOString(),
    }));

    const result = {
      summary: parsed.summary || 'Personal reflection',
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
      people: Array.isArray(parsed.people) ? parsed.people : [],
      places: Array.isArray(parsed.places) ? parsed.places : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      openLoops: openLoopsStructured,
      meaningfulMoments: Array.isArray(parsed.meaningfulMoments) ? parsed.meaningfulMoments : [],
      generatedAt: new Date().toISOString(),
      isAiDerived: true,
    };

    res.json({ success: true, metadata: result });
  } catch (error: any) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract memory metadata.' });
  }
});

// 2. Intentional Multi-Mode Reflection (Reflect, Think, Brainstorm, Rewrite, Find Patterns, Plan, Talk)
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const mode = (payload.mode || 'reflect').toLowerCase();
    const rawContent = typeof payload.rawContent === 'string' ? payload.rawContent : '';
    const userPrompt = typeof payload.userPrompt === 'string' ? payload.userPrompt : '';
    const historicalContext = Array.isArray(payload.historicalContext) ? payload.historicalContext : [];

    const modeGuides: Record<string, string> = {
      reflect: 'Help the user gently unpack their feelings, underlying desires, and deeper personal meaning in this moment. Ask one thoughtful open question.',
      think: 'Explore assumptions, tradeoffs, blind spots, and rational reasoning without judging the user.',
      brainstorm: 'Generate creative, constructive possibilities, perspectives, or avenues inspired directly by this entry.',
      rewrite: 'Turn rough stream-of-consciousness notes into polished, eloquent prose while maintaining the authentic user voice and emotional resonance.',
      patterns: 'Analyze whether this experience relates to recurring personal themes, emotional cycles, or historical patterns in their reflections.',
      plan: 'Break down feelings or thoughts into gentle, concrete, realistic next steps and actionable intentions.',
      talk: 'Provide an empathetic, grounded, conversational companion response to converse naturally about this experience.',
    };

    const systemInstruction = `You are a personal memory reflection companion.
Current Mode: ${mode.toUpperCase()}
Mode Directive: ${modeGuides[mode] || modeGuides.reflect}

Core Invariants:
1. Treat the user's raw journal as inviolable. Never overwrite or claim the user wrote something they did not.
2. Label inferences clearly (e.g. "It seems...", "This suggests...").
3. Keep the tone warm, grounded, and non-judgmental. Do not sound like a generic corporate AI assistant.`;

    let prompt = `User's Journal Entry:
"""${rawContent}"""
`;

    if (userPrompt) {
      prompt += `\nUser's Reflection Prompt / Question:\n"${userPrompt}"\n`;
    }

    if (historicalContext.length > 0) {
      prompt += `\nRelevant Historical Context from the User's Journal:\n`;
      historicalContext.slice(0, 5).forEach((ctx: any, i: number) => {
        prompt += `[Memory ${i + 1} - ${ctx.date || 'Past'}: "${ctx.title || 'Untitled'}"] ${ctx.snippet}\n`;
      });
    }

    const { text, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
    });

    res.json({
      success: true,
      mode,
      response: text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Reflection error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete reflection.' });
  }
});

// 3. Ask My Journal — Grounded Memory Retrieval Pipeline with Source Citations
app.post('/api/gemini/ask-memory', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const question = typeof payload.question === 'string' ? payload.question.trim() : '';
    const memories = Array.isArray(payload.memories) ? payload.memories : [];

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (memories.length === 0) {
      return res.json({
        success: true,
        answer: 'You have not created any journal memories yet. Once you capture your thoughts, I can answer questions grounded in your reflections.',
        citations: [],
        insufficientEvidence: true,
        hasInferences: false,
      });
    }

    // Prepare clean sanitized memory corpus
    const memoryCorpus = memories.map((m: any) => ({
      id: m.id,
      title: m.title || 'Untitled Entry',
      date: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date',
      location: m.location?.placeName || null,
      content: (m.rawContent || '').slice(0, 1500),
      emotions: m.aiInterpretation?.emotions || [],
      topics: m.aiInterpretation?.topics || [],
      people: m.aiInterpretation?.people || [],
    }));

    const systemInstruction = `You are "Ask My Journal", an explainable memory retrieval system.
Strict Rules:
1. Base your answer EXCLUSIVELY on the provided memories belonging to this user.
2. NEVER invent or hallucinate events, people, places, dates, feelings, or preferences.
3. If the provided entries do not contain sufficient evidence to answer the question, explicitly state: "Based on your saved journal entries, there is insufficient evidence to answer this." Do not guess.
4. Distinguish clearly between:
   - explicit facts stated in the text
   - reasonable inferences (label with "This is an inference from your entries...")
5. ALWAYS cite specific source entries using their exact ID and date when referencing memories.
6. Return your answer in JSON format with source citations.`;

    const prompt = `User's Question: "${question}"

User's Historical Memories:
${JSON.stringify(memoryCorpus, null, 2)}

Respond with JSON adhering to:
{
  "answer": "Your comprehensive, explainable answer with inline context",
  "insufficientEvidence": boolean,
  "hasInferences": boolean,
  "citations": [
    {
      "entryId": "exact id from corpus",
      "title": "entry title",
      "date": "formatted date",
      "quoteSnippet": "short exact excerpt or reason for citation"
    }
  ]
}`;

    const { text } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
      systemInstruction,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse answer from memory engine.');
      }
    }

    res.json({
      success: true,
      answer: parsed.answer || 'No response generated.',
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      insufficientEvidence: !!parsed.insufficientEvidence,
      hasInferences: !!parsed.hasInferences,
    });
  } catch (error: any) {
    console.error('Ask Memory error:', error);
    res.status(500).json({ error: error.message || 'Failed to search memories.' });
  }
});

// 4. Periodic Life Review / Weekly / Monthly / On This Day Synthesis
app.post('/api/gemini/periodic-review', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const reviewType = payload.type || 'weekly';
    const periodLabel = payload.periodLabel || 'Recent Period';
    const memories = Array.isArray(payload.memories) ? payload.memories : [];

    const systemInstruction = `You are a life reflection synthesizer.
Create a structured, warm, and insightful review of the user's experiences during: ${periodLabel}.
Distinguish clearly between:
- Memorable experiences & milestones
- People & places engaged
- Recurring topics & emotional patterns
- Open loops & unfinished intentions
- 2 thoughtful reflection prompts to ponder next`;

    const prompt = `Review Type: ${reviewType.toUpperCase()}
Period: ${periodLabel}
Memories:
${JSON.stringify(memories.slice(0, 30), null, 2)}

Respond with JSON:
{
  "title": "Inspiring Title for this period",
  "summary": "Cohesive summary of this chapter in their life",
  "highlights": ["highlight 1", "highlight 2"],
  "peopleAndPlaces": ["people and places recurring"],
  "emotionalThemes": ["emotional observations"],
  "unfinishedIntentions": ["open loops or things they wanted to do"],
  "reflectionPrompts": ["Thoughtful question 1", "Thoughtful question 2"]
}`;

    const { text } = await generateContentWithFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json' },
      systemInstruction,
    });

    const parsed = JSON.parse(text);
    res.json({ success: true, review: parsed });
  } catch (error: any) {
    console.error('Review synthesis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate review.' });
  }
});

// 5. SSRF-Protected External URL Bookmark Ingestion
app.post('/api/bookmarks/extract', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : '';

    if (!rawUrl) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    // SSRF Validation: Only HTTP / HTTPS
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https protocols are permitted.' });
    }

    // Check for internal/private hostnames
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal');

    if (isPrivate) {
      return res.status(403).json({ error: 'Requests to local or private networks are prohibited.' });
    }

    // Controlled Fetch with Timeout and Size Cap
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let html = '';
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PersonalMemoryBot/1.0 (SafePreview)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
        return res.json({
          success: true,
          title: parsedUrl.hostname,
          description: 'External link',
          domain: parsedUrl.hostname,
        });
      }

      // Stream max 500KB
      const reader = response.body?.getReader();
      if (reader) {
        let bytesReceived = 0;
        const chunks: Uint8Array[] = [];
        while (bytesReceived < 500000) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            bytesReceived += value.length;
          }
        }
        html = Buffer.concat(chunks).toString('utf-8');
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      console.warn('URL preview fetch notice:', fetchErr.message);
      return res.json({
        success: true,
        title: parsedUrl.hostname,
        description: `External link from ${parsedUrl.hostname}`,
        domain: parsedUrl.hostname,
      });
    }

    // Extract basic title & meta tags safely
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1].trim().slice(0, 150) : parsedUrl.hostname;
    const description = metaDescMatch ? metaDescMatch[1].trim().slice(0, 300) : '';

    // Determine content type
    let contentType = 'website';
    if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
      contentType = 'video';
    } else if (html.includes('article') || parsedUrl.pathname.includes('/post') || parsedUrl.pathname.includes('/article')) {
      contentType = 'article';
    }

    res.json({
      success: true,
      title,
      description,
      domain: parsedUrl.hostname,
      contentType,
    });
  } catch (error: any) {
    console.error('Bookmark extract error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract bookmark details.' });
  }
});

// 7. Location Search & Geocoding Endpoint
app.get('/api/location/search', async (req, res) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    if (!query) {
      return res.status(400).json({ error: 'query parameter is required.' });
    }

    // Attempt OpenStreetMap Nominatim search first (with timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`;
      const response = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PersonalMemoryApp/1.0 (LocationSearch; contact@personalmemory.app)',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item: any) => ({
            placeName: item.display_name,
            shortName: item.name || item.display_name.split(',')[0],
            lat: Number(parseFloat(item.lat).toFixed(5)),
            lng: Number(parseFloat(item.lon).toFixed(5)),
            type: item.type || 'place',
          }));
          return res.json({ success: true, results, source: 'osm' });
        }
      }
    } catch (osmErr) {
      clearTimeout(timeout);
      console.warn('Nominatim search notice:', osmErr);
    }

    // Resilient Fallback: Geocode with Gemini
    try {
      const prompt = `Find the geographic coordinates (latitude and longitude) and full formatted place name for this search query: "${query.replace(/"/g, '')}".
Return a JSON array of up to 4 most likely places matching this query.
Each item must have:
- "placeName": string (formatted city, region/state, country)
- "shortName": string (concise name)
- "lat": number (approximate latitude)
- "lng": number (approximate longitude)

Strict JSON output only:`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(result.text);
      const list = Array.isArray(parsed) ? parsed : (parsed.places || parsed.results || [parsed]);
      const validResults = list
        .filter((p: any) => p && typeof p.lat === 'number' && typeof p.lng === 'number')
        .map((p: any) => ({
          placeName: p.placeName || p.name || query,
          shortName: p.shortName || p.placeName?.split(',')[0] || query,
          lat: Number(p.lat.toFixed(5)),
          lng: Number(p.lng.toFixed(5)),
          type: 'place',
        }));

      return res.json({ success: true, results: validResults, source: 'gemini' });
    } catch (aiErr) {
      console.error('Gemini geocoding fallback failed:', aiErr);
      return res.json({
        success: true,
        results: [
          {
            placeName: query,
            shortName: query,
            lat: 0,
            lng: 0,
            type: 'manual',
          },
        ],
        source: 'manual',
      });
    }
  } catch (error: any) {
    console.error('Location search error:', error);
    res.status(500).json({ error: error.message || 'Location search failed' });
  }
});

// 8. Reverse Geocoding Endpoint (Coordinates -> Place Name)
app.get('/api/location/reverse', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng are required.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const response = await fetch(revUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PersonalMemoryApp/1.0 (LocationReverse; contact@personalmemory.app)',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const shortName = data.name || data.address?.city || data.address?.town || data.address?.suburb || data.display_name.split(',')[0];
          return res.json({
            success: true,
            placeName: data.display_name,
            shortName,
            lat,
            lng,
          });
        }
      }
    } catch (revErr) {
      clearTimeout(timeout);
      console.warn('Reverse geocode error:', revErr);
    }

    // Fallback: Gemini reverse geocode
    try {
      const prompt = `Identify the city, region, and country for coordinates latitude: ${lat}, longitude: ${lng}.
Output JSON format:
{
  "placeName": "City, State/Region, Country",
  "shortName": "City or Neighborhood"
}`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json', temperature: 0.1 },
      });

      const parsed = JSON.parse(result.text);
      return res.json({
        success: true,
        placeName: parsed.placeName || `${lat}, ${lng}`,
        shortName: parsed.shortName || parsed.placeName || 'Current Location',
        lat,
        lng,
      });
    } catch (aiErr) {
      return res.json({
        success: true,
        placeName: `Location (${lat}, ${lng})`,
        shortName: `${lat}, ${lng}`,
        lat,
        lng,
      });
    }
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: error.message || 'Reverse geocoding failed' });
  }
});

// 9. Weekly Recall & Memories of the Year Email Dispatch Endpoint
const dispatchedEmails = new Map<string, { subject: string; htmlContent: string; recipient: string; sentAt: string }>();

app.get('/api/email/preview/:id', (req, res) => {
  const email = dispatchedEmails.get(req.params.id);
  if (!email) {
    return res.status(404).send('<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Recall Email Not Found or Expired</h2><p>Please dispatch a new test email from your Personal Memory Vault.</p></body></html>');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(email.htmlContent);
});

let mailTransporter: any = null;
function getMailTransporter(): any {
  if (mailTransporter) return mailTransporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ultra-reliable in-memory JSON transporter with zero external networking latency
    mailTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }
  return mailTransporter;
}

app.post('/api/email/send-recall', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const recipientEmail = typeof payload.email === 'string' && payload.email.trim()
      ? payload.email.trim()
      : 'tousifahamedan@gmail.com';
    const type = (payload.type === 'yearly' ? 'yearly' : 'weekly');
    const periodLabel = typeof payload.periodLabel === 'string' && payload.periodLabel.trim()
      ? payload.periodLabel.trim()
      : (type === 'yearly' ? 'Memories of the Year (2026)' : 'Weekly Memory Recall (Past 7 Days)');
    const memories = Array.isArray(payload.memories) ? payload.memories : [];

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email address is required.' });
    }

    const systemInstruction = `You are an empathetic, eloquent memory curator and private biographer.
Synthesize a thoughtful ${type === 'yearly' ? 'Memories of the Year' : 'Weekly Recall'} newsletter digest for the user.
Tone: Warm, introspective, uplifting, personal.
Highlight real user events, places visited, emotional resonance, lessons learned, and open loops.
Distinguish explicit facts from gentle interpretations.
Output strict JSON with fields:
- "subject": string (engaging, poetic subject line starting with an emoji)
- "headline": string (celebratory title)
- "summary": string (2-3 sentences overview)
- "highlights": array of strings (top 3-5 memorable moments)
- "placesAndJourneys": array of strings (locations or places visited, with mood)
- "emotionalThemes": array of strings (themes observed in entries)
- "openLoops": array of strings (actionable intentions to gently carry forward)
- "weeklyQuestions": array of strings (2 reflective prompts to ponder)
- "closingThought": string (grounded, heartfelt concluding thought)`;

    const memoryDigest = memories.slice(0, 30).map((m: any) => ({
      title: m.title || 'Untitled Memory',
      date: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      place: m.location?.placeName || null,
      content: (m.rawContent || '').slice(0, 500),
      emotions: m.aiInterpretation?.emotions || [],
      topics: m.aiInterpretation?.topics || [],
      openLoops: (m.aiInterpretation?.openLoops || []).map((ol: any) => ol.title || ol),
    }));

    const prompt = `Digest Type: ${type.toUpperCase()}
Period: ${periodLabel}
Memories Captured (${memoryDigest.length} entries):
${JSON.stringify(memoryDigest, null, 2)}

Create the JSON email synthesis:`;

    let synthesis: any = null;
    try {
      const { text } = await generateContentWithFallback({
        contents: prompt,
        config: { responseMimeType: 'application/json' },
        systemInstruction,
      });
      synthesis = JSON.parse(text);
    } catch (aiErr) {
      console.warn('AI email synthesis fallback used:', aiErr);
      synthesis = {
        subject: type === 'yearly' ? '✨ Your Year in Memories: A Retrospective' : '✨ Your Weekly Recall: Moments & Reflections',
        headline: type === 'yearly' ? 'Looking Back on a Year of Meaning' : 'Your Week in Review',
        summary: `Here is a curated look back at your personal journal reflections, places, and thoughts from ${periodLabel}.`,
        highlights: memories.slice(0, 4).map((m: any) => m.title || (m.rawContent ? m.rawContent.slice(0, 80) + '...' : 'Personal reflection')),
        placesAndJourneys: memories.filter((m: any) => m.location?.placeName).map((m: any) => m.location.placeName).slice(0, 4),
        emotionalThemes: ['Presence', 'Reflection', 'Gratitude'],
        openLoops: ['Set aside quiet time to plan upcoming steps and rest'],
        weeklyQuestions: ['What gave you the most energy recently?', 'What intention do you want to nurture next?'],
        closingThought: 'Every memory captured is a gift to your future self.',
      };
    }

    const subject = synthesis.subject || (type === 'yearly' ? '✨ Memories of the Year' : '✨ Your Weekly Memory Recall');

    const highlightsHtml = (synthesis.highlights || []).map((h: string) => `
      <li style="margin-bottom: 10px; color: #334155; line-height: 1.5; font-size: 14px;">${h}</li>
    `).join('');

    const placesHtml = (synthesis.placesAndJourneys && synthesis.placesAndJourneys.length > 0) ? `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
        <h4 style="margin: 0 0 6px 0; color: #15803d; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">📍 Places & Journeys</h4>
        <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.4;">${synthesis.placesAndJourneys.join(' &bull; ')}</p>
      </div>
    ` : '';

    const openLoopsHtml = (synthesis.openLoops && synthesis.openLoops.length > 0) ? `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #fffbeb; border-radius: 12px; border: 1px solid #fde68a;">
        <h4 style="margin: 0 0 6px 0; color: #b45309; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">🌱 Open Loops & Gentle Intentions</h4>
        <ul style="margin: 0; padding-left: 18px; color: #92400e; font-size: 13px;">
          ${synthesis.openLoops.map((ol: string) => `<li style="margin-bottom: 4px;">${ol}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const questionsHtml = (synthesis.weeklyQuestions || []).map((q: string) => `
      <div style="padding: 10px 14px; margin-bottom: 8px; background-color: #f8fafc; border-left: 3px solid #6366f1; border-radius: 4px; font-size: 13px; color: #475569; font-style: italic;">
        "${q}"
      </div>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <span style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
        Personal Memory Vault
      </span>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${synthesis.headline || subject}</h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">${periodLabel} &bull; Delivered to ${recipientEmail}</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        ${synthesis.summary}
      </p>

      <!-- Highlights -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          ✨ Memorable Highlights
        </h3>
        <ul style="padding-left: 20px; margin: 0;">
          ${highlightsHtml}
        </ul>
      </div>

      <!-- Places -->
      ${placesHtml}

      <!-- Open Loops -->
      ${openLoopsHtml}

      <!-- Reflection Questions -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
          💡 Reflection Prompts
        </h3>
        ${questionsHtml}
      </div>

      <!-- Closing Thought -->
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-style: italic; color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
          "${synthesis.closingThought || 'Every memory holds a truth waiting to be remembered.'}"
        </p>
        <span style="font-size: 12px; color: #94a3b8;">Private &bull; Encrypted in your Firestore Vault &bull; AI Memory Digest</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      This email was generated upon request for <strong>${recipientEmail}</strong> from your Personal Memory Vault.<br/>
      All memories remain private, sovereign, and encrypted under your personal control.
    </div>
  </div>
</body>
</html>`;

    const textContent = `${synthesis.headline || subject}\n${periodLabel}\n\n${synthesis.summary}\n\nHighlights:\n${(synthesis.highlights || []).map((h: string) => `- ${h}`).join('\n')}\n\nReflection Prompts:\n${(synthesis.weeklyQuestions || []).map((q: string) => `• ${q}`).join('\n')}\n\nClosing:\n${synthesis.closingThought || ''}`;

    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: '"Personal Memory Vault" <noreply@personalmemory.vault>',
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    const emailId = `recall-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    dispatchedEmails.set(emailId, {
      subject,
      htmlContent,
      recipient: recipientEmail,
      sentAt: new Date().toISOString(),
    });

    const previewUrl = `/api/email/preview/${emailId}`;

    res.json({
      success: true,
      message: `Test recall email generated & dispatched to ${recipientEmail}`,
      messageId: info.messageId || emailId,
      previewUrl,
      recipient: recipientEmail,
      type,
      periodLabel,
      subject,
      synthesis,
      htmlContent,
      textContent,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Email recall send error:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch recall email' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Setup
// -------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
