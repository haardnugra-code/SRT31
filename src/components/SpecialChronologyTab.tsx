import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  Printer,
  Building2,
  UserCheck,
  FileText,
  X,
  Check,
  RotateCcw,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import {
  Student,
  Violation,
  AppConfig,
  SpecialChronologyCase,
  ShiftType,
  ShiftPriority,
  ShiftHandoverStatus
} from '../types';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import { consolidateDormList } from '../utils/dormHelper';
import {
  generateSpecialChronologyPDF,
  generateAllShiftHandoverPDF
} from '../services/pdfGenerator';

interface SpecialChronologyTabProps {
  students: Student[];
  violations: Violation[];
  cases: SpecialChronologyCase[];
  config: AppConfig;
  onSaveCase: (caseItem: SpecialChronologyCase, isEdit: boolean) => void;
  onDeleteCase: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  initialCaseId?: string;
  initialStudentIdForNewCase?: string;
}

const SHIFT_OPTIONS: { label: ShiftType; timeRange: string; icon: typeof Sun; color: string }[] = [
  { label: 'Shift Pagi (06.00 - 14.00)', timeRange: '06.00 - 14.00 WIB', icon: Sun, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { label: 'Shift Siang (14.00 - 22.00)', timeRange: '14.00 - 22.00 WIB', icon: Sunset, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { label: 'Shift Malam (22.00 - 06.00)', timeRange: '22.00 - 06.00 WIB', icon: Moon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

export const SpecialChronologyTab: React.FC<SpecialChronologyTabProps> = ({
  students,
  cases,
  config,
  onSaveCase,
  onDeleteCase,
  onShowToast,
  onAskConfirm,
  initialCaseId,
  initialStudentIdForNewCase
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'pagi' | 'siang' | 'malam'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Biasa' | 'Perhatian' | 'Mendesak'>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecialChronologyCase | null>(null);

  // Form States
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [formShift, setFormShift] = useState<ShiftType>('Shift Pagi (06.00 - 14.00)');
  const [formOfficer, setFormOfficer] = useState<string>(
    config?.waliAsuhList?.[0] || 'M ARDIAN NUGRAHA'
  );
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDorm, setFormDorm] = useState<string>('Semua Asrama');
  const [formHasStudent, setFormHasStudent] = useState<boolean>(false);
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formPriority, setFormPriority] = useState<ShiftPriority>('Biasa');
  const [formIncident, setFormIncident] = useState<string>('');
  const [formHandover, setFormHandover] = useState<string>('');
  const [formStatus, setFormStatus] = useState<ShiftHandoverStatus>('Perlu Tindak Lanjut');
  const [formIncomingOfficer, setFormIncomingOfficer] = useState<string>('');

  // Quick Handover Mark Modal (for entering incoming officer name when closing)
  const [closingCase, setClosingCase] = useState<SpecialChronologyCase | null>(null);
  const [quickIncomingOfficer, setQuickIncomingOfficer] = useState<string>('');

  // Consolidated dorm list for filters & dropdown
  const availableDorms = useMemo(() => {
    const list = consolidateDormList(config?.dormList || []);
    return list.length > 0 ? list : ['Asrama Dewantara', 'Asrama Pattimura', 'Asrama Teuku Umar', 'Asrama Cut Nyak Dien'];
  }, [config?.dormList]);

  // Open modal if initial case is provided
  React.useEffect(() => {
    if (initialStudentIdForNewCase) {
      setFormHasStudent(true);
      setFormStudentId(initialStudentIdForNewCase);
      setIsModalOpen(true);
    }
  }, [initialStudentIdForNewCase]);

  // Reset form when opening new
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime(new Date().toTimeString().slice(0, 5));
    
    // Auto-detect current shift based on current hour
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 14) {
      setFormShift('Shift Pagi (06.00 - 14.00)');
    } else if (currentHour >= 14 && currentHour < 22) {
      setFormShift('Shift Siang (14.00 - 22.00)');
    } else {
      setFormShift('Shift Malam (22.00 - 06.00)');
    }

    setFormOfficer(config?.waliAsuhList?.[0] || 'M ARDIAN NUGRAHA');
    setFormTitle('');
    setFormDorm('Semua Asrama');
    setFormHasStudent(false);
    setFormStudentId('');
    setFormPriority('Biasa');
    setFormIncident('');
    setFormHandover('');
    setFormStatus('Perlu Tindak Lanjut');
    setFormIncomingOfficer('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (item: SpecialChronologyCase) => {
    setEditingItem(item);
    setFormDate(item.incidentDate || new Date().toISOString().split('T')[0]);
    setFormTime(item.incidentTime || '08:00');
    
    // Normalize shift
    const matchedShift = SHIFT_OPTIONS.find((s) => s.label === item.shiftType || s.label === item.caseCategory);
    setFormShift(matchedShift ? matchedShift.label : 'Shift Pagi (06.00 - 14.00)');

    setFormOfficer(item.primaryInvestigator || config?.waliAsuhList?.[0] || 'M ARDIAN NUGRAHA');
    setFormTitle(item.caseTitle || '');
    setFormDorm(item.dorm || 'Semua Asrama');
    
    if (item.studentId || item.studentName) {
      setFormHasStudent(true);
      setFormStudentId(item.studentId || '');
    } else {
      setFormHasStudent(false);
      setFormStudentId('');
    }

    // Normalize priority
    if (String(item.caseSeverity).includes('Mendesak') || String(item.caseSeverity).includes('Kritis') || String(item.caseSeverity).includes('Tinggi')) {
      setFormPriority('Mendesak');
    } else if (String(item.caseSeverity).includes('Perhatian') || String(item.caseSeverity).includes('Sedang')) {
      setFormPriority('Perhatian');
    } else {
      setFormPriority('Biasa');
    }

    setFormIncident(item.initialAssessmentSummary || '');
    setFormHandover(item.handoverNotes || item.shifts?.[0]?.handoverNotes || '');
    
    const isDone = String(item.status).includes('Selesai') || String(item.status).includes('Resolusi');
    setFormStatus(isDone ? 'Selesai / Diterima' : 'Perlu Tindak Lanjut');
    setFormIncomingOfficer(item.incomingOfficer || '');
    setIsModalOpen(true);
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      onShowToast('Judul Kejadian Diperlukan', 'Harap isi pokok kejadian atau topik tugas shift.', 'warning');
      return;
    }

    if (!formIncident.trim() && !formHandover.trim()) {
      onShowToast('Uraian Diperlukan', 'Harap isi uraian kejadian atau pesan tugas handover ke shift berikutnya.', 'warning');
      return;
    }

    const selectedStudent = formHasStudent && formStudentId
      ? students.find((s) => s.id === formStudentId)
      : null;

    const caseItem: SpecialChronologyCase = {
      id: editingItem ? editingItem.id : `SHIFT-${Date.now().toString().slice(-6)}`,
      caseTitle: formTitle.trim(),
      incidentDate: formDate,
      incidentTime: formTime,
      shiftType: formShift,
      caseCategory: formShift,
      caseSeverity: formPriority,
      status: formStatus,
      primaryInvestigator: formOfficer.trim(),
      incomingOfficer: formIncomingOfficer.trim() || undefined,
      dorm: formDorm,
      studentId: selectedStudent?.id,
      studentName: selectedStudent?.name,
      class: selectedStudent?.class,
      initialAssessmentSummary: formIncident.trim(),
      handoverNotes: formHandover.trim(),
      shifts: editingItem?.shifts || [],
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveCase(caseItem, !!editingItem);
    setIsModalOpen(false);
  };

  // Quick toggle status
  const handleQuickStatusToggle = (item: SpecialChronologyCase) => {
    const isCompleted = String(item.status).includes('Selesai') || String(item.status).includes('Resolusi');
    if (!isCompleted) {
      // Prompt for incoming officer name if not set
      setClosingCase(item);
      setQuickIncomingOfficer(item.incomingOfficer || config?.waliAsuhList?.[1] || config?.waliAsuhList?.[0] || '');
    } else {
      // Reopen to pending
      const updated: SpecialChronologyCase = {
        ...item,
        status: 'Perlu Tindak Lanjut',
        updatedAt: new Date().toISOString()
      };
      onSaveCase(updated, true);
      onShowToast('Status Diperbarui', 'Catatan dikembalikan ke status "Perlu Tindak Lanjut".', 'success');
    }
  };

  const handleConfirmCloseHandover = () => {
    if (!closingCase) return;
    const updated: SpecialChronologyCase = {
      ...closingCase,
      status: 'Selesai / Diterima',
      incomingOfficer: quickIncomingOfficer.trim() || 'Petugas Shift Berikutnya',
      updatedAt: new Date().toISOString()
    };
    onSaveCase(updated, true);
    setClosingCase(null);
    onShowToast('Handover Diterima', 'Catatan telah ditandai selesai dan diterima oleh petugas shift berikutnya.', 'success');
  };

  // Delete handler
  const handleDelete = async (item: SpecialChronologyCase) => {
    const confirmed = await onAskConfirm(
      'Hapus Catatan Shift?',
      `Apakah Anda yakin ingin menghapus catatan shift "${item.caseTitle}" tanggal ${formatDateShort(item.incidentDate)}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (confirmed) {
      onDeleteCase(item.id);
      onShowToast('Catatan Dihapus', 'Catatan shift berhasil dihapus.', 'success');
    }
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Shift filter
      if (shiftFilter !== 'all') {
        const text = `${c.shiftType || ''} ${c.caseCategory || ''}`.toLowerCase();
        if (!text.includes(shiftFilter)) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isDone = String(c.status).includes('Selesai') || String(c.status).includes('Resolusi');
        if (statusFilter === 'pending' && isDone) return false;
        if (statusFilter === 'completed' && !isDone) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        const sev = String(c.caseSeverity);
        if (priorityFilter === 'Mendesak' && !(sev.includes('Mendesak') || sev.includes('Tinggi') || sev.includes('Kritis'))) return false;
        if (priorityFilter === 'Perhatian' && !(sev.includes('Perhatian') || sev.includes('Sedang'))) return false;
        if (priorityFilter === 'Biasa' && (sev.includes('Mendesak') || sev.includes('Tinggi') || sev.includes('Perhatian'))) return false;
      }

      // Dorm filter
      if (dormFilter !== 'all') {
        if (c.dorm !== dormFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.caseTitle?.toLowerCase().includes(q);
        const matchOfficer = c.primaryInvestigator?.toLowerCase().includes(q);
        const matchIncident = c.initialAssessmentSummary?.toLowerCase().includes(q);
        const matchHandover = c.handoverNotes?.toLowerCase().includes(q);
        const matchStudent = c.studentName?.toLowerCase().includes(q);
        const matchDorm = c.dorm?.toLowerCase().includes(q);
        if (!matchTitle && !matchOfficer && !matchIncident && !matchHandover && !matchStudent && !matchDorm) {
          return false;
        }
      }

      return true;
    });
  }, [cases, shiftFilter, statusFilter, priorityFilter, dormFilter, searchQuery]);

  // Summary counts
  const stats = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter((c) => !String(c.status).includes('Selesai') && !String(c.status).includes('Resolusi')).length;
    const completed = total - pending;
    const urgent = cases.filter(
      (c) =>
        String(c.caseSeverity).includes('Mendesak') ||
        String(c.caseSeverity).includes('Tinggi') ||
        String(c.caseSeverity).includes('Kritis')
    ).length;
    return { total, pending, completed, urgent };
  }, [cases]);

  return (
    <div id="shift-handover-module" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  Buku Jurnal & Handover Shift Asrama
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan kejadian penting selama jam jaga dinas dan serah terima tugas ke petugas shift berikutnya.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {cases.length > 0 && (
              <button
                id="btn-print-all-handover"
                onClick={() => generateAllShiftHandoverPDF(filteredCases, config)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Cetak rekap seluruh catatan shift yang terfilter"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Cetak Rekap PDF
              </button>
            )}

            <button
              id="btn-create-shift-handover"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Kejadian & Handover
            </button>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Catatan Shift</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-800 block">Perlu Tindak Lanjut</span>
              {stats.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <span className="text-lg font-bold text-amber-900 mt-0.5 block">{stats.pending}</span>
          </div>
          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200/60">
            <span className="text-[11px] font-medium text-emerald-800 block">Selesai / Diterima</span>
            <span className="text-lg font-bold text-emerald-900 mt-0.5 block">{stats.completed}</span>
          </div>
          <div className="bg-rose-50/70 rounded-lg p-3 border border-rose-200/60">
            <span className="text-[11px] font-medium text-rose-800 block">Prioritas Mendesak</span>
            <span className="text-lg font-bold text-rose-900 mt-0.5 block">{stats.urgent}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-handover"
              type="text"
              placeholder="Cari judul kejadian, isi kejadian, pesan handover, petugas, atau nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 whitespace-nowrap mr-1 font-medium">Shift:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pagi', label: 'Pagi' },
              { id: 'siang', label: 'Siang' },
              { id: 'malam', label: 'Malam' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setShiftFilter(s.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  shiftFilter === s.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Perlu Tindak Lanjut</option>
              <option value="completed">Selesai / Diterima</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-500 font-medium">Prioritas:</span>
            <select
              id="select-filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="Biasa">Biasa</option>
              <option value="Perhatian">Perhatian</option>
              <option value="Mendesak">Mendesak</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-500 font-medium">Asrama:</span>
            <select
              id="select-filter-dorm"
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Asrama</option>
              {availableDorms.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || shiftFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || dormFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShiftFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setDormFilter('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-auto flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Incident & Handover Feed */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              {cases.length === 0
                ? 'Belum Ada Catatan Kejadian & Handover Shift'
                : 'Tidak Ditemukan Catatan yang Sesuai Filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {cases.length === 0
                ? 'Catat kejadian penting selama dinas jaga dan titipkan tugas serah terima (handover) kepada petugas shift berikutnya secara rapi dan transparan.'
                : 'Coba ubah kata kunci pencarian atau sesuaikan opsi filter shift/status di atas.'}
            </p>
            <button
              id="btn-empty-create-handover"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Kejadian & Handover Sekarang
            </button>
          </div>
        ) : (
          filteredCases.map((item) => {
            const isCompleted =
              String(item.status).includes('Selesai') || String(item.status).includes('Resolusi');
            const isUrgent =
              String(item.caseSeverity).includes('Mendesak') ||
              String(item.caseSeverity).includes('Tinggi') ||
              String(item.caseSeverity).includes('Kritis');
            const isWarning =
              String(item.caseSeverity).includes('Perhatian') ||
              String(item.caseSeverity).includes('Sedang');

            // Shift theme
            const isPagi = String(item.shiftType || item.caseCategory).toLowerCase().includes('pagi');
            const isSiang = String(item.shiftType || item.caseCategory).toLowerCase().includes('siang');

            const shiftBadgeClass = isPagi
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : isSiang
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200';

            const ShiftIcon = isPagi ? Sun : isSiang ? Sunset : Moon;

            return (
              <div
                key={item.id}
                id={`shift-card-${item.id}`}
                className={`bg-white rounded-xl border transition-shadow duration-200 shadow-sm hover:shadow-md overflow-hidden ${
                  isUrgent
                    ? 'border-rose-300'
                    : isCompleted
                    ? 'border-slate-200 opacity-95'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    {/* Shift & Time meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${shiftBadgeClass}`}>
                        <ShiftIcon className="w-3.5 h-3.5" />
                        {item.shiftType || item.caseCategory || 'Shift Dinas'}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateIndonesian(item.incidentDate)}</span>
                        {item.incidentTime && (
                          <>
                            <span className="text-slate-300">•</span>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.incidentTime} WIB</span>
                          </>
                        )}
                      </div>

                      {/* Priority Badge */}
                      {isUrgent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Mendesak
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Perhatian
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          Biasa
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Selesai / Diterima
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Perlu Tindak Lanjut
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Key Meta */}
                  <div className="mt-3">
                    <h2 className="text-base font-bold text-slate-800 leading-snug">
                      {item.caseTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Petugas Jaga: <strong className="text-slate-700">{item.primaryInvestigator}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Lokasi: <span className="text-slate-700">{item.dorm || 'Semua Asrama'}</span>
                        </span>
                      </div>

                      {item.studentName && (
                        <div className="flex items-center gap-1.5 bg-indigo-50/70 text-indigo-800 px-2 py-0.5 rounded border border-indigo-100">
                          <UserCheck className="w-3 h-3 text-indigo-600" />
                          <span>
                            Siswa: <strong>{item.studentName}</strong> {item.class ? `(${item.class})` : ''}
                          </span>
                        </div>
                      )}

                      {item.incomingOfficer && (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Check className="w-3.5 h-3.5" />
                          <span>Diterima oleh: <strong>{item.incomingOfficer}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content: Kejadian & Handover Sections */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* 1. Kejadian / Situasi Selama Shift */}
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                      <span>Uraian Kejadian / Situasi Selama Shift:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-5.5">
                      {item.initialAssessmentSummary || 'Tidak ada kejadian khusus, asrama berjalan tertib dan aman.'}
                    </p>
                  </div>

                  {/* 2. Handover Tugas ke Shift Berikutnya */}
                  <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-200/90 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                      <ArrowRight className="w-4 h-4 text-amber-700" />
                      <span>📌 Tugas / Serah Terima (Handover) ke Shift Berikutnya:</span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed whitespace-pre-wrap pl-5.5">
                      {item.handoverNotes || item.shifts?.[0]?.handoverNotes || 'Tidak ada instruksi khusus untuk shift selanjutnya.'}
                    </p>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Quick Status Toggle Button */}
                    <button
                      id={`btn-toggle-status-${item.id}`}
                      onClick={() => handleQuickStatusToggle(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Buka Kembali (Perlu Tindak Lanjut)
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Tandai Diterima / Selesai
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Print single PDF */}
                    <button
                      id={`btn-print-single-${item.id}`}
                      onClick={() => generateSpecialChronologyPDF(item, config)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Cetak Berita Acara & Lembar Serah Terima Shift"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Cetak Lembar Handover
                    </button>

                    {/* Edit */}
                    <button
                      id={`btn-edit-${item.id}`}
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Catatan Shift"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      id={`btn-delete-${item.id}`}
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Catatan Shift"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Form Catat Kejadian & Handover (Simple, Fast, Clean) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingItem ? 'Edit Catatan Kejadian & Handover' : 'Catat Kejadian & Handover Shift'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dokumentasikan peristiwa penting dinas dan instruksi serah terima tugas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Row 1: Tanggal, Waktu & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Dinas *
                  </label>
                  <input
                    id="form-date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu / Jam *
                  </label>
                  <input
                    id="form-time"
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilihan Shift *
                  </label>
                  <select
                    id="form-shift"
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                  >
                    {SHIFT_OPTIONS.map((s) => (
                      <option key={s.label} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Petugas Jaga & Prioritas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Shift Jaga (Yang Menyerahkan) *
                  </label>
                  <input
                    id="form-officer"
                    type="text"
                    required
                    list="wali-asuh-suggestions"
                    placeholder="Nama wali asuh / petugas piket"
                    value={formOfficer}
                    onChange={(e) => setFormOfficer(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <datalist id="wali-asuh-suggestions">
                    {config?.waliAsuhList?.map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Prioritas
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Biasa', 'Perhatian', 'Mendesak'] as ShiftPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p)}
                        className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                          formPriority === p
                            ? p === 'Mendesak'
                              ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20'
                              : p === 'Perhatian'
                              ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Judul & Lokasi Asrama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Kejadian / Pokok Bahasan *
                  </label>
                  <input
                    id="form-title"
                    type="text"
                    required
                    placeholder="Contoh: Keributan jam malam, Siswa sakit demam, Pengecekan kamar..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Asrama
                  </label>
                  <select
                    id="form-dorm"
                    value={formDorm}
                    onChange={(e) => setFormDorm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Semua Asrama">Semua Asrama / Terpadu</option>
                    {availableDorms.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Siswa Terkait */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="form-checkbox-has-student"
                    type="checkbox"
                    checked={formHasStudent}
                    onChange={(e) => setFormHasStudent(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Kejadian ini terkait dengan Siswa / Siswa tertentu?
                  </span>
                </label>

                {formHasStudent && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                    <select
                      id="form-select-student"
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Pilih Nama Siswa Terkait --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Kelas {s.class} • {s.dorm})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Textarea 1: Uraian Kejadian */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Uraian Kejadian / Kondisi Selama Shift *
                </label>
                <textarea
                  id="form-incident"
                  rows={3}
                  required
                  placeholder="Ceritakan peristiwa atau kondisi yang terjadi selama shift, tindakan awal yang sudah dilakukan oleh petugas jaga..."
                  value={formIncident}
                  onChange={(e) => setFormIncident(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Textarea 2: Handover ke Shift Berikutnya */}
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/70">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  2. Tugas & Serah Terima (Handover ke Shift Berikutnya) *
                </label>
                <textarea
                  id="form-handover"
                  rows={3}
                  required
                  placeholder="Catat instruksi tugas yang harus dilanjutkan, dipantau, atau diselesaikan oleh petugas shift selanjutnya..."
                  value={formHandover}
                  onChange={(e) => setFormHandover(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                />
              </div>

              {/* Row 4: Status Handover & Petugas Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Handover
                  </label>
                  <select
                    id="form-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ShiftHandoverStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                  >
                    <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut (Pending)</option>
                    <option value="Selesai / Diterima">Selesai / Sudah Diterima</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Penerima Handover (Opsional)
                  </label>
                  <input
                    id="form-incoming-officer"
                    type="text"
                    list="wali-asuh-suggestions"
                    placeholder="Nama petugas shift penerima (jika sudah serah terima)"
                    value={formIncomingOfficer}
                    onChange={(e) => setFormIncomingOfficer(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-shift-handover"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Catatan & Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL: Selesaikan / Terima Handover */}
      {closingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>Konfirmasi Penerimaan Handover</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Tandai bahwa tugas / catatan handover untuk <strong>"{closingCase.caseTitle}"</strong> telah diterima dan ditindaklanjuti.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Petugas Penerima Shift:
                </label>
                <input
                  type="text"
                  required
                  list="wali-asuh-suggestions"
                  placeholder="Nama petugas shift yang menerima"
                  value={quickIncomingOfficer}
                  onChange={(e) => setQuickIncomingOfficer(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingCase(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-accept-handover"
                  type="button"
                  onClick={handleConfirmCloseHandover}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Tandai Selesai & Diterima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
