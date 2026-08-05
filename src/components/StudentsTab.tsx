import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  HeartHandshake,
  CheckCircle2,
  Award,
  ExternalLink
} from 'lucide-react';
import { Student, ClassLevel, AppConfig, Violation, Counseling } from '../types';
import { calculateStudentDisciplineScore } from '../services/storage';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { generateViolationNoticePDF, generateStudentCardPDF, generateAllStudentCardsPDF, generateStudentCardSheetA4PDF } from '../services/pdfGenerator';

interface StudentsTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  config: AppConfig;
  onSaveStudent: (student: Student, isEdit: boolean) => void;
  onDeleteStudent: (id: string) => void;
  onOpenViolationForStudent?: (studentId: string) => void;
  onOpenCounselingForStudent?: (studentId: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  violations,
  counseling,
  config,
  onSaveStudent,
  onDeleteStudent,
  onOpenViolationForStudent,
  onOpenCounselingForStudent,
  onShowToast,
  onAskConfirm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dormFilter, setDormFilter] = useState('');

  // Selected student for discipline history modal
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [historyTab, setHistoryTab] = useState<'violations' | 'counseling'>('violations');

  // Modal State for Add/Edit Student
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formRfidTag, setFormRfidTag] = useState('');
  const [formClass, setFormClass] = useState<ClassLevel>('SD');
  const [formDorm, setFormDorm] = useState(config.dormList[0] || 'Asrama Terpadu');
  const [formCaretaker, setFormCaretaker] = useState(
    config.waliAsuhList[0]?.split('|')[0] || 'M. ARDIAN NUGRAHA, S.H'
  );
  const [formHeight, setFormHeight] = useState<string>('');
  const [formWeight, setFormWeight] = useState<string>('');
  const [formShirtSize, setFormShirtSize] = useState<string>('');
  const [formPantsSize, setFormPantsSize] = useState<string>('');

  const cleanWaliAsuh = config.waliAsuhList.map((item) => item.split('|')[0].trim());

  // List of dorm options following system configuration (config.dormList)
  const dormListFromConfig = useMemo(() => {
    return config.dormList && config.dormList.length > 0
      ? config.dormList
      : ['Asrama Terpadu'];
  }, [config.dormList]);

  // Dorm options for form modal selection (includes current formDorm if not in system config)
  const formDormOptions = useMemo(() => {
    if (formDorm && !dormListFromConfig.includes(formDorm)) {
      return [formDorm, ...dormListFromConfig];
    }
    return dormListFromConfig;
  }, [dormListFromConfig, formDorm]);

  // Dorm options for filter dropdown
  const filterDormOptions = useMemo(() => {
    const set = new Set<string>(dormListFromConfig);
    students.forEach((s) => {
      if (s.dorm) set.add(s.dorm);
    });
    return Array.from(set);
  }, [dormListFromConfig, students]);

  // Filtered Students using useMemo for zero input lag
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchName =
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.rfidTag && s.rfidTag.toLowerCase().includes(q));
      const matchClass = classFilter === '' || s.class === classFilter;
      const matchDorm = dormFilter === '' || s.dorm === dormFilter;
      return matchName && matchClass && matchDorm;
    });
  }, [students, searchQuery, classFilter, dormFilter]);

  // Multi-selection state for printing cards
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every((s) => selectedStudentIds.includes(s.id));
  }, [filteredStudents, selectedStudentIds]);

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedStudentsToPrint = useMemo(() => {
    if (selectedStudentIds.length > 0) {
      return students.filter((s) => selectedStudentIds.includes(s.id));
    }
    return filteredStudents;
  }, [students, selectedStudentIds, filteredStudents]);

  const handleOpenAddModal = () => {
    setEditingStudentId(null);
    setFormName('');
    setFormNisn('');
    setFormRfidTag('');
    setFormClass('SD');
    setFormDorm(config.dormList[0] || 'Asrama Terpadu');
    setFormCaretaker(cleanWaliAsuh[0] || 'M. ARDIAN NUGRAHA, S.H');
    setFormHeight('');
    setFormWeight('');
    setFormShirtSize('');
    setFormPantsSize('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudentId(student.id);
    setFormName(student.name);
    setFormNisn(student.id);
    setFormRfidTag(student.rfidTag || '');
    setFormClass(student.class);
    setFormDorm(student.dorm);
    setFormCaretaker(student.caretaker);
    setFormHeight(student.height !== undefined ? String(student.height) : '');
    setFormWeight(student.weight !== undefined ? String(student.weight) : '');
    setFormShirtSize(student.shirtSize || '');
    setFormPantsSize(student.pantsSize || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const nisn = formNisn.trim();
    const rfidTag = formRfidTag.trim().toUpperCase();

    if (!name || !nisn) {
      onShowToast('Data Tidak Lengkap', 'Nama dan NISN/ID wajib diisi.', 'warning');
      return;
    }

    const heightVal = formHeight !== '' ? Number(formHeight) : undefined;
    const weightVal = formWeight !== '' ? Number(formWeight) : undefined;
    const shirtVal = formShirtSize.trim() || undefined;
    const pantsVal = formPantsSize.trim() || undefined;

    if (editingStudentId) {
      const updatedStudent: Student = {
        id: editingStudentId,
        name,
        rfidTag: rfidTag || undefined,
        class: formClass,
        dorm: formDorm,
        caretaker: formCaretaker,
        height: heightVal,
        weight: weightVal,
        shirtSize: shirtVal,
        pantsSize: pantsVal
      };
      onSaveStudent(updatedStudent, true);
      onShowToast('Berhasil', `Data ${name} berhasil diperbarui.`, 'success');
    } else {
      if (students.some((s) => String(s.id) === String(nisn))) {
        onShowToast('Siswa Gagal Terdaftar', 'NISN / ID Registrasi sudah digunakan.', 'error');
        return;
      }
      const newStudent: Student = {
        id: nisn,
        name,
        rfidTag: rfidTag || undefined,
        class: formClass,
        dorm: formDorm,
        caretaker: formCaretaker,
        height: heightVal,
        weight: weightVal,
        shirtSize: shirtVal,
        pantsSize: pantsVal,
        violationCount: 0
      };
      onSaveStudent(newStudent, false);
      onShowToast('Registrasi Berhasil', `${name} berhasil terdaftar.`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Murid?',
      `Apakah Anda yakin ingin menghapus data murid ${name} beserta seluruh riwayatnya?`
    );
    if (confirmed) {
      onDeleteStudent(id);
      onShowToast('Dihapus', `Data murid ${name} telah dihapus.`, 'success');
    }
  };

  // Helper badge for discipline status
  const getStatusBadgeClass = (badgeColor: string) => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'red':
        return 'bg-red-200 text-red-900 border-red-300 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Selected student's computed violations & counselings
  const studentViolations = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    const sId = String(selectedStudentForHistory.id).trim().toLowerCase();
    const sName = selectedStudentForHistory.name ? String(selectedStudentForHistory.name).trim().toLowerCase() : '';
    return violations.filter((v) => {
      const vId = v.studentId ? String(v.studentId).trim().toLowerCase() : '';
      const vName = v.studentName ? String(v.studentName).trim().toLowerCase() : '';
      return (vId && vId === sId) || (sName && vName && vName === sName);
    });
  }, [selectedStudentForHistory, violations]);

  const studentCounselings = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    const sId = String(selectedStudentForHistory.id).trim().toLowerCase();
    const sName = selectedStudentForHistory.name ? String(selectedStudentForHistory.name).trim().toLowerCase() : '';
    return counseling.filter((c) => {
      const cId = c.studentId ? String(c.studentId).trim().toLowerCase() : '';
      const cName = c.studentName ? String(c.studentName).trim().toLowerCase() : '';
      return (cId && cId === sId) || (sName && cName && cName === sName);
    });
  }, [selectedStudentForHistory, counseling]);

  const studentDisciplineInfo = useMemo(() => {
    if (!selectedStudentForHistory) return null;
    return calculateStudentDisciplineScore(
      selectedStudentForHistory.id,
      violations,
      config,
      undefined,
      undefined,
      selectedStudentForHistory.name
    );
  }, [selectedStudentForHistory, violations, config]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Daftar Induk Murid Asrama
          </h2>
          <p className="text-xs text-slate-500">
            Total {students.length} siswa terdaftar yang sedang menempuh masa pembinaan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start">
          {students.length > 0 && (
            <>
              <button
                onClick={() => {
                  const targetList = selectedStudentsToPrint;
                  if (targetList.length === 0) {
                    onShowToast('Pilih Siswa', 'Pilih minimal 1 siswa untuk dicetak!', 'warning');
                    return;
                  }
                  generateAllStudentCardsPDF(targetList, config);
                  onShowToast('Mencetak Kartu CR80', `Mencetak ${targetList.length} Kartu CR80 (85.6 x 54 mm)...`, 'success');
                }}
                className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2.5 rounded-lg shadow transition active:scale-95 flex items-center gap-1.5"
                title="Cetak Ukuran Standar ID Card CR80 (85.6 x 54 mm per halaman)"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                {selectedStudentIds.length > 0
                  ? `Cetak Terpilih (${selectedStudentIds.length}) - CR80`
                  : `Cetak Semua (${filteredStudents.length}) - CR80`}
              </button>
              <button
                onClick={() => {
                  const targetList = selectedStudentsToPrint;
                  if (targetList.length === 0) {
                    onShowToast('Pilih Siswa', 'Pilih minimal 1 siswa untuk dicetak!', 'warning');
                    return;
                  }
                  generateStudentCardSheetA4PDF(targetList, config);
                  onShowToast('Mencetak Grid A4', `Mencetak ${targetList.length} Kartu ke Lembar A4 (10 Kartu/Halaman)...`, 'success');
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2.5 rounded-lg shadow transition active:scale-95 flex items-center gap-1.5"
                title="Cetak Grid A4 (10 Kartu ID per Lembar Kertas A4 dengan Garis Potong)"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                {selectedStudentIds.length > 0
                  ? `Cetak Terpilih (${selectedStudentIds.length}) - Grid A4`
                  : `Cetak Semua (${filteredStudents.length}) - Grid A4`}
              </button>
            </>
          )}
          <button
            onClick={handleOpenAddModal}
            className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-slate-800 shadow transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Registrasi Siswa Baru
          </button>
        </div>
      </div>

      {/* Filter & Multi-Selection Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa berdasarkan nama atau NISN..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="">Semua Jenjang</option>
              <option value="SD">SD (Sekolah Dasar)</option>
              <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
              <option value="SMA">SMA (Sekolah Menengah Atas)</option>
            </select>
            <select
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="">Semua Gedung Asrama</option>
              {filterDormOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Selection Control Row */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs flex-wrap gap-2">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Pilih Semua ({filteredStudents.length} Siswa)</span>
            </label>
            {selectedStudentIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  {selectedStudentIds.length} Siswa Terpilih
                </span>
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="text-slate-500 hover:text-slate-800 underline text-xs font-semibold"
                >
                  Batal Pilih
                </button>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Centang siswa yang ingin dicetak kartunya khusus (Cetak Terpilih).
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            Tidak ada data siswa yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filteredStudents.map((s) => {
            const disc = calculateStudentDisciplineScore(s.id, violations, config, undefined, undefined, s.name);
            const isSelected = selectedStudentIds.includes(s.id);
            return (
              <div
                key={s.id}
                className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 space-y-4 relative overflow-hidden flex flex-col justify-between transition ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectStudent(s.id)}
                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Pilih siswa untuk cetak kartu"
                  />
                </div>

                <div className="absolute right-2 top-2 flex items-center gap-1 z-20">
                  <button
                    onClick={() => handleOpenEditModal(s)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                    title="Edit Data"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent -z-0 rounded-bl-full pointer-events-none" />

                <div className="flex items-start gap-3.5 relative z-10 min-w-0 pt-3">
                  <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-base border border-red-100 flex-shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-0.5 pr-10">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">NISN: {s.id}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {s.class} • {s.dorm}
                      </span>
                      <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(disc.status.badgeColor)}`}>
                        {disc.score} Poin • {disc.status.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 text-center border-t border-b border-slate-100 py-2.5 gap-2">
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Pelanggaran
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-extrabold mt-0.5 block truncate ${
                        disc.violationCount > 3
                          ? 'text-red-600'
                          : disc.violationCount > 0
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {disc.violationCount} Kasus (-{disc.totalDeducted}p)
                    </span>
                  </div>
                  <div className="min-w-0 border-l border-slate-100">
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Wali Asuh
                    </span>
                    <span className="text-xs font-bold text-slate-700 mt-0.5 block truncate" title={s.caretaker || '-'}>
                      {s.caretaker || '-'}
                    </span>
                  </div>
                </div>

                {/* Physical Measurements & Uniform Sizes */}
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[11px] grid grid-cols-2 gap-2 text-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                      Tinggi & Berat
                    </span>
                    <span className="font-extrabold text-slate-800 block truncate">
                      {s.height ? `${s.height} cm` : '-'} / {s.weight ? `${s.weight} kg` : '-'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                      Seragam (Baju/Celana)
                    </span>
                    <span className="font-extrabold text-slate-800 block truncate">
                      {s.shirtSize ? `Baju ${s.shirtSize}` : 'Baju -'} • {s.pantsSize ? `Cln ${s.pantsSize}` : 'Cln -'}
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setSelectedStudentForHistory(s);
                      setHistoryTab('violations');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Riwayat Kedisiplinan
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Student Discipline & Violation History Modal */}
      {selectedStudentForHistory && studentDisciplineInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-inner">
                  {selectedStudentForHistory.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base md:text-lg text-white">
                      {selectedStudentForHistory.name}
                    </h3>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(studentDisciplineInfo.status.badgeColor)}`}>
                      {studentDisciplineInfo.score} Poin • {studentDisciplineInfo.status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    NISN: <span className="font-mono text-slate-300">{selectedStudentForHistory.id}</span> • Kelas {selectedStudentForHistory.class} • Gedung {selectedStudentForHistory.dorm} • Wali Asuh: {selectedStudentForHistory.caretaker}
                  </p>
                  {(selectedStudentForHistory.height || selectedStudentForHistory.weight || selectedStudentForHistory.shirtSize || selectedStudentForHistory.pantsSize) && (
                    <p className="text-[11px] text-emerald-400 font-semibold pt-0.5">
                      📏 TB: {selectedStudentForHistory.height ? `${selectedStudentForHistory.height} cm` : '-'} • BB: {selectedStudentForHistory.weight ? `${selectedStudentForHistory.weight} kg` : '-'} • Ukuran Baju: {selectedStudentForHistory.shirtSize || '-'} • Celana: {selectedStudentForHistory.pantsSize || '-'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="text-slate-400 hover:text-white transition p-1 bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Discipline Points Gauge / Progress Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" /> Indikator Kedisiplinan Siswa
                  </span>
                  <span className="font-mono">{studentDisciplineInfo.score} / 100 Poin</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      studentDisciplineInfo.score >= 90
                        ? 'bg-emerald-500'
                        : studentDisciplineInfo.score >= 75
                        ? 'bg-blue-500'
                        : studentDisciplineInfo.score >= 50
                        ? 'bg-amber-500'
                        : studentDisciplineInfo.score >= 25
                        ? 'bg-rose-500'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${studentDisciplineInfo.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  {studentDisciplineInfo.status.description} (Total Poin Terpotong: -{studentDisciplineInfo.totalDeducted} Poin dari {studentDisciplineInfo.violationCount} laporan pelanggaran).
                </p>
              </div>

              {/* Action Buttons & Tabs Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setHistoryTab('violations')}
                    className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      historyTab === 'violations'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Catatan Pelanggaran ({studentViolations.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('counseling')}
                    className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      historyTab === 'counseling'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-purple-600" /> Bimbingan BK ({studentCounselings.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <button
                    onClick={() => {
                      generateStudentCardPDF(selectedStudentForHistory, config);
                      onShowToast('Mencetak Kartu', `Membuat Kartu Tanda Siswa ${selectedStudentForHistory.name}...`, 'success');
                    }}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-1"
                    title="Cetak Kartu Tanda Siswa RFID"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-200" /> Cetak Kartu Siswa
                  </button>
                  {onOpenViolationForStudent && (
                    <button
                      onClick={() => {
                        const sid = selectedStudentForHistory.id;
                        setSelectedStudentForHistory(null);
                        onOpenViolationForStudent(sid);
                      }}
                      className="bg-red-600 text-white hover:bg-red-700 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Catat Pelanggaran
                    </button>
                  )}
                  {onOpenCounselingForStudent && (
                    <button
                      onClick={() => {
                        const sid = selectedStudentForHistory.id;
                        setSelectedStudentForHistory(null);
                        onOpenCounselingForStudent(sid);
                      }}
                      className="bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Bimbingan BK
                    </button>
                  )}
                </div>
              </div>

              {/* Tab 1: Violations History */}
              {historyTab === 'violations' && (
                <div className="space-y-3">
                  {studentViolations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">Siswa Bebas Pelanggaran</h4>
                      <p className="text-xs text-slate-500">
                        Tidak ditemukan riwayat atau catatan pelanggaran kedisiplinan yang tercatat untuk {selectedStudentForHistory.name}.
                      </p>
                    </div>
                  ) : (
                    studentViolations.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              v.level === 1
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : v.level === 2
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : v.level === 3
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : v.level === 4
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-red-200 text-red-900 border-red-300'
                            }`}>
                              Tingkat {v.level}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {v.violation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {formatDateIndonesian(v.date)}
                            </span>
                            <button
                              onClick={() => {
                                generateViolationNoticePDF(v, selectedStudentForHistory, config);
                                onShowToast('Mencetak Surat', 'Surat pemberitahuan dibuat...', 'success');
                              }}
                              className="text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                              title="Cetak Surat Pemberitahuan Pelanggaran"
                            >
                              <Printer className="w-3 h-3" /> Surat
                            </button>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Sanksi:</strong>{' '}
                            <span className="italic text-slate-800">{v.sanction}</span>
                          </p>
                          {v.note && (
                            <p className="text-slate-600">
                              <strong className="text-slate-800">Catatan Tambahan:</strong> {v.note}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Dilaporkan oleh: {v.reporter || 'Wali Asrama'}
                          </p>
                        </div>

                        {v.photo && (
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                              Bukti Foto:
                            </span>
                            <img
                              src={v.photo}
                              alt="Bukti Pelanggaran"
                              className="h-20 w-auto object-cover rounded-lg border border-slate-200 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Counseling History */}
              {historyTab === 'counseling' && (
                <div className="space-y-3">
                  {studentCounselings.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <HeartHandshake className="w-10 h-10 text-purple-400 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">Belum Ada Sesi Bimbingan BK</h4>
                      <p className="text-xs text-slate-500">
                        Tidak ada catatan konseling atau bimbingan khusus BK untuk siswa ini.
                      </p>
                    </div>
                  ) : (
                    studentCounselings.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                            {c.caseDescription || 'Pendampingan Rutin'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatDateIndonesian(c.date)} • Konselor: {c.counselor}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {c.notes && (
                            <p className="text-slate-700">
                              <strong>Hasil Diskusi:</strong> {c.notes}
                            </p>
                          )}
                          {c.followUp && (
                            <p className="text-slate-700">
                              <strong>Rencana Tindak Lanjut:</strong> {c.followUp}
                            </p>
                          )}
                          <p className="text-[10px] font-bold text-slate-500 mt-1">
                            Status: <span className="text-purple-700">{c.status}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm">
                  {editingStudentId ? 'Edit Data Siswa' : 'Registrasi Siswa Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="e.g. Ahmad Fauzi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      NISN / ID Registrasi
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingStudentId}
                      value={formNisn}
                      onChange={(e) => setFormNisn(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-200 disabled:cursor-not-allowed"
                      placeholder="e.g. SR0088"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    RFID Tag / NFC Chip UID (Opsional untuk Kartu Smart RFID)
                  </label>
                  <input
                    type="text"
                    value={formRfidTag}
                    onChange={(e) => setFormRfidTag(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="e.g. 1029384756 atau 04:A2:3B:8C (Tap kartu ke scanner RFID)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Isi jika menggunakan kartu chip RFID (MFRC522/PN532/USB RFID Reader) atau tap langsung ke scanner.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Jenjang Pendidikan
                    </label>
                    <select
                      value={formClass}
                      onChange={(e) => setFormClass(e.target.value as ClassLevel)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Lokasi Gedung Asrama
                    </label>
                    <select
                      value={formDorm}
                      onChange={(e) => setFormDorm(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      {formDormOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Wali Asuh Penanggung Jawab
                  </label>
                  <select
                    value={formCaretaker}
                    onChange={(e) => setFormCaretaker(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {cleanWaliAsuh.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Data Fisik & Ukuran Seragam */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    📏 Physical Measurements & Ukuran Seragam
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tinggi (cm)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="220"
                        value={formHeight}
                        onChange={(e) => setFormHeight(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="e.g. 145"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Berat (kg)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="e.g. 38"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ukuran Baju
                      </label>
                      <input
                        type="text"
                        value={formShirtSize}
                        onChange={(e) => setFormShirtSize(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 uppercase"
                        placeholder="e.g. S, M, L, XL"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ukuran Celana
                      </label>
                      <input
                        type="text"
                        value={formPantsSize}
                        onChange={(e) => setFormPantsSize(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 uppercase"
                        placeholder="e.g. 28, 29, 30, M"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition active:scale-95"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
