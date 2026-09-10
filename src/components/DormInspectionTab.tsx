import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  BedDouble,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Search,
  Filter,
  CheckCheck,
  Building2,
  Calendar,
  Clock,
  User,
  Award,
  Layers,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  AppConfig,
  Student,
  DormInspection,
  DormInspectionItemScore,
  DormInspectionCategoryKey,
  DormGrade,
  DormActionRequired
} from '../types';
import {
  DEFAULT_SOP_CRITERIA,
  calculateDormScore,
  getDefaultDormInspectionItems
} from '../services/storage';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { printDormInspectionPDF, printBlankDormInspectionFormPDF } from '../services/pdfGenerator';

interface DormInspectionTabProps {
  config: AppConfig;
  students: Student[];
  inspections: DormInspection[];
  onSaveInspection: (inspection: DormInspection) => void;
  onDeleteInspection: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  userRole?: 'admin' | 'guru';
}

export const DormInspectionTab: React.FC<DormInspectionTabProps> = ({
  config,
  students,
  inspections,
  onSaveInspection,
  onDeleteInspection,
  onShowToast,
  onAskConfirm,
  userRole = 'admin'
}) => {
  // Navigation inside tab: 'form' | 'history'
  const [activeView, setActiveView] = useState<'form' | 'history'>('form');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDorm, setSelectedDorm] = useState<string>(config.dormList[0] || 'Asrama Dewantara');
  const [roomNumber, setRoomNumber] = useState<string>('Kamar 01');
  const [inspectionDate, setInspectionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [inspectionTime, setInspectionTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [inspectionType, setInspectionType] = useState<
    'Inspeksi Rutin Pagi' | 'Sidak Kerapian & Kebersihan' | 'Inspeksi Mingguan (Ro\'an Asrama)' | 'Evaluasi Bulanan Kamar'
  >('Inspeksi Rutin Pagi');

  // Inspector
  const [inspectorName, setInspectorName] = useState<string>(() => {
    if (config.waliAsuhList && config.waliAsuhList.length > 0) {
      return config.waliAsuhList[0].split('|')[0].trim();
    }
    return 'Wali Asuh Pendamping';
  });
  const [inspectorNip, setInspectorNip] = useState<string>(() => {
    if (config.waliAsuhList && config.waliAsuhList.length > 0) {
      const parts = config.waliAsuhList[0].split('|');
      return parts.length > 1 ? parts[1].trim() : '';
    }
    return '';
  });

  // Room Leader / Inmates
  const [roomLeaderName, setRoomLeaderName] = useState<string>('');
  const [studentNamesInRoom, setStudentNamesInRoom] = useState<string>('');

  // Items score state
  const [items, setItems] = useState<DormInspectionItemScore[]>(() => getDefaultDormInspectionItems());

  // Category filter in form to focus
  const [activeFormCategory, setActiveFormCategory] = useState<DormInspectionCategoryKey | 'all'>('all');

  // Findings & Action
  const [findings, setFindings] = useState<string>('');
  const [actionRequired, setActionRequired] = useState<DormActionRequired>('Lulus Standar SOP');
  const [actionDeadline, setActionDeadline] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');

  // Search & Filter in History
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDorm, setFilterDorm] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  // Calculate live score
  const { totalScore, grade, gradeLabel } = useMemo(() => {
    return calculateDormScore(items);
  }, [items]);

  // Handle auto-fill inspector NIP when inspector name changes from preset list
  const handleInspectorChange = (name: string) => {
    setInspectorName(name);
    const matched = config.waliAsuhList?.find((w) => w.startsWith(name));
    if (matched) {
      const parts = matched.split('|');
      if (parts.length > 1) {
        setInspectorNip(parts[1].trim());
      }
    }
  };

  // Helper to update individual item score
  const handleUpdateItemScore = (criterionId: string, score: number, isCompliant: boolean, noteText?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.criterionId === criterionId) {
          return {
            ...item,
            score: Math.max(0, Math.min(score, item.maxScore)),
            isCompliant,
            notes: noteText !== undefined ? noteText : item.notes
          };
        }
        return item;
      })
    );
  };

  // Helper to toggle full score / compliant for one item
  const handleToggleCompliant = (criterionId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.criterionId === criterionId) {
          const nextCompliant = !item.isCompliant;
          return {
            ...item,
            isCompliant: nextCompliant,
            score: nextCompliant ? item.maxScore : Math.floor(item.maxScore / 2)
          };
        }
        return item;
      })
    );
  };

  // Quick Preset: 100% SOP Compliance
  const handleSetAllCompliant = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        score: item.maxScore,
        isCompliant: true
      }))
    );
    setActionRequired('Lulus Standar SOP');
    onShowToast('Standar SOP Penuh', 'Seluruh kriteria penilaian diatur ke nilai maksimal (100 Poin).', 'info');
  };

  // Quick Preset: Reset scores to 0
  const handleResetScores = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        score: 0,
        isCompliant: false,
        notes: ''
      }))
    );
    onShowToast('Form Direset', 'Semua isian nilai kebersihan telah dikosongkan.', 'info');
  };

  // Reset entire form
  const handleResetForm = () => {
    setEditingId(null);
    setRoomNumber('Kamar 01');
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setRoomLeaderName('');
    setStudentNamesInRoom('');
    setItems(getDefaultDormInspectionItems());
    setFindings('');
    setActionRequired('Lulus Standar SOP');
    setActionDeadline('');
    setActionNotes('');
  };

  // Populate form for editing
  const handleStartEdit = (insp: DormInspection) => {
    setEditingId(insp.id);
    setSelectedDorm(insp.dorm);
    setRoomNumber(insp.roomNumber);
    setInspectionDate(insp.date);
    setInspectionTime(insp.time || '07:00');
    setInspectionType(insp.inspectionType);
    setInspectorName(insp.inspectorName);
    setInspectorNip(insp.inspectorNip || '');
    setRoomLeaderName(insp.roomLeaderName || '');
    setStudentNamesInRoom(insp.studentNamesInRoom || '');
    setItems(insp.items || getDefaultDormInspectionItems());
    setFindings(insp.findings || '');
    setActionRequired(insp.actionRequired || 'Lulus Standar SOP');
    setActionDeadline(insp.actionDeadline || '');
    setActionNotes(insp.actionNotes || '');
    setActiveView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save inspection
  const handleSave = () => {
    if (!selectedDorm) {
      onShowToast('Pilih Asrama', 'Silakan pilih gedung asrama yang diperiksa.', 'warning');
      return;
    }
    if (!roomNumber.trim()) {
      onShowToast('Nomor Kamar Kosong', 'Silakan isi nomor kamar yang dinilai.', 'warning');
      return;
    }
    if (!inspectorName.trim()) {
      onShowToast('Petugas Kosong', 'Silakan isi nama wali asuh / petugas pemeriksa.', 'warning');
      return;
    }

    const newInspection: DormInspection = {
      id: editingId || `insp-${Date.now()}`,
      date: inspectionDate,
      time: inspectionTime,
      dorm: selectedDorm,
      roomNumber: roomNumber.trim(),
      inspectionType,
      inspectorName: inspectorName.trim(),
      inspectorRole: 'Wali Asuh Pendamping',
      inspectorNip: inspectorNip.trim(),
      roomLeaderName: roomLeaderName.trim(),
      studentNamesInRoom: studentNamesInRoom.trim(),
      items,
      totalScore,
      grade,
      gradeLabel,
      findings: findings.trim(),
      actionRequired,
      actionDeadline: actionDeadline.trim(),
      actionNotes: actionNotes.trim(),
      createdAt: editingId ? (inspections.find((i) => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveInspection(newInspection);
    onShowToast(
      editingId ? 'Penilaian Diperbarui' : 'Penilaian Berhasil Disimpan',
      `Hasil inspeksi kebersihan ${newInspection.dorm} (${newInspection.roomNumber}) telah tersimpan dengan Nilai ${totalScore} (${grade}).`,
      'success'
    );

    handleResetForm();
    setActiveView('history');
  };

  // Delete inspection
  const handleDelete = async (id: string, roomInfo: string) => {
    const ok = await onAskConfirm('Hapus Penilaian?', `Apakah Anda yakin ingin menghapus data penilaian kebersihan untuk ${roomInfo}?`);
    if (ok) {
      onDeleteInspection(id);
      onShowToast('Data Dihapus', `Catatan penilaian untuk ${roomInfo} berhasil dihapus.`, 'info');
    }
  };

  // Print PDF for specific inspection
  const handlePrintPDF = (insp: DormInspection) => {
    printDormInspectionPDF(insp, config);
    onShowToast('Mencetak PDF', `Dokumen penilaian kebersihan untuk ${insp.dorm} - ${insp.roomNumber} sedang diunduh.`, 'info');
  };

  // Print Blank Checklist Form
  const handlePrintBlankForm = () => {
    printBlankDormInspectionFormPDF(config);
    onShowToast('Formulir Kosong', 'Formulir isian lapangan SOP Kebersihan Asrama berhasil diunduh.', 'info');
  };

  // Filter inspections for history
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      const matchDorm = filterDorm === 'all' || insp.dorm === filterDorm;
      const matchGrade = filterGrade === 'all' || insp.grade === filterGrade;
      const query = searchQuery.toLowerCase();
      const matchSearch =
        !query ||
        insp.dorm.toLowerCase().includes(query) ||
        insp.roomNumber.toLowerCase().includes(query) ||
        insp.inspectorName.toLowerCase().includes(query) ||
        (insp.roomLeaderName && insp.roomLeaderName.toLowerCase().includes(query)) ||
        (insp.studentNamesInRoom && insp.studentNamesInRoom.toLowerCase().includes(query)) ||
        (insp.findings && insp.findings.toLowerCase().includes(query));
      return matchDorm && matchGrade && matchSearch;
    });
  }, [inspections, filterDorm, filterGrade, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const count = inspections.length;
    if (count === 0) {
      return { total: 0, avgScore: 0, topRoom: '-', needRetest: 0 };
    }
    const sum = inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    const avgScore = Math.round(sum / count);
    const sorted = [...inspections].sort((a, b) => b.totalScore - a.totalScore);
    const topRoom = `${sorted[0].dorm} - ${sorted[0].roomNumber} (${sorted[0].totalScore} Poin)`;
    const needRetest = inspections.filter((i) => i.grade === 'D' || i.actionRequired === 'Piket Ulang Sore Ini').length;
    return { total: count, avgScore, topRoom, needRetest };
  }, [inspections]);

  // Category labels and icon helpers
  const categoryDefinitions: { key: DormInspectionCategoryKey; label: string; maxTotal: number; description: string }[] = [
    {
      key: 'ranjang_selimut',
      label: 'Penataan Ranjang & Selimut',
      maxTotal: 25,
      description: 'Sprei kencang rapi, lipatan selimut presisi persegi ala asrama/militer, bantal simetris, dan kolong kasur bersih.'
    },
    {
      key: 'lemari_isi',
      label: 'Lemari & Tingkatan Isi Lemari',
      maxTotal: 30,
      description: 'Fisik luar/dalam bersih, seragam gantungan rapi di rak atas, pakaian santai di rak tengah, buku di rak bawah & bebas makanan.'
    },
    {
      key: 'debu_permukaan',
      label: 'Pengecekan Debu & Permukaan',
      maxTotal: 25,
      description: 'Jalusi ventilasi, kusen dan kaca jendela dilap bening, meja belajar & atas lemari bebas debu, plafon bebas sawang.'
    },
    {
      key: 'fasilitas_kelengkapan',
      label: 'Kelengkapan & Fasilitas Asrama',
      maxTotal: 20,
      description: 'Inventaris kamar utuh, rak sepatu tertata rapi, jemuran handuk basah di luar, tempat sampah dikosongkan, kelistrikan aman.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Standar SOP Kebersihan & Kerapian Asrama
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Penilaian & Inspeksi Kebersihan Asrama
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Pemeriksaan standar operasional prosedur keasramaan: penataan ranjang & selimut, keteraturan tingkatan isi lemari, kebersihan debu kusen/ventilasi, serta kelengkapan fasilitas kamar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrintBlankForm}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-sm"
            title="Cetak Formulir Kosong untuk dibawa saat inspeksi kamar keliling"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Cetak Form Kosong SOP
          </button>

          <button
            onClick={() => {
              if (activeView === 'form' && editingId) {
                handleResetForm();
              } else {
                setActiveView('form');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-sm ${
              activeView === 'form'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            {editingId ? 'Mode Input Baru' : 'Input Penilaian Kamar'}
          </button>
        </div>
      </div>

      {/* Top Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sesi Inspeksi
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">pemeriksaan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata Skor Asrama
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{stats.avgScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100 poin</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Kamar Teladan / Terbersih
          </span>
          <p className="text-xs font-bold text-slate-800 mt-1 truncate" title={stats.topRoom}>
            {stats.topRoom}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Perlu Piket Ulang
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{stats.needRetest}</span>
            <span className="text-xs text-slate-400 font-medium">kamar perlu perbaikan</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 py-1.5 shadow-sm">
        <button
          onClick={() => setActiveView('form')}
          className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            activeView === 'form'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Edit className="w-4 h-4" />
          {editingId ? 'Edit Formulir Penilaian' : 'Formulir Penilaian Kamar'}
        </button>

        <button
          onClick={() => setActiveView('history')}
          className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            activeView === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Riwayat & Rekapitulasi Inspeksi ({inspections.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: FORMULIR INPUT PENILAIAN */}
      {/* ========================================================================= */}
      {activeView === 'form' && (
        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  Identitas Kamar & Petugas Pemeriksa
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan lokasi asrama, nomor kamar, dan nama pengampu sebelum mengisi poin indikator SOP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllCompliant}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Set Sesuai SOP Semua (100 Poin)
                </button>
                <button
                  type="button"
                  onClick={handleResetScores}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Nilai
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gedung Asrama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gedung / Asrama *
                </label>
                <select
                  value={selectedDorm}
                  onChange={(e) => setSelectedDorm(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-600"
                >
                  {config.dormList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nomor Kamar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Kamar / Paviliun *
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Contoh: Kamar 01, Paviliun A"
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-600"
                />
              </div>

              {/* Tanggal & Waktu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal & Waktu Inspeksi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <input
                    type="time"
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Jenis Inspeksi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Pemeriksaan
                </label>
                <select
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value as any)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="Inspeksi Rutin Pagi">Inspeksi Rutin Pagi (Sebelum Sekolah)</option>
                  <option value="Sidak Kerapian & Kebersihan">Sidak Kerapian & Kebersihan</option>
                  <option value="Inspeksi Mingguan (Ro'an Asrama)">Inspeksi Mingguan (Ro'an Asrama)</option>
                  <option value="Evaluasi Bulanan Kamar">Evaluasi Bulanan Kamar</option>
                </select>
              </div>

              {/* Petugas Pemeriksa (Wali Asuh) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Petugas Pemeriksa (Wali Asuh) *
                </label>
                <input
                  type="text"
                  list="wali-asuh-suggestions"
                  value={inspectorName}
                  onChange={(e) => handleInspectorChange(e.target.value)}
                  placeholder="Nama Wali Asuh / Pembina"
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <datalist id="wali-asuh-suggestions">
                  {config.waliAsuhList.map((w, idx) => (
                    <option key={idx} value={w.split('|')[0].trim()} />
                  ))}
                </datalist>
              </div>

              {/* NIP Petugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP / NRK Petugas
                </label>
                <input
                  type="text"
                  value={inspectorNip}
                  onChange={(e) => setInspectorNip(e.target.value)}
                  placeholder="NIP / NRK Petugas"
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Ketua Kamar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ketua Kamar / Siswa Pendamping
                </label>
                <input
                  type="text"
                  value={roomLeaderName}
                  onChange={(e) => setRoomLeaderName(e.target.value)}
                  placeholder="Nama Ketua Kamar / Siswa PIC"
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Anggota Penghuni Kamar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Nama Penghuni Kamar
                </label>
                <input
                  type="text"
                  value={studentNamesInRoom}
                  onChange={(e) => setStudentNamesInRoom(e.target.value)}
                  placeholder="Contoh: Dimas, Rizky, Fathan, Budi"
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Live Score Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Hasil Perhitungan Skor Realtime
              </span>
              <div className="flex items-center gap-3">
                <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {totalScore} <span className="text-lg text-slate-400 font-semibold">/ 100</span>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    grade === 'A'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                      : grade === 'B'
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                      : grade === 'C'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  PREDIKAT {grade}
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {gradeLabel}
              </p>
            </div>

            {/* Visual Bar Progress */}
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Kurang (&lt;56)</span>
                <span>Cukup (56-70)</span>
                <span>Baik (71-85)</span>
                <span>Sangat Baik (86-100)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    totalScore >= 86
                      ? 'bg-emerald-500'
                      : totalScore >= 71
                      ? 'bg-blue-500'
                      : totalScore >= 56
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                />
              </div>
              <div className="text-[11px] text-right text-slate-400">
                Kamar: <span className="text-white font-bold">{selectedDorm} - {roomNumber}</span>
              </div>
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveFormCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFormCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua 4 Aspek Penilaian (17 Indikator)
            </button>
            {categoryDefinitions.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveFormCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeFormCategory === cat.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75">({cat.maxTotal} Poin)</span>
              </button>
            ))}
          </div>

          {/* SOP Criteria Cards per Category */}
          <div className="space-y-6">
            {categoryDefinitions
              .filter((cat) => activeFormCategory === 'all' || activeFormCategory === cat.key)
              .map((cat, catIdx) => {
                const itemsInCat = items.filter((i) => i.category === cat.key);
                const currentCatScore = itemsInCat.reduce((acc, curr) => acc + (curr.score || 0), 0);

                return (
                  <div
                    key={cat.key}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-black flex items-center justify-center">
                            {catIdx + 1}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm md:text-base">
                            {cat.label}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cat.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800">
                          Subtotal: {currentCatScore} / {cat.maxTotal} Poin
                        </div>
                      </div>
                    </div>

                    {/* Criteria Item Rows */}
                    <div className="divide-y divide-slate-100">
                      {itemsInCat.map((item, itemIdx) => (
                        <div
                          key={item.criterionId}
                          className="p-4 md:p-5 hover:bg-slate-50/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Title & Standard SOP */}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-400">
                                #{itemIdx + 1}
                              </span>
                              <h5 className="text-xs md:text-sm font-bold text-slate-800">
                                {item.title}
                              </h5>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Bobot: {item.maxScore} Poin
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                              <strong>SOP Asrama:</strong> {item.sopStandard}
                            </p>

                            {/* Note input per item */}
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) =>
                                handleUpdateItemScore(item.criterionId, item.score, item.isCompliant, e.target.value)
                              }
                              placeholder="Catatan temuan khusus (opsional, misal: lipatan miring, sarung berdebu)..."
                              className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
                          </div>

                          {/* Controls: Score Slider / Buttons */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 min-w-[210px] border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleToggleCompliant(item.criterionId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                item.isCompliant
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {item.isCompliant ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Sesuai SOP
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  Belum Sesuai
                                </>
                              )}
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-semibold">Skor:</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: item.maxScore + 1 }, (_, i) => i).map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemScore(item.criterionId, num, num === item.maxScore)
                                    }
                                    className={`w-6 h-6 rounded text-[11px] font-bold transition flex items-center justify-center ${
                                      item.score === num
                                        ? 'bg-slate-900 text-white shadow'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action & Findings Section */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm md:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
              Catatan Temuan Lapangan & Keputusan Tindak Lanjut
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Findings */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Temuan Pemeriksa / Benda Tidak Sesuai SOP
                </label>
                <textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Ditemukan pakaian kotor terselip di rak bawah lemari, sprei ranjang no. 2 belum ditarik kencang, debu pada kusen jendela atas..."
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Action Required & Deadline */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Keputusan Tindak Lanjut *
                  </label>
                  <select
                    value={actionRequired}
                    onChange={(e) => setActionRequired(e.target.value as DormActionRequired)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="Lulus Standar SOP">Lulus Standar SOP (Kamar Bersih & Rapi)</option>
                    <option value="Pemberian Apresiasi / Bintang Kamar">Pemberian Apresiasi / Bintang Kamar Teladan</option>
                    <option value="Pemberitahuan & Rapikan Mandiri">Pemberitahuan & Rapikan Mandiri (Catatan Minor)</option>
                    <option value="Piket Ulang Sore Ini">Piket Ulang Sore Ini (Wajib Dibersihkan Ulang)</option>
                    <option value="Pembinaan Khusus Wali Asuh">Pembinaan Khusus Wali Asuh (Pelanggaran Berulang)</option>
                    <option value="Perbaikan Kerusakan Fasilitas">Perbaikan Kerusakan Fasilitas (Lapor Pengelola)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tenggat Waktu Perbaikan (Deadline)
                  </label>
                  <input
                    type="text"
                    value={actionDeadline}
                    onChange={(e) => setActionDeadline(e.target.value)}
                    placeholder="Contoh: Hari ini Pukul 16.30 WIB (sebelum apel sore)"
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Additional notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Instruksi Tambahan Petugas Pemeriksa
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Instruksi khusus kepada ketua kamar atau piket harian..."
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold transition active:scale-95"
            >
              Batal / Reset Formulir
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan Penilaian' : 'Simpan Hasil Penilaian Kamar'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: RIWAYAT & REKAPITULASI PENILAIAN */}
      {/* ========================================================================= */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari gedung asrama, nomor kamar, nama siswa, atau catatan temuan..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Filter Asrama */}
              <select
                value={filterDorm}
                onChange={(e) => setFilterDorm(e.target.value)}
                className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="all">Semua Asrama</option>
                {config.dormList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Filter Predikat */}
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="all">Semua Predikat</option>
                <option value="A">Predikat A (Sangat Baik)</option>
                <option value="B">Predikat B (Baik)</option>
                <option value="C">Predikat C (Cukup)</option>
                <option value="D">Predikat D (Kurang / Piket Ulang)</option>
              </select>
            </div>
          </div>

          {/* Records List */}
          {filteredInspections.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BedDouble className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                Belum Ada Catatan Penilaian Kebersihan
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Silakan lakukan inspeksi kebersihan kamar menggunakan tombol "Input Penilaian Kamar" atau cetak formulir kosong untuk sidak lapangan.
              </p>
              <button
                onClick={() => setActiveView('form')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Mulai Penilaian Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInspections.map((insp) => (
                <div
                  key={insp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:shadow-md transition"
                >
                  {/* Top Bar: Room & Grade */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm md:text-base">
                          {insp.dorm}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {insp.roomNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateIndonesian(insp.date)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{insp.time || '-'} WIB</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xl font-black text-slate-900">
                          {insp.totalScore}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">/100</span>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          insp.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : insp.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : insp.grade === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        Predikat {insp.grade}
                      </span>
                    </div>
                  </div>

                  {/* Inspector & Leader Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Pemeriksa:
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {insp.inspectorName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Ketua / Siswa:
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {insp.roomLeaderName || insp.studentNamesInRoom || '(Seluruh Kamar)'}
                      </span>
                    </div>
                  </div>

                  {/* Findings */}
                  {insp.findings && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                        Catatan Temuan:
                      </span>
                      <p className="line-clamp-2 leading-relaxed text-slate-600">
                        {insp.findings}
                      </p>
                    </div>
                  )}

                  {/* Action status pill */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        insp.actionRequired === 'Lulus Standar SOP'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : insp.actionRequired === 'Pemberian Apresiasi / Bintang Kamar'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {insp.actionRequired}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrintPDF(insp)}
                        className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1 px-2.5 shadow-sm"
                        title="Cetak Lembar Penilaian Resmi PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(insp)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        title="Edit Penilaian"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(insp.id, `${insp.dorm} - ${insp.roomNumber}`)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
