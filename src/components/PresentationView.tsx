import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  BookOpen, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Bookmark, 
  Sparkles, 
  ShieldCheck, 
  Shield, 
  Cpu, 
  Database, 
  Mail, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Check, 
  ArrowRight, 
  Layers, 
  FileText, 
  Printer, 
  X,
  Server,
  Key,
  Globe,
  Lock,
  Eye,
  AlertTriangle,
  Zap,
  Clock,
  UserCheck,
  Smartphone,
  CheckCircle
} from 'lucide-react';

interface PresentationViewProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  isOpen,
  onClose,
  userEmail = 'tousifahamedan@gmail.com',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'executive' | 'technical' | 'workflows' | 'showcase' | 'journey'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video / Journey Walkthrough Simulation State
  const [journeyStep, setJourneyStep] = useState(0);
  const [isPlayingJourney, setIsPlayingJourney] = useState(false);
  const [journeySpeed, setJourneySpeed] = useState<number>(1);
  const journeyTimerRef = useRef<any>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, isFullscreen]);

  // Animated Journey Video simulation timer
  useEffect(() => {
    if (isPlayingJourney) {
      const stepDuration = 3500 / journeySpeed;
      journeyTimerRef.current = setInterval(() => {
        setJourneyStep((prev) => {
          if (prev >= 5) {
            setIsPlayingJourney(false);
            return 5;
          }
          return prev + 1;
        });
      }, stepDuration);
    } else {
      if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    }
    return () => {
      if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    };
  }, [isPlayingJourney, journeySpeed]);

  if (!isOpen) return null;

  // Presentation Slide Definitions
  const slides = [
    // --- EXECUTIVE SECTION ---
    {
      id: 'title-slide',
      category: 'executive',
      tag: 'Executive Overview',
      title: 'Personal Memory Vault',
      subtitle: 'A Sacred Personal Repository & AI-Augmented Cognitive Biographer',
      badge: 'Google Cloud Run AI Challenge 2026',
      content: (
        <div className="space-y-8 max-w-4xl mx-auto text-left py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Cognitive Architecture</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Your Life, Remembered With Total Fidelity.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Moving beyond disposable chatbot conversations. Personal Memory Vault establishes an encrypted, owner-isolated personal intelligence system that preserves user memories as sacred, derives structured insights without altering raw truth, and delivers grounded reflections across years.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200">
                  Cloud Run Managed Container
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200">
                  Firebase Owner Isolation
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200">
                  Gemini Flash Fallback Ladder
                </span>
              </div>
            </div>

            {/* Visual Hero Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between pb-4 border-b border-indigo-800/60 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-indigo-200">Core Mission</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  PRODUCTION READY
                </span>
              </div>
              <blockquote className="text-sm italic text-indigo-100 leading-relaxed mb-6">
                "Treat the application as a private personal-memory system rather than a generic chatbot. Preserve raw user-authored content exactly as submitted. Never invent memories."
              </blockquote>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-indigo-300 block uppercase font-bold">Raw Memory Fidelity</span>
                  <span className="text-base font-bold text-white">100% Inviolable</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-indigo-300 block uppercase font-bold">Hallucination Risk</span>
                  <span className="text-base font-bold text-emerald-400">Strict Zero Policy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-indigo-600 font-bold text-lg mb-1">01. Ingestion</div>
              <div className="text-xs text-slate-500">Multimodal voice, geo-tagged photos, rich markdown &amp; SSRF-safe link bookmarks.</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-indigo-600 font-bold text-lg mb-1">02. Extraction</div>
              <div className="text-xs text-slate-500">Automated derivation of emotions, people, places, and actionable open loops.</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-indigo-600 font-bold text-lg mb-1">03. Grounding</div>
              <div className="text-xs text-slate-500">"Ask My Journal" semantic retrieval with clickable memory source attribution.</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-indigo-600 font-bold text-lg mb-1">04. Synthesis</div>
              <div className="text-xs text-slate-500">Life Map exploration, 7 reflection modes, and automated email recall digests.</div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: 'exec-problem',
      category: 'executive',
      tag: 'Executive Overview',
      title: 'The Problem: The Fragility of Digital Memory',
      subtitle: 'Why generic LLMs and traditional note-taking applications fail user consciousness',
      badge: 'Market & Psychological Analysis',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto text-left py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-red-50/70 border border-red-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-red-950">Generic AI Chatbots</h3>
              <ul className="text-xs text-red-900 space-y-2 list-disc list-inside">
                <li><strong>Ephemeral Context:</strong> Ephemeral session histories; memories vanish when threads are deleted.</li>
                <li><strong>Hallucination Prone:</strong> Confidently fabricates events, places, and sentiments the user never experienced.</li>
                <li><strong>Unchecked Data Scraping:</strong> Thoughts are ingested into central training corpora without client-side boundaries.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-amber-950">Passive Note Apps</h3>
              <ul className="text-xs text-amber-900 space-y-2 list-disc list-inside">
                <li><strong>The Filing Cabinet Trap:</strong> Static documents accumulate in unsearchable hierarchies; never reread.</li>
                <li><strong>Zero Synthesis:</strong> No entity linking between people met, emotional shifts, or places revisited.</li>
                <li><strong>Dead Open Loops:</strong> Promising intentions ("I must read this book") become buried graveyard items.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-indigo-950">Personal Memory Vault</h3>
              <ul className="text-xs text-indigo-900 space-y-2 list-disc list-inside">
                <li><strong>Sacred Immutability:</strong> Raw user prose is never modified; AI interpretations sit in distinct, editable layers.</li>
                <li><strong>Explainable Grounding:</strong> Verifiable source citations for every answer; explicit "I don't know" boundary.</li>
                <li><strong>Active Life Synthesis:</strong> Geographic maps, weekly retrospectives, and automated email recall digests.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span><strong>The Architectural Mandate:</strong> A personal memory system must never sacrifice user truth for creative eloquence.</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Directive #8 Compliant</span>
          </div>
        </div>
      ),
    },

    {
      id: 'exec-solution',
      category: 'executive',
      tag: 'Executive Overview',
      title: 'The Solution: 6 Architectural Pillars',
      subtitle: 'Comprehensive capabilities bridging sacred memory preservation and cognitive synthesis',
      badge: 'Product Pillars',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left py-2">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">1. Sacred Memory Layer</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Raw journal prose is cryptographically immutable. AI inferences (topics, emotions, entities) are isolated in independently editable sub-objects.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">2. Explainable Grounding</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              "Ask My Journal" semantic retrieval engine queries strictly within the authenticated user namespace, presenting exact source entry badges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">3. Interactive Life Map</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interactive Leaflet GIS clustering visualizes geographic memories across cities and journeys with smooth scroll telemetry.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">4. Open Loops Engine</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI automatically extracts commitments, ideas, and open loops into a 4-state lifecycle (Saved, In Progress, Completed, Dismissed).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">5. SSRF-Safe Web Ingestion</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              "Remember This" ingests articles and inspiration with strict DNS IP validation, preventing internal network port scanning.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">6. Email Recall Digests</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated weekly and yearly retrospectives synthesized by Gemini and delivered to the user's inbox with responsive HTML formatting.
            </p>
          </div>
        </div>
      ),
    },

    {
      id: 'exec-matrix',
      category: 'executive',
      tag: 'Executive Overview',
      title: 'Competitive Differentiation Matrix',
      subtitle: 'How Personal Memory Vault compares across privacy, persistence, and AI capabilities',
      badge: 'Benchmarking',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Capability / Criterion</th>
                  <th className="p-3.5 text-slate-500">Generic LLM Chatbots</th>
                  <th className="p-3.5 text-slate-500">Notion / Apple Notes</th>
                  <th className="p-3.5 text-indigo-600 bg-indigo-50/70 font-extrabold">Personal Memory Vault</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Memory Sovereignty &amp; Owner Isolation</td>
                  <td className="p-3 text-red-600">❌ Centralized corporate logging</td>
                  <td className="p-3 text-amber-600">⚠️ Account-level, unverified rules</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Owner-bound Firestore rules</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Inviolable Raw Prose Preservation</td>
                  <td className="p-3 text-red-600">❌ Rewritten or forgotten</td>
                  <td className="p-3 text-emerald-600">✅ Static manual text</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Raw text separate from AI metadata</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Explainable Grounding &amp; Citation</td>
                  <td className="p-3 text-red-600">❌ Opaque token probabilities</td>
                  <td className="p-3 text-slate-400">❌ No conversational querying</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Clickable source citations with dates</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Automated Open Loop Extraction</td>
                  <td className="p-3 text-red-600">❌ None</td>
                  <td className="p-3 text-amber-600">⚠️ Manual tagging required</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Automated 4-state lifecycle tracker</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Geographic Life Mapping</td>
                  <td className="p-3 text-red-600">❌ None</td>
                  <td className="p-3 text-red-600">❌ None</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Interactive Leaflet GIS telemetry</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Longitudinal Email Recalls</td>
                  <td className="p-3 text-red-600">❌ None</td>
                  <td className="p-3 text-red-600">❌ None</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Weekly &amp; Yearly HTML digests</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Decoupled Zero-Loss Offline Saves</td>
                  <td className="p-3 text-red-600">❌ Network dependent</td>
                  <td className="p-3 text-amber-600">⚠️ Sync lag</td>
                  <td className="p-3 text-emerald-700 bg-indigo-50/30 font-semibold">✅ Saves first before AI processing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },

    // --- TECHNICAL SECTION ---
    {
      id: 'tech-architecture',
      category: 'technical',
      tag: 'Technical Architecture',
      title: 'Full-Stack Container Architecture',
      subtitle: 'Google Cloud Run, Cloud Firestore, and Gemini AI integration topology',
      badge: 'System Architecture',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto text-left py-2">
          {/* Visual Architecture Diagram */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
                Full-Stack Topology Diagram
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Port 3000 Ingress &bull; Managed Container
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              {/* Client Tier */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Client Tier (SPA)</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  React 18 + Vite + Tailwind CSS + Leaflet GIS.
                </p>
                <ul className="space-y-1 text-slate-400 text-[10px] list-disc list-inside">
                  <li>Federated Google Auth Popup</li>
                  <li>Voice Dictation &amp; Media Buffer</li>
                  <li>Client-side Token Storage</li>
                  <li>Strict Undefined Payload Stripping</li>
                </ul>
              </div>

              {/* Server Tier */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-indigo-500/50 space-y-2 ring-1 ring-indigo-500/30">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Server className="w-4 h-4" />
                  <span>Google Cloud Run Backend</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Express.js container listening on <code>0.0.0.0:3000</code>.
                </p>
                <ul className="space-y-1 text-slate-400 text-[10px] list-disc list-inside">
                  <li>SSRF Protection (DNS Validation)</li>
                  <li>Gemini Model Fallback Ladder</li>
                  <li>7 Reflection Intentional Engines</li>
                  <li>Email Dispatch &amp; HTML Previewer</li>
                </ul>
              </div>

              {/* Cloud Services */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>GCP Cloud Services</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Managed Serverless Google Infrastructure.
                </p>
                <ul className="space-y-1 text-slate-400 text-[10px] list-disc list-inside">
                  <li>Cloud Firestore (Owner-isolated paths)</li>
                  <li>Secret Manager (Dynamic API Keys)</li>
                  <li>Gemini API (3.8-Flash / 3.6-Flash)</li>
                  <li>Cloud Run Automated Scaling</li>
                </ul>
              </div>
            </div>

            {/* Data Flow Arrows */}
            <div className="pt-2 text-center font-mono text-[11px] text-indigo-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              Browser Client ──[ HTTPS / REST ]──▶ Cloud Run Express Backend ──[ gRPC / HTTPS ]──▶ Cloud Firestore &amp; Gemini
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block">Ingress Compliance</span>
              <span className="text-slate-500">Strict single port (3000) reverse proxy routing required by Cloud Run.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block">Secret Zero-Hardcoding</span>
              <span className="text-slate-500">Dynamic Secret Manager IAM accessor binding; no plaintext secrets in bundles.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block">Production Labeling</span>
              <span className="text-slate-500">Labeled with <code>dev-tutorial=cloud-run-ai-challenge</code> for challenge verification.</span>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: 'tech-threat-model',
      category: 'technical',
      tag: 'Technical Architecture',
      title: 'Agentic Threat Model & Defense-in-Depth',
      subtitle: 'Mapping risks to countermeasures across the 5 core threat zones',
      badge: 'Production Directive #1 &amp; #2',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Threat Zone</th>
                  <th className="p-3">Identified Risk Scenario</th>
                  <th className="p-3">Countermeasure &amp; Security Invariant</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                <tr>
                  <td className="p-3 font-bold text-indigo-700">1. Input Surfaces</td>
                  <td className="p-3 text-slate-600">SSRF attacks via malicious URL ingestion in "Remember This"; private IP port scanning.</td>
                  <td className="p-3 text-slate-800">DNS pre-resolution validation; rejection of private IP ranges (10.x, 172.16.x, 192.168.x, 127.x, 169.254.x). Max 1MB payload ceiling.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Enforced</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-indigo-700">2. Planning &amp; Reasoning</td>
                  <td className="p-3 text-slate-600">Indirect prompt injection from ingested web pages or external memory notes attempting to hijack biographer instructions.</td>
                  <td className="p-3 text-slate-800">External text treated strictly as untrusted data strings. Raw journal text marked inviolable. System instructions isolated from user data blocks.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Enforced</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-indigo-700">3. Tool Execution &amp; APIs</td>
                  <td className="p-3 text-slate-600">Accidental exposure of Gemini API key or database master credentials in client code.</td>
                  <td className="p-3 text-slate-800">Server-side proxy routes (<code>/api/gemini/*</code>). Client never receives Gemini keys. Keys injected dynamically from Cloud Secret Manager.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Enforced</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-indigo-700">4. Memory &amp; State</td>
                  <td className="p-3 text-slate-600">Broken access control leading to cross-tenant memory leakage between different user accounts.</td>
                  <td className="p-3 text-slate-800">Firestore owner-bound rule checks: <code>request.auth != null &amp;&amp; request.auth.uid == userId</code>. Zero wildcards. Default deny rules.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Enforced</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-indigo-700">5. Inter-System Comms</td>
                  <td className="p-3 text-slate-600">Gemini model rate limit (429) or transient 503 outage causing silent data loss or app crashes.</td>
                  <td className="p-3 text-slate-800">Resilient Fallback Ladder (3.8-flash &rarr; 3.6-flash &rarr; 3.1-flash-lite &rarr; 3.7-flash). Zero-loss pre-save guarantee before AI processing.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Enforced</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
            <span className="font-medium">OWASP Top 10 for LLM Applications (LLM01 Prompt Injection, LLM02 Sensitive Info Disclosure, LLM05 Insecure Output) verified.</span>
            <span className="text-[11px] font-bold text-indigo-700">100% Pass</span>
          </div>
        </div>
      ),
    },

    {
      id: 'tech-gemini-ladder',
      category: 'technical',
      tag: 'Technical Architecture',
      title: 'Gemini AI Model Resilient Fallback Ladder',
      subtitle: 'Multi-tiered availability ladder preventing outages and handling rate limits',
      badge: '@google/genai TypeScript SDK',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto text-left py-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border-2 border-indigo-600 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full inline-block">
                Tier 1 &bull; Primary
              </span>
              <h4 className="text-sm font-bold text-slate-900">gemini-3.8-flash</h4>
              <p className="text-[11px] text-slate-600">
                Cutting-edge multimodal reasoning, high token throughput, instant emotional classification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full inline-block">
                Tier 2 &bull; High Avail
              </span>
              <h4 className="text-sm font-bold text-slate-900">gemini-3.6-flash</h4>
              <p className="text-[11px] text-slate-600">
                Stable production workhorse for structured JSON schema entity extraction and synthesis.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full inline-block">
                Tier 3 &bull; Fallback
              </span>
              <h4 className="text-sm font-bold text-slate-900">gemini-3.1-flash-lite</h4>
              <p className="text-[11px] text-slate-600">
                Ultra-low latency lightweight model guaranteeing responsiveness during heavy load spikes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full inline-block">
                Tier 4 &bull; Deep Logic
              </span>
              <h4 className="text-sm font-bold text-slate-900">gemini-3.7-flash</h4>
              <p className="text-[11px] text-slate-600">
                Deep analytical reasoning model invoked for complex longitudinal pattern synthesis.
              </p>
            </div>
          </div>

          {/* Code block snippet */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
            <div className="text-slate-400 text-[11px] flex items-center justify-between border-b border-slate-800 pb-2">
              <span>server.ts &bull; generateContentWithFallback()</span>
              <span className="text-emerald-400">Automatic Status Code Recovery</span>
            </div>
            <pre className="text-[11px] leading-relaxed overflow-x-auto text-indigo-300">
{`const MODEL_LADDER = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
];

// Catches: 429 Resource Exhausted, 503 Unavailable, 500 Internal Error
// Sequentially cascades through the ladder before surfacing errors to UI.`}
            </pre>
          </div>
        </div>
      ),
    },

    {
      id: 'tech-reflection-modes',
      category: 'technical',
      tag: 'Technical Architecture',
      title: 'The 7 Intentional Reflection Cognitive Engines',
      subtitle: 'Multi-turn, domain-specific AI reflection personalities respecting human autonomy',
      badge: 'Cognitive Science',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto text-left py-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 1. Reflect
            </div>
            <h5 className="text-xs font-bold text-slate-900">Socratic Inquiry</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Poses deep clarifying questions without judgment, encouraging self-discovery and emotional awareness.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> 2. Think
            </div>
            <h5 className="text-xs font-bold text-slate-900">First-Principles Logic</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dissects assumptions, identifies logical trade-offs, and unpacks cognitive biases in tough dilemmas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 3. Brainstorm
            </div>
            <h5 className="text-xs font-bold text-slate-900">Lateral Ideation</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Generates unconstrained creative angles, unexpected metaphors, and divergent problem-solving paths.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> 4. Rewrite
            </div>
            <h5 className="text-xs font-bold text-slate-900">Prose Refinement</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Polishes raw thoughts into evocative prose or memoirs without discarding user intent or vocabulary.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> 5. Find Patterns
            </div>
            <h5 className="text-xs font-bold text-slate-900">Thematic Synthesis</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connects the current entry to historical memories, surfacing cyclical moods, triggers, or growth.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> 6. Plan
            </div>
            <h5 className="text-xs font-bold text-slate-900">Milestone Decomposition</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Translates vague ambitions into actionable, time-bounded micro-commitments and concrete checklists.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 sm:col-span-2">
            <div className="text-indigo-600 font-bold text-xs uppercase flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> 7. Talk
            </div>
            <h5 className="text-xs font-bold text-slate-900">Empathetic Companion</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Conversational active listener offering gentle companionship without clinical diagnostics or unsolicited advice.
            </p>
          </div>
        </div>
      ),
    },

    // --- WORKFLOWS & DIAGRAMS ---
    {
      id: 'flow-user-journey',
      category: 'workflows',
      tag: 'System Workflows',
      title: 'End-to-End User Journey Workflow',
      subtitle: 'From spontaneous multimodal capture to longitudinal email recall',
      badge: 'Interactive Flowchart',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-center text-xs">
              
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">1</div>
                <span className="font-bold text-slate-800">Capture</span>
                <span className="text-[10px] text-slate-500 leading-tight">Text, Voice, Photo &amp; Geo-tags</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">2</div>
                <span className="font-bold text-slate-800">Pre-Save</span>
                <span className="text-[10px] text-slate-500 leading-tight">Atomic Firestore Persistence</span>
              </div>

              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">3</div>
                <span className="font-bold text-slate-800">Derive</span>
                <span className="text-[10px] text-slate-500 leading-tight">Gemini AI Entity Extraction</span>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">4</div>
                <span className="font-bold text-slate-800">Query</span>
                <span className="text-[10px] text-slate-500 leading-tight">"Ask My Journal" Grounding</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">5</div>
                <span className="font-bold text-slate-800">Track</span>
                <span className="text-[10px] text-slate-500 leading-tight">Life Map &amp; Open Loops</span>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col items-center justify-center space-y-1">
                <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs">6</div>
                <span className="font-bold text-slate-800">Recall</span>
                <span className="text-[10px] text-slate-500 leading-tight">Weekly &amp; Yearly HTML Digests</span>
              </div>

            </div>

            {/* Sequence detail table */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">Decoupled Operational Guarantees</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                <div>
                  <strong>Zero Thought Loss:</strong> If user inputs a memory and the device goes offline or Gemini times out, the raw entry is already committed to Cloud Firestore.
                </div>
                <div>
                  <strong>Independent AI Regeneration:</strong> Users can re-trigger entity extraction or run reflection modes at any subsequent time without altering the raw text.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: 'flow-persistence-decoupling',
      category: 'workflows',
      tag: 'System Workflows',
      title: 'Decoupled Persistence Sequence',
      subtitle: 'How the application guarantees zero data loss before invoking AI services',
      badge: 'Production Directive #6 &amp; #12',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800 space-y-3 shadow-xl">
            <div className="text-indigo-400 font-bold text-xs border-b border-slate-800 pb-2">
              Sequence Diagram: Atomic Pre-Save &amp; Async AI Extraction
            </div>
            <pre className="text-[11px] leading-relaxed overflow-x-auto text-indigo-300">
{`[User Interface]                [Cloud Firestore]             [Gemini Fallback API]
      │                                 │                               │
      ├─── 1. Submits Memory Note ─────▶│                               │
      │    (Preserve input buffer)      ├── 2. Commit Document ─────────┤
      │                                 │   (Raw Text Locked)           │
      │◀── 3. Confirm Write OK ─────────┤                               │
      │    (UI marked "Saved ✓")        │                               │
      │                                 │                               │
      ├─── 4. Trigger /api/gemini/extract ─────────────────────────────▶│
      │    (Background execution)       │                               ├── 5. Fallback Ladder
      │                                 │                               │   (3.8-Flash / 3.6-Flash)
      │◀── 6. Return Structured Metadata (Topics, People, Places) ──────┤
      │                                 │                               │
      ├─── 7. Update Document With AI Layer ───────────────────────────▶│
      │    (aiInterpretation field populated; rawContent untouched)     │`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium">Strict undefined stripping via <code>JSON.parse(JSON.stringify(payload))</code> prevents Firestore SDK driver crashes.</span>
            <span className="text-emerald-600 font-bold">Resilience Compliant</span>
          </div>
        </div>
      ),
    },

    // --- APPLICATION SCREENSHOTS & FEATURE SHOWCASE ---
    {
      id: 'showcase-timeline',
      category: 'showcase',
      tag: 'Application Showcase',
      title: 'Feature Showcase 1: The Memory Stream',
      subtitle: 'Card-based chronology with emotional pills, geocoding, and multi-turn reflections',
      badge: 'UI / UX Design',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          {/* High Fidelity UI Component Simulation */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Sunset at Palolem Beach, Goa</h4>
                  <span className="text-[10px] text-slate-400">March 2, 2026 &bull; South Goa, India</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200">
                  Peaceful
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                  Inspired
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              "Watched the sky shift from gold to purple over the Arabian Sea. Quiet conversation with friends about our creative projects for the coming year. Felt completely grounded."
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Palolem Beach
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500 font-medium">Topics: Travel, Friendship, Mindfulness</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                Open 7 Reflection Modes &rarr;
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Non-Destructive AI Metadata:</strong> Inferred tags can be deleted or adjusted without touching the raw journal text.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Search &amp; Mood Filters:</strong> Instant real-time filtering across emotions, places, dates, and topics.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Media &amp; Voice Attachment:</strong> Multi-modal playback with high-resolution photo previews.
            </div>
          </div>
        </div>
      ),
    },

    {
      id: 'showcase-ask-journal',
      category: 'showcase',
      tag: 'Application Showcase',
      title: 'Feature Showcase 2: Explainable "Ask My Journal"',
      subtitle: 'Zero-hallucination semantic search producing verifiable source entry citations',
      badge: 'Explainable AI',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-5 rounded-3xl bg-indigo-900 text-white border border-indigo-800 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-mono">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Query: "What made me happiest during my Goa trip?"</span>
            </div>

            {/* Grounded response card */}
            <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grounded in 4 Source Entries
                </span>
                <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-mono">
                  Inferences Explicitly Marked
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                "Based on 4 entries from your Goa trip, conversations with friends and quiet evenings watching the Arabian Sea sunset appear repeatedly associated with positive reflections. This is an inference from those entries, not an ungrounded hallucination."
              </p>
              
              {/* Clickable Source Citation Badges */}
              <div className="pt-2 border-t border-indigo-900 flex flex-wrap gap-2 text-[10px]">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-800/80 text-indigo-200 border border-indigo-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Sunset at Palolem Beach &bull; Mar 2
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-800/80 text-indigo-200 border border-indigo-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Morning Swim at Agonda &bull; Mar 3
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span><strong>Zero Hallucination Guarantee:</strong> If memories are insufficient to answer with proof, the system says <em>"Your journal does not contain sufficient records to answer this"</em> rather than fabricating details.</span>
          </div>
        </div>
      ),
    },

    {
      id: 'showcase-life-map',
      category: 'showcase',
      tag: 'Application Showcase',
      title: 'Feature Showcase 3: Interactive Life Map',
      subtitle: 'Geographic clustering and coordinate telemetry of life journeys across the world',
      badge: 'Leaflet GIS Telemetry',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Interactive Geographic Canvas</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Lat/Lng Storage &bull; Compact 280px Height &bull; Smooth Scroll Deck
              </span>
            </div>

            {/* Map Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold block">GOA, INDIA</span>
                <span className="text-xs font-semibold text-slate-200">Palolem &amp; Agonda Beaches</span>
                <p className="text-[10px] text-slate-400">Lat: 15.010 &bull; Lng: 74.023 &bull; 4 Memories</p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block">KYOTO, JAPAN</span>
                <span className="text-xs font-semibold text-slate-200">Arashiyama Bamboo Grove</span>
                <p className="text-[10px] text-slate-400">Lat: 35.016 &bull; Lng: 135.671 &bull; 3 Memories</p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold block">SWISS ALPS</span>
                <span className="text-xs font-semibold text-slate-200">Oeschinensee Glacier Lake</span>
                <p className="text-[10px] text-slate-400">Lat: 46.498 &bull; Lng: 7.728 &bull; 2 Memories</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong>Ergonomic Map Stage:</strong> Fixed at 280px height to maintain natural viewport flow, allowing seamless scrolling to the place cards deck below.
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong>Location-Based Memory Deck:</strong> Click any city or pin to filter memories captured within that geographic radius.
            </div>
          </div>
        </div>
      ),
    },

    {
      id: 'showcase-email-recall',
      category: 'showcase',
      tag: 'Application Showcase',
      title: 'Feature Showcase 4: Weekly Recall & Memories of the Year',
      subtitle: 'Delivering curated AI life reviews directly to the user\'s personal inbox',
      badge: 'Longitudinal Engagement',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Email Digest Dispatch Engine</h4>
                  <span className="text-[10px] text-slate-500">Delivering to <strong>{userEmail}</strong></span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                VERIFIED LIVE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase block">
                Generated Subject: "🌅 Whispers of Bamboo, Gold Skies, and Glacier Waters"
              </span>
              <p className="text-indigo-950 leading-relaxed font-sans">
                Curates memorable milestones, journeys across locations, open loops, and thoughtful questions for the week ahead into a responsive HTML email.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Weekly Recall</span>
                <span className="text-slate-500 text-[11px]">Milestones, open loop progress, and reflections from the past 7 days.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Memories of the Year</span>
                <span className="text-slate-500 text-[11px]">2026 retrospective mapping chapters, emotional shifts, and places visited.</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-xs flex items-center justify-between">
            <span className="text-[11px]">In-app interactive HTML/Plain-text previewer available under <strong>Life Review &rarr; Email Digest</strong>.</span>
            <span className="text-indigo-400 font-mono text-[10px]">Endpoint: /api/email/send-recall</span>
          </div>
        </div>
      ),
    },

    // --- ANIMATED USER JOURNEY VIDEO SIMULATION ---
    {
      id: 'interactive-video-journey',
      category: 'journey',
      tag: 'User Journey Flow',
      title: 'Interactive User Journey Simulation (Video Walkthrough)',
      subtitle: 'Watch the complete end-to-end flow from thought capture to email recall',
      badge: 'Interactive Journey Player',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          {/* Journey Video Controls Header */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingJourney(!isPlayingJourney)}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
                title={isPlayingJourney ? 'Pause Simulation' : 'Play Simulation'}
              >
                {isPlayingJourney ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setJourneyStep(0);
                  setIsPlayingJourney(false);
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div>
                <span className="text-xs font-bold text-white block">
                  Step {journeyStep + 1} of 6: {
                    [
                      'Quick Capture & Voice Dictation',
                      'Atomic Firestore Pre-Save',
                      'Parallel Gemini AI Derivation',
                      'Explainable Search & Citations',
                      'Life Map & Open Loop Tracking',
                      'Automated Email Recall Dispatch'
                    ][journeyStep]
                  }
                </span>
                <span className="text-[10px] text-slate-400">
                  {isPlayingJourney ? 'Simulating live user journey...' : 'Click Play or jump through steps below'}
                </span>
              </div>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-[11px]">
              <span className="text-slate-400 px-1 font-medium">Speed:</span>
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setJourneySpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg font-mono transition-all ${
                    journeySpeed === spd ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="grid grid-cols-6 gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setJourneyStep(s);
                  setIsPlayingJourney(false);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  journeyStep === s
                    ? 'bg-indigo-600 ring-2 ring-indigo-400/40'
                    : journeyStep > s
                    ? 'bg-indigo-300'
                    : 'bg-slate-200'
                }`}
                title={`Jump to Step ${s + 1}`}
              />
            ))}
          </div>

          {/* Interactive Screencast Simulation Screen */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl min-h-[280px] flex flex-col justify-between relative overflow-hidden">
            {/* Screen Chrome */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2 text-indigo-400">App Screencast Simulator</span>
              </div>
              <span className="text-[10px] text-slate-500">Live Stage Preview</span>
            </div>

            {/* Dynamic Step Visualization */}
            <div className="flex-1 flex flex-col justify-center">
              {journeyStep === 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Stage 1 &bull; Multimodal Capture</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    User records a moment at Palolem Beach
                  </h3>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="text-slate-400 italic">"Watched the sunset over the Arabian sea in Goa. Promised myself to finish reading the architecture book by April."</div>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-400">
                      <MapPin className="w-3.5 h-3.5" /> Palolem Beach, Goa &bull; 🎙️ Voice dictation audio buffer attached
                    </div>
                  </div>
                </div>
              )}

              {journeyStep === 1 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <Database className="w-3.5 h-3.5" />
                    <span>Stage 2 &bull; Atomic Zero-Loss Save</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Raw Prose Committed to Firestore Vault
                  </h3>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 space-y-1">
                    <div>✓ Document written to: /users/{'{userId}'}/entries/mem-goa-01</div>
                    <div>✓ rawContent locked &amp; encrypted</div>
                    <div>✓ Client UI marked "Saved in Vault ✓"</div>
                  </div>
                </div>
              )}

              {journeyStep === 2 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Stage 3 &bull; Gemini Entity Derivation</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Gemini 3.8-Flash Extracts Structured Inferences
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Emotions</span>
                      <span className="text-indigo-300 font-bold">Peaceful, Inspired</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Location</span>
                      <span className="text-emerald-300 font-bold">Palolem Beach</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Open Loop</span>
                      <span className="text-amber-300 font-bold">Read Book by April</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Model Used</span>
                      <span className="text-cyan-300 font-bold">gemini-3.8-flash</span>
                    </div>
                  </div>
                </div>
              )}

              {journeyStep === 3 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                    <Search className="w-3.5 h-3.5" />
                    <span>Stage 4 &bull; Grounded Semantic Query</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Asking: "What made me happiest in Goa?"
                  </h3>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                    <p className="text-slate-200">
                      "Conversations with friends and quiet sunsets over the Arabian Sea repeatedly brought joy and calm."
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Citation: Sunset at Palolem Beach (March 2, 2026)
                    </div>
                  </div>
                </div>
              )}

              {journeyStep === 4 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Stage 5 &bull; Open Loop &amp; Map Telemetry</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Actionable Open Loop Tracked &amp; Resolved
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase">Open Loop Tracker</span>
                      <span className="text-slate-200 font-medium">"Finish reading design book by April"</span>
                      <div className="mt-1 text-[10px] text-emerald-400">Status: Completed ✓</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-indigo-400 font-bold block uppercase">Life Map Pin</span>
                      <span className="text-slate-200 font-medium">South Goa &bull; 15.010° N, 74.023° E</span>
                      <div className="mt-1 text-[10px] text-slate-400">Clustered with 3 other beach memories</div>
                    </div>
                  </div>
                </div>
              )}

              {journeyStep === 5 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Stage 6 &bull; Automated Longitudinal Recall</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Weekly Recall Delivered to {userEmail}
                  </h3>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <div className="text-indigo-300 font-bold">Delivered: "🌅 Whispers of Bamboo, Gold Skies, and Glacier Waters"</div>
                    <div className="text-slate-400 text-[11px]">Synthesizes highlights, journeys, and reflection prompts for the week ahead into a responsive HTML email.</div>
                    <div className="text-emerald-400 text-[10px] font-mono">Status: Delivered &bull; Available in Test Mailbox ↗</div>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
              <button
                type="button"
                onClick={() => setJourneyStep((prev) => Math.max(0, prev - 1))}
                disabled={journeyStep === 0}
                className="text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>

              <button
                type="button"
                onClick={() => setJourneyStep((prev) => Math.min(5, prev + 1))}
                disabled={journeyStep === 5}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 flex items-center gap-1 font-semibold cursor-pointer"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ),
    },

    // --- DEPLOYMENT & ROADMAP ---
    {
      id: 'conclusion-deployment',
      category: 'technical',
      tag: 'Deployment & Verification',
      title: 'Cloud Run Deployment & Verification',
      subtitle: 'Production readiness and Google Cloud Challenge verification',
      badge: 'Compliance Verified',
      content: (
        <div className="max-w-4xl mx-auto py-2 text-left space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase">
                Production Deployment Parameters
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                CHALLENGE COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Mandatory Verification Label</span>
                <span className="text-emerald-400 font-bold">dev-tutorial=cloud-run-ai-challenge</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Cloud Run Ingress Port</span>
                <span className="text-indigo-300 font-bold">Port 3000 (0.0.0.0 Binding)</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Target Cloud Region</span>
                <span className="text-slate-200">asia-southeast1 / us-central1</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Secret Manager Key</span>
                <span className="text-slate-200">GEMINI_API_KEY:latest</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <h5 className="font-bold text-slate-800 mb-1">Roadmap: On-Device Whisper</h5>
              <p className="text-slate-500 text-[11px]">Client-side WebAssembly speech transcription for 100% offline audio journaling.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <h5 className="font-bold text-slate-800 mb-1">Roadmap: End-to-End Crypto</h5>
              <p className="text-slate-500 text-[11px]">Optional WebCrypto AES-GCM user passphrase encryption before Firestore storage.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <h5 className="font-bold text-slate-800 mb-1">Roadmap: Calendar Sync</h5>
              <p className="text-slate-500 text-[11px]">Correlating journal reflections with Google Calendar meetings to track energy drain.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Filter slides based on active category
  const filteredSlides = activeCategory === 'all'
    ? slides
    : slides.filter((s) => s.category === activeCategory);

  const activeIndex = Math.min(currentSlide, filteredSlides.length - 1);
  const slide = filteredSlides[activeIndex] || slides[0];

  const nextSlide = () => {
    if (activeIndex < filteredSlides.length - 1) {
      setCurrentSlide(activeIndex + 1);
    }
  };

  const prevSlide = () => {
    if (activeIndex > 0) {
      setCurrentSlide(activeIndex - 1);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-slate-800 transition-all ${isFullscreen ? 'p-0' : 'p-2 sm:p-6'}`}>
      
      {/* Outer Container */}
      <div className={`flex-1 flex flex-col bg-slate-50 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 ${isFullscreen ? 'rounded-none border-none' : ''}`}>
        
        {/* Presentation Header Bar */}
        <div className="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Personal Memory Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  Project Presentation Deck
                </span>
              </h2>
              <span className="text-[10px] text-slate-500 block">
                Slide {activeIndex + 1} of {filteredSlides.length} &bull; {slide.tag}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
            {[
              { id: 'all', label: 'All Slides' },
              { id: 'executive', label: 'Executive' },
              { id: 'technical', label: 'Technical' },
              { id: 'workflows', label: 'Workflows' },
              { id: 'showcase', label: 'Showcase' },
              { id: 'journey', label: 'User Journey' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id as any);
                  setCurrentSlide(0);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Presentation / Save as PDF"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Deck"
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presentation Slide Stage */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-center text-center relative bg-gradient-to-b from-slate-50 to-slate-100/60">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            
            {/* Slide Header */}
            <div className="space-y-1.5 border-b border-slate-200/60 pb-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {slide.badge}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto font-sans">
                {slide.subtitle}
              </p>
            </div>

            {/* Slide Body */}
            <div className="py-2">
              {slide.content}
            </div>

          </div>
        </div>

        {/* Presentation Footer Navigation */}
        <div className="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              disabled={activeIndex === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              disabled={activeIndex === filteredSlides.length - 1}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slide Indicators Dots */}
          <div className="hidden md:flex items-center gap-1.5">
            {filteredSlides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                title={s.title}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'w-6 bg-indigo-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
            <span>Use &larr; &rarr; or Spacebar</span>
            <span>&bull;</span>
            <span>Press 'F' for Fullscreen</span>
          </div>
        </div>

      </div>
    </div>
  );
};
