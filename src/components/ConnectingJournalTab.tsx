import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserCheck,
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  ArrowRight,
  Send,
  AlertCircle,
  Sparkles,
  Info,
  Check,
  X,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { ConnectingJournal, Student, AppConfig } from '../types';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import {
  generateConnectingJournalPDF,
  generateSingleConnectingJournalDispositionPDF
} from '../services/pdfGenerator';
import {
  CheckSquare,
  Square,
  FileText,
  Download
} from 'lucide-react';


interface ConnectingJournalTabProps {
  connectingJournals: ConnectingJournal[];
  students: Student[];
  config: AppConfig;
  userRole?: 'admin' | 'guru';
  onSaveJournal: (journal: ConnectingJournal, isEdit: boolean) => void;
  onDeleteJournal: (id: string) => void;
  onRespondJournal: (id: string, responseNotes: string, caretakerName: string, caretakerNip?: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  askConfirm: (title: string, message: string) => Promise<boolean>;
}

export const ConnectingJournalTab: React.FC<ConnectingJournalTabProps> = ({
  connectingJournals,
  students,
  config,
  userRole = 'admin',
  onSaveJournal,
  onDeleteJournal,
  onRespondJournal,
  showToast,
  askConfirm
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [targetClassFilter, setTargetClassFilter] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  // Selection state
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>([]);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printScope, setPrintScope] = useState<'selected' | 'filtered' | 'all'>('filtered');
  const [printLayout, setPrintLayout] = useState<'table' | 'disposition'>('table');
  const [printTeacher, setPrintTeacher] = useState('all');
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);
  const [printTitle, setPrintTitle] = useState('JURNAL PENGHUBUNG MATERI');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<ConnectingJournal | null>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [respondingJournal, setRespondingJournal] = useState<ConnectingJournal | null>(null);


  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    id?: string;
    date: string;
    targetClass: string;
    studentId?: string;
    studentName?: string;
    subject: string;
    teacherName: string;
    teacherNip?: string;
    learningAchievement: string;
    taskOrder: string;
    deadline: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    targetClass: 'Klasikal (SD)',
    subject: 'Pend. Agama Islam',
    teacherName: 'ARI FITRIYANI, S.PD., GR.',
    teacherNip: '-',
    learningAchievement: '',
    taskOrder: '',
    deadline: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Form State for Caretaker Response
  const [responseData, setResponseData] = useState<{
    caretakerName: string;
    caretakerNip: string;
    responseDate: string;
    followUp: string;
  }>({
    caretakerName: config.waliAsuhList[0] || 'M ARDIAN NUGRAHA',
    caretakerNip: config.waliAsramaNip || '',
    responseDate: new Date().toISOString().split('T')[0],
    followUp: ''
  });

  // Subjects list
  const standardSubjects = [
    'Pend. Agama Islam',
    'Matematika',
    'Bahasa Indonesia',
    'IPAS',
    'Bahasa Inggris',
    'Pendidikan Pancasila',
    'Seni Budaya & Prakarya (SBdP)',
    'PJOK',
    'Tahsin & Tahfidz Quran',
    'Bimbingan Karakter / Konseling'
  ];

  // Distinct teachers list
  const availableTeachers = useMemo(() => {
    const set = new Set<string>();
    connectingJournals.forEach((j) => {
      if (j.teacherName) set.add(j.teacherName);
    });
    if (set.size === 0) set.add('ARI FITRIYANI, S.PD., GR.');
    return Array.from(set);
  }, [connectingJournals]);

  // Filtered Journals
  const filteredJournals = useMemo(() => {
    return connectingJournals.filter((j) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMateri = j.learningAchievement.toLowerCase().includes(q);
        const matchTask = (j.taskOrder || '').toLowerCase().includes(q);
        const matchSubject = j.subject.toLowerCase().includes(q);
        const matchTeacher = j.teacherName.toLowerCase().includes(q);
        const matchTarget = j.targetClass.toLowerCase().includes(q);
        const matchFollowUp = (j.followUp || '').toLowerCase().includes(q);
        const matchCaretaker = (j.caretakerName || '').toLowerCase().includes(q);
        if (
          !matchMateri &&
          !matchTask &&
          !matchSubject &&
          !matchTeacher &&
          !matchTarget &&
          !matchFollowUp &&
          !matchCaretaker
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'pending' && j.status !== 'Menunggu Respon') return false;
      if (statusFilter === 'resolved' && j.status !== 'Sudah Ditindaklanjuti') return false;

      // Target Class
      if (targetClassFilter !== 'all' && j.targetClass !== targetClassFilter) return false;

      // Subject
      if (selectedSubject !== 'all' && j.subject !== selectedSubject) return false;

      // Teacher
      if (selectedTeacher !== 'all' && j.teacherName !== selectedTeacher) return false;

      return true;
    });
  }, [connectingJournals, searchQuery, statusFilter, targetClassFilter, selectedSubject, selectedTeacher]);

  // Statistics
  const totalCount = connectingJournals.length;
  const pendingCount = connectingJournals.filter((j) => j.status === 'Menunggu Respon').length;
  const resolvedCount = connectingJournals.filter((j) => j.status === 'Sudah Ditindaklanjuti').length;
  const completionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Role permissions
  const isTeacher = userRole === 'guru';
  const isAdminOrCaretaker = userRole === 'admin';
  const canCreateTask = isTeacher; // Task order hanya guru
  const canRespond = isAdminOrCaretaker; // Respon hanya wali asuh / admin

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!canCreateTask) {
      showToast('Akses Dibatasi', 'Pembuatan Task Order dan Capaian Belajar hanya dapat dilakukan oleh akun Guru Pengampu.', 'warning');
      return;
    }
    setEditingJournal(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      targetClass: 'Klasikal (SD)',
      subject: 'Pend. Agama Islam',
      teacherName: availableTeachers[0] || 'ARI FITRIYANI, S.PD., GR.',
      teacherNip: '-',
      learningAchievement: '',
      taskOrder: '',
      deadline: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (journal: ConnectingJournal) => {
    if (!canCreateTask) {
      showToast('Akses Dibatasi', 'Pengeditan materi / task order hanya dapat dilakukan oleh akun Guru Pengampu.', 'warning');
      return;
    }
    setEditingJournal(journal);
    setFormData({
      id: journal.id,
      date: journal.date,
      targetClass: journal.targetClass,
      studentId: journal.studentId,
      studentName: journal.studentName,
      subject: journal.subject,
      teacherName: journal.teacherName,
      teacherNip: journal.teacherNip || '-',
      learningAchievement: journal.learningAchievement,
      taskOrder: journal.taskOrder || '',
      deadline: journal.deadline || journal.date,
      notes: journal.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  // Save Create / Edit
  const handleSubmitCreateOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.learningAchievement.trim()) {
      showToast('Form Belum Lengkap', 'Silakan masukkan deskripsi capaian materi pembelajaran.', 'warning');
      return;
    }

    const journalToSave: ConnectingJournal = {
      id: editingJournal ? editingJournal.id : `JP-${Date.now()}`,
      date: formData.date,
      targetClass: formData.targetClass,
      studentId: formData.studentId,
      studentName: formData.studentName,
      subject: formData.subject,
      teacherName: formData.teacherName,
      teacherNip: formData.teacherNip || '-',
      learningAchievement: formData.learningAchievement,
      taskOrder: formData.taskOrder,
      deadline: formData.deadline,
      followUp: editingJournal ? editingJournal.followUp : '',
      caretakerName: editingJournal ? editingJournal.caretakerName : '',
      caretakerNip: editingJournal ? editingJournal.caretakerNip : '',
      responseDate: editingJournal ? editingJournal.responseDate : '',
      status: editingJournal ? editingJournal.status : 'Menunggu Respon',
      notes: formData.notes
    };

    onSaveJournal(journalToSave, Boolean(editingJournal));
    setIsCreateModalOpen(false);
  };

  // Open Respond Modal (Wali Asuh)
  const handleOpenRespond = (journal: ConnectingJournal) => {
    if (!canRespond) {
      showToast(
        'Akses Terbatas',
        'Menu respon tindak lanjut hanya dapat diakses oleh Pengampu atau Admin Wali Asuh.',
        'warning'
      );
      return;
    }
    setRespondingJournal(journal);
    setResponseData({
      caretakerName: journal.caretakerName || config.waliAsuhList[0] || 'M ARDIAN NUGRAHA',
      caretakerNip: journal.caretakerNip || config.waliAsramaNip || '',
      responseDate: journal.responseDate || new Date().toISOString().split('T')[0],
      followUp: journal.followUp || ''
    });
    setIsRespondModalOpen(true);
  };

  // Submit Caretaker Response
  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingJournal) return;
    if (!responseData.followUp.trim()) {
      showToast('Respon Belum Diisi', 'Silakan isi catatan tindak lanjut bimbingan asrama.', 'warning');
      return;
    }

    onRespondJournal(
      respondingJournal.id,
      responseData.followUp,
      responseData.caretakerName,
      responseData.caretakerNip
    );
    setIsRespondModalOpen(false);
    showToast('Respon Disimpan', 'Tindak lanjut task order berhasil disimpan dan ditandai selesai.', 'success');
  };

  // Delete handler
  const handleDelete = async (journal: ConnectingJournal) => {
    const confirmed = await askConfirm(
      'Hapus Jurnal Penghubung',
      `Yakin ingin menghapus entri jurnal materi "${journal.subject} - ${journal.learningAchievement.slice(0, 30)}..."?`
    );
    if (!confirmed) return;
    onDeleteJournal(journal.id);
  };

  // Selection helpers
  const isAllFilteredSelected =
    filteredJournals.length > 0 &&
    filteredJournals.every((j) => selectedJournalIds.includes(j.id));

  const handleToggleSelect = (id: string) => {
    setSelectedJournalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // Deselect filtered
      const filteredIds = new Set(filteredJournals.map((j) => j.id));
      setSelectedJournalIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered
      const combined = new Set([...selectedJournalIds, ...filteredJournals.map((j) => j.id)]);
      setSelectedJournalIds(Array.from(combined));
    }
  };

  const handleSelectPendingOnly = () => {
    const pendingIds = filteredJournals.filter((j) => j.status === 'Menunggu Respon').map((j) => j.id);
    if (pendingIds.length === 0) {
      showToast('Info', 'Tidak ada task dengan status Menunggu Respon pada filter saat ini.', 'info');
      return;
    }
    const combined = new Set([...selectedJournalIds, ...pendingIds]);
    setSelectedJournalIds(Array.from(combined));
    showToast('Task Dipilih', `${pendingIds.length} task menunggu respon telah ditandai.`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedJournalIds([]);
  };

  // Print Single Task PDF (Lembar Disposisi Rinci A4 Portrait)
  const handlePrintSingleDisposition = async (journal: ConnectingJournal) => {
    try {
      showToast('Membuat Lembar Disposisi', `Menyiapkan berkas disposisi PDF untuk ${journal.subject}...`, 'info');
      await generateSingleConnectingJournalDispositionPDF(journal, config, {
        printDate: new Date().toISOString().split('T')[0]
      });
      showToast('Berhasil Diunduh', `Lembar disposisi ${journal.subject} berhasil dicetak.`, 'success');
    } catch (err: any) {
      console.error('Print Single Disposition Error:', err);
      showToast('Gagal Mencetak', err?.message || 'Terjadi kesalahan saat memproses dokumen PDF.', 'error');
    }
  };

  // Print Single Task PDF (Tabel Rekapitulasi A4 Landscape)
  const handlePrintSingleTable = async (journal: ConnectingJournal) => {
    try {
      showToast('Membuat Dokumen PDF', `Menyiapkan berkas tabel resmi untuk ${journal.subject}...`, 'info');
      await generateConnectingJournalPDF([journal], config, {
        teacherName: journal.teacherName,
        teacherNip: journal.teacherNip,
        printDate: new Date().toISOString().split('T')[0],
        title: 'JURNAL PENGHUBUNG MATERI'
      });
      showToast('Berhasil Diunduh', `Format berkas jurnal ${journal.subject} berhasil dicetak.`, 'success');
    } catch (err: any) {
      console.error('Print Single Table Error:', err);
      showToast('Gagal Mencetak', err?.message || 'Terjadi kesalahan saat memproses dokumen PDF.', 'error');
    }
  };

  // Open Print Configuration Modal
  const handleOpenPrintModal = (preselectedScope?: 'selected' | 'filtered' | 'all') => {
    if (preselectedScope === 'selected' || (selectedJournalIds.length > 0 && !preselectedScope)) {
      setPrintScope('selected');
    } else {
      setPrintScope('filtered');
    }
    setPrintTeacher(selectedTeacher !== 'all' ? selectedTeacher : 'all');
    setPrintDate(new Date().toISOString().split('T')[0]);
    setIsPrintModalOpen(true);
  };

  // Execute Print from Modal
  const handleExecutePrintModal = async () => {
    try {
      let targetList: ConnectingJournal[] = [];

      if (printScope === 'selected') {
        targetList = connectingJournals.filter((j) => selectedJournalIds.includes(j.id));
        if (targetList.length === 0) {
          showToast('Peringatan', 'Silakan pilih minimal 1 task order untuk dicetak.', 'warning');
          return;
        }
      } else if (printScope === 'filtered') {
        targetList = filteredJournals;
        if (targetList.length === 0) {
          showToast('Data Kosong', 'Tidak ada data pada filter saat ini untuk dicetak.', 'warning');
          return;
        }
      } else {
        targetList = connectingJournals;
        if (targetList.length === 0) {
          showToast('Data Kosong', 'Belum ada data jurnal penghubung tersimpan.', 'warning');
          return;
        }
      }

      // Filter by teacher if selected
      if (printTeacher !== 'all') {
        targetList = targetList.filter((j) => j.teacherName === printTeacher);
        if (targetList.length === 0) {
          showToast('Data Kosong', `Tidak ada data untuk guru "${printTeacher}".`, 'warning');
          return;
        }
      }

      setIsPrintModalOpen(false);

      if (printLayout === 'table') {
        // Landscape A4 Summary Table
        const firstTeacher = printTeacher !== 'all' ? printTeacher : targetList[0]?.teacherName;
        const teacherNip = targetList.find((j) => j.teacherName === firstTeacher)?.teacherNip || '-';

        showToast('Membuat Dokumen PDF', `Menyiapkan ${targetList.length} jurnal dalam format tabel resmi...`, 'info');
        await generateConnectingJournalPDF(targetList, config, {
          teacherName: firstTeacher,
          teacherNip: teacherNip,
          printDate: printDate,
          title: printTitle || 'JURNAL PENGHUBUNG MATERI'
        });
        showToast('Dokumen Siap', `Berhasil mencetak ${targetList.length} task ke format PDF Rekapitulasi.`, 'success');
      } else {
        // Single/Batch Disposition Sheets (Portrait A4)
        showToast('Membuat Dokumen PDF', `Menyiapkan ${targetList.length} lembar disposisi resmi...`, 'info');
        for (const journal of targetList) {
          await generateSingleConnectingJournalDispositionPDF(journal, config, {
            printDate: printDate
          });
        }
        showToast('Dokumen Siap', `Berhasil mencetak ${targetList.length} lembar disposisi task order.`, 'success');
      }
    } catch (err: any) {
      console.error('Execute Print Modal Error:', err);
      showToast('Gagal Mencetak PDF', err?.message || 'Terjadi kesalahan saat memproses file PDF.', 'error');
    }
  };

  // Export PDF (Full authentic format default)
  const handlePrintPDF = async (teacherFilterOverride?: string) => {
    handleOpenPrintModal('filtered');
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      selectedJournalIds.length > 0
        ? connectingJournals.filter((j) => selectedJournalIds.includes(j.id))
        : filteredJournals;

    if (listToExport.length === 0) {
      showToast('Data Kosong', 'Tidak ada data untuk diekspor.', 'warning');
      return;
    }
    const headers = ['No', 'Tanggal', 'Target/Kelas', 'Mata Pelajaran', 'Guru', 'Capaian Materi', 'Task Order Asrama', 'Tindak Lanjut', 'Wali Asuh', 'Status'];
    const rows = listToExport.map((j, i) => [
      i + 1,
      j.date,
      `"${j.targetClass || ''}"`,
      `"${j.subject || ''}"`,
      `"${j.teacherName || ''}"`,
      `"${j.learningAchievement.replace(/"/g, '""')}"`,
      `"${(j.taskOrder || '').replace(/"/g, '""')}"`,
      `"${(j.followUp || '').replace(/"/g, '""')}"`,
      `"${j.caretakerName || ''}"`,
      j.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jurnal_Penghubung_Materi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ekspor Berhasil', `${listToExport.length} data jurnal berhasil diunduh sebagai CSV.`, 'success');
  };


  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Jurnal Penghubung & Task Order
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    canRespond
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {canRespond ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-red-600" />
                      <span>Role: Pengampu / Admin Wali Asuh (Bisa Respon)</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3 h-3 text-amber-600" />
                      <span>Role: Guru Pengampu (Input Capaian Belajar)</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Komunikasi capaian belajar guru sekolah & respon tindak lanjut pendampingan belajar wali asuh asrama.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Ekspor data ke format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrintPDF()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Cetak format laporan resmi Jurnal Penghubung Materi PDF"
          >
            <Printer className="w-4 h-4 text-red-600" />
            <span>Cetak PDF Resmi</span>
          </button>

          {canCreateTask ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
              title="Buat Task Order / Input Capaian Belajar (Khusus Guru)"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Task Order / Capaian</span>
            </button>
          ) : (
            <div
              className="px-3.5 py-2 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 cursor-not-allowed select-none"
              title="Pembuatan Task Order hanya dapat dilakukan oleh role Guru Pengampu"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Buat Task (Khusus Guru)</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Jurnal & Tugas</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tercatat di sistem</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-800 font-medium">Menunggu Respon Asrama</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              {pendingCount > 0 && (
                <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-[11px] text-amber-600 mt-0.5">Perlu pendampingan malam ini</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-800 font-medium">Sudah Ditindaklanjuti</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{resolvedCount}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Tuntas direspon wali asuh</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tingkat Ketuntasan Respon</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</p>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-red-600 h-full rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, mapel, guru, wali asuh..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Perlu Respon ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Selesai ({resolvedCount})</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Target Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Target / Jenjang:</label>
            <select
              value={targetClassFilter}
              onChange={(e) => setTargetClassFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Target / Kelas</option>
              <option value="Klasikal (SD)">Klasikal (SD)</option>
              <option value="Klasikal (SMP)">Klasikal (SMP)</option>
              <option value="Klasikal (SMA)">Klasikal (SMA)</option>
              <option value="Kelas 1 SD">Kelas 1 SD</option>
              <option value="Kelas 2 SD">Kelas 2 SD</option>
              <option value="Kelas 3 SD">Kelas 3 SD</option>
              <option value="Kelas 4 SD">Kelas 4 SD</option>
              <option value="Kelas 5 SD">Kelas 5 SD</option>
              <option value="Kelas 6 SD">Kelas 6 SD</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mata Pelajaran:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {standardSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Guru Pengampu:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Guru</option>
              {availableTeachers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Selection & Quick Action Toolbar */}
      {filteredJournals.length > 0 && (
        <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900 px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-red-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua'} ({filteredJournals.length})
              </span>
            </button>

            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleSelectPendingOnly}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium hover:bg-amber-100 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Belum Direspon ({pendingCount})</span>
              </button>
            )}

            {selectedJournalIds.length > 0 && (
              <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg font-bold">
                {selectedJournalIds.length} task terpilih
              </span>
            )}
          </div>

          {selectedJournalIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenPrintModal('selected')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs shadow-red-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak ({selectedJournalIds.length}) Task Terpilih</span>
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content List & Table */}
      {filteredJournals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Data Jurnal Penghubung</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Belum ada catatan materi atau task order yang sesuai dengan kriteria filter pencarian Anda.
          </p>
          {canCreateTask && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Capaian Belajar Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJournals.map((journal, index) => {
            const isPending = journal.status === 'Menunggu Respon';
            const isSelected = selectedJournalIds.includes(journal.id);

            return (
              <div
                key={journal.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                  isSelected
                    ? 'border-red-400 ring-2 ring-red-500/20'
                    : isPending
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Card Row */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    {/* Checkbox selector */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(journal.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                      title={isSelected ? 'Hapus pilihan task ini' : 'Pilih task ini untuk dicetak/dikelola'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-red-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{journal.subject}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                          {journal.targetClass || 'Klasikal (SD)'}
                        </span>
                        {journal.studentName && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-medium">
                            Siswa: {journal.studentName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>Guru: <strong className="text-slate-700">{journal.teacherName}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateIndonesian(journal.date, true)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Menunggu Respon Wali Asuh</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sudah Ditindaklanjuti</span>
                        </>
                      )}
                    </span>

                    {/* Single Task Quick Print Button */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handlePrintSingleDisposition(journal)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Cetak Lembar Disposisi Resmi Task Ini (A4 Portrait)"
                      >
                        <Printer className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden md:inline">Cetak PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(journal)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Jurnal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(journal)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Jurnal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Capaian Materi & Task Order dari Guru */}
                  <div className="lg:col-span-6 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Capaian Materi Belajar:</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-800 font-medium leading-relaxed">
                        {journal.learningAchievement}
                      </div>
                    </div>

                    {journal.taskOrder && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Instruksi Penugasan / Task Order untuk Asrama:</span>
                        </div>
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
                          {journal.taskOrder}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Respon & Tindak Lanjut Wali Asuh di Asrama */}
                  <div className="lg:col-span-6 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>Tindak Lanjut & Respon Wali Asuh:</span>
                        </div>
                        {journal.responseDate && (
                          <span className="text-[11px] text-slate-400">
                            Respon: {formatDateShort(journal.responseDate)}
                          </span>
                        )}
                      </div>

                      {journal.followUp ? (
                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
                          <p className="text-xs text-emerald-950 leading-relaxed">
                            {journal.followUp}
                          </p>
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                            <span className="font-semibold">
                              Wali Asuh: {journal.caretakerName || '-'}
                            </span>
                            {journal.caretakerNip && (
                              <span className="text-emerald-700/80 text-[10px]">
                                {journal.caretakerNip}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                          <p className="text-xs text-slate-500 italic">
                            Belum ada respon tindak lanjut dari wali asuh asrama.
                          </p>
                          <p className="text-[11px] text-amber-700 font-medium">
                            Menunggu pendampingan belajar & konfirmasi malam ini.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Row with Print & Response */}
                    <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSingleDisposition(journal)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Cetak Lembar Disposisi Lengkap Resmi"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>Lembar Disposisi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintSingleTable(journal)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Cetak Format Rekapitulasi Tabel"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Tabel Rekap</span>
                        </button>
                      </div>

                      {canRespond ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRespond(journal)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                            isPending
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-95'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Beri Respon / Tindak Lanjut' : 'Ubah Respon Wali Asuh'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {isPending
                              ? 'Respon hanya dapat diisi oleh Pengampu / Admin Wali Asuh'
                              : `Telah direspon oleh: ${journal.caretakerName || 'Wali Asuh'}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* MODAL 1: TULIS CAPAIAN / BUAT TASK ORDER BARU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingJournal ? 'Edit Jurnal Penghubung & Tugas' : 'Tulis Capaian Belajar / Task Order'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Entri capaian materi pembelajaran untuk koordinasi dengan pengasuh asrama.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateOrEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tanggal */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembelajaran:</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Target / Jenjang */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target / Kelas:</label>
                  <select
                    value={formData.targetClass}
                    onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="Klasikal (SD)">Klasikal (SD)</option>
                    <option value="Klasikal (SMP)">Klasikal (SMP)</option>
                    <option value="Klasikal (SMA)">Klasikal (SMA)</option>
                    <option value="Kelas 1 SD">Kelas 1 SD</option>
                    <option value="Kelas 2 SD">Kelas 2 SD</option>
                    <option value="Kelas 3 SD">Kelas 3 SD</option>
                    <option value="Kelas 4 SD">Kelas 4 SD</option>
                    <option value="Kelas 5 SD">Kelas 5 SD</option>
                    <option value="Kelas 6 SD">Kelas 6 SD</option>
                    <option value="Asrama Dewantara">Asrama Dewantara</option>
                    <option value="Asrama Kartini">Asrama Kartini</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran:</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="misal: Pend. Agama Islam"
                    list="subjectSuggestions"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <datalist id="subjectSuggestions">
                    {standardSubjects.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* Nama Guru */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Guru Pengampu:</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="misal: ARI FITRIYANI, S.PD., GR."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Capaian Materi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Capaian Materi / Topik Pembelajaran: <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.learningAchievement}
                  onChange={(e) => setFormData({ ...formData, learningAchievement: e.target.value })}
                  placeholder="misal: tulis menulis huruf hijaiyah, pengenalan rukun iman, atau latihan berhitung dasar perkalian"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Task Order untuk Asrama */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instruksi Task Order / Tugas Pendampingan Asrama (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={formData.taskOrder}
                  onChange={(e) => setFormData({ ...formData, taskOrder: e.target.value })}
                  placeholder="misal: Mohon wali asuh mendampingi santri menghafal doa sehari-hari saat jam belajar malam dan memeriksa LKS no 1-10"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingJournal ? 'Simpan Perubahan' : 'Simpan & Kirim Task Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPON & TINDAK LANJUT WALI ASUH */}
      {isRespondModalOpen && respondingJournal && canRespond && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Respon & Tindak Lanjut Asrama
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfirmasi pendampingan belajar oleh wali asuh di lingkungan asrama.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRespondModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Summary Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{respondingJournal.subject}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                  {respondingJournal.targetClass}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Guru: <strong>{respondingJournal.teacherName}</strong> | Tanggal: {formatDateShort(respondingJournal.date)}
              </p>
              <div className="pt-1.5 border-t border-slate-200/60 text-slate-700">
                <p className="font-semibold text-slate-800 text-[11px]">Capaian Materi:</p>
                <p className="italic text-[11px] text-slate-600">{respondingJournal.learningAchievement}</p>
              </div>
              {respondingJournal.taskOrder && (
                <div className="pt-1 text-amber-800">
                  <p className="font-semibold text-[11px]">Instruksi Task Order:</p>
                  <p className="text-[11px]">{respondingJournal.taskOrder}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitResponse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Wali Asuh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wali Asuh Pendamping: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={responseData.caretakerName}
                    onChange={(e) => setResponseData({ ...responseData, caretakerName: e.target.value })}
                    list="waliAsuhSuggestions"
                    placeholder="misal: M ARDIAN NUGRAHA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <datalist id="waliAsuhSuggestions">
                    {config.waliAsuhList.map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </div>

                {/* Tanggal Respon */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Tindak Lanjut:</label>
                  <input
                    type="date"
                    required
                    value={responseData.responseDate}
                    onChange={(e) => setResponseData({ ...responseData, responseDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Catatan Tindak Lanjut / Respon */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tindak Lanjut / Hasil Bimbingan di Asrama: <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={responseData.followUp}
                  onChange={(e) => setResponseData({ ...responseData, followUp: e.target.value })}
                  placeholder="misal: Santri telah didampingi saat belajar mandiri asrama malam hari. Santri mampu menuliskan 5 kalimat dasar dan menyelesaikan hafalan doa harian."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRespondModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Respon & Selesaikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK PDF RESMI & PILIH TASK */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cetak Dokumen Resmi PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih target task order, format dokumen, dan tanda tangan pengesahan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Sumber Data (Scope) */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  1. Pilih Cakupan Task yang Dicetak:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintScope('selected')}
                    disabled={selectedJournalIds.length === 0}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      printScope === 'selected'
                        ? 'border-red-600 bg-red-50/60 text-red-950 ring-2 ring-red-500/20 font-semibold'
                        : selectedJournalIds.length === 0
                        ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center justify-between">
                      <span>Task Terpilih</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800">
                        {selectedJournalIds.length}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hanya task yang dicentang
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintScope('filtered')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      printScope === 'filtered'
                        ? 'border-red-600 bg-red-50/60 text-red-950 ring-2 ring-red-500/20 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center justify-between">
                      <span>Hasil Filter</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800">
                        {filteredJournals.length}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sesuai pencarian & filter
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintScope('all')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      printScope === 'all'
                        ? 'border-red-600 bg-red-50/60 text-red-950 ring-2 ring-red-500/20 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center justify-between">
                      <span>Semua Data</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800">
                        {connectingJournals.length}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Seluruh riwayat jurnal
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Format / Layout Dokumen */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  2. Pilih Format Tata Letak PDF:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPrintLayout('table')}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      printLayout === 'table'
                        ? 'border-red-600 bg-red-50/50 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${printLayout === 'table' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        <Printer className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Format Rekapitulasi Tabel (Landscape A4)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Format resmi matriks tabel horizontal sesuai standar Kemensos dengan kolom Capaian, Task Order, dan Tindak Lanjut Wali Asuh.
                    </p>
                  </div>

                  <div
                    onClick={() => setPrintLayout('disposition')}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      printLayout === 'disposition'
                        ? 'border-red-600 bg-red-50/50 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${printLayout === 'disposition' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Lembar Disposisi Resmi (Portrait A4)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Lembar disposisi rinci per task order dengan QR Code verifikasi, rincian instruksi asrama, serta tanda tangan guru & pengasuh.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Parameter Tambahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Filter Guru Pengampu:
                  </label>
                  <select
                    value={printTeacher}
                    onChange={(e) => setPrintTeacher(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="all">Semua Guru Pengampu</option>
                    {availableTeachers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengesahan Dokumen:
                  </label>
                  <input
                    type="date"
                    value={printDate}
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePrintModal}
                className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Unduh Dokumen PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

