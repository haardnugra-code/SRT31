import React from 'react';
import {
  Megaphone,
  Plus,
  DoorOpen,
  AlertTriangle,
  Clock,
  Check,
  Scale
} from 'lucide-react';
import { Student, Violation, Counseling, Leave } from '../types';
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
  announcement,
  onOpenViolationModal,
  onOpenLeaveModal,
  onNavigateTab
}) => {
  const totalViolations = violations.length;
  const activeCounseling = counseling.filter((c) => c.status !== 'Resolved').length;
  const activeLeaves = leaves.filter((l) => l.status === 'Active').length;
  const severeCases = violations.filter((v) => v.level >= 4).length;

  // Monthly trends data
  const monthlyViolations = [0, 0, 0, 0, 0, 0];
  const monthlyLeaves = [0, 0, 0, 0, 0, 0];

  violations.forEach((v) => {
    if (!v.date) return;
    const month = new Date(v.date).getMonth();
    if (month >= 0 && month <= 5) monthlyViolations[month]++;
  });

  leaves.forEach((l) => {
    if (!l.leaveDate) return;
    const month = new Date(l.leaveDate).getMonth();
    if (month >= 0 && month <= 5) monthlyLeaves[month]++;
  });

  const trendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
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
            onClick={onOpenViolationModal}
            className="flex-1 sm:flex-initial bg-white text-slate-900 font-bold text-xs px-4 py-3 rounded-lg hover:bg-slate-100 transition shadow active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Catat Pelanggaran
          </button>
          <button
            onClick={onOpenLeaveModal}
            className="flex-1 sm:flex-initial bg-slate-900/40 text-white font-bold text-xs px-4 py-3 rounded-lg hover:bg-slate-900/60 transition backdrop-blur-md border border-white/20 active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <DoorOpen className="w-4 h-4" /> Catat Izin Pulang
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
              Siswa Izin Pulang
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              {activeLeaves}
            </p>
            <p className="text-[9px] md:text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Izin terdaftar
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
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
            <h3 class="font-bold text-slate-800 text-sm tracking-wide">
              Tren Kasus & Perizinan Bulanan
            </h3>
            <span className="text-[10px] text-slate-400">Semester Genap TA 2025/2026</span>
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

      {/* Recent Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Pelanggaran Terkini</h3>
            <button
              onClick={() => onNavigateTab('violations')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {recentViolations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada pencatatan kasus pelanggaran asrama.
              </p>
            ) : (
              recentViolations.map((v) => (
                <div key={v.id} className="py-3 flex items-start gap-3">
                  <div className={`px-2.5 py-1 rounded text-xs font-extrabold flex-shrink-0 ${getBadgeClass(v.level)}`}>
                    T{v.level}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{v.studentName}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight truncate">{v.violation}</p>
                    {v.note && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded italic truncate">
                        Catatan: {v.note}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-400">Kasus dilaporkan pada {v.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                      Target asrama: <span className="font-bold text-slate-600">{l.returnDate}</span>
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
