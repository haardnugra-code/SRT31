import React from 'react';
import {
  GraduationCap,
  LineChart,
  CheckSquare,
  Users,
  AlertTriangle,
  MessageSquare,
  DoorOpen,
  HeartPulse,
  FileSignature,
  FileText,
  Sliders,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LineChart },
    { id: 'checklist', label: 'Ceklist Harian', icon: CheckSquare },
    { id: 'students', label: 'Data Murid', icon: Users },
    { id: 'violations', label: 'Pelanggaran', icon: AlertTriangle },
    { id: 'counseling', label: 'Konseling & BK', icon: MessageSquare },
    { id: 'leaves', label: 'Izin Pulang', icon: DoorOpen },
    { id: 'medical', label: 'UKS & Rekam Medis', icon: HeartPulse },
    { id: 'report-card', label: 'Rapor Keasramaan', icon: FileSignature },
    { id: 'recap', label: 'Rekapitulasi', icon: FileText },
    { id: 'guide', label: 'Panduan Aplikasi', icon: BookOpen },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Sliders }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800 fixed md:sticky inset-y-0 left-0 transform ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50 md:z-30 h-screen md:h-auto`}
      >
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="bg-red-600 p-2.5 rounded-lg text-white flex items-center justify-center shadow-lg shadow-red-950/50">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Sekolah Rakyat</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Kemensos RI
            </p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden bg-slate-950">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Menu Navigasi
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
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

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
          <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
            CERDAS BERSAMA
          </p>
          <p className="text-[11px] text-red-500 font-semibold tracking-wide">
            TUMBUH SETARA
          </p>
          <p className="text-[9px] text-slate-600 mt-1">TA 2025/2026</p>
        </div>
      </aside>
    </>
  );
};
