import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, DailyJournal, Leave, ReportCardData, AppConfig, Violation, Counseling, MedicalRecord } from '../types';

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
    `Palembang, ${new Date(journal.date || new Date()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`,
    140,
    actualSigY
  );
  doc.text("Mengevaluasi,", 140, actualSigY + 5);
  doc.text("Wali Asuh Pendamping,", 140, actualSigY + 10);

  doc.setFont("Helvetica", "bold");
  doc.text(`( ${student ? student.caretaker : ""} )`, 140, actualSigY + 28);

  doc.save(`Jurnal_Ceklist_${student ? student.name.replace(/\s+/g, '_') : 'Siswa'}_${journal.date}.pdf`);
}

// --- 2. TIKET IZIN PULANG PDF ---
export function printLeavePassPDF(leave: Leave, student: Student | undefined) {
  const doc = new jsPDF('l', 'mm', [160, 100]);

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 160, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TIKET IZIN KELUAR ASRAMA - SEKOLAH RAKYAT", 80, 13, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  doc.setFont("Helvetica", "bold"); doc.text("ID Tiket", 10, 30);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.id.toUpperCase()}`, 40, 30);
  doc.setFont("Helvetica", "bold"); doc.text("Nama Siswa", 10, 37);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.studentName}`, 40, 37);
  doc.setFont("Helvetica", "bold"); doc.text("NISN", 10, 44);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.studentId}`, 40, 44);
  doc.setFont("Helvetica", "bold"); doc.text("Kelas/Asrama", 10, 51);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${student ? `${student.class} - ${student.dorm}` : ""}`, 40, 51);
  doc.setFont("Helvetica", "bold"); doc.text("Kategori Izin", 10, 58);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.type} (${leave.reason})`, 40, 58);
  doc.setFont("Helvetica", "bold"); doc.text("Tgl Pergi", 10, 65);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.leaveDate}`, 40, 65);
  doc.setFont("Helvetica", "bold"); doc.text("Tgl Kembali", 10, 72);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.returnDate}`, 40, 72);
  doc.setFont("Helvetica", "bold"); doc.text("Wali Asuh", 10, 79);
  doc.setFont("Helvetica", "normal"); doc.text(`: ${leave.caretaker}`, 40, 79);

  doc.setLineWidth(0.5);
  doc.setDrawColor(150, 150, 150);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(115, 25, 115, 90);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text("VALIDASI KELUAR", 137, 35, { align: "center" });
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(30, 41, 59);
  doc.rect(122, 40, 30, 30);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("CAP ASRAMA", 137, 56, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Dicetak otomatis oleh Sistem Asrama SR - ${new Date().toLocaleString('id-ID')}`, 80, 96, { align: "center" });

  doc.save(`Tiket_Izin_${leave.studentName.replace(/\s+/g, '_')}.pdf`);
}

// --- 3. RAPOR KEASRAMAAN PDF ---
export async function printReportCardPDF(
  student: Student,
  repData: ReportCardData,
  violations: Violation[],
  config: AppConfig
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const leftLogoBase64 = await loadLogoImage(config.logoKiriUrl, 'left');
  const rightLogoBase64 = await loadLogoImage(config.logoKananUrl, 'right');
  const watermarkBase64 = await generateWatermarkBase64(leftLogoBase64, config.watermarkOpacity);

  const customCaretakerName = repData.customCaretaker || student.caretaker || "";
  const customCaretakerNip = repData.customCaretakerNip || "";
  const displaySemester = repData.semester || config.semester || "Genap";
  const displayAcademicYear = repData.academicYear || config.academicYear || "2025/2026";

  let currentPage = 1;

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

  const tableRows: any[] = [];
  RAPOR_STRUCTURE.forEach((cat) => {
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
    margin: { left: 15, right: 15, top: 22, bottom: 25 },
    didDrawPage: function (data) {
      if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
      doc.setFontSize(8);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Rapor Keasramaan SRT31 Palembang - Semester ${displaySemester} TA ${displayAcademicYear}`, 15, 287);
      doc.text(`Halaman ${currentPage}`, 195, 287, { align: "right" });
      currentPage++;
      if (data.pageNumber > 1) {
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Rapor Keasramaan: ${student.name} (${student.id})`, 15, 12);
        doc.setLineWidth(0.1);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 14, 195, 14);
      }
    }
  });

  doc.addPage();
  if (watermarkBase64) doc.addImage(watermarkBase64, 'PNG', 55, 98, 100, 100);
  let finalY = 20;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("EVALUASI RIWAYAT KEDISIPLINAN & PELANGGARAN ASRAMA", 15, finalY);
  doc.setLineWidth(0.2);
  doc.line(15, finalY + 2, 195, finalY + 2);

  const studentViolations = violations.filter((v) => String(v.studentId) === String(student.id));
  if (studentViolations.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text("Catatan Bersih: Anak asuh terpuji dan patuh pada seluruh aturan serta tata tertib lingkungan asrama.", 15, finalY + 8);
    finalY += 15;
  } else {
    const violationBody = studentViolations.map((v, i) => [
      (i + 1).toString(),
      v.date || "",
      `Tingkat ${v.level}`,
      v.violation,
      v.note || '-',
      v.sanction
    ]);
    autoTable(doc, {
      head: [["No", "Tanggal", "Tingkat", "Bentuk Pelanggaran", "Keterangan Kronologi", "Rekomendasi Sanksi"]],
      body: violationBody,
      startY: finalY + 5,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      margin: { left: 15, right: 15 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 12;
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
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CATATAN KHUSUS PERKEMBANGAN WALI ASUH", 15, finalY);
  doc.line(15, finalY + 2, 195, finalY + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  const specialNote = repData.specialNote || "Tidak ada catatan khusus perkembangan.";
  const wrappedNotes = doc.splitTextToSize(specialNote, 175);
  doc.text(wrappedNotes, 15, finalY + 8);

  const sigY = finalY + 45;
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.text(`Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, sigY);
  doc.text("Mengetahui / Menyetujui:", 15, sigY + 5);
  doc.text("Wali Asuh Mandiri,", 15, sigY + 11);
  doc.text("Wali Asrama Utama,", 140, sigY + 11);

  doc.setFont("Helvetica", "bold");
  doc.text(`( ${customCaretakerName} )`, 15, sigY + 24);
  doc.text(`( ${config.waliAsrama} )`, 140, sigY + 24);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  if (customCaretakerNip) doc.text(`NIP. ${customCaretakerNip}`, 15, sigY + 28);
  if (config.waliAsramaNip) doc.text(`${config.waliAsramaNip}`, 140, sigY + 28);

  const sigY2 = sigY + 45;
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

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Rapor Keasramaan SRT31 Palembang - TA 2025/2026", 15, 287);
  doc.text(`Halaman ${currentPage}`, 195, 287, { align: "right" });

  doc.save(`Rapor_Keasramaan_${student.name.replace(/\s+/g, '_')}.pdf`);
}

// --- 4. REKAPITULASI COMPREHENSIVE MULTIPAGE PDF ---
export async function generateComprehensivePDF(
  students: Student[],
  violations: Violation[],
  counseling: Counseling[],
  leaves: Leave[],
  config: AppConfig,
  medicalRecords: MedicalRecord[] = []
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

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, finalY);
  doc.text("Mengetahui,", 35, finalY + 8);
  doc.text("Wali Asrama Mandiri,", 35, finalY + 14);
  doc.text("Kepala Sekolah Rakyat,", 140, finalY + 14);

  doc.setFont("Helvetica", "bold");
  doc.text(config.waliAsrama, 35, finalY + 38);
  doc.text(config.kepalaSekolah, 140, finalY + 38);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (config.waliAsramaNip) doc.text(config.waliAsramaNip, 35, finalY + 43);
  if (config.kepalaSekolahNip) doc.text(`NIP. ${config.kepalaSekolahNip}`, 140, finalY + 43);

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
  let formattedDate = violation.date;
  try {
    formattedDate = new Date(violation.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {}

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

