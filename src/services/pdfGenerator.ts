import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Student, DailyJournal, Leave, ReportCardData, AppConfig, Violation, Counseling, MedicalRecord, PrayerAttendance, ParentSummonsOptions, ConnectingJournal, MenstruationRecord } from '../types';
import { formatDateIndonesian, formatDateShort } from '../utils/dateFormatter';
import { calculateStudentDisciplineScore } from './storage';

// Helper to generate canvas base64 logo if URL fails or is empty
function generateProgrammaticLogo(type: 'left' | 'right'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'left') {
    ctx.beginPath();
    ctx.moveTo(60, 15);
    ctx.lineTo(100, 35);
    ctx.lineTo(100, 85);
    ctx.lineTo(60, 105);
    ctx.lineTo(20, 85);
    ctx.lineTo(20, 35);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(60, 50);
    ctx.lineTo(85, 65);
    ctx.lineTo(60, 80);
    ctx.lineTo(35, 65);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(60, 40, 7, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(60, 60, 54, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(60, 60, 46, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(60, 35);
    ctx.bezierCurveTo(45, 20, 25, 45, 60, 85);
    ctx.bezierCurveTo(95, 45, 75, 20, 60, 35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(60, 52, 10, 0, 2 * Math.PI);
    ctx.fill();
  }
  return canvas.toDataURL('image/png');
}

function loadLogoImage(url: string, fallbackType: 'left' | 'right'): Promise<string> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(generateProgrammaticLogo(fallbackType));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/png'));
          return;
        } catch (e) {
          console.error(e);
        }
      }
      resolve(generateProgrammaticLogo(fallbackType));
    };
    img.onerror = function () {
      resolve(generateProgrammaticLogo(fallbackType));
    };
    img.src = url;
  });
}

function generateWatermarkBase64(logoSrc: string, opacity: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0, 400, 400);
        resolve(canvas.toDataURL('image/png'));
        return;
      }
      resolve('');
    };
    img.onerror = function () {
      resolve('');
    };
    img.src = logoSrc;
  });
}

export const RAPOR_STRUCTURE = [
  { key: "KEPEMIMPINAN", name: "KEPEMIMPINAN", indicators: ["Kemampuan menjalin relasi dengan baik", "Kemampuan memberikan instruksi", "Kemampuan mempersuasi", "Kemampuan mengorganisasi", "Menjadi pemberi inspirasi"] },
  { key: "KETAATAN_IBADAH", name: "KETAATAN IBADAH", indicators: ["Etika Beribadah", "Konsistensi beribadah", "Kerapihan dalam beribadah", "Memiliki Sifat Toleransi"] },
  { key: "EMPATI", name: "EMPATI", indicators: ["Menghindari dan tidak melakukan bullying", "Peka dan suka membantu", "Kemampuan mengapresiasi", "Kemampuan bersahabat", "Kemampuan mendengarkan lawan bicara"] },
  { key: "KEMANDIRIAN", name: "KEMANDIRIAN", indicators: ["Pengelolaan waktu", "Kerapihan berpakaian", "Kerapihan tempat tidur", "Menjaga dan menata barang pribadi", "Menjaga ketertiban lingkungan"] },
  { key: "PERCAYA_DIRI", name: "PERCAYA DIRI", indicators: ["Keberanian membuat keputusan", "Keberanian berbicara dengan orang lain", "Keberanian tampil di depan umum", "Keberanian mengemukakan pendapat", "Memiliki optimisme"] },
  { key: "KEBERSIHAN", name: "KEBERSIHAN", indicators: ["Mandi minimal sekali sehari", "Kebersihan kulit", "Kebersihan mulut dan gigi", "Kebersihan kuku dan rambut", "Kebersihan pakaian", "Membuang sampah pada tempatnya", "Tidak meludah sembarang tempat"] },
  { key: "KETERAMPILAN_SOSIAL", name: "KETERAMPILAN SOSIAL", indicators: ["Kemampuan mengelola emosi", "Merespons situasi secara positif", "Memiliki daya juang", "Memiliki sikap hati-hati dalam bertindak", "Mengembalikan barang pinjaman"] },
  { key: "PENGEMBANGAN_DIRI", name: "PENGEMBANGAN DIRI", indicators: ["Memiliki harapan dan cita-cita", "Memiliki role model positif", "Memiliki rencana kuliah di PT", "Keaktifan berorganisasi", "Keaktifan mengikuti pelatihan", "Kemampuan berkarya dan berprestasi"] },
  { key: "BAHASA_ASING", name: "BAHASA ASING", indicators: ["Memiliki hafalan kosa kata", "Kemampuan memperkenalkan diri", "Kemampuan memahami rangkaian kalimat", "Kemampuan melakukan percakapan sehari-hari", "Kemampuan bercerita"] },
  { key: "SENI_BUDAYA", name: "SENI BUDAYA (TALENT MAPPING)", indicators: ["Kemampuan olah suara", "Kemampuan melukis/kaligrafi", "Kemampuan menari", "Kemampuan memainkan alat musik", "Meminati olahraga"] },
  { key: "NUMERASI", name: "NUMERASI", indicators: ["Kemampuan menghitung belanjaan", "Kemampuan berpikir logis", "Kemampuan membuat rencana keuangan", "Kemampuan menghitung nutrisi makanan", "Manajemen keuangan keluarga"] },
  { key: "LITERASI", name: "LITERASI", indicators: ["Memiliki kesukaan membaca", "Memahami teks, instruksi, definisi dan konsep", "Kemampuan mengemukakan gagasan atau pendapat", "Kemampuan membuat narasi dan mendeskripsikan", "Kemampuan mengingat fakta, membuat daftar dan menyusun laporan"] },
  { key: "KOMUNIKASI", name: "KOMUNIKASI", indicators: ["Menyampaikan pendapat dengan jelas", "Kemampuan bercerita secara sistematis", "Berkomunikasi dengan santun", "Memiliki teknik public speaking", "Kemampuan melakukan perilaku asertif"] },
  { key: "HIDUP_SEHAT", name: "HIDUP SEHAT", indicators: ["Mencuci tangan dengan air mengalir dan sabun", "Memanfaatkan jamban/WC dengan bersih dan sehat", "Melakukan olahraga teratur", "Kesadaran cek kesehatan dan berobat apabila sakit", "Mengonsumsi jajanan sehat dan tidak merokok", "Memiliki berat badan dan tinggi badan ideal sesuai usia"] },
  { key: "KEDISIPLINAN", name: "KEDISIPLINAN", indicators: ["Kehadiran tepat waktu", "Keaktifan menghadiri kegiatan", "Keaktifan berpartisipasi", "Kemampuan beradaptasi", "Tanggung jawab atas sikap dan tindakan"] }
];

// --- 1. CETAK JURNAL / CEKLIST HARIAN PDF ---
export async function printJournalPDF(journal: DailyJournal, student: Student | undefined, config: AppConfig) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');

  doc.setTextColor(30, 41, 59);
  let startY = 15;

  const kopKiriLines = config.kopKiri.split('\n');
  const kopKananLines = config.kopKanan.split('\n').filter((l) => l.toUpperCase() !== "EVALUASI PERKEMBANGAN KEASRAMAAN");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  if (kopKiriLines.length > 0) {
    doc.text(kopKiriLines[0] || "", 105, startY, { align: "center" });
    startY += 4.5;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  for (let i = 1; i < kopKiriLines.length; i++) {
    doc.text(kopKiriLines[i] || "", 105, startY, { align: "center" });
    startY += 4;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  if (kopKananLines.length > 0) {
    doc.text(kopKananLines[0] || "", 105, startY, { align: "center" });
    startY += 4;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  for (let i = 1; i < kopKananLines.length; i++) {
    doc.text(kopKananLines[i] || "", 105, startY, { align: "center" });
    startY += 3.5;
  }

  doc.addImage(leftLogoBase64, 'PNG', 15, 12, 18, 18);
  doc.addImage(rightLogoBase64, 'PNG', 177, 12, 18, 18);

  const lineY = startY + 2;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(15, lineY, 195, lineY);
  doc.setLineWidth(0.15);
  doc.line(15, lineY + 1, 195, lineY + 1);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("JURNAL & CEKLIST RUTINITAS HARIAN ASRAMA", 105, lineY + 7, { align: "center" });

  const metaY = lineY + 14;
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "bold"); doc.text("Nama Peserta Didik", 15, metaY);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${student ? student.name : ""}`, 48, metaY);
  doc.setFont("Helvetica", "bold"); doc.text("NISN / ID", 15, metaY + 5);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${student ? student.id : ""}`, 48, metaY + 5);
  doc.setFont("Helvetica", "bold"); doc.text("Kelas & Asrama", 15, metaY + 10);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${student ? `${student.class} - ${student.dorm}` : ""}`, 48, metaY + 10);

  doc.setFont("Helvetica", "bold"); doc.text("Tanggal Evaluasi", 115, metaY);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${journal.date}`, 148, metaY);
  doc.setFont("Helvetica", "bold"); doc.text("Rentang Waktu", 115, metaY + 5);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${journal.timeRange}`, 148, metaY + 5);
  doc.setFont("Helvetica", "bold"); doc.text("Wali Asuh", 115, metaY + 10);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${student ? student.caretaker : ""}`, 148, metaY + 10);

  doc.setLineWidth(0.3);
  doc.line(15, metaY + 14, 195, metaY + 14);

  const tableRows = (journal.tasksSnapshot || []).map((t, idx) => [
    (idx + 1).toString(),
    t.task || "",
    t.done ? "Tuntas" : "Belum Tuntas"
  ]);

  autoTable(doc, {
    head: [["No", "Tugas & Rutinitas Asrama", "Status Pelaksanaan"]],
    body: tableRows,
    startY: metaY + 18,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === "Tuntas") {
          data.cell.styles.textColor = [22, 101, 52];
        } else {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("CATATAN OBSERVASI WALI ASUH", 15, finalY);
  doc.line(15, finalY + 2, 195, finalY + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  const notes = journal.notes || "Tidak ada catatan khusus pada periode observasi ini.";
  const wrappedNotes = doc.splitTextToSize(notes, 175);
  doc.text(wrappedNotes, 15, finalY + 8);

  const sigY = finalY + 20 + wrappedNotes.length * 4;
  let actualSigY = sigY;
  if (sigY > 260) {
    doc.addPage();
    actualSigY = 30;
  }

  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.text(
    `Palembang, ${formatDateIndonesian(journal.date || new Date())}`,
    140,
    actualSigY
  );
  doc.text("Mengevaluasi,", 140, actualSigY + 5);
  doc.text("Wali Asuh Pendamping,", 140, actualSigY + 10);

  doc.setFont("Helvetica", "bold");
  doc.text(`( ${student ? student.caretaker : ""} )`, 140, actualSigY + 28);

  doc.save(`Jurnal_Ceklist_${student ? student.name.replace(/\s+/g, '_') : 'Siswa'}_${journal.date}.pdf`);
}

// --- 2. SURAT IZIN KELUAR & KEPULANGAN SISWA ASRAMA PDF ---
export async function printLeavePassPDF(
  leave: Leave,
  student: Student | undefined,
  config?: AppConfig
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  const kopKiriText =
    config?.kopKiri ||
    "PEMERINTAH PROVINSI SUMATERA SELATAN\nDINAS PENDIDIKAN\nSEKOLAH RAKYAT TERPADU 31 PALEMBANG";
  const kopKananText =
    config?.kopKanan ||
    "Jalan Seniman Amri Yahya, Jakabaring, Palembang\nTelepon: (0711) 510000 | Email: asrama@sekolahrakyat.sch.id\nLAMAN: www.sekolahrakyat.sch.id";

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.08
  );

  // Background Watermark
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 35, 75, 140, 140);
  }

  // Draw Kop Surat
  doc.addImage(leftLogoBase64, 'PNG', 12, 10, 22, 22);
  doc.addImage(rightLogoBase64, 'PNG', 176, 10, 22, 22);

  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  const leftLines = kopKiriText.split('\n');
  let yKop = 13;
  leftLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 4.5;
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rightLines = kopKananText.split('\n');
  rightLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 3.8;
  });

  // Double Divider Lines
  const lineY = Math.max(yKop + 2, 35);
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59);
  doc.line(12, lineY, 198, lineY);

  doc.setLineWidth(0.2);
  doc.setDrawColor(100, 116, 139);
  doc.line(12, lineY + 1.2, 198, lineY + 1.2);

  // Determine Dynamic Title based on Leave Type / Category
  const isSementara = leave.type === 'Sementara' || leave.type === 'Pesiar' || leave.type === 'Izin Keluar' || leave.category === 'Izin Keluar Sementara' || leave.category === 'Izin Keluar / Pesiar' || leave.category === 'Izin Keluar';
  const isMedical = leave.type === 'Berobat' || leave.category === 'Izin Berobat';
  const isTask = leave.type === 'Tugas' || leave.category === 'Izin Tugas / Delegasi';

  let titleHeader = "SURAT IZIN KEPULANGAN SISWA";
  let titlePrefixFile = "Surat_Izin_Pulang";
  if (isSementara) {
    titleHeader = "SURAT IZIN KELUAR SEMENTARA SISWA";
    titlePrefixFile = "Surat_Izin_Keluar_Sementara";
  } else if (isMedical) {
    titleHeader = "SURAT IZIN KELUAR BEROBAT / MEDIS SISWA";
    titlePrefixFile = "Surat_Izin_Berobat";
  } else if (isTask) {
    titleHeader = "SURAT IZIN TUGAS / PERLOMBAAN SISWA";
    titlePrefixFile = "Surat_Izin_Tugas";
  }

  // Document Title & Letter Number
  const titleY = lineY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(titleHeader, 105, titleY, { align: "center" });

  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const letterNo =
    leave.letterNumber ||
    `0${leave.id.slice(-3)}/SR31-ASR/IZIN/${new Date().getFullYear()}`;
  doc.text(`Nomor: ${letterNo}`, 105, titleY + 5, { align: "center" });

  // Opening Paragraph
  let contentY = titleY + 12;
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const introText =
    "Yang bertanda tangan di bawah ini, Pengelola Keasramaan Sekolah Rakyat 31 Palembang, menerangkan dan memberikan izin kepada peserta didik berikut untuk keluar lingkungan sekolah:";
  const wrappedIntro = doc.splitTextToSize(introText, 184);
  doc.text(wrappedIntro, 13, contentY);
  contentY += wrappedIntro.length * 4 + 3;

  // Student & Leave Detail Table
  const leaveTimeStr = leave.leaveTime ? ` (Pukul ${leave.leaveTime} WIB)` : '';
  const returnTimeStr = leave.returnTime ? ` (Pukul ${leave.returnTime} WIB)` : '';
  const catDisplay = leave.category ? `${leave.category} - ${leave.type}` : leave.type;

  autoTable(doc, {
    body: [
      ["1. Nama Lengkap Peserta Didik", `: ${leave.studentName}`],
      ["2. Nomor Induk Siswa (NISN / ID)", `: ${leave.studentId}`],
      ["3. Jenjang Kelas & Gedung Asrama", `: ${student ? `Kelas ${student.class}  |  Asrama ${student.dorm}` : 'Siswa Terdaftar'}`],
      ["4. Wali Asuh Pendamping", `: ${leave.caretaker}`],
      ["5. Kategori & Jenis Perizinan", `: ${catDisplay}`],
      ["6. Keperluan / Alasan Izin", `: ${leave.reason}`],
      ["7. Alamat / Lokasi Tujuan", `: ${leave.destinationAddress || 'Alamat Domisili Orang Tua / Keluarga'}`],
      ["8. No. Kontak HP Ortu / Wali", `: ${leave.parentContact || 'Terdaftar di Buku Induk Siswa'}`],
      ["9. Penjemput / Pendamping Izin", `: ${leave.pickupPerson || 'Orang Tua / Mandiri / Petugas'}`],
      ["10. Waktu Berangkat / Keluar", `: ${formatDateIndonesian(leave.leaveDate, true)}${leaveTimeStr}`],
      ["11. Batas Target Waktu Kembali", `: ${formatDateIndonesian(leave.returnDate, true)}${returnTimeStr}`]
    ],
    startY: contentY,
    theme: 'plain',
    styles: { fontSize: 8.3, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'normal' }
    },
    margin: { left: 14, right: 14 },
    pageBreak: 'avoid'
  });

  contentY = (doc as any).lastAutoTable.finalY + 5;

  // Box / Rules Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("KETENTUAN & TATA TERTIB DISIPLIN SELAMA MASA PERIZINAN:", 13, contentY);
  contentY += 4;

  const rules = [
    "1. Peserta didik wajib menjaga adab, sopan santun, akhlakul karimah, serta nama baik Sekolah Rakyat selama berada di luar asrama.",
    "2. Peserta didik wajib kembali ke asrama tepat waktu sesuai jadwal target batas waktu kembali yang telah disepakati.",
    "3. Apabila terjadi kendala mendesak atau perpanjangan izin karena sakit/darurat, Ortu/Wali WAJIB konfirmasi ke Wali Asuh / Wali Asrama.",
    "4. Saat keluar dan tiba kembali di asrama, peserta didik WAJIB melapor ke Pos Keamanan / Satpam Gerbang untuk verifikasi dan tanda tangan kartu saku."
  ];

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  rules.forEach((rule) => {
    const wrappedRule = doc.splitTextToSize(rule, 184);
    doc.text(wrappedRule, 13, contentY);
    contentY += wrappedRule.length * 3.4 + 0.8;
  });

  contentY += 4;

  // Closing sentence
  const closingText =
    "Demikian Surat Izin Keluar ini diterbitkan secara sah dan resmi untuk dapat dipergunakan sebagaimana mestinya.";
  const wrappedClosing = doc.splitTextToSize(closingText, 184);
  doc.text(wrappedClosing, 13, contentY);
  contentY += wrappedClosing.length * 3.5 + 5;

  // QR Code Verification Generator
  const qrPayload = `VALIDASI RESMI SEKOLAH RAKYAT 31 PALEMBANG\nDokumen: Surat Izin Keluar/Pulang\nNomor: ${letterNo}\nNama: ${leave.studentName} (${leave.studentId})\nKategori: ${catDisplay}\nAlasan: ${leave.reason}\nWaktu Keluar: ${leave.leaveDate} ${leave.leaveTime || ''}\nBatas Kembali: ${leave.returnDate} ${leave.returnTime || ''}\nStatus: Disetujui & Terdaftar`;
  
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 120,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
  }

  // Ensure contentY leaves enough space for signature block
  if (contentY > 224) {
    contentY = 224;
  }

  const sigY = contentY;

  // 3-Column Signature Block: Wali Asuh (Left) | Pos Keamanan/Satpam (Middle) | Wali Asrama (Right)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Left: Wali Asuh
  doc.text("Menyetujui,", 18, sigY);
  doc.setFont("Helvetica", "bold");
  doc.text("Wali Asuh Pendamping,", 18, sigY + 4);

  const leftNameY = sigY + 25;
  doc.text(`( ${leave.caretaker} )`, 18, leftNameY);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NIP/NIK. ${leave.caretakerNip || '.........................'}`,
    18,
    leftNameY + 3.8
  );

  // Middle: Pos Keamanan / Satpam Gerbang & QR
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Pemeriksaan Gerbang,", 88, sigY, { align: "center" });
  doc.setFont("Helvetica", "bold");
  doc.text("Pos Keamanan / Satpam,", 88, sigY + 4, { align: "center" });

  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', 77, sigY + 7, 22, 22);
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("( Paraf Petugas Gerbang )", 88, leftNameY, { align: "center" });
  doc.text("Keluar: [  ]  |  Kembali: [  ]", 88, leftNameY + 3.8, { align: "center" });

  // Right: Wali Asrama Mandiri
  const dateStr = formatDateIndonesian(leave.leaveDate || new Date());
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Palembang, ${dateStr}`, 140, sigY);
  doc.text("Mengetahui & Mengesahkan,", 140, sigY + 4);
  doc.setFont("Helvetica", "bold");
  const waliTitle = config?.waliAsramaTitle ? `${config.waliAsramaTitle},` : "Wali Asrama Mandiri,";
  doc.text(waliTitle, 140, sigY + 8);

  const dormMasterName =
    leave.dormMaster || config?.waliAsrama || 'Wali Asrama Mandiri';
  const dormMasterNip =
    leave.dormMasterNip || config?.waliAsramaNip || '.........................';

  doc.text(`( ${dormMasterName} )`, 140, leftNameY);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${dormMasterNip}`, 140, leftNameY + 3.8);

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen Surat Izin Resmi Sekolah Rakyat 31 Palembang - Verifikasi Otomatis Terhubung Database Asrama`,
    105,
    286,
    { align: "center" }
  );

  doc.save(`${titlePrefixFile}_${leave.studentName.replace(/\s+/g, '_')}_${leave.leaveDate}.pdf`);
}

// --- 2B. REKAPITULASI SURAT IZIN KELUAR & KEPULANGAN ASRAMA (LANDSCAPE A4) ---
export async function generateLeaveRecapReportPDF(
  leaves: Leave[],
  students: Student[],
  config: AppConfig,
  filterInfo: {
    categoryFilter?: string;
    typeFilter?: string;
    statusFilter?: string;
    dateFilter?: string;
    officerName?: string;
  }
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = 297;
  const pageHeight = 210;

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.06
  );

  // Helper Header in Landscape
  const drawKopSuratHeader = (startY: number = 10): number => {
    if (leftLogoBase64) {
      doc.addImage(leftLogoBase64, 'PNG', 15, startY, 20, 20);
    }
    if (rightLogoBase64) {
      doc.addImage(rightLogoBase64, 'PNG', pageWidth - 35, startY, 20, 20);
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);

    const leftLines = (config?.kopKiri || 'SEKOLAH RAKYAT TERPADU 31 PALEMBANG').split('\n');
    let y = startY + 3;
    leftLines.forEach((l) => {
      doc.text(l.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 4.5;
    });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const rightLines = (config?.kopKanan || 'Sekretariat Keasramaan & Tata Tertib Siswa').split('\n');
    rightLines.forEach((l) => {
      doc.text(l, pageWidth / 2, y, { align: 'center' });
      y += 3.8;
    });

    y = Math.max(y + 1, startY + 23);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.line(15, y, pageWidth - 15, y);

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(15, y + 1.2, pageWidth - 15, y + 1.2);

    return y + 6;
  };

  const startContentY = drawKopSuratHeader(10);

  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI SURAT IZIN KELUAR & KEPULANGAN SISWA', pageWidth / 2, startContentY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Kategori: ${filterInfo.categoryFilter || 'Semua Izin'}   |   Tipe: ${filterInfo.typeFilter || 'Semua'}   |   Status: ${filterInfo.statusFilter || 'Semua'}   |   Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth / 2,
    startContentY + 4.5,
    { align: 'center' }
  );

  // Summary statistics box
  const totalCount = leaves.length;
  const activeCount = leaves.filter((l) => l.status === 'Active').length;
  const returnedCount = leaves.filter((l) => l.status === 'Returned').length;
  const sementaraCount = leaves.filter((l) => l.type === 'Sementara' || l.type === 'Pesiar' || l.type === 'Izin Keluar' || l.category === 'Izin Keluar Sementara' || l.category === 'Izin Keluar / Pesiar' || l.category === 'Izin Keluar').length;
  const pulangCount = leaves.filter((l) => l.type === 'Reguler' || l.type === 'Khusus' || l.type === 'Darurat' || l.category === 'Izin Pulang / Bermalam').length;

  const statBoxY = startContentY + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, statBoxY, pageWidth - 30, 9, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, statBoxY, pageWidth - 30, 9, 2, 2, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `TOTAL SURAT IZIN: ${totalCount} Dokumen  |  SEDANG DI LUAR (ACTIVE): ${activeCount} Siswa  |  SUDAH KEMBALI: ${returnedCount} Siswa  |  IZIN SEMENTARA: ${sementaraCount}  |  PULANG BERMALAM: ${pulangCount}`,
    pageWidth / 2,
    statBoxY + 5.8,
    { align: 'center' }
  );

  // Data Table
  const tableBody = leaves.map((l, idx) => {
    const s = students.find((st) => String(st.id) === String(l.studentId));
    const dormStr = s ? `Kelas ${s.class} (${s.dorm})` : '-';
    const timeOut = `${formatDateShort(l.leaveDate)}${l.leaveTime ? ` ${l.leaveTime}` : ''}`;
    const timeBack = `${formatDateShort(l.returnDate)}${l.returnTime ? ` ${l.returnTime}` : ''}`;
    return [
      idx + 1,
      l.letterNumber || `0${l.id.slice(-3)}/IZIN`,
      l.studentId,
      l.studentName,
      dormStr,
      l.category || l.type,
      l.reason,
      l.destinationAddress || 'Alamat Keluarga',
      timeOut,
      timeBack,
      l.status === 'Active' ? 'Sedang Keluar' : 'Sudah Kembali',
      l.caretaker
    ];
  });

  autoTable(doc, {
    head: [
      [
        'No',
        'No. Surat',
        'NISN',
        'Nama Siswa',
        'Kelas / Asrama',
        'Kategori Izin',
        'Alasan / Keperluan',
        'Tujuan',
        'Waktu Keluar',
        'Batas Kembali',
        'Status',
        'Wali Asuh'
      ]
    ],
    body: tableBody,
    startY: statBoxY + 13,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 22 },
      5: { cellWidth: 24, fontStyle: 'bold' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 26 },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 22, halign: 'center' },
      10: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      11: { cellWidth: 26 }
    },
    margin: { left: 15, right: 15, top: 20, bottom: 25 },
    didDrawPage: function () {
      if (watermarkBase64) {
        doc.addImage(watermarkBase64, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100);
      }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  // Signature row in Landscape
  const sigRowY = currentY;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const dateNowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Palembang, ${dateNowStr}`, pageWidth - 75, sigRowY);

  doc.text('Mengetahui,', 25, sigRowY);
  doc.text(config?.waliAsramaTitle || 'Wali Asrama Mandiri,', 25, sigRowY + 4);

  doc.text('Petugas Pos Keamanan / Satpam,', pageWidth / 2 - 25, sigRowY + 4);
  doc.text('Kepala Sekolah Rakyat,', pageWidth - 75, sigRowY + 4);

  const nameY = sigRowY + 24;
  doc.setFont('Helvetica', 'bold');
  doc.text(`( ${config?.waliAsrama || 'Wali Asrama Mandiri'} )`, 25, nameY);
  doc.text(`( ........................................ )`, pageWidth / 2 - 25, nameY);
  doc.text(`( ${config?.kepalaSekolah || 'Kepala Sekolah Rakyat'} )`, pageWidth - 75, nameY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  if (config?.waliAsramaNip) {
    doc.text(`NIP. ${config.waliAsramaNip}`, 25, nameY + 3.8);
  }
  doc.text(`Petugas Keamanan Gerbang`, pageWidth / 2 - 25, nameY + 3.8);
  if (config?.kepalaSekolahNip) {
    doc.text(`NIP. ${config.kepalaSekolahNip}`, pageWidth - 75, nameY + 3.8);
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Informasi Keasramaan Sekolah Rakyat 31 Palembang - Rekapitulasi Izin Keluar & Kepulangan Siswa`,
      15,
      pageHeight - 8
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  doc.save(`Rekapitulasi_Izin_Keluar_Asrama_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --- 3. RAPOR KEASRAMAAN PDF ---
export async function printReportCardPDF(
  student: Student,
  repData: ReportCardData,
  violations: Violation[],
  config: AppConfig,
  counseling: Counseling[] = [],
  medicalRecords: MedicalRecord[] = []
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity);

  const customCaretakerName = repData.customCaretaker || student.caretaker || "";
  const customCaretakerNip = repData.customCaretakerNip || "";
  const customWaliAsramaName = repData.customWaliAsrama || config.waliAsrama || "";
  const customWaliAsramaNip = repData.customWaliAsramaNip || config.waliAsramaNip || "";
  const displaySemester = repData.semester || config.semester || "Genap";
  const displayAcademicYear = repData.academicYear || config.academicYear || "2025/2026";

  function drawReportHeaderPage1() {
    const kopKiriLines = config.kopKiri.split('\n');
    const kopKananLines = config.kopKanan.split('\n').filter((l) => l.toUpperCase() !== "EVALUASI PERKEMBANGAN KEASRAMAAN");

    doc.setTextColor(30, 41, 59);
    let startY = 15;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    if (kopKiriLines.length > 0) {
      doc.text(kopKiriLines[0] || "", 105, startY, { align: "center" });
      startY += 4.5;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    for (let i = 1; i < kopKiriLines.length; i++) {
      doc.text(kopKiriLines[i] || "", 105, startY, { align: "center" });
      startY += 4;
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    if (kopKananLines.length > 0) {
      doc.text(kopKananLines[0] || "", 105, startY, { align: "center" });
      startY += 4;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    for (let i = 1; i < kopKananLines.length; i++) {
      doc.text(kopKananLines[i] || "", 105, startY, { align: "center" });
      startY += 3.5;
    }

    doc.addImage(leftLogoBase64, 'PNG', 15, 12, 18, 18);
    doc.addImage(rightLogoBase64, 'PNG', 177, 12, 18, 18);

    const lineY = startY + 2;
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(15, lineY, 195, lineY);
    doc.setLineWidth(0.15);
    doc.line(15, lineY + 1, 195, lineY + 1);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RAPOR EVALUASI PERKEMBANGAN ANAK", 105, lineY + 6, { align: "center" });

    const metaY = lineY + 14;
    doc.setFontSize(8.5);
    doc.setFont("Helvetica", "bold"); doc.text("Nama Sekolah", 15, metaY);
    doc.setFont("Helvetica", "normal"); doc.text(`: Sekolah Rakyat Terintegrasi 31 Palembang`, 42, metaY);
    doc.setFont("Helvetica", "bold"); doc.text("Alamat", 15, metaY + 5);
    doc.setFont("Helvetica", "normal"); doc.text(`: Jl. Komp Sosial Km 5 Sukabangun`, 42, metaY + 5);
    doc.setFont("Helvetica", "bold"); doc.text("Tahun Ajaran / Sem.", 15, metaY + 10);
    doc.setFont("Helvetica", "normal"); doc.text(`: Semester ${displaySemester} (${displayAcademicYear})`, 48, metaY + 10);

    doc.setFont("Helvetica", "bold"); doc.text("Nama Peserta Didik", 115, metaY);
    doc.setFont("Helvetica", "normal"); doc.text(`: ${student.name}`, 148, metaY);
    doc.setFont("Helvetica", "bold"); doc.text("Kelas", 115, metaY + 5);
    doc.setFont("Helvetica", "normal"); doc.text(`: ${student.class}`, 148, metaY + 5);
    doc.setFont("Helvetica", "bold"); doc.text("Wali Asuh", 115, metaY + 10);
    doc.setFont("Helvetica", "normal"); doc.text(`: ${customCaretakerName}`, 148, metaY + 10);

    doc.setLineWidth(0.3);
    doc.line(15, metaY + 14, 195, metaY + 14);
    return metaY + 18;
  }

  const startTableY = drawReportHeaderPage1();

  const activeRaporStructure = config.raporStructureCustom && config.raporStructureCustom.length > 0
    ? config.raporStructureCustom
    : RAPOR_STRUCTURE;

  const tableRows: any[] = [];
  activeRaporStructure.forEach((cat) => {
    tableRows.push([
      {
        content: cat.name,
        colSpan: 4,
        styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', cellPadding: 2 }
      }
    ]);
    cat.indicators.forEach((ind, idx) => {
      tableRows.push([
        (idx + 1).toString(),
        ind,
        repData.grades[`${cat.key}_${idx}`] || "",
        repData.descriptions[`${cat.key}_${idx}`] || ""
      ]);
    });
  });

  autoTable(doc, {
    head: [["No", "Indikator Evaluasi Perkembangan", "Predikat", "Deskripsi Perkembangan"]],
    body: tableRows,
    startY: startTableY,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 'auto' }
    },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    margin: { left: 15, right: 15, top: 22, bottom: 25 }
  });

  // Filter student-specific records across modules
  const sId = String(student.id).trim().toLowerCase();
  const sName = student.name ? student.name.trim().toLowerCase() : '';

  const studentCounseling = (counseling || []).filter((c) => {
    const cId = c.studentId ? String(c.studentId).trim().toLowerCase() : '';
    const cName = c.studentName ? c.studentName.trim().toLowerCase() : '';
    return (cId && cId === sId) || (sName && cName && cName === sName);
  });

  const studentMedical = (medicalRecords || []).filter((m) => {
    const mId = m.studentId ? String(m.studentId).trim().toLowerCase() : '';
    const mName = m.studentName ? m.studentName.trim().toLowerCase() : '';
    return (mId && mId === sId) || (sName && mName && mName === sName);
  });

  doc.addPage();
  let finalY = 20;

  // --- SECTION 1: EVALUASI RIWAYAT KEDISIPLINAN & PELANGGARAN ASRAMA ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("EVALUASI RIWAYAT KEDISIPLINAN & PELANGGARAN ASRAMA", 15, finalY);
  doc.setLineWidth(0.2);
  doc.line(15, finalY + 2, 195, finalY + 2);

  // Calculate Discipline Score & Filtered Violations for current semester
  const discInfo = calculateStudentDisciplineScore(student.id, violations, config, displaySemester as any, displayAcademicYear, student.name);
  const studentViolations = discInfo.filteredViolations;

  // Render Discipline Score Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, finalY + 5, 180, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, finalY + 5, 180, 12, 'S');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`SKOR POIN KEDISIPLINAN (SEM. ${displaySemester.toUpperCase()} ${displayAcademicYear}): ${discInfo.score} / 100 POIN`, 18, finalY + 12);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(185, 28, 28);
  doc.text(`STATUS: ${discInfo.status.label.toUpperCase()} (PENGURANGAN: -${discInfo.totalDeducted} POIN)`, 192, finalY + 12, { align: 'right' });

  finalY += 20;

  if (studentViolations.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text("Catatan Bersih: Anak asuh terpuji, mempertahankan 100 Poin utuh tanpa pelanggaran pada semester ini.", 15, finalY);
    finalY += 12;
  } else {
    const violationBody = studentViolations.map((v, i) => [
      (i + 1).toString(),
      formatDateIndonesian(v.date),
      `Tingkat ${v.level}`,
      v.violation,
      v.note || '-',
      v.sanction
    ]);
    autoTable(doc, {
      head: [["No", "Tanggal", "Tingkat", "Bentuk Pelanggaran", "Keterangan Kronologi", "Rekomendasi Sanksi"]],
      body: violationBody,
      startY: finalY,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      margin: { left: 15, right: 15 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- SECTION 2: RIWAYAT PENDAMPINGAN & KONSELING BK ---
  if (repData.includeCounseling !== false) {
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("RIWAYAT PENDAMPINGAN & KONSELING BK", 15, finalY);
    doc.setLineWidth(0.2);
    doc.line(15, finalY + 2, 195, finalY + 2);
    finalY += 6;

    if (studentCounseling.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129);
      doc.text("Catatan Terpuji: Anak asuh stabil, belum ada/tidak membutuhkan pendampingan konseling khusus pada semester ini.", 15, finalY);
      finalY += 12;
    } else {
      const counselingBody = studentCounseling.map((c, i) => [
        (i + 1).toString(),
        formatDateIndonesian(c.date),
        c.counselor,
        c.caseDescription,
        c.notes || c.followUp || '-',
        c.status
      ]);
      autoTable(doc, {
        head: [["No", "Tanggal", "Konselor", "Deskripsi Bimbingan / Kasus", "Catatan Hasil & Tindak Lanjut", "Status"]],
        body: counselingBody,
        startY: finalY,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        margin: { left: 15, right: 15 }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // --- SECTION 3: CATATAN PERKEMBANGAN KESEHATAN (UKS) ---
  if (repData.includeMedical !== false) {
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("CATATAN PERKEMBANGAN KESEHATAN (UKS)", 15, finalY);
    doc.setLineWidth(0.2);
    doc.line(15, finalY + 2, 195, finalY + 2);
    finalY += 6;

    if (studentMedical.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129);
      doc.text("Catatan Sehat: Kondisi fisik dan kesehatan anak asuh prima sepanjang semester ini.", 15, finalY);
      finalY += 12;
    } else {
      const medicalBody = studentMedical.map((m, i) => [
        (i + 1).toString(),
        formatDateIndonesian(m.date),
        m.symptoms || m.diagnosis || '-',
        m.treatment || m.notes || '-',
        m.status
      ]);
      autoTable(doc, {
        head: [["No", "Tanggal", "Keluhan / Diagnosa", "Tindakan / Penanganan UKS", "Status Kesehatan"]],
        body: medicalBody,
        startY: finalY,
        theme: 'striped',
        headStyles: { fillColor: [6, 95, 70], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        margin: { left: 15, right: 15 }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // --- SECTION 4: KETERANGAN PREDIKAT EVALUASI ---
  if (finalY > 215) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("KETERANGAN PREDIKAT EVALUASI", 15, finalY);
  doc.setLineWidth(0.2);
  doc.line(15, finalY + 2, 195, finalY + 2);

  const legendBody = [
    ["SB", "86 - 100", "Sangat Baik"],
    ["B", "76 - 85", "Baik"],
    ["C", "60 - 75", "Cukup"],
    ["PB", "< 60", "Perlu Bimbingan"]
  ];
  autoTable(doc, {
    head: [["Predikat", "Rentang Nilai", "Keterangan Evaluasi Perkembangan"]],
    body: legendBody,
    startY: finalY + 4,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 'auto' }
    },
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    margin: { left: 15, right: 15 }
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- SECTION 5: CATATAN KHUSUS PERKEMBANGAN WALI ASUH ---
  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("CATATAN KHUSUS PERKEMBANGAN WALI ASUH", 15, finalY);
  doc.line(15, finalY + 2, 195, finalY + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  const specialNote = repData.specialNote || "Tidak ada catatan khusus perkembangan.";
  const wrappedNotes = doc.splitTextToSize(specialNote, 175);
  doc.text(wrappedNotes, 15, finalY + 8);

  const noteLinesCount = Array.isArray(wrappedNotes) ? wrappedNotes.length : 1;
  finalY += 8 + (noteLinesCount * 4.5) + 12;

  // --- SECTION 6: LEMBAR PENGESAHAN / TANDA TANGAN ---
  if (finalY > 210) {
    doc.addPage();
    finalY = 20;
  }

  const sigY = finalY;
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(`Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, sigY);
  doc.text("Mengetahui / Menyetujui:", 15, sigY + 5);
  doc.text("Wali Asuh,", 15, sigY + 11);
  doc.text(`${config?.waliAsramaTitle || "Wali Asrama"},`, 140, sigY + 11);

  doc.setFont("Helvetica", "bold");
  doc.text(`( ${customCaretakerName} )`, 15, sigY + 24);
  doc.text(`( ${customWaliAsramaName} )`, 140, sigY + 24);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  if (customCaretakerNip) doc.text(`NIP. ${customCaretakerNip}`, 15, sigY + 28);
  if (customWaliAsramaNip) {
    const nipFormatted = customWaliAsramaNip.startsWith('NIP') ? customWaliAsramaNip : `NIP. ${customWaliAsramaNip}`;
    doc.text(nipFormatted, 140, sigY + 28);
  }

  const sigY2 = sigY + 40;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Orang Tua / Wali Murid,", 15, sigY2);
  doc.text("Kepala Sekolah Rakyat,", 140, sigY2);
  doc.setFont("Helvetica", "bold");
  doc.text("( __________________________ )", 15, sigY2 + 24);
  doc.text(`( ${config.kepalaSekolah} )`, 140, sigY2 + 24);
  if (config.kepalaSekolahNip) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`NIP. ${config.kepalaSekolahNip}`, 140, sigY2 + 28);
  }

  // Draw Header/Footer & Watermark across ALL generated pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
    }
    if (p > 1) {
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Rapor Keasramaan: ${student.name} (${student.id})`, 15, 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 14, 195, 14);
    }
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Rapor Keasramaan SRT31 Palembang - Semester ${displaySemester} TA ${displayAcademicYear}`, 15, 287);
    doc.text(`Halaman ${p} dari ${totalPages}`, 195, 287, { align: "right" });
  }

  doc.save(`Rapor_Keasramaan_${student.name.replace(/\s+/g, '_')}.pdf`);
}

export interface ComprehensiveSignatory {
  caretakerTitle?: string;
  caretakerName?: string;
  caretakerNip?: string;
  headTitle?: string;
  headName?: string;
  headNip?: string;
}

// --- 4. REKAPITULASI COMPREHENSIVE MULTIPAGE PDF ---
export async function generateComprehensivePDF(
  students: Student[],
  violations: Violation[],
  counseling: Counseling[],
  leaves: Leave[],
  config: AppConfig,
  medicalRecords: MedicalRecord[] = [],
  signatory?: ComprehensiveSignatory
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const periodText = `TAHUN AJARAN 2025/2026 - PERIODE REKAPITULASI: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

  doc.setFillColor(51, 65, 85);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(71, 85, 105);
  doc.rect(0, 110, 210, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text("KEMENTERIAN SOSIAL REPUBLIK INDONESIA", 105, 70, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.text("SEKRETARIAT JENDERAL", 105, 77, { align: "center" });
  doc.text("PUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI", 105, 83, { align: "center" });

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BUKU PINTAR DISIPLIN & KESEHATAN SISWA", 105, 140, { align: "center" });
  doc.setFontSize(12);
  doc.text("REKAPITULASI PELANGGARAN, KONSELING, IZIN & REKAM MEDIS UKS", 105, 148, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(periodText, 105, 210, { align: "center" });
  doc.text("Komite Tata Tertib, BK & Tim Kesehatan UKS Sekolah Rakyat", 105, 216, { align: "center" });
  doc.setFontSize(9);
  doc.text("Cerdas Bersama, Tumbuh Setara", 105, 270, { align: "center" });

  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity);

  function drawSectionHeader(title: string) {
    doc.setFillColor(71, 85, 105);
    doc.rect(15, 10, 180, 0.5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("KEMENTERIAN SOSIAL RI - SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG", 15, 8);
    doc.setFontSize(11);
    doc.text(title, 15, 23);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 15, 28);
  }

  function drawFooter(pageNum: number) {
    doc.setFillColor(226, 232, 240);
    doc.rect(15, 280, 180, 0.2, 'F');
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan Resmi Komite Disiplin & Kesehatan Sekolah Rakyat", 15, 285);
    doc.text(`Halaman ${pageNum}`, 195, 285, { align: "right" });
  }

  // Section 1: Pelanggaran
  doc.addPage();
  if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
  drawSectionHeader("BAGIAN I: HISTORIS PELANGGARAN SISWA");
  const violationRows = violations.map((v) => [
    formatDateIndonesian(v.date, false),
    v.studentName || "",
    `Tingkat ${v.level}`,
    v.violation,
    v.note || '-',
    v.sanction
  ]);

  autoTable(doc, {
    head: [["Tanggal", "Nama Siswa", "Tingkat", "Bentuk Pelanggaran", "Catatan Kronologi", "Rekomendasi Sanksi"]],
    body: violationRows,
    startY: 32,
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28] },
    styles: { fontSize: 8, cellPadding: 2.5 },
    didDrawPage: function (data) {
      if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
      drawFooter(data.pageNumber);
    }
  });

  // Section 2: Konseling BK
  doc.addPage();
  if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
  drawSectionHeader("BAGIAN II: CATATAN BIMBINGAN KONSELING (BK)");
  const counselingRows = counseling.map((c) => [
    formatDateIndonesian(c.date, false),
    c.studentName || "",
    c.caseDescription,
    c.notes,
    c.status
  ]);

  autoTable(doc, {
    head: [["Tanggal Sesi", "Nama Siswa", "Permasalahan", "Hasil Sesi Konseling", "Status"]],
    body: counselingRows,
    startY: 32,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8, cellPadding: 2.5 },
    didDrawPage: function (data) {
      if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
      drawFooter(data.pageNumber);
    }
  });

  // Section 3: Surat Jalan / Izin
  doc.addPage();
  if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
  drawSectionHeader("BAGIAN III: REKAP SURAT JALAN / IZIN KEPULANGAN");
  const leaveRows = leaves.map((l) => [
    l.studentName || "",
    l.type,
    l.reason,
    formatDateIndonesian(l.leaveDate, false),
    formatDateIndonesian(l.returnDate, false),
    l.status
  ]);

  autoTable(doc, {
    head: [["Nama Siswa", "Tipe Izin", "Alasan Kepulangan", "Tgl Pergi", "Tgl Kembali", "Status"]],
    body: leaveRows,
    startY: 32,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8, cellPadding: 2.5 },
    didDrawPage: function (data) {
      if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
      drawFooter(data.pageNumber);
    }
  });

  // Section 4: Rekam Medis / Kesehatan UKS
  if (medicalRecords && medicalRecords.length > 0) {
    doc.addPage();
    if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
    drawSectionHeader("BAGIAN IV: REKAPITULASI REKAM MEDIS & KESEHATAN (UKS)");
    const medicalRows = medicalRecords.map((m) => [
      `${m.date || ''} ${m.time || ''}`.trim(),
      m.studentName || '',
      m.location || 'Klinik UKS',
      `${m.symptoms || '-'}\nDiagnosa: ${m.diagnosis || '-'}`,
      m.treatment || '-',
      m.officer || '-',
      m.status || '-'
    ]);

    autoTable(doc, {
      head: [["Tgl & Jam", "Nama Siswa", "Lokasi", "Gejala & Diagnosa", "Tindakan / Obat", "Petugas", "Status"]],
      body: medicalRows,
      startY: 32,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 8, cellPadding: 2.5 },
      didDrawPage: function (data) {
        if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
        drawFooter(data.pageNumber);
      }
    });
  }

  let finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY > 210) {
    doc.addPage();
    if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
    finalY = 30;
  }

  const cTitle = signatory?.caretakerTitle || config?.waliAsramaTitle || "Wali Asrama Mandiri";
  const cName = signatory?.caretakerName || config.waliAsrama || "Wali Asrama";
  const cNip = signatory?.caretakerNip !== undefined ? signatory.caretakerNip : config.waliAsramaNip;

  const hTitle = signatory?.headTitle || "Kepala Sekolah Rakyat,";
  const hName = signatory?.headName || config.kepalaSekolah || "Kepala Sekolah";
  const hNip = signatory?.headNip !== undefined ? signatory.headNip : config.kepalaSekolahNip;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, finalY);
  doc.text("Mengetahui,", 35, finalY + 8);
  doc.text(cTitle, 35, finalY + 14);
  doc.text(hTitle, 140, finalY + 14);

  doc.setFont("Helvetica", "bold");
  doc.text(cName, 35, finalY + 38);
  doc.text(hName, 140, finalY + 38);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (cNip) doc.text(cNip.startsWith('NIP') ? cNip : `NIP. ${cNip}`, 35, finalY + 43);
  if (hNip) doc.text(hNip.startsWith('NIP') ? hNip : `NIP. ${hNip}`, 140, finalY + 43);

  doc.save("LAPORAN_KOMPREHENSIF_SEKOLAH_RAKYAT.pdf");
}

// --- 6. SURAT PEMBERITAHUAN PELANGGARAN KEPADA ORANG TUA (MULTIPAGE SUPPORT) ---
export async function generateViolationNoticePDF(
  violation: Violation,
  student: Student | undefined,
  config: AppConfig
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin;
  const maxBodyY = pageHeight - 20;

  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity || 0.04);

  // Watermark on Page 1
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 55, 95, 100, 100);
  }

  const docNum = `Nomor: ${violation.id.toUpperCase()}/SRT31/DISIPLIN/${new Date().getFullYear()}`;
  let currentPageNum = 1;
  function addNewA4Page(sectionTitle = "Surat Pemberitahuan Pelanggaran") {
    doc.addPage('a4', 'p');
    currentPageNum++;
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 55, 95, 100, 100);
    }
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sectionTitle} - ${violation.studentName} (${docNum})`, leftMargin, 14);
    doc.text(`[Lanjutan Halaman ${currentPageNum}]`, rightX, 14, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(leftMargin, 17, rightX, 17);
    return 24;
  }

  // Header Kop
  doc.setTextColor(30, 41, 59);
  let startY = 14;
  const kopKiriLines = config.kopKiri.split('\n');
  const kopKananLines = config.kopKanan.split('\n');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  if (kopKiriLines.length > 0) {
    doc.text(kopKiriLines[0] || "SEKOLAH RAKYAT TERPADU 31 PALEMBANG", 105, startY, { align: "center" });
    startY += 4.5;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  for (let i = 1; i < kopKiriLines.length; i++) {
    doc.text(kopKiriLines[i] || "", 105, startY, { align: "center" });
    startY += 4;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  if (kopKananLines.length > 0) {
    doc.text(kopKananLines[0] || "", 105, startY, { align: "center" });
    startY += 4;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  for (let i = 1; i < kopKananLines.length; i++) {
    doc.text(kopKananLines[i] || "", 105, startY, { align: "center" });
    startY += 3.5;
  }

  doc.addImage(leftLogoBase64, 'PNG', 15, 11, 20, 20);
  doc.addImage(rightLogoBase64, 'PNG', 175, 11, 20, 20);

  const lineY = startY + 2;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(15, lineY, 195, lineY);
  doc.setLineWidth(0.15);
  doc.line(15, lineY + 1, 195, lineY + 1);

  // Document Title & Number
  const titleY = lineY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text("SURAT PEMBERITAHUAN PELANGGARAN KEPADA ORANG TUA / WALI", 105, titleY, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(docNum, 105, titleY + 5, { align: "center" });

  // Recipient & Intro
  let contentY = titleY + 13;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Kepada Yth.", 15, contentY);
  doc.setFont("Helvetica", "bold");
  doc.text("Bapak / Ibu Orang Tua / Wali Siswa", 15, contentY + 4.5);
  doc.setFont("Helvetica", "normal");
  doc.text("di Tempat", 15, contentY + 9);

  contentY += 16;
  doc.text("Dengan hormat,", 15, contentY);
  contentY += 5;

  const introText = "Melalui surat ini, kami memberitahukan bahwa berdasarkan catatan ketertiban dan disiplin Keasramaan Sekolah Rakyat Terpadu 31 Palembang, peserta didik di bawah ini:";
  const wrappedIntro = doc.splitTextToSize(introText, 180);
  doc.text(wrappedIntro, 15, contentY);
  contentY += wrappedIntro.length * 4.5 + 3;

  // Student Info Table
  autoTable(doc, {
    body: [
      ["Nama Peserta Didik", `: ${violation.studentName}`],
      ["NISN / ID Siswa", `: ${violation.studentId}`],
      ["Kelas & Asrama", `: ${student ? `${student.class} - ${student.dorm}` : '-'}`],
      ["Wali Asuh Pendamping", `: ${student?.caretaker || violation.reporter}`]
    ],
    startY: contentY,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 5;

  doc.setFont("Helvetica", "normal");
  const statementText = "Telah melakukan tindakan pelanggaran terhadap Peraturan & Tata Tertib Keasramaan dengan rincian data laporan sebagai berikut:";
  const wrappedStatement = doc.splitTextToSize(statementText, 180);
  if (contentY + wrappedStatement.length * 4.5 > maxBodyY) {
    contentY = addNewA4Page();
  }
  doc.text(wrappedStatement, 15, contentY);
  contentY += wrappedStatement.length * 4.5 + 3;

  // Violation Details Table
  const formattedDate = formatDateIndonesian(violation.date, true);
  const proofInfo = violation.photo
    ? (violation.photo.startsWith('http://') || violation.photo.startsWith('https://')
        ? `Tautan Berkas Digital: ${violation.photo.length > 45 ? violation.photo.substring(0, 42) + '...' : violation.photo}`
        : 'Terlampir Dokumentasi Foto Fisik')
    : 'Tidak ada lampiran khusus';

  autoTable(doc, {
    head: [["RINCIAN LAPORAN PELANGGARAN", "KETERANGAN HASIL PENCATATAN"]],
    body: [
      ["Hari & Tanggal Pelanggaran", formattedDate],
      ["Kategori / Tingkat Pelanggaran", `Tingkat ${violation.level}`],
      ["Bentuk / Jenis Pelanggaran", violation.violation],
      ["Sanksi / Tindakan Disiplin", violation.sanction],
      ["Catatan Tambahan Asrama", violation.note || "Tidak ada catatan khusus."],
      ["Dokumen / Bukti Pendukung", proofInfo],
      ["Pelapor / Wali Asrama", violation.reporter]
    ],
    startY: contentY,
    theme: 'grid',
    headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 6;

  // Closing Paragraph
  const closingText = "Demikian surat pemberitahuan ini kami sampaikan. Besar harapan kami agar Bapak/Ibu Orang Tua/Wali dapat turut serta memberikan perhatian, bimbingan, serta kerja sama yang baik demi pembentukan karakter dan kebaikan peserta didik di masa mendatang. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.";
  const wrappedClosing = doc.splitTextToSize(closingText, 180);
  if (contentY + wrappedClosing.length * 4.5 + 40 > maxBodyY) {
    contentY = addNewA4Page();
  }
  doc.text(wrappedClosing, 15, contentY);
  contentY += wrappedClosing.length * 4.5 + 8;

  // Signatures Section
  const dateStr = formatDateIndonesian(violation.date || new Date().toISOString().split('T')[0], false);

  if (contentY + 38 > maxBodyY) {
    contentY = addNewA4Page("Tanda Tangan Pengesahan");
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Palembang, ${dateStr}`, 135, contentY);

  // Row 1 Signatures: Orang Tua/Wali & Tim Disiplin/Wali Asuh
  const row1Y = contentY + 5;
  doc.text("Mengetahui / Memahami,", 20, row1Y);
  doc.text("Orang Tua / Wali Siswa,", 20, row1Y + 4.5);

  doc.text("Tim Disiplin / Wali Asuh,", 135, row1Y);
  doc.text("Sekolah Rakyat 31 Palembang,", 135, row1Y + 4.5);

  // TTD Space (24mm)
  doc.setFont("Helvetica", "bold");
  doc.text("( .................................................... )", 20, row1Y + 28);
  doc.text(`( ${student?.caretaker || violation.reporter} )`, 135, row1Y + 28);

  // Draw Page Numbering on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Keasramaan Sekolah Rakyat 31 Palembang - Surat Pemberitahuan Resmi (${docNum})`,
      15,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, rightX, pageHeight - 6.5, { align: "right" });
  }

  doc.save(`Surat_Pemberitahuan_Pelanggaran_${violation.studentName.replace(/\s+/g, '_')}_${violation.date}.pdf`);
}

// --- 5B. CETAK REKAPITULASI RIWAYAT / HISTORIS PELANGGARAN SISWA PDF (RESMI) ---
export async function generateStudentViolationHistoryPDF(
  student: Student,
  studentViolations: Violation[],
  config: AppConfig
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.08
  );

  // Background Watermark
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 35, 80, 140, 140);
  }

  // Draw Kop Surat
  doc.addImage(leftLogoBase64, 'PNG', 12, 10, 22, 22);
  doc.addImage(rightLogoBase64, 'PNG', 176, 10, 22, 22);

  const kopKiriText =
    config?.kopKiri ||
    "KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nPUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI\nSEKOLAH RAKYAT 31 PALEMBANG";
  const kopKananText =
    config?.kopKanan ||
    "Jalan Seniman Amri Yahya, Jakabaring, Palembang\nTelepon: (0711) 510000 | Email: asrama@sekolahrakyat.sch.id\nLAMAN: www.sekolahrakyat.sch.id";

  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  const leftLines = kopKiriText.split('\n');
  let yKop = 13;
  leftLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 4.5;
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rightLines = kopKananText.split('\n');
  rightLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 3.8;
  });

  // Double Divider Line
  const lineY = Math.max(yKop + 2, 35);
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59);
  doc.line(12, lineY, 198, lineY);

  doc.setLineWidth(0.2);
  doc.setDrawColor(100, 116, 139);
  doc.line(12, lineY + 1.2, 198, lineY + 1.2);

  // Document Title
  const titleY = lineY + 9;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text("BUKU CATATAN HISTORIS PELANGGARAN & DISIPLIN SISWA", 105, titleY, { align: "center" });

  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const currentSemester = config?.semester || 'Genap';
  const currentYear = config?.academicYear || '2025/2026';
  doc.text(`Tahun Ajaran ${currentYear} • Semester ${currentSemester}`, 105, titleY + 5, { align: "center" });

  // Calculate student discipline score
  const discScore = calculateStudentDisciplineScore(
    student.id,
    studentViolations,
    config,
    config.semester || 'Genap',
    config.academicYear || '2025/2026',
    student.name
  );

  // Student Identity Box
  const contentY = titleY + 11;
  autoTable(doc, {
    head: [["BIODATA LENGKAP SISWA", "REKAP STATUS KETERTIBAN & DISIPLIN"]],
    body: [
      ["Nama Lengkap Siswa", `: ${student.name}`, "Total Kasus Pelanggaran", `: ${studentViolations.length} Kasus`],
      ["NISN / Nomor Induk", `: ${student.id}`, "Poin Akumulasi Pelanggaran", `: ${discScore.totalDeducted} Poin (Skor: ${discScore.score}/100)`],
      ["Jenjang / Kelas", `: Kelas ${student.class}`, "Predikat Ketertiban Siswa", `: ${discScore.status?.label || 'Sangat Baik'}`],
      ["Gedung Asrama", `: ${student.dorm}`, "Wali Asuh Pendamping", `: ${student.caretaker || '-'}`]
    ],
    startY: contentY,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 55 },
      2: { cellWidth: 48, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 'auto' }
    },
    margin: { left: 12, right: 12 }
  });

  const tableStartY = (doc as any).lastAutoTable.finalY + 6;

  // Chronological Violations Table
  let violationBody: any[] = [];
  if (studentViolations.length === 0) {
    violationBody = [
      ["1", "-", "Disiplin Baik", "Tidak ada catatan pelanggaran yang tercatat pada sistem.", "-", "-", "Wali Asrama"]
    ];
  } else {
    // Sort chronological: oldest to newest or newest to oldest
    const sorted = [...studentViolations].sort((a, b) => (a.date > b.date ? 1 : -1));
    violationBody = sorted.map((v, index) => {
      const formattedTgl = formatDateIndonesian(v.date, true);
      const proofText = v.photo ? (v.photo.startsWith('http') ? 'Lampiran Link' : 'Lampiran Foto') : '-';
      const catatanText = v.note ? `${v.note}${proofText !== '-' ? ` (${proofText})` : ''}` : proofText;

      return [
        index + 1,
        formattedTgl,
        `Tingkat ${v.level}`,
        v.violation,
        catatanText,
        v.sanction || '-',
        v.reporter || 'Wali Asrama'
      ];
    });
  }

  autoTable(doc, {
    head: [["No", "Hari & Tanggal Kejadian", "Tingkat", "Bentuk Pelanggaran", "Catatan Kronologi / Bukti", "Sanksi / Pembinaan", "Pelapor"]],
    body: violationBody,
    startY: tableStartY,
    theme: 'grid',
    headStyles: { fillColor: [185, 28, 28], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { cellWidth: 36 },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' }
    },
    margin: { left: 12, right: 12 },
    didDrawPage: function () {
      if (watermarkBase64) {
        doc.addImage(watermarkBase64, 'PNG', 35, 80, 140, 140);
      }
    }
  });

  // Signatures Section
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 45 > pageHeight - 15) {
    doc.addPage();
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 35, 80, 140, 140);
    }
    finalY = 20;
  }

  const todayStr = formatDateIndonesian(new Date().toISOString().split('T')[0], false);
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  doc.text(`Palembang, ${todayStr}`, 140, finalY);

  const sigY = finalY + 4.5;
  doc.text("Mengetahui,", 20, sigY);
  doc.text("Wali Asuh Pendamping,", 20, sigY + 4.5);

  doc.text("Komite Tata Tertib & Disiplin,", 80, sigY + 4.5);

  doc.text("Kepala Sekolah Rakyat,", 140, sigY + 4.5);

  // TTD Space (20mm)
  const namesY = sigY + 24;
  doc.setFont("Helvetica", "bold");
  doc.text(`( ${student.caretaker || 'Wali Asuh'} )`, 20, namesY);
  doc.text(`( ${config?.waliAsrama || 'Tim Disiplin Asrama'} )`, 80, namesY);
  doc.text(`( ${config?.kepalaSekolah || 'Kepala Sekolah'} )`, 140, namesY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  if (config?.waliAsramaNip) {
    const nip = config.waliAsramaNip.startsWith('NIP') ? config.waliAsramaNip : `NIP. ${config.waliAsramaNip}`;
    doc.text(nip, 80, namesY + 4);
  }
  if (config?.kepalaSekolahNip) {
    const nip = config.kepalaSekolahNip.startsWith('NIP') ? config.kepalaSekolahNip : `NIP. ${config.kepalaSekolahNip}`;
    doc.text(nip, 140, namesY + 4);
  }

  // Draw Page Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Buku Historis Pelanggaran & Disiplin: ${student.name} (${student.id}) - Sekolah Rakyat 31 Palembang`,
      12,
      pageHeight - 8
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
  }

  doc.save(`Historis_Pelanggaran_${student.name.replace(/\s+/g, '_')}_${student.id}.pdf`);
}

// --- 6. SURAT KETERANGAN IZIN SAKIT & REKAM MEDIS UKS PDF ---
export async function printSickLeavePDF(
  record: MedicalRecord,
  student?: Student,
  config?: AppConfig,
  overrideWaliAsrama?: string,
  overrideWaliAsramaNip?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  const kopKiriText =
    config?.kopKiri ||
    "PEMERINTAH PROVINSI SUMATERA SELATAN\nDINAS PENDIDIKAN\nSEKOLAH RAKYAT TERPADU 31 PALEMBANG";
  const kopKananText =
    config?.kopKanan ||
    "Jalan Seniman Amri Yahya, Jakabaring, Palembang\nTelepon: (0711) 510000 | Email: asrama@sekolahrakyat.sch.id\nLAMAN: www.sekolahrakyat.sch.id";

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.08
  );

  // Background Watermark
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 30, 70, 150, 150);
  }

  // Draw Kop Surat
  doc.addImage(leftLogoBase64, 'PNG', 12, 10, 22, 22);
  doc.addImage(rightLogoBase64, 'PNG', 176, 10, 22, 22);

  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  const leftLines = kopKiriText.split('\n');
  let yKop = 13;
  leftLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 4.5;
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rightLines = kopKananText.split('\n');
  rightLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 3.8;
  });

  // Double Divider Lines
  const lineY = Math.max(yKop + 2, 35);
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59);
  doc.line(12, lineY, 198, lineY);

  doc.setLineWidth(0.2);
  doc.setDrawColor(100, 116, 139);
  doc.line(12, lineY + 1.2, 198, lineY + 1.2);

  // Document Title & Letter Number
  const titleY = lineY + 9;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text("SURAT KETERANGAN IZIN SAKIT & REKAM MEDIS UKS", 105, titleY, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const yearStr = record.date ? new Date(record.date).getFullYear() : new Date().getFullYear();
  const letterNo = `${record.id.slice(-4)}/UKS-SR31/${yearStr}`;
  doc.text(`Nomor: ${letterNo}`, 105, titleY + 5.5, { align: "center" });

  // Opening Paragraph
  let contentY = titleY + 14;
  const pageHeight = 297;
  const pageWidth = 210;
  const maxBodyY = pageHeight - 20;
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin;

  let currentPageNum = 1;
  function addNewUKSPage(sectionTitle = "Surat Keterangan Izin Sakit UKS") {
    doc.addPage('a4', 'p');
    currentPageNum++;
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 30, 70, 150, 150);
    }
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sectionTitle} - ${record.studentName} (${letterNo})`, leftMargin, 14);
    doc.text(`[Lanjutan Halaman ${currentPageNum}]`, rightX, 14, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(leftMargin, 17, rightX, 17);
    return 24;
  }

  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const introText =
    "Yang bertanda tangan di bawah ini, Tim Layanan Kesehatan Unit Kesehatan Sekolah (UKS) dan Pembina Keasramaan, menerangkan bahwa peserta didik berikut:";
  const wrappedIntro = doc.splitTextToSize(introText, 180);
  doc.text(wrappedIntro, 15, contentY);
  contentY += wrappedIntro.length * 4.5 + 4;

  // Student Info Table
  autoTable(doc, {
    head: [["IDENTITAS SISWA", "INFORMASI DATA KEASRAMAAN"]],
    body: [
      ["Nama Lengkap Siswa", record.studentName],
      ["NISN / ID Siswa", student?.id || record.studentId || "-"],
      ["Kelas / Angkatan", student?.class ? `Kelas ${student.class}` : "-"],
      ["Lokasi Asrama", student?.dorm || "-"],
      ["Tanggal & Waktu Periksa", `${formatDateIndonesian(record.date, true)} Pukul ${record.time || '08:00'} WIB`],
      ["Lokasi Penanganan Medis", record.location || "UKS Asrama"]
    ],
    startY: contentY,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 5;

  // Medical Results Table
  const restText = record.restDays === 1 ? '1 (satu)' : record.restDays === 2 ? '2 (dua)' : record.restDays === 3 ? '3 (tiga)' : `${record.restDays}`;

  autoTable(doc, {
    head: [["PARAMETER PEMERIKSAAN", "HASIL DIAGNOSA & REKOMENDASI MEDIS"]],
    body: [
      ["Gejala / Keluhan Utama", record.symptoms || "-"],
      ["Pemeriksaan Fisik", `Suhu: ${record.temperature || '-'} | Vital Signs: ${record.vitalSigns || '-'}`],
      ["Diagnosa Medis", record.diagnosis || "Sakit / Perlu Istirahat"],
      ["Tindakan & Obat (Terapi)", record.treatment || "-"],
      ["Status Penanganan", record.status || "Dalam Perawatan"],
      ["Rekomendasi Izin Sakit", record.isSickLeave ? `Izin Istirahat / Berobat selama ${restText} hari terhitung sejak tanggal ${formatDateIndonesian(record.date, true)}` : "Diizinkan kembali beraktivitas dengan pemantauan"],
      ["Catatan Tambahan UKS", record.notes || "Tidak ada."]
    ],
    startY: contentY,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 6;

  // Closing Paragraph
  const closingText =
    "Demikian Surat Keterangan Izin Sakit & Rekam Medis ini diterbitkan oleh tim kesehatan UKS untuk dipergunakan sebagaimana mestinya demi keselamatan, kesehatan, dan pemulihan peserta didik.";
  const wrappedClosing = doc.splitTextToSize(closingText, 180);
  if (contentY + wrappedClosing.length * 4.5 + 45 > maxBodyY) {
    contentY = addNewUKSPage();
  }
  doc.text(wrappedClosing, 15, contentY);
  contentY += wrappedClosing.length * 4.5 + 8;

  // Signatures Section
  if (contentY + 42 > maxBodyY) {
    contentY = addNewUKSPage("Pengesahan Surat Keterangan UKS");
  }

  const dateStr = formatDateIndonesian(record.date || new Date().toISOString().split('T')[0], true);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);

  const row1Y = contentY;
  doc.text("Mengetahui,", 20, row1Y);
  doc.text(`${config?.waliAsramaTitle || "Wali Asrama / Pembina Keasramaan"},`, 20, row1Y + 4.5);

  doc.text(`Palembang, ${dateStr}`, 135, row1Y);
  doc.text("Petugas Medis / Pembina UKS,", 135, row1Y + 4.5);

  // TTD Space (24mm)
  const waliName = overrideWaliAsrama || record.customWaliAsrama || config?.waliAsrama || 'Wali Asrama';
  const rawWaliNip = overrideWaliAsramaNip !== undefined ? overrideWaliAsramaNip : (record.customWaliAsramaNip !== undefined ? record.customWaliAsramaNip : (config?.waliAsramaNip || ''));
  const waliNip = rawWaliNip ? `NIP. ${rawWaliNip}` : '';
  const officerName = record.officer || 'Petugas UKS';

  doc.setFont("Helvetica", "bold");
  doc.text(waliName, 20, row1Y + 26);
  if (waliNip) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(waliNip, 20, row1Y + 30);
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(officerName, 135, row1Y + 26);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Penanggung Jawab Kesehatan UKS", 135, row1Y + 30);

  // Draw Page Numbering
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Layanan Kesehatan UKS Sekolah Rakyat 31 Palembang - Surat Izin Sakit Resmi (${letterNo})`,
      15,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, rightX, pageHeight - 6.5, { align: "right" });
  }

  doc.save(`Surat_Izin_Sakit_${record.studentName.replace(/\s+/g, '_')}_${record.date}.pdf`);
}

/**
 * Generates an official CR80 ID Card PDF (85.6 mm x 54 mm) for a student,
 * complete with school header, student info, RFID UID badge, and barcode/QR style footer.
 */
export async function generateStudentCardPDF(student: Student, config: AppConfig): Promise<void> {
  // CR80 ID Card dimensions in mm
  const cardWidth = 85.6;
  const cardHeight = 54.0;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [cardWidth, cardHeight]
  });

  await drawStudentCardPage(doc, student, config, 0, 0);

  doc.save(`Kartu_Siswa_${student.name.replace(/\s+/g, '_')}_${student.id}.pdf`);
}

/**
 * Generates a multi-page PDF or printable grid sheet containing student cards for all students.
 */
export async function generateAllStudentCardsPDF(students: Student[], config: AppConfig): Promise<void> {
  if (!students || students.length === 0) return;

  const cardWidth = 85.6;
  const cardHeight = 54.0;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [cardWidth, cardHeight]
  });

  for (let i = 0; i < students.length; i++) {
    if (i > 0) {
      doc.addPage([cardWidth, cardHeight], 'landscape');
    }
    await drawStudentCardPage(doc, students[i], config, 0, 0);
  }

  doc.save(`Daftar_Kartu_Siswa_CR80_${students.length}_Siswa.pdf`);
}

/**
 * Generates an A4 sheet layout (10 cards per A4 page: 2 cols x 5 rows) with crop/cut marks for easy printing.
 */
export async function generateStudentCardSheetA4PDF(students: Student[], config: AppConfig): Promise<void> {
  if (!students || students.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const cardW = 85.6;
  const cardH = 54.0;
  const marginX = 14.2;
  const marginY = 10.0;
  const gapX = 10.0;
  const gapY = 2.5;

  const cols = 2;
  const rows = 5;
  const cardsPerPage = cols * rows;

  for (let i = 0; i < students.length; i++) {
    const cardIndexOnPage = i % cardsPerPage;

    if (i > 0 && cardIndexOnPage === 0) {
      doc.addPage('a4', 'portrait');
    }

    const col = cardIndexOnPage % cols;
    const row = Math.floor(cardIndexOnPage / cols);

    const posX = marginX + col * (cardW + gapX);
    const posY = marginY + row * (cardH + gapY);

    await drawStudentCardPage(doc, students[i], config, posX, posY);

    // Crop / Cut lines around card for trimming
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.15);
    // top-left corner marks
    doc.line(posX - 2, posY, posX - 0.5, posY);
    doc.line(posX, posY - 2, posX, posY - 0.5);
    // top-right corner marks
    doc.line(posX + cardW + 0.5, posY, posX + cardW + 2, posY);
    doc.line(posX + cardW, posY - 2, posX + cardW, posY - 0.5);
    // bottom-left corner marks
    doc.line(posX - 2, posY + cardH, posX - 0.5, posY + cardH);
    doc.line(posX, posY + cardH + 0.5, posX, posY + cardH + 2);
    // bottom-right corner marks
    doc.line(posX + cardW + 0.5, posY + cardH, posX + cardW + 2, posY + cardH);
    doc.line(posX + cardW, posY + cardH + 0.5, posX + cardW, posY + cardH + 2);
  }

  doc.save(`Lembar_A4_Kartu_Siswa_${students.length}_Siswa.pdf`);
}

async function drawStudentCardPage(doc: jsPDF, student: Student, config: AppConfig, offsetX: number, offsetY: number): Promise<void> {
  const w = 85.6;
  const h = 54.0;

  // 1. Simple Clean Dark Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(offsetX, offsetY, w, h, 'F');

  // Load logo
  try {
    const logoData = await loadLogoImage(config.logoKiriUrl || '', 'left');
    if (logoData) {
      doc.addImage(logoData, 'PNG', offsetX + 3, offsetY + 3, 9, 9);
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Simple Header Text (No background box, no divider line)
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('KEMENTERIAN SOSIAL RI', offsetX + 13.5, offsetY + 5.2);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text('PUSAT PENDIDIKAN & PELATIHAN PROFESI', offsetX + 13.5, offsetY + 8.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(254, 240, 138); // Amber-200
  doc.text('SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG', offsetX + 13.5, offsetY + 11.8);

  // 3. Photo / QR Box (Left side) - Clean White Box for Max QR Scanning Accuracy
  const photoX = offsetX + 3.5;
  const photoY = offsetY + 15.5;
  const photoW = 18;
  const photoH = 22;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'F');

  // Render Real QR Code inside Photo Box
  let hasQrCode = false;
  try {
    const studentQrId = String(student.id || '').trim();
    if (studentQrId) {
      const qrDataUrl = await QRCode.toDataURL(studentQrId, {
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', photoX + 0.5, photoY + 0.5, photoW - 1, photoW - 1);
        hasQrCode = true;
      }
    }
  } catch (err) {
    console.error('Gagal generate QR Code PDF:', err);
  }

  if (!hasQrCode) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    const initialLetter = student.name ? student.name.charAt(0).toUpperCase() : 'S';
    doc.text(initialLetter, photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('QR ABSENSI', photoX + photoW / 2, photoY + photoH - 1.2, { align: 'center' });

  // 4. Student Details Section (Simple Layout without dividing lines)
  const detailsX = photoX + photoW + 3.5;
  let lineY = offsetY + 17.5;

  // Student Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  const truncatedName = doc.splitTextToSize(student.name || 'Nama Siswa', w - detailsX - 3);
  doc.text(truncatedName[0], detailsX, lineY);
  lineY += 4.5;

  // NISN / Student ID
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('NISN / ID:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(241, 245, 249); // slate-100
  doc.text(student.id || '-', detailsX + 11, lineY);
  lineY += 4.0;

  // Class & Dorm
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Kelas/Jenjang:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(241, 245, 249); // slate-100
  doc.text(`${student.class} (${student.dorm || 'Asrama'})`, detailsX + 15, lineY);
  lineY += 4.0;

  // Wali Asuh
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Wali Asuh:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(241, 245, 249);
  const rawCaretaker = student.caretaker ? String(student.caretaker).trim() : '';
  const caretakerText = rawCaretaker ? (rawCaretaker.length > 22 ? rawCaretaker.substring(0, 22) + '...' : rawCaretaker) : '-';
  doc.text(caretakerText, detailsX + 11, lineY);
  lineY += 4.5;

  // RFID Tag Pill (Simple Soft Fill without line border)
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(detailsX, lineY - 2.5, 38, 4.8, 1, 1, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(110, 231, 183); // emerald-300
  const rfidDisplay = student.rfidTag ? `RFID UID: ${student.rfidTag}` : 'SMART RFID CARD ENABLED';
  doc.text(rfidDisplay, detailsX + 2, lineY + 0.8);

  // 5. Simple Footer (No border lines)
  const footerY = offsetY + h - 5.5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Sekolah Rakyat Terintegrasi 31 Palembang', offsetX + 3.5, footerY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`ID: ${student.id}`, offsetX + w - 3.5, footerY, { align: 'right' });
}

export interface PrayerReportSessionInfo {
  date?: string;
  prayerTime?: string;
  classFilter?: string;
  dormFilter?: string;
  officerName?: string;
  isBlankTemplate?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * Generates an official Prayer Attendance Report / Checklist PDF with school letterhead (Kop Surat),
 * logos, statistics, multi-column attendance data, and official signatures.
 */
export async function generatePrayerAttendanceReportPDF(
  records: PrayerAttendance[],
  config: AppConfig,
  sessionInfo: PrayerReportSessionInfo = {},
  allStudents?: Student[]
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity || 0.05);

  const isBlank = sessionInfo.isBlankTemplate || false;
  const targetDate = sessionInfo.date || new Date().toISOString().split('T')[0];
  const dateFormatted = formatDateIndonesian(targetDate, true);
  const prayerName = sessionInfo.prayerTime || 'Semua Waktu Sholat';
  const officer = sessionInfo.officerName || 'Pembina / Musyrif Asrama';

  // Function to draw official Kop Surat on each page or start of document
  function drawKopSuratHeader(startY = 10) {
    doc.setTextColor(30, 41, 59);
    let y = startY;

    const kopKiriLines = config.kopKiri ? config.kopKiri.split('\n') : ['SEKOLAH RAKYAT TERPADU 31 PALEMBANG'];
    const kopKananLines = config.kopKanan ? config.kopKanan.split('\n') : ['Kompleks Asrama Terintegrasi Palembang'];

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    if (kopKiriLines.length > 0) {
      doc.text(kopKiriLines[0] || '', pageWidth / 2, y, { align: 'center' });
      y += 4.5;
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    for (let i = 1; i < kopKiriLines.length; i++) {
      doc.text(kopKiriLines[i] || '', pageWidth / 2, y, { align: 'center' });
      y += 3.8;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    if (kopKananLines.length > 0) {
      doc.text(kopKananLines[0] || '', pageWidth / 2, y, { align: 'center' });
      y += 3.8;
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    for (let i = 1; i < kopKananLines.length; i++) {
      doc.text(kopKananLines[i] || '', pageWidth / 2, y, { align: 'center' });
      y += 3.4;
    }

    // Left & Right Logos
    if (leftLogoBase64) {
      doc.addImage(leftLogoBase64, 'PNG', 15, 8, 18, 18);
    }
    if (rightLogoBase64) {
      doc.addImage(rightLogoBase64, 'PNG', pageWidth - 33, 8, 18, 18);
    }

    // Double Border Line
    const lineY = Math.max(y + 2, 29);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.line(15, lineY, pageWidth - 15, lineY);
    doc.setLineWidth(0.2);
    doc.line(15, lineY + 1.2, pageWidth - 15, lineY + 1.2);

    return lineY + 5;
  }

  const startContentY = drawKopSuratHeader(10);

  // Detect session category
  const lowerPrayer = prayerName.toLowerCase();
  const isMeal =
    lowerPrayer.includes('makan') ||
    lowerPrayer.includes('sarapan') ||
    lowerPrayer.includes('sahur') ||
    lowerPrayer.includes('puasa') ||
    lowerPrayer.includes('snack');
  const isActivity =
    lowerPrayer.includes('kajian') ||
    lowerPrayer.includes('apel') ||
    lowerPrayer.includes('kebersihan') ||
    lowerPrayer.includes('kegiatan');

  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);

  let defaultTitle = 'LAPORAN RESMI DAFTAR HADIR ASRAMA';
  if (isMeal) {
    defaultTitle = isBlank
      ? `BLANKO PRESENSI & DAFTAR HADIR MAKAN (${prayerName.toUpperCase()}) ASRAMA`
      : `LAPORAN RESMI DAFTAR HADIR MAKAN (${prayerName.toUpperCase()}) ASRAMA`;
  } else if (isActivity) {
    defaultTitle = isBlank
      ? `BLANKO PRESENSI & DAFTAR HADIR KEGIATAN (${prayerName.toUpperCase()}) ASRAMA`
      : `LAPORAN RESMI DAFTAR HADIR KEGIATAN (${prayerName.toUpperCase()}) ASRAMA`;
  } else {
    defaultTitle = isBlank
      ? `BLANKO PRESENSI & DAFTAR HADIR SHOLAT ${prayerName.toUpperCase()} ASRAMA`
      : `LAPORAN RESMI DAFTAR HADIR SHOLAT ${prayerName.toUpperCase()} ASRAMA`;
  }

  const mainTitle = sessionInfo.title || defaultTitle;
  doc.text(mainTitle, pageWidth / 2, startContentY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tanggal: ${dateFormatted}   |   Sesi: ${prayerName}   |   Jenjang: ${sessionInfo.classFilter || 'Semua'}   |   Asrama: ${sessionInfo.dormFilter || 'Semua Gedung'}`,
    pageWidth / 2,
    startContentY + 4.5,
    { align: 'center' }
  );

  let currentY = startContentY + 8;

  // Summary KPI stats box (for non-blank reports)
  if (!isBlank && records.length > 0) {
    const total = records.length;
    const hadir = records.filter((r) => r.status === 'Hadir').length;
    const terlambat = records.filter((r) => r.status === 'Terlambat').length;
    const izinSakit = records.filter((r) => r.status === 'Izin Sakit').length;
    const izinPulang = records.filter((r) => r.status === 'Izin Pulang').length;
    const alpa = records.filter((r) => r.status === 'Alpa / Tanpa Keterangan').length;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, currentY, pageWidth - 30, 8, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Siswa Terdata: ${total}`, 22, currentY + 5.2);

    doc.setTextColor(22, 101, 52); // emerald
    doc.text(`✓ Hadir: ${hadir}`, 78, currentY + 5.2);

    doc.setTextColor(180, 83, 9); // amber
    doc.text(`⏱ Telat: ${terlambat}`, 122, currentY + 5.2);

    doc.setTextColor(109, 40, 217); // purple
    doc.text(`🏖 Izin Pulang: ${izinPulang}`, 162, currentY + 5.2);

    doc.setTextColor(13, 148, 136); // teal
    doc.text(`🤒 Sakit: ${izinSakit}`, 212, currentY + 5.2);

    doc.setTextColor(190, 18, 60); // rose
    doc.text(`❌ Alpa: ${alpa}`, 254, currentY + 5.2);

    currentY += 11;
  } else {
    currentY += 2;
  }

  // Construct table
  let tableHead: string[][];
  let tableBody: (string | number)[][];
  let columnStyles: any;

  if (isBlank) {
    // Blank template for manual checking at the mosque/dining hall (Landscape)
    const studentList = allStudents && allStudents.length > 0 ? allStudents : [];
    tableHead = [['No', 'NISN', 'Nama Lengkap Murid', 'Kelas / Rombel', 'Gedung Asrama', 'Hadir', 'Telat', 'Sakit', 'Izin', 'Alpa', 'Paraf / Keterangan Petugas']];
    tableBody = studentList.map((s, idx) => [
      idx + 1,
      s.id,
      s.name,
      s.class,
      s.dorm,
      '[  ]',
      '[  ]',
      '[  ]',
      '[  ]',
      '[  ]',
      '...................................'
    ]);
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 32 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 15, halign: 'center' },
      9: { cellWidth: 15, halign: 'center' },
      10: { cellWidth: 'auto', halign: 'center' }
    };
  } else {
    // Detailed records table in Landscape
    tableHead = [['No', 'NISN / ID', 'Nama Lengkap Murid', 'Kelas', 'Gedung Asrama', 'Sesi Presensi', 'Jam Scan', 'Status Presensi', 'Petugas / Catatan Tambahan']];
    tableBody = records.map((r, idx) => [
      idx + 1,
      r.studentId,
      r.studentName,
      r.class,
      r.dorm,
      r.prayerTime,
      r.timestamp || '-',
      r.status,
      r.scannedBy || r.note || '-'
    ]);
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 65, fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 38 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 'auto' }
    };
  }

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: columnStyles,
    margin: { left: 15, right: 15 },
    didParseCell: function (data) {
      if (!isBlank && data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'Hadir') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val === 'Terlambat') {
          data.cell.styles.textColor = [180, 83, 9];
        } else if (val === 'Izin Sakit' || val === 'Izin Pulang') {
          data.cell.styles.textColor = [109, 40, 217];
        } else {
          data.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
    didDrawPage: function () {
      // Watermark centered on landscape page (297x210)
      if (watermarkBase64) {
        doc.addImage(watermarkBase64, 'PNG', 98, 55, 100, 100);
      }
    }
  });

  // Signatures Section
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 38 > pageHeight - 15) {
    doc.addPage();
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 98, 55, 100, 100);
    }
    finalY = 18;
  }

  const sigDateStr = `Palembang, ${formatDateIndonesian(targetDate, true)}`;
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  doc.text(sigDateStr, pageWidth - 75, finalY);

  const sigRowY = finalY + 4.5;
  doc.text('Mengetahui,', 25, sigRowY);
  doc.text(config?.waliAsramaTitle || 'Wali Asrama Mandiri,', 25, sigRowY + 4);

  const officerRoleLabel = isMeal
    ? 'Petugas Dapur / Pembina Asrama,'
    : isActivity
    ? 'Pembina / Musyrif Kegiatan,'
    : 'Petugas / Pembina Sholat,';
  doc.text(officerRoleLabel, pageWidth / 2 - 20, sigRowY + 4);

  doc.text('Kepala Sekolah Rakyat,', pageWidth - 75, sigRowY + 4);

  // TTD Space (18mm)
  const namesY = sigRowY + 22;
  doc.setFont('Helvetica', 'bold');
  doc.text(`( ${config.waliAsrama || 'Wali Asrama Mandiri'} )`, 25, namesY);
  doc.text(`( ${officer} )`, pageWidth / 2 - 20, namesY);
  doc.text(`( ${config.kepalaSekolah || 'Kepala Sekolah'} )`, pageWidth - 75, namesY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  if (config.waliAsramaNip) {
    const nip = config.waliAsramaNip.startsWith('NIP') ? config.waliAsramaNip : `NIP. ${config.waliAsramaNip}`;
    doc.text(nip, 25, namesY + 3.8);
  }
  doc.text('Petugas / Musyrif Asrama', pageWidth / 2 - 20, namesY + 3.8);
  if (config.kepalaSekolahNip) {
    const nip = config.kepalaSekolahNip.startsWith('NIP') ? config.kepalaSekolahNip : `NIP. ${config.kepalaSekolahNip}`;
    doc.text(nip, pageWidth - 75, namesY + 3.8);
  }

  // Draw Page numbers across all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Presensi Asrama Terpadu Sekolah Rakyat 31 Palembang - Dokumen Resmi Keasramaan`,
      15,
      pageHeight - 8
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  const filePrefix = isMeal ? 'Presensi_Makan' : isActivity ? 'Presensi_Kegiatan' : 'Presensi_Sholat';
  const cleanFilename = isBlank
    ? `Blanko_${filePrefix}_${prayerName.replace(/[^a-zA-Z0-9]/g, '_')}_${targetDate}.pdf`
    : `Daftar_Hadir_${filePrefix}_${prayerName.replace(/[^a-zA-Z0-9]/g, '_')}_${targetDate}.pdf`;

  doc.save(cleanFilename);
}

/**
 * 14. CETAK BERITA ACARA / LEMBAR BIMBINGAN & KONSELING (BK) SISWA PDF
 */
export async function printCounselingSessionPDF(
  counseling: Counseling,
  student: Student | undefined,
  config: AppConfig
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.08
  );

  // Background Watermark
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 35, 80, 140, 140);
  }

  // Draw Kop Surat
  doc.addImage(leftLogoBase64, 'PNG', 12, 10, 22, 22);
  doc.addImage(rightLogoBase64, 'PNG', 176, 10, 22, 22);

  const kopKiriText =
    config?.kopKiri ||
    "KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nPUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI\nSEKOLAH RAKYAT 31 PALEMBANG";
  const kopKananText =
    config?.kopKanan ||
    "Jalan Seniman Amri Yahya, Jakabaring, Palembang\nTelepon: (0711) 510000 | Email: asrama@sekolahrakyat.sch.id\nLAMAN: www.sekolahrakyat.sch.id";

  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  const leftLines = kopKiriText.split('\n');
  let yKop = 13;
  leftLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 4.5;
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rightLines = kopKananText.split('\n');
  rightLines.forEach((line) => {
    doc.text(line, 105, yKop, { align: 'center' });
    yKop += 3.5;
  });

  // Double Line Divider
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(12, yKop + 2, 198, yKop + 2);
  doc.setLineWidth(0.2);
  doc.line(12, yKop + 3.2, 198, yKop + 3.2);

  // Document Title
  const titleY = yKop + 10;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // soft dark slate
  doc.text("BERITA ACARA & LAPORAN LAYANAN BIMBINGAN KONSELING (BK)", 105, titleY, { align: 'center' });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const dateFormatted = formatDateIndonesian(counseling.date || new Date().toISOString().split('T')[0], false);
  const docNumber = `Nomor: ${counseling.id.toUpperCase()}/BK-SR31/${counseling.date.replace(/-/g, '')}`;
  doc.text(docNumber, 105, titleY + 4.5, { align: 'center' });

  // Recipient & Intro
  let contentY = titleY + 11;
  const maxBodyY = pageHeight - 20;
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin;

  let currentPageNum = 1;
  function addNewBKPage(sectionTitle = "Berita Acara Bimbingan & Konseling") {
    doc.addPage('a4', 'p');
    currentPageNum++;
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 35, 80, 140, 140);
    }
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sectionTitle} - ${counseling.studentName} (${docNumber})`, leftMargin, 14);
    doc.text(`[Lanjutan Halaman ${currentPageNum}]`, rightX, 14, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(leftMargin, 17, rightX, 17);
    return 24;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "normal");

  const introText =
    "Pada hari ini telah dilaksanakan sesi pendampingan psikopedagogis, bimbingan konseling individual/kelompok, serta pembinaan karakter peserta didik Keasramaan Sekolah Rakyat 31 Palembang dengan rincian data laporan sebagai berikut:";
  const wrappedIntro = doc.splitTextToSize(introText, 180);
  doc.text(wrappedIntro, 15, contentY);
  contentY += wrappedIntro.length * 4.2 + 2;

  // Student & Counselor Identity Table
  const statusLabel =
    counseling.status === 'Resolved'
      ? 'Tuntas / Selesai (Resolved)'
      : counseling.status === 'In Progress'
      ? 'Dalam Pembinaan Berjalan (In Progress)'
      : counseling.status === 'Referred'
      ? `Dirujuk ke Ahli/Luar (${counseling.referralDetails || 'Spesialis'})`
      : 'Terjadwal / Baru (Open)';

  const sessionInfoStr = `Sesi Ke-${counseling.sessionNumber || 1} • ${formatDateIndonesian(counseling.date, true)} ${
    counseling.time ? `(${counseling.time})` : ''
  }`;

  autoTable(doc, {
    body: [
      ["Nama Peserta Didik", `: ${counseling.studentName}`],
      ["NISN / ID Siswa", `: ${counseling.studentId}`],
      ["Kelas & Kamar Asrama", `: ${student ? `${student.class} — Kamar ${student.dorm}` : '-'}`],
      ["Wali Asuh Pendamping", `: ${student?.caretaker || '-'}`],
      ["Guru BK / Konselor", `: ${counseling.counselor}${counseling.counselorNip ? ` (NIP. ${counseling.counselorNip})` : ''}`],
      ["Pihak Pendamping Hadir", `: ${counseling.accompanyingPerson || student?.caretaker || 'Wali Asuh'}`],
      ["Jadwal & Waktu Sesi", `: ${sessionInfoStr}`],
      ["Lokasi Pertemuan", `: ${counseling.location || 'Ruang Bimbingan & Konseling (BK)'}`],
      ["Bidang & Jenis Layanan", `: ${counseling.counselingField || 'Pribadi'} • ${counseling.counselingType || 'Konseling Individu'}`],
      ["Urgensi & Kerahasiaan", `: ${counseling.urgencyLevel || 'Rutin'} • Sifat: ${counseling.confidentiality || 'Rahasia'}`],
      ["Status Penanganan Kasus", `: ${statusLabel}`]
    ],
    startY: contentY,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 16, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 4;

  // Counseling Detailed Narrative Table
  const narrativeRows = [
    ["1. Topik / Permasalahan Pokok", counseling.caseDescription || "-"],
    ["2. Latar Belakang & Faktor Pemicu", counseling.backgroundAnalysis || "Faktor adaptasi lingkungan asrama dan kebiasaan harian."],
    ["3. Pendekatan / Teknik Konseling", counseling.counselingApproach || "Client-Centered Therapy & Pendekatan Humanistik Spiritual"],
    ["4. Observasi Sikap & Bahasa Tubuh", counseling.studentObservation || "Kooperatif dan bersedia berkomunikasi secara terbuka."],
    ["5. Dinamika Sesi & Hasil Pembinaan", counseling.notes || "Sesi konseling berjalan kondusif, peserta didik menyadari pentingnya kedisiplinan dan perubahan diri."],
    ["6. Komitmen & Pernyataan Janji Siswa", counseling.studentCommitment ? `"${counseling.studentCommitment}"` : "Berjanji mentaati seluruh tata tertib asrama dan aktif berkoordinasi dengan wali asuh."],
    ["7. Rencana Tindak Lanjut (RTL)", counseling.followUp || "Pendampingan berkala bersama Wali Asuh dan Guru BK."],
    ["8. Target Tanggal Evaluasi", counseling.targetReviewDate ? formatDateIndonesian(counseling.targetReviewDate, false) : "1 (satu) pekan setelah sesi konseling"],
    ["9. Rekomendasi Khusus", counseling.recommendations || "Perlu penguatan motivasi positif dari Wali Asuh dan komunikasi teratur dengan orang tua."]
  ];

  if (counseling.status === 'Referred' && counseling.referralDetails) {
    narrativeRows.push(["10. Rujukan Ahli / Spesialis", counseling.referralDetails]);
  }

  autoTable(doc, {
    head: [["ASPEK / MATERI BIMBINGAN", "DESKRIPSI ANALISIS, PEMBINAAN & REKOMENDASI LENGKAP"]],
    body: narrativeRows,
    startY: contentY,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold', fontSize: 8.5, halign: 'left', textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto'
  });

  contentY = (doc as any).lastAutoTable.finalY + 5;

  // Closing Statement
  const closingText =
    "Demikian Berita Acara & Laporan Pelaksanaan Layanan Bimbingan Konseling ini dibuat dengan sebenar-benarnya sebagai dokumen resmi keasramaan, serta menjadi dasar pembinaan kepribadian, akhlak mulia, dan kedisiplinan peserta didik.";
  const wrappedClosing = doc.splitTextToSize(closingText, 180);
  if (contentY + wrappedClosing.length * 4.2 + 45 > maxBodyY) {
    contentY = addNewBKPage();
  }
  doc.text(wrappedClosing, 15, contentY);
  contentY += wrappedClosing.length * 4.2 + 6;

  // Signatures Section (4 Signatures: Siswa, Guru BK, Wali Asuh, Kepala Sekolah)
  if (contentY + 48 > maxBodyY) {
    contentY = addNewBKPage("Pengesahan Berita Acara BK");
  }

  const sigDateStr = `Palembang, ${dateFormatted}`;
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(sigDateStr, 135, contentY);

  const row1Y = contentY + 4.5;
  doc.text("Peserta Didik yang Dibina,", 20, row1Y);
  doc.text("Guru BK / Konselor Pelaksana,", 135, row1Y);

  const row1TTDY = row1Y + 20;
  doc.setFont("Helvetica", "bold");
  doc.text(`( ${counseling.studentName} )`, 20, row1TTDY);
  doc.text(`( ${counseling.counselor} )`, 135, row1TTDY);
  if (counseling.counselorNip) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`NIP. ${counseling.counselorNip}`, 135, row1TTDY + 3.8);
  }

  const row2Y = row1TTDY + 8;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Mengetahui,", 20, row2Y);
  doc.text(`${config?.waliAsramaTitle || "Wali Asrama / Pendamping"},`, 20, row2Y + 4);

  doc.text("Kepala Sekolah Rakyat,", 135, row2Y + 4);

  const row2TTDY = row2Y + 22;
  doc.setFont("Helvetica", "bold");
  doc.text(`( ${student?.caretaker || config.waliAsrama || 'Wali Asuh'} )`, 20, row2TTDY);
  doc.text(`( ${config.kepalaSekolah || 'Kepala Sekolah'} )`, 135, row2TTDY);

  if (config.kepalaSekolahNip) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const nip = config.kepalaSekolahNip.startsWith('NIP') ? config.kepalaSekolahNip : `NIP. ${config.kepalaSekolahNip}`;
    doc.text(nip, 135, row2TTDY + 3.8);
  }

  // Draw Page Numbering
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Bimbingan Konseling Sekolah Rakyat 31 Palembang - Dokumen Berita Acara Resmi (${docNumber})`,
      15,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, rightX, pageHeight - 6.5, { align: "right" });
  }

  doc.save(`Berita_Acara_Konseling_BK_${counseling.studentName.replace(/\s+/g, '_')}_${counseling.date}.pdf`);
}

/**
 * 15. CETAK REKAPITULASI BUKU AGENDA BIMBINGAN & KONSELING (BK) PDF (LANDSCAPE)
 */
export async function printCounselingRecapPDF(
  counselingList: Counseling[],
  config: AppConfig,
  filterInfo?: { status?: string; searchQuery?: string }
): Promise<void> {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = 297;
  const pageHeight = 210;

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
  const watermarkBase64 = await generateWatermarkBase64(
    leftLogoBase64,
    config?.watermarkOpacity || 0.08
  );

  // Draw Kop Surat in Landscape
  doc.addImage(leftLogoBase64, 'PNG', 15, 8, 20, 20);
  doc.addImage(rightLogoBase64, 'PNG', 262, 8, 20, 20);

  const kopKiriText =
    config?.kopKiri ||
    "KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nPUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI\nSEKOLAH RAKYAT 31 PALEMBANG";
  const kopKananText =
    config?.kopKanan ||
    "Jalan Seniman Amri Yahya, Jakabaring, Palembang | Telepon: (0711) 510000\nEmail: asrama@sekolahrakyat.sch.id | LAMAN: www.sekolahrakyat.sch.id";

  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10.5);
  const leftLines = kopKiriText.split('\n');
  let yKop = 11;
  leftLines.forEach((line) => {
    doc.text(line, 148.5, yKop, { align: 'center' });
    yKop += 4.5;
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rightLines = kopKananText.split('\n');
  rightLines.forEach((line) => {
    doc.text(line, 148.5, yKop, { align: 'center' });
    yKop += 3.5;
  });

  // Double Line Divider
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(15, yKop + 2, 282, yKop + 2);
  doc.setLineWidth(0.2);
  doc.line(15, yKop + 3.2, 282, yKop + 3.2);

  // Title
  let currentY = yKop + 9;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // soft dark slate
  doc.text("BUKU AGENDA & REKAPITULASI LAYANAN BIMBINGAN KONSELING (BK)", 148.5, currentY, { align: 'center' });

  // Summary Metrics Banner
  const totalCount = counselingList.length;
  const resolvedCount = counselingList.filter((c) => c.status === 'Resolved').length;
  const inProgressCount = counselingList.filter((c) => c.status === 'In Progress').length;
  const openCount = counselingList.filter((c) => c.status === 'Open').length;
  const referredCount = counselingList.filter((c) => c.status === 'Referred').length;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const filterDesc = filterInfo?.status
    ? `Status Kasus: ${filterInfo.status} | `
    : 'Semua Status Kasus | ';
  const summaryText = `${filterDesc}Total Sesi: ${totalCount} (Tuntas: ${resolvedCount}, In Progress: ${inProgressCount}, Open: ${openCount}, Dirujuk: ${referredCount})`;
  doc.text(summaryText, 148.5, currentY + 4.5, { align: 'center' });

  currentY += 8;

  // Table
  const tableHead = [
    ['No', 'Tanggal', 'NISN', 'Nama Peserta Didik', 'Bidang & Layanan', 'Konselor Pelaksana', 'Topik Masalah Pokok', 'Hasil Pembinaan & Komitmen', 'RTL & Target Evaluasi', 'Status']
  ];

  const tableBody = counselingList.map((c, idx) => [
    idx + 1,
    formatDateShort(c.date) || c.date,
    c.studentId,
    c.studentName,
    `${c.counselingField || 'Pribadi'}\n(${c.counselingType || 'Individu'})`,
    c.counselor,
    c.caseDescription,
    `${c.notes}${c.studentCommitment ? `\nJanji: "${c.studentCommitment}"` : ''}`,
    `${c.followUp || '-'}${c.targetReviewDate ? `\nTarget: ${formatDateShort(c.targetReviewDate)}` : ''}`,
    c.status
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105], // soft slate
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 42 },
      7: { cellWidth: 48 },
      8: { cellWidth: 32 },
      9: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 9) {
        const val = String(data.cell.raw);
        if (val === 'Resolved') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val === 'In Progress') {
          data.cell.styles.textColor = [180, 83, 9];
        } else if (val === 'Referred') {
          data.cell.styles.textColor = [126, 34, 206];
        } else {
          data.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
    didDrawPage: function () {
      if (watermarkBase64) {
        doc.addImage(watermarkBase64, 'PNG', 98, 55, 100, 100);
      }
    }
  });

  // Signatures Section
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 38 > pageHeight - 15) {
    doc.addPage('a4', 'landscape');
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', 98, 55, 100, 100);
    }
    finalY = 18;
  }

  const sigDateStr = `Palembang, ${formatDateIndonesian(new Date().toISOString().split('T')[0], true)}`;
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  doc.text(sigDateStr, pageWidth - 75, finalY);

  const sigRowY = finalY + 4.5;
  doc.text('Mengetahui,', 25, sigRowY);
  doc.text(config?.waliAsramaTitle || 'Wali Asrama Mandiri,', 25, sigRowY + 4);

  doc.text('Koordinator Guru BK / Konselor,', pageWidth / 2 - 25, sigRowY + 4);
  doc.text('Kepala Sekolah Rakyat,', pageWidth - 75, sigRowY + 4);

  // TTD Space (18mm)
  const namesY = sigRowY + 22;
  doc.setFont('Helvetica', 'bold');
  doc.text(`( ${config.waliAsrama || 'Wali Asrama Mandiri'} )`, 25, namesY);
  doc.text(`( Ibu Rahmawati, S.Psi. )`, pageWidth / 2 - 25, namesY);
  doc.text(`( ${config.kepalaSekolah || 'Kepala Sekolah'} )`, pageWidth - 75, namesY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  if (config.waliAsramaNip) {
    const nip = config.waliAsramaNip.startsWith('NIP') ? config.waliAsramaNip : `NIP. ${config.waliAsramaNip}`;
    doc.text(nip, 25, namesY + 3.8);
  }
  doc.text('Koordinator Bimbingan Konseling', pageWidth / 2 - 25, namesY + 3.8);
  if (config.kepalaSekolahNip) {
    const nip = config.kepalaSekolahNip.startsWith('NIP') ? config.kepalaSekolahNip : `NIP. ${config.kepalaSekolahNip}`;
    doc.text(nip, pageWidth - 75, namesY + 3.8);
  }

  // Draw Page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Buku Agenda Layanan Bimbingan & Konseling Sekolah Rakyat 31 Palembang - Dokumen Rahasia Keasramaan`,
      15,
      pageHeight - 8
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  doc.save(`Rekapitulasi_Bimbingan_Konseling_BK_${new Date().toISOString().split('T')[0]}.pdf`);
}

// --- 13. GENERATOR SURAT PANGGILAN ORANG TUA / WALI SISWA (LEGAL PORTRAIT - PROPORISIONAL & MULTIPAGE) ---
export async function generateParentSummonsPDF(
  violation: Violation,
  student: Student | undefined,
  config: AppConfig,
  options: ParentSummonsOptions,
  otherViolations: Violation[] = []
) {
  // Legal Dimensions: 215.9 mm x 355.6 mm (8.5 x 14 in)
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'legal'
  });
  const pageWidth = doc.internal.pageSize.getWidth(); // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 355.6 mm
  const centerX = pageWidth / 2; // ~107.95 mm
  const leftMargin = 15;
  const rightMargin = 15;
  const printableWidth = pageWidth - leftMargin - rightMargin; // 185.9 mm
  const rightX = pageWidth - rightMargin; // 200.9 mm
  const maxBodyY = pageHeight - 22; // Safe bottom limit

  const leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config?.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config?.watermarkOpacity || 0.04);

  // Background Watermark on Page 1
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', centerX - 65, 95, 130, 130);
  }

  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const curMonthRoman = romanMonths[new Date().getMonth()] || 'VIII';
  const curYear = new Date().getFullYear();
  const letterNo = options.letterNumber || `0${violation.id.replace(/[^0-9]/g, '').slice(-3) || '123'}/SRT31-ASR/SP-ORTU/${curMonthRoman}/${curYear}`;
  const summonsTag = options.summonsLevel || 'Panggilan I (SP-1)';

  // Helper function to create a new page if content exceeds available height
  let currentPageNum = 1;
  function addNewLegalPage(sectionTitle = "Surat Panggilan Orang Tua / Wali Siswa") {
    doc.addPage('legal', 'p');
    currentPageNum++;
    if (watermarkBase64) {
      doc.addImage(watermarkBase64, 'PNG', centerX - 65, 110, 130, 130);
    }
    // Continuation mini-header
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sectionTitle} - ${violation.studentName} (${letterNo})`, leftMargin, 14);
    doc.text(`[Lanjutan Halaman ${currentPageNum}]`, rightX, 14, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(leftMargin, 17, rightX, 17);
    return 24;
  }

  // --- 1. KOP SURAT RESMI KEDINASAN (PAGE 1) ---
  doc.setTextColor(30, 41, 59);
  let startY = 13;
  const kopKiriLines = (config?.kopKiri || "PEMERINTAH PROVINSI SUMATERA SELATAN\nDINAS PENDIDIKAN\nSEKOLAH RAKYAT TERPADU 31 PALEMBANG").split('\n');
  const kopKananLines = (config?.kopKanan || "Jalan Seniman Amri Yahya, Jakabaring, Palembang\nTelepon: (0711) 510000 | Email: asrama@sekolahrakyat.sch.id\nLAMAN: www.sekolahrakyat.sch.id").split('\n');

  // Kop Kiri (Header Lembaga)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  if (kopKiriLines.length > 0) {
    doc.text(kopKiriLines[0] || "SEKOLAH RAKYAT TERPADU 31 PALEMBANG", centerX, startY, { align: "center" });
    startY += 4.6;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  for (let i = 1; i < kopKiriLines.length; i++) {
    doc.text(kopKiriLines[i] || "", centerX, startY, { align: "center" });
    startY += 4.2;
  }

  // Kop Kanan (Alamat & Kontak)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  if (kopKananLines.length > 0) {
    doc.text(kopKananLines[0] || "", centerX, startY, { align: "center" });
    startY += 4.0;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  for (let i = 1; i < kopKananLines.length; i++) {
    doc.text(kopKananLines[i] || "", centerX, startY, { align: "center" });
    startY += 3.6;
  }

  // Logos
  doc.addImage(leftLogoBase64, 'PNG', leftMargin, 11, 22, 22);
  doc.addImage(rightLogoBase64, 'PNG', rightX - 22, 11, 22, 22);

  // Double Horizontal Divider Rules
  const lineY = Math.max(startY + 2, 36);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, lineY, rightX, lineY);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, lineY + 1.2, rightX, lineY + 1.2);

  // --- 2. METADATA SURAT (NOMOR, SIFAT, LAMPIRAN, PERIHAL & TANGGAL) ---
  let metaY = lineY + 7;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Left Meta Column
  doc.text(`Nomor`, leftMargin, metaY);
  doc.text(`: ${letterNo}`, leftMargin + 22, metaY);

  doc.text(`Sifat`, leftMargin, metaY + 4.8);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(185, 28, 28);
  doc.text(`: PENTING / RAHASIA`, leftMargin + 22, metaY + 4.8);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  doc.text(`Lampiran`, leftMargin, metaY + 9.6);
  const lampiranCount = options.includeViolationHistory && otherViolations.length > 0 ? "1 (Satu) Berkas Lembar Rekap" : "1 (Satu) Lembar Ringkasan";
  doc.text(`: ${lampiranCount}`, leftMargin + 22, metaY + 9.6);

  doc.setFont("Helvetica", "bold");
  doc.text(`Perihal`, leftMargin, metaY + 14.4);
  doc.text(`: Panggilan Orang Tua / Wali Siswa (${summonsTag})`, leftMargin + 22, metaY + 14.4);
  doc.setFont("Helvetica", "normal");

  // Right Meta Column: Issuance Date
  const dateStr = formatDateIndonesian(new Date().toISOString().split('T')[0], false);
  doc.text(`Palembang, ${dateStr}`, rightX - 60, metaY);

  // --- 3. RECIPIENT BLOCK ---
  const recipientY = metaY + 22;
  doc.text("Kepada Yth.", leftMargin, recipientY);
  doc.setFont("Helvetica", "bold");
  const parentTitle = options.parentName || student?.parentName || "Bapak / Ibu Orang Tua / Wali Siswa";
  doc.text(`${parentTitle}`, leftMargin, recipientY + 4.8);
  doc.setFont("Helvetica", "normal");
  doc.text(`dari peserta didik: ${violation.studentName} (${student ? `Kelas ${student.class} - Gedung ${student.dorm}` : 'Siswa Terdaftar'})`, leftMargin, recipientY + 9.6);
  doc.text("di Tempat", leftMargin, recipientY + 14.4);

  // --- 4. OPENING & GREETING ---
  let bodyY = recipientY + 21;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Assalamu'alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera,", leftMargin, bodyY);
  bodyY += 5.2;

  const introText = "Dengan hormat, sehubungan dengan perlunya koordinasi, bimbingan terpadu, serta evaluasi tata tertib dan pembentukan karakter peserta didik di lingkungan Asrama Sekolah Rakyat Terpadu 31 Palembang, melalui surat ini kami mengundang kehadiran Bapak/Ibu Orang Tua/Wali dari:";
  const wrappedIntro = doc.splitTextToSize(introText, printableWidth);
  doc.text(wrappedIntro, leftMargin, bodyY);
  bodyY += wrappedIntro.length * 4.6 + 2.5;

  // --- 5. STUDENT IDENTITY TABLE ---
  autoTable(doc, {
    body: [
      ["Nama Lengkap Peserta Didik", `: ${violation.studentName}`],
      ["NISN / Nomor Induk Siswa", `: ${violation.studentId}`],
      ["Jenjang Kelas & Gedung Asrama", `: ${student ? `Kelas ${student.class}   |   Gedung ${student.dorm}` : '-'}`],
      ["Wali Asuh Pendamping", `: ${student?.caretaker || violation.reporter}`]
    ],
    startY: bodyY,
    theme: 'plain',
    styles: { fontSize: 8.8, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'normal' }
    },
    margin: { left: leftMargin + 3, right: rightMargin },
    pageBreak: 'auto'
  });

  bodyY = (doc as any).lastAutoTable.finalY + 3.5;

  // --- 6. VIOLATION CASE CONTEXT STATEMENT ---
  const caseStatement = `Untuk hadir dan bermusyawarah bersama pihak pengelola asrama, sehubungan dengan adanya catatan ketertiban: [Tingkat ${violation.level}] "${violation.violation}" pada tanggal ${formatDateIndonesian(violation.date, true)}, guna penanganan disiplin dan rencana pembinaan komprehensif ananda.`;
  const wrappedCase = doc.splitTextToSize(caseStatement, printableWidth);
  if (bodyY + wrappedCase.length * 4.4 > maxBodyY) {
    bodyY = addNewLegalPage();
  }
  doc.text(wrappedCase, leftMargin, bodyY);
  bodyY += wrappedCase.length * 4.4 + 3.5;

  // --- 7. MEETING SCHEDULE BOX (STRUCTURED CALLOUT TABLE) ---
  const meetingDateFormatted = formatDateIndonesian(options.meetingDate, true);
  autoTable(doc, {
    head: [["JADWAL & RINCIAN KEHADIRAN ORANG TUA / WALI", "KETERANGAN & LOKASI PERTEMUAN"]],
    body: [
      ["Hari & Tanggal Pertemuan", meetingDateFormatted],
      ["Waktu / Pukul", options.meetingTime || "09.00 WIB s.d. Selesai"],
      ["Tempat / Ruangan", options.meetingPlace || "Ruang Bimbingan & Konseling (BK) / Kantor Pengelola Asrama"],
      ["Menghadap Kepada", options.meetingWith || "Tim Disiplin Keasramaan, Guru BK, & Wali Asrama Mandiri"],
      ["Agenda / Pokok Bahasan", options.agenda || "Pembahasan Pelanggaran Tata Tertib & Bimbingan Khusus Peserta Didik"]
    ],
    startY: bodyY,
    theme: 'grid',
    headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold', fontSize: 8.8, halign: 'left' },
    styles: { fontSize: 8.6, cellPadding: 2.6, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: leftMargin, right: rightMargin },
    pageBreak: 'auto'
  });

  bodyY = (doc as any).lastAutoTable.finalY + 4.5;

  // --- 8. SPECIAL NOTES & CLOSING PARAGRAPH ---
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.8);
  const noteContent = options.specialNotes
    ? `Mengingat pentingnya agenda pembinaan ini bagi kelangsungan pendidikan, keselamatan, dan masa depan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya dan TIDAK DIWAKILKAN. ${options.specialNotes}`
    : "Mengingat pentingnya agenda pembinaan ini bagi kelangsungan pendidikan, keselamatan, dan masa depan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya dan TIDAK DIWAKILKAN (wajib dihadiri oleh Orang Tua / Wali kandung).";
  
  const wrappedNotes = doc.splitTextToSize(noteContent, printableWidth);
  if (bodyY + wrappedNotes.length * 4.2 + 15 > maxBodyY) {
    bodyY = addNewLegalPage();
  }
  doc.text(wrappedNotes, leftMargin, bodyY);
  bodyY += wrappedNotes.length * 4.2 + 3.0;

  const closingText = "Demikian surat panggilan ini kami sampaikan. Atas perhatian, kerja sama yang baik, dan kehadiran Bapak/Ibu, kami haturkan terima kasih.";
  if (bodyY + 18 > maxBodyY) {
    bodyY = addNewLegalPage();
  }
  doc.text(closingText, leftMargin, bodyY);
  bodyY += 5.0;
  doc.text("Wassalamu'alaikum Warahmatullahi Wabarakatuh.", leftMargin, bodyY);
  bodyY += 6.0;

  // QR Code Verification Payload
  const qrPayload = `SURAT PANGGILAN RESMI SEKOLAH RAKYAT 31 PALEMBANG\nNomor: ${letterNo}\nJenis: ${summonsTag}\nSiswa: ${violation.studentName} (${violation.studentId})\nTanggal Hadir: ${options.meetingDate} (${options.meetingTime})\nTempat: ${options.meetingPlace}\nValiditas: Terverifikasi Sistem Keasramaan Resmi`;
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 100,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    console.error("QR Code error:", err);
  }

  // --- 9. DUAL SIGNATURE BLOCK & QR VALIDATION ---
  const signatureHeight = 42; // Height needed for signatures
  const slipHeight = 72;      // Height needed for bottom slip

  // Check if signatures + slip fit on current page; if not, wrap gracefully
  const spaceLeftOnPage = pageHeight - bodyY - 15;
  let renderSlipOnSamePage = true;

  if (spaceLeftOnPage < (signatureHeight + slipHeight + 10)) {
    // Both don't fit together with generous padding
    if (spaceLeftOnPage < signatureHeight + 15) {
      // Even signatures don't fit -> create new page for both
      bodyY = addNewLegalPage("Pengesahan & Lembar Konfirmasi");
      renderSlipOnSamePage = true;
    } else {
      // Signatures fit on this page, but slip won't -> place signatures here, put slip on new page
      renderSlipOnSamePage = false;
    }
  }

  // Position signatures
  const sigY = Math.max(bodyY + 2, renderSlipOnSamePage ? 222 : bodyY + 4);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);

  // Left Signature: Tim Disiplin / Wali Asrama
  const signTitle = options.signatoryTitle || config?.waliAsramaTitle || "Wali Asrama Mandiri,";
  doc.text("Hormat kami,", leftMargin + 5, sigY);
  doc.setFont("Helvetica", "bold");
  doc.text(signTitle, leftMargin + 5, sigY + 4.5);

  const leftSignName = options.signatoryName || config?.waliAsrama || "Wali Asrama Mandiri";
  const leftSignNip = options.signatoryNip || config?.waliAsramaNip || ".........................";

  doc.text(`( ${leftSignName} )`, leftMargin + 5, sigY + 24);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP/NIK. ${leftSignNip}`, leftMargin + 5, sigY + 28);

  // Middle Signature Area: QR Code Official Validation Stamp
  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', centerX - 11, sigY + 2, 22, 22);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Verifikasi Sistem Resmi", centerX, sigY + 27, { align: "center" });
  }

  // Right Signature: Kepala Sekolah
  doc.setFontSize(8.8);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text("Mengetahui,", rightX - 60, sigY);
  doc.setFont("Helvetica", "bold");
  const headTitle = options.headTitle || "Kepala Sekolah Rakyat,";
  doc.text(headTitle, rightX - 60, sigY + 4.5);

  const headName = options.headName || config?.kepalaSekolah || "Kepala Sekolah";
  const headNip = options.headNip || config?.kepalaSekolahNip || ".........................";

  doc.text(`( ${headName} )`, rightX - 60, sigY + 24);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${headNip}`, rightX - 60, sigY + 28);

  // --- 10. BOTTOM TEAR-OFF ACKNOWLEDGEMENT SLIP (POTONGAN TANDA TERIMA ORANG TUA) ---
  let slipStartY = 273;
  if (!renderSlipOnSamePage) {
    slipStartY = addNewLegalPage("Lembar Konfirmasi Kehadiran & Tanda Terima Orang Tua");
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([3, 2], 0);
  doc.line(leftMargin, slipStartY, rightX, slipStartY);
  doc.setLineDashPattern([], 0); // reset dash

  doc.setFontSize(7.5);
  doc.setFont("Helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text("--------------------------------- (Potong / Sobek di sini untuk Lembar Konfirmasi & Tanda Terima Sekolah) ---------------------------------", centerX, slipStartY + 3.8, { align: "center" });

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, slipStartY + 6.5, printableWidth, 68, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftMargin, slipStartY + 6.5, printableWidth, 68, 2, 2, 'S');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);
  doc.text("LEMBAR TANDA TERIMA & KONFIRMASI KEHADIRAN ORANG TUA / WALI", centerX, slipStartY + 11.5, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text(`Saya yang bertanda tangan di bawah ini, Orang Tua / Wali dari:`, leftMargin + 5, slipStartY + 17.5);
  doc.setFont("Helvetica", "bold");
  doc.text(`${violation.studentName} (Kelas: ${student ? student.class : '-'} / NISN: ${violation.studentId})`, leftMargin + 82, slipStartY + 17.5);

  doc.setFont("Helvetica", "normal");
  doc.text(`Menyatakan telah menerima Surat Panggilan No: ${letterNo} dan mengonfirmasi bahwa:`, leftMargin + 5, slipStartY + 23);

  doc.text(`[   ]  BERSEDIA HADIR tepat waktu pada jadwal yang telah ditentukan.`, leftMargin + 9, slipStartY + 29.5);
  doc.text(`[   ]  BERHALANGAN HADIR karena: .......................................................................... (Mohon segera hubungi Wali Asuh)`, leftMargin + 9, slipStartY + 35.5);

  doc.text(`No. Kontak HP / WA Aktif: ...........................................`, leftMargin + 5, slipStartY + 45);
  doc.text(`Palembang, ......................................... 2026`, rightX - 65, slipStartY + 43);
  doc.text(`Tanda Tangan & Nama Terang Orang Tua / Wali,`, rightX - 65, slipStartY + 48);
  doc.text(`( ................................................................. )`, rightX - 65, slipStartY + 61);

  // --- 11. OPTIONAL APPENDIX: LAMPIRAN HISTORIS PELANGGARAN PESERTA DIDIK ---
  if (options.includeViolationHistory && otherViolations.length > 0) {
    const appendixStartY = addNewLegalPage("Lampiran Rekam Historis Pelanggaran");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("LAMPIRAN: REKAM HISTORIS PELANGGARAN PESERTA DIDIK", centerX, appendixStartY + 2, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text(`Nama: ${violation.studentName}  |  NISN: ${violation.studentId}  |  Kelas: ${student?.class || '-'}`, centerX, appendixStartY + 8, { align: "center" });

    doc.setLineWidth(0.4);
    doc.line(leftMargin, appendixStartY + 11, rightX, appendixStartY + 11);

    const historyRows = otherViolations.map((v, i) => [
      (i + 1).toString(),
      formatDateIndonesian(v.date),
      `Tingkat ${v.level}`,
      v.violation,
      v.sanction || '-',
      v.note || '-'
    ]);

    autoTable(doc, {
      head: [["No", "Tanggal", "Tingkat", "Bentuk Pelanggaran", "Sanksi", "Catatan Asrama"]],
      body: historyRows,
      startY: appendixStartY + 15,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: leftMargin, right: rightMargin },
      pageBreak: 'auto',
      didDrawPage: function () {
        if (watermarkBase64) {
          doc.addImage(watermarkBase64, 'PNG', centerX - 65, 110, 130, 130);
        }
      }
    });
  }

  // --- 12. UNIVERSAL OFFICIAL FOOTER & MULTI-PAGE NUMBERING ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Keasramaan Sekolah Rakyat 31 Palembang - Surat Panggilan Resmi (No: ${letterNo})`,
      leftMargin,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, rightX, pageHeight - 6.5, { align: "right" });
  }

  const safeFileName = `Surat_Panggilan_Ortu_Legal_${violation.studentName.replace(/\s+/g, '_')}_${options.summonsLevel ? options.summonsLevel.replace(/[^a-zA-Z0-9]/g, '_') : 'SP'}.pdf`;
  doc.save(safeFileName);
}

// --- 14. GENERATOR JURNAL PENGHUBUNG MATERI / TASK ORDER (A4 LANDSCAPE - FORMAT RESMI KEMENSOS) ---
export async function generateConnectingJournalPDF(
  journals: ConnectingJournal[],
  config: AppConfig,
  options?: {
    teacherName?: string;
    teacherNip?: string;
    printDate?: string;
    title?: string;
    targetClassFilter?: string;
    statusFilter?: string;
  }
) {
  if (!journals || journals.length === 0) {
    throw new Error('Tidak ada data jurnal yang dipilih untuk dicetak.');
  }

  // A4 Landscape: 297 mm x 210 mm
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const centerX = pageWidth / 2; // 148.5 mm
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin; // 282 mm

  let leftLogoBase64 = '';
  let rightLogoBase64 = '';
  let watermarkBase64 = '';

  try {
    leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
    rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
    if (leftLogoBase64) {
      watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config?.watermarkOpacity || 0.04);
    }
  } catch (e) {
    console.warn('Gagal memuat aset gambar logo untuk PDF Jurnal:', e);
  }

  // 1. Logos
  if (leftLogoBase64) {
    try {
      doc.addImage(leftLogoBase64, 'PNG', leftMargin, 8, 21, 21);
    } catch (e) {
      console.warn('Error rendering left logo:', e);
    }
  }
  if (rightLogoBase64) {
    try {
      doc.addImage(rightLogoBase64, 'PNG', rightX - 21, 8, 21, 21);
    } catch (e) {
      console.warn('Error rendering right logo:', e);
    }
  }

  // 2. Kop Surat
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  // Top header text lines
  const kopLines = [
    'KEMENTERIAN SOSIAL REPUBLIK INDONESIA',
    'SEKRETARIAT JENDERAL',
    'PUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI',
    'SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG'
  ];

  let yKop = 10;
  kopLines.forEach((line, index) => {
    doc.setFontSize(index === 3 ? 11 : 10);
    doc.text(line, centerX, yKop, { align: 'center' });
    yKop += 4.5;
  });

  // Sub-kop address line
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const addressLine =
    config?.kopKanan?.replace(/\n/g, ' | ') ||
    'Jl. Komp. Sosial, Km. 5, Kel. Sukabangun, Kec. Sukarami, Kota Palembang, Prov. Sumatera Selatan, Kode Pos 30151, email: srt31palembang@gmail.com';
  doc.text(addressLine, centerX, yKop, { align: 'center' });

  // Double line divider
  const lineY = yKop + 2.5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, lineY, rightX, lineY);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, lineY + 1.2, rightX, lineY + 1.2);

  // 3. Document Title
  let currentY = lineY + 7;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const titleText = options?.title || 'JURNAL PENGHUBUNG MATERI';
  doc.text(titleText, centerX, currentY, { align: 'center' });
  
  // Underline for title
  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line(centerX - titleWidth / 2, currentY + 1, centerX + titleWidth / 2, currentY + 1);

  // 4. Subheader Meta (Nama Guru on Left, Tanggal Cetak on Right)
  currentY += 6.5;
  const activeTeacher = options?.teacherName || (journals.length > 0 ? journals[0].teacherName : 'ARI FITRIYANI, S.PD., GR.');
  const rawPrintDate = options?.printDate || new Date().toISOString().split('T')[0];
  const formattedPrintDate = formatDateIndonesian(rawPrintDate, false);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left: Nama Guru
  doc.text('Nama Guru : ', leftMargin, currentY);
  const labelTeacherWidth = doc.getTextWidth('Nama Guru : ');
  doc.setFont('Helvetica', 'bold');
  doc.text(activeTeacher, leftMargin + labelTeacherWidth, currentY);
  const teacherValWidth = doc.getTextWidth(activeTeacher);
  doc.setLineWidth(0.2);
  doc.line(leftMargin + labelTeacherWidth, currentY + 0.8, leftMargin + labelTeacherWidth + teacherValWidth, currentY + 0.8);

  // Right: Tanggal Cetak
  doc.setFont('Helvetica', 'normal');
  const printDateLabel = 'Tanggal Cetak : ';
  const printDateVal = formattedPrintDate;
  doc.text(printDateLabel, rightX - 60, currentY);
  const labelPrintWidth = doc.getTextWidth(printDateLabel);
  doc.setFont('Helvetica', 'bold');
  doc.text(printDateVal, rightX - 60 + labelPrintWidth, currentY);
  const dateValWidth = doc.getTextWidth(printDateVal);
  doc.line(rightX - 60 + labelPrintWidth, currentY + 0.8, rightX - 60 + labelPrintWidth + dateValWidth, currentY + 0.8);

  currentY += 4.5;

  // 5. Table matching user sample structure
  const tableHead = [
    ['No', 'Tanggal', 'Target/Kelas', 'Mapel', 'Capaian Materi', 'Tindak Lanjut', 'Wali Asuh']
  ];

  const tableBody = journals.map((j, idx) => {
    const formattedDate = formatDateShort(j.date) || j.date;
    const mapelCell = `${j.subject || '-'}\nGuru: ${j.teacherName || '-'}`;
    
    let materiCell = j.learningAchievement || '-';
    if (j.taskOrder) {
      materiCell += `\n[Tugas Asrama]: ${j.taskOrder}`;
    }

    let tindakLanjutCell = j.followUp || '-';
    if (j.status === 'Menunggu Respon' && !j.followUp) {
      tindakLanjutCell = '(Menunggu tindak lanjut asrama)';
    }

    const waliCell = j.caretakerName || '-';

    return [
      idx + 1,
      formattedDate,
      j.targetClass || 'Klasikal (SD)',
      mapelCell,
      materiCell,
      tindakLanjutCell,
      waliCell
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // Soft slate/neutral light gray
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184]
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineWidth: 0.2,
      lineColor: [203, 213, 225],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 42 },
      4: { cellWidth: 88 },
      5: { cellWidth: 50 },
      6: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: leftMargin, right: rightMargin },
    didDrawPage: function () {
      if (watermarkBase64) {
        try {
          doc.addImage(watermarkBase64, 'PNG', centerX - 50, 60, 100, 100);
        } catch (e) {
          // ignore watermark error
        }
      }
    }
  });

  // 6. Signatures Section
  let finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 40;
  if (finalY + 36 > pageHeight - 12) {
    doc.addPage('a4', 'landscape');
    if (watermarkBase64) {
      try {
        doc.addImage(watermarkBase64, 'PNG', centerX - 50, 60, 100, 100);
      } catch (e) {}
    }
    finalY = 16;
  }

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left Signature: Kepala Sekolah
  doc.text('Mengetahui,', 25, finalY);
  doc.text('Kepala Sekolah', 25, finalY + 4);

  // Right Signature: Guru / Pembuat Laporan
  doc.text(`Palembang, ${formattedPrintDate}`, rightX - 70, finalY);
  doc.text('Pembuat Laporan,', rightX - 70, finalY + 4);

  // Names after space
  const nameY = finalY + 22;
  const kepsekName = config?.kepalaSekolah || 'Yuni Arsi, S.Pd';
  const kepsekNip = config?.kepalaSekolahNip || '197206051999032002';
  const teacherNip = options?.teacherNip || (journals.length > 0 && journals[0].teacherNip ? journals[0].teacherNip : '-');

  doc.setFont('Helvetica', 'bold');
  doc.text(kepsekName, 25, nameY);
  const kepsekWidth = doc.getTextWidth(kepsekName);
  doc.setLineWidth(0.2);
  doc.line(25, nameY + 0.8, 25 + kepsekWidth, nameY + 0.8);

  doc.text(activeTeacher, rightX - 70, nameY);
  const teacherWidth = doc.getTextWidth(activeTeacher);
  doc.line(rightX - 70, nameY + 0.8, rightX - 70 + teacherWidth, nameY + 0.8);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const nipPrefix = kepsekNip.startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`;
  doc.text(nipPrefix, 25, nameY + 4.2);

  const tNipStr = teacherNip && teacherNip !== '-' ? (teacherNip.startsWith('NIP') || teacherNip.startsWith('NRK') ? teacherNip : `NIP/NRK. ${teacherNip}`) : 'NIP/NRK. -';
  doc.text(tNipStr, rightX - 70, nameY + 4.2);

  // 7. Page numbering
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Jurnal Penghubung Materi Sekolah Rakyat 31 Palembang - Dokumen Kurikulum & Keasramaan Terpadu',
      leftMargin,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, rightX, pageHeight - 6.5, { align: 'right' });
  }

  const sanitizedTeacher = activeTeacher.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`Laporan_Jurnal_${sanitizedTeacher}_${rawPrintDate}.pdf`);
}

// --- 15. GENERATOR LEMBAR DISPOSISI RESMI PER TASK ORDER & CAPAIAN BELAJAR (A4 PORTRAIT) ---
export async function generateSingleConnectingJournalDispositionPDF(
  journal: ConnectingJournal,
  config: AppConfig,
  options?: {
    printDate?: string;
  }
) {
  if (!journal) {
    throw new Error('Data task order tidak ditemukan untuk dicetak.');
  }

  // A4 Portrait: 210 mm x 297 mm
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const centerX = pageWidth / 2; // 105 mm
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin; // 195 mm
  const contentWidth = rightX - leftMargin; // 180 mm

  let leftLogoBase64 = '';
  let rightLogoBase64 = '';
  let watermarkBase64 = '';

  try {
    leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
    rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
    if (leftLogoBase64) {
      watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config?.watermarkOpacity || 0.04);
    }
  } catch (e) {
    console.warn('Gagal memuat logo disposisi PDF:', e);
  }

  // 1. Logos
  if (leftLogoBase64) {
    try {
      doc.addImage(leftLogoBase64, 'PNG', leftMargin, 8, 18, 18);
    } catch (e) {}
  }
  if (rightLogoBase64) {
    try {
      doc.addImage(rightLogoBase64, 'PNG', rightX - 18, 8, 18, 18);
    } catch (e) {}
  }

  // 2. Kop Surat Kemensos
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const kopLines = [
    'KEMENTERIAN SOSIAL REPUBLIK INDONESIA',
    'SEKRETARIAT JENDERAL',
    'PUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI',
    'SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG'
  ];

  let yKop = 10;
  kopLines.forEach((line, index) => {
    doc.setFontSize(index === 3 ? 10.5 : 9);
    doc.text(line, centerX, yKop, { align: 'center' });
    yKop += 4.2;
  });

  // Sub-kop address line
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const addressLine =
    config?.kopKanan?.replace(/\n/g, ' | ') ||
    'Jl. Komp. Sosial, Km. 5, Kel. Sukabangun, Kec. Sukarami, Kota Palembang, Prov. Sumatera Selatan, Kode Pos 30151, email: srt31palembang@gmail.com';
  doc.text(addressLine, centerX, yKop, { align: 'center' });

  // Double line divider
  const lineY = yKop + 2.5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, lineY, rightX, lineY);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, lineY + 1.1, rightX, lineY + 1.1);

  // Watermark
  if (watermarkBase64) {
    try {
      doc.addImage(watermarkBase64, 'PNG', centerX - 45, 95, 90, 90);
    } catch (e) {}
  }

  // 3. Document Title & QR Code
  let currentY = lineY + 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleText = 'LEMBAR DISPOSISI TASK ORDER & CAPAIAN PEMBELAJARAN';
  doc.text(titleText, centerX, currentY, { align: 'center' });

  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.3);
  doc.line(centerX - titleWidth / 2, currentY + 1, centerX + titleWidth / 2, currentY + 1);

  currentY += 4.5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const docNumber = `No. Berkas: SR31/JP/${journal.id || 'DOC'}/${new Date().getFullYear()}`;
  doc.text(docNumber, centerX, currentY, { align: 'center' });

  // Generate Verification QR Code
  try {
    const qrData = `SR31-DISPOSISI|ID:${journal.id}|Tgl:${journal.date}|Mapel:${journal.subject}|Guru:${journal.teacherName}|Target:${journal.targetClass}|Status:${journal.status}|Wali:${journal.caretakerName || '-'}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', rightX - 22, currentY - 7, 20, 20);
  } catch (e) {
    console.error('QR Code Generation Error:', e);
  }

  currentY += 6;

  // 4. Meta Information Grid (Identity Table)
  const formattedDate = formatDateIndonesian(journal.date, false);
  const formattedDeadline = journal.deadline ? formatDateIndonesian(journal.deadline, false) : formattedDate;
  const isPending = journal.status === 'Menunggu Respon';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftMargin, currentY, contentWidth, 34, 2, 2, 'FD');

  const metaStartY = currentY + 5;
  doc.setFontSize(8);

  // Column 1
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Tanggal Pembelajaran', leftMargin + 4, metaStartY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${formattedDate}`, leftMargin + 38, metaStartY);

  doc.setFont('Helvetica', 'bold');
  doc.text('Target / Jenjang', leftMargin + 4, metaStartY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${journal.targetClass || 'Klasikal (SD)'}`, leftMargin + 38, metaStartY + 6);

  if (journal.studentName) {
    doc.setFont('Helvetica', 'bold');
    doc.text('Siswa Khusus', leftMargin + 4, metaStartY + 12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`:  ${journal.studentName} (${journal.studentId || '-'})`, leftMargin + 38, metaStartY + 12);
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.text('Cakupan Peserta', leftMargin + 4, metaStartY + 12);
    doc.setFont('Helvetica', 'normal');
    doc.text(':  Seluruh Siswa Rombel Asrama Terkait', leftMargin + 38, metaStartY + 12);
  }

  doc.setFont('Helvetica', 'bold');
  doc.text('Status Task Order', leftMargin + 4, metaStartY + 18);
  doc.setFont('Helvetica', 'bold');
  if (isPending) {
    doc.setTextColor(180, 83, 9);
    doc.text(':  MENUNGGU RESPON ASRAMA', leftMargin + 38, metaStartY + 18);
  } else {
    doc.setTextColor(22, 101, 52);
    doc.text(':  SUDAH DITINDAKLANJUTI WALI ASUH', leftMargin + 38, metaStartY + 18);
  }

  // Column 2
  doc.setTextColor(51, 65, 85);
  doc.setFont('Helvetica', 'bold');
  doc.text('Mata Pelajaran', leftMargin + 96, metaStartY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${journal.subject || '-'}`, leftMargin + 128, metaStartY);

  doc.setFont('Helvetica', 'bold');
  doc.text('Guru Pengampu', leftMargin + 96, metaStartY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${journal.teacherName || '-'}`, leftMargin + 128, metaStartY + 6);

  doc.setFont('Helvetica', 'bold');
  doc.text('NIP/NRK Guru', leftMargin + 96, metaStartY + 12);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${journal.teacherNip || '-'}`, leftMargin + 128, metaStartY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.text('Batas Waktu (Deadline)', leftMargin + 96, metaStartY + 18);
  doc.setFont('Helvetica', 'normal');
  doc.text(`:  ${formattedDeadline}`, leftMargin + 128, metaStartY + 18);

  currentY += 38;

  // 5. Section I: Capaian Materi Belajar
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('I. CAPAIAN MATERI PEMBELAJARAN (KURIKULUM SEKOLAH)', leftMargin, currentY);

  currentY += 3;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);

  const materiLines = doc.splitTextToSize(journal.learningAchievement || '-', contentWidth - 8);
  const materiBoxHeight = Math.max(24, materiLines.length * 4.2 + 8);
  doc.roundedRect(leftMargin, currentY, contentWidth, materiBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(materiLines, leftMargin + 4, currentY + 5.5);

  currentY += materiBoxHeight + 5;

  // 6. Section II: Instruksi Penugasan / Task Order Asrama
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('II. INSTRUKSI PENUGASAN ASRAMA (TASK ORDER GURU KEPADA WALI ASUH)', leftMargin, currentY);

  currentY += 3;
  doc.setFillColor(254, 243, 199, 0.35); // subtle amber
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);

  const taskText = journal.taskOrder || '(Tidak ada instruksi tugas tertulis khusus)';
  const taskLines = doc.splitTextToSize(taskText, contentWidth - 8);
  const taskBoxHeight = Math.max(22, taskLines.length * 4.2 + 8);
  doc.roundedRect(leftMargin, currentY, contentWidth, taskBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15);
  doc.text(taskLines, leftMargin + 4, currentY + 5.5);

  currentY += taskBoxHeight + 5;

  // 7. Section III: Respon & Tindak Lanjut Pendampingan Wali Asuh
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('III. LAPORAN TINDAK LANJUT & BIMBINGAN WALI ASUH DI ASRAMA', leftMargin, currentY);

  currentY += 3;
  doc.setFillColor(240, 253, 244, 0.4); // subtle emerald
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.3);

  let followUpText = journal.followUp || '';
  if (!followUpText) {
    followUpText = isPending
      ? '[BELUM DIRESPON] Menunggu pelaksanaan tindak lanjut pendampingan belajar asrama pada malam evaluasi.'
      : '-';
  }
  const followUpLines = doc.splitTextToSize(followUpText, contentWidth - 8);
  const followUpBoxHeight = Math.max(26, followUpLines.length * 4.2 + 12);
  doc.roundedRect(leftMargin, currentY, contentWidth, followUpBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 83, 45);
  doc.text(followUpLines, leftMargin + 4, currentY + 5.5);

  // Caretaker info inside bottom of box
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  const caretakerLabel = `Wali Asuh Pendamping: ${journal.caretakerName || '-'} | NIP/NRK: ${journal.caretakerNip || '-'} | Tanggal Respon: ${journal.responseDate ? formatDateIndonesian(journal.responseDate, false) : '-'}`;
  doc.text(caretakerLabel, leftMargin + 4, currentY + followUpBoxHeight - 3);

  currentY += followUpBoxHeight + 8;

  // 8. Signatures Section (3 Columns: Guru Pengampu, Wali Asuh, Kepala Sekolah)
  const rawPrintDate = options?.printDate || new Date().toISOString().split('T')[0];
  const formattedPrintDate = formatDateIndonesian(rawPrintDate, false);

  if (currentY + 40 > pageHeight - 12) {
    doc.addPage('a4', 'portrait');
    if (watermarkBase64) {
      try {
        doc.addImage(watermarkBase64, 'PNG', centerX - 45, 95, 90, 90);
      } catch (e) {}
    }
    currentY = 20;
  }

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const colWidth = contentWidth / 3;
  const col1X = leftMargin;
  const col2X = leftMargin + colWidth;
  const col3X = leftMargin + colWidth * 2;

  // Col 1: Guru Pengampu
  doc.text('Pembuat Task Order,', col1X + 4, currentY);
  doc.text('Guru Mata Pelajaran', col1X + 4, currentY + 4);

  // Col 2: Wali Asuh
  doc.text('Pelaksana Tindak Lanjut,', col2X + 4, currentY);
  doc.text('Wali Asuh / Pengasuh', col2X + 4, currentY + 4);

  // Col 3: Kepala Sekolah
  doc.text(`Palembang, ${formattedPrintDate}`, col3X + 4, currentY);
  doc.text('Kepala Sekolah', col3X + 4, currentY + 4);

  const nameY = currentY + 22;
  const kepsekName = config?.kepalaSekolah || 'Yuni Arsi, S.Pd';
  const kepsekNip = config?.kepalaSekolahNip || '197206051999032002';
  const teacherName = journal.teacherName || 'ARI FITRIYANI, S.PD., GR.';
  const teacherNip = journal.teacherNip || '-';
  const caretakerName = journal.caretakerName || 'M ARDIAN NUGRAHA';
  const caretakerNip = journal.caretakerNip || '-';

  // Guru
  doc.setFont('Helvetica', 'bold');
  doc.text(teacherName, col1X + 4, nameY);
  const tW = doc.getTextWidth(teacherName);
  doc.setLineWidth(0.2);
  doc.line(col1X + 4, nameY + 0.8, col1X + 4 + tW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP/NRK. ${teacherNip}`, col1X + 4, nameY + 4.2);

  // Wali Asuh
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(caretakerName, col2X + 4, nameY);
  const cW = doc.getTextWidth(caretakerName);
  doc.setLineWidth(0.2);
  doc.line(col2X + 4, nameY + 0.8, col2X + 4 + cW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP/NRK. ${caretakerNip}`, col2X + 4, nameY + 4.2);

  // Kepsek
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(kepsekName, col3X + 4, nameY);
  const kW = doc.getTextWidth(kepsekName);
  doc.setLineWidth(0.2);
  doc.line(col3X + 4, nameY + 0.8, col3X + 4 + kW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(kepsekNip.startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`, col3X + 4, nameY + 4.2);

  // Footer Note
  doc.setFontSize(7);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Dokumen Disposisi Resmi Terintegrasi Sekolah Rakyat 31 Palembang - Sah Dicetak & Divalidasi Sistem Digital',
    leftMargin,
    pageHeight - 6.5
  );
  doc.text('Halaman 1 dari 1', rightX, pageHeight - 6.5, { align: 'right' });

  const sanitizedMapel = (journal.subject || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`Disposisi_TaskOrder_${sanitizedMapel}_${journal.id || 'item'}.pdf`);
}

/**
 * Generate A4 Landscape PDF: Laporan Rekapitulasi Tracking Menstruasi, Masa Bersuci & Kesiapan Ibadah
 */
export async function generateMenstruationRecapPDF(
  records: MenstruationRecord[],
  config?: AppConfig,
  options?: {
    title?: string;
    filterDorm?: string;
    filterStatus?: string;
    printDate?: string;
    pembinaName?: string;
    pembinaNip?: string;
  }
) {
  if (!records || records.length === 0) {
    throw new Error('Tidak ada data menstruasi yang dipilih untuk dicetak.');
  }

  // A4 Landscape: 297 mm x 210 mm
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const centerX = pageWidth / 2;
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin;

  let leftLogoBase64 = '';
  let rightLogoBase64 = '';
  let watermarkBase64 = '';

  try {
    leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
    rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
    if (leftLogoBase64) {
      watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config?.watermarkOpacity || 0.04);
    }
  } catch (e) {
    console.warn('Gagal memuat logo PDF Menstruasi:', e);
  }

  // 1. Logos
  if (leftLogoBase64) {
    try {
      doc.addImage(leftLogoBase64, 'PNG', leftMargin, 8, 20, 20);
    } catch (e) {}
  }
  if (rightLogoBase64) {
    try {
      doc.addImage(rightLogoBase64, 'PNG', rightX - 20, 8, 20, 20);
    } catch (e) {}
  }

  // 2. Kop Surat Kemensos
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('KEMENTERIAN SOSIAL REPUBLIK INDONESIA', centerX, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.text('PUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI', centerX, 16.5, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text('SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG', centerX, 21, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Komp Sosial Km 5 Sukabangun, Palembang | Asrama Pembinaan Siswi & Pendampingan Ibadah', centerX, 25, { align: 'center' });

  // Divider Line
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, 27.5, rightX, 27.5);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 28.5, rightX, 28.5);

  // 3. Document Title
  let currentY = 35;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  const docTitle = options?.title || 'REKAPITULASI TRACKING MENSTRUASI, MASA BERSUCI & KESIAPAN IBADAH SISWI';
  doc.text(docTitle, centerX, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const subtitle = `Tahun Ajaran: ${config?.academicYear || '2025/2026'} (Semester ${config?.semester || 'Genap'}) | Unit: Asrama Putri`;
  doc.text(subtitle, centerX, currentY, { align: 'center' });

  // 4. Summary Badges Section
  currentY += 4;
  const sedangHaidCount = records.filter(r => r.status === 'Sedang Haid').length;
  const bersuciCount = records.filter(r => r.status === 'Masa Bersuci').length;
  const siapIbadahCount = records.filter(r => r.status === 'Suci / Siap Beribadah').length;
  const totalDaysCalc = records.filter(r => r.durationDays && r.durationDays > 0);
  const avgDays = totalDaysCalc.length > 0
    ? (totalDaysCalc.reduce((acc, curr) => acc + (curr.durationDays || 0), 0) / totalDaysCalc.length).toFixed(1)
    : '0';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, currentY, rightX - leftMargin, 11, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Catatan: ${records.length} Siswi`, leftMargin + 4, currentY + 7);
  doc.text(`|  Sedang Haid (Udzur): ${sedangHaidCount}`, leftMargin + 45, currentY + 7);
  doc.text(`|  Masa Bersuci (Mandi): ${bersuciCount}`, leftMargin + 95, currentY + 7);
  doc.text(`|  Suci Siap Sholat: ${siapIbadahCount}`, leftMargin + 145, currentY + 7);
  doc.text(`|  Rata-rata Durasi: ${avgDays} Hari`, leftMargin + 195, currentY + 7);

  // 5. Table of Menstruation Records
  const tableData = records.map((record, index) => {
    // Format start
    const startStr = record.startDate
      ? `${formatDateShort(record.startDate)}${record.startTime ? ' ' + record.startTime : ''}`
      : '-';

    // Format end
    const endStr = record.endDate
      ? `${formatDateShort(record.endDate)}${record.endTime ? ' ' + record.endTime : ''}`
      : (record.status === 'Sedang Haid' ? 'Masih Berlangsung' : '-');

    // Duration text
    let durStr = '-';
    if (record.durationText) {
      durStr = record.durationText;
    } else if (record.durationDays) {
      durStr = `${record.durationDays} Hari`;
    } else if (record.status === 'Sedang Haid' && record.startDate) {
      const sDate = new Date(record.startDate).getTime();
      const nDate = new Date().getTime();
      const days = Math.max(1, Math.ceil((nDate - sDate) / (1000 * 60 * 60 * 24)));
      durStr = `Hari ke-${days}`;
    }

    // Purification details
    const thaharahStr = record.purificationDate
      ? `${formatDateShort(record.purificationDate)} (${record.purificationTime || '-'})`
      : (record.status === 'Masa Bersuci' ? 'Dalam Persiapan Mandi' : '-');

    // Status label
    let statusLabel = record.status;
    if (record.status === 'Suci / Siap Beribadah') {
      statusLabel = 'SUCI - SIAP SHOLAT';
    } else if (record.status === 'Sedang Haid') {
      statusLabel = 'SEDANG HAID (UDZUR)';
    } else if (record.status === 'Masa Bersuci') {
      statusLabel = 'MASA BERSUCI (THAHARAH)';
    }

    // Symptoms / Notes
    let notesCombined = '';
    if (record.symptoms && record.symptoms.length > 0) {
      notesCombined += `[Gejala: ${record.symptoms.join(', ')}] `;
    }
    if (record.medicineOrCare) {
      notesCombined += `[Care: ${record.medicineOrCare}] `;
    }
    if (record.notes) {
      notesCombined += record.notes;
    }
    if (!notesCombined) notesCombined = '-';

    return [
      (index + 1).toString(),
      record.studentName || '-',
      `${record.class || '-'} / ${record.dorm || 'Asrama Putri'}`,
      startStr,
      endStr,
      durStr,
      thaharahStr,
      statusLabel,
      notesCombined
    ];
  });

  autoTable(doc, {
    startY: currentY + 14,
    head: [[
      'No',
      'Nama Siswi',
      'Kelas / Asrama',
      'Mulai Haid',
      'Selesai Haid',
      'Catatan Durasi',
      'Mandi Bersuci',
      'Status Ibadah',
      'Keluhan / Penanganan / Catatan'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Red-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 26, halign: 'center' },
      7: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 'auto' }
    },
    margin: { left: leftMargin, right: rightMargin },
    didDrawPage: function () {
      if (watermarkBase64) {
        try {
          doc.addImage(watermarkBase64, 'PNG', centerX - 50, 60, 100, 100);
        } catch (e) {}
      }
    }
  });

  // 6. Signatures Section
  let finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 50;
  if (finalY + 36 > pageHeight - 12) {
    doc.addPage('a4', 'landscape');
    if (watermarkBase64) {
      try {
        doc.addImage(watermarkBase64, 'PNG', centerX - 50, 60, 100, 100);
      } catch (e) {}
    }
    finalY = 18;
  }

  const printDateStr = options?.printDate ? formatDateIndonesian(options.printDate) : formatDateIndonesian(new Date().toISOString().split('T')[0]);
  const colWidth = (rightX - leftMargin) / 3;
  const col1X = leftMargin;
  const col2X = leftMargin + colWidth;
  const col3X = leftMargin + colWidth * 2;

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Col 1: Pembina Asrama Putri
  doc.text('Mengetahui / Pencatat,', col1X + 4, finalY);
  doc.text('Pembina Asrama Putri / Guru Fiqih', col1X + 4, finalY + 4);

  // Col 2: Wali Asrama Mandiri
  doc.text('Menyetujui,', col2X + 4, finalY);
  doc.text('Wali Asrama Mandiri', col2X + 4, finalY + 4);

  // Col 3: Kepala Sekolah
  doc.text(`Palembang, ${printDateStr}`, col3X + 4, finalY);
  doc.text('Kepala Sekolah', col3X + 4, finalY + 4);

  const nameY = finalY + 22;
  const kepsekName = config?.kepalaSekolah || 'Yuni Arsi, S.Pd';
  const kepsekNip = config?.kepalaSekolahNip || '197206051999032002';
  const waliAsramaName = config?.waliAsrama || 'Hisnul Hashin, SE';
  const waliAsramaNip = config?.waliAsramaNip || 'NIP. 197406262025211027';
  const pembinaName = options?.pembinaName || 'ULPA JAYANTI';
  const pembinaNip = options?.pembinaNip || 'NIP. 199412032026222001';

  // Pembina
  doc.setFont('Helvetica', 'bold');
  doc.text(pembinaName, col1X + 4, nameY);
  const pW = doc.getTextWidth(pembinaName);
  doc.setLineWidth(0.2);
  doc.line(col1X + 4, nameY + 0.8, col1X + 4 + pW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${pembinaNip.replace(/^NIP\.?\s*/i, '')}`, col1X + 4, nameY + 4.2);

  // Wali Asrama
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(waliAsramaName, col2X + 4, nameY);
  const wW = doc.getTextWidth(waliAsramaName);
  doc.setLineWidth(0.2);
  doc.line(col2X + 4, nameY + 0.8, col2X + 4 + wW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(waliAsramaNip.startsWith('NIP') ? waliAsramaNip : `NIP. ${waliAsramaNip}`, col2X + 4, nameY + 4.2);

  // Kepsek
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(kepsekName, col3X + 4, nameY);
  const kW = doc.getTextWidth(kepsekName);
  doc.setLineWidth(0.2);
  doc.line(col3X + 4, nameY + 0.8, col3X + 4 + kW, nameY + 0.8);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(kepsekNip.startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`, col3X + 4, nameY + 4.2);

  // Footer Note
  doc.setFontSize(7);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Dokumen Tracking Menstruasi & Kesiapan Ibadah - Sistem Terintegrasi Sekolah Rakyat 31 Palembang',
    leftMargin,
    pageHeight - 6.5
  );
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, rightX, pageHeight - 6.5, { align: 'right' });

  doc.save(`Rekapitulasi_Tracking_Menstruasi_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate Single Student Menstruation & Worship Card (A4 Portrait)
 */
export async function generateSingleStudentMenstruationCardPDF(
  student: Student,
  records: MenstruationRecord[],
  config?: AppConfig,
  options?: {
    printDate?: string;
  }
) {
  // A4 Portrait: 210 mm x 297 mm
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const centerX = pageWidth / 2;
  const leftMargin = 15;
  const rightMargin = 15;
  const rightX = pageWidth - rightMargin;
  const contentWidth = rightX - leftMargin;

  let leftLogoBase64 = '';
  let rightLogoBase64 = '';
  let watermarkBase64 = '';

  try {
    leftLogoBase64 = await loadLogoImage(config?.logoKiriUrl || '', 'left');
    rightLogoBase64 = await loadLogoImage(config?.logoKananUrl || '', 'right');
    if (leftLogoBase64) {
      watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config?.watermarkOpacity || 0.04);
    }
  } catch (e) {
    console.warn('Gagal memuat logo kartu siswi PDF:', e);
  }

  // 1. Logos
  if (leftLogoBase64) {
    try {
      doc.addImage(leftLogoBase64, 'PNG', leftMargin, 8, 18, 18);
    } catch (e) {}
  }
  if (rightLogoBase64) {
    try {
      doc.addImage(rightLogoBase64, 'PNG', rightX - 18, 8, 18, 18);
    } catch (e) {}
  }

  // 2. Kop Surat Kemensos
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('KEMENTERIAN SOSIAL REPUBLIK INDONESIA', centerX, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.text('PUSAT PENDIDIKAN PELATIHAN DAN PENGEMBANGAN PROFESI', centerX, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text('SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG', centerX, 20.5, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Komp Sosial Km 5 Sukabangun, Palembang | Kartu Kontrol Menstruasi & Kesiapan Ibadah', centerX, 24.5, { align: 'center' });

  // Divider Line
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, 26.5, rightX, 26.5);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 27.5, rightX, 27.5);

  let currentY = 34;

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('KARTU KONTROL MENSTRUASI & KESIAPAN IBADAH SISWI', centerX, currentY, { align: 'center' });

  currentY += 4;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID Berkas: KM-${student.id}-${new Date().getFullYear()}`, centerX, currentY, { align: 'center' });

  // Student Identity Box
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Nama Siswi : ${student.name.toUpperCase()}`, leftMargin + 4, currentY + 6);
  doc.text(`NISN / ID  : ${student.id}`, leftMargin + 4, currentY + 11.5);
  doc.text(`Tingkat    : Kelas ${student.class}`, leftMargin + 4, currentY + 17);

  doc.text(`Asrama      : ${student.dorm || 'Asrama Putri'}`, leftMargin + 95, currentY + 6);
  doc.text(`Wali Asuh   : ${student.caretaker || '-'}`, leftMargin + 95, currentY + 11.5);
  const latestRec = records[0];
  const activeStatus = latestRec ? latestRec.status : 'Suci / Siap Beribadah';
  doc.text(`Status Saat Ini: ${activeStatus}`, leftMargin + 95, currentY + 17);

  // Table of Cycles
  const tableRows = records.map((r, i) => {
    const start = r.startDate ? `${formatDateShort(r.startDate)} ${r.startTime || ''}` : '-';
    const end = r.endDate ? `${formatDateShort(r.endDate)} ${r.endTime || ''}` : (r.status === 'Sedang Haid' ? 'Berlangsung' : '-');
    const dur = r.durationText || (r.durationDays ? `${r.durationDays} Hari` : '-');
    const mandi = r.purificationDate ? `${formatDateShort(r.purificationDate)} ${r.purificationTime || ''}` : '-';
    return [
      (i + 1).toString(),
      start,
      end,
      dur,
      mandi,
      r.status === 'Suci / Siap Beribadah' ? 'SIAP SHOLAT' : r.status,
      r.notes || (r.symptoms ? r.symptoms.join(', ') : '-')
    ];
  });

  autoTable(doc, {
    startY: currentY + 26,
    head: [[
      'No',
      'Mulai Haid',
      'Selesai Haid',
      'Durasi Waktu',
      'Mandi Bersuci',
      'Status Ibadah',
      'Catatan / Penanganan'
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', 'Belum ada catatan siklus tersimpan', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 'auto' }
    },
    margin: { left: leftMargin, right: rightMargin },
    didDrawPage: function () {
      if (watermarkBase64) {
        try {
          doc.addImage(watermarkBase64, 'PNG', centerX - 45, 95, 90, 90);
        } catch (e) {}
      }
    }
  });

  // Fiqih Education Note Box
  let finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 140;
  if (finalY + 55 > pageHeight - 15) {
    doc.addPage('a4', 'portrait');
    finalY = 20;
  }

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(leftMargin, finalY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('KETENTUAN FIQIH HAID & THAHARAH (BERSUCI) ASRAMA PUTRI:', leftMargin + 4, finalY + 5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Masa Haid: Minimal 24 jam (1 hari 1 malam), umumnya 6-7 hari, dan maksimal 15 hari 15 malam.', leftMargin + 4, finalY + 9.5);
  doc.text('2. Tanda Suci: Berhentinya darah ditandai dengan cairan putih bening (qasshah baidha\') atau kering (jafaf).', leftMargin + 4, finalY + 13.5);
  doc.text('3. Kewajiban Mandi Wajib: Setelah suci, siswi wajib segera mandi thaharah dan kembali melaksanakan sholat & puasa.', leftMargin + 4, finalY + 17.5);

  // Signatures
  const signY = finalY + 28;
  const printDateStr = options?.printDate ? formatDateIndonesian(options.printDate) : formatDateIndonesian(new Date().toISOString().split('T')[0]);

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const colW = contentWidth / 2;
  // Col 1: Pembina
  doc.text('Mengetahui / Memvalidasi,', leftMargin + 6, signY);
  doc.text('Pembina Asrama Putri / Guru Pendamping', leftMargin + 6, signY + 4);

  // Col 2: Kepala Sekolah
  doc.text(`Palembang, ${printDateStr}`, leftMargin + colW + 6, signY);
  doc.text('Kepala Sekolah', leftMargin + colW + 6, signY + 4);

  const nameYPos = signY + 20;
  const kepsekName = config?.kepalaSekolah || 'Yuni Arsi, S.Pd';
  const kepsekNip = config?.kepalaSekolahNip || '197206051999032002';
  const pembinaName = student.caretaker || 'ULPA JAYANTI';

  doc.setFont('Helvetica', 'bold');
  doc.text(pembinaName, leftMargin + 6, nameYPos);
  doc.text(kepsekName, leftMargin + colW + 6, nameYPos);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Pembina Asrama Putri', leftMargin + 6, nameYPos + 4);
  doc.text(kepsekNip.startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`, leftMargin + colW + 6, nameYPos + 4);

  doc.save(`Kartu_Menstruasi_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}







