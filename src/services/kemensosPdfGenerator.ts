import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AppConfig,
  KemensosFindingRecord,
  KemensosCaseRecord,
  KemensosMonevRecord,
  KemensosRapidAssessmentRecord,
} from '../types';

/**
 * Add Official Header KOP for Kemensos Reports
 */
function addKemensosHeader(doc: jsPDF, config: AppConfig, titleText: string, subTitleText?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logos if available
  if (config.logoKiriUrl) {
    try {
      doc.addImage(config.logoKiriUrl, 'PNG', 14, 10, 18, 18);
    } catch {
      // Fallback if image fails
    }
  }

  if (config.logoKananUrl) {
    try {
      doc.addImage(config.logoKananUrl, 'PNG', pageWidth - 32, 10, 18, 18);
    } catch {
      // Fallback
    }
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('KEMENTERIAN SOSIAL REPUBLIK INDONESIA', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(9);
  doc.text('PUSAT PENDIDIKAN, PELATIHAN, DAN PENGEMBANGAN PROFESI', pageWidth / 2, 18.5, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG', pageWidth / 2, 23.5, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Jl. Komp Sosial Km 5 Sukabangun, Palembang, Sumatera Selatan', pageWidth / 2, 27.5, { align: 'center' });

  // Double Line Separator
  doc.setLineWidth(1.2);
  doc.setDrawColor(30, 41, 59);
  doc.line(14, 30, pageWidth - 14, 30);
  doc.setLineWidth(0.4);
  doc.line(14, 31.2, pageWidth - 14, 31.2);

  // Document Title Banner
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, 35, pageWidth - 28, 8, 2, 2, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(titleText.toUpperCase(), pageWidth / 2, 40.5, { align: 'center' });

  if (subTitleText) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(subTitleText, pageWidth / 2, 46.5, { align: 'center' });
  }

  return 48; // Return start Y position for body content
}

/**
 * Add Standard Footer Signatures
 */
function addKemensosFooter(doc: jsPDF, config: AppConfig, startY: number, authorName: string, authorRole = 'Wali Asuh Pendamping') {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let currentY = startY + 12;
  if (currentY + 35 > pageHeight) {
    doc.addPage();
    currentY = 25;
  }

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Right Side - Author Signature
  const rightX = pageWidth - 65;
  doc.text(`Palembang, ${todayStr}`, rightX, currentY);
  doc.text(authorRole, rightX, currentY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.text(authorName, rightX, currentY + 24);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP/NPT: -`, rightX, currentY + 28);

  // Left Side - Acknowledgement / Wali Asrama
  const leftX = 14;
  doc.text('Mengetahui,', leftX, currentY);
  doc.text(config.waliAsramaTitle || 'Wali Asrama Mandiri', leftX, currentY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(config.waliAsrama || 'HISNUL HASHIN, SE', leftX, currentY + 24);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(config.waliAsramaNip || 'NIP. 197406262025211027', leftX, currentY + 28);
}

/**
 * 1. FORMULIR PENCATATAN INFORMASI TEMUAN PESERTA DIDIK (Pages 24-25)
 */
export function generateKemensosFindingPDF(record: KemensosFindingRecord, config: AppConfig) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = addKemensosHeader(doc, config, 'FORMULIR PENCATATAN INFORMASI TEMUAN PESERTA DIDIK', 'Modul 7 Kemensos 2026 - Pengasuhan Asrama Sekolah Rakyat');

  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'A. IDENTITAS PESERTA DIDIK', colSpan: 2 }]],
    body: [
      ['Nama Peserta Didik', `: ${record.studentName || '-'}`],
      ['Usia / Jenis Kelamin', `: ${record.studentAge ? record.studentAge + ' Tahun' : '-'} / ${record.studentGender || '-'}`],
      ['Kelas & Jenjang', `: ${record.studentClass || '-'}`],
      ['Kamar & Asrama', `: ${record.studentDorm || '-'}`],
    ],
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'B. WAKTU DAN TEMPAT KEJADIAN', colSpan: 2 }]],
    body: [
      ['Hari / Tanggal', `: ${record.incidentDate || record.date || '-'}`],
      ['Jam Kejadian', `: ${record.incidentTime || record.time || '-'}`],
      ['Lokasi Kejadian', `: ${record.incidentLocation || '-'}`],
    ],
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  const sections = [
    { title: 'C. URAIAN KEJADIAN', content: record.incidentDescription },
    { title: 'D. PERNYATAAN PESERTA DIDIK DAN / ATAU PIHAK LAIN', content: record.studentOrOtherStatements },
    { title: 'E. DESKRIPSI KONDISI / PERILAKU YANG TAMPAK', content: record.observedBehavior },
    { title: 'F. PIHAK ATAU SAKSI YANG RELEVAN', content: record.relevantWitnesses },
    { title: 'G. LANGKAH AWAL YANG TELAH DILAKUKAN WALI ASUH', content: record.initialActionsTaken },
  ];

  sections.forEach((sec) => {
    if (y + 25 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      y = 20;
    }

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3.5 },
      head: [[sec.title]],
      body: [[sec.content && sec.content.trim() ? sec.content : '-']],
    });

    y = (doc as any).lastAutoTable.finalY + 3.5;
  });

  addKemensosFooter(doc, config, y, record.caretakerName || config.waliAsrama || 'Wali Asuh Pendamping');

  doc.save(`Form_Temuan_Peserta_Didik_${record.studentName || record.id}.pdf`);
}

/**
 * 2. CATATAN PENANGANAN KASUS ANAK SEKOLAH RAKYAT (Pages 13-17) - Lampiran 7
 */
export function generateKemensosCasePDF(record: KemensosCaseRecord, config: AppConfig) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = addKemensosHeader(doc, config, 'LAMPIRAN 7: CATATAN PENANGANAN KASUS ANAK', 'Modul 7 Kemensos 2026 - Formulir Penanganan Kasus');

  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'IDENTITAS KASUS & ANAK', colSpan: 2 }]],
    body: [
      ['Nama Sekolah Rakyat', `: ${record.schoolName || 'Sekolah Rakyat Terintegrasi 31 Palembang'}`],
      ['Nama Wali Asuh', `: ${record.caretakerName || '-'}`],
      ['Tanggal Pembukaan Kasus', `: ${record.caseOpeningDate || '-'}`],
      ['Nama Anak (Inisial)', `: ${record.studentName || '-'}`],
      ['Usia / Jenis Kelamin', `: ${record.studentAge ? record.studentAge + ' Tahun' : '-'} / ${record.studentGender || '-'}`],
      ['Kelas & Jenjang', `: ${record.studentClass || '-'}`],
    ],
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3 },
    head: [[{ content: '1. GAMBARAN PERMASALAHAN', colSpan: 2 }]],
    body: [
      ['a. Permasalahan Utama & Gejala', record.mainProblem || '-'],
      ['b. Penyebab Masalah', record.problemCause || '-'],
      ['c. Dampak: Kondisi Biologis / Fisik', record.impactPhysical || '-'],
      ['Dampak: Kondisi Psikologis', record.impactPsychological || '-'],
      ['Dampak: Kondisi Sosial', record.impactSocial || '-'],
      ['Dampak: Kondisi Spiritual', record.impactSpiritual || '-'],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  const specGoalsText = Array.isArray(record.specificGoals) && record.specificGoals.length > 0
    ? record.specificGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')
    : '-';

  const plannedActText = Array.isArray(record.plannedActivities) && record.plannedActivities.length > 0
    ? record.plannedActivities.map((g, i) => `${i + 1}. ${g}`).join('\n')
    : '-';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3 },
    head: [[{ content: '2. RENCANA INTERVENSI', colSpan: 2 }]],
    body: [
      ['a. Tujuan Umum', record.generalGoal || '-'],
      ['b. Tujuan Khusus', specGoalsText],
      ['c. Rencana Kegiatan', plannedActText],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  const execText = Array.isArray(record.interventionsExecuted) && record.interventionsExecuted.length > 0
    ? record.interventionsExecuted.map((g, i) => `Kegiatan ${i + 1}: ${g}`).join('\n')
    : '-';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3 },
    head: [[{ content: '3. INTERVENSI YANG DILAKUKAN', colSpan: 1 }]],
    body: [[execText]],
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  const monevMethodsText = Array.isArray(record.monevMethods) ? record.monevMethods.join(', ') : '-';
  const mr = record.monevResults || {};

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2.5 },
    head: [[{ content: '4. MONITORING DAN EVALUASI (MONEV)', colSpan: 2 }]],
    body: [
      ['a. Metode Monev', monevMethodsText],
      ['b. Hasil Monev Minggu 1', mr.week1 || '-'],
      ['Hasil Monev Minggu 2', mr.week2 || '-'],
      ['Hasil Monev Minggu 3', mr.week3 || '-'],
      ['Hasil Monev Minggu 4', mr.week4 || '-'],
      ['Hasil Monev Minggu 5', mr.week5 || '-'],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2.5 },
    head: [[{ content: '5. TERMINASI (PENGAKHIRAN KASUS)', colSpan: 2 }]],
    body: [
      ['a. Kondisi Biologis / Fisik', record.terminationBiological || '-'],
      ['Kondisi Psikologis', record.terminationPsychological || '-'],
      ['Kondisi Sosial', record.terminationSocial || '-'],
      ['Kondisi Spiritual', record.terminationSpiritual || '-'],
      ['b. Kesimpulan Penanganan', record.caseConclusion || '-'],
      ['Tanggal Penutupan Kasus', record.caseClosingDate || '-'],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  addKemensosFooter(doc, config, y, record.caretakerName || config.waliAsrama || 'Wali Asuh Pendamping');

  doc.save(`Catatan_Penanganan_Kasus_${record.studentName || record.id}.pdf`);
}

/**
 * 3. MONITORING PERKEMBANGAN ANAK ASUH (Pages 18-21) - Lampiran 4
 */
export function generateKemensosMonevPDF(record: KemensosMonevRecord, config: AppConfig) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = addKemensosHeader(doc, config, 'LAMPIRAN 4: MONITORING PERKEMBANGAN ANAK ASUH', 'Modul 7 Kemensos 2026 - Lembar Assessment 59 Indikator');

  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'IDENTITAS MONITORING', colSpan: 4 }]],
    body: [
      ['NAMA SAKIT / ANAK ASUH', `: ${record.studentName || '-'}`, 'MONEV KE-', `: ${record.monevNumber || 1}`],
      ['NO. REGISTER / NISN', `: ${record.registerNo || record.studentId || '-'}`, 'BULAN / TAHUN', `: ${record.monthYear || '-'}`],
    ],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Likert Indicator Table items
  const scores = record.scores || {};

  const indicators = [
    { cat: 'A. Perilaku Activities Daily Living (ADL)', items: [
      { id: 'a1', label: '1. Bangun Tidur' },
      { id: 'a2', label: '2. BAB - BAK' },
      { id: 'a3', label: '3. Mandi (termasuk mencuci rambut)' },
      { id: 'a4', label: '4. Gosok Gigi' },
      { id: 'a5', label: '5. Kebersihan diri (potong kuku, kerapihan rambut)' },
      { id: 'a6', label: '6. Kerapihan Pakaian' },
      { id: 'a7', label: '7. Makan dan Minum' },
      { id: 'a8', label: '8. Tidur (ditempat tidur / diluar)' },
      { id: 'a9', label: '9. Menjaga Kesehatan Diri' },
    ]},
    { cat: 'B. PERILAKU DENGAN ASPEK SOSIAL', items: [
      { id: 'b1a', label: '1a. Tingkat Empati' },
      { id: 'b1b', label: '1b. Tingkat Simpati' },
      { id: 'b1c', label: '1c. Keakraban Berkomunikasi' },
      { id: 'b1d', label: '1d. Keramahan / Kesopanan' },
      { id: 'b1e', label: '1e. Kemampuan Menyesuaikan Diri' },
      { id: 'b1f', label: '1f. Kemampuan Mengungkapkan Perasaan' },
      { id: 'b2', label: '2. Kemampuan Memahami Masalah Diri' },
      { id: 'b3', label: '3. Kemampuan Pengambilan Keputusan' },
      { id: 'b4', label: '4. Keterlibatan Aktivitas Bersama' },
      { id: 'b5', label: '5. Keterlibatan Aktivitas Masyarakat/Panti' },
      { id: 'b6', label: '6. Pemahaman Terhadap Orang Tua/Keluarga' },
      { id: 'b7', label: '7. Pemahaman Terhadap Kelompok' },
    ]},
    { cat: 'C. PERILAKU ASPEK MENTAL (PSIKO & SPIRITUAL)', items: [
      { id: 'c1', label: '1. Penghayatan Nilai Agama' },
      { id: 'c2', label: '2. Penghayatan Ibadah Harian' },
      { id: 'c3', label: '3. Penghayatan Ilmu Agama' },
      { id: 'c4', label: '4. Stabilitas Emosional' },
      { id: 'c5', label: '5. Daya Ingat & Penalaran' },
      { id: 'c6', label: '6. Pengendalian Diri & Disiplin' },
      { id: 'c7', label: '7. Tanggung Jawab Pribadi & Sosial' },
      { id: 'c8', label: '8. Pemahaman Terhadap Diri Sendiri (PD)' },
    ]},
    { cat: 'D. PERILAKU ASPEK VOKASIONAL & KERJA', items: [
      { id: 'd1', label: '1. Minat Kegiatan & Keterampilan' },
      { id: 'd2', label: '2. Kesungguhan Mengikuti Keterampilan' },
      { id: 'd3', label: '3. Dorongan Semangat & Disiplin Kerja' },
      { id: 'd4', label: '4. Tanggung Jawab & Kecermatan Kerja' },
      { id: 'd5', label: '5. Kerja Sama & Partisipasi Kerja' },
    ]},
  ];

  const tableBody: any[] = [];

  indicators.forEach((group) => {
    tableBody.push([{ content: group.cat, colSpan: 6, styles: { fillColor: [226, 232, 240], fontStyle: 'bold', textColor: [30, 41, 59] } }]);
    group.items.forEach((item) => {
      const val = scores[item.id] || 3;
      tableBody.push([
        item.label,
        val === 1 ? '✓' : '',
        val === 2 ? '✓' : '',
        val === 3 ? '✓' : '',
        val === 4 ? '✓' : '',
        val === 5 ? '✓' : '',
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 1.5 },
    head: [['ASPEK PERILAKU & KINERJA', 'Sangat Kurang (1)', 'Kurang (2)', 'Cukup (3)', 'Baik (4)', 'Sangat Baik (5)']],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2.5 },
    head: [[{ content: 'E. PERKEMBANGAN PEMECAHAN MASALAH / KASUS', colSpan: 2 }]],
    body: [
      ['1. Permasalahan', record.problemDescription || '-'],
      ['2. Penyebab', record.problemCause || '-'],
      ['3. Akibat', record.problemEffect || '-'],
      ['4. Langkah-Langkah yang Ditempuh', record.actionsTaken || '-'],
      ['5. Rencana Tindak Lanjut', record.followUpPlan || '-'],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2.5 },
    head: [[{ content: 'F. PENILAIAN SECARA UMUM', colSpan: 2 }]],
    body: [
      ['1. Kegiatan positif & Hadiah yang diperoleh', record.positiveActivitiesAndRewards || '-'],
      ['2. Pelanggaran & Sanksi yang diperoleh', record.violationsAndSanctions || '-'],
    ],
    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  addKemensosFooter(doc, config, y, record.caretakerName || config.waliAsrama || 'Wali Asuh Pendamping');

  doc.save(`Monev_Perkembangan_${record.studentName || record.studentId}.pdf`);
}

/**
 * 4. RAPID ASSESSMENT FORM (Pages 22-23) - Lampiran 3
 */
export function generateKemensosRapidAssessmentPDF(record: KemensosRapidAssessmentRecord, config: AppConfig) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = addKemensosHeader(doc, config, 'LAMPIRAN 3: FORMULIR MENDATA / MENGKAJI CEPAT', 'Rapid Assessment Form Pekerja Sosial & Wali Asuh');

  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'IDENTITAS BERTUGAS & KLIEN (PPKS)', colSpan: 2 }]],
    body: [
      ['Nama Pekerja Sosial / Wali Asuh', `: ${record.peksosName || '-'}`],
      ['Hari / Tanggal & Waktu Bertugas', `: ${record.dutyDate || '-'} pukul ${record.dutyTime || '-'}`],
      ['Tempat / Lokasi Bertugas', `: ${record.dutyLocation || '-'}`],
      ['Situasi Area saat Bertugas', `: ${record.areaCondition || '-'}`],
      ['Kategori Kelompok Rentan', `: ${record.vulnerableCategory || '-'}`],
      ['Nama Klien (PPKS)', `: ${record.clientName || '-'}`],
    ],
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  const rights = record.rightsFulfillment || {};
  const rightsRows = [
    ['1. Hak Hidup', rights.hakHidup || 'Terpenuhi baik'],
    ['2. Kelangsungan Hidup', rights.kelangsunganHidup || 'Terpenuhi baik'],
    ['3. Perkembangan Tumbuh-Kembang', rights.tumbuhKembang || 'Sesuai jenjang usia'],
    ['4. Pengasuhan Keluarga Inti / Asrama', rights.pengasuhan || 'Dalam pendampingan asrama'],
    ['5. Hak Identitas & Akta', rights.identitas || 'Lengkap terdaftar'],
    ['6. Hak Berpendapat & Berekspresi', rights.pendapat || 'Aktif mengekspresikan diri'],
    ['7. Hak Kesehatan & Pendidikan', rights.kesehatan || 'Terlayani di sekolah & UKS'],
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'ISU TERKAIT PEMENUHAN HAK ANAK', colSpan: 2 }]],
    body: rightsRows,
    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  const prot = record.protectionIssues || {};
  const protRows = [
    ['Kekerasan Fisik / Verbal', prot.kekerasan || 'Tidak ditemukan temuan kekerasan'],
    ['Eksploitasi', prot.eksploitasi || 'Aman dari eksploitasi'],
    ['Penelantaran', prot.penelantaran || 'Dalam pengasuhan penuh'],
    ['Perlakuan Salah', prot.perlakuanSalah || 'Tidak ada indikasi perlakuan salah'],
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'ISU TERKAIT PERLINDUNGAN ANAK', colSpan: 2 }]],
    body: protRows,
    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  if (y + 35 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }

  const urgent = record.urgentNotes || {};
  const urgentRows = [
    ['Keselamatan (Safety)', urgent.safety || 'Lingkungan aman & kondusif'],
    ['Kelekatan (Attachment)', urgent.attachment || 'Terjalin hubungan positif dengan wali asuh'],
    ['Kesejahteraan Diri (Wellbeing)', urgent.wellbeing || 'Kondisi fisik & psikologis stabil'],
    ['Keajegan / Permanency', urgent.permanency || 'Program pengasuhan berlanjut'],
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 2 },
    head: [[{ content: 'CATATAN PENTING & MENDESAK DARI PEKSOS', colSpan: 2 }]],
    body: urgentRows,
    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  addKemensosFooter(doc, config, y, record.peksosName || 'Pekerja Sosial Bertugas', 'Pekerja Sosial / Wali Asuh');

  doc.save(`Rapid_Assessment_${record.clientName || record.id}.pdf`);
}
