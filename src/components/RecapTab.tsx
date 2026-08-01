import React from 'react';
import { FileText, Info } from 'lucide-react';
import { Student, Violation, Counseling, Leave, AppConfig } from '../types';
import { generateComprehensivePDF } from '../services/pdfGenerator';

interface RecapTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  config: AppConfig;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const RecapTab: React.FC<RecapTabProps> = ({
  students,
  violations,
  counseling,
  leaves,
  config,
  onShowToast
}) => {
  const sortedStudents = [...students].sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0));

  const handlePrintComprehensive = async () => {
    onShowToast('Mengekspor PDF...', 'Membentuk dokumen PDF multi-halaman resmi...', 'warning');
    await generateComprehensivePDF(students, violations, counseling, leaves, config);
    onShowToast('PDF Berhasil Dicetak', 'Laporan multipage anti terpotong siap dibagikan.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Rekapitulasi Laporan Bulanan (Multi-Page PDF)
          </h2>
          <p className="text-xs text-slate-500">
            Unduh berkas PDF formal komprehensif, multi-halaman tanpa terpotong untuk dilaporkan ke pihak Sekolah atau Kemensos RI.
          </p>
        </div>
        <button
          onClick={handlePrintComprehensive}
          className="w-full md:w-auto justify-center bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/15 transition-all active:scale-95"
        >
          <FileText className="w-4 h-4" /> Cetak Laporan PDF Resmi (Multipage)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Compliance Ranking */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Distribusi Kasus Per Siswa</h3>
            <p className="text-[10px] text-slate-400">Menghitung total poin kepatuhan siswa asrama.</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
            {sortedStudents.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{s.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    {s.class} • {s.dorm}
                  </p>
                </div>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-lg flex-shrink-0 ${
                    (s.violationCount || 0) > 3
                      ? 'bg-red-50 text-red-700'
                      : (s.violationCount || 0) > 0
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {s.violationCount || 0} Kasus
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Totals & Instructions */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Rekapitulasi Kumulatif Asrama</h3>
            <p className="text-[10px] text-slate-400">
              Total keseluruhan data historis yang akan disertakan dalam lembar PDF.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="bg-red-50/50 p-3 sm:p-4 rounded-xl border border-red-100">
              <span className="block text-xl sm:text-2xl font-extrabold text-red-600">
                {violations.length}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Pelanggaran</span>
            </div>
            <div className="bg-amber-50/50 p-3 sm:p-4 rounded-xl border border-amber-100">
              <span className="block text-xl sm:text-2xl font-extrabold text-amber-600">
                {counseling.length}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">BK/Konseling</span>
            </div>
            <div className="bg-green-50/50 p-3 sm:p-4 rounded-xl border border-green-100">
              <span className="block text-xl sm:text-2xl font-extrabold text-green-600">
                {leaves.length}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Izin Pulang</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" /> Petunjuk Sistem Cetak Anti Terpotong
            </h4>
            <ul className="space-y-2 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                Lembar Laporan menggunakan modul khusus <strong>AutoTable</strong> yang secara cerdas mendeteksi batas bawah kertas A4.
              </li>
              <li>
                Kop surat, alamat, dan identitas asrama diset agar hanya dicetak di <strong>Halaman Pertama</strong> saja guna kerapian dokumen.
              </li>
              <li>
                Anda dapat melakukan kustomisasi teks kop kiri/kanan dan penandatangan dokumen di tab <strong>Pengaturan Sistem</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
