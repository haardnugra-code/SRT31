import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  ReportCardData,
  AppConfig,
  MedicalRecord
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
  saveReports,
  loadMedicalRecords,
  saveMedicalRecords
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
import { MedicalTab } from './components/MedicalTab';
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
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(loadMedicalRecords);
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
    medical: 'Klinik UKS & Rekam Medis Keasramaan',
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
      const targetStudent = students.find((s) => String(s.id).trim() === String(id).trim());
      const targetName = targetStudent ? targetStudent.name : '';

      setStudents((prev) => {
        const updated = prev.filter((s) => String(s.id).trim() !== String(id).trim());
        saveStudents(updated);
        return updated;
      });

      setViolations((prev) => {
        const updated = prev.filter(
          (v) =>
            String(v.studentId).trim() !== String(id).trim() &&
            (!targetName || v.studentName !== targetName)
        );
        saveViolations(updated);
        return updated;
      });

      setCounseling((prev) => {
        const updated = prev.filter(
          (c) =>
            String(c.studentId).trim() !== String(id).trim() &&
            (!targetName || c.studentName !== targetName)
        );
        saveCounseling(updated);
        return updated;
      });

      setLeaves((prev) => {
        const updated = prev.filter(
          (l) =>
            String(l.studentId).trim() !== String(id).trim() &&
            (!targetName || l.studentName !== targetName)
        );
        saveLeaves(updated);
        return updated;
      });

      setDailyJournals((prev) => {
        const updated = prev.filter(
          (j) =>
            String(j.studentId).trim() !== String(id).trim() &&
            (!targetName || j.studentName !== targetName)
        );
        saveDailyJournals(updated);
        return updated;
      });

      setMedicalRecords((prev) => {
        const updated = prev.filter(
          (m) =>
            String(m.studentId).trim() !== String(id).trim() &&
            (!targetName || m.studentName !== targetName)
        );
        saveMedicalRecords(updated);
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
    [students, config.googleScriptUrl]
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
        const updated = prev.filter((v) => String(v.id).trim() !== String(id).trim());
        saveViolations(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteViolation',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
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

  const handleDeleteCounseling = useCallback(
    (id: string) => {
      setCounseling((prev) => {
        const updated = prev.filter((c) => String(c.id).trim() !== String(id).trim());
        saveCounseling(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteCounseling',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

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

  const handleDeleteLeave = useCallback(
    (id: string) => {
      setLeaves((prev) => {
        const updated = prev.filter((l) => String(l.id).trim() !== String(id).trim());
        saveLeaves(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteLeave',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

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

  const handleDeleteJournal = useCallback(
    (id: string) => {
      setDailyJournals((prev) => {
        const updated = prev.filter((j) => String(j.id).trim() !== String(id).trim());
        saveDailyJournals(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteJournal',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  // 6. Medical Record CRUD
  const handleSaveMedicalRecord = useCallback(
    (record: MedicalRecord) => {
      setMedicalRecords((prev) => {
        const exists = prev.some((r) => r.id === record.id);
        let updated: MedicalRecord[];
        if (exists) {
          updated = prev.map((r) => (r.id === record.id ? record : r));
        } else {
          updated = [record, ...prev];
        }
        saveMedicalRecords(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addMedicalRecord',
            data: record
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

  const handleDeleteMedicalRecord = useCallback(
    (id: string) => {
      setMedicalRecords((prev) => {
        const updated = prev.filter((r) => String(r.id).trim() !== String(id).trim());
        saveMedicalRecords(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteMedicalRecord',
            data: { id }
          })
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
  );

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

          let activeStudentsList = students;

          if (resJson.students && resJson.students.length > 0) {
            const fetchedStudents: Student[] = resJson.students.map((s: any) => ({
              id: s['NISN/ID'] || s['id'] || s.id || '',
              name: s['Nama Lengkap'] || s['Nama Siswa'] || s['name'] || s.name || '',
              class: s['Jenjang'] || s['Jenjang Pendidikan'] || s['Kelas'] || s['class'] || 'SD',
              dorm: s['Asrama'] || s['Lokasi Asrama'] || s['Gedung Asrama'] || s['dorm'] || 'Asrama Terpadu',
              caretaker: s['Wali Asuh'] || s['caretaker'] || s.caretaker || ''
            }));
            activeStudentsList = fetchedStudents;
            setStudents(fetchedStudents);
            saveStudents(fetchedStudents);
          }

          const validStudentIds = new Set(activeStudentsList.map((s) => String(s.id).trim()));
          const validStudentNames = new Set(activeStudentsList.map((s) => s.name.trim().toLowerCase()));

          if (resJson.violations) {
            let fetchedViolations: Violation[] = resJson.violations.map((v: any) => ({
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

            // Filter out orphaned violations for deleted students
            if (validStudentIds.size > 0) {
              fetchedViolations = fetchedViolations.filter((v) => {
                const hasValidId = v.studentId && validStudentIds.has(String(v.studentId).trim());
                const hasValidName = v.studentName && validStudentNames.has(v.studentName.trim().toLowerCase());
                return hasValidId || hasValidName;
              });
            }

            setViolations(fetchedViolations);
            saveViolations(fetchedViolations);
          }

          if (resJson.counseling) {
            let fetchedCounseling: Counseling[] = resJson.counseling.map((c: any) => ({
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

            if (validStudentIds.size > 0) {
              fetchedCounseling = fetchedCounseling.filter((c) => {
                const hasValidId = c.studentId && validStudentIds.has(String(c.studentId).trim());
                const hasValidName = c.studentName && validStudentNames.has(c.studentName.trim().toLowerCase());
                return hasValidId || hasValidName;
              });
            }

            setCounseling(fetchedCounseling);
            saveCounseling(fetchedCounseling);
          }

          if (resJson.leaves) {
            let fetchedLeaves: Leave[] = resJson.leaves.map((l: any) => ({
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

            if (validStudentIds.size > 0) {
              fetchedLeaves = fetchedLeaves.filter((l) => {
                const hasValidId = l.studentId && validStudentIds.has(String(l.studentId).trim());
                const hasValidName = l.studentName && validStudentNames.has(l.studentName.trim().toLowerCase());
                return hasValidId || hasValidName;
              });
            }

            setLeaves(fetchedLeaves);
            saveLeaves(fetchedLeaves);
          }

          if (resJson.dailyJournals) {
            let fetchedJournals: DailyJournal[] = resJson.dailyJournals.map((j: any) => ({
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

            if (validStudentIds.size > 0) {
              fetchedJournals = fetchedJournals.filter((j) => {
                const hasValidId = j.studentId && validStudentIds.has(String(j.studentId).trim());
                const hasValidName = j.studentName && validStudentNames.has(j.studentName.trim().toLowerCase());
                return hasValidId || hasValidName;
              });
            }

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

            {activeTab === 'medical' && (
              <MedicalTab
                students={studentsWithViolationCounts}
                records={medicalRecords}
                onSaveRecord={handleSaveMedicalRecord}
                onDeleteRecord={handleDeleteMedicalRecord}
                config={config}
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
