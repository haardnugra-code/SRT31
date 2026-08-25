import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  Student,
  PrayerAttendance,
  Leave,
  MedicalRecord,
  DailyJournal,
  AppConfig
} from '../types';
import { ChecklistTab } from './ChecklistTab';
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
  ListFilter,
  Cpu,
  Radio,
  HardDrive,
  Terminal,
  Settings,
  Plug,
  Unplug,
  Copy,
  Code2,
  Laptop,
  Usb,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Bookmark,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateAllStudentCardsPDF, generateStudentCardSheetA4PDF, generatePrayerAttendanceReportPDF } from '../services/pdfGenerator';
import { downloadStudentCardPNG, downloadMultipleCardsPNG } from '../services/pngGenerator';

export interface AttendanceSessionItem {
  id: string;
  name: string;
  category: 'Sholat' | 'Makan' | 'Kegiatan';
  icon: string;
  badgeBg: string;
  badgeText: string;
  defaultTimeRange: string;
}

export const ATTENDANCE_SESSIONS: AttendanceSessionItem[] = [
  // Sesi Sholat Berjamaah
  { id: 'Subuh', name: 'Sholat Subuh', category: 'Sholat', icon: '🕌', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700', defaultTimeRange: '04:30 - 05:45' },
  { id: 'Dhuha', name: 'Sholat Dhuha', category: 'Sholat', icon: '☀️', badgeBg: 'bg-amber-50 border-amber-200', badgeText: 'text-amber-700', defaultTimeRange: '07:00 - 08:30' },
  { id: 'Dzuhur', name: 'Sholat Dzuhur', category: 'Sholat', icon: '🕌', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700', defaultTimeRange: '12:00 - 13:15' },
  { id: 'Ashar', name: 'Sholat Ashar', category: 'Sholat', icon: '🕌', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700', defaultTimeRange: '15:15 - 16:30' },
  { id: 'Maghrib', name: 'Sholat Maghrib', category: 'Sholat', icon: '🕌', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700', defaultTimeRange: '18:00 - 19:15' },
  { id: 'Isya', name: 'Sholat Isya', category: 'Sholat', icon: '🕌', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700', defaultTimeRange: '19:15 - 20:30' },
  { id: 'Tahajjud / Qiyamul Lail', name: 'Tahajjud / Qiyamul Lail', category: 'Sholat', icon: '🌙', badgeBg: 'bg-indigo-50 border-indigo-200', badgeText: 'text-indigo-700', defaultTimeRange: '03:15 - 04:30' },

  // Sesi Makan (Ruang Makan & Dapur Asrama)
  { id: 'Sarapan Pagi', name: 'Makan Pagi (Sarapan)', category: 'Makan', icon: '🍳', badgeBg: 'bg-orange-50 border-orange-200', badgeText: 'text-orange-700', defaultTimeRange: '06:00 - 07:15' },
  { id: 'Makan Siang', name: 'Makan Siang', category: 'Makan', icon: '🍱', badgeBg: 'bg-amber-50 border-amber-200', badgeText: 'text-amber-800', defaultTimeRange: '12:30 - 13:45' },
  { id: 'Makan Malam', name: 'Makan Malam', category: 'Makan', icon: '🍲', badgeBg: 'bg-red-50 border-red-200', badgeText: 'text-red-700', defaultTimeRange: '18:30 - 20:00' },
  { id: 'Sahur', name: 'Makan Sahur (Puasa)', category: 'Makan', icon: '🥣', badgeBg: 'bg-purple-50 border-purple-200', badgeText: 'text-purple-700', defaultTimeRange: '03:30 - 04:30' },
  { id: 'Buka Puasa', name: 'Buka Puasa / Ta\'jil', category: 'Makan', icon: '🌴', badgeBg: 'bg-amber-50 border-amber-200', badgeText: 'text-amber-700', defaultTimeRange: '18:00 - 18:45' },
  { id: 'Snack / Ekstra Gizi', name: 'Snack Sore / Ekstra Nutrisi', category: 'Makan', icon: '🥛', badgeBg: 'bg-sky-50 border-sky-200', badgeText: 'text-sky-700', defaultTimeRange: '16:30 - 17:15' },

  // Sesi Kegiatan Asrama
  { id: 'Kajian / Kegiatan', name: 'Kajian / Halaqah Qur\'an', category: 'Kegiatan', icon: '📖', badgeBg: 'bg-blue-50 border-blue-200', badgeText: 'text-blue-700', defaultTimeRange: '19:45 - 20:45' },
  { id: 'Apel / Baris Asrama', name: 'Apel Pagi / Malam Asrama', category: 'Kegiatan', icon: '📢', badgeBg: 'bg-slate-100 border-slate-300', badgeText: 'text-slate-700', defaultTimeRange: '06:30 / 21:00' },
  { id: 'Kebersihan / Ro\'an', name: 'Kerja Bakti / Ro\'an Asrama', category: 'Kegiatan', icon: '🧹', badgeBg: 'bg-teal-50 border-teal-200', badgeText: 'text-teal-700', defaultTimeRange: '08:00 - 10:00' },
];

export const getSessionDef = (sessionId: string): AttendanceSessionItem => {
  const found = ATTENDANCE_SESSIONS.find((s) => s.id === sessionId || s.name === sessionId);
  if (found) return found;
  if (
    sessionId.toLowerCase().includes('makan') ||
    sessionId.toLowerCase().includes('sarapan') ||
    sessionId.toLowerCase().includes('sahur') ||
    sessionId.toLowerCase().includes('puasa') ||
    sessionId.toLowerCase().includes('snack')
  ) {
    return {
      id: sessionId,
      name: sessionId,
      category: 'Makan',
      icon: '🍽️',
      badgeBg: 'bg-orange-50 border-orange-200',
      badgeText: 'text-orange-700',
      defaultTimeRange: '-'
    };
  }
  if (
    sessionId.toLowerCase().includes('sholat') ||
    sessionId.toLowerCase().includes('subuh') ||
    sessionId.toLowerCase().includes('dzuhur') ||
    sessionId.toLowerCase().includes('ashar') ||
    sessionId.toLowerCase().includes('maghrib') ||
    sessionId.toLowerCase().includes('isya') ||
    sessionId.toLowerCase().includes('tahajjud') ||
    sessionId.toLowerCase().includes('dhuha')
  ) {
    return {
      id: sessionId,
      name: sessionId,
      category: 'Sholat',
      icon: '🕌',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
      defaultTimeRange: '-'
    };
  }
  return {
    id: sessionId,
    name: sessionId,
    category: 'Kegiatan',
    icon: '📋',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    defaultTimeRange: '-'
  };
};

export const getSuggestedSession = (): string => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const timeNum = hour + minute / 60;

  if (timeNum >= 3.0 && timeNum < 4.5) return 'Sahur';
  if (timeNum >= 4.5 && timeNum < 6.0) return 'Subuh';
  if (timeNum >= 6.0 && timeNum < 7.5) return 'Sarapan Pagi';
  if (timeNum >= 7.5 && timeNum < 11.5) return 'Dhuha';
  if (timeNum >= 11.5 && timeNum < 12.75) return 'Dzuhur';
  if (timeNum >= 12.75 && timeNum < 14.5) return 'Makan Siang';
  if (timeNum >= 14.5 && timeNum < 17.0) return 'Ashar';
  if (timeNum >= 17.0 && timeNum < 18.5) return 'Maghrib';
  if (timeNum >= 18.5 && timeNum < 19.75) return 'Makan Malam';
  if (timeNum >= 19.75 && timeNum < 21.5) return 'Isya';
  return 'Isya';
};

interface PrayerAttendanceTabProps {
  students: Student[];
  prayerAttendance: PrayerAttendance[];
  onSavePrayerAttendance: (records: PrayerAttendance[]) => void;
  dailyJournals?: DailyJournal[];
  onSaveJournal?: (journal: DailyJournal) => void;
  onDeleteJournal?: (id: string) => void;
  leaves: Leave[];
  medicalRecords: MedicalRecord[];
  config: AppConfig;
  initialSubTab?: 'scanner' | 'cards' | 'checklist' | 'recap';
  onShowToast?: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onAskConfirm?: (title: string, message: string) => Promise<boolean>;
}

interface StudentQRCodeProps {
  student: Student;
  payloadFormat?: 'id' | 'json';
  existingUrl?: string;
  className?: string;
  size?: number;
}

const StudentQRCode: React.FC<StudentQRCodeProps> = ({
  student,
  payloadFormat = 'id',
  existingUrl,
  className = 'w-16 h-16 object-contain',
  size = 400
}) => {
  const [dataUrl, setDataUrl] = useState<string>(existingUrl || '');

  useEffect(() => {
    if (existingUrl) {
      setDataUrl(existingUrl);
      return;
    }

    let isMounted = true;
    const studentKey = String(student?.id || '').trim();
    if (!studentKey) return;

    const qrPayload =
      payloadFormat === 'json'
        ? JSON.stringify({ id: studentKey, name: student.name, class: student.class, dorm: student.dorm })
        : studentKey;

    QRCode.toDataURL(qrPayload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Gagal generate QR Code untuk student', student?.id, err);
      });

    return () => {
      isMounted = false;
    };
  }, [student, payloadFormat, existingUrl, size]);

  if (!dataUrl) {
    return (
      <div className={`bg-slate-200 animate-pulse rounded flex items-center justify-center text-[8px] font-mono text-slate-500 ${className}`}>
        QR...
      </div>
    );
  }

  return <img src={dataUrl} alt={`QR-${student?.id || ''}`} className={className} />;
};

interface StudentCardFrontProps {
  student: Student;
  config: AppConfig;
  qrPayloadFormat?: 'id' | 'json';
  qrUrl?: string;
  theme?: 'dark' | 'light';
  isPrint?: boolean;
  showCropMarks?: boolean;
}

const StudentCardFront: React.FC<StudentCardFrontProps> = ({
  student,
  config,
  qrPayloadFormat = 'id',
  qrUrl,
  theme = 'dark',
  isPrint = false,
  showCropMarks = false
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none box-border ${
        isPrint
          ? `cr80-card-print p-[2.5mm] ${
              isDark
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-900 border border-slate-300'
            } ${showCropMarks ? 'ring-1 ring-slate-400' : ''}`
          : `w-full aspect-[85.6/54] p-3 ${
              isDark
                ? 'bg-slate-900 text-white rounded-2xl shadow-xl'
                : 'bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-md'
            }`
      }`}
      style={isPrint ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : undefined}
    >
      {/* Card Header Simple Banner */}
      <div className="flex items-center justify-between pb-1 mb-1 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {config.logoKiriUrl ? (
            <img
              src={config.logoKiriUrl}
              alt="Logo"
              className="w-5 h-5 object-contain flex-shrink-0"
            />
          ) : (
            <GraduationCap className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
          )}
          <div className="min-w-0 leading-tight">
            <h4
              className={`font-black text-[7.5px] uppercase tracking-wider truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              KEMENTERIAN SOSIAL RI
            </h4>
            <p className={`text-[6px] font-bold uppercase truncate ${isDark ? 'text-sky-200' : 'text-sky-800'}`}>
              PUSAT PENDIDIKAN & PELATIHAN PROFESI
            </p>
            <p className={`text-[6.5px] font-extrabold uppercase truncate ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              SEKOLAH RAKYAT TERINTEGRASI 31
            </p>
          </div>
        </div>
        <span
          className={`text-[6px] font-extrabold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
            isDark ? 'bg-sky-900/60 text-sky-300' : 'bg-slate-100 text-slate-900'
          }`}
        >
          KARTU SISWA
        </span>
      </div>

      {/* Card Body */}
      <div className="flex items-center gap-2.5 my-auto relative z-10">
        <div className="p-1 rounded-xl text-center flex-shrink-0 bg-white shadow-xs">
          <StudentQRCode
            student={student}
            payloadFormat={qrPayloadFormat}
            existingUrl={qrUrl}
            className="w-13 h-13 object-contain"
            size={400}
          />
          <span className="text-[6.5px] font-mono font-black text-slate-900 block mt-0.5 leading-none">{student.id}</span>
        </div>

        <div className="space-y-0.5 flex-1 min-w-0">
          <div>
            <span
              className={`text-[6px] block font-bold leading-none uppercase ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              NAMA MURID:
            </span>
            <h3
              className={`font-extrabold text-[10.5px] leading-tight uppercase truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {student.name}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[8px]">
            <div>
              <span
                className={`text-[6px] block font-bold leading-none uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                KELAS:
              </span>
              <span className={`font-extrabold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{student.class}</span>
            </div>
            <div>
              <span
                className={`text-[6px] block font-bold leading-none uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                ASRAMA:
              </span>
              <span className={`font-bold truncate block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                {student.dorm || 'Asrama'}
              </span>
            </div>
          </div>
          <div>
            <span
              className={`text-[6px] block font-bold leading-none uppercase ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              WALI ASUH:
            </span>
            <span
              className={`font-medium text-[7px] truncate block ${
                isDark ? 'text-slate-300' : 'text-slate-800 font-bold'
              }`}
            >
              {student.caretaker || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div
        className={`pt-1 flex items-center justify-between text-[6.5px] font-medium relative z-10 ${
          isDark ? 'text-slate-400' : 'text-slate-600 font-bold'
        }`}
      >
        <span className="truncate">Sekolah Rakyat Terintegrasi 31 Palembang</span>
        <span className={`font-mono flex-shrink-0 ${isDark ? 'text-sky-300 font-bold' : ''}`}>ID: {student.id}</span>
      </div>
    </div>
  );
};

interface StudentCardBackProps {
  student: Student;
  qrPayloadFormat?: 'id' | 'json';
  qrUrl?: string;
  isPrint?: boolean;
  showCropMarks?: boolean;
}

const StudentCardBack: React.FC<StudentCardBackProps> = ({
  student,
  qrPayloadFormat = 'id',
  qrUrl,
  isPrint = false,
  showCropMarks = false
}) => {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none box-border ${
        isPrint
          ? `cr80-card-print p-[2.5mm] bg-white text-slate-900 border-2 border-slate-900 rounded-[3.18mm] ${
              showCropMarks ? 'ring-1 ring-slate-400' : ''
            }`
          : 'w-full aspect-[85.6/54] p-3 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl shadow-md'
      }`}
      style={isPrint ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : undefined}
    >
      <div className="text-center border-b border-slate-900 pb-1">
        <h4 className="font-extrabold text-[8.5px] uppercase text-slate-900 leading-tight">
          KETENTUAN & TATA TERTIB KEASRAMAAN
        </h4>
        <p className="text-[7px] font-bold text-red-700 uppercase">SEKOLAH RAKYAT KEMENSOS RI</p>
      </div>

      <ol className="list-decimal list-inside text-[7.5px] space-y-0.5 font-semibold text-slate-800 leading-tight my-auto">
        <li>Wajib membawa kartu ini saat presensi sholat 5 waktu berjamaah.</li>
        <li>Tanda pengenal resmi akses fasilitas & lingkungan asrama.</li>
        <li>Apabila kartu hilang/rusak, segera lapor ke Wali Asuh.</li>
      </ol>

      <div className="pt-1 border-t border-slate-300 flex items-center justify-between">
        <div className="text-[7px] space-y-0.5">
          <p className="font-bold">Palembang, 2026</p>
          <p className="font-bold text-slate-700">Kepala Wali Asuh,</p>
          <div className="h-2.5" />
          <p className="font-extrabold underline text-slate-900">Tim Wali Asuh SR</p>
        </div>

        <div className="text-center bg-slate-50 p-1 rounded border border-slate-300">
          <StudentQRCode
            student={student}
            payloadFormat={qrPayloadFormat}
            existingUrl={qrUrl}
            className="w-10 h-10 object-contain"
            size={300}
          />
          <span className="text-[6.5px] font-mono font-bold text-slate-800 block">NISN: {student.id}</span>
        </div>
      </div>
    </div>
  );
};

export const PrayerAttendanceTab: React.FC<PrayerAttendanceTabProps> = ({
  students,
  prayerAttendance,
  onSavePrayerAttendance,
  dailyJournals = [],
  onSaveJournal,
  onDeleteJournal,
  leaves,
  medicalRecords,
  config,
  initialSubTab = 'scanner',
  onShowToast,
  onAskConfirm
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'cards' | 'checklist' | 'recap'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Attendance Form & Scanner States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPrayerTime, setSelectedPrayerTime] = useState<string>(getSuggestedSession());
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState<'Semua' | 'Sholat' | 'Makan' | 'Kegiatan'>('Semua');
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

  // Arduino & Web Serial RFID Scanner Hardware States
  const [isArduinoModalOpen, setIsArduinoModalOpen] = useState<boolean>(false);
  const [arduinoCodeTab, setArduinoCodeTab] = useState<'serial' | 'hid'>('serial');
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);
  const [serialPort, setSerialPort] = useState<any>(null);
  const [serialReader, setSerialReader] = useState<any>(null);
  const [serialBaudRate, setSerialBaudRate] = useState<number>(115200);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [copiedCodeToast, setCopiedCodeToast] = useState<boolean>(false);

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
  const [qrPayloadFormat, setQrPayloadFormat] = useState<'id' | 'json'>('id');
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

  // HD Card Print Customization Options
  const [cardDesignTheme, setCardDesignTheme] = useState<'dark' | 'light'>('dark'); // 'dark' = Official Dark Luxury Gradient, 'light' = Clean White Minimalist
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

  // Generate QR Code data URL for each student in parallel
  useEffect(() => {
    let isCancelled = false;
    const generateAllQrs = async () => {
      if (!students || students.length === 0) {
        setQrCodeDataUrls({});
        return;
      }

      try {
        const results = await Promise.all(
          students.map(async (s) => {
            const studentKey = String(s.id).trim();
            const qrPayload =
              qrPayloadFormat === 'json'
                ? JSON.stringify({ id: studentKey, name: s.name, class: s.class, dorm: s.dorm })
                : studentKey;
            try {
              const url = await QRCode.toDataURL(qrPayload, {
                width: 400,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                  dark: '#020617',
                  light: '#ffffff'
                }
              });
              return { id: s.id, key: studentKey, url };
            } catch (err) {
              console.error('Gagal generate QR HD untuk student', s.id, err);
              return { id: s.id, key: studentKey, url: '' };
            }
          })
        );

        if (!isCancelled) {
          const map: Record<string, string> = {};
          for (const res of results) {
            if (res.url) {
              map[res.id] = res.url;
              map[res.key] = res.url;
            }
          }
          setQrCodeDataUrls(map);
        }
      } catch (err) {
        console.error('Error batch generating QR codes:', err);
      }
    };

    generateAllQrs();

    return () => {
      isCancelled = true;
    };
  }, [students, qrPayloadFormat]);

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

  // Web Serial API Connection Handler for Arduino/ESP32 RFID Readers
  const connectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Browser Anda belum mendukung Web Serial API. Silakan gunakan Google Chrome atau Microsoft Edge pada PC/Laptop.');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: serialBaudRate });
      setSerialPort(port);
      setIsSerialConnected(true);
      setSerialLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ✅ Terhubung ke Arduino/ESP32 Serial Port (${serialBaudRate} Baud)`,
        ...prev
      ]);
      readSerialStream(port);
    } catch (err: any) {
      console.error('Serial connect error:', err);
      setSerialLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ❌ Koneksi dibatalkan / gagal: ${err?.message || 'Error'}`,
        ...prev
      ]);
    }
  };

  const disconnectWebSerial = async () => {
    if (serialPort) {
      try {
        if (serialReader) {
          await serialReader.cancel();
        }
        await serialPort.close();
      } catch (err) {
        console.error('Serial close error:', err);
      }
      setSerialPort(null);
      setSerialReader(null);
      setIsSerialConnected(false);
      setSerialLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🔌 Serial Port terputus.`, ...prev]);
    }
  };

  const readSerialStream = async (port: any) => {
    try {
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      setSerialReader(reader);

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              setSerialLogs((prev) => [`[${new Date().toLocaleTimeString()}] 📥 RX: ${trimmed}`, ...prev.slice(0, 49)]);
              const cleanUid = trimmed.replace(/^(RFID:|UID:|CARD:)/i, '').trim();
              if (cleanUid) {
                handleProcessScan(cleanUid);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Serial read stream stopped:', err);
    }
  };

  // Process a Scanned Student ID or RFID Tag UID (Supports Plain ID or JSON Payload)
  const handleProcessScan = (rawScannedCode: string) => {
    let extractedCode = rawScannedCode.trim();
    if (!extractedCode) return;

    // Check if raw scanned code is in JSON format e.g. {"id": "SR0001"}
    if (extractedCode.startsWith('{') && extractedCode.endsWith('}')) {
      try {
        const parsedObj = JSON.parse(extractedCode);
        const jsonId =
          parsedObj.id ||
          parsedObj.studentId ||
          parsedObj.nisn ||
          parsedObj.code ||
          parsedObj.rfidTag ||
          parsedObj.rfid ||
          parsedObj.nis;
        if (jsonId) {
          extractedCode = String(jsonId).trim();
        }
      } catch {
        // Fallback to raw string if JSON parsing fails
      }
    }

    const cleanId = extractedCode.toUpperCase();
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

    // Find student by ID (NISN), RFID Tag UID, or exact Name match
    const foundStudent = currentStudents.find(
      (s) =>
        s.id.trim().toUpperCase() === cleanId ||
        (s.rfidTag && s.rfidTag.trim().toUpperCase() === cleanId) ||
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

  // Export & Save Prayer Attendance Data as JSON File
  const handleExportJSON = (dateOnly = false) => {
    const recordsToSave = dateOnly
      ? prayerAttendance.filter((p) => p.date === selectedDate)
      : prayerAttendance;

    if (recordsToSave.length === 0) {
      alert('Tidak ada data absensi sholat untuk disimpan atau diunduh.');
      return;
    }

    const jsonString = JSON.stringify(recordsToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = dateOnly
      ? `absensi_sholat_${selectedPrayerTime}_${selectedDate}.json`
      : `absensi_sholat_semua_${new Date().toISOString().split('T')[0]}.json`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Prayer Attendance Data from JSON File
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          alert('Format file JSON tidak valid. Isi data harus berupa daftar array rekam absensi sholat.');
          return;
        }

        const validRecords: PrayerAttendance[] = parsed.filter(
          (item: any) => item && item.studentId && item.studentName && item.prayerTime && item.date
        );

        if (validRecords.length === 0) {
          alert('File JSON tidak berisi rekam data absensi sholat yang valid.');
          return;
        }

        // Merge without duplicate IDs
        const existingIds = new Set(prayerAttendance.map((p) => p.id));
        const newRecords = validRecords.filter((r) => !existingIds.has(r.id));

        const combined = [...newRecords, ...prayerAttendance];
        onSavePrayerAttendance(combined);
        alert(`Berhasil mengimpor ${newRecords.length} rekam absensi baru dari file JSON! Total data saat ini: ${combined.length}`);
      } catch (err: any) {
        alert('Gagal mengimpor file JSON: ' + (err?.message || 'Format tidak valid'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Recap PDF with Official School Letterhead (Kop Surat)
  const handleExportRecapPDF = async () => {
    if (onShowToast) {
      onShowToast('Menyiapkan Dokumen', 'Membuat Laporan PDF Resmi dengan Kop Surat & Logo...', 'info');
    }
    try {
      const isAll = recapPrayerFilter === 'Semua';
      const targetSession = isAll ? 'Semua Sesi Presensi' : recapPrayerFilter;
      await generatePrayerAttendanceReportPDF(
        filteredRecapRecords,
        config,
        {
          date: recapDateFilter || new Date().toISOString().split('T')[0],
          prayerTime: targetSession,
          classFilter: recapClassFilter === 'Semua' ? 'Semua Jenjang' : recapClassFilter,
          dormFilter: 'Semua Asrama',
          officerName: officerName || 'Petugas / Pembina Asrama'
        },
        students
      );
      if (onShowToast) {
        onShowToast('Laporan Siap', 'Laporan Presensi Asrama resmi dengan Kop Surat telah diunduh.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast('Gagal', 'Terjadi kesalahan saat memproses laporan PDF.', 'error');
      }
    }
  };

  // Export Current Live Session PDF with Official Letterhead
  const handlePrintCurrentSessionPDF = async () => {
    const sDef = getSessionDef(selectedPrayerTime);
    if (onShowToast) {
      onShowToast('Menyiapkan Dokumen', `Membuat Lembar Presensi ${sDef.name} (${selectedDate}) dengan Kop Surat...`, 'info');
    }
    try {
      await generatePrayerAttendanceReportPDF(
        todaySessionRecords,
        config,
        {
          date: selectedDate,
          prayerTime: selectedPrayerTime,
          classFilter: 'Semua Kelas',
          dormFilter: 'Semua Asrama',
          officerName: officerName || (sDef.category === 'Makan' ? 'Petugas Dapur / Pembina' : 'Pembina Asrama')
        },
        students
      );
      if (onShowToast) {
        onShowToast('Presensi Siap', `Daftar hadir ${sDef.name} dengan Kop Surat berhasil diunduh.`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast('Gagal', 'Terjadi kesalahan saat mencetak presensi sesi.', 'error');
      }
    }
  };

  // Export Blank Attendance Checklist PDF with Letterhead for physical checking
  const handleExportBlankTemplatePDF = async () => {
    const sDef = getSessionDef(selectedPrayerTime);
    if (onShowToast) {
      onShowToast('Menyiapkan Dokumen', `Membuat Blanko Presensi ${sDef.name} (Kop Surat) untuk presensi manual...`, 'info');
    }
    try {
      await generatePrayerAttendanceReportPDF(
        [],
        config,
        {
          date: selectedDate,
          prayerTime: selectedPrayerTime,
          classFilter: 'Semua Kelas',
          dormFilter: 'Semua Asrama',
          officerName: officerName || (sDef.category === 'Makan' ? 'Petugas Dapur / Pembina' : 'Pembina Asrama'),
          isBlankTemplate: true
        },
        students
      );
      if (onShowToast) {
        onShowToast('Blanko Siap', `Blanko presensi ${sDef.name} dengan Kop Surat berhasil diunduh.`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast('Gagal', 'Terjadi kesalahan saat membuat blanko.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Switcher Navigation Bar */}
      <div className="no-print bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button
            onClick={() => setActiveSubTab('scanner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeSubTab === 'scanner'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Camera className={`w-4 h-4 ${activeSubTab === 'scanner' ? 'text-red-200' : 'text-slate-400'}`} />
            <span>QR Scanner Live</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeSubTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <QrCode className={`w-4 h-4 ${activeSubTab === 'cards' ? 'text-indigo-200' : 'text-slate-400'}`} />
            <span>Generator Kartu QR</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeSubTab === 'checklist'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className={`w-4 h-4 ${activeSubTab === 'checklist' ? 'text-teal-200' : 'text-slate-400'}`} />
            <span>Ceklist Harian</span>
          </button>

          <button
            onClick={() => setActiveSubTab('recap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeSubTab === 'recap'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${activeSubTab === 'recap' ? 'text-blue-200' : 'text-slate-400'}`} />
            <span>Laporan Rekap Hadir</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setIsArduinoModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-all whitespace-nowrap bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300 text-xs"
          >
            <Cpu className="w-4 h-4 text-amber-600" /> Hardware & Arduino RFID
          </button>
        </div>
      </div>

      {/* Hidden File Input for JSON Attendance Import */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleImportJSON}
        accept=".json,application/json"
        className="hidden"
      />

      {/* HEADER BANNER */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-red-200 text-xs font-semibold mb-3 backdrop-blur-sm">
              <QrCode className="w-3.5 h-3.5 text-amber-300" /> Modul Presensi Asrama (Sholat, Makan & Kegiatan)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Presensi & Kartu QR Code Asrama
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Presensi digital terpadu untuk Sholat Berjamaah 5 Waktu, Ruang Makan / Dapur Asrama (Sarapan, Siang, Malam, Sahur), dan Kegiatan Asrama menggunakan Barcode Gun, Webcam QR Scanner, atau Arduino RFID.
            </p>
          </div>
        </div>
        <QrCode className="absolute right-4 -bottom-8 w-60 h-60 text-white/5 pointer-events-none" />
      </div>

      {/* SUB-TAB 1: LIVE QR SCANNER & ATTENDANCE RECORDING */}
      {activeSubTab === 'scanner' && (
        <div className="no-print space-y-6">
          {/* Controls Bar: Session Setup & Quick Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Category Filter Pills & Active Session Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-red-600" /> Kategori Sesi:
                </span>
                {(['Semua', 'Sholat', 'Makan', 'Kegiatan'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSessionCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sessionCategoryFilter === cat
                        ? cat === 'Makan'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : cat === 'Sholat'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : cat === 'Kegiatan'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'Sholat' ? '🕌 Sholat' : cat === 'Makan' ? '🍽️ Makan' : cat === 'Kegiatan' ? '📋 Kegiatan' : 'Semua'}
                  </button>
                ))}
              </div>

              {/* Active Session Badge */}
              {(() => {
                const sDef = getSessionDef(selectedPrayerTime);
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-extrabold border ${sDef.badgeBg} ${sDef.badgeText}`}>
                    <span>{sDef.icon}</span>
                    <span>Sesi Aktif: {sDef.name}</span>
                    <span className="opacity-70 text-[10px] font-normal font-mono">({sDef.defaultTimeRange})</span>
                  </div>
                );
              })()}
            </div>

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
                  <Clock className="w-3.5 h-3.5 text-red-600" /> Sesi Presensi (Sholat / Makan / Kegiatan):
                </label>
                <select
                  value={selectedPrayerTime}
                  onChange={(e) => setSelectedPrayerTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {(sessionCategoryFilter === 'Semua' || sessionCategoryFilter === 'Sholat') && (
                    <optgroup label="🕌 Sholat Berjamaah">
                      <option value="Subuh">🕌 Sholat Subuh</option>
                      <option value="Dhuha">☀️ Sholat Dhuha</option>
                      <option value="Dzuhur">🕌 Sholat Dzuhur</option>
                      <option value="Ashar">🕌 Sholat Ashar</option>
                      <option value="Maghrib">🕌 Sholat Maghrib</option>
                      <option value="Isya">🕌 Sholat Isya</option>
                      <option value="Tahajjud / Qiyamul Lail">🌙 Tahajjud / Qiyamul Lail</option>
                    </optgroup>
                  )}
                  {(sessionCategoryFilter === 'Semua' || sessionCategoryFilter === 'Makan') && (
                    <optgroup label="🍽️ Ruang Makan & Dapur Asrama">
                      <option value="Sarapan Pagi">🍳 Makan Pagi (Sarapan)</option>
                      <option value="Makan Siang">🍱 Makan Siang</option>
                      <option value="Makan Malam">🍲 Makan Malam</option>
                      <option value="Sahur">🥣 Makan Sahur (Puasa)</option>
                      <option value="Buka Puasa">🌴 Buka Puasa / Ta'jil</option>
                      <option value="Snack / Ekstra Gizi">🥛 Snack Sore / Ekstra Nutrisi</option>
                    </optgroup>
                  )}
                  {(sessionCategoryFilter === 'Semua' || sessionCategoryFilter === 'Kegiatan') && (
                    <optgroup label="📋 Kegiatan Asrama">
                      <option value="Kajian / Kegiatan">📖 Kajian / Halaqah Qur'an</option>
                      <option value="Apel / Baris Asrama">📢 Apel Pagi / Malam Asrama</option>
                      <option value="Kebersihan / Ro'an">🧹 Kerja Bakti / Ro'an Asrama</option>
                    </optgroup>
                  )}
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
                  placeholder="Nama Pembina / Wali Asuh / Petugas Dapur"
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
                  onClick={handlePrintCurrentSessionPDF}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Cetak & Unduh Daftar Hadir Sholat Sesi Ini (PDF Resmi Ber-Kop Surat)"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Presensi (Kop Surat)
                </button>

                <button
                  type="button"
                  onClick={handleExportBlankTemplatePDF}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs border border-slate-300 transition-all flex items-center gap-1.5 active:scale-95"
                  title="Cetak Blanko Presensi Sholat Kosong Ber-Kop Surat untuk Musyrif/Imam di Masjid"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" /> Blanko Manual
                </button>

                <button
                  type="button"
                  onClick={() => handleExportJSON(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Simpan & Unduh data absensi sholat sesi ini sebagai file JSON"
                >
                  <Download className="w-3.5 h-3.5" /> Simpan JSON Sesi Ini
                </button>

                <button
                  type="button"
                  onClick={() => handleExportJSON(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
                  title="Simpan & Unduh seluruh data absensi sholat sebagai file JSON"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Simpan JSON All
                </button>

                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Impor rekam absensi dari file JSON"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-200" /> Impor JSON
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

            {/* Live KPI Metric Cards for selected prayer / meal / activity */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider block">Total Murid</span>
                <span className="text-2xl md:text-3xl font-black text-slate-900 mt-1 block">{stats.total}</span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Terdaftar</span>
              </div>
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Total Hadir</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-700 mt-1 block">{stats.hadir}</span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Tepat Waktu</span>
              </div>
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">Terlambat</span>
                <span className="text-2xl md:text-3xl font-black text-amber-700 mt-1 block">{stats.terlambat}</span>
                <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Susulan</span>
              </div>
              <div className="bg-purple-50/90 border border-purple-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-purple-800 font-bold uppercase tracking-wider block">Izin Pulang</span>
                <span className="text-2xl md:text-3xl font-black text-purple-700 mt-1 block">{stats.izinPulang}</span>
                <span className="text-[11px] text-purple-600 font-medium mt-0.5 block">Di Luar Asrama</span>
              </div>
              <div className="bg-teal-50/90 border border-teal-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-teal-800 font-bold uppercase tracking-wider block">Izin Sakit</span>
                <span className="text-2xl md:text-3xl font-black text-teal-700 mt-1 block">{stats.izinSakit}</span>
                <span className="text-[11px] text-teal-600 font-medium mt-0.5 block">UKS / Rawat</span>
              </div>
              <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 text-center shadow-sm">
                <span className="text-xs text-rose-800 font-bold uppercase tracking-wider block">Alpa</span>
                <span className="text-2xl md:text-3xl font-black text-rose-700 mt-1 block">{stats.alpa}</span>
                <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Tanpa Izin</span>
              </div>
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 text-center shadow-sm col-span-2 sm:col-span-1">
                <span className="text-xs text-indigo-800 font-bold uppercase tracking-wider block">Belum Scan</span>
                <span className="text-2xl md:text-3xl font-black text-indigo-700 mt-1 block">{stats.belumScan}</span>
                <span className="text-[11px] text-indigo-500 font-medium mt-0.5 block">Menunggu</span>
              </div>
            </div>
          </div>

          {/* MAIN SCANNER AREA & MANUAL INPUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Arduino RFID Hardware, QR Webcam Scanner & USB Gun Input */}
            <div className="lg:col-span-6 space-y-4">
              {/* ARDUINO & WEB SERIAL RFID LIVE STATUS PANEL */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Arduino / ESP32 RFID Web Serial Reader</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isSerialConnected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isSerialConnected ? '● Serial Connected' : 'Serial Disconnected'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isSerialConnected
                      ? `Mendengarkan data tap kartu RFID dari Arduino via Web Serial (${serialBaudRate} Baud)...`
                      : 'Hubungkan modul Arduino/ESP32 RFID via USB Serial untuk absensi tap kartu otomatis.'}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSerialConnected ? (
                      <button
                        type="button"
                        onClick={disconnectWebSerial}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
                      >
                        <Unplug className="w-3.5 h-3.5" /> Putuskan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={connectWebSerial}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
                      >
                        <Plug className="w-3.5 h-3.5" /> Hubungkan Serial
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsArduinoModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold p-1.5 rounded-lg text-xs border border-slate-700 transition"
                      title="Pengaturan Hardware & Sketsa Arduino"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {serialLogs.length > 0 && (
                  <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800 font-mono text-[10px] text-emerald-400 max-h-24 overflow-y-auto space-y-0.5 shadow-inner">
                    {serialLogs.slice(0, 4).map((log, i) => (
                      <div key={i} className="truncate">{log}</div>
                    ))}
                  </div>
                )}
              </div>

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
                        {Array.from(new Set([...(config.dormList || []), ...students.map((s) => s.dorm)])).map((dorm) => (
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
                  <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
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
                  onClick={async () => {
                    const targetList = selectedStudentIdsForCards.length > 0
                      ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                      : filteredStudentsForCards;
                    if (targetList.length === 0) {
                      onShowToast?.('Pilih Murid', 'Pilih minimal 1 murid untuk dicetak!', 'warning');
                      return;
                    }
                    onShowToast?.('Mengekspor PNG', `Membuat Gambar PNG ${targetList.length} Kartu...`, 'info');
                    await downloadMultipleCardsPNG(targetList, config, (cur, total) => {
                      onShowToast?.('Mengekspor PNG', `Proses ${cur}/${total} Kartu...`, 'info');
                    });
                    onShowToast?.('Selesai Ekspor PNG', `Berhasil mengunduh ${targetList.length} Gambar Kartu PNG (Resolusi Tinggi 300 DPI).`, 'success');
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                  title="Unduh Kartu Tanda Murid sebagai Gambar PNG Resolusi Tinggi (1011x638 px)"
                >
                  <Download className="w-4 h-4 text-amber-100" />
                  {selectedStudentIdsForCards.length > 0
                    ? `Unduh Gambar PNG (${selectedStudentIdsForCards.length})`
                    : `Unduh Gambar PNG (${filteredStudentsForCards.length})`}
                </button>

                <button
                  onClick={async () => {
                    const targetList = selectedStudentIdsForCards.length > 0
                      ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                      : filteredStudentsForCards;
                    if (targetList.length === 0) {
                      onShowToast?.('Pilih Murid', 'Pilih minimal 1 murid untuk dicetak!', 'warning');
                      return;
                    }
                    onShowToast?.('Mencetak PDF CR80', `Membuat PDF ${targetList.length} Kartu QR Absensi...`, 'info');
                    await generateAllStudentCardsPDF(targetList, config);
                    onShowToast?.('Mencetak PDF Selesai', `Berhasil mengekspor ${targetList.length} Kartu QR Absensi (CR80: 85.6 x 54 mm).`, 'success');
                  }}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                  title="Cetak PDF Kartu QR Absensi Terpilih Ukuran CR80 (85.6 x 54 mm per halaman)"
                >
                  <Printer className="w-4 h-4 text-indigo-200" />
                  {selectedStudentIdsForCards.length > 0
                    ? `Cetak Terpilih PDF (${selectedStudentIdsForCards.length})`
                    : `Cetak Semua PDF (${filteredStudentsForCards.length})`}
                </button>

                <button
                  onClick={async () => {
                    const targetList = selectedStudentIdsForCards.length > 0
                      ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                      : filteredStudentsForCards;
                    if (targetList.length === 0) {
                      onShowToast?.('Pilih Murid', 'Pilih minimal 1 murid untuk dicetak!', 'warning');
                      return;
                    }
                    onShowToast?.('Mencetak Grid A4', `Membuat PDF Grid A4 ${targetList.length} Kartu QR Absensi...`, 'info');
                    await generateStudentCardSheetA4PDF(targetList, config);
                    onShowToast?.('Mencetak PDF Selesai', `Berhasil mengekspor ${targetList.length} Kartu QR Absensi ke lembar A4 (10 Kartu/Halaman).`, 'success');
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                  title="Cetak Grid A4 (10 Kartu QR ID per Lembar Kertas dengan Garis Potong)"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  {selectedStudentIdsForCards.length > 0
                    ? `Cetak Grid A4 PDF (${selectedStudentIdsForCards.length})`
                    : `Cetak Grid A4 PDF (${filteredStudentsForCards.length})`}
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 border border-slate-700"
                  title="Cetak tampilan HTML langsung via dialog printer browser"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Browser
                </button>
              </div>
            </div>

            {/* Filter Bar & HD Print Customization Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              <div className="relative col-span-1 sm:col-span-2">
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
                  <option value="">Semua Kelas</option>
                  <option value="SD">Jenjang SD</option>
                  <option value="SMP">Jenjang SMP</option>
                  <option value="SMA">Jenjang SMA</option>
                </select>
              </div>

              <div>
                <select
                  value={cardDesignTheme}
                  onChange={(e) => setCardDesignTheme(e.target.value as 'dark' | 'light')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="dark">Desain: Dark Luxury</option>
                  <option value="light">Desain: Clean Minimalist</option>
                </select>
              </div>

              <div>
                <select
                  value={qrPayloadFormat}
                  onChange={(e) => setQrPayloadFormat(e.target.value as 'id' | 'json')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  title="Pilih format isi payload QR Code"
                >
                  <option value="id">QR: NISN / ID Plain</option>
                  <option value="json">QR: JSON Object</option>
                </select>
              </div>

              <div>
                <select
                  value={cardPrintSide}
                  onChange={(e) => setCardPrintSide(e.target.value as 'front' | 'both')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="front">Cetak: Tampak Depan</option>
                  <option value="both">Cetak: 2 Sisi (Depan & Belakang)</option>
                </select>
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
                  className={`relative cursor-pointer transition-all ${
                    isSelected ? 'ring-4 ring-red-500 rounded-2xl scale-[1.01]' : 'opacity-95 hover:opacity-100'
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-red-600 text-white shadow-md' : 'bg-black/30 text-transparent border border-white/40'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <StudentCardFront
                    student={s}
                    config={config}
                    qrPayloadFormat={qrPayloadFormat}
                    qrUrl={qrUrl}
                    theme={cardDesignTheme}
                  />

                  {/* Card Footer Actions */}
                  <div className="mt-1 flex items-center justify-between text-[10px] px-1">
                    <span className="text-slate-400 font-medium">CR80 • 85.6x54mm</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSingleCardPreviewStudent(s);
                        setPreviewSideModal('front');
                      }}
                      className="text-red-600 hover:text-red-700 font-bold underline flex items-center gap-1"
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
                  <StudentCardFront
                    student={singleCardPreviewStudent}
                    config={config}
                    qrPayloadFormat={qrPayloadFormat}
                    qrUrl={qrCodeDataUrls[singleCardPreviewStudent.id]}
                    theme={cardDesignTheme}
                  />
                ) : (
                  <StudentCardBack
                    student={singleCardPreviewStudent}
                    qrPayloadFormat={qrPayloadFormat}
                    qrUrl={qrCodeDataUrls[singleCardPreviewStudent.id]}
                  />
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (!singleCardPreviewStudent) return;
                      onShowToast?.('Unduh Kartu PNG', `Mengunduh Kartu ${singleCardPreviewStudent.name}...`, 'info');
                      await downloadStudentCardPNG(singleCardPreviewStudent, config);
                      onShowToast?.('Selesai', 'Kartu PNG HD berhasil diunduh.', 'success');
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Kartu PNG HD
                  </button>
                  <a
                    href={qrCodeDataUrls[singleCardPreviewStudent.id]}
                    download={`QR_Code_HD_${singleCardPreviewStudent.id}_${singleCardPreviewStudent.name}.png`}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" /> QR HD PNG
                  </a>
                  <button
                    onClick={() => {
                      setSelectedStudentIdsForCards([singleCardPreviewStudent.id]);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs text-center shadow transition-all flex items-center justify-center gap-1"
                  >
                    <Printer className="w-4 h-4" /> Cetak Kartu
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

            <div className="cr80-print-grid">
              {(selectedStudentIdsForCards.length > 0
                ? students.filter((s) => selectedStudentIdsForCards.includes(s.id))
                : filteredStudentsForCards
              ).map((s) => {
                const qrUrl = qrCodeDataUrls[s.id];

                return (
                  <React.Fragment key={s.id}>
                    {/* FRONT SIDE CARD */}
                    <StudentCardFront
                      student={s}
                      config={config}
                      qrPayloadFormat={qrPayloadFormat}
                      qrUrl={qrUrl}
                      theme={cardDesignTheme}
                      isPrint={true}
                      showCropMarks={showCropMarks}
                    />

                    {/* BACK SIDE CARD */}
                    {cardPrintSide === 'both' && (
                      <StudentCardBack
                        student={s}
                        qrPayloadFormat={qrPayloadFormat}
                        qrUrl={qrUrl}
                        isPrint={true}
                        showCropMarks={showCropMarks}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REKAPITULASI & LAPORAN ABSENSI TERPADU */}
      {activeSubTab === 'recap' && (
        <div className="no-print space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-red-600" /> Rekapitulasi & Laporan Presensi Asrama Terpadu
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tinjau rekam jejak presensi sholat berjamaah, jadwal makan asrama, dan kegiatan harian, filter berdasarkan tanggal/sesi, dan unduh laporan PDF resmi ber-kop surat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    const confirmClear = await onAskConfirm?.('Hapus Cache Data Absensi?', 'Apakah Anda yakin ingin menghapus semua data presensi asrama? Tindakan ini tidak dapat dibatalkan.');
                    if (confirmClear) {
                      onSavePrayerAttendance([]);
                    }
                  }}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 border border-rose-200 active:scale-95"
                  title="Hapus seluruh cache data presensi"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Cache
                </button>
                <button
                  onClick={() => handleExportJSON(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
                  title="Simpan & Unduh seluruh data rekap absensi sebagai file JSON"
                >
                  <Download className="w-4 h-4 text-blue-400" /> Simpan JSON Absensi
                </button>
                <button
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Impor file JSON rekap absensi"
                >
                  <Code2 className="w-4 h-4 text-indigo-200" /> Impor File JSON
                </button>
                <button
                  onClick={handleExportBlankTemplatePDF}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 border border-slate-300 active:scale-95"
                  title="Cetak & Unduh Blanko Lembar Hadir Manual dengan Kop Surat Resmi Sekolah"
                >
                  <Printer className="w-4 h-4 text-slate-600" /> Cetak Blanko Manual (Kop Surat)
                </button>
                <button
                  onClick={handleExportRecapPDF}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5 active:scale-95"
                  title="Unduh Laporan Rekapitulasi Presensi PDF Resmi dengan Kop Surat & TTD"
                >
                  <Download className="w-4 h-4" /> Unduh Laporan PDF Resmi Kop Sekolah
                </button>
              </div>
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
                <label className="block text-slate-700 font-bold mb-1">Filter Sesi / Waktu:</label>
                <select
                  value={recapPrayerFilter}
                  onChange={(e) => setRecapPrayerFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Semua">🌟 Semua Sesi Presensi</option>
                  <optgroup label="🕌 Sesi Sholat Berjamaah">
                    <option value="Subuh">🕌 Subuh</option>
                    <option value="Dhuha">☀️ Dhuha</option>
                    <option value="Dzuhur">🕌 Dzuhur</option>
                    <option value="Ashar">🕌 Ashar</option>
                    <option value="Maghrib">🕌 Maghrib</option>
                    <option value="Isya">🕌 Isya</option>
                    <option value="Tahajjud / Qiyamul Lail">🌙 Tahajjud / Qiyamul Lail</option>
                  </optgroup>
                  <optgroup label="🍽️ Sesi Makan Asrama">
                    <option value="Sarapan Pagi">🍳 Sarapan Pagi</option>
                    <option value="Makan Siang">🍱 Makan Siang</option>
                    <option value="Makan Malam">🍲 Makan Malam</option>
                    <option value="Sahur">🥣 Sahur</option>
                    <option value="Buka Puasa">🌴 Buka Puasa / Ta'jil</option>
                    <option value="Snack / Ekstra Gizi">🥛 Snack / Ekstra Gizi</option>
                  </optgroup>
                  <optgroup label="📋 Sesi Kegiatan">
                    <option value="Kajian / Kegiatan">📖 Kajian / Kegiatan</option>
                    <option value="Apel / Baris Asrama">📢 Apel / Baris Asrama</option>
                    <option value="Kebersihan / Ro'an">🧹 Kerja Bakti / Ro'an</option>
                  </optgroup>
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
                Menampilkan {filteredRecapRecords.length} Catatan Presensi Asrama
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
                    <th className="p-3.5">Sesi Presensi</th>
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
                    filteredRecapRecords.map((r, idx) => {
                      const sDef = getSessionDef(r.prayerTime);
                      return (
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
                          <td className="p-3.5 font-bold text-slate-800">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 border border-slate-200">
                              <span>{sDef.icon}</span>
                              <span>{r.prayerTime}</span>
                            </span>
                          </td>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CEKLIST & JURNAL RUTINITAS HARIAN */}
      {activeSubTab === 'checklist' && (
        <div className="no-print space-y-6">
          <ChecklistTab
            students={students}
            journals={dailyJournals}
            config={config}
            onSaveJournal={onSaveJournal || (() => {})}
            onDeleteJournal={onDeleteJournal || (() => {})}
            onShowToast={onShowToast ? (title, msg, type) => onShowToast(title, msg, (type as any) || 'info') : () => {}}
            onAskConfirm={onAskConfirm || (async () => true)}
          />
        </div>
      )}

      {/* ARDUINO & RFID HARDWARE CONFIGURATION MODAL */}
      {isArduinoModalOpen && (
        <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    Integrasi Hardware Scanner RFID & Arduino
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi Pemindai RFID MFRC522, ESP32, atau Barcode Scanner USB Keyboard Wedge
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArduinoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setArduinoCodeTab('serial')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  arduinoCodeTab === 'serial'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plug className="w-4 h-4" /> Mode Web Serial (Direct USB)
              </button>
              <button
                type="button"
                onClick={() => setArduinoCodeTab('hid')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  arduinoCodeTab === 'hid'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Usb className="w-4 h-4" /> Mode USB Keyboard Wedge (HID)
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* TAB 1: WEB SERIAL MODE */}
              {arduinoCodeTab === 'serial' && (
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                    <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Cara Kerja Mode Web Serial (Rekomendasi Utama)
                    </h4>
                    <p className="text-amber-800 leading-relaxed">
                      Arduino/ESP32 terhubung via kabel USB ke Komputer/Laptop. Web Serial API membaca data UID kartu RFID dari Serial Monitor secara langsung tanpa membutuhkan aplikasi driver tambahan di OS!
                    </p>
                  </div>

                  {/* Serial Connect Controls */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase block">Koneksi Hardware Serial</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-3 h-3 rounded-full ${isSerialConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                          <span className="font-extrabold text-sm text-white">
                            {isSerialConnected ? 'Status: Terhubung (Listening RFID Tap)' : 'Status: Belum Terhubung'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 font-bold">Baud Rate:</span>
                          <select
                            value={serialBaudRate}
                            onChange={(e) => setSerialBaudRate(Number(e.target.value))}
                            disabled={isSerialConnected}
                            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold focus:outline-none"
                          >
                            <option value={9600}>9600 Baud</option>
                            <option value={57600}>57600 Baud</option>
                            <option value={115200}>115200 Baud (Default)</option>
                          </select>
                        </div>

                        {isSerialConnected ? (
                          <button
                            type="button"
                            onClick={disconnectWebSerial}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                          >
                            <Unplug className="w-4 h-4" /> Putuskan Koneksi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={connectWebSerial}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all"
                          >
                            <Plug className="w-4 h-4" /> Pilih COM Port & Hubungkan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Serial Monitor Log Window */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Terminal Live Monitor (Rx Log):
                        </span>
                        <button
                          type="button"
                          onClick={() => setSerialLogs([])}
                          className="hover:text-white transition"
                        >
                          Bersihkan Log
                        </button>
                      </div>
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-emerald-400 h-36 overflow-y-auto space-y-1">
                        {serialLogs.length === 0 ? (
                          <div className="text-slate-600 italic">Log data serial kosong. Tap kartu RFID pada reader untuk melihat data UID...</div>
                        ) : (
                          serialLogs.map((log, idx) => (
                            <div key={idx} className="leading-tight">{log}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* C++ Code Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-red-600" /> Sketsa Arduino C++ (Mode Web Serial MFRC522):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const code = `#include <SPI.h>\n#include <MFRC522.h>\n\n#define SS_PIN 10\n#define RST_PIN 9\n#define BUZZER_PIN 8\n#define LED_PIN 7\n\nMFRC522 rfid(SS_PIN, RST_PIN);\n\nvoid setup() {\n  Serial.begin(115200);\n  SPI.begin();\n  rfid.PCD_Init();\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(LED_PIN, OUTPUT);\n}\n\nvoid loop() {\n  if (!rfid.PICC_IsNewCardPresent()) return;\n  if (!rfid.PICC_ReadCardSerial()) return;\n\n  String uidStr = "";\n  for (byte i = 0; i < rfid.uid.size; i++) {\n    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";\n    uidStr += String(rfid.uid.uidByte[i], HEX);\n  }\n  uidStr.toUpperCase();\n\n  Serial.println(uidStr);\n\n  digitalWrite(BUZZER_PIN, HIGH);\n  digitalWrite(LED_PIN, HIGH);\n  delay(120);\n  digitalWrite(BUZZER_PIN, LOW);\n  digitalWrite(LED_PIN, LOW);\n\n  rfid.PICC_HaltA();\n  rfid.PCD_StopCrypto1();\n  delay(1200);\n}`;
                          navigator.clipboard.writeText(code);
                          setCopiedCodeToast(true);
                          setTimeout(() => setCopiedCodeToast(false), 2000);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <Copy className="w-3.5 h-3.5" /> {copiedCodeToast ? 'Terkopi!' : 'Salin Kode Arduino'}
                      </button>
                    </div>

                    <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
{`/* 
 * SKETSA ARDUINO / ESP32 RFID SCANNER (Web Serial API)
 * Aplikasi: Sistem Absensi Sekolah Rakyat Kemensos RI
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
#define BUZZER_PIN 8
#define LED_PIN 7

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200); // Baud rate 115200
  SPI.begin();
  rfid.PCD_Init();
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  // Kirim UID Kartu ke Aplikasi Web via USB Serial
  Serial.println(uidStr);

  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(LED_PIN, HIGH);
  delay(120);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1200);
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: USB KEYBOARD WEDGE MODE */}
              {arduinoCodeTab === 'hid' && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                    <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                      <Usb className="w-4 h-4 text-emerald-600" /> Cara Kerja Mode USB Keyboard Wedge (HID)
                    </h4>
                    <p className="text-emerald-800 leading-relaxed">
                      Menggunakan Arduino Leonardo, Pro Micro, atau ESP32-S2/S3. Saat kartu RFID ditap, hardware bertindak seperti keyboard USB fisik yang mengetik UID kartu secara otomatis lalu menekan tombol Enter!
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900">Petunjuk Penggunaan USB Keyboard Wedge / Barcode Gun:</h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium">
                      <li>Colokkan Barcode Gun USB atau Arduino HID ke Laptop/PC.</li>
                      <li>Buka tab <strong>QR Scanner Live</strong> di aplikasi ini.</li>
                      <li>Arahkan kursor ke input box <strong>"Scanner Gun USB / Input Manual NISN"</strong>.</li>
                      <li>Tap Kartu RFID / scan Barcode. UID akan terisi otomatis dan memicu proses absensi seketika!</li>
                    </ol>
                  </div>

                  {/* C++ Code Box HID */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-red-600" /> Sketsa C++ Arduino Leonardo / HID Keyboard RFID:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const code = `#include <SPI.h>\n#include <MFRC522.h>\n#include <Keyboard.h>\n\n#define SS_PIN 10\n#define RST_PIN 9\n#define BUZZER_PIN 8\n\nMFRC522 rfid(SS_PIN, RST_PIN);\n\nvoid setup() {\n  SPI.begin();\n  rfid.PCD_Init();\n  Keyboard.begin();\n  pinMode(BUZZER_PIN, OUTPUT);\n}\n\nvoid loop() {\n  if (!rfid.PICC_IsNewCardPresent()) return;\n  if (!rfid.PICC_ReadCardSerial()) return;\n\n  String uidStr = "";\n  for (byte i = 0; i < rfid.uid.size; i++) {\n    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";\n    uidStr += String(rfid.uid.uidByte[i], HEX);\n  }\n  uidStr.toUpperCase();\n\n  Keyboard.print(uidStr);\n  Keyboard.write(KEY_RETURN);\n\n  digitalWrite(BUZZER_PIN, HIGH);\n  delay(100);\n  digitalWrite(BUZZER_PIN, LOW);\n\n  rfid.PICC_HaltA();\n  rfid.PCD_StopCrypto1();\n  delay(1200);\n}`;
                          navigator.clipboard.writeText(code);
                          setCopiedCodeToast(true);
                          setTimeout(() => setCopiedCodeToast(false), 2000);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <Copy className="w-3.5 h-3.5" /> {copiedCodeToast ? 'Terkopi!' : 'Salin Sketsa HID'}
                      </button>
                    </div>

                    <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
{`/* 
 * ARDUINO LEONARDO / PRO MICRO USB KEYBOARD HID RFID
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Keyboard.h>

#define SS_PIN 10
#define RST_PIN 9
#define BUZZER_PIN 8

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  SPI.begin();
  rfid.PCD_Init();
  Keyboard.begin();
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  // Ketik UID ke input box aktif lalu Enter
  Keyboard.print(uidStr);
  Keyboard.write(KEY_RETURN);

  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1200);
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Mendukung MFRC522 13.56MHz, PN532, EM4100, Barcode Gun USB</span>
              <button
                type="button"
                onClick={() => setIsArduinoModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow transition"
              >
                Tutup Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
