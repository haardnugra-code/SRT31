const fs = require('fs');
let content = fs.readFileSync('src/services/psychologicalPdfGenerator.ts', 'utf-8');

const oldTitleLine = "doc.text('LAPORAN HASIL ASESMEN PSIKOLOGI & TUMBUH KEMBANG KEJIWAAN', pageWidth / 2, y, { align: 'center' });";
const newTitleLine = `  doc.text(
    assessment.testType === 'mmpi_tni_polri'
      ? 'LAPORAN EVALUASI PSIKOLOGI KLINIS (MMPI) KANDIDAT SELEKSI'
      : 'LAPORAN HASIL ASESMEN PSIKOLOGI & TUMBUH KEMBANG KEJIWAAN',
    pageWidth / 2, y, { align: 'center' }
  );`;

content = content.replace(oldTitleLine, newTitleLine);
fs.writeFileSync('src/services/psychologicalPdfGenerator.ts', content);
console.log('Title patched');
