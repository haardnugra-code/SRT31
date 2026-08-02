import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, MessageSquare, Compass } from 'lucide-react';
import { Student, Counseling, AppConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';

interface CounselingTabProps {
  students: Student[];
  counseling: Counseling[];
  config: AppConfig;
  onSaveCounseling: (counseling: Counseling, isEdit: boolean) => void;
  onDeleteCounseling: (id: string) => void;
  onUpdateStatus: (id: string, status: 'Open' | 'In Progress' | 'Resolved') => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCounselingId, setEditingCounselingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [counselor, setCounselor] = useState<string>('Ibu Rahmawati, S.Psi.');
  const [caseDescription, setCaseDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [followUp, setFollowUp] = useState<string>('');

  const handleOpenAddModal = () => {
    setEditingCounselingId(null);
    setStudentId(students[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setCounselor('Ibu Rahmawati, S.Psi.');
    setCaseDescription('');
    setNotes('');
    setFollowUp('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Counseling) => {
    setEditingCounselingId(c.id);
    setStudentId(c.studentId);
    setDate(c.date);
    setCounselor(c.counselor);
    setCaseDescription(c.caseDescription);
    setNotes(c.notes);
    setFollowUp(c.followUp);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Valid', 'Silakan pilih siswa terlebih dahulu.', 'warning');
      return;
    }

    if (editingCounselingId) {
      const existing = counseling.find((x) => x.id === editingCounselingId);
      const updatedCounseling: Counseling = {
        id: editingCounselingId,
        studentId,
        studentName: student.name,
        date,
        counselor,
        caseDescription,
        notes,
        followUp,
        status: existing?.status || 'Open'
      };
      onSaveCounseling(updatedCounseling, true);
      onShowToast('Berhasil', 'Data bimbingan berhasil diperbarui.', 'success');
    } else {
      const newCounseling: Counseling = {
        id: `c-${Date.now()}`,
        studentId,
        studentName: student.name,
        date,
        counselor,
        caseDescription,
        notes,
        followUp,
        status: 'Open'
      };
      onSaveCounseling(newCounseling, false);
      onShowToast('Berkas Tersimpan', 'Agenda bimbingan berhasil didaftarkan.', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus BK?',
      `Apakah Anda yakin ingin menghapus data konseling ${name}?`
    );
    if (confirmed) {
      onDeleteCounseling(id);
      onShowToast('Dihapus', 'Catatan BK telah dihapus.', 'success');
    }
  };

  const filteredCounseling = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return counseling.filter((c) => {
      const matchName = c.studentName.toLowerCase().includes(q) || c.caseDescription.toLowerCase().includes(q);
      const matchStatus = statusFilter === '' || c.status === statusFilter;
      return matchName && matchStatus;
    });
  }, [counseling, searchQuery, statusFilter]);

  const getStatusClass = (status: string) => {
    if (status === 'Resolved') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'In Progress') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Sistem Pendampingan & Konseling BK
          </h2>
          <p className="text-xs text-slate-500">
            Catatan penanganan siswa bermasalah dan pembinaan karakter ramah anak.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-amber-500 text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-amber-600 shadow transition active:scale-95 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Buat Agenda Konseling
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
            placeholder="Cari berdasarkan nama siswa atau topik bimbingan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Semua Status Kasus</option>
          <option value="Open">Belum Ditangani (Open)</option>
          <option value="In Progress">Sedang Konseling (In Progress)</option>
          <option value="Resolved">Selesai Dibina (Resolved)</option>
        </select>
      </div>

      {/* Counseling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCounseling.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada catatan konseling yang cocok dengan kriteria filter.
          </div>
        ) : (
          filteredCounseling.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap relative">
                  <div className="min-w-0 flex-1 pr-14">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">
                      {c.studentName}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Sesi: {formatDateIndonesian(c.date)} • Oleh: {c.counselor}
                    </p>
                  </div>
                  <div className="absolute right-0 top-0 flex gap-1">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.studentName)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-full mt-2">
                    <select
                      value={c.status}
                      onChange={(e) =>
                        onUpdateStatus(
                          c.id,
                          e.target.value as 'Open' | 'In Progress' | 'Resolved'
                        )
                      }
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border focus:outline-none cursor-pointer ${getStatusClass(
                        c.status
                      )}`}
                    >
                      <option value="Open">Open (Belum Selesai)</option>
                      <option value="In Progress">In Progress (Proses)</option>
                      <option value="Resolved">Resolved (Selesai)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-700">Masalah:</p>
                    <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                      {c.caseDescription}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mt-2">Catatan Sesi:</p>
                    <p className="mt-1">{c.notes}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mt-2">
                      Rencana Tindak Lanjut (RTL):
                    </p>
                    <p className="text-amber-700 font-bold bg-amber-50 px-2.5 py-2 rounded-lg border border-amber-100 mt-1 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 flex-shrink-0" />
                      <span>{c.followUp}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Counseling Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-amber-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">
                  {editingCounselingId ? 'Edit Catatan Konseling' : 'Agenda Konseling BK Baru'}
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
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Siswa Asrama
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                      Tanggal Sesi
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Konselor / Wali Kelas
                    </label>
                    <input
                      type="text"
                      required
                      value={counselor}
                      onChange={(e) => setCounselor(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      placeholder="e.g. Ibu Rahmawati, S.Psi."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Topik Masalah / Kasus
                  </label>
                  <input
                    type="text"
                    required
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="e.g. Sering terlambat bangun pagi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Hasil Pembinaan / Konseling
                  </label>
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Catat poin-poin penting..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Rencana Tindak Lanjut (RTL)
                  </label>
                  <input
                    type="text"
                    required
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="e.g. Dipantau oleh Wali Asuh"
                  />
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
                    className="bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95"
                  >
                    Simpan Berkas BK
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
