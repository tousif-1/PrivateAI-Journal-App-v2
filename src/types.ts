export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface LocationData {
  placeName: string;
  placeId?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string; // Data URL or object URL
  name: string;
  size?: number;
  caption?: string;
  createdAt: string;
}

export interface OpenLoopItem {
  id: string;
  title: string;
  status?: 'saved' | 'in_progress' | 'completed' | 'dismissed';
  sourceEntryId?: string;
  createdAt?: string;
}

export interface AiInterpretation {
  summary: string;
  emotions: string[];
  people: string[];
  places: string[];
  events: string[];
  topics: string[];
  ideas: string[];
  goals: string[];
  openLoops: OpenLoopItem[];
  meaningfulMoments?: string[];
  generatedAt: string;
  isAiDerived: boolean;
  rejectedFields?: string[]; // tracks fields the user explicitly edited/rejected
}

export interface JournalEntry {
  id: string;
  userId: string;
  rawContent: string; // The user's exact unaltered authoring
  title?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  location?: LocationData;
  media?: MediaItem[];
  aiInterpretation?: AiInterpretation;
  isFavorite?: boolean;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  url: string;
  title: string;
  contentType: 'article' | 'video' | 'website' | 'movie' | 'other';
  reasonForSaving: string;
  reactions: string[];
  summary?: string;
  userReflection?: string;
  status: 'saved' | 'in_progress' | 'revisit' | 'completed';
  createdAt: string;
}

export interface MemoryCitation {
  entryId: string;
  title: string;
  date: string;
  quoteSnippet?: string;
}

export interface AskMemoryResponse {
  answer: string;
  citations: MemoryCitation[];
  isExclusivelyExplicit: boolean;
  hasInferences: boolean;
  insufficientEvidence: boolean;
}

export type ReflectionMode = 'reflect' | 'think' | 'brainstorm' | 'rewrite' | 'patterns' | 'plan' | 'talk';

export interface MultiTurnMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: ReflectionMode;
  citations?: MemoryCitation[];
  createdAt: string;
}
