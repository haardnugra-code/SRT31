import React, { useState, useMemo } from 'react';
import { formatDateIndonesian } from '../utils/dateFormatter';
import {
  HeartPulse,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Trash2,
  Edit2,
  X,
  Stethoscope,
  Activity,
  Calendar,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Clock,
  Pill,
  Hospital,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { Student, MedicalRecord, AppConfig } from '../types';

interface MedicalTabProps {
  students: Student[];
  records: MedicalRecord[];
  onSaveRecord: (record: MedicalRecord) => void;
  onDeleteRecord: (id: string) => void;
  config: AppConfig;
}

const COMMON_SYMPTOMS = [
  'Demam / Panas',
  'Flu & Batuk',
  'Pusing / Sakit Kepala',
  'Sakit Perut / Maag',
  'Diare / Mual',
  'Luka / Cedera Fisik',
  'Radang Tenggorokan',
  'Sakit Gigi',
  'Sesak / Asma',
  'Alergi / Gatal'
];

export const MedicalTab: React.FC<MedicalTabProps> = ({
  students,
  records,
  onSaveRecord,
  onDeleteRecord,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'student-history'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<MedicalRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    studentId: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: 'UKS Asrama',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    restDays: 1,
    isSickLeave: true,
    status: 'Dalam Perawatan',
    officer: 'Tim Medis UKS',
    temperature: '37.0°C',
    vitalSigns: '120/80 mmHg',
    notes: ''
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const total = records.length;
    const activeSick = records.filter(
      (r) => r.status === 'Dalam Perawatan' || r.status === 'Istirahat di Kamar'
    ).length;
    const referred = records.filter((r) => r.status === 'Dirujuk ke RS/Klinik').length;
    const cured = records.filter((r) => r.status === 'Sembuh / Kembali Sekolah').length;
    return { total, activeSick, referred, cured };
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.officer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesLocation = locationFilter === 'All' || r.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [records, searchTerm, statusFilter, locationFilter]);

  // Student Health History View
  const historyForSelectedStudent = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    return records.filter(
      (r) =>
        r.studentId === selectedStudentForHistory ||
        r.studentName.toLowerCase() === selectedStudentForHistory.toLowerCase()
    );
  }, [records, selectedStudentForHistory]);

  const selectedStudentObj = useMemo(() => {
    return students.find((s) => s.id === selectedStudentForHistory);
  }, [students, selectedStudentForHistory]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      studentId: students.length > 0 ? students[0].id : '',
      studentName: students.length > 0 ? students[0].name : '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      location: 'UKS Asrama',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      restDays: 1,
      isSickLeave: true,
      status: 'Dalam Perawatan',
      officer: 'Tim Medis UKS / Petugas Kesehatan',
      temperature: '37.0°C',
      vitalSigns: '120/80 mmHg',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: MedicalRecord) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleStudentSelectInForm = (studentId: string) => {
    const found = students.find((s) => s.id === studentId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        studentId: found.id,
        studentName: found.name
      }));
    }
  };

  const handleAddSymptomChip = (symptom: string) => {
    setFormData((prev) => {
      const current = prev.symptoms || '';
      if (current.includes(symptom)) return prev;
      const updated = current ? `${current}, ${symptom}` : symptom;
      return { ...prev, symptoms: updated };
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.symptoms || !formData.diagnosis) {
      alert('Mohon lengkapi Nama Siswa, Gejala Utama, dan Diagnosa!');
      return;
    }

    const newRecord: MedicalRecord = {
      id: editingRecord ? editingRecord.id : `MED-${Date.now().toString().slice(-6)}`,
      studentId: formData.studentId || '',
      studentName: formData.studentName || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '08:00',
      location: formData.location || 'UKS Asrama',
      symptoms: formData.symptoms || '',
      diagnosis: formData.diagnosis || '',
      treatment: formData.treatment || '',
      restDays: Number(formData.restDays) || 0,
      isSickLeave: Boolean(formData.isSickLeave),
      status: formData.status || 'Dalam Perawatan',
      officer: formData.officer || 'Petugas UKS',
      temperature: formData.temperature || '',
      vitalSigns: formData.vitalSigns || '',
      notes: formData.notes || ''
    };

    onSaveRecord(newRecord);
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 opacity-10 pointer-events-none">
          <HeartPulse className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-500/30 text-rose-200 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Stethoscope className="w-3.5 h-3.5" /> Pelayanan Kesehatan Asrama
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Klinik UKS & Rekam Medis Siswa
            </h2>
            <p className="text-rose-100/80 text-sm mt-1 max-w-2xl">
              Pencatatan pemeriksaan kesehatan, riwayat medis, izin sakit UKS, dan penanganan rujukan klinik/rumah sakit Sekolah Rakyat.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-rose-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            <span>Catat Rekam Medis / Izin UKS</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Rekam Medis</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh kunjungan & izin sakit</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Sedang Sakit / Rawat</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{stats.activeSick}</h3>
            <p className="text-[11px] text-rose-500 mt-0.5">UKS Asrama & Istirahat Kamar</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Rujukan RS / Klinik</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.referred}</h3>
            <p className="text-[11px] text-amber-500 mt-0.5">Penanganan medis lanjutan</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Hospital className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sembuh / Kembali</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.cured}</h3>
            <p className="text-[11px] text-emerald-500 mt-0.5">Kembali mengikuti KBM/Asrama</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Module Sub Tab Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 flex gap-2">
        <button
          onClick={() => setActiveSubTab('records')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
            activeSubTab === 'records'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Daftar Rekam Medis & Izin Sakit</span>
        </button>

        <button
          onClick={() => setActiveSubTab('student-history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
            activeSubTab === 'student-history'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Riwayat Kesehatan Per Siswa</span>
        </button>
      </div>

      {/* TAB 1: LIST REKAM MEDIS */}
      {activeSubTab === 'records' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa, gejala, atau diagnosa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="All">Semua Status</option>
                  <option value="Dalam Perawatan">Dalam Perawatan</option>
                  <option value="Istirahat di Kamar">Istirahat di Kamar</option>
                  <option value="Dirujuk ke RS/Klinik">Dirujuk ke RS/Klinik</option>
                  <option value="Sembuh / Kembali Sekolah">Sembuh / Kembali</option>
                </select>
              </div>

              {/* Location Filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="All">Semua Lokasi</option>
                <option value="UKS Asrama">UKS Asrama</option>
                <option value="Istirahat di Kamar">Istirahat di Kamar</option>
                <option value="Klinik / RS Rujukan">Klinik / RS Rujukan</option>
                <option value="Klinik Sekolah">Klinik Sekolah</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4">Tgl & Jam</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Lokasi & Vitals</th>
                    <th className="py-3.5 px-4">Gejala Utama</th>
                    <th className="py-3.5 px-4">Diagnosa & Tindakan</th>
                    <th className="py-3.5 px-4">Izin UKS</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <HeartPulse className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-sm">Belum ada rekam medis ditemukan</p>
                        <p className="text-xs mt-1">
                          Klik tombol "Catat Rekam Medis / Izin UKS" di atas untuk menambahkan data baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const studentObj = students.find(
                        (s) =>
                          s.id === rec.studentId ||
                          s.name.toLowerCase() === rec.studentName.toLowerCase()
                      );

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-rose-500" />
                              {formatDateIndonesian(rec.date)}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {rec.time || '08:00'} WIB
                            </div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{rec.studentName}</div>
                            {studentObj && (
                              <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                Kelas {studentObj.class} • {studentObj.dorm}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {rec.location}
                            </span>
                            {(rec.temperature || rec.vitalSigns) && (
                              <div className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                                <Thermometer className="w-3 h-3" />
                                {rec.temperature && <span>{rec.temperature}</span>}
                                {rec.vitalSigns && (
                                  <span className="text-slate-500 font-normal">({rec.vitalSigns})</span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="line-clamp-2 text-slate-800 font-medium">{rec.symptoms}</p>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="font-bold text-slate-900 line-clamp-1">{rec.diagnosis}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {rec.treatment}
                            </p>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {rec.isSickLeave ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                <FileText className="w-3 h-3 text-amber-600" />
                                {rec.restDays} Hari Izin
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Tidak Ada</span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                rec.status === 'Dalam Perawatan'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : rec.status === 'Istirahat di Kamar'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : rec.status === 'Dirujuk ke RS/Klinik'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {rec.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPrintRecord(rec)}
                                title="Cetak Surat Izin / Rekam Medis"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(rec)}
                                title="Edit Record"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus rekam medis untuk ${rec.studentName}?`)) {
                                    onDeleteRecord(rec.id);
                                  }
                                }}
                                title="Hapus Record"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT KESEHATAN PER SISWA */}
      {activeSubTab === 'student-history' && (
        <div className="space-y-6">
          {/* Select Student Selector Header */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-600" /> Pilih Siswa Untuk Melihat Riwayat Kesehatan
            </h3>
            <div className="max-w-md">
              <select
                value={selectedStudentForHistory}
                onChange={(e) => setSelectedStudentForHistory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) - Kelas {s.class} [{s.dorm}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedStudentForHistory ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Stethoscope className="w-16 h-16 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-bold text-slate-700">Silakan pilih siswa pada menu di atas</p>
              <p className="text-xs text-slate-400 mt-1">
                Sistem akan menampilkan rekam jejak kesehatan, riwayat alergi/penyakit, dan total izin sakit siswa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Profile Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-black text-xl border border-rose-200">
                    {selectedStudentObj?.name.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {selectedStudentObj?.name}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      NISN/ID: {selectedStudentObj?.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Tingkat / Kelas:</span>
                    <span className="font-bold text-slate-800">{selectedStudentObj?.class}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Lokasi Asrama:</span>
                    <span className="font-bold text-slate-800">{selectedStudentObj?.dorm}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Wali Asuh:</span>
                    <span className="font-bold text-slate-800">{selectedStudentObj?.caretaker || '-'}</span>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Ringkasan Kesehatan
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-rose-900">
                    <div className="flex justify-between">
                      <span>Total Kunjungan UKS:</span>
                      <span className="font-bold">{historyForSelectedStudent.length} Kali</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Hari Izin Sakit:</span>
                      <span className="font-bold">
                        {historyForSelectedStudent.reduce((acc, r) => acc + (r.restDays || 0), 0)} Hari
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Timeline */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-600" /> Timeline Riwayat Pemeriksaan Medis
                </h4>

                {historyForSelectedStudent.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-8 text-center">
                    Belum ada riwayat rekam medis tercatat untuk siswa ini.
                  </p>
                ) : (
                  <div className="relative border-l-2 border-rose-200 ml-4 space-y-6">
                    {historyForSelectedStudent.map((rec) => (
                      <div key={rec.id} className="relative pl-6 group">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow"></div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-rose-600" /> {rec.date} ({rec.time || '08:00'})
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              {rec.location}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="text-slate-800">
                              <span className="font-bold text-slate-600">Gejala:</span> {rec.symptoms}
                            </p>
                            <p className="text-slate-900 font-bold">
                              <span className="font-semibold text-slate-600">Diagnosa:</span> {rec.diagnosis}
                            </p>
                            <p className="text-slate-700">
                              <span className="font-semibold text-slate-600">Tindakan & Obat:</span> {rec.treatment}
                            </p>
                            {rec.officer && (
                              <p className="text-slate-500 text-[11px] pt-1 italic">
                                Pemeriksa: {rec.officer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL FORM: ADD / EDIT REKAM MEDIS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {editingRecord ? 'Edit Rekam Medis UKS' : 'Form Rekam Medis & Izin Sakit UKS'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem Pelayanan Kesehatan & Klinik Sekolah Rakyat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.studentId || ''}
                  onChange={(e) => handleStudentSelectInForm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) - Kelas {s.class} [{s.dorm}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Jam & Lokasi Penanganan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Kunjungan</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penanganan</label>
                  <select
                    value={formData.location || 'UKS Asrama'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value as MedicalRecord['location']
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="UKS Asrama">UKS Asrama</option>
                    <option value="Istirahat di Kamar">Istirahat di Kamar</option>
                    <option value="Klinik / RS Rujukan">Klinik / RS Rujukan</option>
                    <option value="Klinik Sekolah">Klinik Sekolah</option>
                  </select>
                </div>
              </div>

              {/* Vitals (Suhu & Tensi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Suhu Tubuh (°C)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 38.2°C"
                    value={formData.temperature || ''}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tensi / Nadi (Vital Signs)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 110/70 mmHg, Nadi 84x/m"
                    value={formData.vitalSigns || ''}
                    onChange={(e) => setFormData({ ...formData, vitalSigns: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Gejala Utama & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gejala / Keluhan Utama <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_SYMPTOMS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAddSymptomChip(chip)}
                      className="text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Tuliskan keluhan yang dirasakan siswa..."
                  value={formData.symptoms || ''}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Diagnosa & Tindakan Obat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diagnosa / Hasil Pemeriksaan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Febris / Demam, Gastritis, Flu"
                    value={formData.diagnosis || ''}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tindakan & Resep Obat
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol 3x1, Istirahat total"
                    value={formData.treatment || ''}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Status & Izin Sakit Toggle */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isSickLeave)}
                      onChange={(e) =>
                        setFormData({ ...formData, isSickLeave: e.target.checked })
                      }
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Terbitkan Surat Keterangan Izin Sakit UKS
                    </span>
                  </label>

                  {formData.isSickLeave && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-semibold">Durasi Izin:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.restDays || 1}
                        onChange={(e) =>
                          setFormData({ ...formData, restDays: parseInt(e.target.value) || 1 })
                        }
                        className="w-16 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-800"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Hari</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Kesehatan
                    </label>
                    <select
                      value={formData.status || 'Dalam Perawatan'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as MedicalRecord['status']
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Dalam Perawatan">Dalam Perawatan UKS</option>
                      <option value="Istirahat di Kamar">Istirahat di Kamar</option>
                      <option value="Dirujuk ke RS/Klinik">Dirujuk ke RS/Klinik</option>
                      <option value="Sembuh / Kembali Sekolah">Sembuh / Kembali Sekolah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Petugas Medis / Pemeriksa
                    </label>
                    <input
                      type="text"
                      value={formData.officer || ''}
                      onChange={(e) => setFormData({ ...formData, officer: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan / Instruksi Khusus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alergi obat paracetamol, tidak boleh makan pedas..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/20 transition-all"
                >
                  {editingRecord ? 'Simpan Perubahan' : 'Simpan Rekam Medis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT SURAT IZIN SAKIT UKS & REKAM MEDIS */}
      {printRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 relative">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Pratinjau Surat Izin Sakit & Rekam Medis
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak / PDF
                </button>
                <button
                  onClick={() => setPrintRecord(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINT CONTENT AREA */}
            <div className="print-area font-serif text-slate-900 space-y-4 leading-relaxed p-2">
              {/* KOP SURAT */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between text-center mb-4">
                {config.logoKiriUrl && (
                  <img
                    src={config.logoKiriUrl}
                    alt="Logo Kiri"
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div className="flex-1 px-4">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-700 whitespace-pre-line">
                    {config.kopKiri}
                  </p>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 mt-1 whitespace-pre-line">
                    {config.kopKanan}
                  </h3>
                  <p className="text-[9px] italic text-slate-600 mt-0.5">
                    Unit Kesehatan Sekolah (UKS) & Layanan Klinik Keasramaan
                  </p>
                </div>
                {config.logoKananUrl && (
                  <img
                    src={config.logoKananUrl}
                    alt="Logo Kanan"
                    className="w-16 h-16 object-contain"
                  />
                )}
              </div>

              {/* TITLE */}
              <div className="text-center my-4">
                <h2 className="text-base font-bold uppercase underline tracking-wider">
                  SURAT KETERANGAN IZIN SAKIT & REKAM MEDIS UKS
                </h2>
                <p className="text-xs font-sans font-semibold text-slate-600 mt-0.5">
                  Nomor: {printRecord.id}/UKS-SR31/{new Date().getFullYear()}
                </p>
              </div>

              {/* CONTENT BODY */}
              <p className="text-xs font-sans leading-relaxed">
                Yang bertanda tangan di bawah ini, Tim Kesehatan UKS Sekolah Rakyat Terpadu
                menerangkan bahwa siswa berikut:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-sans space-y-1 my-3">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Nama Siswa:</span>
                  <span className="col-span-2 font-bold text-slate-900">{printRecord.studentName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">NISN / ID:</span>
                  <span className="col-span-2 text-slate-800">{printRecord.studentId || '-'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Tanggal Periksa:</span>
                  <span className="col-span-2 text-slate-800">
                    {formatDateIndonesian(printRecord.date, true)} ({printRecord.time || '08:00'} WIB)
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Lokasi Penanganan:</span>
                  <span className="col-span-2 font-bold text-rose-700">{printRecord.location}</span>
                </div>
              </div>

              {/* MEDICAL DETAILS */}
              <div className="border border-slate-300 rounded-lg p-3 text-xs font-sans space-y-2">
                <div>
                  <span className="font-bold text-slate-700 block">Gejala / Keluhan Utama:</span>
                  <p className="text-slate-800 italic mt-0.5">{printRecord.symptoms}</p>
                </div>
                {printRecord.temperature && (
                  <div>
                    <span className="font-bold text-slate-700">Hasil Pemeriksaan Fisik:</span>{' '}
                    <span className="text-slate-900 font-semibold">
                      Suhu {printRecord.temperature} {printRecord.vitalSigns && `| Tensi: ${printRecord.vitalSigns}`}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-700 block">Diagnosa Medis:</span>
                  <p className="text-slate-900 font-bold">{printRecord.diagnosis}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Tindakan & Terapi Obat:</span>
                  <p className="text-slate-800">{printRecord.treatment}</p>
                </div>
              </div>

              {/* RECOMENDATION / SICK LEAVE */}
              {printRecord.isSickLeave && (
                <p className="text-xs font-sans leading-relaxed pt-2">
                  Berdasarkan hasil pemeriksaan kesehatan di atas, siswa dinyatakan perlu mendapatkan{' '}
                  <span className="font-bold underline">
                    Izin Istirahat / Berobat selama {printRecord.restDays} ({printRecord.restDays === 1 ? 'satu' : printRecord.restDays === 2 ? 'dua' : printRecord.restDays === 3 ? 'tiga' : printRecord.restDays}) hari
                  </span>{' '}
                  terhitung sejak tanggal {printRecord.date}.
                </p>
              )}

              {printRecord.notes && (
                <p className="text-xs font-sans italic text-slate-600">
                  Catatan Tambahan: {printRecord.notes}
                </p>
              )}

              {/* SIGNATURES */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-800">Wali Asrama / Wali Asuh</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{config.waliAsrama}</p>
                  <p className="text-[10px] text-slate-500">{config.waliAsramaNip}</p>
                </div>

                <div>
                  <p className="text-slate-600">Palembang, {printRecord.date}</p>
                  <p className="font-bold text-slate-800">Petugas Medis / Pembina UKS</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{printRecord.officer}</p>
                  <p className="text-[10px] text-slate-500">NIP / Penanggung Jawab UKS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
