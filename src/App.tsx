import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  ReportCardData,
  AppConfig,
  MedicalRecord,
  PrayerAttendance
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
  saveMedicalRecords,
  loadPrayerAttendance,
  savePrayerAttendance,
  loadLastSyncTime,
  saveLastSyncTime
} from './services/storage';
import { reconcileAndSanitizeShadowData, ShadowDataAuditStats } from './utils/dataSanitizer';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginModal } from './components/LoginModal';

import { DashboardTab } from './components/DashboardTab';
import { PrayerAttendanceTab } from './components/PrayerAttendanceTab';
import { ChecklistTab } from './components/ChecklistTab';
import { StudentsTab } from './components/StudentsTab';
import { ViolationsTab } from './components/ViolationsTab';
import { CounselingTab } from './components/CounselingTab';
import { LeavesTab } from './components/LeavesTab';
import { MedicalTab } from './components/MedicalTab';
import { ReportCardTab } from './components/ReportCardTab';
import { RecapTab } from './components/RecapTab';
import { GuideTab, PptPrintSlides } from './components/GuideTab';
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
  const [prayerAttendance, setPrayerAttendance] = useState<PrayerAttendance[]>(loadPrayerAttendance);
  const [reports, setReports] = useState<Record<string, ReportCardData>>(loadReports);

  const [announcement, setAnnouncement] = useState<string>(
    'Selamat Datang di Portal Sistem Keasramaan Sekolah Rakyat Terintegrasi 31 Palembang.'
  );

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => loadLastSyncTime());

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
    setIsLoggedIn(false);
    showToast('Sign Out Berhasil', 'Anda telah keluar dari sistem.', 'success');
  }, [showToast]);

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

  // Tab Titles
  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Ringkasan Asrama',
    'prayer-attendance': 'Absensi Sholat & QR Code Generator Kartu Murid',
    checklist: 'Jurnal & Ceklist Anak Asuh',
    students: 'Data Induk Murid Sekolah Rakyat',
    violations: 'Laporan Pelanggaran Disiplin',
    counseling: 'Pendampingan BK & Konseling',
    leaves: 'Izin Kepulangan & Gerbang Keluar',
    medical: 'Klinik UKS & Rekam Medis Keasramaan',
    'report-card': 'Rapor Keasramaan Evaluasi Perkembangan Anak',
    recap: 'Rekapitulasi Bulanan & Print PDF',
    guide: 'Panduan Lengkap Penggunaan Aplikasi',
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
        }).catch((err) => console.error(err));
      }
    },
    [config.googleScriptUrl]
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

  // 7. Prayer Attendance Handler
  const handleSavePrayerAttendance = useCallback(
    (records: PrayerAttendance[]) => {
      setPrayerAttendance(records);
      savePrayerAttendance(records);
      showToast('Presensi Disimpan', 'Data presensi sholat & QR code berhasil diperbarui.', 'success');
    },
    [showToast]
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
          if (resJson.announcements && resJson.announcements.length > 0) {
            const activeMsg = resJson.announcements
              .filter((a: any) => (a['Status Aktif'] || a['status']) === 'Aktif')
              .map((a: any) => a['Pesan'] || a['pesan'] || '')
              .join('  •  ');
            if (activeMsg) setAnnouncement(activeMsg);
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

                return {
                  id,
                  name,
                  class: getVal('Jenjang', 'Jenjang Pendidikan', 'Kelas', 'class', 'Tingkat') || 'SD',
                  dorm: getVal('Asrama', 'Lokasi Asrama', 'Gedung Asrama', 'dorm', 'Gedung') || 'Asrama Terpadu',
                  caretaker: getVal('Wali Asuh', 'Wali', 'caretaker', 'Pendamping') || 'M. ARDIAN NUGRAHA, S.H',
                  rfidTag: rfid || undefined,
                  height: hRaw && !isNaN(Number(hRaw)) ? Number(hRaw) : undefined,
                  weight: wRaw && !isNaN(Number(wRaw)) ? Number(wRaw) : undefined,
                  shirtSize: shirt || undefined,
                  pantsSize: pants || undefined
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

          if (isManual) {
            showToast('Sinkronisasi & Rekonsiliasi Berhasil', 'Database cloud diselaraskan dan data shadow telah dibersihkan.', 'success');
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
    [config.googleScriptUrl, showToast, students, violations, counseling, leaves, dailyJournals, medicalRecords, prayerAttendance, reports]
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
            onLogout={handleLogout}
          />

          <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                students={studentsWithViolationCounts}
                violations={violations}
                counseling={counseling}
                leaves={leaves}
                medicalRecords={medicalRecords}
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

            {activeTab === 'prayer-attendance' && (
              <PrayerAttendanceTab
                students={studentsWithViolationCounts}
                prayerAttendance={prayerAttendance}
                onSavePrayerAttendance={handleSavePrayerAttendance}
                leaves={leaves}
                medicalRecords={medicalRecords}
                config={config}
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
                counseling={counseling}
                medicalRecords={medicalRecords}
                reports={reports}
                config={config}
                onSaveReport={handleSaveReport}
                onSaveConfig={handleSaveConfig}
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
                medicalRecords={medicalRecords}
                config={config}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'guide' && <GuideTab onSelectTab={setActiveTab} />}

            {activeTab === 'settings' && (
              <SettingsTab
                config={config}
                onSaveConfig={handleSaveConfig}
                onShowToast={showToast}
                lastSyncTime={lastSyncTime}
                onSync={() => syncCloudData(true)}
                isSyncing={isSyncing}
                onReconcileShadowData={handleReconcileShadowData}
                studentsCount={students.length}
                recordsCount={violations.length + counseling.length + leaves.length + dailyJournals.length + medicalRecords.length + prayerAttendance.length}
              />
            )}
          </div>
        </main>
      </div>

      {/* DEDICATED GLOBAL PRINT PPT SLIDES CONTAINER (PRINT MODE ONLY - GUIDE TAB) */}
      {activeTab === 'guide' && <PptPrintSlides />}
    </div>
  );
}
