import React, { useState } from 'react';
import {
  Monitor,
  Download,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Layers,
  Sparkles,
  Command,
  Maximize2,
  Printer,
  Save,
  Search,
  X,
  ArrowRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const { isInstallable, isInstalled, install, osName } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'electron' | 'shortcuts'>('pwa');
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      onShowToast?.(
        'Aplikasi Terpasang',
        'Sistem Keasramaan berhasil dipasang ke desktop komputer Anda!',
        'success'
      );
      onClose();
    } else {
      onShowToast?.(
        'Petunjuk Instalasi',
        'Silakan klik ikon komputer / instal di bilah alamat browser (URL bar) sebelah kanan.',
        'info'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Dark Slate Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 p-0.5 shadow-lg shadow-red-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Monitor className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Mode Desktop Standalone
                </span>
                {isInstalled && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terinstal
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Aplikasi Desktop Sistem Keasramaan
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gunakan aplikasi tanpa browser URL bar, hemat kuota dengan offline caching, dan akses cepat dari Desktop/Start Menu.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl mt-5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'pwa'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Instalasi 1-Klik (PWA Desktop)
            </button>
            <button
              onClick={() => setActiveTab('electron')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'electron'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Paket .EXE / Native Launcher
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'shortcuts'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Command className="w-3.5 h-3.5" />
              Pintasan Keyboard
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-slate-700 text-sm">
          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    Cara Termudah & Paling Direkomendasikan
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    Aplikasi ini mendukung teknologi Progressive Web App (PWA) resmi. Anda tidak perlu mengunduh file installer besar. Cukup 1 klik, aplikasi langsung muncul di Desktop komputer & Start Menu seperti software Windows/Mac bawaan.
                  </p>
                </div>
              </div>

              {/* Install Action Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                {isInstalled ? (
                  <div className="py-2 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-base">Aplikasi Sudah Terpasang di Komputer Anda</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Aplikasi saat ini sudah berjalan dalam mode desktop mandiri atau sudah terpasang di sistem operasi Anda.
                    </p>
                  </div>
                ) : (
                  <>
                    <h5 className="font-bold text-slate-900 text-base">Pasang Sekarang ke Komputer Anda</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Klik tombol di bawah ini untuk menambahkan ikon resmi Sistem Keasramaan ke Desktop dan Taskbar Anda.
                    </p>
                    <button
                      onClick={handleTriggerInstall}
                      disabled={installing}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 active:scale-95 transition inline-flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      {installing ? 'Memproses...' : 'Pasang Aplikasi Desktop Sekarang'}
                    </button>
                  </>
                )}
              </div>

              {/* Langkah Manual di Browser */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs tracking-wider uppercase text-slate-500">
                  Petunjuk Pemasangan Manual di Browser Komputer
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                        1
                      </span>
                      Google Chrome / Microsoft Edge
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Lihat bilah alamat (URL bar) di bagian atas kanan browser, klik ikon <strong>Komputer dengan tanda panah bawah (Install)</strong>, lalu pilih <strong>Instal</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px]">
                        2
                      </span>
                      Mode Jendela Standalone
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Setelah terpasang, jendela browser akan otomatis berganti menjadi jendela aplikasi desktop resmi tanpa tab dan tanpa bilah navigasi URL.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kelebihan Desktop */}
              <div className="pt-2 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <HardDrive className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <div className="font-bold text-xs text-slate-800">Bekerja Offline</div>
                    <div className="text-[10px] text-slate-500">Cache tersimpan otomatis</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Layers className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <div className="font-bold text-xs text-slate-800">Bebas Tab Browser</div>
                    <div className="text-[10px] text-slate-500">Tampilan fokus kerja</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <div className="font-bold text-xs text-slate-800">Auto-Update</div>
                    <div className="text-[10px] text-slate-500">Fitur selalu mutakhir</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs space-y-2 border border-slate-800">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Laptop className="w-4 h-4" />
                  Paket Desktop Mandiri (Electron Engine)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Bagi pengelola laboratorium komputer atau server lokal asrama yang ingin menjalankan aplikasi sebagai software native (.exe / Windows app), seluruh struktur konfigurasi Electron sudah kami siapkan di dalam repositori proyek ini!
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                  Cara Menjalankan Mode Desktop di Komputer Anda:
                </h5>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">
                      1. Ekspor / Download Proyek dari Pengaturan (Settings):
                    </div>
                    <p className="text-slate-600">
                      Unduh file ZIP proyek aplikasi ini ke laptop/komputer Anda dan ekstrak foldernya.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">
                      2. Klik Ganda File Peluncur (Launcher) Windows:
                    </div>
                    <p className="text-slate-600 mb-2">
                      Cukup klik ganda file berikut yang sudah kami sediakan:
                    </p>
                    <code className="block bg-slate-900 text-amber-300 p-2 rounded-lg font-mono text-[11px]">
                      run-desktop.bat
                    </code>
                    <p className="text-[11px] text-slate-500 mt-1">
                      (Untuk pengguna Mac/Linux, jalankan <code>./run-desktop.sh</code> di terminal)
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">
                      3. Atau Jalankan Lewat Terminal / Command Prompt:
                    </div>
                    <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                      npm run desktop
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pintasan keyboard cepat untuk mempercepat alur kerja pembina dan wali asrama di komputer:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Layar Penuh (Fullscreen)</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    F11
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Cetak Dokumen / Rapor</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    Ctrl + P
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Sinkronisasi / Simpan</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    Ctrl + S
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Cari Data Siswa / Presensi</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    Ctrl + F
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Tutup Dialog / Modal</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    Esc
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Muat Ulang Aplikasi</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono font-bold text-slate-700 text-[11px]">
                    Ctrl + R
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Operasi Terdeteksi: <strong className="text-slate-800 capitalize">{osName}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition"
            >
              Tutup
            </button>
            {!isInstalled && (
              <button
                onClick={handleTriggerInstall}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Instal di Desktop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
