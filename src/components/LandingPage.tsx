import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  BrainCircuit, 
  Compass, 
  EyeOff,
  Layers
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
  onOpenPresentation?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  error,
  onOpenPresentation,
}) => {
  const stages = [
    { name: 'Capture', desc: 'Free-form thoughts via text, speech, photos, or location' },
    { name: 'Understand', desc: 'Gemini derives structured emotions, people, places, & open loops' },
    { name: 'Remember', desc: 'Longitudinal personal memory storage scoped strictly to your account' },
    { name: 'Connect', desc: 'Link places, events, recurring themes, and external bookmarks' },
    { name: 'Reflect', desc: 'Intentional modes: Think, Brainstorm, Rewrite, Plan, and Find Patterns' },
    { name: 'Act', desc: 'Resolve open loops, revisit inspirations, and honor past intentions' },
  ];

  return (
    <div className="min-h-screen text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-white/40 bg-white/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-slate-800">
                Private Memories
              </span>
              <span className="block text-xs text-slate-500 font-medium">
                Private AI Reflection System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenPresentation && (
              <button
                id="btn-presentation-top"
                onClick={onOpenPresentation}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Project Deck</span>
              </button>
            )}

            <button
              id="btn-login-top"
              onClick={onSignIn}
              disabled={isLoading}
              className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center">
        
        {/* Trust & Architecture Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/60 text-xs text-slate-700 font-medium mb-8 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-Knowledge Architecture &bull; User-Isolated Firestore &bull; Raw Notes Unaltered</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 max-w-3xl leading-[1.15]">
          A private AI memory of your life, not a chatbot.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          Capture experiences, places, photos, voice notes, and thoughts. 
          Gemini helps organize and understand your memories, surfaces forgotten patterns, 
          and retrieves life answers with verifiable source citations.
        </p>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-100/80 backdrop-blur-md border border-red-300 text-red-800 text-sm max-w-md text-left shadow-xs">
            <p className="font-semibold">Authentication Notice</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="btn-login-hero"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-xl shadow-indigo-200/80 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
            )}
            <span>Begin with Google Sign-In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Life Memory Cycle Flow */}
        <div className="mt-20 w-full">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            The Personal Memory Cycle
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((stage, idx) => (
              <div
                key={stage.name}
                className="p-4 rounded-2xl bg-white/50 backdrop-blur-lg border border-white/60 text-left flex flex-col justify-between shadow-xs hover:shadow-md hover:bg-white/70 transition-all"
              >
                <div>
                  <div className="text-xs text-indigo-600 font-bold mb-1">0{idx + 1}</div>
                  <div className="text-sm font-semibold text-slate-800">{stage.name}</div>
                </div>
                <div className="text-xs text-slate-500 mt-2 leading-relaxed">{stage.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Architectural Principles */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          
          <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4 shadow-xs">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Raw Words Inviolable</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your raw journal entries are never silently modified or altered by AI. 
              AI metadata (emotions, places, topics) exists alongside your original text, 
              clearly labeled and independently editable.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Strict Data Isolation</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Every document is scoped strictly under your authenticated Firebase UID. 
              Cloud Firestore security rules strictly forbid any cross-user reading or writing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Explainable Retrieval</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              When querying your journal, answers cite exact entry dates and excerpts. 
              If historical evidence is lacking, Gemini explicitly tells you rather than inventing memories.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 py-8 text-center text-xs text-slate-500 bg-white/20 backdrop-blur-md">
        <p>Built with Google Cloud Run &bull; Firebase Authentication &bull; Cloud Firestore &bull; Gemini AI Models</p>
      </footer>

    </div>
  );
};
