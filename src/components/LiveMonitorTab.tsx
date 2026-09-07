import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Users,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  Clock,
  Calendar,
  UserCheck,
  X,
  TrendingUp,
  AlertOctagon,
  Activity,
  Volume2,
  VolumeX,
  BellRing,
  Zap,
  Radio,
  Maximize2,
  Minimize2,
  Building,
  Home,
  HeartPulse,
  LogOut,
  CheckCircle2,
  Filter,
  Search,
  ShieldCheck,
  Eye,
  RefreshCw,
  Flame,
  Sparkles,
  ChevronRight,
  Bed,
  Utensils,
  BookOpen,
  Moon,
  Sun,
  GraduationCap,
  Sparkle,
  SlidersHorizontal,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { Student, Violation, PrayerAttendance, AppConfig, Leave, MedicalRecord, Counseling } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { playAttendanceVoice, playChimeBeep, primeAttendanceAudio } from '../utils/attendanceAudio';
import { getCanonicalDormName, getDormKey } from '../utils/dormHelper';

interface LiveMonitorTabProps {
  onClose?: () => void;
  students: Student[];
  violations: Violation[];
  prayerAttendance: PrayerAttendance[];
  config: AppConfig;
  leaves?: Leave[];
  medicalRecords?: MedicalRecord[];
  counseling?: Counseling[];
}

type MonitorViewMode = 'split' | 'houses' | 'safeguarding' | 'timeline';

interface RoutinePhase {
  id: string;
  name: string;
  category: 'Ibadah' | 'Makan' | 'Akademik' | 'Istirahat' | 'Baris';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  startHour: number;
  endHour: number;
  icon: string;
}

const BOARDING_ROUTINES: RoutinePhase[] = [
  { id: 'tahajjud', name: 'Tahajjud & Qiyamul Lail', category: 'Ibadah', startTime: '03:30', endTime: '04:30', startHour: 3.5, endHour: 4.5, icon: 'moon' },
  { id: 'subuh', name: 'Sholat Subuh & Al-Ma\'tsurat', category: 'Ibadah', startTime: '04:30', endTime: '05:45', startHour: 4.5, endHour: 5.75, icon: 'sun' },
  { id: 'sarapan', name: 'Sarapan Pagi / Dining Hall', category: 'Makan', startTime: '06:00', endTime: '07:00', startHour: 6.0, endHour: 7.0, icon: 'utensils' },
  { id: 'sekolah', name: 'Kegiatan Belajar & Dhuha', category: 'Akademik', startTime: '07:15', endTime: '11:45', startHour: 7.25, endHour: 11.75, icon: 'book' },
  { id: 'dzuhur', name: 'Sholat Dzuhur Berjamaah', category: 'Ibadah', startTime: '11:45', endTime: '13:00', startHour: 11.75, endHour: 13.0, icon: 'sun' },
  { id: 'makan_siang', name: 'Makan Siang Asrama', category: 'Makan', startTime: '13:00', endTime: '14:00', startHour: 13.0, endHour: 14.0, icon: 'utensils' },
  { id: 'ashar', name: 'Sholat Ashar & Ekstrakurikuler', category: 'Ibadah', startTime: '15:15', endTime: '16:45', startHour: 15.25, endHour: 16.75, icon: 'sun' },
  { id: 'maghrib', name: 'Sholat Maghrib & Tahsin Al-Qur\'an', category: 'Ibadah', startTime: '17:45', endTime: '18:50', startHour: 17.75, endHour: 18.83, icon: 'moon' },
  { id: 'makan_malam', name: 'Makan Malam Asrama', category: 'Makan', startTime: '18:50', endTime: '19:40', startHour: 18.83, endHour: 19.67, icon: 'utensils' },
  { id: 'isya', name: 'Sholat Isya & Ta\'lim Malam', category: 'Ibadah', startTime: '19:40', endTime: '20:30', startHour: 19.67, endHour: 20.5, icon: 'moon' },
  { id: 'belajar_malam', name: 'Belajar Mandiri Terbimbing (Night Prep)', category: 'Akademik', startTime: '20:30', endTime: '22:00', startHour: 20.5, endHour: 22.0, icon: 'book' },
  { id: 'jam_malam', name: 'Apel Malam & Jam Tidur (Curfew)', category: 'Istirahat', startTime: '22:00', endTime: '03:30', startHour: 22.0, endHour: 27.5, icon: 'bed' }
];

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
  onClose,
  students,
  violations,
  prayerAttendance,
  config,
  leaves = [],
  medicalRecords = [],
  counseling = []
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<MonitorViewMode>('split');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [violationSeverityFilter, setViolationSeverityFilter] = useState<string>('ALL');
  const [dormStudentStatusFilter, setDormStudentStatusFilter] = useState<'ALL' | 'HADIR' | 'BELUM' | 'IZIN_SAKIT'>('ALL');
  const [selectedDormBuildingFilter, setSelectedDormBuildingFilter] = useState<string>('ALL');

  const [highlightedViolationIds, setHighlightedViolationIds] = useState<Set<string>>(new Set());
  const [newAlertBanner, setNewAlertBanner] = useState<{
    id: string;
    studentName: string;
    violation: string;
    level: number;
    timestamp: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const initialMountRef = useRef<boolean>(false);
  const previousViolationIdsRef = useRef<Set<string>>(new Set());

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  // Determine current active routine from clock
  const currentActiveRoutine = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    let currentHourDecimal = hours + minutes / 60;
    // Handle overnight after midnight
    if (currentHourDecimal < 3.5) {
      currentHourDecimal += 24;
    }

    const found = BOARDING_ROUTINES.find(
      (r) => currentHourDecimal >= r.startHour && currentHourDecimal < r.endHour
    );
    return found || BOARDING_ROUTINES[BOARDING_ROUTINES.length - 1];
  }, [currentTime]);

  // Session name to filter attendance
  const effectiveSessionName = useMemo(() => {
    if (selectedSessionFilter !== 'AUTO') {
      return selectedSessionFilter;
    }
    // Map current active routine to attendance session names
    const rName = currentActiveRoutine.name.toLowerCase();
    if (rName.includes('subuh')) return 'Subuh';
    if (rName.includes('sarapan')) return 'Sarapan Pagi';
    if (rName.includes('dzuhur')) return 'Dzuhur';
    if (rName.includes('makan siang')) return 'Makan Siang';
    if (rName.includes('ashar')) return 'Ashar';
    if (rName.includes('maghrib')) return 'Maghrib';
    if (rName.includes('makan malam')) return 'Makan Malam';
    if (rName.includes('isya')) return 'Isya';
    if (rName.includes('tahajjud')) return 'Tahajjud / Qiyamul Lail';
    if (rName.includes('belajar')) return 'Belajar Malam';
    return 'Apel / Baris Asrama';
  }, [selectedSessionFilter, currentActiveRoutine]);

  // Audio alert chime for new violation arrival
  const triggerAudioAlert = useCallback((level: number) => {
    if (!soundEnabled) return;
    primeAttendanceAudio();
    if (level >= 4) {
      playChimeBeep('error', soundEnabled);
    } else if (level === 3) {
      playChimeBeep('warning', soundEnabled);
    } else {
      playChimeBeep('warning', soundEnabled);
    }
  }, [soundEnabled]);

  // Live violation detection during monitor session
  useEffect(() => {
    const currentIds = new Set(violations.map((v) => String(v.id).trim()));

    if (!initialMountRef.current) {
      initialMountRef.current = true;
      previousViolationIdsRef.current = currentIds;
      return;
    }

    const prevIds = previousViolationIdsRef.current;
    const newlyAdded = violations.filter((v) => !prevIds.has(String(v.id).trim()));

    if (newlyAdded.length > 0) {
      const newIds = newlyAdded.map((v) => String(v.id).trim());

      setHighlightedViolationIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      const latest = newlyAdded[0];
      setNewAlertBanner({
        id: latest.id,
        studentName: latest.studentName,
        violation: latest.violation,
        level: latest.level,
        timestamp: Date.now()
      });

      triggerAudioAlert(latest.level);

      const highlightTimer = setTimeout(() => {
        setHighlightedViolationIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 30000);

      const bannerTimer = setTimeout(() => {
        setNewAlertBanner((curr) => (curr?.id === latest.id ? null : curr));
      }, 12000);

      previousViolationIdsRef.current = currentIds;

      return () => {
        clearTimeout(highlightTimer);
        clearTimeout(bannerTimer);
      };
    }

    previousViolationIdsRef.current = currentIds;
  }, [violations, triggerAudioAlert]);

  // Manual test trigger for demonstration/testing
  const handleTriggerTestAnimation = () => {
    primeAttendanceAudio();
    if (violations.length === 0) return;
    const target = violations[0];
    const targetId = String(target.id).trim();

    setHighlightedViolationIds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });

    setNewAlertBanner({
      id: target.id,
      studentName: target.studentName,
      violation: target.violation,
      level: target.level,
      timestamp: Date.now()
    });

    triggerAudioAlert(target.level);

    setTimeout(() => {
      setHighlightedViolationIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }, 20000);
  };

  const todayStr = currentTime.toISOString().split('T')[0];

  // Census & Core Metrics
  const totalStudents = students.length;
  const countSD = students.filter((s) => s.class === 'SD').length;
  const countSMP = students.filter((s) => s.class === 'SMP').length;
  const countSMA = students.filter((s) => s.class === 'SMA').length;

  // Active Leaves (Students with approved active leave right now)
  const activeLeavesCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'Active').length;
  }, [leaves]);

  // Active Medical / UKS (Students currently receiving care or resting)
  const activeMedicalCount = useMemo(() => {
    return medicalRecords.filter(
      (m) =>
        m.status === 'Dalam Perawatan' ||
        m.status === 'Istirahat di Kamar' ||
        m.status === 'Dirujuk ke RS/Klinik'
    ).length;
  }, [medicalRecords]);

  // Estimated on-campus boarders
  const estimatedInHouse = Math.max(0, totalStudents - activeLeavesCount);

  // Today's Violations
  const todayViolations = useMemo(() => {
    return violations.filter((v) => v.date && v.date.startsWith(todayStr));
  }, [violations, todayStr]);

  const severeViolationsToday = todayViolations.filter((v) => v.level >= 4).length;
  const moderateViolationsToday = todayViolations.filter((v) => v.level === 3).length;
  const minorViolationsToday = todayViolations.filter((v) => v.level <= 2).length;

  // Active Session Attendance
  const sessionAttendanceRecords = useMemo(() => {
    return prayerAttendance
      .filter((a) => a.date && a.date.startsWith(todayStr) && (effectiveSessionName === 'ALL_SESSIONS' ? true : a.prayerTime === effectiveSessionName))
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [prayerAttendance, todayStr, effectiveSessionName]);

  const presentCount = sessionAttendanceRecords.filter(
    (a) => a.status && a.status.toLowerCase().includes('hadir')
  ).length;
  const lateCount = sessionAttendanceRecords.filter(
    (a) => a.status && (a.status.toLowerCase().includes('terlambat') || a.status.toLowerCase().includes('telat'))
  ).length;
  const sickCount = sessionAttendanceRecords.filter(
    (a) => a.status && a.status.toLowerCase().includes('sakit')
  ).length;
  const leaveCount = sessionAttendanceRecords.filter(
    (a) => a.status && a.status.toLowerCase().includes('pulang')
  ).length;

  const attendanceComplianceRate = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

  // Filtered Live Attendance List for Display
  const filteredAttendanceList = useMemo(() => {
    return sessionAttendanceRecords.filter((att) => {
      if (selectedClassFilter !== 'ALL' && att.class !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (att.studentName || '').toLowerCase().includes(q);
        const matchId = (att.studentId || '').toLowerCase().includes(q);
        const matchDorm = (att.dorm || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDorm) return false;
      }
      return true;
    });
  }, [sessionAttendanceRecords, selectedClassFilter, searchQuery]);

  // Filtered Recent Violations for Display
  const filteredViolationsList = useMemo(() => {
    let list = [...violations];

    if (violationSeverityFilter === 'CRITICAL') {
      list = list.filter((v) => v.level >= 4);
    } else if (violationSeverityFilter === 'MODERATE') {
      list = list.filter((v) => v.level === 3);
    } else if (violationSeverityFilter === 'MINOR') {
      list = list.filter((v) => v.level <= 2);
    }

    if (selectedClassFilter !== 'ALL') {
      list = list.filter((v) => v.class === selectedClassFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          (v.studentName || '').toLowerCase().includes(q) ||
          (v.violation || '').toLowerCase().includes(q) ||
          (v.dorm || '').toLowerCase().includes(q)
      );
    }

    return list
      .sort((a, b) => {
        const aId = String(a.id).trim();
        const bId = String(b.id).trim();
        const aIsNew = highlightedViolationIds.has(aId);
        const bIsNew = highlightedViolationIds.has(bId);
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        return (b.date || '').localeCompare(a.date || '');
      })
      .slice(0, 15);
  }, [violations, violationSeverityFilter, selectedClassFilter, searchQuery, highlightedViolationIds]);

  // Dormitory Houses Grouping with detailed Student Names & Status
  const dormitoryHouseStats = useMemo(() => {
    const housesMap = new Map<
      string,
      {
        name: string;
        total: number;
        present: number;
        late: number;
        sick: number;
        leave: number;
        unscanned: number;
        careTaker?: string;
        students: {
          id: string;
          name: string;
          class: string;
          dorm: string;
          caretaker?: string;
          gender?: string;
          status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin Pulang' | 'Belum Absen';
          time?: string;
          details?: string;
        }[];
      }
    >();

    // Attendance map for current session
    const attendedMap = new Map<string, PrayerAttendance>();
    sessionAttendanceRecords.forEach((att) => {
      attendedMap.set(String(att.studentId).toLowerCase().trim(), att);
    });

    // Active leaves
    const activeLeavesMap = new Map<string, Leave>();
    leaves
      .filter((l) => l.status === 'Active')
      .forEach((l) => {
        activeLeavesMap.set(String(l.studentId).toLowerCase().trim(), l);
      });

    // Active medical patients
    const activeMedicalMap = new Map<string, MedicalRecord>();
    medicalRecords
      .filter((m) => m.status !== 'Sembuh / Kembali Sekolah')
      .forEach((m) => {
        activeMedicalMap.set(String(m.studentId).toLowerCase().trim(), m);
      });

    // Seed and populate all students into their respective unified dorms
    students.forEach((s) => {
      const canonicalName = getCanonicalDormName(s.dorm, config?.dormList);
      const dormKey = getDormKey(canonicalName) || 'utama';

      if (!housesMap.has(dormKey)) {
        housesMap.set(dormKey, {
          name: canonicalName,
          total: 0,
          present: 0,
          late: 0,
          sick: 0,
          leave: 0,
          unscanned: 0,
          careTaker: s.caretaker,
          students: []
        });
      }
      const entry = housesMap.get(dormKey)!;
      if (!entry.careTaker && s.caretaker) {
        entry.careTaker = s.caretaker;
      }
      // Upgrade name to complete "Asrama ..." title if shorter variation was first
      if (canonicalName.startsWith('Asrama ') && !entry.name.startsWith('Asrama ')) {
        entry.name = canonicalName;
      }

      const stId = String(s.id).toLowerCase().trim();
      const att = attendedMap.get(stId);
      const leave = activeLeavesMap.get(stId);
      const med = activeMedicalMap.get(stId);

      let status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin Pulang' | 'Belum Absen' = 'Belum Absen';
      let time = att?.timestamp ? att.timestamp.slice(0, 5) : undefined;
      let details = '';

      if (med) {
        status = 'Sakit';
        details = `UKS: ${med.diagnosis || 'Rawat'}`;
        entry.sick += 1;
      } else if (leave) {
        status = 'Izin Pulang';
        details = `Izin: ${leave.reason || 'Izin Keluar'}`;
        entry.leave += 1;
      } else if (att) {
        const stLower = (att.status || '').toLowerCase();
        if (stLower.includes('hadir')) {
          status = 'Hadir';
          entry.present += 1;
        } else if (stLower.includes('terlambat') || stLower.includes('telat')) {
          status = 'Terlambat';
          entry.late += 1;
        } else if (stLower.includes('sakit')) {
          status = 'Sakit';
          entry.sick += 1;
        } else if (stLower.includes('pulang')) {
          status = 'Izin Pulang';
          entry.leave += 1;
        } else {
          status = 'Belum Absen';
          entry.unscanned += 1;
        }
      } else {
        status = 'Belum Absen';
        entry.unscanned += 1;
      }

      entry.total += 1;
      entry.students.push({
        id: s.id,
        name: s.name,
        class: s.class,
        dorm: entry.name,
        caretaker: s.caretaker,
        gender: s.gender,
        status,
        time,
        details
      });
    });

    // Sort students alphabetically inside each dorm
    housesMap.forEach((house) => {
      house.students.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Array.from(housesMap.values()).sort((a, b) => b.total - a.total);
  }, [students, sessionAttendanceRecords, leaves, medicalRecords, config?.dormList]);

  // Filtered houses based on building selector
  const displayedHouses = useMemo(() => {
    if (selectedDormBuildingFilter === 'ALL') {
      return dormitoryHouseStats;
    }
    const filterKey = getDormKey(selectedDormBuildingFilter);
    return dormitoryHouseStats.filter(
      (h) => h.name === selectedDormBuildingFilter || getDormKey(h.name) === filterKey
    );
  }, [dormitoryHouseStats, selectedDormBuildingFilter]);

  // Active counseling alerts
  const urgentCounselingCount = useMemo(() => {
    return counseling.filter(
      (c) => c.status === 'Open' && (c.urgencyLevel === 'Mendesak / Darurat' || c.urgencyLevel === 'Perhatian Khusus')
    ).length;
  }, [counseling]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0A0E17] text-slate-100 flex flex-col h-screen overflow-hidden font-sans select-none"
    >
      {/* ================= TOP COMMAND CENTER MASTER HEADER ================= */}
      <header className="bg-slate-950/95 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-2xl relative z-20 flex-shrink-0">
        {/* Left: Institutional Identity & Sensor Status */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-900 via-indigo-900 to-cyan-700 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center border border-cyan-500/30">
              <ShieldAlert className="w-6 h-6 text-cyan-300" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase truncate flex items-center gap-2">
                <span>BOARDING COMMAND CENTER</span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" /> LIVE TELEMETRY
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate">
              {config.kopKiri?.split('\n')[0] || 'International Boarding Academy'} •{' '}
              <span className="text-slate-300">Pusat Pengawasan Terpadu & Absensi Real-Time</span>
            </p>
          </div>
        </div>

        {/* Center: Quick Mode Switcher */}
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveView('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'split'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dual Feed Live</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('houses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'houses'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Nama Siswa Asrama ({dormitoryHouseStats.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('safeguarding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'safeguarding'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safeguarding & UKS</span>
          </button>
        </div>

        {/* Right: Master Clock, Audio & Fullscreen Actions */}
        <div className="flex items-center gap-3">
          {/* Audio Alert Toggle */}
          <button
            type="button"
            onClick={() => {
              primeAttendanceAudio();
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playChimeBeep('success', true);
            }}
            className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Audio Alert Aktif (Klik untuk mute)' : 'Audio Alert Nonaktif'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Mute'}</span>
          </button>

          {/* Test Alert Button */}
          <button
            type="button"
            onClick={handleTriggerTestAnimation}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs font-bold transition-all"
            title="Uji simulasi kedip & alarm pelanggaran darurat"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Uji Alarm</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/70 text-xs font-bold transition-all flex items-center gap-1.5"
            title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Layar Penuh (F11 / TV Display Mode)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
          </button>

          {/* Digital Clock with seconds */}
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-3">
            <div className="text-right">
              <div className="text-base sm:text-lg font-mono font-black text-cyan-400 tracking-wider flex items-center gap-1 leading-none">
                <Clock className="w-3.5 h-3.5 text-cyan-400/80" />
                <span>
                  {currentTime.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white transition-all border border-slate-700"
              title="Kembali ke Dasbor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* ================= DAILY BOARDING ROUTINE & SCHEDULE MATRIX BAR ================= */}
      <div className="bg-[#0D1321] border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-cyan-400 tracking-wider bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            ROUTINE STATUS:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
              {currentActiveRoutine.name} ({currentActiveRoutine.startTime} - {currentActiveRoutine.endTime})
            </span>
          </div>
        </div>

        {/* Quick Session Filter Selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Filter Sesi Presensi:</span>
          <select
            value={selectedSessionFilter}
            onChange={(e) => setSelectedSessionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="AUTO">Otomatis ({effectiveSessionName})</option>
            <option value="Subuh">Subuh</option>
            <option value="Sarapan Pagi">Sarapan Pagi</option>
            <option value="Dzuhur">Dzuhur</option>
            <option value="Makan Siang">Makan Siang</option>
            <option value="Ashar">Ashar</option>
            <option value="Maghrib">Maghrib</option>
            <option value="Makan Malam">Makan Malam</option>
            <option value="Isya">Isya</option>
            <option value="Tahajjud / Qiyamul Lail">Tahajjud</option>
            <option value="Belajar Malam">Belajar Malam</option>
            <option value="ALL_SESSIONS">Semua Sesi Hari Ini</option>
          </select>
        </div>
      </div>

      {/* ================= EXECUTIVE BOARDING CENSUS BENTO BAR ================= */}
      <div className="bg-slate-900/40 border-b border-slate-800/70 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Boarders */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Siswa Asrama</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-white">{totalStudents}</span>
                <span className="text-[10px] text-slate-400 font-medium">Siswa</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold mt-0.5">
                <span>SD:{countSD}</span>
                <span>•</span>
                <span>SMP:{countSMP}</span>
                <span>•</span>
                <span>SMA:{countSMA}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Session Attendance Rate */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Presensi {effectiveSessionName === 'ALL_SESSIONS' ? 'Hari Ini' : effectiveSessionName}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-emerald-400">
                  {attendanceComplianceRate.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">
                  ({presentCount + lateCount}/{totalStudents})
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceComplianceRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: In-House Campus Census */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Sensus di Kampus</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-cyan-300">{estimatedInHouse}</span>
                <span className="text-[10px] text-slate-400">Di Lingkungan</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                {((estimatedInHouse / Math.max(1, totalStudents)) * 100).toFixed(0)}% Kapasitas Terisi
              </p>
            </div>
          </div>

          {/* Card 4: Off-Campus Exeat / Leave */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Izin Pulang / Pesiar</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-purple-300">{activeLeavesCount}</span>
                <span className="text-[10px] text-slate-400">Siswa Izin</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                Exeat Resmi Disetujui
              </p>
            </div>
          </div>

          {/* Card 5: UKS & Infirmary Rest */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex-shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Perawatan UKS</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-teal-300">{activeMedicalCount}</span>
                <span className="text-[10px] text-slate-400">Dirawat</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                Klinik Asrama & RS
              </p>
            </div>
          </div>

          {/* Card 6: Safeguarding & Disciplinary Incidents */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
              severeViolationsToday > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Pelanggaran Hari Ini</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-xl font-black ${severeViolationsToday > 0 ? 'text-rose-400' : 'text-white'}`}>
                  {todayViolations.length}
                </span>
                <span className="text-[10px] text-slate-400">
                  (Kritis: {severeViolationsToday})
                </span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                Lvl 3: {moderateViolationsToday} • Ringan: {minorViolationsToday}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LIVE INCOMING ALERT BANNER (Floating High-Priority) ================= */}
      {newAlertBanner && (
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white px-5 py-2.5 shadow-2xl flex items-center justify-between border-y border-red-400/40 animate-pulse flex-shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/20 rounded-xl flex-shrink-0">
              <BellRing className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-white text-rose-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                  DISCIPLINARY ALERT
                </span>
                <span className="text-xs text-rose-100 font-medium truncate">
                  Insiden baru terdeteksi di asrama
                </span>
              </div>
              <p className="font-bold text-sm mt-0.5 text-white truncate">
                <span className="text-amber-200 underline decoration-amber-300 font-black">{newAlertBanner.studentName}</span> — {newAlertBanner.violation} (Level {newAlertBanner.level})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewAlertBanner(null)}
            className="p-1 bg-black/20 hover:bg-black/40 rounded-lg text-white transition-colors flex-shrink-0 ml-3"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0 bg-[#0A0E17]">
        {/* Search & Filter Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa, NISN, asrama, atau insiden..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 pl-9 pr-8 py-1.5 text-xs text-slate-200 rounded-xl placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Kelas:</span>
              {(['ALL', 'SD', 'SMP', 'SMA'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedClassFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                    selectedClassFilter === lvl
                      ? 'bg-cyan-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'ALL' ? 'Semua' : lvl}
                </button>
              ))}
            </div>

            {activeView === 'split' && (
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Level:</span>
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'CRITICAL', label: 'Lvl 4-5' },
                  { id: 'MODERATE', label: 'Lvl 3' },
                  { id: 'MINOR', label: 'Lvl 1-2' }
                ].map((sev) => (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setViolationSeverityFilter(sev.id)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      violationSeverityFilter === sev.id
                        ? 'bg-rose-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev.label}
                  </button>
                ))}
              </div>
            )}

            {activeView === 'houses' && (
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Status Siswa:</span>
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'HADIR', label: 'Hadir' },
                  { id: 'BELUM', label: 'Belum Absen' },
                  { id: 'IZIN_SAKIT', label: 'Izin / Sakit' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDormStudentStatusFilter(st.id as any)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      dormStudentStatusFilter === st.id
                        ? 'bg-cyan-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View 1: Split Dual Feed (Primary Command View) */}
        {activeView === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0 overflow-hidden">
            {/* Left Column: Campus Roll Call & Live Check-In Feed */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-3.5 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Live Check-In: {effectiveSessionName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        {filteredAttendanceList.length} Entri
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">Pindai QR / RFID MFRC522 / Presensi Wali Asuh</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {presentCount} Hadir
                  </span>
                  <span>•</span>
                  <span className="text-amber-400">{lateCount} Telat</span>
                </div>
              </div>

              {/* Feed List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar min-h-0">
                {filteredAttendanceList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                    <UserCheck className="w-12 h-12 mb-2.5 opacity-40 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">Belum ada data scan sesi ini</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Silakan lakukan scan QR Code pada tab QR Scanner Live atau gunakan barcode scanner USB.
                    </p>
                  </div>
                ) : (
                  filteredAttendanceList.map((att, idx) => {
                    const isPresent = (att.status || '').toLowerCase().includes('hadir');
                    const isLate = (att.status || '').toLowerCase().includes('terlambat') || (att.status || '').toLowerCase().includes('telat');
                    const isSick = (att.status || '').toLowerCase().includes('sakit');
                    const isLeave = (att.status || '').toLowerCase().includes('pulang');

                    return (
                      <div
                        key={att.id || idx}
                        className="bg-slate-900/90 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800/90 flex items-center justify-between gap-3 shadow-md transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Student Initial Circle */}
                          <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 border ${
                            isPresent
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                              : isLate
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                              : isSick
                              ? 'bg-teal-950/60 text-teal-300 border-teal-700/50'
                              : 'bg-purple-950/60 text-purple-300 border-purple-700/50'
                          }`}>
                            {(att.studentName || 'S').charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {att.studentName}
                              </h3>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {att.class || 'SD'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {att.dorm || 'Asrama'} • NISN: {att.studentId || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Status & Timestamp */}
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isPresent
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                : isLate
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                : isSick
                                ? 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                                : 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                            }`}
                          >
                            {att.status || 'Hadir'}
                          </span>
                          <p className="text-[11px] font-mono font-bold text-slate-400 mt-1">
                            {att.timestamp ? att.timestamp.substring(0, 8) : '--:--:--'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Safeguarding & Disciplinary Live Incident Log */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-3.5 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Safeguarding & Disiplin</span>
                      {highlightedViolationIds.size > 0 && (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-slate-400">Pemantauan Insiden Ketertiban Siswa 24 Jam</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-rose-950/60 text-rose-300 border border-rose-700/50 px-2.5 py-1 rounded-full text-[11px] font-bold">
                    {filteredViolationsList.length} Insiden
                  </span>
                </div>
              </div>

              {/* Incidents List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar min-h-0">
                {filteredViolationsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                    <ShieldCheck className="w-12 h-12 mb-2.5 opacity-40 text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-300">Nihil Pelanggaran</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Seluruh siswa dalam status disiplin baik. Tidak ada insiden yang dilaporkan sesuai kriteria filter.
                    </p>
                  </div>
                ) : (
                  filteredViolationsList.map((v) => {
                    const vId = String(v.id).trim();
                    const isHighlighted = highlightedViolationIds.has(vId);

                    return (
                      <div
                        key={v.id}
                        className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden shadow-md ${
                          isHighlighted
                            ? 'animate-flash-glow border-rose-500 ring-2 ring-rose-500/80 bg-rose-950/40 shadow-rose-900/50'
                            : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {isHighlighted && (
                          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 animate-pulse" />
                        )}

                        <div className="flex items-start gap-3">
                          {/* Severity Level Badge */}
                          <div
                            className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center min-w-[2.75rem] flex-shrink-0 border ${
                              isHighlighted
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 animate-pulse border-rose-400'
                                : v.level >= 4
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                                : v.level === 3
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tighter opacity-80">LEVEL</span>
                            <span className="text-sm font-black leading-none mt-0.5">{v.level}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <h3 className="text-sm font-bold text-white truncate">{v.studentName}</h3>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {v.class || 'SD'}
                                </span>
                              </div>

                              {isHighlighted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHighlightedViolationIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(vId);
                                      return next;
                                    });
                                  }}
                                  className="text-[9px] font-bold text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 px-2 py-0.5 rounded-md border border-rose-700 transition-colors flex-shrink-0"
                                >
                                  Tandai Dibaca
                                </button>
                              )}
                            </div>

                            <p className={`text-xs font-semibold mt-1 ${isHighlighted ? 'text-rose-200' : 'text-amber-300'}`}>
                              {v.violation}
                            </p>

                            {v.sanction && (
                              <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                                Sanksi: {v.sanction}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-2">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {formatDateIndonesian(v.date)}
                              </span>
                              {v.dorm && (
                                <span className="text-slate-400 truncate">
                                  • Asrama: {v.dorm}
                                </span>
                              )}
                              {v.reporter && (
                                <span className="text-slate-400 truncate">
                                  • Pelapor: {v.reporter}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Dormitory Houses - Daftar Nama Siswa */}
        {activeView === 'houses' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Asrama Building Selector Tabs */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1 flex-shrink-0">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                Pilih Gedung:
              </span>
              <button
                type="button"
                onClick={() => setSelectedDormBuildingFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  selectedDormBuildingFilter === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Semua Gedung ({dormitoryHouseStats.length})
              </button>
              {dormitoryHouseStats.map((h) => (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => setSelectedDormBuildingFilter(h.name)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 truncate max-w-[180px] ${
                    selectedDormBuildingFilter === h.name
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {h.name} ({h.total})
                </button>
              ))}
            </div>

            {/* List / Grid of Asrama with Student Names */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedHouses.map((house) => {
                  const filteredStudents = house.students.filter((st) => {
                    // Class filter
                    if (selectedClassFilter !== 'ALL' && st.class !== selectedClassFilter) return false;
                    // Status filter
                    if (dormStudentStatusFilter === 'HADIR') {
                      if (st.status !== 'Hadir' && st.status !== 'Terlambat') return false;
                    } else if (dormStudentStatusFilter === 'BELUM') {
                      if (st.status !== 'Belum Absen') return false;
                    } else if (dormStudentStatusFilter === 'IZIN_SAKIT') {
                      if (st.status !== 'Sakit' && st.status !== 'Izin Pulang') return false;
                    }
                    // Search query
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase().trim();
                      const matchName = st.name.toLowerCase().includes(q);
                      const matchId = st.id.toLowerCase().includes(q);
                      const matchClass = st.class.toLowerCase().includes(q);
                      if (!matchName && !matchId && !matchClass) return false;
                    }
                    return true;
                  });

                  return (
                    <div
                      key={house.name}
                      className="bg-slate-900/80 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-3 overflow-hidden"
                    >
                      {/* Asrama Header */}
                      <div>
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                              <Home className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-base truncate">{house.name}</h3>
                              <p className="text-xs text-slate-400 truncate">
                                Wali Asrama: {house.careTaker || 'Pembina Gedung'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-cyan-300 bg-cyan-950/70 border border-cyan-800/40 px-2.5 py-1 rounded-xl flex-shrink-0">
                            {filteredStudents.length} Siswa
                          </span>
                        </div>

                        {/* Quick Summary Badges */}
                        <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold flex-wrap">
                          <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Hadir: {house.present + house.late}
                          </span>
                          <span className="bg-slate-800/80 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded-md">
                            Belum Absen: {house.unscanned}
                          </span>
                          {(house.sick > 0 || house.leave > 0) && (
                            <span className="bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded-md">
                              Izin/Sakit: {house.sick + house.leave}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student Names List */}
                      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1 custom-scrollbar min-h-[180px]">
                        {filteredStudents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-center">
                            <Users className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                            <p className="text-xs font-bold text-slate-300">Tidak ada siswa yang sesuai</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Silakan sesuaikan filter status atau pencarian.</p>
                          </div>
                        ) : (
                          filteredStudents.map((st) => {
                            const initials = st.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase();

                            return (
                              <div
                                key={st.id}
                                className="bg-slate-950/70 hover:bg-slate-800/70 p-2.5 rounded-2xl border border-slate-800/80 transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-black text-slate-200 flex-shrink-0 group-hover:border-cyan-500/50 group-hover:text-cyan-300 transition-colors">
                                    {initials || 'SR'}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight group-hover:text-cyan-200 transition-colors">
                                      {st.name}
                                    </h4>
                                    <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                                      <span className="font-semibold text-cyan-400/90">{st.class}</span>
                                      <span>•</span>
                                      <span className="font-mono text-slate-400">{st.id}</span>
                                      {st.details && (
                                        <>
                                          <span>•</span>
                                          <span className="text-amber-400/90 truncate">{st.details}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex-shrink-0">
                                  {st.status === 'Hadir' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Hadir</span>
                                      {st.time && <span className="text-emerald-400/80 font-mono text-[9px]">{st.time}</span>}
                                    </span>
                                  )}
                                  {st.status === 'Terlambat' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-950/90 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      <span>Telat</span>
                                      {st.time && <span className="text-amber-400/80 font-mono text-[9px]">{st.time}</span>}
                                    </span>
                                  )}
                                  {st.status === 'Sakit' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-950/90 text-teal-300 border border-teal-700/50 flex items-center gap-1">
                                      <HeartPulse className="w-3 h-3 text-teal-400" />
                                      <span>Sakit</span>
                                    </span>
                                  )}
                                  {st.status === 'Izin Pulang' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-950/90 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                                      <LogOut className="w-3 h-3 text-purple-400" />
                                      <span>Izin</span>
                                    </span>
                                  )}
                                  {st.status === 'Belum Absen' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                      <span>Belum Absen</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Card Footer Summary */}
                      <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-2.5 mt-1">
                        <span className="truncate">
                          Hadir: <strong className="text-emerald-400">{house.present + house.late}</strong> • Belum: <strong className="text-slate-300">{house.unscanned}</strong>
                        </span>
                        <span className="text-slate-400 font-medium">
                          Total {house.total} Siswa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View 3: Safeguarding & Medical Health Board */}
        {activeView === 'safeguarding' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 min-h-0 overflow-hidden">
            {/* Column 1: Active Infirmary / UKS */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Pasien Rawat UKS</h3>
                    <p className="text-[11px] text-slate-400">Pengawasan Medis Asrama</p>
                  </div>
                </div>
                <span className="text-xs font-black text-teal-300 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800/40">
                  {activeMedicalCount} Siswa
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0">
                {medicalRecords.filter(m => m.status !== 'Sembuh / Kembali Sekolah').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-4">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-teal-500 opacity-60" />
                    <p className="text-xs font-bold text-slate-300">Seluruh Siswa Sehat</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nihil siswa dalam perawatan UKS saat ini.</p>
                  </div>
                ) : (
                  medicalRecords
                    .filter(m => m.status !== 'Sembuh / Kembali Sekolah')
                    .map((m) => (
                      <div key={m.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{m.studentName}</h4>
                          <span className="text-[9px] font-bold text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-700/40">
                            {m.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          <strong className="text-slate-400">Keluhan:</strong> {m.symptoms || m.diagnosis || 'Pemeriksaan UKS'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Lokasi: {m.location} • Petugas: {m.officer}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Column 2: Active Home Leave / Pesiar */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Siswa Sedang Izin Keluar</h3>
                    <p className="text-[11px] text-slate-400">Exeat & Pulang Bermalam</p>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800/40">
                  {activeLeavesCount} Siswa
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0">
                {leaves.filter(l => l.status === 'Active').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-4">
                    <Building className="w-10 h-10 mb-2 text-purple-400 opacity-50" />
                    <p className="text-xs font-bold text-slate-300">Semua di Lingkungan Asrama</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada siswa yang sedang berstatus izin keluar.</p>
                  </div>
                ) : (
                  leaves
                    .filter(l => l.status === 'Active')
                    .map((l) => (
                      <div key={l.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{l.studentName}</h4>
                          <span className="text-[9px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-700/40">
                            {l.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          <strong className="text-slate-400">Alasan:</strong> {l.reason}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Kembali: {l.returnDate} ({l.returnTime || '20:00'})
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Column 3: Counseling & Special Care */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Pendampingan Khusus</h3>
                    <p className="text-[11px] text-slate-400">Bimbingan Konseling & Wali Asuh</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/40">
                  {urgentCounselingCount} Kasus
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0">
                {counseling.filter(c => c.status === 'Open').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-4">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-amber-400 opacity-50" />
                    <p className="text-xs font-bold text-slate-300">Kondisi Kondusif</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada kasus pembinaan khusus terbuka.</p>
                  </div>
                ) : (
                  counseling
                    .filter(c => c.status === 'Open')
                    .slice(0, 10)
                    .map((c) => (
                      <div key={c.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{c.studentName}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            c.urgencyLevel === 'Mendesak / Darurat'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}>
                            {c.urgencyLevel || 'Rutin'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                          {c.caseDescription}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Konselor: {c.counselor} • {c.date}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= COMMAND CENTER FOOTER & TICKER ================= */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-hidden flex-shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-3 flex-shrink-0 font-bold text-slate-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] uppercase tracking-wider text-emerald-400">TELEMETRY SECURE</span>
        </div>

        {/* Live Continuous Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee whitespace-nowrap flex gap-10 text-[11px] font-medium text-slate-400">
            <span>Sensus Kampus: {estimatedInHouse}/{totalStudents} Siswa</span>
            <span>•</span>
            <span>Izin Keluar Resmi: {activeLeavesCount}</span>
            <span>•</span>
            <span>Rawat UKS: {activeMedicalCount}</span>
            <span>•</span>
            <span>Pelanggaran Hari Ini: {todayViolations.length} (Kritis: {severeViolationsToday})</span>
            <span>•</span>
            <span>Jadwal Rutin: {currentActiveRoutine.name} ({currentActiveRoutine.startTime} - {currentActiveRoutine.endTime})</span>
            <span>•</span>
            <span>Pintu Gerbang Utama Terkunci Jam 22:00 WIB • Patroli Keamanan Asrama Aktif</span>
            <span>•</span>
            <span>Gunakan Aplikasi Mobile QR Barcode Gun atau RFID MFRC522 untuk Presensi Cepat</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-[11px] text-slate-500">
          <span>v3.4 Command Center</span>
        </div>
      </footer>

      {/* Embedded High-Performance Animations & Scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 1);
        }
        .animate-marquee {
          animation: marquee 32s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes flash-glow {
          0%, 100% {
            border-color: rgba(244, 63, 94, 0.5);
            box-shadow: 0 0 12px 0 rgba(244, 63, 94, 0.25);
            background-color: rgba(20, 26, 40, 0.95);
          }
          50% {
            border-color: rgba(244, 63, 94, 1);
            box-shadow: 0 0 28px 4px rgba(244, 63, 94, 0.6), inset 0 0 16px 0 rgba(244, 63, 94, 0.3);
            background-color: rgba(88, 28, 44, 0.35);
          }
        }
        .animate-flash-glow {
          animation: flash-glow 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
