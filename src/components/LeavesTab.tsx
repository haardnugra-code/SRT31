import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, DoorOpen, Printer } from 'lucide-react';
import { Student, Leave, AppConfig } from '../types';
import { printLeavePassPDF } from '../services/pdfGenerator';

interface LeavesTabProps {
  students: Student[];
  leaves: Leave[];
  config: AppConfig;
  onSaveLeave: (leave: Leave, isEdit: boolean) => void;
  onDeleteLeave: (id: string) => void;
  onUpdateStatus: (id: string, status: 'Active' | 'Returned') => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  isModalOpenExternal?: boolean;
  onCloseExternalModal?: () => void;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({
  students,
  leaves,
  config,
  onSaveLeave,
  onDeleteLeave,
  onUpdateStatus,
  onShowToast,
  onAskConfirm,
  isModalOpenExternal = false,
  onCloseExternalModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpenInternal, setIsModalOpenInternal] = useState(false);
  const isModalOpen = isModalOpenExternal || isModalOpenInternal;

  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [type, setType] = useState<'Reguler' | 'Khusus' | 'Darurat'>('Reguler');
  const [reason, setReason] = useState<string>('');
  const [leaveDate, setLeaveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState<string>('');
  const [caretaker, setCaretaker] = useState<string>(
    config.waliAsuhList[0]?.split('|')[0] || 'M. ARDIAN NUGRAHA, S.H'
  );

  const cleanWaliAsuh = config.waliAsuhList.map((item) => item.split('|')[0].trim());

  const autoFillLeavePeriod = (leaveType: string, startDateVal: string) => {
    if (!startDateVal) return;
    const startDate = new Date(startDateVal);
    let returnDays = 3;
    if (leaveType === 'Reguler') returnDays = 14;
    else if (leaveType === 'Khusus') returnDays = 5;
    else if (leaveType === 'Darurat') returnDays = 10;

    startDate.setDate(startDate.getDate() + returnDays);
    const yyyy = startDate.getFullYear();
    const mm = String(startDate.getMonth() + 1).padStart(2, '0');
    const dd = String(startDate.getDate()).padStart(2, '0');
    setReturnDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleOpenAddModal = () => {
    setEditingLeaveId(null);
    setStudentId(students[0]?.id || '');
    setType('Reguler');
    setReason('');
    const today = new Date().toISOString().split('T')[0];
    setLeaveDate(today);
    autoFillLeavePeriod('Reguler', today);
    setCaretaker(cleanWaliAsuh[0] || 'M. ARDIAN NUGRAHA, S.H');
    setIsModalOpenInternal(true);
  };

  const handleOpenEditModal = (l: Leave) => {
    setEditingLeaveId(l.id);
    setStudentId(l.studentId);
    setType(l.type);
    setReason(l.reason);
    setLeaveDate(l.leaveDate);
    setReturnDate(l.returnDate);
    setCaretaker(l.caretaker);
    setIsModalOpenInternal(true);
  };

  const closeModal = () => {
    setIsModalOpenInternal(false);
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Valid', 'Silakan pilih siswa terlebih dahulu.', 'warning');
      return;
    }

    if (editingLeaveId) {
      const existing = leaves.find((x) => x.id === editingLeaveId);
      const updatedLeave: Leave = {
        id: editingLeaveId,
        studentId,
        studentName: student.name,
        type,
        reason,
        leaveDate,
        returnDate,
        caretaker,
        status: existing?.status || 'Active'
      };
      onSaveLeave(updatedLeave, true);
      onShowToast('Diperbarui', 'Data izin kepulangan berhasil diperbarui.', 'success');
    } else {
      const newLeave: Leave = {
        id: `l-${Date.now()}`,
        studentId,
        studentName: student.name,
        type,
        reason,
        leaveDate,
        returnDate,
        caretaker,
        status: 'Active'
      };
      onSaveLeave(newLeave, false);
      onShowToast('Izin Diberikan', `Surat jalan izin pulang diterbitkan.`, 'success');
    }

    closeModal();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Perizinan?',
      `Yakin hapus data perizinan ${name} dari dalam sistem?`
    );
    if (confirmed) {
      onDeleteLeave(id);
      onShowToast('Dihapus', 'Data perizinan berhasil dihapus.', 'success');
    }
  };

  const filteredLeaves = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return leaves.filter((l) => {
      const matchName = l.studentName.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q);
      const matchType = typeFilter === '' || l.type === typeFilter;
      return matchName && matchType;
    });
  }, [leaves, searchQuery, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Manajemen Izin Pulang & Liburan Asrama
          </h2>
          <p className="text-xs text-slate-500">
            Mengatur jadwal kepulangan reguler, izin khusus, dan kondisi darurat asrama.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-green-600 text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-green-700 shadow transition active:scale-95 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Ajukan Izin Pulang Siswa
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
            placeholder="Cari nama siswa atau alasan izin..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          <option value="">Semua Jenis Kepulangan</option>
          <option value="Reguler">Reguler (Libur Semester/Hari Raya)</option>
          <option value="Khusus">Khusus (Acara Penting Keluarga/Sakit)</option>
          <option value="Darurat">Kondisi Darurat (Sakit Keras/Duka Cita)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Identitas Siswa</th>
                <th className="p-4">Jenis & Alasan</th>
                <th className="p-4">Waktu Kepergian</th>
                <th className="p-4">Waktu Kepulangan</th>
                <th className="p-4">Penanggung Jawab</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Belum ada data perizinan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{l.studentName}</td>
                    <td className="p-4">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 mr-2 bg-slate-50">
                        {l.type}
                      </span>
                      <span className="text-xs text-slate-600">{l.reason}</span>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-500">{l.leaveDate}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700">{l.returnDate}</td>
                    <td className="p-4 text-xs text-slate-500">{l.caretaker}</td>
                    <td className="p-4">
                      <select
                        value={l.status}
                        onChange={(e) =>
                          onUpdateStatus(l.id, e.target.value as 'Active' | 'Returned')
                        }
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded border focus:outline-none cursor-pointer ${
                          l.status === 'Returned'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-green-50 text-green-800 border-green-200'
                        }`}
                      >
                        <option value="Active">Active (Pergi)</option>
                        <option value="Returned">Returned (Kembali)</option>
                      </select>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          const s = students.find((st) => String(st.id) === String(l.studentId));
                          printLeavePassPDF(l, s);
                        }}
                        className="text-[11px] font-bold text-white hover:bg-slate-800 bg-slate-900 px-3 py-2 rounded-lg transition-all inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Tiket
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(l)}
                        className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-all hover:bg-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id, l.studentName)}
                        className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-all hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-green-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-sm">
                  {editingLeaveId ? 'Edit Surat Jalan / Izin' : 'Catat Izin Pulang'}
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
                    Siswa Asrama
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
                      Jenis Kepulangan
                    </label>
                    <select
                      value={type}
                      onChange={(e) => {
                        const newType = e.target.value as 'Reguler' | 'Khusus' | 'Darurat';
                        setType(newType);
                        autoFillLeavePeriod(newType, leaveDate);
                      }}
                      required
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="Reguler">Reguler (Libur Semester/Hari Raya)</option>
                      <option value="Khusus">Khusus (Acara Penting Keluarga/Sakit)</option>
                      <option value="Darurat">Kondisi Darurat (Sakit Keras/Duka Cita)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Alasan Detail Kepergian
                    </label>
                    <input
                      type="text"
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      placeholder="e.g. Libur Lebaran Idul Fitri"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Tanggal Berangkat
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveDate}
                      onChange={(e) => {
                        setLeaveDate(e.target.value);
                        autoFillLeavePeriod(type, e.target.value);
                      }}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Tanggal Kembali Asrama
                    </label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Wali Asuh Pendamping
                  </label>
                  <select
                    value={caretaker}
                    onChange={(e) => setCaretaker(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {cleanWaliAsuh.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
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
                    className="bg-green-600 text-white hover:bg-green-700 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95"
                  >
                    Simpan Surat Jalan
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
