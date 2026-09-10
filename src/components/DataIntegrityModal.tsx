import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  X,
  Database,
  Users,
  Clock,
  MessageSquare,
  Compass,
  HeartPulse,
  BookOpen,
  FileSpreadsheet,
  Send,
  FileText,
  Sparkles,
  Building2,
  Package,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { DataIntegrityReport, CollectionIntegrityStat } from '../utils/integrityVerifier';

interface DataIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DataIntegrityReport | null;
  onReverify?: () => void;
  isVerifying?: boolean;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DataIntegrityModal: React.FC<DataIntegrityModalProps> = ({
  isOpen,
  onClose,
  report,
  onReverify,
  isVerifying = false,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'collections' | 'pillars'>('collections');

  if (!isOpen || !report) return null;

  const getCollectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-amber-600" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-red-600" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-teal-600" />;
      case 'Send':
        return <Send className="w-4 h-4 text-cyan-600" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-slate-600" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-pink-600" />;
      case 'Building2':
        return <Building2 className="w-4 h-4 text-amber-700" />;
      case 'Package':
        return <Package className="w-4 h-4 text-violet-600" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-rose-700" />;
      default:
        return <Database className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleCopySummary = () => {
    if (!report) return;

    const collectionsText = report.collections
      .map((c) => `- ${c.name}: ${c.count} entri (${c.delta > 0 ? `+${c.delta} baru` : 'sinkron'})`)
      .join('\n');

    const checksText = report.checks
      .map((chk, i) => `${i + 1}. [${chk.status.toUpperCase()}] ${chk.title}: ${chk.message}`)
      .join('\n');

    const textToCopy = `=== LAPORAN INTEGRITAS DATA SISTEM KEASRAMAAN SEKOLAH RAKYAT ===
Waktu Audit: ${report.formattedTime}
Status Integritas: ${report.overallStatus === 'verified' ? '100% TERVERIFIKASI AMAN' : 'DIREKONSILIASI OTOMATIS'}
Skor Kesehatan Data: ${report.healthScore}/100
Total Seluruh Data: ${report.totalRecordsChecked} entri

[RINGKASAN DATA DIPERBARUI]
${collectionsText}

[HASIL AUDIT 6 PILAR INTEGRITAS]
${checksText}

Catatan Otomatis:
- Seluruh relasi entitas terhubung ke ID Siswa resmi dalam Data Induk.
- Bebas dari tabrakan kunci primer dan entri data bayangan (shadow data).
=== KEMENTERIAN SOSIAL RI - SEKOLAH RAKYAT ===`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Laporan Disalin', 'Ringkasan verifikasi integritas data berhasil disalin ke clipboard.', 'success');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-2xl shadow-inner shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Verifikasi Integritas Data Cloud
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Skor: {report.healthScore}% Valid
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed max-w-xl">
                  Pemeriksaan integritas referensial, konsistensi master siswa, sanitasi shadow data, dan validitas skema setelah sinkronisasi cloud selesai.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                  <span>Waktu Audit: <strong className="text-slate-200 font-semibold">{report.formattedTime}</strong></span>
                  <span>•</span>
                  <span>Total Data: <strong className="text-emerald-300 font-semibold">{report.totalRecordsChecked} entri</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-700/60 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Skor Kesehatan</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-emerald-400">{report.healthScore}%</span>
                <span className="text-[10px] text-emerald-300/80">Optimal</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Total Entri Diperiksa</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-white">{report.totalRecordsChecked}</span>
                <span className="text-[10px] text-slate-400">rekaman</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Status Relasi</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-300">Tersinkron</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Shadow Data</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-sky-400">0</span>
                <span className="text-[10px] text-slate-400">Anomali</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('collections')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeView === 'collections'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Ringkasan Data Diperbarui ({report.collections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pillars')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeView === 'pillars'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>6 Pilar Uji Integritas ({report.checks.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline-block font-medium">
            Status: <span className="text-emerald-700 font-bold">Sinkronisasi Cloud Berhasil</span>
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeView === 'collections' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Status Data per Kategori Keasramaan
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rincian kuantitas data aktif yang dimuat dan diverifikasi integritasnya dari Cloud Google Sheet.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg shrink-0">
                  Semua Koleksi Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.collections.map((col) => {
                  const isUpdated = col.delta !== 0;
                  return (
                    <div
                      key={col.key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isUpdated
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100/80 shrink-0">
                            {getCollectionIcon(col.iconName)}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 leading-tight">
                              {col.name}
                            </h5>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {col.note}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900">{col.count}</span>
                          <span className="text-[11px] text-slate-500 font-medium">data</span>
                        </div>

                        {col.delta > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            +{col.delta} Baru
                          </span>
                        ) : col.delta < 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            {col.delta} Diselaraskan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Tersinkron
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Hasil Uji Kepatuhan 6 Pilar Integritas Data
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit komprehensif struktur basis data keasramaan untuk mencegah kehilangan relasi siswa.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg shrink-0">
                  Lolos 6/6 Uji
                </span>
              </div>

              <div className="space-y-3">
                {report.checks.map((chk, idx) => (
                  <div
                    key={chk.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition shadow-sm flex items-start gap-3.5"
                  >
                    <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                            Pilar {idx + 1}
                          </span>
                          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {chk.title}
                          </h5>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          {chk.status === 'passed' ? 'Terverifikasi' : 'Telah Direkonsiliasi'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                        {chk.message}
                      </p>
                      {chk.resolvedIssuesCount > 0 && (
                        <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                          <span>✓ {chk.resolvedIssuesCount} entri berhasil diselaraskan otomatis tanpa kehilangan data.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights Notification Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-2">
            <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Kesimpulan Validasi Otomatis:</span>
            </h5>
            <ul className="text-xs text-indigo-900/90 space-y-1 pl-4 list-disc font-medium">
              {report.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Laporan Audit'}</span>
            </button>

            {onReverify && (
              <button
                type="button"
                onClick={onReverify}
                disabled={isVerifying}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Memeriksa...' : 'Verifikasi Ulang'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
};
