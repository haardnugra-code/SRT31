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
  createdAt?: string;
  updatedAt?: string;
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

export interface ConnectingJournal {
  id: string;
  date: string; // YYYY-MM-DD
  targetClass: string; // e.g. "Klasikal (SD)", "Kelas 5 SD", "Asrama Dewantara"
  studentId?: string;
  studentName?: string;
  subject: string; // e.g. "Pend. Agama Islam", "Matematika", "Bahasa Indonesia"
  teacherName: string; // e.g. "ARI FITRIYANI, S.PD., GR."
  teacherNip?: string;
  learningAchievement: string; // Capaian materi / Instruksi tugas pembelajaran
  taskOrder?: string; // Penugasan khusus pendampingan asrama
  deadline?: string;
  followUp?: string; // Respon / Tindak lanjut dari Wali Asuh di asrama
  caretakerName?: string; // Nama Wali Asuh yang merespon
  caretakerNip?: string;
  responseDate?: string;
  status: 'Menunggu Respon' | 'Sudah Ditindaklanjuti';
  notes?: string;
}

export type MenstruationStatus =
  | 'Sedang Haid'
  | 'Masa Bersuci'
  | 'Suci / Siap Beribadah'
  | 'Istihadhah (Perlu Perhatian)';

export interface MenstruationRecord {
  id: string;
  studentId: string;
  studentName: string;
  class?: ClassLevel;
  dorm?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string; // YYYY-MM-DD (saat darah berhenti)
  endTime?: string; // HH:mm
  durationDays?: number; // Jumlah total hari haid (misal: 6 atau 6.5)
  durationText?: string; // Keterangan waktu (misal: "6 Hari 4 Jam")
  purificationDate?: string; // Tanggal Mandi Wajib / Bersuci (YYYY-MM-DD)
  purificationTime?: string; // Jam Mandi Wajib (HH:mm)
  purificationVerifiedBy?: string; // Nama Pembina Asrama Putri / Guru Pembina
  status: MenstruationStatus;
  symptoms?: string[]; // Keluhan (Disminore, Pusing, Mual, Moody, dll)
  painLevel?: number; // 1-5 (Skala Nyeri)
  medicineOrCare?: string; // Tindakan/Obat UKS (Kompres hangat, Istirahat, Paracetamol, dll)
  sanitaryPadsProvided?: number; // Jumlah pembalut yang diberikan
  readyForWorshipDate?: string; // Waktu konfirmasi siap sholat & mengaji
  notes?: string; // Catatan tambahan pembina/wali asuh
  recordedBy?: string; // Nama Pencatat / Pembina
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
  enableSpecialChronology?: boolean;
}

export type ShiftType =
  | 'Shift Pagi (06.00 - 14.00)'
  | 'Shift Siang / Sore (14.00 - 21.00)'
  | 'Shift Siang (14.00 - 22.00)'
  | 'Shift Malam / Dini Hari (21.00 - 06.00)'
  | 'Shift Malam (22.00 - 06.00)'
  | string;

export type ClinicalRiskLevel =
  | 'Rendah (Aman)'
  | 'Sedang (Perlu Pengawasan)'
  | 'Tinggi (Eskalasi / Re-offense Risk)'
  | 'Kritis (Bahaya Langsung / Rujukan)';

export type ShiftPriority = 'Biasa' | 'Perhatian' | 'Mendesak';
export type ShiftHandoverStatus = 'Perlu Tindak Lanjut' | 'Selesai / Diterima';

export type SpecialCaseSeverity =
  | 'Tinggi (High Risk)'
  | 'Kritis (Severe / Crisis)'
  | 'Investigasi Khusus'
  | ShiftPriority;

export type SpecialCaseStatus =
  | 'Dalam Pemantauan Intensif'
  | 'Observasi Stabil'
  | 'Menunggu Sidang Keasramaan'
  | 'Rujukan Psikiater / Faskes Luar'
  | 'Selesai / Resolusi'
  | ShiftHandoverStatus;

export interface SpecialShiftLog {
  id: string;
  shift: ShiftType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  officerName: string;
  officerRole?: string;
  
  // Catatan & Handover
  incidentDetails?: string;
  handoverNotes: string; // Instruksi khusus untuk petugas shift berikutnya
  
  // Opsional bidang klinis lama jika ada data lama
  appearanceAndMotor?: string;
  moodAndAffect?: string;
  speechAndThoughtPattern?: string;
  orientationAndConsciousness?: string;
  triggerFactors?: string;
  emotionalRegulation?: string;
  defenseMechanisms?: string;
  riskLevel?: ClinicalRiskLevel;
  riskNotes?: string;
  interventionTechnique?: string;
  studentResponse?: string;
}

export interface SpecialChronologyCase {
  id: string;
  violationId?: string; // Tautan ke ID Pelanggaran jika ada
  studentId?: string;
  studentName?: string;
  class?: string;
  dorm?: string;
  caseTitle: string; // Judul Kejadian / Pokok Bahasan
  incidentDate: string; // Tanggal insiden / shift
  incidentTime?: string; // Waktu kejadian / shift (HH:mm)
  shiftType?: string; // Shift Pagi, Shift Siang, Shift Malam
  caseCategory?: string; // Kategori Kejadian (Kedisiplinan, Kesehatan, Fasilitas, dll.)
  caseSeverity?: SpecialCaseSeverity | string; // Prioritas: Biasa / Perhatian / Mendesak
  status?: SpecialCaseStatus | string; // Status: Perlu Tindak Lanjut / Selesai / Diterima
  primaryInvestigator: string; // Petugas Jaga Shift (yang menyerahkan)
  incomingOfficer?: string; // Petugas Shift Penerima
  initialAssessmentSummary: string; // Uraian Kejadian / Kondisi Selama Shift
  handoverNotes?: string; // Tugas / Hal yang di-handover ke shift berikutnya
  shifts?: SpecialShiftLog[];
  createdAt?: string;
  updatedAt?: string;
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

export type MeetingStatus = 'draft' | 'published';

export interface MeetingAttendee {
  id: string;
  name: string;
  isPresent: boolean;
}

export interface MeetingMinute {
  id: string;
  agenda: string;
  date: string;
  time: string;
  location: string;
  leader: string;
  attendees: MeetingAttendee[];
  decisions: string;
  status: MeetingStatus;
  createdAt: number;
  updatedAt: number;
}

export type DormInspectionCategoryKey =
  | 'ranjang_selimut'
  | 'lemari_isi'
  | 'debu_permukaan'
  | 'fasilitas_kelengkapan';

export interface DormInspectionCriterion {
  id: string;
  category: DormInspectionCategoryKey;
  categoryLabel: string;
  title: string;
  sopStandard: string;
  maxScore: number;
}

export interface DormInspectionItemScore {
  criterionId: string;
  category: DormInspectionCategoryKey;
  title: string;
  sopStandard: string;
  maxScore: number;
  score: number;
  isCompliant: boolean;
  notes?: string;
}

export type DormGrade = 'A' | 'B' | 'C' | 'D';

export type DormActionRequired =
  | 'Lulus Standar SOP'
  | 'Pemberian Apresiasi / Bintang Kamar'
  | 'Pemberitahuan & Rapikan Mandiri'
  | 'Piket Ulang Sore Ini'
  | 'Pembinaan Khusus Wali Asuh'
  | 'Perbaikan Kerusakan Fasilitas';

export interface DormInspection {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dorm: string; // e.g. "Asrama Dewantara"
  roomNumber: string; // e.g. "Kamar 01" / "Kamar 02"
  inspectionType:
    | 'Inspeksi Rutin Pagi'
    | 'Sidak Kerapian & Kebersihan'
    | 'Inspeksi Mingguan (Ro\'an Asrama)'
    | 'Evaluasi Bulanan Kamar';
  inspectorName: string;
  inspectorRole?: string;
  inspectorNip?: string;
  roomLeaderName?: string;
  studentNamesInRoom?: string; // e.g. "Ahmad, Budi, Dimas, Farhan"
  items: DormInspectionItemScore[];
  totalScore: number; // 0 - 100
  grade: DormGrade;
  gradeLabel: string;
  findings?: string; // Catatan temuan khusus (misal: pakaian kotor diselip di rak, debu kusen)
  actionRequired: DormActionRequired;
  actionDeadline?: string;
  actionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DormAssetCategory =
  | 'Tempat Tidur & Kasur'
  | 'Lemari & Locker'
  | 'Meja & Kursi Belajar'
  | 'Elektronik & Kelistrikan'
  | 'Sanitasi & Alat Kebersihan'
  | 'Sarana Kamar & Bangunan'
  | 'Lainnya';

export type DormAssetDamageSeverity = 'tidak_ada' | 'ringan' | 'sedang' | 'berat';

export type DormAssetActionPlan =
  | 'Siap Digunakan (Layak)'
  | 'Perbaikan Mandiri Asrama'
  | 'Pengajuan Servis/Tukang Sarpras'
  | 'Pengajuan Penggantian Baru'
  | 'Penghapusan / Afkir Aset'
  | 'Sedang Dalam Perbaikan';

export interface DormAsset {
  id: string;
  assetCode?: string; // Kode Registrasi / NIB Instansi (e.g. BMN-ASR/PA1/2026/001)
  dormName: string; // Nama Gedung / Asrama (Manual & Fleksibel, e.g. "Gedung Asrama Putra I (Wisma Dewantara)")
  buildingBlock?: string; // Blok / Lantai (e.g. "Lantai 1", "Sayap Barat", "Blok A")
  roomNumber: string; // e.g. "Kamar 01", "Kamar 102", "Area Bersama Asrama"
  itemName: string; // e.g. "Ranjang / Dipan Susun Besi", "Kasur Busa Inoac"
  brandSpec?: string; // Merk / Spesifikasi Teknis Fisik BMN
  category: DormAssetCategory;
  procurementYear?: string; // Tahun Pengadaan / Perolehan (misal: "2025", "2026")
  fundingSource?: string; // Sumber Anggaran (e.g. "DIPA Kemensos RI", "APBN", "BOS Rakyat")
  totalQuantity: number; // e.g. ranjang jumlah berapa
  goodQuantity: number; // kondisi baik berapa
  damagedQuantity: number; // rusak berapa
  damageSeverity: DormAssetDamageSeverity; // tingkat kerusakan
  damageStatus: string; // status rusak apa (rincian deskripsi kerusakan)
  gdriveLink?: string; // link gdrive untuk foto dokumentasi kerusakan / kartu inventaris
  notes?: string; // catatan tambahan
  actionPlan: DormAssetActionPlan; // rencana tindak lanjut
  inspectorName: string; // petugas pendata / wali asuh
  inspectionDate: string; // tanggal pendataan (YYYY-MM-DD)
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// ASESMEN PSIKOLOGI & TUMBUH KEMBANG KEJIWAAN ANAK
// ==========================================

export type PsychologicalTestType =
  | 'sdq_25' // Strengths and Difficulties Questionnaire
  | 'resilience_growth_20' // Skala Tumbuh Kembang & Resiliensi Jiwa Siswa
  | 'mmpi_tni_polri'; // Tes Inventori Kepribadian MMPI (Adaptasi Seleksi TNI/POLRI)

export type PsychologicalClinicalStatus = 'normal' | 'borderline' | 'abnormal';

export interface PsychologicalDimensionScore {
  dimensionKey: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  status: PsychologicalClinicalStatus;
  statusLabel: string;
  clinicalInterpretation: string;
  isStrengthScale?: boolean; // e.g. Prososial atau Resiliensi (skor tinggi = semakin baik)
}

export interface PsychologicalAssessment {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentDorm: string;
  testType: PsychologicalTestType;
  testTitle: string;
  date: string; // YYYY-MM-DD
  time?: string;
  answers: Record<string, number>; // questionId -> score (0, 1, 2, dll)
  totalScore: number;
  overallStatus: PsychologicalClinicalStatus;
  overallStatusLabel: string;
  dimensionScores: Record<string, PsychologicalDimensionScore>;
  psychologicalConsiderations: string[]; // Rangkuman pertimbangan kejiwaan anak
  developmentalInsights: string; // Tumbuh kembang anak & kematangan psikologis
  prosocialStrengths: string[]; // Kekuatan & faktor protektif anak
  riskFactors: string[]; // Area kerentanan kejiwaan atau risiko perilaku
  recommendations: {
    forCaretaker: string[]; // Untuk Wali Asuh di Asrama
    forTeacher: string[]; // Untuk Guru Pengampu di Kelas
    forCounselor: string[]; // Untuk Guru BK / Pendamping Khusus
    referralAdvice?: string; // Saran jika perlu rujukan ke psikolog/psikiater
  };
  filledBy: 'student' | 'counselor_with_student';
  assessorName: string; // Nama siswa sendiri atau nama wali asuh pendamping
  notes?: string;
  referredToCounseling?: boolean; // Flag apakah sudah ditindaklanjuti ke sesi BK
  counselingSessionId?: string;
  createdAt: string;
}

// --- OFFICIAL LETTER GENERATOR & CARETAKER ADMINISTRATION TYPES ---

export type OfficialLetterType =
  | 'kronologi_kasus_psikologi'
  | 'permohonan'
  | 'pengajuan_barang'
  | 'izin_kerja_staf'
  | 'undangan_ortu'
  | 'pernyataan_siswa'
  | 'keterangan_baik'
  | 'rujukan_medis_psikologis'
  | 'surat_bebas';

export interface LetterSupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  urgency: 'Sangat Mendesak' | 'Mendesak' | 'Rutin / Cadangan';
  reason: string;
}

export interface OfficialLetter {
  id: string;
  letterType: OfficialLetterType;
  letterNumber: string;
  letterTitle: string;
  letterDate: string; // YYYY-MM-DD
  letterCity: string;
  
  // Penerima / Tujuan
  recipientName: string;
  recipientTitle?: string;
  recipientOffice?: string;
  recipientAddress?: string;

  // Pemohon / Pembuat Surat (Wali Asuh / Staf)
  authorName: string;
  authorNipOrId?: string;
  authorRole: string; // e.g., 'Wali Asuh Asrama Putra', 'Wali Asuh Mandiri'
  authorPhone?: string;

  // Terkait Siswa (Opsional / untuk kronologi / izin / pernyataan)
  studentId?: string;
  studentName?: string;
  studentClass?: string;
  studentDorm?: string;
  studentNisn?: string;
  studentBirthDate?: string;
  studentParentName?: string;
  studentParentPhone?: string;

  // Konten Khusus Kasus & Teori Psikologi
  incidentDate?: string;
  incidentLocation?: string;
  problemSummary?: string; // Ringkasan Masalah & Gejala Perilaku
  psychologyTheoryName?: string; // e.g. "Teori Perkembangan Psikososial Erik Erikson"
  psychologyTheoryAnalysis?: string; // Uraian Teori Psikologis & Dinamika Mental Siswa
  actionsTaken?: string; // Tindakan yang telah dilakukan
  followUpActions?: string; // Upaya & rekomendasi yang akan dilakukan

  // Konten Khusus Pengajuan Barang
  supplyItems?: LetterSupplyItem[];
  supplyTotalEstimatedCost?: number;
  supplyPurpose?: string;

  // Konten Khusus Izin Tidak Masuk Kerja
  leaveType?: 'Sakit' | 'Keperluan Keluarga' | 'Cuti / Urusan Pribadi' | 'Dinas Luar / Pelatihan';
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveTotalDays?: number;
  leaveReason?: string;
  leaveHandoverStaff?: string; // Petugas pengganti piket

  // Konten Umum / Narasi Surat
  subject: string; // Perihal
  enclosure?: string; // Lampiran (e.g., "1 Berkas", "-")
  bodyIntro?: string;
  bodyMain?: string;
  bodyClosing?: string;

  // Pejabat Penandatangan & Mengetahui
  signPlaceAndDate?: string;
  signatureAuthorLabel?: string; // e.g. "Wali Asuh Asrama"
  acknowledgementName?: string; // e.g. "HISNUL HASHIN, SE"
  acknowledgementNip?: string;
  acknowledgementTitle?: string; // e.g. "Wali Asrama Mandiri"
  approvalName?: string; // e.g. "YUNI ARSI, S.Pd"
  approvalNip?: string;
  approvalTitle?: string; // e.g. "Kepala Sekolah Rakyat 31"

  createdAt: string;
  updatedAt?: string;
}


