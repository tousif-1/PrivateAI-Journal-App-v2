import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, type FirebaseUser } from './lib/firebase';
import { syncUserProfile, getJournalEntries, seedUserMemories } from './lib/firestoreService';
import { SAMPLE_MEMORIES_DATA } from './data/seedMemories';
import { Sparkles, Database, Loader2, Check } from 'lucide-react';
import type { JournalEntry, UserProfile } from './types';

import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TimelineView } from './components/TimelineView';
import { AskMemoryView } from './components/AskMemoryView';
import { LifeMapView } from './components/LifeMapView';
import { OpenLoopsView } from './components/OpenLoopsView';
import { BookmarksView } from './components/BookmarksView';
import { ReflectionsView } from './components/ReflectionsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { WalkthroughModal } from './components/WalkthroughModal';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { EmailRecallModal } from './components/EmailRecallModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App navigation state
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Modals state
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureInitialMode, setCaptureInitialMode] = useState<'write' | 'speak' | 'photo' | 'video' | 'location'>('write');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isEmailRecallOpen, setIsEmailRecallOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessNotice, setSeedSuccessNotice] = useState<string | null>(null);

  // Seed sample memories to populate timeline, map, loops, and review
  const handleSeedSampleMemories = async () => {
    if (!currentUser) return;
    setIsSeeding(true);
    setSeedSuccessNotice(null);
    try {
      const created = await seedUserMemories(currentUser.uid, SAMPLE_MEMORIES_DATA);
      setEntries((prev) => [...created, ...prev]);
      setSeedSuccessNotice(`Successfully loaded ${created.length} rich sample memories across Goa, Kyoto, Swiss Alps, and more!`);
      setTimeout(() => setSeedSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('Failed to seed memories:', err);
      alert('Could not seed memories: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSeeding(false);
    }
  };

  // Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          photoURL: firebaseUser.photoURL,
        };
        setCurrentUser(userProfile);
        try {
          await syncUserProfile(userProfile);
        } catch (e) {
          console.warn('Profile sync notice:', e);
        }
        fetchEntries(firebaseUser.uid);
      } else {
        setCurrentUser(null);
        setEntries([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchEntries = async (userId: string) => {
    setIsLoadingEntries(true);
    try {
      const data = await getJournalEntries(userId);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Failed to complete Google Sign-In.');
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setActiveTab('timeline');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleOpenCapture = (mode: 'write' | 'speak' | 'photo' | 'video' | 'location' = 'write') => {
    setCaptureInitialMode(mode);
    setIsCaptureOpen(true);
  };

  const handleEntrySaved = (newEntry: JournalEntry) => {
    setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
  };

  const handleEntryUpdated = (updated: JournalEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEntry && selectedEntry.id === updated.id) {
      setSelectedEntry(updated);
    }
  };

  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedEntry && selectedEntry.id === deletedId) {
      setSelectedEntry(null);
    }
  };

  const handleExportData = () => {
    if (!currentUser) return;
    const exportPayload = {
      user: currentUser,
      exportedAt: new Date().toISOString(),
      entriesCount: entries.length,
      entries: entries.map((e) => ({
        id: e.id,
        createdAt: e.createdAt,
        title: e.title,
        location: e.location,
        rawContent: e.rawContent,
        aiInterpretation: e.aiInterpretation,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_memory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen text-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin shadow-md shadow-indigo-100" />
        <p className="text-xs font-medium text-slate-600 font-sans tracking-wide">Connecting to your secure memory vault...</p>
      </div>
    );
  }

  // Unauthenticated -> Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen text-slate-800 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Top Sticky Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCapture={() => handleOpenCapture('write')}
        onSignOut={handleSignOut}
        onExportData={handleExportData}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onOpenEmailRecall={() => setIsEmailRecallOpen(true)}
        entryCount={entries.length}
      />

      {/* Main Dynamic Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Demonstration & Data Population Banner (When few or no entries) */}
        {entries.length <= 3 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-indigo-50/90 via-purple-50/70 to-teal-50/80 border border-indigo-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Populate Meaningful Showcase Memories
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Showcase Data
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Add 7 rich, authentic memories across Goa, Kyoto, and the Swiss Alps with photos, GPS coordinates, reflections, and open loops.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                id="btn-seed-memories"
                disabled={isSeeding}
                onClick={handleSeedSampleMemories}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Load Meaningful Memories</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success toast notification when seeded */}
        {seedSuccessNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{seedSuccessNotice}</span>
          </div>
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenCapture={handleOpenCapture}
          />
        )}

        {activeTab === 'ask' && (
          <AskMemoryView
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
          />
        )}

        {activeTab === 'map' && (
          <LifeMapView
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
          />
        )}

        {activeTab === 'loops' && (
          <OpenLoopsView
            userId={currentUser.uid}
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksView userId={currentUser.uid} />
        )}

        {activeTab === 'review' && (
          <ReflectionsView
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            userEmail={currentUser.email || 'tousifahamedan@gmail.com'}
            onOpenEmailModal={() => setIsEmailRecallOpen(true)}
          />
        )}
      </main>

      {/* Capture Modal */}
      {isCaptureOpen && (
        <QuickCaptureModal
          userId={currentUser.uid}
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
          onEntrySaved={handleEntrySaved}
          initialMode={captureInitialMode}
        />
      )}

      {/* Email Recall Modal */}
      <EmailRecallModal
        isOpen={isEmailRecallOpen}
        onClose={() => setIsEmailRecallOpen(false)}
        entries={entries}
        userEmail={currentUser.email || 'tousifahamedan@gmail.com'}
      />

      {/* Entry Detail & Reflection Modal */}
      {selectedEntry && (
        <EntryDetailModal
          userId={currentUser.uid}
          entry={selectedEntry}
          allEntries={entries}
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEntryUpdated={handleEntryUpdated}
          onEntryDeleted={handleEntryDeleted}
        />
      )}

      {/* Interactive Verification Walkthrough Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      {/* Privacy, Sovereignty & Data Vault Modal */}
      {currentUser && (
        <PrivacySettingsModal
          user={currentUser}
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          entries={entries}
          onSeedSampleData={handleSeedSampleMemories}
          onAccountPurged={() => {
            setIsPrivacyModalOpen(false);
            setEntries([]);
            setSelectedEntry(null);
            handleSignOut();
          }}
        />
      )}

      {/* Subtle Persistent Footer */}
      <footer className="border-t border-white/40 py-4 text-center text-xs text-slate-500 bg-white/20 backdrop-blur-md">
        Personal Memory &bull; Private & User-Owned &bull; Raw text inviolable &bull; Powered by Gemini
      </footer>

    </div>
  );
}

export default App;
