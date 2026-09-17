import React, { useState, useMemo } from 'react';
import {
  FileText,

  Brain,
  Plus,
  Search,
  Filter,
  FileDown,
  Printer,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Users,
  Sparkles,
  Smile,
  ArrowUpRight,
  ChevronRight,
  Eye,
  MessageSquare,
  Calendar,
  Home,
  User
} from 'lucide-react';
import {

  Student,
  PsychologicalAssessment,
  AssessmentResult,
  PsychologicalTestType,
  PsychologicalClinicalStatus,
  AppConfig
} from '../types';
import {
 PSYCHOLOGICAL_TESTS } from '../services/psychologicalBattery';
import {
 generatePsychologicalReportPDF } from '../services/psychologicalPdfGenerator';
import {
 formatDateIndonesian } from '../utils/dateFormatter';
import {
 StudentAssessmentPortalModal } from './StudentAssessmentPortalModal';
import { AssessmentResultModal } from './AssessmentResultModal';

interface PsychologicalAssessmentTabProps {
  students: Student[];
  assessments: PsychologicalAssessment[];
  assessmentResults: AssessmentResult[];
  onSaveAssessmentResult: (assessment: AssessmentResult) => void;
  onDeleteAssessmentResult: (id: string) => void;
  onSaveAssessment: (assessment: PsychologicalAssessment) => void;
  onDeleteAssessment: (id: string) => void;
  config: AppConfig;
  onOpenCounselingWithContext?: (studentId: string, contextNotes: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const PsychologicalAssessmentTab: React.FC<PsychologicalAssessmentTabProps> = ({
  students,
  assessments,
  assessmentResults,
  onSaveAssessmentResult,
  onDeleteAssessmentResult,
  onSaveAssessment,
  onDeleteAssessment,
  config,
  onOpenCounselingWithContext,
  onShowToast
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTestType, setFilterTestType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDorm, setFilterDorm] = useState<string>('all');

  // Selected assessment for detail view
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );

  // Modal test portal
  const [isTestPortalOpen, setIsTestPortalOpen] = useState(false);
  const [testPortalStudentId, setTestPortalStudentId] = useState<string | undefined>(undefined);

  // Confirm delete modal state
  const [assessmentToDelete, setAssessmentToDelete] = useState<PsychologicalAssessment | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'psychology' | 'assessmentResults'>('psychology');
  const [isAssessmentResultModalOpen, setIsAssessmentResultModalOpen] = useState(false);
  const [assessmentResultToEdit, setAssessmentResultToEdit] = useState<AssessmentResult | undefined>(undefined);
  const [assessmentResultToDelete, setAssessmentResultToDelete] = useState<AssessmentResult | null>(null);

  const [searchAssessmentResult, setSearchAssessmentResult] = useState('');
  const filteredAssessmentResults = useMemo(() => {
    return assessmentResults.filter(a => {
      const q = searchAssessmentResult.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.assessmentType.toLowerCase().includes(q)
      );
    });
  }, [assessmentResults, searchAssessmentResult]);


  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        a.studentName.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.studentDorm.toLowerCase().includes(q);

      const matchTest = filterTestType === 'all' || a.testType === filterTestType;
      const matchStatus = filterStatus === 'all' || a.overallStatus === filterStatus;
      const matchDorm = filterDorm === 'all' || a.studentDorm === filterDorm;

      return matchSearch && matchTest && matchStatus && matchDorm;
    });
  }, [assessments, searchQuery, filterTestType, filterStatus, filterDorm]);

  // Active selected assessment
  const activeAssessment = useMemo(() => {
    return (
      assessments.find((a) => a.id === selectedAssessmentId) ||
      filteredAssessments[0] ||
      null
    );
  }, [assessments, selectedAssessmentId, filteredAssessments]);

  // Metrics
  const metrics = useMemo(() => {
    const total = assessments.length;
    const normalCount = assessments.filter((a) => a.overallStatus === 'normal').length;
    const borderlineCount = assessments.filter((a) => a.overallStatus === 'borderline').length;
    const abnormalCount = assessments.filter((a) => a.overallStatus === 'abnormal').length;

    return { total, normalCount, borderlineCount, abnormalCount };
  }, [assessments]);

  // Unique Dorms for filter
  const dormOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.dorm) set.add(s.dorm);
    });
    return Array.from(set);
  }, [students]);

  const handlePrintPDF = async (assessment: PsychologicalAssessment) => {
    try {
      await generatePsychologicalReportPDF(assessment, config);
      onShowToast('PDF Berhasil Diunduh', `Laporan psikologi ananda ${assessment.studentName} berhasil dibuat.`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Membuat PDF', 'Terjadi kendala teknis saat menyusun file laporan.', 'error');
    }
  };

  const handleReferToCounseling = (assessment: PsychologicalAssessment) => {
    const notes = `[RUJUKAN ASESMEN PSIKOLOGI - ${assessment.testTitle}]\nTanggal Tes: ${assessment.date}\nStatus Kejiwaan: ${assessment.overallStatusLabel}\nTotal Skor: ${assessment.totalScore}\n\nRingkasan Pertimbangan Kejiwaan:\n${assessment.psychologicalConsiderations.join('\n')}\n\nRekomendasi Tindak Lanjut:\n${assessment.recommendations.forCounselor.join('\n')}`;

    if (onOpenCounselingWithContext) {
      onOpenCounselingWithContext(assessment.studentId, notes);
      onShowToast(
        'Rujukan Diteruskan ke BK',
        `Membuka form bimbingan konseling untuk ${assessment.studentName}.`,
        'success'
      );
    } else {
      onShowToast(
        'Informasi',
        'Data hasil asesmen siap digunakan sebagai bahan pertimbangan pada modul Bimbingan Konseling.',
        'info'
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              <span>Psikologi & Tumbuh Kembang Kejiwaan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Asesmen Kejiwaan & Tumbuh Kembang Siswa
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Instrumen tes psikologis terstandar (SDQ 25 & Skala Resiliensi Tumbuh Kembang) untuk
              mendeteksi stabilitas emosional, kepatuhan perilaku, relasi sosial, dan menyusun
              pertimbangan kejiwaan anak di asrama Sekolah Rakyat.
            </p>
          </div>

  
          {/* Sub Tab Switcher */}
          <div className="flex bg-slate-900/50 p-1 rounded-2xl w-full sm:w-auto mt-2">
            <button
              onClick={() => setActiveSubTab('psychology')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeSubTab === 'psychology' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              Tes Psikologi Mandiri
            </button>
            <button
              onClick={() => setActiveSubTab('assessmentResults')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${activeSubTab === 'assessmentResults' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              Hasil Assessment Manual
            </button>
          </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTestPortalStudentId(undefined);
                setIsTestPortalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-900/40 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Mulai Tes / Asesmen Baru</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTestPortalStudentId(undefined);
                setIsTestPortalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Smile className="w-4 h-4 text-amber-400" />
              <span>Portal Mandiri Siswa</span>
            </button>
          </div>
        </div>
      </div>

      
      {activeSubTab === 'psychology' && (
        <>
          {/* Metrics Row */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tes Selesai</p>
            <p className="text-2xl font-black text-slate-800 leading-tight">{metrics.total}</p>
            <p className="text-[10px] text-slate-400">Riwayat asesmen siswa</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Sehat / Stabil</p>
            <p className="text-2xl font-black text-emerald-900 leading-tight">{metrics.normalCount}</p>
            <p className="text-[10px] text-emerald-600">Perkembangan adaptif</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Ambang Batas</p>
            <p className="text-2xl font-black text-amber-900 leading-tight">{metrics.borderlineCount}</p>
            <p className="text-[10px] text-amber-600">Perlu observasi aktif</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Perhatian Khusus</p>
            <p className="text-2xl font-black text-rose-900 leading-tight">{metrics.abnormalCount}</p>
            <p className="text-[10px] text-rose-600">Butuh pendampingan BK</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau asrama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Test Type */}
          <select
            value={filterTestType}
            onChange={(e) => setFilterTestType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Semua Instrumen Tes</option>
            <option value="sdq_25">SDQ 25 (Emosi & Perilaku)</option>
            <option value="resilience_growth_20">Resiliensi & Tumbuh Kembang</option>
            <option value="mmpi_tni_polri">MMPI-TNI/POLRI</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Semua Status Kejiwaan</option>
            <option value="normal">Normal / Stabil</option>
            <option value="borderline">Ambang Batas (Borderline)</option>
            <option value="abnormal">Perlu Perhatian Khusus</option>
          </select>

          {/* Filter Dorm */}
          <select
            value={filterDorm}
            onChange={(e) => setFilterDorm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Semua Asrama</option>
            {dormOptions.map((dorm) => (
              <option key={dorm} value={dorm}>
                {dorm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Grid: Left = List, Right = Detailed Psychological Considerations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIST OF ASSESSMENTS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Riwayat Tes ({filteredAssessments.length})
            </h3>
            {filteredAssessments.length > 0 && (
              <span className="text-[11px] text-slate-400">Klik untuk melihat lembar pertimbangan</span>
            )}
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Tes</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Mulai tes psikologi siswa untuk menghasilkan pertimbangan kejiwaan dan tumbuh kembang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTestPortalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mulai Tes Pertama</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredAssessments.map((a) => {
                const isSelected = activeAssessment?.id === a.id;
                const isNormal = a.overallStatus === 'normal';
                const isBorderline = a.overallStatus === 'borderline';

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssessmentId(a.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                            isNormal
                              ? 'bg-emerald-100 text-emerald-800'
                              : isBorderline
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {a.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                            {a.studentName}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Kelas {a.studentClass} • {a.studentDorm}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isNormal
                            ? 'bg-emerald-100 text-emerald-800'
                            : isBorderline
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isNormal ? 'Stabil' : isBorderline ? 'Borderline' : 'Perhatian'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {a.testTitle}
                      </span>
                      <span>{formatDateIndonesian(a.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED REPORT & PSYCHOLOGICAL CONSIDERATIONS (7 COLS) */}
        <div className="lg:col-span-7">
          {activeAssessment ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-7 space-y-6">
              {/* Header & Student Identity */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                      activeAssessment.overallStatus === 'normal'
                        ? 'bg-emerald-600'
                        : activeAssessment.overallStatus === 'borderline'
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    {activeAssessment.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {activeAssessment.studentName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      NISN: <span className="font-mono font-semibold text-slate-700">{activeAssessment.studentId}</span> • Kelas {activeAssessment.studentClass} • {activeAssessment.studentDorm}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tanggal: {formatDateIndonesian(activeAssessment.date)} • Diisi: {activeAssessment.filledBy === 'student' ? 'Akses Mandiri Siswa' : 'Didampingi Pengasuh'}
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePrintPDF(activeAssessment)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Unduh Lembar Rapor Psikologi PDF"
                  >
                    <FileDown className="w-4 h-4 text-red-600" />
                    <span>Unduh PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReferToCounseling(activeAssessment)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Teruskan Data ke Sesi Bimbingan Konseling"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Rujuk ke BK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssessmentToDelete(activeAssessment)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Hapus Data Asesmen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  activeAssessment.overallStatus === 'normal'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : activeAssessment.overallStatus === 'borderline'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                {activeAssessment.overallStatus === 'normal' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : activeAssessment.overallStatus === 'borderline' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs uppercase tracking-wider">
                      Kesimpulan Evaluasi Kejiwaan:
                    </p>
                    <span className="font-black text-sm">
                      {activeAssessment.overallStatusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {activeAssessment.developmentalInsights}
                  </p>
                </div>
              </div>

              {/* Dimension Scores Visual Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-red-600" />
                  <span>Skor Dimensi Klinis & Tumbuh Kembang</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.values(activeAssessment.dimensionScores) as any[]).map((dim) => {
                    const isNormal = dim.status === 'normal';
                    const isBorderline = dim.status === 'borderline';
                    const percentage = Math.min(100, Math.round((dim.score / dim.maxScore) * 100));

                    return (
                      <div
                        key={dim.dimensionKey}
                        className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            {dim.dimensionName}
                          </p>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              isNormal
                                ? 'bg-emerald-100 text-emerald-800'
                                : isBorderline
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {dim.score}/{dim.maxScore}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isNormal
                                ? 'bg-emerald-500'
                                : isBorderline
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <p className="text-[10px] text-slate-500 leading-tight">
                          {dim.clinicalInterpretation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section I: Psychological Considerations */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Pertimbangan Kejiwaan & Dinamika Anak</span>
                </h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  {activeAssessment.psychologicalConsiderations.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section II: Strengths & Risk Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Strengths */}
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Faktor Protektif & Kekuatan Anak:</span>
                  </p>
                  <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                    {activeAssessment.prosocialStrengths.map((s, idx) => (
                      <li key={idx} className="leading-snug">{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 space-y-2">
                  <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Area Kerentanan & Risiko:</span>
                  </p>
                  <ul className="text-xs text-rose-800 space-y-1 list-disc list-inside">
                    {activeAssessment.riskFactors.map((rf, idx) => (
                      <li key={idx} className="leading-snug">{rf}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section III: Recommendations */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-red-600" />
                  <span>Rekomendasi Tindak Lanjut Terpadu</span>
                </h3>

                <div className="space-y-2.5">
                  {/* For Caretaker */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-blue-600" />
                      <span>Untuk Wali Asuh di Asrama:</span>
                    </p>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside pl-1">
                      {activeAssessment.recommendations.forCaretaker.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* For Counselor / BK */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                      <span>Untuk Guru BK & Konselor:</span>
                    </p>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside pl-1">
                      {activeAssessment.recommendations.forCounselor.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Referral advice if any */}
                  {activeAssessment.recommendations.referralAdvice && (
                    <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-300 text-xs text-rose-900 font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{activeAssessment.recommendations.referralAdvice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold text-slate-600">Pilih Riwayat Asesmen</p>
              <p className="text-xs text-slate-400 mt-1">
                Pilih salah satu riwayat di sebelah kiri untuk melihat rincian pertimbangan kejiwaan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Self-Assessment Portal Modal */}
      <StudentAssessmentPortalModal
        isOpen={isTestPortalOpen}
        onClose={() => {
          setIsTestPortalOpen(false);
          setTestPortalStudentId(undefined);
        }}
        students={students}
        preselectedStudentId={testPortalStudentId}
        onSaveAssessment={(newAssessment) => {
          onSaveAssessment(newAssessment);
          setSelectedAssessmentId(newAssessment.id);
        }}
        onShowToast={onShowToast}
      />

      
        </>
      )}

      {activeSubTab === 'assessmentResults' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama, NISN, atau jenis assessment..."
                value={searchAssessmentResult}
                onChange={(e) => setSearchAssessmentResult(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              />
            </div>
            <button
              onClick={() => {
                setAssessmentResultToEdit(undefined);
                setIsAssessmentResultModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Input Hasil Assessment Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Siswa</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Jenis / Kategori</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Skor</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Assessor</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessmentResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p>Belum ada data hasil assessment yang diinput.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssessmentResults.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-slate-600">{a.date}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{a.studentName}</p>
                          <p className="text-xs text-slate-500 font-mono">{a.studentId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-700">{a.assessmentType}</p>
                          <p className="text-xs text-slate-500">{a.category}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-600">{a.score || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{a.assessor || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setAssessmentResultToEdit(a);
                                setIsAssessmentResultModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Data"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setAssessmentResultToDelete(a)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AssessmentResultModal
        isOpen={isAssessmentResultModalOpen}
        onClose={() => {
          setIsAssessmentResultModalOpen(false);
          setAssessmentResultToEdit(undefined);
        }}
        students={students}
        onSave={(data) => {
          onSaveAssessmentResult(data);
          onShowToast('Berhasil', 'Data hasil assessment tersimpan', 'success');
        }}
        initialData={assessmentResultToEdit}
      />

      {assessmentResultToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAssessmentResultToDelete(null)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm z-10 text-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Assessment?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Data hasil assessment <b>{assessmentResultToDelete.studentName}</b> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAssessmentResultToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAssessmentResult(assessmentResultToDelete.id);
                  setAssessmentResultToDelete(null);
                  onShowToast('Data Terhapus', 'Hasil assessment berhasil dihapus.', 'info');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Psychology Test Confirmation */}

      {assessmentToDelete && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-base text-slate-900">Hapus Riwayat Asesmen?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Data asesmen ananda <strong>{assessmentToDelete.studentName}</strong> ({formatDateIndonesian(assessmentToDelete.date)}) akan dihapus permanen.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssessmentToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAssessment(assessmentToDelete.id);
                  setAssessmentToDelete(null);
                  onShowToast('Data Terhapus', 'Riwayat asesmen berhasil dihapus.', 'info');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
