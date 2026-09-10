const fs = require('fs');
let content = fs.readFileSync('src/services/psychologicalPdfGenerator.ts', 'utf-8');

// Replace Nama Siswa label
content = content.replace(
  "doc.text('Nama Siswa', margin + 4, y + 6);",
  "doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Nama Peserta' : 'Nama Siswa', margin + 4, y + 6);"
);

// Replace NISN / ID label
content = content.replace(
  "doc.text('NISN / ID', margin + 4, y + 11);",
  "doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Nomor Seleksi' : 'NISN / ID', margin + 4, y + 11);"
);

// Replace Kelas & Asrama
content = content.replace(
  "doc.text('Kelas & Asrama', margin + 4, y + 16);",
  "doc.text(assessment.testType === 'mmpi_tni_polri' ? 'Polda/Panda' : 'Kelas & Asrama', margin + 4, y + 16);"
);

fs.writeFileSync('src/services/psychologicalPdfGenerator.ts', content);
console.log('Labels patched');
