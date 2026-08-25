import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  Compass,
  Printer,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  HeartHandshake,
  Users,
  Target,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Minus,
  Save,
  RotateCcw,
  LayoutList,
  Layers,
  ArrowLeft
} from 'lucide-react';
import {
  Student,
  Counseling,
  CounselingField,
  CounselingType,
  CounselingUrgency,
  CounselingStatus,
  AppConfig
} from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { printCounselingSessionPDF, printCounselingRecapPDF } from '../services/pdfGenerator';

interface CounselingTabProps {
  students: Student[];
  counseling: Counseling[];
  config: AppConfig;
  onSaveCounseling: (counseling: Counseling, isEdit: boolean) => void;
  onDeleteCounseling: (id: string) => void;
  onUpdateStatus: (id: string, status: CounselingStatus) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

// Preset Quick Topics for guidance counseling in boarding schools
const QUICK_TOPIC_PRESETS = [
  { label: 'Kedisiplinan & Bangun Subuh', topic: 'Kesulitan bangun pagi dan sering terlambat sholat subuh berjamaah', field: 'Kedisiplinan & Tata Tertib', type: 'Konseling Individu', urgency: 'Perhatian Khusus' },
  { label: 'Homesick / Rindu Rumah', topic: 'Penyesuaian diri kehidupan asrama, rindu keluarga, dan sering murung', field: 'Pribadi', type: 'Konseling Individu', urgency: 'Rutin' },
  { label: 'Konflik Antar Teman', topic: 'Perselisihan paham dan ketegangan komunikasi dengan teman satu kamar', field: 'Sosial', type: 'Konseling Kelompok', urgency: 'Perhatian Khusus' },
  { label: 'Motivasi Belajar Menurun', topic: 'Penurunan fokus belajar, malas mengerjakan tugas, dan kejenuhan akademik', field: 'Belajar / Akademik', type: 'Konseling Individu', urgency: 'Rutin' },
  { label: 'Kecanduan Gawai / Gadget', topic: 'Penggunaan gawai tersembunyi melebihi batas waktu saat jam istirahat malam', field: 'Kedisiplinan & Tata Tertib', type: 'Konseling Individu', urgency: 'Perhatian Khusus' },
  { label: 'Kecemasan Ujian / Masa Depan', topic: 'Kecemasan menghadapi ujian sekolah, hafalan Al-Qur\'an, dan pilihan jenjang karir', field: 'Karir / Masa Depan', type: 'Konseling Individu', urgency: 'Rutin' },
  { label: 'Hubungan Orang Tua / Keluarga', topic: 'Beban pikiran permasalahan keluarga di rumah yang mempengaruhi psikologis anak', field: 'Keluarga / Hubungan Orang Tua', type: 'Konseling Individu', urgency: 'Perhatian Khusus' },
  { label: 'Kesehatan Mental & Stres', topic: 'Stres emosional tinggi, mudah tersulut emosi, dan butuh pendampingan intensif', field: 'Kesehatan Mental & Emosi', type: 'Konseling Individu', urgency: 'Mendesak / Darurat' }
];

const COUNSELING_TECHNIQUE_CHIPS = [
  'Client-Centered Therapy (Rogers)',
  'Cognitive Behavioral Therapy (CBT)',
  'Reality Therapy (WDEP)',
  'Pendekatan Humanistik & Spiritual Qur\'ani',
  'Behavioristic / Modifikasi Perilaku',
  'Solution-Focused Brief Therapy (SFBT)',
  'Rational Emotive Behavior Therapy (REBT)',
  'Motivational Interviewing'
];

const STUDENT_OBSERVATION_CHIPS = [
  'Kooperatif & Terbuka',
  'Awalnya Ragu lalu Terbuka',
  'Tertutup & Menahan Diri',
  'Cemas & Menangis Emosional',
  'Menyesali Perbuatan dengan Tulus',
  'Defensif / Cenderung Membela Diri',
  'Sangat Membutuhkan Dukungan Moril',
  'Tenang & Merespon Solutif'
];

export const CounselingTab: React.FC<CounselingTabProps> = ({
  students,
  counseling,
  config,
  onSaveCounseling,
  onDeleteCounseling,
  onUpdateStatus,
  onShowToast,
  onAskConfirm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Page View Mode ('list' | 'form')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formSectionTab, setFormSectionTab] = useState<'meta' | 'analysis' | 'action' | 'all'>('all');
  const [editingCounselingId, setEditingCounselingId] = useState<string | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ timestamp: string } | null>(null);

  // Form Fields
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('14:00 - 15:00 WIB');
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [location, setLocation] = useState<string>('Ruang Bimbingan & Konseling (BK)');
  const [counselor, setCounselor] = useState<string>('Ibu Rahmawati, S.Psi.');
  const [counselorNip, setCounselorNip] = useState<string>('');
  const [accompanyingPerson, setAccompanyingPerson] = useState<string>('');
  const [counselingType, setCounselingType] = useState<CounselingType>('Konseling Individu');
  const [counselingField, setCounselingField] = useState<CounselingField>('Pribadi');
  const [urgencyLevel, setUrgencyLevel] = useState<CounselingUrgency>('Rutin');
  const [confidentiality, setConfidentiality] = useState<'Rahasia' | 'Terbatas' | 'Terbuka'>('Rahasia');

  const [caseDescription, setCaseDescription] = useState<string>('');
  const [backgroundAnalysis, setBackgroundAnalysis] = useState<string>('');
  const [counselingApproach, setCounselingApproach] = useState<string>('Client-Centered Therapy (Rogers)');
  const [studentObservation, setStudentObservation] = useState<string>('Kooperatif & Terbuka');

  const [notes, setNotes] = useState<string>('');
  const [studentCommitment, setStudentCommitment] = useState<string>('');
  const [followUp, setFollowUp] = useState<string>('');
  const [targetReviewDate, setTargetReviewDate] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [status, setStatus] = useState<CounselingStatus>('Open');
  const [referralDetails, setReferralDetails] = useState<string>('');

  const DRAFT_STORAGE_KEY = 'SISWA_BK_COUNSELING_DRAFT';

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem('SANTRI_BK_COUNSELING_DRAFT');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.caseDescription || parsed.notes || parsed.studentCommitment)) {
          setDraftInfo({ timestamp: parsed.savedAt || new Date().toLocaleTimeString('id-ID') });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft when form fields change (only for new counseling or unsaved work)
  useEffect(() => {
    if (viewMode !== 'form') return;
    if (editingCounselingId) return; // don't overwrite draft when editing existing records

    if (caseDescription || notes || studentCommitment || backgroundAnalysis || followUp) {
      const draftData = {
        studentId,
        date,
        time,
        sessionNumber,
        location,
        counselor,
        counselorNip,
        accompanyingPerson,
        counselingType,
        counselingField,
        urgencyLevel,
        confidentiality,
        caseDescription,
        backgroundAnalysis,
        counselingApproach,
        studentObservation,
        notes,
        studentCommitment,
        followUp,
        targetReviewDate,
        recommendations,
        status,
        referralDetails,
        savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setDraftInfo({ timestamp: draftData.savedAt });
      } catch {
        // ignore storage quota errors
      }
    }
  }, [
    viewMode,
    editingCounselingId,
    studentId,
    date,
    time,
    sessionNumber,
    location,
    counselor,
    counselorNip,
    accompanyingPerson,
    counselingType,
    counselingField,
    urgencyLevel,
    confidentiality,
    caseDescription,
    backgroundAnalysis,
    counselingApproach,
    studentObservation,
    notes,
    studentCommitment,
    followUp,
    targetReviewDate,
    recommendations,
    status,
    referralDetails
  ]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.studentId) setStudentId(d.studentId);
      if (d.date) setDate(d.date);
      if (d.time) setTime(d.time);
      if (d.sessionNumber) setSessionNumber(d.sessionNumber);
      if (d.location) setLocation(d.location);
      if (d.counselor) setCounselor(d.counselor);
      if (d.counselorNip) setCounselorNip(d.counselorNip);
      if (d.accompanyingPerson) setAccompanyingPerson(d.accompanyingPerson);
      if (d.counselingType) setCounselingType(d.counselingType);
      if (d.counselingField) setCounselingField(d.counselingField);
      if (d.urgencyLevel) setUrgencyLevel(d.urgencyLevel);
      if (d.confidentiality) setConfidentiality(d.confidentiality);
      if (d.caseDescription) setCaseDescription(d.caseDescription);
      if (d.backgroundAnalysis) setBackgroundAnalysis(d.backgroundAnalysis);
      if (d.counselingApproach) setCounselingApproach(d.counselingApproach);
      if (d.studentObservation) setStudentObservation(d.studentObservation);
      if (d.notes) setNotes(d.notes);
      if (d.studentCommitment) setStudentCommitment(d.studentCommitment);
      if (d.followUp) setFollowUp(d.followUp);
      if (d.targetReviewDate) setTargetReviewDate(d.targetReviewDate);
      if (d.recommendations) setRecommendations(d.recommendations);
      if (d.status) setStatus(d.status);
      if (d.referralDetails) setReferralDetails(d.referralDetails);
      onShowToast('Draf Dipulihkan', 'Isian formulir konseling sebelumnya berhasil dipulihkan.', 'success');
    } catch {
      onShowToast('Gagal Memulihkan', 'Format draf tidak terbaca.', 'error');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftInfo(null);
      onShowToast('Draf Dihapus', 'Draf lokal telah dibersihkan.', 'success');
    } catch {
      // ignore
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
  };

  // Selected Student Details helper for Form
  const currentSelectedStudent = useMemo(() => {
    return students.find((s) => String(s.id) === String(studentId));
  }, [students, studentId]);

  const handleOpenAddModal = (defaultStudentId?: string) => {
    const targetSid = defaultStudentId || students[0]?.id || '';
    const studentExistingSessions = counseling.filter((c) => String(c.studentId) === String(targetSid)).length;

    setEditingCounselingId(null);
    setStudentId(targetSid);
    setDate(new Date().toISOString().split('T')[0]);
    setTime('14:00 - 15:00 WIB');
    setSessionNumber(studentExistingSessions + 1);
    setLocation('Ruang Bimbingan & Konseling (BK)');
    setCounselor('Ibu Rahmawati, S.Psi.');
    setCounselorNip('198504122010012015');
    setAccompanyingPerson(students.find((s) => s.id === targetSid)?.caretaker || '');
    setCounselingType('Konseling Individu');
    setCounselingField('Pribadi');
    setUrgencyLevel('Rutin');
    setConfidentiality('Rahasia');

    setCaseDescription('');
    setBackgroundAnalysis('');
    setCounselingApproach('Client-Centered Therapy (Rogers)');
    setStudentObservation('Kooperatif & Terbuka');

    setNotes('');
    setStudentCommitment('');
    setFollowUp('Pemantauan berkala bersama Wali Asuh dan Guru BK');
    const defaultNextReview = new Date();
    defaultNextReview.setDate(defaultNextReview.getDate() + 7);
    setTargetReviewDate(defaultNextReview.toISOString().split('T')[0]);
    setRecommendations('Memberikan motivasi positif dan pendampingan di jam sholat asrama.');
    setStatus('Open');
    setReferralDetails('');

    setViewMode('form');
  };

  const handleOpenEditModal = (c: Counseling) => {
    setEditingCounselingId(c.id);
    setStudentId(c.studentId);
    setDate(c.date || new Date().toISOString().split('T')[0]);
    setTime(c.time || '14:00 - 15:00 WIB');
    setSessionNumber(c.sessionNumber || 1);
    setLocation(c.location || 'Ruang Bimbingan & Konseling (BK)');
    setCounselor(c.counselor || 'Ibu Rahmawati, S.Psi.');
    setCounselorNip(c.counselorNip || '');
    setAccompanyingPerson(c.accompanyingPerson || '');
    setCounselingType(c.counselingType || 'Konseling Individu');
    setCounselingField(c.counselingField || 'Pribadi');
    setUrgencyLevel(c.urgencyLevel || 'Rutin');
    setConfidentiality(c.confidentiality || 'Rahasia');

    setCaseDescription(c.caseDescription || '');
    setBackgroundAnalysis(c.backgroundAnalysis || '');
    setCounselingApproach(c.counselingApproach || 'Client-Centered Therapy (Rogers)');
    setStudentObservation(c.studentObservation || 'Kooperatif & Terbuka');

    setNotes(c.notes || '');
    setStudentCommitment(c.studentCommitment || '');
    setFollowUp(c.followUp || '');
    setTargetReviewDate(c.targetReviewDate || '');
    setRecommendations(c.recommendations || '');
    setStatus(c.status || 'Open');
    setReferralDetails(c.referralDetails || '');

    setViewMode('form');
  };

  const handleApplyPreset = (preset: typeof QUICK_TOPIC_PRESETS[0]) => {
    setCaseDescription(preset.topic);
    setCounselingField(preset.field as CounselingField);
    setCounselingType(preset.type as CounselingType);
    setUrgencyLevel(preset.urgency as CounselingUrgency);
    onShowToast('Preset Diterapkan', `Topik "${preset.label}" berhasil dimuat.`, 'success');
  };

  const handlePrintSingle = (c: Counseling) => {
    const student = students.find((s) => String(s.id) === String(c.studentId));
    onShowToast('Mencetak Dokumen', `Menyiapkan Berita Acara & Laporan Konseling untuk ${c.studentName}...`, 'warning');
    printCounselingSessionPDF(c, student, config);
  };

  const handlePrintRecap = () => {
    if (filteredCounseling.length === 0) {
      onShowToast('Data Kosong', 'Tidak ada data bimbingan konseling yang cocok untuk dicetak.', 'warning');
      return;
    }
    onShowToast('Mencetak Rekapitulasi', `Menyiapkan Buku Agenda & Rekapitulasi ${filteredCounseling.length} sesi konseling...`, 'warning');
    printCounselingRecapPDF(filteredCounseling, config, {
      status: statusFilter,
      searchQuery: searchQuery
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Valid', 'Silakan pilih peserta didik terlebih dahulu.', 'warning');
      return;
    }
    if (!caseDescription.trim()) {
      onShowToast('Data Belum Lengkap', 'Uraian topik masalah tidak boleh kosong.', 'warning');
      return;
    }
    if (!notes.trim()) {
      onShowToast('Data Belum Lengkap', 'Uraian dinamika sesi & hasil pembinaan tidak boleh kosong.', 'warning');
      return;
    }
    if (!followUp.trim()) {
      onShowToast('Data Belum Lengkap', 'Rencana tindak lanjut (RTL) tidak boleh kosong.', 'warning');
      return;
    }

    const payload: Counseling = {
      id: editingCounselingId || `c-${Date.now()}`,
      studentId,
      studentName: student.name,
      date,
      time,
      sessionNumber: Number(sessionNumber) || 1,
      location,
      counselor,
      counselorNip,
      accompanyingPerson: accompanyingPerson || student.caretaker,
      counselingType,
      counselingField,
      urgencyLevel,
      confidentiality,
      caseDescription,
      backgroundAnalysis,
      counselingApproach,
      studentObservation,
      notes: notes || 'Sesi konseling telah dilaksanakan dengan baik.',
      studentCommitment,
      followUp: followUp || 'Pendampingan berkelanjutan.',
      targetReviewDate,
      recommendations,
      status,
      referralDetails: status === 'Referred' ? referralDetails : undefined
    };

    if (editingCounselingId) {
      onSaveCounseling(payload, true);
      onShowToast('Berhasil Diperbarui', `Laporan konseling ${student.name} berhasil disimpan.`, 'success');
    } else {
      onSaveCounseling(payload, false);
      onShowToast('Laporan Tersimpan', `Agenda konseling untuk ${student.name} berhasil didaftarkan.`, 'success');
    }

    clearDraft();
    setViewMode('list');
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Berkas Konseling?',
      `Apakah Anda yakin ingin menghapus catatan konseling ananda ${name}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (confirmed) {
      onDeleteCounseling(id);
      onShowToast('Dihapus', 'Catatan konseling BK telah dihapus dari sistem.', 'success');
    }
  };

  const filteredCounseling = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return counseling.filter((c) => {
      const matchName =
        (c.studentName || '').toLowerCase().includes(q) ||
        (c.caseDescription || '').toLowerCase().includes(q) ||
        (c.counselor || '').toLowerCase().includes(q) ||
        (c.counselingField || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === '' || c.status === statusFilter;
      const matchField = fieldFilter === '' || c.counselingField === fieldFilter;
      const matchUrgency = urgencyFilter === '' || c.urgencyLevel === urgencyFilter;
      return matchName && matchStatus && matchField && matchUrgency;
    });
  }, [counseling, searchQuery, statusFilter, fieldFilter, urgencyFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = counseling.length;
    const resolved = counseling.filter((c) => c.status === 'Resolved').length;
    const inProgress = counseling.filter((c) => c.status === 'In Progress').length;
    const open = counseling.filter((c) => c.status === 'Open').length;
    const referred = counseling.filter((c) => c.status === 'Referred').length;
    const highUrgency = counseling.filter((c) => c.urgencyLevel === 'Mendesak / Darurat' || c.urgencyLevel === 'Perhatian Khusus').length;
    return { total, resolved, inProgress, open, referred, highUrgency };
  }, [counseling]);

  const getStatusBadge = (st: CounselingStatus) => {
    switch (st) {
      case 'Resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Selesai / Mandiri (Resolved)',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        };
      case 'In Progress':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Dalam Pembinaan (In Progress)',
          icon: <Compass className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
        };
      case 'Referred':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Dirujuk ke Ahli / Luar (Referred)',
          icon: <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Terjadwal / Baru (Open)',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />
        };
    }
  };

  const getFieldBadgeColor = (field?: string) => {
    switch (field) {
      case 'Pribadi':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sosial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Belajar / Akademik':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Karir / Masa Depan':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Kedisiplinan & Tata Tertib':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Keluarga / Hubungan Orang Tua':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Kesehatan Mental & Emosi':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getUrgencyBadge = (urgency?: CounselingUrgency) => {
    switch (urgency) {
      case 'Mendesak / Darurat':
        return 'bg-red-500 text-white font-bold border-red-600';
      case 'Perhatian Khusus':
        return 'bg-amber-100 text-amber-900 font-semibold border-amber-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // ==================== FORM VIEW (FULL PAGE) ====================
  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition"
              title="Kembali ke Daftar Konseling"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                  {editingCounselingId ? 'Mode Edit Catatan' : 'Formulir Layanan BK'}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {editingCounselingId ? 'Edit Laporan Bimbingan & Konseling' : 'Input Sesi Bimbingan & Konseling BK Lengkap'}
              </h2>
              <p className="text-xs text-slate-500">
                Berita acara konseling, analisis masalah, komitmen peserta didik, dan rencana tindak lanjut
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleBackToList}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl transition active:scale-95"
            >
              Batal / Kembali
            </button>
            <button
              type="submit"
              form="counseling-page-form"
              className="bg-amber-600 text-white hover:bg-amber-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Simpan Berkas Laporan BK
            </button>
          </div>
        </div>

        {/* Draft Recovery Alert */}
        {draftInfo && !editingCounselingId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">Draf Isian Konseling Tersimpan Otomatis</p>
                <p className="text-[11px] text-amber-800">
                  Tersimpan pada pukul <strong>{draftInfo.timestamp}</strong>. Isian Anda tersimpan secara lokal dan aman.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Pulihkan Draf
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="px-3 py-2 bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-xl transition"
              >
                Buang Draf
              </button>
            </div>
          </div>
        )}

        {/* Section Tabs Switcher */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFormSectionTab('all')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              formSectionTab === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutList className="w-4 h-4" /> Semua Bagian Formulir
          </button>
          <button
            type="button"
            onClick={() => setFormSectionTab('meta')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              formSectionTab === 'meta'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> 1. Identitas & Sesi
          </button>
          <button
            type="button"
            onClick={() => setFormSectionTab('analysis')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              formSectionTab === 'analysis'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" /> 2. Analisis Kasus & Masalah
          </button>
          <button
            type="button"
            onClick={() => setFormSectionTab('action')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              formSectionTab === 'action'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4" /> 3. Dinamika, RTL & Evaluasi
          </button>
        </div>

        {/* Form Content */}
        <form id="counseling-page-form" onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: IDENTITAS & METADATA SESI */}
          {(formSectionTab === 'all' || formSectionTab === 'meta') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Identitas Siswa & Metadata Sesi Konseling
                  </h4>
                  <p className="text-xs text-slate-400">Data siswa, guru BK pelaksana, jadwal dan tempat pertemuan</p>
                </div>
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Peserta Didik / Siswa Asrama <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    const newSid = e.target.value;
                    setStudentId(newSid);
                    const st = students.find((x) => x.id === newSid);
                    if (st?.caretaker) {
                      setAccompanyingPerson(st.caretaker);
                    }
                    const existingCount = counseling.filter((c) => String(c.studentId) === String(newSid)).length;
                    setSessionNumber(existingCount + 1);
                  }}
                  required
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) — Kelas {s.class} | {s.dorm}
                    </option>
                  ))}
                </select>

                {currentSelectedStudent && (
                  <div className="mt-3 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
                    <div>
                      <span className="text-slate-500 font-medium">Wali Asuh:</span>{' '}
                      <strong>{currentSelectedStudent.caretaker || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Asrama / Kamar:</span>{' '}
                      <strong>{currentSelectedStudent.dorm}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Histori Konseling:</span>{' '}
                      <strong className="text-amber-800">
                        {counseling.filter((c) => String(c.studentId) === String(currentSelectedStudent.id)).length} Sesi Terdaftar
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Sesi Schedule & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Pelaksanaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Waktu / Pukul Sesi
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 14:00 - 15:30 WIB"
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sesi Ke-
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(Number(e.target.value) || 1)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Location & Accompanying Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lokasi Pertemuan Konseling
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ruang Bimbingan & Konseling (BK)"
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rekan Pendamping / Pihak yang Hadir
                  </label>
                  <input
                    type="text"
                    value={accompanyingPerson}
                    onChange={(e) => setAccompanyingPerson(e.target.value)}
                    placeholder="e.g. Wali Asuh / Wali Kelas / Orang Tua"
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Counselor & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Guru BK / Konselor Pelaksana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={counselor}
                    onChange={(e) => setCounselor(e.target.value)}
                    placeholder="e.g. Ibu Rahmawati, S.Psi."
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NIP / NUPTK Konselor
                  </label>
                  <input
                    type="text"
                    value={counselorNip}
                    onChange={(e) => setCounselorNip(e.target.value)}
                    placeholder="e.g. 198504122010012015"
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Classification & Domain Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bidang Bimbingan
                  </label>
                  <select
                    value={counselingField}
                    onChange={(e) => setCounselingField(e.target.value as CounselingField)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Pribadi">Pribadi</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Belajar / Akademik">Belajar / Akademik</option>
                    <option value="Karir / Masa Depan">Karir / Masa Depan</option>
                    <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
                    <option value="Keluarga / Hubungan Orang Tua">Keluarga / Hubungan Orang Tua</option>
                    <option value="Kesehatan Mental & Emosi">Kesehatan Mental & Emosi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jenis Layanan
                  </label>
                  <select
                    value={counselingType}
                    onChange={(e) => setCounselingType(e.target.value as CounselingType)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Konseling Individu">Konseling Individu</option>
                    <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                    <option value="Konseling Kelompok">Konseling Kelompok</option>
                    <option value="Konsultasi / Mediasi">Konsultasi / Mediasi</option>
                    <option value="Konferensi Kasus (Case Conference)">Konferensi Kasus</option>
                    <option value="Kunjungan Rumah (Home Visit)">Kunjungan Rumah (Home Visit)</option>
                    <option value="Advokasi & Pendampingan">Advokasi & Pendampingan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as CounselingUrgency)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Rutin">Rutin</option>
                    <option value="Perhatian Khusus">Perhatian Khusus</option>
                    <option value="Mendesak / Darurat">Mendesak / Darurat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sifat Kerahasiaan
                  </label>
                  <select
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value as 'Rahasia' | 'Terbatas' | 'Terbuka')}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Rahasia">Rahasia (BK Saja)</option>
                    <option value="Terbatas">Terbatas (Wali Asuh & BK)</option>
                    <option value="Terbuka">Terbuka (Dewan Guru)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ANALISIS KASUS & PENDEKATAN */}
          {(formSectionTab === 'all' || formSectionTab === 'analysis') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Analisis Kasus, Masalah Pokok & Pendekatan BK
                  </h4>
                  <p className="text-xs text-slate-400">Deskripsi keluhan, analisis akar masalah, dan teknik konseling</p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Preset Cepat Topik Pembinaan Keasramaan:
                  </label>
                  <span className="text-[10px] text-slate-400">Klik untuk memuat topik instan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOPIC_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[11px] font-semibold rounded-lg border border-slate-200 transition active:scale-95 shadow-2xs"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Case Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Topik Masalah / Keluhan Pokok <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  placeholder="Uraikan topik utama masalah atau keluhan yang dialami peserta didik..."
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Background & Root Cause Analysis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Latar Belakang Masalah & Faktor Pemicu (Root Cause Analysis)
                </label>
                <textarea
                  rows={2}
                  value={backgroundAnalysis}
                  onChange={(e) => setBackgroundAnalysis(e.target.value)}
                  placeholder="Faktor penyebab, pengaruh lingkungan asrama, relasi keluarga, riwayat kebiasaan, dsb..."
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Counseling Approach */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pendekatan / Teknik Konseling yang Diterapkan
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COUNSELING_TECHNIQUE_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCounselingApproach(chip)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        counselingApproach === chip
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={counselingApproach}
                  onChange={(e) => setCounselingApproach(e.target.value)}
                  placeholder="e.g. Cognitive Behavioral Therapy (CBT) & Pendekatan Humanistik Spiritual"
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Student Observation & Attitude */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observasi Sikap & Bahasa Tubuh Siswa Selama Sesi
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {STUDENT_OBSERVATION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStudentObservation(chip)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        studentObservation === chip
                          ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={studentObservation}
                  onChange={(e) => setStudentObservation(e.target.value)}
                  placeholder="e.g. Kooperatif & Terbuka dalam menyampaikan isi hati"
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: DINAMIKA, RTL & EVALUASI */}
          {(formSectionTab === 'all' || formSectionTab === 'action') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Dinamika Sesi, Komitmen Siswa, RTL & Evaluasi
                  </h4>
                  <p className="text-xs text-slate-400">Hasil pembinaan, komitmen janji, dan rencana evaluasi lanjutan</p>
                </div>
              </div>

              {/* Counseling Session Notes & Narrative */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Uraian Dinamika Sesi & Hasil Pembinaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Rincian hasil dialog konseling, pemahaman baru siswa, arahan nasihat, serta kesepakatan solusi..."
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Student Commitment */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" /> Komitmen & Pernyataan Janji Peserta Didik
                </label>
                <textarea
                  rows={2}
                  value={studentCommitment}
                  onChange={(e) => setStudentCommitment(e.target.value)}
                  placeholder="Pernyataan komitmen pribadi siswa (e.g. 'Berjanji akan tidur tepat pukul 22.00 dan siap dibangunkan subuh tanpa mengeluh')..."
                  className="w-full border border-emerald-300 bg-emerald-50/50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Follow Up & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rencana Tindak Lanjut (RTL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="e.g. Pemantauan berkala sholat subuh oleh Wali Asuh selama 14 hari"
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Tanggal Evaluasi
                  </label>
                  <input
                    type="date"
                    value={targetReviewDate}
                    onChange={(e) => setTargetReviewDate(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Recommendations for Caretaker & Parents */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rekomendasi Khusus untuk Wali Asuh / Orang Tua / Pihak Asrama
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. Berikan apresiasi saat bangun tepat waktu, hindari teguran keras di depan teman"
                  className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Status & Referral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Status Penanganan Kasus
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CounselingStatus)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Open">Open (Terjadwal / Baru)</option>
                    <option value="In Progress">In Progress (Sedang Pembinaan)</option>
                    <option value="Resolved">Resolved (Tuntas / Mandiri)</option>
                    <option value="Referred">Referred (Dirujuk ke Pakar / RS)</option>
                  </select>
                </div>

                {status === 'Referred' && (
                  <div>
                    <label className="block text-xs font-bold text-purple-800 mb-1.5">
                      Keterangan Rujukan Ahli Luar (Psikolog / Dokter / Psikiater)
                    </label>
                    <input
                      type="text"
                      value={referralDetails}
                      onChange={(e) => setReferralDetails(e.target.value)}
                      placeholder="e.g. Dirujuk ke Psikolog Klinis RSUD untuk evaluasi kecemasan"
                      className="w-full border border-purple-300 bg-purple-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={handleBackToList}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs px-5 py-2.5 rounded-xl transition active:scale-95"
            >
              ← Batal & Kembali ke Daftar
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Simpan Berkas Laporan BK
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==================== LIST VIEW (FULL PAGE) ====================
  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Sistem Pendampingan & Konseling BK
              </h2>
              <p className="text-xs text-slate-500">
                Pusat Pelaporan Komprehensif Bimbingan Konseling, Pembinaan Karakter, dan Tindak Lanjut Siswa Asrama
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={handlePrintRecap}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1.5"
            title="Cetak Buku Agenda & Rekapitulasi Lengkap BK"
          >
            <Printer className="w-4 h-4 text-amber-600" /> Cetak Rekapitulasi BK
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-amber-700 shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Input Sesi Konseling Baru
          </button>
        </div>
      </div>

      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Total Sesi</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 text-[11px] font-semibold">
            <span>Selesai Dibina</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1">{stats.resolved}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 text-[11px] font-semibold">
            <span>Dalam Pembinaan</span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-700 mt-1">{stats.inProgress}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Kasus Terjadwal</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-1">{stats.open}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 text-[11px] font-semibold">
            <span>Dirujuk ke Luar</span>
            <ExternalLink className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-700 mt-1">{stats.referred}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 text-[11px] font-semibold">
            <span>Perhatian / Mendesak</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-700 mt-1">{stats.highUrgency}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa, topik masalah, guru BK, catatan dinamika, atau RTL..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Semua Status Kasus</option>
              <option value="Open">Belum Selesai (Open)</option>
              <option value="In Progress">Dalam Pembinaan (In Progress)</option>
              <option value="Resolved">Tuntas / Selesai (Resolved)</option>
              <option value="Referred">Dirujuk ke Ahli (Referred)</option>
            </select>

            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Semua Bidang Bimbingan</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Sosial">Sosial</option>
              <option value="Belajar / Akademik">Belajar / Akademik</option>
              <option value="Karir / Masa Depan">Karir / Masa Depan</option>
              <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
              <option value="Keluarga / Hubungan Orang Tua">Keluarga / Hubungan Orang Tua</option>
              <option value="Kesehatan Mental & Emosi">Kesehatan Mental & Emosi</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Semua Urgensi</option>
              <option value="Rutin">Rutin</option>
              <option value="Perhatian Khusus">Perhatian Khusus</option>
              <option value="Mendesak / Darurat">Mendesak / Darurat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counseling Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCounseling.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Catatan Bimbingan yang Sesuai</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan data konseling berdasarkan filter atau kata kunci pencarian yang dipilih.
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Sesi Konseling Baru
            </button>
          </div>
        ) : (
          filteredCounseling.map((c) => {
            const student = students.find((s) => String(s.id) === String(c.studentId));
            const statusInfo = getStatusBadge(c.status);
            const isExpanded = expandedCardId === c.id;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top Header */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 font-black flex items-center justify-center text-sm flex-shrink-0 border border-amber-500/20 overflow-hidden">
                        {student?.photo ? (
                          <img
                            src={student.photo}
                            alt={c.studentName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          c.studentName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight truncate">
                            {c.studentName}
                          </h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Sesi #{c.sessionNumber || 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          NISN: <span className="font-mono">{c.studentId}</span> • {student ? `${student.class} (${student.dorm})` : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handlePrintSingle(c)}
                        className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 flex items-center justify-center transition active:scale-95"
                        title="Cetak Berita Acara & Laporan Konseling (PDF)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition active:scale-95"
                        title="Edit Data Konseling"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.studentName)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition active:scale-95"
                        title="Hapus Data Konseling"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${getFieldBadgeColor(c.counselingField)}`}>
                      {c.counselingField || 'Pribadi'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                      {c.counselingType || 'Konseling Individu'}
                    </span>
                    {c.urgencyLevel && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getUrgencyBadge(c.urgencyLevel)}`}>
                        {c.urgencyLevel}
                      </span>
                    )}
                    {c.confidentiality && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                        {c.confidentiality}
                      </span>
                    )}
                  </div>

                  {/* Metadata Row: Date, Time, Location, Counselor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{formatDateIndonesian(c.date, true)}</span>
                      {c.time && <span className="text-slate-400">({c.time})</span>}
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="truncate">{c.location || 'Ruang BK'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">Konselor: <strong className="font-semibold">{c.counselor}</strong></span>
                    </div>
                    {c.accompanyingPerson && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Pendamping: <strong>{c.accompanyingPerson}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Core Content: Case Description */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Topik / Masalah:</span>
                      {c.counselingApproach && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Teknik: {c.counselingApproach}
                        </span>
                      )}
                    </div>
                    <p className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/50 text-slate-800 font-medium leading-relaxed">
                      {c.caseDescription}
                    </p>
                  </div>

                  {/* RTL & Action Plan Highlight */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-amber-600" /> Rencana Tindak Lanjut (RTL):
                      </span>
                      {c.targetReviewDate && (
                        <span className="text-[10px] font-medium text-slate-500">
                          Target Evaluasi: {formatDateIndonesian(c.targetReviewDate)}
                        </span>
                      )}
                    </div>
                    <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                      {c.followUp}
                    </p>
                  </div>

                  {/* Expandable Comprehensive Details */}
                  {isExpanded && (
                    <div className="pt-2 space-y-2.5 border-t border-slate-100 text-xs animate-in fade-in-50">
                      {c.backgroundAnalysis && (
                        <div>
                          <p className="font-bold text-slate-700 text-[11px]">Latar Belakang & Faktor Pemicu:</p>
                          <p className="text-slate-600 bg-slate-50/60 p-2 rounded border border-slate-200 text-[11px] mt-0.5">
                            {c.backgroundAnalysis}
                          </p>
                        </div>
                      )}

                      {c.studentObservation && (
                        <div>
                          <p className="font-bold text-slate-700 text-[11px]">Observasi Sikap Siswa:</p>
                          <span className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 mt-0.5">
                            {c.studentObservation}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="font-bold text-slate-700 text-[11px]">Catatan Dinamika Sesi & Pembinaan:</p>
                        <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] mt-0.5 whitespace-pre-line">
                          {c.notes}
                        </p>
                      </div>

                      {c.studentCommitment && (
                        <div>
                          <p className="font-bold text-emerald-800 text-[11px]">Komitmen / Janji Siswa:</p>
                          <p className="text-emerald-900 bg-emerald-50/70 p-2 rounded border border-emerald-200 text-[11px] mt-0.5 italic">
                            "{c.studentCommitment}"
                          </p>
                        </div>
                      )}

                      {c.recommendations && (
                        <div>
                          <p className="font-bold text-slate-700 text-[11px]">Rekomendasi untuk Wali Asuh / Orang Tua:</p>
                          <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] mt-0.5">
                            {c.recommendations}
                          </p>
                        </div>
                      )}

                      {c.status === 'Referred' && c.referralDetails && (
                        <div>
                          <p className="font-bold text-purple-800 text-[11px]">Keterangan Rujukan Ahli:</p>
                          <p className="text-purple-900 bg-purple-50 p-2 rounded border border-purple-200 text-[11px] mt-0.5">
                            {c.referralDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Expand Details */}
                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : c.id)}
                    className="w-full text-center py-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center justify-center gap-1 transition"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Sembunyikan Rincian Analisis
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Lihat Uraian Lengkap, Komitmen & Dinamika Sesi
                      </>
                    )}
                  </button>
                </div>

                {/* Card Bottom Status Bar */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {statusInfo.icon}
                    <select
                      value={c.status}
                      onChange={(e) => onUpdateStatus(c.id, e.target.value as CounselingStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition ${statusInfo.bg}`}
                    >
                      <option value="Open">Open (Terjadwal)</option>
                      <option value="In Progress">In Progress (Pembinaan)</option>
                      <option value="Resolved">Resolved (Tuntas/Mandiri)</option>
                      <option value="Referred">Referred (Dirujuk)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handlePrintSingle(c)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-slate-200 hover:border-amber-300 flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600" /> Cetak Berita Acara BK
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
