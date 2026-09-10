const fs = require('fs');
let content = fs.readFileSync('src/services/psychologicalPdfGenerator.ts', 'utf-8');

// Section I replacement
const sec1Old = `  doc.text('I. PERTIMBANGAN KEJIWAAN & DINAMIKA TUMBUH KEMBANG ANAK', margin, y);`;
const sec1New = `  doc.text(
    assessment.testType === 'mmpi_tni_polri' 
      ? 'I. PERTIMBANGAN KLINIS & PROFIL KEPRIBADIAN (MMPI)'
      : 'I. PERTIMBANGAN KEJIWAAN & DINAMIKA TUMBUH KEMBANG ANAK', 
    margin, y
  );`;
content = content.replace(sec1Old, sec1New);

// Section II replacement
const sec2Old = `  doc.text('II. FAKTOR PROTEKTIF (KEKUATAN) & AREA KERENTANAN PSIKOLOGIS', margin, y);`;
const sec2New = `  doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'II. SKALA VALIDITAS (KEJUJURAN) & KERENTANAN KLINIS'
      : 'II. FAKTOR PROTEKTIF (KEKUATAN) & AREA KERENTANAN PSIKOLOGIS',
    margin, y
  );`;
content = content.replace(sec2Old, sec2New);

const strengthLabelOld = `  doc.text('Kekuatan & Potensi Positif Anak:', margin + 2, y);`;
const strengthLabelNew = `  doc.text(
    assessment.testType === 'mmpi_tni_polri' ? 'Indikator Positif / Validitas:' : 'Kekuatan & Potensi Positif Anak:', 
    margin + 2, y
  );`;
content = content.replace(strengthLabelOld, strengthLabelNew);

// Section III replacement
const sec3Old = `  doc.text('III. REKOMENDASI TINDAK LANJUT TERPADU', margin, y);`;
const sec3New = `  doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'III. REKOMENDASI KELAYAKAN (ADMINISTRASI SELEKSI)'
      : 'III. REKOMENDASI TINDAK LANJUT TERPADU',
    margin, y
  );`;
content = content.replace(sec3Old, sec3New);

const fullRecsOld = `  doc.text('1. Untuk Wali Asuh di Asrama:', margin + 2, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  assessment.recommendations.forCaretaker.forEach((r) => {
    const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('2. Untuk Guru Pengampu di Kelas:', margin + 2, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  assessment.recommendations.forTeacher.forEach((r) => {
    const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('3. Untuk Guru BK / Pendamping Psikososial:', margin + 2, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  assessment.recommendations.forCounselor.forEach((r) => {
    const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });

  if (assessment.recommendations.referralAdvice) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    const lines = doc.splitTextToSize(\`Rujukan Khusus: \${assessment.recommendations.referralAdvice}\`, pageWidth - margin * 2 - 6);
    doc.text(lines, margin + 2, y);
    y += lines.length * 3.5;
  }`;

const fullRecsNew = `  if (assessment.testType === 'mmpi_tni_polri') {
    doc.text('1. Status Kelayakan Administrasi Psikologi:', margin + 2, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    let eligibility = '';
    if (assessment.overallStatus === 'normal') {
      eligibility = 'MEMENUHI SYARAT (MS). Kandidat menunjukkan profil psikologis yang stabil, jujur (valid), dan siap secara mental untuk penugasan bertekanan tinggi.';
    } else if (assessment.overallStatus === 'borderline') {
      eligibility = 'DIPERTIMBANGKAN DENGAN CATATAN (K-2). Kandidat memiliki ambang batas kerentanan. Disarankan pendalaman melalui wawancara psikologi klinis/psikiatri.';
    } else {
      eligibility = 'TIDAK MEMENUHI SYARAT (TMS). Kandidat menunjukkan profil psikologis berisiko tinggi atau tingkat defensif/manipulatif (invaliditas) yang melampaui batas toleransi.';
    }
    
    const eligLines = doc.splitTextToSize(\`- \${eligibility}\`, pageWidth - margin * 2 - 6);
    doc.text(eligLines, margin + 4, y);
    y += eligLines.length * 3.5 + 2;
    
    doc.setFont('helvetica', 'bold');
    doc.text('2. Catatan Khusus Evaluator:', margin + 2, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    assessment.recommendations.forCounselor.forEach((r) => {
      const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
      doc.text(lines, margin + 4, y);
      y += lines.length * 3.5;
    });
    
    if (assessment.recommendations.referralAdvice) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      const refLines = doc.splitTextToSize(\`RUJUKAN: \${assessment.recommendations.referralAdvice}\`, pageWidth - margin * 2 - 6);
      doc.text(refLines, margin + 4, y);
      y += refLines.length * 3.5;
    }
  } else {
    doc.text('1. Untuk Wali Asuh di Asrama:', margin + 2, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    assessment.recommendations.forCaretaker.forEach((r) => {
      const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
      doc.text(lines, margin + 4, y);
      y += lines.length * 3.5;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('2. Untuk Guru Pengampu di Kelas:', margin + 2, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    assessment.recommendations.forTeacher.forEach((r) => {
      const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
      doc.text(lines, margin + 4, y);
      y += lines.length * 3.5;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('3. Untuk Guru BK / Pendamping Psikososial:', margin + 2, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    assessment.recommendations.forCounselor.forEach((r) => {
      const lines = doc.splitTextToSize(\`- \${r}\`, pageWidth - margin * 2 - 6);
      doc.text(lines, margin + 4, y);
      y += lines.length * 3.5;
    });

    if (assessment.recommendations.referralAdvice) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      const lines = doc.splitTextToSize(\`Rujukan Khusus: \${assessment.recommendations.referralAdvice}\`, pageWidth - margin * 2 - 6);
      doc.text(lines, margin + 2, y);
      y += lines.length * 3.5;
    }
  }`;

content = content.replace(fullRecsOld, fullRecsNew);

fs.writeFileSync('src/services/psychologicalPdfGenerator.ts', content);
console.log('Patched');
