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
  returnDate: string;
  caretaker: string;
  status: 'Active' | 'Returned';
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
}
