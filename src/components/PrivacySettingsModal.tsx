import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Trash2, 
  FileText, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from 'lucide-react';
import type { UserProfile, JournalEntry } from '../types';
import { exportAllUserData, deleteAllUserData } from '../lib/firestoreService';

interface PrivacySettingsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onAccountPurged: () => void;
  onSeedSampleData?: () => Promise<void>;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  entries,
  onAccountPurged,
  onSeedSampleData,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [confirmPurgeText, setConfirmPurgeText] = useState('');
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSeedingData, setIsSeedingData] = useState(false);

  if (!isOpen) return null;

  // Export as structured JSON backup
  const handleExportJson = async () => {
    setIsExporting(true);
    setStatusMessage('Preparing complete data archive...');
    try {
      const data = await exportAllUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_memories_vault_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('JSON export completed successfully.');
    } catch (err: any) {
      console.error('Export failed', err);
      setStatusMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as human-readable Markdown journal
  const handleExportMarkdown = () => {
    try {
      let md = `# Personal Memories Journal Archive\n`;
      md += `*Exported on ${new Date().toLocaleString()} for ${user.displayName || user.email || 'User'}*\n\n`;
      md += `Total Memories: ${entries.length}\n\n---\n\n`;

      entries.forEach((entry) => {
        md += `## ${entry.title || 'Untitled Memory'}\n`;
        md += `**Date:** ${new Date(entry.createdAt).toLocaleString()}\n`;
        if (entry.location) {
          md += `**Location:** ${entry.location.placeName} (${entry.location.lat}, ${entry.location.lng})\n`;
        }
        md += `\n### Raw Journal Content\n${entry.rawContent}\n\n`;

        if (entry.aiInterpretation) {
          md += `### AI Interpretation (Derived)\n`;
          if (entry.aiInterpretation.summary) {
            md += `> ${entry.aiInterpretation.summary}\n\n`;
          }
          if (entry.aiInterpretation.emotions?.length) {
            md += `*Emotions:* ${entry.aiInterpretation.emotions.join(', ')}\n`;
          }
          if (entry.aiInterpretation.topics?.length) {
            md += `*Topics:* ${entry.aiInterpretation.topics.join(', ')}\n`;
          }
          if (entry.aiInterpretation.openLoops?.length) {
            md += `*Open Loops:* ${entry.aiInterpretation.openLoops.map(l => l.title).join('; ')}\n`;
          }
        }
        md += `\n---\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_journal_memories_${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('Markdown export downloaded.');
    } catch (err) {
      console.error('Markdown export failed', err);
      setStatusMessage('Failed to create Markdown file.');
    }
  };

  // Delete all personal data ("Right to be Forgotten")
  const handlePurgeAllData = async () => {
    if (confirmPurgeText.trim().toLowerCase() !== 'delete all my data') {
      setStatusMessage('Please type "delete all my data" exactly to confirm.');
      return;
    }

    setIsPurging(true);
    setStatusMessage('Permanently deleting all memories, loops, and records...');
    try {
      await deleteAllUserData(user.uid);
      try {
        localStorage.removeItem(`pm_draft_${user.uid}`);
      } catch (e) {
        // ignore
      }
      setStatusMessage('All personal data permanently deleted.');
      setTimeout(() => {
        onAccountPurged();
      }, 1200);
    } catch (err: any) {
      console.error('Purge error', err);
      setStatusMessage(`Purge failed: ${err.message || 'Database error'}`);
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div 
        id="privacy-settings-modal"
        className="bg-white/85 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] w-full max-w-2xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Privacy & Data Sovereignty</h2>
              <p className="text-xs text-slate-500">Your personal memories belong exclusively to you</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Privacy Architecture Guarantee Card */}
          <div className="p-4 rounded-2xl bg-white/70 border border-white/60 space-y-2 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Architectural Privacy Guarantees
            </h3>
            <ul className="space-y-1.5 text-slate-600 leading-relaxed pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">&bull;</span>
                <span><strong>User-Bound Storage:</strong> All memories are isolated under your Firebase UID (<code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{user.uid.slice(0, 10)}...</code>). Zero cross-tenant visibility.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">&bull;</span>
                <span><strong>Raw Content Inviolability:</strong> AI models never overwrite or alter your original journal text. Inferences are stored in a separate, independently deletable structure.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">&bull;</span>
                <span><strong>Zero Training:</strong> Your private entries are never used to train public models.</span>
              </li>
            </ul>
          </div>

          {/* Data Population & Showcase Options */}
          {onSeedSampleData && (
            <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-100 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Showcase Data & Exploration
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  {entries.length} memories saved
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Add 7 authentic sample memories from Goa beaches, Kyoto bamboo groves, and Swiss Alps summits to explore the interactive Life Map, Open Loops, and AI Reflection features.
              </p>
              <button
                type="button"
                disabled={isSeedingData}
                onClick={async () => {
                  setIsSeedingData(true);
                  try {
                    await onSeedSampleData();
                    setStatusMessage('Successfully added showcase memories!');
                  } catch (e: any) {
                    setStatusMessage('Failed to seed: ' + (e.message || 'error'));
                  } finally {
                    setIsSeedingData(false);
                  }
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSeedingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{isSeedingData ? 'Adding Memories...' : 'Add 7 Rich Showcase Memories'}</span>
              </button>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              Export & Backup Your Vault
            </h3>
            <p className="text-slate-500">
              Download all your memories, open loops, and bookmarks anytime in open standards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={isExporting}
                className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-white/60 hover:border-indigo-200 transition-all text-left shadow-xs flex items-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">Structured JSON Archive</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Complete database backup with coordinates & metadata</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                disabled={isExporting}
                className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-white/60 hover:border-indigo-200 transition-all text-left shadow-xs flex items-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">Readable Markdown (.md)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Human-readable journal book for Obsidian, Notion, or text</p>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone: Delete All Account Data */}
          <div className="pt-4 border-t border-slate-200/60 space-y-3">
            <h3 className="font-bold text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Permanent Data Deletion ("Right to be Forgotten")
            </h3>
            <p className="text-slate-500">
              Permanently purge all journal entries, saved loops, and place records from Firestore. This action is immediate and irreversible.
            </p>

            {!showPurgeConfirm ? (
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 transition-colors shadow-xs"
              >
                Delete All My Memories & Data...
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 space-y-3">
                <p className="text-red-900 font-semibold">
                  Type <span className="font-mono bg-red-100 px-1 py-0.5 rounded text-red-800">delete all my data</span> below to permanently erase your account vault:
                </p>
                <input
                  type="text"
                  value={confirmPurgeText}
                  onChange={(e) => setConfirmPurgeText(e.target.value)}
                  placeholder="delete all my data"
                  className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 font-mono shadow-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePurgeAllData}
                    disabled={isPurging || confirmPurgeText.trim().toLowerCase() !== 'delete all my data'}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPurging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Confirm & Permanently Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPurgeConfirm(false);
                      setConfirmPurgeText('');
                    }}
                    className="px-3 py-2 rounded-xl bg-white text-slate-600 hover:text-slate-800 border border-slate-200 font-medium text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-white/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
