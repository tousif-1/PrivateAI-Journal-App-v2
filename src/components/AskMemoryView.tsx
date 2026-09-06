import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  AlertCircle, 
  Quote,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import type { JournalEntry, AskMemoryResponse, MemoryCitation } from '../types';

interface AskMemoryViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const AskMemoryView: React.FC<AskMemoryViewProps> = ({
  entries,
  onSelectEntry,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskMemoryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleQuestions = [
    'What was I worried about recently?',
    'What were my happiest moments from my trips or coffee meetings?',
    'What ideas or projects have I mentioned multiple times?',
    'What things did I say I wanted to do but have not finished yet?',
    'What recurring emotional patterns appear in my reflections?',
  ];

  const handleAsk = async (qToAsk?: string) => {
    const activeQuestion = (qToAsk || question).trim();
    if (!activeQuestion) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/ask-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuestion,
          memories: entries,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setResponse({
          answer: data.answer,
          citations: data.citations || [],
          insufficientEvidence: data.insufficientEvidence || false,
          hasInferences: data.hasInferences || false,
          isExclusivelyExplicit: !data.hasInferences && !data.insufficientEvidence,
        });
      } else {
        throw new Error(data.error || 'Failed to search memories.');
      }
    } catch (err: any) {
      console.error('Ask My Journal error:', err);
      setErrorMessage(err.message || 'Could not query memory store.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: MemoryCitation) => {
    const match = entries.find((e) => e.id === citation.entryId);
    if (match) {
      onSelectEntry(match);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable Memory Retrieval</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Ask My Journal
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Query across your private memories. Gemini synthesizes an answer grounded exclusively in your own recorded entries, citing source dates and excerpts.
        </p>
      </div>

      {/* Query Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            id="input-ask-memory"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleAsk();
              }
            }}
            placeholder="e.g. What did I say I wanted to visit again? Or what worried me last month?"
            className="w-full bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-5 pr-28 py-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
          />
          <button
            id="btn-submit-ask"
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim()}
            className="absolute right-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Ask</span>
          </button>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">Inspirations:</span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white/90 border border-white/50 text-slate-600 hover:text-indigo-600 transition-all text-left shadow-xs"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-100/80 backdrop-blur-md border border-red-300 text-red-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Answer Container */}
      {response && (
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-sm space-y-5 animate-in fade-in duration-300">
          
          {/* Metadata badges for explainability */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                <Quote className="w-3.5 h-3.5" /> Memory Synthesis
              </span>

              {response.insufficientEvidence && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Insufficient evidence in journal
                </span>
              )}

              {response.hasInferences && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Contains AI Inferences
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Scanned across {entries.length} private {entries.length === 1 ? 'memory' : 'memories'}
            </div>
          </div>

          {/* Core Grounded Answer */}
          <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
            {response.answer}
          </div>

          {/* Clickable Source Citations */}
          {response.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Referenced Journal Entries ({response.citations.length})</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                {response.citations.map((cit, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCitationClick(cit)}
                    className="p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-white/60 hover:border-indigo-200 cursor-pointer transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1 text-indigo-600 font-mono font-bold text-[10px]">
                          <Calendar className="w-3 h-3" /> {cit.date}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {cit.title || 'Untitled Memory'}
                      </h4>
                    </div>
                    {cit.quoteSnippet && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 italic font-sans">
                        "{cit.quoteSnippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retrieved strictly from your personal namespace. No data shared with other users.</span>
          </div>

        </div>
      )}

      {/* Empty State */}
      {!response && entries.length === 0 && (
        <div className="p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 text-center space-y-2 shadow-sm">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No memories recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you start capturing memories in the journal, you will be able to search and reflect across your life history here.
          </p>
        </div>
      )}

    </div>
  );
};
