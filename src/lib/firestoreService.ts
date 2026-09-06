import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import type { JournalEntry, OpenLoopItem, BookmarkItem, UserProfile } from '../types';

/**
 * Strips all undefined properties recursively from an object to prevent Firestore errors.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizePayload(value);
      }
    }
    return clean;
  }
  return obj;
}

// -------------------------------------------------------------
// User Profile
// -------------------------------------------------------------

export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
  if (!user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const data = sanitizePayload({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLoginAt: new Date().toISOString(),
  });
  await setDoc(userRef, data, { merge: true });
}

// -------------------------------------------------------------
// Journal Entries
// -------------------------------------------------------------

export async function saveJournalEntry(userId: string, entry: Partial<JournalEntry>): Promise<string> {
  if (!userId) throw new Error('User is not authenticated.');
  const entryId = entry.id || `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);

  const payload: JournalEntry = {
    id: entryId,
    userId,
    rawContent: entry.rawContent || '',
    title: entry.title || (entry.rawContent ? entry.rawContent.slice(0, 40).trim() + (entry.rawContent.length > 40 ? '...' : '') : 'Untitled Memory'),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: entry.location,
    media: entry.media || [],
    aiInterpretation: entry.aiInterpretation,
    isFavorite: !!entry.isFavorite,
  };

  const cleanData = sanitizePayload(payload);
  await setDoc(entryRef, cleanData, { merge: true });
  return entryId;
}

export async function updateJournalAiMetadata(userId: string, entryId: string, aiInterpretation: any): Promise<void> {
  if (!userId || !entryId) throw new Error('Missing userId or entryId.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const clean = sanitizePayload({
    aiInterpretation,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(entryRef, clean);
}

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as JournalEntry);
  } catch (err) {
    // Fallback if composite index not yet built
    console.warn('Fallback fetching journal entries without ordering index:', err);
    const entriesRef = collection(db, 'users', userId, 'entries');
    const snapshot = await getDocs(entriesRef);
    const list = snapshot.docs.map(doc => doc.data() as JournalEntry);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('Missing userId or entryId.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

export async function deleteJournalAiMetadata(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('Missing userId or entryId.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(entryRef, {
    aiInterpretation: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAttachedMedia(userId: string, entryId: string, mediaId: string, currentMedia: any[]): Promise<void> {
  if (!userId || !entryId) throw new Error('Missing userId or entryId.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const updatedMedia = (currentMedia || []).filter(m => m.id !== mediaId);
  await updateDoc(entryRef, {
    media: sanitizePayload(updatedMedia),
    updatedAt: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// Full Account Data Export & Deletion (Privacy-First)
// -------------------------------------------------------------

export async function exportAllUserData(userId: string): Promise<{
  exportDate: string;
  userId: string;
  entries: JournalEntry[];
  openLoops: OpenLoopItem[];
  bookmarks: BookmarkItem[];
}> {
  if (!userId) throw new Error('User not authenticated');
  const [entries, openLoops, bookmarks] = await Promise.all([
    getJournalEntries(userId),
    getOpenLoops(userId),
    getBookmarks(userId),
  ]);
  return {
    exportDate: new Date().toISOString(),
    userId,
    entries,
    openLoops,
    bookmarks,
  };
}

export async function deleteAllUserData(userId: string): Promise<void> {
  if (!userId) throw new Error('User not authenticated');
  const [entries, openLoops, bookmarks] = await Promise.all([
    getJournalEntries(userId),
    getOpenLoops(userId),
    getBookmarks(userId),
  ]);
  const deletePromises = [
    ...entries.map(e => deleteDoc(doc(db, 'users', userId, 'entries', e.id))),
    ...openLoops.map(l => deleteDoc(doc(db, 'users', userId, 'openLoops', l.id))),
    ...bookmarks.map(b => deleteDoc(doc(db, 'users', userId, 'bookmarks', b.id))),
    deleteDoc(doc(db, 'users', userId)),
  ];
  await Promise.all(deletePromises);
}

// -------------------------------------------------------------
// Open Loops
// -------------------------------------------------------------

export async function saveOpenLoop(userId: string, loop: Partial<OpenLoopItem>): Promise<string> {
  if (!userId) throw new Error('User is not authenticated.');
  const loopId = loop.id || `loop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const loopRef = doc(db, 'users', userId, 'openLoops', loopId);

  const payload: OpenLoopItem = {
    id: loopId,
    title: loop.title || 'Untitled intention',
    status: loop.status || 'saved',
    sourceEntryId: loop.sourceEntryId,
    createdAt: loop.createdAt || new Date().toISOString(),
  };

  await setDoc(loopRef, sanitizePayload(payload), { merge: true });
  return loopId;
}

export async function getOpenLoops(userId: string): Promise<OpenLoopItem[]> {
  if (!userId) return [];
  try {
    const loopsRef = collection(db, 'users', userId, 'openLoops');
    const snapshot = await getDocs(loopsRef);
    return snapshot.docs.map(doc => doc.data() as OpenLoopItem);
  } catch (err) {
    console.error('Error getting open loops:', err);
    return [];
  }
}

export async function updateOpenLoopStatus(userId: string, loopId: string, status: OpenLoopItem['status']): Promise<void> {
  if (!userId || !loopId) return;
  const loopRef = doc(db, 'users', userId, 'openLoops', loopId);
  await updateDoc(loopRef, { status });
}

export async function deleteOpenLoop(userId: string, loopId: string): Promise<void> {
  if (!userId || !loopId) return;
  const loopRef = doc(db, 'users', userId, 'openLoops', loopId);
  await deleteDoc(loopRef);
}

// -------------------------------------------------------------
// Bookmarks ("Remember This")
// -------------------------------------------------------------

export async function saveBookmark(userId: string, item: Partial<BookmarkItem>): Promise<string> {
  if (!userId) throw new Error('User is not authenticated.');
  const bookmarkId = item.id || `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);

  const payload: BookmarkItem = {
    id: bookmarkId,
    userId,
    url: item.url || '',
    title: item.title || item.url || 'Untitled Resource',
    contentType: item.contentType || 'website',
    reasonForSaving: item.reasonForSaving || '',
    reactions: item.reactions || [],
    summary: item.summary || '',
    userReflection: item.userReflection || '',
    status: item.status || 'saved',
    createdAt: item.createdAt || new Date().toISOString(),
  };

  await setDoc(bookmarkRef, sanitizePayload(payload), { merge: true });
  return bookmarkId;
}

export async function getBookmarks(userId: string): Promise<BookmarkItem[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'bookmarks');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as BookmarkItem);
  } catch (err) {
    console.error('Error getting bookmarks:', err);
    return [];
  }
}

export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  if (!userId || !bookmarkId) return;
  const ref = doc(db, 'users', userId, 'bookmarks', bookmarkId);
  await deleteDoc(ref);
}

// -------------------------------------------------------------
// Seed Data Loader for Demonstration & Showcase
// -------------------------------------------------------------

export async function seedUserMemories(userId: string, sampleData: Array<Omit<JournalEntry, 'id' | 'userId'>>): Promise<JournalEntry[]> {
  if (!userId) throw new Error('User is not authenticated.');
  const createdEntries: JournalEntry[] = [];

  for (const sample of sampleData) {
    const entryId = `entry-seed-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
    const entryRef = doc(db, 'users', userId, 'entries', entryId);

    const payload: JournalEntry = {
      ...sample,
      id: entryId,
      userId,
    };

    // If entry includes open loops, sync them to the openLoops subcollection as well
    if (sample.aiInterpretation?.openLoops) {
      for (const loop of sample.aiInterpretation.openLoops) {
        await saveOpenLoop(userId, {
          title: loop.title,
          status: 'saved',
          sourceEntryId: entryId,
        });
      }
    }

    await setDoc(entryRef, sanitizePayload(payload), { merge: true });
    createdEntries.push(payload);
  }

  return createdEntries;
}
