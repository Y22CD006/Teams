"use client";

import { MessageSquare, Users, Calendar, Phone, Folder, Bell, Settings, Sun, Moon } from 'lucide-react';
import { User } from '@/lib/types';

interface SidebarNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUser: User;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SidebarNav = ({ activeView, onViewChange, currentUser, onOpenSettings, theme, onToggleTheme }: SidebarNavProps) => {
  const navItems = [
    { id: 'activity', label: 'Activity', icon: Bell, badge: 3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: 4 },
    { id: 'teams', label: 'Teams', icon: Users, badge: 0 },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 1 },
    { id: 'calls', label: 'Calls', icon: Phone, badge: 0 },
    { id: 'files', label: 'Files', icon: Folder, badge: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-rose-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div id="teams-sidebar-rail" className="w-[72px] bg-[#111827] border-r border-[#374151] flex flex-col items-center justify-between py-4 select-none flex-shrink-0 z-20 h-full">
      <div className="w-full flex flex-col items-center gap-2">
        <div 
          id="teams-logo-container" 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-900/40 mb-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
          onClick={() => onViewChange('activity')}
        >
          <span className="text-white font-extrabold text-sm tracking-wider font-sans">T</span>
        </div>

        <div className="w-full flex flex-col items-center gap-1.5 px-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center group transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#1F2937] text-[#6366F1]' 
                    : 'text-gray-400 hover:bg-[#1F2937]/70 hover:text-white'
                }`}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#6366F1] rounded-r-md" />
                )}
                <IconComponent className="w-5.5 h-5.5 transition-transform duration-150 group-active:scale-95" />
                {item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#6366F1] text-white font-bold text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border border-[#111827] shadow-sm">
                    {item.badge}
                  </span>
                )}
                <div className="absolute left-16 bg-[#1F2937] border border-[#374151] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap font-medium">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-3.5 px-2 mt-auto">
        <button
          id="sidebar-theme-toggle"
          onClick={onToggleTheme}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#1F2937] hover:text-white transition-all duration-200 group relative"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5.5 h-5.5 text-amber-400 hover:scale-110 transition-all duration-200" />
          ) : (
            <Moon className="w-5.5 h-5.5 text-indigo-500 hover:scale-110 transition-all duration-200" />
          )}
          <div className="absolute left-16 bg-[#1F2937] border border-[#374151] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap font-medium">
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </div>
        </button>

        <button
          id="sidebar-nav-settings"
          onClick={onOpenSettings}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#1F2937] hover:text-white transition-all duration-200 group relative ${
            activeView === 'settings' ? 'bg-[#1F2937] text-[#6366F1]' : ''
          }`}
          title="Settings"
        >
          <Settings className="w-5.5 h-5.5 group-hover:rotate-45 transition-transform duration-300" />
          <div className="absolute left-16 bg-[#1F2937] border border-[#374151] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap font-medium">
            Settings
          </div>
        </button>

        <div className="relative group cursor-pointer" onClick={onOpenSettings}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center border border-[#374151] shadow-md group-hover:ring-2 group-hover:ring-[#6366F1] transition-all duration-200">
            {currentUser.avatar}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111827] ${getStatusColor(currentUser.status)}`} />
          
          <div className="absolute left-16 bottom-0 bg-[#1F2937] border border-[#374151] text-white p-3 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 min-w-[200px] flex flex-col gap-1">
            <p className="font-semibold text-sm leading-tight text-white">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
            <div className="h-[1px] bg-[#374151] my-1.5" />
            <p className="text-[10px] text-indigo-400 font-medium italic truncate">
              {currentUser.customStatus || 'No status set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
