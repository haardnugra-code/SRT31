import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Student, DailyJournal, Leave, ReportCardData, AppConfig, Violation, Counseling, MedicalRecord } from '../types';
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
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
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

    ctx.fillStyle = '#f59e0b';
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
    headStyles: { fillColor: [22, 163, 74], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === "Tuntas") {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
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

// --- 2. SURAT IZIN KEPULANGAN SISWA ASRAMA PDF ---
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
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("SURAT IZIN KEPULANGAN SISWA ASRAMA", 105, titleY, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const letterNo =
    leave.letterNumber ||
    `0${leave.id.slice(-3)}/SR-ASRAMA/IZIN/${new Date().getFullYear()}`;
  doc.text(`Nomor: ${letterNo}`, 105, titleY + 5.5, { align: "center" });

  // Opening Paragraph
  let contentY = titleY + 14;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const introText =
    "Yang bertanda tangan di bawah ini, Pengelola Keasramaan Sekolah Rakyat, menerangkan dan memberikan izin kepulangan / keluar dari lingkungan asrama kepada peserta didik berikut:";
  const wrappedIntro = doc.splitTextToSize(introText, 182);
  doc.text(wrappedIntro, 14, contentY);
  contentY += wrappedIntro.length * 4.5 + 4;

  // Student & Leave Detail Table
  const leaveTimeStr = leave.leaveTime ? ` (Pukul ${leave.leaveTime} WIB)` : '';
  const returnTimeStr = leave.returnTime ? ` (Pukul ${leave.returnTime} WIB)` : '';

  autoTable(doc, {
    body: [
      ["1. Nama Peserta Didik", `: ${leave.studentName}`],
      ["2. NISN / ID Siswa", `: ${leave.studentId}`],
      ["3. Kelas & Asrama", `: ${student ? `Kelas ${student.class} - Asrama ${student.dorm}` : 'Siswa Terdaftar'}`],
      ["4. Wali Asuh Pendamping", `: ${leave.caretaker}`],
      ["5. Kategori Perizinan", `: ${leave.type}`],
      ["6. Keperluan / Alasan", `: ${leave.reason}`],
      ["7. Alamat Tujuan Pulang", `: ${leave.destinationAddress || 'Alamat Domisili Orang Tua / Wali'}`],
      ["8. No. Kontak HP Ortu/Wali", `: ${leave.parentContact || 'Terdaftar di File Induk Siswa'}`],
      ["9. Penjemput / Pengawal", `: ${leave.pickupPerson || 'Orang Tua / Wali Siswa'}`],
      ["10. Waktu Keberangkatan", `: ${formatDateIndonesian(leave.leaveDate, true)}${leaveTimeStr}`],
      ["11. Target Waktu Kembali", `: ${formatDateIndonesian(leave.returnDate, true)}${returnTimeStr}`]
    ],
    startY: contentY,
    theme: 'plain',
    styles: { fontSize: 8.8, cellPadding: 1.8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'normal' }
    },
    margin: { left: 16, right: 14 },
    pageBreak: 'avoid'
  });

  contentY = (doc as any).lastAutoTable.finalY + 6;

  // Box / Rules Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("KETENTUAN DAN KEWAJIBAN SISWA SELAMA MASA PERIZINAN:", 14, contentY);
  contentY += 4.5;

  const rules = [
    "1. Peserta didik wajib menjaga akhlak, norma, dan nama baik Sekolah Rakyat serta Asrama selama berada di luar lingkungan sekolah.",
    "2. Peserta didik wajib kembali ke asrama tepat waktu sesuai dengan target tanggal dan jam kembali yang telah ditetapkan di atas.",
    "3. Apabila terjadi keterlambatan karena kondisi darurat atau sakit, Orang Tua / Wali WAJIB melaporkan ke Wali Asuh / Wali Asrama sebelum masa izin berakhir.",
    "4. Setibanya kembali di asrama, peserta didik wajib segera melapor ke Piket Pengasuh Asrama untuk verifikasi kedatangan dan penyerahan Surat Izin ini."
  ];

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  rules.forEach((rule) => {
    const wrappedRule = doc.splitTextToSize(rule, 180);
    doc.text(wrappedRule, 14, contentY);
    contentY += wrappedRule.length * 3.8 + 1;
  });

  contentY += 5;

  // Closing sentence
  const closingText =
    "Demikian Surat Izin Kepulangan ini diterbitkan secara resmi untuk dipergunakan sebagaimana mestinya dengan penuh rasa tanggung jawab.";
  const wrappedClosing = doc.splitTextToSize(closingText, 182);
  doc.text(wrappedClosing, 14, contentY);
  contentY += wrappedClosing.length * 4 + 8;

  // Ensure contentY leaves enough space for signature block
  if (contentY > 225) {
    contentY = 225;
  }

  const sigY = contentY;

  // Left Signature: Wali Asuh
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Menyetujui,", 25, sigY);
  doc.setFont("Helvetica", "bold");
  doc.text("Wali Asuh Pendamping,", 25, sigY + 4.5);

  const leftNameY = sigY + 28;
  doc.text(`( ${leave.caretaker} )`, 25, leftNameY);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NIP/NIK. ${leave.caretakerNip || '.........................'}`,
    25,
    leftNameY + 4
  );

  // Right Signature: Wali Asrama Mandiri
  const dateStr = formatDateIndonesian(leave.leaveDate || new Date());
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Palembang, ${dateStr}`, 135, sigY);
  doc.text("Mengetahui & Mengesahkan,", 135, sigY + 4.5);
  doc.setFont("Helvetica", "bold");
  doc.text("Wali Asrama Mandiri,", 135, sigY + 9);

  const rightNameY = sigY + 28;
  const dormMasterName =
    leave.dormMaster || config?.waliAsrama || 'Wali Asrama Mandiri';
  const dormMasterNip =
    leave.dormMasterNip || config?.waliAsramaNip || '.........................';

  doc.text(`( ${dormMasterName} )`, 135, rightNameY);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${dormMasterNip}`, 135, rightNameY + 4);

  // Stamp Box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(88, sigY + 8, 28, 22);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("CAP STAMPEL", 102, sigY + 17, { align: "center" });
  doc.text("KEASRAMAAN", 102, sigY + 21, { align: "center" });

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen resmi ini diterbitkan secara elektronik oleh Sistem Informasi Keasramaan Sekolah Rakyat - ${new Date().toLocaleString('id-ID')}`,
    105,
    285,
    { align: "center" }
  );

  doc.save(`Surat_Izin_Pulang_${leave.studentName.replace(/\s+/g, '_')}.pdf`);
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
        styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', cellPadding: 2 }
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
    headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold', fontSize: 8.5 },
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
  doc.text("Wali Asrama,", 140, sigY + 11);

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

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(220, 38, 38);
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
    doc.setFillColor(30, 41, 59);
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
    v.date || "",
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
    c.date || "",
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
    headStyles: { fillColor: [245, 158, 11] },
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
    l.leaveDate,
    l.returnDate,
    l.status
  ]);

  autoTable(doc, {
    head: [["Nama Siswa", "Tipe Izin", "Alasan Kepulangan", "Tgl Pergi", "Tgl Kembali", "Status"]],
    body: leaveRows,
    startY: 32,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
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
      headStyles: { fillColor: [190, 18, 60] },
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

  const cTitle = signatory?.caretakerTitle || "Wali Asrama Mandiri / Wali Asuh,";
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

// --- 6. SURAT PEMBERITAHUAN PELANGGARAN KEPADA ORANG TUA ---
export async function generateViolationNoticePDF(
  violation: Violation,
  student: Student | undefined,
  config: AppConfig
) {
  // Standard A4 page (210mm x 297mm) calibrated to strictly fit on 1 PAGE
  const doc = new jsPDF('p', 'mm', 'a4');
  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity || 0.04);

  // Watermark centered on A4
  if (watermarkBase64) {
    doc.addImage(watermarkBase64, 'PNG', 55, 95, 100, 100);
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
  const docNum = `Nomor: ${violation.id.toUpperCase()}/SRT31/DISIPLIN/${new Date().getFullYear()}`;
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
    pageBreak: 'avoid'
  });

  contentY = (doc as any).lastAutoTable.finalY + 5;

  doc.setFont("Helvetica", "normal");
  const statementText = "Telah melakukan tindakan pelanggaran terhadap Peraturan & Tata Tertib Keasramaan dengan rincian data laporan sebagai berikut:";
  const wrappedStatement = doc.splitTextToSize(statementText, 180);
  doc.text(wrappedStatement, 15, contentY);
  contentY += wrappedStatement.length * 4.5 + 3;

  // Violation Details Table
  const formattedDate = formatDateIndonesian(violation.date, true);

  autoTable(doc, {
    head: [["RINCIAN LAPORAN PELANGGARAN", "KETERANGAN HASIL PENCATATAN"]],
    body: [
      ["Hari & Tanggal Pelanggaran", formattedDate],
      ["Kategori / Tingkat Pelanggaran", `Tingkat ${violation.level}`],
      ["Bentuk / Jenis Pelanggaran", violation.violation],
      ["Sanksi / Tindakan Disiplin", violation.sanction],
      ["Catatan Tambahan Asrama", violation.note || "Tidak ada catatan khusus."],
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
    pageBreak: 'avoid'
  });

  contentY = (doc as any).lastAutoTable.finalY + 6;

  // Closing Paragraph
  const closingText = "Demikian surat pemberitahuan ini kami sampaikan. Besar harapan kami agar Bapak/Ibu Orang Tua/Wali dapat turut serta memberikan perhatian, bimbingan, serta kerja sama yang baik demi pembentukan karakter dan kebaikan peserta didik di masa mendatang. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.";
  const wrappedClosing = doc.splitTextToSize(closingText, 180);
  doc.text(wrappedClosing, 15, contentY);
  contentY += wrappedClosing.length * 4.5 + 8;

  // Signatures Section (Formatted for complete TTD)
  const dateStr = new Date(violation.date || new Date()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Palembang, ${dateStr}`, 135, contentY);

  // Row 1 Signatures: Orang Tua/Wali & Tim Disiplin/Wali Asuh
  const row1Y = contentY + 5;
  doc.text("Mengetahui / Memahami,", 20, row1Y);
  doc.text("Orang Tua / Wali Siswa,", 20, row1Y + 4.5);

  doc.text("Tim Disiplin / Wali Asuh,", 135, row1Y);
  doc.text("Sekolah Rakyat Terpadu 31,", 135, row1Y + 4.5);

  // TTD Space (20mm)
  doc.setFont("Helvetica", "bold");
  doc.text("( .................................................... )", 20, row1Y + 28);
  doc.text(`( ${student?.caretaker || violation.reporter} )`, 135, row1Y + 28);

  doc.save(`Surat_Pemberitahuan_Pelanggaran_${violation.studentName.replace(/\s+/g, '_')}_${violation.date}.pdf`);
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
    headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'avoid'
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
    headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'avoid'
  });

  contentY = (doc as any).lastAutoTable.finalY + 6;

  // Closing Paragraph
  const closingText =
    "Demikian Surat Keterangan Izin Sakit & Rekam Medis ini diterbitkan oleh tim kesehatan UKS untuk dipergunakan sebagaimana mestinya demi keselamatan, kesehatan, dan pemulihan peserta didik.";
  const wrappedClosing = doc.splitTextToSize(closingText, 180);
  doc.text(wrappedClosing, 15, contentY);
  contentY += wrappedClosing.length * 4.5 + 8;

  // Signatures Section
  const dateStr = formatDateIndonesian(record.date || new Date().toISOString().split('T')[0], true);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);

  const row1Y = contentY;
  doc.text("Mengetahui,", 20, row1Y);
  doc.text("Wali Asrama / Pembina Keasramaan,", 20, row1Y + 4.5);

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

  // Background Canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(offsetX, offsetY, w, h, 'F');

  // Decorative Outer Border
  doc.setDrawColor(30, 58, 138); // Deep Blue
  doc.setLineWidth(0.6);
  doc.rect(offsetX + 1, offsetY + 1, w - 2, h - 2, 'S');

  // Top Banner Header
  doc.setFillColor(30, 58, 138); // Deep Blue
  doc.rect(offsetX + 1, offsetY + 1, w - 2, 12, 'F');

  // Gold Accent Strip
  doc.setFillColor(217, 119, 6); // Gold
  doc.rect(offsetX + 1, offsetY + 13, w - 2, 0.8, 'F');

  // Load logo
  try {
    const logoData = await loadLogoImage(config.logoKiriUrl || '', 'left');
    if (logoData) {
      doc.addImage(logoData, 'PNG', offsetX + 2.5, offsetY + 2, 9, 9);
    }
  } catch (e) {
    console.error(e);
  }

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  const rawKop = config.kopKiri ? config.kopKiri.split('\n')[0] : 'KARTU TANDA SISWA ASRAMA';
  const appTitle = (rawKop || 'KARTU TANDA SISWA ASRAMA').toUpperCase();
  doc.text(appTitle, offsetX + 13, offsetY + 5.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(224, 231, 255);
  const instName = config.kopKiri && config.kopKiri.split('\n')[1] ? config.kopKiri.split('\n')[1] : 'PONDOK PESANTREN / ASRAMA TERPADU';
  doc.text(instName, offsetX + 13, offsetY + 9.5);

  // Photo / QR Box (Left side)
  const photoX = offsetX + 3.5;
  const photoY = offsetY + 16.5;
  const photoW = 18;
  const photoH = 22;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'FD');

  // Render Real QR Code inside Photo Box
  let hasQrCode = false;
  try {
    const studentQrId = String(student.id || '').trim();
    if (studentQrId) {
      const qrDataUrl = await QRCode.toDataURL(studentQrId, {
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#020617', light: '#ffffff' }
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
    doc.setTextColor(30, 58, 138);
    const initialLetter = student.name ? student.name.charAt(0).toUpperCase() : 'S';
    doc.text(initialLetter, photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(30, 58, 138);
  doc.text('QR ABSENSI', photoX + photoW / 2, photoY + photoH - 1.2, { align: 'center' });

  // Student Details Section (Right side)
  const detailsX = photoX + photoW + 3.5;
  let lineY = offsetY + 18.5;

  // Student Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const truncatedName = doc.splitTextToSize(student.name || 'Nama Siswa', w - detailsX - 3);
  doc.text(truncatedName[0], detailsX, lineY);
  lineY += 4.2;

  // NISN / Student ID
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text('NISN / ID:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(student.id || '-', detailsX + 11, lineY);
  lineY += 3.8;

  // Class & Dorm
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kelas/Jenjang:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${student.class} (${student.dorm || 'Asrama'})`, detailsX + 15, lineY);
  lineY += 3.8;

  // Wali Asuh
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Wali Asuh:', detailsX, lineY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const rawCaretaker = student.caretaker ? String(student.caretaker).trim() : '';
  const caretakerText = rawCaretaker ? (rawCaretaker.length > 22 ? rawCaretaker.substring(0, 22) + '...' : rawCaretaker) : '-';
  doc.text(caretakerText, detailsX + 11, lineY);
  lineY += 4.2;

  // RFID Tag Badge
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.setLineWidth(0.2);
  doc.roundedRect(detailsX, lineY - 2.5, 38, 5, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(4, 120, 87); // emerald-700
  const rfidDisplay = student.rfidTag ? `RFID UID: ${student.rfidTag}` : 'SMART RFID CARD ENABLED';
  doc.text(rfidDisplay, detailsX + 2, lineY + 0.8);

  // Bottom Footer Bar
  const footerY = offsetY + h - 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(offsetX + 1, footerY, w - 2, 9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(offsetX + 1, footerY, offsetX + w - 1, footerY);

  // Simulated Barcode lines for RFID ID
  const bcX = offsetX + 3.5;
  const bcY = footerY + 1.5;
  doc.setFillColor(30, 41, 59);
  const barPattern = [1, 0.5, 1.5, 0.5, 1, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1.5, 0.5, 1, 0.5, 2, 1, 0.5, 1.5, 0.5];
  let curX = bcX;
  for (const bw of barPattern) {
    doc.rect(curX, bcY, bw * 0.6, 4.5, 'F');
    curX += bw * 0.6 + 0.4;
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`*${student.id}*`, bcX + 1, bcY + 6.5);

  // Card Validity / Security Note
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(30, 58, 138);
  doc.text('KARTU RESMI ASRAMA', offsetX + w - 3.5, footerY + 3.5, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(148, 163, 184);
  doc.text('Harap dibawa setiap kegiatan & presisi RFID', offsetX + w - 3.5, footerY + 6.5, { align: 'right' });
}



