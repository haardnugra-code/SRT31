import React, { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Download,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Code,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  HeartPulse,
  DoorOpen,
  CalendarCheck,
  FileSignature,
  Megaphone,
  Check,
  X,
  Sparkles,
  Layers,
  HelpCircle,
  Copy
} from 'lucide-react';
import {
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  MedicalRecord,
  PrayerAttendance,
  ReportCardData,
  AppConfig
} from '../types';

export type DatabaseTableKey =
  | 'students'
  | 'violations'
  | 'counseling'
  | 'leaves'
  | 'dailyJournals'
  | 'medicalRecords'
  | 'prayerAttendance'
  | 'reportCards'
  | 'announcements';

interface DatabaseCrudManagerProps {
  students: Student[];
  onSaveStudent: (student: Student, isEdit: boolean) => void;
  onDeleteStudent: (id: string) => void;

  violations: Violation[];
  onSaveViolation: (violation: Violation, isEdit: boolean) => void;
  onDeleteViolation: (id: string) => void;

  counseling: Counseling[];
  onSaveCounseling: (counseling: Counseling, isEdit: boolean) => void;
  onDeleteCounseling: (id: string) => void;

  leaves: Leave[];
  onSaveLeave: (leave: Leave, isEdit: boolean) => void;
  onDeleteLeave: (id: string) => void;

  dailyJournals: DailyJournal[];
  onSaveJournal: (journal: DailyJournal) => void;
  onDeleteJournal: (id: string) => void;

  medicalRecords: MedicalRecord[];
  onSaveMedicalRecord: (record: MedicalRecord) => void;
  onDeleteMedicalRecord: (id: string) => void;

  reports: Record<string, ReportCardData>;
  onSaveReport: (studentId: string, data: ReportCardData) => void;
  onDeleteReport?: (studentId: string) => void;

  prayerAttendance: PrayerAttendance[];
  onSavePrayerAttendance: (records: PrayerAttendance[]) => void;
  onDeletePrayerAttendance?: (id: string) => void;

  announcement: string;
  onUpdateAnnouncement: (msg: string) => void;

  config: AppConfig;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const DatabaseCrudManager: React.FC<DatabaseCrudManagerProps> = ({
  students,
  onSaveStudent,
  onDeleteStudent,
  violations,
  onSaveViolation,
  onDeleteViolation,
  counseling,
  onSaveCounseling,
  onDeleteCounseling,
  leaves,
  onSaveLeave,
  onDeleteLeave,
  dailyJournals,
  onSaveJournal,
  onDeleteJournal,
  medicalRecords,
  onSaveMedicalRecord,
  onDeleteMedicalRecord,
  reports,
  onSaveReport,
  onDeleteReport,
  prayerAttendance,
  onSavePrayerAttendance,
  onDeletePrayerAttendance,
  announcement,
  onUpdateAnnouncement,
  config,
  onShowToast,
  onSync,
  isSyncing = false
}) => {
  const [activeTable, setActiveTable] = useState<DatabaseTableKey>('students');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});

  // View Details Modal
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);

  // Delete Confirm Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; label: string } | null>(null);

  // Raw JSON Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');

  // Table Metadata Definition
  const tablesMeta: Record<
    DatabaseTableKey,
    {
      label: string;
      sheetName: string;
      icon: React.ElementType;
      color: string;
      count: number;
      idField: string;
      displayColumns: { key: string; label: string }[];
    }
  > = {
    students: {
      label: 'Data Siswa',
      sheetName: 'Students',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      count: students.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'NISN / ID' },
        { key: 'name', label: 'Nama Lengkap' },
        { key: 'class', label: 'Jenjang' },
        { key: 'dorm', label: 'Asrama' },
        { key: 'caretaker', label: 'Wali Asuh' },
        { key: 'rfidTag', label: 'RFID UID' }
      ]
    },
    violations: {
      label: 'Pelanggaran',
      sheetName: 'Violations',
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50 border-red-200',
      count: violations.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Kasus' },
        { key: 'date', label: 'Tanggal' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'level', label: 'Tingkat' },
        { key: 'violation', label: 'Jenis Pelanggaran' },
        { key: 'sanction', label: 'Sanksi' }
      ]
    },
    counseling: {
      label: 'Konseling',
      sheetName: 'Counseling',
      icon: HelpCircle,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      count: counseling.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Konseling' },
        { key: 'date', label: 'Tanggal' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'counselingField', label: 'Bidang' },
        { key: 'counselor', label: 'Guru Pembimbing' },
        { key: 'status', label: 'Status' }
      ]
    },
    leaves: {
      label: 'Izin Keluar',
      sheetName: 'Leaves',
      icon: DoorOpen,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      count: leaves.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Surat' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'category', label: 'Kategori' },
        { key: 'leaveDate', label: 'Tgl Keluar' },
        { key: 'returnDate', label: 'Tgl Kembali' },
        { key: 'status', label: 'Status' }
      ]
    },
    dailyJournals: {
      label: 'Jurnal Harian',
      sheetName: 'DailyJournals',
      icon: CalendarCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      count: dailyJournals.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Jurnal' },
        { key: 'date', label: 'Tanggal' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'tasksCompleted', label: 'Selesai' },
        { key: 'totalTasks', label: 'Total Tugas' }
      ]
    },
    medicalRecords: {
      label: 'Rekam Medis UKS',
      sheetName: 'MedicalRecords',
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      count: medicalRecords.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Medis' },
        { key: 'date', label: 'Tanggal' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'symptoms', label: 'Gejala' },
        { key: 'diagnosis', label: 'Diagnosa' },
        { key: 'status', label: 'Status' }
      ]
    },
    prayerAttendance: {
      label: 'Presensi Sholat',
      sheetName: 'PrayerAttendance',
      icon: CheckCircle2,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      count: prayerAttendance.length,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID Presensi' },
        { key: 'date', label: 'Tanggal' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'prayerTime', label: 'Waktu Sholat' },
        { key: 'status', label: 'Status' },
        { key: 'timestamp', label: 'Waktu Scan' }
      ]
    },
    reportCards: {
      label: 'Rapor Siswa',
      sheetName: 'ReportCards',
      icon: FileSignature,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      count: Object.keys(reports).length,
      idField: 'studentId',
      displayColumns: [
        { key: 'studentId', label: 'NISN Siswa' },
        { key: 'studentName', label: 'Nama Siswa' },
        { key: 'semester', label: 'Semester' },
        { key: 'academicYear', label: 'Tahun Ajaran' },
        { key: 'customCaretaker', label: 'Wali Asuh' }
      ]
    },
    announcements: {
      label: 'Pengumuman',
      sheetName: 'Announcements',
      icon: Megaphone,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      count: announcement ? 1 : 0,
      idField: 'id',
      displayColumns: [
        { key: 'id', label: 'ID' },
        { key: 'message', label: 'Pesan Running Text' },
        { key: 'status', label: 'Status' }
      ]
    }
  };

  // Convert raw data array based on active table
  const tableData = useMemo(() => {
    switch (activeTable) {
      case 'students':
        return students;
      case 'violations':
        return violations;
      case 'counseling':
        return counseling;
      case 'leaves':
        return leaves;
      case 'dailyJournals':
        return dailyJournals;
      case 'medicalRecords':
        return medicalRecords;
      case 'prayerAttendance':
        return prayerAttendance;
      case 'reportCards':
        return Object.entries(reports).map(([sId, r]) => {
          const reportObj = r as ReportCardData & { studentName?: string };
          return {
            studentId: sId,
            studentName: reportObj.studentName || students.find((s) => s.id === sId)?.name || 'Siswa',
            semester: reportObj.semester || config.semester || 'Genap',
            academicYear: reportObj.academicYear || config.academicYear || '2025/2026',
            customCaretaker: reportObj.customCaretaker || '-',
            ...reportObj
          };
        });
      case 'announcements':
        return announcement
          ? [{ id: 'ANN001', message: announcement, status: 'Aktif' }]
          : [];
      default:
        return [];
    }
  }, [activeTable, students, violations, counseling, leaves, dailyJournals, medicalRecords, prayerAttendance, reports, announcement, config]);

  // Filtered & Paginated records
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.toLowerCase().trim();
    return tableData.filter((item: any) => {
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [tableData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Handle Create / New Record Form Open
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId('');
    const today = new Date().toISOString().split('T')[0];

    let initial: Record<string, any> = {};
    switch (activeTable) {
      case 'students':
        initial = {
          id: `SR${String(Date.now()).slice(-4)}`,
          name: '',
          class: 'SD',
          dorm: config.dormList[0] || 'Asrama Terpadu',
          caretaker: config.waliAsuhList[0]?.split('|')[0] || 'Wali Asuh',
          rfidTag: '',
          height: 145,
          weight: 40,
          gender: 'Laki-Laki'
        };
        break;
      case 'violations':
        initial = {
          id: `VIOL-${Date.now()}`,
          date: today,
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          level: 1,
          violation: 'Keterlambatan Sholat Berjamaah',
          sanction: 'Teguran lisan & istighfar',
          note: 'Dicatat oleh pembina asrama',
          reporter: config.waliAsrama || 'Wali Asrama'
        };
        break;
      case 'counseling':
        initial = {
          id: `BK-${Date.now()}`,
          date: today,
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          counselingField: 'Pribadi',
          counselingType: 'Konseling Individu',
          counselor: config.waliAsrama || 'Guru BK',
          caseDescription: 'Pendampingan motivasi belajar dan disiplin asrama',
          notes: 'Siswa kooperatif dan memahami komitmen',
          followUp: 'Evaluasi berkala 1 pekan ke depan',
          status: 'Open'
        };
        break;
      case 'leaves':
        initial = {
          id: `IZN-${Date.now()}`,
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          category: 'Izin Keluar Sementara',
          type: 'Reguler',
          reason: 'Keperluan keluarga penting',
          leaveDate: today,
          returnDate: today,
          caretaker: config.waliAsrama || 'Wali Asrama',
          status: 'Active'
        };
        break;
      case 'dailyJournals':
        initial = {
          id: `JRN-${Date.now()}`,
          date: today,
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          tasksCompleted: 8,
          totalTasks: 10,
          notes: 'Menyelesaikan amalan harian dengan baik'
        };
        break;
      case 'medicalRecords':
        initial = {
          id: `MED-${Date.now()}`,
          date: today,
          time: '08:00 WIB',
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          symptoms: 'Demam ringan dan pusing',
          diagnosis: 'Gejala flu (Observasi UKS)',
          treatment: 'Paracetamol 500mg, istirahat dan air hangat',
          status: 'Dalam Perawatan UKS',
          officer: 'Petugas UKS'
        };
        break;
      case 'prayerAttendance':
        initial = {
          id: `PRY-${Date.now()}`,
          date: today,
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          class: students[0]?.class || 'SD',
          dorm: students[0]?.dorm || 'Asrama Terpadu',
          prayerTime: 'Subuh',
          status: 'Hadir',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          scannedBy: 'Scan Manual / RFID'
        };
        break;
      case 'reportCards':
        initial = {
          studentId: students[0]?.id || '',
          studentName: students[0]?.name || '',
          semester: config.semester || 'Genap',
          academicYear: config.academicYear || '2025/2026',
          customCaretaker: config.waliAsrama || '',
          grades: { '1': 'A', '2': 'A', '3': 'B' },
          descriptions: { '1': 'Sangat disiplin', '2': 'Aktif ibadah' }
        };
        break;
      case 'announcements':
        initial = {
          id: 'ANN001',
          message: announcement || 'Selamat datang di Sistem Informasi Keasramaan Sekolah Rakyat 31 Palembang.',
          status: 'Aktif'
        };
        break;
    }
    setFormData(initial);
    setIsFormModalOpen(true);
  };

  // Handle Edit Record Open
  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    const idKey = tablesMeta[activeTable].idField;
    setEditingId(String(item[idKey] || item.id));
    setFormData({ ...item });
    setIsFormModalOpen(true);
  };

  // Handle Save / Submit Form
  const handleSaveFormData = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      switch (activeTable) {
        case 'students':
          onSaveStudent(formData as Student, isEditing);
          break;
        case 'violations':
          onSaveViolation(formData as Violation, isEditing);
          break;
        case 'counseling':
          onSaveCounseling(formData as Counseling, isEditing);
          break;
        case 'leaves':
          onSaveLeave(formData as Leave, isEditing);
          break;
        case 'dailyJournals':
          onSaveJournal(formData as DailyJournal);
          break;
        case 'medicalRecords':
          onSaveMedicalRecord(formData as MedicalRecord);
          break;
        case 'prayerAttendance':
          if (isEditing) {
            const updated = prayerAttendance.map((p) =>
              p.id === formData.id ? (formData as PrayerAttendance) : p
            );
            onSavePrayerAttendance(updated);
          } else {
            onSavePrayerAttendance([formData as PrayerAttendance, ...prayerAttendance]);
          }
          break;
        case 'reportCards':
          onSaveReport(formData.studentId, formData as ReportCardData);
          break;
        case 'announcements':
          onUpdateAnnouncement(formData.message || '');
          break;
      }
      setIsFormModalOpen(false);
      onShowToast(
        isEditing ? 'Data Berhasil Diperbarui' : 'Data Baru Berhasil Ditambahkan',
        `Operasi CRUD pada tabel ${tablesMeta[activeTable].sheetName} berhasil disimpan & disinkronkan ke database.`,
        'success'
      );
    } catch (err) {
      onShowToast('Gagal Menyimpan Data', String(err), 'error');
    }
  };

  // Handle Delete Record
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const { id } = deleteConfirmTarget;

    switch (activeTable) {
      case 'students':
        onDeleteStudent(id);
        break;
      case 'violations':
        onDeleteViolation(id);
        break;
      case 'counseling':
        onDeleteCounseling(id);
        break;
      case 'leaves':
        onDeleteLeave(id);
        break;
      case 'dailyJournals':
        onDeleteJournal(id);
        break;
      case 'medicalRecords':
        onDeleteMedicalRecord(id);
        break;
      case 'prayerAttendance':
        if (onDeletePrayerAttendance) {
          onDeletePrayerAttendance(id);
        } else {
          onSavePrayerAttendance(prayerAttendance.filter((p) => p.id !== id));
        }
        break;
      case 'reportCards':
        if (onDeleteReport) {
          onDeleteReport(id);
        }
        break;
      case 'announcements':
        onUpdateAnnouncement('');
        break;
    }

    setDeleteConfirmTarget(null);
    onShowToast('Data Dihapus', `Baris record ID ${id} berhasil dihapus dari tabel ${tablesMeta[activeTable].sheetName}.`, 'warning');
  };

  // Seed Realistic CRUD Sample Records for Testing
  const handleSeedSampleData = () => {
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];

    if (activeTable === 'students') {
      const sampleStudent: Student = {
        id: `SR${String(timestamp).slice(-4)}`,
        name: `Siswa Teladan ${String(timestamp).slice(-3)}`,
        class: 'SMP',
        dorm: config.dormList[0] || 'Asrama Terpadu',
        caretaker: config.waliAsuhList[0]?.split('|')[0] || 'Wali Asuh',
        rfidTag: `RFID-${String(timestamp).slice(-6)}`,
        height: 155,
        weight: 48,
        gender: 'Laki-Laki',
        shirtSize: 'M',
        pantsSize: '30'
      };
      onSaveStudent(sampleStudent, false);
    } else if (activeTable === 'violations') {
      const st = students[0] || { id: 'SR1001', name: 'Siswa Contoh' };
      const sampleViolation: Violation = {
        id: `VIOL-${timestamp}`,
        studentId: st.id,
        studentName: st.name,
        date: today,
        level: 1,
        violation: 'Keterlambatan Hadir Apel Pagi',
        sanction: 'Pembinaan kedisiplinan & membaca surah pendek',
        note: 'Diberikan pengarahan oleh pembina asrama',
        reporter: config.waliAsrama || 'Wali Asrama',
        semester: config.semester || 'Genap',
        academicYear: config.academicYear || '2025/2026'
      };
      onSaveViolation(sampleViolation, false);
    } else if (activeTable === 'counseling') {
      const st = students[0] || { id: 'SR1001', name: 'Siswa Contoh' };
      const sampleCounseling: Counseling = {
        id: `BK-${timestamp}`,
        studentId: st.id,
        studentName: st.name,
        date: today,
        time: '13:30 WIB',
        sessionNumber: 1,
        location: 'Ruang BK & Konseling',
        counselor: config.waliAsrama || 'Guru BK',
        counselingType: 'Konseling Individu',
        counselingField: 'Pribadi',
        urgencyLevel: 'Rutin',
        caseDescription: 'Konsultasi adaptasi belajar dan target hafalan Qur\'an',
        notes: 'Siswa antusias dan bersedia menyusun jadwal belajar mandiri',
        studentCommitment: 'Belajar teratur 1 jam setiap malam',
        followUp: 'Evaluasi jadwal 1 pekan kemudian',
        status: 'In Progress'
      };
      onSaveCounseling(sampleCounseling, false);
    } else if (activeTable === 'leaves') {
      const st = students[0] || { id: 'SR1001', name: 'Siswa Contoh' };
      const sampleLeave: Leave = {
        id: `IZN-${timestamp}`,
        studentId: st.id,
        studentName: st.name,
        category: 'Izin Keluar Sementara',
        type: 'Reguler',
        reason: 'Keperluan administrasi keluarga di kota',
        leaveDate: today,
        returnDate: today,
        caretaker: config.waliAsrama || 'Wali Asrama',
        status: 'Active',
        letterNumber: `042/SR31/IZN/${new Date().getFullYear()}`
      };
      onSaveLeave(sampleLeave, false);
    } else if (activeTable === 'medicalRecords') {
      const st = students[0] || { id: 'SR1001', name: 'Siswa Contoh' };
      const sampleMed: MedicalRecord = {
        id: `MED-${timestamp}`,
        date: today,
        time: '09:15',
        studentId: st.id,
        studentName: st.name,
        location: 'UKS Asrama',
        symptoms: 'Sakit tenggorokan dan batuk ringan',
        diagnosis: 'Faringitis Akut (ISPA Ringan)',
        treatment: 'Ambroxol syrup & vitamin C 500mg, anjuran istirahat cukup',
        restDays: 1,
        isSickLeave: true,
        status: 'Dalam Perawatan',
        officer: 'Petugas Medis UKS'
      };
      onSaveMedicalRecord(sampleMed);
    } else if (activeTable === 'prayerAttendance') {
      const st = students[0] || { id: 'SR1001', name: 'Siswa Contoh' };
      const samplePrayer: PrayerAttendance = {
        id: `PRY-${timestamp}`,
        date: today,
        studentId: st.id,
        studentName: st.name,
        class: st.class || 'SD',
        dorm: st.dorm || 'Asrama Terpadu',
        prayerTime: 'Maghrib',
        status: 'Hadir',
        timestamp: '18:15:00 WIB',
        scannedBy: 'Auto RFID Gate'
      };
      onSavePrayerAttendance([samplePrayer, ...prayerAttendance]);
    } else if (activeTable === 'announcements') {
      onUpdateAnnouncement(`Pengumuman Terpadu (${today}): Seluruh siswa wajib mematuhi jam belajar malam dan menjaga kebersihan asrama.`);
    }

    onShowToast(
      'Data Sampel Berhasil Dibuat',
      `Data sampel untuk tabel ${tablesMeta[activeTable].sheetName} berhasil ditambahkan dan disinkronkan.`,
      'success'
    );
  };

  // Export Table Data to JSON File
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(tableData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DATABASE_${tablesMeta[activeTable].sheetName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Ekspor Berhasil', `Data tabel ${tablesMeta[activeTable].sheetName} berhasil diunduh dalam format JSON.`, 'success');
  };

  // Import JSON to Table
  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error('Data JSON harus berupa Array / List objek []');
      }

      if (activeTable === 'students') {
        parsed.forEach((item: Student) => {
          if (item.id && item.name) onSaveStudent(item, false);
        });
      } else if (activeTable === 'violations') {
        parsed.forEach((item: Violation) => {
          if (item.id) onSaveViolation(item, false);
        });
      } else if (activeTable === 'counseling') {
        parsed.forEach((item: Counseling) => {
          if (item.id) onSaveCounseling(item, false);
        });
      } else if (activeTable === 'leaves') {
        parsed.forEach((item: Leave) => {
          if (item.id) onSaveLeave(item, false);
        });
      } else if (activeTable === 'medicalRecords') {
        parsed.forEach((item: MedicalRecord) => {
          if (item.id) onSaveMedicalRecord(item);
        });
      } else if (activeTable === 'prayerAttendance') {
        onSavePrayerAttendance([...parsed, ...prayerAttendance]);
      }

      setIsImportModalOpen(false);
      setJsonInput('');
      onShowToast('Impor Berhasil', `${parsed.length} baris data berhasil diimpor ke tabel ${tablesMeta[activeTable].sheetName}.`, 'success');
    } catch (err: any) {
      onShowToast('Gagal Impor JSON', err.message || 'Format JSON tidak valid.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* 1. Header Banner & Database Info */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-md shadow-red-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Pusat Manajemen CRUD Database Google Sheets
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live CRUD Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola, buat (Create), baca (Read), perbarui (Update), dan hapus (Delete) seluruh tabel database secara instan & tersinkronisasi.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Sinkronkan seluruh data dari Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Cloud</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
            title="Ekspor tabel aktif ke format JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekspor JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
            title="Impor batch data JSON ke tabel ini"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Impor JSON</span>
          </button>

          <button
            type="button"
            onClick={handleSeedSampleData}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
            title="Suntikkan / Tambah data sampel realistis untuk menguji alur CRUD"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Uji Tambah Data Sampel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Table Selector Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(tablesMeta) as DatabaseTableKey[]).map((key) => {
          const meta = tablesMeta[key];
          const Icon = meta.icon;
          const isActive = activeTable === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTable(key);
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{meta.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {meta.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search Bar & Status Subheader */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Cari data pada tabel ${tablesMeta[activeTable].label} (Sheet: ${tablesMeta[activeTable].sheetName})...`}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 font-medium px-1">
          <span>
            Menampilkan <strong>{filteredData.length}</strong> dari <strong>{tableData.length}</strong> record
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] text-slate-600">Sheet: {tablesMeta[activeTable].sheetName}</span>
        </div>
      </div>

      {/* 4. CRUD Table View */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5 text-center w-12">No</th>
              {tablesMeta[activeTable].displayColumns.map((col) => (
                <th key={col.key} className="py-3 px-3.5">
                  {col.label}
                </th>
              ))}
              <th className="py-3 px-3.5 text-right w-28">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={tablesMeta[activeTable].displayColumns.length + 2}
                  className="py-10 text-center text-slate-400"
                >
                  <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600 text-xs">Belum ada baris data pada tabel ini.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan tombol <strong>"Tambah Data Baru"</strong> atau <strong>"Uji Tambah Data Sampel"</strong> untuk memulai.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row: any, idx: number) => {
                const rowId = row[tablesMeta[activeTable].idField] || row.id || `row-${idx}`;
                return (
                  <tr key={rowId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>

                    {tablesMeta[activeTable].displayColumns.map((col) => {
                      const val = row[col.key];
                      let displayVal = val !== undefined && val !== null ? String(val) : '-';
                      if (typeof val === 'object') {
                        displayVal = JSON.stringify(val);
                      }

                      return (
                        <td key={col.key} className="py-3 px-3.5 max-w-[200px] truncate">
                          {col.key === 'id' || col.key === 'studentId' ? (
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {displayVal}
                            </span>
                          ) : col.key === 'status' ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                displayVal === 'Active' || displayVal === 'Open' || displayVal === 'Hadir' || displayVal === 'Aktif'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : displayVal === 'Returned' || displayVal === 'Resolved' || displayVal === 'Sembuh/Kembali KBM'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {displayVal}
                            </span>
                          ) : col.key === 'level' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-800">
                              Tingkat {displayVal}
                            </span>
                          ) : (
                            <span className="text-slate-800 font-medium">{displayVal}</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingRecord(row)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition active:scale-95"
                          title="Lihat Raw Record / JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition active:scale-95"
                          title="Edit Baris Data Ini (Update)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              id: rowId,
                              label: row.name || row.studentName || row.id || 'Baris Data'
                            })
                          }
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition active:scale-95"
                          title="Hapus Baris Data Ini (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE / UPDATE RECORD FORM --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                  {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {isEditing ? `Edit Record (${editingId})` : `Tambah Data Baru (${tablesMeta[activeTable].sheetName})`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Form input CRUD langsung tersimpan ke state lokal & Google Spreadsheet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFormData} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
              {/* Dynamic Form Generation based on table */}
              {activeTable === 'students' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">NISN / ID Siswa *</label>
                      <input
                        type="text"
                        required
                        disabled={isEditing}
                        value={formData.id || ''}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">RFID UID (Opsional)</label>
                      <input
                        type="text"
                        value={formData.rfidTag || ''}
                        onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                        placeholder="e.g. 1029384756"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenjang Kelas</label>
                      <select
                        value={formData.class || 'SD'}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Gedung Asrama</label>
                      <select
                        value={formData.dorm || config.dormList[0] || 'Asrama Terpadu'}
                        onChange={(e) => setFormData({ ...formData, dorm: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                      >
                        {config.dormList.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Wali Asuh</label>
                    <select
                      value={formData.caretaker || ''}
                      onChange={(e) => setFormData({ ...formData, caretaker: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      {config.waliAsuhList.map((w) => {
                        const nameOnly = w.split('|')[0];
                        return (
                          <option key={w} value={nameOnly}>
                            {w}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              {activeTable === 'violations' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ID Kasus</label>
                      <input
                        type="text"
                        disabled
                        value={formData.id || ''}
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Pilih Siswa *</label>
                    <select
                      value={formData.studentId || ''}
                      onChange={(e) => {
                        const selectedSt = students.find((s) => s.id === e.target.value);
                        setFormData({
                          ...formData,
                          studentId: e.target.value,
                          studentName: selectedSt ? selectedSt.name : formData.studentName
                        });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id}) - {s.class}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tingkat (Level 1-5)</label>
                      <select
                        value={formData.level || 1}
                        onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Tingkat {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Pelapor / Pembina</label>
                      <input
                        type="text"
                        value={formData.reporter || ''}
                        onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Pelanggaran *</label>
                    <input
                      type="text"
                      required
                      value={formData.violation || ''}
                      onChange={(e) => setFormData({ ...formData, violation: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sanksi Edukatif</label>
                    <input
                      type="text"
                      value={formData.sanction || ''}
                      onChange={(e) => setFormData({ ...formData, sanction: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Other table fields fallback editor */}
              {activeTable !== 'students' && activeTable !== 'violations' && (
                <div className="space-y-3">
                  {tablesMeta[activeTable].displayColumns.map((col) => (
                    <div key={col.key}>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">{col.label}</label>
                      <input
                        type="text"
                        value={formData[col.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: VIEW RAW RECORD / JSON DETAILS --- */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Detail Baris Record (JSON View)</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-72 overflow-y-auto">
              <pre>{JSON.stringify(viewingRecord, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(viewingRecord, null, 2));
                  onShowToast('Disalin', 'JSON baris record berhasil disalin ke clipboard.', 'success');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Salin JSON
              </button>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM DELETE --- */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hapus Data Database?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus record <strong>{deleteConfirmTarget.label}</strong> (ID: {deleteConfirmTarget.id})? Tindakan ini akan menghapus baris dari database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Ya, Hapus Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: IMPORT JSON --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Impor Data JSON ke Sheet: {tablesMeta[activeTable].sheetName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempelkan Array JSON (e.g. [ {'{ "id": "...", ... }'} ])
              </label>
              <textarea
                rows={8}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[&#10;  {&#10;    "id": "SR9901",&#10;    "name": "Ahmad Dani",&#10;    "class": "SMP",&#10;    "dorm": "Asrama Terpadu"&#10;  }&#10;]'
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!jsonInput.trim()}
                onClick={handleImportJSON}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Proses Impor Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
