import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Image as ImageIcon, ImageOff, Printer, FileText } from 'lucide-react';
import { Student, Violation, AppConfig } from '../types';
import { VIOLATION_TEMPLATES, compressImageFile } from '../services/storage';
import { generateViolationNoticePDF } from '../services/pdfGenerator';

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

  // Modal State
  const [isModalOpenInternal, setIsModalOpenInternal] = useState(false);
  const isModalOpen = isModalOpenExternal || isModalOpenInternal;

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
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Evidence Photo Preview Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Template options for selected level
  const templates = VIOLATION_TEMPLATES[level] || [];

  const updateTypeDetails = (selectedType: string, currentLevel: number) => {
    const list = VIOLATION_TEMPLATES[currentLevel] || [];
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
    const newTemplates = VIOLATION_TEMPLATES[newLevel] || [];
    const firstType = newTemplates[0]?.text || '';
    setViolationType(firstType);
    updateTypeDetails(firstType, newLevel);
  };

  const handleOpenAddModal = () => {
    setEditingViolationId(null);
    setStudentId(students[0]?.id || '');
    setLevel(1);
    setDate(new Date().toISOString().split('T')[0]);
    const firstType = VIOLATION_TEMPLATES[1][0]?.text || '';
    setViolationType(firstType);
    updateTypeDetails(firstType, 1);
    setNote('');
    setReporter('Wali Asrama');
    setPhoto('');
    setIsModalOpenInternal(true);
  };

  const handleOpenEditModal = (v: Violation) => {
    setEditingViolationId(v.id);
    setStudentId(v.studentId);
    setLevel(v.level);
    setDate(v.date);
    setViolationType(v.violation);
    setSanction(v.sanction);
    const templatesList = VIOLATION_TEMPLATES[v.level] || [];
    const match = templatesList.find((t) => t.text === v.violation);
    setExplanation(match?.explanation || '');
    setNote(v.note || '');
    setReporter(v.reporter || 'Wali Asrama');
    setPhoto(v.photo || '');
    setIsModalOpenInternal(true);
  };

  const closeModal = () => {
    setIsModalOpenInternal(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Valid', 'Silakan pilih siswa terlebih dahulu.', 'warning');
      return;
    }

    if (editingViolationId) {
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
        photo
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
        photo
      };
      onSaveViolation(newViolation, false);
      onShowToast('Kasus Tersimpan', 'Pencatatan pelanggaran berhasil ditambahkan.', 'success');
    }

    closeModal();
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
    onShowToast('Mengekspor Surat', `Membuat Surat Pemberitahuan Orang Tua untuk ${v.studentName}...`, 'warning');
    await generateViolationNoticePDF(v, student, config);
    onShowToast('Surat Berhasil Dibuat', `Surat Pemberitahuan Pelanggaran untuk ${v.studentName} telah siap & diunduh.`, 'success');
  };

  const filteredViolations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return violations.filter((v) => {
      const matchName = v.studentName.toLowerCase().includes(q) || v.violation.toLowerCase().includes(q);
      const matchLevel = levelFilter === '' || String(v.level) === levelFilter;
      return matchName && matchLevel;
    });
  }, [violations, searchQuery, levelFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Pusat Laporan Pelanggaran
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan pelanggaran siswa sesuai Bab Tata Tertib Buku Pintar.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-red-600 text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-red-700 shadow transition active:scale-95 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Catat Pelanggaran Baru
        </button>
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
                      • Laporan: {v.date}
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
                  onClick={() => handlePrintNotice(v)}
                  className="flex-1 md:flex-initial text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="Generate & Cetak Surat Pemberitahuan Orang Tua"
                >
                  <Printer className="w-3.5 h-3.5" /> Surat Ortu
                </button>
                {v.photo ? (
                  <button
                    onClick={() => setPreviewPhotoUrl(v.photo!)}
                    className="flex-1 md:flex-initial text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Bukti
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 italic py-2 px-2.5 border border-dashed border-slate-200 rounded-lg flex items-center gap-1">
                    <ImageOff className="w-3.5 h-3.5" /> Tanpa Foto
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

      {/* Add / Edit Violation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-red-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm">
                  {editingViolationId ? 'Edit Laporan Pelanggaran' : 'Catat Pelanggaran Siswa'}
                </h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Siswa Melanggar
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.class} - {s.dorm})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Tingkat Pelanggaran
                    </label>
                    <select
                      value={level}
                      onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                      required
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value={1}>Tingkat 1 (Pelanggaran Ringan)</option>
                      <option value={2}>Tingkat 2 (Pelanggaran Sedang)</option>
                      <option value={3}>Tingkat 3 (Pelanggaran Berat)</option>
                      <option value={4}>Tingkat 4 (Pelanggaran Sangat Berat)</option>
                      <option value={5}>Tingkat 5 (Pelanggaran Luar Biasa)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Tanggal Kejadian
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Bentuk Pelanggaran (Pedoman Buku Saku)
                  </label>
                  <select
                    value={violationType}
                    onChange={(e) => {
                      setViolationType(e.target.value);
                      updateTypeDetails(e.target.value, level);
                    }}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {templates.map((t) => (
                      <option key={t.text} value={t.text}>
                        {t.text}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Kriteria / Penjelasan Tindakan
                  </label>
                  <textarea
                    value={explanation}
                    readOnly
                    rows={2}
                    className="w-full border border-slate-200 bg-slate-100 rounded-lg px-3.5 py-2 text-xs md:text-sm text-slate-600 font-medium resize-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Rekomendasi Sanksi Sesuai Buku Saku
                  </label>
                  <input
                    type="text"
                    value={sanction}
                    readOnly
                    className="w-full border border-slate-200 bg-slate-100 rounded-lg px-3.5 py-2 text-xs md:text-sm text-red-600 font-bold truncate focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Catatan Detail / Kronologi Tambahan
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="e.g. Kronologi singkat kejadian, saksi, atau komitmen langsung yang bersangkutan..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Pelapor Kasus
                    </label>
                    <input
                      type="text"
                      required
                      value={reporter}
                      onChange={(e) => setReporter(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="e.g. Wali Kelas / Wali Asrama"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Bukti Foto Pelanggaran
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isCompressing}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    />
                    {isCompressing && (
                      <p className="text-[10px] text-amber-600 mt-1 animate-pulse">
                        Mengompres gambar...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition active:scale-95"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={isCompressing}
                    className="bg-red-600 text-white hover:bg-red-700 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95 disabled:opacity-60"
                  >
                    Simpan Kasus
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="max-w-2xl w-full flex flex-col gap-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 text-white font-bold text-xs bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg backdrop-blur flex items-center gap-1"
              onClick={() => setPreviewPhotoUrl(null)}
            >
              <X className="w-4 h-4" /> Tutup
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Kejadian"
              className="max-h-[75vh] w-auto mx-auto rounded-lg shadow-2xl object-contain border border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', 'https://placehold.co/600x400/222/fff?text=Bukti+Foto+Asrama');
              }}
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              Bukti Fisik Kejadian Siswa - Sekolah Rakyat
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
