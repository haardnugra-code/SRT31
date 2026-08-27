import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import { Student, Violation, Counseling, CounselingStatus, AppConfig } from '../types';
import { ViolationsTab } from './ViolationsTab';
import { CounselingTab } from './CounselingTab';

interface DisciplineAndCounselingTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  config: AppConfig;
  initialSubTab?: 'violations' | 'counseling';
  onSaveViolation: (violation: Violation, isEdit: boolean) => void;
  onDeleteViolation: (id: string) => void;
  onSaveCounseling: (counseling: Counseling, isEdit: boolean) => void;
  onDeleteCounseling: (id: string) => void;
  onUpdateCounselingStatus: (id: string, status: CounselingStatus) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  isViolationModalOpenExternal?: boolean;
  onCloseExternalModal?: () => void;
}

export const DisciplineAndCounselingTab: React.FC<DisciplineAndCounselingTabProps> = ({
  students,
  violations,
  counseling,
  config,
  initialSubTab = 'violations',
  onSaveViolation,
  onDeleteViolation,
  onSaveCounseling,
  onDeleteCounseling,
  onUpdateCounselingStatus,
  onShowToast,
  onAskConfirm,
  isViolationModalOpenExternal = false,
  onCloseExternalModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'violations' | 'counseling'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Switcher Navigation Bar */}
      <div className="no-print bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('violations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeSubTab === 'violations'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Peringkat & Data Pelanggaran</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeSubTab === 'violations'
                  ? 'bg-red-700/80 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {violations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('counseling')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeSubTab === 'counseling'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-200" />
            <span>Layanan Konseling & BK</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeSubTab === 'counseling'
                  ? 'bg-indigo-700/80 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counseling.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          <span>Pelanggaran</span>
        </div>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'violations' ? (
        <ViolationsTab
          students={students}
          violations={violations}
          config={config}
          onSaveViolation={onSaveViolation}
          onDeleteViolation={onDeleteViolation}
          onShowToast={onShowToast}
          onAskConfirm={onAskConfirm}
          isModalOpenExternal={isViolationModalOpenExternal}
          onCloseExternalModal={onCloseExternalModal}
        />
      ) : (
        <CounselingTab
          students={students}
          counseling={counseling}
          config={config}
          onSaveCounseling={onSaveCounseling}
          onDeleteCounseling={onDeleteCounseling}
          onUpdateStatus={onUpdateCounselingStatus}
          onShowToast={onShowToast}
          onAskConfirm={onAskConfirm}
        />
      )}
    </div>
  );
};
