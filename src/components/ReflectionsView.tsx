import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  HelpCircle, 
  MapPin, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  Mail,
  Send,
  Check,
  ExternalLink,
  Eye,
  Copy
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface ReflectionsViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  userEmail?: string | null;
  onOpenEmailModal?: () => void;
}

export const ReflectionsView: React.FC<ReflectionsViewProps> = ({
  entries,
  onSelectEntry,
  userEmail,
  onOpenEmailModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'on_this_day' | 'weekly' | 'yearly' | 'email_recall'>('on_this_day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inspectDate, setInspectDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Email Recall state for testing & configuration
  const [recipientEmail, setRecipientEmail] = useState<string>(() => userEmail || 'tousifahamedan@gmail.com');
  const [emailDigestType, setEmailDigestType] = useState<'weekly' | 'yearly'>('weekly');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'plain'>('rendered');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Compute "On This Day" or inspected calendar day matches across past years or months
  const today = new Date();
  const targetDate = inspectDate ? new Date(inspectDate + 'T12:00:00Z') : today;
  const targetMonth = targetDate.getUTCMonth();
  const targetDay = targetDate.getUTCDate();
  const isTodayInspected = inspectDate === today.toISOString().slice(0, 10);

  const onThisDayMatches = entries.filter((e) => {
    const entryDate = new Date(e.createdAt);
    const sameDayAndMonth = entryDate.getMonth() === targetMonth && entryDate.getDate() === targetDay;
    if (isTodayInspected) {
      return sameDayAndMonth && entryDate.getFullYear() !== today.getFullYear();
    }
    return sameDayAndMonth;
  });

  const recentMemoriesForReview = entries.slice(0, 15);

  const handleGenerateReview = async (type: 'weekly' | 'monthly' | 'yearly') => {
    setIsGenerating(true);
    setErrorMessage(null);

    const periodLabel =
      type === 'weekly'
        ? 'Past 7 Days'
        : type === 'monthly'
        ? `${today.toLocaleString('en-US', { month: 'long' })} ${today.getFullYear()}`
        : `${today.getFullYear()} Life Review`;

    try {
      const res = await fetch('/api/gemini/periodic-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          periodLabel,
          memories: recentMemoriesForReview.map((m) => ({
            id: m.id,
            title: m.title,
            date: m.createdAt,
            rawContent: m.rawContent,
            emotions: m.aiInterpretation?.emotions,
            topics: m.aiInterpretation?.topics,
            places: m.aiInterpretation?.places,
            people: m.aiInterpretation?.people,
          })),
        }),
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();
      if (data.success && data.review) {
        setReviewResult(data.review);
      } else {
        throw new Error(data.error || 'Failed to synthesize review.');
      }
    } catch (err: any) {
      console.error('Review synthesis error:', err);
      setErrorMessage(err.message || 'Could not generate review at this time.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmailRecall = async (forcedType?: 'weekly' | 'yearly') => {
    const chosenType = forcedType || emailDigestType;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailError('Please provide a valid recipient email address.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailResult(null);

    const periodLabel = chosenType === 'yearly' 
      ? 'Memories of the Year (2026)' 
      : 'Weekly Memory Recall (Past 7 Days)';

    try {
      const response = await fetch('/api/email/send-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail.trim(),
          type: chosenType,
          periodLabel,
          memories: entries.slice(0, 25).map((e) => ({
            id: e.id,
            title: e.title,
            createdAt: e.createdAt,
            rawContent: e.rawContent,
            location: e.location,
            aiInterpretation: e.aiInterpretation,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setEmailResult(data);
      } else {
        throw new Error(data.error || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setEmailError(err.message || 'Failed to dispatch recall email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(`${label} copied!`);
    setTimeout(() => setCopyToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold mb-1 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Longitudinal Reflection &amp; Recalls</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Life Review &amp; Email Recalls
          </h2>
          <p className="text-xs text-slate-500">
            Revisit who you were, synthesize weekly &amp; yearly retrospectives, and dispatch them to your email.
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/70 text-xs shadow-2xs">
          <button
            onClick={() => setActiveSubTab('on_this_day')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeSubTab === 'on_this_day'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            On This Day
          </button>

          <button
            onClick={() => {
              setActiveSubTab('weekly');
              if (!reviewResult) handleGenerateReview('weekly');
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeSubTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Review
          </button>

          <button
            onClick={() => {
              setActiveSubTab('yearly');
              if (!reviewResult) handleGenerateReview('yearly');
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeSubTab === 'yearly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Memories of the Year
          </button>

          <button
            onClick={() => setActiveSubTab('email_recall')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
              activeSubTab === 'email_recall'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Digest</span>
          </button>
        </div>
      </div>

      {/* View 1: On This Day */}
      {activeSubTab === 'on_this_day' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-800 font-semibold">
                  {isTodayInspected
                    ? `Today: ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                    : `Viewing: ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                </span>
              </div>

              {/* Calendar jump picker */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium">Pick Date:</span>
                <input
                  type="date"
                  value={inspectDate}
                  onChange={(e) => {
                    if (e.target.value) setInspectDate(e.target.value);
                  }}
                  className="bg-transparent text-xs text-slate-700 font-sans focus:outline-none cursor-pointer"
                />
              </div>

              {!isTodayInspected && (
                <button
                  type="button"
                  onClick={() => setInspectDate(today.toISOString().slice(0, 10))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                >
                  Back to Today
                </button>
              )}
            </div>

            <span className="text-slate-500 font-medium">
              {onThisDayMatches.length} matching {onThisDayMatches.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>

          {onThisDayMatches.length === 0 ? (
            <div className="p-12 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-slate-200/80 text-center text-xs text-slate-500 space-y-2 shadow-xs">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800">
                No memories found for this calendar day yet
              </h3>
              <p className="max-w-md mx-auto text-slate-400 leading-relaxed">
                As you capture moments across weeks and years, they will resurface here on the same day. Use the calendar picker above to travel back to any calendar date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {onThisDayMatches.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className="p-5 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {new Date(entry.createdAt).getFullYear()}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {entry.title || 'Untitled Memory'}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {entry.rawContent}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 2 & 3: Weekly & Yearly Synthesis */}
      {(activeSubTab === 'weekly' || activeSubTab === 'yearly') && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <span className="text-slate-700 font-medium">
              Synthesizing {entries.length} memories for {activeSubTab === 'weekly' ? 'Weekly Reflection' : 'Life Review'}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('email_recall');
                  setEmailDigestType(activeSubTab === 'weekly' ? 'weekly' : 'yearly');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email this Recall</span>
              </button>

              <button
                onClick={() => handleGenerateReview(activeSubTab === 'weekly' ? 'weekly' : 'yearly')}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing...' : 'Regenerate'}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-100/80 border border-red-300 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isGenerating && (
            <div className="p-12 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-slate-200/80 text-center space-y-3 shadow-xs">
              <div className="w-8 h-8 border-2 border-indigo-600/40 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Reflecting across your memories, identifying recurring patterns, and composing thoughtful inquiries...
              </p>
            </div>
          )}

          {!isGenerating && reviewResult && (
            <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-slate-200/80 shadow-xs space-y-6">
              
              {/* Title & Summary */}
              <div className="border-b border-slate-200/60 pb-4 space-y-2">
                <span className="text-xs uppercase tracking-wider text-indigo-600 font-bold">
                  Personal AI Life Review &bull; Inferences clearly marked
                </span>
                <h3 className="text-xl font-bold text-slate-800">
                  {reviewResult.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {reviewResult.summary}
                </p>
              </div>

              {/* Highlights & Milestones */}
              {reviewResult.highlights && reviewResult.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Memorable Highlights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {reviewResult.highlights.map((h: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/70 text-xs text-slate-700 shadow-2xs">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* People & Places */}
              {reviewResult.peopleAndPlaces && reviewResult.peopleAndPlaces.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" /> People &amp; Places Recurring
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewResult.peopleAndPlaces.map((item: string, idx: number) => (
                      <span key={idx} className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-700 shadow-2xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Thoughtful Reflection Prompts */}
              {reviewResult.reflectionPrompts && reviewResult.reflectionPrompts.length > 0 && (
                <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Questions to Ponder Next
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-800 list-disc list-inside font-medium">
                    {reviewResult.reflectionPrompts.map((q: string, idx: number) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Action to Dispatch Over Email */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">Want this delivered to your inbox?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('email_recall');
                    setEmailDigestType(activeSubTab === 'weekly' ? 'weekly' : 'yearly');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send as Email Digest</span>
                </button>
              </div>

            </div>
          )}

          {!isGenerating && !reviewResult && entries.length === 0 && (
            <div className="p-12 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-slate-200/80 text-center text-xs text-slate-400 shadow-xs">
              Capture your first memories to unlock AI Life Reviews.
            </div>
          )}

        </div>
      )}

      {/* View 4: Email Digest Subtab */}
      {activeSubTab === 'email_recall' && (
        <div className="space-y-6">
          
          {/* Main Dispatch Card */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Weekly Recall &amp; Memories of the Year Email Dispatch
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Curate your personal memories with AI and send a beautifully styled digest directly to your inbox.
                  </p>
                </div>
              </div>
            </div>

            {/* Digest Format Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setEmailDigestType('weekly')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  emailDigestType === 'weekly'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${emailDigestType === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Weekly Recall</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Reviews your past 7 days: milestones, highlights, open loops, and questions for the week ahead.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEmailDigestType('yearly')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  emailDigestType === 'yearly'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${emailDigestType === 'yearly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Memories of the Year</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Year-in-review 2026 retrospective: life chapters, journey map, places visited, and enduring reflections.
                  </p>
                </div>
              </button>
            </div>

            {/* Email Input & Send Action */}
            <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Recipient Email Address
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-recall-subtab-email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter recipient email"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  id="btn-trigger-test-email"
                  disabled={isSendingEmail}
                  onClick={() => handleSendEmailRecall()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing &amp; Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send 1 Test Recall Email</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Grounded in your {entries.length} saved memories. A test HTML email will be generated with custom highlights, places, and prompts.
              </p>
            </div>

            {emailError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{emailError}</span>
              </div>
            )}

            {copyToast && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{copyToast}</span>
              </div>
            )}

            {/* Test Email Result & In-App Preview */}
            {emailResult && (
              <div className="space-y-4 border border-emerald-200/80 bg-emerald-50/40 p-5 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Test Recall Email Successfully Dispatched!
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Delivered to <strong>{emailResult.recipient}</strong> &bull; {emailResult.periodLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {emailResult.previewUrl && (
                      <a
                        href={emailResult.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View in Test Mailbox ↗</span>
                      </a>
                    )}

                    <a
                      href={`mailto:${encodeURIComponent(emailResult.recipient)}?subject=${encodeURIComponent(emailResult.subject)}&body=${encodeURIComponent(emailResult.textContent)}`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Open in Email App</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyText(emailResult.textContent, 'Plain text')}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 shadow-2xs"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Generated Subject</span>
                  <span className="text-slate-800 font-bold text-sm">{emailResult.subject}</span>
                </div>

                {/* Email Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Interactive Email Preview</span>
                    </span>

                    <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('rendered')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          previewMode === 'rendered' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Rendered HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('plain')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          previewMode === 'plain' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Plain Text
                      </button>
                    </div>
                  </div>

                  {previewMode === 'rendered' ? (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-2 sm:p-4 max-h-[420px] overflow-y-auto">
                      <div 
                        className="bg-white rounded-xl shadow-xs overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: emailResult.htmlContent }}
                      />
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-100 p-4 text-xs font-mono whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                      {emailResult.textContent}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
