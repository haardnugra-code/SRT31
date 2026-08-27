import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Search,
  Edit2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  FileSignature,
  HeartPulse,
  DoorOpen,
  QrCode,
  Calendar,
  Phone,
  Home,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Plus,
  X,
  ExternalLink,
  MessageSquare,
  MailWarning,
  ArrowLeft
} from 'lucide-react';
import {
  Student,
  Violation,
  DailyJournal,
  ReportCardData,
  Counseling,
  MedicalRecord,
  Leave,
  PrayerAttendance,
  MenstruationRecord,
  AppConfig,
  ClassLevel
} from '../types';
import { calculateStudentDisciplineScore, ROUTINE_TASKS } from '../services/storage';
import { formatDateIndonesian } from '../utils/dateFormatter';
import {
  generateStudentCardPDF,
  generateStudentViolationHistoryPDF,
  generateViolationNoticePDF,
  printReportCardPDF,
  printJournalPDF,
  printSickLeavePDF,
  printLeavePassPDF,
  generateSingleStudentMenstruationCardPDF,
  RAPOR_STRUCTURE
} from '../services/pdfGenerator';
import { ParentSummonsModal } from './ParentSummonsModal';

interface StudentProfileTabProps {
  students: Student[];
  violations: Violation[];
  dailyJournals: DailyJournal[];
  reports: Record<string, ReportCardData>;
  counseling: Counseling[];
  medicalRecords: MedicalRecord[];
  leaves: Leave[];
  prayerAttendance: PrayerAttendance[];
  menstruationRecords?: MenstruationRecord[];
  config: AppConfig;
  initialStudentId?: string;
  onBackToTable?: () => void;
  onSaveStudent: (student: Student, isEdit: boolean) => void;
  onDeleteStudent?: (id: string) => void;
  onSaveJournal?: (journal: DailyJournal) => void;
  onNavigateTab?: (tabId: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const StudentProfileTab: React.FC<StudentProfileTabProps> = ({
  students,
  violations,
  dailyJournals,
  reports,
  counseling,
  medicalRecords,
  leaves,
  prayerAttendance,
  menstruationRecords = [],
  config,
  initialStudentId,
  onBackToTable,
  onSaveStudent,
  onSaveJournal,
  onNavigateTab,
  onShowToast,
  onAskConfirm
}) => {
  // Active Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );

  const prevInitialIdRef = React.useRef(initialStudentId);
  useEffect(() => {
    if (initialStudentId && initialStudentId !== prevInitialIdRef.current) {
      prevInitialIdRef.current = initialStudentId;
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Search & Filter state for student selector
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [dormFilter, setDormFilter] = useState<string>('');

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'violations' | 'checklist' | 'report-card' | 'counseling' | 'medical' | 'leaves' | 'attendance'
  >('overview');

  // Quick Daily Checklist Form State
  const [isQuickChecklistOpen, setIsQuickChecklistOpen] = useState(false);
  const [checklistTimeStart, setChecklistTimeStart] = useState('04:30');
  const [checklistTimeEnd, setChecklistTimeEnd] = useState('21:30');
  const [checklistNotes, setChecklistNotes] = useState('');
  const [quickTaskStates, setQuickTaskStates] = useState<Record<number, boolean>>({});

  // Edit Student Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formRfidTag, setFormRfidTag] = useState('');
  const [formClass, setFormClass] = useState<ClassLevel>('SD');
  const [formDorm, setFormDorm] = useState('');
  const [formCaretaker, setFormCaretaker] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formShirtSize, setFormShirtSize] = useState('');
  const [formPantsSize, setFormPantsSize] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P' | 'Laki-Laki' | 'Perempuan'>('Laki-Laki');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');

  // Parent Summons Generator Modal State
  const [isSummonsModalOpen, setIsSummonsModalOpen] = useState(false);
  const [selectedSummonsViolation, setSelectedSummonsViolation] = useState<Violation | null>(null);

  // Clean dorm & wali asuh list
  const dormList = config.dormList || ['Asrama Terpadu'];
  const cleanWaliAsuh = (config.waliAsuhList || []).map((w) => w.split('|')[0].trim());

  // List of all unique dorms from both config and existing students
  const availableDorms = useMemo(() => {
    const set = new Set<string>();
    (config.dormList || []).forEach((d) => {
      if (d && d.trim()) set.add(d.trim());
    });
    students.forEach((s) => {
      if (s.dorm && s.dorm.trim()) set.add(s.dorm.trim());
    });
    return Array.from(set).sort();
  }, [config.dormList, students]);

  // List of all unique classes from students & standard levels
  const availableClasses = useMemo(() => {
    const set = new Set<string>(['SD', 'SMP', 'SMA']);
    students.forEach((s) => {
      if (s.class && String(s.class).trim()) set.add(String(s.class).trim().toUpperCase());
    });
    return Array.from(set);
  }, [students]);

  // Filtered student list for selector
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchQuery =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.id && String(s.id).toLowerCase().includes(q)) ||
        (s.rfidTag && String(s.rfidTag).toLowerCase().includes(q)) ||
        (s.class && String(s.class).toLowerCase().includes(q)) ||
        (s.dorm && String(s.dorm).toLowerCase().includes(q)) ||
        (s.caretaker && String(s.caretaker).toLowerCase().includes(q)) ||
        (s.parentName && String(s.parentName).toLowerCase().includes(q)) ||
        (s.parentPhone && String(s.parentPhone).toLowerCase().includes(q));

      const matchClass =
        !classFilter ||
        String(s.class).trim().toUpperCase() === String(classFilter).trim().toUpperCase();

      const matchDorm =
        !dormFilter ||
        String(s.dorm || '').trim().toLowerCase() === String(dormFilter).trim().toLowerCase();

      return matchQuery && matchClass && matchDorm;
    });
  }, [students, searchQuery, classFilter, dormFilter]);

  // Current Selected Student Object
  const currentStudent = useMemo(() => {
    if (students.length === 0) return null;
    // 1. First search in filtered list
    const foundInFiltered = filteredStudents.find(
      (s) => String(s.id).trim().toLowerCase() === String(selectedStudentId).trim().toLowerCase()
    );
    if (foundInFiltered) return foundInFiltered;

    // 2. If filtered list has results but current selection doesn't match, choose first filtered student
    if (filteredStudents.length > 0) {
      return filteredStudents[0];
    }

    // 3. If filtered list is empty, fallback to find in full students list
    const foundInAll = students.find(
      (s) => String(s.id).trim().toLowerCase() === String(selectedStudentId).trim().toLowerCase()
    );
    return foundInAll || null;
  }, [filteredStudents, students, selectedStudentId]);

  // Synchronize selectedStudentId whenever currentStudent changes
  useEffect(() => {
    if (currentStudent && String(currentStudent.id).trim() !== String(selectedStudentId).trim()) {
      setSelectedStudentId(currentStudent.id);
    }
  }, [currentStudent, selectedStudentId]);

  // Navigation Index based on filtered list
  const currentFilteredIndex = useMemo(() => {
    if (!currentStudent || filteredStudents.length === 0) return -1;
    return filteredStudents.findIndex(
      (s) => String(s.id).trim().toLowerCase() === String(currentStudent.id).trim().toLowerCase()
    );
  }, [filteredStudents, currentStudent]);

  const handlePrevStudent = () => {
    if (currentFilteredIndex > 0) {
      setSelectedStudentId(filteredStudents[currentFilteredIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentFilteredIndex >= 0 && currentFilteredIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentFilteredIndex + 1].id);
    }
  };

  // Connected Student Data
  const studentViolations = useMemo(() => {
    if (!currentStudent) return [];
    return violations
      .filter((v) => String(v.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [violations, currentStudent]);

  const studentDisciplineScore = useMemo(() => {
    if (!currentStudent) {
      return { score: 100, status: config.disciplineThresholds?.[0], totalDeducted: 0, violationCount: 0, filteredViolations: [] };
    }
    return calculateStudentDisciplineScore(
      currentStudent.id,
      violations,
      config,
      config.semester || 'Genap',
      config.academicYear || '2025/2026',
      currentStudent.name
    );
  }, [currentStudent, violations, config]);

  const studentJournals = useMemo(() => {
    if (!currentStudent) return [];
    return dailyJournals
      .filter((j) => String(j.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyJournals, currentStudent]);

  const studentReport = useMemo(() => {
    if (!currentStudent) return null;
    return reports[currentStudent.id] || null;
  }, [reports, currentStudent]);

  const studentCounseling = useMemo(() => {
    if (!currentStudent) return [];
    return counseling
      .filter((c) => String(c.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [counseling, currentStudent]);

  const studentMedical = useMemo(() => {
    if (!currentStudent) return [];
    return medicalRecords
      .filter((m) => String(m.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [medicalRecords, currentStudent]);

  const studentLeaves = useMemo(() => {
    if (!currentStudent) return [];
    return leaves
      .filter((l) => String(l.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.leaveDate).getTime() - new Date(a.leaveDate).getTime());
  }, [leaves, currentStudent]);

  const studentAttendance = useMemo(() => {
    if (!currentStudent) return [];
    return prayerAttendance
      .filter((p) => String(p.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [prayerAttendance, currentStudent]);

  const studentMenstruation = useMemo(() => {
    if (!currentStudent) return [];
    return menstruationRecords
      .filter((m) => String(m.studentId).trim() === String(currentStudent.id).trim())
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [menstruationRecords, currentStudent]);

  // Overall Statistics
  const journalStats = useMemo(() => {
    if (studentJournals.length === 0) return { totalDays: 0, avgCompleted: 0, complianceRate: 0 };
    let totalCompleted = 0;
    let totalTasks = 0;
    studentJournals.forEach((j) => {
      totalCompleted += j.tasksCompleted || 0;
      totalTasks += j.totalTasks || 8;
    });
    const avgCompleted = (totalCompleted / studentJournals.length).toFixed(1);
    const complianceRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    return { totalDays: studentJournals.length, avgCompleted, complianceRate };
  }, [studentJournals]);

  const attendanceStats = useMemo(() => {
    if (studentAttendance.length === 0) return { totalSessions: 0, presentCount: 0, rate: 100 };
    const presentCount = studentAttendance.filter((a) => a.status === 'Hadir').length;
    const rate = Math.round((presentCount / studentAttendance.length) * 100);
    return { totalSessions: studentAttendance.length, presentCount, rate };
  }, [studentAttendance]);

  // BMI Calculation
  const bmiInfo = useMemo(() => {
    if (!currentStudent?.height || !currentStudent?.weight) return null;
    const heightInMeters = currentStudent.height / 100;
    const bmi = +(currentStudent.weight / (heightInMeters * heightInMeters)).toFixed(1);
    let category = 'Ideal / Normal';
    let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (bmi < 18.5) {
      category = 'Kurang Berat Badan';
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Kelebihan Berat Badan';
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (bmi >= 30) {
      category = 'Obesitas';
      colorClass = 'text-red-700 bg-red-50 border-red-200';
    }
    return { bmi, category, colorClass };
  }, [currentStudent]);

  // Quick Daily Checklist Save
  const handleSaveQuickChecklist = () => {
    if (!currentStudent || !onSaveJournal) return;

    let completedTasksCount = 0;
    const tasksSnapshot = ROUTINE_TASKS.map((item) => {
      const isDone = !!quickTaskStates[item.id];
      if (isDone) completedTasksCount++;
      return { task: item.task, done: isDone };
    });

    const date = new Date().toISOString().split('T')[0];
    const newJournal: DailyJournal = {
      id: `jnl-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      date,
      timeRange: `${checklistTimeStart} - ${checklistTimeEnd}`,
      tasksCompleted: completedTasksCount,
      totalTasks: ROUTINE_TASKS.length,
      notes: checklistNotes.trim() || 'Pemeriksaan rutin keasramaan terpadu.',
      tasksSnapshot
    };

    onSaveJournal(newJournal);
    setIsQuickChecklistOpen(false);
    setChecklistNotes('');
    setQuickTaskStates({});
    onShowToast('Ceklist Disimpan', `Jurnal harian untuk ${currentStudent.name} berhasil dicatat.`, 'success');
  };

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!currentStudent) return;
    setFormName(currentStudent.name);
    setFormNisn(currentStudent.id);
    setFormRfidTag(currentStudent.rfidTag || '');
    setFormClass(currentStudent.class);
    setFormDorm(currentStudent.dorm || dormList[0] || 'Asrama Terpadu');
    setFormCaretaker(currentStudent.caretaker || cleanWaliAsuh[0] || '');
    setFormHeight(currentStudent.height ? String(currentStudent.height) : '');
    setFormWeight(currentStudent.weight ? String(currentStudent.weight) : '');
    setFormShirtSize(currentStudent.shirtSize || '');
    setFormPantsSize(currentStudent.pantsSize || '');
    setFormGender(currentStudent.gender || 'Laki-Laki');
    setFormParentPhone(currentStudent.parentPhone || '');
    setFormBirthDate(currentStudent.birthDate || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (!formName.trim() || !formNisn.trim()) {
      onShowToast('Form Tidak Lengkap', 'Nama siswa dan NISN/ID wajib diisi.', 'warning');
      return;
    }

    const updatedStudent: Student = {
      ...currentStudent,
      id: formNisn.trim(),
      name: formName.trim(),
      class: formClass,
      dorm: formDorm,
      caretaker: formCaretaker,
      rfidTag: formRfidTag.trim() || undefined,
      height: formHeight ? Number(formHeight) : undefined,
      weight: formWeight ? Number(formWeight) : undefined,
      shirtSize: formShirtSize.trim() || undefined,
      pantsSize: formPantsSize.trim() || undefined,
      gender: formGender,
      parentPhone: formParentPhone.trim() || undefined,
      birthDate: formBirthDate || undefined
    };

    onSaveStudent(updatedStudent, true);
    setIsEditModalOpen(false);
    onShowToast('Data Diperbarui', `Biodata ${formName} berhasil disimpan.`, 'success');
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Belum Ada Data Murid</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Tambahkan data murid terlebih dahulu di menu <strong>Data Murid</strong> untuk melihat profil lengkap, foto, dan integrasi riwayat keasramaan.
        </p>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('students')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Buka Data Murid
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. STUDENT SELECTOR & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Quick Search & Filter */}
        <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
          {onBackToTable && (
            <button
              onClick={onBackToTable}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
              title="Kembali ke Tabel Data Siswa"
            >
              <ArrowLeft className="w-4 h-4" /> Data Siswa
            </button>
          )}

          <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NISN, RFID, kelas, asrama, wali asuh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="flex-1 sm:flex-initial py-2 px-2.5 sm:px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none font-medium cursor-pointer"
            >
              <option value="">Semua Jenjang</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Jenjang {cls}
                </option>
              ))}
            </select>

            <select
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="flex-1 sm:flex-initial py-2 px-2.5 sm:px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none font-medium cursor-pointer"
            >
              <option value="">Semua Asrama</option>
              {availableDorms.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {(searchQuery || classFilter || dormFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setClassFilter('');
                  setDormFilter('');
                }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 shrink-0 active:scale-95"
                title="Reset semua filter"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Active Student Dropdown & Prev/Next */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 w-full lg:w-auto">
          <button
            type="button"
            onClick={handlePrevStudent}
            disabled={currentFilteredIndex <= 0}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0"
            title="Siswa Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={currentStudent ? currentStudent.id : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) setSelectedStudentId(val);
            }}
            disabled={filteredStudents.length === 0}
            className="flex-1 lg:flex-initial py-2 px-2.5 sm:px-3 bg-red-50 hover:bg-red-100/80 border border-red-200 font-bold text-xs text-red-950 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none min-w-0 max-w-full sm:max-w-[260px] truncate cursor-pointer disabled:opacity-50"
          >
            {filteredStudents.length === 0 ? (
              <option value="">Tidak ada siswa</option>
            ) : (
              filteredStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.id} - {st.class})
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={handleNextStudent}
            disabled={currentFilteredIndex < 0 || currentFilteredIndex >= filteredStudents.length - 1}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0"
            title="Siswa Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-bold text-slate-500 pl-1 whitespace-nowrap shrink-0">
            {filteredStudents.length > 0
              ? `${currentFilteredIndex + 1}/${filteredStudents.length}`
              : `0/${students.length}`}
          </span>
        </div>
      </div>

      {!currentStudent && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Siswa Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tidak ada data siswa yang cocok dengan kriteria filter saat ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setClassFilter('');
              setDormFilter('');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition-all inline-flex items-center gap-2 active:scale-95"
          >
            <X className="w-4 h-4" /> Reset Filter & Tampilkan Semua
          </button>
        </div>
      )}

      {currentStudent && (
        <>
          {/* 2. HERO PROFILE BANNER & IDENTITY CARD */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Top Decorative Header Accent */}
            <div className="h-24 sm:h-28 bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 relative px-4 sm:px-6 py-3 sm:py-4 flex items-end justify-between">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-white/80 text-[11px] sm:text-xs font-semibold truncate">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="truncate">Portofolio Keasramaan Terpadu • Sekolah Rakyat 31 Palembang</span>
              </div>
              <div className="relative z-10 hidden sm:flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20">
                  {config.semester || 'Genap'} • TA {config.academicYear || '2025/2026'}
                </span>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="p-4 sm:p-6 md:p-8 pt-0 -mt-10 sm:-mt-12 relative z-20">
              <div className="flex flex-col lg:flex-row items-center sm:items-start lg:items-end justify-between gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-100">
                {/* Avatar & Main Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 w-full text-center sm:text-left">
                  {/* Avatar Container */}
                  <div className="shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl md:text-4xl shadow-red-900/20">
                      {currentStudent.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Student Title & Badges */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-bold text-xs rounded-lg">
                        Kelas {currentStudent.class}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1">
                        <Home className="w-3 h-3 text-slate-500" /> {currentStudent.dorm}
                      </span>
                      {currentStudent.rfidTag && (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold rounded-lg flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-indigo-500" /> RFID: {currentStudent.rfidTag}
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                      {currentStudent.name}
                    </h1>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1">
                      <span>NISN / ID: <strong className="text-slate-800 font-mono">{currentStudent.id}</strong></span>
                      <span>•</span>
                      <span>Wali Asuh: <strong className="text-slate-800">{currentStudent.caretaker || '-'}</strong></span>
                      {currentStudent.gender && (
                        <>
                          <span>•</span>
                          <span>JK: <strong className="text-slate-800">{currentStudent.gender}</strong></span>
                        </>
                      )}
                      {currentStudent.parentPhone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <Phone className="w-3 h-3" /> {currentStudent.parentPhone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleOpenEditModal}
                    className="px-3.5 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" /> Edit Biodata
                  </button>

                  <button
                    onClick={() => generateStudentCardPDF(currentStudent, config)}
                    className="px-3.5 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Cetak KTA Kartu Siswa & QR"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" /> Cetak KTA
                  </button>

                  <button
                    onClick={() =>
                      generateStudentViolationHistoryPDF(currentStudent, violations, config)
                    }
                    className="px-3.5 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Cetak Buku Historis Pelanggaran PDF"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Historis
                  </button>
                </div>
              </div>

              {/* Physical Biometrics & Uniform Badges */}
              <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Tinggi Badan</span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {currentStudent.height ? `${currentStudent.height} cm` : '-'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Berat Badan</span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {currentStudent.weight ? `${currentStudent.weight} kg` : '-'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Status BMI</span>
                  <span className={`text-xs font-bold block truncate mt-0.5 ${bmiInfo ? bmiInfo.category.includes('Normal') ? 'text-emerald-700' : 'text-amber-700' : 'text-slate-400'}`}>
                    {bmiInfo ? `${bmiInfo.bmi} (${bmiInfo.category})` : '-'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Ukuran Baju</span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {currentStudent.shirtSize || '-'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Ukuran Celana</span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {currentStudent.pantsSize || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 4-PILLAR KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Discipline Score KPI */}
            <div
              onClick={() => setActiveSubTab('violations')}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skor Disiplin</span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {studentDisciplineScore.score}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-600">
                  {studentDisciplineScore.status?.label || 'Sangat Baik'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {studentViolations.length} Kasus Tercatat
                </span>
              </div>
            </div>

            {/* 2. Daily Checklist Compliance KPI */}
            <div
              onClick={() => setActiveSubTab('checklist')}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ceklist Harian</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {journalStats.complianceRate}%
                </span>
                <span className="text-xs text-slate-400 font-bold">Kepatuhan</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700">
                  Rata-rata {journalStats.avgCompleted} / 8 Tugas
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {journalStats.totalDays} Hari Terisi
                </span>
              </div>
            </div>

            {/* 3. Report Card Status KPI */}
            <div
              onClick={() => setActiveSubTab('report-card')}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rapor Keasramaan</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FileSignature className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {studentReport ? 'Terbit & Tercatat' : 'Belum Terisi'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-700">
                  {studentReport ? `${Object.keys(studentReport.grades || {}).length} Kategori Dinilai` : 'Siap Diinput'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Semester {config.semester || 'Genap'}
                </span>
              </div>
            </div>

            {/* 4. Attendance & Health KPI */}
            <div
              onClick={() => setActiveSubTab('attendance')}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Presensi Sholat</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {attendanceStats.rate}%
                </span>
                <span className="text-xs text-slate-400 font-bold">Kehadiran</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700">
                  {attendanceStats.presentCount} / {attendanceStats.totalSessions} Sesi
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {studentMedical.length} Rekam Medis
                </span>
              </div>
            </div>
          </div>

          {/* 4. TAB NAVIGATION STRIP */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Ringkasan Terpadu
            </button>

            <button
              onClick={() => setActiveSubTab('violations')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'violations'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Pelanggaran ({studentViolations.length})
            </button>

            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'checklist'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Ceklist Harian ({studentJournals.length})
            </button>

            <button
              onClick={() => setActiveSubTab('report-card')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'report-card'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" /> Rapor Keasramaan
            </button>

            <button
              onClick={() => setActiveSubTab('counseling')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'counseling'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Konseling BK ({studentCounseling.length})
            </button>

            <button
              onClick={() => setActiveSubTab('medical')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'medical'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" /> UKS & Kesehatan ({studentMedical.length})
            </button>

            <button
              onClick={() => setActiveSubTab('leaves')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'leaves'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" /> Izin Keluar ({studentLeaves.length})
            </button>

            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'attendance'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> Presensi Sholat ({studentAttendance.length})
            </button>
          </div>

          {/* 5. TAB CONTENT CONTAINER */}
          <div className="space-y-6">
            {/* === SUB-TAB 1: RINGKASAN TERPADU (OVERVIEW) === */}
            {activeSubTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Discipline & Habits Snapshot */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Discipline Status Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Status Ketertiban & Disiplin Siswa</h3>
                          <p className="text-xs text-slate-500">
                            Poin Akumulasi: <strong className="text-red-700">{studentDisciplineScore.totalDeducted} Poin Pelanggaran</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => generateStudentViolationHistoryPDF(currentStudent, violations, config)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Historis PDF
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Skor Integritas Disiplin</span>
                        <span className="text-red-700 font-bold">{studentDisciplineScore.score} / 100</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            studentDisciplineScore.score >= 80
                              ? 'bg-emerald-500'
                              : studentDisciplineScore.score >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${studentDisciplineScore.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent 3 Violations */}
                    {studentViolations.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Catatan Pelanggaran Terakhir
                        </span>
                        <div className="space-y-2">
                          {studentViolations.slice(0, 3).map((v) => (
                            <div
                              key={v.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded text-[10px]">
                                    Tingkat {v.level}
                                  </span>
                                  <span className="font-bold text-slate-800">{v.violation}</span>
                                </div>
                                <p className="text-slate-500 text-[11px]">
                                  Sanksi: <strong className="text-slate-700">{v.sanction || '-'}</strong>
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                {formatDateIndonesian(v.date, false)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Siswa teladan! Tidak ada catatan pelanggaran tata tertib pada semester ini.</span>
                      </div>
                    )}
                  </div>

                  {/* Daily Habits & Checklist Snapshot */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Aktivitas & Ceklist Harian Asrama</h3>
                          <p className="text-xs text-slate-500">
                            Kepatuhan Rata-rata: <strong className="text-emerald-700">{journalStats.complianceRate}%</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsQuickChecklistOpen(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Catat Ceklist Hari Ini
                      </button>
                    </div>

                    {studentJournals.length > 0 ? (
                      <div className="space-y-3">
                        {studentJournals.slice(0, 3).map((j) => (
                          <div key={j.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">
                                {formatDateIndonesian(j.date, true)} ({j.timeRange})
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                                {j.tasksCompleted} / {j.totalTasks} Tugas Selesai
                              </span>
                            </div>

                            {j.notes && (
                              <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                                "{j.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs text-center space-y-2">
                        <p>Belum ada rekaman jurnal ceklist harian untuk siswa ini.</p>
                        <button
                          onClick={() => setIsQuickChecklistOpen(true)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                        >
                          Catat Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Report Card & Quick Actions */}
                <div className="space-y-6">
                  {/* Report Card Snapshot */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800 text-sm">Rapor Asrama</h3>
                      </div>
                      {studentReport && (
                        <button
                          onClick={() =>
                            printReportCardPDF(
                              currentStudent,
                              studentReport,
                              studentViolations,
                              config,
                              studentCounseling,
                              studentMedical
                            )
                          }
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Cetak Rapor PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {studentReport ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(studentReport.grades || {}).map(([catKey, grade]) => (
                            <div key={catKey} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                              <span className="text-[10px] font-semibold text-slate-500 block truncate capitalize">
                                {catKey}
                              </span>
                              <span className="text-lg font-black text-amber-600">{grade || '-'}</span>
                            </div>
                          ))}
                        </div>

                        {studentReport.specialNote && (
                          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs space-y-1">
                            <span className="text-[10px] font-bold text-amber-900 uppercase">Catatan Wali Asuh:</span>
                            <p className="text-slate-700 italic text-[11px]">{studentReport.specialNote}</p>
                          </div>
                        )}

                        <button
                          onClick={() =>
                            printReportCardPDF(
                              currentStudent,
                              studentReport,
                              studentViolations,
                              config,
                              studentCounseling,
                              studentMedical
                            )
                          }
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Rapor Keasramaan (PDF)
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs text-center space-y-2">
                        <p>Rapor keasramaan semester ini belum diisi.</p>
                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('report-card')}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                          >
                            Buka Menu Rapor
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Medical & Leave Snapshot */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-600" /> Ringkasan Medis & Izin
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span>Total Kunjungan UKS</span>
                        <strong className="text-slate-800 font-bold">{studentMedical.length} Kali</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span>Surat Izin Keluar Aktif</span>
                        <strong className="text-slate-800 font-bold">
                          {studentLeaves.filter((l) => l.status === 'Active').length} Izin
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span>Sesi Bimbingan BK</span>
                        <strong className="text-slate-800 font-bold">{studentCounseling.length} Sesi</strong>
                      </div>
                    </div>
                  </div>

                  {/* Menstruation Records Snapshot (For Female Students) */}
                  {currentStudent?.gender === 'Perempuan' && (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HeartPulse className="w-5 h-5 text-rose-500" />
                          <h3 className="font-bold text-slate-800 text-sm">Rekam Menstruasi</h3>
                        </div>
                        {studentMenstruation.length > 0 && (
                          <button
                            onClick={() =>
                              generateSingleStudentMenstruationCardPDF(currentStudent, studentMenstruation, config)
                            }
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Cetak Kartu Rekam PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {studentMenstruation.length > 0 ? (
                        <div className="space-y-3">
                          {studentMenstruation.slice(0, 3).map((m) => (
                            <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                              <div className="space-y-0.5">
                                <span className={`font-bold ${
                                  m.status === 'Suci / Siap Beribadah' ? 'text-emerald-700' :
                                  m.status === 'Masa Bersuci' ? 'text-amber-700' : 'text-rose-700'
                                }`}>
                                  {m.status}
                                </span>
                                <span className="block text-[11px] text-slate-500">
                                  {formatDateIndonesian(m.startDate)} - {m.endDate ? formatDateIndonesian(m.endDate) : 'Sekarang'}
                                </span>
                              </div>
                              <span className="font-bold text-slate-700 text-[10px] bg-white px-2 py-1 rounded border border-slate-200">
                                {m.durationText || (m.durationDays ? `${m.durationDays} Hari` : '-')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs text-center space-y-2">
                          <p>Belum ada riwayat menstruasi.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* === SUB-TAB 2: DETAIL PELANGGARAN & DISIPLIN === */}
            {activeSubTab === 'violations' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Historis Lengkap Pelanggaran & Tata Tertib</h3>
                    <p className="text-xs text-slate-500">
                      Seluruh catatan kasus, tingkat sanksi, dan pengurangan poin kedisiplinan siswa.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedSummonsViolation(studentViolations[0] || null);
                        setIsSummonsModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Buat Surat Panggilan Orang Tua Resmi"
                    >
                      <MailWarning className="w-3.5 h-3.5" /> Buat Surat Panggilan Ortu
                    </button>
                    <button
                      onClick={() => generateStudentViolationHistoryPDF(currentStudent, violations, config)}
                      className="flex-1 sm:flex-initial px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Buku Historis (PDF)
                    </button>
                  </div>
                </div>

                {studentViolations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 rounded-l-xl font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Tingkat</th>
                          <th className="p-3 font-bold">Bentuk Pelanggaran</th>
                          <th className="p-3 font-bold">Sanksi / Pembinaan</th>
                          <th className="p-3 font-bold">Catatan Kronologi</th>
                          <th className="p-3 font-bold">Pelapor</th>
                          <th className="p-3 rounded-r-xl font-bold text-center">Aksi Dokumen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentViolations.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                              {formatDateIndonesian(v.date, true)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-lg text-[11px]">
                                Tingkat {v.level}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">{v.violation}</td>
                            <td className="p-3 text-slate-700 font-medium">{v.sanction || '-'}</td>
                            <td className="p-3 text-slate-500 max-w-xs">{v.note || '-'}</td>
                            <td className="p-3 text-slate-600 whitespace-nowrap">{v.reporter || 'Wali Asuh'}</td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedSummonsViolation(v);
                                    setIsSummonsModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                                  title="Buat & Cetak Surat Panggilan Orang Tua Resmi"
                                >
                                  <MailWarning className="w-3 h-3 text-amber-600" /> Panggilan Ortu
                                </button>
                                <button
                                  onClick={() =>
                                    generateViolationNoticePDF(v, currentStudent, config)
                                  }
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                                  title="Cetak Surat Pemberitahuan Pelanggaran Ortu"
                                >
                                  <Printer className="w-3 h-3" /> Surat Ortu
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-slate-700">Tidak Ada Catatan Pelanggaran</h4>
                    <p className="text-xs text-slate-500">
                      Siswa memiliki integritas kedisiplinan yang prima tanpa pelanggaran tata tertib.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 3: DETAIL CEKLIST HARIAN === */}
            {activeSubTab === 'checklist' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Riwayat Ceklist & Kebiasaan Mandiri</h3>
                    <p className="text-xs text-slate-500">
                      Rekaman kepatuhan aktivitas ibadah, kebersihan kamar, belajar mandiri, dan kedisiplinan harian.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsQuickChecklistOpen(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Catat Ceklist Baru
                  </button>
                </div>

                {studentJournals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentJournals.map((j) => (
                      <div key={j.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {formatDateIndonesian(j.date, true)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Rentang: {j.timeRange}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                              {j.tasksCompleted} / {j.totalTasks} Selesai
                            </span>
                            <button
                              onClick={() => printJournalPDF(j, currentStudent, config)}
                              className="p-1.5 bg-white text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
                              title="Cetak Jurnal PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task List Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {(j.tasksSnapshot || []).map((t, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg flex items-center gap-2 ${
                                t.done ? 'bg-emerald-50 text-emerald-900 font-medium' : 'bg-slate-100 text-slate-400 line-through'
                              }`}
                            >
                              {t.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{t.task}</span>
                            </div>
                          ))}
                        </div>

                        {j.notes && (
                          <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                            "{j.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckSquare className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700">Belum Ada Rekaman Ceklist</h4>
                    <p className="text-xs text-slate-500">
                      Gunakan tombol "Catat Ceklist Baru" untuk mencatat tugas harian siswa.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 4: RAPOR KEASRAMAAN === */}
            {activeSubTab === 'report-card' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Rapor Penilaian Pembinaan Keasramaan</h3>
                    <p className="text-xs text-slate-500">
                      Semester {config.semester || 'Genap'} • Tahun Ajaran {config.academicYear || '2025/2026'}
                    </p>
                  </div>

                  {studentReport && (
                    <button
                      onClick={() =>
                        printReportCardPDF(
                          currentStudent,
                          studentReport,
                          studentViolations,
                          config,
                          studentCounseling,
                          studentMedical
                        )
                      }
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Cetak Rapor Lengkap (PDF)
                    </button>
                  )}
                </div>

                {studentReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {RAPOR_STRUCTURE.map((cat) => {
                        const grade = studentReport.grades?.[cat.name] || studentReport.grades?.[cat.key] || '-';
                        const desc = studentReport.descriptions?.[cat.name] || studentReport.descriptions?.[cat.key] || '';
                        return (
                          <div key={cat.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-800 capitalize">{cat.name}</h4>
                              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black text-sm rounded-lg">
                                {grade}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 min-h-[50px]">
                              {desc || 'Belum ada uraian deskripsi capaian.'}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Special Growth Notes */}
                    <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                      <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" /> Catatan Perkembangan & Rekomendasi Wali Asuh
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed italic">
                        "{studentReport.specialNote || 'Siswa menunjukkan komitmen yang baik dalam mengikuti seluruh ritme pembinaan asrama.'}"
                      </p>
                      <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-semibold flex justify-between">
                        <span>Wali Asuh: {studentReport.customCaretaker || currentStudent.caretaker || '-'}</span>
                        <span>{studentReport.customCaretakerNip || '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <FileSignature className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700">Rapor Belum Terisi</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Silakan buka menu Rapor Keasramaan untuk mengisi nilai predikat, deskripsi capaian, dan catatan wali asuh.
                    </p>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('report-card')}
                        className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl"
                      >
                        Buka Menu Rapor Keasramaan
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 5: KONSELING BK === */}
            {activeSubTab === 'counseling' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Riwayat Bimbingan & Konseling (BK)</h3>
                    <p className="text-xs text-slate-500">
                      Catatan pembinaan emosional, adaptasi, dan rencana tindak lanjut.
                    </p>
                  </div>
                </div>

                {studentCounseling.length > 0 ? (
                  <div className="space-y-3">
                    {studentCounseling.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{formatDateIndonesian(c.date, true)}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">Masalah: <span className="font-normal text-slate-700">{c.caseDescription}</span></p>
                          <p className="font-semibold text-slate-900">Hasil Sesi: <span className="font-normal text-slate-700">{c.notes}</span></p>
                          <p className="font-semibold text-slate-900">Rencana Tindak Lanjut: <span className="font-normal text-slate-700">{c.followUp || '-'}</span></p>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200/50">
                          Konselor / Pembina: {c.counselor}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-xs">Tidak ada catatan sesi konseling untuk siswa ini.</p>
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 6: UKS & KESEHATAN === */}
            {activeSubTab === 'medical' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Rekam Medis & Layanan UKS</h3>
                    <p className="text-xs text-slate-500">
                      Riwayat pemeriksaan keluhan kesehatan, diagnosa, dan izin istirahat sakit.
                    </p>
                  </div>
                </div>

                {studentMedical.length > 0 ? (
                  <div className="space-y-3">
                    {studentMedical.map((m) => (
                      <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{formatDateIndonesian(m.date, true)} ({m.time || '08:00'})</span>
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">{m.location}</span>
                          </div>
                          {m.isSickLeave && (
                            <button
                              onClick={() => printSickLeavePDF(m, currentStudent, config)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Surat Izin Sakit
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                          <div><strong>Keluhan / Gejala:</strong> {m.symptoms}</div>
                          <div><strong>Diagnosa:</strong> {m.diagnosis}</div>
                          <div><strong>Tindakan / Obat:</strong> {m.treatment}</div>
                          <div><strong>Suhu & Vital:</strong> Suhu: {m.temperature || '-'} | {m.vitalSigns || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-xs">Belum ada catatan keluhan kesehatan di UKS.</p>
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 7: PERIZINAN KELUAR ASRAMA === */}
            {activeSubTab === 'leaves' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Riwayat Surat Izin Keluar & Kepulangan</h3>
                    <p className="text-xs text-slate-500">
                      Surat izin berobat, pesiar, maupun kepulangan bermalam siswa asrama.
                    </p>
                  </div>
                </div>

                {studentLeaves.length > 0 ? (
                  <div className="space-y-3">
                    {studentLeaves.map((l) => (
                      <div key={l.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{l.type} - {l.reason}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {l.status === 'Active' ? 'Sedang Izin' : 'Telah Kembali'}
                            </span>
                            <button
                              onClick={() => printLeavePassPDF(l, currentStudent, config)}
                              className="p-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-slate-900"
                              title="Cetak Surat Izin"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-slate-600 text-[11px] space-y-0.5">
                          <p>Berangkat: <strong>{formatDateIndonesian(l.leaveDate, true)} {l.leaveTime || ''}</strong></p>
                          <p>Kembali: <strong>{formatDateIndonesian(l.returnDate, true)} {l.returnTime || ''}</strong></p>
                          <p>Pendamping: {l.caretaker || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-xs">Tidak ada riwayat surat izin keluar tercatat.</p>
                  </div>
                )}
              </div>
            )}

            {/* === SUB-TAB 8: PRESENSI SHOLAT & KEGIATAN === */}
            {activeSubTab === 'attendance' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Presensi Sholat & Aktivitas Asrama</h3>
                    <p className="text-xs text-slate-500">
                      Rekaman kehadiran melalui RFID Scanner, QR Code, atau presensi wali asrama.
                    </p>
                  </div>
                </div>

                {studentAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 rounded-l-xl font-bold">Tanggal & Waktu</th>
                          <th className="p-3 font-bold">Sesi Aktivitas</th>
                          <th className="p-3 font-bold">Status Kehadiran</th>
                          <th className="p-3 rounded-r-xl font-bold">Petugas / Scan By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentAttendance.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-medium text-slate-700">
                              {formatDateIndonesian(a.date, true)} ({a.timestamp})
                            </td>
                            <td className="p-3 font-bold text-slate-900">{a.prayerTime}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                a.status === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'Izin Sakit'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{a.scannedBy || 'QR Reader'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-xs">Belum ada riwayat absensi tercatat untuk siswa ini.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State when no student matches search filter */}
      {!currentStudent && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Siswa Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tidak ditemukan data siswa yang cocok dengan pencarian{' '}
            {searchQuery && (
              <span>
                &quot;<strong className="text-slate-700">{searchQuery}</strong>&quot;
              </span>
            )}
            {classFilter && ` di jenjang ${classFilter}`}
            {dormFilter && ` di asrama ${dormFilter}`}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setClassFilter('');
              setDormFilter('');
            }}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 active:scale-95"
          >
            <X className="w-4 h-4" /> Reset Semua Filter
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL QUICK CEKLIST HARIAN (INPUT LANGSUNG DARI PROFIL) */}
      {/* ========================================================================= */}
      {isQuickChecklistOpen && currentStudent && (
        <div className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 my-4 sm:my-8 flex flex-col">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                <h3 className="font-bold text-sm">Catat Ceklist Harian • {currentStudent.name}</h3>
              </div>
              <button onClick={() => setIsQuickChecklistOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={checklistTimeStart}
                    onChange={(e) => setChecklistTimeStart(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={checklistTimeEnd}
                    onChange={(e) => setChecklistTimeEnd(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Daftar Tugas & Kebiasaan Mandiri</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allDone: Record<number, boolean> = {};
                      ROUTINE_TASKS.forEach((t) => (allDone[t.id] = true));
                      setQuickTaskStates(allDone);
                    }}
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Centang Semua Selesai
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {ROUTINE_TASKS.map((item) => {
                    const isChecked = !!quickTaskStates[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setQuickTaskStates((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>{item.task}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isChecked ? 'bg-emerald-200/70 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isChecked ? 'Selesai' : 'Belum'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 text-xs block mb-1">Catatan Evaluasi / Pembinaan</label>
                <textarea
                  rows={2}
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  placeholder="Catatan perkembangan khusus siswa hari ini..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickChecklistOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickChecklist}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Simpan Jurnal Ceklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL EDIT BIODATA SISWA (DILENGKAPI FOTO & BIO LENGKAP) */}
      {/* ========================================================================= */}
      {isEditModalOpen && currentStudent && (
        <div className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 my-4 sm:my-8 flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm">Edit Biodata Murid • {currentStudent.name}</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NISN / Nomor Induk *</label>
                  <input
                    type="text"
                    required
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RFID / NFC Card UID</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1029384756"
                    value={formRfidTag}
                    onChange={(e) => setFormRfidTag(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenjang Pendidikan</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value as ClassLevel)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gedung Asrama</label>
                  <select
                    value={formDorm}
                    onChange={(e) => setFormDorm(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {dormList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Wali Asuh Pendamping</label>
                  <select
                    value={formCaretaker}
                    onChange={(e) => setFormCaretaker(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {cleanWaliAsuh.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    value={formHeight}
                    onChange={(e) => setFormHeight(e.target.value)}
                    placeholder="Contoh: 145"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder="Contoh: 38"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ukuran Baju</label>
                  <input
                    type="text"
                    value={formShirtSize}
                    onChange={(e) => setFormShirtSize(e.target.value)}
                    placeholder="S / M / L / XL"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ukuran Celana</label>
                  <input
                    type="text"
                    value={formPantsSize}
                    onChange={(e) => setFormPantsSize(e.target.value)}
                    placeholder="28 / 29 / 30 / M"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Kontak Orang Tua / Wali</label>
                  <input
                    type="tel"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-2 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generator Surat Panggilan Orang Tua Modal */}
      <ParentSummonsModal
        isOpen={isSummonsModalOpen}
        onClose={() => {
          setIsSummonsModalOpen(false);
          setSelectedSummonsViolation(null);
        }}
        students={students}
        violations={violations}
        config={config}
        selectedViolation={selectedSummonsViolation}
        selectedStudentId={selectedStudentId}
        onShowToast={onShowToast}
      />
    </div>
  );
};
