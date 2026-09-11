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
  ChevronRight,
  BookOpen,
  ArrowRight,
  FileCheck,
  User,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { Student, AppConfig, OfficialLetter, OfficialLetterType, LetterSupplyItem } from '../types';
import { generateOfficialLetterPDF } from '../services/letterPdfGenerator';
import { loadOfficialLetters, saveOfficialLetters } from '../services/storage';
import { formatDateIndonesian } from '../utils/dateFormatter';

interface LetterGeneratorTabProps {
  students: Student[];
  config: AppConfig;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'warning') => void;
  initialStudentId?: string;
  initialLetterType?: OfficialLetterType;
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
  config,
  onShowToast,
  initialStudentId,
  initialLetterType = 'kronologi_kasus_psikologi'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [savedLetters, setSavedLetters] = useState<OfficialLetter[]>(loadOfficialLetters);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [letterType, setLetterType] = useState<OfficialLetterType>(initialLetterType);
  const [letterNumber, setLetterNumber] = useState<string>(() => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `SR31/WA/${month}/${year}/${Math.floor(100 + Math.random() * 900)}`;
  });
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

  // General Narrative
  const [bodyIntro, setBodyIntro] = useState<string>('Dengan hormat,');
  const [bodyMain, setBodyMain] = useState<string>(
    'Bersama surat ini, kami selaku Wali Asuh mengajukan permohonan sebagaimana perihal di atas untuk menjadi perhatian dan mendapatkan tindak lanjut dari pihak pimpinan keasramaan.'
  );
  const [bodyClosing, setBodyClosing] = useState<string>(
    'Demikian surat ini kami sampaikan dengan sebenarnya. Atas perhatian, arahan, dan perkenan Bapak/Ibu, kami ucapkan terima kasih.'
  );

  // Signatures
  const [acknowledgementName, setAcknowledgementName] = useState<string>(config.waliAsrama || 'HISNUL HASHIN, SE');
  const [acknowledgementNip, setAcknowledgementNip] = useState<string>(config.waliAsramaNip || 'NIP. 197406262025211027');
  const [acknowledgementTitle, setAcknowledgementTitle] = useState<string>(config.waliAsramaTitle || 'Wali Asrama Mandiri');
  const [approvalName, setApprovalName] = useState<string>(config.kepalaSekolah || 'YUNI ARSI, S.Pd');
  const [approvalNip, setApprovalNip] = useState<string>(config.kepalaSekolahNip || 'NIP. 197206051999032002');
  const [approvalTitle, setApprovalTitle] = useState<string>('Kepala Sekolah Rakyat 31');

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

    if (type === 'kronologi_kasus_psikologi') {
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
      subject,
      enclosure,
      bodyIntro,
      bodyMain,
      bodyClosing,
      signatureAuthorLabel: 'Wali Asuh / Pemohon,',
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
    enclosure,
    bodyIntro,
    bodyMain,
    bodyClosing,
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
    onShowToast('Surat Berhasil Diarsipkan', `Dokumen "${subject}" telah disimpan ke riwayat administrasi surat.`, 'success');
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
${followUpActions}` : bodyMain}

${bodyClosing}

Hormat kami,
Pemohon/Wali Asuh: ${authorName}
Mengetahui: ${acknowledgementName} (${acknowledgementTitle})
Menyetujui: ${approvalName} (${approvalTitle})`;

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
    onShowToast('Surat Dihapus', 'Dokumen telah dihapus dari arsip surat.', 'warning');
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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Surat</label>
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

            {/* 7. NARASI UMUM SURAT */}
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

            {/* 8. PENGATURAN TANDA TANGAN & PEJABAT */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Kolom Penandatangan & Mengetahui
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800 block">1. Mengetahui: Wali Asrama</span>
                  <input
                    type="text"
                    value={acknowledgementName}
                    onChange={(e) => setAcknowledgementName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={acknowledgementNip}
                    onChange={(e) => setAcknowledgementNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={acknowledgementTitle}
                    onChange={(e) => setAcknowledgementTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-600"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800 block">2. Menyetujui: Kepala Sekolah</span>
                  <input
                    type="text"
                    value={approvalName}
                    onChange={(e) => setApprovalName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={approvalNip}
                    onChange={(e) => setApprovalNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={approvalTitle}
                    onChange={(e) => setApprovalTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT LIVE PREVIEW & ACTION COLUMN (5 cols) */}
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
              <div className="text-center pb-3 border-b-2 border-double border-slate-950 relative">
                <p className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Kementerian Sosial Republik Indonesia
                </p>
                <p className="font-bold text-[11.5px] uppercase tracking-wide text-slate-900">
                  Badan Pendidikan Penelitian dan Penyuluhan Sosial
                </p>
                <p className="font-black text-sm uppercase text-red-700 tracking-tight">
                  Sekolah Rakyat 31 Palembang
                </p>
                <p className="font-sans text-[9px] text-slate-600 font-normal">
                  Kompleks Balai Budi Perkasa, Jl. Sosial Km. 5, Palembang, Sumatera Selatan
                </p>
                <p className="font-sans text-[8.5px] text-slate-500">
                  Asrama Mandiri Terpadu | Pos-el: sekolahrakyat31@kemensos.go.id
                </p>
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
              {letterType === 'kronologi_kasus_psikologi' ? (
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
              <div className="grid grid-cols-3 gap-2 text-center pt-6 font-sans text-[9.5px]">
                <div>
                  <p className="text-slate-600">Wali Asuh / Pemohon,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-bold underline text-slate-900">{authorName}</p>
                  <p className="text-[8px] text-slate-500">{authorRole}</p>
                </div>

                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="text-[8px] text-slate-500">{acknowledgementTitle}</p>
                  <div className="h-10 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-bold underline text-slate-900">{acknowledgementName}</p>
                  <p className="text-[8px] text-slate-500">{acknowledgementNip}</p>
                </div>

                <div>
                  <p className="text-slate-600">Menyetujui,</p>
                  <p className="text-[8px] text-slate-500">{approvalTitle}</p>
                  <div className="h-10 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-bold underline text-slate-900">{approvalName}</p>
                  <p className="text-[8px] text-slate-500">{approvalNip}</p>
                </div>
              </div>
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
