import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  ReportCardData,
  AppConfig
} from './types';
import {
  loadAppConfig,
  saveAppConfig,
  loadStudents,
  saveStudents,
  loadViolations,
  saveViolations,
  loadCounseling,
  saveCounseling,
  loadLeaves,
  saveLeaves,
  loadDailyJournals,
  saveDailyJournals,
  loadReports,
  saveReports
} from './services/storage';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginModal } from './components/LoginModal';

import { DashboardTab } from './components/DashboardTab';
import { ChecklistTab } from './components/ChecklistTab';
import { StudentsTab } from './components/StudentsTab';
import { ViolationsTab } from './components/ViolationsTab';
import { CounselingTab } from './components/CounselingTab';
import { LeavesTab } from './components/LeavesTab';
import { ReportCardTab } from './components/ReportCardTab';
import { RecapTab } from './components/RecapTab';
import { SettingsTab } from './components/SettingsTab';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('sr_auth_status') === 'logged_in';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Entities state
  const [config, setConfig] = useState<AppConfig>(loadAppConfig);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [violations, setViolations] = useState<Violation[]>(loadViolations);
  const [counseling, setCounseling] = useState<Counseling[]>(loadCounseling);
  const [leaves, setLeaves] = useState<Leave[]>(loadLeaves);
  const [dailyJournals, setDailyJournals] = useState<DailyJournal[]>(loadDailyJournals);
  const [reports, setReports] = useState<Record<string, ReportCardData>>(loadReports);

  const [announcement, setAnnouncement] = useState<string>(
    'Selamat Datang di Portal Sistem Keasramaan Sekolah Rakyat Terintegrasi 31 Palembang.'
  );

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, message: string, type: 'success' | 'warning' | 'error' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmBtnText?: string;
    btnColorClass?: string;
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const askConfirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        resolver: resolve
      });
    });
  }, []);

  const handleConfirmResolve = (result: boolean) => {
    if (confirmModal.resolver) {
      confirmModal.resolver(result);
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false, resolver: undefined }));
  };

  // External Modal Triggers from Hero Banner
  const [isViolationModalOpenExternal, setIsViolationModalOpenExternal] = useState(false);
  const [isLeaveModalOpenExternal, setIsLeaveModalOpenExternal] = useState(false);

  // Sync violation counts into students
  const studentsWithViolationCounts = useMemo(() => {
    return students.map((s) => {
      const count = violations.filter((v) => String(v.studentId) === String(s.id)).length;
      return { ...s, violationCount: count };
    });
  }, [students, violations]);

  // Tab Titles
  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Ringkasan Asrama',
    checklist: 'Jurnal & Ceklist Anak Asuh',
    students: 'Data Induk Murid Sekolah Rakyat',
    violations: 'Laporan Pelanggaran Disiplin',
    counseling: 'Pendampingan BK & Konseling',
    leaves: 'Izin Kepulangan & Gerbang Keluar',
    'report-card': 'Rapor Keasramaan Evaluasi Perkembangan Anak',
    recap: 'Rekapitulasi Bulanan & Print PDF',
    settings: 'Pengaturan & Kustomisasi Sistem'
  };

  // --- CRUD Handlers with Atomic LocalStorage Saves & Async Cloud Sync ---

  // 1. Student CRUD
  const handleSaveStudent = useCallback(
    (student: Student, isEdit: boolean) => {
      setStudents((prev) => {
        let updated: Student[];
        if (isEdit) {
          updated = prev.map((s) => (String(s.id) === String(student.id) ? student : s));
        } else {
          updated = [student, ...prev];
        }
        saveStudents(updated);
        return updated;
      });

      // Async cloud post
      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: isEdit ? 'updateStudent' : 'addStudent',
            data: student
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteStudent = useCallback(
    (id: string) => {
      setStudents((prev) => {
        const updated = prev.filter((s) => String(s.id) !== String(id));
        saveStudents(updated);
        return updated;
      });

      setViolations((prev) => {
        const updated = prev.filter((v) => String(v.studentId) !== String(id));
        saveViolations(updated);
        return updated;
      });

      setCounseling((prev) => {
        const updated = prev.filter((c) => String(c.studentId) !== String(id));
        saveCounseling(updated);
        return updated;
      });

      setLeaves((prev) => {
        const updated = prev.filter((l) => String(l.studentId) !== String(id));
        saveLeaves(updated);
        return updated;
      });

      setReports((prev) => {
        const updated = { ...prev };
        delete updated[id];
        saveReports(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteStudent',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  // 2. Violation CRUD
  const handleSaveViolation = useCallback(
    (violation: Violation, isEdit: boolean) => {
      setViolations((prev) => {
        let updated: Violation[];
        if (isEdit) {
          updated = prev.map((v) => (v.id === violation.id ? violation : v));
        } else {
          updated = [violation, ...prev];
        }
        saveViolations(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addViolation',
            data: violation
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteViolation = useCallback(
    (id: string) => {
      setViolations((prev) => {
        const updated = prev.filter((v) => v.id !== id);
        saveViolations(updated);
        return updated;
      });
    },
    []
  );

  // 3. Counseling CRUD
  const handleSaveCounseling = useCallback(
    (item: Counseling, isEdit: boolean) => {
      setCounseling((prev) => {
        let updated: Counseling[];
        if (isEdit) {
          updated = prev.map((c) => (c.id === item.id ? item : c));
        } else {
          updated = [item, ...prev];
        }
        saveCounseling(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addCounseling',
            data: item
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteCounseling = useCallback((id: string) => {
    setCounseling((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCounseling(updated);
      return updated;
    });
  }, []);

  const handleUpdateCounselingStatus = useCallback(
    (id: string, status: 'Open' | 'In Progress' | 'Resolved') => {
      setCounseling((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, status } : c));
        saveCounseling(updated);
        return updated;
      });

      const updatedItem = counseling.find((c) => c.id === id);
      if (updatedItem && config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addCounseling',
            data: { ...updatedItem, status }
          })
        }).catch((err) => console.error(err));
      }
    },
    [counseling, config.googleScriptUrl]
  );

  // 4. Leave CRUD
  const handleSaveLeave = useCallback(
    (leave: Leave, isEdit: boolean) => {
      setLeaves((prev) => {
        let updated: Leave[];
        if (isEdit) {
          updated = prev.map((l) => (l.id === leave.id ? leave : l));
        } else {
          updated = [leave, ...prev];
        }
        saveLeaves(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addLeave',
            data: leave
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteLeave = useCallback((id: string) => {
    setLeaves((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      saveLeaves(updated);
      return updated;
    });
  }, []);

  const handleUpdateLeaveStatus = useCallback(
    (id: string, status: 'Active' | 'Returned') => {
      setLeaves((prev) => {
        const updated = prev.map((l) => (l.id === id ? { ...l, status } : l));
        saveLeaves(updated);
        return updated;
      });

      const updatedItem = leaves.find((l) => l.id === id);
      if (updatedItem && config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addLeave',
            data: { ...updatedItem, status }
          })
        }).catch((err) => console.error(err));
      }
    },
    [leaves, config.googleScriptUrl]
  );

  // 5. Daily Journal CRUD
  const handleSaveJournal = useCallback(
    (journal: DailyJournal) => {
      setDailyJournals((prev) => {
        const updated = [journal, ...prev];
        saveDailyJournals(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addJournal',
            data: journal
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteJournal = useCallback((id: string) => {
    setDailyJournals((prev) => {
      const updated = prev.filter((j) => j.id !== id);
      saveDailyJournals(updated);
      return updated;
    });
  }, []);

  // 6. Report Card CRUD
  const handleSaveReport = useCallback(
    (studentId: string, data: ReportCardData) => {
      setReports((prev) => {
        const updated = { ...prev, [studentId]: data };
        saveReports(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'saveReportCard',
            data: { studentId, report: data }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  // 7. App Config Save
  const handleSaveConfig = useCallback((newConfig: AppConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  }, []);

  // --- Fetch Cloud Data Sync ---
  const syncCloudData = useCallback(
    async (isManual = false) => {
      if (!config.googleScriptUrl) {
        if (isManual) {
          showToast('Sinkronisasi Terhambat', 'URL Google Apps Script belum dikonfigurasi.', 'warning');
        }
        return;
      }

      setIsSyncing(true);
      if (isManual) {
        showToast('Sinkronisasi Mulai', 'Menghubungkan ke cloud database...', 'warning');
      }

      try {
        const response = await fetch(`${config.googleScriptUrl}?action=fetchData`);
        const resJson = await response.json();

        if (resJson.status === 'success') {
          if (resJson.announcements && resJson.announcements.length > 0) {
            const activeMsg = resJson.announcements
              .filter((a: any) => (a['Status Aktif'] || a['status']) === 'Aktif')
              .map((a: any) => a['Pesan'] || a['pesan'] || '')
              .join('  •  ');
            if (activeMsg) setAnnouncement(activeMsg);
          }

          if (resJson.students && resJson.students.length > 0) {
            const fetchedStudents: Student[] = resJson.students.map((s: any) => ({
              id: s['NISN/ID'] || s['id'] || s.id || '',
              name: s['Nama Lengkap'] || s['Nama Siswa'] || s['name'] || s.name || '',
              class: s['Jenjang'] || s['Jenjang Pendidikan'] || s['Kelas'] || s['class'] || 'SD',
              dorm: s['Asrama'] || s['Lokasi Asrama'] || s['Gedung Asrama'] || s['dorm'] || 'Asrama Terpadu',
              caretaker: s['Wali Asuh'] || s['caretaker'] || s.caretaker || ''
            }));
            setStudents(fetchedStudents);
            saveStudents(fetchedStudents);
          }

          if (resJson.violations) {
            const fetchedViolations: Violation[] = resJson.violations.map((v: any) => ({
              id: v['ID Kasus'] || v['id'] || '',
              date: v['Tanggal'] || v['date'] || '',
              studentId: v['NISN/ID'] || v['studentId'] || '',
              studentName: v['Nama Siswa'] || v['studentName'] || '',
              level: parseInt(v['Tingkat'] || v['level']) || 1,
              violation: v['Bentuk Pelanggaran'] || v['violation'] || '',
              sanction: v['Rekomendasi Sanksi'] || v['sanction'] || v['Sanksi'] || '',
              note: v['Catatan Kronologi'] || v['note'] || '',
              reporter: v['Pelapor'] || v['reporter'] || '',
              photo: v['URL Berkas Bukti'] || v['photo'] || ''
            }));
            setViolations(fetchedViolations);
            saveViolations(fetchedViolations);
          }

          if (resJson.counseling) {
            const fetchedCounseling: Counseling[] = resJson.counseling.map((c: any) => ({
              id: c['ID Sesi'] || c['id'] || '',
              date: c['Tanggal'] || c['date'] || '',
              studentId: c['NISN/ID'] || c['studentId'] || '',
              studentName: c['Nama Siswa'] || c['studentName'] || '',
              caseDescription: c['Permasalahan'] || c['caseDescription'] || '',
              notes: c['Hasil Sesi Konseling'] || c['Hasil Sesi'] || c['notes'] || '',
              followUp: c['Rencana Tindak Lanjut'] || c['followUp'] || '',
              counselor: c['Konselor/Wali'] || c['Konselor'] || c['counselor'] || '',
              status: c['Status'] || c['status'] || 'Open'
            }));
            setCounseling(fetchedCounseling);
            saveCounseling(fetchedCounseling);
          }

          if (resJson.leaves) {
            const fetchedLeaves: Leave[] = resJson.leaves.map((l: any) => ({
              id: l['ID Surat'] || l['id'] || '',
              studentId: l['NISN/ID'] || l['studentId'] || '',
              studentName: l['Nama Siswa'] || l['studentName'] || '',
              type: l['Kategori Izin'] || l['Jenis Kepulangan'] || l['type'] || 'Reguler',
              reason: l['Alasan'] || l['reason'] || '',
              leaveDate: l['Tgl Berangkat'] || l['leaveDate'] || '',
              returnDate: l['Tgl Kembali'] || l['returnDate'] || '',
              caretaker: l['Wali Asuh Pendamping'] || l['Wali Asuh'] || l['caretaker'] || '',
              status: l['Status'] || l['status'] || 'Active'
            }));
            setLeaves(fetchedLeaves);
            saveLeaves(fetchedLeaves);
          }

          if (resJson.dailyJournals) {
            const fetchedJournals: DailyJournal[] = resJson.dailyJournals.map((j: any) => ({
              id: j['ID Jurnal'] || j['id'] || '',
              date: j['Tanggal'] || j['date'] || '',
              studentId: j['NISN/ID'] || j['studentId'] || '',
              studentName: j['Nama Siswa'] || j['studentName'] || '',
              timeRange: j['Rentang Waktu'] || j['timeRange'] || '',
              tasksCompleted: parseInt(j['Total Selesai'] || j['tasksCompleted']) || 0,
              totalTasks: parseInt(j['Total Tugas'] || j['totalTasks']) || 0,
              notes: j['Catatan Wali'] || j['notes'] || '',
              tasksSnapshot: j['Detail Snapshot (JSON)'] ? JSON.parse(j['Detail Snapshot (JSON)']) : []
            }));
            setDailyJournals(fetchedJournals);
            saveDailyJournals(fetchedJournals);
          }

          if (resJson.reportCards) {
            const fetchedReports: Record<string, ReportCardData> = {};
            resJson.reportCards.forEach((r: any) => {
              const studentId = r['NISN/ID'] || r['studentId'] || '';
              if (studentId) {
                fetchedReports[studentId] = {
                  grades: JSON.parse(r['Predikat Nilai (JSON)'] || '{}'),
                  descriptions: JSON.parse(r['Deskripsi Nilai (JSON)'] || '{}'),
                  specialNote: r['Catatan Perkembangan'] || r['specialNote'] || '',
                  customCaretaker: r['Wali Asuh TTD'] || r['customCaretaker'] || '',
                  customCaretakerNip: r['NIP Wali Asuh'] || r['customCaretakerNip'] || ''
                };
              }
            });
            setReports(fetchedReports);
            saveReports(fetchedReports);
          }

          if (isManual) {
            showToast('Sinkronisasi Berhasil', 'Database berhasil diselaraskan dengan cloud.', 'success');
          }
        } else if (isManual) {
          showToast('Sinkronisasi Tertolak', resJson.message || 'Respon dari script backend gagal.', 'error');
        }
      } catch (err) {
        if (isManual) {
          showToast('Mode Offline', 'Gagal menghubungi database cloud. Aplikasi tetap beroperasi lokal.', 'warning');
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [config.googleScriptUrl, showToast]
  );

  // Sync on initial mount
  useEffect(() => {
    if (config.googleScriptUrl) {
      syncCloudData(false);
    }
  }, []);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => handleConfirmResolve(true)}
        onCancel={() => handleConfirmResolve(false)}
      />

      {/* Login Screen Modal */}
      <LoginModal isLoggedIn={isLoggedIn} onLoginSuccess={() => setIsLoggedIn(true)} />

      {/* Main Row Container */}
      <div className="flex flex-col md:flex-row min-h-screen flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Header
            activeTabTitle={tabTitles[activeTab] || 'Dashboard'}
            config={config}
            isSyncing={isSyncing}
            onSync={() => syncCloudData(true)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                leaves={leaves}
                announcement={announcement}
                onOpenViolationModal={() => {
                  setActiveTab('violations');
                  setIsViolationModalOpenExternal(true);
                }}
                onOpenLeaveModal={() => {
                  setActiveTab('leaves');
                  setIsLeaveModalOpenExternal(true);
                }}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'checklist' && (
              <ChecklistTab
                students={studentsWithViolationCounts}
                journals={dailyJournals}
                config={config}
                onSaveJournal={handleSaveJournal}
                onDeleteJournal={handleDeleteJournal}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'students' && (
              <StudentsTab
                students={studentsWithViolationCounts}
                config={config}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'violations' && (
              <ViolationsTab
                students={studentsWithViolationCounts}
                violations={violations}
                config={config}
                onSaveViolation={handleSaveViolation}
                onDeleteViolation={handleDeleteViolation}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
                isModalOpenExternal={isViolationModalOpenExternal}
                onCloseExternalModal={() => setIsViolationModalOpenExternal(false)}
              />
            )}

            {activeTab === 'counseling' && (
              <CounselingTab
                students={studentsWithViolationCounts}
                counseling={counseling}
                config={config}
                onSaveCounseling={handleSaveCounseling}
                onDeleteCounseling={handleDeleteCounseling}
                onUpdateStatus={handleUpdateCounselingStatus}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'leaves' && (
              <LeavesTab
                students={studentsWithViolationCounts}
                leaves={leaves}
                config={config}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                onUpdateStatus={handleUpdateLeaveStatus}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
                isModalOpenExternal={isLeaveModalOpenExternal}
                onCloseExternalModal={() => setIsLeaveModalOpenExternal(false)}
              />
            )}

            {activeTab === 'report-card' && (
              <ReportCardTab
                students={studentsWithViolationCounts}
                violations={violations}
                reports={reports}
                config={config}
                onSaveReport={handleSaveReport}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'recap' && (
              <RecapTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                leaves={leaves}
                config={config}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                config={config}
                onSaveConfig={handleSaveConfig}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
