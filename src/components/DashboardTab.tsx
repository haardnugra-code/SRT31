import React from 'react';
import {
  Megaphone,
  Plus,
  DoorOpen,
  AlertTriangle,
  Clock,
  Check,
  Scale,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Activity,
  HeartPulse,
  UserCheck,
  FileText,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { Student, Violation, Counseling, Leave, MedicalRecord } from '../types';
import { formatDateIndonesian, parseLocalDate } from '../utils/dateFormatter';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  medicalRecords?: MedicalRecord[];
  announcement: string;
  onOpenViolationModal: () => void;
  onOpenLeaveModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  students,
  violations,
  counseling,
  leaves,
  medicalRecords = [],
  announcement,
  onOpenViolationModal,
  onOpenLeaveModal,
  onNavigateTab
}) => {
  const totalViolations = violations.length;
  const activeCounseling = counseling.filter((c) => c.status !== 'Resolved').length;
  const activeLeaves = leaves.filter((l) => l.status === 'Active').length;
  const severeCases = violations.filter((v) => v.level >= 4).length;

  // Leave Return Urgency / Warning logic
  const getLeaveUrgency = (returnDateStr: string) => {
    if (!returnDateStr) return { status: 'safe', label: 'Normal', diffDays: 99 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnD = parseLocalDate(returnDateStr);
    if (!returnD) return { status: 'safe', label: 'Normal', diffDays: 99 };
    returnD.setHours(0, 0, 0, 0);

    const diffTime = returnD.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        status: 'overdue',
        label: `Terlambat ${overdueDays} Hari`,
        diffDays
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        label: 'Batas Hari Ini',
        diffDays
      };
    } else if (diffDays <= 2) {
      return {
        status: 'near',
        label: `Mendekati Batas (H-${diffDays})`,
        diffDays
      };
    }

    return {
      status: 'safe',
      label: `Aman (H-${diffDays})`,
      diffDays
    };
  };

  const activeLeavesWithUrgency = leaves
    .filter((l) => l.status === 'Active')
    .map((l) => {
      const student = students.find((s) => String(s.id) === String(l.studentId));
      return {
        ...l,
        dorm: student?.dorm || '-',
        studentClass: student?.class || '-',
        urgency: getLeaveUrgency(l.returnDate)
      };
    });

  const overdueLeaves = activeLeavesWithUrgency.filter((l) => l.urgency.status === 'overdue');
  const todayLeaves = activeLeavesWithUrgency.filter((l) => l.urgency.status === 'today');
  const nearLeaves = activeLeavesWithUrgency.filter((l) => l.urgency.status === 'near');

  // Combined warning leaves sorted by diffDays ascending (most overdue first)
  const warningLeaves = activeLeavesWithUrgency
    .filter((l) => l.urgency.status !== 'safe')
    .sort((a, b) => a.urgency.diffDays - b.urgency.diffDays);

  // Running month calculations & 12-month trends data
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthFullNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentMonthName = monthFullNames[currentMonthIdx];

  const monthlyViolations = Array(12).fill(0);
  const monthlyLeaves = Array(12).fill(0);

  let currentMonthViolationsCount = 0;
  let currentMonthLeavesCount = 0;

  violations.forEach((v) => {
    if (!v.date) return;
    const d = parseLocalDate(v.date);
    if (!d) return;
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m >= 0 && m < 12) {
      monthlyViolations[m]++;
      if (m === currentMonthIdx && y === currentYear) {
        currentMonthViolationsCount++;
      }
    }
  });

  leaves.forEach((l) => {
    if (!l.leaveDate) return;
    const d = parseLocalDate(l.leaveDate);
    if (!d) return;
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m >= 0 && m < 12) {
      monthlyLeaves[m]++;
      if (m === currentMonthIdx && y === currentYear) {
        currentMonthLeavesCount++;
      }
    }
  });

  const trendsData = {
    labels: monthShortNames,
    datasets: [
      {
        label: 'Kasus Pelanggaran',
        data: monthlyViolations,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Izin Pulang',
        data: monthlyLeaves,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const levelsCount = [0, 0, 0, 0, 0];
  violations.forEach((v) => {
    if (v.level >= 1 && v.level <= 5) levelsCount[v.level - 1]++;
  });

  const levelsData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5'],
    datasets: [
      {
        data: levelsCount,
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#dc2626'],
        borderWidth: 2
      }
    ]
  };

  const getBadgeClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 2:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 3:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 4:
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 5:
        return 'bg-red-200 text-red-900 border border-red-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const recentViolations = violations.slice(0, 4);
  const recentLeaves = leaves.filter((l) => l.status === 'Active').slice(0, 4);

  interface RecentActivityItem {
    id: string;
    module: 'violation' | 'medical' | 'counseling';
    moduleLabel: string;
    studentName: string;
    date: string;
    parsedDate: Date;
    title: string;
    description: string;
    extraDetail?: string;
    tabKey: 'violations' | 'medical' | 'counseling';
  }

  const recentActivities = React.useMemo(() => {
    const items: RecentActivityItem[] = [];

    violations.forEach((v) => {
      const d = parseLocalDate(v.date) || new Date(0);
      items.push({
        id: `v-${v.id}`,
        module: 'violation',
        moduleLabel: 'Pelanggaran',
        studentName: v.studentName,
        date: v.date,
        parsedDate: d,
        title: v.violation,
        description: `Tingkat ${v.level} • Sanksi: ${v.sanction || 'Teguran'}`,
        extraDetail: v.reporter ? `Pelapor: ${v.reporter}` : undefined,
        tabKey: 'violations'
      });
    });

    (medicalRecords || []).forEach((m) => {
      const d = parseLocalDate(m.date) || new Date(0);
      items.push({
        id: `m-${m.id}`,
        module: 'medical',
        moduleLabel: 'Kesehatan / UKS',
        studentName: m.studentName,
        date: m.date,
        parsedDate: d,
        title: m.symptoms || m.diagnosis || 'Pemeriksaan Kesehatan UKS',
        description: `Diagnosa: ${m.diagnosis || '-'} • Status: ${m.status}`,
        extraDetail: `Lokasi: ${m.location}`,
        tabKey: 'medical'
      });
    });

    counseling.forEach((c) => {
      const d = parseLocalDate(c.date) || new Date(0);
      items.push({
        id: `c-${c.id}`,
        module: 'counseling',
        moduleLabel: 'Konseling BK',
        studentName: c.studentName,
        date: c.date,
        parsedDate: d,
        title: c.caseDescription,
        description: `Status: ${c.status} • Konselor: ${c.counselor}`,
        extraDetail: c.notes ? `Catatan: ${c.notes}` : undefined,
        tabKey: 'counseling'
      });
    });

    // Chronological sort: latest first
    items.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

    // Top 5 entries
    return items.slice(0, 5);
  }, [violations, medicalRecords, counseling]);

  return (
    <div className="space-y-6">
      {/* Announcement Ticker */}
      <div className="bg-indigo-950 text-white flex items-stretch rounded-xl overflow-hidden shadow-md border border-indigo-900/50">
        <div className="bg-indigo-600 font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2.5 whitespace-nowrap z-10 flex items-center gap-2 shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
          <Megaphone className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">Pusat Informasi</span>
          <span className="sm:hidden">Info</span>
        </div>
        <div className="overflow-hidden flex-1 relative flex items-center bg-indigo-950 px-3">
          <marquee className="text-[11px] sm:text-xs font-medium tracking-wide flex items-center w-full text-indigo-100">
            {announcement || 'Memuat pengumuman sistem dari database...'}
          </marquee>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-2xl p-5 md:p-8 text-white shadow-xl shadow-red-900/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Selamat Datang di Portal Buku Pintar Sekolah Rakyat
          </h2>
          <p className="text-white/80 text-xs md:text-sm leading-relaxed">
            Sistem manajemen kedisiplinan asrama terpadu berdasarkan pedoman{' '}
            <strong className="text-white underline">Buku Pintar SR Update</strong>.
            Kelola pelanggaran, proses konseling BK, rutinitas anak asuh, dan izin kepulangan secara otomatis dan responsif.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => onNavigateTab('prayer-attendance')}
            className="flex-1 sm:flex-initial bg-slate-950 text-white font-bold text-xs px-4 py-3 rounded-lg hover:bg-slate-900 transition shadow active:scale-95 text-center flex items-center justify-center gap-1.5 border border-white/20"
          >
            <QrCode className="w-4 h-4 text-amber-300" /> Absensi
          </button>
          <button
            onClick={onOpenViolationModal}
            className="flex-1 sm:flex-initial bg-white text-slate-900 font-bold text-xs px-4 py-3 rounded-lg hover:bg-slate-100 transition shadow active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Catat Pelanggaran
          </button>
          <button
            onClick={onOpenLeaveModal}
            className="flex-1 sm:flex-initial bg-slate-900/40 text-white font-bold text-xs px-4 py-3 rounded-lg hover:bg-slate-900/60 transition backdrop-blur-md border border-white/20 active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <DoorOpen className="w-4 h-4" /> Izin Keluar Asrama
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Kasus Pelanggaran
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {totalViolations}
            </p>
            <p className="text-[9px] md:text-[10px] text-red-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Perlu pembinaan
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Konseling Berjalan
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {activeCounseling}
            </p>
            <p className="text-[9px] md:text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sedang berproses
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Siswa Izin Keluar
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {activeLeaves}
            </p>
            {overdueLeaves.length > 0 ? (
              <p className="text-[9px] md:text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1 animate-pulse">
                <ShieldAlert className="w-3 h-3" /> {overdueLeaves.length} Siswa Terlambat!
              </p>
            ) : (
              <p className="text-[9px] md:text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> Izin aktif terdaftar
              </p>
            )}
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DoorOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Siswa Melanggar Berat
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {severeCases}
            </p>
            <p className="text-[9px] md:text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <Scale className="w-3 h-3" /> T4 & T5
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                Tren Kasus & Perizinan Bulanan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bulan Berjalan ({currentMonthName} {currentYear}): <strong className="text-red-600">{currentMonthViolationsCount} Kasus Pelanggaran</strong> • <strong className="text-emerald-600">{currentMonthLeavesCount} Izin Pulang</strong>
              </p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
              Grafik Bulanan (Jan - Des)
            </span>
          </div>
          <div className="h-60 sm:h-72 relative">
            <Line
              data={trendsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">
            Proporsi Tingkat Pelanggaran
          </h3>
          <div className="h-48 sm:h-56 relative flex items-center justify-center">
            <Doughnut
              data={levelsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '70%'
              }}
            />
          </div>
          <div className="grid grid-cols-3 text-center text-[9px] md:text-[10px] text-slate-400 pt-2 gap-1 border-t border-slate-100">
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
              T1-T2
            </div>
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span>
              T3-T4
            </div>
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 mr-1"></span>
              T5
            </div>
          </div>
        </div>
      </div>

      {/* Visual Warning Panel: Izin Kepulangan Mendekati / Melewati Batas */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  overdueLeaves.length > 0
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight">
                Daftar Izin Kepulangan Mendekati / Melewati Batas
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Pantauan otomatis jadwal kembali siswa yang izin pulang ke asrama.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {overdueLeaves.length > 0 && (
              <span className="text-xs font-bold bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                {overdueLeaves.length} Terlambat
              </span>
            )}
            {todayLeaves.length > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                {todayLeaves.length} Batas Hari Ini
              </span>
            )}
            {nearLeaves.length > 0 && (
              <span className="text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full">
                {nearLeaves.length} Mendekati (≤2hr)
              </span>
            )}
            <button
              onClick={() => onNavigateTab('leaves')}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              Kelola Perizinan <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {warningLeaves.length === 0 ? (
          <div className="py-6 px-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Seluruh Perizinan Berada Dalam Jadwal Aman</p>
              <p className="text-[11px] text-emerald-600">
                Tidak ada siswa yang mengalami keterlambatan atau mendekati batas waktu kembali ke asrama.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {warningLeaves.map((l) => {
              const isOverdue = l.urgency.status === 'overdue';
              const isToday = l.urgency.status === 'today';

              let cardBg = 'bg-yellow-50/50 border-yellow-200';
              let badgeBg = 'bg-yellow-100 text-yellow-900 border-yellow-300';
              let IconComp = Clock;

              if (isOverdue) {
                cardBg = 'bg-red-50/60 border-red-200 ring-1 ring-red-300/50';
                badgeBg = 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse';
                IconComp = AlertTriangle;
              } else if (isToday) {
                cardBg = 'bg-amber-50/60 border-amber-200';
                badgeBg = 'bg-amber-500 text-white border-amber-600';
                IconComp = Clock;
              }

              return (
                <div
                  key={l.id}
                  className={`p-3.5 rounded-xl border ${cardBg} flex flex-col justify-between space-y-2.5 shadow-sm hover:shadow transition`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeBg}`}>
                        <IconComp className="w-3 h-3" />
                        {l.urgency.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                        {l.type}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {l.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Kelas {l.studentClass} • Asrama {l.dorm}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium line-clamp-1 bg-white/60 px-2 py-1 rounded border border-slate-200/60">
                      Alasan: <span className="font-semibold">{l.reason}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <div className="space-y-0.5">
                      <p className="text-slate-500">
                        Jadwal Kembali: <span className="font-bold text-slate-800">{formatDateIndonesian(l.returnDate)}</span>
                      </p>
                      <p className="text-slate-400 text-[9px]">
                        Wali Asuh: {l.caretaker}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateTab('leaves')}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition active:scale-95 shrink-0"
                    >
                      Buka Perizinan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Widget (5 Latest Entries Across Modules) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight flex items-center gap-2">
                Aktivitas Terkini (Recent Activity)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar kronologis 5 catatan terbaru dari modul Pelanggaran, Kesehatan, & Konseling BK.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto shrink-0">
            5 Entri Terbaru
          </span>
        </div>

        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Belum ada catatan aktivitas terbaru.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Catatan pelanggaran, kesehatan, atau konseling akan muncul secara otomatis di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((act) => {
                let moduleBadge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Pelanggaran
                  </span>
                );

                if (act.module === 'medical') {
                  moduleBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" /> Kesehatan
                    </span>
                  );
                } else if (act.module === 'counseling') {
                  moduleBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Konseling BK
                    </span>
                  );
                }

                return (
                  <div key={act.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        {moduleBadge}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-extrabold text-slate-900">{act.studentName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">• {formatDateIndonesian(act.date)}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold leading-snug truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {act.description} {act.extraDetail && <span className="text-slate-400">({act.extraDetail})</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab(act.tabKey)}
                      className="text-[11px] font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm active:scale-95 self-end sm:self-center"
                    >
                      Buka {act.moduleLabel} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Items Section */}
      <div>
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Siswa Sedang Izin Pulang</h3>
            <button
              onClick={() => onNavigateTab('leaves')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {recentLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Seluruh siswa asrama terpantau berada di kamar/kelas.
              </p>
            ) : (
              recentLeaves.map((l) => (
                <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{l.studentName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      Izin {l.type} - {l.reason}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Target asrama: <span className="font-bold text-slate-600">{formatDateIndonesian(l.returnDate)}</span>
                    </p>
                  </div>
                  <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 flex-shrink-0 self-center">
                    Active
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
