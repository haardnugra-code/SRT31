import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  DoorOpen,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Activity,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  Minus,
  Save,
  RotateCcw,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Student, Leave, AppConfig, LeaveCategory, LeaveType } from '../types';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import { printLeavePassPDF, generateLeaveRecapReportPDF } from '../services/pdfGenerator';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Page View Mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [draftInfo, setDraftInfo] = useState<{ timestamp: string } | null>(null);

  // Sync external open request
  useEffect(() => {
    if (isModalOpenExternal) {
      handleOpenAddModal();
    }
  }, [isModalOpenExternal]);

  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [category, setCategory] = useState<LeaveCategory>('Izin Keluar / Pesiar');
  const [type, setType] = useState<LeaveType>('Pesiar');
  const [reason, setReason] = useState<string>('');
  const [leaveDate, setLeaveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveTime, setLeaveTime] = useState<string>('08:00');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState<string>('17:00');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [parentContact, setParentContact] = useState<string>('');
  const [pickupPerson, setPickupPerson] = useState<string>('Sendiri / Bersama Rekan');
  const [securityOfficer, setSecurityOfficer] = useState<string>('Piket Satpam Gerbang');
  const [caretaker, setCaretaker] = useState<string>(
    config.waliAsuhList[0]?.split('|')[0] || 'M. ARDIAN NUGRAHA, S.H'
  );
  const [caretakerNip, setCaretakerNip] = useState<string>('');
  const [dormMaster, setDormMaster] = useState<string>(config.waliAsrama || 'Wali Asrama Mandiri');
  const [dormMasterNip, setDormMasterNip] = useState<string>(config.waliAsramaNip || '');
  const [letterNumber, setLetterNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const DRAFT_LEAVES_KEY = 'SANTRI_LEAVES_DRAFT';

  // Check saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_LEAVES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.reason || parsed.destinationAddress || parsed.notes)) {
          setDraftInfo({ timestamp: parsed.savedAt || new Date().toLocaleTimeString('id-ID') });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft when filling new leave permit
  useEffect(() => {
    if (viewMode !== 'form') return;
    if (editingLeaveId) return;

    if (reason || destinationAddress || notes) {
      const draftData = {
        studentId,
        category,
        type,
        reason,
        leaveDate,
        leaveTime,
        returnDate,
        returnTime,
        destinationAddress,
        parentContact,
        pickupPerson,
        securityOfficer,
        caretaker,
        caretakerNip,
        dormMaster,
        dormMasterNip,
        letterNumber,
        notes,
        savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      try {
        localStorage.setItem(DRAFT_LEAVES_KEY, JSON.stringify(draftData));
        setDraftInfo({ timestamp: draftData.savedAt });
      } catch {
        // ignore
      }
    }
  }, [
    viewMode,
    editingLeaveId,
    studentId,
    category,
    type,
    reason,
    leaveDate,
    leaveTime,
    returnDate,
    returnTime,
    destinationAddress,
    parentContact,
    pickupPerson,
    securityOfficer,
    caretaker,
    caretakerNip,
    dormMaster,
    dormMasterNip,
    letterNumber,
    notes
  ]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_LEAVES_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.studentId) setStudentId(d.studentId);
      if (d.category) setCategory(d.category);
      if (d.type) setType(d.type);
      if (d.reason) setReason(d.reason);
      if (d.leaveDate) setLeaveDate(d.leaveDate);
      if (d.leaveTime) setLeaveTime(d.leaveTime);
      if (d.returnDate) setReturnDate(d.returnDate);
      if (d.returnTime) setReturnTime(d.returnTime);
      if (d.destinationAddress) setDestinationAddress(d.destinationAddress);
      if (d.parentContact) setParentContact(d.parentContact);
      if (d.pickupPerson) setPickupPerson(d.pickupPerson);
      if (d.securityOfficer) setSecurityOfficer(d.securityOfficer);
      if (d.caretaker) setCaretaker(d.caretaker);
      if (d.caretakerNip) setCaretakerNip(d.caretakerNip);
      if (d.dormMaster) setDormMaster(d.dormMaster);
      if (d.dormMasterNip) setDormMasterNip(d.dormMasterNip);
      if (d.letterNumber) setLetterNumber(d.letterNumber);
      if (d.notes) setNotes(d.notes);
      onShowToast('Draf Dipulihkan', 'Isian surat perizinan berhasil dimuat kembali.', 'success');
    } catch {
      onShowToast('Gagal Memulihkan', 'Format draf tidak terbaca.', 'error');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_LEAVES_KEY);
      setDraftInfo(null);
      onShowToast('Draf Dihapus', 'Draf perizinan telah dibersihkan.', 'success');
    } catch {
      // ignore
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingLeaveId(null);
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const cleanWaliAsuh = config.waliAsuhList.map((item) => item.split('|')[0].trim());

  // Quick Presets for fast entry
  const applyPreset = (preset: 'sementara' | 'pesiar' | 'berobat' | 'pulang_reguler' | 'pulang_khusus' | 'darurat' | 'tugas') => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();

    if (preset === 'sementara' || preset === 'pesiar') {
      setCategory('Izin Keluar Sementara');
      setType('Sementara');
      setReason('Izin keluar sementara / belanja perlengkapan sekolah dan keperluan penting');
      setLeaveDate(today);
      setLeaveTime('09:00');
      setReturnDate(today);
      setReturnTime('17:00');
      setDestinationAddress('Pusat Kota / Sekitar Lingkungan Jakabaring');
      setPickupPerson('Sendiri / Rombongan Siswa');
    } else if (preset === 'berobat') {
      setCategory('Izin Berobat');
      setType('Berobat');
      setReason('Pemeriksaan kesehatan ke Fasilitas Kesehatan / RS Rujukan');
      setLeaveDate(today);
      setLeaveTime('08:30');
      setReturnDate(today);
      setReturnTime('14:00');
      setDestinationAddress('Puskesmas Jakabaring / RS Bari Palembang');
      setPickupPerson('Didampingi Petugas UKS / Pengasuh');
    } else if (preset === 'pulang_reguler') {
      setCategory('Izin Pulang / Bermalam');
      setType('Reguler');
      setReason('Liburan semester / masa libur terjadwal keasramaan');
      setLeaveDate(today);
      setLeaveTime('08:00');
      const ret = new Date(todayDate);
      ret.setDate(ret.getDate() + 14);
      setReturnDate(ret.toISOString().split('T')[0]);
      setReturnTime('17:00');
      setDestinationAddress('Rumah Domisili Orang Tua / Wali Siswa');
      setPickupPerson('Dijemput Orang Tua / Wali');
    } else if (preset === 'pulang_khusus') {
      setCategory('Izin Pulang / Bermalam');
      setType('Khusus');
      setReason('Menghadiri acara penting keluarga / walimah');
      setLeaveDate(today);
      setLeaveTime('08:00');
      const ret = new Date(todayDate);
      ret.setDate(ret.getDate() + 3);
      setReturnDate(ret.toISOString().split('T')[0]);
      setReturnTime('17:00');
      setDestinationAddress('Rumah Domisili Orang Tua / Keluarga');
      setPickupPerson('Dijemput Orang Tua / Keluarga');
    } else if (preset === 'darurat') {
      setCategory('Izin Pulang / Bermalam');
      setType('Darurat');
      setReason('Kondisi darurat keluarga (anggota keluarga sakit keras / musibah)');
      setLeaveDate(today);
      setLeaveTime('07:00');
      const ret = new Date(todayDate);
      ret.setDate(ret.getDate() + 7);
      setReturnDate(ret.toISOString().split('T')[0]);
      setReturnTime('17:00');
      setDestinationAddress('Rumah Domisili Orang Tua / Keluarga');
      setPickupPerson('Dijemput Keluarga');
    } else if (preset === 'tugas') {
      setCategory('Izin Tugas / Delegasi');
      setType('Tugas');
      setReason('Delegasi perlombaan / olimpiade / tugas resmi sekolah');
      setLeaveDate(today);
      setLeaveTime('07:30');
      const ret = new Date(todayDate);
      ret.setDate(ret.getDate() + 2);
      setReturnDate(ret.toISOString().split('T')[0]);
      setReturnTime('18:00');
      setDestinationAddress('Lokasi Kegiatan / Perlombaan');
      setPickupPerson('Didampingi Guru Pembimbing');
    }
  };

  const handleOpenAddModal = (presetType?: 'sementara' | 'pesiar' | 'berobat' | 'pulang_reguler') => {
    setEditingLeaveId(null);
    const initialStudent = students[0];
    setStudentId(initialStudent?.id || '');
    if (initialStudent?.caretaker) {
      setCaretaker(initialStudent.caretaker);
    } else {
      setCaretaker(cleanWaliAsuh[0] || 'M. ARDIAN NUGRAHA, S.H');
    }
    setCaretakerNip('');
    setDormMaster(config.waliAsrama || 'Wali Asrama Mandiri');
    setDormMasterNip(config.waliAsramaNip || '');
    setSecurityOfficer('Piket Satpam Gerbang Asrama');
    setNotes('');

    const letterCode = Math.floor(100 + Math.random() * 900);
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const curMonth = romanMonths[new Date().getMonth()];
    setLetterNumber(`0${letterCode}/SR31-ASR/IZIN-KELUAR/${curMonth}/${new Date().getFullYear()}`);

    if (presetType) {
      applyPreset(presetType);
    } else {
      applyPreset('sementara');
    }

    setViewMode('form');
  };

  const handleOpenEditModal = (l: Leave) => {
    setEditingLeaveId(l.id);
    setStudentId(l.studentId);
    setCategory(
      l.category ||
        (l.type === 'Sementara' || l.type === 'Pesiar' || l.type === 'Izin Keluar'
          ? 'Izin Keluar Sementara'
          : l.type === 'Berobat'
          ? 'Izin Berobat'
          : l.type === 'Tugas'
          ? 'Izin Tugas / Delegasi'
          : 'Izin Pulang / Bermalam')
    );
    setType(l.type);
    setReason(l.reason);
    setLeaveDate(l.leaveDate);
    setLeaveTime(l.leaveTime || '08:00');
    setReturnDate(l.returnDate);
    setReturnTime(l.returnTime || '17:00');
    setDestinationAddress(l.destinationAddress || '');
    setParentContact(l.parentContact || '');
    setPickupPerson(l.pickupPerson || '');
    setSecurityOfficer(l.securityOfficer || 'Piket Satpam Gerbang');
    setCaretaker(l.caretaker);
    setCaretakerNip(l.caretakerNip || '');
    setDormMaster(l.dormMaster || config.waliAsrama || 'Wali Asrama Mandiri');
    setDormMasterNip(l.dormMasterNip || config.waliAsramaNip || '');
    setLetterNumber(l.letterNumber || `0${l.id.slice(-3)}/SR31-ASR/IZIN/${new Date().getFullYear()}`);
    setNotes(l.notes || '');
    setViewMode('form');
  };

  const closeModal = () => {
    handleBackToList();
  };

  const handleStudentChange = (selectedId: string) => {
    setStudentId(selectedId);
    const st = students.find((s) => String(s.id) === String(selectedId));
    if (st?.caretaker) {
      setCaretaker(st.caretaker);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => String(s.id) === String(studentId));
    if (!student) {
      onShowToast('Siswa Tidak Ditemukan', 'Silakan pilih siswa dari daftar terlebih dahulu.', 'warning');
      return;
    }

    if (editingLeaveId) {
      const existing = leaves.find((x) => x.id === editingLeaveId);
      const updatedLeave: Leave = {
        id: editingLeaveId,
        studentId,
        studentName: student.name,
        category,
        type,
        reason,
        leaveDate,
        leaveTime,
        returnDate,
        returnTime,
        actualReturnTimestamp: existing?.actualReturnTimestamp,
        destinationAddress,
        parentContact,
        pickupPerson,
        securityOfficer,
        caretaker,
        caretakerNip,
        dormMaster,
        dormMasterNip,
        letterNumber,
        notes,
        status: existing?.status || 'Active'
      };
      onSaveLeave(updatedLeave, true);
      onShowToast('Berhasil Diperbarui', `Surat izin untuk ${student.name} berhasil diperbarui.`, 'success');
    } else {
      const newLeave: Leave = {
        id: `l-${Date.now()}`,
        studentId,
        studentName: student.name,
        category,
        type,
        reason,
        leaveDate,
        leaveTime,
        returnDate,
        returnTime,
        destinationAddress,
        parentContact,
        pickupPerson,
        securityOfficer,
        caretaker,
        caretakerNip,
        dormMaster,
        dormMasterNip,
        letterNumber,
        notes,
        status: 'Active'
      };
      onSaveLeave(newLeave, false);
      onShowToast('Surat Izin Diterbitkan', `Surat izin keluar/pulang untuk ${student.name} resmi diterbitkan.`, 'success');
    }

    clearDraft();
    handleBackToList();
  };

  const handleToggleReturnStatus = async (l: Leave) => {
    if (l.status === 'Active') {
      const nowStr = new Date().toLocaleString('id-ID');
      const confirmed = await onAskConfirm(
        'Konfirmasi Kedatangan Siswa',
        `Tandai bahwa ${l.studentName} telah tiba kembali di asrama pada ${nowStr}?`
      );
      if (confirmed) {
        onUpdateStatus(l.id, 'Returned');
        onShowToast('Siswa Kembali', `${l.studentName} telah dikonfirmasi kembali ke asrama.`, 'success');
      }
    } else {
      const confirmed = await onAskConfirm(
        'Ubah Status Menjadi Sedang Keluar?',
        `Kembalikan status ${l.studentName} menjadi 'Active' (Sedang di Luar Asrama)?`
      );
      if (confirmed) {
        onUpdateStatus(l.id, 'Active');
        onShowToast('Status Diperbarui', `Status ${l.studentName} diubah menjadi Sedang di Luar.`, 'info' as any);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await onAskConfirm(
      'Hapus Dokumen Surat Izin?',
      `Apakah Anda yakin ingin menghapus arsip surat izin atas nama ${name}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (confirmed) {
      onDeleteLeave(id);
      onShowToast('Arsip Dihapus', 'Data surat izin berhasil dihapus dari sistem.', 'success');
    }
  };

  // Filtered dataset
  const filteredLeaves = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return leaves.filter((l) => {
      const matchSearch =
        l.studentName.toLowerCase().includes(q) ||
        (l.studentId && l.studentId.toLowerCase().includes(q)) ||
        l.reason.toLowerCase().includes(q) ||
        (l.destinationAddress && l.destinationAddress.toLowerCase().includes(q)) ||
        (l.letterNumber && l.letterNumber.toLowerCase().includes(q));

      const matchCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'sementara' && (l.type === 'Sementara' || l.type === 'Pesiar' || l.type === 'Izin Keluar' || l.category === 'Izin Keluar Sementara' || l.category === 'Izin Keluar' || l.category === 'Izin Keluar / Pesiar')) ||
        (categoryFilter === 'berobat' && (l.type === 'Berobat' || l.category === 'Izin Berobat')) ||
        (categoryFilter === 'pulang' && (l.type === 'Reguler' || l.type === 'Khusus' || l.type === 'Darurat' || l.category === 'Izin Pulang / Bermalam')) ||
        (categoryFilter === 'tugas' && (l.type === 'Tugas' || l.category === 'Izin Tugas / Delegasi'));

      const matchStatus =
        statusFilter === 'all' || l.status === statusFilter;

      const matchDate =
        !dateFilter || l.leaveDate === dateFilter || l.returnDate === dateFilter;

      return matchSearch && matchCategory && matchStatus && matchDate;
    });
  }, [leaves, searchQuery, categoryFilter, statusFilter, dateFilter]);

  // Statistics
  const totalCount = leaves.length;
  const activeCount = leaves.filter((l) => l.status === 'Active').length;
  const returnedCount = leaves.filter((l) => l.status === 'Returned').length;
  const sementaraCount = leaves.filter((l) => l.type === 'Sementara' || l.type === 'Pesiar' || l.type === 'Izin Keluar' || l.category === 'Izin Keluar Sementara' || l.category === 'Izin Keluar' || l.category === 'Izin Keluar / Pesiar').length;
  const pulangCount = leaves.filter((l) => l.type === 'Reguler' || l.type === 'Khusus' || l.type === 'Darurat' || l.category === 'Izin Pulang / Bermalam').length;

  const currentSelectedStudent = useMemo(() => {
    return students.find((s) => String(s.id) === String(studentId));
  }, [students, studentId]);

  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        {/* Form Page Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 md:p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
              title="Kembali ke Daftar Surat Izin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-1">
                <DoorOpen className="w-3.5 h-3.5" /> Halaman Formulir Perizinan Siswa
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {editingLeaveId ? 'Edit Surat Izin Keluar Siswa' : 'Penerbitan Surat Izin Keluar Siswa'}
              </h2>
              <p className="text-xs text-slate-300">
                Formulir resmi perizinan siswa dengan validasi pos satpam dan pengasuhan keasramaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleBackToList}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Tabel
            </button>
          </div>
        </div>

        {/* Form Body Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
          {/* Draft Recovery Alert */}
          {draftInfo && !editingLeaveId && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-950">Draf Izin Keluar Tersimpan</p>
                  <p className="text-[11px] text-amber-800">Tersimpan otomatis pukul {draftInfo.timestamp}.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Pulihkan Draf
                </button>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="px-3 py-1.5 bg-white border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Hapus Draf
                </button>
              </div>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Template Cepat Pengisian:
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('sementara')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🚶 Izin Keluar Sementara (Sore Ini)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('berobat')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🏥 Berobat / Klinik (3-5 Jam)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pulang_reguler')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🏠 Pulang Libur (14 Hari)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pulang_khusus')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🏠 Acara Keluarga (3 Hari)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('darurat')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🚨 Darurat / Duka Cita (7 Hari)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tugas')}
                className="bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                🏆 Tugas / Lomba (2 Hari)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Siswa & No. Surat */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> 1. Identitas Siswa & Nomor Surat
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Peserta Didik / Siswa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Kelas {s.class} - Asrama {s.dorm})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Surat Izin Resmi
                  </label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    placeholder="Contoh: 042/SR31-ASR/IZIN-KELUAR/VIII/2026"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {currentSelectedStudent && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs flex flex-wrap items-center gap-4 sm:gap-6 text-slate-600">
                  <div><span className="font-semibold text-slate-400">NISN:</span> <strong className="text-slate-800">{currentSelectedStudent.id}</strong></div>
                  <div><span className="font-semibold text-slate-400">Gedung Asrama:</span> <strong className="text-slate-800">{currentSelectedStudent.dorm}</strong></div>
                  <div><span className="font-semibold text-slate-400">Wali Asuh:</span> <strong className="text-slate-800">{currentSelectedStudent.caretaker}</strong></div>
                </div>
              )}
            </div>

            {/* Section 2: Kategori & Keperluan */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> 2. Kategori Perizinan & Alasan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kategori Perizinan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LeaveCategory)}
                    required
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Izin Keluar Sementara">🚶 Izin Keluar Sementara</option>
                    <option value="Izin Berobat">🏥 Izin Berobat / Medis</option>
                    <option value="Izin Pulang / Bermalam">🏠 Izin Pulang / Bermalam</option>
                    <option value="Izin Tugas / Delegasi">🏆 Izin Tugas / Delegasi Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis Izin Disiplin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LeaveType)}
                    required
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Sementara">Izin Keluar Sementara</option>
                    <option value="Berobat">Berobat (Klinik / RS)</option>
                    <option value="Reguler">Reguler (Libur Terjadwal)</option>
                    <option value="Khusus">Khusus (Acara Penting Keluarga)</option>
                    <option value="Darurat">Darurat (Duka Cita / Sakit Berat)</option>
                    <option value="Tugas">Tugas / Perlombaan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Keperluan & Alasan Izin Spesifik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Membeli perlengkapan asrama & buku pelajaran di Gramedia"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Waktu Keluar & Batas Kembali */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> 3. Jadwal Waktu Keluar & Batas Kembali
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-emerald-800 block">Waktu Keluar / Berangkat</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1 font-medium">Tanggal Keluar</label>
                      <input
                        type="date"
                        required
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1 font-medium">Jam Keluar (WIB)</label>
                      <input
                        type="time"
                        required
                        value={leaveTime}
                        onChange={(e) => setLeaveTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-rose-800 block">Batas Target Waktu Kembali</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1 font-medium">Tanggal Kembali</label>
                      <input
                        type="date"
                        required
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1 font-medium">Batas Jam Kembali (WIB)</label>
                      <input
                        type="time"
                        required
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Lokasi Tujuan & Pendamping */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> 4. Tujuan, Kontak & Pendamping
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat / Lokasi Tujuan
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="e.g. OPI Mall Jakabaring / Rumah Ortu"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    No. HP / Kontak Ortu
                  </label>
                  <input
                    type="text"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    placeholder="e.g. 0812-3456-7890"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Penjemput / Pendamping
                  </label>
                  <input
                    type="text"
                    value={pickupPerson}
                    onChange={(e) => setPickupPerson(e.target.value)}
                    placeholder="Sendiri / Orang Tua / Guru"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Pengesahan Dual & Pos Satpam */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> 5. Penanggung Jawab & Pengesahan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">Wali Asuh Pendamping</span>
                  <select
                    value={caretaker}
                    onChange={(e) => setCaretaker(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  >
                    {cleanWaliAsuh.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={caretakerNip}
                    onChange={(e) => setCaretakerNip(e.target.value)}
                    placeholder="NIP/NIK Wali Asuh"
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs text-slate-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">Wali Asrama Mandiri</span>
                  <input
                    type="text"
                    required
                    value={dormMaster}
                    onChange={(e) => setDormMaster(e.target.value)}
                    placeholder="Nama Wali Asrama"
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="text"
                    value={dormMasterNip}
                    onChange={(e) => setDormMasterNip(e.target.value)}
                    placeholder="NIP Wali Asrama"
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs text-slate-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">Pos Keamanan / Satpam Gerbang</span>
                  <input
                    type="text"
                    value={securityOfficer}
                    onChange={(e) => setSecurityOfficer(e.target.value)}
                    placeholder="Piket Satpam Gerbang"
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Verifikasi barcode & stempel pemeriksaan gerbang</p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" /> Simpan & Terbitkan Surat Izin
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 md:p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Sistem Pengamanan & Perizinan Gerbang
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Surat Izin Keluar & Kepulangan Siswa
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
            Penerbitan surat izin resmi keluar lingkungan sekolah (Izin Keluar Sementara, Berobat, Izin Tugas, & Kepulangan Bermalam) lengkap dengan validasi QR Code & verifikasi pos satpam gerbang.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={() => handleOpenAddModal('sementara')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Ajukan Izin Keluar Sementara"
          >
            <Plus className="w-4 h-4" /> Izin Keluar Sementara
          </button>
          <button
            onClick={() => handleOpenAddModal('pulang_reguler')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Ajukan Izin Pulang Bermalam"
          >
            <DoorOpen className="w-4 h-4" /> Izin Pulang Bermalam
          </button>
          <button
            onClick={async () => {
              await generateLeaveRecapReportPDF(filteredLeaves, students, config, {
                categoryFilter: categoryFilter === 'all' ? 'Semua Kategori' : categoryFilter,
                statusFilter: statusFilter === 'all' ? 'Semua Status' : statusFilter
              });
              onShowToast('Rekap Diunduh', 'Laporan Rekapitulasi Surat Izin Keluar Siswa berhasil dicetak.', 'success');
            }}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-3.5 py-2.5 rounded-xl backdrop-blur transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Cetak Rekapitulasi PDF Resmi"
          >
            <FileSpreadsheet className="w-4 h-4" /> Unduh Rekap PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Izin</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Semua dokumen</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Sedang di Luar</p>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Siswa di luar asrama</p>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl shadow-sm">
          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Izin Keluar Sementara</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{sementaraCount}</p>
          <p className="text-[10px] text-blue-700 font-medium mt-0.5">Keperluan singkat</p>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl shadow-sm">
          <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Izin Pulang Bermalam</p>
          <p className="text-2xl font-black text-purple-900 mt-1">{pulangCount}</p>
          <p className="text-[10px] text-purple-700 font-medium mt-0.5">Libur / Urusan keluarga</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sudah Kembali</p>
          <p className="text-2xl font-black text-slate-700 mt-1">{returnedCount}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tiba kembali di asrama</p>
        </div>
      </div>

      {/* Filter & Sub Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🌟 Semua Kategori
          </button>
          <button
            onClick={() => setCategoryFilter('sementara')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'sementara'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            🚶 Izin Keluar Sementara
          </button>
          <button
            onClick={() => setCategoryFilter('berobat')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'berobat'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            🏥 Izin Berobat / Klinik
          </button>
          <button
            onClick={() => setCategoryFilter('pulang')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'pulang'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            🏠 Izin Pulang / Bermalam
          </button>
          <button
            onClick={() => setCategoryFilter('tugas')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'tugas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            🏆 Izin Tugas / Delegasi
          </button>
        </div>

        {/* Search and Secondary Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, NISN, no. surat, alasan, atau lokasi tujuan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
            >
              <option value="all">Semua Status Izin</option>
              <option value="Active">🟢 Sedang di Luar (Active)</option>
              <option value="Returned">⚪ Sudah Kembali (Returned)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              title="Filter Berdasarkan Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4">Siswa & No. Surat</th>
                <th className="p-4">Kategori & Keperluan</th>
                <th className="p-4">Waktu Keluar</th>
                <th className="p-4">Target Batas Kembali</th>
                <th className="p-4">Tujuan & Kontak</th>
                <th className="p-4 text-center">Status Gerbang</th>
                <th className="p-4 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <DoorOpen className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700">Tidak Ada Data Perizinan</p>
                      <p className="text-xs text-slate-400">
                        Belum ada arsip surat izin keluar yang cocok dengan filter pencarian.
                      </p>
                      <button
                        onClick={() => handleOpenAddModal('sementara')}
                        className="mt-2 bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                      >
                        + Terbitkan Surat Izin Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const student = students.find((s) => String(s.id) === String(l.studentId));
                  const isSementara = l.type === 'Sementara' || l.type === 'Pesiar' || l.type === 'Izin Keluar' || l.category === 'Izin Keluar Sementara' || l.category === 'Izin Keluar / Pesiar' || l.category === 'Izin Keluar';
                  const isMedical = l.type === 'Berobat' || l.category === 'Izin Berobat';
                  const isTask = l.type === 'Tugas' || l.category === 'Izin Tugas / Delegasi';

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student info */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{l.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>NISN: {l.studentId}</span>
                          <span>•</span>
                          <span>{student ? `Kelas ${student.class} (${student.dorm})` : 'Siswa Sekolah Rakyat'}</span>
                        </div>
                        {l.letterNumber && (
                          <div className="text-[10px] text-indigo-600 font-mono font-semibold mt-0.5">
                            No: {l.letterNumber}
                          </div>
                        )}
                      </td>

                      {/* Category & Reason */}
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isSementara
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isMedical
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isTask
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            }`}
                          >
                            {l.category || l.type}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {l.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                          {l.reason}
                        </p>
                      </td>

                      {/* Departure */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateShort(l.leaveDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {l.leaveTime || '08:00'} WIB
                        </div>
                      </td>

                      {/* Return */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateShort(l.returnDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {l.returnTime || '17:00'} WIB
                        </div>
                      </td>

                      {/* Destination & Contact */}
                      <td className="p-4 max-w-xs">
                        <div className="text-xs text-slate-800 font-medium flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{l.destinationAddress || 'Alamat Domisili'}</span>
                        </div>
                        {l.parentContact && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{l.parentContact}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Penjemput: {l.pickupPerson || 'Sendiri / Wali'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleReturnStatus(l)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-sm cursor-pointer ${
                            l.status === 'Returned'
                              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          }`}
                          title="Klik untuk mengubah status kedatangan santri"
                        >
                          {l.status === 'Returned' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sudah Kembali
                            </>
                          ) : (
                            <>
                              <DoorOpen className="w-3.5 h-3.5" /> Sedang di Luar
                            </>
                          )}
                        </button>
                      </td>

                      {/* Options */}
                      <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={async () => {
                            await printLeavePassPDF(l, student, config);
                            onShowToast('Surat Dicetak', `Surat izin resmi untuk ${l.studentName} berhasil dibuat (PDF).`, 'success');
                          }}
                          className="text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                          title="Cetak Surat Izin Resmi (PDF Kop Surat)"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Surat
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(l)}
                          className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 p-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                          title="Edit Formulir Izin"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.studentName)}
                          className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 p-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                          title="Hapus Dokumen Izin"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
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
  );
};
