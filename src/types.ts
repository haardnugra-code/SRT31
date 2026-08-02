export type ClassLevel = 'SD' | 'SMP' | 'SMA';

export interface Student {
  id: string; // NISN or Registration ID
  name: string;
  class: ClassLevel;
  dorm: string;
  caretaker: string;
  violationCount?: number;
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

export interface Counseling {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  counselor: string;
  caseDescription: string;
  notes: string;
  followUp: string;
  status: 'Open' | 'In Progress' | 'Resolved';
}

export interface Leave {
  id: string;
  studentId: string;
  studentName: string;
  type: 'Reguler' | 'Khusus' | 'Darurat';
  reason: string;
  leaveDate: string;
  leaveTime?: string;
  returnDate: string;
  returnTime?: string;
  destinationAddress?: string;
  parentContact?: string;
  pickupPerson?: string;
  caretaker: string;
  caretakerNip?: string;
  dormMaster?: string;
  dormMasterNip?: string;
  status: 'Active' | 'Returned';
  letterNumber?: string;
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
