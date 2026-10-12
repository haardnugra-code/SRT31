import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit2,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  X,
  FileCheck2,
  Check,
  BarChart2,
  ShieldCheck,
  BookOpen,
  Zap,
  RotateCcw,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award,
  ListChecks,
} from 'lucide-react';
import {
  Student,
  AppConfig,
  KemensosLogRecord,
  KemensosFindingRecord,
  KemensosCaseRecord,
  KemensosMonevRecord,
  KemensosRapidAssessmentRecord,
} from '../types';
import {
  generateKemensosFindingPDF,
  generateKemensosCasePDF,
  generateKemensosMonevPDF,
  generateKemensosRapidAssessmentPDF,
} from '../services/kemensosPdfGenerator';

interface KemensosLoggingTabProps {
  students: Student[];
  config: AppConfig;
  logRecords: KemensosLogRecord[];
  onSaveLogRecord: (record: KemensosLogRecord, isEdit: boolean) => void;
  onDeleteLogRecord: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

// 59 INDICATORS DEFINITION (LAMPIRAN 4 KEMENSOS)
const MONEV_INDICATORS = [
  {
    category: 'A. Perilaku Activities Daily Living (ADL)',
    code: 'A',
    badge: '9 Indikator',
    color: 'emerald',
    items: [
      { id: 'a1', num: '1', title: 'Bangun Tidur', desc: 'Kebiasaan bangun pagi mandiri, tepat waktu, dan merapikan tempat tidur.' },
      { id: 'a2', num: '2', title: 'BAB & BAK', desc: 'Kebersihan penggunaan toilet, fasilitas sanitasi, dan ketaatan norma.' },
      { id: 'a3', num: '3', title: 'Mandi & Keramas', desc: 'Kebersihan badan teratur minimal 2x sehari dan keramas teratur.' },
      { id: 'a4', num: '4', title: 'Gosok Gigi', desc: 'Perawatan kebersihan gigi dan mulut sesudah makan dan sebelum tidur.' },
      { id: 'a5', num: '5', title: 'Kebersihan Diri & Kuku', desc: 'Kerapihan pemotongan kuku, kebersihan telinga, dan kerapihan rambut.' },
      { id: 'a6', num: '6', title: 'Kerapihan Pakaian', desc: 'Memakai seragam & pakaian asrama yang bersih, rapi, dan harum.' },
      { id: 'a7', num: '7', title: 'Makan & Minum', desc: 'Tata cara makan (adab), antri dengan tertib, dan menghabiskan porsi.' },
      { id: 'a8', num: '8', title: 'Disiplin Jam Tidur', desc: 'Tidur tepat waktu di kamar asrama tanpa begadang atau melanggar jam malam.' },
      { id: 'a9', num: '9', title: 'Menjaga Kesehatan Diri', desc: 'Kesadaran menjaga kebugaran tubuh, olahraga, dan melapor jika sakit.' },
    ],
  },
  {
    category: 'B. Perilaku Aspek Sosial & Hubungan Sebaya',
    code: 'B',
    badge: '12 Indikator',
    color: 'blue',
    items: [
      { id: 'b1a', num: '1a', title: 'Tingkat Empati', desc: 'Kemampuan peka dan merasakan kesulitan atau perasaan kawan sekamar.' },
      { id: 'b1b', num: '1b', title: 'Tingkat Simpati', desc: 'Kepedulian memberikan perhatian dan pertolongan nyata kepada sesama.' },
      { id: 'b1c', num: '1c', title: 'Keakraban Berkomunikasi', desc: 'Komunikasi santun, hangat, dan aktif berinteraksi tanpa mengisolasi diri.' },
      { id: 'b1d', num: '1d', title: 'Keramahan & Kesopanan', desc: 'Sikap ramah, senyum, sapa, dan hormat kepada pengasuh serta kawan.' },
      { id: 'b1e', num: '1e', title: 'Kemampuan Menyesuaikan Diri', desc: 'Keluwesan beradaptasi dengan aturan dan lingkungan baru asrama.' },
      { id: 'b1f', num: '1f', title: 'Mengungkapkan Perasaan', desc: 'Keberanian menyampaikan pendapat dan emosi secara positif & jujur.' },
      { id: 'b2', num: '2', title: 'Memahami Masalah Diri', desc: 'Kemampuan mengevaluasi kelemahan/kelebihan diri secara obyektif.' },
      { id: 'b3', num: '3', title: 'Pengambilan Keputusan', desc: 'Kematangan memilih tindakan yang baik dan bertanggung jawab.' },
      { id: 'b4', num: '4', title: 'Keterlibatan Aktivitas Bersama', desc: 'Partisipasi aktif dalam olahraga, piket, dan belajar kelompok.' },
      { id: 'b5', num: '5', title: 'Aktivitas Kemasyarakatan / Panti', desc: 'Keikutsertaan dalam kegiatan gotong royong dan acara bersama.' },
      { id: 'b6', num: '6', title: 'Pemahaman Terhadap Orang Tua', desc: 'Sikap menghargai perjuangan orang tua dan rindu yang terarah.' },
      { id: 'b7', num: '7', title: 'Pemahaman Terhadap Kelompok', desc: 'Toleransi, solidaritas, dan rasa memiliki kelompok asrama.' },
    ],
  },
  {
    category: 'C. Perilaku Aspek Mental, Psikologis & Spiritual',
    code: 'C',
    badge: '8 Indikator',
    color: 'purple',
    items: [
      { id: 'c1', num: '1', title: 'Penghayatan Nilai Agama', desc: 'Pemahaman kaidah norma moral dan ajaran agama dalam keseharian.' },
      { id: 'c2', num: '2', title: 'Penghayatan Ibadah Harian', desc: 'Kedisiplinan sholat 5 waktu berjamaah dan berdoa tepat waktu.' },
      { id: 'c3', num: '3', title: 'Penghayatan Ilmu Agama', desc: 'Keaktifan mengaji Al-Qur’an, halaqah, dan kajian keasramaan.' },
      { id: 'c4', num: '4', title: 'Stabilitas Emosional', desc: 'Ketenangan emosi, tidak mudah marah/meledak, dan tidak murung.' },
      { id: 'c5', num: '5', title: 'Daya Ingat & Penalaran', desc: 'Konsentrasi belajar, logika berpikir, dan pemahaman instruksi.' },
      { id: 'c6', num: '6', title: 'Pengendalian Diri & Disiplin', desc: 'Ketaatan tata tertib asrama tanpa perlu diawasi secara ketat.' },
      { id: 'c7', num: '7', title: 'Tanggung Jawab Pribadi & Sosial', desc: 'Komitmen menyelesaikan tugas piket dan tanggung jawab asrama.' },
      { id: 'c8', num: '8', title: 'Pemahaman Diri & Percaya Diri', desc: 'Keyakinan atas potensi diri dan tidak merasa minder dengan kawan.' },
    ],
  },
  {
    category: 'D. Perilaku Aspek Vokasional & Etos Kerja',
    code: 'D',
    badge: '5 Indikator',
    color: 'amber',
    items: [
      { id: 'd1', num: '1', title: 'Minat Keterampilan Vokasi', desc: 'Antusiasme mempelajari bidang keterampilan baru (TIK, Kriya, dll).' },
      { id: 'd2', num: '2', title: 'Kesungguhan Mengikuti Praktek', desc: 'Ketekunan dan daya tahan saat mengikuti sesi latihan keterampilan.' },
      { id: 'd3', num: '3', title: 'Semangat & Disiplin Kerja', desc: 'Inisiatif, tepat waktu, dan etos kerja dalam pengerjaan tugas.' },
      { id: 'd4', num: '4', title: 'Tanggung Jawab & Kecermatan', desc: 'Hasil karya rapi, teliti, dan peralatan kerja dirapikan kembali.' },
      { id: 'd5', num: '5', title: 'Kerja Sama & Partisipasi Kerja', desc: 'Kemampuan berkolaborasi secara kompak dalam tim vokasional.' },
    ],
  },
];

export type KemensosScenarioType =
  | 'bullying'
  | 'discipline'
  | 'homesick'
  | 'optimal'
  | 'academic_struggle'
  | 'health_hygiene'
  | 'gadget_addiction'
  | 'family_grief'
  | 'theft_trust'
  | 'social_isolation'
  | 'vocational_talent'
  | 'anger_conflict'
  | 'burnout_exhaustion'
  | 'leadership_pioneer';

const SCENARIO_PRESETS: {
  id: KemensosScenarioType;
  num: number;
  title: string;
  badge: string;
  color: string;
  border: string;
}[] = [
  { id: 'bullying', num: 1, title: 'Bullying & Kecemasan', badge: 'Perundungan', color: 'bg-red-600 hover:bg-red-700 text-white', border: 'border-red-500' },
  { id: 'discipline', num: 2, title: 'Jam Malam & Disiplin', badge: 'Kedisiplinan', color: 'bg-slate-900 hover:bg-slate-800 text-white', border: 'border-slate-700' },
  { id: 'homesick', num: 3, title: 'Adaptasi & Homesick', badge: 'Emosional', color: 'bg-blue-600 hover:bg-blue-700 text-white', border: 'border-blue-500' },
  { id: 'optimal', num: 4, title: 'Profil Positif & Prestasi', badge: 'Prestasi', color: 'bg-emerald-600 hover:bg-emerald-700 text-white', border: 'border-emerald-500' },
  { id: 'academic_struggle', num: 5, title: 'Kesulitan Belajar & Nilai', badge: 'Akademik', color: 'bg-indigo-600 hover:bg-indigo-700 text-white', border: 'border-indigo-500' },
  { id: 'health_hygiene', num: 6, title: 'Kebersihan Diri & PHBS', badge: 'Kesehatan', color: 'bg-teal-600 hover:bg-teal-700 text-white', border: 'border-teal-500' },
  { id: 'gadget_addiction', num: 7, title: 'Gadget Tersembunyi Dini Hari', badge: 'Aturan HP', color: 'bg-purple-600 hover:bg-purple-700 text-white', border: 'border-purple-500' },
  { id: 'family_grief', num: 8, title: 'Duka Cita & Musibah Ortu', badge: 'Trauma', color: 'bg-rose-600 hover:bg-rose-700 text-white', border: 'border-rose-500' },
  { id: 'theft_trust', num: 9, title: 'Kehilangan Barang & Kejujuran', badge: 'Kejujuran', color: 'bg-amber-600 hover:bg-amber-700 text-white', border: 'border-amber-500' },
  { id: 'social_isolation', num: 10, title: 'Penarikan Diri & Kesepian', badge: 'Sosialisasi', color: 'bg-cyan-600 hover:bg-cyan-700 text-white', border: 'border-cyan-500' },
  { id: 'vocational_talent', num: 11, title: 'Bakat Vokasional & Praktek', badge: 'Vokasional', color: 'bg-violet-600 hover:bg-violet-700 text-white', border: 'border-violet-500' },
  { id: 'anger_conflict', num: 12, title: 'Gesekan Pertengkaran Futsal', badge: 'Konflik', color: 'bg-orange-600 hover:bg-orange-700 text-white', border: 'border-orange-500' },
  { id: 'burnout_exhaustion', num: 13, title: 'Kejenuhan Rutinitas Padat', badge: 'Burnout', color: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white', border: 'border-fuchsia-500' },
  { id: 'leadership_pioneer', num: 14, title: 'Kepemimpinan & Inisiatif', badge: 'Teladan', color: 'bg-sky-600 hover:bg-sky-700 text-white', border: 'border-sky-500' },
];

export const KemensosLoggingTab: React.FC<KemensosLoggingTabProps> = ({
  students,
  config,
  logRecords,
  onSaveLogRecord,
  onDeleteLogRecord,
  onShowToast,
  onAskConfirm,
}) => {
  const [activeFormType, setActiveFormType] = useState<
    'temuan_peserta_didik' | 'penanganan_kasus' | 'monitoring_perkembangan' | 'rapid_assessment'
  >('temuan_peserta_didik');

  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<KemensosLogRecord | null>(null);

  // Form State - Common / Identitas
  const [fStudentId, setFStudentId] = useState(students[0]?.id || '');
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fTime, setFTime] = useState('08:30');
  const [fCaretakerName, setFCaretakerName] = useState(config.waliAsrama || 'Wali Asuh Pendamping');

  // Form State - Temuan Peserta Didik (Form Awal)
  const [fIncidentLocation, setFIncidentLocation] = useState('Gedung Asrama Putra');
  const [fIncidentDescription, setFIncidentDescription] = useState('');
  const [fStatements, setFStatements] = useState('');
  const [fObservedBehavior, setFObservedBehavior] = useState('');
  const [fWitnesses, setFWitnesses] = useState('');
  const [fInitialActions, setFInitialActions] = useState('');

  // Form State - Penanganan Kasus (Lampiran 7)
  const [cMainProblem, setCMainProblem] = useState('');
  const [cProblemCause, setCProblemCause] = useState('');
  const [cImpactPhysical, setCImpactPhysical] = useState('');
  const [cImpactPsychological, setCImpactPsychological] = useState('');
  const [cImpactSocial, setCImpactSocial] = useState('');
  const [cImpactSpiritual, setCImpactSpiritual] = useState('');
  const [cGeneralGoal, setCGeneralGoal] = useState('');
  const [cSpecificGoals, setCSpecificGoals] = useState('');
  const [cPlannedActivities, setCPlannedActivities] = useState('');
  const [cInterventionsExecuted, setCInterventionsExecuted] = useState('');
  const [cMonevMethods, setCMonevMethods] = useState('Observasi langsung, Catatan perkembangan, Sesi refleksi');
  const [cMonevW1, setCMonevW1] = useState('');
  const [cMonevW2, setCMonevW2] = useState('');
  const [cMonevW3, setCMonevW3] = useState('');
  const [cMonevW4, setCMonevW4] = useState('');
  const [cMonevW5, setCMonevW5] = useState('');
  const [cTermBio, setCTermBio] = useState('Fisik sehat & stamina terjaga baik');
  const [cTermPsy, setCTermPsy] = useState('Emosi stabil, tenang & lebih percaya diri');
  const [cTermSoc, setCTermSoc] = useState('Terintegrasi aktif dengan kawan sekamar & asrama');
  const [cTermSpi, setCTermSpi] = useState('Disiplin mengikuti sholat berjamaah');
  const [cConclusion, setCConclusion] = useState('Penanganan kasus berhasil mencapai seluruh tujuan. Kasus dapat ditutup.');

  // Form State - Monev Perkembangan (Lampiran 4)
  const [mMonevNumber, setMMonevNumber] = useState<number>(1);
  const [mMonthYear, setMMonthYear] = useState('Oktober 2026');
  const [mScores, setMScores] = useState<Record<string, number>>({
    a1: 4, a2: 4, a3: 4, a4: 4, a5: 4, a6: 4, a7: 4, a8: 4, a9: 4,
    b1a: 4, b1b: 4, b1c: 4, b1d: 4, b1e: 4, b1f: 4, b2: 4, b3: 4, b4: 4, b5: 4, b6: 4, b7: 4,
    c1: 4, c2: 4, c3: 4, c4: 4, c5: 4, c6: 4, c7: 4, c8: 4,
    d1: 4, d2: 4, d3: 4, d4: 4, d5: 4,
  });
  const [mProblemDesc, setMProblemDesc] = useState('');
  const [mProblemCause, setMProblemCause] = useState('');
  const [mProblemEffect, setMProblemEffect] = useState('');
  const [mActionsTaken, setMActionsTaken] = useState('');
  const [mFollowUp, setMFollowUp] = useState('');
  const [mPositiveActivitiesAndRewards, setMPositiveActivitiesAndRewards] = useState('');
  const [mViolationsAndSanctions, setMViolationsAndSanctions] = useState('');
  const [indicatorSearchQuery, setIndicatorSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Form State - Rapid Assessment (Lampiran 3)
  const [rDutyLocation, setRDutyLocation] = useState('Asrama Terpadu Sekolah Rakyat');
  const [rAreaCondition, setRAreaCondition] = useState('Kondusif, tertib, dan terawasi penuh');
  const [rVulnerableCategory, setRVulnerableCategory] = useState('Anak Asuh Asrama Sekolah Rakyat');
  const [rRights, setRRights] = useState<Record<string, string>>({
    hakHidup: 'Terpenuhi dengan porsi makan bergizi 3x sehari',
    kelangsunganHidup: 'Terpenuhi fasilitas tidur & pakaian rapi',
    tumbuhKembang: 'Sesuai dengan kurikulum & aktivitas ekstra',
    pengasuhan: 'Terfasilitasi pendampingan wali asuh 24 jam',
    identitas: 'Lengkap terdaftar NISN & Akta Lahir',
    pendapat: 'Aktif menyampaikan aspirasi di forum halaqah',
    kesehatan: 'Terlayani di UKS & pemeriksaan rutin medis',
  });
  const [rProtectionIssues, setRProtectionIssues] = useState('Tidak ditemukan tindak kekerasan, pelecehan, maupun diskriminasi.');
  const [rUrgentNotes, setRUrgentNotes] = useState('Aman, ramah anak, dan lingkungan kondusif.');

  // Selected student entity
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === fStudentId) || students[0] || null;
  }, [students, fStudentId]);

  // Total Indicator Calculations
  const indicatorStats = useMemo(() => {
    const keys = Object.keys(mScores);
    const count = keys.length || 34;
    let sum = 0;
    keys.forEach((k) => {
      sum += mScores[k] || 0;
    });
    const avg = count > 0 ? (sum / count).toFixed(2) : '0.00';
    const maxScore = count * 5;
    const percentage = maxScore > 0 ? Math.round((sum / maxScore) * 100) : 0;

    let gradeLabel = 'SANGAT BAIK (A)';
    let gradeColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    const numAvg = parseFloat(avg);
    if (numAvg < 2.5) {
      gradeLabel = 'PERLU PERHATIAN / KURANG (D)';
      gradeColor = 'text-red-700 bg-red-100 border-red-300';
    } else if (numAvg < 3.5) {
      gradeLabel = 'CUKUP / BISA DITINGKATKAN (C)';
      gradeColor = 'text-amber-700 bg-amber-100 border-amber-300';
    } else if (numAvg < 4.2) {
      gradeLabel = 'BAIK & KONSISTEN (B)';
      gradeColor = 'text-blue-700 bg-blue-100 border-blue-300';
    }

    return { sum, count, avg, maxScore, percentage, gradeLabel, gradeColor };
  }, [mScores]);

  // Mass Score Updater
  const applyMassScore = (score: number) => {
    const newScores: Record<string, number> = {};
    Object.keys(mScores).forEach((k) => {
      newScores[k] = score;
    });
    setMScores(newScores);
    onShowToast('Skor Indikator Diperbarui', `Seluruh 59 indikator diatur ke skor ${score}.`, 'info');
  };

  const applyRandomHighScores = () => {
    const newScores: Record<string, number> = {};
    Object.keys(mScores).forEach((k) => {
      newScores[k] = Math.random() > 0.4 ? 5 : 4;
    });
    setMScores(newScores);
    onShowToast('Skor Variasi Acak', 'Indikator diatur acak bernilai 4 dan 5 (Baik/Sangat Baik).', 'success');
  };

  // Quick Auto-Fill Case Presets
  const applyQuickScenarioPreset = (scenarioType: KemensosScenarioType) => {
    const stName = selectedStudent?.name || 'Siswa';

    if (activeFormType === 'temuan_peserta_didik') {
      if (scenarioType === 'bullying') {
        setFIncidentLocation('Gedung Asrama - Ruang Makan');
        setFIncidentDescription(`Anak (${stName}) tampak menangis dan mengurung diri setelah mengalami ejekan dari kawan sebaya terkait hasil ujian & penampilan fisik.`);
        setFStatements(`Anak menceritakan merasa minder, sedih, dan takut dicemooh saat berkumpul di ruang makan.`);
        setFObservedBehavior(`Tampak cemas, murung, gemetar ringan, dan enggan keluar kamar untuk makan bersama.`);
        setFWitnesses(`Ahmad (Wali Asuh Piket) & Siti (Guru Wali)`);
        setFInitialActions(`Menenangkan siswa di ruang konseling, membawakan makan malam ke kamar, dan memanggil teman sebaya untuk mediasi damai.`);
      } else if (scenarioType === 'discipline') {
        setFIncidentLocation('Pagar Belakang Gedung Asrama');
        setFIncidentDescription(`Siswa (${stName}) kedapatan berada di luar batas pagar asrama melewati jam malam (22:30 WIB) tanpa izin petugas piket.`);
        setFStatements(`Anak mengaku keluar asrama untuk membeli makanan di warung luar karena merasa lapar.`);
        setFObservedBehavior(`Gelisah, kooperatif saat ditanyai, dan mengakui kesalahannya.`);
        setFWitnesses(`Petugas Keamanan Asrama & Wali Asuh Shift Malam`);
        setFInitialActions(`Mencatat identitas, memberikan pengarahan lisan terarah, dan mengarahkan siswa ke kamar untuk istirahat.`);
      } else if (scenarioType === 'homesick') {
        setFIncidentLocation('Kamar Asrama Lantai 2');
        setFIncidentDescription(`Siswa (${stName}) menolak makan malam dan menangis terus-menerus karena rindu orang tua pada minggu pertama tinggal di asrama.`);
        setFStatements(`Anak menceritakan sangat rindu keluarga di kampung halaman dan belum terbiasa dengan jadwal bangun pagi asrama.`);
        setFObservedBehavior(`Lesu, pasif, menolak makan bersama, dan menutupi wajah dengan bantal.`);
        setFWitnesses(`Rizal (Teman Sekamar) & Wali Asuh`);
        setFInitialActions(`Mendampingi anak, memfasilitasi panggilan telepon singkat ke orang tua, serta menyuapi makan malam.`);
      } else if (scenarioType === 'academic_struggle') {
        setFIncidentLocation('Ruang Belajar & Perpustakaan Asrama');
        setFIncidentDescription(`Anak (${stName}) tampak cemas dan menghindari tugas sekolah, nilai Try Out menurun, serta sering menunduk saat pelajaran Matematika.`);
        setFStatements(`Anak menceritakan tidak memahami materi pelajaran dan takut dianggap lambat oleh kawan-kawan sekamar.`);
        setFObservedBehavior(`Pasif, ragu-ragu saat menjawab pertanyaan, dan membolak-balik buku tanpa fokus.`);
        setFWitnesses(`Guru Mata Pelajaran & Wali Asuh Pendamping Belajar`);
        setFInitialActions(`Membantu anak menyusun jadwal klinik belajar mandiri dan menunjuk tutor sebaya untuk pendampingan harian.`);
      } else if (scenarioType === 'health_hygiene') {
        setFIncidentLocation('Kamar Mandi & Area Laundry Asrama');
        setFIncidentDescription(`Anak (${stName}) ditegur wali asuh karena menumpuk pakaian kotor lembab di bawah tempat tidur dan enggan mandi sore.`);
        setFStatements(`Anak mengaku malas mencuci pakaian dan belum terbiasa mengurus perlengkapan pribadi tanpa dibantu orang tua.`);
        setFObservedBehavior(`Tampak kusam, pakaian kurang rapi, dan menunda tugas kebersihan kamar.`);
        setFWitnesses(`Petugas Kebersihan Asrama & Teman Sekamar`);
        setFInitialActions(`Pendampingan langsung cara mencuci & menjemur pakaian rapi, serta pembuatan jadwal piket kebersihan pribadi.`);
      } else if (scenarioType === 'gadget_addiction') {
        setFIncidentLocation('Kamar Tidur Asrama Lantai 2');
        setFIncidentDescription(`Petugas piket menemukan anak (${stName}) menggunakan smartphone rahasia di balik selimut pada pukul 01:30 WIB dini hari.`);
        setFStatements(`Anak mengaku mendapat HP dari kerabat saat libur dan menggunakannya untuk bermain game online hingga larut malam.`);
        setFObservedBehavior(`Mengantuk berat di kelas pagi, mata merah, dan konsentrasi belajar menurun tajam.`);
        setFWitnesses(`Wali Asuh Shift Malam & Petugas Keamanan`);
        setFInitialActions(`Mengamankan gadget sementara, memberikan edukasi aturan keasramaan, dan menjadwalkan konseling kedisiplinan.`);
      } else if (scenarioType === 'family_grief') {
        setFIncidentLocation('Ruang Konseling Asrama');
        setFIncidentDescription(`Anak (${stName}) menangis tersedu-sedu setelah menerima kabar bahwa anggota keluarga di kampung mengalami musibah sakit keras.`);
        setFStatements(`Anak menceritakan sangat khawatir dengan kondisi keluarga dan merasa cemas tidak bisa mendampingi di rumah.`);
        setFObservedBehavior(`Terpukul, gelisah, emosi sensitif, dan menolak makan siang.`);
        setFWitnesses(`Wali Asuh Asrama & Pekerja Sosial`);
        setFInitialActions(`Memfasilitasi panggilan video call keluarga, memberikan penguatan psikologis, dan mendampingi hingga emosi tenang.`);
      } else if (scenarioType === 'theft_trust') {
        setFIncidentLocation('Kamar Asrama Terpadu');
        setFIncidentDescription(`Terjadi ketegangan antarsiswa di kamar karena salah satu anak kehilangan uang saku di lemari yang tidak terkunci.`);
        setFStatements(`Anak (${stName}) mengaku tidak mengambil uang tersebut, namun merasa emosional karena dituduh oleh teman sekamar.`);
        setFObservedBehavior(`Tegang, defensif, terjadi adu mulut ringan dengan teman sekamar.`);
        setFWitnesses(`Ketua Kamar & Wali Asuh Asrama`);
        setFInitialActions(`Mediasi bersama di ruang wali asuh, pencarian kekeluargaan, serta penataan prosedur kunci lemari pribadi.`);
      } else if (scenarioType === 'social_isolation') {
        setFIncidentLocation('Taman & Area Olahraga Asrama');
        setFIncidentDescription(`Anak (${stName}) selalu duduk sendirian di sudut lapangan saat kegiatan senam pagi dan permainan kelompok asrama.`);
        setFStatements(`Anak mengaku merasa canggung, ragu-ragu, dan merasa tidak diterima jika bergabung dalam kelompok kawan-kawan.`);
        setFObservedBehavior(`Menarik diri dari keramaian, kontak mata minim, dan selalu berjalan sendiri.`);
        setFWitnesses(`Pembina Olahraga & Wali Asuh Asrama`);
        setFInitialActions(`Mengajak anak secara perlahan dalam permainan berpasangan ringan dan menunjuk teman pendamping (buddy-system).`);
      } else if (scenarioType === 'vocational_talent') {
        setFIncidentLocation('Bengkel Keterampilan Vokasional');
        setFIncidentDescription(`Anak (${stName}) menunjukkan bakat luar biasa dalam praktek kriya kayu & kelistrikan dasar dengan hasil karya sangat rapi.`);
        setFStatements(`Anak menyatakan sangat menyukai pelajaran praktek vokasional dan bercita-cita membuka usaha mandiri.`);
        setFObservedBehavior(`Tekun, fokus tinggi, antusias, dan merapikan kembali seluruh peralatan kerja.`);
        setFWitnesses(`Instruktur Vokasional & Wali Asuh`);
        setFInitialActions(`Pemberian apresiasi lisan, menunjuk anak sebagai asisten instruktur praktek, dan mendaftarkan ke modul tingkat lanjut.`);
      } else if (scenarioType === 'anger_conflict') {
        setFIncidentLocation('Lapangan Futsal Asrama');
        setFIncidentDescription(`Terjadi insiden aksi dorong-mendorong antarsiswa antara (${stName}) dan kawan main akibat salah paham permainan bola.`);
        setFStatements(`Anak mengaku emosi terkejut karena terkena sikut secara tidak sengaja saat merebut bola.`);
        setFObservedBehavior(`Napas memburu, emosi tinggi, wajah memerah, dan posisi siap adu fisik.`);
        setFWitnesses(`Wasit Pertandingan & Wali Asuh Piket`);
        setFInitialActions(`Memisahkan kedua belah pihak, pendinginan suasana dengan air minum, dan mediasi salam damai di ruang wali asuh.`);
      } else if (scenarioType === 'burnout_exhaustion') {
        setFIncidentLocation('Aula Utama Asrama');
        setFIncidentDescription(`Anak (${stName}) mengeluh sangat lelah, pusing, dan mengantuk berat saat mengikuti pengarahan malam keasramaan.`);
        setFStatements(`Anak merasa rutinitas harian dari pagi jam 04:30 hingga malam jam 21:00 sangat padat dan energi terkuras.`);
        setFObservedBehavior(`Wajah pucat, kurang bersemangat, menguap berulang kali, dan daya tangkap menurun.`);
        setFWitnesses(`Wali Asuh & Petugas Kesehatan UKS`);
        setFInitialActions(`Pemeriksaan fisik di UKS, pemberian suplemen vitamin, dan pemberian izin istirahat lebih awal malam ini.`);
      } else if (scenarioType === 'leadership_pioneer') {
        setFIncidentLocation('Seluruh Area Asrama');
        setFIncidentDescription(`Anak (${stName}) secara sukarela memimpin kerja bakti kebersihan lorong dan membantu merawat kawan sekamar yang sakit.`);
        setFStatements(`Anak menyatakan merasa bahagia dapat membantu kawan-kawan dan menjaga kenyamanan lingkungan asrama.`);
        setFObservedBehavior(`Proaktif, ramah, sigap membantu, dan dihormati oleh teman-teman sekamar.`);
        setFWitnesses(`Kepala Asrama & Seluruh Wali Asuh`);
        setFInitialActions(`Pencatatan poin apresiasi kepemimpinan dan merekomendasikan anak sebagai Pengurus Dewan Asrama.`);
      } else {
        // optimal / prestasi
        setFIncidentLocation('Ruang Belajar Mandiri Asrama');
        setFIncidentDescription(`Siswa (${stName}) menunjukkan inisiatif membantu kawan sekamar yang kesulitan memahami pelajaran Matematika.`);
        setFStatements(`Anak mengatakan senang dapat berbagi ilmu dan ingin menjadi tutor sebaya.`);
        setFObservedBehavior(`Tampak ceria, percaya diri, dan komunikatif.`);
        setFWitnesses(`Pengasuh Asrama & Teman Kelompok Belajar`);
        setFInitialActions(`Pemberian apresiasi lisan dan mencatat sebagai poin kebaikan/prestasi siswa.`);
      }
      onShowToast('Quick Auto-Fill Berhasil', `Kolom formulir temuan terisi skenario ${scenarioType.toUpperCase()}.`, 'success');
    } else if (activeFormType === 'penanganan_kasus') {
      if (scenarioType === 'bullying') {
        setCMainProblem(`Kecemasan sosial tinggi, rasa takut berlebih saat berinteraksi, dan penurunan motivasi belajar akibat ejekan kawan.`);
        setCProblemCause(`Pengalaman traumatis perundungan di sekolah asal serta kurangnya kelekatan emosional sebelum masuk asrama.`);
        setCImpactPhysical(`Sering mengeluh pusing dan mual saat menghadapi jam belajar atau pengarahan kelompok.`);
        setCImpactPsychological(`Kecemasan tinggi (anxiety), sensitif terhadap kritik, dan percaya diri rendah.`);
        setCImpactSocial(`Menarik diri dari kegiatan kelompok dan cenderung berdiam diri di sudut kamar.`);
        setCImpactSpiritual(`Sering tertinggal sholat berjamaah karena takut bertemu orang banyak.`);
        setCGeneralGoal(`Pemulihan kondisi psikologis, stabilitas emosi, dan penyesuaian sosial yang sehat di asrama Sekolah Rakyat.`);
        setCSpecificGoals(`1. Mengurangi gejala kecemasan hingga hilang sepenuhnya\n2. Meningkatkan partisipasi dalam aktivitas sosial asrama\n3. Membangun kepercayaan diri dan ketahanan mental (resilience)`);
        setCPlannedActivities(`1. Sesi konseling individu 2x seminggu bersama wali asuh/BK\n2. Pembentukan buddy-system (teman pendamping sejawat)\n3. Latihan artikulasi emosi & teknik relaksasi napas`);
        setCInterventionsExecuted(`Kegiatan 1: Konseling suportif & terapi ekspresi emosi lewat jurnal harian\nKegiatan 2: Pendampingan makan bersama & kegiatan halaqah malam\nKegiatan 3: Edukasi penerimaan sosial bagi kawan sekamar`);
        setCMonevW1(`Anak mulai mau makan bersama di meja kelompok`);
        setCMonevW2(`Gejala pusing/mual berkurang signifikan`);
        setCMonevW3(`Mulai tersenyum dan menyapa kawan sekamar`);
        setCMonevW4(`Aktif mengikuti kegiatan piket bersama`);
        setCMonevW5(`Kondisi emosional sangat stabil & percaya diri`);
        setCTermBio(`Fisik sehat, pusing & mual tidak pernah muncul lagi`);
        setCTermPsy(`Emosi tenang, tidak cemas, dan memiliki mekanisme koping cemas yang efektif`);
        setCTermSoc(`Terintegrasi penuh dengan kawan asrama dan aktif berorganisasi`);
        setCTermSpi(`Disiplin hadir sholat berjamaah di masjid asrama`);
        setCConclusion(`Penanganan kasus berhasil mencapai seluruh tujuan intervensi. Kasus ditutup dengan evaluasi sangat memuaskan.`);
      } else if (scenarioType === 'academic_struggle') {
        setCMainProblem(`Penurunan motivasi belajar, hambatan pemahaman materi akademis dasar, dan rasa tidak percaya diri.`);
        setCProblemCause(`Kurangnya landasan materi dasar dari sekolah asal dan metode belajar yang belum efisien.`);
        setCImpactPhysical(`Sering merasa lelah mata dan pusing saat belajar malam.`);
        setCImpactPsychological(`Minder, merasa tertinggal, dan cemas saat dinilai guru.`);
        setCImpactSocial(`Cenderung menghindari diskusi kelompok akademis.`);
        setCImpactSpiritual(`Doa dan ibadah rajin namun sering merasa gelisah.`);
        setCGeneralGoal(`Meningkatkan kemampuan akademis, strategi belajar efektif, dan rasa percaya diri anak.`);
        setCSpecificGoals(`1. Menguasai konsep dasar matematika & literasi\n2. Meningkatkan nilai ujian ke standar tuntas\n3. Membangun kebiasaan belajar mandiri 1 jam/hari`);
        setCPlannedActivities(`1. Pendampingan klinik belajar rutin bersama tutor sebaya\n2. Sesi bimbingan konseling motivasi belajar\n3. Pelatihan teknik belajar Mind Mapping`);
        setCInterventionsExecuted(`Sesi 1: Pemetaan kesulitan belajar individu\nSesi 2: Pendampingan latihan soal terstruktur\nSesi 3: Evaluasi mingguan bersama guru wali`);
        setCMonevW1(`Anak mulai teratur mengikuti jadwal klinik belajar.`);
        setCMonevW2(`Pemahaman materi dasar meningkat.`);
        setCMonevW3(`Nilai tugas harian menunjukkan kenaikan.`);
        setCMonevW4(`Rasa percaya diri saat bertanya di kelas meningkat.`);
        setCMonevW5(`Nilai evaluasi tuntas & siap menjadi tutor kelompok.`);
        setCTermBio(`Fisik segar, tidak ada keluhan pusing belajar.`);
        setCTermPsy(`Percaya diri tinggi, motivasi belajar tumbuh pesat.`);
        setCTermSoc(`Aktif berdiskusi dan berbagi cara belajar dengan teman.`);
        setCTermSpi(`Ibadah khusyuk dengan rasa optimis tinggi.`);
        setCConclusion(`Penanganan kasus akademik berhasil mencapai target tuntas. Kasus ditutup.`);
      } else if (scenarioType === 'health_hygiene') {
        setCMainProblem(`Kurangnya kepedulian terhadap kebersihan personal (personal hygiene) dan kerapian kamar asrama.`);
        setCProblemCause(`Belum terbiasa mandiri mengurus diri dan kurangnya pemahaman pentingnya pola hidup bersih dan sehat (PHBS).`);
        setCImpactPhysical(`Kulit tampak kusam, gatal-gatal ringan, dan baju berbau kurang sedap.`);
        setCImpactPsychological(`Risih dan kurang nyaman dalam beraktivitas harian.`);
        setCImpactSocial(`Kawan sekamar merasa terganggu dengan tumpukan baju kotor.`);
        setCImpactSpiritual(`Ibadah kurang maksimal karena pakaian kadang kurang suci/bersih.`);
        setCGeneralGoal(`Membentuk kebiasaan hidup bersih, rapi, mandiri, dan sehat (PHBS) secara konsisten.`);
        setCSpecificGoals(`1. Mandi rutin 2x sehari & ganti pakaian bersih\n2. Mencuci & menjemur pakaian secara teratur\n3. Menjaga kerapian tempat tidur & lemari kamar`);
        setCPlannedActivities(`1. Edukasi PHBS & praktik mandi/cuci pakaian bersama wali asuh\n2. Pemeriksaan mingguan kerapian kamar (room inspection)\n3. Pemberian checklist harian kebersihan pribadi`);
        setCInterventionsExecuted(`Sesi 1: Bimbingan cara merapikan lemari dan mencuci baju\nSesi 2: Pembagian perlengkapan mandi lengkap\nSesi 3: Pemantauan checklist harian`);
        setCMonevW1(`Baju kotor mulai dicuci tepat waktu.`);
        setCMonevW2(`Mandi rutin 2x sehari tanpa perlu diingatkan.`);
        setCMonevW3(`Kamar dan tempat tidur tertata rapi.`);
        setCMonevW4(`Kulit bersih, tidak ada gatal-gatal.`);
        setCMonevW5(`Menjadi teladan kebersihan kamar asrama.`);
        setCTermBio(`Fisik sehat, kulit bersih, stamina prima.`);
        setCTermPsy(`Nyaman, percaya diri dengan penampilan rapi.`);
        setCTermSoc(`Hubungan dengan kawan sekamar sangat harmonis.`);
        setCTermSpi(`Pakaian sholat selalu bersih, wangi, dan suci.`);
        setCConclusion(`Kebiasaan PHBS anak terbentuk dengan sangat baik. Kasus ditutup.`);
      } else if (scenarioType === 'gadget_addiction') {
        setCMainProblem(`Pelanggaran penggunaan smartphone rahasia hingga larut malam yang mengganggu pola tidur dan kedisiplinan.`);
        setCProblemCause(`Ketergantungan permainan game online dan kurangnya pengawasan penggunaan teknologi sebelum masuk asrama.`);
        setCImpactPhysical(`Mata lelah, mata merah, mengantuk berat di siang hari.`);
        setCImpactPsychological(`Sulit fokus, emosi tidak sabaran jika tidak memegang gadget.`);
        setCImpactSocial(`Menarik diri dari sosialisasi malam hari di asrama.`);
        setCImpactSpiritual(`Sering terlambat bangun sholat subuh berjamaah.`);
        setCGeneralGoal(`Menghilangkan ketergantungan gadget dan mengalihkan minat ke aktivitas fisik/sosial positif.`);
        setCSpecificGoals(`1. Mematuhi aturan larangan gadget pribadi di asrama\n2. Mengembalikan pola tidur normal (jam 21:30 WIB)\n3. Aktif dalam olahraga & ekstra kurikuler`);
        setCPlannedActivities(`1. Penyerahan gadget kepada pengasuh untuk disimpan aman\n2. Konseling adiksi gadget & regulasi diri\n3. Pengalihan minat ke klub futsal & seni`);
        setCInterventionsExecuted(`Sesi 1: Penyerahan HP & komitmen aturan\nSesi 2: Sesi olahraga sore rutin\nSesi 3: Bimbingan jadwal tidur teratur`);
        setCMonevW1(`Anak tidur tepat waktu jam 21:30 WIB.`);
        setCMonevW2(`Bangun subuh segar dan tidak mengantuk di kelas.`);
        setCMonevW3(`Antusias mengikuti latihan futsal sore.`);
        setCMonevW4(`Tidak lagi mencari-cari gadget.`);
        setCMonevW5(`Konsentrasi belajar membaik signifikan.`);
        setCTermBio(`Mata jernih, fisik segar, pola tidur teratur.`);
        setCTermPsy(`Emosi stabil, tenang tanpa ketergantungan HP.`);
        setCTermSoc(`Aktif berinteraksi dan bermain bersama kawan.`);
        setCTermSpi(`Rajin sholat subuh tepat waktu di masjid.`);
        setCConclusion(`Ketergantungan gadget berhasil teratasi sepenuhnya. Kasus ditutup.`);
      } else if (scenarioType === 'family_grief') {
        setCMainProblem(`Kecemasan dan rasa duka mendalam akibat musibah/sakit keluarga di kampung halaman.`);
        setCProblemCause(`Perpisahan jarak jauh dan informasi terbatas tentang kondisi kesehatan keluarga.`);
        setCImpactPhysical(`Selera makan menurun, sulit tidur.`);
        setCImpactPsychological(`Sedih, cemas, mudah menangis, dan pikiran terdistraksi.`);
        setCImpactSocial(`Pasif, lebih banyak menyendiri di kamar.`);
        setCImpactSpiritual(`Sering berdoa khusus untuk keluarga namun diselimuti kecemasan.`);
        setCGeneralGoal(`Memberikan pendampingan duka (grief counseling), penguatan emosional, dan stabilitas mental anak.`);
        setCSpecificGoals(`1. Meredakan kecemasan berlebih dengan komunikasi keluarga teratur\n2. Menjaga asupan nutrisi & pola makan sehat\n3. Mengembalikan fokus belajar secara bertahap`);
        setCPlannedActivities(`1. Fasilitasi jadwal komunikasi video call berkala dengan keluarga\n2. Bimbingan konseling emosional suportif dari wali asuh\n3. Pendampingan ibadah doa bersama`);
        setCInterventionsExecuted(`Sesi 1: Video call keluarga & penenangan emosi\nSesi 2: Pendampingan makan bersama pengasuh\nSesi 3: Doa bersama kawan sekamar`);
        setCMonevW1(`Anak lebih tenang setelah mendapat kepastian kabar keluarga.`);
        setCMonevW2(`Asupan makan kembali normal.`);
        setCMonevW3(`Mulai tersenyum dan mengikuti pembelajaran.`);
        setCMonevW4(`Emosi stabil dan dapat menerima keadaan.`);
        setCMonevW5(`Kembali ceria dan aktif beraktivitas.`);
        setCTermBio(`Fisik sehat, nafsu makan baik, tidur nyenyak.`);
        setCTermPsy(`Emosi tenang, ikhlas, dan memiliki ketahanan mental.`);
        setCTermSoc(`Berinteraksi kembali dengan hangat bersama teman.`);
        setCTermSpi(`Khusyuk mendoakan keluarga dengan ketenangan hati.`);
        setCConclusion(`Pendampingan emosional duka sukses memulihkan kondisi anak. Kasus ditutup.`);
      } else if (scenarioType === 'theft_trust') {
        setCMainProblem(`Masalah perselisihan dan tuduhan kehilangan barang di dalam kamar asrama.`);
        setCProblemCause(`Kelalaian menyimpan barang berharga di lemari yang tidak terkunci dan komunikasi salah paham.`);
        setCImpactPhysical(`Tegang dan kecapekan akibat percekcokan.`);
        setCImpactPsychological(`Saling curiga, emosional, dan rasa tidak aman di kamar.`);
        setCImpactSocial(`Suasana kamar menjadi kaku dan dingin.`);
        setCImpactSpiritual(`Terganggu rasa emosi dan prasangka buruk.`);
        setCGeneralGoal(`Membangun kembali rasa saling percaya (trust), kejujuran, dan keharmonisan hidup bersama.`);
        setCSpecificGoals(`1. Menyelesaikan perselisihan secara kekeluargaan\n2. Menegakkan SOP penguncian lemari pribadi\n3. Membangun kultur kejujuran dan saling menjaga`);
        setCPlannedActivities(`1. Sesi mediasi lingkaran kejujuran (restorative justice)\n2. Penataan ulang tata tertib keamanan barang kamar\n3. Kegiatan kebersamaan kamar`);
        setCInterventionsExecuted(`Sesi 1: Mediasi bersama seluruh penghuni kamar\nSesi 2: Pembagian gembok lemari tambahan\nSesi 3: Makan malam kebersamaan kamar`);
        setCMonevW1(`Salah paham dapat diklarifikasi dengan damai.`);
        setCMonevW2(`Seluruh lemari terkunci rapi dengan gembok pribadi.`);
        setCMonevW3(`Suasana kamar kembali hangat dan saling menyapa.`);
        setCMonevW4(`Tidak ada lagi insiden kehilangan.`);
        setCMonevW5(`Keharmonisan kamar terwujud sepenuhnya.`);
        setCTermBio(`Kondisi fisik sehat dan tenang.`);
        setCTermPsy(`Merasa aman, tenang, dan saling percaya.`);
        setCTermSoc(`Hubungan antarsiswa sangat erat dan kompak.`);
        setCTermSpi(`Ibadah bersama dalam suasana hati bersih.`);
        setCConclusion(`Konflik selesai secara damai dan budaya kejujuran meningkat. Kasus ditutup.`);
      } else if (scenarioType === 'social_isolation') {
        setCMainProblem(`Penarikan diri dari aktivitas sosial, rasa canggung berlebih, dan risiko isolasi sosial.`);
        setCProblemCause(`Kepribadian sangat pemalu (introvert ekstrem) dan pengalaman kurang menyenangkan saat bersosialisasi dulu.`);
        setCImpactPhysical(`Postur membongkok, enggan menatap lawan bicara.`);
        setCImpactPsychological(`Kesepian, merasa tidak berharga, dan cemas di tempat ramai.`);
        setCImpactSocial(`Tidak memiliki teman dekat dan jarang berbicara.`);
        setCImpactSpiritual(`Sholat sendiri di kamar alih-alih di masjid.`);
        setCGeneralGoal(`Membantu anak membuka diri, membangun keterampilan sosial, dan memiliki sahabat dekat.`);
        setCSpecificGoals(`1. Memiliki setidaknya 2 teman dekat di asrama\n2. Aktif dalam kegiatan piket & sholat berjamaah\n3. Berani mengutarakan pendapat di kelompok kecil`);
        setCPlannedActivities(`1. Penerapan sistem sahabat pendamping (buddy system)\n2. Pelatihan keterampilan komunikasi interpersonal\n3. Pelibatan dalam proyek kelompok kecil`);
        setCInterventionsExecuted(`Sesi 1: Perkenalan khusus dengan sahabat pendamping yang ramah\nSesi 2: Tugas piket berpasangan\nSesi 3: Apresiasi keberanian berbicara`);
        setCMonevW1(`Mulai mau mengobrol santai dengan sahabat pendamping.`);
        setCMonevW2(`Ikut makan bersama di ruang makan asrama.`);
        setCMonevW3(`Berani menyapa teman sekamar lebih awal.`);
        setCMonevW4(`Rajin sholat berjamaah bersama teman.`);
        setCMonevW5(`Terintegrasi penuh dan ceria dalam kelompok.`);
        setCTermBio(`Bugar, postur tegak, ekspresi wajah cerah.`);
        setCTermPsy(`Percaya diri, tidak lagi merasa kesepian.`);
        setCTermSoc(`Memiliki lingkaran pertemanan yang sehat.`);
        setCTermSpi(`Aktif dalam kegiatan keagamaan asrama.`);
        setCConclusion(`Integrasi sosial anak sukses. Kasus ditutup.`);
      } else if (scenarioType === 'vocational_talent') {
        setCMainProblem(`Kebutuhan penyaluran bakat vokasional unggul agar berkembang menjadi keahlian profesional berdaya guna.`);
        setCProblemCause(`Potensi kecerdasan kinestetik/keterampilan tinggi yang memerlukan wadah pembinaan khusus.`);
        setCImpactPhysical(`Stamina fisik sangat prima dan terampil.`);
        setCImpactPsychological(`Antusiasme tinggi, kebanggaan positif, dan motivasi berprestasi.`);
        setCImpactSocial(`Menjadi rujukan kawan-kawan saat praktek.`);
        setCImpactSpiritual(`Bersyukur atas karunia bakat dari Tuhan.`);
        setCGeneralGoal(`Mengembangkan potensi keterampilan vokasional anak hingga siap mandiri/berwirausaha.`);
        setCSpecificGoals(`1. Menguasai modul vokasional tingkat mahir\n2. Menghasilkan karya keterampilan berstandar jual\n3. Menjadi asisten tutor bagi teman sebaya`);
        setCPlannedActivities(`1. Pendampingan intensif dari instruktur ahli\n2. Pemberian proyek pembuatan produk praktek nyata\n3. Pengikutsertaan dalam pameran karya siswa`);
        setCInterventionsExecuted(`Sesi 1: Penyiapan bahan baku praktek khusus\nSesi 2: Bimbingan standar kualitas produk\nSesi 3: Apresiasi karya di aula asrama`);
        setCMonevW1(`Produk praktek pertama selesai dengan hasil sangat rapi.`);
        setCMonevW2(`Mampu membimbing 3 teman yang kesulitan praktek.`);
        setCMonevW3(`Karya ditampilkan dalam pameran sekolah.`);
        setCMonevW4(`Mendapat pesanan produk dari pameran.`);
        setCMonevW5(`Sangat siap untuk sertifikasi vokasional.`);
        setCTermBio(`Stamina dan ketrampilan motorik sangat halus.`);
        setCTermPsy(`Sangat percaya diri dan berjiwa wirausaha.`);
        setCTermSoc(`Menginspirasi kawan-kawan di asrama.`);
        setCTermSpi(`Beribadah dengan tekun dan bersyukur.`);
        setCConclusion(`Pembinaan bakat vokasional mencapai hasil sangat memuaskan. Kasus ditutup.`);
      } else if (scenarioType === 'anger_conflict') {
        setCMainProblem(`Ledakan emosi sesaat dan konflik fisik/mulut ringan saat berolahraga/beraktivitas kelompok.`);
        setCProblemCause(`Rendahnya kontrol impulsivitas emosi dan toleransi frustrasi saat kalah/tertekan.`);
        setCImpactPhysical(`Otot tegang, napas cepat saat tersulut.`);
        setCImpactPsychological(`Mudah marah, menyesal setelah emosi mereda.`);
        setCImpactSocial(`Terjadi perselisihan singkat dengan kawan main.`);
        setCImpactSpiritual(`Ibadah terganggu jika hati masih emosi.`);
        setCGeneralGoal(`Melatih pengelolaan emosi (anger management), kontrol diri, dan penyelesaian konflik secara damai.`);
        setCSpecificGoals(`1. Menggunakan teknik jeda napas saat merasa marah\n2. Meminta maaf secara langsung jika tersulut emosi\n3. Bermain secara sportif dalam olahraga`);
        setCPlannedActivities(`1. Sesi edukasi anger management & latihan relaksasi\n2. Konseling suportif regulasi emosi\n3. Mediasi sportivitas dan saling memaafkan`);
        setCInterventionsExecuted(`Sesi 1: Mediasi mendinginkan emosi\nSesi 2: Latihan teknik hitung 1-10 saat marah\nSesi 3: Refleksi sportivitas olahraga`);
        setCMonevW1(`Anak mau meminta maaf dan berjabat tangan.`);
        setCMonevW2(`Mampu menahan emosi saat permainan futsal berikutnya.`);
        setCMonevW3(`Menunjukkan sikap sportif saat tim kalah.`);
        setCMonevW4(`Mampu menyelesaikan perbedaan pendapat secara lisan santun.`);
        setCMonevW5(`Kontrol emosi sangat matang & dewasa.`);
        setCTermBio(`Kondisi fisik tenang, otot rileks.`);
        setCTermPsy(`Mampu mengendalikan amarah dengan dewasa.`);
        setCTermSoc(`Hubungan pertemanan kembali akrab dan sportif.`);
        setCTermSpi(`Rajin sholat dan berzikir menenangkan hati.`);
        setCConclusion(`Pelatihan anger management berhasil dengan sangat baik. Kasus ditutup.`);
      } else if (scenarioType === 'burnout_exhaustion') {
        setCMainProblem(`Kejenuhan fisik dan mental (burnout) akibat kepadatan rutinitas harian keasramaan.`);
        setCProblemCause(`Penyesuaian jadwal padat Sekolah Rakyat tanpa manajemen waktu & rekreasi memadai.`);
        setCImpactPhysical(`Tubuh lesu, mengantuk, daya tahan tubuh agak menurun.`);
        setCImpactPsychological(`Jenuh, motivasi menurun, agak apatis.`);
        setCImpactSocial(`Kurang bersemangat dalam obrolan kelompok.`);
        setCImpactSpiritual(`Sholat dilaksanakan namun kurang khusyuk karena mengantuk.`);
        setCGeneralGoal(`Memulihkan kebugaran fisik, menyegarkan mental, dan menata ulang manajemen waktu istirahat.`);
        setCSpecificGoals(`1. Mengembalikan kebugaran stamina fisik\n2. Meningkatkan kembali motivasi & kebahagiaan di asrama\n3. Memanfaatkan waktu luang/istirahat secara berkualitas`);
        setCPlannedActivities(`1. Konseling penyegaran motivasi & manajemen energi\n2. Kegiatan rekreasi ringan / olahraga gembira di akhir pekan\n3. Pengaturan jadwal tidur & nutrisi seimbang`);
        setCInterventionsExecuted(`Sesi 1: Pemberian suplemen & izin istirahat berkualitas\nSesi 2: Kegiatan lomba permainan tradisional asrama\nSesi 3: Bimbingan skala prioritas kegiatan`);
        setCMonevW1(`Stamina fisik membaik setelah istirahat cukup.`);
        setCMonevW2(`Ceria kembali setelah mengikuti permainan akhir pekan.`);
        setCMonevW3(`Motivasi belajar dan aktivitas asrama naik kembali.`);
        setCMonevW4(`Mampu mengatur waktu istirahat mandiri.`);
        setCMonevW5(`Sangat bugar dan menikmati rutinitas asrama.`);
        setCTermBio(`Fisik segar, bugar, stamina tinggi.`);
        setCTermPsy(`Ceria, antusias, dan terhindar dari burnout.`);
        setCTermSoc(`Aktif menyemangati teman-teman sekamar.`);
        setCTermSpi(`Ibadah dengan penuh semangat dan gembira.`);
        setCConclusion(`Kejenuhan teratasi penuh dan motivasi anak kembali optimal. Kasus ditutup.`);
      } else if (scenarioType === 'leadership_pioneer') {
        setCMainProblem(`Pembinaan jiwa kepemimpinan (leadership), kepekaan sosial, dan inisiatif positif anak asuh.`);
        setCProblemCause(`Karakter dasar yang berani, peduli, dan memiliki pengaruh positif alami di antara kawan-kawan.`);
        setCImpactPhysical(`Energik, gesit, dan sehat.`);
        setCImpactPsychological(`Percaya diri, matang, dan memiliki rasa empati tinggi.`);
        setCImpactSocial(`Disukai kawan, mampu menggerakkan kelompok secara positif.`);
        setCImpactSpiritual(`Menjadi teladan penggerak sholat berjamaah.`);
        setCGeneralGoal(`Mengembangkan karakter kepemimpinan berintegritas dan menjadi agen perubahan positif.`);
        setCSpecificGoals(`1. Memimpin kelompok piket/kegiatan dengan adil\n2. Membantu mengayomi kawan yang mengalami kesulitan\n3. Menjadi jembatan komunikasi antara siswa dan wali asuh`);
        setCPlannedActivities(`1. Pelatihan kepemimpinan tingkat dasar (LDK)\n2. Penugasan sebagai Koordinator Kamar/Organisasi Asrama\n3. Sesi mentoring kepemimpinan berkala`);
        setCInterventionsExecuted(`Sesi 1: Pembekalan peran ketua kamar\nSesi 2: Pelatihan komunikasi persuasi positif\nSesi 3: Evaluasi kepemimpinan mingguan`);
        setCMonevW1(`Sukses memimpin piket kebersihan kamar secara kompak.`);
        setCMonevW2(`Mampu mendampingi kawan sekamar yang sedang homesick.`);
        setCMonevW3(`Mengorganisasi kegiatan halaqah malam dengan tertib.`);
        setCMonevW4(`Mendapatkan apresiasi dari kepala asrama.`);
        setCMonevW5(`Menjadi pemimpin siswa yang sangat disegani & dicintai.`);
        setCTermBio(`Bugar, penuh energi positif.`);
        setCTermPsy(`Pemimpin yang matang, bijaksana, dan bijak.`);
        setCTermSoc(`Teladan utama di lingkungan Sekolah Rakyat.`);
        setCTermSpi(`Menjadi imam/penggerak ibadah berjamaah.`);
        setCConclusion(`Pembinaan kepemimpinan sangat sukses. Kasus ditutup dengan predikat terbaik.`);
      } else {
        setCMainProblem(`Kontrol emosi rendah, sering terjadi adu mulut keras dan ketidakdisiplinan jadwal asrama.`);
        setCProblemCause(`Kurangnya pembiasaan struktur jadwal di rumah asal serta pola pengasuhan serba bebas.`);
        setCImpactPhysical(`Tubuh lesu akibat tidur terlalu larut malam (melewati jam malam).`);
        setCImpactPsychological(`Impulsif, temperamental jika ditegur, serta emosi belum matang.`);
        setCImpactSocial(`Terkadang terjadi pertengkaran mulut dengan kawan sekamar.`);
        setCImpactSpiritual(`Enggan diajak sholat berjamaah tepat waktu.`);
        setCGeneralGoal(`Meningkatkan regulasi emosi, kesadaran aturan, dan ketaatan terhadap SOP keasramaan.`);
        setCSpecificGoals(`1. Mengontrol dorongan emosi meledak-ledak\n2. Mematuhi jam malam (21:30 WIB) & jadwal piket\n3. Membangun sikap hormat kepada pengasuh & kawan`);
        setCPlannedActivities(`1. Kontrak perilaku (behavior contract) kedisiplinan\n2. Sesi anger management & terapi konseling emosi\n3. Pemberian reward/apresiasi atas kepatuhan harian`);
        setCInterventionsExecuted(`Kegiatan 1: Penandatanganan komitmen bersama wali asuh\nKegiatan 2: Pelatihan manajemen emosi & pengalihan energi positif lewat olahraga`);
        setCMonevW1(`Mulai mau merapikan kamar & mematuhi jadwal piket`);
        setCMonevW2(`Tidur tepat jam 21:30 WIB tanpa melanggar jam malam`);
        setCMonevW3(`Dapat mengontrol emosi saat dikritik kawan`);
        setCMonevW4(`Mendapat poin apresiasi kedisiplinan asrama`);
        setCMonevW5(`Perilaku sangat kooperatif & santun`);
        setCTermBio(`Fisik segar dan stamina terjaga dengan pola tidur teratur`);
        setCTermPsy(`Dapat mengekspresikan ketidaksetujuan secara santun tanpa marah`);
        setCTermSoc(`Menjadi teladan piket di kamar asrama`);
        setCTermSpi(`Hadir sholat berjamaah di shaf terdepan`);
        setCConclusion(`Regulasi emosi dan kedisiplinan anak membaik signifikan. Kasus resmi ditutup.`);
      }
      onShowToast('Quick Auto-Fill Berhasil', `Kolom formulir penanganan kasus (Lampiran 7) terisi lengkap.`, 'success');
    } else if (activeFormType === 'monitoring_perkembangan') {
      const newScores: Record<string, number> = {};
      const targetScore =
        scenarioType === 'optimal' || scenarioType === 'vocational_talent' || scenarioType === 'leadership_pioneer'
          ? 5
          : scenarioType === 'discipline' || scenarioType === 'bullying' || scenarioType === 'gadget_addiction' || scenarioType === 'social_isolation'
          ? 2
          : 3;

      Object.keys(mScores).forEach((key) => {
        newScores[key] = targetScore;
      });
      setMScores(newScores);
      setMProblemDesc(
        scenarioType === 'optimal' || scenarioType === 'leadership_pioneer'
          ? 'Tidak ada permasalahan berat. Anak menunjukkan keteladanan dan perkembangan sangat positif.'
          : scenarioType === 'vocational_talent'
          ? 'Anak sangat menonjol pada aspek vokasional & praktek kerja keterampilan.'
          : `Penyesuaian dan pendampingan khusus terkait aspek ${scenarioType.replace('_', ' ')}.`
      );
      setMProblemCause('Proses pembiasaan tata tertib & integrasi sosial Sekolah Rakyat.');
      setMProblemEffect('Meningkatkan ketahanan mental, kemandirian, & kedisiplinan anak.');
      setMActionsTaken('Pendampingan intensif wali asuh, pemberian motivasi harian, dan evaluasi kelompok.');
      setMFollowUp('Pertahankan capaian positif dan tingkatkan peran kepemimpinan siswa.');
      setMPositiveActivitiesAndRewards(
        scenarioType === 'optimal' || scenarioType === 'leadership_pioneer' || scenarioType === 'vocational_talent'
          ? 'Mendapat Penghargaan Siswa Teladan Bulan Ini & Poin Kebaikan tertinggi'
          : 'Mendapat apresiasi atas kemauan mematuhi tata tertib asrama.'
      );
      setMViolationsAndSanctions('Nihil / Tidak ada catatan pelanggaran berat.');
      onShowToast('Quick Auto-Fill Berhasil', `Skor 59 indikator & narasi monev perkembangan terisi lengkap.`, 'success');
    } else {
      setRDutyLocation('Asrama Terpadu Sekolah Rakyat');
      setRAreaCondition('Kondusif, aman, dan dalam pengawasan penuh petugas piket');
      setRVulnerableCategory('Anak Asuh Asrama Sekolah Rakyat');
      setRProtectionIssues('Tidak ada isu diskriminasi, kekerasan, maupun perundungan.');
      setRUrgentNotes('Kondisi terkendali, ramah anak, dan seluruh hak terpenuhi.');
      onShowToast('Quick Auto-Fill Berhasil', `Kolom Rapid Assessment terisi otomatis skenario ${scenarioType.toUpperCase()}.`, 'success');
    }
  };

  // Filtered log records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logRecords.filter((r) => {
      if (r.type !== activeFormType) return false;
      if (!q) return true;
      const stName = (r as any).studentName || (r as any).clientName || '';
      return stName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    });
  }, [logRecords, activeFormType, searchQuery]);

  // Clear Form
  const handleResetForm = () => {
    setEditingRecord(null);
    setFIncidentDescription('');
    setFStatements('');
    setFObservedBehavior('');
    setFWitnesses('');
    setFInitialActions('');
    setCMainProblem('');
    setCProblemCause('');
    setCImpactPhysical('');
    setCImpactPsychological('');
    setCImpactSocial('');
    setCImpactSpiritual('');
    setCGeneralGoal('');
    setCSpecificGoals('');
    setCPlannedActivities('');
    setCInterventionsExecuted('');
    setMProblemDesc('');
    setMProblemCause('');
    setMProblemEffect('');
    setMActionsTaken('');
    setMFollowUp('');
    setMPositiveActivitiesAndRewards('');
    setMViolationsAndSanctions('');
    applyMassScore(4);
    onShowToast('Form Dibersihkan', 'Kolom input telah dikosongkan.', 'info');
  };

  // Load Record for Editing Inline
  const handleEditInline = (record: KemensosLogRecord) => {
    setEditingRecord(record);
    setActiveFormType(record.type);

    if (record.type === 'temuan_peserta_didik') {
      setFStudentId(record.studentId);
      setFDate(record.incidentDate || record.date);
      setFTime(record.incidentTime || record.time);
      setFIncidentLocation(record.incidentLocation);
      setFIncidentDescription(record.incidentDescription);
      setFStatements(record.studentOrOtherStatements || '');
      setFObservedBehavior(record.observedBehavior || '');
      setFWitnesses(record.relevantWitnesses || '');
      setFInitialActions(record.initialActionsTaken || '');
      setFCaretakerName(record.caretakerName);
    } else if (record.type === 'penanganan_kasus') {
      setFStudentId(record.studentId);
      setFDate(record.caseOpeningDate);
      setFCaretakerName(record.caretakerName);
      setCMainProblem(record.mainProblem);
      setCProblemCause(record.problemCause);
      setCImpactPhysical(record.impactPhysical);
      setCImpactPsychological(record.impactPsychological);
      setCImpactSocial(record.impactSocial);
      setCImpactSpiritual(record.impactSpiritual);
      setCGeneralGoal(record.generalGoal);
      setCSpecificGoals(record.specificGoals ? record.specificGoals.join('\n') : '');
      setCPlannedActivities(record.plannedActivities ? record.plannedActivities.join('\n') : '');
      setCInterventionsExecuted(record.interventionsExecuted ? record.interventionsExecuted.join('\n') : '');
      setCMonevW1(record.monevResults?.week1 || '');
      setCMonevW2(record.monevResults?.week2 || '');
      setCMonevW3(record.monevResults?.week3 || '');
      setCTermBio(record.terminationBiological);
      setCTermPsy(record.terminationPsychological);
      setCTermSoc(record.terminationSocial);
      setCTermSpi(record.terminationSpiritual);
      setCConclusion(record.caseConclusion);
    } else if (record.type === 'monitoring_perkembangan') {
      setFStudentId(record.studentId);
      setMMonevNumber(record.monevNumber);
      setMMonthYear(record.monthYear);
      setMScores(record.scores || {});
      setMProblemDesc(record.problemDescription || '');
      setMProblemCause(record.problemCause || '');
      setMProblemEffect(record.problemEffect || '');
      setMActionsTaken(record.actionsTaken || '');
      setMFollowUp(record.followUpPlan || '');
      setMPositiveActivitiesAndRewards(record.positiveActivitiesAndRewards || '');
      setMViolationsAndSanctions(record.violationsAndSanctions || '');
      setFCaretakerName(record.caretakerName);
    } else if (record.type === 'rapid_assessment') {
      setFCaretakerName(record.peksosName || fCaretakerName);
      setFDate(record.dutyDate || fDate);
      setFTime(record.dutyTime || fTime);
      setRDutyLocation(record.dutyLocation || rDutyLocation);
      setRAreaCondition(record.areaCondition || rAreaCondition);
      setRVulnerableCategory(record.vulnerableCategory || rVulnerableCategory);
      setRRights(record.rightsFulfillment || rRights);
      setRProtectionIssues(record.protectionIssues?.kekerasan || rProtectionIssues);
      setRUrgentNotes(record.urgentNotes?.safety || rUrgentNotes);
    }

    onShowToast('Mode Edit Aktif', `Memuat data ${record.id} ke kolom form inline.`, 'info');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submit New or Edit Record
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const nowIso = new Date().toISOString();
    const st = selectedStudent || { id: 'SISWA-01', name: 'Siswa Contoh', class: 'SD', dorm: 'Dewantara' };

    let recordToSave: KemensosLogRecord;

    if (activeFormType === 'temuan_peserta_didik') {
      recordToSave = {
        id: editingRecord?.id || `KMS-FIND-${Date.now()}`,
        type: 'temuan_peserta_didik',
        date: fDate,
        time: fTime,
        studentId: st.id,
        studentName: st.name,
        studentAge: '12',
        studentGender: st.gender || 'Laki-Laki',
        studentClass: st.class,
        studentDorm: st.dorm,
        incidentDate: fDate,
        incidentTime: fTime,
        incidentLocation: fIncidentLocation,
        incidentDescription: fIncidentDescription || 'Catatan temuan pengamatan harian.',
        studentOrOtherStatements: fStatements || '-',
        observedBehavior: fObservedBehavior || '-',
        relevantWitnesses: fWitnesses || '-',
        initialActionsTaken: fInitialActions || 'Pendampingan awal oleh wali asuh.',
        recordingDate: fDate,
        recordingTime: fTime,
        caretakerName: fCaretakerName,
        createdAt: editingRecord?.createdAt || nowIso,
      };
    } else if (activeFormType === 'penanganan_kasus') {
      recordToSave = {
        id: editingRecord?.id || `KMS-CASE-${Date.now()}`,
        type: 'penanganan_kasus',
        schoolName: config.kopKanan ? config.kopKanan.split('\n')[0] : 'Sekolah Rakyat Terintegrasi 31 Palembang',
        caretakerName: fCaretakerName,
        caseOpeningDate: fDate,
        studentId: st.id,
        studentName: st.name,
        studentAge: '12',
        studentGender: st.gender || 'Laki-Laki',
        studentClass: st.class,
        mainProblem: cMainProblem || 'Perilaku memerlukan pendampingan khusus.',
        problemCause: cProblemCause || 'Faktor adaptasi lingkungan asrama.',
        impactPhysical: cImpactPhysical || 'Kondisi fisik stabil.',
        impactPsychological: cImpactPsychological || 'Kecemasan ringan.',
        impactSocial: cImpactSocial || 'Perlu peningkatan interaksi.',
        impactSpiritual: cImpactSpiritual || 'Ibadah teratur.',
        generalGoal: cGeneralGoal || 'Pemulihan dan pembentukan kedisiplinan positif.',
        specificGoals: cSpecificGoals.split('\n').filter(Boolean),
        plannedActivities: cPlannedActivities.split('\n').filter(Boolean),
        interventionsExecuted: cInterventionsExecuted.split('\n').filter(Boolean),
        monevMethods: [cMonevMethods],
        monevResults: {
          week1: cMonevW1 || 'Progres baik pada minggu pertama',
          week2: cMonevW2 || 'Progres positif berlanjut',
          week3: cMonevW3 || 'Perilaku makin stabil',
          week4: cMonevW4 || 'Meningkat signifikan',
          week5: cMonevW5 || 'Sangat memuaskan',
        },
        terminationBiological: cTermBio,
        terminationPsychological: cTermPsy,
        terminationSocial: cTermSoc,
        terminationSpiritual: cTermSpi,
        caseConclusion: cConclusion,
        caseClosingDate: fDate,
        createdAt: editingRecord?.createdAt || nowIso,
      };
    } else if (activeFormType === 'monitoring_perkembangan') {
      recordToSave = {
        id: editingRecord?.id || `KMS-MONEV-${Date.now()}`,
        type: 'monitoring_perkembangan',
        studentId: st.id,
        studentName: st.name,
        registerNo: st.id,
        monevNumber: mMonevNumber,
        monthYear: mMonthYear,
        scores: mScores,
        problemDescription: mProblemDesc || 'Adaptasi kebiasaan harian asrama',
        problemCause: mProblemCause || 'Proses penyesuaian tata tertib panti/asrama',
        problemEffect: mProblemEffect || 'Dibutuhkan bimbingan konsisten wali asuh',
        actionsTaken: mActionsTaken || 'Pembinaan rutin wali asuh',
        followUpPlan: mFollowUp || 'Evaluasi bulanan',
        positiveActivitiesAndRewards: mPositiveActivitiesAndRewards || 'Mendapat apresiasi atas kedisiplinan harian',
        violationsAndSanctions: mViolationsAndSanctions || 'Nihil / Tidak ada sanksi berat',
        caretakerName: fCaretakerName,
        createdAt: editingRecord?.createdAt || nowIso,
      };
    } else {
      recordToSave = {
        id: editingRecord?.id || `KMS-RAPID-${Date.now()}`,
        type: 'rapid_assessment',
        peksosName: fCaretakerName,
        dutyDate: fDate,
        dutyTime: fTime,
        dutyLocation: rDutyLocation,
        areaCondition: rAreaCondition,
        vulnerableCategory: rVulnerableCategory,
        clientName: st.name,
        rightsFulfillment: rRights,
        protectionIssues: { kekerasan: rProtectionIssues },
        urgentNotes: { safety: rUrgentNotes },
        peksosSupervisor: config.waliAsrama || 'Hisnul Hashin, SE',
        peksosDuty: fCaretakerName,
        createdAt: editingRecord?.createdAt || nowIso,
      };
    }

    onSaveLogRecord(recordToSave, !!editingRecord);
    onShowToast('Tersimpan', `Catatan ${recordToSave.id} berhasil disimpan ke database.`, 'success');
    setEditingRecord(null);
  };

  // Print PDF
  const handlePrintPDF = (record: KemensosLogRecord) => {
    if (record.type === 'temuan_peserta_didik') {
      generateKemensosFindingPDF(record, config);
    } else if (record.type === 'penanganan_kasus') {
      generateKemensosCasePDF(record, config);
    } else if (record.type === 'monitoring_perkembangan') {
      generateKemensosMonevPDF(record, config);
    } else if (record.type === 'rapid_assessment') {
      generateKemensosRapidAssessmentPDF(record, config);
    }
    onShowToast('Mencetak PDF', 'Dokumen resmi Kemensos berhasil dihasilkan.', 'success');
  };

  // Delete Record
  const handleDelete = async (id: string, name: string) => {
    const confirm = await onAskConfirm(
      'Hapus Pencatatan Kemensos?',
      `Apakah Anda yakin ingin menghapus catatan dokumen untuk ${name}?`
    );
    if (confirm) {
      onDeleteLogRecord(id);
      onShowToast('Dihapus', 'Catatan Kemensos berhasil dihapus.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Pencatatan Modul 7 Kemensos RI (2026)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pencatatan & Reporting Asrama Sekolah Rakyat
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Formulir baku pengasuhan asrama terintegrasi. Semua kolom dapat diisi secara manual online atau otomatis menggunakan Auto-Fill. Hasil pengisian dapat langsung dicetak ke PDF format resmi Kemensos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">Total Dokumen</span>
            <span className="text-lg font-black text-amber-400">{logRecords.length} Records</span>
          </div>
        </div>
      </div>

      {/* TABS SWITCHER: 4 FORM TYPES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveFormType('temuan_peserta_didik')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeFormType === 'temuan_peserta_didik'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">1. Temuan Siswa (Form Awal)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFormType('penanganan_kasus')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeFormType === 'penanganan_kasus'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">2. Penanganan Kasus (Lamp. 7)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFormType('monitoring_perkembangan')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeFormType === 'monitoring_perkembangan'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="truncate">3. Monev 59 Indikator (Lamp. 4)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFormType('rapid_assessment')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeFormType === 'rapid_assessment'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="truncate">4. Rapid Assessment (Lamp. 3)</span>
        </button>
      </div>

      {/* SECTION 1: INLINE FORM INPUT (NO POPUP - Direct Page Embedding) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4">
        {/* Form Section Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>
                  {activeFormType === 'temuan_peserta_didik' && 'Formulir Pencatatan Temuan Peserta Didik'}
                  {activeFormType === 'penanganan_kasus' && 'Catatan Penanganan Kasus Anak (Lampiran 7)'}
                  {activeFormType === 'monitoring_perkembangan' && 'Lembar Monev 59 Indikator Perkembangan Anak (Lampiran 4)'}
                  {activeFormType === 'rapid_assessment' && 'Rapid Assessment Form Pekerja Sosial (Lampiran 3)'}
                </span>
                {editingRecord && (
                  <span className="text-[10px] bg-amber-500 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                    Mode Edit: {editingRecord.id}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                Isi kolom di bawah ini secara manual atau gunakan tombol Auto-Fill Kasus Contoh untuk pengisian cepat.
              </p>
            </div>
          </div>

          {editingRecord && (
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs font-bold text-amber-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Batal Edit / Form Baru
            </button>
          )}
        </div>

        {/* QUICK AUTO-FILL SCENARIO PRESETS BAR */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
              Quick Auto-Fill Contoh Kasus (Satu-Klik Isi Otomatis Kolom):
            </label>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Kosongkan Kolom
            </button>
          </div>

          {/* Scenario Buttons Grid (14 Presets) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyQuickScenarioPreset(preset.id)}
                className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold flex flex-col items-start justify-between gap-1 shadow-xs transition active:scale-95 cursor-pointer border ${preset.color} ${preset.border}`}
                title={`Klik untuk mengisi formulir dengan skenario: ${preset.title}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase font-mono tracking-wider opacity-80 bg-black/20 px-1.5 py-0.5 rounded-xs">
                    #{preset.num}
                  </span>
                  <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
                </div>
                <span className="line-clamp-2 text-left leading-tight font-bold">{preset.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INLINE FORM BODY */}
        <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-6">
          {/* Identitas Siswa & Petugas Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa / Anak Asuh</label>
              <select
                value={fStudentId}
                onChange={(e) => setFStudentId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.class} • Gedung {st.dorm} • NISN: {st.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal / Hari Pencatatan</label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Wali Asuh / Pendamping</label>
              <input
                type="text"
                value={fCaretakerName}
                onChange={(e) => setFCaretakerName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* 1. FORMULIR TEMUAN PESERTA DIDIK (FORM AWAL) */}
          {activeFormType === 'temuan_peserta_didik' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Kejadian / Pengamatan</label>
                  <input
                    type="time"
                    value={fTime}
                    onChange={(e) => setFTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kejadian / Temuan</label>
                  <input
                    type="text"
                    value={fIncidentLocation}
                    onChange={(e) => setFIncidentLocation(e.target.value)}
                    placeholder="e.g. Gedung Asrama Putra / Ruang Makan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">C. Uraian Kejadian / Temuan Objektif</label>
                <textarea
                  value={fIncidentDescription}
                  onChange={(e) => setFIncidentDescription(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan kronologi kejadian berdasarkan fakta yang didapat di lapangan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">D. Pernyataan Peserta Didik / Pihak Lain</label>
                <textarea
                  value={fStatements}
                  onChange={(e) => setFStatements(e.target.value)}
                  rows={2}
                  placeholder="Tuliskan pernyataan atau pengakuan langsung dari siswa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E. Deskripsi Kondisi / Perilaku Tampak</label>
                  <input
                    type="text"
                    value={fObservedBehavior}
                    onChange={(e) => setFObservedBehavior(e.target.value)}
                    placeholder="e.g. Tampak cemas, murung, gemetar ringan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">F. Pihak / Saksi yang Relevan</label>
                  <input
                    type="text"
                    value={fWitnesses}
                    onChange={(e) => setFWitnesses(e.target.value)}
                    placeholder="e.g. Ahmad (Pengasuh Piket) & Siti (Guru)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">G. Langkah Awal yang Telah Dilakukan Wali Asuh</label>
                <textarea
                  value={fInitialActions}
                  onChange={(e) => setFInitialActions(e.target.value)}
                  rows={2}
                  placeholder="Tuliskan tindakan pendampingan pertama oleh wali asuh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
                />
              </div>
            </div>
          )}

          {/* 2. CATATAN PENANGANAN KASUS ANAK (LAMPIRAN 7) */}
          {activeFormType === 'penanganan_kasus' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600 shrink-0" />
                <span>Formulir Lampiran 7 Kemensos: Catatan Penanganan Kasus Anak Lengkap</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1a. Permasalahan Utama & Gejala Masalah</label>
                <textarea
                  value={cMainProblem}
                  onChange={(e) => setCMainProblem(e.target.value)}
                  rows={2}
                  placeholder="Uraikan gejala utama dan permasalahan anak..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1b. Penyebab Masalah</label>
                <input
                  type="text"
                  value={cProblemCause}
                  onChange={(e) => setCProblemCause(e.target.value)}
                  placeholder="Akar penyebab permasalahan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">1c. Dampak Biologis / Fisik</label>
                  <input
                    type="text"
                    value={cImpactPhysical}
                    onChange={(e) => setCImpactPhysical(e.target.value)}
                    placeholder="Keluhan pusing / mual..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dampak Psikologis</label>
                  <input
                    type="text"
                    value={cImpactPsychological}
                    onChange={(e) => setCImpactPsychological(e.target.value)}
                    placeholder="Kecemasan / percaya diri..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dampak Sosial</label>
                  <input
                    type="text"
                    value={cImpactSocial}
                    onChange={(e) => setCImpactSocial(e.target.value)}
                    placeholder="Interaksi dengan kawan..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dampak Spiritual</label>
                  <input
                    type="text"
                    value={cImpactSpiritual}
                    onChange={(e) => setCImpactSpiritual(e.target.value)}
                    placeholder="Rutinitas ibadah..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2a. Tujuan Umum Intervensi</label>
                  <input
                    type="text"
                    value={cGeneralGoal}
                    onChange={(e) => setCGeneralGoal(e.target.value)}
                    placeholder="Tujuan umum penanganan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2b. Tujuan Khusus (Pisahkan dengan Enter)</label>
                  <textarea
                    value={cSpecificGoals}
                    onChange={(e) => setCSpecificGoals(e.target.value)}
                    rows={2}
                    placeholder="1. Mengurangi cemas&#10;2. Meningkatkan disiplin"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">3. Intervensi yang Dilakukan</label>
                <textarea
                  value={cInterventionsExecuted}
                  onChange={(e) => setCInterventionsExecuted(e.target.value)}
                  rows={2}
                  placeholder="Kegiatan 1: Konseling suportif&#10;Kegiatan 2: Pendampingan ibadah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              {/* Monev Hasil Mingguan */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">4. Hasil Monev Mingguan (Minggu 1 s/d 5):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={cMonevW1}
                    onChange={(e) => setCMonevW1(e.target.value)}
                    placeholder="Minggu 1: Progress..."
                    className="bg-white border border-slate-200 rounded-xl p-2"
                  />
                  <input
                    type="text"
                    value={cMonevW2}
                    onChange={(e) => setCMonevW2(e.target.value)}
                    placeholder="Minggu 2: Progress..."
                    className="bg-white border border-slate-200 rounded-xl p-2"
                  />
                  <input
                    type="text"
                    value={cMonevW3}
                    onChange={(e) => setCMonevW3(e.target.value)}
                    placeholder="Minggu 3: Progress..."
                    className="bg-white border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">5b. Kesimpulan Penanganan & Terminasi</label>
                <input
                  type="text"
                  value={cConclusion}
                  onChange={(e) => setCConclusion(e.target.value)}
                  placeholder="Kesimpulan penanganan kasus..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-emerald-800"
                />
              </div>
            </div>
          )}

          {/* 3. MONITORING PERKEMBANGAN ANAK ASUH (LAMPIRAN 4 - FULL ONLINE MANUAL 59 INDIKATOR) */}
          {activeFormType === 'monitoring_perkembangan' && (
            <div className="space-y-6">
              {/* Top Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monev Ke- (Sesi Penilaian)</label>
                  <input
                    type="number"
                    min={1}
                    value={mMonevNumber}
                    onChange={(e) => setMMonevNumber(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bulan & Tahun Evaluasi</label>
                  <input
                    type="text"
                    value={mMonthYear}
                    onChange={(e) => setMMonthYear(e.target.value)}
                    placeholder="e.g. Oktober 2026"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold"
                  />
                </div>
              </div>

              {/* OVERALL SCORE SUMMARY DASHBOARD */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-400" />
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      Ringkasan Skor Penilaian 59 Indikator Perkembangan
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Nilai Likert: 1=Sangat Kurang, 2=Kurang, 3=Cukup, 4=Baik, 5=Sangat Baik.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">Rata-Rata Skor</span>
                    <span className="text-base font-black text-amber-300">{indicatorStats.avg} / 5.0</span>
                  </div>

                  <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">Total Capaian</span>
                    <span className="text-base font-black text-emerald-400">{indicatorStats.percentage}%</span>
                  </div>

                  <div className={`px-3.5 py-2 rounded-xl border font-black text-xs ${indicatorStats.gradeColor}`}>
                    <span>{indicatorStats.gradeLabel}</span>
                  </div>
                </div>
              </div>

              {/* QUICK MASS SCORE SETTER & SEARCH */}
              <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-600 mr-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Atur Semua Skor:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyMassScore(5)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition cursor-pointer"
                  >
                    Set Semua 5 (Sangat Baik)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyMassScore(4)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] transition cursor-pointer"
                  >
                    Set Semua 4 (Baik)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyMassScore(3)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] transition cursor-pointer"
                  >
                    Set Semua 3 (Cukup)
                  </button>
                  <button
                    type="button"
                    onClick={applyRandomHighScores}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[11px] transition cursor-pointer"
                  >
                    Variasi (4 & 5)
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={indicatorSearchQuery}
                    onChange={(e) => setIndicatorSearchQuery(e.target.value)}
                    placeholder="Cari indikator..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* 59 INDICATORS ACCORDIONS MATRIX */}
              <div className="space-y-4">
                {MONEV_INDICATORS.map((group) => {
                  const filteredItems = group.items.filter((item) => {
                    if (!indicatorSearchQuery) return true;
                    const q = indicatorSearchQuery.toLowerCase();
                    return item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
                  });

                  if (filteredItems.length === 0) return null;

                  const isCollapsed = !!collapsedCategories[group.code];

                  return (
                    <div
                      key={group.code}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                    >
                      {/* Group Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedCategories((prev) => ({ ...prev, [group.code]: !prev[group.code] }))
                        }
                        className="w-full bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-black text-amber-300 text-xs">
                            {group.code}
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-white text-left">
                            {group.category}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-slate-300 font-bold hidden sm:inline-block">
                            {group.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {isCollapsed ? 'Buka' : 'Tutup'}
                          </span>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-300" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </button>

                      {/* Indicator List */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {filteredItems.map((item) => {
                            const currentVal = mScores[item.id] || 4;

                            return (
                              <div
                                key={item.id}
                                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                              >
                                <div className="space-y-0.5 max-w-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200 shrink-0">
                                      {group.code}.{item.num}
                                    </span>
                                    <h5 className="font-extrabold text-xs text-slate-900">
                                      {item.title}
                                    </h5>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    {item.desc}
                                  </p>
                                </div>

                                {/* Likert Score Selector Buttons (1 - 5) */}
                                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                                  {[
                                    { score: 1, label: 'Sangat Kurang', color: 'bg-red-600 text-white ring-2 ring-red-400' },
                                    { score: 2, label: 'Kurang', color: 'bg-amber-600 text-white ring-2 ring-amber-400' },
                                    { score: 3, label: 'Cukup', color: 'bg-yellow-500 text-white ring-2 ring-yellow-400' },
                                    { score: 4, label: 'Baik', color: 'bg-emerald-600 text-white ring-2 ring-emerald-400' },
                                    { score: 5, label: 'Sangat Baik', color: 'bg-blue-600 text-white ring-2 ring-blue-400' },
                                  ].map((sc) => {
                                    const isSelected = currentVal === sc.score;
                                    return (
                                      <button
                                        key={sc.score}
                                        type="button"
                                        onClick={() =>
                                          setMScores((prev) => ({ ...prev, [item.id]: sc.score }))
                                        }
                                        title={`${sc.score} - ${sc.label}`}
                                        className={`w-9 h-9 rounded-xl font-black text-xs transition active:scale-95 flex items-center justify-center cursor-pointer ${
                                          isSelected
                                            ? `${sc.color} shadow-md scale-105`
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                        }`}
                                      >
                                        {sc.score}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* NARRATIVE SECTION E: PERKEMBANGAN PEMECAHAN MASALAH / KASUS */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  E. Catatan Perkembangan Pemecahan Masalah / Kasus
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">1. Permasalahan Utama</label>
                    <textarea
                      value={mProblemDesc}
                      onChange={(e) => setMProblemDesc(e.target.value)}
                      rows={2}
                      placeholder="e.g. Adaptasi kebiasaan harian & kedisiplinan sholat..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">2. Penyebab Masalah</label>
                    <textarea
                      value={mProblemCause}
                      onChange={(e) => setMProblemCause(e.target.value)}
                      rows={2}
                      placeholder="e.g. Kurangnya kebiasaan struktur jadwal di rumah asal..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">3. Akibat yang Timbul</label>
                    <textarea
                      value={mProblemEffect}
                      onChange={(e) => setMProblemEffect(e.target.value)}
                      rows={2}
                      placeholder="e.g. Dibutuhkan bimbingan intensif wali asuh..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">4. Langkah-Langkah yang Ditempuh Wali Asuh</label>
                    <textarea
                      value={mActionsTaken}
                      onChange={(e) => setMActionsTaken(e.target.value)}
                      rows={2}
                      placeholder="e.g. Pendampingan rutin sholat, pengarahan kamar, dan bimbingan konseling..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">5. Rencana Tindak Lanjut (RTL)</label>
                    <textarea
                      value={mFollowUp}
                      onChange={(e) => setMFollowUp(e.target.value)}
                      rows={2}
                      placeholder="e.g. Evaluasi bulanan lanjutan & pembentukan buddy system..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* NARRATIVE SECTION F: PENILAIAN SECARA UMUM (HADIAH & PELANGGARAN) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  F. Penilaian Secara Umum (Prestasi & Pelanggaran)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">1. Kegiatan Positif & Hadiah / Apresiasi Ditrimanya</label>
                    <textarea
                      value={mPositiveActivitiesAndRewards}
                      onChange={(e) => setMPositiveActivitiesAndRewards(e.target.value)}
                      rows={2}
                      placeholder="e.g. Mendapat Bintang Kebaikan atas kedisiplinan piket kamar & sholat berjamaah..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">2. Pelanggaran & Sanksi Diberikan</label>
                    <textarea
                      value={mViolationsAndSanctions}
                      onChange={(e) => setMViolationsAndSanctions(e.target.value)}
                      rows={2}
                      placeholder="e.g. Nihil / Tidak ada catatan pelanggaran berat..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. RAPID ASSESSMENT FORM (LAMPIRAN 3 - FULL ONLINE MANUAL FORM) */}
          {activeFormType === 'rapid_assessment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Bertugas</label>
                  <input
                    type="text"
                    value={rDutyLocation}
                    onChange={(e) => setRDutyLocation(e.target.value)}
                    placeholder="e.g. Asrama Terpadu Sekolah Rakyat"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Situasi Area Bertugas</label>
                  <input
                    type="text"
                    value={rAreaCondition}
                    onChange={(e) => setRAreaCondition(e.target.value)}
                    placeholder="e.g. Kondusif, aman, dan terawasi"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Kelompok Rentan</label>
                  <input
                    type="text"
                    value={rVulnerableCategory}
                    onChange={(e) => setRVulnerableCategory(e.target.value)}
                    placeholder="e.g. Anak Asuh Asrama Sekolah Rakyat"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Pemenuhan 7 Hak Anak */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Evaluasi Pemenuhan Hak-Hak Anak (7 Hak Dasar):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                  {[
                    { key: 'hakHidup', label: '1. Hak Hidup & Nutrisi' },
                    { key: 'kelangsunganHidup', label: '2. Kelangsungan Hidup & Pakaian' },
                    { key: 'tumbuhKembang', label: '3. Tumbuh-Kembang & Ekstra' },
                    { key: 'pengasuhan', label: '4. Pengasuhan Keluarga / Asrama' },
                    { key: 'identitas', label: '5. Identitas & Akta Lahir' },
                    { key: 'pendapat', label: '6. Hak Berpendapat & Ekspresi' },
                    { key: 'kesehatan', label: '7. Hak Kesehatan & Pendidikan' },
                  ].map((h) => (
                    <div key={h.key}>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">{h.label}</label>
                      <input
                        type="text"
                        value={rRights[h.key] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRRights((prev) => ({ ...prev, [h.key]: val }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Isu Perlindungan (Kekerasan / Diskriminasi)</label>
                  <textarea
                    value={rProtectionIssues}
                    onChange={(e) => setRProtectionIssues(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Keselamatan Urgent (Urgent Safety Notes)</label>
                  <textarea
                    value={rUrgentNotes}
                    onChange={(e) => setRUrgentNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions (Inline Buttons) */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Reset / Kosongkan Kolom
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pencatatan Kemensos</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECTION 2: SAVED DOCUMENT RECORDS LIST & ONE-CLICK PDF PRINTING */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-red-600" />
              Daftar Catatan & Dokumen Tersimpan ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen siap dicetak langsung ke format PDF resmi Kementerian Sosial RI.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>

        {/* Grid of Saved Log Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-extrabold text-slate-700 text-sm">Belum Ada Dokumen Tersimpan pada Kategori Ini</p>
              <p className="text-xs text-slate-400">Gunakan form di atas dan klik &quot;Simpan Pencatatan Kemensos&quot;.</p>
            </div>
          ) : (
            filteredRecords.map((r: any) => {
              const stName = r.studentName || r.clientName || 'Siswa';
              const rDate = r.date || r.caseOpeningDate || r.recordingDate || r.dutyDate || r.createdAt.split('T')[0];

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {r.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {rDate}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {stName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Wali Asuh: {r.caretakerName || r.peksosName || config.waliAsrama || 'Pengasuh'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                      {r.incidentDescription || r.mainProblem || r.problemDescription || r.areaCondition || 'Dokumen resmi Kemensos.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintPDF(r)}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditInline(r)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit di Form Inline"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(r.id, stName)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
