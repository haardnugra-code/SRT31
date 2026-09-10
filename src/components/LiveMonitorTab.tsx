import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  ShieldAlert,
  UserCheck,
  HeartPulse,
  DoorOpen,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Flame,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
  Eye,
  Users,
  Bell,
  BedDouble,
  Thermometer,
  QrCode,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  X
} from 'lucide-react';
import {
  Student,
  PrayerAttendance,
  Violation,
  SpecialChronologyCase,
  MedicalRecord,
  Leave,
  MenstruationRecord,
  AppConfig
} from '../types';
import { formatDateIndonesian, parseLocalDate } from '../utils/dateFormatter';

interface LiveMonitorTabProps {
  students: Student[];
  prayerAttendance: PrayerAttendance[];
  violations: Violation[];
  specialCases: SpecialChronologyCase[];
  medicalRecords: MedicalRecord[];
  leaves: Leave[];
  menstruationRecords?: MenstruationRecord[];
  config: AppConfig;
  onNavigateTab: (tab: string) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onSyncCloud?: () => Promise<void>;
}

type PanelViewMode = 'all' | 'attendance' | 'violations' | 'handover' | 'medical' | 'leaves';

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
  students,
  prayerAttendance,
  violations,
  specialCases,
  medicalRecords,
  leaves,
  menstruationRecords = [],
  config,
  onNavigateTab,
  onShowToast,
  onSyncCloud
}) => {
  // 1. Live Time & Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<PanelViewMode>('all');
  const [filterDorm, setFilterDorm] = useState<string>('all');
  const [filterRange, setFilterRange] = useState<'today' | '7days' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [selectedDetail, setSelectedDetail] = useState<{
    type: 'attendance' | 'violation' | 'handover' | 'medical' | 'leave';
    title: string;
    data: any;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 30s Countdown timer for auto-refresh
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onSyncCloud) {
            onSyncCloud().catch(() => {});
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [onSyncCloud]);

  // Handle Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Subtle Synthetic Audio Chime for Alert/Notification
  const playAlertChime = useCallback((highPriority = false) => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = highPriority ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(highPriority ? 659.25 : 523.25, ctx.currentTime); // E5 or C5
      osc.frequency.exponentialRampToValueAtTime(highPriority ? 880 : 783.99, ctx.currentTime + 0.15); // A5 or G5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (highPriority ? 0.6 : 0.4));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (highPriority ? 0.6 : 0.4));
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [audioEnabled]);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    playAlertChime(false);
    if (onSyncCloud) {
      try {
        await onSyncCloud();
        if (onShowToast) {
          onShowToast('Monitor Diperbarui', 'Data live monitor berhasil disinkronkan dengan Google Sheets.', 'success');
        }
      } catch {
        if (onShowToast) {
          onShowToast('Gagal Memperbarui', 'Tidak dapat mengambil pembaruan awan saat ini.', 'error');
        }
      }
    }
    setCountdown(30);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Determine Active Shift based on time
  const currentHour = currentTime.getHours();
  const activeShiftInfo = useMemo(() => {
    if (currentHour >= 6 && currentHour < 14) {
      return {
        name: 'Shift Pagi',
        timeRange: '06:00 - 14:00 WIB',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        focus: 'Apel pagi, rutinitas sekolah, inspeksi kebersihan, dan presensi sarapan.'
      };
    } else if (currentHour >= 14 && currentHour < 21) {
      return {
        name: 'Shift Siang & Sore',
        timeRange: '14:00 - 21:00 WIB',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        focus: 'Kepulangan sekolah, sholat Ashar & Maghrib, kajian Al-Qur\'an, makan malam, dan jam belajar mandiri.'
      };
    } else {
      return {
        name: 'Shift Malam & Dini Hari',
        timeRange: '21:00 - 06:00 WIB',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        focus: 'Apel malam, ceklist jam tidur, ronda keliling asrama, sholat tahajjud, dan sholat Subuh berjamaah.'
      };
    }
  }, [currentHour]);

  // Determine Active Prayer/Session based on time
  const currentSessionName = useMemo(() => {
    const minutes = currentHour * 60 + currentTime.getMinutes();
    if (minutes >= 270 && minutes < 360) return 'Subuh'; // 04:30 - 06:00
    if (minutes >= 360 && minutes < 480) return 'Sarapan Pagi'; // 06:00 - 08:00
    if (minutes >= 700 && minutes < 800) return 'Dzuhur'; // 11:40 - 13:20
    if (minutes >= 900 && minutes < 1020) return 'Ashar'; // 15:00 - 17:00
    if (minutes >= 1060 && minutes < 1140) return 'Maghrib & Makan'; // 17:40 - 19:00
    if (minutes >= 1140 && minutes < 1260) return 'Isya & Belajar'; // 19:00 - 21:00
    if (minutes >= 1260 || minutes < 240) return 'Istirahat / Jam Tidur'; // 21:00 - 04:00
    return 'Tahajjud / Kegiatan';
  }, [currentHour, currentTime]);

  const todayStr = useMemo(() => {
    return currentTime.toISOString().split('T')[0];
  }, [currentTime]);

  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date(currentTime.getTime() - 7 * 86400000);
    return d.toISOString().split('T')[0];
  }, [currentTime]);

  // Helper date filter
  const isWithinDateRange = useCallback((dateStr?: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.slice(0, 10);
    if (filterRange === 'today') return cleanDate === todayStr;
    if (filterRange === '7days') return cleanDate >= sevenDaysAgoStr;
    return true;
  }, [filterRange, todayStr, sevenDaysAgoStr]);

  // Filtered Students lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Student filter matching
  const matchStudent = useCallback((name?: string, id?: string, dorm?: string) => {
    if (filterDorm !== 'all') {
      const dormMatch = dorm?.toLowerCase() === filterDorm.toLowerCase() ||
        (id && studentMap.get(id)?.dorm?.toLowerCase() === filterDorm.toLowerCase());
      if (!dormMatch) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (name && name.toLowerCase().includes(q)) || (id && id.toLowerCase().includes(q));
  }, [filterDorm, searchQuery, studentMap]);

  // 1. Absensi Filtered Data
  const filteredAttendance = useMemo(() => {
    return prayerAttendance.filter((item) => {
      const dateOk = isWithinDateRange(item.date);
      const studentOk = matchStudent(item.studentName, item.studentId, item.dorm);
      return dateOk && studentOk;
    }).sort((a, b) => {
      const timeA = `${a.date} ${a.timestamp || '00:00'}`;
      const timeB = `${b.date} ${b.timestamp || '00:00'}`;
      return timeB.localeCompare(timeA);
    });
  }, [prayerAttendance, isWithinDateRange, matchStudent]);

  // Attendance stats today
  const attendanceStats = useMemo(() => {
    const todayItems = prayerAttendance.filter((a) => a.date === todayStr);
    const present = todayItems.filter((a) => a.status === 'Hadir').length;
    const sick = todayItems.filter((a) => a.status === 'Izin Sakit').length;
    const leave = todayItems.filter((a) => a.status === 'Izin Pulang').length;
    const late = todayItems.filter((a) => a.status === 'Terlambat').length;
    const absent = todayItems.filter((a) => a.status === 'Alpa / Tanpa Keterangan').length;

    // Menstruation active today
    const haidCount = menstruationRecords.filter((m) => {
      const start = m.startDate;
      const end = m.endDate || m.predictedEndDate || '9999-99-99';
      return m.status === 'Haid' && todayStr >= start && todayStr <= end;
    }).length;

    const totalStudentsCount = students.length || 1;
    const percentage = Math.min(100, Math.round((present / totalStudentsCount) * 100));

    return { present, sick, leave, late, absent, haidCount, percentage };
  }, [prayerAttendance, todayStr, menstruationRecords, students.length]);

  // 2. Violations Filtered Data
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const dateOk = isWithinDateRange(v.date);
      const studentOk = matchStudent(v.studentName, v.studentId);
      return dateOk && studentOk;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [violations, isWithinDateRange, matchStudent]);

  const violationStats = useMemo(() => {
    const heavy = filteredViolations.filter((v) => v.level >= 3).length;
    const medium = filteredViolations.filter((v) => v.level === 2).length;
    const light = filteredViolations.filter((v) => v.level === 1).length;
    return { total: filteredViolations.length, heavy, medium, light };
  }, [filteredViolations]);

  // 3. Handover & Special Cases Filtered Data
  const filteredCases = useMemo(() => {
    return specialCases.filter((c) => {
      const dateOk = isWithinDateRange(c.incidentDate || c.createdAt);
      const studentOk = matchStudent(c.studentName, c.studentId, c.dorm);
      return dateOk && studentOk;
    }).sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  }, [specialCases, isWithinDateRange, matchStudent]);

  const caseStats = useMemo(() => {
    const activeMonitoring = filteredCases.filter((c) => c.status !== 'Selesai / Ditutup').length;
    const highRisk = filteredCases.filter((c) => c.caseSeverity === 'Tinggi' || c.caseSeverity === 'Kritis').length;
    return { total: filteredCases.length, activeMonitoring, highRisk };
  }, [filteredCases]);

  // 4. Medical / UKS Filtered Data
  const filteredMedical = useMemo(() => {
    return medicalRecords.filter((m) => {
      const dateOk = isWithinDateRange(m.date);
      const studentOk = matchStudent(m.studentName, m.studentId);
      return dateOk && studentOk;
    }).sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`));
  }, [medicalRecords, isWithinDateRange, matchStudent]);

  const medicalStats = useMemo(() => {
    const inUks = filteredMedical.filter((m) => m.status === 'Dalam Perawatan' || m.location === 'UKS Asrama').length;
    const inRoom = filteredMedical.filter((m) => m.status === 'Istirahat di Kamar' || m.location === 'Istirahat di Kamar').length;
    const hospitalReferral = filteredMedical.filter((m) => m.status === 'Dirujuk ke RS/Klinik' || m.location === 'Klinik / RS Rujukan').length;
    const feverCases = filteredMedical.filter((m) => {
      const t = parseFloat(m.temperature || '0');
      return t >= 38.0;
    }).length;
    return { inUks, inRoom, hospitalReferral, feverCases, total: filteredMedical.length };
  }, [filteredMedical]);

  // 5. Leaves Filtered Data
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const studentOk = matchStudent(l.studentName, l.studentId);
      if (!studentOk) return false;
      if (filterRange === 'today') {
        return l.status === 'Active' || l.leaveDate === todayStr || l.returnDate === todayStr;
      }
      return isWithinDateRange(l.leaveDate);
    }).sort((a, b) => b.leaveDate.localeCompare(a.leaveDate));
  }, [leaves, matchStudent, filterRange, todayStr, isWithinDateRange]);

  const leaveStats = useMemo(() => {
    const activeLeaves = leaves.filter((l) => l.status === 'Active');
    const overdueLeaves = activeLeaves.filter((l) => {
      if (!l.returnDate) return false;
      return l.returnDate < todayStr;
    });
    return {
      activeCount: activeLeaves.length,
      overdueCount: overdueLeaves.length,
      total: filteredLeaves.length
    };
  }, [leaves, todayStr, filteredLeaves.length]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[85vh] text-slate-100 rounded-3xl p-4 sm:p-6 lg:p-8 overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] rounded-none overflow-y-auto bg-slate-950 p-6 sm:p-10'
          : 'bg-slate-950/95 border border-slate-800/90 shadow-2xl shadow-slate-950/80'
      }`}
    >
      {/* Dynamic Modern Frosted Glow Background Orbs */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] bg-rose-600/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Header Control Cockpit */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pusat Komando Real-Time
              </span>
              <div className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${activeShiftInfo.badgeColor}`}>
                {activeShiftInfo.name} ({activeShiftInfo.timeRange})
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-red-500 animate-pulse" />
              <span>Live Monitor Keasramaan Terpadu</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Pemantauan simultan absensi RFID, kedisiplinan siswa, serah terima shift, kondisi rawat UKS, dan perijinan keluar asrama.
            </p>
          </div>

          {/* Clock & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
            {/* Digital Clock with seconds */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3 text-slate-200">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="text-right leading-tight">
                <div className="text-sm sm:text-base font-black tracking-wider text-white font-mono">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {formatDateIndonesian(todayStr, true)}
                </div>
              </div>
            </div>

            {/* Audio Alert Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (next) playAlertChime(false);
              }}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center active:scale-95 ${
                audioEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={audioEnabled ? 'Audio Suara Peringatan Aktif (Klik untuk matikan)' : 'Audio Suara Peringatan Nonaktif'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Sync Button with 30s Countdown Ring */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Sinkronisasi paksa dengan Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan ({countdown}s)</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition flex items-center gap-1.5 active:scale-95"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Cocok untuk TV Pos Jaga / Piket)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* 2. HUD Metrics / Key Live Indicators Bar (Frosted Glass Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Absensi */}
          <div
            onClick={() => setViewMode(viewMode === 'attendance' ? 'all' : 'attendance')}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
              viewMode === 'attendance'
                ? 'bg-blue-950/70 border-blue-500/80 shadow-lg shadow-blue-950/50'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Absensi Hari Ini</span>
              <QrCode className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{attendanceStats.present}</span>
              <span className="text-xs text-slate-400">/ {students.length || 0} Anak</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{attendanceStats.percentage}% Hadir</span>
              <span>Sesi: <strong className="text-slate-200">{currentSessionName}</strong></span>
            </div>
          </div>

          {/* Card 2: Pelanggaran */}
          <div
            onClick={() => setViewMode(viewMode === 'violations' ? 'all' : 'violations')}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
              viewMode === 'violations'
                ? 'bg-rose-950/70 border-rose-500/80 shadow-lg shadow-rose-950/50'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Pelanggaran Disiplin</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{violationStats.total}</span>
              <span className="text-xs text-slate-400">Kasus</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={violationStats.heavy > 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'}>
                {violationStats.heavy} Kasus Berat
              </span>
              <span className="text-slate-400">{violationStats.medium} Sedang</span>
            </div>
          </div>

          {/* Card 3: Kronologi & Handover */}
          <div
            onClick={() => setViewMode(viewMode === 'handover' ? 'all' : 'handover')}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
              viewMode === 'handover'
                ? 'bg-purple-950/70 border-purple-500/80 shadow-lg shadow-purple-950/50'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Hand Over Shift</span>
              <ClipboardList className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{caseStats.activeMonitoring}</span>
              <span className="text-xs text-slate-400">Kasus Khusus Aktif</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className={caseStats.highRisk > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {caseStats.highRisk} Atensi Khusus
              </span>
              <span className="text-slate-300 font-semibold">{activeShiftInfo.name.split(' ')[0]}</span>
            </div>
          </div>

          {/* Card 4: UKS Sakit */}
          <div
            onClick={() => setViewMode(viewMode === 'medical' ? 'all' : 'medical')}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
              viewMode === 'medical'
                ? 'bg-amber-950/70 border-amber-500/80 shadow-lg shadow-amber-950/50'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Siswa Sakit UKS</span>
              <HeartPulse className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {medicalStats.inUks + medicalStats.inRoom + medicalStats.hospitalReferral}
              </span>
              <span className="text-xs text-slate-400">Dalam Perawatan</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={medicalStats.hospitalReferral > 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'}>
                {medicalStats.hospitalReferral > 0 ? `${medicalStats.hospitalReferral} Rujuk RS` : `${medicalStats.inUks} di UKS`}
              </span>
              <span className="text-amber-300/90">{medicalStats.inRoom} di Kamar</span>
            </div>
          </div>

          {/* Card 5: Perijinan */}
          <div
            onClick={() => setViewMode(viewMode === 'leaves' ? 'all' : 'leaves')}
            className={`cursor-pointer col-span-2 sm:col-span-1 rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
              viewMode === 'leaves'
                ? 'bg-emerald-950/70 border-emerald-500/80 shadow-lg shadow-emerald-950/50'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Izin Di Luar Asrama</span>
              <DoorOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{leaveStats.activeCount}</span>
              <span className="text-xs text-slate-400">Sedang di Luar</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={leaveStats.overdueCount > 0 ? 'text-rose-400 font-black animate-pulse' : 'text-slate-400'}>
                {leaveStats.overdueCount > 0 ? `⚠️ ${leaveStats.overdueCount} Terlambat` : 'Tepat Waktu'}
              </span>
              <span className="text-emerald-400 font-semibold">{filteredLeaves.length} Catatan</span>
            </div>
          </div>
        </div>

        {/* 3. Filter Controls & View Switcher Bar */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua 5 Panel' },
              { id: 'attendance', label: 'Absensi Anak' },
              { id: 'violations', label: 'Pelanggaran' },
              { id: 'handover', label: 'Hand Over' },
              { id: 'medical', label: 'UKS Sakit' },
              { id: 'leaves', label: 'Perijinan' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as PanelViewMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  viewMode === tab.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dorm & Date Range Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Asrama Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDorm}
                onChange={(e) => setFilterDorm(e.target.value)}
                className="bg-transparent text-slate-200 outline-none font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Asrama</option>
                {config.dormList?.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value as any)}
                className="bg-transparent text-slate-200 outline-none font-medium cursor-pointer"
              >
                <option value="today" className="bg-slate-900 text-white">Hari Ini</option>
                <option value="7days" className="bg-slate-900 text-white">7 Hari Terakhir</option>
                <option value="all" className="bg-slate-900 text-white">Semua Riwayat</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa/NISN..."
                className="w-full bg-slate-950/80 border border-slate-700/80 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Live Five Panels Container */}
        <div className={`grid gap-6 ${
          viewMode === 'all'
            ? 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
            : 'grid-cols-1'
        }`}>
          {/* PANEL 1: ABSENSI ANAK */}
          {(viewMode === 'all' || viewMode === 'attendance') && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Live Absensi Anak</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                        {filteredAttendance.length} Scan
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Sholat Berjamaah & Ceklist Makan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('prayer-attendance')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                >
                  <span>Buka Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Attendance Mini-Feed */}
              <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
                {filteredAttendance.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <QrCode className="w-10 h-10 stroke-[1.2] mb-2 opacity-40 text-blue-400" />
                    <p className="text-xs font-medium">Belum ada data scan absensi untuk filter ini</p>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('prayer-attendance')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                    >
                      Buka Scanner Absensi
                    </button>
                  </div>
                ) : (
                  filteredAttendance.slice(0, 30).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDetail({ type: 'attendance', title: `Absensi ${item.studentName}`, data: item })}
                      className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-blue-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs flex-shrink-0">
                          {item.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-300 transition">
                            {item.studentName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.dorm || 'Asrama'} • Kelas {item.class || 'SMP'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Hadir'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'Terlambat'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {item.timestamp || item.date}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Metric summary */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Hadir: <strong className="text-slate-200">{attendanceStats.present}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Sakit/Izin: <strong className="text-slate-200">{attendanceStats.sick + attendanceStats.leave}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Alpa: <strong className="text-slate-200">{attendanceStats.absent}</strong>
                </span>
              </div>
            </div>
          )}

          {/* PANEL 2: PELANGGARAN SISWA */}
          {(viewMode === 'all' || viewMode === 'violations') && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Live Pelanggaran Disiplin</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                        {filteredViolations.length} Catatan
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Kedisiplinan, Tata Tertib & Sanksi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('violations')}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
                >
                  <span>Buka Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Violations List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
                {filteredViolations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <CheckCircle2 className="w-10 h-10 stroke-[1.2] mb-2 opacity-40 text-emerald-400" />
                    <p className="text-xs font-medium text-emerald-400/90">Kondisi Tertib & Kondusif</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tidak ada pelanggaran tercatat untuk rentang ini.</p>
                  </div>
                ) : (
                  filteredViolations.slice(0, 30).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedDetail({ type: 'violation', title: `Pelanggaran: ${v.studentName}`, data: v })}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-rose-500/40 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-rose-300 transition truncate">
                            {v.studentName}
                          </p>
                          <p className="text-[11px] font-semibold text-rose-400 mt-0.5 line-clamp-1">
                            {v.violation}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap ${
                            v.level >= 3
                              ? 'bg-red-500 text-white shadow-md shadow-red-950 animate-pulse'
                              : v.level === 2
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          Level {v.level}
                        </span>
                      </div>
                      {v.sanction && (
                        <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1 italic bg-slate-900/60 px-2 py-1 rounded">
                          Sanksi: {v.sanction}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Pelapor: {v.reporter || 'Wali Asrama'}</span>
                        <span className="font-mono">{v.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Metric summary */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Ringan (L1): <strong className="text-slate-200">{violationStats.light}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Sedang (L2): <strong className="text-slate-200">{violationStats.medium}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Berat (L3+): <strong className="text-rose-400 font-bold">{violationStats.heavy}</strong>
                </span>
              </div>
            </div>
          )}

          {/* PANEL 3: KRONOLOGI & HAND OVER SHIFT */}
          {(viewMode === 'all' || viewMode === 'handover') && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Kronologi & Hand Over</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        {filteredCases.length} Kasus
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Serah Terima Piket & Observasi Siswa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('special-chronology')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
                >
                  <span>Buka Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Shift Banner */}
              <div className="my-2.5 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                    Fokus Shift Aktif ({activeShiftInfo.name})
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {activeShiftInfo.focus}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900 text-purple-200">
                    {activeShiftInfo.timeRange}
                  </span>
                </div>
              </div>

              {/* Cases List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1">
                {filteredCases.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <ClipboardList className="w-10 h-10 stroke-[1.2] mb-2 opacity-40 text-purple-400" />
                    <p className="text-xs font-medium">Tidak ada catatan kasus khusus atau handover</p>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('special-chronology')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
                    >
                      Catat Kasus Hand Over
                    </button>
                  </div>
                ) : (
                  filteredCases.slice(0, 30).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedDetail({ type: 'handover', title: `Kronologi: ${c.caseTitle}`, data: c })}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-purple-500/40 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition truncate">
                            {c.caseTitle}
                          </p>
                          <p className="text-[11px] text-purple-300 mt-0.5 truncate">
                            Siswa: <strong>{c.studentName}</strong> • {c.dorm}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Dalam Pengawasan Khusus'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      {c.handoverNotes && (
                        <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 bg-slate-900/70 p-1.5 rounded border border-slate-800">
                          Operan: {c.handoverNotes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Pemeriksa: {c.primaryInvestigator || 'Wali Asuh'}</span>
                        <span className="font-mono">{c.incidentDate || c.createdAt?.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Metric summary */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pengawasan: <strong className="text-purple-300">{caseStats.activeMonitoring}</strong></span>
                <span>Atensi Khusus: <strong className="text-amber-400">{caseStats.highRisk}</strong></span>
                <span>Total: <strong className="text-slate-200">{caseStats.total}</strong></span>
              </div>
            </div>
          )}

          {/* PANEL 4: UKS & REKAM MEDIS SISWA SAKIT */}
          {(viewMode === 'all' || viewMode === 'medical') && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Live UKS & Siswa Sakit</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {filteredMedical.length} Pasien
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Kondisi Medis, Suhu Tubuh & Perawatan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('medical')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                >
                  <span>Buka Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Medical Patient List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
                {filteredMedical.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <HeartPulse className="w-10 h-10 stroke-[1.2] mb-2 opacity-40 text-emerald-400" />
                    <p className="text-xs font-medium text-emerald-400/90">Semua Siswa Sehat</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tidak ada siswa rawat UKS atau sakit hari ini.</p>
                  </div>
                ) : (
                  filteredMedical.slice(0, 30).map((m) => {
                    const tempNum = parseFloat(m.temperature || '0');
                    const hasFever = tempNum >= 38.0;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedDetail({ type: 'medical', title: `Rekam Medis: ${m.studentName}`, data: m })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-amber-500/40 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition truncate">
                              {m.studentName}
                            </p>
                            <p className="text-[11px] text-amber-400 font-semibold mt-0.5 truncate">
                              {m.diagnosis || m.symptoms}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.location === 'Klinik / RS Rujukan'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : m.location === 'UKS Asrama'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {m.location}
                            </span>
                            {m.temperature && (
                              <span
                                className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                                  hasFever ? 'text-rose-400' : 'text-slate-400'
                                }`}
                              >
                                {hasFever && <Flame className="w-3 h-3 text-rose-400 animate-pulse" />}
                                {m.temperature}
                              </span>
                            )}
                          </div>
                        </div>

                        {m.treatment && (
                          <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1 bg-slate-900/60 px-2 py-1 rounded">
                            Tindakan: {m.treatment}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Petugas: {m.officer || 'Petugas UKS'}</span>
                          <span>Istirahat: <strong className="text-slate-300">{m.restDays} Hari</strong></span>
                          <span className="font-mono">{m.date}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Metric summary */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Di UKS: <strong className="text-amber-300">{medicalStats.inUks}</strong></span>
                <span>Di Kamar: <strong className="text-slate-300">{medicalStats.inRoom}</strong></span>
                <span>Rujuk RS: <strong className={medicalStats.hospitalReferral > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{medicalStats.hospitalReferral}</strong></span>
              </div>
            </div>
          )}

          {/* PANEL 5: PERIJINAN SISWA */}
          {(viewMode === 'all' || viewMode === 'leaves') && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Live Perijinan Keluar</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        {filteredLeaves.length} Catatan
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Pesiar, Berobat, Pulang & Tanggal Kembali</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('leaves')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                >
                  <span>Buka Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Leaves List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
                {filteredLeaves.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <DoorOpen className="w-10 h-10 stroke-[1.2] mb-2 opacity-40 text-emerald-400" />
                    <p className="text-xs font-medium">Seluruh siswa berada di dalam lingkungan asrama</p>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('leaves')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      Terbitkan Izin Keluar
                    </button>
                  </div>
                ) : (
                  filteredLeaves.slice(0, 30).map((l) => {
                    const isOverdue = l.status === 'Active' && l.returnDate && l.returnDate < todayStr;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedDetail({ type: 'leave', title: `Izin Keluar: ${l.studentName}`, data: l })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-emerald-500/40 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition truncate">
                              {l.studentName}
                            </p>
                            <p className="text-[11px] text-emerald-400 mt-0.5 truncate">
                              {l.category || l.type}: {l.reason}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-red-500 text-white shadow-md shadow-red-950 animate-pulse'
                                : l.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isOverdue ? 'Terlambat!' : l.status === 'Active' ? 'Di Luar' : 'Selesai'}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded">
                          <div>
                            <span className="text-slate-500">Keluar:</span> {l.leaveDate} {l.leaveTime || ''}
                          </div>
                          <div>
                            <span className="text-slate-500">Kembali:</span>{' '}
                            <strong className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              {l.returnDate} {l.returnTime || ''}
                            </strong>
                          </div>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Wali: {l.caretaker || 'Wali Asrama'}</span>
                          <span className="font-mono">{l.letterNumber || l.id}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Metric summary */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Di Luar: <strong className="text-emerald-400">{leaveStats.activeCount}</strong></span>
                <span>Terlambat: <strong className={leaveStats.overdueCount > 0 ? 'text-rose-400 font-black animate-pulse' : 'text-slate-400'}>{leaveStats.overdueCount}</strong></span>
                <span>Total: <strong className="text-slate-200">{leaveStats.total}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Detail Quick-Inspect Modal (Modern Backdrop Blur) */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl transition-all"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                  Detail Pemantauan
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedDetail.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details based on type */}
            <div className="space-y-3 text-xs text-slate-300">
              {selectedDetail.type === 'attendance' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nama Siswa:</span>
                      <strong className="text-white">{selectedDetail.data.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Status Kehadiran:</span>
                      <span className="text-emerald-400 font-bold">{selectedDetail.data.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Sesi:</span>
                      <span className="text-slate-200">{selectedDetail.data.prayerTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Waktu Tercatat:</span>
                      <span className="text-slate-200 font-mono">{selectedDetail.data.date} {selectedDetail.data.timestamp}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Asrama & Kelas:</span>
                      <span className="text-slate-200">{selectedDetail.data.dorm} • {selectedDetail.data.class}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Dicatat Oleh:</span>
                      <span className="text-slate-200">{selectedDetail.data.scannedBy || 'Petugas Scanner RFID'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'violation' && (
                <div className="space-y-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nama Siswa:</span>
                        <strong className="text-white">{selectedDetail.data.studentName}</strong>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        Level {selectedDetail.data.level}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Deskripsi Pelanggaran:</span>
                      <p className="text-slate-200 font-medium">{selectedDetail.data.violation}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Sanksi / Pembinaan:</span>
                      <p className="text-amber-300">{selectedDetail.data.sanction || '-'}</p>
                    </div>
                    {selectedDetail.data.note && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Catatan Tindak Lanjut:</span>
                        <p className="text-slate-300">{selectedDetail.data.note}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                      <span>Pelapor: {selectedDetail.data.reporter}</span>
                      <span>Tanggal: {selectedDetail.data.date}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'handover' && (
                <div className="space-y-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Judul Kasus / Insiden:</span>
                      <strong className="text-white text-sm">{selectedDetail.data.caseTitle}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Siswa Terlibat:</span>
                        <span className="text-slate-200">{selectedDetail.data.studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Asrama:</span>
                        <span className="text-slate-200">{selectedDetail.data.dorm}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Status Penanganan:</span>
                      <span className="text-purple-300 font-bold">{selectedDetail.data.status}</span>
                    </div>
                    {selectedDetail.data.initialAssessmentSummary && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Uraian Kejadian:</span>
                        <p className="text-slate-300 leading-relaxed">{selectedDetail.data.initialAssessmentSummary}</p>
                      </div>
                    )}
                    {selectedDetail.data.handoverNotes && (
                      <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50">
                        <span className="text-purple-300 block font-bold text-[11px] mb-1">Instruksi Hand Over ke Shift Berikutnya:</span>
                        <p className="text-slate-200">{selectedDetail.data.handoverNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDetail.type === 'medical' && (
                <div className="space-y-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nama Pasien:</span>
                        <strong className="text-white">{selectedDetail.data.studentName}</strong>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        {selectedDetail.data.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Diagnosa / Keluhan:</span>
                      <p className="text-amber-300 font-bold">{selectedDetail.data.diagnosis || selectedDetail.data.symptoms}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Suhu Tubuh:</span>
                        <span className="text-slate-200 font-mono">{selectedDetail.data.temperature || 'Normal'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Izin Istirahat:</span>
                        <span className="text-slate-200 font-bold">{selectedDetail.data.restDays} Hari</span>
                      </div>
                    </div>
                    {selectedDetail.data.treatment && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Tindakan & Terapi Obat:</span>
                        <p className="text-slate-200">{selectedDetail.data.treatment}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                      <span>Pemeriksa: {selectedDetail.data.officer}</span>
                      <span>Tanggal: {selectedDetail.data.date} {selectedDetail.data.time || ''}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'leave' && (
                <div className="space-y-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nama Siswa:</span>
                        <strong className="text-white">{selectedDetail.data.studentName}</strong>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {selectedDetail.data.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kategori & Alasan Izin:</span>
                      <p className="text-slate-200 font-medium">
                        {selectedDetail.data.category || selectedDetail.data.type}: {selectedDetail.data.reason}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Waktu Keluar:</span>
                        <span className="text-slate-200 font-mono">{selectedDetail.data.leaveDate} {selectedDetail.data.leaveTime || ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Tenggat Kembali:</span>
                        <span className="text-rose-400 font-mono font-bold">{selectedDetail.data.returnDate} {selectedDetail.data.returnTime || ''}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                      <span>Wali: {selectedDetail.data.caretaker}</span>
                      <span>No Surat: {selectedDetail.data.letterNumber || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Navigation Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetTab =
                    selectedDetail.type === 'attendance'
                      ? 'prayer-attendance'
                      : selectedDetail.type === 'violation'
                      ? 'violations'
                      : selectedDetail.type === 'handover'
                      ? 'special-chronology'
                      : selectedDetail.type === 'medical'
                      ? 'medical'
                      : 'leaves';
                  setSelectedDetail(null);
                  onNavigateTab(targetTab);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-lg shadow-red-950/50"
              >
                <span>Buka Pengelolaan Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
