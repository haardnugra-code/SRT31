import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  UserCheck,
  Package,
  Calendar,
  ShieldAlert,
  Brain,
  Mail,
  Users,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  Save,
  Clock,
  ChevronRight, RefreshCw,
  BookOpen,
  ArrowRight,
  FileCheck,
  User,
  ExternalLink,
  Edit3,
  Camera,
  CheckCircle2,
  Scan,
  UserX
} from 'lucide-react';
import { Student, AppConfig, OfficialLetter, OfficialLetterType, LetterSupplyItem, PrayerAttendance } from '../types';
import { generateOfficialLetterPDF } from '../services/letterPdfGenerator';
import { loadOfficialLetters, saveOfficialLetters } from '../services/storage';
import { formatDateIndonesian } from '../utils/dateFormatter';

interface LetterGeneratorTabProps {
  students: Student[];
  prayerAttendance?: PrayerAttendance[];
  config: AppConfig;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'warning') => void;
  initialStudentId?: string;
  initialLetterType?: OfficialLetterType;
  initialAttendanceDate?: string;
  initialAttendanceSession?: string;
}

// Psychology Theories Templates for Case Chronology
const PSYCHOLOGY_TEMPLATES = [
  {
    name: 'Teori Perkembangan Psikososial (Erik Erikson)',
    category: 'Identitas Diri & Penyesuaian Remaja',
    theoryAnalysis: `Berdasarkan perspektif Psikososial Erik Erikson, peserta didik berada pada tahapan transisi krusial (Identity vs. Role Confusion). Permasalahan perilaku dan ketidakstabilan emosi yang dialami merupakan manifestasi dari pencarian jati diri, kebutuhan akan pengakuan teman sebaya di lingkungan asrama, serta resistensi terhadap batas-batas otoritas. Dinamika isolasi keluarga pada sistem asrama berasrama memicu kecemasan adaptif yang belum terkanalisasi secara konstruktif.`,
    actionsTaken: `1. Melakukan konseling individual mendalam dengan pendekatan eksplorasi nilai diri dan regulasi emosi.\n2. Memberikan ruang ventilasi emosional tanpa penghakiman (unconditional positive regard) agar anak merasa didengar.\n3. Melibatkan anak dalam tugas-tugas kepemimpinan kamar untuk memupuk tanggung jawab positif.\n4. Koordinasi dengan Guru BK dan Wali Kamar untuk pemantauan interaksi sosial sehari-hari.`,
    followUpActions: `1. Penjadwalan sesi mentoring mingguan dengan Wali Asuh untuk penguatan konsep diri dan kedisiplinan.\n2. Kontrak perilaku positif (Behavioral Contract) dengan reward apresiatif terstruktur.\n3. Evaluasi berkala integrasi sosial di kelas dan kegiatan ibadah asrama bersama guru pengampu.`
  },
  {
    name: 'Teori Kelekatan & Trauma-Informed (John Bowlby & Bruce Perry)',
    category: 'Kecemasan Separasi & Emosi Kelekatan',
    theoryAnalysis: `Berdasarkan Teori Kelekatan (Attachment Theory) John Bowlby dan prinsip Trauma-Informed Care, perilaku defensif/menarik diri/agresif anak merupakan respon terhadap rasa tidak aman (insecure attachment) akibat perpisahan dengan lingkungan keluarga inti. Sistem saraf anak merespons situasi stres asrama sebagai ancaman (fight-or-flight response), sehingga memunculkan disregulasi emosi dan kesulitan memercayai figur pengasuh baru.`,
    actionsTaken: `1. Membangun figur kelekatan aman (secure base) melalui kehadiran empati dan pendampingan konsisten oleh Wali Asuh.\n2. Stabilisasi kondisi fisik dan emosional di ruang konseling yang aman dan tenang.\n3. Mengidentifikasi pemicu stresor lingkungan (triggers) di kamar tidur dan area belajar.\n4. Mengizinkan komunikasi terstruktur dengan orang tua/wali untuk meredakan kecemasan separasi.`,
    followUpActions: `1. Penerapan teknik grounding dan regulasi pernapasan saat anak menunjukkan tanda-tanda hiperarousal.\n2. Pendampingan teman sebaya positif (buddy system) yang suportif di asrama.\n3. Koordinasi berkala dengan layanan kesehatan mental/psikolog bila gejala disregulasi berlanjut.`
  },
  {
    name: 'Teori Pembelajaran Sosial & Perilaku (Albert Bandura & B.F. Skinner)',
    category: 'Pengaruh Lingkungan & Modifikasi Perilaku',
    theoryAnalysis: `Berdasarkan Teori Pembelajaran Sosial (Social Learning Theory) Albert Bandura, perilaku menyimpang atau ketidakdisiplinan yang ditunjukkan merupakan hasil proses peniruan (modeling) terhadap interaksi lingkungan atau penguatan keliru (reinforcement trap) di masa lalu. Anak memerlukan restrukturisasi persepsi konsekuensi serta keteladanan figur dewasa yang konsisten dan berkeadilan.`,
    actionsTaken: `1. Klarifikasi konsekuensi logis sesuai buku pedoman tata tertib keasramaan secara dialogis.\n2. Mengidentifikasi faktor penguat negatif yang mempertahankan perilaku tidak adaptif.\n3. Memberikan umpan balik langsung (immediate constructive feedback) atas kemajuan sikap positif siswa.\n4. Pemberian sanksi edukatif terstruktur yang berorientasi pada perbaikan perilaku (restorative justice).`,
    followUpActions: `1. Pembuatan tabel target kedisiplinan harian (Daily Habit Tracker) yang diparaf wali asuh.\n2. Pemberian apresiasi berkala saat siswa berhasil memenuhi target target perilaku positif.\n3. Pengawasan terarah pada jam-jam rawan (istirahat, malam hari, dan transisi kegiatan).`
  },
  {
    name: 'Teori Hierarki Kebutuhan Dasar (Abraham Maslow)',
    category: 'Kebutuhan Rasa Aman, Kasih Sayang & Aktualisasi',
    theoryAnalysis: `Berdasarkan Teori Hierarki Kebutuhan Maslow, anak mengalami defisit pada pemenuhan kebutuhan dasar tingkat rasa aman (safety needs) serta kebutuhan rasa memiliki dan kasih sayang (belongingness and love needs). Ketidakmampuan memenuhi kebutuhan ini di asrama mendorong timbulnya perilaku kompensatori seperti agresi, pencarian perhatian negatif, atau keputusasaan belajar.`,
    actionsTaken: `1. Memastikan lingkungan asrama memenuhi rasa aman fisik dan psikologis bagi anak (bebas bullying).\n2. Melakukan pendekatan personal untuk mengenali minat, bakat, serta aspirasi pribadi anak.\n3. Memfasilitasi interaksi inklusif dalam kelompok belajar dan regu piket asrama.`,
    followUpActions: `1. Mengarahkan anak pada kegiatan ekstrakurikuler seni/olahraga/keagamaan sesuai minat untuk aktualisasi diri.\n2. Pemantauan nutrisi, waktu istirahat, dan kebersihan diri yang memadai.\n3. Koordinasi dengan guru kelas untuk penguatan prestasi akademik yang realistis.`
  }
];

export const LetterGeneratorTab: React.FC<LetterGeneratorTabProps> = ({
  students,
  prayerAttendance = [],
  config,
  onShowToast,
  initialStudentId,
  initialLetterType = 'berita_acara_presensi',
  initialAttendanceDate,
  initialAttendanceSession
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [savedLetters, setSavedLetters] = useState<OfficialLetter[]>(loadOfficialLetters);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [letterType, setLetterType] = useState<OfficialLetterType>(initialLetterType);

  const generateAutoNumber = (letters: OfficialLetter[]) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `SR31/WA/${month}/${year}/`;
    let maxNum = 0;
    letters.forEach(letter => {
      if (letter.letterNumber && letter.letterNumber.startsWith(prefix)) {
        const parts = letter.letterNumber.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  const [letterNumber, setLetterNumber] = useState<string>(() => generateAutoNumber(loadOfficialLetters()));
  
  const handleRegenerateAutoNumber = () => {
    setLetterNumber(generateAutoNumber(savedLetters));
  };

  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [letterCity, setLetterCity] = useState<string>('Palembang');
  const [subject, setSubject] = useState<string>('Laporan Kronologi Kasus & Penanganan Psikologis Peserta Didik');
  const [enclosure, setEnclosure] = useState<string>('1 (Satu) Berkas');

  // Recipient
  const [recipientName, setRecipientName] = useState<string>('Bapak/Ibu Wali Asrama / Kepala Sekolah');
  const [recipientTitle, setRecipientTitle] = useState<string>('Pimpinan Keasramaan');
  const [recipientOffice, setRecipientOffice] = useState<string>('Sekolah Rakyat 31 Palembang');
  const [recipientAddress, setRecipientAddress] = useState<string>('di Tempat');

  // Author / Caretaker
  const [authorName, setAuthorName] = useState<string>(() => config.waliAsrama || 'Wali Asuh Asrama');
  const [authorNipOrId, setAuthorNipOrId] = useState<string>('');
  const [authorRole, setAuthorRole] = useState<string>('Wali Asuh Asrama Mandiri');

  // Student Associated
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentDorm, setStudentDorm] = useState<string>('');
  const [studentNisn, setStudentNisn] = useState<string>('');
  const [studentBirthDate, setStudentBirthDate] = useState<string>('');
  const [studentParentName, setStudentParentName] = useState<string>('');
  const [studentParentPhone, setStudentParentPhone] = useState<string>('');

  // Psychology Chronology Fields
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incidentLocation, setIncidentLocation] = useState<string>('Lingkungan Asrama Siswa SR 31');
  const [problemSummary, setProblemSummary] = useState<string>(
    'Siswa menunjukkan ketidakstabilan emosi, kecenderungan menyendiri, dan beberapa kali mangkir dari kegiatan asrama serta terlibat konflik lisan dengan teman sekamar.'
  );
  const [psychologyTheoryName, setPsychologyTheoryName] = useState<string>(PSYCHOLOGY_TEMPLATES[0].name);
  const [psychologyTheoryAnalysis, setPsychologyTheoryAnalysis] = useState<string>(PSYCHOLOGY_TEMPLATES[0].theoryAnalysis);
  const [actionsTaken, setActionsTaken] = useState<string>(PSYCHOLOGY_TEMPLATES[0].actionsTaken);
  const [followUpActions, setFollowUpActions] = useState<string>(PSYCHOLOGY_TEMPLATES[0].followUpActions);

  // Supply Logistics Fields
  const [supplyItems, setSupplyItems] = useState<LetterSupplyItem[]>([
    { id: '1', name: 'Dispenser Air Minum Kamar Siswa', quantity: 2, unit: 'Unit', estimatedPrice: 350000, urgency: 'Sangat Mendesak', reason: 'Dispenser lama rusak berat dan tidak memanaskan' },
    { id: '2', name: 'Sapu Lantai & Serokan Asrama', quantity: 6, unit: 'Buah', estimatedPrice: 35000, urgency: 'Mendesak', reason: 'Penggantian peralatan piket kebersihan kamar' },
    { id: '3', name: 'Obat-obatan Kotak P3K Asrama', quantity: 1, unit: 'Paket', estimatedPrice: 200000, urgency: 'Sangat Mendesak', reason: 'Stok obat pereda demam dan minyak angin habis' }
  ]);

  // Leave / Staff Fields
  const [leaveType, setLeaveType] = useState<'Sakit' | 'Keperluan Keluarga' | 'Cuti / Urusan Pribadi' | 'Dinas Luar / Pelatihan'>('Keperluan Keluarga');
  const [leaveStartDate, setLeaveStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveTotalDays, setLeaveTotalDays] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState<string>('Menghadiri urusan keluarga mendesak di luar kota yang tidak dapat diwakilkan.');
  const [leaveHandoverStaff, setLeaveHandoverStaff] = useState<string>('Ustd. Ahmad Fauzi (Wali Asuh Pendamping)');

  // Attendance Recording & Berita Acara Fields (Face Recognition AI / Sholat / Asrama)
  const [attendanceDate, setAttendanceDate] = useState<string>(initialAttendanceDate || new Date().toISOString().split('T')[0]);
  const [attendanceSession, setAttendanceSession] = useState<string>(initialAttendanceSession || 'Subuh');
  const [attendanceTargetClass, setAttendanceTargetClass] = useState<string>('Semua Kelas');
  const [attendanceTargetDorm, setAttendanceTargetDorm] = useState<string>('Semua Asrama');
  const [attendanceTotalStudents, setAttendanceTotalStudents] = useState<number>(() => students.length || 0);
  const [attendancePresentCount, setAttendancePresentCount] = useState<number>(0);
  const [attendanceFaceCount, setAttendanceFaceCount] = useState<number>(0);
  const [attendanceQrCount, setAttendanceQrCount] = useState<number>(0);
  const [attendanceRfidCount, setAttendanceRfidCount] = useState<number>(0);
  const [attendanceManualCount, setAttendanceManualCount] = useState<number>(0);
  const [attendanceSickCount, setAttendanceSickCount] = useState<number>(0);
  const [attendanceLeaveCount, setAttendanceLeaveCount] = useState<number>(0);
  const [attendanceLateCount, setAttendanceLateCount] = useState<number>(0);
  const [attendanceAlphaCount, setAttendanceAlphaCount] = useState<number>(0);
  const [attendanceAbsentStudentNames, setAttendanceAbsentStudentNames] = useState<string>('');
  const [attendanceNotes, setAttendanceNotes] = useState<string>(
    'Pencatatan presensi sesi berjalan tertib melalui verifikasi Biometrik AI Face Recognition, Barcode QR Code, dan RFID.'
  );

  // Format Pelaporan Kemensos RI & Sekolah Rakyat Fields
  const [kemensosReportPeriod, setKemensosReportPeriod] = useState<string>('Bulan Oktober 2025');
  const [kemensosLegalBasis, setKemensosLegalBasis] = useState<string>(
    '1. UU RI No. 11 Tahun 2009 tentang Kesejahteraan Sosial.\n2. UU No. 14 Tahun 2019 tentang Pekerja Sosial.\n3. Peraturan Menteri Sosial RI tentang Standar Pelayanan Minimal (SPM) Asrama Sekolah Rakyat.\n4. SOP Tata Tertib & Keasramaan Terpadu Sekolah Rakyat 31 Palembang (Kemensos RI).'
  );
  const [kemensosObjectives, setKemensosObjectives] = useState<string>(
    'Akuntabilitas pencatatan kedisiplinan santri, pemantauan presensi sholat berjamaah berbasis Face Recognition AI, rekam medis kesehatan asrama, serta laporan dinamika psikososial peserta didik Sekolah Rakyat Kemensos RI.'
  );
  const [kemensosEvaluation, setKemensosEvaluation] = useState<string>(
    'Sebagian kecil peserta didik memerlukan motivasi konsisten untuk bangun qiyamul lail dan antrean wudhu tertib. Diperlukan sinergi antara Wali Asuh dan Guru BK.'
  );
  const [kemensosRecommendations, setKemensosRecommendations] = useState<string>(
    '1. Peningkatan jadwal supervisi piket malam terpadu.\n2. Pelaksanaan sesi bimbingan konseling berkala & penguatan karakter.\n3. Pemberian sertifikat / reward santri teladan kedisiplinan ibadah.'
  );

  // General Narrative
  const [bodyIntro, setBodyIntro] = useState<string>('Dengan hormat,');
  const [bodyMain, setBodyMain] = useState<string>(
    'Bersama surat ini, kami selaku Wali Asuh mengajukan permohonan sebagaimana perihal di atas untuk menjadi perhatian dan mendapatkan tindak lanjut dari pihak pimpinan keasramaan.'
  );
  const [bodyClosing, setBodyClosing] = useState<string>(
    'Demikian surat ini kami sampaikan dengan sebenarnya. Atas perhatian, arahan, dan perkenan Bapak/Ibu, kami ucapkan terima kasih.'
  );

  // Signatures
  const [signatureAuthorLabel, setSignatureAuthorLabel] = useState<string>('Wali Asuh / Pemohon,');
  const [acknowledgementName, setAcknowledgementName] = useState<string>(config.waliAsrama || 'HISNUL HASHIN, SE');
  const [acknowledgementNip, setAcknowledgementNip] = useState<string>(config.waliAsramaNip || 'NIP. 197406262025211027');
  const [acknowledgementTitle, setAcknowledgementTitle] = useState<string>(config.waliAsramaTitle || 'Wali Asrama Mandiri');
  const [approvalName, setApprovalName] = useState<string>(config.kepalaSekolah || 'YUNI ARSI, S.Pd');
  const [approvalNip, setApprovalNip] = useState<string>(config.kepalaSekolahNip || 'NIP. 197206051999032002');
  const [approvalTitle, setApprovalTitle] = useState<string>('Kepala Sekolah Rakyat 31');

  // Auto calculate attendance statistics from prayerAttendance
  const calculateAttendanceData = (
    tDate: string,
    tSession: string,
    tClass: string = 'Semua Kelas',
    tDorm: string = 'Semua Asrama'
  ) => {
    const eligibleStudents = students.filter((s) => {
      const matchClass = tClass === 'Semua Kelas' || s.class === tClass;
      const matchDorm = tDorm === 'Semua Asrama' || s.dorm === tDorm;
      return matchClass && matchDorm;
    });

    const totalTarget = eligibleStudents.length || students.length;

    const sessionRecords = (prayerAttendance || []).filter((rec) => {
      const matchDate = rec.date === tDate;
      const matchSession = tSession === 'Semua Sesi Hari Ini' || rec.prayerTime === tSession;
      return matchDate && matchSession;
    });

    let hadir = 0;
    let face = 0;
    let qr = 0;
    let rfid = 0;
    let manual = 0;
    let sakit = 0;
    let izin = 0;
    let late = 0;
    const attendedIds = new Set<string>();

    sessionRecords.forEach((r) => {
      attendedIds.add(r.studentId);
      if (r.status === 'Hadir' || r.status === 'Terlambat') {
        hadir++;
        if (r.status === 'Terlambat') late++;
        if (r.method === 'Face') face++;
        else if (r.method === 'QR') qr++;
        else if (r.method === 'RFID') rfid++;
        else manual++;
      } else if (r.status === 'Izin Sakit') {
        sakit++;
      } else if (r.status === 'Izin Pulang') {
        izin++;
      }
    });

    const absentStudents = eligibleStudents.filter((s) => !attendedIds.has(s.id));
    const alpha = Math.max(0, totalTarget - (hadir + sakit + izin));

    setAttendanceTotalStudents(totalTarget);
    setAttendancePresentCount(hadir);
    setAttendanceFaceCount(face);
    setAttendanceQrCount(qr);
    setAttendanceRfidCount(rfid);
    setAttendanceManualCount(manual);
    setAttendanceSickCount(sakit);
    setAttendanceLeaveCount(izin);
    setAttendanceLateCount(late);
    setAttendanceAlphaCount(alpha);

    if (absentStudents.length > 0) {
      const absentListStr =
        absentStudents
          .slice(0, 15)
          .map((s, idx) => `${idx + 1}. ${s.name} (${s.class || '-'} / ${s.dorm || '-'}) - Alpa / Tidak Hadir`)
          .join('\n') + (absentStudents.length > 15 ? `\n...dan ${absentStudents.length - 15} santri lainnya` : '');
      setAttendanceAbsentStudentNames(absentListStr);
    } else {
      setAttendanceAbsentStudentNames('Tidak ada santri yang berstatus Alpa pada sesi ini (Kehadiran 100% Terpenuhi).');
    }

    setSubject(`Berita Acara & Laporan Rekapitulasi Presensi Kehadiran Siswa Sesi ${tSession} (${formatDateIndonesian(tDate)})`);
    setBodyIntro(
      `Pada hari ini, ${formatDateIndonesian(tDate)}, bertempat di Lingkungan Asrama & Masjid Sekolah Rakyat 31 Palembang, telah dilaksanakan pencatatan presensi kehadiran santri untuk sesi ${tSession} menggunakan Sistem Presensi Terintegrasi (Face Recognition Biometrik AI, Kartu QR Code, dan WebSerial RFID).`
    );
    setAttendanceNotes(
      `Pencatatan kehadiran berlangsung dengan tertib. Dari total ${totalTarget} santri sasaran, tercatat ${hadir} santri hadir (${face} santri terverifikasi Face Recognition AI, ${qr} via QR Code, ${rfid} via RFID, dan ${manual} manual). Terdapat ${alpha} santri berstatus alpa / tidak hadir.`
    );
    setFollowUpActions(
      `1. Pemanggilan dan pembinaan disiplin ibadah oleh Wali Asuh bagi ${alpha} santri yang tidak hadir.\n2. Pemeriksaan kondisi kesehatan dan perawatan bagi ${sakit} santri yang beristirahat/sakit di UKS asrama.\n3. Evaluasi berkala kedisiplinan sholat berjamaah bersama tim keasramaan.`
    );
  };

  // Sync initial student if passed
  useEffect(() => {
    if (initialStudentId && students.length > 0) {
      const st = students.find((s) => s.id === initialStudentId);
      if (st) {
        setSelectedStudentId(st.id);
        setStudentName(st.name);
        setStudentClass(st.class);
        setStudentDorm(st.dorm);
        setStudentNisn(st.id);
        setStudentBirthDate(st.birthDate || '');
        setStudentParentName(st.parentName || '');
        setStudentParentPhone(st.parentPhone || '');
        if (st.caretaker) setAuthorName(st.caretaker);
      }
    }
  }, [initialStudentId, students]);

  // When student selection changes
  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    if (!id) return;
    const st = students.find((s) => s.id === id);
    if (st) {
      setStudentName(st.name);
      setStudentClass(st.class);
      setStudentDorm(st.dorm);
      setStudentNisn(st.id);
      setStudentBirthDate(st.birthDate || '');
      setStudentParentName(st.parentName || '');
      setStudentParentPhone(st.parentPhone || '');
      if (st.caretaker) setAuthorName(st.caretaker);

      // Auto update subject
      if (letterType === 'kronologi_kasus_psikologi') {
        setSubject(`Laporan Kronologi Kasus & Analisis Psikologi Ananda ${st.name} (${st.class} / ${st.dorm})`);
      } else if (letterType === 'peringatan_ketidakhadiran') {
        setSubject(`Surat Pemberitahuan & Peringatan Ketidakhadiran Ibadah a.n. ${st.name}`);
        setRecipientName(`Bapak/Ibu Orang Tua / Wali dari ${st.name}`);
        setBodyMain(`Berdasarkan data pencatatan sistem presensi biometrik wajah dan kartu asrama, ananda ${st.name} (${st.class} / ${st.dorm}) tercatat tidak hadir mengikuti kegiatan sholat berjamaah tanpa keterangan sah.`);
      } else if (letterType === 'undangan_ortu') {
        setSubject(`Undangan Konsultasi Perkembangan Santri/Siswa a.n. ${st.name}`);
        setRecipientName(`Bapak/Ibu Orang Tua / Wali dari ${st.name}`);
      } else if (letterType === 'pernyataan_siswa') {
        setSubject(`Surat Pernyataan & Komitmen Kedisiplinan Siswa a.n. ${st.name}`);
      } else if (letterType === 'keterangan_baik') {
        setSubject(`Surat Keterangan Berkelakuan Baik & Rekomendasi a.n. ${st.name}`);
      } else if (letterType === 'rujukan_medis_psikologis') {
        setSubject(`Surat Pengantar Rujukan Medis / Psikologis Ananda ${st.name}`);
      }
    }
  };

  // Switch Letter Type Presets
  const handleLetterTypeChange = (type: OfficialLetterType) => {
    setLetterType(type);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomCode = Math.floor(100 + Math.random() * 900);

    if (type === 'laporan_kemensos_periodik') {
      setLetterNumber(`B-${randomCode}/SR.31/KS.01.02/${month}/${year}`);
      setSubject('Laporan Periodik Keasramaan & Pembinaan Peserta Didik (Kemensos RI)');
      setRecipientName('Kepala Sekolah Rakyat 31 Palembang (Kemensos RI)');
      setRecipientTitle('Kuasa Pengguna Anggaran / Pimpinan Satker');
      setRecipientOffice('Kementerian Sosial Republik Indonesia');
      setRecipientAddress('Palembang');
      setEnclosure('1 (Satu) Berkas Buku Laporan');
      setSignatureAuthorLabel('Pembuat Laporan / Wali Asuh,');
      setBodyIntro('Sebagai bentuk akuntabilitas kinerja pembinaan keasramaan, monitoring kedisiplinan ibadah santri berbasis AI Face Recognition, dan tata kelola asrama sesuai SPM Kementerian Sosial RI, bersama ini kami sampaikan Laporan Periodik Keasramaan:');
      setBodyMain('Seluruh kegiatan pembinaan karakter, pendampingan ibadah sholat 5 waktu berjamaah dengan verifikasi biometrik wajah AI, apel harian, dan pemantauan kebersihan asrama berlangsung tertib sesuai ketentuan SOP Kemensos RI.');
      setBodyClosing('Demikian Laporan Periodik Keasramaan ini kami sampaikan dengan sebenarnya sebagai bahan pertanggungjawaban program dan perumusan kebijakan pimpinan Sekolah Rakyat Kementerian Sosial RI.');
      calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, attendanceTargetDorm);
    } else if (type === 'berita_acara_insiden_kemensos') {
      setLetterNumber(`BA-${randomCode}/SR.31/PS.02.01/${month}/${year}`);
      setSubject(studentName ? `Berita Acara Penanganan Insiden Keasramaan a.n. ${studentName}` : 'Berita Acara Penanganan Insiden / Kasus Khusus Keasramaan (Kemensos RI)');
      setRecipientName('Kepala Sekolah Rakyat 31 & Wali Asrama Mandiri');
      setRecipientTitle('Tim Disiplin & Pengasuhan Asrama');
      setRecipientOffice('Sekolah Rakyat 31 Palembang (Kemensos RI)');
      setRecipientAddress('di Tempat');
      setEnclosure('1 (Satu) Berkas');
      setSignatureAuthorLabel('Petugas Pencatat / Wali Asuh,');
      setBodyIntro('Pada hari ini telah dilaksanakan penanganan, klarifikasi fakta, dan mediasi terhadap kasus kedisiplinan/insiden peserta didik di Lingkungan Asrama Sekolah Rakyat 31 Palembang berpedoman pada SOP Penanganan Kasus Kementerian Sosial RI:');
      setBodyMain(studentName ? `Peserta didik ananda ${studentName} (${studentClass} / ${studentDorm}) telah mendapatkan penanganan persuasif dan pendampingan psikososial atas insiden yang terjadi.` : 'Telah dilakukan penanganan insiden keasramaan secara terpadu sesuai standar pekerja sosial dan SOP perlindungan anak.');
      setActionsTaken('1. Wawancara mendalam dan pendampingan psikososial oleh Wali Asuh.\n2. Penandatanganan komitmen pemulihan perilaku dan restorative justice.\n3. Rujukan konsultasi lanjutan bersama Guru BK / Pekerja Sosial.');
      setFollowUpActions('Pengawasan intensif pada lembar monitoring harian dan koordinasi berkala bersama Wali Asrama Mandiri.');
    } else if (type === 'berita_acara_presensi') {
      setLetterNumber(`SR31/BA-ABSEN/${month}/${year}/${randomCode}`);
      setRecipientName('Wali Asrama Mandiri & Kepala Sekolah');
      setRecipientTitle('Pimpinan Lembaga & Manajemen Keasramaan');
      setRecipientOffice('Sekolah Rakyat 31 Palembang');
      setRecipientAddress('di Tempat');
      setEnclosure('1 (Satu) Berkas Lembar Presensi');
      setSignatureAuthorLabel('Pembuat Berita Acara / Pembina Presensi,');
      calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, attendanceTargetDorm);
    } else if (type === 'peringatan_ketidakhadiran') {
      setLetterNumber(`SR31/SP-ABSEN/${month}/${year}/${randomCode}`);
      setSubject(studentName ? `Surat Pemberitahuan & Peringatan Ketidakhadiran Ibadah a.n. ${studentName}` : 'Surat Pemberitahuan & Peringatan Ketidakhadiran Ibadah Santri');
      setRecipientName(studentParentName ? `Bpk/Ibu ${studentParentName}` : 'Bapak/Ibu Orang Tua / Wali Siswa');
      setRecipientTitle('Orang Tua / Wali Santri');
      setRecipientAddress('di Tempat');
      setEnclosure('-');
      setSignatureAuthorLabel('Wali Asuh Pendamping,');
      setBodyIntro('Sehubungan dengan hasil evaluasi dan rekapitulasi data presensi terpadu (Face Recognition Biometrik & Presensi Asrama) Sekolah Rakyat 31 Palembang, bersama ini kami sampaikan pemberitahuan kedisiplinan putra/putri Bapak/Ibu:');
      setBodyMain(studentName ? `Berdasarkan pencatatan presensi deteksi wajah dan barcode asrama, ananda ${studentName} (${studentClass} / ${studentDorm}) tercatat tidak mengikuti kegiatan ibadah sholat berjamaah tanpa keterangan sah.` : 'Berdasarkan rekapitulasi sistem presensi, santri tercatat beberapa kali alpa sholat berjamaah.');
      setActionsTaken('1. Bimbingan konseling dan kontrak komitmen kedisiplinan oleh Wali Asuh.\n2. Sanksi edukatif keagamaan berupa penambahan hafalan surat pendek / wirid.\n3. Pemantauan intensif di buku jurnal harian santri.');
      setFollowUpActions('Dimohon kerjasama dan perhatian Bapak/Ibu selaku orang tua/wali untuk turut memberikan nasihat dan motivasi kepada ananda agar senantiasa disiplin dan taat terhadap tata tertib ibadah keasramaan.');
    } else if (type === 'kronologi_kasus_psikologi') {
      setLetterNumber(`SR31/KRON-PSI/${month}/${year}/${randomCode}`);
      setSubject(studentName ? `Laporan Kronologi Kasus & Analisis Psikologis Ananda ${studentName}` : 'Laporan Kronologi Kasus & Analisis Psikologis Peserta Didik');
      setRecipientName('Kepala Sekolah Rakyat 31 & Wali Asrama Mandiri');
      setRecipientTitle('Pimpinan Keasramaan & Tim Pengasuhan');
      setEnclosure('1 (Satu) Berkas');
    } else if (type === 'pengajuan_barang') {
      setLetterNumber(`SR31/LOGISTIK/${month}/${year}/${randomCode}`);
      setSubject('Permohonan Pengadaan Sarana & Kebutuhan Logistik Asrama');
      setRecipientName(config.waliAsrama || 'HISNUL HASHIN, SE');
      setRecipientTitle('Wali Asrama Mandiri');
      setRecipientOffice('Sekolah Rakyat 31 Palembang');
      setEnclosure('1 (Satu) Lembar Rincian');
      setBodyMain('Bersama surat ini, kami selaku Wali Asuh mengajukan permohonan pengadaan sarana, prasarana, dan kebutuhan logistik kamar/asrama demi kelancaran pembinaan dan kenyamanan siswa sebagai berikut:');
    } else if (type === 'izin_kerja_staf') {
      setLetterNumber(`SR31/IZIN-STAF/${month}/${year}/${randomCode}`);
      setSubject(`Permohonan Izin Tidak Hadir / Piket Asrama a.n. ${authorName}`);
      setRecipientName(config.waliAsrama || 'HISNUL HASHIN, SE');
      setRecipientTitle('Wali Asrama Mandiri');
      setRecipientOffice('Sekolah Rakyat 31 Palembang');
      setEnclosure('-');
    } else if (type === 'permohonan') {
      setLetterNumber(`SR31/MOHON/${month}/${year}/${randomCode}`);
      setSubject('Permohonan Pelaksanaan Kegiatan Pembinaan Keasramaan Siswa');
      setRecipientName('Kepala Sekolah Rakyat 31 Palembang');
      setRecipientTitle('Pimpinan Lembaga');
      setEnclosure('-');
      setBodyMain('Sehubungan dengan agenda program peningkatan karakter dan kedisiplinan siswa di asrama, bersama ini kami mengajukan permohonan izin dan dukungan pelaksanaan kegiatan pembinaan keasramaan.');
    } else if (type === 'undangan_ortu') {
      setLetterNumber(`SR31/UND-ORTU/${month}/${year}/${randomCode}`);
      setSubject(studentName ? `Undangan Konsultasi Perkembangan Siswa Ananda ${studentName}` : 'Undangan Pertemuan Konsultasi Orang Tua Siswa');
      setRecipientName(studentParentName ? `Bpk/Ibu ${studentParentName}` : 'Bapak/Ibu Orang Tua / Wali Siswa');
      setRecipientTitle('Orang Tua / Wali Santri');
      setRecipientAddress('di Tempat');
      setEnclosure('-');
      setBodyMain(`Dalam rangka koordinasi dan evaluasi pembinaan karakter serta kedisiplinan ananda ${studentName || 'peserta didik'} selama berada di asrama, kami mengundang Bapak/Ibu untuk hadir dalam pertemuan konsultasi bersama Tim Wali Asuh dan Guru BK.`);
    } else if (type === 'pernyataan_siswa') {
      setLetterNumber(`SR31/PERNYATAAN/${month}/${year}/${randomCode}`);
      setSubject(`Surat Pernyataan Kesanggupan & Komitmen Kepatuhan Tata Tertib Siswa`);
      setRecipientName('Wali Asrama & Tim Pengasuhan Asrama');
      setRecipientTitle('Sekolah Rakyat 31 Palembang');
      setEnclosure('-');
      setBodyMain(`Saya yang bertanda tangan di bawah ini berjanji dengan sungguh-sungguh untuk mentaati seluruh tata tertib asrama, memperbaiki sikap kedisiplinan, menjaga sopan santun, serta tidak mengulangi pelanggaran yang pernah dilakukan.`);
    } else if (type === 'keterangan_baik') {
      setLetterNumber(`SR31/KET-BAIK/${month}/${year}/${randomCode}`);
      setSubject(studentName ? `Surat Keterangan Berkelakuan Baik a.n. ${studentName}` : 'Surat Keterangan Berkelakuan Baik Siswa');
      setRecipientName('Pihak yang Berkepentingan');
      setRecipientTitle('-');
      setRecipientAddress('di Tempat');
      setEnclosure('-');
      setBodyMain(`Menerangkan dengan sebenarnya bahwa peserta didik tersebut di atas selama menempuh pendidikan dan tinggal di asrama Sekolah Rakyat 31 Palembang telah menunjukkan sikap, etika, dan perilaku yang berkelakuan BAIK serta taat pada peraturan.`);
    } else if (type === 'rujukan_medis_psikologis') {
      setLetterNumber(`SR31/RUJUKAN/${month}/${year}/${randomCode}`);
      setSubject(studentName ? `Surat Pengantar Rujukan Layanan Kesehatan / Psikologis a.n. ${studentName}` : 'Surat Pengantar Rujukan Medis / Psikologis');
      setRecipientName('Dokter / Psikolog Pemeriksa');
      setRecipientTitle('Poli Layanan / Fasilitas Kesehatan Terkait');
      setRecipientAddress('di Tempat');
      setEnclosure('1 (Satu) Berkas Rekam Medis / Asesmen');
      setBodyMain(`Bersama ini kami kirimkan peserta didik asrama Sekolah Rakyat 31 Palembang untuk mendapatkan pemeriksaan, evaluasi, serta penanganan medis / psikologis lebih lanjut dari tenaga profesional.`);
    } else {
      setLetterNumber(`SR31/SURAT/${month}/${year}/${randomCode}`);
      setSubject('Surat Administrasi Resmi Keasramaan');
      setEnclosure('-');
    }
  };

  // Apply Psychology Theory Template
  const handleApplyPsychologyTemplate = (template: typeof PSYCHOLOGY_TEMPLATES[0]) => {
    setPsychologyTheoryName(template.name);
    setPsychologyTheoryAnalysis(template.theoryAnalysis);
    setActionsTaken(template.actionsTaken);
    setFollowUpActions(template.followUpActions);
    onShowToast('Template Teori Diterapkan', `Teori "${template.name}" berhasil dimasukkan ke draf surat.`, 'success');
  };

  // Supply Items calculation
  const totalSupplyCost = useMemo(() => {
    return supplyItems.reduce((acc, item) => acc + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  }, [supplyItems]);

  const handleAddSupplyItem = () => {
    const newItem: LetterSupplyItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unit: 'Unit',
      estimatedPrice: 0,
      urgency: 'Mendesak',
      reason: ''
    };
    setSupplyItems([...supplyItems, newItem]);
  };

  const handleRemoveSupplyItem = (id: string) => {
    setSupplyItems(supplyItems.filter((i) => i.id !== id));
  };

  const handleUpdateSupplyItem = (id: string, updates: Partial<LetterSupplyItem>) => {
    setSupplyItems(supplyItems.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Current Letter Object for Preview & PDF Export
  const currentLetter: OfficialLetter = useMemo(() => {
    return {
      id: 'current_draft',
      letterType,
      letterNumber,
      letterTitle: subject,
      letterDate,
      letterCity,
      recipientName,
      recipientTitle,
      recipientOffice,
      recipientAddress,
      authorName,
      authorNipOrId,
      authorRole,
      studentId: selectedStudentId,
      studentName,
      studentClass,
      studentDorm,
      studentNisn,
      studentBirthDate,
      studentParentName,
      studentParentPhone,
      incidentDate,
      incidentLocation,
      problemSummary,
      psychologyTheoryName,
      psychologyTheoryAnalysis,
      actionsTaken,
      followUpActions,
      supplyItems,
      supplyTotalEstimatedCost: totalSupplyCost,
      leaveType,
      leaveStartDate,
      leaveEndDate,
      leaveTotalDays,
      leaveReason,
      leaveHandoverStaff,
      attendanceDate,
      attendanceSession,
      attendanceTargetClass,
      attendanceTargetDorm,
      attendanceTotalStudents,
      attendancePresentCount,
      attendanceFaceCount,
      attendanceQrCount,
      attendanceRfidCount,
      attendanceManualCount,
      attendanceSickCount,
      attendanceLeaveCount,
      attendanceLateCount,
      attendanceAlphaCount,
      attendanceAbsentStudentNames,
      attendanceNotes,
      kemensosReportPeriod,
      kemensosLegalBasis,
      kemensosObjectives,
      kemensosEvaluation,
      kemensosRecommendations,
      subject,
      enclosure,
      bodyIntro,
      bodyMain,
      bodyClosing,
      signatureAuthorLabel,
      acknowledgementName,
      acknowledgementNip,
      acknowledgementTitle,
      approvalName,
      approvalNip,
      approvalTitle,
      createdAt: new Date().toISOString()
    };
  }, [
    letterType,
    letterNumber,
    subject,
    letterDate,
    letterCity,
    recipientName,
    recipientTitle,
    recipientOffice,
    recipientAddress,
    authorName,
    authorNipOrId,
    authorRole,
    selectedStudentId,
    studentName,
    studentClass,
    studentDorm,
    studentNisn,
    studentBirthDate,
    studentParentName,
    studentParentPhone,
    incidentDate,
    incidentLocation,
    problemSummary,
    psychologyTheoryName,
    psychologyTheoryAnalysis,
    actionsTaken,
    followUpActions,
    supplyItems,
    totalSupplyCost,
    leaveType,
    leaveStartDate,
    leaveEndDate,
    leaveTotalDays,
    leaveReason,
    leaveHandoverStaff,
    attendanceDate,
    attendanceSession,
    attendanceTargetClass,
    attendanceTargetDorm,
    attendanceTotalStudents,
    attendancePresentCount,
    attendanceFaceCount,
    attendanceQrCount,
    attendanceRfidCount,
    attendanceManualCount,
    attendanceSickCount,
    attendanceLeaveCount,
    attendanceLateCount,
    attendanceAlphaCount,
    attendanceAbsentStudentNames,
    attendanceNotes,
    kemensosReportPeriod,
    kemensosLegalBasis,
    kemensosObjectives,
    kemensosEvaluation,
    kemensosRecommendations,
    enclosure,
    bodyIntro,
    bodyMain,
    bodyClosing,
    signatureAuthorLabel,
    acknowledgementName,
    acknowledgementNip,
    acknowledgementTitle,
    approvalName,
    approvalNip,
    approvalTitle
  ]);

  // Save to History Archive
  const handleSaveLetter = () => {
    const newLetterToSave: OfficialLetter = {
      ...currentLetter,
      id: `letter_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newLetterToSave, ...savedLetters];
    setSavedLetters(updated);
    saveOfficialLetters(updated);

    if (config.googleScriptUrl) {
      fetch(config.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addOfficialLetter',
          data: newLetterToSave
        })
      }).catch((err) => console.error(err));
    }

    onShowToast('Surat Berhasil Diarsipkan', `Dokumen "${subject}" telah disimpan ke riwayat administrasi surat & database Google Sheets.`, 'success');
  };

  // Export / Print PDF
  const handleExportPdf = async (action: 'download' | 'print') => {
    setIsGeneratingPdf(true);
    try {
      await generateOfficialLetterPDF(currentLetter, config, action);
      onShowToast(
        action === 'download' ? 'Unduh Berhasil' : 'Membuka Jendela Cetak',
        action === 'download' ? 'Dokumen PDF surat resmi berhasil dibuat.' : 'Dokumen siap dicetak ke printer.',
        'success'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Membuat PDF', 'Terjadi kesalahan saat mengonversi surat ke format PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    const plainText = `KEMENTERIAN SOSIAL REPUBLIK INDONESIA
SEKOLAH RAKYAT 31 PALEMBANG
Asrama Mandiri Terpadu

Nomor   : ${letterNumber}
Lampiran: ${enclosure}
Perihal : ${subject}
Tanggal : ${letterCity}, ${formatDateIndonesian(letterDate)}

Kepada Yth.
${recipientName}
${recipientTitle ? recipientTitle + '\n' : ''}${recipientOffice ? recipientOffice + '\n' : ''}${recipientAddress}

${bodyIntro}

${letterType === 'kronologi_kasus_psikologi' ? `I. DATA SISWA:
Nama: ${studentName || '-'} | NISN: ${studentNisn || '-'} | Kelas: ${studentClass || '-'} | Asrama: ${studentDorm || '-'}

II. KRONOLOGI KEJADIAN & PERMASALAHAN:
${problemSummary}

III. ANALISIS TEORI PSIKOLOGI ANAK:
Teori: ${psychologyTheoryName}
${psychologyTheoryAnalysis}

IV. TINDAKAN YANG TELAH DILAKUKAN:
${actionsTaken}

V. UPAYA & REKOMENDASI TINDAK LANJUT:
${followUpActions}` : letterType === 'berita_acara_presensi' ? `I. DATA PELAKSANAAN PRESENSI:
Hari/Tanggal: ${formatDateIndonesian(attendanceDate)}
Sesi Presensi: ${attendanceSession}
Sasaran: ${attendanceTargetClass} | ${attendanceTargetDorm}

II. REKAPITULASI STATISTIK KEHADIRAN:
- Total Target: ${attendanceTotalStudents} Santri
- Hadir Tepat Waktu: ${attendancePresentCount} Santri
  * Verifikasi Face Recognition AI: ${attendanceFaceCount}
  * Verifikasi Kartu QR Scanner: ${attendanceQrCount}
  * Verifikasi Kartu RFID Serial: ${attendanceRfidCount}
  * Presensi Manual: ${attendanceManualCount}
- Izin Sakit UKS: ${attendanceSickCount}
- Izin Pulang: ${attendanceLeaveCount}
- Terlambat: ${attendanceLateCount}
- Alpa / Tanpa Keterangan: ${attendanceAlphaCount}

III. DAFTAR SANTRI TIDAK HADIR / PERLU PERHATIAN:
${attendanceAbsentStudentNames}

IV. CATATAN EVALUASI & TINDAK LANJUT:
${attendanceNotes}
${followUpActions}` : bodyMain}

${bodyClosing}

Hormat kami,
Pemohon/Wali Asuh: ${authorName}`;

    navigator.clipboard.writeText(plainText);
    setIsCopied(true);
    onShowToast('Teks Disalin', 'Seluruh teks surat resmi telah disalin ke papan klip.', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Load letter from history for editing
  const handleLoadLetter = (item: OfficialLetter) => {
    setLetterType(item.letterType);
    setLetterNumber(item.letterNumber);
    setLetterDate(item.letterDate);
    setLetterCity(item.letterCity || 'Palembang');
    setSubject(item.subject || item.letterTitle);
    setEnclosure(item.enclosure || '-');
    setRecipientName(item.recipientName);
    setRecipientTitle(item.recipientTitle || '');
    setRecipientOffice(item.recipientOffice || '');
    setRecipientAddress(item.recipientAddress || 'di Tempat');
    setAuthorName(item.authorName);
    setAuthorNipOrId(item.authorNipOrId || '');
    setAuthorRole(item.authorRole || 'Wali Asuh');
    setSelectedStudentId(item.studentId || '');
    setStudentName(item.studentName || '');
    setStudentClass(item.studentClass || '');
    setStudentDorm(item.studentDorm || '');
    setStudentNisn(item.studentNisn || '');
    setProblemSummary(item.problemSummary || '');
    setPsychologyTheoryName(item.psychologyTheoryName || '');
    setPsychologyTheoryAnalysis(item.psychologyTheoryAnalysis || '');
    setActionsTaken(item.actionsTaken || '');
    setFollowUpActions(item.followUpActions || '');
    if (item.attendanceDate) setAttendanceDate(item.attendanceDate);
    if (item.attendanceSession) setAttendanceSession(item.attendanceSession);
    if (item.attendanceTargetClass) setAttendanceTargetClass(item.attendanceTargetClass);
    if (item.attendanceTargetDorm) setAttendanceTargetDorm(item.attendanceTargetDorm);
    if (item.attendanceTotalStudents !== undefined) setAttendanceTotalStudents(item.attendanceTotalStudents);
    if (item.attendancePresentCount !== undefined) setAttendancePresentCount(item.attendancePresentCount);
    if (item.attendanceFaceCount !== undefined) setAttendanceFaceCount(item.attendanceFaceCount);
    if (item.attendanceQrCount !== undefined) setAttendanceQrCount(item.attendanceQrCount);
    if (item.attendanceRfidCount !== undefined) setAttendanceRfidCount(item.attendanceRfidCount);
    if (item.attendanceManualCount !== undefined) setAttendanceManualCount(item.attendanceManualCount);
    if (item.attendanceSickCount !== undefined) setAttendanceSickCount(item.attendanceSickCount);
    if (item.attendanceLeaveCount !== undefined) setAttendanceLeaveCount(item.attendanceLeaveCount);
    if (item.attendanceLateCount !== undefined) setAttendanceLateCount(item.attendanceLateCount);
    if (item.attendanceAlphaCount !== undefined) setAttendanceAlphaCount(item.attendanceAlphaCount);
    if (item.attendanceAbsentStudentNames) setAttendanceAbsentStudentNames(item.attendanceAbsentStudentNames);
    if (item.attendanceNotes) setAttendanceNotes(item.attendanceNotes);
    if (item.kemensosReportPeriod) setKemensosReportPeriod(item.kemensosReportPeriod);
    if (item.kemensosLegalBasis) setKemensosLegalBasis(item.kemensosLegalBasis);
    if (item.kemensosObjectives) setKemensosObjectives(item.kemensosObjectives);
    if (item.kemensosEvaluation) setKemensosEvaluation(item.kemensosEvaluation);
    if (item.kemensosRecommendations) setKemensosRecommendations(item.kemensosRecommendations);
    if (item.supplyItems) setSupplyItems(item.supplyItems);
    if (item.leaveType) setLeaveType(item.leaveType);
    if (item.leaveStartDate) setLeaveStartDate(item.leaveStartDate);
    if (item.leaveEndDate) setLeaveEndDate(item.leaveEndDate);
    if (item.leaveTotalDays) setLeaveTotalDays(item.leaveTotalDays);
    if (item.leaveReason) setLeaveReason(item.leaveReason);
    if (item.leaveHandoverStaff) setLeaveHandoverStaff(item.leaveHandoverStaff);
    setBodyIntro(item.bodyIntro || 'Dengan hormat,');
    setBodyMain(item.bodyMain || '');
    setBodyClosing(item.bodyClosing || '');
    setAcknowledgementName(item.acknowledgementName || config.waliAsrama || 'HISNUL HASHIN, SE');
    setAcknowledgementNip(item.acknowledgementNip || config.waliAsramaNip || '');
    setAcknowledgementTitle(item.acknowledgementTitle || 'Wali Asrama Mandiri');
    setApprovalName(item.approvalName || config.kepalaSekolah || 'YUNI ARSI, S.Pd');
    setApprovalNip(item.approvalNip || config.kepalaSekolahNip || '');
    setApprovalTitle(item.approvalTitle || 'Kepala Sekolah Rakyat 31');

    setActiveSubTab('create');
    onShowToast('Surat Dimuat', `Dokumen "${item.subject}" siap diedit kembali.`, 'success');
  };

  const handleDeleteSavedLetter = (id: string) => {
    const updated = savedLetters.filter((l) => l.id !== id);
    setSavedLetters(updated);
    saveOfficialLetters(updated);

    if (config.googleScriptUrl) {
      fetch(config.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteOfficialLetter',
          data: { id }
        })
      }).catch((err) => console.error(err));
    }

    onShowToast('Surat Dihapus', 'Dokumen telah dihapus dari arsip surat & database Google Sheets.', 'warning');
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return savedLetters.filter((l) => {
      const matchSearch =
        l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.studentName && l.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        l.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || l.letterType === filterType;
      return matchSearch && matchType;
    });
  }, [savedLetters, searchTerm, filterType]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-700/60 border border-red-500/30 text-xs font-bold uppercase tracking-wider text-red-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Layanan Administrasi & Generator Surat Wali Asuh
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-amber-400" />
              Generator Surat Resmi Keasramaan
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Buat berbagai format surat dinas resmi, <strong>Kronologi Kasus Berlandaskan Teori Psikologi Anak</strong>, Pengajuan Pengadaan Barang ke Wali Asrama, Surat Izin Tidak Masuk Kerja Staf, dan Administrasi Siswa berstandar Kementerian Sosial RI.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/40 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveSubTab('create')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition ${
                activeSubTab === 'create'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Buat / Edit Surat
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition ${
                activeSubTab === 'history'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Arsip Surat ({savedLetters.length})
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'create' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT FORM COLUMN (7 cols) */}
          <div className="xl:col-span-7 space-y-6">
            {/* 1. Pilih Template & Jenis Surat */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Pilih Kategori & Format Surat</h2>
                    <p className="text-xs text-slate-500">Sesuaikan jenis dokumen administrasi yang akan diterbitkan</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'laporan_kemensos_periodik' as OfficialLetterType,
                    label: 'Laporan Periodik Keasramaan Kemensos RI',
                    icon: FileSpreadsheet,
                    badge: 'Kemensos RI',
                    color: 'from-red-800 via-rose-800 to-slate-900'
                  },
                  {
                    id: 'berita_acara_insiden_kemensos' as OfficialLetterType,
                    label: 'Berita Acara Insiden / Kasus Kemensos',
                    icon: ShieldAlert,
                    badge: 'SOP Kemensos',
                    color: 'from-amber-700 via-rose-700 to-red-800'
                  },
                  {
                    id: 'berita_acara_presensi' as OfficialLetterType,
                    label: 'Berita Acara Presensi (Face AI & Asrama)',
                    icon: Camera,
                    badge: 'Face Recognition AI',
                    color: 'from-red-600 via-rose-600 to-red-700'
                  },
                  {
                    id: 'peringatan_ketidakhadiran' as OfficialLetterType,
                    label: 'Peringatan Ketidakhadiran Santri',
                    icon: UserX,
                    badge: 'Disiplin Sholat',
                    color: 'from-amber-600 to-orange-700'
                  },
                  {
                    id: 'kronologi_kasus_psikologi' as OfficialLetterType,
                    label: 'Kronologi Kasus (Teori Psikologi)',
                    icon: Brain,
                    badge: 'Rekomendasi',
                    color: 'from-purple-500 to-indigo-600'
                  },
                  {
                    id: 'pengajuan_barang' as OfficialLetterType,
                    label: 'Pengajuan Barang ke Wali Asrama',
                    icon: Package,
                    color: 'from-amber-500 to-orange-600'
                  },
                  {
                    id: 'izin_kerja_staf' as OfficialLetterType,
                    label: 'Izin Tidak Masuk Kerja / Cuti',
                    icon: Calendar,
                    color: 'from-blue-500 to-cyan-600'
                  },
                  {
                    id: 'permohonan' as OfficialLetterType,
                    label: 'Surat Permohonan Kegiatan / Sarana',
                    icon: Mail,
                    color: 'from-emerald-500 to-teal-600'
                  },
                  {
                    id: 'undangan_ortu' as OfficialLetterType,
                    label: 'Undangan Pemanggilan Orang Tua',
                    icon: Users,
                    color: 'from-rose-500 to-red-600'
                  },
                  {
                    id: 'pernyataan_siswa' as OfficialLetterType,
                    label: 'Pernyataan & Komitmen Siswa',
                    icon: FileCheck,
                    color: 'from-slate-600 to-slate-800'
                  },
                  {
                    id: 'keterangan_baik' as OfficialLetterType,
                    label: 'Keterangan Berkelakuan Baik',
                    icon: UserCheck,
                    color: 'from-sky-500 to-blue-600'
                  },
                  {
                    id: 'rujukan_medis_psikologis' as OfficialLetterType,
                    label: 'Pengantar Rujukan Medis/Psikolog',
                    icon: ShieldAlert,
                    color: 'from-pink-500 to-rose-600'
                  },
                  {
                    id: 'surat_bebas' as OfficialLetterType,
                    label: 'Surat Resmi Kustom Bebas',
                    icon: Edit3,
                    color: 'from-gray-500 to-slate-700'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = letterType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLetterTypeChange(item.id)}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between gap-2 active:scale-98 ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 ring-2 ring-red-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {item.badge && (
                        <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          {item.badge}
                        </span>
                      )}
                      <div className={`p-2 rounded-lg w-fit text-white bg-gradient-to-br ${item.color} shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Metadata Surat & Identitas Pembuat */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-600" />
                Nomor Surat, Perihal, & Pihak Terkait
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex justify-between items-center">
                    <span>Nomor Surat</span>
                    <button
                      type="button"
                      onClick={handleRegenerateAutoNumber}
                      className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      title="Generate Ulang Nomor Surat Otomatis"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto
                    </button>
                  </label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500"
                    placeholder="SR31/WA/09/2026/001"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Lampiran</label>
                  <input
                    type="text"
                    value={enclosure}
                    onChange={(e) => setEnclosure(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500"
                    placeholder="1 (Satu) Berkas / -"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Perihal / Judul Surat</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 text-slate-800"
                  placeholder="Perihal surat..."
                />
              </div>

              {/* Penerima & Pembuat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Tujuan Surat (Kepada Yth)</span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 bg-white"
                    placeholder="Nama Penerima / Jabatan"
                  />
                  <input
                    type="text"
                    value={recipientTitle}
                    onChange={(e) => setRecipientTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    placeholder="Jabatan (e.g. Wali Asrama Mandiri)"
                  />
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    placeholder="Alamat (e.g. di Tempat)"
                  />
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Pembuat Surat / Wali Asuh</span>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 bg-white"
                    placeholder="Nama Wali Asuh / Staf"
                  />
                  <input
                    type="text"
                    value={authorNipOrId}
                    onChange={(e) => setAuthorNipOrId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    placeholder="NIP / ID Pegawai (opsional)"
                  />
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    placeholder="Jabatan (e.g. Wali Asuh Asrama Putra)"
                  />
                </div>
              </div>
            </div>

            {/* 3. Tautkan dengan Data Siswa (Jika Relevan) */}
            {(letterType === 'kronologi_kasus_psikologi' ||
              letterType === 'berita_acara_insiden_kemensos' ||
              letterType === 'peringatan_ketidakhadiran' ||
              letterType === 'undangan_ortu' ||
              letterType === 'pernyataan_siswa' ||
              letterType === 'keterangan_baik' ||
              letterType === 'rujukan_medis_psikologis') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    Data Santri / Siswa Terkait
                  </h3>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                    Otomatisasi Data Siswa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih dari Database Siswa</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">-- Pilih Siswa (Auto-Fill) --</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.class} - {st.dorm})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold"
                      placeholder="Nama Siswa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">NISN / ID</label>
                    <input
                      type="text"
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kelas</label>
                    <input
                      type="text"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kamar / Asrama</label>
                    <input
                      type="text"
                      value={studentDorm}
                      onChange={(e) => setStudentDorm(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. DETAIL KHUSUS: KRONOLOGI KASUS & TEORI PSIKOLOGI */}
            {letterType === 'kronologi_kasus_psikologi' && (
              <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/70 rounded-2xl p-5 border border-purple-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-700" />
                    <h3 className="text-sm font-black text-purple-950">Analisis Kronologi & Teori Psikologi Kasus Anak</h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                    Klinis & Pengasuhan
                  </span>
                </div>

                {/* Quick Templates Buttons */}
                <div>
                  <span className="block text-xs font-bold text-purple-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Pilih Template Teori Psikologi Siap Pakai:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PSYCHOLOGY_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPsychologyTemplate(tmpl)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                          psychologyTheoryName === tmpl.name
                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                            : 'bg-white hover:bg-purple-100/50 border-purple-200 text-slate-800'
                        }`}
                      >
                        <Brain className={`w-4 h-4 mt-0.5 flex-shrink-0 ${psychologyTheoryName === tmpl.name ? 'text-amber-300' : 'text-purple-600'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">{tmpl.name}</p>
                          <p className={`text-[10px] ${psychologyTheoryName === tmpl.name ? 'text-purple-200' : 'text-purple-700'}`}>
                            {tmpl.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">Tanggal Kejadian / Masalah</label>
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">Lokasi Kejadian</label>
                    <input
                      type="text"
                      value={incidentLocation}
                      onChange={(e) => setIncidentLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 bg-white"
                      placeholder="e.g. Kamar Asrama / Area Belajar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    1. Kronologi Kejadian & Uraian Permasalahan Perilaku Anak
                  </label>
                  <textarea
                    rows={3}
                    value={problemSummary}
                    onChange={(e) => setProblemSummary(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    placeholder="Jelaskan secara runtut kronologi kejadian, pemicu awal, dan dinamika emosional anak saat insiden terjadi..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-purple-950">
                      2. Landasan & Analisis Teori Psikologi Terhadap Masalah Anak
                    </label>
                    <input
                      type="text"
                      value={psychologyTheoryName}
                      onChange={(e) => setPsychologyTheoryName(e.target.value)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded border border-purple-300 bg-purple-100/70 text-purple-900 w-1/2 text-right"
                      placeholder="Nama Teori Psikologi"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={psychologyTheoryAnalysis}
                    onChange={(e) => setPsychologyTheoryAnalysis(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 leading-relaxed font-sans"
                    placeholder="Uraikan dinamika psikologis siswa berlandaskan teori perkembangan, attachment, kontrol impuls, atau kognitif perilaku..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    3. Tindakan & Intervensi yang Telah Dilakukan
                  </label>
                  <textarea
                    rows={3}
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    placeholder="Sebutkan langkah konseling awal, stabilisasi emosi, mediasi teman sekamar, dll..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    4. Upaya & Rekomendasi Tindak Lanjut yang Direncanakan
                  </label>
                  <textarea
                    rows={3}
                    value={followUpActions}
                    onChange={(e) => setFollowUpActions(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    placeholder="Sebutkan rencana pendampingan berkelanjutan, kontrak perilaku, komunikasi berkala dengan orang tua, atau rujukan ahli..."
                  />
                </div>
              </div>
            )}

            {/* 5. DETAIL KHUSUS: PENGAJUAN BARANG / LOGISTIK ASRAMA */}
            {letterType === 'pengajuan_barang' && (
              <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-700" />
                    <h3 className="text-sm font-black text-amber-950">Daftar Pengajuan Sarana & Logistik ke Wali Asrama</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSupplyItem}
                    className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Barang
                  </button>
                </div>

                <div className="space-y-3">
                  {supplyItems.map((item, index) => (
                    <div key={item.id} className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950">Item #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplyItem(item.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500">Nama Barang</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateSupplyItem(item.id, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300"
                            placeholder="e.g. Kasur Busa / Galon Air"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Jumlah & Satuan</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateSupplyItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-1/2 px-2 py-1.5 text-xs rounded border border-slate-300 font-bold"
                            />
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateSupplyItem(item.id, { unit: e.target.value })}
                              className="w-1/2 px-2 py-1.5 text-xs rounded border border-slate-300"
                              placeholder="Unit/Pcs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Est. Harga Satuan</label>
                          <input
                            type="number"
                            value={item.estimatedPrice || ''}
                            onChange={(e) => handleUpdateSupplyItem(item.id, { estimatedPrice: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono"
                            placeholder="Rp 0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Tingkat Urgensi</label>
                          <select
                            value={item.urgency}
                            onChange={(e) => handleUpdateSupplyItem(item.id, { urgency: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white font-bold"
                          >
                            <option value="Sangat Mendesak">Sangat Mendesak</option>
                            <option value="Mendesak">Mendesak</option>
                            <option value="Rutin / Cadangan">Rutin / Cadangan</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500">Alasan / Kebutuhan</label>
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(e) => handleUpdateSupplyItem(item.id, { reason: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                            placeholder="Alasan pengadaan barang ini..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-100/70 p-3 rounded-xl flex items-center justify-between border border-amber-300 text-amber-950 font-bold text-xs">
                  <span>Total Estimasi Anggaran Pengadaan:</span>
                  <span className="text-sm font-black font-mono text-amber-900">
                    Rp {totalSupplyCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* 6. DETAIL KHUSUS: IZIN KERJA / CUTI STAF WALI ASUH */}
            {letterType === 'izin_kerja_staf' && (
              <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-200 pb-2.5">
                  <Calendar className="w-5 h-5 text-blue-700" />
                  <h3 className="text-sm font-black text-blue-950">Rincian Permohonan Izin / Cuti Tidak Hadir Piket</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">Jenis Izin</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-white font-bold"
                    >
                      <option value="Keperluan Keluarga">Keperluan Keluarga</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Cuti / Urusan Pribadi">Cuti / Urusan Pribadi</option>
                      <option value="Dinas Luar / Pelatihan">Dinas Luar / Pelatihan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">Tanggal Mulai s.d. Selesai</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-xs rounded border border-blue-300 bg-white"
                      />
                      <span className="text-xs text-blue-900">-</span>
                      <input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-xs rounded border border-blue-300 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">Total Hari Izin</label>
                    <input
                      type="number"
                      min={1}
                      value={leaveTotalDays}
                      onChange={(e) => setLeaveTotalDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">Alasan Izin Lengkap</label>
                  <textarea
                    rows={3}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    placeholder="Uraikan alasan permohonan izin..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Petugas Pengganti / Pelimpahan Tugas Piket Asrama
                  </label>
                  <input
                    type="text"
                    value={leaveHandoverStaff}
                    onChange={(e) => setLeaveHandoverStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-white font-bold"
                    placeholder="Nama Wali Asuh Rekan yang bersedia menggantikan piket..."
                  />
                </div>
              </div>
            )}

            {/* 7. DETAIL KHUSUS: BERITA ACARA PRESENSI & REKAP KEHADIRAN */}
            {letterType === 'berita_acara_presensi' && (
              <div className="bg-gradient-to-br from-red-50/80 via-rose-50/70 to-amber-50/70 rounded-2xl p-5 border border-red-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-red-200/80 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-red-950">Data Sesi Presensi & Rekapitulasi Berita Acara</h3>
                      <p className="text-[11px] text-red-700">Terintegrasi dengan Face Recognition Biometrik AI, QR Code, dan RFID</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, attendanceTargetDorm);
                      onShowToast('Data Presensi Disinkronkan', `Statistik presensi sesi ${attendanceSession} berhasil ditarik otomatis.`, 'success');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tarik Data Presensi Otomatis</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-red-950 mb-1">Tanggal Presensi</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setAttendanceDate(newDate);
                        calculateAttendanceData(newDate, attendanceSession, attendanceTargetClass, attendanceTargetDorm);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-950 mb-1">Sesi Presensi / Ibadah</label>
                    <select
                      value={attendanceSession}
                      onChange={(e) => {
                        const newSession = e.target.value;
                        setAttendanceSession(newSession);
                        calculateAttendanceData(attendanceDate, newSession, attendanceTargetClass, attendanceTargetDorm);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white font-bold"
                    >
                      <option value="Subuh">Sholat Subuh</option>
                      <option value="Dhuha">Sholat Dhuha</option>
                      <option value="Dzuhur">Sholat Dzuhur</option>
                      <option value="Ashar">Sholat Ashar</option>
                      <option value="Maghrib">Sholat Maghrib</option>
                      <option value="Isya">Sholat Isya</option>
                      <option value="Tahajjud / Qiyamul Lail">Tahajjud / Qiyamul Lail</option>
                      <option value="Sarapan Pagi">Sarapan Pagi Asrama</option>
                      <option value="Makan Siang">Makan Siang Asrama</option>
                      <option value="Makan Malam">Makan Malam Asrama</option>
                      <option value="Sahur">Makan Sahur</option>
                      <option value="Buka Puasa">Buka Puasa Bersama</option>
                      <option value="Kajian / Kegiatan">Kajian / Pembinaan Malam</option>
                      <option value="Kebersihan / Ro'an">Ro'an / Kerja Bakti Asrama</option>
                      <option value="Apel / Baris Asrama">Apel Disiplin Asrama</option>
                      <option value="Semua Sesi Hari Ini">Semua Sesi Hari Ini</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-950 mb-1">Sasaran Jenjang / Kelas</label>
                    <select
                      value={attendanceTargetClass}
                      onChange={(e) => {
                        const newClass = e.target.value;
                        setAttendanceTargetClass(newClass);
                        calculateAttendanceData(attendanceDate, attendanceSession, newClass, attendanceTargetDorm);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white font-medium"
                    >
                      <option value="Semua Kelas">Semua Jenjang / Kelas</option>
                      <option value="SD">Klasikal (SD)</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SMA">SMA / SMK</option>
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="Kelas 4">Kelas 4</option>
                      <option value="Kelas 5">Kelas 5</option>
                      <option value="Kelas 6">Kelas 6</option>
                      <option value="Kelas 7">Kelas 7</option>
                      <option value="Kelas 8">Kelas 8</option>
                      <option value="Kelas 9">Kelas 9</option>
                      <option value="Kelas 10">Kelas 10</option>
                      <option value="Kelas 11">Kelas 11</option>
                      <option value="Kelas 12">Kelas 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-950 mb-1">Gedung / Asrama</label>
                    <select
                      value={attendanceTargetDorm}
                      onChange={(e) => {
                        const newDorm = e.target.value;
                        setAttendanceTargetDorm(newDorm);
                        calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, newDorm);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white font-medium"
                    >
                      <option value="Semua Asrama">Semua Asrama</option>
                      <option value="Asrama Putra">Asrama Putra</option>
                      <option value="Asrama Putri">Asrama Putri</option>
                      <option value="Gedung A">Gedung A</option>
                      <option value="Gedung B">Gedung B</option>
                    </select>
                  </div>
                </div>

                {/* STATS TILES SUMMARY */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-red-200 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">Target Sasaran</span>
                    <span className="text-base font-black text-slate-800">{attendanceTotalStudents}</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300 text-center shadow-2xs">
                    <span className="text-[10px] text-emerald-700 font-bold block">Hadir Total</span>
                    <span className="text-base font-black text-emerald-800">{attendancePresentCount}</span>
                  </div>
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-300 text-center shadow-2xs">
                    <span className="text-[10px] text-purple-700 font-bold block">Face ID AI</span>
                    <span className="text-base font-black text-purple-800">{attendanceFaceCount}</span>
                  </div>
                  <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-300 text-center shadow-2xs">
                    <span className="text-[10px] text-blue-700 font-bold block">QR & RFID</span>
                    <span className="text-base font-black text-blue-800">{attendanceQrCount + attendanceRfidCount}</span>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-center shadow-2xs">
                    <span className="text-[10px] text-amber-700 font-bold block">Sakit / Izin</span>
                    <span className="text-base font-black text-amber-800">{attendanceSickCount + attendanceLeaveCount}</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-300 text-center shadow-2xs">
                    <span className="text-[10px] text-rose-700 font-bold block">Alpa / Tanpa Ket.</span>
                    <span className="text-base font-black text-rose-800">{attendanceAlphaCount}</span>
                  </div>
                </div>

                {/* Detail Angka Yang Bisa Diedit */}
                <div className="bg-white/80 p-3 rounded-xl border border-red-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-red-950 block">Rincian Angka Presensi (Dapat Disesuaikan Manual)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Hadir Face AI</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceFaceCount}
                        onChange={(e) => setAttendanceFaceCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Hadir QR Scanner</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceQrCount}
                        onChange={(e) => setAttendanceQrCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Hadir RFID Card</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceRfidCount}
                        onChange={(e) => setAttendanceRfidCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Presensi Manual</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceManualCount}
                        onChange={(e) => setAttendanceManualCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Izin Sakit UKS</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceSickCount}
                        onChange={(e) => setAttendanceSickCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Izin Pulang / Dinas</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceLeaveCount}
                        onChange={(e) => setAttendanceLeaveCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Terlambat</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceLateCount}
                        onChange={(e) => setAttendanceLateCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-rose-600 font-bold">Alpa / Tanpa Ket.</label>
                      <input
                        type="number"
                        min={0}
                        value={attendanceAlphaCount}
                        onChange={(e) => setAttendanceAlphaCount(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-rose-300 bg-rose-50 font-black text-rose-900 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-red-950 mb-1">
                    Daftar Santri Tidak Hadir / Alpa / Butuh Perhatian Khusus
                  </label>
                  <textarea
                    rows={3}
                    value={attendanceAbsentStudentNames}
                    onChange={(e) => setAttendanceAbsentStudentNames(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-500 leading-relaxed font-mono"
                    placeholder="Daftar nama santri yang tidak hadir atau berstatus izin..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-red-950 mb-1">
                    Catatan Observasi & Dinamika Pelaksanaan Sesi
                  </label>
                  <textarea
                    rows={2}
                    value={attendanceNotes}
                    onChange={(e) => setAttendanceNotes(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-500 leading-relaxed"
                    placeholder="Catatan mengenai ketertiban jamaah, kendala teknis, atau kondisi asrama saat sesi berlangsung..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-red-950 mb-1">
                    Rekomendasi & Rencana Tindak Lanjut Wali Asuh
                  </label>
                  <textarea
                    rows={2}
                    value={followUpActions}
                    onChange={(e) => setFollowUpActions(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-500 leading-relaxed"
                    placeholder="Langkah pembinaan bagi santri alpa, koordinasi dengan tim UKS atau pimpinan..."
                  />
                </div>
              </div>
            )}

            {/* 8. DETAIL KHUSUS: SURAT PERINGATAN KETIDAKHADIRAN SANTRI */}
            {letterType === 'peringatan_ketidakhadiran' && (
              <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-200 pb-2.5">
                  <UserX className="w-5 h-5 text-amber-700" />
                  <div>
                    <h3 className="text-sm font-black text-amber-950">Rincian Pelanggaran Ketidakhadiran & Sanksi Edukatif</h3>
                    <p className="text-[11px] text-amber-700">Pemberitahuan resmi kedisiplinan santri kepada orang tua/wali murid</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">Jumlah Alpa Tercatat</label>
                    <input
                      type="number"
                      min={1}
                      value={attendanceAlphaCount || 1}
                      onChange={(e) => setAttendanceAlphaCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">Sesi Pelanggaran Terbanyak</label>
                    <input
                      type="text"
                      value={attendanceSession}
                      onChange={(e) => setAttendanceSession(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                      placeholder="e.g. Sholat Subuh & Sholat Maghrib"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Uraian Pelanggaran Kedisiplinan Ibadah
                  </label>
                  <textarea
                    rows={3}
                    value={bodyMain}
                    onChange={(e) => setBodyMain(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    placeholder="Uraikan detail ketidakhadiran santri berdasarkan rekam sistem presensi..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Tindakan Bimbingan & Sanksi Edukatif Asrama
                  </label>
                  <textarea
                    rows={2}
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    placeholder="Sanksi mendidik yang telah atau sedang diberikan..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Arahan / Permohonan Kerjasama Orang Tua
                  </label>
                  <textarea
                    rows={2}
                    value={followUpActions}
                    onChange={(e) => setFollowUpActions(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    placeholder="Pesan dan harapan pembinaan bagi orang tua di rumah..."
                  />
                </div>
              </div>
            )}

            {/* 8B. DETAIL KHUSUS: FORMAT LAPORAN PERIODIK KEMENSOS RI & SEKOLAH RAKYAT */}
            {letterType === 'laporan_kemensos_periodik' && (
              <div className="bg-gradient-to-br from-red-900/10 via-rose-900/5 to-slate-900/10 rounded-2xl p-5 border border-red-300 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-red-200 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center shadow-xs">
                      <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Format Laporan Keasramaan Kemensos RI</h3>
                      <p className="text-[11px] text-red-700">Tata Naskah Dinas & Standar Pelayanan Minimal (SPM) Kementerian Sosial RI</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, attendanceTargetDorm);
                      onShowToast('Statistik Disinkronkan', 'Data kehadiran dan siswa berhasil dimutakhirkan untuk laporan Kemensos.', 'success');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tarik Data Otomatis</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Periode Laporan</label>
                    <input
                      type="text"
                      value={kemensosReportPeriod}
                      onChange={(e) => setKemensosReportPeriod(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-white font-bold"
                      placeholder="e.g. Bulan Oktober 2025 / Semester Ganjil 2025/2026"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Sasaran Rombel & Asrama</label>
                    <div className="flex gap-2">
                      <select
                        value={attendanceTargetClass}
                        onChange={(e) => {
                          setAttendanceTargetClass(e.target.value);
                          calculateAttendanceData(attendanceDate, attendanceSession, e.target.value, attendanceTargetDorm);
                        }}
                        className="w-1/2 px-2.5 py-2 text-xs rounded-lg border border-red-200 bg-white"
                      >
                        <option value="Semua Kelas">Semua Kelas</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                      <select
                        value={attendanceTargetDorm}
                        onChange={(e) => {
                          setAttendanceTargetDorm(e.target.value);
                          calculateAttendanceData(attendanceDate, attendanceSession, attendanceTargetClass, e.target.value);
                        }}
                        className="w-1/2 px-2.5 py-2 text-xs rounded-lg border border-red-200 bg-white"
                      >
                        <option value="Semua Asrama">Semua Asrama</option>
                        <option value="Asrama Putra">Asrama Putra</option>
                        <option value="Asrama Putri">Asrama Putri</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    I. Dasar Hukum Pelaksanaan (Standar Regulasi Kemensos RI)
                  </label>
                  <textarea
                    rows={3}
                    value={kemensosLegalBasis}
                    onChange={(e) => setKemensosLegalBasis(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-red-200 bg-white leading-relaxed font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    II. Maksud dan Tujuan Laporan
                  </label>
                  <textarea
                    rows={2}
                    value={kemensosObjectives}
                    onChange={(e) => setKemensosObjectives(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-red-200 bg-white leading-relaxed"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-red-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    III. Ringkasan Data Statistik Terpadu (Presensi & Pembinaan)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total Siswa</span>
                      <span className="font-bold text-slate-900 text-sm">{attendanceTotalStudents}</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block">Hadir Ibadah</span>
                      <span className="font-bold text-emerald-900 text-sm">{attendancePresentCount}</span>
                    </div>
                    <div className="p-2 rounded bg-blue-50 border border-blue-200">
                      <span className="text-[10px] text-blue-700 block">Verif Face AI</span>
                      <span className="font-bold text-blue-900 text-sm">{attendanceFaceCount}</span>
                    </div>
                    <div className="p-2 rounded bg-rose-50 border border-rose-200">
                      <span className="text-[10px] text-rose-700 block">Alpa / Kasus</span>
                      <span className="font-bold text-rose-900 text-sm">{attendanceAlphaCount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    IV. Uraian Perkembangan & Dinamika Perilaku Peserta Didik
                  </label>
                  <textarea
                    rows={3}
                    value={bodyMain}
                    onChange={(e) => setBodyMain(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-red-200 bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    V. Evaluasi & Hambatan Lapangan
                  </label>
                  <textarea
                    rows={2}
                    value={kemensosEvaluation}
                    onChange={(e) => setKemensosEvaluation(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-red-200 bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    VI. Rekomendasi Rencana Tindak Lanjut Program Kemensos RI
                  </label>
                  <textarea
                    rows={2}
                    value={kemensosRecommendations}
                    onChange={(e) => setKemensosRecommendations(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-red-200 bg-white leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 8C. DETAIL KHUSUS: BERITA ACARA INSIDEN / KASUS KHUSUS KEMENSOS RI */}
            {letterType === 'berita_acara_insiden_kemensos' && (
              <div className="bg-gradient-to-br from-amber-500/10 via-red-500/10 to-slate-900/10 rounded-2xl p-5 border border-amber-300 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-amber-200 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Format Berita Acara Insiden / Kasus Khusus</h3>
                    <p className="text-[11px] text-amber-800">SOP Penanganan Kasus & Perlindungan Sosial Anak Kemensos RI</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Tanggal Kejadian</label>
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Lokasi Kejadian</label>
                    <input
                      type="text"
                      value={incidentLocation}
                      onChange={(e) => setIncidentLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 bg-white"
                      placeholder="e.g. Asrama Putra / Lapangan Olahraga"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    I. Kronologi Kejadian / Deskripsi Insiden
                  </label>
                  <textarea
                    rows={3}
                    value={problemSummary}
                    onChange={(e) => setProblemSummary(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-amber-200 bg-white leading-relaxed"
                    placeholder="Uraikan fakta kejadian, waktu, saksi, dan dampak insiden..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    II. Penanganan & Intervensi yang Telah Dilakukan (SOP Kemensos RI)
                  </label>
                  <textarea
                    rows={3}
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-amber-200 bg-white leading-relaxed"
                    placeholder="Langkah pendampingan psikososial, mediasi, atau tindakan medis..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    III. Rekomendasi Tindak Lanjut & Monitoring
                  </label>
                  <textarea
                    rows={2}
                    value={followUpActions}
                    onChange={(e) => setFollowUpActions(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-amber-200 bg-white leading-relaxed"
                    placeholder="Upaya pembinaan lanjutan, koordinasi wali murid, atau rujukan balai..."
                  />
                </div>
              </div>
            )}

            {/* 9. NARASI UMUM SURAT */}
            {letterType !== 'kronologi_kasus_psikologi' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Isi Batang Tubuh Surat
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kalimat Pembuka</label>
                  <input
                    type="text"
                    value={bodyIntro}
                    onChange={(e) => setBodyIntro(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Isi Utama Surat</label>
                  <textarea
                    rows={4}
                    value={bodyMain}
                    onChange={(e) => setBodyMain(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 leading-relaxed"
                    placeholder="Isi rincian permohonan atau narasi surat dinas..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kalimat Penutup</label>
                  <textarea
                    rows={2}
                    value={bodyClosing}
                    onChange={(e) => setBodyClosing(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

          </div>
          <div className="xl:col-span-5 space-y-4 sticky top-20">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Live Preview Dokumen
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveLetter}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition active:scale-95 border border-slate-300"
                  title="Simpan surat ke arsip lokal"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" /> Simpan Arsip
                </button>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition active:scale-95 border border-slate-300"
                  title="Salin isi surat"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  {isCopied ? 'Tersalin' : 'Salin'}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf('print')}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf('download')}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition active:scale-95 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh PDF
                </button>
              </div>
            </div>

            {/* A4 Realistic Document Paper Preview */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-2xl p-6 text-slate-900 font-serif text-[11px] leading-relaxed max-h-[80vh] overflow-y-auto print:max-h-none">
              {/* Institutional Kop Header */}
              <div className="text-center pb-3 border-b-[3px] border-slate-900 mb-1 relative">
                <div className="border-b-[1px] border-slate-900 absolute bottom-[-4px] left-0 right-0 w-full" />
                {(config.kopKiri || 'KEMENTERIAN SOSIAL REPUBLIK INDONESIA').split('\n').map((line, i) => (
                  <p key={`kiri-${i}`} className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                    {line}
                  </p>
                ))}
                {(config.kopKanan || 'SEKOLAH RAKYAT TERPADU 31 PALEMBANG').split('\n').map((line, i) => (
                  <p key={`kanan-${i}`} className={i === 0 ? "font-black text-sm uppercase text-red-700 tracking-tight pt-0.5" : "font-sans text-[9px] text-slate-600 font-normal"}>
                    {line}
                  </p>
                ))}
              </div>
              {/* Date on Right */}
              <div className="text-right pt-3">
                <span className="font-sans text-[10px]">
                  {letterCity}, {formatDateIndonesian(letterDate)}
                </span>
              </div>

              {/* Meta Number & Subject */}
              <div className="grid grid-cols-6 gap-1 my-3 font-sans text-[10.5px]">
                <span className="col-span-1 text-slate-500">Nomor</span>
                <span className="col-span-5 font-bold font-mono text-slate-800">: {letterNumber}</span>
                <span className="col-span-1 text-slate-500">Lampiran</span>
                <span className="col-span-5">: {enclosure}</span>
                <span className="col-span-1 text-slate-500 font-bold">Perihal</span>
                <span className="col-span-5 font-bold text-red-950">: {subject}</span>
              </div>

              {/* Recipient */}
              <div className="my-3 font-sans text-[10.5px]">
                <p>Kepada Yth.</p>
                <p className="font-bold">{recipientName}</p>
                {recipientTitle && <p className="text-slate-700">{recipientTitle}</p>}
                {recipientOffice && <p className="text-slate-700">{recipientOffice}</p>}
                <p className="text-slate-600">{recipientAddress}</p>
              </div>

              {/* Greeting */}
              <p className="my-2">{bodyIntro}</p>

              {/* Body Content based on type */}
              {letterType === 'laporan_kemensos_periodik' ? (
                <div className="space-y-3 font-serif">
                  <div className="text-center border-b border-slate-300 pb-2">
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                      LAPORAN PERIODIK KEASRAMAAN & PEMBINAAN PESERTA DIDIK
                    </h3>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Standar Pelaporan Resmi Kementerian Sosial RI - Sekolah Rakyat 31 Palembang
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono italic">
                      Periode: {kemensosReportPeriod} | No. Register: {letterNumber}
                    </p>
                  </div>

                  {/* I. Dasar Hukum */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      I. Dasar Pelaksanaan & Landasan Hukum Kemensos RI
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-red-500 font-sans">
                      {kemensosLegalBasis}
                    </p>
                  </div>

                  {/* II. Maksud dan Tujuan */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      II. Maksud dan Tujuan
                    </h4>
                    <p className="text-justify text-[9.5px] text-slate-800 pl-2 border-l-2 border-amber-500">
                      {kemensosObjectives}
                    </p>
                  </div>

                  {/* III. Rekapitulasi Data Statistik */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      III. Rekapitulasi Data Statistik Keasramaan
                    </h4>
                    <table className="w-full border-collapse border border-slate-300 text-[9px] font-sans">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-1 font-bold w-1/2">Sasaran Rombel / Asrama</td>
                          <td className="border border-slate-300 p-1">: {attendanceTargetClass} / {attendanceTargetDorm}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 font-bold">Total Peserta Didik Terdaftar</td>
                          <td className="border border-slate-300 p-1">: {attendanceTotalStudents} Orang</td>
                        </tr>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold">
                          <td className="border border-slate-300 p-1">Tingkat Kehadiran Ibadah Berjamaah</td>
                          <td className="border border-slate-300 p-1">
                            : {attendancePresentCount} Orang ({attendanceTotalStudents > 0 ? Math.round((attendancePresentCount / attendanceTotalStudents) * 100) : 0}%)
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 font-bold">Verifikasi Digital Presensi</td>
                          <td className="border border-slate-300 p-1">
                            : Face AI ({attendanceFaceCount}), QR ({attendanceQrCount}), RFID ({attendanceRfidCount})
                          </td>
                        </tr>
                        <tr className="bg-rose-50 text-rose-950">
                          <td className="border border-slate-300 p-1 font-bold">Alpa / Kasus Ketidakhadiran</td>
                          <td className="border border-slate-300 p-1 font-bold">: {attendanceAlphaCount} Kasus</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* IV. Uraian Perkembangan Siswa */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      IV. Uraian Perkembangan & Dinamika Siswa
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-blue-500">
                      {bodyMain}
                    </p>
                  </div>

                  {/* V. Evaluasi & Kendala */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      V. Evaluasi, Kendala & Rekomendasi Program Kemensos RI
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-indigo-500 font-sans">
                      <strong>Evaluasi:</strong> {kemensosEvaluation}{'\n\n'}
                      <strong>Rekomendasi Tindak Lanjut:</strong> {kemensosRecommendations}
                    </p>
                  </div>
                </div>
              ) : letterType === 'berita_acara_insiden_kemensos' ? (
                <div className="space-y-3 font-serif">
                  <div className="text-center border-b border-slate-300 pb-2">
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                      BERITA ACARA PENANGANAN INSIDEN / KASUS KHUSUS KEASRAMAAN
                    </h3>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Standar Operasional Penanganan Kasus Kementerian Sosial RI & Sekolah Rakyat
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono italic">
                      Nomor: {letterNumber}
                    </p>
                  </div>

                  <p className="text-justify indent-4 text-[9.5px]">
                    {bodyIntro}
                  </p>

                  <div className="bg-slate-50 p-2 rounded border border-slate-200 font-sans text-[10px] space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">Nama Peserta Didik</span>
                      <span className="col-span-2 font-bold text-slate-900">: {studentName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">NISN / Kelas</span>
                      <span className="col-span-2">: {studentNisn || selectedStudentId || '-'} / {studentClass || '-'} ({studentDorm || '-'})</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Waktu & Tempat</span>
                      <span className="col-span-2">: {incidentDate ? formatDateIndonesian(incidentDate) : '-'} di {incidentLocation || 'Asrama'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Orang Tua / Wali</span>
                      <span className="col-span-2">: {studentParentName || '-'} ({studentParentPhone || '-'})</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      I. Kronologi Kejadian / Masalah
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-red-500">
                      {problemSummary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      II. Penanganan yang Telah Dilakukan (SOP Kemensos RI)
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-amber-500">
                      {actionsTaken}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      III. Rekomendasi Tindak Lanjut & Monitoring
                    </h4>
                    <p className="text-justify whitespace-pre-line text-[9.5px] text-slate-800 pl-2 border-l-2 border-emerald-500">
                      {followUpActions}
                    </p>
                  </div>
                </div>
              ) : letterType === 'berita_acara_presensi' ? (
                <div className="space-y-3 font-serif">
                  <p className="text-justify indent-4">
                    {bodyIntro}
                  </p>

                  {/* Metadata Sesi Box */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-sans text-[10px] space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">Hari / Tanggal</span>
                      <span className="col-span-2 font-bold text-slate-900">: {formatDateIndonesian(attendanceDate)}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Sesi Presensi</span>
                      <span className="col-span-2 font-bold text-red-900">: {attendanceSession}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Sasaran Rombel</span>
                      <span className="col-span-2">: {attendanceTargetClass} | {attendanceTargetDorm}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Metode Verifikasi</span>
                      <span className="col-span-2 text-purple-900 font-bold">: Face Recognition AI, QR Code Scanner & RFID</span>
                    </div>
                  </div>

                  {/* I. Tabel Rekapitulasi Statistik */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      I. Rekapitulasi Statistik Presensi Kehadiran
                    </h4>
                    <table className="w-full border-collapse border border-slate-300 text-[9px] font-sans">
                      <thead>
                        <tr className="bg-red-800 text-white font-bold text-center">
                          <th className="border border-slate-300 p-1 text-left">Kategori & Instrumen Presensi</th>
                          <th className="border border-slate-300 p-1 w-20">Jumlah</th>
                          <th className="border border-slate-300 p-1 w-16">Persen</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50 font-bold">
                          <td className="border border-slate-300 p-1">Total Santri Terdaftar / Target</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceTotalStudents} Santri</td>
                          <td className="border border-slate-300 p-1 text-center">100%</td>
                        </tr>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold">
                          <td className="border border-slate-300 p-1">Hadir Tepat Waktu / Berjamaah</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendancePresentCount} Santri</td>
                          <td className="border border-slate-300 p-1 text-center">
                            {attendanceTotalStudents > 0 ? Math.round((attendancePresentCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 pl-4 text-purple-900">↳ Terverifikasi Face Recognition AI</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceFaceCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceFaceCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 pl-4 text-blue-900">↳ Terverifikasi Kartu QR Scanner</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceQrCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceQrCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 pl-4 text-indigo-900">↳ Terverifikasi Kartu RFID Serial</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceRfidCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceRfidCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 pl-4 text-slate-700">↳ Presensi Manual / Dispensasi</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceManualCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceManualCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-amber-900">Izin Sakit UKS / Klinik Asrama</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceSickCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceSickCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-sky-900">Izin Pulang / Dinas Lembaga</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceLeaveCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceLeaveCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 text-orange-900">Terlambat Hadir Sesi</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceLateCount}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceLateCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                        <tr className="bg-rose-100 text-rose-950 font-bold">
                          <td className="border border-slate-300 p-1">Alpa / Tanpa Keterangan</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{attendanceAlphaCount} Santri</td>
                          <td className="border border-slate-300 p-1 text-center">
                            {attendanceTotalStudents > 0 ? Math.round((attendanceAlphaCount / attendanceTotalStudents) * 100) : 0}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* II. Daftar Santri Tidak Hadir */}
                  {attendanceAbsentStudentNames && (
                    <div>
                      <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                        II. Daftar Santri Tidak Hadir / Butuh Perhatian Khusus
                      </h4>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[9px] font-mono whitespace-pre-line text-slate-800">
                        {attendanceAbsentStudentNames}
                      </div>
                    </div>
                  )}

                  {/* III. Catatan Evaluasi & Rekomendasi */}
                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      III. Catatan Observasi & Dinamika Sesi
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-red-400">
                      {attendanceNotes}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      IV. Rekomendasi Tindak Lanjut Kedisiplinan
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-emerald-400">
                      {followUpActions}
                    </p>
                  </div>
                </div>
              ) : letterType === 'peringatan_ketidakhadiran' ? (
                <div className="space-y-3 font-serif">
                  <p className="text-justify indent-4">
                    {bodyIntro}
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-sans text-[10px] space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">Nama Santri</span>
                      <span className="col-span-2 font-bold text-slate-900">: {studentName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">NISN / ID</span>
                      <span className="col-span-2">: {studentNisn || selectedStudentId || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Kelas / Asrama</span>
                      <span className="col-span-2">: {studentClass || '-'} / {studentDorm || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Nama Orang Tua</span>
                      <span className="col-span-2">: {studentParentName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold text-rose-700">Jumlah Alpa Tercatat</span>
                      <span className="col-span-2 font-black text-rose-800 font-mono">: {attendanceAlphaCount || 1} Kali Ketidakhadiran</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      I. Rincian Pelanggaran Kedisiplinan Ibadah
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-amber-400">
                      {bodyMain}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      II. Konsekuensi & Pembinaan Asrama
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-slate-400">
                      {actionsTaken}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      III. Arahan Kepada Orang Tua / Wali
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-emerald-400">
                      {followUpActions}
                    </p>
                  </div>
                </div>
              ) : letterType === 'kronologi_kasus_psikologi' ? (
                <div className="space-y-3 font-serif">
                  <p className="text-justify indent-4">
                    Sehubungan dengan pendampingan dan pembinaan keasramaan di Sekolah Rakyat 31 Palembang, bersama ini kami sampaikan laporan kronologi kejadian serta analisis psikologis perkembangan peserta didik:
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-sans text-[10px] space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">Nama Siswa</span>
                      <span className="col-span-2 font-bold text-slate-900">: {studentName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">NISN / ID</span>
                      <span className="col-span-2">: {studentNisn || selectedStudentId || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Kelas / Asrama</span>
                      <span className="col-span-2">: {studentClass || '-'} / {studentDorm || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Waktu & Lokasi</span>
                      <span className="col-span-2">: {formatDateIndonesian(incidentDate)} ({incidentLocation})</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      I. Kronologi Kejadian & Permasalahan Anak
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-purple-300">
                      {problemSummary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-purple-900 mb-0.5">
                      II. Analisis Teori Psikologi Anak
                    </h4>
                    <p className="text-[9.5px] font-sans font-bold text-purple-700 italic mb-1">
                      Landasan Teori: {psychologyTheoryName}
                    </p>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-purple-400">
                      {psychologyTheoryAnalysis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      III. Tindakan yang Telah Dilakukan
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-slate-300">
                      {actionsTaken}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                      IV. Upaya & Rekomendasi Tindak Lanjut
                    </h4>
                    <p className="text-justify whitespace-pre-line text-slate-800 pl-2 border-l-2 border-emerald-400">
                      {followUpActions}
                    </p>
                  </div>
                </div>
              ) : letterType === 'pengajuan_barang' ? (
                <div className="space-y-3">
                  <p className="text-justify indent-4">{bodyMain}</p>

                  <table className="w-full border-collapse border border-slate-300 text-[9.5px] font-sans">
                    <thead>
                      <tr className="bg-red-800 text-white font-bold">
                        <th className="border border-slate-300 p-1 text-center w-6">No</th>
                        <th className="border border-slate-300 p-1 text-left">Nama Barang</th>
                        <th className="border border-slate-300 p-1 text-center w-14">Qty</th>
                        <th className="border border-slate-300 p-1 text-right w-20">Est. Harga</th>
                        <th className="border border-slate-300 p-1 text-right w-20">Total</th>
                        <th className="border border-slate-300 p-1 text-left">Alasan / Urgensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-300 p-1 font-bold">{item.name || '-'}</td>
                          <td className="border border-slate-300 p-1 text-center">{item.quantity} {item.unit}</td>
                          <td className="border border-slate-300 p-1 text-right font-mono">
                            Rp {(item.estimatedPrice || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="border border-slate-300 p-1 text-right font-mono font-bold">
                            Rp {((item.estimatedPrice || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                          </td>
                          <td className="border border-slate-300 p-1 text-[9px] text-slate-600">{item.reason}</td>
                        </tr>
                      ))}
                      <tr className="bg-amber-100 font-bold">
                        <td colSpan={4} className="border border-slate-300 p-1 text-right">Total Anggaran:</td>
                        <td colSpan={2} className="border border-slate-300 p-1 text-left font-mono text-red-900">
                          Rp {totalSupplyCost.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : letterType === 'izin_kerja_staf' ? (
                <div className="space-y-3 font-serif">
                  <p>Saya yang bertanda tangan di bawah ini:</p>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-sans text-[10px] space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">Nama Staf / Wali Asuh</span>
                      <span className="col-span-2 font-bold text-slate-900">: {authorName}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Jabatan / Tugas</span>
                      <span className="col-span-2">: {authorRole}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Jenis Izin</span>
                      <span className="col-span-2 font-bold text-blue-900">: {leaveType}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Periode Izin</span>
                      <span className="col-span-2">: {formatDateIndonesian(leaveStartDate)} s.d. {formatDateIndonesian(leaveEndDate)} ({leaveTotalDays} Hari)</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Pengganti Piket</span>
                      <span className="col-span-2">: {leaveHandoverStaff || '-'}</span>
                    </div>
                  </div>

                  <p className="text-justify indent-4">
                    Dengan ini bermaksud mengajukan permohonan izin tidak hadir piket keasramaan dengan alasan: <em>{leaveReason}</em>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-serif">
                  <p className="text-justify whitespace-pre-line indent-4">{bodyMain}</p>
                </div>
              )}

              {/* Closing */}
              <p className="my-3 text-justify indent-4">{bodyClosing}</p>

              {/* Signatures */}
              {letterType === 'laporan_kemensos_periodik' ? (
                <div className="pt-6 font-sans text-[9.5px] text-center space-y-5">
                  <div className="grid grid-cols-2">
                    <div>
                      <p className="text-slate-600">Mengetahui,</p>
                      <p className="text-slate-600 font-medium">{acknowledgementTitle || 'Wali Asrama Mandiri,'}</p>
                      <div className="h-10 flex items-center justify-center">
                        <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                      </div>
                      <p className="font-bold underline text-slate-900">{acknowledgementName || config.waliAsrama || 'HISNUL HASHIN, SE'}</p>
                      <p className="text-[8px] text-slate-500 font-mono">{acknowledgementNip || config.waliAsramaNip || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Palembang, {formatDateIndonesian(letterDate)}</p>
                      <p className="text-slate-600 font-medium">{signatureAuthorLabel || 'Pembuat Laporan / Wali Asuh,'}</p>
                      <div className="h-10 flex items-center justify-center">
                        <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                      </div>
                      <p className="font-bold underline text-slate-900">{authorName}</p>
                      <p className="text-[8px] text-slate-500 font-mono">{authorRole}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-slate-600">Menyetujui / Mengesahkan,</p>
                    <p className="text-slate-600 font-medium">{approvalTitle || 'Kepala Sekolah Rakyat 31 (Kemensos RI),'}</p>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan & Cap Dinas]</span>
                    </div>
                    <p className="font-bold underline text-slate-900">{approvalName || config.kepalaSekolah || 'YUNI ARSI, S.Pd'}</p>
                    <p className="text-[8px] text-slate-500 font-mono">{approvalNip || config.kepalaSekolahNip || '-'}</p>
                  </div>
                </div>
              ) : (letterType === 'berita_acara_presensi' || letterType === 'berita_acara_insiden_kemensos') ? (
                <div className="grid grid-cols-2 pt-6 font-sans text-[9.5px] text-center">
                  <div>
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="text-slate-600 font-medium">Wali Asrama Mandiri,</p>
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                    </div>
                    <p className="font-bold underline text-slate-900">{acknowledgementName || config.waliAsrama || 'HISNUL HASHIN, SE'}</p>
                    <p className="text-[8px] text-slate-500 font-mono">{acknowledgementNip || config.waliAsramaNip || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Palembang, {formatDateIndonesian(letterDate)}</p>
                    <p className="text-slate-600 font-medium">{signatureAuthorLabel || 'Pembuat Berita Acara / Pembina,'}</p>
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                    </div>
                    <p className="font-bold underline text-slate-900">{authorName}</p>
                    <p className="text-[8px] text-slate-500 font-mono">{authorRole}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end text-center pt-6 font-sans text-[9.5px]">
                  <div>
                    <p className="text-slate-600">Wali Asuh / Pemohon,</p>
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                    </div>
                    <p className="font-bold underline text-slate-900">{authorName}</p>
                    <p className="text-[8px] text-slate-500">{authorRole}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY ARCHIVE SUBTAB */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-600" />
                Arsip & Riwayat Surat Resmi Wali Asuh
              </h2>
              <p className="text-xs text-slate-500">
                Daftar dokumen surat resmi yang pernah dibuat dan tersimpan di database sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari surat, nomor, perihal..."
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 w-56"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">Semua Jenis Surat</option>
                <option value="berita_acara_presensi">Berita Acara Presensi (Face AI)</option>
                <option value="peringatan_ketidakhadiran">Peringatan Ketidakhadiran</option>
                <option value="kronologi_kasus_psikologi">Kronologi Kasus (Psikologi)</option>
                <option value="pengajuan_barang">Pengajuan Barang</option>
                <option value="izin_kerja_staf">Izin Kerja Staf</option>
                <option value="permohonan">Permohonan Kegiatan</option>
                <option value="undangan_ortu">Undangan Orang Tua</option>
                <option value="pernyataan_siswa">Pernyataan Siswa</option>
                <option value="keterangan_baik">Keterangan Baik</option>
                <option value="rujukan_medis_psikologis">Rujukan Medis</option>
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="p-3 bg-white rounded-full w-fit mx-auto shadow-xs border border-slate-200">
                <FileSpreadsheet className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Surat yang Diarsipkan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan buat dokumen surat baru pada formulir generator dan klik tombol "Simpan Arsip".
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('create')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Buat Surat Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                        {letter.letterType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateIndonesian(letter.letterDate)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {letter.subject || letter.letterTitle}
                    </h3>
                    <p className="text-xs font-mono font-semibold text-slate-500">
                      No: {letter.letterNumber}
                    </p>

                    {letter.studentName && (
                      <div className="text-xs bg-purple-50 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>Siswa: {letter.studentName} ({letter.studentClass})</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p className="truncate"><strong>Tujuan:</strong> {letter.recipientName}</p>
                      <p className="truncate"><strong>Pembuat:</strong> {letter.authorName}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoadLetter(letter)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 transition"
                        title="Buka untuk diedit"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsGeneratingPdf(true);
                          await generateOfficialLetterPDF(letter, config, 'download');
                          setIsGeneratingPdf(false);
                          onShowToast('Unduh Berhasil', 'File PDF surat telah diunduh.', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition"
                        title="Unduh PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSavedLetter(letter.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                      title="Hapus arsip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
