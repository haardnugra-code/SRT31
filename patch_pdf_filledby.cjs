const fs = require('fs');
let content = fs.readFileSync('src/services/psychologicalPdfGenerator.ts', 'utf-8');

const oldLine = "doc.text(`: ${assessment.filledBy === 'student' ? 'Akses Mandiri Siswa' : 'Didampingi Pengasuh/BK'}`, pageWidth / 2 + 45, y + 16);";
const newLine = `  doc.text(
    \`: \${assessment.filledBy === 'student' ? (assessment.testType === 'mmpi_tni_polri' ? 'CAT (Computer Assisted Test) Mandiri' : 'Akses Mandiri Siswa') : 'Didampingi Pengasuh/BK'}\`,
    pageWidth / 2 + 45, y + 16
  );`;

content = content.replace(oldLine, newLine);
fs.writeFileSync('src/services/psychologicalPdfGenerator.ts', content);
console.log('FilledBy patched');
