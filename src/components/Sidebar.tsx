import React from 'react';
import {
  GraduationCap,
  LineChart,
  CheckSquare,
  Users,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  DoorOpen,
  HeartPulse,
  FileSignature,
  FileText,
  Sliders,
  BookOpen,
  Globe,
  X,
  QrCode
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userRole?: 'admin' | 'guru';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  userRole = 'admin'
}) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LineChart },
    { id: 'students', label: 'Data Siswa & Profil', icon: Users },
    { id: 'prayer-attendance', label: 'Absensi & Ceklist', icon: QrCode },
    { id: 'violations', label: 'Pelanggaran & Layanan Konseling BK', icon: AlertTriangle },
    { id: 'leaves', label: 'Surat Izin Keluar', icon: DoorOpen },
    { id: 'medical', label: 'UKS & Rekam Medis', icon: HeartPulse },
    { id: 'report-card', label: 'Rapor & Rekapitulasi Keasramaan', icon: FileSignature, restrictedForGuru: true },
    { id: 'cms', label: 'Manajemen Website', icon: Globe, restrictedForGuru: true },
    { id: 'guide', label: 'Panduan Aplikasi', icon: BookOpen },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Sliders, restrictedForGuru: true }
  ];

  const menuItems = userRole === 'guru'
    ? allMenuItems.filter((item) => !item.restrictedForGuru)
    : allMenuItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="no-print fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`no-print app-sidebar w-64 bg-slate-900/95 backdrop-blur-xl text-white flex-shrink-0 flex flex-col border-r border-slate-800/80 fixed md:sticky inset-y-0 left-0 transform ${
          isOpenMobile ? 'translate-x-0 shadow-2xl shadow-slate-950/90' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50 md:z-30 h-screen md:h-auto`}
      >
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="w-12 h-12 bg-white p-1 rounded-full text-white flex items-center justify-center shadow-lg shadow-red-950/50 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Sekolah Rakyat</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Terintegrasi 31 Palembang
            </p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between md:hidden bg-slate-950/80 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Menu Navigasi
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'violations' && (activeTab === 'violations' || activeTab === 'counseling')) ||
              (item.id === 'report-card' && (activeTab === 'report-card' || activeTab === 'recap'));
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 text-center flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 bg-slate-800 text-slate-300 border border-slate-700">
            Role: <span className={userRole === 'guru' ? 'text-amber-400' : 'text-red-400'}>{userRole === 'guru' ? 'Guru / Staf' : 'Admin / Pengasuh'}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
            CERDAS BERSAMA
          </p>
          <p className="text-[11px] text-red-500 font-semibold tracking-wide">
            TUMBUH SETARA
          </p>
          <p className="text-[9px] text-slate-600">TA 2025/2026</p>
        </div>
      </aside>
    </>
  );
};
