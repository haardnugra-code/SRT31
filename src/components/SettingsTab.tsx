import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Check,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
  Link as LinkIcon,
  Database,
  CheckCircle,
  HelpCircle,
  X,
  FileCode
} from 'lucide-react';
import { AppConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleAppsScriptCode';

interface SettingsTabProps {
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  lastSyncTime?: string | null;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
  onShowToast,
  lastSyncTime,
  onSync,
  isSyncing = false
}) => {
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(config.googleScriptUrl || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTime) return 'Belum pernah disinkronkan';
    try {
      const d = new Date(lastSyncTime);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (e) {
      return 'Belum pernah dilakukan';
    }
  }, [lastSyncTime]);

  const handleSaveUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = googleScriptUrl.trim();
    if (!cleanUrl) {
      onShowToast('Peringatan', 'URL Database Google Sheets tidak boleh kosong.', 'warning');
      return;
    }
    const updated: AppConfig = {
      ...config,
      googleScriptUrl: cleanUrl
    };
    onSaveConfig(updated);
    onShowToast('Database Tersimpan!', 'URL Database Google Sheets berhasil disimpan. Seluruh input data akan otomatis menyesuaikan ke sheet.', 'success');
  };

  const handleTestPing = async () => {
    const url = googleScriptUrl.trim();
    if (!url) {
      onShowToast('URL Kosong', 'Masukkan URL Google Apps Script Web App terlebih dahulu.', 'warning');
      return;
    }
    setIsTestingPing(true);
    const start = Date.now();
    try {
      const response = await fetch(`${url}?action=ping`, {
        method: 'GET'
      });
      const data = await response.json();
      const latency = Date.now() - start;
      setPingLatency(latency);
      if (data.status === 'success' || !data.status) {
        onShowToast('Database Terhubung (Online)', `Google Apps Script database merespon dalam ${latency} ms.`, 'success');
      } else {
        onShowToast('Respon Bermasalah', data.message || 'Script mengembalikan status error.', 'error');
      }
    } catch (err: any) {
      onShowToast('Gagal Terhubung', 'Tidak dapat menghubungi Web App Google Apps Script. Pastikan akses disetel ke "Siapa saja (Anyone)".', 'error');
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    onShowToast('Kode Disalin!', 'Seluruh kode Google Apps Script telah disalin ke clipboard.', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownloadScriptCode = () => {
    try {
      const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Code_Backend_Keasramaan_SR.gs';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast('File Diunduh', 'File Code_Backend_Keasramaan_SR.gs berhasil diunduh.', 'success');
    } catch (e) {
      onShowToast('Gagal Mengunduh', 'Terjadi kesalahan saat mengunduh file script.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database Tunggal Sistem</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Database Sheet Google
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Satu-satunya basis data resmi sistem. Setiap kali data diinput atau diubah di modul apa pun, sistem langsung otomatis menyesuaikan dan menyimpannya ke Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={isSyncing}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTestingPing ? 'Mengecek...' : 'Uji Koneksi (Ping)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Connection Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status Database</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
              {googleScriptUrl ? 'Terhubung (Online)' : 'Belum Dikonfigurasi'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sinkronisasi Terakhir</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
              {formattedLastSync}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Respon Server</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
              {pingLatency !== null ? `${pingLatency} ms` : 'Aktif (Siap Digunakan)'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Single Database Configuration Form */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Database Sheet Google</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan URL Web App Google Apps Script dari spreadsheet database Anda.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
            Penyimpanan Otomatis Aktif
          </span>
        </div>

        <form onSubmit={handleSaveUrl} className="space-y-4">
          <div className="relative">
            <input
              type="url"
              value={googleScriptUrl}
              onChange={(e) => setGoogleScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-inner"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 font-medium underline underline-offset-2 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Panduan & Kode Script (Code.gs)</span>
            </button>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer ml-auto"
            >
              <Save className="w-4 h-4" />
              <span>Simpan URL Database</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Penyesuaian Otomatis Info Box */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-emerald-950">
              Penyesuaian Data Real-Time Otomatis
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Setiap kali Anda menginput, mengubah, atau menghapus data pada modul mana pun (Data Siswa, Catatan Pelanggaran, Konseling BK, Izin Pulang, Jurnal Harian, UKS & Medis, Presensi RFID, Notula Rapat, dll.), sistem <strong>secara otomatis langsung menyesuaikan dan mencatat perubahan ke database Google Sheet Anda</strong>.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-800">
              <span className="bg-emerald-100/80 px-2.5 py-1 rounded-lg">✓ Input langsung tersimpan</span>
              <span className="bg-emerald-100/80 px-2.5 py-1 rounded-lg">✓ Sinkron dua arah jika sheet ada data</span>
              <span className="bg-emerald-100/80 px-2.5 py-1 rounded-lg">✓ Tanpa pengaturan rumit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Minimal Script & Guide Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Kode Google Apps Script (Code.gs)</h3>
                  <p className="text-xs text-slate-500">Salin atau unduh kode backend untuk spreadsheet baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-900">Langkah Pemasangan di Spreadsheet Baru:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Buka Google Spreadsheet baru.</li>
                <li>Klik menu <strong>Ekstensi</strong> → <strong>Apps Script</strong>.</li>
                <li>Hapus kode lama di file <code className="bg-slate-200 px-1 py-0.5 rounded">Code.gs</code> lalu tempel kode di bawah ini.</li>
                <li>Klik tombol <strong>Terapkan (Deploy)</strong> → <strong>Penerapan baru (New deployment)</strong>.</li>
                <li>Pilih jenis <strong>Aplikasi Web</strong>, pilih akses <strong>Siapa saja (Anyone)</strong>, lalu salin URL yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded">/exec</code>.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadScriptCode}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Code.gs</span>
              </button>
              <button
                type="button"
                onClick={handleCopyScriptCode}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
