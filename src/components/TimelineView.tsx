import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Image as ImageIcon, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  PenTool, 
  Mic, 
  Video, 
  BookOpen,
  X
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface TimelineViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenCapture: (mode?: 'write' | 'speak' | 'photo' | 'video' | 'location') => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  onSelectEntry,
  onOpenCapture,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Collect all unique emotion and topic tags
  const allTags = Array.from(
    new Set(
      entries.flatMap((e) => [
        ...(e.aiInterpretation?.emotions || []),
        ...(e.aiInterpretation?.topics || []),
      ])
    )
  ).slice(0, 10);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      searchQuery === '' ||
      e.rawContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.location?.placeName && e.location.placeName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      !selectedTag ||
      e.aiInterpretation?.emotions?.includes(selectedTag) ||
      e.aiInterpretation?.topics?.includes(selectedTag);

    const matchesDate =
      !selectedDate ||
      e.createdAt.slice(0, 10) === selectedDate;

    return matchesSearch && matchesTag && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Quick Capture Launcher Header Card */}
      <div className="p-6 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Capture
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Raw notes preserved inviolably without AI alterations
          </span>
        </div>

        <div
          onClick={() => onOpenCapture('write')}
          className="w-full bg-white/60 hover:bg-white/85 backdrop-blur-md border border-white/50 rounded-2xl p-4 text-xs text-slate-500 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
        >
          <span className="text-slate-600 font-medium group-hover:text-slate-800">What are you experiencing, thinking, or noticing right now?</span>
          <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Pen Reflection &rarr;
          </span>
        </div>

        {/* Multi-modal starter frosted cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div
            id="btn-quick-write"
            onClick={() => onOpenCapture('write')}
            className="bg-white/60 backdrop-blur-lg p-3.5 rounded-2xl border border-white/40 shadow-xs hover:shadow-md hover:bg-white/80 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-800 text-xs">Write</h4>
            <p className="text-[10px] text-slate-500">Free-form reflection</p>
          </div>

          <div
            id="btn-quick-speak"
            onClick={() => onOpenCapture('speak')}
            className="bg-white/60 backdrop-blur-lg p-3.5 rounded-2xl border border-white/40 shadow-xs hover:shadow-md hover:bg-white/80 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-800 text-xs">Speak</h4>
            <p className="text-[10px] text-slate-500">Voice to text</p>
          </div>

          <div
            id="btn-quick-photo"
            onClick={() => onOpenCapture('photo')}
            className="bg-white/60 backdrop-blur-lg p-3.5 rounded-2xl border border-white/40 shadow-xs hover:shadow-md hover:bg-white/80 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-2 shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-800 text-xs">Photo</h4>
            <p className="text-[10px] text-slate-500">Visual memory</p>
          </div>

          <div
            id="btn-quick-video"
            onClick={() => onOpenCapture('video')}
            className="bg-white/60 backdrop-blur-lg p-3.5 rounded-2xl border border-white/40 shadow-xs hover:shadow-md hover:bg-white/80 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 shadow-xs">
              <Video className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-800 text-xs">Video</h4>
            <p className="text-[10px] text-slate-500">Live footage</p>
          </div>

          <div
            id="btn-quick-location"
            onClick={() => onOpenCapture('location')}
            className="bg-white/60 backdrop-blur-lg p-3.5 rounded-2xl border border-white/40 shadow-xs hover:shadow-md hover:bg-white/80 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-2 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-800 text-xs">Place</h4>
            <p className="text-[10px] text-slate-500">Geo anchor</p>
          </div>
        </div>
      </div>

      {/* Search, Date & Tag Filtering */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="input-timeline-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories by keyword..."
              className="w-full bg-white/50 backdrop-blur-xl border border-white/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
            />
          </div>

          {/* Calendar Date Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-white/50 backdrop-blur-xl border border-white/50 rounded-2xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Filter by date:</span>
            <input
              type="date"
              id="timeline-calendar-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-sans focus:outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                title="Clear date filter"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs w-full overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !selectedTag
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white/50 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/70 shadow-xs'
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white/50 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/70 shadow-xs'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="p-12 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/50 text-center space-y-3 shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">
              {entries.length === 0 ? 'Your life memory begins here' : 'No matching memories found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {entries.length === 0
                ? 'Capture your first experience, observation, or feeling. You can write freely, speak your thoughts, or anchor it to a location.'
                : 'Try adjusting your search query or tag filter.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => onOpenCapture('write')}
                className="mt-3 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all"
              >
                Capture First Memory
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="p-6 rounded-3xl bg-white/60 hover:bg-white/85 backdrop-blur-lg transition-all border border-white/40 shadow-xs hover:shadow-md cursor-pointer space-y-3 group"
            >
              {/* Card Meta Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  {entry.location && (
                    <span className="flex items-center gap-1 text-slate-600 text-[11px] font-medium bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                      <MapPin className="w-3 h-3 text-teal-600" />
                      {entry.location.placeName}
                    </span>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
                  Open & Reflect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Title */}
              {entry.title && (
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                  {entry.title}
                </h3>
              )}

              {/* Raw User Text Excerpt */}
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-sans">
                {entry.rawContent}
              </p>

              {/* Media Previews */}
              {entry.media && entry.media.length > 0 && (
                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                  {entry.media.slice(0, 4).map((m) => (
                    <div key={m.id} className="w-16 h-12 rounded-xl overflow-hidden border border-white/60 flex-shrink-0 bg-slate-100 shadow-xs">
                      {m.type === 'image' ? (
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 bg-slate-200">
                          Video
                        </div>
                      )}
                    </div>
                  ))}
                  {entry.media.length > 4 && (
                    <span className="text-[10px] text-slate-500 font-medium">+{entry.media.length - 4} more</span>
                  )}
                </div>
              )}

              {/* AI Metadata Tags Pill Row */}
              {entry.aiInterpretation && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
                  {entry.aiInterpretation.emotions?.slice(0, 3).map((em, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 shadow-xs">
                      {em}
                    </span>
                  ))}

                  {entry.aiInterpretation.people?.slice(0, 2).map((p, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-xs">
                      {p}
                    </span>
                  ))}

                  {entry.aiInterpretation.topics?.slice(0, 2).map((top, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/50 shadow-xs">
                      {top}
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
