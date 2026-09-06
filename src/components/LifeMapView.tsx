import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Compass, 
  Calendar, 
  Image as ImageIcon, 
  ChevronRight,
  Navigation,
  Search,
  Maximize2,
  Crosshair,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { JournalEntry, LocationData } from '../types';

interface LifeMapViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

interface PlaceGroup {
  id: string;
  name: string;
  location: LocationData;
  entries: JournalEntry[];
  hasCoordinates: boolean;
}

export const LifeMapView: React.FC<LifeMapViewProps> = ({
  entries,
  onSelectEntry,
}) => {
  // Filter entries that have any location info
  const localizedEntries = useMemo(() => {
    return entries.filter((e) => e.location && (e.location.placeName || (e.location.lat !== 0 && e.location.lng !== 0)));
  }, [entries]);

  // Group entries by place
  const placeGroups = useMemo(() => {
    const groups: Record<string, PlaceGroup> = {};

    localizedEntries.forEach((entry) => {
      const loc = entry.location!;
      const placeName = loc.placeName?.trim() || `Coord: ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`;
      const hasCoords = Boolean(loc.lat && loc.lng && (loc.lat !== 0 || loc.lng !== 0));
      // Use coordinate key if available to merge identical coordinates
      const groupKey = hasCoords ? `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}` : placeName.toLowerCase();

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          name: placeName,
          location: loc,
          entries: [],
          hasCoordinates: hasCoords,
        };
      }
      groups[groupKey].entries.push(entry);
    });

    return Object.values(groups);
  }, [localizedEntries]);

  // Search & Selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Set default selection when groups change
  useEffect(() => {
    if (placeGroups.length > 0 && !selectedPlaceId) {
      // Prefer first group with coordinates
      const firstWithCoords = placeGroups.find((g) => g.hasCoordinates);
      setSelectedPlaceId(firstWithCoords ? firstWithCoords.id : placeGroups[0].id);
    }
  }, [placeGroups, selectedPlaceId]);

  // Filtered place groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return placeGroups;
    const q = searchQuery.toLowerCase();
    return placeGroups.filter(
      (g) => g.name.toLowerCase().includes(q) ||
        g.entries.some((e) => (e.title && e.title.toLowerCase().includes(q)) || e.rawContent.toLowerCase().includes(q))
    );
  }, [placeGroups, searchQuery]);

  const currentGroup = useMemo(() => {
    return placeGroups.find((g) => g.id === selectedPlaceId) || null;
  }, [placeGroups, selectedPlaceId]);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Function to create custom divIcon HTML
  const createMarkerIcon = (group: PlaceGroup, isSelected: boolean) => {
    const count = group.entries.length;
    if (isSelected) {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300/80 ring-4 ring-indigo-400/50 border-2 border-white font-sans text-xs font-bold whitespace-nowrap cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="max-w-[130px] truncate">${group.name}</span>
            <span class="bg-indigo-800 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono">${count}</span>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 18],
      });
    }

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center gap-1 px-2.5 py-1 bg-white/95 text-slate-800 rounded-full shadow-md shadow-slate-300/60 border border-slate-300/80 hover:border-indigo-400 hover:text-indigo-600 font-sans text-xs font-semibold whitespace-nowrap cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-all duration-150">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          <span class="max-w-[110px] truncate">${group.name}</span>
          <span class="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-full font-mono">${count}</span>
        </div>
      `,
      iconSize: [100, 32],
      iconAnchor: [50, 16],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 18,
    }).setView([20, 0], 2);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // High quality crisp CartoDB Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &bull; &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Resize observer to ensure map renders smoothly on container layout change
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers when placeGroups or selectedPlaceId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let hasValidBounds = false;

    placeGroups.forEach((group) => {
      if (!group.hasCoordinates) return;

      const lat = group.location.lat;
      const lng = group.location.lng;
      const isSelected = group.id === selectedPlaceId;

      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(group, isSelected),
        zIndexOffset: isSelected ? 1000 : 10,
      });

      // Build popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans space-y-1.5 min-w-[180px] max-w-[240px] text-slate-800';
      popupContent.innerHTML = `
        <div class="font-bold text-xs text-indigo-900 border-b border-slate-200 pb-1 flex items-center justify-between">
          <span class="truncate">${group.name}</span>
          <span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-mono">${group.entries.length}</span>
        </div>
        <p class="text-[11px] text-slate-500 font-mono">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</p>
        <div class="text-[11px] text-slate-600 line-clamp-2 italic">
          "${group.entries[0]?.rawContent || ''}"
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -10] });

      marker.on('click', () => {
        setSelectedPlaceId(group.id);
        setSelectedEntryId(null);
      });

      marker.addTo(map);
      markersRef.current.set(group.id, marker);

      bounds.extend([lat, lng]);
      hasValidBounds = true;
    });

    // If initial render with valid bounds, fit all memories on screen
    if (hasValidBounds && bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
      });
    }
  }, [placeGroups]);

  // When selectedPlaceId changes, update icon styles and smooth pan map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceId) return;

    // Update marker icons to reflect active state
    placeGroups.forEach((group) => {
      const marker = markersRef.current.get(group.id);
      if (marker) {
        const isSelected = group.id === selectedPlaceId;
        marker.setIcon(createMarkerIcon(group, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 10);

        if (isSelected) {
          map.flyTo([group.location.lat, group.location.lng], Math.max(map.getZoom(), 12), {
            duration: 1.0,
          });
          marker.openPopup();
        }
      }
    });
  }, [selectedPlaceId]);

  // Fit all memories button handler
  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([]);
    placeGroups.forEach((group) => {
      if (group.hasCoordinates) {
        bounds.extend([group.location.lat, group.location.lng]);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    } else {
      map.setView([20, 0], 2);
    }
  };

  // Center on current GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
      },
      (err) => {
        console.warn('Geolocation failed', err);
      },
      { timeout: 7000 }
    );
  };

  const totalLocatedMemories = localizedEntries.length;
  const placesWithCoordinates = placeGroups.filter((g) => g.hasCoordinates).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs text-teal-700 font-semibold mb-1 shadow-xs">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Life Map</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Life Map &amp; Places
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            See all your memories across the world on one unified map. Select any place or pin to explore memories anchored to that location.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-indigo-600 font-bold">{placeGroups.length}</span> places &bull;{' '}
          <span className="text-indigo-600 font-bold">{totalLocatedMemories}</span> mapped memories &bull;{' '}
          <span className="text-emerald-600 font-bold">{placesWithCoordinates}</span> GPS pins
        </div>
      </div>

      {/* Main Unified Interactive Map Canvas */}
      <div className="relative rounded-[2rem] overflow-hidden border border-slate-200/80 bg-slate-100 shadow-md">
        
        {/* Map Container - compact height allowing easy scrolling to places & memories below */}
        <div 
          ref={mapContainerRef} 
          id="life-map-canvas"
          className="w-full h-[240px] sm:h-[280px] lg:h-[320px] z-10"
        />

        {/* Floating Quick Action Controls on Map */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
          <button
            type="button"
            id="btn-fit-all-map"
            onClick={handleFitAll}
            title="Fit all memories on map"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-semibold shadow-md border border-slate-200/80 backdrop-blur-md transition-all active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fit All Memories ({placesWithCoordinates})</span>
          </button>

          <button
            type="button"
            id="btn-locate-me-map"
            onClick={handleLocateMe}
            title="Center on my current GPS location"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-semibold shadow-md border border-slate-200/80 backdrop-blur-md transition-all active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>

        {/* Active Selection Bottom Chip */}
        {currentGroup && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate">{currentGroup.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentGroup.entries.length} {currentGroup.entries.length === 1 ? 'memory' : 'memories'} captured here
                  {currentGroup.hasCoordinates && ` &bull; ${currentGroup.location.lat.toFixed(3)}, ${currentGroup.location.lng.toFixed(3)}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const element = document.getElementById('selected-place-details');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors shadow-2xs"
            >
              View Memories
            </button>
          </div>
        )}
      </div>

      {/* Scroll Down Cue */}
      {placeGroups.length > 0 && (
        <div className="flex items-center justify-center -mt-2">
          <button
            type="button"
            onClick={() => {
              const element = document.getElementById('places-exploration-deck');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-indigo-600 text-xs font-semibold border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <span>Explore places &amp; memory stories below</span>
            <span className="text-indigo-600 font-bold">&darr;</span>
          </button>
        </div>
      )}

      {/* Places & Memories Exploration Deck */}
      {placeGroups.length === 0 ? (
        <div className="p-12 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No geographic memories captured yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            When capturing a memory, tap "Place Context &amp; Life Map" to add a place name, search a cafe or city, or tap "Get Current GPS" to anchor your memories on Earth.
          </p>
        </div>
      ) : (
        <div id="places-exploration-deck" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Places Directory with Search */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mapped locations..."
                className="w-full pl-9 pr-3 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Locations ({filteredGroups.length})</span>
              <span>Memories</span>
            </div>

            {/* Places List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredGroups.map((group) => {
                const isSelected = selectedPlaceId === group.id;
                return (
                  <div
                    key={group.id}
                    id={`place-item-${group.id}`}
                    onClick={() => {
                      setSelectedPlaceId(group.id);
                      setSelectedEntryId(null);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border-indigo-600'
                        : 'bg-white/80 hover:bg-white border-slate-200/80 text-slate-700 shadow-2xs hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {group.name}
                        </h4>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {group.hasCoordinates ? (
                            <span>{group.location.lat.toFixed(2)}, {group.location.lng.toFixed(2)}</span>
                          ) : (
                            <span className="italic">Named place</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {group.entries.length}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                  No places match "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Place Memories & Detail Deck */}
          <div className="lg:col-span-8 space-y-4" id="selected-place-details">
            {currentGroup ? (
              <div className="p-6 sm:p-7 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-slate-200/80 space-y-6 shadow-sm">
                
                {/* Location Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{currentGroup.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {currentGroup.hasCoordinates 
                          ? `GPS: ${currentGroup.location.lat.toFixed(5)}, ${currentGroup.location.lng.toFixed(5)}`
                          : 'Named location'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentGroup.hasCoordinates && (
                      <button
                        type="button"
                        onClick={() => {
                          mapRef.current?.flyTo([currentGroup.location.lat, currentGroup.location.lng], 15, { duration: 1 });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Focus on Map</span>
                      </button>
                    )}
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
                      {currentGroup.entries.length} {currentGroup.entries.length === 1 ? 'memory' : 'memories'}
                    </span>
                  </div>
                </div>

                {/* List of Memories Anchored to this Location */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Recorded at this location
                  </span>

                  <div className="grid grid-cols-1 gap-3">
                    {currentGroup.entries.map((entry) => {
                      const isEntrySelected = selectedEntryId === entry.id;
                      return (
                        <div
                          key={entry.id}
                          id={`memory-card-${entry.id}`}
                          onClick={() => {
                            setSelectedEntryId(entry.id);
                            onSelectEntry(entry);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 group shadow-2xs hover:shadow-md ${
                            isEntrySelected
                              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200'
                              : 'bg-white hover:bg-white/95 border-slate-200/80 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-mono text-indigo-600 font-semibold text-[11px]">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>

                            <span className="text-xs text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors">
                              <span>Open Memory</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>

                          {entry.title && (
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {entry.title}
                            </h4>
                          )}

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                            {entry.rawContent}
                          </p>

                          {/* Media count & AI metadata tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {entry.media && entry.media.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                <ImageIcon className="w-3 h-3 text-indigo-500" />
                                <span>{entry.media.length} media item{entry.media.length === 1 ? '' : 's'}</span>
                              </div>
                            )}

                            {entry.aiMetadata?.people && entry.aiMetadata.people.length > 0 && (
                              <div className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                With: {entry.aiMetadata.people.slice(0, 2).join(', ')}
                              </div>
                            )}

                            {entry.aiMetadata?.emotions && entry.aiMetadata.emotions.length > 0 && (
                              <div className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-medium">
                                {entry.aiMetadata.emotions.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-[2rem] bg-white/70 border border-slate-200/80 text-center text-slate-500 text-xs">
                Select a location from the left to view its memories.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
