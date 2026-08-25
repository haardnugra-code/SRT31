import React, { useState, useMemo } from 'react';
import {
  Student,
  MenstruationRecord,
  MenstruationStatus,
  AppConfig
} from '../types';
import {
  Calendar,
  Sparkles,
  Heart,
  Droplet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Printer,
  FileSpreadsheet,
  BookOpen,
  UserCheck,
  CalendarHeart,
  ChevronRight,
  ShieldCheck,
  Activity,
  Edit2,
  Trash2,
  ExternalLink,
  Info,
  CheckSquare,
  HelpCircle,
  Flame,
  Award,
  Users,
  SunMedium
} from 'lucide-react';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import { generateMenstruationRecapPDF, generateSingleStudentMenstruationCardPDF } from '../services/pdfGenerator';

interface MenstruationTrackingTabProps {
  students: Student[];
  records: MenstruationRecord[];
  config: AppConfig;
  userRole?: 'admin' | 'guru';
  onSaveRecord: (record: MenstruationRecord, isEdit: boolean) => void;
  onDeleteRecord: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

// Common symptoms for menstruation tracking
const SYMPTOM_OPTIONS = [
  'Nyeri Perut / Disminore',
  'Kram Perut Bawah',
  'Pusing / Sakit Kepala',
  'Lemas / Cepat Lelah',
  'Mual / Kurang Nafsu Makan',
  'Sakit Pinggang / Punggung',
  'Emosi Tidak Stabil / Moody',
  'Perut Kembung'
];

export const MenstruationTrackingTab: React.FC<MenstruationTrackingTabProps> = ({
  students,
  records,
  config,
  userRole = 'admin',
  onSaveRecord,
  onDeleteRecord,
  onShowToast,
  onAskConfirm
}) => {
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'fiqih_guide' | 'statistics'>('tracker');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStopBleedingModalOpen, setIsStopBleedingModalOpen] = useState(false);
  const [isPurificationModalOpen, setIsPurificationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFiqihModalOpen, setIsFiqihModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected item for actions
  const [selectedRecord, setSelectedRecord] = useState<MenstruationRecord | null>(null);

  // Form states for New / Edit Record
  const [formData, setFormData] = useState<{
    id?: string;
    studentId: string;
    studentName: string;
    class?: string;
    dorm?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    status: MenstruationStatus;
    symptoms: string[];
    painLevel: number;
    medicineOrCare: string;
    sanitaryPadsProvided: number;
    purificationDate: string;
    purificationTime: string;
    purificationVerifiedBy: string;
    readyForWorshipDate: string;
    notes: string;
    recordedBy: string;
  }>({
    studentId: '',
    studentName: '',
    class: 'SMA',
    dorm: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endDate: '',
    endTime: '',
    status: 'Sedang Haid',
    symptoms: [],
    painLevel: 1,
    medicineOrCare: '',
    sanitaryPadsProvided: 2,
    purificationDate: '',
    purificationTime: '06:00',
    purificationVerifiedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI',
    readyForWorshipDate: '',
    notes: '',
    recordedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI'
  });

  // Stop bleeding form state
  const [stopBleedingData, setStopBleedingData] = useState<{
    endDate: string;
    endTime: string;
    notes: string;
  }>({
    endDate: new Date().toISOString().split('T')[0],
    endTime: '15:00',
    notes: 'Darah haid sudah berhenti bersih. Memasuki masa bersuci (persiapan mandi wajib).'
  });

  // Purification form state
  const [purificationData, setPurificationData] = useState<{
    purificationDate: string;
    purificationTime: string;
    verifiedBy: string;
    notes: string;
  }>({
    purificationDate: new Date().toISOString().split('T')[0],
    purificationTime: '17:00',
    verifiedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI',
    notes: 'Telah selesai melaksanakan mandi wajib thaharah. Sudah suci dan siap kembali sholat 5 waktu serta mengaji.'
  });

  // Print modal state
  const [printFilterStatus, setPrintFilterStatus] = useState<string>('all');
  const [printFilterDorm, setPrintFilterDorm] = useState<string>('all');
  const [printPembina, setPrintPembina] = useState<string>(
    config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI'
  );

  // Female Students only
  const femaleStudents = useMemo(() => {
    return students.filter((s) => {
      const g = (s.gender || '').toLowerCase();
      // Female gender matching
      if (g.includes('p') || g.includes('perempuan') || g.includes('wanita') || g.includes('female')) {
        return true;
      }
      // If gender not specified, check dorm names associated with female
      const d = (s.dorm || '').toLowerCase();
      if (d.includes('cut nyak dien') || d.includes('kartini') || d.includes('dewi sartika') || d.includes('putri')) {
        return true;
      }
      return false;
    });
  }, [students]);

  // Fallback to all students if female filter is empty
  const selectableStudents = femaleStudents.length > 0 ? femaleStudents : students;

  // Calculate live days of menstruation helper
  const calculateDuration = (startD: string, startT: string = '00:00', endD?: string, endT: string = '23:59') => {
    if (!startD) return { days: 0, text: '-' };
    try {
      const start = new Date(`${startD}T${startT || '00:00'}:00`).getTime();
      const end = endD ? new Date(`${endD}T${endT || '00:00'}:00`).getTime() : new Date().getTime();
      const diffMs = Math.max(0, end - start);
      const totalHours = diffMs / (1000 * 60 * 60);
      const days = Math.floor(totalHours / 24);
      const hours = Math.floor(totalHours % 24);

      const daysDecimal = Number((totalHours / 24).toFixed(2));
      let text = '';
      if (days === 0 && hours === 0) {
        text = 'Baru Mulai';
      } else if (days === 0) {
        text = `${hours} Jam`;
      } else if (hours === 0) {
        text = `${days} Hari`;
      } else {
        text = `${days} Hari ${hours} Jam`;
      }

      return {
        days: daysDecimal,
        exactDays: days,
        exactHours: hours,
        text
      };
    } catch (e) {
      return { days: 0, text: '-' };
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search
      const search = searchTerm.toLowerCase();
      const nameMatch = (rec.studentName || '').toLowerCase().includes(search);
      const idMatch = (rec.studentId || '').toLowerCase().includes(search);
      const dormMatch = (rec.dorm || '').toLowerCase().includes(search);
      if (searchTerm && !nameMatch && !idMatch && !dormMatch) return false;

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Sedang Haid' && rec.status !== 'Sedang Haid') return false;
        if (statusFilter === 'Masa Bersuci' && rec.status !== 'Masa Bersuci') return false;
        if (statusFilter === 'Suci / Siap Beribadah' && rec.status !== 'Suci / Siap Beribadah') return false;
        if (statusFilter === 'Istihadhah' && rec.status !== 'Istihadhah (Perlu Perhatian)') return false;
      }

      // Dorm Filter
      if (dormFilter !== 'all') {
        if (rec.dorm !== dormFilter) return false;
      }

      // Class Filter
      if (classFilter !== 'all') {
        if (rec.class !== classFilter) return false;
      }

      return true;
    });
  }, [records, searchTerm, statusFilter, dormFilter, classFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = records.length;
    const sedangHaid = records.filter((r) => r.status === 'Sedang Haid').length;
    const masaBersuci = records.filter((r) => r.status === 'Masa Bersuci').length;
    const siapIbadah = records.filter((r) => r.status === 'Suci / Siap Beribadah').length;
    const istihadhah = records.filter((r) => r.status === 'Istihadhah (Perlu Perhatian)').length;

    const completed = records.filter((r) => r.durationDays && r.durationDays > 0);
    const avgDuration = completed.length > 0
      ? (completed.reduce((acc, curr) => acc + (curr.durationDays || 0), 0) / completed.length).toFixed(1)
      : '0';

    const totalPads = records.reduce((acc, curr) => acc + (curr.sanitaryPadsProvided || 0), 0);

    return {
      total,
      sedangHaid,
      masaBersuci,
      siapIbadah,
      istihadhah,
      avgDuration,
      totalPads
    };
  }, [records]);

  // Handle open create modal
  const handleOpenCreate = () => {
    const firstStudent = selectableStudents[0];
    setFormData({
      studentId: firstStudent ? firstStudent.id : '',
      studentName: firstStudent ? firstStudent.name : '',
      class: firstStudent ? firstStudent.class : 'SMA',
      dorm: firstStudent ? firstStudent.dorm : 'Asrama Cut Nyak Dien',
      startDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
      endDate: '',
      endTime: '',
      status: 'Sedang Haid',
      symptoms: ['Nyeri Perut / Disminore'],
      painLevel: 2,
      medicineOrCare: 'Kompres air hangat di asrama & istirahat secukupnya',
      sanitaryPadsProvided: 2,
      purificationDate: '',
      purificationTime: '06:00',
      purificationVerifiedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI',
      readyForWorshipDate: '',
      notes: 'Mulai haid hari pertama. Izin libur sholat berjamaah & puasa.',
      recordedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI'
    });
    setIsCreateModalOpen(true);
  };

  // Handle select student in create form
  const handleSelectStudentChange = (studentId: string) => {
    const found = selectableStudents.find((s) => s.id === studentId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        studentId: found.id,
        studentName: found.name,
        class: found.class,
        dorm: found.dorm
      }));
    }
  };

  // Save new record
  const handleSaveNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.startDate) {
      onShowToast('Data Belum Lengkap', 'Silakan pilih siswi dan tanggal mulai haid.', 'warning');
      return;
    }

    const dur = calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime);

    const newRecord: MenstruationRecord = {
      id: `MENS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: formData.studentId,
      studentName: formData.studentName,
      class: formData.class as any,
      dorm: formData.dorm,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate || undefined,
      endTime: formData.endTime || undefined,
      durationDays: dur.days > 0 ? dur.days : undefined,
      durationText: dur.text !== '-' ? dur.text : undefined,
      status: formData.status,
      symptoms: formData.symptoms,
      painLevel: formData.painLevel,
      medicineOrCare: formData.medicineOrCare,
      sanitaryPadsProvided: Number(formData.sanitaryPadsProvided) || 0,
      purificationDate: formData.purificationDate || undefined,
      purificationTime: formData.purificationTime || undefined,
      purificationVerifiedBy: formData.purificationVerifiedBy,
      readyForWorshipDate: formData.readyForWorshipDate || undefined,
      notes: formData.notes,
      recordedBy: formData.recordedBy
    };

    onSaveRecord(newRecord, false);
    setIsCreateModalOpen(false);
    onShowToast('Berhasil Dicatat', `Catatan masa menstruasi untuk ${formData.studentName} berhasil disimpan.`, 'success');
  };

  // Open Stop Bleeding Modal
  const handleOpenStopBleeding = (record: MenstruationRecord) => {
    setSelectedRecord(record);
    const now = new Date();
    const curDate = now.toISOString().split('T')[0];
    const curTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    setStopBleedingData({
      endDate: curDate,
      endTime: curTime,
      notes: 'Darah haid telah berhenti bersih (tanda suci qasshah baidha’ / jafaf). Memasuki masa bersuci untuk mandi wajib.'
    });
    setIsStopBleedingModalOpen(true);
  };

  // Submit Stop Bleeding (Transition to Masa Bersuci)
  const handleSubmitStopBleeding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const dur = calculateDuration(
      selectedRecord.startDate,
      selectedRecord.startTime,
      stopBleedingData.endDate,
      stopBleedingData.endTime
    );

    // If duration > 15 days, it might be Istihadhah
    const isIstihadhah = dur.days > 15;
    const nextStatus: MenstruationStatus = isIstihadhah ? 'Istihadhah (Perlu Perhatian)' : 'Masa Bersuci';

    const updatedRecord: MenstruationRecord = {
      ...selectedRecord,
      endDate: stopBleedingData.endDate,
      endTime: stopBleedingData.endTime,
      durationDays: dur.days,
      durationText: dur.text,
      status: nextStatus,
      notes: `${selectedRecord.notes ? selectedRecord.notes + ' | ' : ''}${stopBleedingData.notes}`
    };

    onSaveRecord(updatedRecord, true);
    setIsStopBleedingModalOpen(false);
    onShowToast(
      'Masa Haid Selesai',
      `Darah haid ${selectedRecord.studentName} tercatat berhenti setelah ${dur.text}. Status beralih ke Masa Bersuci (Mandi Wajib).`,
      'success'
    );
  };

  // Open Purification Modal
  const handleOpenPurification = (record: MenstruationRecord) => {
    setSelectedRecord(record);
    const now = new Date();
    const curDate = now.toISOString().split('T')[0];
    const curTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    setPurificationData({
      purificationDate: curDate,
      purificationTime: curTime,
      verifiedBy: config.waliAsuhList?.[0]?.split('|')[0] || 'ULPA JAYANTI',
      notes: 'Telah melaksanakan mandi wajib thaharah dengan sempurna. Telah suci dan siap aktif kembali sholat fardhu berjamaah serta tilawah Al-Qur\'an.'
    });
    setIsPurificationModalOpen(true);
  };

  // Submit Purification (Transition to Suci / Siap Beribadah)
  const handleSubmitPurification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const updatedRecord: MenstruationRecord = {
      ...selectedRecord,
      purificationDate: purificationData.purificationDate,
      purificationTime: purificationData.purificationTime,
      purificationVerifiedBy: purificationData.verifiedBy,
      readyForWorshipDate: `${purificationData.purificationDate}T${purificationData.purificationTime}`,
      status: 'Suci / Siap Beribadah',
      notes: `${selectedRecord.notes ? selectedRecord.notes + ' | ' : ''}${purificationData.notes}`
    };

    onSaveRecord(updatedRecord, true);
    setIsPurificationModalOpen(false);
    onShowToast(
      'Siap Beribadah',
      `Alhamdulillah! ${selectedRecord.studentName} telah selesai mandi wajib bersuci dan siap kembali sholat 5 waktu & beribadah.`,
      'success'
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (record: MenstruationRecord) => {
    setSelectedRecord(record);
    setFormData({
      id: record.id,
      studentId: record.studentId,
      studentName: record.studentName,
      class: record.class || 'SMA',
      dorm: record.dorm || '',
      startDate: record.startDate,
      startTime: record.startTime || '07:00',
      endDate: record.endDate || '',
      endTime: record.endTime || '',
      status: record.status,
      symptoms: record.symptoms || [],
      painLevel: record.painLevel || 1,
      medicineOrCare: record.medicineOrCare || '',
      sanitaryPadsProvided: record.sanitaryPadsProvided || 0,
      purificationDate: record.purificationDate || '',
      purificationTime: record.purificationTime || '06:00',
      purificationVerifiedBy: record.purificationVerifiedBy || '',
      readyForWorshipDate: record.readyForWorshipDate || '',
      notes: record.notes || '',
      recordedBy: record.recordedBy || ''
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const dur = calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime);

    const updatedRecord: MenstruationRecord = {
      ...selectedRecord,
      studentId: formData.studentId,
      studentName: formData.studentName,
      class: formData.class as any,
      dorm: formData.dorm,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate || undefined,
      endTime: formData.endTime || undefined,
      durationDays: dur.days > 0 ? dur.days : undefined,
      durationText: dur.text !== '-' ? dur.text : undefined,
      status: formData.status,
      symptoms: formData.symptoms,
      painLevel: formData.painLevel,
      medicineOrCare: formData.medicineOrCare,
      sanitaryPadsProvided: Number(formData.sanitaryPadsProvided) || 0,
      purificationDate: formData.purificationDate || undefined,
      purificationTime: formData.purificationTime || undefined,
      purificationVerifiedBy: formData.purificationVerifiedBy,
      readyForWorshipDate: formData.readyForWorshipDate || undefined,
      notes: formData.notes,
      recordedBy: formData.recordedBy
    };

    onSaveRecord(updatedRecord, true);
    setIsEditModalOpen(false);
    onShowToast('Perubahan Disimpan', `Catatan menstruasi ${formData.studentName} berhasil diperbarui.`, 'success');
  };

  // Handle Delete Record
  const handleDelete = async (record: MenstruationRecord) => {
    const confirm = await onAskConfirm(
      'Hapus Catatan Menstruasi?',
      `Apakah Anda yakin ingin menghapus data catatan menstruasi ${record.studentName} (${formatDateShort(record.startDate)})? Tindakan ini tidak dapat dibatalkan.`
    );
    if (confirm) {
      onDeleteRecord(record.id);
      onShowToast('Data Dihapus', `Catatan menstruasi ${record.studentName} berhasil dihapus.`, 'info');
    }
  };

  // Handle Print Single Student Card PDF
  const handlePrintStudentCard = async (record: MenstruationRecord) => {
    const student = students.find((s) => s.id === record.studentId) || {
      id: record.studentId,
      name: record.studentName,
      class: record.class || 'SMA',
      dorm: record.dorm || 'Asrama Putri',
      caretaker: record.recordedBy || 'Pembina Asrama'
    };

    const studentRecords = records.filter((r) => r.studentId === record.studentId);

    try {
      onShowToast('Menyiapkan Kartu PDF', `Membuat Kartu Kontrol Menstruasi untuk ${record.studentName}...`, 'info');
      await generateSingleStudentMenstruationCardPDF(student, studentRecords, config);
      onShowToast('Berhasil Diunduh', `Kartu Kontrol Menstruasi ${record.studentName} siap dicetak.`, 'success');
    } catch (e: any) {
      onShowToast('Gagal Mencetak', e?.message || 'Terjadi kesalahan saat membuat PDF.', 'error');
    }
  };

  // Handle Execute Batch Print PDF
  const handleExecutePrintRecap = async () => {
    let target = records;
    if (printFilterStatus !== 'all') {
      target = target.filter((r) => r.status === printFilterStatus);
    }
    if (printFilterDorm !== 'all') {
      target = target.filter((r) => r.dorm === printFilterDorm);
    }

    if (target.length === 0) {
      onShowToast('Data Kosong', 'Tidak ada data yang sesuai filter untuk dicetak.', 'warning');
      return;
    }

    try {
      setIsPrintModalOpen(false);
      onShowToast('Membuat Dokumen PDF', `Menyiapkan ${target.length} data rekapitulasi menstruasi...`, 'info');
      await generateMenstruationRecapPDF(target, config, {
        pembinaName: printPembina
      });
      onShowToast('Berhasil Diunduh', `Laporan Rekapitulasi Menstruasi & Kesiapan Ibadah siap dicetak.`, 'success');
    } catch (e: any) {
      onShowToast('Gagal Mencetak', e?.message || 'Terjadi kesalahan saat memproses file PDF.', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      onShowToast('Data Kosong', 'Belum ada data catatan menstruasi untuk diekspor.', 'warning');
      return;
    }

    const headers = [
      'ID',
      'NISN/ID Siswi',
      'Nama Siswi',
      'Kelas',
      'Asrama',
      'Tanggal Mulai',
      'Jam Mulai',
      'Tanggal Selesai',
      'Jam Selesai',
      'Total Durasi (Hari)',
      'Durasi Teks',
      'Tanggal Mandi Bersuci',
      'Jam Mandi Bersuci',
      'Verifikator Bersuci',
      'Status Ibadah',
      'Keluhan Gejala',
      'Skala Nyeri (1-5)',
      'Pembalut Diberikan',
      'Catatan / Penanganan',
      'Pencatat'
    ];

    const rows = records.map((r) => [
      r.id,
      r.studentId,
      `"${r.studentName}"`,
      r.class || '',
      `"${r.dorm || ''}"`,
      r.startDate,
      r.startTime || '',
      r.endDate || '',
      r.endTime || '',
      r.durationDays || '',
      `"${r.durationText || ''}"`,
      r.purificationDate || '',
      r.purificationTime || '',
      `"${r.purificationVerifiedBy || ''}"`,
      `"${r.status}"`,
      `"${(r.symptoms || []).join(', ')}"`,
      r.painLevel || '',
      r.sanitaryPadsProvided || 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${r.recordedBy || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_Tracking_Menstruasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Ekspor Berhasil', 'Data berhasil diekspor ke file CSV.', 'success');
  };

  // Toggle symptom checkbox helper
  const handleToggleSymptom = (sym: string) => {
    setFormData((prev) => {
      const exists = prev.symptoms.includes(sym);
      return {
        ...prev,
        symptoms: exists ? prev.symptoms.filter((s) => s !== sym) : [...prev.symptoms, sym]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-rose-100">
              <CalendarHeart className="w-3.5 h-3.5 text-rose-300" />
              <span>Manajemen Kesehatan Reproduksi & Fiqih Ibadah Asrama Putri</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Tracking Menstruasi & Kesiapan Ibadah
            </h1>
            <p className="text-sm text-rose-100/90 leading-relaxed">
              Pencatatan siklus masa haid, penghitungan durasi hari menstruasi, monitoring masa bersuci (mandi wajib thaharah), hingga konfirmasi kesiapan kembali melaksanakan ibadah sholat 5 waktu berjamaah.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsFiqihModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-white rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-rose-600" />
              <span>Panduan Fiqih Thaharah</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-400/40 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Mulai Haid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Sedang Haid */}
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Sedang Haid</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950">{stats.sedangHaid}</span>
            <span className="text-xs text-rose-600 font-medium">Siswi (Udzur Sholat)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Bebas sholat berjamaah & puasa</p>
        </div>

        {/* 2. Masa Bersuci */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Masa Bersuci</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{stats.masaBersuci}</span>
            <span className="text-xs text-amber-600 font-medium">Siswi (Persiapan Mandi)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Darah berhenti, siap mandi wajib</p>
        </div>

        {/* 3. Suci / Siap Beribadah */}
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Siap Beribadah</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950">{stats.siapIbadah}</span>
            <span className="text-xs text-emerald-600 font-medium">Siswi (Suci Aktif)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sudah mandi wajib, aktif sholat</p>
        </div>

        {/* 4. Rata-rata Durasi Menstruasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Rata-rata Durasi</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.avgDuration}</span>
            <span className="text-xs text-slate-500 font-medium">Hari / Siklus</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Normal fiqih: 6 - 7 Hari</p>
        </div>
      </div>

      {/* Main Container: Controls & List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sub-Tab Navigation Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
          {/* Sub tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('tracker')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'tracker'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CalendarHeart className="w-4 h-4" />
              <span>Daftar Tracking & Siklus ({filteredRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('fiqih_guide')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'fiqih_guide'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ketentuan Fiqih & Niat Mandi Wajib</span>
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Ekspor data ke file CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Cetak Laporan Rekapitulasi PDF Resmi"
            >
              <Printer className="w-4 h-4 text-rose-600" />
              <span>Cetak Rekap PDF</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'tracker' && (
          <div className="p-6 space-y-6">
            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama siswi / NISN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Filter Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-700"
              >
                <option value="all">Semua Status Ibadah</option>
                <option value="Sedang Haid">🔴 Sedang Haid (Udzur Sholat)</option>
                <option value="Masa Bersuci">🟡 Masa Bersuci (Mandi Wajib)</option>
                <option value="Suci / Siap Beribadah">🟢 Suci / Siap Beribadah</option>
                <option value="Istihadhah">🟣 Istihadhah (&gt;15 Hari)</option>
              </select>

              {/* Filter Dorm */}
              <select
                value={dormFilter}
                onChange={(e) => setDormFilter(e.target.value)}
                className="px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-700"
              >
                <option value="all">Semua Asrama Putri</option>
                {config.dormList
                  .filter((d) => d.toLowerCase().includes('cut') || d.toLowerCase().includes('kartini') || d.toLowerCase().includes('sartika') || d.toLowerCase().includes('putri'))
                  .map((dorm) => (
                    <option key={dorm} value={dorm}>{dorm}</option>
                  ))}
              </select>

              {/* Filter Class */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-700"
              >
                <option value="all">Semua Jenjang Kelas</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>

            {/* List of Menstruation Records */}
            {filteredRecords.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <CalendarHeart className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Belum Ada Catatan Menstruasi</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  {searchTerm || statusFilter !== 'all' || dormFilter !== 'all' || classFilter !== 'all'
                    ? 'Tidak ditemukan data yang sesuai dengan kriteria filter pencarian Anda.'
                    : 'Belum ada siswi yang dicatat dalam siklus haid saat ini. Klik tombol di bawah untuk mencatat siswi yang mulai haid.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Siswi Mulai Haid</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => {
                  const liveDur = calculateDuration(
                    record.startDate,
                    record.startTime,
                    record.endDate,
                    record.endTime
                  );

                  const isOngoing = record.status === 'Sedang Haid';
                  const isBersuci = record.status === 'Masa Bersuci';
                  const isSuci = record.status === 'Suci / Siap Beribadah';
                  const isIstihadhah = record.status === 'Istihadhah (Perlu Perhatian)' || (isOngoing && liveDur.days > 15);

                  return (
                    <div
                      key={record.id}
                      className={`rounded-2xl border transition-all p-5 ${
                        isOngoing
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                          : isBersuci
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      } shadow-xs hover:shadow-md`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Student Info & Timeline */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {record.studentName}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              Kelas {record.class || '-'}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {record.dorm || 'Asrama Putri'}
                            </span>

                            {/* Status Badge */}
                            {isOngoing && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                                <Droplet className="w-3 h-3 fill-rose-500" />
                                <span>Sedang Haid (Udzur Sholat)</span>
                              </span>
                            )}
                            {isBersuci && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Masa Bersuci (Persiapan Mandi Wajib)</span>
                              </span>
                            )}
                            {isSuci && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Suci - Siap Beribadah</span>
                              </span>
                            )}
                            {isIstihadhah && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                <AlertCircle className="w-3 h-3 text-purple-600" />
                                <span>Istihadhah (&gt;15 Hari)</span>
                              </span>
                            )}
                          </div>

                          {/* Time Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                            {/* Start Time */}
                            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                                Mulai Haid:
                              </span>
                              <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                <span>{formatDateShort(record.startDate)}</span>
                                <span className="text-slate-500 font-normal">({record.startTime || '-'})</span>
                              </div>
                            </div>

                            {/* Duration / Catatan Waktu Berapa Hari Mens */}
                            <div className={`rounded-xl p-2.5 border ${
                              isOngoing ? 'bg-rose-100/50 border-rose-300' : 'bg-white/80 border-slate-200'
                            }`}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                                Catatan Durasi Waktu:
                              </span>
                              <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-600" />
                                {isOngoing ? (
                                  <span className="text-rose-700 font-black">
                                    Hari ke-{liveDur.exactDays + 1} ({liveDur.text})
                                  </span>
                                ) : (
                                  <span className="text-slate-800 font-bold">
                                    {record.durationText || (record.durationDays ? `${record.durationDays} Hari` : liveDur.text)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Purification / Mandi Wajib Status */}
                            <div className={`rounded-xl p-2.5 border ${
                              isSuci ? 'bg-emerald-50 border-emerald-200' : 'bg-white/80 border-slate-200'
                            }`}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                                Mandi Wajib (Bersuci):
                              </span>
                              <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                                {isSuci ? (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{formatDateShort(record.purificationDate || record.startDate)} ({record.purificationTime || '-'})</span>
                                  </>
                                ) : isBersuci ? (
                                  <span className="text-amber-700 font-bold">Darah berhenti, belum mandi</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">Masih masa haid</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Symptoms & Care details */}
                          {(record.symptoms?.length || record.medicineOrCare || record.notes) && (
                            <div className="text-xs text-slate-600 pt-1 space-y-1">
                              {record.symptoms && record.symptoms.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-slate-500">Keluhan:</span>
                                  {record.symptoms.map((sym) => (
                                    <span key={sym} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                                      {sym}
                                    </span>
                                  ))}
                                  {record.painLevel && record.painLevel > 1 && (
                                    <span className="text-[10px] font-bold text-rose-600 ml-1">
                                      (Skala Nyeri: {record.painLevel}/5)
                                    </span>
                                  )}
                                </div>
                              )}
                              {record.medicineOrCare && (
                                <p className="text-[11px] text-slate-600">
                                  <span className="font-semibold text-slate-700">Tindakan / UKS:</span> {record.medicineOrCare}
                                </p>
                              )}
                              {record.notes && (
                                <p className="text-[11px] text-slate-500 italic">
                                  <span className="font-semibold text-slate-600 not-italic">Catatan:</span> {record.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Workflow Buttons per State */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2 flex-shrink-0">
                          {/* Tahap 1: Sedang Haid -> Tombol Catat Selesai Haid */}
                          {isOngoing && (
                            <button
                              type="button"
                              onClick={() => handleOpenStopBleeding(record)}
                              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                              title="Catat bahwa darah haid sudah berhenti bersih dan memasuki masa bersuci"
                            >
                              <Sparkles className="w-4 h-4 text-amber-800" />
                              <span>Catat Darah Berhenti (Bersuci)</span>
                            </button>
                          )}

                          {/* Tahap 2: Masa Bersuci -> Tombol Konfirmasi Mandi Wajib */}
                          {isBersuci && (
                            <button
                              type="button"
                              onClick={() => handleOpenPurification(record)}
                              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                              title="Konfirmasi bahwa siswi telah selesai melaksanakan mandi wajib bersuci dan siap beribadah"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Konfirmasi Mandi Wajib (Siap Ibadah)</span>
                            </button>
                          )}

                          {/* Tahap 3: Suci / Siap Beribadah Info Badge */}
                          {isSuci && (
                            <div className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 rounded-xl flex items-center gap-1.5">
                              <SunMedium className="w-4 h-4 text-emerald-600" />
                              <span>Siap Sholat & Ibadah</span>
                            </div>
                          )}

                          {/* Auxiliary Actions (Print Card, Edit, Delete) */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePrintStudentCard(record)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Cetak Kartu Kontrol Menstruasi Siswi (PDF)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(record)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Catatan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: Fiqih Guide & Niat Mandi Wajib */}
        {activeSubTab === 'fiqih_guide' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">
                    Ketentuan Fiqih Thaharah (Bersuci dari Haid) Asrama Putri
                  </h3>
                  <p className="text-xs text-rose-700">
                    Panduan resmi ibadah dan kesehatan bagi siswi asrama Sekolah Rakyat Terintegrasi 31 Palembang
                  </p>
                </div>
              </div>

              {/* 3 Core Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-1.5">
                  <span className="text-xs font-bold text-rose-900 block">1. Batas Durasi Masa Haid</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    • <strong>Minimal:</strong> 24 jam (1 hari 1 malam).<br />
                    • <strong>Umumnya:</strong> 6 sampai 7 hari.<br />
                    • <strong>Maksimal:</strong> 15 hari 15 malam. Jika melebihi 15 hari, maka darah tersebut dihukumi <strong>Darah Istihadhah (Penyakit)</strong>.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-1.5">
                  <span className="text-xs font-bold text-rose-900 block">2. Tanda Berhentinya Haid (Suci)</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    • <strong>Qasshah Baidha’:</strong> Keluarnya cairan putih bening sebagai penanda rahim telah bersih.<br />
                    • <strong>Jafaf (Kering):</strong> Kapas/pembalut yang ditempelkan keluar dalam keadaan kering tanpa flek kuning/keruh.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-1.5">
                  <span className="text-xs font-bold text-rose-900 block">3. Kewajiban Setelah Suci</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Siswi yang telah mendapati tanda suci <strong>wajib segera melaksanakan Mandi Wajib (Ghusl)</strong> dan langsung kembali melaksanakan sholat fardhu 5 waktu berjamaah serta puasa.
                  </p>
                </div>
              </div>
            </div>

            {/* Niat Mandi Wajib Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Bacaan Niat Mandi Wajib Setelah Haid</span>
              </h4>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-xl md:text-2xl font-serif text-slate-900 tracking-wide font-medium leading-loose" dir="rtl">
                  نَوَيْتُ الْغُسْلَ لِرَفْعِ الْحَدَثِ الْأَكْبَرِ مِنَ الْحَيْضِ فَرْضًا لِلّٰهِ تَعَالَى
                </p>
                <p className="text-xs font-semibold text-rose-800 italic">
                  &quot;Nawaitul ghusla liraf&apos;il hadatsil akbari minal haidhi fardhan lillahi ta&apos;ala.&quot;
                </p>
                <p className="text-xs text-slate-600 max-w-xl mx-auto">
                  <strong>Artinya:</strong> &quot;Aku berniat mandi untuk menghilangkan hadats besar dari haid, fardhu karena Allah Ta&apos;ala.&quot;
                </p>
              </div>

              {/* Rukun Mandi Wajib */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rukun & Tata Cara Mandi Wajib yang Sempurna:
                </h5>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li><strong>Membaca Niat</strong> saat pertama kali membasuhkan air ke tubuh.</li>
                  <li><strong>Membersihkan kedua telapak tangan & kemaluan</strong> dari najis dan kotoran.</li>
                  <li><strong>Berwudhu</strong> secara sempurna sebagaimana wudhu untuk sholat.</li>
                  <li><strong>Membasuh sela-sela pangkal rambut</strong> kepala dengan air hingga merata.</li>
                  <li><strong>Menyiramkan air ke seluruh anggota tubuh</strong> mulai dari sisi kanan kemudian sisi kiri, memastikan lipatan kulit dan kuku terkena air.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CATAT MULAI HAID (NEW RECORD) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catat Siswi Mulai Menstruasi</h3>
                  <p className="text-xs text-slate-500">Mencatat awal masa haid & kebutuhan pendampingan asrama</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRecord} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Siswi Putri *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => handleSelectStudentChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                >
                  <option value="">-- Pilih Siswi --</option>
                  {selectableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class}) - {s.dorm || 'Asrama Putri'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Start */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai Haid *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Mulai (WIB)
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              {/* Symptoms Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keluhan / Gejala Fisik:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {SYMPTOM_OPTIONS.map((sym) => {
                    const isChecked = formData.symptoms.includes(sym);
                    return (
                      <label
                        key={sym}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSymptom(sym)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>{sym}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scale of Pain & Pads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skala Nyeri (1 - 5)
                  </label>
                  <select
                    value={formData.painLevel}
                    onChange={(e) => setFormData({ ...formData, painLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value={1}>1 - Ringan / Normal</option>
                    <option value={2}>2 - Sedikit Kram</option>
                    <option value={3}>3 - Nyeri Sedang (Perlu Istirahat)</option>
                    <option value={4}>4 - Nyeri Hebat (Perlu Kompres/Obat)</option>
                    <option value={5}>5 - Sangat Hebat (Rujuk UKS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pembalut Diberikan (Pcs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.sanitaryPadsProvided}
                    onChange={(e) => setFormData({ ...formData, sanitaryPadsProvided: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Medicine or Care */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tindakan / Penanganan di Asrama
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kompres air hangat di perut, teh chamomile hangat, istirahat..."
                  value={formData.medicineOrCare}
                  onChange={(e) => setFormData({ ...formData, medicineOrCare: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan Pembina
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  placeholder="Catatan kondisi siswi..."
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Simpan Catatan Haid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT DARAH BERHENTI (MASUK MASA BERSUCI) */}
      {/* ========================================================================= */}
      {isStopBleedingModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catat Darah Berhenti (Masa Bersuci)</h3>
                  <p className="text-xs text-slate-500">Siswi: <strong>{selectedRecord.studentName}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStopBleedingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitStopBleeding} className="space-y-4">
              {/* Summary Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mulai Haid:</span>
                  <span className="font-bold text-slate-800">{formatDateIndonesian(selectedRecord.startDate)} ({selectedRecord.startTime || '-'})</span>
                </div>
                {/* Live Preview Duration Calculation */}
                {(() => {
                  const previewDur = calculateDuration(
                    selectedRecord.startDate,
                    selectedRecord.startTime,
                    stopBleedingData.endDate,
                    stopBleedingData.endTime
                  );
                  return (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Total Durasi Haid:</span>
                      <span className="font-black text-rose-700">{previewDur.text}</span>
                    </div>
                  );
                })()}
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Darah Berhenti *
                  </label>
                  <input
                    type="date"
                    value={stopBleedingData.endDate}
                    onChange={(e) => setStopBleedingData({ ...stopBleedingData, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Selesai (WIB)
                  </label>
                  <input
                    type="time"
                    value={stopBleedingData.endTime}
                    onChange={(e) => setStopBleedingData({ ...stopBleedingData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tanda Suci
                </label>
                <textarea
                  rows={2}
                  value={stopBleedingData.notes}
                  onChange={(e) => setStopBleedingData({ ...stopBleedingData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Next Step Info */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tahap Selanjutnya: Masa Bersuci</span>
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Siswi akan masuk status <strong>Masa Bersuci</strong> dan diarahkan untuk melaksanakan mandi wajib bersuci (thaharah) sebelum kembali sholat.
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStopBleedingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-md cursor-pointer"
                >
                  Konfirmasi Masuk Masa Bersuci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI MANDI WAJIB (SIAP BERIBADAH) */}
      {/* ========================================================================= */}
      {isPurificationModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Konfirmasi Mandi Wajib & Siap Ibadah</h3>
                  <p className="text-xs text-slate-500">Siswi: <strong>{selectedRecord.studentName}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurificationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPurification} className="space-y-4">
              {/* Summary Duration */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Durasi Menstruasi:</span>
                  <span className="font-bold text-slate-800">
                    {selectedRecord.durationText || `${selectedRecord.durationDays || '-'} Hari`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Darah Berhenti Pada:</span>
                  <span className="font-medium text-slate-700">{formatDateIndonesian(selectedRecord.endDate || '')} ({selectedRecord.endTime || '-'})</span>
                </div>
              </div>

              {/* Date & Time of Purification */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mandi Wajib *
                  </label>
                  <input
                    type="date"
                    value={purificationData.purificationDate}
                    onChange={(e) => setPurificationData({ ...purificationData, purificationDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Selesai Mandi
                  </label>
                  <input
                    type="time"
                    value={purificationData.purificationTime}
                    onChange={(e) => setPurificationData({ ...purificationData, purificationTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Pembina Verifikator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pembina / Wali Asuh yang Memvalidasi
                </label>
                <select
                  value={purificationData.verifiedBy}
                  onChange={(e) => setPurificationData({ ...purificationData, verifiedBy: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {config.waliAsuhList.map((wali) => {
                    const name = wali.split('|')[0];
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kesiapan Beribadah
                </label>
                <textarea
                  rows={2}
                  value={purificationData.notes}
                  onChange={(e) => setPurificationData({ ...purificationData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Ready Confirmation Banner */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Status Siswi: Suci & Siap Sholat Berjamaah</span>
                </span>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Setelah disimpan, siswi kembali tercatat aktif wajib sholat 5 waktu di asrama/masjid dan mengaji Al-Qur&apos;an.
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPurificationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan & Siap Beribadah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT RECORD MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Catatan Menstruasi & Ibadah</h3>
                  <p className="text-xs text-slate-500">Siswi: <strong>{formData.studentName}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Saat Ini
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                >
                  <option value="Sedang Haid">🔴 Sedang Haid (Udzur Sholat)</option>
                  <option value="Masa Bersuci">🟡 Masa Bersuci (Mandi Wajib)</option>
                  <option value="Suci / Siap Beribadah">🟢 Suci / Siap Beribadah</option>
                  <option value="Istihadhah (Perlu Perhatian)">🟣 Istihadhah (Perlu Perhatian)</option>
                </select>
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai Haid
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Selesai Haid (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Purification Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mandi Wajib
                  </label>
                  <input
                    type="date"
                    value={formData.purificationDate}
                    onChange={(e) => setFormData({ ...formData, purificationDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Mandi Wajib
                  </label>
                  <input
                    type="time"
                    value={formData.purificationTime}
                    onChange={(e) => setFormData({ ...formData, purificationTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Symptoms Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan / Gejala
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  {SYMPTOM_OPTIONS.map((sym) => (
                    <label key={sym} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(sym)}
                        onChange={() => handleToggleSymptom(sym)}
                        className="rounded text-rose-600"
                      />
                      <span>{sym}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Medicine & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tindakan & Catatan
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PRINT RECAP PDF CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cetak Laporan Rekapitulasi PDF</h3>
                  <p className="text-xs text-slate-500">Format Resmi Standar Kemensos RI (A4 Landscape)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Filter Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filter Status Catatan
                </label>
                <select
                  value={printFilterStatus}
                  onChange={(e) => setPrintFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="all">Semua Catatan ({records.length} Siswi)</option>
                  <option value="Sedang Haid">Sedang Haid (Udzur Sholat)</option>
                  <option value="Masa Bersuci">Masa Bersuci (Persiapan Mandi)</option>
                  <option value="Suci / Siap Beribadah">Suci - Siap Beribadah</option>
                </select>
              </div>

              {/* Filter Dorm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filter Asrama Putri
                </label>
                <select
                  value={printFilterDorm}
                  onChange={(e) => setPrintFilterDorm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="all">Semua Asrama Putri</option>
                  {config.dormList
                    .filter((d) => d.toLowerCase().includes('cut') || d.toLowerCase().includes('kartini') || d.toLowerCase().includes('sartika') || d.toLowerCase().includes('putri'))
                    .map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                </select>
              </div>

              {/* Pembina Penandatangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pembina Asrama Putri (Penandatangan)
                </label>
                <select
                  value={printPembina}
                  onChange={(e) => setPrintPembina(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {config.waliAsuhList.map((w) => {
                    const name = w.split('|')[0];
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              {/* PDF Preview Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Fitur Laporan Resmi:</span>
                <p className="text-[11px] leading-relaxed">
                  Dokumen mencakup Kop Resmi Kemensos RI, rincian tanggal mulai & selesai haid, total catatan durasi hari, tanggal mandi bersuci, status kesiapan sholat, serta 3 kolom tanda tangan legal.
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrintRecap}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Unduh PDF Rekap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: FIQIH GUIDE POPUP */}
      {/* ========================================================================= */}
      {isFiqihModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Panduan Fiqih Haid & Bersuci (Thaharah)</h3>
                  <p className="text-xs text-slate-500">Pedoman Ibadah Bagi Siswi & Pembina Asrama Putri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFiqihModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Niat */}
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                  Lafadz Niat Mandi Wajib Setelah Haid:
                </span>
                <p className="text-2xl font-serif text-slate-950 leading-loose" dir="rtl">
                  نَوَيْتُ الْغُسْلَ لِرَفْعِ الْحَدَثِ الْأَكْبَرِ مِنَ الْحَيْضِ فَرْضًا لِلّٰهِ تَعَالَى
                </p>
                <p className="text-xs font-semibold text-rose-900 italic">
                  &quot;Nawaitul ghusla liraf&apos;il hadatsil akbari minal haidhi fardhan lillahi ta&apos;ala.&quot;
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Artinya:</strong> &quot;Aku berniat mandi untuk menghilangkan hadats besar dari haid, fardhu karena Allah Ta&apos;ala.&quot;
                </p>
              </div>

              {/* Rukun Mandi Wajib */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tata Cara & Rukun Mandi Wajib:</span>
                </h4>
                <div className="space-y-2 pl-6">
                  <p>1. <strong>Niat Mandi Wajib</strong> bersamaan saat pertama kali menyiramkan air ke tubuh.</p>
                  <p>2. <strong>Membasuh kedua telapak tangan 3 kali</strong> dan membersihkan area kemaluan dari sisa kotoran/darah.</p>
                  <p>3. <strong>Berwudhu</strong> secara sempurna seperti wudhu sebelum sholat.</p>
                  <p>4. <strong>Membasahi pangkal rambut dan kepala</strong> sebanyak 3 kali serta menyela-nyelanya hingga air meresap ke kulit kepala.</p>
                  <p>5. <strong>Mengalirkan air ke seluruh tubuh</strong> mulai dari bagian kanan lalu kiri, meratakan air ke lipatan ketiak, pusar, sela jemari kaki, dan lipatan tubuh lainnya.</p>
                </div>
              </div>

              {/* Batasan Fiqih */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Batasan Durasi & Darah Istihadhah:
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li><strong>Minimal Haid:</strong> 1 hari 1 malam (24 jam terus-menerus atau terputus dalam rentang 15 hari).</li>
                  <li><strong>Masa Normal:</strong> 6 sampai 7 hari.</li>
                  <li><strong>Maksimal Haid:</strong> 15 hari 15 malam.</li>
                  <li><strong>Jika Melebihi 15 Hari:</strong> Darah tersebut dihukumi sebagai <strong>Istihadhah</strong>. Siswi wajib mandi bersuci dan tetap diwajibkan sholat fardhu (dengan membersihkan darah & berwudhu setiap kali masuk waktu sholat).</li>
                </ul>
              </div>

              {/* Amalan Wanita Haid */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>Amalan yang Tetap Dianjurkan Saat Sedang Haid:</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    • Memperbanyak Dzikir & Istighfar
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    • Membaca Sholawat Nabi SAW
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    • Mendengarkan Murottal / Kajian
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    • Belajar ilmu agama & sosial
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFiqihModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
