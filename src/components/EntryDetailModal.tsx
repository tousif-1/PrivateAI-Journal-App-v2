import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Tag, 
  Heart, 
  Users, 
  Trash2, 
  RefreshCw, 
  Send, 
  BrainCircuit, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import type { JournalEntry, ReflectionMode, MultiTurnMessage } from '../types';
import { 
  updateJournalAiMetadata, 
  deleteJournalEntry, 
  saveOpenLoop,
  deleteAttachedMedia,
  deleteJournalAiMetadata,
  saveJournalEntry
} from '../lib/firestoreService';

interface EntryDetailModalProps {
  userId: string;
  entry: JournalEntry;
  allEntries: JournalEntry[];
  isOpen: boolean;
  onClose: () => void;
  onEntryUpdated: (updated: JournalEntry) => void;
  onEntryDeleted: (deletedId: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  userId,
  entry,
  allEntries,
  isOpen,
  onClose,
  onEntryUpdated,
  onEntryDeleted,
}) => {
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflect');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [conversation, setConversation] = useState<MultiTurnMessage[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [customDate, setCustomDate] = useState(() => entry.createdAt.slice(0, 10));
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Sync customDate if entry changes
  useEffect(() => {
    setCustomDate(entry.createdAt.slice(0, 10));
  }, [entry.id, entry.createdAt]);

  if (!isOpen) return null;

  const modes: { id: ReflectionMode; label: string; desc: string }[] = [
    { id: 'reflect', label: 'Reflect', desc: 'Unpack emotions & deeper personal meaning' },
    { id: 'think', label: 'Think', desc: 'Explore assumptions, tradeoffs, and reasoning' },
    { id: 'brainstorm', label: 'Brainstorm', desc: 'Creative ideas inspired by this memory' },
    { id: 'rewrite', label: 'Rewrite', desc: 'Polished prose preserving your authentic voice' },
    { id: 'patterns', label: 'Find Patterns', desc: 'Connect to recurring themes across past entries' },
    { id: 'plan', label: 'Plan', desc: 'Concrete gentle next steps and intentions' },
    { id: 'talk', label: 'Talk', desc: 'Conversational companion discussion' },
  ];

  const handleExecuteReflection = async () => {
    setIsReflecting(true);
    setErrorNotice(null);

    const userMessage: MultiTurnMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: customPrompt.trim() || `Reflect on this memory using "${selectedMode.toUpperCase()}" mode.`,
      mode: selectedMode,
      createdAt: new Date().toISOString(),
    };

    setConversation((prev) => [...prev, userMessage]);
    const promptToSend = customPrompt;
    setCustomPrompt('');

    try {
      // Provide historical context from other memories for pattern discovery
      const historicalContext = allEntries
        .filter((e) => e.id !== entry.id)
        .slice(0, 5)
        .map((e) => ({
          date: new Date(e.createdAt).toLocaleDateString(),
          title: e.title || 'Past memory',
          snippet: e.rawContent.slice(0, 200),
        }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: entry.rawContent,
          mode: selectedMode,
          userPrompt: promptToSend,
          historicalContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        const assistantMessage: MultiTurnMessage = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: data.response,
          mode: selectedMode,
          createdAt: new Date().toISOString(),
        };
        setConversation((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to complete reflection.');
      }
    } catch (err: any) {
      console.error('Reflection error:', err);
      setErrorNotice(`Reflection failed: ${err.message || 'Service unavailable'}. Please retry.`);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleReanalyzeMetadata = async () => {
    setIsReanalyzing(true);
    setErrorNotice(null);
    try {
      const response = await fetch('/api/gemini/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: entry.rawContent,
          location: entry.location,
          media: entry.media,
        }),
      });

      if (!response.ok) throw new Error('AI analysis service error');
      const data = await response.json();

      if (data.success && data.metadata) {
        await updateJournalAiMetadata(userId, entry.id, data.metadata);
        onEntryUpdated({
          ...entry,
          aiInterpretation: data.metadata,
        });
      }
    } catch (err: any) {
      console.error('Reanalyze error:', err);
      setErrorNotice('Metadata extraction failed. Raw memory is safe.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDismissAiMetadata = async () => {
    try {
      await deleteJournalAiMetadata(userId, entry.id);
      onEntryUpdated({
        ...entry,
        aiInterpretation: undefined,
      });
    } catch (err) {
      console.error('Dismiss error', err);
      setErrorNotice('Failed to remove AI metadata.');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.confirm('Delete this media attachment from this memory?')) return;
    try {
      await deleteAttachedMedia(userId, entry.id, mediaId, entry.media || []);
      const updatedMedia = (entry.media || []).filter(m => m.id !== mediaId);
      onEntryUpdated({
        ...entry,
        media: updatedMedia,
      });
    } catch (err: any) {
      console.error('Failed to delete media', err);
      setErrorNotice('Failed to delete media attachment.');
    }
  };

  const handlePromoteLoop = async (title: string) => {
    try {
      await saveOpenLoop(userId, {
        title,
        status: 'saved',
        sourceEntryId: entry.id,
      });
      setErrorNotice(null);
    } catch (e: any) {
      console.error('Error promoting open loop:', e);
    }
  };

  const handleDeleteEntry = async () => {
    if (window.confirm('Are you sure you want to permanently delete this memory? This cannot be undone.')) {
      try {
        await deleteJournalEntry(userId, entry.id);
        onEntryDeleted(entry.id);
        onClose();
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div 
        id="entry-detail-modal"
        className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] w-full max-w-4xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {!isEditingDate ? (
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                title="Click to edit or backdate this memory's date"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 bg-white/70 hover:bg-white border border-slate-200/60 px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">Edit</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <input
                  type="date"
                  value={customDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-white border border-indigo-300 rounded-xl px-2 py-0.5 text-xs text-slate-800 font-sans shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={isUpdatingDate}
                  onClick={async () => {
                    if (!customDate) return;
                    setIsUpdatingDate(true);
                    try {
                      const now = new Date();
                      const [yr, mo, dy] = customDate.split('-').map(Number);
                      const original = new Date(entry.createdAt);
                      const newDateTime = new Date(
                        yr, 
                        mo - 1, 
                        dy, 
                        original.getHours() || now.getHours(), 
                        original.getMinutes() || now.getMinutes(), 
                        original.getSeconds() || now.getSeconds()
                      ).toISOString();

                      const updatedEntry: JournalEntry = {
                        ...entry,
                        createdAt: newDateTime,
                        updatedAt: new Date().toISOString(),
                      };

                      await saveJournalEntry(userId, updatedEntry);
                      onEntryUpdated(updatedEntry);
                      setIsEditingDate(false);
                    } catch (err) {
                      console.error('Failed to update date', err);
                    } finally {
                      setIsUpdatingDate(false);
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  {isUpdatingDate ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomDate(entry.createdAt.slice(0, 10));
                    setIsEditingDate(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                >
                  Cancel
                </button>
              </div>
            )}

            {entry.location && (
              <span className="flex items-center gap-1 text-slate-600 text-xs font-semibold bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-xs">
                <MapPin className="w-3 h-3 text-teal-600" />
                {entry.location.placeName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteEntry}
              title="Delete this memory"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-white/60 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Raw Authored Memory (Unaltered, Pure User Content) */}
          <div className="bg-white/60 border border-white/50 rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Raw Authored Memory (Unaltered)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {entry.rawContent.length} characters
              </span>
            </div>

            {entry.title && (
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                {entry.title}
              </h2>
            )}

            <p className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
              {entry.rawContent}
            </p>

            {/* Media Gallery */}
            {entry.media && entry.media.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {entry.media.map((item) => (
                  <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-white/60 bg-slate-100 aspect-video shadow-xs">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} controls className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item.id)}
                      title="Delete this media attachment"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: AI-Derived Structured Metadata (Explicitly separated) */}
          <div className="bg-white/60 border border-white/50 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  AI-Derived Memory Metadata
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                  Separated from raw notes
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-reanalyze-meta"
                  onClick={handleReanalyzeMetadata}
                  disabled={isReanalyzing}
                  title="Re-run Gemini metadata extraction"
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  <span>{isReanalyzing ? 'Analyzing...' : 'Re-extract'}</span>
                </button>
                {entry.aiInterpretation && (
                  <button
                    onClick={handleDismissAiMetadata}
                    title="Remove AI metadata tags"
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Clear tags
                  </button>
                )}
              </div>
            </div>

            {entry.aiInterpretation ? (
              <div className="space-y-3 pt-1 text-xs">
                
                {/* Summary */}
                {entry.aiInterpretation.summary && (
                  <div className="p-3.5 rounded-2xl bg-white/80 border border-white/60 text-slate-700 italic shadow-xs font-sans">
                    "{entry.aiInterpretation.summary}"
                  </div>
                )}

                {/* Metadata Pills */}
                <div className="flex flex-wrap gap-2">
                  {entry.aiInterpretation.emotions.map((e, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>{e}</span>
                    </span>
                  ))}

                  {entry.aiInterpretation.people.map((p, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs">
                      <Users className="w-3 h-3 text-indigo-600" />
                      <span>{p}</span>
                    </span>
                  ))}

                  {entry.aiInterpretation.places.map((place, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold shadow-xs">
                      <MapPin className="w-3 h-3 text-teal-600" />
                      <span>{place}</span>
                    </span>
                  ))}

                  {entry.aiInterpretation.topics.map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>

                {/* Open Loops detected */}
                {entry.aiInterpretation.openLoops && entry.aiInterpretation.openLoops.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Detected Intentions / Open Loops:</span>
                    <div className="mt-1.5 space-y-1.5">
                      {entry.aiInterpretation.openLoops.map((loop) => (
                        <div key={loop.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-white/60 shadow-xs">
                          <span className="text-slate-800 text-xs font-medium">{loop.title}</span>
                          <button
                            onClick={() => handlePromoteLoop(loop.title)}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs transition-colors"
                          >
                            Track Loop
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/60 text-center text-xs text-slate-500">
                <p>No AI metadata derived yet.</p>
                <button
                  onClick={handleReanalyzeMetadata}
                  disabled={isReanalyzing}
                  className="mt-2 text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Analyze with Gemini
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Intentional Multi-Turn Reflection */}
          <div className="bg-white/60 border border-white/50 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">
                  Reflect on this Memory with Gemini
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Choose an intentional reflection mode
              </span>
            </div>

            {/* Reflection Modes Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  title={m.desc}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-center ${
                    selectedMode === m.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white/70 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/90 shadow-xs'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Current Mode: <strong className="text-slate-700 capitalize font-bold">{selectedMode}</strong> — {modes.find(m => m.id === selectedMode)?.desc}
            </p>

            {/* Conversation Messages Thread */}
            {conversation.length > 0 && (
              <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white ml-8 shadow-indigo-100'
                        : 'bg-white/80 border border-white/60 text-slate-800 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                      <span className="font-bold uppercase tracking-wider">
                        {msg.role === 'user' ? 'You' : `Gemini (${msg.mode?.toUpperCase()})`}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Error banner */}
            {errorNotice && (
              <div className="p-3.5 rounded-2xl bg-red-100/80 border border-red-300 text-red-800 text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Custom Prompt Input & Send */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                id="input-reflection-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isReflecting) {
                    handleExecuteReflection();
                  }
                }}
                placeholder={`Ask a question or explore this memory in "${selectedMode}" mode...`}
                className="flex-1 bg-white/70 border border-white/50 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
              />
              <button
                id="btn-trigger-reflection"
                onClick={handleExecuteReflection}
                disabled={isReflecting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {isReflecting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isReflecting ? 'Thinking...' : 'Reflect'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-white/40 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Memories are private and encrypted to your account</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 text-slate-700 font-semibold shadow-xs transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
