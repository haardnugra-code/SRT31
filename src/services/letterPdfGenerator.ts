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

  if (letter.letterType === 'kronologi_kasus_psikologi') {
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

  const colW = contentWidth / 3;
  const sigY = currentY;

  // Column 1: Wali Asuh (Pembuat Surat)
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(letter.signatureAuthorLabel || 'Wali Asuh / Pemohon,', marginX + colW * 0.5, sigY, { align: 'center' });

  // Column 2: Mengetahui Wali Asrama
  doc.text('Mengetahui,', marginX + colW * 1.5, sigY - 4, { align: 'center' });
  doc.text(letter.acknowledgementTitle || 'Wali Asrama Mandiri,', marginX + colW * 1.5, sigY, { align: 'center' });

  // Column 3: Menyetujui Kepala Sekolah
  doc.text('Menyetujui,', marginX + colW * 2.5, sigY - 4, { align: 'center' });
  doc.text(letter.approvalTitle || 'Kepala Sekolah Rakyat 31,', marginX + colW * 2.5, sigY, { align: 'center' });

  const sigNameY = sigY + 22;

  // Sign Names
  doc.setFont('times', 'bold');
  doc.text(letter.authorName || 'Wali Asuh', marginX + colW * 0.5, sigNameY, { align: 'center' });
  doc.text(letter.acknowledgementName || config.waliAsrama || 'HISNUL HASHIN, SE', marginX + colW * 1.5, sigNameY, { align: 'center' });
  doc.text(letter.approvalName || config.kepalaSekolah || 'YUNI ARSI, S.Pd', marginX + colW * 2.5, sigNameY, { align: 'center' });

  // NIP under names
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  if (letter.authorNipOrId) {
    doc.text(`ID/NIP. ${letter.authorNipOrId}`, marginX + colW * 0.5, sigNameY + 4, { align: 'center' });
  }
  doc.text(letter.acknowledgementNip || config.waliAsramaNip || 'NIP. 197406262025211027', marginX + colW * 1.5, sigNameY + 4, { align: 'center' });
  doc.text(letter.approvalNip || config.kepalaSekolahNip || 'NIP. 197206051999032002', marginX + colW * 2.5, sigNameY + 4, { align: 'center' });

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
