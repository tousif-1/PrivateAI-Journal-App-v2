import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Globe, 
  Film, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import type { BookmarkItem } from '../types';
import { getBookmarks, saveBookmark, deleteBookmark } from '../lib/firestoreService';

interface BookmarksViewProps {
  userId: string;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ userId }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<BookmarkItem['contentType']>('website');
  const [reasonForSaving, setReasonForSaving] = useState('');
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [userReflection, setUserReflection] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const availableReactions = [
    { label: 'Loved it', icon: '❤️' },
    { label: 'Meaningful', icon: '✨' },
    { label: 'Interesting', icon: '💡' },
    { label: 'Funny', icon: '😄' },
    { label: 'Made me angry', icon: '🔥' },
    { label: 'Inspired me', icon: '🌱' },
    { label: 'Gave me an idea', icon: '🎯' },
    { label: 'Want to discuss', icon: '🗣️' },
    { label: 'Want to revisit', icon: '🔁' },
  ];

  const fetchBookmarks = async () => {
    try {
      const items = await getBookmarks(userId);
      setBookmarks(items);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  const handleUrlBlur = async () => {
    if (!url.trim() || !url.startsWith('http')) return;
    setIsFetchingUrl(true);
    setErrorNotice(null);

    try {
      const res = await fetch('/api/bookmarks/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        if (!title && data.title) setTitle(data.title);
        if (data.contentType) setContentType(data.contentType);
      }
    } catch (err: any) {
      console.warn('URL metadata fetch notice:', err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const toggleReaction = (reaction: string) => {
    setSelectedReactions((prev) =>
      prev.includes(reaction) ? prev.filter((r) => r !== reaction) : [...prev, reaction]
    );
  };

  const handleSaveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !title.trim()) {
      setErrorNotice('Please provide either a URL or a title.');
      return;
    }

    setIsSaving(true);
    setErrorNotice(null);

    try {
      const bookmarkId = await saveBookmark(userId, {
        url: url.trim(),
        title: title.trim() || url.trim(),
        contentType,
        reasonForSaving: reasonForSaving.trim(),
        reactions: selectedReactions,
        userReflection: userReflection.trim(),
        status: 'saved',
      });

      const newItem: BookmarkItem = {
        id: bookmarkId,
        userId,
        url: url.trim(),
        title: title.trim() || url.trim(),
        contentType,
        reasonForSaving: reasonForSaving.trim(),
        reactions: selectedReactions,
        userReflection: userReflection.trim(),
        status: 'saved',
        createdAt: new Date().toISOString(),
      };

      setBookmarks((prev) => [newItem, ...prev]);
      // Reset form
      setUrl('');
      setTitle('');
      setReasonForSaving('');
      setSelectedReactions([]);
      setUserReflection('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error saving bookmark:', err);
      setErrorNotice('Failed to save bookmark: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookmark(userId, id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const getContentTypeIcon = (type: BookmarkItem['contentType']) => {
    switch (type) {
      case 'video':
      case 'movie':
        return <Film className="w-4 h-4 text-indigo-500" />;
      case 'article':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <Globe className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/40 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold mb-1 shadow-xs">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Remember This</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Saved Content & Web
          </h2>
          <p className="text-xs text-slate-500">
            Save articles, videos, and movies with your personal reasons, emotional reactions, and reflections.
          </p>
        </div>

        <button
          id="btn-open-add-bookmark"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Save Content'}</span>
        </button>
      </div>

      {/* Add Bookmark Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSaveBookmark}
          className="p-6 sm:p-8 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-semibold text-slate-800">Save External Content to Memory</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">URL (Articles, YouTube, Web)</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://..."
                className="w-full bg-white/70 border border-white/50 rounded-2xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
              />
              {isFetchingUrl && <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">Fetching preview...</span>}
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Title or Media Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Interstellar or Article Title"
                className="w-full bg-white/70 border border-white/50 rounded-2xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Why I saved it</label>
            <input
              type="text"
              value={reasonForSaving}
              onChange={(e) => setReasonForSaving(e.target.value)}
              placeholder="e.g. Everyone keeps recommending this, or wanted to reference this framework"
              className="w-full bg-white/70 border border-white/50 rounded-2xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
            />
          </div>

          {/* Emotional Reactions Selector */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1.5">My Reaction / Resonance</label>
            <div className="flex flex-wrap gap-1.5">
              {availableReactions.map((rec) => {
                const isSelected = selectedReactions.includes(rec.label);
                return (
                  <button
                    key={rec.label}
                    type="button"
                    onClick={() => toggleReaction(rec.label)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white/60 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80 shadow-xs'
                    }`}
                  >
                    <span>{rec.icon}</span>
                    <span>{rec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Personal Reflection (Optional)</label>
            <textarea
              rows={3}
              value={userReflection}
              onChange={(e) => setUserReflection(e.target.value)}
              placeholder="What did this make you think about? Your private notes..."
              className="w-full bg-white/70 border border-white/50 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs resize-none"
            />
          </div>

          {errorNotice && (
            <div className="p-3 rounded-2xl bg-red-100/80 border border-red-300 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save to Memory'}
            </button>
          </div>
        </form>
      )}

      {/* Bookmarks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookmarks.length === 0 ? (
          <div className="col-span-2 p-12 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 text-center text-xs text-slate-500 space-y-2 shadow-sm">
            <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No external content saved yet.</p>
            <p className="text-slate-400">Save articles, YouTube videos, or movies you want to revisit or reflect upon.</p>
          </div>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-5 rounded-3xl bg-white/60 hover:bg-white/85 backdrop-blur-md border border-white/40 hover:border-white/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 capitalize font-mono text-[11px] text-indigo-600 font-bold">
                    {getContentTypeIcon(bm.contentType)}
                    {bm.contentType}
                  </span>
                  <div className="flex items-center gap-2">
                    {bm.url && (
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(bm.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">
                  {bm.title}
                </h4>

                {bm.reasonForSaving && (
                  <p className="text-xs text-slate-500 mt-1 italic font-sans">
                    Why I saved it: "{bm.reasonForSaving}"
                  </p>
                )}

                {bm.userReflection && (
                  <div className="p-3 rounded-2xl bg-white/80 border border-white/60 mt-2 text-xs text-slate-600 shadow-xs">
                    {bm.userReflection}
                  </div>
                )}
              </div>

              {/* Reactions list */}
              {bm.reactions && bm.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                  {bm.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
