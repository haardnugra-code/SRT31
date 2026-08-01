import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, UserPlus } from 'lucide-react';
import { Student, ClassLevel, AppConfig } from '../types';

interface StudentsTabProps {
  students: Student[];
  config: AppConfig;
  onSaveStudent: (student: Student, isEdit: boolean) => void;
  onDeleteStudent: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  config,
  onSaveStudent,
  onDeleteStudent,
  onShowToast,
  onAskConfirm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dormFilter, setDormFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState<ClassLevel>('SD');
  const [formDorm, setFormDorm] = useState(config.dormList[0] || 'Asrama Terpadu');
  const [formCaretaker, setFormCaretaker] = useState(
    config.waliAsuhList[0]?.split('|')[0] || 'M. ARDIAN NUGRAHA, S.H'
  );

  const cleanWaliAsuh = config.waliAsuhList.map((item) => item.split('|')[0].trim());

  // Filtered Students using useMemo for zero input lag
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      const matchClass = classFilter === '' || s.class === classFilter;
      const matchDorm = dormFilter === '' || s.dorm === dormFilter;
      return matchName && matchClass && matchDorm;
    });
  }, [students, searchQuery, classFilter, dormFilter]);

  const handleOpenAddModal = () => {
    setEditingStudentId(null);
    setFormName('');
    setFormNisn('');
    setFormClass('SD');
    setFormDorm(config.dormList[0] || 'Asrama Terpadu');
    setFormCaretaker(cleanWaliAsuh[0] || 'M. ARDIAN NUGRAHA, S.H');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudentId(student.id);
    setFormName(student.name);
    setFormNisn(student.id);
    setFormClass(student.class);
    setFormDorm(student.dorm);
    setFormCaretaker(student.caretaker);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const nisn = formNisn.trim();

    if (!name || !nisn) {
      onShowToast('Data Tidak Lengkap', 'Nama dan NISN/ID wajib diisi.', 'warning');
      return;
    }

    if (editingStudentId) {
      // Editing
      const updatedStudent: Student = {
        id: editingStudentId,
        name,
        class: formClass,
        dorm: formDorm,
        caretaker: formCaretaker
      };
      onSaveStudent(updatedStudent, true);
      onShowToast('Berhasil', `Data ${name} berhasil diperbarui.`, 'success');
    } else {
      // New Student
      if (students.some((s) => String(s.id) === String(nisn))) {
        onShowToast('Siswa Gagal Terdaftar', 'NISN / ID Registrasi sudah digunakan.', 'error');
        return;
      }
      const newStudent: Student = {
        id: nisn,
        name,
        class: formClass,
        dorm: formDorm,
        caretaker: formCaretaker,
        violationCount: 0
      };
      onSaveStudent(newStudent, false);
      onShowToast('Registrasi Berhasil', `${name} berhasil terdaftar.`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Murid?',
      `Apakah Anda yakin ingin menghapus data murid ${name} beserta seluruh riwayatnya?`
    );
    if (confirmed) {
      onDeleteStudent(id);
      onShowToast('Dihapus', `Data murid ${name} telah dihapus.`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Daftar Induk Murid Asrama
          </h2>
          <p className="text-xs text-slate-500">
            Total {students.length} siswa terdaftar yang sedang menempuh masa pembinaan.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-slate-800 shadow transition active:scale-95 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Registrasi Siswa Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa berdasarkan nama atau NISN..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Semua Jenjang</option>
            <option value="SD">SD (Sekolah Dasar)</option>
            <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
            <option value="SMA">SMA (Sekolah Menengah Atas)</option>
          </select>
          <select
            value={dormFilter}
            onChange={(e) => setDormFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Semua Gedung Asrama</option>
            {config.dormList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            Tidak ada data siswa yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filteredStudents.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="absolute right-2 top-2 flex gap-1 z-20">
                <button
                  onClick={() => handleOpenEditModal(s)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                  title="Edit Data"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                  title="Hapus Data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent -z-0 rounded-bl-full pointer-events-none" />

              <div className="flex items-start gap-3.5 relative z-10 min-w-0 pt-2">
                <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-base border border-red-100 flex-shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 space-y-0.5 pr-10">
                  <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">NISN: {s.id}</p>
                  <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full mt-1.5">
                    {s.class} • {s.dorm}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 text-center border-t border-b border-slate-100 py-3 gap-2">
                <div className="min-w-0">
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Total Kasus
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-extrabold mt-0.5 block truncate ${
                      (s.violationCount || 0) > 3
                        ? 'text-red-600'
                        : (s.violationCount || 0) > 0
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {s.violationCount || 0} Kasus
                  </span>
                </div>
                <div className="min-w-0 border-l border-slate-100">
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Wali Asuh
                  </span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5 block truncate" title={s.caretaker}>
                    {s.caretaker}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Student Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm">
                  {editingStudentId ? 'Edit Data Siswa' : 'Registrasi Siswa Baru'}
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
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="e.g. Ahmad Fauzi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      NISN / ID Registrasi
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingStudentId}
                      value={formNisn}
                      onChange={(e) => setFormNisn(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-200 disabled:cursor-not-allowed"
                      placeholder="e.g. SR0088"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Jenjang Pendidikan
                    </label>
                    <select
                      value={formClass}
                      onChange={(e) => setFormClass(e.target.value as ClassLevel)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Lokasi Gedung Asrama
                    </label>
                    <select
                      value={formDorm}
                      onChange={(e) => setFormDorm(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Wali Asuh Penanggung Jawab
                  </label>
                  <select
                    value={formCaretaker}
                    onChange={(e) => setFormCaretaker(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition active:scale-95"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95"
                  >
                    Simpan Data
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
