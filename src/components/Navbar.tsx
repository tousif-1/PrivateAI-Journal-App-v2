import React from 'react';
import { 
  BookOpen, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Bookmark, 
  Sparkles, 
  Plus, 
  LogOut, 
  Download, 
  ShieldCheck,
  Compass,
  Mail,
  Layers
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCapture: () => void;
  onSignOut: () => void;
  onExportData: () => void;
  onOpenPrivacy: () => void;
  onOpenWalkthrough: () => void;
  onOpenEmailRecall?: () => void;
  onOpenPresentation?: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenCapture,
  onSignOut,
  onExportData,
  onOpenPrivacy,
  onOpenWalkthrough,
  onOpenEmailRecall,
  onOpenPresentation,
  entryCount,
}) => {
  const tabs = [
    { id: 'timeline', label: 'Memories', icon: BookOpen, badge: entryCount > 0 ? entryCount : null },
    { id: 'ask', label: 'Ask My Journal', icon: Search },
    { id: 'map', label: 'Life Map', icon: MapPin },
    { id: 'loops', label: 'Open Loops', icon: CheckCircle2 },
    { id: 'bookmarks', label: 'Remember This', icon: Bookmark },
    { id: 'review', label: 'Life Review', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 text-slate-800 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-2 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('timeline')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-800 whitespace-nowrap">
                Private Memories
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1 font-medium whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Private &amp; User-Owned</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/60 shadow-2xs shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden text-[11px]">{tab.label.split(' ')[0]}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs and User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-walkthrough"
              onClick={onOpenWalkthrough}
              title="Verification Checklist & Test Walkthroughs"
              className="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-xl border border-slate-200/70 hover:border-indigo-200 bg-white/60 backdrop-blur-md transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Test Cases</span>
            </button>

            <button
              id="btn-privacy"
              onClick={onOpenPrivacy}
              title="Privacy settings, data sovereignty, & vault export"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200/70 hover:border-emerald-300 bg-white/60 backdrop-blur-md transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Privacy &amp; Export</span>
            </button>

            {onOpenPresentation && (
              <button
                id="btn-nav-presentation"
                onClick={onOpenPresentation}
                title="Interactive Project Presentation & Architecture Deck"
                className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 px-2 sm:px-2.5 py-1.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/70 backdrop-blur-md transition-all shadow-xs font-semibold"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Project Deck</span>
              </button>
            )}

            {onOpenEmailRecall && (
              <button
                id="btn-nav-email-recall"
                onClick={onOpenEmailRecall}
                title="Email Recall Digests &amp; Memories of the Year"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-700 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 bg-white/60 backdrop-blur-md transition-all shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Email Recalls</span>
              </button>
            )}

            <button
              id="btn-new-memory"
              onClick={onOpenCapture}
              title="Capture a new memory"
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-sm shadow-indigo-200 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">New Capture</span>
            </button>

            {/* Profile Avatar / Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 object-cover shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-xs shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button
                id="btn-signout"
                onClick={onSignOut}
                title="Sign out securely"
                className="text-slate-400 hover:text-red-500 p-1 sm:p-1.5 rounded-xl hover:bg-red-50 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-white/40 overflow-x-auto gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
