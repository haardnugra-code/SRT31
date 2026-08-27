import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Image as ImageIcon,
  ImageOff,
  Printer,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Globe,
  Upload,
  Copy,
  Check,
  FileCheck,
  MailWarning,
  Minus,
  Save,
  RotateCcw,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Student, Violation, AppConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { getViolationTemplates, compressImageFile } from '../services/storage';
import { generateViolationNoticePDF, generateStudentViolationHistoryPDF } from '../services/pdfGenerator';
import { ParentSummonsModal } from './ParentSummonsModal';

interface ViolationsTabProps {
  students: Student[];
  violations: Violation[];
  config: AppConfig;
  onSaveViolation: (violation: Violation, isEdit: boolean) => void;
  onDeleteViolation: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  isModalOpenExternal?: boolean;
  onCloseExternalModal?: () => void;
}

export const ViolationsTab: React.FC<ViolationsTabProps> = ({
  students,
  violations,
  config,
  onSaveViolation,
  onDeleteViolation,
  onShowToast,
  onAskConfirm,
  isModalOpenExternal = false,
  onCloseExternalModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  // Page View Mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [draftInfo, setDraftInfo] = useState<{ timestamp: string } | null>(null);

  const [editingViolationId, setEditingViolationId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [level, setLevel] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [violationType, setViolationType] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [sanction, setSanction] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [reporter, setReporter] = useState<string>('Wali Asrama');
  const [photo, setPhoto] = useState<string>('');
  const [proofMode, setProofMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Evidence Photo / Link Preview Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Parent Summons Modal State
  const [isSummonsModalOpen, setIsSummonsModalOpen] = useState<boolean>(false);
  const [summonsSelectedViolation, setSummonsSelectedViolation] = useState<Violation | null>(null);
  const [summonsSelectedStudentId, setSummonsSelectedStudentId] = useState<string>('');

  const DRAFT_VIOLATIONS_KEY = 'SISWA_VIOLATIONS_DRAFT';

  // Open form automatically if triggered from external
  useEffect(() => {
    if (isModalOpenExternal) {
      handleOpenAddModal();
    }
  }, [isModalOpenExternal]);

  // Check saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_VIOLATIONS_KEY) || localStorage.getItem('SANTRI_VIOLATIONS_DRAFT');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.note || parsed.photo || parsed.urlInput)) {
          setDraftInfo({ timestamp: parsed.savedAt || new Date().toLocaleTimeString('id-ID') });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft when filling new violation
  useEffect(() => {
    if (viewMode !== 'form') return;
    if (editingViolationId) return;

    if (note || photo || urlInput) {
      const draftData = {
        studentId,
        level,
        date,
        violationType,
        explanation,
        sanction,
        note,
        reporter,
        photo,
        proofMode,
        urlInput,
        savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      try {
        localStorage.setItem(DRAFT_VIOLATIONS_KEY, JSON.stringify(draftData));
        setDraftInfo({ timestamp: draftData.savedAt });
      } catch {
        // ignore
      }
    }
  }, [
    viewMode,
    editingViolationId,
    studentId,
    level,
    date,
    violationType,
    explanation,
    sanction,
    note,
    reporter,
    photo,
    proofMode,
    urlInput
  ]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_VIOLATIONS_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.studentId) setStudentId(d.studentId);
      if (d.level) setLevel(d.level);
      if (d.date) setDate(d.date);
      if (d.violationType) setViolationType(d.violationType);
      if (d.explanation) setExplanation(d.explanation);
      if (d.sanction) setSanction(d.sanction);
      if (d.note) setNote(d.note);
      if (d.reporter) setReporter(d.reporter);
      if (d.photo) setPhoto(d.photo);
      if (d.proofMode) setProofMode(d.proofMode);
      if (d.urlInput) setUrlInput(d.urlInput);
      onShowToast('Draf Dipulihkan', 'Isian laporan pelanggaran berhasil dimuat kembali.', 'success');
    } catch {
      onShowToast('Gagal Memulihkan', 'Format draf tidak terbaca.', 'error');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_VIOLATIONS_KEY);
      setDraftInfo(null);
      onShowToast('Draf Dihapus', 'Draf lokal telah dibersihkan.', 'success');
    } catch {
      // ignore
    }
  };

  // Active templates (custom configured or defaults)
  const activeViolationTemplates = useMemo(() => getViolationTemplates(config), [config]);

  // Template options for selected level
  const templates = activeViolationTemplates[level] || [];

  const updateTypeDetails = (selectedType: string, currentLevel: number) => {
    const list = activeViolationTemplates[currentLevel] || [];
    const match = list.find((t) => t.text === selectedType);
    if (match) {
      setExplanation(match.explanation);
      setSanction(match.sanction);
    } else {
      setExplanation('');
      setSanction('');
    }
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    const newTemplates = activeViolationTemplates[newLevel] || [];
    const firstType = newTemplates[0]?.text || '';
    setViolationType(firstType);
    updateTypeDetails(firstType, newLevel);
  };

  const handleOpenAddModal = (defaultStudentId?: string) => {
    setEditingViolationId(null);
    setStudentId(defaultStudentId || students[0]?.id || '');
    setLevel(1);
    setDate(new Date().toISOString().split('T')[0]);
    const firstType = activeViolationTemplates[1]?.[0]?.text || '';
    setViolationType(firstType);
    updateTypeDetails(firstType, 1);
    setNote('');
    setReporter('Wali Asrama');
    setPhoto('');
    setUrlInput('');
    setProofMode('upload');
    setViewMode('form');
  };

  const handleOpenEditModal = (v: Violation) => {
    setEditingViolationId(v.id);
    setStudentId(v.studentId);
    setLevel(v.level);
    setDate(v.date);
    setViolationType(v.violation);
    setSanction(v.sanction);
    const templatesList = activeViolationTemplates[v.level] || [];
    const match = templatesList.find((t) => t.text === v.violation);
    setExplanation(match?.explanation || '');
    setNote(v.note || '');
    setReporter(v.reporter || 'Wali Asrama');
    const existingPhoto = v.photo || '';
    setPhoto(existingPhoto);
    if (existingPhoto.startsWith('http://') || existingPhoto.startsWith('https://')) {
      setUrlInput(existingPhoto);
      setProofMode('url');
    } else {
      setUrlInput('');
      setProofMode('upload');
    }
    setViewMode('form');
  };

  const handleBackToList = () => {
    setViewMode('list');
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImageFile(file, 800, 800, 0.75);
      setPhoto(compressedBase64);
      onShowToast('Foto Terkompresi', 'Foto bukti berhasil diunggah & dioptimalkan.', 'success');
    } catch (err) {
      onShowToast('Gagal Memproses Gambar', 'Terjadi kesalahan saat memproses gambar.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    setPhoto(val.trim());
  };

  const handleClearPhoto = () => {
    setPhoto('');
    setUrlInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Valid', 'Silakan pilih siswa terlebih dahulu.', 'warning');
      return;
    }

    if (editingViolationId) {
      const existing = violations.find((v) => v.id === editingViolationId);
      const updatedViolation: Violation = {
        id: editingViolationId,
        studentId,
        studentName: student.name,
        date,
        level,
        violation: violationType,
        sanction,
        note,
        reporter,
        photo,
        semester: existing?.semester || config.semester || 'Genap',
        academicYear: existing?.academicYear || config.academicYear || '2025/2026'
      };
      onSaveViolation(updatedViolation, true);
      onShowToast('Diperbarui', 'Data pelanggaran berhasil diubah.', 'success');
    } else {
      const newViolation: Violation = {
        id: `v-${Date.now()}`,
        studentId,
        studentName: student.name,
        date,
        level,
        violation: violationType,
        sanction,
        note,
        reporter,
        photo,
        semester: config.semester || 'Genap',
        academicYear: config.academicYear || '2025/2026'
      };
      onSaveViolation(newViolation, false);
      onShowToast('Kasus Tersimpan', 'Pencatatan pelanggaran berhasil ditambahkan.', 'success');
    }

    clearDraft();
    handleBackToList();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Laporan?',
      `Apakah Anda benar-benar yakin ingin menghapus catatan pelanggaran ${name}?`
    );
    if (confirmed) {
      onDeleteViolation(id);
      onShowToast('Kasus Dihapus', 'Catatan pelanggaran telah dihapus.', 'success');
    }
  };

  const handlePrintNotice = async (v: Violation) => {
    const student = students.find((s) => String(s.id) === String(v.studentId));
    onShowToast('Mengekspor Surat', `Membuat Surat Pemberitahuan Orang Tua (Legal 1 Halaman) untuk ${v.studentName}...`, 'warning');
    await generateViolationNoticePDF(v, student, config);
    onShowToast('Surat Berhasil Dibuat', `Surat Pemberitahuan Pelanggaran untuk ${v.studentName} telah diunduh.`, 'success');
  };

  const handlePrintStudentHistory = async (studentTargetId: string, studentName: string) => {
    const student = students.find((s) => String(s.id) === String(studentTargetId)) || {
      id: studentTargetId,
      name: studentName,
      class: 'SD',
      dorm: 'Asrama',
      caretaker: 'Wali Asrama'
    };
    const sViolations = violations.filter(
      (v) => String(v.studentId).trim().toLowerCase() === String(studentTargetId).trim().toLowerCase() ||
             String(v.studentName).trim().toLowerCase() === String(studentName).trim().toLowerCase()
    );
    onShowToast('Mencetak Riwayat', `Membuat Dokumen Buku Historis Pelanggaran untuk ${studentName}...`, 'warning');
    await generateStudentViolationHistoryPDF(student, sViolations, config);
    onShowToast('Riwayat Berhasil Dicetak', `Buku Historis Pelanggaran ${studentName} siap dibagikan.`, 'success');
  };

  const filteredViolations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return violations.filter((v) => {
      const matchName =
        v.studentName.toLowerCase().includes(q) ||
        v.violation.toLowerCase().includes(q) ||
        (v.sanction && v.sanction.toLowerCase().includes(q)) ||
        (v.note && v.note.toLowerCase().includes(q));
      const matchLevel = levelFilter === '' || String(v.level) === levelFilter;
      const matchStudent =
        studentFilter === '' ||
        String(v.studentId).trim().toLowerCase() === studentFilter.trim().toLowerCase() ||
        String(v.studentName).trim().toLowerCase() === studentFilter.trim().toLowerCase();
      return matchName && matchLevel && matchStudent;
    });
  }, [violations, searchQuery, levelFilter, studentFilter]);

  const getBadgeClass = (l: number) => {
    switch (l) {
      case 1:
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 2:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 3:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 4:
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 5:
        return 'bg-red-200 text-red-900 border border-red-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition active:scale-95 flex items-center justify-center shrink-0"
              title="Kembali ke Daftar Pelanggaran"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                  {editingViolationId ? 'Edit Laporan Pelanggaran' : 'Formulir Pencatatan Pelanggaran Siswa'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan pelanggaran siswa sesuai Bab Tata Tertib Buku Pintar (Semester Aktif: {config.semester || 'Genap'} {config.academicYear || '2025/2026'}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleBackToList}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition active:scale-95"
            >
              Batal / Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCompressing}
              className="bg-red-600 text-white hover:bg-red-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Simpan Laporan Pelanggaran
            </button>
          </div>
        </div>

        {/* Draft Recovery Notice */}
        {draftInfo && !editingViolationId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">Draf Isian Pelanggaran Tersedia</p>
                <p className="text-[11px] text-amber-800">Tersimpan otomatis secara lokal pukul {draftInfo.timestamp}.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Pulihkan Draf
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="px-3 py-1.5 bg-white border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl hover:bg-amber-100 transition"
              >
                Hapus Draf
              </button>
            </div>
          </div>
        )}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Identitas Siswa & Waktu */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Identitas Siswa & Waktu Kejadian
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Pilih siswa yang terlibat dan tanggal pencatatan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Siswa / Murid *
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.dorm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Kejadian *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pelapor Kasus *
                </label>
                <input
                  type="text"
                  required
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="e.g. Wali Asrama / Wali Kelas / Petugas Piket"
                />
              </div>

              {studentId && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5 mt-2">
                  <p className="font-bold text-slate-800">Ringkasan Data Siswa:</p>
                  {(() => {
                    const st = students.find((s) => String(s.id) === String(studentId));
                    if (!st) return null;
                    const prevCount = violations.filter((v) => String(v.studentId) === String(st.id)).length;
                    return (
                      <div className="space-y-1 text-slate-600 text-[11px]">
                        <p>• NISN: <span className="font-mono font-bold text-slate-700">{st.id}</span></p>
                        <p>• Kelas/Jenjang: <span className="font-bold text-slate-700">{st.class}</span></p>
                        <p>• Asrama: <span className="font-bold text-slate-700">{st.dorm}</span></p>
                        <p>• Wali Asuh: <span className="font-bold text-slate-700">{st.caretaker || '-'}</span></p>
                        <p>• Total Riwayat Pelanggaran: <span className="font-bold text-red-600">{prevCount} kasus</span></p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Middle Card: Tingkat & Jenis Pelanggaran */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Klasifikasi Pelanggaran & Sanksi Edukatif
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Klasifikasi tingkat pelanggaran berdasarkan Buku Tata Tertib</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Tingkat Pelanggaran (Tingkat 1 s/d 5) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isSelected = level === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleLevelChange(lvl)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-red-500 bg-red-50 text-red-950 font-bold ring-2 ring-red-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs'
                        }`}
                      >
                        <div className="text-xs font-extrabold">Tingkat {lvl}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          {lvl === 1 ? 'Ringan' : lvl === 2 ? 'Sedang' : lvl === 3 ? 'Berat' : lvl === 4 ? 'Sangat Berat' : 'Luar Biasa'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bentuk Pelanggaran (Pedoman Buku Saku) *
                </label>
                <select
                  value={violationType}
                  onChange={(e) => {
                    setViolationType(e.target.value);
                    updateTypeDetails(e.target.value, level);
                  }}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-800"
                >
                  {templates.map((t) => (
                    <option key={t.text} value={t.text}>
                      {t.text}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kriteria / Penjelasan Tindakan
                  </label>
                  <textarea
                    value={explanation}
                    readOnly
                    rows={3}
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3.5 py-2 text-xs text-slate-600 font-medium resize-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rekomendasi Sanksi Sesuai Buku Saku
                  </label>
                  <textarea
                    value={sanction}
                    readOnly
                    rows={3}
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3.5 py-2 text-xs text-red-700 font-bold resize-none focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Detail / Kronologi Tambahan
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="e.g. Kronologi singkat kejadian, saksi yang melihat, atau komitmen perbaikan langsung dari siswa bersangkutan..."
                />
              </div>

              {/* Evidence / Bukti Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-red-600" /> Bukti Kejadian / Dokumen Pelanggaran
                  </label>

                  {/* Mode Toggle Tabs */}
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setProofMode('upload')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                        proofMode === 'upload'
                          ? 'bg-white text-red-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setProofMode('url')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                        proofMode === 'url'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Globe className="w-3 h-3" /> Link Bukti URL
                    </button>
                  </div>
                </div>

                {proofMode === 'upload' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isCompressing}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2 text-xs focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                    />
                    {isCompressing && (
                      <p className="text-[11px] text-amber-600 font-medium animate-pulse flex items-center gap-1">
                        <Upload className="w-3 h-3 animate-spin" /> Mengompres dan memproses gambar bukti...
                      </p>
                    )}
                    {photo && photo.startsWith('data:image') && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <img
                          src={photo}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-emerald-900 truncate">Foto Bukti Terunggah</p>
                          <p className="text-[11px] text-emerald-700">Gambar siap disimpan ke database laporan</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearPhoto}
                          className="text-xs text-red-600 hover:text-red-800 font-bold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                        placeholder="https://drive.google.com/... atau tautan file bukti (Dropbox, Cloud, dll)"
                        className="w-full border border-slate-300 bg-white rounded-xl pl-9 pr-20 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                      />
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      {urlInput && (
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleClearPhoto}
                            className="text-xs text-slate-400 hover:text-red-600 px-1.5 py-1 rounded"
                            title="Hapus URL"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * Masukkan tautan Google Drive, Google Photos, Cloud Storage, atau dokumen pendukung kasus.
                    </p>

                    {urlInput && (urlInput.startsWith('http://') || urlInput.startsWith('https://')) && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-blue-900 font-semibold truncate text-xs">
                            {urlInput}
                          </span>
                        </div>
                        <a
                          href={urlInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 shadow-xs active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Uji Tautan
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition active:scale-95"
            >
              Batalkan dan Kembali ke Daftar
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isCompressing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingViolationId ? 'Simpan Perubahan Laporan' : 'Simpan Laporan Pelanggaran'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Pusat Laporan Pelanggaran
            </h2>
            <span className="text-[10px] font-extrabold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full border border-red-200">
              Reset Poin per Semester: Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan pelanggaran siswa sesuai Bab Tata Tertib Buku Pintar (Semester Aktif: {config.semester || 'Genap'} {config.academicYear || '2025/2026'}).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSummonsSelectedViolation(null);
              setSummonsSelectedStudentId(studentFilter || '');
              setIsSummonsModalOpen(true);
            }}
            className="bg-amber-600 text-white text-xs font-bold px-3.5 py-3 rounded-lg hover:bg-amber-700 shadow transition active:scale-95 flex items-center gap-1.5"
            title="Buka Generator Surat Panggilan Resmi Orang Tua / Wali Siswa"
          >
            <MailWarning className="w-4 h-4" /> Buat Surat Panggilan
          </button>
          {studentFilter && (
            <button
              onClick={() => {
                const s = students.find((st) => String(st.id) === String(studentFilter));
                if (s) {
                  handlePrintStudentHistory(s.id, s.name);
                }
              }}
              className="bg-slate-900 text-white text-xs font-bold px-3.5 py-3 rounded-lg hover:bg-slate-800 shadow transition active:scale-95 flex items-center gap-1.5"
              title="Cetak Buku Historis Pelanggaran untuk siswa yang difilter"
            >
              <FileText className="w-4 h-4" /> Cetak Historis Siswa (PDF)
            </button>
          )}
          <button
            onClick={() => handleOpenAddModal()}
            className="bg-red-600 text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-red-700 shadow transition active:scale-95 flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" /> Catat Pelanggaran Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa atau pelanggaran..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 max-w-[200px]"
        >
          <option value="">Semua Siswa</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.class})
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          <option value="">Semua Tingkat Pelanggaran</option>
          <option value="1">Tingkat 1 (Pelanggaran Ringan)</option>
          <option value="2">Tingkat 2 (Pelanggaran Sedang)</option>
          <option value="3">Tingkat 3 (Pelanggaran Berat)</option>
          <option value="4">Tingkat 4 (Pelanggaran Sangat Berat)</option>
          <option value="5">Tingkat 5 (Pelanggaran Luar Biasa)</option>
        </select>
      </div>

      {/* Violations List */}
      <div className="space-y-4">
        {filteredViolations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada data pelanggaran yang cocok dengan kriteria filter.
          </div>
        ) : (
          filteredViolations.map((v) => (
            <div
              key={v.id}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex gap-3.5 items-start flex-1 min-w-0">
                <div
                  className={`px-2.5 py-1 rounded-xl text-center text-xs font-extrabold ${getBadgeClass(
                    v.level
                  )} flex-shrink-0`}
                >
                  Tingkat {v.level}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">
                      {v.studentName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      • Laporan: {formatDateIndonesian(v.date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold flex items-start gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>
                      Pelanggaran: <span className="text-slate-700 font-normal">{v.violation}</span>
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 font-semibold flex items-start gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>
                      Sanksi: <span className="text-slate-700 font-normal italic">{v.sanction}</span>
                    </span>
                  </p>
                  {v.note && (
                    <p className="text-xs text-amber-900 font-semibold bg-amber-50 border border-amber-100 rounded-lg p-2 mt-1.5 leading-snug">
                      <span>
                        Catatan Asrama: <span className="text-slate-700 font-normal">{v.note}</span>
                      </span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Oleh: <span className="font-bold text-slate-600">{v.reporter}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-slate-100 md:border-none pt-3 md:pt-0 flex-wrap">
                <button
                  onClick={() => {
                    setSummonsSelectedViolation(v);
                    setSummonsSelectedStudentId(v.studentId);
                    setIsSummonsModalOpen(true);
                  }}
                  className="flex-1 md:flex-initial text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="Buat & Cetak Surat Panggilan Orang Tua / Wali (SP-1 / SP-2 / SP-3)"
                >
                  <MailWarning className="w-3.5 h-3.5 text-amber-600" /> Panggilan Ortu
                </button>
                <button
                  onClick={() => handlePrintNotice(v)}
                  className="flex-1 md:flex-initial text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="Generate & Cetak Surat Pemberitahuan Orang Tua (PDF Legal 1 Halaman)"
                >
                  <Printer className="w-3.5 h-3.5" /> Surat Ortu
                </button>
                <button
                  onClick={() => handlePrintStudentHistory(v.studentId, v.studentName)}
                  className="flex-1 md:flex-initial text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="Cetak Buku Historis Seluruh Pelanggaran Siswa Ini (PDF)"
                >
                  <FileText className="w-3.5 h-3.5" /> Riwayat
                </button>
                {v.photo ? (
                  v.photo.startsWith('http://') || v.photo.startsWith('https://') ? (
                    <button
                      onClick={() => setPreviewPhotoUrl(v.photo!)}
                      className="flex-1 md:flex-initial text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      title="Lihat tautan / link bukti pelanggaran"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> Link Bukti
                    </button>
                  ) : (
                    <button
                      onClick={() => setPreviewPhotoUrl(v.photo!)}
                      className="flex-1 md:flex-initial text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      title="Lihat foto bukti pelanggaran"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Foto Bukti
                    </button>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 italic py-2 px-2.5 border border-dashed border-slate-200 rounded-lg flex items-center gap-1">
                    <ImageOff className="w-3.5 h-3.5" /> Tanpa Bukti
                  </span>
                )}
                <button
                  onClick={() => handleOpenEditModal(v)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-2 rounded-lg transition active:scale-95"
                  title="Edit Laporan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(v.id, v.studentName)}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 p-2 rounded-lg transition active:scale-95"
                  title="Hapus Laporan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Photo / Link Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  {previewPhotoUrl.startsWith('http://') || previewPhotoUrl.startsWith('https://') ? (
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {previewPhotoUrl.startsWith('http://') || previewPhotoUrl.startsWith('https://')
                      ? 'Tautan Bukti Kejadian Digital'
                      : 'Bukti Foto Fisik Pelanggaran'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Sekolah Rakyat Palembang</p>
                </div>
              </div>
              <button
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                onClick={() => setPreviewPhotoUrl(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Display */}
            {previewPhotoUrl.startsWith('http://') || previewPhotoUrl.startsWith('https://') ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Globe className="w-4 h-4 text-blue-600" /> Tautan Berkas / Cloud Storage:
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-blue-700 break-all select-all">
                    {previewPhotoUrl}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={previewPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Tautan di Tab Baru
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewPhotoUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                        onShowToast('Tersalin', 'Tautan bukti berhasil disalin ke clipboard.', 'success');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Tersalin!' : 'Salin URL'}
                    </button>
                  </div>
                </div>

                {/* Optional embedded preview if it resolves to an image */}
                <div className="text-center">
                  <img
                    src={previewPhotoUrl}
                    alt="Preview Bukti"
                    className="max-h-64 mx-auto rounded-lg border border-slate-200 object-contain shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-900 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={previewPhotoUrl}
                    alt="Bukti Kejadian"
                    className="my-4 sm:my-8 w-auto mx-auto rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute(
                        'src',
                        'https://placehold.co/600x400/222/fff?text=Bukti+Foto+Asrama'
                      );
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Foto Bukti Fisik Asrama</span>
                  <a
                    href={previewPhotoUrl}
                    download="Bukti_Pelanggaran.jpg"
                    className="text-red-600 font-bold hover:underline"
                  >
                    Unduh Foto
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generator Surat Panggilan Orang Tua Modal */}
      <ParentSummonsModal
        isOpen={isSummonsModalOpen}
        onClose={() => {
          setIsSummonsModalOpen(false);
          setSummonsSelectedViolation(null);
        }}
        students={students}
        violations={violations}
        config={config}
        selectedViolation={summonsSelectedViolation}
        selectedStudentId={summonsSelectedStudentId}
        onShowToast={onShowToast}
      />
    </div>
  );
};
