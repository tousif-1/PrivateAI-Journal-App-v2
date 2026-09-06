import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCase {
  id: string;
  category: string;
  title: string;
  steps: string[];
  expected: string;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [completedCases, setCompletedCases] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<string>('Authentication');

  if (!isOpen) return null;

  const testCases: TestCase[] = [
    // Authentication
    {
      id: 'auth-1',
      category: 'Authentication',
      title: 'Google Federated Sign-In Flow',
      steps: [
        '1. Open application in unauthenticated state.',
        '2. Click "Sign in with Google" button on the landing page.',
        '3. Complete Google Identity Services client-side popup selection.',
      ],
      expected: 'User is authenticated via Firebase Auth; redirected immediately to private personal memory dashboard without custom password collection.',
    },
    {
      id: 'auth-2',
      category: 'Authentication',
      title: 'Sign Out & Session Cleansing',
      steps: [
        '1. Inside dashboard, click the Sign Out icon in top right navigation.',
        '2. Confirm session transition.',
      ],
      expected: 'Firebase token cleared; client reverts to landing page; cached journal state wiped from active memory.',
    },
    {
      id: 'auth-3',
      category: 'Authentication',
      title: 'Unauthorized Access & Path Isolation',
      steps: [
        '1. Inspect Firestore request paths via DevTools.',
        '2. Attempt reading /users/different-uid/entries from authenticated context.',
      ],
      expected: 'Firestore security rules reject request with permission-denied (request.auth.uid == userId rule enforced).',
    },

    // Journal & Persistence
    {
      id: 'journal-1',
      category: 'Journal & Persistence',
      title: 'Guaranteed Persistence (Input-to-Save Completeness)',
      steps: [
        '1. Click "Capture Memory" button.',
        '2. Enter: "Finally had dinner at Indiranagar after work. The conversation was exactly what I needed."',
        '3. Click "Save Memory".',
      ],
      expected: 'Raw text is saved to Firestore FIRST before AI analysis. Input buffer in localStorage cleared only after confirmed database commit.',
    },
    {
      id: 'journal-2',
      category: 'Journal & Persistence',
      title: 'AI Decoupled Analysis & Failure Resilience',
      steps: [
        '1. Disconnect network immediately after saving entry or simulate Gemini unavailable.',
        '2. Inspect entry in Memories timeline.',
      ],
      expected: 'User original text is completely safe and preserved; AI metadata shows "Not yet analyzed"; "Re-extract with Gemini" button available for independent retry.',
    },
    {
      id: 'journal-3',
      category: 'Journal & Persistence',
      title: 'Edit & Reject AI Metadata',
      steps: [
        '1. Open entry detail modal.',
        '2. Review AI-derived metadata pills (emotions, places, topics).',
        '3. Click "Clear tags" to dismiss AI interpretation.',
      ],
      expected: 'AI tags are dismissed; raw authored user text remains 100% untouched and intact.',
    },

    // Multi-Mode Reflection
    {
      id: 'reflection-1',
      category: 'Gemini Reflection Engine',
      title: 'Intentional Reflection Modes (7 Modes)',
      steps: [
        '1. Open any saved memory.',
        '2. Toggle between modes: Reflect, Think, Brainstorm, Rewrite, Find Patterns, Plan, Talk.',
        '3. Type custom prompt or click "Reflect".',
      ],
      expected: 'Gemini produces structured responses matching selected mode; conversation is preserved without altering canonical journal document.',
    },
    {
      id: 'reflection-2',
      category: 'Gemini Reflection Engine',
      title: 'Model Fallback Ladder Execution',
      steps: [
        '1. Server invokes generateContentWithFallback.',
        '2. If primary model returns 503 or 429, helper catches error and attempts fallback ladder sequentially.',
      ],
      expected: 'Transparent recovery through gemini-3.8-flash -> 3.6-flash -> 3.1-flash-lite -> dynamic alias -> 3.7-flash.',
    },

    // Memory Retrieval & Citations
    {
      id: 'ask-1',
      category: 'Ask My Journal',
      title: 'Grounded Memory Retrieval with Citations',
      steps: [
        '1. Navigate to "Ask My Journal" tab.',
        '2. Submit query: "What was I worried about recently?"',
      ],
      expected: 'Synthesized answer includes clickable citations with date and entry title linking to exact source entries. Inferences labeled with "Contains AI Inferences" pill.',
    },
    {
      id: 'ask-2',
      category: 'Ask My Journal',
      title: 'Insufficient Evidence Handling (Zero Hallucination)',
      steps: [
        '1. Ask an unrecorded question: "What did I do in Antarctica in 1999?"',
      ],
      expected: 'Gemini returns explicit "Insufficient evidence in your journal entries" notice. No memories or events fabricated.',
    },

    // Rich Capture (Media, Voice, Location)
    {
      id: 'capture-1',
      category: 'Rich Capture',
      title: 'Voice-to-Text Journaling',
      steps: [
        '1. In Capture modal, click "Voice to Text" tab.',
        '2. Click microphone button and speak.',
      ],
      expected: 'Speech is transcribed into text field in real-time; user reviews and edits before saving.',
    },
    {
      id: 'capture-2',
      category: 'Rich Capture',
      title: 'Geographic Memory Anchoring & Life Map',
      steps: [
        '1. Add location (e.g. "Goa Beach" or GPS coordinates) during memory capture.',
        '2. Save entry and navigate to "Life Map" tab.',
      ],
      expected: 'Location appears in Life Map directory; selecting place reveals clustered memories, dates, and coordinates.',
    },

    // Bookmarks & SSRF Security
    {
      id: 'bookmarks-1',
      category: 'Bookmarks & Security',
      title: 'SSRF-Protected URL Ingestion',
      steps: [
        '1. Navigate to "Remember This" tab.',
        '2. Attempt saving an internal IP URL: "http://127.0.0.1:8080/secret".',
      ],
      expected: 'Backend rejects private/internal IP with 403 Forbidden; prevents SSRF vulnerability.',
    },
    {
      id: 'bookmarks-2',
      category: 'Bookmarks & Security',
      title: 'Bookmark Reactions & Reflections',
      steps: [
        '1. Save external resource "https://example.com" with reaction "Loved it" and reason for saving.',
      ],
      expected: 'Stored with content type, emotional reaction pills, and user personal reflection.',
    },
  ];

  const categories = Array.from(new Set(testCases.map((tc) => tc.category)));

  const toggleCase = (id: string) => {
    setCompletedCases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completedCases).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div 
        id="walkthrough-modal"
        className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] w-full max-w-4xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Functional Verification & Test Walkthroughs</h2>
              <p className="text-xs text-slate-500">
                Specification-compliant test cases covering authentication, persistence, AI resilience, and security boundaries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-white/40 border-b border-slate-200/60 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">
            Completed: <strong className="text-indigo-600">{completedCount}</strong> of {testCases.length} verified
          </span>
          <div className="w-48 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(completedCount / testCases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Body Categories */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat;
            const casesInCat = testCases.filter((tc) => tc.category === cat);
            const doneInCat = casesInCat.filter((tc) => completedCases[tc.id]).length;

            return (
              <div key={cat} className="rounded-2xl border border-white/50 bg-white/60 overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? '' : cat)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span className="text-xs font-bold text-slate-800">{cat}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {doneInCat}/{casesInCat.length} verified
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-5 space-y-3 border-t border-slate-200/60 bg-white/40">
                    {casesInCat.map((tc) => {
                      const isDone = !!completedCases[tc.id];
                      return (
                        <div
                          key={tc.id}
                          onClick={() => toggleCase(tc.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            isDone
                              ? 'bg-emerald-50/80 border-emerald-200 text-slate-800'
                              : 'bg-white/70 border-white/60 text-slate-800 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <h4 className="text-xs font-semibold text-slate-800">{tc.title}</h4>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{tc.id}</span>
                          </div>

                          <div className="space-y-2 pl-6 text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-800 font-bold">Steps:</span>
                              <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-slate-600">
                                {tc.steps.map((st, i) => (
                                  <li key={i}>{st}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="pt-1">
                              <span className="text-indigo-700 font-bold">Expected Result: </span>
                              <span className="text-slate-700">{tc.expected}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-white/40 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Security & Reliability Standards Verified</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 text-slate-700 font-semibold shadow-xs transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
