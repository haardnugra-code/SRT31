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
  X,
  QrCode,
  BookOpen,
  CalendarHeart,
  ClipboardList,
  Sparkles,
  PackageCheck,
  Activity,
  Brain,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userRole?: 'admin' | 'guru';
  enableSpecialChronology?: boolean;
  sidebarOrder?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  userRole = 'admin',
  sidebarOrder = [],
}) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LineChart },
    { id: 'letter-generator', label: 'Generator Surat Resmi', icon: FileSpreadsheet, isSpecial: true },
    { id: 'live-monitor', label: 'Live Monitor Terpadu', icon: Activity, isSpecial: true },
    { id: 'special-chronology', label: 'Kronologi & Handover Shift', icon: ClipboardList },
    { id: 'students', label: 'Data Siswa & Profil', icon: Users },
    { id: 'psychology', label: 'Asesmen Psikologi & Jiwa', icon: Brain, isSpecial: true },
    { id: 'connecting-journal', label: 'Jurnal Penghubung', icon: BookOpen },
    { id: 'dorm-inspection', label: 'Penilaian Asrama (SOP)', icon: Sparkles },
    { id: 'dorm-asset', label: 'Aset Asrama (SOP)', icon: PackageCheck },
    { id: 'meeting-minutes', label: 'Notulensi Rapat', icon: FileText },
    { id: 'prayer-attendance', label: 'Absensi & Ceklist', icon: QrCode },
    { id: 'menstruation', label: 'Tracking Menstruasi', icon: CalendarHeart },
    { id: 'violations', label: 'Pelanggaran', icon: AlertTriangle },
    { id: 'leaves', label: 'Surat Izin Keluar', icon: DoorOpen },
    { id: 'medical', label: 'UKS & Rekam Medis', icon: HeartPulse },
    { id: 'report-card', label: 'Rapor & Rekapitulasi', icon: FileSignature, restrictedForGuru: true },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Sliders, restrictedForGuru: true }
  ];

  let menuItems = userRole === 'guru'
    ? allMenuItems.filter((item) => !item.restrictedForGuru)
    : allMenuItems;

  if (sidebarOrder && sidebarOrder.length > 0) {
    const orderMap = new Map(sidebarOrder.map((id, index) => [id, index]));
    menuItems.sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
      return indexA - indexB;
    });
  }

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
        {/* Header Logo - Clickable to open Generator Surat / Dashboard */}
        <div 
          onClick={() => {
            onSelectTab('letter-generator');
            onCloseMobile();
          }}
          className="p-5 border-b border-slate-800 hidden md:flex items-center gap-3 cursor-pointer hover:bg-slate-800/60 transition group"
          title="Klik untuk buka Generator Surat Resmi & Administrasi Wali Asuh"
        >
          <div className="bg-red-600 group-hover:bg-red-500 p-2.5 rounded-xl text-white flex items-center justify-center shadow-lg shadow-red-950/50 transition transform group-hover:scale-105">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-base leading-tight group-hover:text-amber-300 transition">Sekolah Rakyat</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
              <span>Wali Asuh</span>
              <span className="text-red-400 font-bold">•</span>
              <span className="text-amber-400 font-bold">Kemensos RI</span>
            </p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between md:hidden bg-slate-950/80 backdrop-blur-md">
          <div 
            onClick={() => {
              onSelectTab('letter-generator');
              onCloseMobile();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="bg-red-600 p-1.5 rounded-lg text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              Wali Asuh SR31
            </span>
          </div>
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
                <span className="flex-1 text-left">{item.label}</span>
                {(item as any).isSpecial && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Khusus
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 bg-slate-800 text-slate-300 border border-slate-700">
            Role: <span className={userRole === 'guru' ? 'text-amber-400' : 'text-red-400'}>{userRole === 'guru' ? 'Guru Pengampu' : 'Pengampu / Wali Asuh'}</span>
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
