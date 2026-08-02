import React from 'react';
import { FileText, Info, HeartPulse, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student, Violation, Counseling, Leave, AppConfig, MedicalRecord } from '../types';
import { generateComprehensivePDF } from '../services/pdfGenerator';

interface RecapTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  medicalRecords?: MedicalRecord[];
  config: AppConfig;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const RecapTab: React.FC<RecapTabProps> = ({
  students,
  violations,
  counseling,
  leaves,
  medicalRecords = [],
  config,
  onShowToast
}) => {
  const sortedStudents = [...students].sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0));

  const handlePrintComprehensive = async () => {
    onShowToast('Mengekspor PDF...', 'Membentuk dokumen PDF multi-halaman resmi...', 'warning');
    await generateComprehensivePDF(students, violations, counseling, leaves, config, medicalRecords);
    onShowToast('PDF Berhasil Dicetak', 'Laporan multipage anti terpotong siap dibagikan.', 'success');
  };

  const sickLeaveCount = medicalRecords.filter(m => m.isSickLeave || m.status?.includes('Istirahat')).length;
  const activeCasesCount = medicalRecords.filter(m => m.status === 'Berobat Jalan' || m.status === 'Rawat Inap/Istirahat' || m.status === 'Dirujuk ke RS').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Rekapitulasi Laporan Bulanan (Multi-Page PDF)
          </h2>
          <p className="text-xs text-slate-500">
            Unduh berkas PDF formal komprehensif (Pelanggaran, Konseling, Izin & Rekam Medis UKS) tanpa terpotong untuk dilaporkan ke pihak Sekolah atau Kemensos RI.
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
            <h3 className="font-bold text-slate-800 text-sm">Rekapitulasi Kumulatif Asrama & Kesehatan</h3>
            <p className="text-[10px] text-slate-400">
              Total keseluruhan data historis yang akan disertakan dalam lembar PDF.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
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
            <div className="bg-emerald-50/50 p-3 sm:p-4 rounded-xl border border-emerald-100">
              <span className="block text-xl sm:text-2xl font-extrabold text-emerald-600">
                {leaves.length}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Izin Pulang</span>
            </div>
            <div className="bg-rose-50/50 p-3 sm:p-4 rounded-xl border border-rose-100">
              <span className="block text-xl sm:text-2xl font-extrabold text-rose-600">
                {medicalRecords.length}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Rekam Medis UKS</span>
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
                Laporan komprehensif kini mencakup 4 bagian: <strong>Pelanggaran, Konseling, Izin Kepulangan, dan Rekam Medis UKS</strong>.
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

      {/* Health / UKS Medical Summary Section */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ringkasan Rekam Medis & Kesehatan UKS</h3>
              <p className="text-[10px] text-slate-400">
                Laporan penanganan medis, riwayat keluhan sakit, dan status pemulihan siswa.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full font-bold border border-rose-200/60 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" /> Total: {medicalRecords.length} Pemeriksaan
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-200/60 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {activeCasesCount} Penanganan Aktif
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {sickLeaveCount} Izin Istirahat
            </span>
          </div>
        </div>

        {medicalRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Belum ada rekam medis yang dicatat dalam sistem. Silakan tambahkan di tab <strong>UKS / Rekam Medis</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Waktu Penanganan</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Gejala & Diagnosa</th>
                  <th className="p-3">Suhu / Vital Signs</th>
                  <th className="p-3">Tindakan & Obat</th>
                  <th className="p-3">Status Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicalRecords.slice(0, 10).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{m.date}</div>
                      <div className="text-[10px] text-slate-400">{m.time} WIB • {m.location}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                      {m.studentName}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-800">{m.symptoms || '-'}</div>
                      <div className="text-[10px] text-rose-600 font-semibold">Diagnosa: {m.diagnosis || '-'}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-600">
                      {m.temperature ? (
                        <span className={`font-bold ${parseFloat(m.temperature) >= 37.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {m.temperature}°C
                        </span>
                      ) : '-'}
                      {m.vitalSigns ? <div className="text-[10px] text-slate-400">{m.vitalSigns}</div> : null}
                    </td>
                    <td className="p-3 max-w-xs text-slate-600">
                      <div>{m.treatment || '-'}</div>
                      {m.officer && <div className="text-[10px] text-slate-400">Petugas: {m.officer}</div>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-block ${
                        m.status === 'Sembuh/Kembali KBM'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'Rawat Inap/Istirahat'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : m.status === 'Dirujuk ke RS'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {medicalRecords.length > 10 && (
              <div className="p-2.5 text-center text-[11px] text-slate-400 bg-slate-50/50 border-t border-slate-100">
                Menampilkan 10 dari {medicalRecords.length} catatan medis terbaru. Seluruh data akan dicetak lengkap pada PDF Multipage.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

