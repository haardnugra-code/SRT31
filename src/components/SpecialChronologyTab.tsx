import React, { useState, useMemo } from 'react';
import {
  Brain,
  Stethoscope,
  ShieldAlert,
  FileText,
  Printer,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Trash2,
  Edit2,
  Lock,
  Sun,
  Sunset,
  Moon,
  Activity,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  Student,
  Violation,
  AppConfig,
  SpecialChronologyCase,
  SpecialShiftLog,
  ShiftType,
  ClinicalRiskLevel,
  SpecialCaseSeverity,
  SpecialCaseStatus
} from '../types';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import { generateSpecialChronologyPDF } from '../services/pdfGenerator';

interface SpecialChronologyTabProps {
  students: Student[];
  violations: Violation[];
  cases: SpecialChronologyCase[];
  config: AppConfig;
  onSaveCase: (caseItem: SpecialChronologyCase, isEdit: boolean) => void;
  onDeleteCase: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  initialCaseId?: string;
  initialStudentIdForNewCase?: string;
}

export const SpecialChronologyTab: React.FC<SpecialChronologyTabProps> = ({
  students,
  violations,
  cases,
  config,
  onSaveCase,
  onDeleteCase,
  onShowToast,
  onAskConfirm,
  initialCaseId,
  initialStudentIdForNewCase
}) => {
  // State Kasus Terpilih
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (initialCaseId && cases.some((c) => c.id === initialCaseId)) return initialCaseId;
    return cases[0]?.id || '';
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Modal State Kasus
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<SpecialChronologyCase | null>(null);

  // Form State Kasus Baru / Edit
  const [formStudentId, setFormStudentId] = useState<string>(initialStudentIdForNewCase || students[0]?.id || '');
  const [formCaseTitle, setFormCaseTitle] = useState<string>('');
  const [formIncidentDate, setFormIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCaseCategory, setFormCaseCategory] = useState<string>('Pelanggaran Berat Level 3 (Agresi Fisik / Perkelahian)');
  const [formCaseSeverity, setFormCaseSeverity] = useState<SpecialCaseSeverity>('Tinggi (High Risk)');
  const [formCaseStatus, setFormCaseStatus] = useState<SpecialCaseStatus>('Dalam Pemantauan Intensif');
  const [formPrimaryInvestigator, setFormPrimaryInvestigator] = useState<string>('M ARDIAN NUGRAHA (Wali Asuh)');
  const [formInitialAssessment, setFormInitialAssessment] = useState<string>('');
  const [formViolationId, setFormViolationId] = useState<string>('');

  // Modal State Log Shift
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShiftLog, setEditingShiftLog] = useState<SpecialShiftLog | null>(null);

  // Form State Log Shift
  const [shiftType, setShiftType] = useState<ShiftType>('Shift Pagi (06.00 - 14.00)');
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shiftTime, setShiftTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [shiftOfficerName, setShiftOfficerName] = useState<string>('M ARDIAN NUGRAHA');
  const [shiftOfficerRole, setShiftOfficerRole] = useState<'Wali Asuh Shift' | 'Konselor BK' | 'Tim Investigasi Keasramaan' | 'Psikolog / Tenaga Klinis'>('Wali Asuh Shift');
  
  // 1. MSE
  const [mseAppearance, setMseAppearance] = useState<string>('');
  const [mseMood, setMseMood] = useState<string>('');
  const [mseSpeech, setMseSpeech] = useState<string>('');
  const [mseOrientation, setMseOrientation] = useState<string>('Compos Mentis. Orientasi ruang, waktu, dan orang baik.');
  
  // 2. Dinamika Psikologis & Koping
  const [psychTrigger, setPsychTrigger] = useState<string>('');
  const [psychRegulation, setPsychRegulation] = useState<string>('');
  const [psychDefense, setPsychDefense] = useState<string>('');
  
  // 3. Risiko
  const [riskLevel, setRiskLevel] = useState<ClinicalRiskLevel>('Sedang (Perlu Pengawasan)');
  const [riskNotes, setRiskNotes] = useState<string>('');
  
  // 4. Intervensi
  const [interventionTech, setInterventionTech] = useState<string>('De-eskalasi Krisis Verbal & Active Listening');
  const [studentResponse, setStudentResponse] = useState<string>('');
  
  // 5. Handover
  const [handoverNotes, setHandoverNotes] = useState<string>('');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Kasus aktif terpilih
  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0] || null;
  }, [cases, selectedCaseId]);

  // Daftar Pelanggaran Berat yang berpotensi dibuatkan kasus khusus
  const heavyViolations = useMemo(() => {
    return violations.filter((v) => {
      const isLevelHeavy = v.level >= 3;
      const isPointsHeavy = (v.pointsDeduction || 0) >= 20;
      const textHeavy = (v.violationType || '').toLowerCase().includes('berat') ||
        (v.violationType || '').toLowerCase().includes('sp') ||
        (v.sanction || '').toLowerCase().includes('skorsing');
      return isLevelHeavy || isPointsHeavy || textHeavy;
    });
  }, [violations]);

  // Filter kasus
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dorm.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchSeverity = severityFilter === 'all' || c.caseSeverity === severityFilter;

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [cases, searchQuery, statusFilter, severityFilter]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = cases.length;
    const activeMonitoring = cases.filter((c) => c.status === 'Dalam Pemantauan Intensif').length;
    const highRisk = cases.filter((c) => c.caseSeverity === 'Tinggi (High Risk)' || c.caseSeverity === 'Kritis (Severe / Crisis)').length;
    const totalShifts = cases.reduce((acc, c) => acc + (c.shifts?.length || 0), 0);
    return { total, activeMonitoring, highRisk, totalShifts };
  }, [cases]);

  // Handle Buka Modal Buat Kasus Baru
  const handleOpenNewCaseModal = (prefillStudentId?: string, violationItem?: Violation) => {
    setEditingCase(null);
    const targetStudentId = prefillStudentId || initialStudentIdForNewCase || students[0]?.id || '';
    const st = students.find((s) => s.id === targetStudentId);

    setFormStudentId(targetStudentId);
    setFormViolationId(violationItem?.id || '');
    setFormCaseTitle(
      violationItem
        ? `Kronologi & Pendampingan Kasus: ${violationItem.violation}`
        : 'Kronologi Investigasi & Observasi Psikologi Kasus Pelanggaran Berat'
    );
    setFormIncidentDate(violationItem?.date || new Date().toISOString().split('T')[0]);
    setFormCaseCategory(
      violationItem
        ? `Pelanggaran Tingkat ${violationItem.level}: ${violationItem.violation}`
        : 'Pelanggaran Berat Level 3 (Agresi Fisik / Perkelahian)'
    );
    setFormCaseSeverity('Tinggi (High Risk)');
    setFormCaseStatus('Dalam Pemantauan Intensif');
    setFormPrimaryInvestigator(config.waliAsuhList[0]?.split('|')[0] || 'Wali Asuh Shift');
    setFormInitialAssessment(
      violationItem
        ? `Kronologi awal kejadian: ${violationItem.note || violationItem.violation}. Memerlukan evaluasi status mental dan stabilisasi afek siswa di asrama.`
        : ''
    );
    setIsCaseModalOpen(true);
  };

  // Handle Buka Modal Edit Kasus
  const handleOpenEditCaseModal = (caseItem: SpecialChronologyCase) => {
    setEditingCase(caseItem);
    setFormStudentId(caseItem.studentId);
    setFormViolationId(caseItem.violationId || '');
    setFormCaseTitle(caseItem.caseTitle);
    setFormIncidentDate(caseItem.incidentDate);
    setFormCaseCategory(caseItem.caseCategory);
    setFormCaseSeverity(caseItem.caseSeverity);
    setFormCaseStatus(caseItem.status);
    setFormPrimaryInvestigator(caseItem.primaryInvestigator);
    setFormInitialAssessment(caseItem.initialAssessmentSummary);
    setIsCaseModalOpen(true);
  };

  // Simpan Kasus
  const handleSaveCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formStudentId);
    if (!st) {
      onShowToast('Siswa Tidak Ditemukan', 'Silakan pilih siswa yang valid.', 'error');
      return;
    }

    if (!formCaseTitle.trim()) {
      onShowToast('Judul Kasus Wajib Diisi', 'Silakan isi judul berkas kasus.', 'warning');
      return;
    }

    const nowIso = new Date().toISOString();
    const newCase: SpecialChronologyCase = {
      id: editingCase ? editingCase.id : `CASE-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`,
      violationId: formViolationId || undefined,
      studentId: st.id,
      studentName: st.name,
      class: st.class || '7A',
      dorm: st.dorm || 'Asrama Siswa',
      caseTitle: formCaseTitle.trim(),
      incidentDate: formIncidentDate,
      caseCategory: formCaseCategory.trim(),
      caseSeverity: formCaseSeverity,
      status: formCaseStatus,
      primaryInvestigator: formPrimaryInvestigator.trim() || 'Wali Asuh Shift',
      initialAssessmentSummary: formInitialAssessment.trim(),
      shifts: editingCase ? editingCase.shifts : [],
      createdAt: editingCase ? editingCase.createdAt : nowIso,
      updatedAt: nowIso
    };

    onSaveCase(newCase, !!editingCase);
    setSelectedCaseId(newCase.id);
    setIsCaseModalOpen(false);
    onShowToast(
      editingCase ? 'Berkas Kasus Diperbarui' : 'Berkas Kasus Baru Dibuat',
      `Kasus khusus untuk ${st.name} berhasil disimpan.`,
      'success'
    );
  };

  // Hapus Kasus
  const handleDeleteCaseAction = async (caseId: string) => {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;
    const confirmed = await onAskConfirm(
      'Hapus Berkas Kasus Khusus?',
      `Apakah Anda yakin ingin menghapus berkas kasus "${target.caseTitle}" untuk siswa ${target.studentName}? Seluruh riwayat observasi shift akan terhapus permanen.`
    );
    if (confirmed) {
      onDeleteCase(caseId);
      if (selectedCaseId === caseId) {
        const remaining = cases.filter((c) => c.id !== caseId);
        setSelectedCaseId(remaining[0]?.id || '');
      }
      onShowToast('Berkas Dihapus', 'Berkas kasus khusus berhasil dihapus.', 'info');
    }
  };

  // Modal Tambah Log Shift
  const handleOpenAddShiftModal = () => {
    setEditingShiftLog(null);
    setShiftType('Shift Pagi (06.00 - 14.00)');
    setShiftDate(new Date().toISOString().split('T')[0]);
    setShiftTime(new Date().toTimeString().slice(0, 5));
    setShiftOfficerName(config.waliAsuhList[0]?.split('|')[0] || 'Wali Asuh Shift');
    setShiftOfficerRole('Wali Asuh Shift');
    setMseAppearance('Penampilan rapi, postur wajar, kontak mata kooperatif saat diajak berdialog.');
    setMseMood('Mood: Terkendali, tampak menyesal. Afek: Adekuat dan selaras dengan topik pembicaraan.');
    setMseSpeech('Arus bicara teratur, intonasi santun dan wajar. Alur pikir logis dan koheren.');
    setMseOrientation('Compos Mentis. Orientasi ruang, waktu, dan orang dalam asrama baik.');
    setPsychTrigger('Stimulus konflik dengan teman sekamar mengenai pembagian tugas piket asrama.');
    setPsychRegulation('Mulai mampu menenangkan diri (self-soothing) setelah jeda istirahat dan bimbingan afektif.');
    setPsychDefense('Sublimasi, Intelektualisasi terstruktur; mekanisme denial agresif mulai menurun.');
    setRiskLevel('Sedang (Perlu Pengawasan)');
    setRiskNotes('Risiko agresi rendah. Tetap pantau saat berada di area bersama (ruang makan & masjid).');
    setInterventionTech('Active Listening, Cognitive Reframing, dan Pembuatan Jurnal Refleksi Mandiri.');
    setStudentResponse('Kooperatif, menerima arahan dan berkomitmen untuk tidak mengulangi tindakan.');
    setHandoverNotes('Pantau kedisiplinan sholat berjamaah dan interaksi kamar pada shift berikutnya.');
    setIsShiftModalOpen(true);
  };

  // Modal Edit Log Shift
  const handleOpenEditShiftModal = (log: SpecialShiftLog) => {
    setEditingShiftLog(log);
    setShiftType(log.shift);
    setShiftDate(log.date);
    setShiftTime(log.time);
    setShiftOfficerName(log.officerName);
    setShiftOfficerRole(log.officerRole);
    setMseAppearance(log.appearanceAndMotor);
    setMseMood(log.moodAndAffect);
    setMseSpeech(log.speechAndThoughtPattern);
    setMseOrientation(log.orientationAndConsciousness);
    setPsychTrigger(log.triggerFactors);
    setPsychRegulation(log.emotionalRegulation);
    setPsychDefense(log.defenseMechanisms);
    setRiskLevel(log.riskLevel);
    setRiskNotes(log.riskNotes);
    setInterventionTech(log.interventionTechnique);
    setStudentResponse(log.studentResponse);
    setHandoverNotes(log.handoverNotes);
    setIsShiftModalOpen(true);
  };

  // Simpan Log Shift
  const handleSaveShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) {
      onShowToast('Gagal', 'Pilih berkas kasus terlebih dahulu.', 'error');
      return;
    }

    const newShiftItem: SpecialShiftLog = {
      id: editingShiftLog ? editingShiftLog.id : `shift-${Date.now()}`,
      shift: shiftType,
      date: shiftDate,
      time: shiftTime,
      officerName: shiftOfficerName.trim() || 'Wali Asuh Shift',
      officerRole: shiftOfficerRole,
      appearanceAndMotor: mseAppearance.trim(),
      moodAndAffect: mseMood.trim(),
      speechAndThoughtPattern: mseSpeech.trim(),
      orientationAndConsciousness: mseOrientation.trim(),
      triggerFactors: psychTrigger.trim(),
      emotionalRegulation: psychRegulation.trim(),
      defenseMechanisms: psychDefense.trim(),
      riskLevel: riskLevel,
      riskNotes: riskNotes.trim(),
      interventionTechnique: interventionTech.trim(),
      studentResponse: studentResponse.trim(),
      handoverNotes: handoverNotes.trim()
    };

    let updatedShifts: SpecialShiftLog[];
    if (editingShiftLog) {
      updatedShifts = selectedCase.shifts.map((s) => (s.id === editingShiftLog.id ? newShiftItem : s));
    } else {
      updatedShifts = [newShiftItem, ...(selectedCase.shifts || [])];
    }

    const updatedCase: SpecialChronologyCase = {
      ...selectedCase,
      shifts: updatedShifts,
      updatedAt: new Date().toISOString()
    };

    onSaveCase(updatedCase, true);
    setIsShiftModalOpen(false);
    onShowToast('Log Shift Tersimpan', `Observasi klinis ${shiftType} berhasil dicatat.`, 'success');
  };

  // Hapus Log Shift
  const handleDeleteShiftAction = async (shiftId: string) => {
    if (!selectedCase) return;
    const confirmed = await onAskConfirm(
      'Hapus Catatan Shift?',
      'Apakah Anda yakin ingin menghapus catatan observasi shift ini dari kronologi kasus?'
    );
    if (confirmed) {
      const updatedCase: SpecialChronologyCase = {
        ...selectedCase,
        shifts: selectedCase.shifts.filter((s) => s.id !== shiftId),
        updatedAt: new Date().toISOString()
      };
      onSaveCase(updatedCase, true);
      onShowToast('Log Shift Dihapus', 'Catatan observasi shift berhasil dihapus.', 'info');
    }
  };

  // Cetak PDF Berkas Kasus
  const handlePrintCasePDF = async () => {
    if (!selectedCase) return;
    setIsGeneratingPdf(true);
    onShowToast('Menyiapkan Dokumen...', 'Menyusun laporan klinis psikologi kasus berat format PDF.', 'info');
    try {
      await generateSpecialChronologyPDF(selectedCase, config);
      onShowToast('Laporan Siap', 'Laporan Berita Acara & Kronologis Kasus berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Cetak PDF', 'Terjadi kesalahan teknis saat membuat PDF laporan.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Quick Clinical Helper
  const applyQuickMseTemplate = (type: 'agitasi' | 'stabil' | 'depresi') => {
    if (type === 'agitasi') {
      setMseAppearance('Tremor halus, napas cepat, kontak mata tajam dan sering mengalihkan pandangan.');
      setMseMood('Mood: Iritabel, mudah terstimulus agresi. Afek: Labil dan konstriktif.');
      setMseSpeech('Volume bicara tinggi, artikulasi cepat, intonasi menantang.');
      setMseOrientation('Compos Mentis. Orientasi ruang asrama baik.');
      setPsychDefense('Acting Out, Denial, Proyeksi menyalahkan teman lawan.');
      setRiskLevel('Tinggi (Eskalasi / Re-offense Risk)');
      setInterventionTech('De-eskalasi Krisis Verbal, Box Breathing 4-4-4, Pemisahan Sementara.');
    } else if (type === 'stabil') {
      setMseAppearance('Postur rileks, kontak mata adekuat dan bersahabat, busana rapi.');
      setMseMood('Mood: Eutimik / Tenang. Afek: Luwes dan selaras.');
      setMseSpeech('Volume dan tempo bicara wajar, kooperatif dan runtut.');
      setMseOrientation('Compos Mentis penuh. Tilikan diri (insight) baik.');
      setPsychDefense('Sublimasi, Intelektualisasi positif.');
      setRiskLevel('Rendah (Aman)');
      setInterventionTech('Cognitive Reframing, Motivational Interviewing, Evaluasi Komitmen.');
    } else {
      setMseAppearance('Postur membungkuk, kontak mata minim, menunduk, tampak letih.');
      setMseMood('Mood: Disforik, cemas, merasa terasing. Afek: Tumpul dan sedih.');
      setMseSpeech('Volume bicara pelan, lambat, jeda panjang sebelum menjawab.');
      setMseOrientation('Compos Mentis. Sadar penuh akan keadaan.');
      setPsychDefense('Introyeksi rasa bersalah, Represi emosi.');
      setRiskLevel('Sedang (Perlu Pengawasan)');
      setInterventionTech('Supportive Psychotherapy, Validasi Afektif, Katarsis Terbimbing.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Utama dengan Nuansa Klinis & Rahasia */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-red-600 rounded-2xl shadow-xl shadow-indigo-950/80 border border-white/20 shrink-0">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  DOKUMEN RAHASIA KEASRAMAAN
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3" />
                  PSIKIATRI • PSIKOLOGI • KONSELING KLINIS
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Kronologi Kasus Setiap Shift Pelanggaran Berat
              </h2>
              <p className="text-xs md:text-sm text-indigo-200/80 max-w-3xl leading-relaxed">
                Pencatatan rekam status mental (MSE), dinamika psikologis, koping pertahanan diri, dan evaluasi risiko klinis terstruktur per shift (Pagi, Siang, Malam) untuk pendampingan kasus berisiko tinggi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => handleOpenNewCaseModal()}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 hover:shadow-xl transition active:scale-95 flex items-center justify-center gap-2 border border-white/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Berkas Kasus Khusus</span>
            </button>
          </div>
        </div>

        {/* Statistik Baris Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-900/50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Total Berkas Kasus</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total} <span className="text-xs font-normal text-indigo-300">Kasus</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Pemantauan Aktif</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.activeMonitoring} <span className="text-xs font-normal text-indigo-300">Siswa</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Tingkat Risiko Tinggi</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{stats.highRisk} <span className="text-xs font-normal text-indigo-300">Kasus</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Log Observasi Shift</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.totalShifts} <span className="text-xs font-normal text-indigo-300">Entri</span></p>
          </div>
        </div>
      </div>

      {/* Banner Rekomendasi Kasus Pelanggaran Berat yang Belum Dibuatkan Berkas Kronologis */}
      {heavyViolations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs md:text-sm text-amber-900">
                Terdeteksi {heavyViolations.length} Pelanggaran Berat di Asrama
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Kasus pelanggaran berat memerlukan pengawasan intensif per shift untuk mencegah pengulangan (re-offense) dan menstabilkan kesehatan mental siswa.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {heavyViolations.slice(0, 3).map((hv) => (
              <button
                key={hv.id}
                onClick={() => handleOpenNewCaseModal(hv.studentId, hv)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
              >
                <span>+ Kronologi: {hv.studentName?.split(' ')[0]}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Konten Utama: 2 Kolom (Daftar Kasus & Panel Detail Kasus) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Navigasi & Filter Daftar Berkas Kasus (4 Kolom) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Berkas Kasus ({filteredCases.length})
              </h3>
              <button
                onClick={() => handleOpenNewCaseModal()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>

            {/* Input Pencarian */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa, kasus, atau asrama..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="Dalam Pemantauan Intensif">Pemantauan Intensif</option>
                  <option value="Observasi Stabil">Observasi Stabil</option>
                  <option value="Menunggu Sidang Keasramaan">Sidang Keasramaan</option>
                  <option value="Rujukan Psikiater / Faskes Luar">Rujukan Psikiater</option>
                  <option value="Selesai / Resolusi">Selesai / Resolusi</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Risiko</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="all">Semua Risiko</option>
                  <option value="Tinggi (High Risk)">Tinggi (High Risk)</option>
                  <option value="Kritis (Severe / Crisis)">Kritis (Severe)</option>
                  <option value="Investigasi Khusus">Investigasi Khusus</option>
                </select>
              </div>
            </div>

            {/* Daftar Kartu Kasus */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredCases.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Tidak ada berkas kasus ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol 'Buat Berkas Kasus Khusus' untuk memulai pendampingan kasus baru.</p>
                </div>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = c.id === selectedCaseId;
                  const shiftCount = c.shifts?.length || 0;
                  const latestShift = c.shifts?.[0];

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            c.status === 'Dalam Pemantauan Intensif'
                              ? 'bg-rose-100 text-rose-800'
                              : c.status === 'Observasi Stabil'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'Rujukan Psikiater / Faskes Luar'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-1">
                        {c.studentName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Kelas {c.class} • {c.dorm}
                      </p>

                      <p className="text-[11px] text-slate-700 font-semibold mt-1.5 line-clamp-1">
                        {c.caseTitle}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-indigo-500" />
                          {shiftCount} Observasi Shift
                        </span>
                        <span>{formatDateShort(c.incidentDate)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Detail Berkas Kasus Terpilih & Kronologi Shift (8 Kolom) */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedCase ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-700">Pilih atau Buat Berkas Kasus Khusus</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Silakan pilih berkas kasus dari panel di sebelah kiri atau buat berkas baru untuk melihat timeline kronologis observasi psikologi per shift.
              </p>
            </div>
          ) : (
            <>
              {/* Header Kartu Detail Kasus Terpilih */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white uppercase tracking-wider">
                        {selectedCase.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          selectedCase.caseSeverity.includes('Kritis')
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : selectedCase.caseSeverity.includes('Tinggi')
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {selectedCase.caseSeverity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedCase.status}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {selectedCase.caseTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Siswa: <strong className="text-slate-800 font-bold">{selectedCase.studentName}</strong> (NISN: {selectedCase.studentId}) • Kelas {selectedCase.class} • {selectedCase.dorm}
                    </p>
                  </div>

                  {/* Tombol Cetak PDF & Kelola Berkas */}
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <button
                      onClick={handlePrintCasePDF}
                      disabled={isGeneratingPdf}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Cetak Laporan Lengkap (PDF)'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditCaseModal(selectedCase)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                      title="Edit Info Kasus"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCaseAction(selectedCase.id)}
                      className="p-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition"
                      title="Hapus Berkas Kasus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Rangkuman Kasus */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Insiden</span>
                    <span className="font-extrabold text-slate-800">{formatDateIndonesian(selectedCase.incidentDate)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Pelanggaran</span>
                    <span className="font-extrabold text-slate-800">{selectedCase.caseCategory}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Penanggung Jawab / Konselor</span>
                    <span className="font-extrabold text-slate-800">{selectedCase.primaryInvestigator}</span>
                  </div>
                </div>

                {/* Ringkasan Analisis Latar Belakang */}
                {selectedCase.initialAssessmentSummary && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                      <Info className="w-3.5 h-3.5 text-indigo-600" />
                      Ringkasan Awal Insiden & Faktor Kerentanan (Predisposition)
                    </h4>
                    <p className="text-xs text-indigo-900 leading-relaxed">
                      {selectedCase.initialAssessmentSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Bagian Kronologi Observasi Shift */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Kronologi Observasi Psikologi Setiap Shift
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluasi MSE (Mental Status Exam), afek, mekanisme koping, risiko, dan pesan serah terima antar-shift.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddShiftModal}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Catat Observasi Shift Baru</span>
                  </button>
                </div>

                {selectedCase.shifts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-200 text-center">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-700">Belum Ada Catatan Shift</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Mulailah mendokumentasikan pemantauan perilaku dan status mental siswa pada shift berjalan (Pagi, Siang, atau Malam).
                    </p>
                    <button
                      onClick={handleOpenAddShiftModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Catat Shift Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCase.shifts.map((s, idx) => {
                      const isMorning = s.shift.includes('Pagi');
                      const isAfternoon = s.shift.includes('Siang');
                      const isNight = s.shift.includes('Malam');

                      const shiftThemeClass = isMorning
                        ? 'border-amber-200 bg-gradient-to-br from-amber-50/40 to-white'
                        : isAfternoon
                        ? 'border-sky-200 bg-gradient-to-br from-sky-50/40 to-white'
                        : 'border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white';

                      const shiftBadgeClass = isMorning
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : isAfternoon
                        ? 'bg-sky-100 text-sky-900 border-sky-300'
                        : 'bg-indigo-100 text-indigo-900 border-indigo-300';

                      const ShiftIcon = isMorning ? Sun : isAfternoon ? Sunset : Moon;

                      return (
                        <div
                          key={s.id}
                          className={`rounded-3xl p-5 md:p-6 border shadow-sm transition-all space-y-4 ${shiftThemeClass}`}
                        >
                          {/* Header Baris Shift */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl border flex items-center justify-center ${shiftBadgeClass}`}>
                                <ShiftIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-slate-900">{s.shift}</span>
                                  <span className="text-[11px] font-semibold text-slate-500">• {formatDateIndonesian(s.date)} ({s.time} WIB)</span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium mt-0.5">
                                  Petugas Shift: <strong className="text-slate-800">{s.officerName}</strong> ({s.officerRole})
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  s.riskLevel.includes('Kritis')
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : s.riskLevel.includes('Tinggi')
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : s.riskLevel.includes('Sedang')
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                Risiko: {s.riskLevel}
                              </span>
                              <button
                                onClick={() => handleOpenEditShiftModal(s)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Observasi Shift"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteShiftAction(s.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Observasi Shift"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 5 Modul Analisis Klinis */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* 1. Mental Status Examination (MSE) */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 space-y-2">
                              <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-indigo-600" />
                                1. Pemeriksaan Status Mental (MSE)
                              </h5>
                              <div className="space-y-1.5 text-slate-700">
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Penampilan & Motorik:</span>
                                  <p className="leading-relaxed">{s.appearanceAndMotor || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Afek & Suasana Perasaan:</span>
                                  <p className="leading-relaxed">{s.moodAndAffect || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Pola Bicara & Alur Pikir:</span>
                                  <p className="leading-relaxed">{s.speechAndThoughtPattern || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Orientasi & Kesadaran:</span>
                                  <p className="leading-relaxed">{s.orientationAndConsciousness || '-'}</p>
                                </div>
                              </div>
                            </div>

                            {/* 2. Dinamika Psikologis & Koping */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 space-y-2">
                              <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                                <Brain className="w-4 h-4 text-indigo-600" />
                                2. Dinamika Psikologis & Mekanisme Pertahanan (Defense)
                              </h5>
                              <div className="space-y-1.5 text-slate-700">
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Faktor Pemicu (Trigger):</span>
                                  <p className="leading-relaxed">{s.triggerFactors || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Tingkat Regulasi Emosi:</span>
                                  <p className="leading-relaxed">{s.emotionalRegulation || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-slate-500 block">Mekanisme Koping / Defense Mechanism:</span>
                                  <p className="leading-relaxed font-semibold text-indigo-900">{s.defenseMechanisms || '-'}</p>
                                </div>
                              </div>
                            </div>

                            {/* 3. Evaluasi Risiko & Bahaya */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 space-y-2">
                              <h5 className="font-extrabold text-xs text-rose-950 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                3. Evaluasi Risiko & Safety Plan
                              </h5>
                              <p className="text-slate-700 leading-relaxed">
                                {s.riskNotes || 'Tidak ditemukan catatan bahaya spesifik.'}
                              </p>
                            </div>

                            {/* 4. Intervensi Konseling Diberikan */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 space-y-2">
                              <h5 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                                4. Intervensi Konseling & Respon Siswa
                              </h5>
                              <div className="space-y-1 text-slate-700">
                                <p><strong className="text-slate-800">Teknik:</strong> {s.interventionTechnique}</p>
                                <p><strong className="text-slate-800">Respon Siswa:</strong> {s.studentResponse || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* 5. Catatan Serah Terima Shift (Handover) */}
                          <div className="bg-amber-100/70 border border-amber-300/80 rounded-2xl p-3.5 text-xs">
                            <h5 className="font-black text-amber-950 flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
                              Instruksi Serah Terima Shift (Handover Notes untuk Petugas Berikutnya):
                            </h5>
                            <p className="text-amber-950 font-medium leading-relaxed">
                              {s.handoverNotes || 'Tidak ada instruksi khusus.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL FORM KASUS BARU / EDIT */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingCase ? 'Edit Berkas Kasus Khusus' : 'Buat Berkas Kasus Khusus Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rekam kronologi kasus pelanggaran berat dengan pendekatan psikiatri & psikologi klinis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCaseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Siswa Terkait Pelanggaran Berat *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  disabled={!!editingCase}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NISN: {s.id}) — Kelas {s.class} ({s.dorm})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Kejadian / Insiden *</label>
                  <input
                    type="date"
                    value={formIncidentDate}
                    onChange={(e) => setFormIncidentDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tingkat Keparahan / Risiko *</label>
                  <select
                    value={formCaseSeverity}
                    onChange={(e) => setFormCaseSeverity(e.target.value as SpecialCaseSeverity)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Tinggi (High Risk)">Tinggi (High Risk)</option>
                    <option value="Kritis (Severe / Crisis)">Kritis (Severe / Crisis)</option>
                    <option value="Investigasi Khusus">Investigasi Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul / Perihal Kasus *</label>
                <input
                  type="text"
                  value={formCaseTitle}
                  onChange={(e) => setFormCaseTitle(e.target.value)}
                  placeholder="Misal: Kronologi Investigasi Perilaku Agresi Fisik & Pembangkangan Asrama"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Klasifikasi Kategori Pelanggaran *</label>
                  <input
                    type="text"
                    value={formCaseCategory}
                    onChange={(e) => setFormCaseCategory(e.target.value)}
                    placeholder="Pelanggaran Berat Level 3"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Penanganan Kasus *</label>
                  <select
                    value={formCaseStatus}
                    onChange={(e) => setFormCaseStatus(e.target.value as SpecialCaseStatus)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Dalam Pemantauan Intensif">Dalam Pemantauan Intensif</option>
                    <option value="Observasi Stabil">Observasi Stabil</option>
                    <option value="Menunggu Sidang Keasramaan">Menunggu Sidang Keasramaan</option>
                    <option value="Rujukan Psikiater / Faskes Luar">Rujukan Psikiater / Faskes Luar</option>
                    <option value="Selesai / Resolusi">Selesai / Resolusi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Penanggung Jawab / Konselor Pendamping *</label>
                <input
                  type="text"
                  value={formPrimaryInvestigator}
                  onChange={(e) => setFormPrimaryInvestigator(e.target.value)}
                  placeholder="Nama Pengasuh / Guru BK / Psikolog"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ringkasan Awal Insiden & Faktor Kerentanan Psikologis
                </label>
                <textarea
                  rows={3}
                  value={formInitialAssessment}
                  onChange={(e) => setFormInitialAssessment(e.target.value)}
                  placeholder="Jelaskan ringkas latar belakang peristiwa, pemicu awal, dan dinamika kepribadian siswa sebelum insiden..."
                  className="w-full border border-slate-300 rounded-xl p-3 font-normal text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCaseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition"
                >
                  Simpan Berkas Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM LOG OBSERVASI SHIFT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingShiftLog ? 'Edit Observasi Shift' : 'Catat Observasi Shift Baru (Psikologi & Psikiatri)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Berkas Siswa: <strong className="text-slate-800">{selectedCase?.studentName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Template Helper */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Templat Cepat Klinis:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyQuickMseTemplate('agitasi')}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] transition cursor-pointer"
                >
                  Kondisi Agitasi / Marah
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickMseTemplate('stabil')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] transition cursor-pointer"
                >
                  Kondisi Tenang / Kooperatif
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickMseTemplate('depresi')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-[10px] transition cursor-pointer"
                >
                  Kondisi Menarik Diri / Sedih
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveShiftSubmit} className="space-y-4 text-xs">
              {/* Info Shift & Petugas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shift Pemantauan *</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-white"
                  >
                    <option value="Shift Pagi (06.00 - 14.00)">Shift Pagi (06.00 - 14.00)</option>
                    <option value="Shift Siang / Sore (14.00 - 21.00)">Shift Siang / Sore (14.00 - 21.00)</option>
                    <option value="Shift Malam / Dini Hari (21.00 - 06.00)">Shift Malam / Dini Hari (21.00 - 06.00)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Catat (WIB) *</label>
                  <input
                    type="time"
                    value={shiftTime}
                    onChange={(e) => setShiftTime(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Petugas Shift *</label>
                  <input
                    type="text"
                    value={shiftOfficerName}
                    onChange={(e) => setShiftOfficerName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Peran Petugas Shift</label>
                  <select
                    value={shiftOfficerRole}
                    onChange={(e) => setShiftOfficerRole(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 bg-white"
                  >
                    <option value="Wali Asuh Shift">Wali Asuh Shift</option>
                    <option value="Konselor BK">Konselor BK</option>
                    <option value="Tim Investigasi Keasramaan">Tim Investigasi Keasramaan</option>
                    <option value="Psikolog / Tenaga Klinis">Psikolog / Tenaga Klinis</option>
                  </select>
                </div>
              </div>

              {/* 1. MSE Fields */}
              <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <h4 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  1. Pemeriksaan Status Mental (Mental Status Examination / MSE)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Penampilan Fisik & Motorik</label>
                    <input
                      type="text"
                      value={mseAppearance}
                      onChange={(e) => setMseAppearance(e.target.value)}
                      placeholder="Gestur, kontak mata, tremor, kegelisahan motorik"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Afek & Suasana Perasaan (Mood)</label>
                    <input
                      type="text"
                      value={mseMood}
                      onChange={(e) => setMseMood(e.target.value)}
                      placeholder="Iritabel, labil, datar, eutimik, cemas, menyesal"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pola Bicara & Arus Pikir</label>
                    <input
                      type="text"
                      value={mseSpeech}
                      onChange={(e) => setMseSpeech(e.target.value)}
                      placeholder="Artikulasi, kecepatan bicara, logika alur pikir"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Orientasi & Tingkat Kesadaran</label>
                    <input
                      type="text"
                      value={mseOrientation}
                      onChange={(e) => setMseOrientation(e.target.value)}
                      placeholder="Compos mentis, orientasi ruang/waktu/orang"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dinamika Psikologis & Koping */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  2. Dinamika Emosional & Mekanisme Pertahanan Diri (Defense Mechanisms)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stimulus / Pemicu Emosi</label>
                    <input
                      type="text"
                      value={psychTrigger}
                      onChange={(e) => setPsychTrigger(e.target.value)}
                      placeholder="Konflik teman, aturan asrama, kabar rumah"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tingkat Regulasi Emosi</label>
                    <input
                      type="text"
                      value={psychRegulation}
                      onChange={(e) => setPsychRegulation(e.target.value)}
                      placeholder="Mampu self-soothe vs ledakan emosi"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Defense Mechanism Terlihat</label>
                    <input
                      type="text"
                      value={psychDefense}
                      onChange={(e) => setPsychDefense(e.target.value)}
                      placeholder="Denial, Rasionalisasi, Proyeksi, Acting Out"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Evaluasi Risiko */}
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 space-y-3">
                <h4 className="font-extrabold text-xs text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  3. Evaluasi Risiko Klinis & Potensi Bahaya (Risk Assessment)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tingkat Risiko *</label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value as ClinicalRiskLevel)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 bg-white"
                    >
                      <option value="Rendah (Aman)">Rendah (Aman)</option>
                      <option value="Sedang (Perlu Pengawasan)">Sedang (Perlu Pengawasan)</option>
                      <option value="Tinggi (Eskalasi / Re-offense Risk)">Tinggi (Eskalasi / Re-offense Risk)</option>
                      <option value="Kritis (Bahaya Langsung / Rujukan)">Kritis (Bahaya Langsung / Rujukan)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Catatan Risiko / Safety Action</label>
                    <input
                      type="text"
                      value={riskNotes}
                      onChange={(e) => setRiskNotes(e.target.value)}
                      placeholder="Potensi kabur, self-harm, provokasi kelompok, benturan susulan"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Intervensi Konseling */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  4. Intervensi Konseling & Terapi yang Diberikan pada Shift Ini
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teknik Konseling Diterapkan</label>
                    <input
                      type="text"
                      value={interventionTech}
                      onChange={(e) => setInterventionTech(e.target.value)}
                      placeholder="De-eskalasi Krisis, Active Listening, Grounding, Reframing"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Respon Afektif & Perilaku Siswa</label>
                    <input
                      type="text"
                      value={studentResponse}
                      onChange={(e) => setStudentResponse(e.target.value)}
                      placeholder="Kooperatif, menangis katarsis, menolak bicara, minta maaf"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Catatan Handover */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-800" />
                  5. Instruksi Serah Terima Shift (Handover Notes untuk Petugas Berikutnya) *
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Instruksi pengawasan kamar tidur, pembatasan stimulus, pendampingan ibadah, hal-hal krusial..."
                  required
                  className="w-full border border-amber-300 rounded-xl p-3 text-slate-800 bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition"
                >
                  Simpan Catatan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
