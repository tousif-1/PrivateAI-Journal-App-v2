import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PenTool, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Video, 
  MapPin, 
  Save, 
  AlertCircle, 
  Trash2,
  Search,
  Loader2,
  RotateCcw,
  Check,
  Navigation,
  Radio,
  Volume2,
  Info,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import type { LocationData, MediaItem, JournalEntry } from '../types';
import { saveJournalEntry, updateJournalAiMetadata, saveOpenLoop } from '../lib/firestoreService';
import { 
  optimizeImage, 
  validateUploadFile, 
  formatByteSize, 
  MAX_SAFE_MEDIA_TOTAL_BYTES,
  MAX_SINGLE_MEDIA_BYTES
} from '../lib/mediaUtils';

interface QuickCaptureModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onEntrySaved: (entry: JournalEntry) => void;
  initialMode?: 'write' | 'speak' | 'photo' | 'video' | 'location';
}

interface LocationSearchResult {
  placeName: string;
  shortName: string;
  lat: number;
  lng: number;
  type?: string;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  userId,
  isOpen,
  onClose,
  onEntrySaved,
  initialMode = 'write',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'speak' | 'media' | 'location'>('write');
  const [title, setTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [memoryDate, setMemoryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  
  // Voice transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Media processing state
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaProcessingMessage, setMediaProcessingMessage] = useState<string | null>(null);

  // Status & Error handling
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer for recording animation
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Draft persistence key in localStorage
  const DRAFT_KEY = `pm_draft_${userId}`;

  // Reset all modal fields
  const resetForm = () => {
    setTitle('');
    setRawContent('');
    setLocation(null);
    setMedia([]);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
    setSaveStatus(null);
    setLocationStatusMessage(null);
    setHasRestoredDraft(false);
    setMemoryDate(new Date().toISOString().slice(0, 10));
    setIsEditingDate(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn('Could not clear draft from localStorage', e);
    }
  };

  // On mount/open: check draft and set initial tab mode
  useEffect(() => {
    if (isOpen) {
      // Set active tab based on requested initialMode
      if (initialMode === 'speak') {
        setActiveTab('speak');
      } else if (initialMode === 'photo' || initialMode === 'video') {
        setActiveTab('media');
      } else if (initialMode === 'location') {
        setActiveTab('location');
      } else {
        setActiveTab('write');
      }

      // Check for any previous unsaved draft
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && (parsed.rawContent || parsed.title)) {
            if (parsed.rawContent) setRawContent(parsed.rawContent);
            if (parsed.title) setTitle(parsed.title);
            if (parsed.location) setLocation(parsed.location);
            if (parsed.memoryDate) setMemoryDate(parsed.memoryDate);
            setHasRestoredDraft(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [isOpen, initialMode, DRAFT_KEY]);

  // Auto-save draft to localStorage while editing (only if non-empty)
  useEffect(() => {
    if (rawContent.trim() || title.trim()) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ rawContent, title, location, memoryDate }));
      } catch (e) {
        console.warn('Could not auto-save draft', e);
      }
    }
  }, [rawContent, title, location, memoryDate, DRAFT_KEY]);

  // Initialize Web Speech API for voice journaling
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          setRawContent((prev) => {
            const next = (prev ? prev + ' ' : '') + event.results[i][0].transcript.trim();
            return next;
          });
        } else {
          currentTranscript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition notice:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type freely.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setErrorMessage(null);
      } catch (err: any) {
        console.error('Recording start error', err);
        setIsRecording(false);
      }
    }
  };

  // Location search handler
  const handleSearchLocation = async (overrideQuery?: string) => {
    const q = (overrideQuery || searchQuery).trim();
    if (!q) {
      setLocationStatusMessage('Please enter a place, city, or address to search.');
      return;
    }

    setIsSearchingLocation(true);
    setLocationStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/location/search?query=${encodeURIComponent(q)}`);
      if (!response.ok) {
        throw new Error('Location service returned error');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setLocationStatusMessage(`No exact matches found for "${q}". You can save this name directly.`);
        setSearchResults([
          {
            placeName: q,
            shortName: q,
            lat: 0,
            lng: 0,
            type: 'custom',
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Location search error:', err);
      setLocationStatusMessage(`Could not reach location service. You can still save "${q}".`);
      setSearchResults([
        {
          placeName: q,
          shortName: q,
          lat: 0,
          lng: 0,
          type: 'custom',
        },
      ]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Select place from search results
  const handleSelectLocation = (item: LocationSearchResult) => {
    setLocation({
      placeName: item.shortName || item.placeName,
      lat: item.lat,
      lng: item.lng,
    });
    setSearchResults([]);
    setSearchQuery('');
    setLocationStatusMessage(null);
  };

  // GPS Geolocation with reverse geocode
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGps(true);
    setLocationStatusMessage('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(5));
        const lng = Number(position.coords.longitude.toFixed(5));

        try {
          const revRes = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
          if (revRes.ok) {
            const data = await revRes.json();
            if (data.success) {
              setLocation({
                placeName: data.shortName || data.placeName || `Location (${lat}, ${lng})`,
                lat,
                lng,
              });
              setLocationStatusMessage(null);
              setIsLocatingGps(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Reverse geocode failed, using coordinates', e);
        }

        setLocation({
          placeName: `Current Location (${lat}, ${lng})`,
          lat,
          lng,
        });
        setLocationStatusMessage(null);
        setIsLocatingGps(false);
      },
      (geoError) => {
        console.warn('Geo error', geoError);
        setLocationStatusMessage('Browser location permission was denied or timed out. You can search any city or cafe above.');
        setIsLocatingGps(false);
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // File upload handler with client-side compression and quota enforcement
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsProcessingMedia(true);

    try {
      let currentTotalBytes = media.reduce((acc, m) => acc + (m.size || 0), 0);

      for (const file of Array.from(files) as File[]) {
        const validation = validateUploadFile(file);
        if (!validation.valid) {
          setErrorMessage(validation.error || 'Invalid file format');
          break;
        }

        if (fileType === 'image') {
          setMediaProcessingMessage(`Optimizing "${file.name}" for database storage...`);
          const result = await optimizeImage(file);

          if (currentTotalBytes + result.size > MAX_SAFE_MEDIA_TOTAL_BYTES) {
            setErrorMessage(
              `Adding "${file.name}" (${formatByteSize(result.size)}) exceeds the maximum safe media quota (${formatByteSize(MAX_SAFE_MEDIA_TOTAL_BYTES)}) to ensure your entry stays within the 1 MB Firestore document limit. Please remove an existing attachment first.`
            );
            break;
          }

          const item: MediaItem = {
            id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'image',
            url: result.dataUrl,
            name: file.name,
            size: result.size,
            createdAt: new Date().toISOString(),
          };

          currentTotalBytes += result.size;
          setMedia((prev) => [...prev, item]);
        } else {
          // Video validation & ingestion
          if (file.size > MAX_SINGLE_MEDIA_BYTES) {
            setErrorMessage(
              `Video clip is too large (${formatByteSize(file.size)}). Maximum allowed is ${formatByteSize(MAX_SINGLE_MEDIA_BYTES)} to prevent database write rejections.`
            );
            break;
          }

          if (currentTotalBytes + file.size > MAX_SAFE_MEDIA_TOTAL_BYTES) {
            setErrorMessage(
              `Adding this video (${formatByteSize(file.size)}) exceeds the total safe media quota (${formatByteSize(MAX_SAFE_MEDIA_TOTAL_BYTES)}).`
            );
            break;
          }

          setMediaProcessingMessage(`Loading video "${file.name}"...`);
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              const item: MediaItem = {
                id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                type: 'video',
                url: reader.result as string,
                name: file.name,
                size: file.size,
                createdAt: new Date().toISOString(),
              };
              currentTotalBytes += file.size;
              setMedia((prev) => [...prev, item]);
              resolve();
            };
            reader.onerror = () => reject(new Error('Failed to read video file'));
            reader.readAsDataURL(file);
          });
        }
      }
    } catch (err: any) {
      console.error('Media upload/compression error:', err);
      setErrorMessage(`Media processing error: ${err.message || 'Could not process media'}`);
    } finally {
      setIsProcessingMedia(false);
      setMediaProcessingMessage(null);
      e.target.value = '';
    }
  };

  // Save Memory
  const handleSaveMemory = async () => {
    if (!rawContent.trim()) {
      setErrorMessage('Please capture your thought or reflection before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveStatus('Saving memory securely to personal store...');

    try {
      // If the user selected a custom backdated date, preserve that date with appropriate time
      let entryCreatedAt = new Date().toISOString();
      if (memoryDate) {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (memoryDate !== todayStr) {
          // Keep the current time-of-day but set the selected year/month/day
          const now = new Date();
          const [yr, mo, dy] = memoryDate.split('-').map(Number);
          const customDate = new Date(yr, mo - 1, dy, now.getHours(), now.getMinutes(), now.getSeconds());
          entryCreatedAt = customDate.toISOString();
        }
      }

      const entryId = await saveJournalEntry(userId, {
        title: title.trim() || undefined,
        rawContent: rawContent.trim(),
        location: location || undefined,
        media: media.length > 0 ? media : undefined,
        createdAt: entryCreatedAt,
      });

      const initialSavedEntry: JournalEntry = {
        id: entryId,
        userId,
        title: title.trim() || undefined,
        rawContent: rawContent.trim(),
        location: location || undefined,
        media: media.length > 0 ? media : undefined,
        createdAt: entryCreatedAt,
        updatedAt: new Date().toISOString(),
      };

      // Notify parent immediately with saved entry
      onEntrySaved(initialSavedEntry);

      // Reset form state so next capture is completely fresh
      resetForm();

      // Close modal
      onClose();

      // Background AI Extraction (Non-blocking to raw storage integrity)
      try {
        const response = await fetch('/api/gemini/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            rawContent: rawContent.trim(),
            location: location || null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.metadata) {
            await updateJournalAiMetadata(userId, entryId, data.metadata);

            // Also persist any detected open loops
            if (Array.isArray(data.metadata.openLoops)) {
              for (const loop of data.metadata.openLoops) {
                await saveOpenLoop(userId, {
                  title: loop.title,
                  status: 'saved',
                  sourceEntryId: entryId,
                });
              }
            }
          }
        }
      } catch (aiErr) {
        console.warn('Background AI analysis notice:', aiErr);
      }
    } catch (saveErr: any) {
      console.error('Save failed:', saveErr);
      setErrorMessage(`Failed to save memory: ${saveErr.message || 'Database error'}. Your input is preserved in this window.`);
    } finally {
      setIsSaving(false);
      setSaveStatus(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div 
        id="capture-modal-content"
        className="bg-white/85 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] w-full max-w-2xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Capture Memory</h2>
              <p className="text-xs text-slate-500">Raw content is preserved inviolably without AI alterations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(rawContent || title || location || media.length > 0) && (
              <button
                type="button"
                onClick={resetForm}
                title="Discard current inputs and start with an empty form"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl bg-white/70 hover:bg-white border border-white/60 shadow-xs transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Start Fresh</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Draft Restored Banner */}
        {hasRestoredDraft && (
          <div className="px-6 py-2 bg-amber-50/80 border-b border-amber-200/70 text-xs text-amber-800 flex items-center justify-between">
            <span>Unsaved draft restored from previous session.</span>
            <button
              onClick={resetForm}
              className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 ml-2"
            >
              Discard and start fresh
            </button>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-200/60 bg-white/40 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'write' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white/60 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>

          <button
            onClick={() => setActiveTab('speak')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'speak' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white/60 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice to Text</span>
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'location' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white/60 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{location ? location.placeName : 'Add Place'}</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'media' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white/60 border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo / Video {media.length > 0 && `(${media.length})`}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Optional Title */}
          <div>
            <input
              type="text"
              id="capture-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Memory title (optional)..."
              className="w-full bg-white/70 border border-white/50 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs font-sans"
            />
          </div>

          {/* Memory Date Picker & Backdating Control */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/60 border border-white/60 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-500 font-medium">Memory Date:</span>
              {!isEditingDate ? (
                <button
                  type="button"
                  onClick={() => setIsEditingDate(true)}
                  className="font-semibold text-slate-800 hover:text-indigo-600 bg-white/70 hover:bg-white border border-slate-200/60 px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Click to backdate or change date"
                >
                  <span>
                    {new Date(memoryDate + 'T12:00:00Z').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {memoryDate !== new Date().toISOString().slice(0, 10) && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                      Past Memory
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    id="input-memory-date"
                    value={memoryDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      if (e.target.value) setMemoryDate(e.target.value);
                    }}
                    className="bg-white border border-indigo-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(false)}
                    className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {memoryDate !== new Date().toISOString().slice(0, 10) ? (
              <button
                type="button"
                onClick={() => {
                  setMemoryDate(new Date().toISOString().slice(0, 10));
                  setIsEditingDate(false);
                }}
                className="text-[11px] text-slate-400 hover:text-indigo-600 font-medium transition-colors"
              >
                Reset to today
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Default: Today
              </span>
            )}
          </div>

          {/* Voice-to-Text Controller with Rich Recording Animation */}
          {activeTab === 'speak' && (
            <div className={`p-6 rounded-2xl border transition-all flex flex-col items-center text-center space-y-4 shadow-xs ${
              isRecording 
                ? 'bg-red-50/80 border-red-200 shadow-md shadow-red-100' 
                : 'bg-indigo-50/70 border-indigo-200/80'
            }`}>
              {/* Mic Action Area with Multi-Ring Ripple Animation */}
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <>
                    {/* Concentric pulsating radar rings */}
                    <span className="absolute -inset-4 rounded-full bg-red-400/20 animate-ping pointer-events-none" />
                    <span className="absolute -inset-8 rounded-full bg-red-400/10 animate-pulse pointer-events-none" />
                  </>
                )}

                <button
                  type="button"
                  id="btn-voice-toggle"
                  onClick={toggleRecording}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording 
                      ? 'bg-red-600 text-white shadow-red-300 ring-4 ring-red-300/60 scale-105' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105'
                  }`}
                >
                  {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
              </div>

              {/* Status Badge & Dynamic Recording Feedback */}
              {isRecording ? (
                <div className="space-y-2 w-full max-w-sm">
                  {/* Live Recording Header with Blinking Dot and Elapsed Timer */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wide shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                    <span>RECORDING AUDIO TO TEXT</span>
                    <span className="font-mono bg-red-700/80 px-1.5 py-0.5 rounded text-[11px]">
                      {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Equalizer Sound Wave Animation */}
                  <div className="flex items-center justify-center gap-1.5 h-10 px-4 py-1.5 rounded-2xl bg-white/80 border border-red-200 shadow-2xs">
                    {[35, 70, 95, 50, 85, 40, 100, 60, 90, 45, 80, 55, 95, 40].map((height, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 bg-gradient-to-t from-red-600 to-rose-400 rounded-full"
                        style={{
                          height: `${Math.max(20, height * 0.9)}%`,
                          animation: 'pulse 0.6s infinite ease-in-out alternate',
                          animationDelay: `${(idx * 0.07)}s`,
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-medium text-red-700 leading-relaxed">
                    Listening live... Speak your mind naturally. Your words stream directly into your journal below.
                  </p>

                  <button
                    type="button"
                    onClick={toggleRecording}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done Speaking (Stop)</span>
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-indigo-950">
                    Click microphone to begin voice journaling
                  </p>
                  <p className="text-xs text-indigo-600/80 mt-1 max-w-sm mx-auto leading-relaxed">
                    Automatic Speech-to-Text converts your spoken reflections into journal text in real-time. You can edit, format, or append anytime.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location Context Section with Search & GPS */}
          {activeTab === 'location' && (
            <div className="p-4 rounded-2xl bg-white/70 border border-white/60 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Place Context & Life Map
                </span>
                <button
                  type="button"
                  id="btn-get-gps"
                  onClick={requestGeolocation}
                  disabled={isLocatingGps}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isLocatingGps ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{isLocatingGps ? 'Locating...' : 'Use Current GPS'}</span>
                </button>
              </div>

              {/* Location Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="location-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                    placeholder="Search place, city, cafe, or landmark (e.g. Indiranagar, Tokyo, Central Park)..."
                    className="w-full bg-white/90 border border-white/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchLocation()}
                  disabled={isSearchingLocation || !searchQuery.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  {isSearchingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {/* Status Message */}
              {locationStatusMessage && (
                <div className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-xl p-2.5">
                  {locationStatusMessage}
                </div>
              )}

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Results:</span>
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectLocation(item)}
                      className="p-2.5 rounded-xl bg-white/90 hover:bg-indigo-50/80 border border-slate-200/70 flex items-center justify-between cursor-pointer transition-all shadow-xs text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.shortName}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-sm">{item.placeName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold px-2 py-0.5 bg-indigo-50 rounded-md">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Location Card */}
              {location ? (
                <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-teal-900">{location.placeName}</p>
                      <p className="text-[10px] text-teal-700">
                        {location.lat !== 0 || location.lng !== 0 
                          ? `Coordinates: ${location.lat}, ${location.lng}` 
                          : 'Named location anchored to memory'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocation(null)}
                    className="text-[11px] text-red-600 hover:text-red-800 font-medium hover:underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                /* Quick Place Suggestions */
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Place Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Home', 'Office / Studio', 'Favorite Cafe', 'City Center', 'Park / Outdoors', 'Travel'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag);
                          handleSearchLocation(tag);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-indigo-50 border border-slate-200/60 text-[11px] font-medium text-slate-600 hover:text-indigo-600 transition-colors shadow-xs"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Attachments Section with Storage Quota & Guidance */}
          {activeTab === 'media' && (
            <div className="p-4 rounded-2xl bg-white/70 border border-white/60 space-y-3.5 shadow-xs">
              
              {/* Guidance & Limit Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-950">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Accepted Formats &amp; Document Limits</span>
                </div>
                <ul className="text-[11px] text-indigo-800 space-y-1 pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-indigo-600">&bull;</span>
                    <span><strong>Photos</strong>: JPG, PNG, or WebP. Large high-res camera photos are automatically scaled and compressed under ~650 KB.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-indigo-600">&bull;</span>
                    <span><strong>Videos</strong>: Short MP4 or WebM clips (max 650 KB).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-indigo-600">&bull;</span>
                    <span><strong>Document Safety</strong>: Total media per memory is capped at ~700 KB to guarantee entries fit within the 1 MB Firestore document limit without write errors.</span>
                  </li>
                </ul>
              </div>

              {/* Upload Controls & Processing Indicator */}
              <div className="flex flex-wrap items-center gap-2.5">
                <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-all ${
                  isProcessingMedia 
                    ? 'opacity-50 pointer-events-none bg-slate-100 border-slate-200 text-slate-400' 
                    : 'bg-white/90 hover:bg-white border-slate-200/80 text-slate-700 hover:border-indigo-200'
                }`}>
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Attach Photos (JPG/PNG/WebP)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    disabled={isProcessingMedia}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'image')}
                  />
                </label>

                <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-all ${
                  isProcessingMedia 
                    ? 'opacity-50 pointer-events-none bg-slate-100 border-slate-200 text-slate-400' 
                    : 'bg-white/90 hover:bg-white border-slate-200/80 text-slate-700 hover:border-purple-200'
                }`}>
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Attach Short Video (MP4/WebM)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    disabled={isProcessingMedia}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'video')}
                  />
                </label>

                {isProcessingMedia && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium py-1 px-2.5 bg-indigo-50 rounded-lg animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{mediaProcessingMessage || 'Processing media...'}</span>
                  </div>
                )}
              </div>

              {/* Media Quota Meter */}
              {media.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Attached Media ({media.length} item{media.length === 1 ? '' : 's'})</span>
                    <span className="font-mono">
                      {formatByteSize(media.reduce((acc, m) => acc + (m.size || 0), 0))} / {formatByteSize(MAX_SAFE_MEDIA_TOTAL_BYTES)} safe quota
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        (media.reduce((acc, m) => acc + (m.size || 0), 0) / MAX_SAFE_MEDIA_TOTAL_BYTES) > 0.85
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((media.reduce((acc, m) => acc + (m.size || 0), 0) / MAX_SAFE_MEDIA_TOTAL_BYTES) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Media Thumbnail Cards */}
              {media.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                  {media.map((item) => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200/70 bg-slate-100 aspect-video shadow-xs flex flex-col justify-end">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      )}
                      
                      {/* File size & format badge */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-white flex items-center justify-between text-[10px]">
                        <span className="truncate max-w-[90px] font-medium opacity-90">{item.name}</span>
                        {item.size && (
                          <span className="font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded shrink-0">
                            {formatByteSize(item.size)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setMedia(media.filter((m) => m.id !== item.id))}
                        title="Remove attachment"
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw Journal Content (Primary Inviolable Input Area) */}
          <div>
            <textarea
              id="capture-content-input"
              rows={6}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="What happened? What were you thinking, feeling, or noticing? Write freely..."
              className="w-full bg-white/70 border border-white/50 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed resize-none font-sans shadow-xs"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-medium">
              <span>{rawContent.length} characters</span>
              <span>Input preserved inviolably</span>
            </div>
          </div>

          {/* Active Context Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200 shadow-xs">
                <MapPin className="w-3 h-3 text-teal-600" />
                <span>{location.placeName}</span>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  className="text-teal-900 hover:text-red-600 ml-1"
                >
                  &times;
                </button>
              </span>
            )}
            {media.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-xs">
                <ImageIcon className="w-3 h-3 text-indigo-600" />
                <span>{media.length} media attached</span>
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-100/80 border border-red-300 text-red-800 text-xs flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Save Status / Progress Indicator */}
          {saveStatus && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2 shadow-xs">
              <span className="w-3.5 h-3.5 border-2 border-indigo-600/40 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-white/40 flex items-center justify-between">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="btn-save-memory"
            onClick={handleSaveMemory}
            disabled={isSaving || !rawContent.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Memory</span>
          </button>
        </div>

      </div>
    </div>
  );
};
