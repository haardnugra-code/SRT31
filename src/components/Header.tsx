import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Menu,
  User,
  LogOut,
  Wifi,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  ChevronRight, MapPin
} from 'lucide-react';
import { AppConfig } from '../types';
import { DataIntegrityReport } from '../utils/integrityVerifier';

interface HeaderProps {
  activeTabTitle: string;
  config: AppConfig;
  isSyncing: boolean;
  onSync: () => void;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
  userRole?: 'admin' | 'guru';
  connectionStatus?: 'online' | 'offline' | 'checking';
  printBranch?: 'palembang' | 'oki';
  onSetPrintBranch?: (branch: 'palembang' | 'oki') => void;
  lastPingTime?: string | null;
  lastPushTime?: string | null;
  lastSyncTime?: string | null;
  lastIntegrityReport?: DataIntegrityReport | null;
  onOpenIntegrityReport?: () => void;
  onCheckConnection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  config,
  isSyncing,
  onSync,
  onToggleMobileSidebar,
  onLogout,
  userRole = 'admin',
  connectionStatus = 'offline',
  printBranch = 'palembang',
  onSetPrintBranch,
  lastPingTime = null,
  lastPushTime = null,
  lastSyncTime = null,
  lastIntegrityReport = null,
  onOpenIntegrityReport,
  onCheckConnection
}) => {
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowConnectionDetails(false);
      }
    };
    if (showConnectionDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConnectionDetails]);

  const formattedSyncTime = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Belum pernah';

  const scriptUrlShort = config.googleScriptUrl
    ? `${config.googleScriptUrl.slice(0, 35)}...`
    : 'Belum dikonfigurasi';

  return (
    <header className="no-print app-header bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0 sticky top-0 z-20 shadow-xs">
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

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-Time Connection Status & Detailed Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowConnectionDetails((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border transition-all active:scale-95 cursor-pointer max-w-[170px] sm:max-w-none truncate shadow-xs ${
              connectionStatus === 'online'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : connectionStatus === 'checking'
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
            title="Klik untuk melihat rincian koneksi & riwayat push Google Sheet"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === 'online'
                    ? 'bg-emerald-400'
                    : connectionStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionStatus === 'online'
                    ? 'bg-emerald-600'
                    : connectionStatus === 'checking'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}
              ></span>
            </span>
            <span className="truncate">
              {connectionStatus === 'online'
                ? 'Sheet Online'
                : connectionStatus === 'checking'
                ? 'Memeriksa...'
                : 'Sheet Offline'}
            </span>
            {lastPingTime && connectionStatus === 'online' && (
              <span className="hidden lg:inline text-[9px] font-normal opacity-80 border-l border-emerald-300 pl-1.5">
                {lastPingTime}
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 flex-shrink-0" />
          </button>

          {/* Detailed Connection Popover */}
          {showConnectionDetails && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {connectionStatus === 'online' ? (
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Wifi className="w-4 h-4" />
                    </div>
                  ) : connectionStatus === 'checking' ? (
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                      <WifiOff className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Status Database Cloud</h4>
                    <p className="text-[11px] text-slate-500">Google Sheets / Apps Script</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    connectionStatus === 'online'
                      ? 'bg-emerald-100 text-emerald-800'
                      : connectionStatus === 'checking'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {connectionStatus === 'online' ? 'Terhubung' : connectionStatus === 'checking' ? 'Mengecek' : 'Terputus'}
                </span>
              </div>

              <div className="py-3 space-y-2.5">
                {/* 1. Last Data Push Timestamp */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <CloudUpload className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">Terakhir Push Data ke Sheet:</span>
                  </div>
                  <div className="pl-5">
                    {lastPushTime ? (
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {lastPushTime}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Tersimpan lokal & otomatis dipush saat ada perubahan data
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Last Ping Indicator */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">Waktu Respon / Ping Terakhir:</span>
                  </div>
                  <div className="pl-5">
                    <span className="font-medium text-slate-800 text-xs">
                      {lastPingTime ? `${lastPingTime} WIB` : 'Belum dicek'}
                    </span>
                  </div>
                </div>

                {/* 3. Last Full Sync Timestamp */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">Sinkronisasi Penuh Terakhir:</span>
                  </div>
                  <div className="pl-5">
                    <span className="font-medium text-slate-800 text-xs">
                      {formattedSyncTime}
                    </span>
                  </div>
                </div>

                {/* 4. Data Integrity Audit Status */}
                {lastIntegrityReport && (
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Audit Integritas Data Cloud:</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200/80 text-emerald-900">
                        {lastIntegrityReport.healthScore}% Valid
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 pl-5 leading-tight">
                      {lastIntegrityReport.totalRecordsChecked} entri diperiksa. 0 anomali shadow data.
                    </p>
                    {onOpenIntegrityReport && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowConnectionDetails(false);
                          onOpenIntegrityReport();
                        }}
                        className="mt-1.5 ml-5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                      >
                        <span>Lihat Rincian Laporan Audit</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* 5. Google Script Backend URL */}
                <div className="px-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-600">Endpoint: </span>
                  <span className="font-mono text-[10px] text-slate-700 break-all">{scriptUrlShort}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onCheckConnection) onCheckConnection();
                  }}
                  className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Wifi className="w-3 h-3" />
                  <span>Tes Ping Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConnectionDetails(false);
                    onSync();
                  }}
                  disabled={isSyncing}
                  className="flex-1 py-1.5 px-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sinkron Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Integrity Badge & Modal Opener */}
        {lastIntegrityReport && onOpenIntegrityReport && (
          <button
            type="button"
            onClick={onOpenIntegrityReport}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Klik untuk melihat Laporan Verifikasi Integritas Data Cloud"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden lg:inline">Integritas:</span>
            <span>{lastIntegrityReport.healthScore}% Valid</span>
          </button>
        )}
        {onSetPrintBranch && (
          <div className="relative hidden sm:flex">
            <button 
              type="button" 
              onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">{printBranch === "palembang" ? "Cetak: Palembang" : "Cetak: SRT 01 OKI"}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPrintMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsPrintMenuOpen(false)}
                />
                <div className="absolute right-0 top-full pt-1.5 w-56 z-50 animate-in fade-in zoom-in duration-100">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <button 
                      onClick={() => {
                        onSetPrintBranch("palembang");
                        setIsPrintMenuOpen(false);
                      }} 
                      className={`w-full text-left px-3 py-2 text-[11px] font-semibold hover:bg-slate-50 transition-colors ${printBranch === "palembang" ? "bg-blue-50/50 text-blue-700" : "text-slate-700"}`}
                    >
                      SRT 31 Palembang (Default)
                    </button>
                    <button 
                      onClick={() => {
                        onSetPrintBranch("oki");
                        setIsPrintMenuOpen(false);
                      }} 
                      className={`w-full text-left px-3 py-2 text-[11px] font-semibold hover:bg-slate-50 transition-colors border-t border-slate-100 ${printBranch === "oki" ? "bg-blue-50/50 text-blue-700" : "text-slate-700"}`}
                    >
                      Sekolah Rakyat Terintegrasi 01 OKI
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
          title="Sinkronisasi Data Cloud"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-600' : ''}`} />
          <span className="hidden sm:inline">Sinkronisasi</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-slate-700 shadow-sm transition-all active:scale-95 group"
          title="Klik untuk Sign Out / Keluar"
        >
          <User className="w-3.5 h-3.5 text-slate-500 group-hover:hidden" />
          <LogOut className="w-3.5 h-3.5 text-red-600 hidden group-hover:inline-block" />
          <span>{userRole === 'guru' ? 'Guru Pengampu' : 'Wali Asuh'}</span>
        </button>
      </div>
    </header>
  );
};


