import { Student, Violation, Counseling, Leave, DailyJournal, ReportCardData, AppConfig, TaskItem, MedicalRecord, DisciplineLevelConfig, DisciplineStatusThreshold, ViolationTemplateItem, PrayerAttendance } from '../types';

export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqPLLlbq7MvWG55u-_s3sg9SFXzKw7-Q5aX5XMp-qE0iFLrg9Qjr0pg6LMgEc9JRWB/exec";

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
  kepalaSekolah: "YUNI ARSI, S.Pd",
  kepalaSekolahNip: "197206051999032002",
  kopKiri: "KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nSEKRETARIAT JENDERAL\nPUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI",
  kopKanan: "SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG\nJl. Komp Sosial Km 5 Sukabangun\nTlp: (0711) 313131 / Palembang",
  waliAsuhList: ["M. ARDIAN NUGRAHA, S.H|NIP. 199202042026221001", "Bp. Hermawan|NIP. 198005122010121001", "Ibu Handayani|NIP. 198509152014032003", "Ibu Rahmawati, S.Psi.|NIP. 198801122015032002", "Bp. Rudy|NIP. 197904102008011005"],
  dormList: ["Asrama Terpadu", "Asrama Putra A", "Asrama Putra B", "Asrama Putri C"],
  logoKiriUrl: "https://lh3.googleusercontent.com/d/1m4voglUO4iLNJ1Pz-ygtKbYstpCwOhOJ",
  logoKananUrl: "https://lh3.googleusercontent.com/d/1rNFA7Zb_jx0c8yAX0gisbzH-EjdoNGtg",
  watermarkOpacity: 0.04,
  semester: 'Genap',
  academicYear: '2025/2026',
  disciplineLevels: DEFAULT_DISCIPLINE_LEVELS,
  disciplineThresholds: DEFAULT_DISCIPLINE_THRESHOLDS,
  autoResetPointsPerSemester: true
};

export const INITIAL_STUDENTS: Student[] = [
  { id: "SR0001", name: "A Rakka Attala", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 142, weight: 36, shirtSize: "M", pantsSize: "28" },
  { id: "SR0002", name: "Abdul Wahid", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 138, weight: 33, shirtSize: "S", pantsSize: "27" },
  { id: "SR0003", name: "Ade Rizki Cahya", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 145, weight: 38, shirtSize: "M", pantsSize: "29" },
  { id: "SR0004", name: "Al Fatih Al Farizi", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 140, weight: 35, shirtSize: "S", pantsSize: "28" },
  { id: "SR0005", name: "M Fahri", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 146, weight: 40, shirtSize: "M", pantsSize: "29" },
  { id: "SR0006", name: "M Farrel", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 143, weight: 37, shirtSize: "M", pantsSize: "28" },
  { id: "SR0007", name: "M Firmansyah", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 148, weight: 41, shirtSize: "L", pantsSize: "30" },
  { id: "SR0008", name: "M. Alvin", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 139, weight: 34, shirtSize: "S", pantsSize: "27" },
  { id: "SR0009", name: "M. Fatir Alfareza", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 144, weight: 37, shirtSize: "M", pantsSize: "28" },
  { id: "SR0010", name: "M. Syahrul Romadon", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 150, weight: 42, shirtSize: "L", pantsSize: "30" },
  { id: "SR0011", name: "M.Aditya", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 141, weight: 35, shirtSize: "S", pantsSize: "28" },
  { id: "SR0012", name: "Muhamad Fauzan", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 147, weight: 39, shirtSize: "M", pantsSize: "29" },
  { id: "SR0013", name: "Muhammad Reza", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 145, weight: 38, shirtSize: "M", pantsSize: "29" },
  { id: "SR0014", name: "Nur Reva Anugrah Putri", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 137, weight: 32, shirtSize: "S", pantsSize: "S" },
  { id: "SR0015", name: "Nur Rivi Anugrah Putri", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 136, weight: 31, shirtSize: "S", pantsSize: "S" },
  { id: "SR0016", name: "Reski Al Farizi", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 143, weight: 36, shirtSize: "M", pantsSize: "28" },
  { id: "SR0017", name: "Rizki Abdulah", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 149, weight: 40, shirtSize: "M", pantsSize: "29" },
  { id: "SR0018", name: "Sella Marselina", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 140, weight: 34, shirtSize: "S", pantsSize: "S" },
  { id: "SR0019", name: "Yeni Inda Sari", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H", height: 142, weight: 35, shirtSize: "M", pantsSize: "M" },
  { id: "SR0020", name: "SHINTYAH ANGGRAENI", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0021", name: "MUHAMMAD REZKY RAMADHAN", class: "SD", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0022", name: "Adriansya Khoirul Khafi", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0023", name: "Aira Saputri", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0024", name: "Aldo Ardiansyah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0025", name: "Amel", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0026", name: "Ardiansyah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0027", name: "Fatma Fauzia", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0028", name: "Imel", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0029", name: "Imelda Susanti", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0030", name: "Lesi", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0031", name: "M. Aqil Abdul Rasyid", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0032", name: "M Badril Munir", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0033", name: "M Jessen Pratama", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0034", name: "M. Richad Rivaldo", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0035", name: "M.Daffa Saputra", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0036", name: "Mirza Mushthafa Mahdi", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0037", name: "Muhamad Ferdiansyah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0038", name: "Muhamad Vernando Agustian", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0039", name: "Nabilla", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0040", name: "Puspa Lestari", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0041", name: "Puspita Sari", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0042", name: "Putri", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0043", name: "Putri Septiani", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0044", name: "Siti Fadila", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0045", name: "Abdi Putra Anggara", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0046", name: "Achmad Rizky Kurniawan", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0047", name: "An - Anissa Maulidya Ningsih", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0048", name: "Bagus Ramadhan", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0049", name: "Junian Gunhar", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0050", name: "Kevin", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0051", name: "Muhamat Ridhowan", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0052", name: "Muhammad Iqbal", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0053", name: "Muhammad Rava Oktardi", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0054", name: "Muhammad Yogie Prananda", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0055", name: "Purwadi", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0056", name: "Rahman Firly Afriansyah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0057", name: "Reni Mustika Ratu", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0058", name: "Riki Rikardo", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0059", name: "Rizki Aditia", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0060", name: "Saskiya Amanda", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0061", name: "Syahara Auliyah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0062", name: "Tirta Pratama", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0063", name: "Uswatun Khasanah", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0064", name: "Yogi Saputra", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" },
  { id: "SR0065", name: "Yuni Aulia Sari", class: "SMA", dorm: "Asrama Terpadu", caretaker: "M. ARDIAN NUGRAHA, S.H" }
];

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
      if (!parsed.googleScriptUrl || parsed.googleScriptUrl.includes('AKfycbyDHNJ7u3aARImefzTXq') || parsed.googleScriptUrl.includes('AKfycbwcXGzz') || parsed.googleScriptUrl.includes('AKfycbxJCN9pcsTSEq')) {
        parsed.googleScriptUrl = DEFAULT_SCRIPT_URL;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_CONFIG;
}

export function saveAppConfig(config: AppConfig): void {
  localStorage.setItem('sr_config', JSON.stringify(config));
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
        const uniqueMap = new Map<string, Student>();
        parsed.forEach((s: Student) => {
          if (s && s.id && s.name) {
            const cleanedId = String(s.id).trim();
            uniqueMap.set(cleanedId, { ...s, id: cleanedId, name: String(s.name).trim() });
          }
        });
        const deduplicated = Array.from(uniqueMap.values());
        if (deduplicated.length > 0) return deduplicated;
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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
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

export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'MED-2026-001',
    studentId: 'SR0001',
    studentName: 'A Rakka Attala',
    date: '2026-08-01',
    time: '08:30',
    location: 'UKS Asrama',
    symptoms: 'Demam tinggi 38.5°C, pusing, dan pusing lemas sejak semalam',
    diagnosis: 'Febris (Demam) e.c. Infeksi Saluran Pernapasan Akut (ISPA)',
    treatment: 'Paracetamol 500mg (3x1), Vitamin C, Kompres hangat, Istirahat total di UKS',
    restDays: 2,
    isSickLeave: true,
    status: 'Dalam Perawatan',
    officer: 'Tim Medis UKS / Pembina Asrama',
    temperature: '38.5°C',
    vitalSigns: '110/70 mmHg, Nadi 88x/m',
    height: 142,
    weight: 36,
    notes: 'Perlu diminum obat setelah makan. Evaluasi ulang suhu tubuh jam 16:00.'
  },
  {
    id: 'MED-2026-000A',
    studentId: 'SR0001',
    studentName: 'A Rakka Attala',
    date: '2026-05-15',
    time: '09:00',
    location: 'Klinik Sekolah',
    symptoms: 'Pemeriksaan Kesehatan Rutin & Penimbangan Fisik Per Triwulan',
    diagnosis: 'Kondisi Sehat & Perkembangan Normal',
    treatment: 'Pemberian Multivitamin & Obat Cacing Rutin',
    restDays: 0,
    isSickLeave: false,
    status: 'Sembuh / Kembali Sekolah',
    officer: 'Tim UKS Puskesmas Pembantu',
    temperature: '36.5°C',
    vitalSigns: '110/70 mmHg',
    height: 140,
    weight: 34,
    notes: 'Pertumbuhan fisik meningkat 2cm dan berat badan naik 2kg dalam 3 bulan.'
  },
  {
    id: 'MED-2026-000B',
    studentId: 'SR0001',
    studentName: 'A Rakka Attala',
    date: '2026-01-10',
    time: '10:00',
    location: 'Klinik Sekolah',
    symptoms: 'Pemeriksaan Kesehatan Awal Semester Ganjil',
    diagnosis: 'Sehat Bebas Keluhan',
    treatment: 'Edukasi Kebersihan Diri & Gizi Seimbang',
    restDays: 0,
    isSickLeave: false,
    status: 'Sembuh / Kembali Sekolah',
    officer: 'Tim Medis UKS',
    temperature: '36.6°C',
    vitalSigns: '105/65 mmHg',
    height: 137,
    weight: 32,
    notes: 'Data fisik awal tahun ajaran baru.'
  },
  {
    id: 'MED-2026-002',
    studentId: 'SR0005',
    studentName: 'M Fahri',
    date: '2026-07-28',
    time: '14:15',
    location: 'Klinik / RS Rujukan',
    symptoms: 'Sakit perut melilit bagian ulu hati, mual, muntah 2 kali',
    diagnosis: 'Gastritis Akut / Dispepsia',
    treatment: 'Antasida Doen 3x1, Omeprazole 20mg 2x1, Ranitidin, Diet bubur halus',
    restDays: 3,
    isSickLeave: true,
    status: 'Dirujuk ke RS/Klinik',
    officer: 'dr. Hidayatullah (Klinik Swasta Kemitraan)',
    temperature: '36.8°C',
    vitalSigns: '120/80 mmHg',
    height: 146,
    weight: 40,
    notes: 'Dirujuk ke Klinik Kemitraan Palembang untuk infus cairan D5% dan observasi 1x24 jam.'
  },
  {
    id: 'MED-2026-003',
    studentId: 'SR0022',
    studentName: 'Adriansya Khoirul Khafi',
    date: '2026-07-25',
    time: '10:00',
    location: 'Istirahat di Kamar',
    symptoms: 'Terpelintir pergelangan kaki kanan saat olahraga basket',
    diagnosis: 'Sprain Ankle Dextra (Keseleo Pergelangan Kaki)',
    treatment: 'Kompres es (RICE method), Perban elastis, Analgesik Mefenamat 500mg',
    restDays: 1,
    isSickLeave: true,
    status: 'Sembuh / Kembali Sekolah',
    officer: 'Tim Medis UKS',
    temperature: '36.5°C',
    vitalSigns: '115/75 mmHg',
    height: 168,
    weight: 58,
    notes: 'Sudah membaik dan disarankan tidak berolahraga berat selama 1 minggu.'
  }
];

export function loadMedicalRecords(): MedicalRecord[] {
  const saved = localStorage.getItem('sr_medical_records');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_MEDICAL_RECORDS;
}

export function saveMedicalRecords(records: MedicalRecord[]): void {
  localStorage.setItem('sr_medical_records', JSON.stringify(records));
}

export const INITIAL_PRAYER_ATTENDANCE: PrayerAttendance[] = [
  {
    id: 'PA-001',
    studentId: 'SR0001',
    studentName: 'A Rakka Attala',
    class: 'SD',
    dorm: 'Asrama Terpadu',
    prayerTime: 'Subuh',
    date: new Date().toISOString().split('T')[0],
    timestamp: '04:45:12',
    status: 'Hadir',
    scannedBy: 'M. ARDIAN NUGRAHA, S.H'
  },
  {
    id: 'PA-002',
    studentId: 'SR0002',
    studentName: 'Abdul Wahid',
    class: 'SD',
    dorm: 'Asrama Terpadu',
    prayerTime: 'Subuh',
    date: new Date().toISOString().split('T')[0],
    timestamp: '04:48:30',
    status: 'Hadir',
    scannedBy: 'M. ARDIAN NUGRAHA, S.H'
  },
  {
    id: 'PA-003',
    studentId: 'SR0022',
    studentName: 'Adriansya Khoirul Khafi',
    class: 'SMA',
    dorm: 'Asrama Terpadu',
    prayerTime: 'Subuh',
    date: new Date().toISOString().split('T')[0],
    timestamp: '04:52:00',
    status: 'Terlambat',
    note: 'Masuk shof rakaat kedua',
    scannedBy: 'M. ARDIAN NUGRAHA, S.H'
  }
];

export function loadPrayerAttendance(): PrayerAttendance[] {
  const saved = localStorage.getItem('sr_prayer_attendance');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_PRAYER_ATTENDANCE;
}

export function savePrayerAttendance(records: PrayerAttendance[]): void {
  localStorage.setItem('sr_prayer_attendance', JSON.stringify(records));
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
