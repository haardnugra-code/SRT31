import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  CheckCircle2,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
  Keyboard,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DesktopInstallModal } from './DesktopInstallModal';

interface DesktopHeaderBarProps {
  onShowToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DesktopHeaderBar: React.FC<DesktopHeaderBarProps> = ({ onShowToast }) => {
  const { isInstallable, isInstalled, isDesktop, install, isOnline } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Monitor fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(zoomLevel + delta, 80), 130);
    setZoomLevel(newZoom);
    // Apply zoom on body or root container
    (document.body.style as any).zoom = `${newZoom}%`;
  };

  const resetZoom = () => {
    setZoomLevel(100);
    (document.body.style as any).zoom = '100%';
  };

  return (
    <>
      {/* Offline Status Warning Banner if disconnected */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse text-amber-200" />
            <span>
              Mode Offline Aktif — Anda tetap dapat menginput data, presensi, dan melihat rapor. Data tersimpan aman di komputer lokal Anda.
            </span>
          </div>
          <span className="text-[11px] bg-amber-700/60 px-2 py-0.5 rounded-full border border-amber-400/30">
            Database Lokal Aktif
          </span>
        </div>
      )}

      {/* Desktop Controller Component */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
          title={isFullscreen ? 'Keluar Layar Penuh (F11)' : 'Layar Penuh (F11)'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-400" /> : <Maximize className="w-3.5 h-3.5 text-amber-400" />}
          <span className="hidden xl:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</span>
        </button>

        {/* Zoom Controls on Large Desktops */}
        {zoomLevel !== 100 && (
          <button
            onClick={resetZoom}
            className="hidden lg:flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
            title="Reset Zoom ke 100%"
          >
            <RotateCcw className="w-3 h-3" />
            {zoomLevel}%
          </button>
        )}

        {/* Desktop Application Action */}
        {isInstalled ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/80 transition shadow-sm"
            title="Aplikasi berjalan dalam mode desktop mandiri"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mode Desktop</span>
          </button>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md shadow-red-500/20 active:scale-95 transition cursor-pointer"
            title="Pasang aplikasi ke Desktop komputer Anda"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang di Desktop</span>
          </button>
        )}

        {/* Shortcut Help Icon */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
          title="Pintasan Keyboard & Info Desktop"
        >
          <Keyboard className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Desktop Installation Guide & Shortcut Modal */}
      <DesktopInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShowToast={onShowToast}
      />
    </>
  );
};
