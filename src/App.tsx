import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  Violation,
  Counseling,
  CounselingStatus,
  Leave,
  DailyJournal,
  ReportCardData,
  AppConfig,
  MedicalRecord,
  PrayerAttendance,
  ConnectingJournal,
  MenstruationRecord,
  MeetingMinute
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
  loadConnectingJournals,
  saveConnectingJournals,
  loadMeetingMinutes,
  saveMeetingMinutes,
  loadReports,
  saveReports,
  loadMedicalRecords,
  saveMedicalRecords,
  loadPrayerAttendance,
  savePrayerAttendance,
  loadMenstruationRecords,
  saveMenstruationRecords,
  loadLastSyncTime,
  saveLastSyncTime,
  loadLastPushTime,
  saveLastPushTime,
  purgeAllDummyData
} from './services/storage';
import { reconcileAndSanitizeShadowData, ShadowDataAuditStats } from './utils/dataSanitizer';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginModal } from './components/LoginModal';

import { DashboardTab } from './components/DashboardTab';
import { StudentProfileTab } from './components/StudentProfileTab';
import { PrayerAttendanceTab } from './components/PrayerAttendanceTab';
import { ChecklistTab } from './components/ChecklistTab';
import { StudentsTab } from './components/StudentsTab';
import { DisciplineAndCounselingTab } from './components/DisciplineAndCounselingTab';
import { LeavesTab } from './components/LeavesTab';
import { MedicalTab } from './components/MedicalTab';
import { ConnectingJournalTab } from './components/ConnectingJournalTab';
import { MenstruationTrackingTab } from './components/MenstruationTrackingTab';
import { ReportAndRecapTab } from './components/ReportAndRecapTab';
import { SettingsTab } from './components/SettingsTab';
import { MeetingMinutesTab } from './components/MeetingMinutesTab';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('sr_auth_status') === 'logged_in';
  });

  const [userRole, setUserRole] = useState<'admin' | 'guru'>(() => {
    return (sessionStorage.getItem('sr_user_role') as 'admin' | 'guru') || 'admin';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [profileStudentId, setProfileStudentId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Entities state
  const [config, setConfig] = useState<AppConfig>(loadAppConfig);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [violations, setViolations] = useState<Violation[]>(loadViolations);
  const [counseling, setCounseling] = useState<Counseling[]>(loadCounseling);
  const [leaves, setLeaves] = useState<Leave[]>(loadLeaves);
  const [dailyJournals, setDailyJournals] = useState<DailyJournal[]>(loadDailyJournals);
  const [connectingJournals, setConnectingJournals] = useState<ConnectingJournal[]>(loadConnectingJournals);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>(loadMeetingMinutes);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(loadMedicalRecords);
  const [prayerAttendance, setPrayerAttendance] = useState<PrayerAttendance[]>(loadPrayerAttendance);
  const [menstruationRecords, setMenstruationRecords] = useState<MenstruationRecord[]>(loadMenstruationRecords);
  const [reports, setReports] = useState<Record<string, ReportCardData>>(loadReports);

  const [announcement, setAnnouncement] = useState<string>(() => {
    return localStorage.getItem('sr_announcement_text') ||
      'Selamat Datang di Portal Sistem Keasramaan Sekolah Rakyat Terintegrasi 31 Palembang.';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => loadLastSyncTime());
  const [lastPushTime, setLastPushTime] = useState<string | null>(() => loadLastPushTime());

  // Real-time Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

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

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('sr_auth_status');
    sessionStorage.removeItem('sr_user_role');
    setIsLoggedIn(false);
    showToast('Sign Out Berhasil', 'Anda telah keluar dari sistem.', 'success');
  }, [showToast]);

  const handleLoginSuccess = useCallback((role: 'admin' | 'guru') => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === 'guru' && ['students', 'report-card', 'settings'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
    showToast(
      'Login Berhasil',
      role === 'guru'
        ? 'Selamat datang! Anda masuk sebagai Guru / Staf Pengajar.'
        : 'Selamat datang! Anda masuk sebagai Pengasuh Asrama / Admin.',
      'success'
    );
  }, [activeTab, showToast]);

  // Restrict Guru role from accessing prohibited tabs
  useEffect(() => {
    if (isLoggedIn && userRole === 'guru' && ['students', 'report-card', 'settings'].includes(activeTab)) {
      setActiveTab('dashboard');
      showToast(
        'Akses Terbatas',
        'Role Guru tidak dapat mengakses Data Murid, Rapor Keasramaan, dan Pengaturan Sistem.',
        'warning'
      );
    }
  }, [userRole, activeTab, isLoggedIn, showToast]);

  const handleUpdateAnnouncement = useCallback(async (msg: string) => {
    setAnnouncement(msg);
    localStorage.setItem('sr_announcement_text', msg);

    if (config.googleScriptUrl) {
      try {
        await fetch(config.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveAnnouncement',
            data: {
              id: 'ANN001',
              message: msg,
              status: 'Aktif'
            }
          })
        });
        showToast('Pengumuman Disimpan', 'Pengumuman berhasil diperbarui & disinkronkan ke database sheet.');
      } catch (err) {
        console.error('Error saving announcement:', err);
        showToast('Tersimpan Lokal', 'Pengumuman disimpan secara lokal.');
      }
    } else {
      showToast('Tersimpan Lokal', 'Pengumuman disimpan di penyimpanan browser.');
    }
  }, [config.googleScriptUrl, showToast]);

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
      const sId = String(s.id).trim().toLowerCase();
      const sName = s.name ? s.name.trim().toLowerCase() : '';
      const count = violations.filter((v) => {
        const vId = v.studentId ? String(v.studentId).trim().toLowerCase() : '';
        const vName = v.studentName ? v.studentName.trim().toLowerCase() : '';
        return (vId && vId === sId) || (sName && vName && vName === sName);
      }).length;
      return { ...s, violationCount: count };
    });
  }, [students, violations]);

  // Record successful cloud push timestamp
  const recordDataPushSuccess = useCallback(() => {
    const now = new Date();
    const formatted =
      now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' WIB';
    setLastPushTime(formatted);
    saveLastPushTime(formatted);
  }, []);

  // Tab Titles
  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Ringkasan Asrama',
    profile: 'Profil & Portofolio Siswa Terpadu',
    'connecting-journal': 'Jurnal Penghubung Materi & Task Order',
    'meeting-minutes': 'Notulensi Rapat',
    'prayer-attendance': 'Absensi Presensi Asrama (Sholat, Makan & Kegiatan)',
    checklist: 'Jurnal & Ceklist Anak Asuh',
    menstruation: 'Tracking Menstruasi, Masa Bersuci & Ibadah Asrama Putri',
    students: 'Data Induk Murid Sekolah Rakyat',
    violations: 'Pelanggaran',
    counseling: 'Pendampingan BK & Konseling',
    leaves: 'Surat Izin Keluar & Kepulangan Asrama (Pesiar, Berobat & Pulang)',
    medical: 'Klinik UKS & Rekam Medis Keasramaan',
    'report-card': 'Rapor & Rekapitulasi',
    recap: 'Rapor & Rekapitulasi',
    settings: 'Pengaturan & Kustomisasi Sistem'
  };

  // --- CRUD Handlers with Atomic LocalStorage Saves & Async Cloud Sync ---

  // 1. Student CRUD
  const handleSaveStudent = useCallback(
    (student: Student, isEdit: boolean) => {
      const cleanedStudent: Student = {
        ...student,
        id: String(student.id).trim(),
        name: String(student.name).trim(),
        rfidTag: student.rfidTag ? String(student.rfidTag).trim() : undefined,
        shirtSize: student.shirtSize ? String(student.shirtSize).trim() : undefined,
        pantsSize: student.pantsSize ? String(student.pantsSize).trim() : undefined
      };

      setStudents((prev) => {
        let updated: Student[];
        if (isEdit) {
          updated = prev.map((s) => (String(s.id).trim() === cleanedStudent.id ? cleanedStudent : s));
        } else {
          const exists = prev.some((s) => String(s.id).trim() === cleanedStudent.id);
          if (exists) {
            updated = prev.map((s) => (String(s.id).trim() === cleanedStudent.id ? cleanedStudent : s));
          } else {
            updated = [cleanedStudent, ...prev];
          }
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
            data: cleanedStudent
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleDeleteStudent = useCallback(
    (id: string) => {
      const trimmedId = String(id).trim();
      const targetStudent = students.find((s) => String(s.id).trim() === trimmedId);
      const targetName = targetStudent ? targetStudent.name : '';

      setStudents((prev) => {
        const updated = prev.filter((s) => String(s.id).trim() !== trimmedId);
        saveStudents(updated);
        return updated;
      });

      setViolations((prev) => {
        const updated = prev.filter(
          (v) =>
            String(v.studentId).trim() !== trimmedId &&
            (!targetName || v.studentName !== targetName)
        );
        saveViolations(updated);
        return updated;
      });

      setCounseling((prev) => {
        const updated = prev.filter(
          (c) =>
            String(c.studentId).trim() !== trimmedId &&
            (!targetName || c.studentName !== targetName)
        );
        saveCounseling(updated);
        return updated;
      });

      setLeaves((prev) => {
        const updated = prev.filter(
          (l) =>
            String(l.studentId).trim() !== trimmedId &&
            (!targetName || l.studentName !== targetName)
        );
        saveLeaves(updated);
        return updated;
      });

      setDailyJournals((prev) => {
        const updated = prev.filter(
          (j) =>
            String(j.studentId).trim() !== trimmedId &&
            (!targetName || j.studentName !== targetName)
        );
        saveDailyJournals(updated);
        return updated;
      });

      setMedicalRecords((prev) => {
        const updated = prev.filter(
          (m) =>
            String(m.studentId).trim() !== trimmedId &&
            (!targetName || m.studentName !== targetName)
        );
        saveMedicalRecords(updated);
        return updated;
      });

      setPrayerAttendance((prev) => {
        const updated = prev.filter((p) => String(p.studentId).trim() !== trimmedId);
        savePrayerAttendance(updated);
        return updated;
      });

      setReports((prev) => {
        const updated = { ...prev };
        delete updated[trimmedId];
        delete updated[id];
        saveReports(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteStudent',
            data: { id: trimmedId }
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [students, config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleUpdateCounselingStatus = useCallback(
    (id: string, status: CounselingStatus) => {
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [counseling, config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [leaves, config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  // 5b. Jurnal Penghubung & Task Order Guru-Wali Asuh CRUD
  const handleSaveConnectingJournal = useCallback(
    (journal: ConnectingJournal, isEdit: boolean) => {
      setConnectingJournals((prev) => {
        let updated: ConnectingJournal[];
        if (isEdit) {
          updated = prev.map((j) => (j.id === journal.id ? journal : j));
        } else {
          updated = [journal, ...prev];
        }
        saveConnectingJournals(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: isEdit ? 'updateConnectingJournal' : 'addConnectingJournal',
            data: journal
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
      showToast(
        isEdit ? 'Jurnal Diperbarui' : 'Task Order Dikirim',
        isEdit
          ? 'Data capaian pembelajaran berhasil diubah.'
          : 'Capaian materi dan task order berhasil disimpan & siap ditindaklanjuti wali asuh.',
        'success'
      );
    },
    [config.googleScriptUrl, recordDataPushSuccess, showToast]
  );

  const handleSaveMeetingMinute = useCallback(
    (minute: MeetingMinute, isEdit: boolean) => {
      setMeetingMinutes((prev) => {
        let updated: MeetingMinute[];
        if (isEdit) {
          updated = prev.map((m) => (m.id === minute.id ? minute : m));
        } else {
          updated = [minute, ...prev];
        }
        saveMeetingMinutes(updated);

        // Sync to cloud
        if (config.googleScriptUrl) {
          fetch(config.googleScriptUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'updateData',
              type: 'meetingMinutes',
              data: updated,
            }),
          })
            .then(() => recordDataPushSuccess('meetingMinutes'))
            .catch((err) => console.error(err));
        }
        return updated;
      });
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleDeleteMeetingMinute = useCallback(
    (id: string) => {
      setMeetingMinutes((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        saveMeetingMinutes(updated);
        // Sync to cloud
        if (config.googleScriptUrl) {
          fetch(config.googleScriptUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'updateData',
              type: 'meetingMinutes',
              data: updated,
            }),
          })
            .then(() => recordDataPushSuccess('meetingMinutes'))
            .catch((err) => console.error(err));
        }
        return updated;
      });
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleDeleteConnectingJournal = useCallback(
    (id: string) => {
      setConnectingJournals((prev) => {
        const updated = prev.filter((j) => j.id !== id);
        saveConnectingJournals(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteConnectingJournal',
            data: { id }
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
      showToast('Jurnal Dihapus', 'Entri jurnal materi berhasil dihapus.', 'success');
    },
    [config.googleScriptUrl, recordDataPushSuccess, showToast]
  );

  const handleRespondConnectingJournal = useCallback(
    (id: string, responseNotes: string, caretakerName: string, caretakerNip?: string) => {
      const responseDate = new Date().toISOString().split('T')[0];
      let updatedItem: ConnectingJournal | undefined;

      setConnectingJournals((prev) => {
        const updated = prev.map((j) => {
          if (j.id === id) {
            updatedItem = {
              ...j,
              followUp: responseNotes,
              caretakerName,
              caretakerNip: caretakerNip || '-',
              responseDate,
              status: 'Sudah Ditindaklanjuti' as const
            };
            return updatedItem;
          }
          return j;
        });
        saveConnectingJournals(updated);
        return updated;
      });

      if (config.googleScriptUrl && updatedItem) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateConnectingJournal',
            data: updatedItem
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  // 7. Prayer Attendance Handler
  const handleSavePrayerAttendance = useCallback(
    (records: PrayerAttendance[]) => {
      setPrayerAttendance(records);
      savePrayerAttendance(records);
      showToast('Presensi Disimpan', 'Data presensi sholat & QR code berhasil diperbarui.', 'success');
      
      // Batch update to Google Apps Script if possible, or just individual
      if (config.googleScriptUrl) {
        records.forEach(record => {
          fetch(config.googleScriptUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'addPrayerAttendance',
              data: record
            })
          }).catch(e => console.error(e));
        });
      }
    },
    [showToast, config.googleScriptUrl]
  );

  const handleDeletePrayerAttendanceItem = useCallback(
    (id: string) => {
      setPrayerAttendance((prev) => {
        const updated = prev.filter((p) => String(p.id).trim() !== String(id).trim());
        savePrayerAttendance(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deletePrayerAttendance',
            data: { id }
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  // 8. Menstruation Record CRUD
  const handleSaveMenstruationRecord = useCallback(
    (record: MenstruationRecord, isEdit: boolean) => {
      setMenstruationRecords((prev) => {
        let updated: MenstruationRecord[];
        if (isEdit) {
          updated = prev.map((m) => (m.id === record.id ? record : m));
        } else {
          updated = [record, ...prev];
        }
        saveMenstruationRecords(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addMenstruationRecord',
            data: record
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleDeleteMenstruationRecord = useCallback(
    (id: string) => {
      setMenstruationRecords((prev) => {
        const updated = prev.filter((m) => String(m.id).trim() !== String(id).trim());
        saveMenstruationRecords(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteMenstruationRecord',
            data: { id }
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  // 9. Report Card CRUD
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
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  const handleDeleteReport = useCallback(
    (studentId: string) => {
      setReports((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        saveReports(updated);
        return updated;
      });

      if (config.googleScriptUrl) {
        fetch(config.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'deleteReportCard',
            data: { studentId, id: studentId }
          })
        })
        .then(() => recordDataPushSuccess())
        .catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl, recordDataPushSuccess]
  );

  // 7. App Config Save
  const handleSaveConfig = useCallback((newConfig: AppConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  }, []);

  // --- Shadow Data Prevention & Database Sheet Reconciliation Handler ---
  const handleReconcileShadowData = useCallback(
    async (purgeOrphans: boolean = true): Promise<ShadowDataAuditStats> => {
      const res = reconcileAndSanitizeShadowData(
        students,
        violations,
        counseling,
        leaves,
        dailyJournals,
        medicalRecords,
        prayerAttendance,
        reports,
        purgeOrphans
      );

      // Save sanitized states locally
      setStudents(res.students);
      saveStudents(res.students);

      setViolations(res.violations);
      saveViolations(res.violations);

      setCounseling(res.counseling);
      saveCounseling(res.counseling);

      setLeaves(res.leaves);
      saveLeaves(res.leaves);

      setDailyJournals(res.dailyJournals);
      saveDailyJournals(res.dailyJournals);

      setMedicalRecords(res.medicalRecords);
      saveMedicalRecords(res.medicalRecords);

      setPrayerAttendance(res.prayerAttendance);
      savePrayerAttendance(res.prayerAttendance);

      setReports(res.reports);
      saveReports(res.reports);

      // Trigger Cloud Google Apps Script cleanShadowData if URL exists
      if (config.googleScriptUrl) {
        fetch(`${config.googleScriptUrl}?action=cleanShadowData`).catch((err) => console.error(err));
      }

      showToast(
        'Pencegahan Data Shadow Selesai',
        `Diselaraskan: ${res.stats.fixedNamesCount} nama murid, ${res.stats.fixedClassDormCount} kelas/asrama. Duplikasi dibersihkan: ${res.stats.duplicateStudentsRemoved + res.stats.duplicateRecordsRemoved}${purgeOrphans ? `, Record yatim dihapus: ${res.stats.orphanedRecordsRemoved}` : ''}.`,
        'success'
      );

      return res.stats;
    },
    [students, violations, counseling, leaves, dailyJournals, medicalRecords, prayerAttendance, reports, config.googleScriptUrl, showToast]
  );

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
          if (resJson.announcements && Array.isArray(resJson.announcements) && resJson.announcements.length > 0) {
            const activeMsgs = resJson.announcements
              .filter((a: any) => {
                const statusVal = a['Status Aktif'] ?? a['Status'] ?? a['status'] ?? a['aktif'] ?? a['Aktif'] ?? 'Aktif';
                const s = String(statusVal).trim().toLowerCase();
                return s === 'aktif' || s === 'true' || s === '1' || s === 'ya' || s === 'yes' || s === '';
              })
              .map((a: any) => a['Pesan'] ?? a['pesan'] ?? a['Pengumuman'] ?? a['pengumuman'] ?? a['Isi'] ?? '')
              .filter((msg: string) => String(msg).trim() !== '');

            if (activeMsgs.length > 0) {
              const combinedMsg = activeMsgs.join('  •  ');
              setAnnouncement(combinedMsg);
              localStorage.setItem('sr_announcement_text', combinedMsg);
            }
          }

          let activeStudentsList: Student[] = students;

          if (resJson.students && resJson.students.length > 0) {
            const fetchedStudents: Student[] = resJson.students
              .map((s: any, idx: number) => {
                // Flexible field accessor across column variations
                const getVal = (...keys: string[]) => {
                  for (const k of keys) {
                    if (s[k] !== undefined && s[k] !== null && String(s[k]).trim() !== '') {
                      return String(s[k]).trim();
                    }
                  }
                  // Case-insensitive match on keys
                  const lowerKeys = keys.map((k) => k.toLowerCase());
                  for (const actualKey of Object.keys(s)) {
                    if (lowerKeys.includes(actualKey.toLowerCase()) && s[actualKey] !== undefined && s[actualKey] !== null && String(s[actualKey]).trim() !== '') {
                      return String(s[actualKey]).trim();
                    }
                  }
                  return '';
                };

                let id = getVal('NISN/ID', 'NISN', 'ID', 'id', 'NIS', 'NIPD', 'No. Induk', 'ID Siswa', 'No', 'NO', 'No.');
                let name = getVal('Nama Lengkap', 'Nama Siswa', 'Nama Murid', 'Nama', 'name', 'Siswa', 'NAMA', 'NAMA LENGKAP', 'Siswa/i');

                // Auto-fallback for missing ID or Name
                if (!id && name) {
                  id = `SR-${String(idx + 1).padStart(4, '0')}`;
                }
                if (!name && id) {
                  name = `Siswa (${id})`;
                }

                const rfid = getVal('RFID Tag', 'rfidTag', 'RFID', 'Tag');
                const hRaw = getVal('Tinggi (cm)', 'Tinggi', 'height');
                const wRaw = getVal('Berat (kg)', 'Berat', 'weight');
                const shirt = getVal('Ukuran Baju', 'shirtSize', 'Baju');
                const pants = getVal('Ukuran Celana', 'pantsSize', 'Celana');
                const photo = getVal('Foto Profil', 'Foto', 'photo', 'avatar', 'URL Foto', 'Gambar');
                const gender = getVal('Jenis Kelamin', 'gender', 'JK', 'Gender');
                const parentPhone = getVal('Kontak Ortu', 'parentPhone', 'No HP Ortu', 'Telepon Ortu');

                return {
                  id,
                  name,
                  class: getVal('Jenjang', 'Jenjang Pendidikan', 'Kelas', 'class', 'Tingkat') || 'SD',
                  dorm: getVal('Asrama', 'Lokasi Asrama', 'Gedung Asrama', 'dorm', 'Gedung') || (config.dormList[0] || 'Asrama Terpadu'),
                  caretaker: getVal('Wali Asuh', 'Wali', 'caretaker', 'Pendamping') || '',
                  rfidTag: rfid || undefined,
                  height: hRaw && !isNaN(Number(hRaw)) ? Number(hRaw) : undefined,
                  weight: wRaw && !isNaN(Number(wRaw)) ? Number(wRaw) : undefined,
                  shirtSize: shirt || undefined,
                  pantsSize: pants || undefined,
                  photo: photo || undefined,
                  gender: gender ? (gender as any) : undefined,
                  parentPhone: parentPhone || undefined
                };
              })
              .filter((st: Student) => Boolean(st.id || st.name));

            activeStudentsList = fetchedStudents;
          }

          let fetchedViolations: Violation[] = violations;
          if (resJson.violations) {
            fetchedViolations = resJson.violations.map((v: any) => ({
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
          }

          let fetchedCounseling: Counseling[] = counseling;
          if (resJson.counseling) {
            fetchedCounseling = resJson.counseling.map((c: any) => ({
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
          }

          let fetchedLeaves: Leave[] = leaves;
          if (resJson.leaves) {
            fetchedLeaves = resJson.leaves.map((l: any) => ({
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
          }

          let fetchedJournals: DailyJournal[] = dailyJournals;
          if (resJson.dailyJournals) {
            fetchedJournals = resJson.dailyJournals.map((j: any) => ({
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
          }

          let fetchedReports: Record<string, ReportCardData> = reports;
          if (resJson.reportCards) {
            fetchedReports = {};
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
          }

          let fetchedMedical: MedicalRecord[] = medicalRecords;
          if (resJson.medicalRecords) {
            fetchedMedical = resJson.medicalRecords.map((m: any) => ({
              id: m['ID Rekam Medis'] || m['id'] || '',
              studentId: m['NISN/ID'] || m['studentId'] || '',
              studentName: m['Nama Siswa'] || m['studentName'] || '',
              date: m['Tanggal'] || m['date'] || '',
              time: m['Waktu/Jam'] || m['time'] || '',
              location: m['Lokasi'] || m['location'] || '',
              symptoms: m['Gejala'] || m['symptoms'] || '',
              diagnosis: m['Diagnosa'] || m['diagnosis'] || '',
              treatment: m['Tindakan/Obat'] || m['treatment'] || '',
              restDays: parseInt(m['Lama Istirahat (Hari)'] || m['restDays']) || 0,
              isSickLeave: m['Izin Istirahat?'] === 'Ya' || m['isSickLeave'] === true,
              status: m['Status Pemulihan'] || m['status'] || '',
              officer: m['Petugas Medis'] || m['officer'] || '',
              temperature: m['Suhu Tubuh'] || m['temperature'] || '',
              vitalSigns: m['Tanda Vital/Tekanan Darah'] || m['vitalSigns'] || '',
              notes: m['Catatan Medis'] || m['notes'] || ''
            }));
          }

          if (resJson.connectingJournals) {
            const fetchedConnecting: ConnectingJournal[] = resJson.connectingJournals.map((cj: any) => ({
              id: cj['ID Jurnal'] || cj['id'] || '',
              date: cj['Tanggal'] || cj['date'] || '',
              targetClass: cj['Target/Kelas'] || cj['targetClass'] || 'Klasikal (SD)',
              studentId: cj['NISN/ID'] || cj['studentId'] || undefined,
              studentName: cj['Nama Siswa'] || cj['studentName'] || undefined,
              subject: cj['Mata Pelajaran'] || cj['subject'] || '',
              teacherName: cj['Nama Guru'] || cj['teacherName'] || '',
              teacherNip: cj['NIP Guru'] || cj['teacherNip'] || '-',
              learningAchievement: cj['Capaian Materi'] || cj['learningAchievement'] || '',
              taskOrder: cj['Task Order'] || cj['taskOrder'] || '',
              deadline: cj['Batas Waktu'] || cj['deadline'] || '',
              followUp: cj['Tindak Lanjut'] || cj['followUp'] || '',
              caretakerName: cj['Wali Asuh'] || cj['caretakerName'] || '',
              caretakerNip: cj['NIP Wali Asuh'] || cj['caretakerNip'] || '',
              responseDate: cj['Tgl Respon'] || cj['responseDate'] || '',
              status: cj['Status'] || cj['status'] || 'Menunggu Respon',
              notes: cj['Catatan Tambahan'] || cj['notes'] || ''
            }));
            setConnectingJournals(fetchedConnecting);
            saveConnectingJournals(fetchedConnecting);
          }
          if (resJson.meetingMinutes) {
            setMeetingMinutes(resJson.meetingMinutes);
            saveMeetingMinutes(resJson.meetingMinutes);
          }

          // AUTOMATIC SHADOW DATA PREVENTION RECONCILIATION
          const reconciled = reconcileAndSanitizeShadowData(
            activeStudentsList,
            fetchedViolations,
            fetchedCounseling,
            fetchedLeaves,
            fetchedJournals,
            fetchedMedical,
            prayerAttendance,
            fetchedReports,
            true // purge orphan and invalid records so non-existent data is eliminated
          );

          setStudents(reconciled.students);
          saveStudents(reconciled.students);

          setViolations(reconciled.violations);
          saveViolations(reconciled.violations);

          setCounseling(reconciled.counseling);
          saveCounseling(reconciled.counseling);

          setLeaves(reconciled.leaves);
          saveLeaves(reconciled.leaves);

          setDailyJournals(reconciled.dailyJournals);
          saveDailyJournals(reconciled.dailyJournals);

          setMedicalRecords(reconciled.medicalRecords);
          saveMedicalRecords(reconciled.medicalRecords);

          setPrayerAttendance(reconciled.prayerAttendance);
          savePrayerAttendance(reconciled.prayerAttendance);

          setReports(reconciled.reports);
          saveReports(reconciled.reports);

          const nowIso = new Date().toISOString();
          saveLastSyncTime(nowIso);
          setLastSyncTime(nowIso);

          setConnectionStatus('online');
          setLastPingTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          if (isManual) {
            showToast('Sinkronisasi & Rekonsiliasi Berhasil', 'Database cloud diselaraskan dan data shadow telah dibersihkan.', 'success');
          }
        } else if (isManual) {
          showToast('Sinkronisasi Tertolak', resJson.message || 'Respon dari script backend gagal.', 'error');
        }
      } catch (err) {
        setConnectionStatus('offline');
        if (isManual) {
          showToast('Mode Offline', 'Gagal menghubungi database cloud. Aplikasi tetap beroperasi lokal.', 'warning');
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [config.googleScriptUrl, showToast, students, violations, counseling, leaves, dailyJournals, medicalRecords, prayerAttendance, reports, connectingJournals, meetingMinutes]
  );

  // --- Real-Time Connection Ping Check ---
  const checkConnection = useCallback(async () => {
    if (!config.googleScriptUrl) {
      setConnectionStatus('offline');
      return;
    }

    setConnectionStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${config.googleScriptUrl}?action=ping`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setConnectionStatus('online');
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastPingTime(nowTime);
      } else {
        setConnectionStatus('offline');
      }
    } catch (err) {
      setConnectionStatus('offline');
    }
  }, [config.googleScriptUrl]);

  // Sync on initial mount & periodic real-time connection check
  useEffect(() => {
    if (config.googleScriptUrl) {
      checkConnection();
      syncCloudData(false);
    } else {
      setConnectionStatus('offline');
    }

    const interval = setInterval(() => {
      if (config.googleScriptUrl) {
        checkConnection();
      }
    }, 30000); // Check connection every 30 seconds

    const handleOnline = () => {
      if (config.googleScriptUrl) checkConnection();
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config.googleScriptUrl, checkConnection, syncCloudData]);

  const handlePurgeDummyAndReload = useCallback(async () => {
    const confirmed = await askConfirm(
      'Hapus Data Dummy & Muat Database Google Sheet',
      'Tindakan ini akan menghapus semua sisa data dummy / data shadow lokal di browser Anda dan memuat data murni secara langsung dari Google Sheet. Lanjutkan?'
    );
    if (!confirmed) return;

    purgeAllDummyData();
    setStudents([]);
    setMedicalRecords([]);
    showToast('Data Dummy Dihapus', 'Mengambil database murni dari Google Sheet...', 'info');
    await syncCloudData(true);
  }, [askConfirm, showToast, syncCloudData]);

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
      <LoginModal isLoggedIn={isLoggedIn} onLoginSuccess={handleLoginSuccess} />

      {/* Main Row Container */}
      <div className="flex flex-col md:flex-row min-h-screen flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          userRole={userRole}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Header
            activeTabTitle={tabTitles[activeTab] || 'Dashboard'}
            config={config}
            isSyncing={isSyncing}
            onSync={() => syncCloudData(true)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onLogout={handleLogout}
            userRole={userRole}
            connectionStatus={connectionStatus}
            lastPingTime={lastPingTime}
            lastPushTime={lastPushTime}
            lastSyncTime={lastSyncTime}
            onCheckConnection={checkConnection}
          />

          <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                leaves={leaves}
                medicalRecords={medicalRecords}
                connectingJournals={connectingJournals}
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

            {activeTab === 'profile' && (
              <StudentProfileTab
                students={studentsWithViolationCounts}
                violations={violations}
                dailyJournals={dailyJournals}
                reports={reports}
                counseling={counseling}
                medicalRecords={medicalRecords}
                leaves={leaves}
                prayerAttendance={prayerAttendance}
                menstruationRecords={menstruationRecords}
                config={config}
                initialStudentId={profileStudentId}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onSaveJournal={handleSaveJournal}
                onNavigateTab={setActiveTab}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {(activeTab === 'prayer-attendance' || activeTab === 'checklist') && (
              <PrayerAttendanceTab
                students={studentsWithViolationCounts}
                prayerAttendance={prayerAttendance}
                onSavePrayerAttendance={handleSavePrayerAttendance}
                dailyJournals={dailyJournals}
                onSaveJournal={handleSaveJournal}
                onDeleteJournal={handleDeleteJournal}
                leaves={leaves}
                medicalRecords={medicalRecords}
                config={config}
                initialSubTab={activeTab === 'checklist' ? 'checklist' : 'scanner'}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'menstruation' && (
              <MenstruationTrackingTab
                students={studentsWithViolationCounts}
                records={menstruationRecords}
                config={config}
                userRole={userRole}
                onSaveRecord={handleSaveMenstruationRecord}
                onDeleteRecord={handleDeleteMenstruationRecord}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'students' && userRole === 'admin' && (
              <StudentsTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                config={config}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onOpenViolationForStudent={(sid) => {
                  setActiveTab('violations');
                  setIsViolationModalOpenExternal(true);
                }}
                onOpenCounselingForStudent={(sid) => {
                  setActiveTab('counseling');
                }}
                onOpenProfileForStudent={(sid) => {
                  setProfileStudentId(sid);
                  setActiveTab('profile');
                }}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {(activeTab === 'violations' || activeTab === 'counseling') && (
              <DisciplineAndCounselingTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                config={config}
                initialSubTab={activeTab === 'counseling' ? 'counseling' : 'violations'}
                onSaveViolation={handleSaveViolation}
                onDeleteViolation={handleDeleteViolation}
                onSaveCounseling={handleSaveCounseling}
                onDeleteCounseling={handleDeleteCounseling}
                onUpdateCounselingStatus={handleUpdateCounselingStatus}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
                isViolationModalOpenExternal={isViolationModalOpenExternal}
                onCloseExternalModal={() => setIsViolationModalOpenExternal(false)}
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
                onReconcileShadowData={handleReconcileShadowData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'connecting-journal' && (
              <ConnectingJournalTab
                connectingJournals={connectingJournals}
                students={studentsWithViolationCounts}
                config={config}
                userRole={userRole}
                onSaveJournal={handleSaveConnectingJournal}
                onDeleteJournal={handleDeleteConnectingJournal}
                onRespondJournal={handleRespondConnectingJournal}
                showToast={showToast}
                askConfirm={askConfirm}
              />
            )}

            {activeTab === 'meeting-minutes' && (
              <MeetingMinutesTab 
                showToast={showToast} 
                askConfirm={askConfirm} 
                config={config}
                meetingMinutes={meetingMinutes}
                onSaveMinute={handleSaveMeetingMinute}
                onDeleteMinute={handleDeleteMeetingMinute}
              />
            )}

            {(activeTab === 'report-card' || activeTab === 'recap') && userRole === 'admin' && (
              <ReportAndRecapTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                leaves={leaves}
                medicalRecords={medicalRecords}
                reports={reports}
                config={config}
                initialSubTab={activeTab === 'recap' ? 'recap' : 'report-card'}
                onSaveReport={handleSaveReport}
                onSaveConfig={handleSaveConfig}
                onShowToast={showToast}
                onAskConfirm={askConfirm}
              />
            )}

            {activeTab === 'settings' && userRole === 'admin' && (
              <SettingsTab
                config={config}
                onSaveConfig={handleSaveConfig}
                onShowToast={showToast}
                lastSyncTime={lastSyncTime}
                onSync={() => syncCloudData(true)}
                isSyncing={isSyncing}
                onReconcileShadowData={handleReconcileShadowData}
                onPurgeDummyDataAndReload={handlePurgeDummyAndReload}
                studentsCount={students.length}
                recordsCount={violations.length + counseling.length + leaves.length + dailyJournals.length + medicalRecords.length + prayerAttendance.length}
                announcement={announcement}
                onUpdateAnnouncement={handleUpdateAnnouncement}
                students={students}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                violations={violations}
                onSaveViolation={handleSaveViolation}
                onDeleteViolation={handleDeleteViolation}
                counseling={counseling}
                onSaveCounseling={handleSaveCounseling}
                onDeleteCounseling={handleDeleteCounseling}
                leaves={leaves}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                dailyJournals={dailyJournals}
                onSaveJournal={handleSaveJournal}
                onDeleteJournal={handleDeleteJournal}
                medicalRecords={medicalRecords}
                onSaveMedicalRecord={handleSaveMedicalRecord}
                onDeleteMedicalRecord={handleDeleteMedicalRecord}
                reports={reports}
                onSaveReport={handleSaveReport}
                onDeleteReport={handleDeleteReport}
                prayerAttendance={prayerAttendance}
                onSavePrayerAttendance={handleSavePrayerAttendance}
                onDeletePrayerAttendance={handleDeletePrayerAttendanceItem}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
