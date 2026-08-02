import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
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
  FileSpreadsheet
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

  // QR Scanner Instance State
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // QR Card States
  const [cardSearch, setCardSearch] = useState<string>('');
  const [cardClassFilter, setCardClassFilter] = useState<string>('');
  const [selectedStudentIdsForCards, setSelectedStudentIdsForCards] = useState<string[]>([]);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [singleCardPreviewStudent, setSingleCardPreviewStudent] = useState<Student | null>(null);

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

  // Generate QR Code data URL for each student
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const s of students) {
        try {
          // Payload contains clean student ID or JSON
          const qrPayload = s.id;
          const url = await QRCode.toDataURL(qrPayload, {
            width: 300,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          urls[s.id] = url;
        } catch (err) {
          console.error('Gagal generate QR untuk student', s.id, err);
        }
      }
      setQrCodeDataUrls(urls);
    };
    if (students.length > 0) {
      generateAllQrs();
    }
  }, [students]);

  // Process a Scanned Student ID
  const handleProcessScan = (rawScannedCode: string) => {
    const cleanId = rawScannedCode.trim().toUpperCase();
    if (!cleanId) return;

    // Find student by ID or exact Name match
    const foundStudent = students.find(
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
    const onLeave = leaves.some(
      (l) =>
        l.status === 'Active' &&
        (String(l.studentId).trim().toLowerCase() === String(foundStudent.id).trim().toLowerCase() ||
          String(l.studentName).trim().toLowerCase() === String(foundStudent.name).trim().toLowerCase())
    );

    // Check if student currently in UKS / sick
    const inUks = medicalRecords.some(
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
    const existingIndex = prayerAttendance.findIndex(
      (p) =>
        p.date === selectedDate &&
        p.prayerTime === selectedPrayerTime &&
        String(p.studentId).trim().toLowerCase() === String(foundStudent.id).trim().toLowerCase()
    );

    let updatedList = [...prayerAttendance];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        timestamp: nowTime,
        status: defaultStatus,
        scannedBy: officerName
      };
      statusMessage += ' (Data diperbarui)';
    } else {
      const newRecord: PrayerAttendance = {
        id: `PA-${Date.now().toString().slice(-6)}`,
        studentId: foundStudent.id,
        studentName: foundStudent.name,
        class: foundStudent.class,
        dorm: foundStudent.dorm,
        prayerTime: selectedPrayerTime,
        date: selectedDate,
        timestamp: nowTime,
        status: defaultStatus,
        scannedBy: officerName
      };
      updatedList = [newRecord, ...updatedList];
    }

    onSavePrayerAttendance(updatedList);
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

  // Start HTML5 QR Code Scanner
  useEffect(() => {
    if (activeSubTab === 'scanner' && isScannerActive) {
      const timer = setTimeout(() => {
        try {
          if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
              'qr-reader-element',
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
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
  }, [activeSubTab, isScannerActive, selectedDate, selectedPrayerTime, officerName]);

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

  // Stats calculation for today's selected session
  const todaySessionRecords = useMemo(() => {
    return prayerAttendance.filter(
      (p) => p.date === selectedDate && p.prayerTime === selectedPrayerTime
    );
  }, [prayerAttendance, selectedDate, selectedPrayerTime]);

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
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-600" /> Webcam / Camera QR Scanner
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

            {/* Right Column: Live Scanned List for selected session */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" /> Log Hadir Live ({selectedPrayerTime} • {selectedDate})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daftar murid yang telah terdata pada sesi sholat ini ({todaySessionRecords.length} terdata).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-full text-[11px] border border-red-200">
                    {todaySessionRecords.length} / {students.length} Murid
                  </span>
                </div>

                {/* Scanned Items Feed Table */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {todaySessionRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <QrCode className="w-10 h-10 mx-auto opacity-30 text-slate-500" />
                      <p className="text-xs font-medium">Belum ada data scan untuk sholat {selectedPrayerTime} hari ini.</p>
                      <p className="text-[11px] text-slate-400">Silakan scan QR code kartu murid atau gunakan input manual.</p>
                    </div>
                  ) : (
                    todaySessionRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
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
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">{rec.studentName}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">
                              NISN: {rec.studentId} • Kelas {rec.class} ({rec.dorm})
                            </p>
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              rec.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : rec.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : rec.status === 'Izin Pulang' || rec.status === 'Izin Sakit'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">{rec.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Catatan: Presensi disimpan otomatis ke penyimpanan lokal.</span>
                <button
                  onClick={() => setActiveSubTab('recap')}
                  className="text-red-600 hover:underline font-bold flex items-center gap-1"
                >
                  Lihat Semua Laporan Rekap &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OFFICIAL STUDENT QR CODE CARD GENERATOR */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-red-600" /> Generator & Cetak Kartu Tanda Murid Official
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih murid yang ingin dicetakkan kartu ber-QR Code untuk absensi sholat & kegiatan keasramaan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={toggleSelectAllCards}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200"
                >
                  {selectedStudentIdsForCards.length === filteredStudentsForCards.length && filteredStudentsForCards.length > 0
                    ? 'Batal Pilih Semua'
                    : `Pilih Semua (${filteredStudentsForCards.length})`}
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={selectedStudentIdsForCards.length === 0}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Cetak Batch Kartu Terpilih ({selectedStudentIdsForCards.length})
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  placeholder="Cari nama, NISN, atau gedung asrama..."
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

              <div className="flex items-center text-slate-500 text-xs font-semibold">
                <span>Terpilih: {selectedStudentIdsForCards.length} dari {students.length} Murid</span>
              </div>
            </div>
          </div>

          {/* Cards Grid Display (Screen View) */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudentsForCards.map((s) => {
              const isSelected = selectedStudentIdsForCards.includes(s.id);
              const qrUrl = qrCodeDataUrls[s.id];

              return (
                <div
                  key={s.id}
                  onClick={() => toggleSelectCard(s.id)}
                  className={`relative cursor-pointer rounded-2xl border transition-all overflow-hidden p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white shadow-md hover:shadow-xl ${
                    isSelected ? 'ring-4 ring-red-500 border-red-500 scale-[1.01]' : 'border-slate-700 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-white/20 text-transparent border border-white/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 mb-3 pr-8">
                    {config.logoKiriUrl ? (
                      <img src={config.logoKiriUrl} alt="Logo" className="w-7 h-7 object-contain bg-white/10 rounded-full p-0.5" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100 leading-tight">
                        KARTU TANDA MURID
                      </h4>
                      <p className="text-[9px] text-red-300 font-semibold uppercase">SEKOLAH RAKYAT KEMENSOS RI</p>
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

                    {/* QR Code Container */}
                    <div className="bg-white p-1.5 rounded-xl shadow-lg border border-white/20 flex-shrink-0 text-center">
                      {qrUrl ? (
                        <img src={qrUrl} alt={`QR-${s.id}`} className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 animate-pulse rounded" />
                      )}
                      <span className="text-[8px] font-mono font-black text-slate-800 block mt-0.5">{s.id}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Asrama Terpadu Palembang</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSingleCardPreviewStudent(s);
                      }}
                      className="text-red-300 hover:text-white font-bold underline"
                    >
                      Pratinjau / Single Print &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Single Card Modal Preview */}
          {singleCardPreviewStudent && (
            <div className="no-print fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
                <button
                  onClick={() => setSingleCardPreviewStudent(null)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Pratinjau Kartu Tanda Murid</h3>
                  <p className="text-xs text-slate-500">Kartu Resmi Absensi Sholat & Keasramaan</p>
                </div>

                {/* Card Container Preview */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white shadow-xl space-y-4 border-2 border-red-600/40">
                  <div className="flex items-center justify-between border-b border-white/20 pb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-7 h-7 text-red-500" />
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-100">
                          SEKOLAH RAKYAT TERINTEGRASI
                        </h4>
                        <p className="text-[9px] text-red-300 font-semibold uppercase">KEMENTERIAN SOSIAL REPUBLIK INDONESIA</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-red-600 text-white rounded">
                      TA 2025/2026
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-md flex-shrink-0 text-center">
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
                        <span className="text-[10px] text-slate-400 block font-semibold">NAMA LENGKAP:</span>
                        <h3 className="font-extrabold text-base text-white">{singleCardPreviewStudent.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">JENJANG:</span>
                          <span className="font-bold text-red-300">{singleCardPreviewStudent.class}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">ASRAMA:</span>
                          <span className="font-bold text-slate-200">{singleCardPreviewStudent.dorm}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold">WALI ASUH:</span>
                        <span className="font-medium text-slate-300 text-[10px]">{singleCardPreviewStudent.caretaker}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                    <span>Scan QR code ini pada petugas sholat asrama</span>
                    <span>Validasi Official SR</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={qrCodeDataUrls[singleCardPreviewStudent.id]}
                    download={`QR_Code_${singleCardPreviewStudent.id}_${singleCardPreviewStudent.name}.png`}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Unduh QR PNG
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

          {/* BATCH PRINT CARD LAYOUT (Print stylesheet targets this section) */}
          <div className="hidden print:block print-cards-container space-y-6">
            <div className="text-center pb-3 border-b border-slate-900 mb-4">
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                KARTU TANDA MURID OFFICIAL - SEKOLAH RAKYAT
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Kartu Absensi Sholat & Keasramaan Berbasis QR Code Scanner
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(selectedStudentIdsForCards.length > 0
                ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                : filteredStudentsForCards
              ).map((s) => (
                <div
                  key={s.id}
                  className="border-2 border-slate-900 rounded-2xl p-4 bg-white text-slate-900 space-y-3 shadow-none page-break-inside-avoid"
                  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                >
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-red-700" />
                      <div>
                        <h4 className="font-extrabold text-[10px] uppercase text-slate-900 leading-tight">
                          SEKOLAH RAKYAT TERINTEGRASI
                        </h4>
                        <p className="text-[8px] font-bold text-red-700 uppercase">KEMENTERIAN SOSIAL RI</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 border border-slate-900 rounded">
                      OFFICIAL CARD
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="border border-slate-400 p-1 rounded-lg text-center flex-shrink-0">
                      {qrCodeDataUrls[s.id] && (
                        <img src={qrCodeDataUrls[s.id]} alt="QR" className="w-20 h-20 object-contain" />
                      )}
                      <span className="text-[8px] font-mono font-black text-slate-900 block mt-0.5">{s.id}</span>
                    </div>

                    <div className="space-y-1 text-slate-900">
                      <div>
                        <span className="text-[8px] text-slate-500 block font-bold">NAMA MURID:</span>
                        <h3 className="font-extrabold text-sm leading-tight uppercase">{s.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-500 block font-bold">KELAS:</span>
                          <span className="font-extrabold text-red-700">{s.class}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 block font-bold">ASRAMA:</span>
                          <span className="font-bold">{s.dorm}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500">
                    <span>Gedung Asrama Terpadu Palembang</span>
                    <span>NISN: {s.id}</span>
                  </div>
                </div>
              ))}
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
