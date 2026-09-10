const fs = require('fs');
let content = fs.readFileSync('src/services/psychologicalPdfGenerator.ts', 'utf-8');

const oldLine = "doc.text(\n    `Total Skor Kesulitan/Resiliensi: ${assessment.totalScore} poin. Tanggal Evaluasi: ${assessment.date}`,\n    margin + 4,\n    y + 10.5\n  );";
const newLine = `  doc.text(
    \`Total Skor \${assessment.testType === 'mmpi_tni_polri' ? 'Klinis & Validitas (MMPI)' : 'Kesulitan/Resiliensi'}: \${assessment.totalScore} poin. Tanggal Evaluasi: \${assessment.date}\`,
    margin + 4,
    y + 10.5
  );`;

content = content.replace(oldLine, newLine);
fs.writeFileSync('src/services/psychologicalPdfGenerator.ts', content);
console.log('Score label patched');
