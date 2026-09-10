import { Student, Violation, Counseling, Leave, DailyJournal, ReportCardData, AppConfig, TaskItem, MedicalRecord, DisciplineLevelConfig, DisciplineStatusThreshold, ViolationTemplateItem, PrayerAttendance, ConnectingJournal, MenstruationRecord, MeetingMinute, SpecialChronologyCase, SpecialShiftLog, DormInspection, DormInspectionCriterion, DormInspectionItemScore, DormGrade, DormActionRequired, DormAsset, PsychologicalAssessment } from '../types';
import { consolidateDormList } from '../utils/dormHelper';
import { DataIntegrityReport } from '../utils/integrityVerifier';

export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxva2GX_N3-ogOwiy0b-VShpbZ-vC_UKR_t6eKPtBX0yvWTnSiBVoud7VdPDNHYzCrkmA/exec";

export const DEFAULT_DISCIPLINE_LEVELS: DisciplineLevelConfig[] = [
  { level: 1, name: 'Tingkat 1 (Pelanggaran Ringan)', pointsDeduction: 5, defaultSanction: 'Teguran lisan & Piket asrama' },
  { level: 2, name: 'Tingkat 2 (Pelanggaran Sedang)', pointsDeduction: 10, defaultSanction: 'Surat Peringatan 1 (SP1)' },
  { level: 3, name: 'Tingkat 3 (Pelanggaran Berat)', pointsDeduction: 25, defaultSanction: 'SP2, Pemanggilan Ortu, & Skorsing 3 Hari' },
  { level: 4, name: 'Tingkat 4 (Pelanggaran Sangat Berat)', pointsDeduction: 50, defaultSanction: 'SP3 (Peringatan Akhir) & Skorsing 2 Minggu' },
  { level: 5, name: 'Tingkat 5 (Pelanggaran Luar Biasa)', pointsDeduction: 100, defaultSanction: 'Dikeluarkan dengan Tidak Hormat (Drop Out)' }
];

export const DEFAULT_DISCIPLINE_THRESHOLDS: DisciplineStatusThreshold[] = [
  { minScore: 90, label: 'Sangat Baik', badgeColor: 'emerald', description: 'Siswa taat aturan & tidak ada pelanggaran berarti.' },
  { minScore: 75, label: 'Baik / Normal', badgeColor: 'blue', description: 'Kedisiplinan tergolong baik dengan catatan ringan.' },
  { minScore: 50, label: 'Perlu Pembinaan BK', badgeColor: 'amber', description: 'Memerlukan pembinaan & konseling khusus BK.' },
  { minScore: 25, label: 'Peringatan Keras (SP2)', badgeColor: 'rose', description: 'Siswa dalam kondisi Peringatan Keras SP2.' },
  { minScore: 0, label: 'Status Kritis (SP3 / DO)', badgeColor: 'red', description: 'Siswa dalam ambang batas skorsing berat / DO.' }
];

export const DEFAULT_CONFIG: AppConfig = {
  googleScriptUrl: DEFAULT_SCRIPT_URL,
  waliAsrama: "HISNUL HASHIN, SE",
  waliAsramaNip: "NIP. 197406262025211027",
  waliAsramaTitle: "Wali Asrama Mandiri",
  kepalaSekolah: "YUNI ARSI, S.Pd",
  kepalaSekolahNip: "197206051999032002",
  kopKiri: "KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nPUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI",
  kopKanan: "SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG\nJl. Komp Sosial Km 5 Sukabangun, Palembang",
  waliAsuhList: [
    "M ARDIAN NUGRAHA|NIP. 199202042026221001",
    "ULPA JAYANTI|NIP. 199412032026222001",
    "Muhamad Isroni|NIP. 199311082026221001",
    "Jepri Julianto|NIP. 200007292026221001",
    "Yuniarti Anggraini|NIP. 199106092026222001",
    "SRI AGUSTINA|NIP. 199808262026222001",
    "Yogi Antoni|NIP. 199208202026221002",
    "Oktra Suhri|NIP. 199210172026221001",
    "Muhammad Irfan|NIP. 199801202026221001",
    "Angginta Christia Ginting|NIP. 198611172026222001",
    "Umi Kulsum|NIP. 199305112026222001",
    "Denok Permatasari Heri|NIP. 199707202026222001",
    "Vivin Dian Oktasari|NIP. 199706162026222001",
    "Nurul Huda|NIP. 198903202026222001"
  ],
  dormList: [
    "Asrama Dewantara",
    "Asrama Pattimura",
    "Asrama Teuku Umar",
    "Asrama Cut Nyak Dien",
    "Asrama RA Kartini",
    "Asrama Dewi Sartika"
  ],
  logoKiriUrl: "https://lh3.googleusercontent.com/d/1m4voglUO4iLNJ1Pz-ygtKbYstpCwOhOJ",
  logoKananUrl: "https://lh3.googleusercontent.com/d/1rNFA7Zb_jx0c8yAX0gisbzH-EjdoNGtg",
  watermarkOpacity: 0.04,
  semester: 'Genap',
  academicYear: '2025/2026',
  disciplineLevels: DEFAULT_DISCIPLINE_LEVELS,
  disciplineThresholds: DEFAULT_DISCIPLINE_THRESHOLDS,
  autoResetPointsPerSemester: true,
  enableSpecialChronology: true
};

export const INITIAL_STUDENTS: Student[] = [];

export const ROUTINE_TASKS: TaskItem[] = [
  { id: 1, task: "Membangunkan siswa & Persiapan Sholat Subuh berjamaah" },
  { id: 2, task: "Senam Pagi / Olahraga Ringan Asrama" },
  { id: 3, task: "Pembersihan Kamar & Lingkungan Asrama (Piket)" },
  { id: 4, task: "Apel Pagi & Pengecekan Kehadiran Lengkap" },
  { id: 5, task: "Sarapan Pagi Bersama di Ruang Makan" },
  { id: 6, task: "Pengecekan Kerapian Seragam & Keberangkatan Sekolah" },
  { id: 7, task: "Penyambutan Kepulangan Sekolah & Istirahat Siang" },
  { id: 8, task: "Pendampingan Makan Malam & Belajar Mandiri/Kelompok" },
  { id: 9, task: "Apel Malam & Pengecekan Kehadiran Final" },
  { id: 10, task: "Jam Malam (Lampu Padam & Istirahat Total)" }
];

export const VIOLATION_TEMPLATES: Record<number, { text: string; explanation: string; sanction: string }[]> = {
  1: [
    { text: "Terlambat bangun pagi atau apel asrama", explanation: "Siswa tidak hadir tepat waktu sesuai jadwal harian asrama secara sengaja.", sanction: "Teguran lisan & Hukuman fisik non-kontak (Piket asrama)" },
    { text: "Tidak melaksanakan piket kebersihan", explanation: "Melalaikan tugas piket harian kamar, asrama, atau ruang makan.", sanction: "Melaksanakan piket 2x lipat pada hari berikutnya" },
    { text: "Pakaian tidak rapi / tidak sesuai ketentuan", explanation: "Tidak memakai seragam sekolah atau atribut lengkap sesuai jadwal.", sanction: "Teguran langsung & perbaikan atribut saat itu juga" },
    { text: "Membuat kegaduhan ringan di kamar", explanation: "Berisik saat jam belajar atau saat jam istirahat malam/tidur.", sanction: "Teguran lisan & dipisahkan dari kelompok sementara" }
  ],
  2: [
    { text: "Tidak mengikuti shalat/ibadah berjamaah", explanation: "Sengaja absen dari kewajiban ibadah di masjid/asrama tanpa udzur syar'i.", sanction: "Surat Peringatan 1 (SP1) & Tugas hafalan surat/doa" },
    { text: "Bolos sekolah / kegiatan asrama", explanation: "Berada di asrama saat jam sekolah atau sebaliknya tanpa izin resmi.", sanction: "SP1 & Tugas sosial membersihkan fasilitas umum asrama" },
    { text: "Membawa barang elektronik non-edukasi", explanation: "Membawa HP, konsol game, atau barang terlarang ringan lainnya.", sanction: "Penyitaan barang selama 1 semester & SP1" },
    { text: "Merusak fasilitas asrama (Ringan)", explanation: "Merusak loker, kasur, engsel pintu, atau fasilitas lain akibat kelalaian.", sanction: "Ganti rugi / perbaikan mandiri & SP1" }
  ],
  3: [
    { text: "Keluar lingkungan asrama tanpa izin", explanation: "Melompati pagar atau kabur dari pengawasan pengurus asrama.", sanction: "SP2, Pemanggilan Orang Tua, & Skorsing Asrama 3 Hari" },
    { text: "Merokok atau membawa rokok/vape", explanation: "Kedapatan membawa, menyimpan, atau menghisap rokok/vape di asrama.", sanction: "SP2, Pemanggilan Orang Tua, & Skorsing Asrama 3 Hari" },
    { text: "Berkelahi sesama siswa (Ringan)", explanation: "Terlibat pertikaian fisik ringan atau adu mulut keras antar siswa.", sanction: "SP2, Pemanggilan Orang Tua, & Pembinaan BK Intensif" },
    { text: "Bullying / Perundungan Verbal", explanation: "Mengejek, mengancam, memalak, atau mengintimidasi siswa lain.", sanction: "SP2, Pemanggilan Orang Tua, & Skorsing Asrama 3 Hari" }
  ],
  4: [
    { text: "Mencuri barang milik orang lain", explanation: "Mengambil uang atau barang berharga milik siswa lain atau inventaris asrama.", sanction: "SP3 (Peringatan Akhir), Ganti rugi 2x lipat, & Skorsing 2 Minggu" },
    { text: "Membawa senjata tajam / berbahaya", explanation: "Membawa benda (pisau, celurit, dll) yang mengancam keselamatan penghuni.", sanction: "Penyitaan permanen, SP3, & Skorsing 2 Minggu" },
    { text: "Pacaran / Pelanggaran Norma Susila (Ringan)", explanation: "Berduaan dengan lawan jenis di area sepi, kontak fisik non-mahram, dll.", sanction: "SP3, Pemanggilan Orang Tua, & Skorsing 2 Minggu" },
    { text: "Bullying Fisik / Pengeroyokan", explanation: "Melakukan kekerasan fisik terencana terhadap satu atau kelompok siswa lain.", sanction: "SP3, Pemanggilan Orang Tua, & Skorsing 2 Minggu" }
  ],
  5: [
    { text: "Mengonsumsi/mengedarkan Narkoba & Miras", explanation: "Terlibat penuh atas penyalahgunaan zat adiktif dan minuman keras.", sanction: "Dikeluarkan dengan Tidak Hormat (Drop Out) & Lapor Polisi" },
    { text: "Tindak asusila berat / Pelecehan seksual", explanation: "Melakukan perbuatan asusila amoral tingkat berat di dalam/luar asrama.", sanction: "Dikeluarkan dengan Tidak Hormat (Drop Out) & Lapor Polisi" },
    { text: "Tindak kriminalitas / Pidana", explanation: "Terlibat pencurian besar, perampokan, atau tawuran massal berdarah.", sanction: "Dikeluarkan dengan Tidak Hormat (Drop Out) & Lapor Polisi" }
  ]
};

// Helper to retrieve active violation templates (custom or default)
export function getViolationTemplates(config?: AppConfig): Record<number, { text: string; explanation: string; sanction: string }[]> {
  if (config?.violationTemplatesCustom) {
    return {
      1: config.violationTemplatesCustom[1] || VIOLATION_TEMPLATES[1],
      2: config.violationTemplatesCustom[2] || VIOLATION_TEMPLATES[2],
      3: config.violationTemplatesCustom[3] || VIOLATION_TEMPLATES[3],
      4: config.violationTemplatesCustom[4] || VIOLATION_TEMPLATES[4],
      5: config.violationTemplatesCustom[5] || VIOLATION_TEMPLATES[5],
    };
  }
  return VIOLATION_TEMPLATES;
}

// Calculate student discipline score (0-100) and status based on recorded violations.
// Resets to 100 points every semester if autoResetPointsPerSemester is true.
export function calculateStudentDisciplineScore(
  studentId: string,
  violations: Violation[],
  config?: AppConfig,
  targetSemester?: 'Ganjil' | 'Genap',
  targetAcademicYear?: string,
  studentName?: string
): { score: number; status: DisciplineStatusThreshold; totalDeducted: number; violationCount: number; filteredViolations: Violation[] } {
  const sId = String(studentId).trim().toLowerCase();
  const sName = studentName ? studentName.trim().toLowerCase() : '';

  let studentViolations = violations.filter((v) => {
    const vId = v.studentId ? String(v.studentId).trim().toLowerCase() : '';
    const vName = v.studentName ? v.studentName.trim().toLowerCase() : '';
    return (vId && vId === sId) || (sName && vName && vName === sName);
  });

  const activeSemester = targetSemester || config?.semester || 'Genap';
  const activeYear = targetAcademicYear || config?.academicYear || '2025/2026';
  const shouldResetPerSemester = config?.autoResetPointsPerSemester !== false;

  if (shouldResetPerSemester) {
    studentViolations = studentViolations.filter((v) => {
      // Normalize strings for robust matching
      const vSem = v.semester ? String(v.semester).trim().toLowerCase() : '';
      const actSem = activeSemester ? String(activeSemester).trim().toLowerCase() : '';
      const semMatch = !vSem || vSem === actSem;

      const vYear = v.academicYear ? String(v.academicYear).trim().replaceAll('-', '/').toLowerCase() : '';
      const actYear = activeYear ? String(activeYear).trim().replaceAll('-', '/').toLowerCase() : '';
      const yearMatch = !vYear || vYear === actYear;

      return semMatch && yearMatch;
    });
  }

  const levels = config?.disciplineLevels || DEFAULT_DISCIPLINE_LEVELS;

  let totalDeducted = 0;
  studentViolations.forEach((v) => {
    const lvlConfig = levels.find((l) => Number(l.level) === Number(v.level));
    const deduction = lvlConfig ? Number(lvlConfig.pointsDeduction) : Number(v.level) * 10;
    totalDeducted += deduction;
  });

  const score = Math.max(0, 100 - totalDeducted);
  const thresholds = config?.disciplineThresholds || DEFAULT_DISCIPLINE_THRESHOLDS;
  const sortedThresholds = [...thresholds].sort((a, b) => b.minScore - a.minScore);
  const status = sortedThresholds.find((t) => score >= t.minScore) || sortedThresholds[sortedThresholds.length - 1];

  return {
    score,
    status,
    totalDeducted,
    violationCount: studentViolations.length,
    filteredViolations: studentViolations
  };
}

// --- Storage Helper Functions ---
export function loadAppConfig(): AppConfig {
  const saved = localStorage.getItem('sr_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.googleScriptUrl || parsed.googleScriptUrl.includes('AKfycbxY9ZA1VhD') || parsed.googleScriptUrl.includes('AKfycbyDHNJ7u3aARImefzTXq') || parsed.googleScriptUrl.includes('AKfycbwcXGzz') || parsed.googleScriptUrl.includes('AKfycbxJCN9pcsTSEq') || parsed.googleScriptUrl.includes('AKfycbzqPLLlbq7MvWG55u') || parsed.googleScriptUrl.includes('AKfycbyLuQMTdlNs5vk9-9mQIcuMx0QodSuzau2HoZI_ekbJLT6yh0qJpJYRPZEl6QFItbDF') || parsed.googleScriptUrl.includes('AKfycbwOscEltpKZ3aZP7h7-ZyzZHb-DUgZ5ZD9LxCrIMRQTscJ9cP0WKKWu5cFtOrISJXGuNA')) {
        parsed.googleScriptUrl = DEFAULT_SCRIPT_URL;
      }
      if (!parsed.waliAsuhList || parsed.waliAsuhList.some((w: string) => w.includes('Bp. Hermawan') || w.includes('Ibu Handayani'))) {
        parsed.waliAsuhList = DEFAULT_CONFIG.waliAsuhList;
      }
      if (!parsed.dormList || parsed.dormList.includes('Asrama Putra A')) {
        parsed.dormList = DEFAULT_CONFIG.dormList;
      }
      if (parsed.dormList && Array.isArray(parsed.dormList)) {
        parsed.dormList = consolidateDormList(parsed.dormList);
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_CONFIG;
}

export function saveAppConfig(config: AppConfig): void {
  const consolidatedConfig: AppConfig = {
    ...config,
    dormList: consolidateDormList(config.dormList)
  };
  localStorage.setItem('sr_config', JSON.stringify(consolidatedConfig));
  if (config.googleScriptUrl) {
    localStorage.setItem('google_script_url', config.googleScriptUrl);
  }
}

export function loadStudents(): Student[] {
  const saved = localStorage.getItem('sr_students');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(s => s && s.id && !s.name?.includes('Siswa Teladan') && !s.name?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_STUDENTS;
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem('sr_students', JSON.stringify(students));
}

export function loadViolations(): Violation[] {
  const saved = localStorage.getItem('sr_violations');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(v => v && v.id !== 'v-dummy-heavy-1' && !v.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function saveViolations(violations: Violation[]): void {
  localStorage.setItem('sr_violations', JSON.stringify(violations));
}

export function loadCounseling(): Counseling[] {
  const saved = localStorage.getItem('sr_counseling');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && !c.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function saveCounseling(counseling: Counseling[]): void {
  localStorage.setItem('sr_counseling', JSON.stringify(counseling));
}

export function loadLeaves(): Leave[] {
  const saved = localStorage.getItem('sr_leaves');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(l => l && !l.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function saveLeaves(leaves: Leave[]): void {
  localStorage.setItem('sr_leaves', JSON.stringify(leaves));
}

export function loadDailyJournals(): DailyJournal[] {
  const saved = localStorage.getItem('sr_daily_journals');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(j => j && !j.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function saveDailyJournals(journals: DailyJournal[]): void {
  localStorage.setItem('sr_daily_journals', JSON.stringify(journals));
}

export function loadReports(): Record<string, ReportCardData> {
  const saved = localStorage.getItem('sr_reports');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      console.error(e);
    }
  }
  return {};
}

export function saveReports(reports: Record<string, ReportCardData>): void {
  localStorage.setItem('sr_reports', JSON.stringify(reports));
}

export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [];

export function loadMedicalRecords(): MedicalRecord[] {
  const saved = localStorage.getItem('sr_medical_records');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(m => m && m.id && !m.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_MEDICAL_RECORDS;
}

export function saveMedicalRecords(records: MedicalRecord[]): void {
  localStorage.setItem('sr_medical_records', JSON.stringify(records));
}

/**
 * Purges all hardcoded dummy data and shadow cache from local storage.
 */
export function purgeAllDummyData(): { removedCount: number } {
  const dummyKeys = [
    'sr_students',
    'sr_violations',
    'sr_counseling',
    'sr_leaves',
    'sr_daily_journals',
    'sr_reports',
    'sr_medical_records',
    'sr_prayer_attendance',
    'sr_connecting_journals',
    'sr_menstruation_records',
    'sr_special_chronology_cases',
    'sr_dorm_inspections',
    'sr_dorm_assets',
    'sr_meeting_minutes'
  ];

  let removed = 0;
  dummyKeys.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removed++;
    }
  });

  localStorage.setItem('sr_dummy_purged_complete', 'true');
  return {
    removedCount: removed
  };
}

/**
 * Actively cleans known dummy/sample records from browser localStorage
 */
export function cleanLegacyDummyStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const filterAndSave = (key: string, isDummy: (item: any) => boolean) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(item => !isDummy(item));
        if (filtered.length === 0) {
          localStorage.removeItem(key);
        } else if (filtered.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.error(`Error cleaning ${key}:`, e);
    }
  };

  filterAndSave('sr_connecting_journals', j => ['JP-20260825-001', 'JP-20260826-002'].includes(j?.id));
  filterAndSave('sr_menstruation_records', m => ['MENS-20260824-001', 'MENS-20260821-002', 'MENS-20260818-003'].includes(m?.id));
  filterAndSave('sr_special_chronology_cases', c => c?.id === 'CASE-2026-001' || c?.violationId === 'v-dummy-heavy-1' || c?.studentName === 'ACHMAD FADILLAH');
  filterAndSave('sr_dorm_inspections', i => ['insp-1710001', 'insp-1710002'].includes(i?.id));
  filterAndSave('sr_dorm_assets', a => [
    'ASSET-PA1-001', 'ASSET-PA1-002', 'ASSET-PA1-003', 'ASSET-PA1-004',
    'ASSET-PI1-001', 'ASSET-PI1-002', 'ASSET-PI1-003'
  ].includes(a?.id));
  filterAndSave('sr_students', s => s?.name?.includes('Siswa Teladan') || s?.name?.includes('Siswa Contoh'));
  filterAndSave('sr_violations', v => v?.id === 'v-dummy-heavy-1' || v?.studentName?.includes('Siswa Contoh'));
  filterAndSave('sr_counseling', c => c?.studentName?.includes('Siswa Contoh'));
  filterAndSave('sr_leaves', l => l?.studentName?.includes('Siswa Contoh'));
  filterAndSave('sr_medical_records', m => m?.studentName?.includes('Siswa Contoh'));
  filterAndSave('sr_prayer_attendance', p => p?.studentName?.includes('Siswa Contoh'));
}

// Auto-run cleanup on module load
cleanLegacyDummyStorage();

export const INITIAL_PRAYER_ATTENDANCE: PrayerAttendance[] = [];

export function loadPrayerAttendance(): PrayerAttendance[] {
  const saved = localStorage.getItem('sr_prayer_attendance');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => p && !p.studentName?.includes('Siswa Contoh'));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_PRAYER_ATTENDANCE;
}

export function savePrayerAttendance(records: PrayerAttendance[]): void {
  localStorage.setItem('sr_prayer_attendance', JSON.stringify(records));
}

export const INITIAL_CONNECTING_JOURNALS: ConnectingJournal[] = [];

export function loadConnectingJournals(): ConnectingJournal[] {
  const saved = localStorage.getItem('sr_connecting_journals');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(j => j && !['JP-20260825-001', 'JP-20260826-002'].includes(j.id));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_CONNECTING_JOURNALS;
}

export function saveConnectingJournals(journals: ConnectingJournal[]): void {
  localStorage.setItem('sr_connecting_journals', JSON.stringify(journals));
}

export const INITIAL_MENSTRUATION_RECORDS: MenstruationRecord[] = [];

export function loadMenstruationRecords(): MenstruationRecord[] {
  const saved = localStorage.getItem('sr_menstruation_records');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(m => m && !['MENS-20260824-001', 'MENS-20260821-002', 'MENS-20260818-003'].includes(m.id));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_MENSTRUATION_RECORDS;
}

export function saveMenstruationRecords(records: MenstruationRecord[]): void {
  localStorage.setItem('sr_menstruation_records', JSON.stringify(records));
}

export function loadLastPushTime(): string | null {
  return localStorage.getItem('sr_last_push_time');
}

export function saveLastPushTime(timestamp?: string): void {
  const timeStr = timestamp || new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  localStorage.setItem('sr_last_push_time', timeStr);
}

export function loadLastSyncTime(): string | null {
  return localStorage.getItem('sr_last_sync_time');
}

export function saveLastSyncTime(isoDateString?: string): void {
  const dateStr = isoDateString || new Date().toISOString();
  localStorage.setItem('sr_last_sync_time', dateStr);
}

export function getDaysSinceLastSync(): number | null {
  const last = loadLastSyncTime();
  if (!last) return null;
  const lastDate = new Date(last).getTime();
  if (isNaN(lastDate)) return null;
  const now = Date.now();
  const diffMs = now - lastDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function saveLastIntegrityReport(report: DataIntegrityReport): void {
  try {
    localStorage.setItem('sr_last_integrity_report', JSON.stringify(report));
  } catch (e) {
    console.error('Gagal menyimpan laporan verifikasi integritas data', e);
  }
}

export function loadLastIntegrityReport(): DataIntegrityReport | null {
  try {
    const raw = localStorage.getItem('sr_last_integrity_report');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// --- Image Compression helper to prevent UI lag ---
export function compressImageFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Clears obsolete browser cache, temporary items, and optimizes localStorage usage
 */
export function clearStorageCache(): { clearedSize: string; keyCount: number } {
  let totalBytes = 0;
  let count = 0;

  const coreKeys = [
    'sr_app_config',
    'sr_students',
    'sr_violations',
    'sr_counseling',
    'sr_leaves',
    'sr_daily_journals',
    'sr_reports',
    'sr_medical_records',
    'sr_prayer_attendance',
    'sr_connecting_journals',
    'sr_menstruation_records',
    'sr_special_chronology_cases',
    'sr_last_push_time',
    'sr_last_sync_time',
    'sr_last_integrity_report',
    'sr_auth_status'
  ];

  // Remove non-core / temporary cache keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !coreKeys.includes(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    const val = localStorage.getItem(key) || '';
    totalBytes += key.length + val.length;
    localStorage.removeItem(key);
    count++;
  });

  // Calculate size of remaining core storage
  coreKeys.forEach((k) => {
    const val = localStorage.getItem(k);
    if (val) totalBytes += val.length;
  });

  const clearedKb = (totalBytes / 1024).toFixed(1);
  return { clearedSize: `${clearedKb} KB`, keyCount: count };
}

export function loadMeetingMinutes(): MeetingMinute[] {
  try {
    const saved = localStorage.getItem('sr_meeting_minutes');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load meeting minutes', error);
    return [];
  }
}

export function saveMeetingMinutes(minutes: MeetingMinute[]): void {
  localStorage.setItem('sr_meeting_minutes', JSON.stringify(minutes));
}

export const INITIAL_SPECIAL_CHRONOLOGY_CASES: SpecialChronologyCase[] = [];

export function loadSpecialChronologyCases(): SpecialChronologyCase[] {
  try {
    const saved = localStorage.getItem('sr_special_chronology_cases');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(c => c && c.id !== 'CASE-2026-001' && c.violationId !== 'v-dummy-heavy-1' && c.studentName !== 'ACHMAD FADILLAH');
  } catch (error) {
    console.error('Failed to load special chronology cases', error);
    return [];
  }
}

export function saveSpecialChronologyCases(cases: SpecialChronologyCase[]): void {
  localStorage.setItem('sr_special_chronology_cases', JSON.stringify(cases));
}

// ==========================================
// SOP PENILAIAN KEBERSIHAN & KERAPIAN ASRAMA
// ==========================================

export const DEFAULT_SOP_CRITERIA: DormInspectionCriterion[] = [
  // 1. Penataan Ranjang & Selimut (Bobot 25 Poin)
  {
    id: 'ranjang_sprei',
    category: 'ranjang_selimut',
    categoryLabel: 'Penataan Ranjang & Selimut',
    title: 'Kerapian Sprei & Kasur',
    sopStandard: 'Sprei ditarik kencang tanpa kerutan, keempat sudut diselipkan presisi ke bawah kasur, bersih bebas noda.',
    maxScore: 8
  },
  {
    id: 'ranjang_selimut',
    category: 'ranjang_selimut',
    categoryLabel: 'Penataan Ranjang & Selimut',
    title: 'Standar Lipatan Selimut SOP',
    sopStandard: 'Selimut terlipat rapi bentuk persegi presisi standar asrama/militer, diletakkan tepat di ujung ranjang/kaki kasur.',
    maxScore: 7
  },
  {
    id: 'ranjang_bantal',
    category: 'ranjang_selimut',
    categoryLabel: 'Penataan Ranjang & Selimut',
    title: 'Bantal, Guling & Sarung',
    sopStandard: 'Sarung bantal dan guling bersih, diposisikan simetris dan rapi pada kepala ranjang.',
    maxScore: 5
  },
  {
    id: 'ranjang_kolong',
    category: 'ranjang_selimut',
    categoryLabel: 'Penataan Ranjang & Selimut',
    title: 'Kebersihan Kolong Ranjang',
    sopStandard: 'Kolong ranjang bersih, tidak ada debu/sarang laba-laba, bebas tumpukan pakaian kotor atau sandal berserakan.',
    maxScore: 5
  },

  // 2. Lemari & Kebersihan Tingkatan Isi Lemari (Bobot 30 Poin)
  {
    id: 'lemari_fisik',
    category: 'lemari_isi',
    categoryLabel: 'Lemari & Tingkatan Isi',
    title: 'Kondisi Fisik Lemari Luar & Dalam',
    sopStandard: 'Pintu luar dan dalam lemari bersih, engsel baik, tidak ada stiker/coretan liar, daun pintu tertutup rapat.',
    maxScore: 5
  },
  {
    id: 'lemari_rak_atas',
    category: 'lemari_isi',
    categoryLabel: 'Lemari & Tingkatan Isi',
    title: 'Tingkat Rak Atas (Seragam Sekolah)',
    sopStandard: 'Seragam OSIS, Pramuka, Batik, dan Olahraga digantung rapi menggunakan hanger menghadap 1 arah yang seragam.',
    maxScore: 7
  },
  {
    id: 'lemari_rak_tengah',
    category: 'lemari_isi',
    categoryLabel: 'Lemari & Tingkatan Isi',
    title: 'Tingkat Rak Tengah (Pakaian Harian & Ibadah)',
    sopStandard: 'Pakaian santai harian, kaos, serta mukena/sarung/sajadah terlipat rapi presisi berjejer sesuai klasifikasinya.',
    maxScore: 7
  },
  {
    id: 'lemari_rak_bawah',
    category: 'lemari_isi',
    categoryLabel: 'Lemari & Tingkatan Isi',
    title: 'Tingkat Rak Bawah (Buku & Bebas Makanan)',
    sopStandard: 'Buku, alat tulis, perlengkapan mandi tertata rapi; DILARANG KERAS menyimpan makanan basah/sisa makanan.',
    maxScore: 6
  },
  {
    id: 'lemari_laundry',
    category: 'lemari_isi',
    categoryLabel: 'Lemari & Tingkatan Isi',
    title: 'Pemisahan Pakaian Kotor (Laundry Bag)',
    sopStandard: 'Baju kotor dimasukkan ke dalam keranjang laundry tertutup, tidak digantung atau bercampur di rak pakaian bersih.',
    maxScore: 5
  },

  // 3. Pengecekan Debu & Kebersihan Permukaan (Bobot 25 Poin)
  {
    id: 'debu_ventilasi_jendela',
    category: 'debu_permukaan',
    categoryLabel: 'Pengecekan Debu & Permukaan',
    title: 'Kebersihan Ventilasi, Kaca & Kusen Jendela',
    sopStandard: 'Jalusi ventilasi bebas sawang dan debu tebal, kaca jendela bening bebas noda, kusen dilap bersih.',
    maxScore: 7
  },
  {
    id: 'debu_meja_ambalan',
    category: 'debu_permukaan',
    categoryLabel: 'Pengecekan Debu & Permukaan',
    title: 'Bebas Debu Meja Belajar, Rak & Atas Lemari',
    sopStandard: 'Permukaan meja belajar, rak ambalan, dan bagian atas lemari dilap bersih bebas dari lapisan debu.',
    maxScore: 6
  },
  {
    id: 'debu_plafon_sudut',
    category: 'debu_permukaan',
    categoryLabel: 'Pengecekan Debu & Permukaan',
    title: 'Plafon & Sudut Ruangan Bebas Sawang',
    sopStandard: 'Langit-langit, ventilasi, dan sudut dinding bersih tanpa sarang laba-laba/sawang.',
    maxScore: 6
  },
  {
    id: 'debu_lantai_keset',
    category: 'debu_permukaan',
    categoryLabel: 'Pengecekan Debu & Permukaan',
    title: 'Kebersihan Lantai Kamar & Keset Pintu',
    sopStandard: 'Lantai disapu dan dipel bersih (wangi & tidak lengket), keset di depan pintu kamar bersih dan rata.',
    maxScore: 6
  },

  // 4. Kelengkapan & Fasilitas Asrama (Bobot 20 Poin)
  {
    id: 'fasilitas_inventaris',
    category: 'fasilitas_kelengkapan',
    categoryLabel: 'Kelengkapan & Fasilitas Asrama',
    title: 'Kelengkapan & Keutuhan Inventaris Kamar',
    sopStandard: 'Dipan ranjang, kasur, lemari, jendela, dan pintu dalam kondisi baik tanpa coretan/kerusakan fasilitas.',
    maxScore: 5
  },
  {
    id: 'fasilitas_rak_sepatu',
    category: 'fasilitas_kelengkapan',
    categoryLabel: 'Kelengkapan & Fasilitas Asrama',
    title: 'Kerapian Rak Sepatu & Sandal',
    sopStandard: 'Sepatu sekolah, sepatu olahraga, dan sandal asrama tertata lurus di rak sepatu depan kamar sesuai nomor.',
    maxScore: 5
  },
  {
    id: 'fasilitas_jemuran_handuk',
    category: 'fasilitas_kelengkapan',
    categoryLabel: 'Kelengkapan & Fasilitas Asrama',
    title: 'Penataan Handuk & Jemuran Basah',
    sopStandard: 'Handuk basah dijemur di jemuran luar, dilarang menumpuk atau menggantung handuk basah di kasur/lemari.',
    maxScore: 5
  },
  {
    id: 'fasilitas_sampah_listrik',
    category: 'fasilitas_kelengkapan',
    categoryLabel: 'Kelengkapan & Fasilitas Asrama',
    title: 'Tempat Sampah & Keamanan Kelistrikan',
    sopStandard: 'Tempat sampah kamar dikosongkan sebelum beraktivitas, lampu berfungsi normal, tidak ada colokan/kabel liar.',
    maxScore: 5
  }
];

export function calculateDormScore(items: { maxScore: number; score: number }[]): {
  totalScore: number;
  grade: DormGrade;
  gradeLabel: string;
} {
  const totalScore = Math.round(items.reduce((acc, curr) => acc + (curr.score || 0), 0));
  let grade: DormGrade = 'D';
  let gradeLabel = 'Kurang / Wajib Piket Ulang & Pembinaan';

  if (totalScore >= 86) {
    grade = 'A';
    gradeLabel = 'Sangat Baik / Sangat Bersih & Memenuhi SOP';
  } else if (totalScore >= 71) {
    grade = 'B';
    gradeLabel = 'Baik / Rapi & Bersih (Catatan Minor)';
  } else if (totalScore >= 56) {
    grade = 'C';
    gradeLabel = 'Cukup / Perlu Perbaikan & Tindak Lanjut';
  } else {
    grade = 'D';
    gradeLabel = 'Kurang / Tidak Memenuhi SOP (Piket Ulang)';
  }

  return { totalScore, grade, gradeLabel };
}

export function getDefaultDormInspectionItems(): DormInspectionItemScore[] {
  return DEFAULT_SOP_CRITERIA.map((criterion) => ({
    criterionId: criterion.id,
    category: criterion.category,
    title: criterion.title,
    sopStandard: criterion.sopStandard,
    maxScore: criterion.maxScore,
    score: criterion.maxScore, // default full score for fast check
    isCompliant: true,
    notes: ''
  }));
}

export const INITIAL_DORM_INSPECTIONS: DormInspection[] = [];

export function loadDormInspections(): DormInspection[] {
  try {
    const saved = localStorage.getItem('sr_dorm_inspections');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(i => i && !['insp-1710001', 'insp-1710002'].includes(i.id));
  } catch (error) {
    console.error('Failed to load dorm inspections', error);
    return [];
  }
}

export function saveDormInspections(inspections: DormInspection[]): void {
  localStorage.setItem('sr_dorm_inspections', JSON.stringify(inspections));
}

export const INITIAL_DORM_ASSETS: DormAsset[] = [];

export function loadDormAssets(): DormAsset[] {
  try {
    const saved = localStorage.getItem('sr_dorm_assets');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    const dummyAssetIds = [
      'ASSET-PA1-001', 'ASSET-PA1-002', 'ASSET-PA1-003', 'ASSET-PA1-004',
      'ASSET-PI1-001', 'ASSET-PI1-002', 'ASSET-PI1-003'
    ];
    return parsed.filter(a => a && !dummyAssetIds.includes(a.id));
  } catch (error) {
    console.error('Failed to load dorm assets', error);
    return [];
  }
}

export function saveDormAssets(assets: DormAsset[]): void {
  localStorage.setItem('sr_dorm_assets', JSON.stringify(assets));
}

export const INITIAL_PSYCHOLOGICAL_ASSESSMENTS: PsychologicalAssessment[] = [];

export function loadPsychologicalAssessments(): PsychologicalAssessment[] {
  try {
    const saved = localStorage.getItem('sr_psychological_assessments');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(p => p && p.id);
  } catch (error) {
    console.error('Failed to load psychological assessments', error);
    return [];
  }
}

export function savePsychologicalAssessments(assessments: PsychologicalAssessment[]): void {
  localStorage.setItem('sr_psychological_assessments', JSON.stringify(assessments));
}


