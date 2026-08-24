import React, { useState, useEffect, useMemo } from 'react';
import { Wand2, Printer, ShieldAlert, Save, ChevronDown, CheckCircle2, Award, AlertTriangle, Settings, Edit2, Plus, Trash2, X, Sliders, FileSpreadsheet, UserCheck, HeartPulse, Activity } from 'lucide-react';
import { Student, Violation, ReportCardData, AppConfig, ReportCategory, Counseling, MedicalRecord } from '../types';
import { RAPOR_STRUCTURE, printReportCardPDF } from '../services/pdfGenerator';
import { calculateStudentDisciplineScore } from '../services/storage';

interface ReportCardTabProps {
  students: Student[];
  violations: Violation[];
  counseling?: Counseling[];
  medicalRecords?: MedicalRecord[];
  reports: Record<string, ReportCardData>;
  config: AppConfig;
  onSaveReport: (studentId: string, data: ReportCardData) => void;
  onSaveConfig?: (updatedConfig: AppConfig) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const ReportCardTab: React.FC<ReportCardTabProps> = ({
  students,
  violations,
  counseling = [],
  medicalRecords = [],
  reports,
  config,
  onSaveReport,
  onSaveConfig,
  onShowToast,
  onAskConfirm
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [customCaretaker, setCustomCaretaker] = useState<string>('');
  const [customCaretakerNip, setCustomCaretakerNip] = useState<string>('');
  const [customWaliAsrama, setCustomWaliAsrama] = useState<string>('');
  const [customWaliAsramaNip, setCustomWaliAsramaNip] = useState<string>('');
  const [specialNote, setSpecialNote] = useState<string>('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(config.semester || 'Genap');
  const [academicYear, setAcademicYear] = useState<string>(config.academicYear || '2025/2026');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const [grades, setGrades] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [includeCounseling, setIncludeCounseling] = useState<boolean>(true);
  const [includeMedical, setIncludeMedical] = useState<boolean>(true);

  const student = students.find((s) => String(s.id) === String(selectedStudentId));

  // Active Rapor Structure (Custom from Config or Default)
  const activeRaporStructure = useMemo(() => {
    return config.raporStructureCustom && config.raporStructureCustom.length > 0
      ? config.raporStructureCustom
      : RAPOR_STRUCTURE;
  }, [config]);

  // Modal State for Customizing Indicators
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState<boolean>(false);
  const [tempRaporStructure, setTempRaporStructure] = useState<ReportCategory[]>([]);
  const [selectedCatIndexInModal, setSelectedCatIndexInModal] = useState<number>(0);
  const [modalNewIndicatorText, setModalNewIndicatorText] = useState<string>('');
  const [modalEditingIndIdx, setModalEditingIndIdx] = useState<number | null>(null);
  const [modalEditingIndText, setModalEditingIndText] = useState<string>('');
  const [modalNewCatName, setModalNewCatName] = useState<string>('');
  const [modalIsAddingCat, setModalIsAddingCat] = useState<boolean>(false);

  const handleOpenIndicatorModal = () => {
    setTempRaporStructure(JSON.parse(JSON.stringify(activeRaporStructure)));
    setSelectedCatIndexInModal(0);
    setModalNewIndicatorText('');
    setModalEditingIndIdx(null);
    setModalEditingIndText('');
    setModalNewCatName('');
    setModalIsAddingCat(false);
    setIsIndicatorModalOpen(true);
  };

  const handleSaveIndicatorCustomization = () => {
    if (!onSaveConfig) return;
    const updatedConfig: AppConfig = {
      ...config,
      raporStructureCustom: tempRaporStructure
    };
    onSaveConfig(updatedConfig);
    setIsIndicatorModalOpen(false);
    onShowToast('Indikator Disimpan', 'Struktur Kategori & Indikator Rapor Keasramaan berhasil diperbarui.', 'success');
  };

  const handleModalAddIndicator = () => {
    if (!modalNewIndicatorText.trim()) {
      onShowToast('Peringatan', 'Teks indikator tidak boleh kosong.', 'warning');
      return;
    }
    const updated = JSON.parse(JSON.stringify(tempRaporStructure));
    if (updated[selectedCatIndexInModal]) {
      updated[selectedCatIndexInModal].indicators.push(modalNewIndicatorText.trim());
      setTempRaporStructure(updated);
      setModalNewIndicatorText('');
      onShowToast('Indikator Ditambahkan', 'Indikator baru berhasil ditambahkan.', 'success');
    }
  };

  const handleModalSaveInlineIndicator = (catIdx: number, indIdx: number) => {
    if (!modalEditingIndText.trim()) {
      onShowToast('Peringatan', 'Teks indikator tidak boleh kosong.', 'warning');
      return;
    }
    const updated = JSON.parse(JSON.stringify(tempRaporStructure));
    if (updated[catIdx] && updated[catIdx].indicators[indIdx] !== undefined) {
      updated[catIdx].indicators[indIdx] = modalEditingIndText.trim();
      setTempRaporStructure(updated);
      setModalEditingIndIdx(null);
      setModalEditingIndText('');
      onShowToast('Indikator Diperbarui', 'Perubahan indikator disimpan.', 'success');
    }
  };

  const handleModalDeleteIndicator = (catIdx: number, indIdx: number) => {
    const updated = JSON.parse(JSON.stringify(tempRaporStructure));
    if (updated[catIdx]) {
      updated[catIdx].indicators.splice(indIdx, 1);
      setTempRaporStructure(updated);
      if (modalEditingIndIdx === indIdx) setModalEditingIndIdx(null);
      onShowToast('Indikator Dihapus', 'Indikator berhasil dihapus.', 'info');
    }
  };

  const handleModalAddCategory = () => {
    if (!modalNewCatName.trim()) {
      onShowToast('Peringatan', 'Nama kategori tidak boleh kosong.', 'warning');
      return;
    }
    const key = `custom_cat_${Date.now()}`;
    const updated = [...tempRaporStructure, { key, name: modalNewCatName.trim(), indicators: [] }];
    setTempRaporStructure(updated);
    setSelectedCatIndexInModal(updated.length - 1);
    setModalNewCatName('');
    setModalIsAddingCat(false);
    onShowToast('Kategori Baru', `Kategori "${modalNewCatName}" dibuat.`, 'success');
  };

  const handleModalDeleteCategory = (catIdx: number) => {
    if (tempRaporStructure.length <= 1) {
      onShowToast('Peringatan', 'Minimal harus ada 1 Kategori Rapor.', 'warning');
      return;
    }
    const catName = tempRaporStructure[catIdx]?.name;
    const updated = tempRaporStructure.filter((_, i) => i !== catIdx);
    setTempRaporStructure(updated);
    setSelectedCatIndexInModal(0);
    onShowToast('Kategori Dihapus', `Kategori "${catName}" dihapus.`, 'info');
  };

  const handleModalResetDefault = () => {
    setTempRaporStructure(RAPOR_STRUCTURE);
    setSelectedCatIndexInModal(0);
    onShowToast('Direset', 'Struktur indikator dikembalikan ke default.', 'info');
  };

  // Discipline & Violations Evaluation for selected student & semester
  const disciplineInfo = useMemo(() => {
    if (!selectedStudentId) return null;
    return calculateStudentDisciplineScore(selectedStudentId, violations, config, semester, academicYear, student?.name);
  }, [selectedStudentId, violations, config, semester, academicYear, student?.name]);

  const studentViolations = disciplineInfo?.filteredViolations || [];

  const sId = String(selectedStudentId).trim().toLowerCase();
  const sName = student?.name ? student.name.trim().toLowerCase() : '';

  const studentCounseling = useMemo(() => {
    if (!selectedStudentId) return [];
    return (counseling || []).filter((c) => {
      const cId = c.studentId ? String(c.studentId).trim().toLowerCase() : '';
      const cName = c.studentName ? c.studentName.trim().toLowerCase() : '';
      return (cId && cId === sId) || (sName && cName && cName === sName);
    });
  }, [selectedStudentId, counseling, sId, sName]);

  const studentMedical = useMemo(() => {
    if (!selectedStudentId) return [];
    return (medicalRecords || []).filter((m) => {
      const mId = m.studentId ? String(m.studentId).trim().toLowerCase() : '';
      const mName = m.studentName ? m.studentName.trim().toLowerCase() : '';
      return (mId && mId === sId) || (sName && mName && mName === sName);
    });
  }, [selectedStudentId, medicalRecords, sId, sName]);

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
      setCustomWaliAsrama(rep.customWaliAsrama !== undefined ? rep.customWaliAsrama : (config.waliAsrama || ''));
      setCustomWaliAsramaNip(rep.customWaliAsramaNip !== undefined ? rep.customWaliAsramaNip : (config.waliAsramaNip || ''));
      if (rep.semester) setSemester(rep.semester);
      else setSemester(config.semester || 'Genap');
      if (rep.academicYear) setAcademicYear(rep.academicYear);
      else setAcademicYear(config.academicYear || '2025/2026');
      setIncludeCounseling(rep.includeCounseling !== undefined ? rep.includeCounseling : true);
      setIncludeMedical(rep.includeMedical !== undefined ? rep.includeMedical : true);
    } else {
      setGrades({});
      setDescriptions({});
      setSpecialNote('');
      setCustomWaliAsrama(config.waliAsrama || '');
      setCustomWaliAsramaNip(config.waliAsramaNip || '');
      setSemester(config.semester || 'Genap');
      setAcademicYear(config.academicYear || '2025/2026');
      setIncludeCounseling(true);
      setIncludeMedical(true);
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

    activeRaporStructure.forEach((cat) => {
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
      customWaliAsrama,
      customWaliAsramaNip,
      semester,
      academicYear,
      includeCounseling,
      includeMedical
    };

    onSaveReport(selectedStudentId, reportData);
    onShowToast('Rapor Disimpan', 'Seluruh lembar evaluasi rapor keasramaan berhasil disimpan.', 'success');

    const printNow = await onAskConfirm(
      'Cetak Rapor Saat Ini?',
      'Data Rapor siswa telah berhasil disimpan. Apakah Anda ingin langsung mencetak dokumen PDF Rapor ini sekarang?'
    );
    if (printNow && student) {
      printReportCardPDF(student, reportData, violations, config, counseling, medicalRecords);
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
      customWaliAsrama,
      customWaliAsramaNip,
      semester,
      academicYear,
      includeCounseling,
      includeMedical
    };

    if (Object.keys(grades).length === 0) {
      onShowToast('Data Kosong', 'Silakan isi dan simpan terlebih dahulu draf rapor siswa bersangkutan.', 'error');
      return;
    }

    printReportCardPDF(student, reportData, violations, config, counseling, medicalRecords);
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

      {/* Selection & Signatory Parameter Inputs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Pilih Peserta Didik
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-semibold"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class} - {s.dorm})
                </option>
              ))}
            </select>
          </div>

          <div>
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

          <div>
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

          <div>
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

          <div>
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

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Nama Wali Asrama</span>
              <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">Custom</span>
            </label>
            <input
              type="text"
              value={customWaliAsrama}
              onChange={(e) => setCustomWaliAsrama(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold text-slate-800"
              placeholder="Nama Wali Asrama Rapor..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              NIP Wali Asrama
            </label>
            <input
              type="text"
              value={customWaliAsramaNip}
              onChange={(e) => setCustomWaliAsramaNip(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold text-slate-800"
              placeholder="NIP Wali Asrama Rapor..."
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

      {/* Violation History & Discipline Score Widget */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Evaluasi Riwayat Kedisiplinan & Pelanggaran Rapor (Sem. {semester} {academicYear})
          </h3>
          {disciplineInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Poin Semester:</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {disciplineInfo.score} / 100 Poin
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border text-white ${
                disciplineInfo.status.badgeColor === 'emerald' ? 'bg-emerald-600 border-emerald-700' :
                disciplineInfo.status.badgeColor === 'blue' ? 'bg-blue-600 border-blue-700' :
                disciplineInfo.status.badgeColor === 'amber' ? 'bg-amber-600 border-amber-700' :
                'bg-red-600 border-red-700'
              }`}>
                {disciplineInfo.status.label}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
          {studentViolations.length === 0 ? (
            <div>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Catatan Bersih (100 Poin Utuh)
              </span>
              <p className="mt-1 text-[11px] text-slate-500">
                Anak asuh terpuji, tidak memiliki riwayat pelanggaran tata tertib asrama pada Semester {semester} ({academicYear}).
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-2 font-bold text-red-700 flex items-center justify-between">
                <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Terdeteksi {studentViolations.length} Kasus Pelanggaran (Total Pengurangan: -{disciplineInfo?.totalDeducted} Poin):</span>
                <span className="text-[10px] text-slate-400 font-medium">Reset Poin per Semester: Otomatis</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {studentViolations.map((v) => (
                  <div key={v.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>
                        Tingkat {v.level} • {v.violation}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{v.date} ({v.semester || semester} {v.academicYear || academicYear})</span>
                    </div>
                    {v.note && <p className="text-[11px] text-slate-600 italic">Keterangan: "{v.note}"</p>}
                    <p className="text-[10px] text-red-600 font-semibold">Sanksi: {v.sanction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Counseling & Health Overview Widgets for PDF Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Counseling BK Widget */}
        <div className={`p-4 rounded-xl border transition-all shadow-sm space-y-3 ${includeCounseling ? 'bg-white border-blue-200 ring-1 ring-blue-100' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <UserCheck className={`w-4 h-4 ${includeCounseling ? 'text-blue-600' : 'text-slate-400'}`} /> Riwayat Bimbingan BK
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${includeCounseling ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {studentCounseling.length} Catatan
              </span>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setIncludeCounseling(!includeCounseling)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold transition-all border ${
                includeCounseling
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
              title="Klik untuk mengubah apakah riwayat BK ini dicetak di rapor atau tidak"
            >
              <span className="text-[10px] uppercase tracking-wider">
                {includeCounseling ? 'Cetak di Rapor (ON)' : 'Tidak Dicetak (OFF)'}
              </span>
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  includeCounseling ? 'translate-x-0' : '-translate-x-0.5 opacity-80'
                }`}
              />
            </button>
          </div>

          {!includeCounseling && (
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 text-[11px] font-medium border border-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Opsi Dinonaktifkan: Riwayat Bimbingan BK <strong className="font-bold">tidak akan ditampilkan</strong> di dokumen cetak PDF Rapor.</span>
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-2">
            {studentCounseling.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-emerald-700 text-[11px] font-medium flex items-center gap-1.5 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Belum ada catatan bimbingan konseling khusus semester ini.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {studentCounseling.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate max-w-[180px]">{c.caseDescription}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">Konselor: {c.counselor}</p>
                    <p className="text-[10px] text-blue-600 font-medium line-clamp-1">Hasil: {c.notes || c.followUp || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Health / UKS Medical Widget */}
        <div className={`p-4 rounded-xl border transition-all shadow-sm space-y-3 ${includeMedical ? 'bg-white border-emerald-200 ring-1 ring-emerald-100' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <HeartPulse className={`w-4 h-4 ${includeMedical ? 'text-emerald-600' : 'text-slate-400'}`} /> Catatan Kesehatan UKS
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${includeMedical ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {studentMedical.length} Rekam Medis
              </span>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setIncludeMedical(!includeMedical)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold transition-all border ${
                includeMedical
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
              title="Klik untuk mengubah apakah rekam medis UKS ini dicetak di rapor atau tidak"
            >
              <span className="text-[10px] uppercase tracking-wider">
                {includeMedical ? 'Cetak di Rapor (ON)' : 'Tidak Dicetak (OFF)'}
              </span>
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  includeMedical ? 'translate-x-0' : '-translate-x-0.5 opacity-80'
                }`}
              />
            </button>
          </div>

          {!includeMedical && (
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 text-[11px] font-medium border border-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Opsi Dinonaktifkan: Catatan Kesehatan UKS <strong className="font-bold">tidak akan ditampilkan</strong> di dokumen cetak PDF Rapor.</span>
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-2">
            {studentMedical.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-emerald-700 text-[11px] font-medium flex items-center gap-1.5 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Kondisi kesehatan fisik murid/anak asuh prima & sehat.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {studentMedical.map((m) => (
                  <div key={m.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate max-w-[180px]">{m.symptoms || m.diagnosis || 'Pemeriksaan UKS'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">Tindakan: {m.treatment || m.notes || '-'}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Status: {m.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicator Evaluation Accordions */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Lembar Penilaian Nilai Keasramaan
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evaluasi deskriptif dan predikat nilai perkembangan karakter anak asuh.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Total {activeRaporStructure.length} Kategori Nilai</span>
            <button
              type="button"
              onClick={handleOpenIndicatorModal}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5" /> Custom Indikator
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activeRaporStructure.map((category) => {
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

      {/* Custom Indicator Modal */}
      {isIndicatorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30">
                  <FileSpreadsheet className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Kustomisasi Indikator Keasramaan</h3>
                  <p className="text-[11px] text-slate-300">Tambah, ubah, atau hapus kategori & indikator rapor keasramaan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIndicatorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Top Controls: Category Selection & Adding */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    Kategori Nilai ({tempRaporStructure.length} Kategori):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalIsAddingCat(!modalIsAddingCat)}
                      className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Tambah Kategori
                    </button>
                    {tempRaporStructure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleModalDeleteCategory(selectedCatIndexInModal)}
                        className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Kategori
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Add New Category */}
                {modalIsAddingCat && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-xs font-bold text-blue-900 block">Buat Kategori Rapor Baru:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Kategori Nilai Kedisiplinan Khusus..."
                        value={modalNewCatName}
                        onChange={(e) => setModalNewCatName(e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleModalAddCategory}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalIsAddingCat(false); setModalNewCatName(''); }}
                        className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={selectedCatIndexInModal}
                  onChange={(e) => {
                    setSelectedCatIndexInModal(Number(e.target.value));
                    setModalEditingIndIdx(null);
                  }}
                  className="w-full border border-slate-300 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {tempRaporStructure.map((cat, idx) => (
                    <option key={cat.key || idx} value={idx}>
                      {idx + 1}. {cat.name} ({cat.indicators.length} Indikator)
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Add New Indicator */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  + Tambah Indikator Baru pada "{tempRaporStructure[selectedCatIndexInModal]?.name}":
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tulis indikator perkembangan..."
                    value={modalNewIndicatorText}
                    onChange={(e) => setModalNewIndicatorText(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleModalAddIndicator}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
              </div>

              {/* List of Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                  <span className="text-xs font-bold text-slate-700">
                    Daftar Indikator ({tempRaporStructure[selectedCatIndexInModal]?.indicators?.length || 0}):
                  </span>
                  <button
                    type="button"
                    onClick={handleModalResetDefault}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Reset Ke Default Standard
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(tempRaporStructure[selectedCatIndexInModal]?.indicators || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Belum ada indikator. Tambahkan indikator baru di atas.</p>
                  ) : (
                    (tempRaporStructure[selectedCatIndexInModal]?.indicators || []).map((ind, iIdx) => {
                      const isEditing = modalEditingIndIdx === iIdx;
                      return (
                        <div key={iIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={modalEditingIndText}
                                onChange={(e) => setModalEditingIndText(e.target.value)}
                                className="flex-1 border border-blue-400 bg-white rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleModalSaveInlineIndicator(selectedCatIndexInModal, iIdx)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModalEditingIndIdx(null)}
                                  className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] font-semibold px-3 py-1 rounded-lg transition"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[11px] leading-relaxed flex-1">
                                <strong className="text-slate-400 font-mono mr-1.5">{iIdx + 1}.</strong> {ind}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalEditingIndIdx(iIdx);
                                    setModalEditingIndText(ind);
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                  title="Edit Indikator Ini"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModalDeleteIndicator(selectedCatIndexInModal, iIdx)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                  title="Hapus Indikator Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 italic">Perubahan akan langsung berlaku pada lembar rapor & cetakan PDF.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsIndicatorModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveIndicatorCustomization}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
