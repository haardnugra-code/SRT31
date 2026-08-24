export type ClassLevel = 'SD' | 'SMP' | 'SMA';

export interface Student {
  id: string; // NISN or Registration ID
  rfidTag?: string; // Optional RFID / NFC Tag UID (e.g. 1029384756 or 04:A2:3B:8C)
  name: string;
  class: ClassLevel;
  dorm: string;
  caretaker: string;
  violationCount?: number;
  height?: number; // Tinggi badan (cm)
  weight?: number; // Berat badan (kg)
  shirtSize?: string; // Ukuran Baju (e.g. S, M, L, XL, XXL)
  pantsSize?: string; // Ukuran Celana (e.g. 28, 29, 30, M, L, XL)
  photo?: string; // Base64 data URL or image URL for student profile avatar
  gender?: 'L' | 'P' | 'Laki-Laki' | 'Perempuan';
  birthDate?: string;
  birthPlace?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  bloodType?: string;
}

export interface ViolationTemplate {
  text: string;
  explanation: string;
  sanction: string;
}

export interface Violation {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  level: number; // 1 to 5
  violation: string;
  sanction: string;
  note: string;
  reporter: string;
  photo?: string; // compressed base64 or URL
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string;
}

export type CounselingField =
  | 'Pribadi'
  | 'Sosial'
  | 'Belajar / Akademik'
  | 'Karir / Masa Depan'
  | 'Kedisiplinan & Tata Tertib'
  | 'Keluarga / Hubungan Orang Tua'
  | 'Kesehatan Mental & Emosi'
  | string;

export type CounselingType =
  | 'Konseling Individu'
  | 'Bimbingan Kelompok'
  | 'Konseling Kelompok'
  | 'Konsultasi / Mediasi'
  | 'Konferensi Kasus (Case Conference)'
  | 'Kunjungan Rumah (Home Visit)'
  | 'Advokasi & Pendampingan'
  | string;

export type CounselingUrgency = 'Rutin' | 'Perhatian Khusus' | 'Mendesak / Darurat';

export type CounselingStatus = 'Open' | 'In Progress' | 'Resolved' | 'Referred';

export interface Counseling {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time?: string;
  sessionNumber?: number;
  location?: string;
  counselor: string;
  counselorNip?: string;
  accompanyingPerson?: string; // e.g. Wali Asuh / Wali Kelas / Orang Tua
  counselingType?: CounselingType;
  counselingField?: CounselingField;
  urgencyLevel?: CounselingUrgency;
  confidentiality?: 'Rahasia' | 'Terbatas' | 'Terbuka';
  caseDescription: string;
  backgroundAnalysis?: string; // Latar Belakang / Faktor Pemicu Masalah
  counselingApproach?: string; // Teknik / Pendekatan Konseling (CBT, WDEP, Humanistik, dll)
  studentObservation?: string; // Observasi Sikap / Bahasa Tubuh Siswa
  notes: string; // Hasil Pembinaan & Dinamika Sesi
  studentCommitment?: string; // Janji / Komitmen Peserta Didik
  followUp: string; // Rencana Tindak Lanjut (RTL)
  targetReviewDate?: string; // Target Tanggal Evaluasi Lanjutan
  recommendations?: string; // Rekomendasi untuk Wali Asuh / Orang Tua
  status: CounselingStatus;
  referralDetails?: string; // Keterangan jika dirujuk ke pihak luar/psikolog
}

export type LeaveCategory =
  | 'Izin Keluar Sementara'
  | 'Izin Keluar'
  | 'Izin Keluar / Pesiar'
  | 'Izin Berobat'
  | 'Izin Pulang / Bermalam'
  | 'Izin Tugas / Delegasi';

export type LeaveType = 'Reguler' | 'Khusus' | 'Darurat' | 'Sementara' | 'Izin Keluar' | 'Berobat' | 'Tugas' | 'Pesiar';

export interface Leave {
  id: string;
  studentId: string;
  studentName: string;
  category?: LeaveCategory;
  type: LeaveType;
  reason: string;
  leaveDate: string;
  leaveTime?: string;
  returnDate: string;
  returnTime?: string;
  actualReturnTimestamp?: string;
  destinationAddress?: string;
  parentContact?: string;
  pickupPerson?: string;
  securityOfficer?: string;
  caretaker: string;
  caretakerNip?: string;
  dormMaster?: string;
  dormMasterNip?: string;
  status: 'Active' | 'Returned';
  letterNumber?: string;
  notes?: string;
}

export interface TaskItem {
  id: number;
  task: string;
}

export interface TaskSnapshot {
  task: string;
  done: boolean;
}

export interface DailyJournal {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  timeRange: string;
  tasksCompleted: number;
  totalTasks: number;
  notes: string;
  tasksSnapshot: TaskSnapshot[];
}

export interface MedicalRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location: 'UKS Asrama' | 'Klinik / RS Rujukan' | 'Istirahat di Kamar' | 'Klinik Sekolah';
  symptoms: string; // Gejala / Keluhan Utama
  diagnosis: string; // Diagnosa / Hasil Pemeriksaan
  treatment: string; // Tindakan & Obat
  restDays: number; // Jumlah hari izin sakit UKS
  isSickLeave: boolean; // Apakah ada surat izin sakit
  status: 'Dalam Perawatan' | 'Istirahat di Kamar' | 'Dirujuk ke RS/Klinik' | 'Sembuh / Kembali Sekolah';
  officer: string; // Petugas Medis / Pembina UKS
  temperature?: string; // Suhu Tubuh (e.g. 38.2°C)
  vitalSigns?: string; // Tensi / Nadi (e.g. 110/70 mmHg)
  notes?: string;
  height?: number; // Tinggi badan saat diperiksa (cm)
  weight?: number; // Berat badan saat diperiksa (kg)
  customWaliAsrama?: string;
  customWaliAsramaNip?: string;
}

export type AttendanceSession =
  | 'Subuh'
  | 'Dhuha'
  | 'Dzuhur'
  | 'Ashar'
  | 'Maghrib'
  | 'Isya'
  | 'Tahajjud / Qiyamul Lail'
  | 'Sarapan Pagi'
  | 'Makan Siang'
  | 'Makan Malam'
  | 'Sahur'
  | 'Buka Puasa'
  | 'Snack / Ekstra Gizi'
  | 'Kajian / Kegiatan'
  | 'Apel / Baris Asrama'
  | 'Kebersihan / Ro\'an'
  | string;

export interface PrayerAttendance {
  id: string;
  studentId: string;
  studentName: string;
  class: ClassLevel;
  dorm: string;
  prayerTime: AttendanceSession;
  sessionCategory?: 'Sholat' | 'Makan' | 'Kegiatan';
  date: string; // YYYY-MM-DD
  timestamp: string; // HH:mm:ss
  status: 'Hadir' | 'Izin Sakit' | 'Izin Pulang' | 'Terlambat' | 'Alpa / Tanpa Keterangan';
  note?: string;
  scannedBy?: string;
}

export interface ReportCategory {
  key: string;
  name: string;
  indicators: string[];
}

export interface ReportCardData {
  grades: Record<string, string>;
  descriptions: Record<string, string>;
  specialNote: string;
  customCaretaker: string;
  customCaretakerNip: string;
  customWaliAsrama?: string;
  customWaliAsramaNip?: string;
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string;
  includeCounseling?: boolean;
  includeMedical?: boolean;
}

export interface DisciplineLevelConfig {
  level: number;
  name: string;
  pointsDeduction: number;
  defaultSanction: string;
}

export interface DisciplineStatusThreshold {
  minScore: number;
  label: string;
  badgeColor: string; // 'emerald' | 'blue' | 'amber' | 'rose' | 'red'
  description: string;
}

export interface ViolationTemplateItem {
  id?: string;
  text: string;
  explanation: string;
  sanction: string;
}

export interface AppConfig {
  googleScriptUrl: string;
  waliAsrama: string;
  waliAsramaNip: string;
  waliAsramaTitle?: string;
  kepalaSekolah: string;
  kepalaSekolahNip: string;
  kopKiri: string;
  kopKanan: string;
  waliAsuhList: string[];
  dormList: string[];
  logoKiriUrl: string;
  logoKananUrl: string;
  watermarkOpacity: number;
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string;
  disciplineLevels?: DisciplineLevelConfig[];
  violationTemplatesCustom?: Record<number, ViolationTemplateItem[]>;
  disciplineThresholds?: DisciplineStatusThreshold[];
  raporStructureCustom?: ReportCategory[];
  autoResetPointsPerSemester?: boolean;
}

export interface ParentSummonsOptions {
  letterNumber?: string;
  summonsLevel?: 'Panggilan I (SP-1)' | 'Panggilan II (SP-2)' | 'Panggilan III (SP-3)' | 'Panggilan Khusus / Klarifikasi' | string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // e.g. "09:00 WIB s.d. Selesai"
  meetingPlace: string; // e.g. "Ruang Bimbingan & Konseling (BK) / Kantor Pengelola Asrama"
  meetingWith: string; // e.g. "Tim Disiplin Keasramaan, Guru BK, & Wali Asrama Mandiri"
  agenda: string; // e.g. "Pembahasan Pelanggaran Tata Tertib & Bimbingan Khusus Peserta Didik"
  specialNotes?: string;
  parentName?: string;
  signatoryTitle?: string;
  signatoryName?: string;
  signatoryNip?: string;
  headTitle?: string;
  headName?: string;
  headNip?: string;
  includeViolationHistory?: boolean;
}
