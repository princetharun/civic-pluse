import React from 'react';
import {
  Building2,
  Users,
  Compass,
  Bell,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe2,
} from 'lucide-react';
import { SupportedLanguage } from '../types';

interface NavbarProps {
  currentRole: 'citizen' | 'policymaker';
  onRoleChange: (role: 'citizen' | 'policymaker') => void;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  hasGeminiKey: boolean;
  userEmail: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  selectedLanguage,
  onLanguageChange,
  unreadNotificationsCount,
  onOpenNotifications,
  hasGeminiKey,
  userEmail,
}) => {
  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Civic<span className="text-blue-600">Pulse</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700 rounded-md">
                  AI Platform
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium hidden md:block">
                Multilingual Citizen Infrastructure Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Role Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onRoleChange('citizen')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentRole === 'citizen'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={() => onRoleChange('policymaker')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentRole === 'policymaker'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Policymaker Portal</span>
            </button>
          </div>

          {/* Right Controls: Language, Notifications, Server Status, User */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
              <Globe2 className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <select
                aria-label="Select portal language"
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.label})
                  </option>
                ))}
              </select>
            </div>

            {/* AI Status Pill */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                hasGeminiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                hasGeminiKey
                  ? 'Gemini 3.6 Flash Server Model Connected'
                  : 'Gemini Key Pending - Using Local NLP Engine'
              }
            >
              <Sparkles className="w-3 h-3" />
              <span>{hasGeminiKey ? 'Gemini 3.6 Active' : 'Heuristic NLP'}</span>
            </div>

            {/* Citizen Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="View Citizen Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Identity Chip */}
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentRole === 'policymaker' ? 'PO' : 'CZ'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                  {currentRole === 'policymaker' ? 'Zonal Officer' : 'Citizen Member'}
                </div>
                <div className="text-[10px] text-slate-600 truncate max-w-[130px]">
                  {userEmail}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
