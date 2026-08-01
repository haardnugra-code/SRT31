import React from 'react';
import { GraduationCap, RefreshCw, Menu } from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  activeTabTitle: string;
  config: AppConfig;
  isSyncing: boolean;
  onSync: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  config,
  isSyncing,
  onSync,
  onToggleMobileSidebar
}) => {
  const initials = (config.waliAsrama || "W A")
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-800 text-sm md:text-lg truncate">
            {activeTabTitle}
          </span>
          <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded flex-shrink-0">
            Asrama Mandiri
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold ${
            config.googleScriptUrl
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          } max-w-[150px] sm:max-w-none truncate`}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                config.googleScriptUrl ? 'bg-emerald-400' : 'bg-amber-400'
              } opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                config.googleScriptUrl ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="truncate">
            {config.googleScriptUrl
              ? 'Database Cloud Terhubung'
              : 'Mode Offline (Lokal)'}
          </span>
        </div>

        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-600' : ''}`} />
          <span className="hidden sm:inline">Sinkronisasi</span>
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300 text-xs">
            {initials}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-700 leading-none">
              {config.waliAsrama || 'Wali Asrama'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Admin Utama</p>
          </div>
        </div>
      </div>
    </header>
  );
};
