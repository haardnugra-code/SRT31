import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Sliders,
  FileSpreadsheet,
  Signature,
  Image as ImageIcon,
  Server,
  Save,
  Link as LinkIcon,
  X,
  ShieldCheck,
  AlertCircle,
  Code,
  Copy,
  Check,
  Database,
  Sparkles,
  ExternalLink,
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Megaphone,
  TableProperties
} from 'lucide-react';
import {
  AppConfig,
  DisciplineLevelConfig,
  DisciplineStatusThreshold,
  ViolationTemplateItem,
  ReportCategory,
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  MedicalRecord,
  PrayerAttendance,
  ReportCardData
} from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleAppsScriptCode';
import { DEFAULT_DISCIPLINE_LEVELS, DEFAULT_DISCIPLINE_THRESHOLDS, VIOLATION_TEMPLATES } from '../services/storage';
import { RAPOR_STRUCTURE } from '../services/pdfGenerator';
import { ShadowDataAuditStats } from '../utils/dataSanitizer';
import { DatabaseCrudManager } from './DatabaseCrudManager';

interface SettingsTabProps {
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  lastSyncTime?: string | null;
  onSync?: () => void;
  isSyncing?: boolean;
  onReconcileShadowData?: (purgeOrphans: boolean) => Promise<ShadowDataAuditStats>;
  onPurgeDummyDataAndReload?: () => void;
  studentsCount?: number;
  recordsCount?: number;
  announcement?: string;
  onUpdateAnnouncement?: (msg: string) => void;
  meetingMinutes?: any[];
  onSaveMinute?: (minute: any, isEdit: boolean) => void;
  onDeleteMinute?: (id: string) => void;

  // CRUD Database Props
  students?: Student[];
  onSaveStudent?: (student: Student, isEdit: boolean) => void;
  onDeleteStudent?: (id: string) => void;

  violations?: Violation[];
  onSaveViolation?: (violation: Violation, isEdit: boolean) => void;
  onDeleteViolation?: (id: string) => void;

  counseling?: Counseling[];
  onSaveCounseling?: (counseling: Counseling, isEdit: boolean) => void;
  onDeleteCounseling?: (id: string) => void;

  leaves?: Leave[];
  onSaveLeave?: (leave: Leave, isEdit: boolean) => void;
  onDeleteLeave?: (id: string) => void;

  dailyJournals?: DailyJournal[];
  onSaveJournal?: (journal: DailyJournal) => void;
  onDeleteJournal?: (id: string) => void;

  medicalRecords?: MedicalRecord[];
  onSaveMedicalRecord?: (record: MedicalRecord) => void;
  onDeleteMedicalRecord?: (id: string) => void;

  reports?: Record<string, ReportCardData>;
  onSaveReport?: (studentId: string, data: ReportCardData) => void;
  onDeleteReport?: (studentId: string) => void;

  prayerAttendance?: PrayerAttendance[];
  onSavePrayerAttendance?: (records: PrayerAttendance[]) => void;
  onDeletePrayerAttendance?: (id: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
  onShowToast,
  lastSyncTime,
  onSync,
  isSyncing = false,
  onReconcileShadowData,
  onPurgeDummyDataAndReload,
  studentsCount = 0,
  recordsCount = 0,
  announcement = '',
  onUpdateAnnouncement,
  students = [],
  onSaveStudent = () => {},
  onDeleteStudent = () => {},
  violations = [],
  onSaveViolation = () => {},
  onDeleteViolation = () => {},
  counseling = [],
  onSaveCounseling = () => {},
  onDeleteCounseling = () => {},
  leaves = [],
  onSaveLeave = () => {},
  onDeleteLeave = () => {},
  dailyJournals = [],
  onSaveJournal = () => {},
  onDeleteJournal = () => {},
  medicalRecords = [],
  onSaveMedicalRecord = () => {},
  onDeleteMedicalRecord = () => {},
  reports = {},
  onSaveReport = () => {},
  onDeleteReport = () => {},
  prayerAttendance = [],
  onSavePrayerAttendance = () => {},
  onDeletePrayerAttendance = () => {}
}) => {
  const [activeSettingsView, setActiveSettingsView] = useState<'general' | 'database'>('general');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockPin, setUnlockPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Form State
  const [kopKiri, setKopKiri] = useState<string>(config.kopKiri);
  const [kopKanan, setKopKanan] = useState<string>(config.kopKanan);
  const [kepalaSekolah, setKepalaSekolah] = useState<string>(config.kepalaSekolah);
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState<string>(config.kepalaSekolahNip);
  const [waliAsrama, setWaliAsrama] = useState<string>(config.waliAsrama);
  const [waliAsramaNip, setWaliAsramaNip] = useState<string>(config.waliAsramaNip);
  const [waliAsramaTitle, setWaliAsramaTitle] = useState<string>(config.waliAsramaTitle || 'Wali Asrama Mandiri');
  const [logoKiriUrl, setLogoKiriUrl] = useState<string>(config.logoKiriUrl);
  const [logoKananUrl, setLogoKananUrl] = useState<string>(config.logoKananUrl);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(config.watermarkOpacity);
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(config.googleScriptUrl);
  const [waliAsuhText, setWaliAsuhText] = useState<string>(config.waliAsuhList.join('\n'));
  const [dormText, setDormText] = useState<string>(config.dormList.join('\n'));
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(config.semester || 'Genap');
  const [academicYear, setAcademicYear] = useState<string>(config.academicYear || '2025/2026');

  // Announcement State
  const [announcementText, setAnnouncementText] = useState<string>(announcement);

  React.useEffect(() => {
    if (announcement) {
      setAnnouncementText(announcement);
    }
  }, [announcement]);

  // Discipline & Violation Custom Config State
  const [autoResetPoints, setAutoResetPoints] = useState<boolean>(
    config.autoResetPointsPerSemester !== false
  );
  const [disciplineLevels, setDisciplineLevels] = useState<DisciplineLevelConfig[]>(
    config.disciplineLevels || DEFAULT_DISCIPLINE_LEVELS
  );
  const [disciplineThresholds, setDisciplineThresholds] = useState<DisciplineStatusThreshold[]>(
    config.disciplineThresholds || DEFAULT_DISCIPLINE_THRESHOLDS
  );
  const [customTemplates, setCustomTemplates] = useState<Record<number, ViolationTemplateItem[]>>(
    config.violationTemplatesCustom || VIOLATION_TEMPLATES
  );

  // Custom Report Structure State
  const [customRaporStructure, setCustomRaporStructure] = useState<ReportCategory[]>(
    config.raporStructureCustom && config.raporStructureCustom.length > 0
      ? config.raporStructureCustom
      : RAPOR_STRUCTURE
  );
  const [selectedRaporCatIndex, setSelectedRaporCatIndex] = useState<number>(0);
  const [newRaporIndicatorText, setNewRaporIndicatorText] = useState<string>('');
  const [editingRaporIndicatorIdx, setEditingRaporIndicatorIdx] = useState<number | null>(null);
  const [editingRaporIndicatorText, setEditingRaporIndicatorText] = useState<string>('');
  const [newCatName, setNewCatName] = useState<string>('');
  const [isAddingNewCat, setIsAddingNewCat] = useState<boolean>(false);

  // Selected level for violation template editing tab
  const [selectedTemplateLevel, setSelectedTemplateLevel] = useState<number>(1);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateExplanation, setNewTemplateExplanation] = useState('');
  const [newTemplateSanction, setNewTemplateSanction] = useState('');

  // Script Modal State
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Shadow Data Prevention State
  const [purgeOrphans, setPurgeOrphans] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [lastAuditStats, setLastAuditStats] = useState<ShadowDataAuditStats | null>(null);

  const handleRunReconcileShadow = async () => {
    if (!onReconcileShadowData) return;
    setIsReconciling(true);
    try {
      const stats = await onReconcileShadowData(purgeOrphans);
      setLastAuditStats(stats);
    } catch (e) {
      onShowToast('Gagal Rekonsiliasi', 'Terjadi kesalahan saat pembersihan data shadow.', 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  // 7-Day Cloud Sync Status & Reminder Calculation
  const daysSinceSync = useMemo(() => {
    if (!lastSyncTime) return null;
    const lastDate = new Date(lastSyncTime).getTime();
    if (isNaN(lastDate)) return null;
    const diff = Date.now() - lastDate;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [lastSyncTime]);

  const isSyncOverdue = daysSinceSync === null || daysSinceSync >= 7;

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTime) return 'Belum pernah dilakukan';
    try {
      const d = new Date(lastSyncTime);
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) + ' WIB'
      );
    } catch (e) {
      return 'Belum pernah dilakukan';
    }
  }, [lastSyncTime]);

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    onShowToast('Kode Disalin!', 'Seluruh kode Google Apps Script telah disalin ke clipboard.', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleRunSetupSheet = async () => {
    if (!googleScriptUrl.trim()) {
      onShowToast('Koneksi Gagal', 'Masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }
    onShowToast('Memproses Setup Sheet...', 'Mengirim perintah setupSheet ke Google Spreadsheet...', 'warning');
    try {
      await fetch(`${googleScriptUrl.trim()}?action=setupSheet`, {
        method: 'GET',
        mode: 'no-cors'
      });
      onShowToast('Setup Sheet Terkirim', 'Perintah setupSheet berhasil dikirim. Tab & Header Google Sheet otomatis dibuat/disesuaikan.', 'success');
    } catch (e) {
      onShowToast('Gagal Setup Sheet', 'Gagal menghubungi Google Apps Script. Periksa koneksi atau URL script Anda.', 'error');
    }
  };

  const handleTriggerDriveBackup = async () => {
    if (!googleScriptUrl.trim()) {
      onShowToast('Koneksi Gagal', 'Masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }
    onShowToast('Memproses Backup Google Drive...', 'Mengirim perintah backup ke Google Drive...', 'warning');
    try {
      await fetch(`${googleScriptUrl.trim()}?action=backupDrive`, {
        method: 'GET',
        mode: 'no-cors'
      });
      onShowToast('Backup Drive Terkirim', 'Perintah backup Google Drive berhasil dikirim. File JSON tersimpan di folder BACKUP_SEKOLAH_RAKYAT_SR31 di Drive Anda.', 'success');
    } catch (e) {
      onShowToast('Gagal Backup Drive', 'Gagal menghubungi Google Apps Script. Periksa koneksi atau URL script Anda.', 'error');
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPin === '817731') {
      setIsLocked(false);
      setIsUnlockModalOpen(false);
      setUnlockPin('');
      setPinError(false);
      onShowToast('PIN Terverifikasi', 'Kolom isian database asrama siap diubah.', 'success');
    } else {
      setPinError(true);
      setUnlockPin('');
    }
  };

  const handleToggleLock = () => {
    if (!isLocked) {
      setIsLocked(true);
      onShowToast('Pengaturan Terkunci', 'Konfigurasi database dan instansi dikunci kembali.', 'success');
    } else {
      setIsUnlockModalOpen(true);
      setUnlockPin('');
      setPinError(false);
    }
  };

  const handleSave = () => {
    const waliAsuhLines = waliAsuhText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    const dormLines = dormText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

    if (!waliAsrama || !kepalaSekolah) {
      onShowToast('Data Tidak Valid', 'Nama Wali Asrama dan Kepala Sekolah tidak boleh kosong.', 'error');
      return;
    }

    const updatedConfig: AppConfig = {
      googleScriptUrl: googleScriptUrl.trim(),
      waliAsrama: waliAsrama.trim(),
      waliAsramaNip: waliAsramaNip.trim(),
      waliAsramaTitle: waliAsramaTitle.trim() || 'Wali Asrama Mandiri',
      kepalaSekolah: kepalaSekolah.trim(),
      kepalaSekolahNip: kepalaSekolahNip.trim(),
      kopKiri: kopKiri.trim(),
      kopKanan: kopKanan.trim(),
      waliAsuhList: waliAsuhLines,
      dormList: dormLines,
      logoKiriUrl: logoKiriUrl.trim(),
      logoKananUrl: logoKananUrl.trim(),
      watermarkOpacity: watermarkOpacity || 0.04,
      semester,
      academicYear: academicYear.trim(),
      disciplineLevels,
      disciplineThresholds,
      violationTemplatesCustom: customTemplates,
      raporStructureCustom: customRaporStructure,
      autoResetPointsPerSemester: autoResetPoints
    };

    onSaveConfig(updatedConfig);
    setIsLocked(true);
    onShowToast('Pengaturan Disimpan', 'Seluruh parameter baru berhasil disimpan dan sistem otomatis dikunci.', 'success');
  };

  // Helpers for managing Custom Rapor Structure & Indicators
  const handleAddRaporIndicator = () => {
    if (!newRaporIndicatorText.trim()) {
      onShowToast('Gagal Menambah', 'Teks indikator tidak boleh kosong.', 'warning');
      return;
    }
    const updated = JSON.parse(JSON.stringify(customRaporStructure));
    const cat = updated[selectedRaporCatIndex];
    if (cat) {
      cat.indicators.push(newRaporIndicatorText.trim());
      setCustomRaporStructure(updated);
      setNewRaporIndicatorText('');
      onShowToast('Indikator Ditambahkan', `Indikator baru ditambahkan ke kategori ${cat.name}.`, 'success');
    }
  };

  const handleSaveInlineIndicator = (catIdx: number, indIdx: number) => {
    if (!editingRaporIndicatorText.trim()) {
      onShowToast('Peringatan', 'Teks indikator tidak boleh kosong.', 'warning');
      return;
    }
    const updated = JSON.parse(JSON.stringify(customRaporStructure));
    if (updated[catIdx] && updated[catIdx].indicators[indIdx] !== undefined) {
      updated[catIdx].indicators[indIdx] = editingRaporIndicatorText.trim();
      setCustomRaporStructure(updated);
      setEditingRaporIndicatorIdx(null);
      setEditingRaporIndicatorText('');
      onShowToast('Diperbarui', 'Indikator berhasil diubah.', 'success');
    }
  };

  const handleDeleteRaporIndicator = (catIdx: number, indIdx: number) => {
    const updated = JSON.parse(JSON.stringify(customRaporStructure));
    const cat = updated[catIdx];
    if (cat) {
      cat.indicators.splice(indIdx, 1);
      setCustomRaporStructure(updated);
      if (editingRaporIndicatorIdx === indIdx) {
        setEditingRaporIndicatorIdx(null);
      }
      onShowToast('Indikator Dihapus', 'Indikator berhasil dihapus dari kategori rapor.', 'success');
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      onShowToast('Gagal', 'Nama kategori tidak boleh kosong.', 'warning');
      return;
    }
    const key = `custom_cat_${Date.now()}`;
    const updated = [...customRaporStructure, { key, name: newCatName.trim(), indicators: [] }];
    setCustomRaporStructure(updated);
    setSelectedRaporCatIndex(updated.length - 1);
    setNewCatName('');
    setIsAddingNewCat(false);
    onShowToast('Kategori Ditambahkan', `Kategori "${newCatName}" berhasil dibuat.`, 'success');
  };

  const handleDeleteCategory = (catIdx: number) => {
    if (customRaporStructure.length <= 1) {
      onShowToast('Tidak Bisa Dihapus', 'Minimal harus ada 1 Kategori Rapor Keasramaan.', 'warning');
      return;
    }
    const catName = customRaporStructure[catIdx]?.name;
    const updated = customRaporStructure.filter((_, idx) => idx !== catIdx);
    setCustomRaporStructure(updated);
    setSelectedRaporCatIndex(0);
    onShowToast('Kategori Dihapus', `Kategori "${catName}" telah dihapus.`, 'info');
  };

  const handleResetRaporStructure = () => {
    setCustomRaporStructure(RAPOR_STRUCTURE);
    setSelectedRaporCatIndex(0);
    onShowToast('Direset Ke Default', 'Indikator Rapor Keasramaan dikembalikan ke struktur standar.', 'info');
  };

  // Helpers for managing Discipline Levels
  const handleLevelChange = (index: number, field: keyof DisciplineLevelConfig, value: any) => {
    const updated = [...disciplineLevels];
    updated[index] = { ...updated[index], [field]: value };
    setDisciplineLevels(updated);
  };

  // Helpers for managing Discipline Thresholds
  const handleThresholdChange = (index: number, field: keyof DisciplineStatusThreshold, value: any) => {
    const updated = [...disciplineThresholds];
    updated[index] = { ...updated[index], [field]: value };
    setDisciplineThresholds(updated);
  };

  // Helpers for Violation Templates Custom Items
  const handleAddCustomTemplate = () => {
    if (!newTemplateText.trim()) {
      onShowToast('Gagal Menambah', 'Nama jenis pelanggaran wajib diisi.', 'warning');
      return;
    }
    const currentList = customTemplates[selectedTemplateLevel] || [];
    const newItem: ViolationTemplateItem = {
      text: newTemplateText.trim(),
      explanation: newTemplateExplanation.trim(),
      sanction: newTemplateSanction.trim()
    };
    setCustomTemplates({
      ...customTemplates,
      [selectedTemplateLevel]: [...currentList, newItem]
    });
    setNewTemplateText('');
    setNewTemplateExplanation('');
    setNewTemplateSanction('');
    onShowToast('Indikator Ditambahkan', `Jenis pelanggaran baru ditambahkan ke Tingkat ${selectedTemplateLevel}.`, 'success');
  };

  const handleDeleteCustomTemplate = (lvl: number, idx: number) => {
    const currentList = [...(customTemplates[lvl] || [])];
    currentList.splice(idx, 1);
    setCustomTemplates({
      ...customTemplates,
      [lvl]: currentList
    });
    onShowToast('Indikator Dihapus', 'Item jenis pelanggaran berhasil dihapus.', 'success');
  };

  const handleTestConnection = async () => {
    if (!googleScriptUrl.trim()) {
      onShowToast('Koneksi Gagal', 'Isi URL Google Apps Script terlebih dahulu.', 'error');
      return;
    }
    onShowToast('Menghubungkan...', 'Melakukan uji jabat tangan (handshake).', 'warning');
    try {
      await fetch(googleScriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });
      onShowToast('Uji Koneksi Selesai', 'Apps Script terpantau aktif dan siap.', 'success');
    } catch (e) {
      onShowToast('Gangguan Server', 'Gagal menghubungi URL. Periksa koneksi internet.', 'error');
    }
  };

  const inputClass = (disabled: boolean) =>
    `w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition ${
      disabled
        ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed border-slate-200'
        : 'bg-white/80 border-slate-300 text-slate-800 focus:ring-2 focus:ring-red-500/30'
    }`;

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-xl p-5 md:p-8 rounded-3xl border border-white/60 shadow-2xl space-y-6 relative z-10">
        {/* Secure Lock Banner */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg flex-shrink-0">
              {isLocked ? <Lock className="w-5 h-5 text-amber-700" /> : <Unlock className="w-5 h-5 text-emerald-700" />}
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-xs">Proteksi Konfigurasi Database</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                {isLocked ? (
                  <>
                    Seluruh kolom parameter database Google Sheet dan profil instansi saat ini{' '}
                    <strong className="text-amber-800">terkunci rapat</strong>.
                  </>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    Keamanan terbuka! Anda dapat mengubah parameter database.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleLock}
            className={`w-full sm:w-auto font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow ${
              isLocked
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isLocked ? 'Buka Kunci' : 'Kunci Kembali'}</span>
          </button>
        </div>

        {/* Cloud Sync 7-Day Reminder Banner */}
        {isSyncOverdue ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">
                    Pengingat Sinkronisasi Data Cloud
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wider">
                    {daysSinceSync === null ? 'Belum Pernah Sync' : `${daysSinceSync} Hari Lalu`}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Sistem mendeteksi bahwa Anda <strong className="text-rose-700 font-bold">belum melakukan sinkronisasi data ke cloud dalam 7 hari terakhir</strong> (Sinkronisasi terakhir: <span className="font-bold text-slate-900">{formattedLastSync}</span>). Disarankan untuk segera melakukan sinkronisasi agar seluruh data asrama tersimpan aman di cloud.
                </p>
              </div>
            </div>
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={isSyncing}
                className="w-full md:w-auto font-extrabold text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-95 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Sinkronisasi Cloud Terkini</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Terakhir disinkronkan: <strong className="text-emerald-800">{formattedLastSync}</strong> ({daysSinceSync === 0 ? 'Hari ini' : `${daysSinceSync} hari yang lalu`}).
                </p>
              </div>
            </div>
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={isSyncing}
                className="font-bold text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Ulang</span>
              </button>
            )}
          </div>
        )}

        {/* Section Header & Sub-Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-3 rounded-xl text-white flex-shrink-0 shadow-lg">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-bold text-slate-900 drop-shadow-sm">
                Pengaturan & Database Sistem
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Sesuaikan profil wali asrama, kop surat PDF, penandatangan berkas, serta pusat manajemen CRUD Database Google Sheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSettingsView('general')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeSettingsView === 'general'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Setelan Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsView('database')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeSettingsView === 'database'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Manajemen CRUD Database</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeSettingsView === 'database' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                9 Tabel
              </span>
            </button>
          </div>
        </div>

        {activeSettingsView === 'database' ? (
          <DatabaseCrudManager
            students={students}
            onSaveStudent={onSaveStudent}
            onDeleteStudent={onDeleteStudent}
            violations={violations}
            onSaveViolation={onSaveViolation}
            onDeleteViolation={onDeleteViolation}
            counseling={counseling}
            onSaveCounseling={onSaveCounseling}
            onDeleteCounseling={onDeleteCounseling}
            leaves={leaves}
            onSaveLeave={onSaveLeave}
            onDeleteLeave={onDeleteLeave}
            dailyJournals={dailyJournals}
            onSaveJournal={onSaveJournal}
            onDeleteJournal={onDeleteJournal}
            medicalRecords={medicalRecords}
            onSaveMedicalRecord={onSaveMedicalRecord}
            onDeleteMedicalRecord={onDeleteMedicalRecord}
            reports={reports}
            onSaveReport={onSaveReport}
            onDeleteReport={onDeleteReport}
            prayerAttendance={prayerAttendance}
            onSavePrayerAttendance={onSavePrayerAttendance}
            onDeletePrayerAttendance={onDeletePrayerAttendance}
            announcement={announcement}
            onUpdateAnnouncement={onUpdateAnnouncement || (() => {})}
            config={config}
            onShowToast={onShowToast}
            onSync={onSync}
            isSyncing={isSyncing}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Kop Surat & Signatures */}
          <div className="space-y-4">
            {/* Announcement Ticker Section */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Pengumuman Running Text (Dashboard Ticker)
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Database Sheet
                </span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Teks pengumuman ini berjalan di ticker running text Dashboard dan tersimpan langsung di Tab <strong>Announcements</strong> Google Sheet database.
              </p>
              <textarea
                disabled={isLocked}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={2}
                className={inputClass(isLocked)}
                placeholder="Tuliskan pesan pengumuman running text di sini..."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLocked || !announcementText.trim()}
                  onClick={() => {
                    if (onUpdateAnnouncement) {
                      onUpdateAnnouncement(announcementText);
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan & Sync Pengumuman
                </button>
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Kop Surat Instansi (Bagian Bawah)
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Sekolah / Instansi Terkait
              </label>
              <textarea
                disabled={isLocked}
                value={kopKiri}
                onChange={(e) => setKopKiri(e.target.value)}
                rows={3}
                className={inputClass(isLocked)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat / Informasi Kontak
              </label>
              <textarea
                disabled={isLocked}
                value={kopKanan}
                onChange={(e) => setKopKanan(e.target.value)}
                rows={3}
                className={inputClass(isLocked)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Semester Rapor
                </label>
                <select
                  disabled={isLocked}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className={inputClass(isLocked)}
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Tahun Ajaran
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="e.g. 2025/2026"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 mt-6 flex items-center gap-1.5">
              <Signature className="w-4 h-4" /> Daftar Otorisasi / Penandatangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={kepalaSekolahNip}
                  onChange={(e) => setKepalaSekolahNip(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jabatan / Otorisasi Penandatangan Wali Asrama
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={waliAsramaTitle}
                onChange={(e) => setWaliAsramaTitle(e.target.value)}
                className={inputClass(isLocked)}
                placeholder="e.g. Wali Asrama Mandiri, Pembina Asrama, Kepala Asrama"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Wali Asrama
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={waliAsrama}
                  onChange={(e) => setWaliAsrama(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Wali Asrama
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={waliAsramaNip}
                  onChange={(e) => setWaliAsramaNip(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Logos, Watermark & Google Sheet Backend */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Setelan Logo & Watermark PDF
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logo Kiri (URL/Base64)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={logoKiriUrl}
                  onChange={(e) => setLogoKiriUrl(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="Kosongkan untuk logo bawaan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logo Kanan (URL/Base64)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={logoKananUrl}
                  onChange={(e) => setLogoKananUrl(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="Kosongkan untuk logo bawaan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kekuatan Transparansi Watermark ({watermarkOpacity})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.15"
                disabled={isLocked}
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value) || 0.04)}
                className={inputClass(isLocked)}
              />
            </div>

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 mt-4 flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Database & Konektivitas Sheet
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                disabled={isLocked}
                value={googleScriptUrl}
                onChange={(e) => setGoogleScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={inputClass(isLocked)}
              />
              <p className="text-[9px] text-slate-500 mt-1">
                Kosongkan URL ini jika ingin beroperasi penuh dalam mode offline lokal.
              </p>

              {/* Apps Script Helpers */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {onSync && (
                  <button
                    type="button"
                    onClick={onSync}
                    disabled={isSyncing}
                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                )}
                {onPurgeDummyDataAndReload && (
                  <button
                    type="button"
                    onClick={onPurgeDummyDataAndReload}
                    disabled={isSyncing}
                    className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    title="Hapus seluruh sisa data dummy bawaan & muat data segar langsung dari Google Sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Hapus Data Dummy & Muat Google Sheet</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(true)}
                  className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                >
                  <Code className="w-3.5 h-3.5 text-red-600" /> Lihat Kode Apps Script (Code.gs)
                </button>
                <button
                  type="button"
                  onClick={handleRunSetupSheet}
                  className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                  title="Jalankan fungsi setupSheet untuk membuat/mereset tab & header di Google Sheet Anda"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Inisialisasi Sheet (setupSheet)
                </button>
                <button
                  type="button"
                  onClick={handleTriggerDriveBackup}
                  className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                  title="Simpan file JSON backup instan ke folder Google Drive (BACKUP_SEKOLAH_RAKYAT_SR31)"
                >
                  <Database className="w-3.5 h-3.5 text-amber-600" /> Backup ke Google Drive
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsView('database')}
                  className="w-full mt-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 border border-red-700 px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
                  title="Buka Pusat Manajemen & Operasi CRUD Database (Create, Read, Update, Delete)"
                >
                  <TableProperties className="w-4 h-4 text-amber-300" />
                  <span>Buka Pusat Manajemen CRUD Database (9 Tabel)</span>
                </button>
              </div>
            </div>

            {/* Anti-Shadow Data & Sheet Reconciliation Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-800/50 space-y-3.5">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      Pencegahan Data Shadow Database Sheet
                    </h4>
                    <p className="text-[10px] text-slate-300">
                      Sinkronisasi dan sanitasi integritas data murid antar tab
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Engine Aktif
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sistem secara otomatis menyesuaikan nama, NISN, jenjang, dan asrama di seluruh laporan (Pelanggaran, Konseling, Izin Pulang, Jurnal, Medical, Sholat, & Rapor) agar konsisten dengan <strong className="text-emerald-300">Master Students Database Sheet</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 text-center bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Master Murid</div>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{studentsCount} Siswa</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Total Record Rekam</div>
                  <div className="text-sm font-extrabold text-blue-400 mt-0.5">{recordsCount} Baris</div>
                </div>
              </div>

              {lastAuditStats && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-[11px] space-y-1 text-emerald-200">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Hasil Audit & Rekonsiliasi Terakhir:
                  </div>
                  <ul className="list-disc list-inside text-[10px] text-emerald-300/90 space-y-0.5 pl-1">
                    <li>Diselaraskan: <strong>{lastAuditStats.fixedNamesCount}</strong> nama murid & <strong>{lastAuditStats.fixedClassDormCount}</strong> kelas/asrama.</li>
                    <li>Duplikasi Dihapus: <strong>{lastAuditStats.duplicateStudentsRemoved + lastAuditStats.duplicateRecordsRemoved}</strong> baris ganda.</li>
                    <li>Record Yatim Dihapus: <strong>{lastAuditStats.orphanedRecordsRemoved}</strong> data tanpa master.</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={purgeOrphans}
                    onChange={(e) => setPurgeOrphans(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900"
                  />
                  <span>Bersihkan record yatim (murid yang telah dihapus)</span>
                </label>

                {onReconcileShadowData && (
                  <button
                    type="button"
                    onClick={handleRunReconcileShadow}
                    disabled={isReconciling}
                    className="font-bold text-xs px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    <ShieldCheck className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
                    <span>{isReconciling ? 'Merekonsiliasi...' : 'Jalankan Anti-Shadow Data'}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daftar Wali Asuh & NIP (Format: Nama|NIP, 1 per baris)
              </label>
              <textarea
                disabled={isLocked}
                value={waliAsuhText}
                onChange={(e) => setWaliAsuhText(e.target.value)}
                rows={3}
                className={`${inputClass(isLocked)} font-mono`}
                placeholder="Bp. Hermawan|NIP. 198005122010121001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daftar Lokasi Gedung Asrama (Satu per baris)
              </label>
              <textarea
                disabled={isLocked}
                value={dormText}
                onChange={(e) => setDormText(e.target.value)}
                rows={3}
                className={`${inputClass(isLocked)} font-mono`}
                placeholder="Asrama Terpadu"
              />
            </div>
          </div>
        </div>

        {/* --- CUSTOMIZABLE DISCIPLINE & VIOLATION INDICATORS SECTION --- */}
        <div className="pt-6 border-t border-slate-200/80 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Pengaturan Indikator Kedisiplinan & Pelanggaran
              </h3>
              <p className="text-xs text-slate-500">
                Kustomisasi bobot poin, ambang batas status siswa, dan template jenis pelanggaran sesuai aturan kedisiplinan asrama Anda.
              </p>
            </div>
          </div>

          {/* 1. Points Deduction per Level */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Bobot Pengurangan Poin per Tingkat Pelanggaran
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {disciplineLevels.map((lvl, idx) => (
                <div key={lvl.level} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{lvl.name}</span>
                    <span className="text-red-600 font-mono">-{lvl.pointsDeduction} Poin</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Potong Poin:</label>
                      <input
                        type="number"
                        disabled={isLocked}
                        value={lvl.pointsDeduction}
                        onChange={(e) => handleLevelChange(idx, 'pointsDeduction', Number(e.target.value) || 0)}
                        className={inputClass(isLocked)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Sanksi Default:</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={lvl.defaultSanction}
                        onChange={(e) => handleLevelChange(idx, 'defaultSanction', e.target.value)}
                        className={inputClass(isLocked)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Status Thresholds */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Kategori Ambang Batas Poin Kedisiplinan
            </h4>
            <div className="space-y-2">
              {disciplineThresholds.map((t, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold">Min Poin:</label>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={t.minScore}
                      onChange={(e) => handleThresholdChange(idx, 'minScore', Number(e.target.value) || 0)}
                      className={inputClass(isLocked)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold">Label Status:</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={t.label}
                      onChange={(e) => handleThresholdChange(idx, 'label', e.target.value)}
                      className={inputClass(isLocked)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold">Deskripsi / Penjelasan Status:</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={t.description}
                      onChange={(e) => handleThresholdChange(idx, 'description', e.target.value)}
                      className={inputClass(isLocked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Violation Indicator Items Manager */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-600" /> Custom Indikator Jenis Pelanggaran
              </h4>
              <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
                {[1, 2, 3, 4, 5].map((lvlNum) => (
                  <button
                    key={lvlNum}
                    type="button"
                    onClick={() => setSelectedTemplateLevel(lvlNum)}
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md transition ${
                      selectedTemplateLevel === lvlNum
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tingkat {lvlNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Form to Add New Violation Item for Selected Level */}
            {!isLocked && (
              <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 space-y-3">
                <span className="text-xs font-bold text-purple-900 block">
                  + Tambah Jenis Pelanggaran Baru (Tingkat {selectedTemplateLevel})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Pelanggaran (e.g. Terlambat Sholat)"
                    value={newTemplateText}
                    onChange={(e) => setNewTemplateText(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <input
                    type="text"
                    placeholder="Penjelasan Rinci Kasus"
                    value={newTemplateExplanation}
                    onChange={(e) => setNewTemplateExplanation(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <input
                    type="text"
                    placeholder="Sanksi Default"
                    value={newTemplateSanction}
                    onChange={(e) => setNewTemplateSanction(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomTemplate}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Ke List Tingkat {selectedTemplateLevel}
                  </button>
                </div>
              </div>
            )}

            {/* List of Custom Violation Template Items for Selected Level */}
            <div className="space-y-2">
              {(customTemplates[selectedTemplateLevel] || []).map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{item.text}</span>
                    <p className="text-[11px] text-slate-500 truncate">{item.explanation}</p>
                    <p className="text-[10px] text-purple-700 font-semibold italic">Sanksi: {item.sanction}</p>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomTemplate(selectedTemplateLevel, idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Indikator Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Semester Point Reset Setting */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" /> Reset Poin Kedisiplinan Otomatis Setiap Semester
                </h4>
                <p className="text-[11px] text-slate-500">
                  Jika aktif, poin kedisiplinan setiap siswa dihitung bersih 100 poin di setiap pergantian semester baru ({semester} {academicYear}). Laporan pelanggaran semester sebelumnya tetap tersimpan rapi sebagai arsip historis.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  disabled={isLocked}
                  checked={autoResetPoints}
                  onChange={(e) => setAutoResetPoints(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 5. Custom Report Card Indicators Manager */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Kustomisasi Indikator Rapor Evaluasi Keasramaan
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Atur atau ubah daftar kategori & indikator perkembangan karakter anak asuh yang tampil pada lembar Rapor Keasramaan dan cetakan PDF.
                </p>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleResetRaporStructure}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 font-semibold px-3 py-1.5 rounded-lg transition shadow-sm self-start"
                >
                  Reset Ke Default Standard
                </button>
              )}
            </div>

            {/* Category Selector & Actions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Kategori Nilai Keasramaan ({customRaporStructure.length} Kategori):
                </label>
                {!isLocked && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Kategori Baru
                    </button>
                    {customRaporStructure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(selectedRaporCatIndex)}
                        className="text-xs text-red-600 hover:text-red-800 bg-red-50 border border-red-200 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                        title="Hapus Kategori Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Kategori
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Form Add New Category */}
              {isAddingNewCat && !isLocked && (
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
                  <span className="text-xs font-bold text-blue-900 block">Buat Kategori Nilai Baru:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Contoh: Kategori Nilai Kepemimpinan / Tahfidz..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                    >
                      Simpan Kategori
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingNewCat(false); setNewCatName(''); }}
                      className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <select
                value={selectedRaporCatIndex}
                onChange={(e) => {
                  setSelectedRaporCatIndex(Number(e.target.value));
                  setEditingRaporIndicatorIdx(null);
                }}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {customRaporStructure.map((cat, idx) => (
                  <option key={cat.key || idx} value={idx}>
                    {idx + 1}. {cat.name} ({cat.indicators.length} Indikator)
                  </option>
                ))}
              </select>

              {/* Add New Indicator Form for Selected Category */}
              {!isLocked && (
                <div className="bg-white p-3 rounded-xl border border-blue-200/80 space-y-2">
                  <span className="text-xs font-bold text-blue-900 block">
                    + Tambah Indikator Baru untuk Kategori: "{customRaporStructure[selectedRaporCatIndex]?.name}"
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Contoh: Kemampuan beradaptasi dengan lingkungan baru..."
                      value={newRaporIndicatorText}
                      onChange={(e) => setNewRaporIndicatorText(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddRaporIndicator}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Indikator
                    </button>
                  </div>
                </div>
              )}

              {/* List of Indicators for Selected Category */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block border-b border-slate-100 pb-1.5">
                  Daftar Indikator "{customRaporStructure[selectedRaporCatIndex]?.name}":
                </span>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {(customRaporStructure[selectedRaporCatIndex]?.indicators || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 text-center">Belum ada indikator pada kategori ini. Tambahkan indikator baru di atas.</p>
                  ) : (
                    (customRaporStructure[selectedRaporCatIndex]?.indicators || []).map((ind, iIdx) => {
                      const isEditingThis = editingRaporIndicatorIdx === iIdx;
                      return (
                        <div key={iIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2">
                          {isEditingThis ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={editingRaporIndicatorText}
                                onChange={(e) => setEditingRaporIndicatorText(e.target.value)}
                                className="flex-1 border border-blue-300 bg-white rounded px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineIndicator(selectedRaporCatIndex, iIdx)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded transition"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRaporIndicatorIdx(null)}
                                  className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded transition"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[11px] leading-snug flex-1">
                                <strong className="text-slate-400 font-mono mr-1.5">{iIdx + 1}.</strong> {ind}
                              </span>
                              {!isLocked && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRaporIndicatorIdx(iIdx);
                                      setEditingRaporIndicatorText(ind);
                                    }}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Edit Indikator Ini"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRaporIndicator(selectedRaporCatIndex, iIdx)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                    title="Hapus Indikator Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-slate-200/50">
          <button
            onClick={handleSave}
            disabled={isLocked}
            className="justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Simpan Semua Pengaturan
          </button>
          <button
            onClick={handleTestConnection}
            className="justify-center bg-white/60 hover:bg-white/80 backdrop-blur-md text-slate-700 font-bold text-xs px-6 py-3.5 rounded-xl border border-slate-300 shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" /> Uji Koneksi Database
          </button>
        </div>
      </div>
      )}
    </div>

      {/* Unlock PIN Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Buka Kunci Pengaturan</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Masukkan PIN administrasi asrama untuk merubah parameter database.
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <input
                type="password"
                required
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value);
                  if (pinError) setPinError(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="••••••"
                autoComplete="off"
              />
              {pinError && (
                <p className="text-[10px] text-red-500 text-center font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Kata sandi salah. Silakan coba lagi.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition active:scale-95"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs px-4 py-2 rounded-lg shadow transition active:scale-95"
                >
                  Verifikasi PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apps Script Code Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-4 sm:my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-lg">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Kode Google Apps Script Backend (Code.gs)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sinkronisasi CRUD Otomatis & Auto Setup Sheet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed bg-slate-50/50">
              {/* Installation steps */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-2.5">
                <h4 className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Panduan Otomatisasi Google Sheet & Google Drive:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-900/90 pl-1 font-medium leading-relaxed">
                  <li>Buka Google Drive Anda, lalu buat <strong>Google Spreadsheet baru</strong> (Beri nama misal: <em>DATABASE SISTEM SEKOLAH RAKYAT 31</em>).</li>
                  <li>Klik menu <strong>Ekstensi (Extensions)</strong> → <strong>Apps Script</strong>.</li>
                  <li>Hapus semua isi kode bawaan, lalu tempelkan (paste) seluruh kode script di bawah ini.</li>
                  <li>
                    Pilih fungsi <strong>setupSheet</strong> di dropdown atas editor Apps Script lalu klik <strong>Jalankan (Run)</strong> untuk membuat seluruh 9 Tab/Sheet resmi & folder Google Drive secara otomatis.
                  </li>
                  <li>
                    Klik <strong>Terapkan (Deploy)</strong> → <strong>Penerapan baru (New deployment)</strong> → Pilih jenis <strong>Aplikasi Web (Web App)</strong>.
                  </li>
                  <li>
                    Atur <em>Yang memiliki akses (Who has access)</em> ke: <strong className="text-red-700 underline font-extrabold">Siapa Saja (Anyone)</strong>.
                  </li>
                  <li>Salin URL Web App yang dihasilkan lalu tempelkan di kolom <em>Google Apps Script Web App URL</em> di Pengaturan Sistem ini.</li>
                </ol>
                <div className="pt-2 border-t border-amber-200/70 text-[10px] text-amber-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>File backup harian akan tersimpan otomatis ke folder <strong>BACKUP_SEKOLAH_RAKYAT_SR31</strong> di Google Drive Anda.</span>
                </div>
              </div>

              {/* Code Box with Copy Button */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 font-mono text-[11px] shadow-lg">
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Code.gs (Full CRUD Backend)
                  </span>
                  <button
                    onClick={handleCopyScriptCode}
                    className="bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Berhasil Disalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin Kode GS
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 max-h-80 overflow-y-auto whitespace-pre text-slate-200 select-all leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleRunSetupSheet}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> Uji Remote Setup Sheet Sekarang
              </button>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition active:scale-95 ml-auto"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
