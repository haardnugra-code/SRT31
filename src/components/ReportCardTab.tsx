import React, { useState, useEffect } from 'react';
import { Wand2, Printer, ShieldAlert, Save, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Student, Violation, ReportCardData, AppConfig } from '../types';
import { RAPOR_STRUCTURE, printReportCardPDF } from '../services/pdfGenerator';

interface ReportCardTabProps {
  students: Student[];
  violations: Violation[];
  reports: Record<string, ReportCardData>;
  config: AppConfig;
  onSaveReport: (studentId: string, data: ReportCardData) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const ReportCardTab: React.FC<ReportCardTabProps> = ({
  students,
  violations,
  reports,
  config,
  onSaveReport,
  onShowToast,
  onAskConfirm
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [customCaretaker, setCustomCaretaker] = useState<string>('');
  const [customCaretakerNip, setCustomCaretakerNip] = useState<string>('');
  const [specialNote, setSpecialNote] = useState<string>('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(config.semester || 'Genap');
  const [academicYear, setAcademicYear] = useState<string>(config.academicYear || '2025/2026');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const [grades, setGrades] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const student = students.find((s) => String(s.id) === String(selectedStudentId));
  const studentViolations = violations.filter((v) => String(v.studentId) === String(selectedStudentId));

  // Load existing report data for selected student
  useEffect(() => {
    if (!selectedStudentId) return;

    if (student) {
      setCustomCaretaker(student.caretaker || '');
      const foundWali = config.waliAsuhList.find((w) => w.split('|')[0].trim() === student.caretaker);
      if (foundWali && foundWali.split('|')[1]) {
        setCustomCaretakerNip(foundWali.split('|')[1].trim());
      } else {
        setCustomCaretakerNip('');
      }
    }

    const rep = reports[selectedStudentId];
    if (rep) {
      setGrades(rep.grades || {});
      setDescriptions(rep.descriptions || {});
      setSpecialNote(rep.specialNote || '');
      if (rep.customCaretaker) setCustomCaretaker(rep.customCaretaker);
      if (rep.customCaretakerNip) setCustomCaretakerNip(rep.customCaretakerNip);
      if (rep.semester) setSemester(rep.semester);
      else setSemester(config.semester || 'Genap');
      if (rep.academicYear) setAcademicYear(rep.academicYear);
      else setAcademicYear(config.academicYear || '2025/2026');
    } else {
      setGrades({});
      setDescriptions({});
      setSpecialNote('');
      setSemester(config.semester || 'Genap');
      setAcademicYear(config.academicYear || '2025/2026');
    }
  }, [selectedStudentId, reports, student, config]);

  const toggleAccordion = (catKey: string) => {
    setOpenAccordions((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handleGradeChange = (catKey: string, indIdx: number, indName: string, pred: string) => {
    const key = `${catKey}_${indIdx}`;
    setGrades((prev) => ({ ...prev, [key]: pred }));

    let phrase = '';
    switch (pred) {
      case 'SB':
        phrase = `Sangat istimewa dan konsisten menunjukkan kemajuan luar biasa dalam aspek ${indName.toLowerCase()}.`;
        break;
      case 'B':
        phrase = `Sudah berkembang dengan baik, stabil, dan mampu menerapkan perilaku positif terkait ${indName.toLowerCase()}.`;
        break;
      case 'C':
        phrase = `Perkembangan cukup memadai, namun masih membutuhkan pengingat berkala untuk asimilasi ${indName.toLowerCase()}.`;
        break;
      case 'PB':
        phrase = `Membutuhkan asuhan intensif dan pembinaan langsung agar mampu mengasimilasi aspek ${indName.toLowerCase()}.`;
        break;
      default:
        phrase = '';
    }

    setDescriptions((prev) => ({ ...prev, [key]: phrase }));
  };

  const handleDescriptionChange = (catKey: string, indIdx: number, text: string) => {
    const key = `${catKey}_${indIdx}`;
    setDescriptions((prev) => ({ ...prev, [key]: text }));
  };

  const handleAutoFill = () => {
    const newGrades: Record<string, string> = {};
    const newDescs: Record<string, string> = {};

    RAPOR_STRUCTURE.forEach((cat) => {
      cat.indicators.forEach((ind, idx) => {
        const key = `${cat.key}_${idx}`;
        const rand = Math.random();
        let pred = 'B';
        if (rand > 0.6) pred = 'SB';
        else if (rand < 0.08) pred = 'C';

        newGrades[key] = pred;
        let phrase = '';
        if (pred === 'SB')
          phrase = `Sangat istimewa dan konsisten menunjukkan kemajuan luar biasa dalam aspek ${ind.toLowerCase()}.`;
        else if (pred === 'B')
          phrase = `Sudah berkembang dengan baik, stabil, dan mampu menerapkan perilaku positif terkait ${ind.toLowerCase()}.`;
        else phrase = `Perkembangan cukup memadai, namun masih membutuhkan pengingat berkala untuk asimilasi ${ind.toLowerCase()}.`;

        newDescs[key] = phrase;
      });
    });

    setGrades(newGrades);
    setDescriptions(newDescs);
    setSpecialNote(
      'Anak asuh menunjukkan progres moral yang sangat menggembirakan di dalam lingkungan asrama. Mampu beradaptasi secara rukun, rajin beribadah serta selalu memelihara kebersihan lingkungan kamarnya bersama anak asuh lainnya.'
    );
    onShowToast('Auto-Fill Selesai', 'Isian default SB/B di-generate untuk seluruh indikator.', 'warning');
  };

  const handleSave = async () => {
    if (!selectedStudentId) {
      onShowToast('Pilih Siswa', 'Silakan tentukan nama siswa asrama terlebih dahulu.', 'warning');
      return;
    }

    const reportData: ReportCardData = {
      grades,
      descriptions,
      specialNote,
      customCaretaker,
      customCaretakerNip,
      semester,
      academicYear
    };

    onSaveReport(selectedStudentId, reportData);
    onShowToast('Rapor Disimpan', 'Seluruh lembar evaluasi rapor keasramaan berhasil disimpan.', 'success');

    const printNow = await onAskConfirm(
      'Cetak Rapor Saat Ini?',
      'Data Rapor siswa telah berhasil disimpan. Apakah Anda ingin langsung mencetak dokumen PDF Rapor ini sekarang?'
    );
    if (printNow && student) {
      printReportCardPDF(student, reportData, violations, config);
    }
  };

  const handlePrintPDF = () => {
    if (!selectedStudentId || !student) return;
    const reportData: ReportCardData = {
      grades,
      descriptions,
      specialNote,
      customCaretaker,
      customCaretakerNip,
      semester,
      academicYear
    };

    if (Object.keys(grades).length === 0) {
      onShowToast('Data Kosong', 'Silakan isi dan simpan terlebih dahulu draf rapor siswa bersangkutan.', 'error');
      return;
    }

    printReportCardPDF(student, reportData, violations, config);
  };

  const isFilled = reports[selectedStudentId] && Object.keys(reports[selectedStudentId].grades || {}).length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Rapor Keasramaan Evaluasi Perkembangan Anak Asuh
          </h2>
          <p className="text-xs text-slate-500">
            Evaluasi perkembangan karakter asrama anak asuh Sekolah Rakyat Terintegrasi 31 Palembang.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto text-center justify-center">
          <button
            onClick={handleAutoFill}
            className="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-3 rounded-lg shadow transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-4 h-4" /> Isi Otomatis
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-lg shadow transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Cetak Rapor
          </button>
        </div>
      </div>

      {/* Selection & Caretaker Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Pilih Peserta Didik
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class} - {s.dorm})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-slate-800"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-slate-800"
              placeholder="e.g. 2025/2026"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Nama Wali Asuh
            </label>
            <input
              type="text"
              value={customCaretaker}
              onChange={(e) => setCustomCaretaker(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="Nama Wali Asuh..."
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              NIP Wali Asuh
            </label>
            <input
              type="text"
              value={customCaretakerNip}
              onChange={(e) => setCustomCaretakerNip(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="NIP Wali Asuh..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div>
            Nama Sekolah: <strong className="text-slate-700">SRT 31 Palembang</strong>
          </div>
          <div>
            Alamat: <strong className="text-slate-700">Jl. Komp Sosial Km 5</strong>
          </div>
          <div>
            Tahun Ajaran: <strong className="text-slate-700">Semester {semester} ({academicYear})</strong>
          </div>
          <div>
            Status Pengisian:{' '}
            <span
              className={`px-2 py-0.5 font-bold rounded ${
                isFilled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {isFilled ? 'Terisi' : 'Kosong'}
            </span>
          </div>
        </div>
      </div>

      {/* Violation History Widget */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" /> Evaluasi Riwayat Kedisiplinan & Pelanggaran
        </h3>
        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
          {studentViolations.length === 0 ? (
            <div>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Catatan Bersih
              </span>
              <p className="mt-1 text-[11px] text-slate-500">
                Anak asuh terpuji, tidak memiliki riwayat pelanggaran tata tertib asrama pada semester ini.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-2 font-bold text-red-700 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Terdeteksi {studentViolations.length} Kasus Pelanggaran:
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {studentViolations.map((v) => (
                  <div key={v.id} className="border-b border-slate-200/60 pb-2 mb-2 last:border-none last:pb-0 last:mb-0">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>
                        Tingkat {v.level} • {v.violation}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{v.date}</span>
                    </div>
                    {v.note && <p className="text-[10px] text-slate-500 italic mt-0.5">Keterangan: "{v.note}"</p>}
                    <p className="text-[10px] text-red-600 font-semibold mt-0.5">Sanksi: {v.sanction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicator Evaluation Accordions */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Lembar Penilaian Nilai Keasramaan</h3>
          <span className="text-xs text-slate-400">Total 15 Kategori Nilai</span>
        </div>

        <div className="space-y-4">
          {RAPOR_STRUCTURE.map((category) => {
            const isAccordionOpen = !!openAccordions[category.key];
            return (
              <div
                key={category.key}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(category.key)}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white hover:bg-slate-800 transition text-left"
                >
                  <span className="font-bold text-xs tracking-wide uppercase">{category.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isAccordionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAccordionOpen && (
                  <div className="p-4 space-y-4 border-t border-slate-200 bg-slate-50/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-2 w-12">No</th>
                            <th className="pb-2 w-1/3">Indikator</th>
                            <th className="pb-2 w-28">Predikat</th>
                            <th className="pb-2">Deskripsi Perkembangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {category.indicators.map((ind, indIdx) => {
                            const key = `${category.key}_${indIdx}`;
                            return (
                              <tr key={indIdx} className="py-2">
                                <td className="py-3 font-semibold text-slate-400">{indIdx + 1}</td>
                                <td className="py-3 font-medium text-slate-800">{ind}</td>
                                <td className="py-3">
                                  <select
                                    value={grades[key] || ''}
                                    onChange={(e) =>
                                      handleGradeChange(category.key, indIdx, ind, e.target.value)
                                    }
                                    className="w-full border border-slate-200 bg-white rounded px-2 py-1.5 focus:ring-1 focus:ring-red-500/50 focus:outline-none"
                                  >
                                    <option value="">- Predikat -</option>
                                    <option value="SB">SB (Sangat Baik)</option>
                                    <option value="B">B (Baik)</option>
                                    <option value="C">C (Cukup)</option>
                                    <option value="PB">PB (Perlu Bimbingan)</option>
                                  </select>
                                </td>
                                <td className="py-3">
                                  <input
                                    type="text"
                                    value={descriptions[key] || ''}
                                    onChange={(e) =>
                                      handleDescriptionChange(category.key, indIdx, e.target.value)
                                    }
                                    className="w-full border border-slate-200 bg-white rounded px-3 py-1.5 focus:ring-1 focus:ring-red-500/50 focus:outline-none"
                                    placeholder="Isi deskripsi perkembangan..."
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special Remarks Section */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-1.5 border-slate-200">
            Lembar Catatan Khusus dan Pengesahan
          </h4>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Catatan Khusus Perkembangan Wali Asuh
            </label>
            <textarea
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              rows={4}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              placeholder="Tulis catatan perkembangan akhlak, sikap sosial, minat bakat, dan nasihat pembinaan wali asuh di sini..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow transition active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Rapor Keasramaan
          </button>
        </div>
      </div>
    </div>
  );
};
