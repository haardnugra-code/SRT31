import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { OfficialLetter, AppConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';

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

function loadLogoImage(url?: string, fallbackType: 'left' | 'right' = 'left'): Promise<string> {
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
        } catch {
          // fallback
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

/**
 * Generate Authentic Official Letter PDF
 */
export async function generateOfficialLetterPDF(
  letter: OfficialLetter,
  config: AppConfig,
  action: 'download' | 'print' | 'blob' = 'download'
): Promise<string | void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  // Load logos
  const [logoLeft, logoRight] = await Promise.all([
    loadLogoImage(config.logoKiriUrl, 'left'),
    loadLogoImage(config.logoKananUrl, 'right')
  ]);

  // Function to render Institutional Kop
  const renderKopSurat = () => {
    // Left Logo
    if (logoLeft) {
      try {
        doc.addImage(logoLeft, 'PNG', marginX, 10, 20, 20);
      } catch (e) {
        console.warn('Failed to render left logo', e);
      }
    }

    // Right Logo
    if (logoRight) {
      try {
        doc.addImage(logoRight, 'PNG', pageWidth - marginX - 20, 10, 20, 20);
      } catch (e) {
        console.warn('Failed to render right logo', e);
      }
    }

    // Header Text
    const instansiLines = (config.kopKiri || 'KEMENTERIAN SOSIAL REPUBLIK INDONESIA\nBADAN PENDIDIKAN PENELITIAN DAN PENYULUHAN SOSIAL\nSEKOLAH RAKYAT 31 PALEMBANG').split('\n');
    const alamatLines = (config.kopKanan || 'Kompleks Balai Budi Perkasa, Jl. Sosial Km. 5, Palembang, Sumatera Selatan\nPos-el: sekolahrakyat31@kemensos.go.id | Asrama Mandiri Terpadu').split('\n');
    
    let textY = 14;

    // Instansi (Bold)
    doc.setFont('times', 'bold');
    instansiLines.forEach((line, index) => {
      // Make the last line of the institution name larger and optionally reddish like before
      if (index === instansiLines.length - 1) {
        doc.setFontSize(12);
        doc.setTextColor(180, 20, 20);
      } else {
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
      }
      doc.text(line.trim(), pageWidth / 2, textY, { align: 'center' });
      textY += (index === instansiLines.length - 1) ? 4.5 : 4.5;
    });

    // Alamat (Normal)
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    // Add small gap before address if needed, textY already added 4.5 from last instansi line
    textY -= 0.5; 
    alamatLines.forEach((line) => {
      doc.text(line.trim(), pageWidth / 2, textY, { align: 'center' });
      textY += 3.5;
    });

    const lineY = textY + 1;

    // Double Border Lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, lineY, pageWidth - marginX, lineY);
    doc.setLineWidth(0.2);
    doc.line(marginX, lineY + 1, pageWidth - marginX, lineY + 1);

    currentY = lineY + 6.5;
  };

  renderKopSurat();

  // Date on the top right
  const formattedDate = letter.letterDate ? formatDateIndonesian(letter.letterDate) : formatDateIndonesian(new Date().toISOString().split('T')[0]);
  const dateStr = `${letter.letterCity || 'Palembang'}, ${formattedDate}`;

  // Letter Meta (Nomor, Lampiran, Hal) vs Date
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Top right Date
  doc.text(dateStr, pageWidth - marginX, currentY, { align: 'right' });

  // Top left metadata
  const metaLabels = [
    { label: 'Nomor', value: `: ${letter.letterNumber || '.../SR31/WA/' + new Date().getFullYear()}` },
    { label: 'Lampiran', value: `: ${letter.enclosure || '-'}` },
    { label: 'Perihal', value: `: ${letter.subject || letter.letterTitle}` }
  ];

  metaLabels.forEach((item, idx) => {
    doc.setFont('times', idx === 2 ? 'bold' : 'normal');
    doc.text(item.label, marginX, currentY + idx * 5);
    doc.text(item.value, marginX + 22, currentY + idx * 5);
  });

  currentY += 20;

  // Recipient (Kepada Yth)
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Kepada Yth.', marginX, currentY);
  currentY += 4.5;
  doc.setFont('times', 'bold');
  doc.text(letter.recipientName || 'Bapak/Ibu', marginX, currentY);
  currentY += 4.5;

  if (letter.recipientTitle) {
    doc.setFont('times', 'normal');
    doc.text(letter.recipientTitle, marginX, currentY);
    currentY += 4.5;
  }
  if (letter.recipientOffice) {
    doc.setFont('times', 'normal');
    doc.text(letter.recipientOffice, marginX, currentY);
    currentY += 4.5;
  }
  doc.setFont('times', 'normal');
  doc.text(letter.recipientAddress || 'di Tempat', marginX, currentY);
  currentY += 8;

  // Function to ensure page break safety
  const checkPageBreak = (neededSpace = 30) => {
    if (currentY + neededSpace > pageHeight - 20) {
      doc.addPage();
      renderKopSurat();
    }
  };

  // Intro
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const introText = letter.bodyIntro || 'Dengan hormat,';
  doc.text(introText, marginX, currentY);
  currentY += 6;

  // --- RENDER BASED ON LETTER TYPE ---

  if (letter.letterType === 'laporan_kemensos_periodik') {
    // LAPORAN RESMI KEMENSOS RI & SEKOLAH RAKYAT
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('LAPORAN PERIODIK KEASRAMAAN & PEMBINAAN PESERTA DIDIK', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.text('Standar Pelaporan Resmi Kementerian Sosial RI & Sekolah Rakyat 31 Palembang', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Periode: ${letter.kemensosReportPeriod || 'Bulan Berjalan'} | Nomor Register: ${letter.letterNumber}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    // I. DASAR HUKUM & KONSIDERANS
    checkPageBreak(30);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('I. DASAR PELAKSANAAN & LANDASAN HUKUM KEMENSOS RI', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const legalText = letter.kemensosLegalBasis || 
      '1. Undang-Undang Republik Indonesia Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\n2. Undang-Undang Nomor 14 Tahun 2019 tentang Pekerja Sosial.\n3. Peraturan Menteri Sosial RI tentang Standar Pelayanan Minimal (SPM) Asrama Sekolah Rakyat.\n4. Standar Operasional Prosedur (SOP) Tata Kelola Keasramaan Terpadu Sekolah Rakyat 31 Palembang.';
    const splitLegal = doc.splitTextToSize(legalText, contentWidth);
    doc.text(splitLegal, marginX, currentY);
    currentY += splitLegal.length * 3.8 + 4;

    // II. MAKSUD DAN TUJUAN
    checkPageBreak(25);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('II. MAKSUD DAN TUJUAN', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const objText = letter.kemensosObjectives || 
      'Laporan ini disusun sebagai bentuk akuntabilitas kinerja pembinaan keasramaan, monitoring kedisiplinan ibadah sholat berbasis biometrik AI, pencatatan rekam medis peserta didik, serta evaluasi dinamika psikososial peserta didik Sekolah Rakyat di lingkungan Kemensos RI.';
    const splitObj = doc.splitTextToSize(objText, contentWidth);
    doc.text(splitObj, marginX, currentY);
    currentY += splitObj.length * 3.8 + 4;

    // III. PELAKSANAAN & DATA STATISTIK TERPADU
    checkPageBreak(38);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('III. REKAPITULASI PELAKSANAAN & DATA STATISTIK KEASRAMAAN', marginX, currentY);
    currentY += 4;

    const totalStudents = letter.attendanceTotalStudents || 0;
    const presentCount = letter.attendancePresentCount || 0;
    const alphaCount = letter.attendanceAlphaCount || 0;
    const sickCount = letter.attendanceSickCount || 0;
    const leaveCount = letter.attendanceLeaveCount || 0;

    const reportTable = [
      ['Rombel Sasaran / Target', `: ${letter.attendanceTargetClass || 'Semua Kelas'} / ${letter.attendanceTargetDorm || 'Semua Asrama'}`],
      ['Total Peserta Didik Terdaftar', `: ${totalStudents} Orang`],
      ['Tingkat Kehadiran Ibadah Berjamaah', `: ${presentCount} Orang (${totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%)`],
      ['Rekap Verifikasi Presensi', `: Face AI (${letter.attendanceFaceCount || 0}), QR Code (${letter.attendanceQrCount || 0}), RFID (${letter.attendanceRfidCount || 0})`],
      ['Peserta Didik Izin Sakit UKS', `: ${sickCount} Orang`],
      ['Peserta Didik Izin Pulang Asrama', `: ${leaveCount} Orang`],
      ['Catatan Alpa / Perlu Pembinaan Khusus', `: ${alphaCount} Kasus Ketidakhadiran`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: reportTable,
      theme: 'plain',
      styles: { font: 'times', fontSize: 8.5, cellPadding: 1, textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // IV. URAIAN PELAKSANAAN & PERKEMBANGAN
    checkPageBreak(28);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('IV. URAIAN PERKEMBANGAN & DINAMIKA PERILAKU SISWA', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitMain = doc.splitTextToSize(letter.bodyMain || 'Seluruh agenda pembinaan karakter, ibadah berjamaah, dan kegiatan akademik asrama berlangsung kondusif sesuai SOP Kemensos RI.', contentWidth);
    doc.text(splitMain, marginX, currentY);
    currentY += splitMain.length * 3.8 + 4;

    // V. EVALUASI, KENDALA & REKOMENDASI
    checkPageBreak(32);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('V. EVALUASI, KENDALA LAPANGAN & RENCANA TINDAK LANJUT', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const evalText = `Evaluasi & Kendala:\n${letter.kemensosEvaluation || letter.problemSummary || 'Beberapa peserta didik memerlukan pendampingan motivasi bangun subuh dan kedisiplinan antrean wudhu.'}\n\nRencana Tindak Lanjut Kemensos RI:\n${letter.kemensosRecommendations || letter.followUpActions || '1. Peningkatan supervisi piket malam oleh Wali Asuh.\n2. Bimbingan konseling berkala bersama Guru BK / Pekerja Sosial.\n3. Apresiasi penghargaan santri teladan presensi sholat.'}`;
    const splitEval = doc.splitTextToSize(evalText, contentWidth);
    doc.text(splitEval, marginX, currentY);
    currentY += splitEval.length * 3.8 + 5;

    // VI. PENUTUP
    checkPageBreak(25);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('VI. PENUTUP', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitClose = doc.splitTextToSize(letter.bodyClosing || 'Demikian Laporan Periodik Keasramaan ini dibuat dengan sesungguhnya sebagai bahan pertanggungjawaban program dan acuan kebijakan pimpinan Sekolah Rakyat Kemensos RI.', contentWidth);
    doc.text(splitClose, marginX, currentY);
    currentY += splitClose.length * 3.8 + 6;

  } else if (letter.letterType === 'berita_acara_insiden_kemensos') {
    // BERITA ACARA KEJADIAN KHUSUS KEMENSOS RI
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('BERITA ACARA PENANGANAN INSIDEN / KASUS KHUSUS KEASRAMAAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.text('Standar Operasional Penanganan Kasus Kementerian Sosial RI & Sekolah Rakyat', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Nomor: ${letter.letterNumber}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const splitOpen = doc.splitTextToSize(
      letter.bodyIntro ||
        `Pada hari ini, ${letter.letterDate ? formatDateIndonesian(letter.letterDate) : 'tanggal berjalan'}, telah dilakukan penanganan dan mediasi terhadap kasus kedisiplinan/insiden keasramaan di Lingkungan Asrama Sekolah Rakyat 31 Palembang (Kemensos RI) dengan rincian berita acara sebagai berikut:`,
      contentWidth
    );
    doc.text(splitOpen, marginX, currentY);
    currentY += splitOpen.length * 4 + 3;

    // Identitas Siswa
    const studentInfo = [
      ['Nama Peserta Didik', `: ${letter.studentName || '-'}`],
      ['NISN / ID Siswa', `: ${letter.studentNisn || letter.studentId || '-'}`],
      ['Kelas / Rombel', `: ${letter.studentClass || '-'}`],
      ['Asrama / Kamar', `: ${letter.studentDorm || '-'}`],
      ['Waktu & Tempat Kejadian', `: ${letter.incidentDate ? formatDateIndonesian(letter.incidentDate) : '-'} di ${letter.incidentLocation || 'Asrama'}`],
      ['Orang Tua / Wali Murid', `: ${letter.studentParentName || '-'} (${letter.studentParentPhone || '-'})`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: studentInfo,
      theme: 'plain',
      styles: { font: 'times', fontSize: 8.5, cellPadding: 1, textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // I. KRONOLOGI INSIDEN
    checkPageBreak(28);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('I. KRONOLOGI KEJADIAN / MASALAH', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitProblem = doc.splitTextToSize(letter.problemSummary || letter.bodyMain || '-', contentWidth);
    doc.text(splitProblem, marginX, currentY);
    currentY += splitProblem.length * 3.8 + 4;

    // II. ANALISIS & TINDAKAN YANG DIAMBIL
    checkPageBreak(30);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('II. PENANGANAN YANG TELAH DILAKUKAN (SOP KEMENSOS RI)', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitActions = doc.splitTextToSize(letter.actionsTaken || '1. Pendampingan psikososial oleh Wali Asuh.\n2. Klarifikasi saksi dan komitmen tertulis siswa.\n3. Pertolongan pertama/koordinasi pihak medis bila diperlukan.', contentWidth);
    doc.text(splitActions, marginX, currentY);
    currentY += splitActions.length * 3.8 + 4;

    // III. REKOMENDASI TINDAK LANJUT
    checkPageBreak(30);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('III. REKOMENDASI TINDAK LANJUT & PENGAWASAN', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitFollow = doc.splitTextToSize(letter.followUpActions || '1. Pemantauan intensif di buku catatan wali asuh.\n2. Sesi bimbingan konseling terstruktur.\n3. Pemanggilan wali murid untuk sinergi pembinaan bila diperlukan.', contentWidth);
    doc.text(splitFollow, marginX, currentY);
    currentY += splitFollow.length * 3.8 + 5;

    // IV. PENUTUP
    checkPageBreak(25);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('IV. PENUTUP', marginX, currentY);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const splitClose = doc.splitTextToSize(letter.bodyClosing || 'Berita acara ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.', contentWidth);
    doc.text(splitClose, marginX, currentY);
    currentY += splitClose.length * 3.8 + 6;

  } else if (letter.letterType === 'berita_acara_presensi') {
    // BERITA ACARA PENCATATAN PRESENSI & REKAP KEHADIRAN (FACE RECOGNITION / SHOLAT / ASRAMA)
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const splitOpening = doc.splitTextToSize(
      letter.bodyIntro ||
        'Pada hari ini telah dilaksanakan pencatatan presensi kehadiran santri menggunakan Sistem Presensi Terintegrasi Face Recognition Biometrik AI, Kartu QR Code, dan WebSerial RFID di Lingkungan Asrama Sekolah Rakyat 31 Palembang:',
      contentWidth
    );
    doc.text(splitOpening, marginX, currentY);
    currentY += splitOpening.length * 4.5 + 3;

    // Metadata Sesi Presensi
    const sessionRows = [
      ['Hari / Tanggal', `: ${letter.attendanceDate ? formatDateIndonesian(letter.attendanceDate) : formatDateIndonesian(letter.letterDate)}`],
      ['Sesi Presensi', `: ${letter.attendanceSession || 'Sholat Berjamaah'}`],
      ['Sasaran Rombel / Kamar', `: ${letter.attendanceTargetClass || 'Semua Kelas'} | ${letter.attendanceTargetDorm || 'Semua Asrama'}`],
      ['Petugas / Wali Asuh', `: ${letter.authorName} (${letter.authorRole || 'Pembina Asrama'})`],
      ['Metode Verifikasi', ': Biometrik AI Face Recognition, Barcode QR Code, dan RFID Card']
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: sessionRows,
      theme: 'plain',
      styles: { font: 'times', fontSize: 9.5, cellPadding: 1, textColor: [10, 10, 10] },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // I. REKAPITULASI STATISTIK KEHADIRAN
    checkPageBreak(42);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('I. REKAPITULASI STATISTIK PRESENSI KEHADIRAN SESI', marginX, currentY);
    currentY += 4.5;

    const totalTarget = letter.attendanceTotalStudents || 0;
    const hadirCount = letter.attendancePresentCount || 0;
    const faceCount = letter.attendanceFaceCount || 0;
    const qrCount = letter.attendanceQrCount || 0;
    const rfidCount = letter.attendanceRfidCount || 0;
    const manualCount = letter.attendanceManualCount || 0;
    const sakitCount = letter.attendanceSickCount || 0;
    const izinCount = letter.attendanceLeaveCount || 0;
    const terlambatCount = letter.attendanceLateCount || 0;
    const alphaCount = letter.attendanceAlphaCount || 0;
    const percentPresent = totalTarget > 0 ? Math.round((hadirCount / totalTarget) * 100) : 0;

    const statsTable = [
      ['Total Santri Terdaftar / Target', `${totalTarget} Santri`, '100%'],
      ['Hadir Tepat Waktu / Berjamaah', `${hadirCount} Santri`, `${percentPresent}%`],
      ['  - Terverifikasi Face Recognition AI', `${faceCount} Santri`, totalTarget > 0 ? `${Math.round((faceCount / totalTarget) * 100)}%` : '-'],
      ['  - Terverifikasi Kartu QR Scanner', `${qrCount} Santri`, totalTarget > 0 ? `${Math.round((qrCount / totalTarget) * 100)}%` : '-'],
      ['  - Terverifikasi Kartu RFID Serial', `${rfidCount} Santri`, totalTarget > 0 ? `${Math.round((rfidCount / totalTarget) * 100)}%` : '-'],
      ['  - Presensi Manual / Dispensasi', `${manualCount} Santri`, totalTarget > 0 ? `${Math.round((manualCount / totalTarget) * 100)}%` : '-'],
      ['Izin Sakit (Klinik / UKS Asrama)', `${sakitCount} Santri`, totalTarget > 0 ? `${Math.round((sakitCount / totalTarget) * 100)}%` : '-'],
      ['Izin Pulang / Dinas Lembaga', `${izinCount} Santri`, totalTarget > 0 ? `${Math.round((izinCount / totalTarget) * 100)}%` : '-'],
      ['Terlambat Hadir Sesi', `${terlambatCount} Santri`, totalTarget > 0 ? `${Math.round((terlambatCount / totalTarget) * 100)}%` : '-'],
      ['Alpa / Tanpa Keterangan', `${alphaCount} Santri`, totalTarget > 0 ? `${Math.round((alphaCount / totalTarget) * 100)}%` : '-'],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Kategori & Instrumen Presensi', 'Jumlah', 'Persentase']],
      body: statsTable,
      theme: 'grid',
      headStyles: { fillColor: [180, 20, 20], textColor: [255, 255, 255], font: 'times', fontStyle: 'bold', fontSize: 9, halign: 'center' },
      styles: { font: 'times', fontSize: 8.5, cellPadding: 1.8, textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // II. DAFTAR SANTRI TIDAK HADIR / ALPA
    if (letter.attendanceAbsentStudentNames && letter.attendanceAbsentStudentNames.trim()) {
      checkPageBreak(35);
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text('II. DAFTAR SANTRI TIDAK HADIR / BUTUH PERHATIAN KHUSUS', marginX, currentY);
      currentY += 4.5;

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      const splitAbsent = doc.splitTextToSize(letter.attendanceAbsentStudentNames, contentWidth);
      doc.text(splitAbsent, marginX, currentY);
      currentY += splitAbsent.length * 4.2 + 4;
    }

    // III. CATATAN EVALUASI & TINDAK LANJUT
    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('III. CATATAN EVALUASI OBSERVASI PEMBINA', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitNotes = doc.splitTextToSize(
      letter.attendanceNotes || letter.bodyMain || 'Seluruh santri mengikuti agenda sholat berjamaah dan asrama dengan tertib dan khidmat.',
      contentWidth
    );
    doc.text(splitNotes, marginX, currentY);
    currentY += splitNotes.length * 4.2 + 4;

    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('IV. REKOMENDASI TINDAK LANJUT KEDISIPLINAN', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitFollowUp = doc.splitTextToSize(
      letter.followUpActions ||
        '1. Pembinaan bagi santri alpa oleh Wali Asuh.\n2. Koordinasi dengan petugas UKS bagi santri yang berstatus sakit.\n3. Evaluasi kedisiplinan pada apel malam asrama.',
      contentWidth
    );
    doc.text(splitFollowUp, marginX, currentY);
    currentY += splitFollowUp.length * 4.2 + 6;

  } else if (letter.letterType === 'peringatan_ketidakhadiran') {
    // SURAT PEMBERITAHUAN & PERINGATAN KETIDAKHADIRAN SANTRI
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const splitOpening = doc.splitTextToSize(
      letter.bodyIntro ||
        'Sehubungan dengan hasil rekapitulasi data presensi terpadu (Face Recognition Biometrik & Presensi Asrama) Sekolah Rakyat 31 Palembang, bersama ini kami sampaikan pemberitahuan kedisiplinan peserta didik:',
      contentWidth
    );
    doc.text(splitOpening, marginX, currentY);
    currentY += splitOpening.length * 4.5 + 3;

    // Student Data Table
    const studentRows = [
      ['Nama Siswa', `: ${letter.studentName || '-'}`],
      ['NISN / ID', `: ${letter.studentNisn || letter.studentId || '-'}`],
      ['Kelas / Tingkat', `: ${letter.studentClass || '-'}`],
      ['Kamar / Asrama', `: ${letter.studentDorm || '-'}`],
      ['Nama Orang Tua / Wali', `: ${letter.studentParentName || '-'}`],
      ['Kontak Orang Tua', `: ${letter.studentParentPhone || '-'}`],
      ['Jumlah Alpa Tercatat', `: ${letter.attendanceAlphaCount || 1} Kali Ketidakhadiran Tanpa Keterangan`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: studentRows,
      theme: 'plain',
      styles: { font: 'times', fontSize: 9.5, cellPadding: 1, textColor: [10, 10, 10] },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('I. RINCIAN KETIDAKHADIRAN & PELANGGARAN KEDISIPLINAN', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitMain = doc.splitTextToSize(
      letter.bodyMain ||
        'Peserta didik tersebut di atas tercatat tidak mengikuti kegiatan ibadah sholat berjamaah tanpa keterangan sah berdasarkan rekam sistem presensi.',
      contentWidth
    );
    doc.text(splitMain, marginX, currentY);
    currentY += splitMain.length * 4.2 + 4;

    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('II. KONSEKUENSI & PEMBINAAN ASRAMA', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitActions = doc.splitTextToSize(
      letter.actionsTaken ||
        '1. Konseling individu dan komitmen tertulis oleh Wali Asuh.\n2. Sanksi edukatif keagamaan berupa penambahan hafalan surat pendek / doa harian.\n3. Pemantauan intensif di buku jurnal keasramaan.',
      contentWidth
    );
    doc.text(splitActions, marginX, currentY);
    currentY += splitActions.length * 4.2 + 4;

    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('III. ARAHAN KEPADA ORANG TUA / WALI', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitFollowUp = doc.splitTextToSize(
      letter.followUpActions ||
        'Dimohon kepada Bapak/Ibu Orang Tua / Wali untuk turut memberikan arahan dan motivasi kepada ananda agar senantiasa disiplin dan taat terhadap tata tertib asrama.',
      contentWidth
    );
    doc.text(splitFollowUp, marginX, currentY);
    currentY += splitFollowUp.length * 4.2 + 6;

  } else if (letter.letterType === 'kronologi_kasus_psikologi') {
    // 1. DATA SISWA
    doc.setFont('times', 'normal');
    const openingMsg = 'Sehubungan dengan pendampingan dan pembinaan keasramaan di Sekolah Rakyat 31 Palembang, bersama ini kami sampaikan laporan kronologi kejadian serta analisis psikologis perkembangan peserta didik:';
    const splitOpening = doc.splitTextToSize(openingMsg, contentWidth);
    doc.text(splitOpening, marginX, currentY);
    currentY += splitOpening.length * 4.5 + 2;

    // Student Info Box/Table
    const studentDataRows = [
      ['Nama Siswa', `: ${letter.studentName || '-'}`],
      ['NISN / ID', `: ${letter.studentNisn || letter.studentId || '-'}`],
      ['Kelas / Tingkat', `: ${letter.studentClass || '-'}`],
      ['Kamar / Asrama', `: ${letter.studentDorm || '-'}`],
      ['Wali Asuh Pendamping', `: ${letter.authorName || '-'}`],
      ['Waktu & Lokasi Kejadian', `: ${letter.incidentDate ? formatDateIndonesian(letter.incidentDate) : '-'} | Lokasi: ${letter.incidentLocation || 'Lingkungan Asrama'}`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: studentDataRows,
      theme: 'plain',
      styles: { font: 'times', fontSize: 9.5, cellPadding: 1, textColor: [10, 10, 10] },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // 2. KRONOLOGI & PERMASALAHAN ANAK
    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('I. KRONOLOGI KEJADIAN & PERMASALAHAN ANAK', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitProblem = doc.splitTextToSize(letter.problemSummary || 'Tidak ada uraian kronologi khusus yang dicatat.', contentWidth);
    doc.text(splitProblem, marginX, currentY);
    currentY += splitProblem.length * 4.2 + 4;

    // 3. LANDASAN & ANALISIS TEORI PSIKOLOGI
    checkPageBreak(40);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`II. ANALISIS TEORI PSIKOLOGI ANAK & DINAMIKA PERILAKU`, marginX, currentY);
    currentY += 4;
    if (letter.psychologyTheoryName) {
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 80);
      doc.text(`Landasan Teori: ${letter.psychologyTheoryName}`, marginX, currentY);
      currentY += 4;
      doc.setTextColor(0, 0, 0);
    }
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitTheory = doc.splitTextToSize(letter.psychologyTheoryAnalysis || 'Berdasarkan observasi psikologis perilaku keasramaan, anak menunjukkan dinamika emosional dan respon adaptasi yang membutuhkan pembinaan konseling terstruktur.', contentWidth);
    doc.text(splitTheory, marginX, currentY);
    currentY += splitTheory.length * 4.2 + 4;

    // 4. TINDAKAN YANG TELAH DILAKUKAN
    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('III. TINDAKAN YANG TELAH DILAKUKAN', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitActions = doc.splitTextToSize(letter.actionsTaken || '1. Konseling individu oleh Wali Asuh.\n2. Stabilisasi emosi anak dan klarifikasi kronologi.\n3. Koordinasi dengan guru BK dan staf asrama.', contentWidth);
    doc.text(splitActions, marginX, currentY);
    currentY += splitActions.length * 4.2 + 4;

    // 5. UPAYA & REKOMENDASI TINDAK LANJUT
    checkPageBreak(35);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('IV. UPAYA & REKOMENDASI TINDAK LANJUT', marginX, currentY);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const splitFollowUp = doc.splitTextToSize(letter.followUpActions || '1. Pendampingan berkelanjutan secara intensif oleh Wali Asuh.\n2. Pemantauan berkala grafik kedisiplinan dan relasi sosial asrama.\n3. Evaluasi berkala bersama Wali Asrama dan Kepala Sekolah.', contentWidth);
    doc.text(splitFollowUp, marginX, currentY);
    currentY += splitFollowUp.length * 4.2 + 6;

  } else if (letter.letterType === 'pengajuan_barang') {
    // SURAT PENGAJUAN BARANG / LOGISTIK
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const introItems = doc.splitTextToSize(letter.bodyMain || 'Bersama surat ini, kami selaku Wali Asuh mengajukan permohonan pengadaan sarana, prasarana, dan kebutuhan logistik kamar/asrama demi kelancaran pembinaan dan kenyamanan siswa sebagai berikut:', contentWidth);
    doc.text(introItems, marginX, currentY);
    currentY += introItems.length * 4.5 + 4;

    // Table of Items
    const tableBody = (letter.supplyItems || []).map((item, idx) => [
      (idx + 1).toString(),
      item.name,
      `${item.quantity} ${item.unit || 'Unit'}`,
      item.estimatedPrice ? `Rp ${item.estimatedPrice.toLocaleString('id-ID')}` : '-',
      item.estimatedPrice ? `Rp ${(item.estimatedPrice * item.quantity).toLocaleString('id-ID')}` : '-',
      item.urgency || 'Mendesak',
      item.reason || '-'
    ]);

    if (tableBody.length === 0) {
      tableBody.push(['1', 'Contoh Kebutuhan Pengadaan Barang', '1 Paket', '-', '-', 'Mendesak', 'Kebutuhan asrama']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Nama Barang / Kebutuhan', 'Qty', 'Est. Harga', 'Total Est.', 'Urgensi', 'Alasan / Keterangan']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255], font: 'times', fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
      styles: { font: 'times', fontSize: 8.5, cellPadding: 2, textColor: [20, 20, 20] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 33 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    if (letter.supplyTotalEstimatedCost && letter.supplyTotalEstimatedCost > 0) {
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.text(`Total Estimasi Anggaran Pengajuan: Rp ${letter.supplyTotalEstimatedCost.toLocaleString('id-ID')}`, pageWidth - marginX, currentY, { align: 'right' });
      currentY += 6;
    }

  } else if (letter.letterType === 'izin_kerja_staf') {
    // SURAT IZIN TIDAK MASUK KERJA / CUTI STAF
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const openingIzin = doc.splitTextToSize('Saya yang bertanda tangan di bawah ini:', contentWidth);
    doc.text(openingIzin, marginX, currentY);
    currentY += 5;

    const staffRows = [
      ['Nama Staf / Wali Asuh', `: ${letter.authorName}`],
      ['NIP / ID Pegawai', `: ${letter.authorNipOrId || '-'}`],
      ['Jabatan / Tugas', `: ${letter.authorRole || 'Wali Asuh Asrama'}`],
      ['Jenis Izin', `: ${letter.leaveType || 'Izin Keperluan Mendesak'}`],
      ['Periode Izin / Cuti', `: ${letter.leaveStartDate ? formatDateIndonesian(letter.leaveStartDate) : '-'} s.d. ${letter.leaveEndDate ? formatDateIndonesian(letter.leaveEndDate) : '-'} (${letter.leaveTotalDays || 1} Hari)`],
      ['Petugas Pengganti Piket', `: ${letter.leaveHandoverStaff || '-'}`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      body: staffRows,
      theme: 'plain',
      styles: { font: 'times', fontSize: 9.5, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Dengan ini bermaksud mengajukan permohonan izin tidak hadir / piket dengan alasan:', marginX, currentY);
    currentY += 4.5;

    const splitReason = doc.splitTextToSize(letter.leaveReason || 'Keperluan mendesak yang tidak dapat ditinggalkan.', contentWidth);
    doc.text(splitReason, marginX, currentY);
    currentY += splitReason.length * 4.2 + 4;

  } else {
    // SURAT PERMOHONAN / LAIN-LAIN (BEBAS)
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const bodyMainText = letter.bodyMain || 'Dengan ini kami mengajukan permohonan sebagaimana perihal surat di atas untuk dapat disetujui demi kelancaran program keasramaan Sekolah Rakyat 31 Palembang.';
    const splitMain = doc.splitTextToSize(bodyMainText, contentWidth);
    doc.text(splitMain, marginX, currentY);
    currentY += splitMain.length * 4.5 + 6;
  }

  // Closing Paragraph
  checkPageBreak(30);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const closingText = letter.bodyClosing || 'Demikian surat ini kami sampaikan dengan sebenarnya. Atas perhatian, arahan, dan perkenan Bapak/Ibu, kami ucapkan terima kasih.';
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, marginX, currentY);
  currentY += splitClosing.length * 4.5 + 8;

  // --- SIGNATURE SECTION ---
  checkPageBreak(50);

  const colW = contentWidth / 2;
  const sigY = currentY;

  const isDualSignature =
    letter.letterType === 'berita_acara_presensi' ||
    letter.letterType === 'berita_acara_insiden_kemensos' ||
    letter.letterType === 'laporan_kemensos_periodik' ||
    Boolean(letter.acknowledgementName);

  if (isDualSignature) {
    // Dual Signature: Kiri (Mengetahui Wali Asrama), Kanan (Pembuat Berita Acara / Wali Asuh)
    const leftCenterX = marginX + colW * 0.45;
    const rightCenterX = marginX + colW + colW * 0.55;

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Mengetahui,', leftCenterX, sigY, { align: 'center' });
    doc.text(letter.acknowledgementTitle || 'Wali Asrama Mandiri,', leftCenterX, sigY + 4, { align: 'center' });

    doc.text(letter.signatureAuthorLabel || 'Pembuat Laporan / Wali Asuh,', rightCenterX, sigY + 4, { align: 'center' });

    const sigNameY = sigY + 22;

    // Names
    doc.setFont('times', 'bold');
    const ackName = letter.acknowledgementName || config.waliAsrama || 'HISNUL HASHIN, SE';
    doc.text(ackName, leftCenterX, sigNameY, { align: 'center' });
    doc.text(letter.authorName || 'Wali Asuh', rightCenterX, sigNameY, { align: 'center' });

    // NIPs
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const ackNip = letter.acknowledgementNip || config.waliAsramaNip || '-';
    if (ackNip && ackNip !== '-') {
      doc.text(`NIP. ${ackNip}`, leftCenterX, sigNameY + 4, { align: 'center' });
    }
    if (letter.authorNipOrId) {
      doc.text(`ID/NIP. ${letter.authorNipOrId}`, rightCenterX, sigNameY + 4, { align: 'center' });
    }

    // Kemensos Approval by Kepala Sekolah Rakyat
    if (letter.letterType === 'laporan_kemensos_periodik' || letter.approvalName) {
      const appY = sigNameY + 12;
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.text('Menyetujui / Mengesahkan,', pageWidth / 2, appY, { align: 'center' });
      doc.text(letter.approvalTitle || 'Kepala Sekolah Rakyat 31 (Kemensos RI),', pageWidth / 2, appY + 4, { align: 'center' });

      const appNameY = appY + 22;
      doc.setFont('times', 'bold');
      const appName = letter.approvalName || config.kepalaSekolah || 'YUNI ARSI, S.Pd';
      doc.text(appName, pageWidth / 2, appNameY, { align: 'center' });

      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      const appNip = letter.approvalNip || config.kepalaSekolahNip || '-';
      if (appNip && appNip !== '-') {
        doc.text(`NIP. ${appNip}`, pageWidth / 2, appNameY + 4, { align: 'center' });
      }
    }
  } else {
    // Single Signature: Wali Asuh (Pembuat Surat) - Aligned to the right
    const sigCenterX = marginX + (contentWidth / 3) * 2.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text(letter.signatureAuthorLabel || 'Wali Asuh / Pemohon,', sigCenterX, sigY, { align: 'center' });

    const sigNameY = sigY + 22;

    // Sign Names
    doc.setFont('times', 'bold');
    doc.text(letter.authorName || 'Wali Asuh', sigCenterX, sigNameY, { align: 'center' });

    // NIP under names
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    if (letter.authorNipOrId) {
      doc.text(`ID/NIP. ${letter.authorNipOrId}`, sigCenterX, sigNameY + 4, { align: 'center' });
    }
  }

  // QR Code Verification
  try {
    const qrData = `VALIDASI DIGITAL KEMENSOS RI - SR31\nNo. Surat: ${letter.letterNumber || 'SR31/WA'}\nPerihal: ${letter.subject}\nTanggal: ${dateStr}\nPemohon: ${letter.authorName}\nStatus: Dokumen Resmi Terverifikasi`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', marginX, pageHeight - 22, 14, 14);
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Dokumen resmi Sekolah Rakyat 31 Palembang - Kemensos RI. Pindai QR untuk verifikasi.', marginX + 16, pageHeight - 15);
  } catch (e) {
    console.warn('QR Code generation skipped', e);
  }

  const filename = `${letter.letterTitle.replace(/\s+/g, '_')}_${letter.letterNumber.replace(/\//g, '-')}_${letter.letterDate}.pdf`;

  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(typeof blobUrl === 'string' ? blobUrl : blobUrl.toString(), '_blank');
    return;
  } else if (action === 'blob') {
    const blobUrl = doc.output('bloburl');
    return typeof blobUrl === 'string' ? blobUrl : blobUrl.toString();
  } else {
    doc.save(filename);
    return;
  }
}
