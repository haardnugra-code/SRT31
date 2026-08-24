import React, { useState, useEffect } from 'react';
import { FileSignature, FileText, Award, BarChart3 } from 'lucide-react';
import { Student, Violation, Counseling, Leave, MedicalRecord, ReportCardData, AppConfig } from '../types';
import { ReportCardTab } from './ReportCardTab';
import { RecapTab } from './RecapTab';

interface ReportAndRecapTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  medicalRecords?: MedicalRecord[];
  reports: Record<string, ReportCardData>;
  config: AppConfig;
  initialSubTab?: 'report-card' | 'recap';
  onSaveReport: (studentId: string, data: ReportCardData) => void;
  onSaveConfig?: (updatedConfig: AppConfig) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const ReportAndRecapTab: React.FC<ReportAndRecapTabProps> = ({
  students,
  violations,
  counseling,
  leaves,
  medicalRecords = [],
  reports,
  config,
  initialSubTab = 'report-card',
  onSaveReport,
  onSaveConfig,
  onShowToast,
  onAskConfirm
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'report-card' | 'recap'>(initialSubTab);

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
            onClick={() => setActiveSubTab('report-card')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeSubTab === 'report-card'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSignature className="w-4 h-4 text-rose-200" />
            <span>Rapor Keasramaan</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeSubTab === 'report-card'
                  ? 'bg-red-700/80 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {Object.keys(reports).length}/{students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeSubTab === 'recap'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-200" />
            <span>Rekapitulasi Lengkap Asrama</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Evaluasi Rapor Perkembangan & Rekap Eksekutif</span>
        </div>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'report-card' ? (
        <ReportCardTab
          students={students}
          violations={violations}
          counseling={counseling}
          medicalRecords={medicalRecords}
          reports={reports}
          config={config}
          onSaveReport={onSaveReport}
          onSaveConfig={onSaveConfig}
          onShowToast={onShowToast}
          onAskConfirm={onAskConfirm}
        />
      ) : (
        <RecapTab
          students={students}
          violations={violations}
          counseling={counseling}
          leaves={leaves}
          medicalRecords={medicalRecords}
          config={config}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
