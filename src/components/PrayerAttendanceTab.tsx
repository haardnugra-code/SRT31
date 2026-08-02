import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  Student,
  PrayerAttendance,
  Leave,
  MedicalRecord,
  AppConfig
} from '../types';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  Search,
  Printer,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Award,
  Layers,
  GraduationCap,
  ShieldCheck,
  Check,
  Zap,
  Calendar,
  FileSpreadsheet,
  SwitchCamera,
  Smartphone,
  UserCheck,
  Users,
  CheckSquare,
  Square,
  Filter,
  ListFilter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrayerAttendanceTabProps {
  students: Student[];
  prayerAttendance: PrayerAttendance[];
  onSavePrayerAttendance: (records: PrayerAttendance[]) => void;
  leaves: Leave[];
  medicalRecords: MedicalRecord[];
  config: AppConfig;
}

export const PrayerAttendanceTab: React.FC<PrayerAttendanceTabProps> = ({
  students,
  prayerAttendance,
  onSavePrayerAttendance,
  leaves,
  medicalRecords,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'cards' | 'recap'>('scanner');

  // Attendance Form & Scanner States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPrayerTime, setSelectedPrayerTime] = useState<'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya' | 'Kajian / Kegiatan'>('Subuh');
  const [officerName, setOfficerName] = useState<string>(config.waliAsuhList[0]?.split('|')[0] || config.waliAsrama || 'Pembina Asrama');
  const [manualInputId, setManualInputId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: Student;
    status: string;
    isLeave: boolean;
    isSick: boolean;
    timestamp: string;
    message: string;
  } | null>(null);

  // QR Scanner Instance & Camera Selection States
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Enumerate cameras on component mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
        }
      })
      .catch((err) => {
        console.log('Notice: camera enumeration fallback handled:', err);
      });
  }, []);

  // QR Card States & HD Customization
  const [cardSearch, setCardSearch] = useState<string>('');
  const [cardClassFilter, setCardClassFilter] = useState<string>('');
  const [selectedStudentIdsForCards, setSelectedStudentIdsForCards] = useState<string[]>([]);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [singleCardPreviewStudent, setSingleCardPreviewStudent] = useState<Student | null>(null);
  const [previewSideModal, setPreviewSideModal] = useState<'front' | 'back'>('front');

  // HD Card Print Customization Options
  const [cardPrintSide, setCardPrintSide] = useState<'front' | 'both'>('front'); // 'front' = Tampak Depan Saja, 'both' = 2 Sisi (Depan & Belakang CR80)
  const [cardColorMode, setCardColorMode] = useState<'full' | 'grayscale'>('full'); // 'full' = Full Color HD, 'grayscale' = Hemat Tinta
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true); // Garis Potong Presisi (Crop Marks)

  // Interactive Checklist & Mass Actions States
  const [showChecklistModal, setShowChecklistModal] = useState<boolean>(false);
  const [checklistSearch, setChecklistSearch] = useState<string>('');
  const [checklistClassFilter, setChecklistClassFilter] = useState<string>('');
  const [checklistDormFilter, setChecklistDormFilter] = useState<string>('');
  const [checklistStatusFilter, setChecklistStatusFilter] = useState<string>('Semua');
  const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>([]);

  // Live Log View States
  const [liveLogSearch, setLiveLogSearch] = useState<string>('');
  const [liveLogViewMode, setLiveLogViewMode] = useState<'scanned' | 'all'>('scanned');

  // Recap Filter States
  const [recapDateFilter, setRecapDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recapPrayerFilter, setRecapPrayerFilter] = useState<string>('Semua');
  const [recapClassFilter, setRecapClassFilter] = useState<string>('Semua');
  const [recapSearch, setRecapSearch] = useState<string>('');

  // Audio Beep Generator using Web Audio API
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);
      }
    } catch {
      // Audio context fallbacks handled silently
    }
  };

  // Generate QR Code data URL for each student in Ultra HD Resolution
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const s of students) {
        try {
          // Payload contains clean student ID or JSON
          const qrPayload = s.id;
          const url = await QRCode.toDataURL(qrPayload, {
            width: 800, // Ultra HD resolution for crisp scanning & high DPI print
            margin: 1,
            errorCorrectionLevel: 'H', // High error tolerance
            color: {
              dark: '#020617',
              light: '#ffffff'
            }
          });
          urls[s.id] = url;
        } catch (err) {
          console.error('Gagal generate QR HD untuk student', s.id, err);
        }
      }
      setQrCodeDataUrls(urls);
    };
    if (students.length > 0) {
      generateAllQrs();
    }
  }, [students]);

  // Maintain latest refs to avoid stale closure issues in scanner callback
  const prayerAttendanceRef = useRef(prayerAttendance);
  const studentsRef = useRef(students);
  const leavesRef = useRef(leaves);
  const medicalRecordsRef = useRef(medicalRecords);
  const selectedDateRef = useRef(selectedDate);
  const selectedPrayerTimeRef = useRef(selectedPrayerTime);
  const officerNameRef = useRef(officerName);
  const onSavePrayerAttendanceRef = useRef(onSavePrayerAttendance);

  useEffect(() => {
    prayerAttendanceRef.current = prayerAttendance;
    studentsRef.current = students;
    leavesRef.current = leaves;
    medicalRecordsRef.current = medicalRecords;
    selectedDateRef.current = selectedDate;
    selectedPrayerTimeRef.current = selectedPrayerTime;
    officerNameRef.current = officerName;
    onSavePrayerAttendanceRef.current = onSavePrayerAttendance;
  });

  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Process a Scanned Student ID
  const handleProcessScan = (rawScannedCode: string) => {
    const cleanId = rawScannedCode.trim().toUpperCase();
    if (!cleanId) return;

    // Prevent duplicate rapid scanning of the same ID within 1.5s
    const now = Date.now();
    if (cleanId === lastScanTimeRef.current.code && now - lastScanTimeRef.current.time < 1500) {
      return;
    }
    lastScanTimeRef.current = { code: cleanId, time: now };

    const currentStudents = studentsRef.current;
    const currentAttendance = prayerAttendanceRef.current;
    const currentLeaves = leavesRef.current;
    const currentMedical = medicalRecordsRef.current;
    const curDate = selectedDateRef.current;
    const curPrayer = selectedPrayerTimeRef.current;
    const curOfficer = officerNameRef.current;

    // Find student by ID or exact Name match
    const foundStudent = currentStudents.find(
      (s) =>
        s.id.trim().toUpperCase() === cleanId ||
        s.name.trim().toUpperCase() === cleanId
    );

    if (!foundStudent) {
      playBeep('error');
      setLastScannedResult({
        student: { id: cleanId, name: 'ID Tidak Terdaftar', class: 'SD', dorm: '-', caretaker: '-' },
        status: 'Tidak Ditemukan',
        isLeave: false,
        isSick: false,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        message: `ID/Kode "${cleanId}" tidak terdaftar dalam database murid.`
      });
      return;
    }

    // Check if student currently on active leave
    const onLeave = currentLeaves.some(
      (l) =>
        l.status === 'Active' &&
        (String(l.studentId).trim().toLowerCase() === String(foundStudent.id).trim().toLowerCase() ||
          String(l.studentName).trim().toLowerCase() === String(foundStudent.name).trim().toLowerCase())
    );

    // Check if student currently in UKS / sick
    const inUks = currentMedical.some(
      (m) =>
        (m.status === 'Dalam Perawatan' || m.status === 'Istirahat di Kamar') &&
        (String(m.studentId).trim().toLowerCase() === String(foundStudent.id).trim().toLowerCase() ||
          String(m.studentName).trim().toLowerCase() === String(foundStudent.name).trim().toLowerCase())
    );

    let defaultStatus: PrayerAttendance['status'] = 'Hadir';
    let statusMessage = 'Presensi sholat berhasil dicatat (Hadir).';

    if (onLeave) {
      defaultStatus = 'Izin Pulang';
      statusMessage = 'Siswa terdeteksi sedang Izin Pulang (Presensi Otomatis Disesuaikan).';
      playBeep('warning');
    } else if (inUks) {
      defaultStatus = 'Izin Sakit';
      statusMessage = 'Siswa terdeteksi sedang Perawatan / Sakit UKS (Presensi Otomatis Disesuaikan).';
      playBeep('warning');
    } else {
      playBeep('success');
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Check if attendance already exists for this prayer & date
    const existingIndex = currentAttendance.findIndex(
      (p) =>
        p.date === curDate &&
        p.prayerTime === curPrayer &&
        String(p.studentId).trim().toLowerCase() === String(foundStudent.id).trim().toLowerCase()
    );

    let updatedList = [...currentAttendance];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        timestamp: nowTime,
        status: defaultStatus,
        scannedBy: curOfficer
      };
      statusMessage += ' (Data diperbarui)';
    } else {
      const newRecord: PrayerAttendance = {
        id: `PA-${Date.now().toString().slice(-6)}-${foundStudent.id}`,
        studentId: foundStudent.id,
        studentName: foundStudent.name,
        class: foundStudent.class,
        dorm: foundStudent.dorm,
        prayerTime: curPrayer,
        date: curDate,
        timestamp: nowTime,
        status: defaultStatus,
        scannedBy: curOfficer
      };
      updatedList = [newRecord, ...updatedList];
    }

    onSavePrayerAttendanceRef.current(updatedList);
    setLastScannedResult({
      student: foundStudent,
      status: defaultStatus,
      isLeave: onLeave,
      isSick: inUks,
      timestamp: nowTime,
      message: statusMessage
    });
    setManualInputId('');
  };

  // Start / Restart HTML5 QR Code Scanner with facing mode or exact device ID
  useEffect(() => {
    if (activeSubTab === 'scanner' && isScannerActive) {
      const timer = setTimeout(() => {
        try {
          if (!scannerRef.current) {
            const videoConstraints: MediaTrackConstraints = selectedCameraId
              ? { deviceId: { exact: selectedCameraId } }
              : { facingMode: cameraFacingMode };

            const scanner = new Html5QrcodeScanner(
              'qr-reader-element',
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                videoConstraints: videoConstraints,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
              },
              /* verbose= */ false
            );

            scanner.render(
              (decodedText) => {
                handleProcessScan(decodedText);
              },
              () => {
                // Ignore scanning framing errors
              }
            );

            scannerRef.current = scanner;
          }
        } catch (e) {
          console.error('Html5QrcodeScanner init error:', e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch((err) => console.error('Clear scanner error', err));
          scannerRef.current = null;
        }
      };
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Clear scanner error', err));
        scannerRef.current = null;
      }
    }
  }, [activeSubTab, isScannerActive, cameraFacingMode, selectedCameraId, selectedDate, selectedPrayerTime, officerName]);

  // Bulk Mark Unscanned as Alpa
  const handleBulkMarkUnscannedAsAlpa = () => {
    if (!window.confirm(`Yakin ingin menandai seluruh murid yang belum scan pada sholat ${selectedPrayerTime} tanggal ${selectedDate} sebagai Alpa (Tanpa Keterangan)?`)) {
      return;
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const existingForSession = prayerAttendance.filter(
      (p) => p.date === selectedDate && p.prayerTime === selectedPrayerTime
    );
    const scannedStudentIds = new Set(existingForSession.map((p) => String(p.studentId).trim().toLowerCase()));

    const newAlpaRecords: PrayerAttendance[] = [];

    students.forEach((s) => {
      const sid = String(s.id).trim().toLowerCase();
      if (!scannedStudentIds.has(sid)) {
        // Check if on leave or sick
        const onLeave = leaves.some(
          (l) =>
            l.status === 'Active' &&
            (String(l.studentId).trim().toLowerCase() === sid || String(l.studentName).trim().toLowerCase() === String(s.name).trim().toLowerCase())
        );
        const inUks = medicalRecords.some(
          (m) =>
            (m.status === 'Dalam Perawatan' || m.status === 'Istirahat di Kamar') &&
            (String(m.studentId).trim().toLowerCase() === sid || String(m.studentName).trim().toLowerCase() === String(s.name).trim().toLowerCase())
        );

        let autoStatus: PrayerAttendance['status'] = 'Alpa / Tanpa Keterangan';
        if (onLeave) autoStatus = 'Izin Pulang';
        else if (inUks) autoStatus = 'Izin Sakit';

        newAlpaRecords.push({
          id: `PA-ALPA-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`,
          studentId: s.id,
          studentName: s.name,
          class: s.class,
          dorm: s.dorm,
          prayerTime: selectedPrayerTime,
          date: selectedDate,
          timestamp: nowTime,
          status: autoStatus,
          note: autoStatus === 'Alpa / Tanpa Keterangan' ? 'Penutupan sesi absensi otomatis' : undefined,
          scannedBy: officerName
        });
      }
    });

    onSavePrayerAttendance([...newAlpaRecords, ...prayerAttendance]);
    playBeep('warning');
    alert(`Berhasil menandai ${newAlpaRecords.length} murid yang belum scan untuk sholat ${selectedPrayerTime}!`);
  };

  // Mark All Students as Hadir for selected session & date
  const handleMarkAllHadir = () => {
    if (
      !window.confirm(
        `Konfirmasi: Tandai SELURUH murid (${students.length} murid) sebagai "HADIR" untuk Sholat ${selectedPrayerTime} tanggal ${selectedDate}?`
      )
    ) {
      return;
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const existingForSession = prayerAttendance.filter(
      (p) => p.date === selectedDate && p.prayerTime === selectedPrayerTime
    );
    const existingMap = new Map<string, PrayerAttendance>(
      existingForSession.map((p) => [String(p.studentId).trim().toLowerCase(), p])
    );

    const newRecords: PrayerAttendance[] = students.map((s) => {
      const sid = String(s.id).trim().toLowerCase();
      const existing = existingMap.get(sid);

      // Check active leave / medical status for smart default
      const onLeave = leaves.some(
        (l) =>
          l.status === 'Active' &&
          (String(l.studentId).trim().toLowerCase() === sid || String(l.studentName).trim().toLowerCase() === String(s.name).trim().toLowerCase())
      );
      const inUks = medicalRecords.some(
        (m) =>
          (m.status === 'Dalam Perawatan' || m.status === 'Istirahat di Kamar') &&
          (String(m.studentId).trim().toLowerCase() === sid || String(m.studentName).trim().toLowerCase() === String(s.name).trim().toLowerCase())
      );

      let defaultStatus: PrayerAttendance['status'] = 'Hadir';
      if (onLeave) defaultStatus = 'Izin Pulang';
      else if (inUks) defaultStatus = 'Izin Sakit';

      return {
        id: existing?.id || `PA-ALLHADIR-${Date.now().toString().slice(-5)}-${s.id}`,
        studentId: s.id,
        studentName: s.name,
        class: s.class,
        dorm: s.dorm,
        prayerTime: selectedPrayerTime,
        date: selectedDate,
        timestamp: existing?.timestamp || nowTime,
        status: defaultStatus,
        note: existing?.note || 'Presensi Massal Hadir Semua',
        scannedBy: officerName
      };
    });

    const otherSessionRecords = prayerAttendance.filter(
      (p) => !(p.date === selectedDate && p.prayerTime === selectedPrayerTime)
    );

    onSavePrayerAttendance([...newRecords, ...otherSessionRecords]);
    playBeep('success');
  };

  // Update status for a single student directly
  const handleUpdateStudentStatus = (
    studentId: string,
    studentName: string,
    studentClass: string,
    studentDorm: string,
    newStatus: PrayerAttendance['status']
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const sid = String(studentId).trim().toLowerCase();

    const existingIndex = prayerAttendance.findIndex(
      (p) =>
        p.date === selectedDate &&
        p.prayerTime === selectedPrayerTime &&
        String(p.studentId).trim().toLowerCase() === sid
    );

    let updatedList = [...prayerAttendance];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        status: newStatus,
        timestamp: nowTime,
        scannedBy: officerName
      };
    } else {
      updatedList.unshift({
        id: `PA-MANUAL-${Date.now().toString().slice(-5)}-${studentId}`,
        studentId: studentId,
        studentName: studentName,
        class: studentClass,
        dorm: studentDorm,
        prayerTime: selectedPrayerTime,
        date: selectedDate,
        timestamp: nowTime,
        status: newStatus,
        scannedBy: officerName
      });
    }

    onSavePrayerAttendance(updatedList);
  };

  // Batch update for selected students in checklist modal
  const handleBatchSetStatus = (targetStatus: PrayerAttendance['status']) => {
    if (selectedChecklistIds.length === 0) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const targetSet = new Set(selectedChecklistIds.map((id) => String(id).trim().toLowerCase()));
    const targetStudents = students.filter((s) => targetSet.has(String(s.id).trim().toLowerCase()));

    let updatedList = [...prayerAttendance];

    targetStudents.forEach((s) => {
      const sid = String(s.id).trim().toLowerCase();
      const existingIndex = updatedList.findIndex(
        (p) =>
          p.date === selectedDate &&
          p.prayerTime === selectedPrayerTime &&
          String(p.studentId).trim().toLowerCase() === sid
      );

      if (existingIndex >= 0) {
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          status: targetStatus,
          timestamp: nowTime,
          scannedBy: officerName
        };
      } else {
        updatedList.unshift({
          id: `PA-BATCH-${Date.now().toString().slice(-5)}-${s.id}`,
          studentId: s.id,
          studentName: s.name,
          class: s.class,
          dorm: s.dorm,
          prayerTime: selectedPrayerTime,
          date: selectedDate,
          timestamp: nowTime,
          status: targetStatus,
          scannedBy: officerName
        });
      }
    });

    onSavePrayerAttendance(updatedList);
    setSelectedChecklistIds([]);
    playBeep('success');
  };

  // Stats calculation for today's selected session
  const todaySessionRecords = useMemo(() => {
    return prayerAttendance.filter(
      (p) => p.date === selectedDate && p.prayerTime === selectedPrayerTime
    );
  }, [prayerAttendance, selectedDate, selectedPrayerTime]);

  const todaySessionMap = useMemo(() => {
    const map = new Map<string, PrayerAttendance>();
    todaySessionRecords.forEach((p) => {
      map.set(String(p.studentId).trim().toLowerCase(), p);
    });
    return map;
  }, [todaySessionRecords]);

  const stats = useMemo(() => {
    const total = students.length;
    const recorded = todaySessionRecords.length;
    const hadir = todaySessionRecords.filter((p) => p.status === 'Hadir').length;
    const terlambat = todaySessionRecords.filter((p) => p.status === 'Terlambat').length;
    const izinSakit = todaySessionRecords.filter((p) => p.status === 'Izin Sakit').length;
    const izinPulang = todaySessionRecords.filter((p) => p.status === 'Izin Pulang').length;
    const alpa = todaySessionRecords.filter((p) => p.status === 'Alpa / Tanpa Keterangan').length;
    const belumScan = Math.max(0, total - recorded);

    return { total, recorded, hadir, terlambat, izinSakit, izinPulang, alpa, belumScan };
  }, [students.length, todaySessionRecords]);

  // Card filter students
  const filteredStudentsForCards = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(cardSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(cardSearch.toLowerCase()) ||
        s.dorm.toLowerCase().includes(cardSearch.toLowerCase());
      const matchClass = cardClassFilter === '' || s.class === cardClassFilter;
      return matchSearch && matchClass;
    });
  }, [students, cardSearch, cardClassFilter]);

  const toggleSelectAllCards = () => {
    if (selectedStudentIdsForCards.length === filteredStudentsForCards.length) {
      setSelectedStudentIdsForCards([]);
    } else {
      setSelectedStudentIdsForCards(filteredStudentsForCards.map((s) => s.id));
    }
  };

  const toggleSelectCard = (id: string) => {
    if (selectedStudentIdsForCards.includes(id)) {
      setSelectedStudentIdsForCards(selectedStudentIdsForCards.filter((x) => x !== id));
    } else {
      setSelectedStudentIdsForCards([...selectedStudentIdsForCards, id]);
    }
  };

  // Filtered Recap Records
  const filteredRecapRecords = useMemo(() => {
    return prayerAttendance.filter((p) => {
      const matchDate = !recapDateFilter || p.date === recapDateFilter;
      const matchPrayer = recapPrayerFilter === 'Semua' || p.prayerTime === recapPrayerFilter;
      const matchClass = recapClassFilter === 'Semua' || p.class === recapClassFilter;
      const q = recapSearch.toLowerCase();
      const matchSearch =
        p.studentName.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        p.dorm.toLowerCase().includes(q);
      return matchDate && matchPrayer && matchClass && matchSearch;
    });
  }, [prayerAttendance, recapDateFilter, recapPrayerFilter, recapClassFilter, recapSearch]);

  // Export Recap PDF
  const handleExportRecapPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Kop Surat Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(config.kopKiri.split('\n'), 15, 12);

    doc.setFontSize(10);
    doc.text(config.kopKanan.split('\n'), pageWidth - 15, 12, { align: 'right' });

    doc.setLineWidth(0.6);
    doc.line(15, 28, pageWidth - 15, 28);
    doc.setLineWidth(0.2);
    doc.line(15, 29, pageWidth - 15, 29);

    // Document Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN DAFTAR HADIR SHOLAT JAMAAH & KEGIATAN ASRAMA', pageWidth / 2, 36, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Tanggal: ${recapDateFilter || 'Semua Tanggal'}  |  Waktu Sholat: ${recapPrayerFilter}  |  Tingkat: ${recapClassFilter}`,
      pageWidth / 2,
      41,
      { align: 'center' }
    );

    // Summary Stats Box
    const totalRec = filteredRecapRecords.length;
    const h = filteredRecapRecords.filter((p) => p.status === 'Hadir').length;
    const t = filteredRecapRecords.filter((p) => p.status === 'Terlambat').length;
    const i = filteredRecapRecords.filter((p) => p.status === 'Izin Sakit' || p.status === 'Izin Pulang').length;
    const a = filteredRecapRecords.filter((p) => p.status === 'Alpa / Tanpa Keterangan').length;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 45, pageWidth - 30, 12, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Records: ${totalRec}`, 20, 52);
    doc.text(`Hadir: ${h}`, 65, 52);
    doc.text(`Terlambat: ${t}`, 95, 52);
    doc.text(`Izin/Sakit: ${i}`, 130, 52);
    doc.text(`Alpa: ${a}`, 165, 52);

    // Table Data
    const tableBody = filteredRecapRecords.map((r, idx) => [
      idx + 1,
      r.studentId,
      r.studentName,
      r.class,
      r.dorm,
      r.prayerTime,
      r.timestamp,
      r.status,
      r.scannedBy || '-'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['No', 'NISN', 'Nama Murid', 'Kelas', 'Gedung Asrama', 'Sholat', 'Waktu', 'Status', 'Petugas']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 22, halign: 'center' },
        8: { cellWidth: 25 }
      }
    });

    // Signatures
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    if (finalY + 35 < 280) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 50, finalY);
      doc.text('Mengetahui, Wali Asrama', 25, finalY + 5);
      doc.text('Pembina / Officer Asrama', pageWidth - 50, finalY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text(config.waliAsrama, 25, finalY + 22);
      doc.text(officerName, pageWidth - 50, finalY + 22);

      doc.setFont('helvetica', 'normal');
      doc.text(config.waliAsramaNip, 25, finalY + 26);
    }

    doc.save(`Absensi_Sholat_SekolahRakyat_${recapDateFilter || 'Rekap'}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-red-200 text-xs font-semibold mb-3 backdrop-blur-sm">
              <QrCode className="w-3.5 h-3.5 text-amber-300" /> Modul Absensi Sholat & QR Code Generator
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Absensi Sholat & Kartu QR Code Murid
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Cetak Kartu Tanda Murid ber-QR Code official, lakukan absensi sholat jamaah menggunakan webcam / scanner barcode gun, serta kelola rekapitulasi kehadiran terpadu.
            </p>
          </div>

          {/* Mode Sub-Tab Switcher */}
          <div className="no-print bg-white/10 p-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs flex-shrink-0 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeSubTab === 'scanner'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-4 h-4" /> QR Scanner Live
            </button>
            <button
              onClick={() => setActiveSubTab('cards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeSubTab === 'cards'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="w-4 h-4" /> Generator Kartu QR
            </button>
            <button
              onClick={() => setActiveSubTab('recap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeSubTab === 'recap'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Laporan Rekap Hadir
            </button>
          </div>
        </div>
        <QrCode className="absolute right-4 -bottom-8 w-60 h-60 text-white/5 pointer-events-none" />
      </div>

      {/* SUB-TAB 1: LIVE QR SCANNER & ATTENDANCE RECORDING */}
      {activeSubTab === 'scanner' && (
        <div className="no-print space-y-6">
          {/* Controls Bar: Session Setup & Quick Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-600" /> Tanggal Absensi:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-600" /> Waktu Sholat / Kegiatan:
                </label>
                <select
                  value={selectedPrayerTime}
                  onChange={(e) =>
                    setSelectedPrayerTime(
                      e.target.value as 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya' | 'Kajian / Kegiatan'
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Subuh">🕌 Sholat Subuh</option>
                  <option value="Dzuhur">🕌 Sholat Dzuhur</option>
                  <option value="Ashar">🕌 Sholat Ashar</option>
                  <option value="Maghrib">🕌 Sholat Maghrib</option>
                  <option value="Isya">🕌 Sholat Isya</option>
                  <option value="Kajian / Kegiatan">📖 Kajian / Kegiatan Asrama</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> Petugas / Pembina:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Nama Pembina / Wali Asuh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                    soundEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
                  {soundEnabled ? 'Suara Aktif' : 'Mute Suara'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkMarkUnscannedAsAlpa}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-lg text-xs shadow transition-all flex items-center justify-center gap-1.5"
                  title="Tandai sisa murid yang belum scan sebagai Alpa"
                >
                  <UserX className="w-3.5 h-3.5" /> Tutup Sesi (Alpa)
                </button>
              </div>
            </div>

            {/* Quick Action Row for Hadir Semua & Selecting Absent Students */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Zap className="w-4 h-4 text-amber-500 animate-bounce" /> Aksi Cepat Presensi Sesi Ini:
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllHadir}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Tandai seluruh murid sebagai HADIR sekaligus"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Hadirkan Semua ({students.length} Murid)
                </button>

                <button
                  type="button"
                  onClick={() => setShowChecklistModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
                  title="Buka checklist murid untuk memilih siapa saja yang tidak hadir / izin / sakit"
                >
                  <UserCheck className="w-4 h-4 text-amber-400" /> Pilih Siswa Tidak Hadir / Checklist
                </button>

                <button
                  type="button"
                  onClick={handleBulkMarkUnscannedAsAlpa}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Tandai sisa murid yang belum scan sebagai Alpa"
                >
                  <UserX className="w-3.5 h-3.5" /> Tutup Sesi (Alpa)
                </button>
              </div>
            </div>

            {/* Live KPI Metric Cards for selected prayer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Murid</span>
                <span className="text-base font-black text-slate-800">{stats.total}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Hadir</span>
                <span className="text-base font-black text-emerald-800">{stats.hadir}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">Terlambat</span>
                <span className="text-base font-black text-amber-800">{stats.terlambat}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-purple-700 font-bold uppercase block">Izin Pulang</span>
                <span className="text-base font-black text-purple-800">{stats.izinPulang}</span>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-teal-700 font-bold uppercase block">Izin Sakit</span>
                <span className="text-base font-black text-teal-800">{stats.izinSakit}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-rose-700 font-bold uppercase block">Belum Scan / Alpa</span>
                <span className="text-base font-black text-rose-800">{stats.belumScan}</span>
              </div>
            </div>
          </div>

          {/* MAIN SCANNER AREA & MANUAL INPUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: QR Webcam Scanner & Hardware Gun Simulator */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-600" /> Pemindai QR Code Kamera
                  </h3>
                  <button
                    onClick={() => setIsScannerActive(!isScannerActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
                      isScannerActive
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {isScannerActive ? <X className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    {isScannerActive ? 'Matikan Kamera' : 'Nyalakan Kamera Scanner'}
                  </button>
                </div>

                {/* Camera Selector (Depan / Belakang) Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <SwitchCamera className="w-4 h-4 text-red-600" /> Pilih Kamera:
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                      {selectedCameraId
                        ? 'Kamera Spesifik'
                        : cameraFacingMode === 'environment'
                        ? 'Kamera Belakang'
                        : 'Kamera Depan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCameraId('');
                        setCameraFacingMode('environment');
                      }}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all border text-xs ${
                        !selectedCameraId && cameraFacingMode === 'environment'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Kamera Belakang (Rear)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCameraId('');
                        setCameraFacingMode('user');
                      }}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all border text-xs ${
                        !selectedCameraId && cameraFacingMode === 'user'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Kamera Depan (Front)
                    </button>
                  </div>

                  {availableCameras.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200">
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                        Pilih perangkat kamera terdeteksi ({availableCameras.length}):
                      </label>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">-- Pilihan Kamera Depan / Belakang Otomatis --</option>
                        {availableCameras.map((cam, idx) => (
                          <option key={cam.id || idx} value={cam.id}>
                            {cam.label || `Kamera ${idx + 1} (${cam.id.substring(0, 8)})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isScannerActive ? (
                  <div className="space-y-2">
                    <div
                      id="qr-reader-element"
                      className="rounded-xl overflow-hidden border-2 border-red-500/40 bg-slate-950 min-h-[250px]"
                    />
                    <p className="text-[11px] text-slate-500 text-center font-medium">
                      Arahkan QR Code Kartu Tanda Murid ke depan kamera. Scanner akan membaca kode secara otomatis.
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Kamera Scanner Non-Aktif</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Klik tombol "Nyalakan Kamera Scanner" di atas untuk mengaktifkan pemindaian otomatis via webcam laptop/HP.
                      </p>
                    </div>
                  </div>
                )}

                {/* Hardware Gun / Manual Type Barcode Input */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-slate-600" /> Scanner Gun USB / Input Manual NISN:
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProcessScan(manualInputId);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={manualInputId}
                      onChange={(e) => setManualInputId(e.target.value)}
                      placeholder="Scan atau ketik NISN murid (cth: SR0001) lalu Enter..."
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all whitespace-nowrap"
                    >
                      Proses Scan
                    </button>
                  </form>
                </div>
              </div>

              {/* Toast Card Result */}
              {lastScannedResult && (
                <div
                  className={`p-4 rounded-2xl border shadow-lg transition-all space-y-2 animate-fadeIn ${
                    lastScannedResult.status === 'Tidak Ditemukan'
                      ? 'bg-rose-950 text-rose-100 border-rose-500/50'
                      : lastScannedResult.isLeave || lastScannedResult.isSick
                      ? 'bg-amber-950 text-amber-100 border-amber-500/50'
                      : 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      {lastScannedResult.status === 'Tidak Ditemukan' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      <span className="font-bold text-sm tracking-tight">{lastScannedResult.student.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10">
                      {lastScannedResult.timestamp}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-white/60 block">NISN / ID</span>
                      <span className="font-mono font-bold text-white">{lastScannedResult.student.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">Kelas & Asrama</span>
                      <span className="font-bold text-white">
                        {lastScannedResult.student.class} • {lastScannedResult.student.dorm}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">Status Presensi</span>
                      <span className="font-bold text-white uppercase">{lastScannedResult.status}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium pt-1 text-white/90 italic border-t border-white/10">
                    {lastScannedResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Live Scanned List & Interactive Checklist for selected session */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" /> Log Absensi Sesi ({selectedPrayerTime} • {selectedDate})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daftar status presensi sholat murid terintegrasi ({stats.hadir} Hadir, {stats.alpa} Alpa, {stats.belumScan} Belum Scan).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllHadir}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow transition-all flex items-center gap-1 active:scale-95"
                      title="Klik untuk set seluruh murid sebagai Hadir"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hadir Semua
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChecklistModal(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow transition-all flex items-center gap-1 active:scale-95"
                      title="Kelola & pilih siswa yang tidak hadir"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Filter Absen
                    </button>
                  </div>
                </div>

                {/* View Mode Switcher & Realtime Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-[11px] font-bold w-full sm:w-auto">
                    <button
                      onClick={() => setLiveLogViewMode('scanned')}
                      className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                        liveLogViewMode === 'scanned'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Terdata ({todaySessionRecords.length})
                    </button>
                    <button
                      onClick={() => setLiveLogViewMode('all')}
                      className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                        liveLogViewMode === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Siswa ({students.length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={liveLogSearch}
                      onChange={(e) => setLiveLogSearch(e.target.value)}
                      placeholder="Cari siswa..."
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1 text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>
                </div>

                {/* Live Feed List */}
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                  {liveLogViewMode === 'scanned' ? (
                    /* MODE 1: SCANNED / RECORDED ONLY */
                    todaySessionRecords.filter((rec) =>
                      rec.studentName.toLowerCase().includes(liveLogSearch.toLowerCase()) ||
                      rec.studentId.toLowerCase().includes(liveLogSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-10 text-slate-400 space-y-2">
                        <QrCode className="w-10 h-10 mx-auto opacity-30 text-slate-500" />
                        <p className="text-xs font-medium">Belum ada data presensi untuk sholat {selectedPrayerTime}.</p>
                        <p className="text-[11px] text-slate-400">
                          Klik <button onClick={handleMarkAllHadir} className="text-emerald-600 font-bold underline">Hadir Semua</button> atau beralih ke tab <button onClick={() => setLiveLogViewMode('all')} className="text-slate-800 font-bold underline">Semua Siswa</button> untuk pilih yang tidak hadir.
                        </p>
                      </div>
                    ) : (
                      todaySessionRecords
                        .filter((rec) =>
                          rec.studentName.toLowerCase().includes(liveLogSearch.toLowerCase()) ||
                          rec.studentId.toLowerCase().includes(liveLogSearch.toLowerCase())
                        )
                        .map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-all gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  rec.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'Terlambat'
                                    ? 'bg-amber-100 text-amber-800'
                                    : rec.status === 'Izin Pulang' || rec.status === 'Izin Sakit'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rec.studentName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 leading-tight truncate">{rec.studentName}</h4>
                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                  {rec.studentId} • Kelas {rec.class} ({rec.dorm})
                                </p>
                              </div>
                            </div>

                            {/* Direct Status Selector */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <select
                                value={rec.status}
                                onChange={(e) =>
                                  handleUpdateStudentStatus(
                                    rec.studentId,
                                    rec.studentName,
                                    rec.class,
                                    rec.dorm,
                                    e.target.value as PrayerAttendance['status']
                                  )
                                }
                                className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                  rec.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : rec.status === 'Terlambat'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : rec.status === 'Izin Sakit'
                                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                                    : rec.status === 'Izin Pulang'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="Hadir">✓ Hadir</option>
                                <option value="Terlambat">⏱ Terlambat</option>
                                <option value="Izin Sakit">🤒 Izin Sakit</option>
                                <option value="Izin Pulang">🏖 Izin Pulang</option>
                                <option value="Alpa / Tanpa Keterangan">❌ Alpa / Abse</option>
                              </select>
                            </div>
                          </div>
                        ))
                    )
                  ) : (
                    /* MODE 2: ALL REGISTERED STUDENTS CHECKLIST */
                    students
                      .filter((s) =>
                        s.name.toLowerCase().includes(liveLogSearch.toLowerCase()) ||
                        s.id.toLowerCase().includes(liveLogSearch.toLowerCase()) ||
                        s.dorm.toLowerCase().includes(liveLogSearch.toLowerCase())
                      )
                      .map((s) => {
                        const sid = String(s.id).trim().toLowerCase();
                        const existingRec = todaySessionMap.get(sid);
                        const currentStatus = existingRec ? existingRec.status : 'Belum Scan';

                        return (
                          <div
                            key={s.id}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-xl border text-xs transition-all gap-2 ${
                              currentStatus === 'Hadir'
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : currentStatus === 'Terlambat'
                                ? 'bg-amber-50/60 border-amber-200'
                                : currentStatus === 'Izin Sakit' || currentStatus === 'Izin Pulang'
                                ? 'bg-purple-50/60 border-purple-200'
                                : currentStatus === 'Alpa / Tanpa Keterangan'
                                ? 'bg-rose-50/60 border-rose-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                                  currentStatus === 'Hadir'
                                    ? 'bg-emerald-600 text-white'
                                    : currentStatus === 'Terlambat'
                                    ? 'bg-amber-600 text-white'
                                    : currentStatus === 'Izin Sakit' || currentStatus === 'Izin Pulang'
                                    ? 'bg-purple-600 text-white'
                                    : currentStatus === 'Alpa / Tanpa Keterangan'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {s.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 leading-tight truncate text-[11px]">{s.name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                  {s.id} • {s.class} ({s.dorm})
                                </p>
                              </div>
                            </div>

                            {/* Direct Quick Toggle Buttons */}
                            <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Hadir')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === 'Hadir'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                              >
                                ✓ Hadir
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Terlambat')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === 'Terlambat'
                                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              >
                                ⏱ Telat
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Izin Sakit')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === 'Izin Sakit'
                                    ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400'
                                    : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                                }`}
                              >
                                🤒 Sakit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Izin Pulang')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === 'Izin Pulang'
                                    ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                }`}
                              >
                                🏖 Pulang
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Alpa / Tanpa Keterangan')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === 'Alpa / Tanpa Keterangan'
                                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                              >
                                ❌ Alpa
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Presensi otomatis tersimpan.</span>
                <button
                  onClick={() => setActiveSubTab('recap')}
                  className="text-red-600 hover:underline font-bold flex items-center gap-1"
                >
                  Lihat Rekap Full &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* INTERACTIVE MODAL CHECKLIST FOR SELECTING ABSENT STUDENTS */}
          {showChecklistModal && (
            <div className="no-print fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-5 flex items-start justify-between relative">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 mb-1">
                      <UserCheck className="w-3.5 h-3.5" /> Modul Presensi Cepat & Checklist Murid
                    </div>
                    <h3 className="font-extrabold text-lg text-white">
                      Kelola & Pilih Siswa Tidak Hadir
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Sesi Sholat <span className="font-bold text-amber-300">{selectedPrayerTime}</span> • Tanggal <span className="font-bold text-amber-300">{selectedDate}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setShowChecklistModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white bg-white/10 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Quick Actions Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMarkAllHadir}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Mark Hadir Semua ({students.length})
                      </button>

                      {selectedChecklistIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-sm">
                          <span className="text-[11px] font-bold text-slate-700 px-2">
                            Aksi {selectedChecklistIds.length} Terpilih:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBatchSetStatus('Alpa / Tanpa Keterangan')}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Set Alpa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetStatus('Terlambat')}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Set Terlambat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetStatus('Izin Sakit')}
                            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Set Sakit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetStatus('Izin Pulang')}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Set Pulang
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-700 flex items-center gap-3">
                      <span className="text-emerald-700">✓ Hadir: {stats.hadir}</span>
                      <span className="text-rose-700">❌ Alpa: {stats.alpa}</span>
                      <span className="text-slate-500">Belum Scan: {stats.belumScan}</span>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="relative sm:col-span-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={checklistSearch}
                        onChange={(e) => setChecklistSearch(e.target.value)}
                        placeholder="Cari nama atau NISN..."
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>

                    <div>
                      <select
                        value={checklistClassFilter}
                        onChange={(e) => setChecklistClassFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">Semua Jenjang / Kelas</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={checklistDormFilter}
                        onChange={(e) => setChecklistDormFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">Semua Gedung Asrama</option>
                        {Array.from(new Set(students.map((s) => s.dorm))).map((dorm) => (
                          <option key={dorm} value={dorm}>
                            {dorm}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={checklistStatusFilter}
                        onChange={(e) => setChecklistStatusFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="Semua">Semua Status Presensi</option>
                        <option value="Belum Scan">Belum Scan / Absen</option>
                        <option value="Hadir">Hadir</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Izin Sakit">Izin Sakit</option>
                        <option value="Izin Pulang">Izin Pulang</option>
                        <option value="Alpa / Tanpa Keterangan">Alpa</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Modal Student Table List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                selectedChecklistIds.length > 0 &&
                                selectedChecklistIds.length ===
                                  students.filter((s) => {
                                    const matchSearch =
                                      s.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
                                      s.id.toLowerCase().includes(checklistSearch.toLowerCase());
                                    const matchClass = !checklistClassFilter || s.class === checklistClassFilter;
                                    const matchDorm = !checklistDormFilter || s.dorm === checklistDormFilter;
                                    return matchSearch && matchClass && matchDorm;
                                  }).length
                              }
                              onChange={(e) => {
                                const matching = students.filter((s) => {
                                  const matchSearch =
                                    s.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
                                    s.id.toLowerCase().includes(checklistSearch.toLowerCase());
                                  const matchClass = !checklistClassFilter || s.class === checklistClassFilter;
                                  const matchDorm = !checklistDormFilter || s.dorm === checklistDormFilter;
                                  return matchSearch && matchClass && matchDorm;
                                });
                                if (e.target.checked) {
                                  setSelectedChecklistIds(matching.map((m) => m.id));
                                } else {
                                  setSelectedChecklistIds([]);
                                }
                              }}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                          </th>
                          <th className="p-3">Nama Murid & NISN</th>
                          <th className="p-3">Kelas & Asrama</th>
                          <th className="p-3">Status Saat Ini</th>
                          <th className="p-3 text-right">Aksi Ubah Status Cepat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {students
                          .filter((s) => {
                            const matchSearch =
                              s.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
                              s.id.toLowerCase().includes(checklistSearch.toLowerCase());
                            const matchClass = !checklistClassFilter || s.class === checklistClassFilter;
                            const matchDorm = !checklistDormFilter || s.dorm === checklistDormFilter;

                            const sid = String(s.id).trim().toLowerCase();
                            const rec = todaySessionMap.get(sid);
                            const st = rec ? rec.status : 'Belum Scan';

                            const matchStatus =
                              checklistStatusFilter === 'Semua' ||
                              (checklistStatusFilter === 'Belum Scan' ? st === 'Belum Scan' : st === checklistStatusFilter);

                            return matchSearch && matchClass && matchDorm && matchStatus;
                          })
                          .map((s) => {
                            const sid = String(s.id).trim().toLowerCase();
                            const rec = todaySessionMap.get(sid);
                            const currentStatus = rec ? rec.status : 'Belum Scan';
                            const isChecked = selectedChecklistIds.includes(s.id);

                            return (
                              <tr
                                key={s.id}
                                className={`hover:bg-slate-50 transition-all ${
                                  isChecked ? 'bg-red-50/40' : ''
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedChecklistIds([...selectedChecklistIds, s.id]);
                                      } else {
                                        setSelectedChecklistIds(selectedChecklistIds.filter((id) => id !== s.id));
                                      }
                                    }}
                                    className="rounded text-red-600 focus:ring-red-500"
                                  />
                                </td>
                                <td className="p-3">
                                  <h4 className="font-bold text-slate-900 leading-tight">{s.name}</h4>
                                  <span className="text-[10px] font-mono font-bold text-slate-500">
                                    NISN: {s.id}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-700">
                                  <span className="font-bold text-red-700">Kelas {s.class}</span>
                                  <span className="block text-[10px] text-slate-500">{s.dorm}</span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                      currentStatus === 'Hadir'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : currentStatus === 'Terlambat'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : currentStatus === 'Izin Sakit' || currentStatus === 'Izin Pulang'
                                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                        : currentStatus === 'Alpa / Tanpa Keterangan'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                                    }`}
                                  >
                                    {currentStatus}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Hadir')
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                        currentStatus === 'Hadir'
                                          ? 'bg-emerald-600 text-white shadow'
                                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                      }`}
                                    >
                                      ✓ Hadir
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Terlambat')
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                        currentStatus === 'Terlambat'
                                          ? 'bg-amber-600 text-white shadow'
                                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                      }`}
                                    >
                                      ⏱ Telat
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Izin Sakit')
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                        currentStatus === 'Izin Sakit'
                                          ? 'bg-teal-600 text-white shadow'
                                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                                      }`}
                                    >
                                      🤒 Sakit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudentStatus(s.id, s.name, s.class, s.dorm, 'Izin Pulang')
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                        currentStatus === 'Izin Pulang'
                                          ? 'bg-purple-600 text-white shadow'
                                          : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                                      }`}
                                    >
                                      🏖 Pulang
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudentStatus(
                                          s.id,
                                          s.name,
                                          s.class,
                                          s.dorm,
                                          'Alpa / Tanpa Keterangan'
                                        )
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                        currentStatus === 'Alpa / Tanpa Keterangan'
                                          ? 'bg-rose-600 text-white shadow'
                                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                                      }`}
                                    >
                                      ❌ Alpa
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Total {students.length} murid terdaftar dalam sistem.
                  </span>
                  <button
                    onClick={() => setShowChecklistModal(false)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs shadow transition-all"
                  >
                    Selesai / Tutup Checklist
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OFFICIAL STUDENT QR CODE CARD GENERATOR */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6">
          {/* Controls Bar & HD Print Customization Panel */}
          <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-red-600" /> Generator & Cetak Kartu Tanda Murid Official (CR80 HD)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cetak Kartu Tanda Murid standar ID-1 / CR80 (85.6 x 54 mm) dengan QR Code resolusi tinggi untuk absensi sholat & keasramaan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={toggleSelectAllCards}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200"
                >
                  {selectedStudentIdsForCards.length === filteredStudentsForCards.length && filteredStudentsForCards.length > 0
                    ? 'Batal Pilih Semua'
                    : `Pilih Semua Tampil (${filteredStudentsForCards.length})`}
                </button>

                <button
                  onClick={() => {
                    setSelectedStudentIdsForCards([]);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 border border-slate-700"
                  title="Cetak seluruh kartu murid yang saat ini ditampilkan sesuai filter di layar"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Cetak Semua Tampil ({filteredStudentsForCards.length})
                </button>

                {selectedStudentIdsForCards.length > 0 && (
                  <button
                    onClick={() => window.print()}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Terpilih ({selectedStudentIdsForCards.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar & HD Print Customization Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  placeholder="Cari nama, NISN, atau gedung..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <select
                  value={cardClassFilter}
                  onChange={(e) => setCardClassFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">Semua Jenjang / Kelas</option>
                  <option value="SD">Jenjang SD</option>
                  <option value="SMP">Jenjang SMP</option>
                  <option value="SMA">Jenjang SMA</option>
                </select>
              </div>

              <div>
                <select
                  value={cardPrintSide}
                  onChange={(e) => setCardPrintSide(e.target.value as 'front' | 'both')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="front">Muka Kartu: Tampak Depan Saja</option>
                  <option value="both">Muka Kartu: 2 Sisi (Depan & Belakang)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-[11px]">
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={(e) => setShowCropMarks(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  Garis Potong (Crop Marks)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Terpilih: {selectedStudentIdsForCards.length}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid Display (Screen View - Authentic CR80 Sizing 85.6 x 54 mm ratio) */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudentsForCards.map((s) => {
              const isSelected = selectedStudentIdsForCards.includes(s.id);
              const qrUrl = qrCodeDataUrls[s.id];

              return (
                <div
                  key={s.id}
                  onClick={() => toggleSelectCard(s.id)}
                  className={`relative cursor-pointer rounded-2xl border transition-all overflow-hidden p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white shadow-md hover:shadow-xl ${
                    isSelected ? 'ring-4 ring-red-500 border-red-500 scale-[1.01]' : 'border-slate-800 opacity-95 hover:opacity-100'
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-red-600 text-white shadow-md' : 'bg-white/20 text-transparent border border-white/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center gap-2 border-b border-white/15 pb-2.5 mb-3 pr-8">
                    {config.logoKiriUrl ? (
                      <img src={config.logoKiriUrl} alt="Logo" className="w-7 h-7 object-contain bg-white/10 rounded-full p-0.5" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100 leading-tight">
                        KARTU TANDA MURID
                      </h4>
                      <p className="text-[9px] text-red-300 font-bold uppercase">SEKOLAH RAKYAT KEMENSOS RI</p>
                    </div>
                  </div>

                  {/* Card Main Info */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1 text-xs flex-1">
                      <span className="inline-block px-2 py-0.5 bg-red-600/40 border border-red-500/50 text-red-200 text-[9px] font-extrabold rounded-full uppercase">
                        KELAS {s.class}
                      </span>
                      <h3 className="font-extrabold text-sm text-white leading-tight">{s.name}</h3>
                      <p className="text-[10px] text-slate-300 font-mono">NISN: {s.id}</p>
                      <p className="text-[10px] text-slate-400">Gedung: {s.dorm}</p>
                    </div>

                    {/* QR Code Container HD */}
                    <div className="bg-white p-1.5 rounded-xl shadow-lg border border-white/20 flex-shrink-0 text-center">
                      {qrUrl ? (
                        <img src={qrUrl} alt={`QR-${s.id}`} className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 animate-pulse rounded" />
                      )}
                      <span className="text-[8px] font-mono font-black text-slate-900 block mt-0.5">{s.id}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">CR80 • 85.6x54mm</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSingleCardPreviewStudent(s);
                        setPreviewSideModal('front');
                      }}
                      className="text-red-300 hover:text-white font-bold underline flex items-center gap-1"
                    >
                      Pratinjau HD &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Single Card Modal Preview HD */}
          {singleCardPreviewStudent && (
            <div className="no-print fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                <button
                  onClick={() => setSingleCardPreviewStudent(null)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Pratinjau HD Kartu Tanda Murid</h3>
                  <p className="text-xs text-slate-500">Standar ID Card CR80 (85.6 x 54 mm) • Resolusi Tinggi</p>

                  {/* Side Switcher in Modal */}
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 mt-2 text-xs font-bold">
                    <button
                      onClick={() => setPreviewSideModal('front')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        previewSideModal === 'front' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tampak Depan
                    </button>
                    <button
                      onClick={() => setPreviewSideModal('back')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        previewSideModal === 'back' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tampak Belakang
                    </button>
                  </div>
                </div>

                {/* Card Container Preview HD */}
                {previewSideModal === 'front' ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white shadow-2xl space-y-4 border-2 border-red-600/50 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                      <div className="flex items-center gap-2">
                        {config.logoKiriUrl ? (
                          <img src={config.logoKiriUrl} alt="Logo" className="w-8 h-8 object-contain bg-white/10 rounded-full p-0.5" />
                        ) : (
                          <GraduationCap className="w-8 h-8 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-100">
                            SEKOLAH RAKYAT TERINTEGRASI
                          </h4>
                          <p className="text-[9px] text-red-300 font-bold uppercase">KEMENTERIAN SOSIAL REPUBLIK INDONESIA</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 bg-red-600 text-white rounded uppercase shadow">
                        OFFICIAL CARD
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl shadow-lg flex-shrink-0 text-center border border-white/30">
                        {qrCodeDataUrls[singleCardPreviewStudent.id] && (
                          <img
                            src={qrCodeDataUrls[singleCardPreviewStudent.id]}
                            alt="QR"
                            className="w-24 h-24 object-contain"
                          />
                        )}
                        <span className="text-[9px] font-mono font-black text-slate-900 block mt-1">
                          {singleCardPreviewStudent.id}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">NAMA MURID:</span>
                          <h3 className="font-extrabold text-base text-white leading-tight uppercase">{singleCardPreviewStudent.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">JENJANG/KELAS:</span>
                            <span className="font-extrabold text-red-300">{singleCardPreviewStudent.class}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">ASRAMA:</span>
                            <span className="font-bold text-slate-200">{singleCardPreviewStudent.dorm}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">WALI ASUH:</span>
                          <span className="font-medium text-slate-300 text-[10px]">{singleCardPreviewStudent.caretaker || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-[9px] text-slate-300">
                      <span>Gedung Asrama Terpadu Palembang</span>
                      <span className="font-semibold text-red-300">TA 2025/2026</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-3 border-2 border-slate-900 relative">
                    <div className="text-center border-b-2 border-slate-900 pb-2">
                      <h4 className="font-extrabold text-xs uppercase text-slate-900">
                        KETENTUAN & TATA TERTIB KEASRAMAAN
                      </h4>
                      <p className="text-[9px] font-bold text-red-700 uppercase">SEKOLAH RAKYAT KEMENSOS RI</p>
                    </div>

                    <ol className="list-decimal list-inside text-[10px] space-y-1 font-medium text-slate-800 leading-tight">
                      <li>Wajib membawa kartu ini pada setiap ibadah sholat 5 waktu berjamaah.</li>
                      <li>Kartu ini merupakan tanda pengenal resmi akses lingkungan asrama.</li>
                      <li>Apabila kartu hilang/rusak, wajib segera lapor ke Wali Asuh.</li>
                    </ol>

                    <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
                      <div className="text-[8px] space-y-0.5">
                        <p className="font-bold">Palembang, 2026</p>
                        <p className="font-bold text-slate-700">Kepala Pengasuh Asrama,</p>
                        <div className="h-6" />
                        <p className="font-extrabold underline text-slate-900">Tim Pengasuhan SR</p>
                      </div>

                      <div className="text-center bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                        {qrCodeDataUrls[singleCardPreviewStudent.id] && (
                          <img
                            src={qrCodeDataUrls[singleCardPreviewStudent.id]}
                            alt="QR"
                            className="w-12 h-12 object-contain"
                          />
                        )}
                        <span className="text-[7px] font-mono font-bold text-slate-800 block">
                          NISN: {singleCardPreviewStudent.id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={qrCodeDataUrls[singleCardPreviewStudent.id]}
                    download={`QR_Code_HD_${singleCardPreviewStudent.id}_${singleCardPreviewStudent.name}.png`}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Unduh QR HD PNG
                  </a>
                  <button
                    onClick={() => {
                      setSelectedStudentIdsForCards([singleCardPreviewStudent.id]);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Kartu Ini
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BATCH PRINT CARD LAYOUT (Print stylesheet targets this section with HD CR80 dimensions) */}
          <div className="hidden print:block print-cards-container space-y-6">
            <div className="text-center pb-3 border-b-2 border-slate-900 mb-4">
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                KARTU TANDA MURID OFFICIAL - SEKOLAH RAKYAT
              </h1>
              <p className="text-xs text-slate-700 font-bold">
                Kartu Absensi Sholat & Keasramaan Berbasis QR Code Scanner HD (CR80: 85.6 x 54 mm) • Total:{' '}
                {(selectedStudentIdsForCards.length > 0
                  ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                  : filteredStudentsForCards).length}{' '}
                Kartu
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(selectedStudentIdsForCards.length > 0
                ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                : filteredStudentsForCards
              ).map((s) => {
                const qrUrl = qrCodeDataUrls[s.id];

                return (
                  <React.Fragment key={s.id}>
                    {/* FRONT SIDE CARD (TAMPAK DEPAN) */}
                    <div
                      className={`cr80-card-print relative border-2 border-slate-900 rounded-xl p-3 bg-white text-slate-900 flex flex-col justify-between shadow-none page-break-inside-avoid ${
                        showCropMarks ? 'ring-1 ring-slate-400' : ''
                      }`}
                      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          {config.logoKiriUrl ? (
                            <img src={config.logoKiriUrl} alt="Logo" className="w-5 h-5 object-contain" />
                          ) : (
                            <GraduationCap className="w-5 h-5 text-red-700" />
                          )}
                          <div>
                            <h4 className="font-extrabold text-[9px] uppercase text-slate-900 leading-tight">
                              SEKOLAH RAKYAT TERINTEGRASI
                            </h4>
                            <p className="text-[7.5px] font-extrabold text-red-700 uppercase">KEMENTERIAN SOSIAL RI</p>
                          </div>
                        </div>
                        <span className="text-[7px] font-extrabold px-1 py-0.5 border border-slate-900 rounded uppercase">
                          OFFICIAL CARD
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="flex items-center gap-2.5 my-1">
                        <div className="border border-slate-900 p-0.5 rounded text-center flex-shrink-0 bg-white">
                          {qrUrl ? (
                            <img src={qrUrl} alt="QR" className="w-16 h-16 object-contain" />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200" />
                          )}
                          <span className="text-[7px] font-mono font-extrabold text-slate-900 block mt-0.5">{s.id}</span>
                        </div>

                        <div className="space-y-0.5 text-slate-900 flex-1 min-w-0">
                          <div>
                            <span className="text-[7px] text-slate-500 block font-bold leading-none">NAMA MURID:</span>
                            <h3 className="font-extrabold text-[11px] leading-tight uppercase truncate">{s.name}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[9px]">
                            <div>
                              <span className="text-[7px] text-slate-500 block font-bold leading-none">KELAS:</span>
                              <span className="font-extrabold text-red-700">{s.class}</span>
                            </div>
                            <div>
                              <span className="text-[7px] text-slate-500 block font-bold leading-none">ASRAMA:</span>
                              <span className="font-bold truncate block">{s.dorm}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[7px] text-slate-500 block font-bold leading-none">WALI ASUH:</span>
                            <span className="font-bold text-[8px] text-slate-800 truncate block">{s.caretaker || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[7px] text-slate-600 font-bold">
                        <span>Asrama Terpadu Palembang</span>
                        <span className="font-mono">NISN: {s.id}</span>
                      </div>
                    </div>

                    {/* BACK SIDE CARD (TAMPAK BELAKANG) - Optional 2 Sisi */}
                    {cardPrintSide === 'both' && (
                      <div
                        className={`cr80-card-print relative border-2 border-slate-900 rounded-xl p-3 bg-white text-slate-900 flex flex-col justify-between shadow-none page-break-inside-avoid ${
                          showCropMarks ? 'ring-1 ring-slate-400' : ''
                        }`}
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <div className="text-center border-b border-slate-900 pb-1">
                          <h4 className="font-extrabold text-[8.5px] uppercase text-slate-900">
                            KETENTUAN & TATA TERTIB KEASRAMAAN
                          </h4>
                          <p className="text-[7px] font-bold text-red-700 uppercase">SEKOLAH RAKYAT KEMENSOS RI</p>
                        </div>

                        <ol className="list-decimal list-inside text-[7.5px] space-y-0.5 font-semibold text-slate-800 leading-tight">
                          <li>Wajib membawa kartu ini saat presensi sholat 5 waktu berjamaah.</li>
                          <li>Tanda pengenal resmi akses fasilitas & lingkungan asrama.</li>
                          <li>Apabila kartu hilang/rusak, segera lapor ke Wali Asuh.</li>
                        </ol>

                        <div className="pt-1 border-t border-slate-300 flex items-center justify-between">
                          <div className="text-[7px] space-y-0.5">
                            <p className="font-bold">Palembang, 2026</p>
                            <p className="font-bold text-slate-700">Kepala Pengasuh Asrama,</p>
                            <div className="h-3" />
                            <p className="font-extrabold underline text-slate-900">Tim Pengasuhan SR</p>
                          </div>

                          <div className="text-center bg-slate-50 p-1 rounded border border-slate-300">
                            {qrUrl && <img src={qrUrl} alt="QR" className="w-10 h-10 object-contain" />}
                            <span className="text-[6.5px] font-mono font-bold text-slate-800 block">
                              NISN: {s.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REKAPITULASI & LAPORAN ABSENSI SHOLAT */}
      {activeSubTab === 'recap' && (
        <div className="no-print space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-red-600" /> Rekapitulasi & Laporan Kehadiran Sholat
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tinjau rekam jejak presensi sholat seluruh murid, filter berdasarkan tanggal/waktu, dan unduh laporan PDF resmi.
                </p>
              </div>

              <button
                onClick={handleExportRecapPDF}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Unduh Laporan PDF Resmi Kop Sekolah
              </button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Filter Tanggal:</label>
                <input
                  type="date"
                  value={recapDateFilter}
                  onChange={(e) => setRecapDateFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Filter Sholat:</label>
                <select
                  value={recapPrayerFilter}
                  onChange={(e) => setRecapPrayerFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Semua">Semua Waktu Sholat</option>
                  <option value="Subuh">Subuh</option>
                  <option value="Dzuhur">Dzuhur</option>
                  <option value="Ashar">Ashar</option>
                  <option value="Maghrib">Maghrib</option>
                  <option value="Isya">Isya</option>
                  <option value="Kajian / Kegiatan">Kajian / Kegiatan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Filter Jenjang / Kelas:</label>
                <select
                  value={recapClassFilter}
                  onChange={(e) => setRecapClassFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Semua">Semua Jenjang</option>
                  <option value="SD">Jenjang SD</option>
                  <option value="SMP">Jenjang SMP</option>
                  <option value="SMA">Jenjang SMA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cari Nama / NISN:</label>
                <input
                  type="text"
                  value={recapSearch}
                  onChange={(e) => setRecapSearch(e.target.value)}
                  placeholder="Ketik nama atau NISN..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          {/* Recap Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Menampilkan {filteredRecapRecords.length} Catatan Presensi Sholat
              </span>
              <span className="text-slate-500 font-medium">
                Sistem Terhubung dengan LocalStorage & Cloud Sync
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center">No</th>
                    <th className="p-3.5">Tanggal & Waktu</th>
                    <th className="p-3.5">NISN / ID</th>
                    <th className="p-3.5">Nama Murid</th>
                    <th className="p-3.5">Kelas / Asrama</th>
                    <th className="p-3.5">Sholat</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Petugas Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecapRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        Tidak ada data presensi yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRecapRecords.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-all">
                        <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-medium">
                          <div>{r.date}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.timestamp}</div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{r.studentId}</td>
                        <td className="p-3.5 font-bold text-slate-900">{r.studentName}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-red-700">{r.class}</span> • {r.dorm}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">🕌 {r.prayerTime}</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              r.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : r.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : r.status === 'Izin Sakit' || r.status === 'Izin Pulang'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{r.scannedBy || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
