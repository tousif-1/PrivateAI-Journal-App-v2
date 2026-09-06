import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  XCircle, 
  Plus, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import type { OpenLoopItem, JournalEntry } from '../types';
import { getOpenLoops, saveOpenLoop, updateOpenLoopStatus, deleteOpenLoop } from '../lib/firestoreService';

interface OpenLoopsViewProps {
  userId: string;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const OpenLoopsView: React.FC<OpenLoopsViewProps> = ({
  userId,
  entries,
  onSelectEntry,
}) => {
  const [loops, setLoops] = useState<OpenLoopItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'saved' | 'in_progress' | 'completed' | 'dismissed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLoops = async () => {
    setIsLoading(true);
    try {
      const data = await getOpenLoops(userId);
      setLoops(data);
    } catch (err) {
      console.error('Error fetching loops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLoops();
    }
  }, [userId]);

  const handleAddLoop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const loopId = await saveOpenLoop(userId, {
        title: newTitle.trim(),
        status: 'saved',
      });
      const created: OpenLoopItem = {
        id: loopId,
        title: newTitle.trim(),
        status: 'saved',
        createdAt: new Date().toISOString(),
      };
      setLoops((prev) => [created, ...prev]);
      setNewTitle('');
    } catch (err) {
      console.error('Error saving open loop:', err);
    }
  };

  const handleStatusChange = async (loopId: string, nextStatus: OpenLoopItem['status']) => {
    try {
      await updateOpenLoopStatus(userId, loopId, nextStatus);
      setLoops((prev) =>
        prev.map((l) => (l.id === loopId ? { ...l, status: nextStatus } : l))
      );
    } catch (err) {
      console.error('Error updating loop status:', err);
    }
  };

  const handleDeleteLoop = async (loopId: string) => {
    try {
      await deleteOpenLoop(userId, loopId);
      setLoops((prev) => prev.filter((l) => l.id !== loopId));
    } catch (err) {
      console.error('Error deleting loop:', err);
    }
  };

  const filteredLoops = loops.filter((l) => (filter === 'all' ? true : l.status === filter));

  const statusIcons = {
    saved: <Circle className="w-4 h-4 text-slate-400" />,
    in_progress: <Clock className="w-4 h-4 text-indigo-600" />,
    completed: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    dismissed: <XCircle className="w-4 h-4 text-slate-400" />,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/40 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold mb-1 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unfinished Intentions</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Open Loops
          </h2>
          <p className="text-xs text-slate-500">
            Captured thoughts ("I should...", "I want to...", "Need to..."). Track intentions with full user control.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <span className="text-indigo-600 font-bold">{loops.filter(l => l.status !== 'completed' && l.status !== 'dismissed').length}</span> active intentions
        </div>
      </div>

      {/* Manual Intention Adder */}
      <form onSubmit={handleAddLoop} className="flex items-center gap-2">
        <input
          type="text"
          id="input-new-loop"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add an intention or loop (e.g. 'Call Dad back', 'Investigate Spanish courses', 'Finish reading Dune')..."
          className="flex-1 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
        />
        <button
          type="submit"
          id="btn-add-loop"
          disabled={!newTitle.trim()}
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Loop</span>
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs pb-2 overflow-x-auto">
        {(['all', 'saved', 'in_progress', 'completed', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white/50 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/70 shadow-xs'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Loops List */}
      <div className="space-y-3">
        {filteredLoops.length === 0 ? (
          <div className="p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 text-center text-xs text-slate-500 space-y-1 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No open loops in this view.</p>
            <p className="text-slate-400">When Gemini spots statements like "I should..." in your journal, you can easily save them here.</p>
          </div>
        ) : (
          filteredLoops.map((loop) => {
            const sourceEntry = loop.sourceEntryId
              ? entries.find((e) => e.id === loop.sourceEntryId)
              : null;

            return (
              <div
                key={loop.id}
                className="p-4 rounded-2xl bg-white/60 hover:bg-white/85 backdrop-blur-md border border-white/40 hover:border-white/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => {
                      const next =
                        loop.status === 'completed'
                          ? 'saved'
                          : loop.status === 'in_progress'
                          ? 'completed'
                          : 'in_progress';
                      handleStatusChange(loop.id, next);
                    }}
                    title="Advance status"
                    className="p-1 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    {statusIcons[loop.status]}
                  </button>

                  <div>
                    <span
                      className={`text-xs font-semibold ${
                        loop.status === 'completed'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {loop.title}
                    </span>

                    {sourceEntry && (
                      <button
                        onClick={() => onSelectEntry(sourceEntry)}
                        className="block text-[11px] text-indigo-600 font-medium hover:underline mt-0.5"
                      >
                        From memory: {sourceEntry.title || 'View source memory'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Switcher & Delete */}
                <div className="flex items-center gap-2">
                  <select
                    value={loop.status}
                    onChange={(e) =>
                      handleStatusChange(loop.id, e.target.value as OpenLoopItem['status'])
                    }
                    className="bg-white/80 border border-white/60 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none shadow-xs font-medium"
                  >
                    <option value="saved">Saved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="dismissed">Dismissed</option>
                  </select>

                  <button
                    onClick={() => handleDeleteLoop(loop.id)}
                    title="Delete loop"
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
