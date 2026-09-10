import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PsychologicalAssessment, AppConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';

export async function generatePsychologicalReportPDF(
  assessment: PsychologicalAssessment,
  config: AppConfig
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Letterhead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const kopLines = config.kopKiri.split('\n');
  let y = 14;
  kopLines.forEach((line) => {
    doc.text(line.trim(), pageWidth / 2, y, { align: 'center' });
    y += 4.5;
  });

  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  const kopKananLines = config.kopKanan.split('\n');
  kopKananLines.forEach((line) => {
    doc.text(line.trim(), pageWidth / 2, y, { align: 'center' });
    y += 4.5;
  });

  // Divider Line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);

  y += 7;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
    doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'LAPORAN EVALUASI PSIKOLOGI KLINIS (MMPI) KANDIDAT SELEKSI'
      : 'LAPORAN HASIL ASESMEN PSIKOLOGI & TUMBUH KEMBANG KEJIWAAN',
    pageWidth / 2, y, { align: 'center' }
  );
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Instrumen: ${assessment.testTitle}`, pageWidth / 2, y, { align: 'center' });

  y += 6;

  // Student Identity Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Nama Peserta' : 'Nama Siswa', margin + 4, y + 6);
  doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Nomor Seleksi' : 'NISN / ID', margin + 4, y + 11);
  doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Polda/Panda' : 'Kelas & Asrama', margin + 4, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${assessment.studentName}`, margin + 30, y + 6);
  doc.text(`: ${assessment.studentId}`, margin + 30, y + 11);
  doc.text(`: Kelas ${assessment.studentClass} | ${assessment.studentDorm}`, margin + 30, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Tes', pageWidth / 2 + 10, y + 6);
  doc.text('Pelaksana / Asesor', pageWidth / 2 + 10, y + 11);
  doc.text('Status Pengisian', pageWidth / 2 + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${formatDateIndonesian(assessment.date)}`, pageWidth / 2 + 45, y + 6);
  doc.text(`: ${assessment.assessorName}`, pageWidth / 2 + 45, y + 11);
    doc.text(
    `: ${assessment.filledBy === 'student' ? (assessment.testType === 'mmpi_tni_polri' ? 'CAT (Computer Assisted Test) Mandiri' : 'Akses Mandiri Siswa') : 'Didampingi Pengasuh/BK'}`,
    pageWidth / 2 + 45, y + 16
  );

  y += 26;

  // Overall Status Banner
  const isNormal = assessment.overallStatus === 'normal';
  const isBorderline = assessment.overallStatus === 'borderline';

  if (isNormal) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
  } else if (isBorderline) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
  } else {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(244, 63, 94);
  }

  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (isNormal) doc.setTextColor(6, 95, 70);
  else if (isBorderline) doc.setTextColor(146, 64, 14);
  else doc.setTextColor(159, 18, 57);

  doc.text(`KESIMPULAN STATUS KEJIWAAN UMUM: ${assessment.overallStatusLabel.toUpperCase()}`, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
    doc.text(
    `Total Skor ${assessment.testType === 'mmpi_tni_polri' ? 'Klinis & Validitas (MMPI)' : 'Kesulitan/Resiliensi'}: ${assessment.totalScore} poin. Tanggal Evaluasi: ${assessment.date}`,
    margin + 4,
    y + 10.5
  );

  y += 18;

  // Dimension Scores Table
  const tableRows = Object.values(assessment.dimensionScores).map((dim) => {
    return [
      dim.dimensionName,
      `${dim.score} / ${dim.maxScore}`,
      dim.statusLabel,
      dim.clinicalInterpretation
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Dimensi Psikologis / Kejiwaan', 'Skor', 'Klasifikasi', 'Interpretasi Klinis & Tumbuh Kembang']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Check page overflow
  if (y > pageHeight - 75) {
    doc.addPage();
    y = 15;
  }

  // Psychological Considerations Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    assessment.testType === 'mmpi_tni_polri' 
      ? 'I. PERTIMBANGAN KLINIS & PROFIL KEPRIBADIAN (MMPI)'
      : 'I. PERTIMBANGAN KEJIWAAN & DINAMIKA TUMBUH KEMBANG ANAK', 
    margin, y
  );
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const insightLines = doc.splitTextToSize(assessment.developmentalInsights, pageWidth - margin * 2);
  doc.text(insightLines, margin, y);
  y += insightLines.length * 3.8 + 2;

  assessment.psychologicalConsiderations.forEach((item, idx) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 15;
    }
    const lines = doc.splitTextToSize(`• ${item}`, pageWidth - margin * 2 - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 3.6;
  });

  y += 4;

  // Strengths & Risk Factors
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'II. SKALA VALIDITAS (KEJUJURAN) & KERENTANAN KLINIS'
      : 'II. FAKTOR PROTEKTIF (KEKUATAN) & AREA KERENTANAN PSIKOLOGIS',
    margin, y
  );
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text(
    assessment.testType === 'mmpi_tni_polri' ? 'Indikator Positif / Validitas:' : 'Kekuatan & Potensi Positif Anak:', 
    margin + 2, y
  );
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  assessment.prosocialStrengths.forEach((str) => {
    const lines = doc.splitTextToSize(`+ ${str}`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('Area Kerentanan yang Perlu Diwaspadai:', margin + 2, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  assessment.riskFactors.forEach((rf) => {
    const lines = doc.splitTextToSize(`! ${rf}`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  y += 4;

  // Recommendations Section
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'III. REKOMENDASI KELAYAKAN (ADMINISTRASI SELEKSI)'
      : 'III. REKOMENDASI TINDAK LANJUT TERPADU',
    margin, y
  );
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Untuk Wali Asuh di Asrama:', margin + 2, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  assessment.recommendations.forCaretaker.forEach((r) => {
    const lines = doc.splitTextToSize(`- ${r}`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Untuk Guru BK & Pendamping Khusus:', margin + 2, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  assessment.recommendations.forCounselor.forEach((r) => {
    const lines = doc.splitTextToSize(`- ${r}`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  if (assessment.recommendations.referralAdvice) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93);
    const refLines = doc.splitTextToSize(`* ${assessment.recommendations.referralAdvice}`, pageWidth - margin * 2 - 4);
    doc.text(refLines, margin + 2, y);
    y += refLines.length * 3.5;
  }

  y += 8;

  // Signatures
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  const sigY = y;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left Signature: Counselor / Assessor
  doc.text('Mengetahui,', margin + 15, sigY);
  doc.text('Wali Asrama / Guru BK', margin + 15, sigY + 4);
  doc.text('( .................................................. )', margin + 15, sigY + 20);
  doc.text(`NIP/Penugasan: ${config.waliAsramaNip || 'Petugas BK Asrama'}`, margin + 15, sigY + 24);

  // Right Signature: Headmaster
  const rightX = pageWidth - margin - 55;
  doc.text(`Palembang, ${formatDateIndonesian(assessment.date)}`, rightX, sigY);
  doc.text('Kepala Sekolah Rakyat Terintegrasi 31', rightX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(config.kepalaSekolah, rightX, sigY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${config.kepalaSekolahNip}`, rightX, sigY + 24);

  // Download PDF
  const cleanName = assessment.studentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Laporan_Psikologi_${cleanName}_${assessment.date}.pdf`);
}
