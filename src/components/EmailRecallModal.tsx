import React, { useState } from 'react';
import { 
  Mail, 
  Sparkles, 
  Send, 
  Check, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Clock, 
  X, 
  Eye, 
  AlertCircle,
  FileText,
  Settings2,
  Compass
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface EmailRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userEmail?: string | null;
}

export const EmailRecallModal: React.FC<EmailRecallModalProps> = ({
  isOpen,
  onClose,
  entries,
  userEmail,
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    return userEmail || 'tousifahamedan@gmail.com';
  });
  const [digestType, setDigestType] = useState<'weekly' | 'yearly'>('weekly');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'rendered' | 'plain'>('rendered');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Scheduled preferences saved locally
  const [autoWeekly, setAutoWeekly] = useState<boolean>(() => {
    return localStorage.getItem('recall_auto_weekly') === 'true';
  });
  const [autoYearly, setAutoYearly] = useState<boolean>(() => {
    return localStorage.getItem('recall_auto_yearly') === 'true';
  });

  if (!isOpen) return null;

  const handleSendTestEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setResult(null);

    const periodLabel = digestType === 'yearly' 
      ? 'Memories of the Year (2026)' 
      : 'Weekly Memory Recall (Past 7 Days)';

    try {
      const response = await fetch('/api/email/send-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail.trim(),
          type: digestType,
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
        setResult(data);
      } else {
        throw new Error(data.error || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setErrorMessage(err.message || 'An error occurred while generating or dispatching the email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handleToggleAutoWeekly = (checked: boolean) => {
    setAutoWeekly(checked);
    localStorage.setItem('recall_auto_weekly', String(checked));
  };

  const handleToggleAutoYearly = (checked: boolean) => {
    setAutoYearly(checked);
    localStorage.setItem('recall_auto_yearly', String(checked));
  };

  // Build mailto URL for direct opening
  const buildMailtoUrl = () => {
    if (!result) return '#';
    const sub = encodeURIComponent(result.subject || 'Weekly Memory Recall');
    const bod = encodeURIComponent(result.textContent || '');
    return `mailto:${encodeURIComponent(recipientEmail)}?subject=${sub}&body=${bod}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Email Recall &amp; Memories Digest
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  Email Dispatch
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Receive weekly retrospectives and memories of the year directly in your inbox.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">

          {/* Configuration Form */}
          <div className="space-y-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
            
            {/* Digest Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Digest Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDigestType('weekly')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    digestType === 'weekly'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${digestType === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Weekly Memory Recall</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Past 7 days review: feelings, notable highlights, open loops, and 2 reflection questions.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDigestType('yearly')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    digestType === 'yearly'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${digestType === 'yearly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Memories of the Year</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Year-in-review 2026 retrospective: life chapters, places visited, growth themes, and reflections.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                2. Recipient Email Address
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-recall-email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                  />
                </div>

                <button
                  type="button"
                  id="btn-send-test-email"
                  disabled={isSending}
                  onClick={handleSendTestEmail}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
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
              <p className="text-[11px] text-slate-500 mt-1">
                Synthesizes memories from your private vault ({entries.length} memories available) using Gemini and dispatches an HTML email.
              </p>
            </div>

            {/* Automatic Recurring Schedule */}
            <div className="pt-2 border-t border-slate-200/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Automated Email Schedules</span>
              </label>
              <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoWeekly}
                    onChange={(e) => handleToggleAutoWeekly(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Send Weekly Recall automatically every Sunday</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoYearly}
                    onChange={(e) => handleToggleAutoYearly(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Send Memories of the Year digest every December 31st</span>
                </label>
              </div>
            </div>

          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Copy Toast */}
          {copiedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{copiedNotice}</span>
            </div>
          )}

          {/* Successful Dispatch Results */}
          {result && (
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
                      Delivered to <strong>{result.recipient}</strong> &bull; {result.periodLabel}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {result.previewUrl && (
                    <a
                      href={result.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      id="btn-open-ethereal-preview"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Test Webmail Inbox ↗</span>
                    </a>
                  )}

                  <a
                    href={buildMailtoUrl()}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Open in My Email App</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(result.textContent, 'Plain text body')}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy Text</span>
                  </button>
                </div>
              </div>

              {/* Subject Line Display */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Generated Subject Line</span>
                <span className="text-slate-800 font-bold text-sm">{result.subject}</span>
              </div>

              {/* Interactive In-App Email Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Interactive Email Preview</span>
                  </span>

                  <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('rendered')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        activePreviewTab === 'rendered' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
                      }`}
                    >
                      Rendered HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('plain')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        activePreviewTab === 'plain' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>

                {activePreviewTab === 'rendered' ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-2 sm:p-4 max-h-[420px] overflow-y-auto">
                    <div 
                      className="bg-white rounded-xl shadow-xs overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: result.htmlContent }}
                    />
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-100 p-4 text-xs font-mono whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                    {result.textContent}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI powered synthesis grounded solely in your personal memories</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
