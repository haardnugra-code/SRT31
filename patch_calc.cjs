const fs = require('fs');
const content = fs.readFileSync('src/services/psychologicalBattery.ts', 'utf-8');

const replaceStr = `    if (testType === 'sdq_25') {
      if (dim.key === 'emotional_symptoms') {`;

const patchLogic = `    if (testType === 'mmpi_tni_polri') {
      if (sumScore >= 7) {
        status = 'abnormal';
        statusLabel = dim.key === 'L' || dim.key === 'F' || dim.key === 'K' ? 'Invaliditas Tinggi (Perlu Evaluasi)' : 'Tinggi / Rentan Klinis';
        interpretation = \`Skor \${dim.key} tinggi (\${sumScore}/10). Mengindikasikan \${dim.name} berada pada taraf yang memerlukan perhatian.\`;
      } else if (sumScore >= 5) {
        status = 'borderline';
        statusLabel = 'Ambang Batas (Moderate)';
        interpretation = \`Skor \${dim.key} moderat. Terdapat beberapa tanda \${dim.name} namun belum masuk kategori berat.\`;
      } else {
        status = 'normal';
        statusLabel = 'Normal (Terkendali)';
        interpretation = \`Dalam batas wajar untuk \${dim.name}.\`;
      }
    } else if (testType === 'sdq_25') {
      if (dim.key === 'emotional_symptoms') {`;

let newContent = content.replace(replaceStr, patchLogic);

const replaceOverall = `  if (testType === 'sdq_25') {
    // Total Difficulties Score = Emosi + Perilaku + Hiperaktivitas + Sebaya (0 - 40)`;

const patchOverall = `  if (testType === 'mmpi_tni_polri') {
    totalScore = Object.values(dimensionScores).reduce((acc, curr) => acc + curr.score, 0);
    const validityAbnormal = ['L', 'F', 'K'].some(k => dimensionScores[k]?.score >= 7);
    const clinicalAbnormals = Object.keys(dimensionScores).filter(k => !['L', 'F', 'K'].includes(k) && dimensionScores[k]?.score >= 7).length;
    
    if (validityAbnormal) {
      overallStatus = 'abnormal';
      overallStatusLabel = 'Profil Tidak Valid / Defensif Tinggi';
    } else if (clinicalAbnormals >= 3) {
      overallStatus = 'abnormal';
      overallStatusLabel = 'Profil Klinis Rentan (Perlu Pemeriksaan Lanjutan)';
    } else if (clinicalAbnormals > 0) {
      overallStatus = 'borderline';
      overallStatusLabel = 'Ambang Batas Klinis (Perhatian Khusus)';
    } else {
      overallStatus = 'normal';
      overallStatusLabel = 'Stabilitas Psikologis Optimal';
    }
  } else if (testType === 'sdq_25') {
    // Total Difficulties Score = Emosi + Perilaku + Hiperaktivitas + Sebaya (0 - 40)`;

newContent = newContent.replace(replaceOverall, patchOverall);

const replaceRecs = `  if (testType === 'sdq_25') {
    const emo = dimensionScores['emotional_symptoms'];`;

const patchRecs = `  if (testType === 'mmpi_tni_polri') {
    psychologicalConsiderations.push(\`Hasil MMPI-TNI/POLRI (Total Skor \${totalScore}/100):\`);
    const valStr = ['L','F','K'].map(k => \`\${k}: \${dimensionScores[k]?.score}\`).join(', ');
    psychologicalConsiderations.push(\`Skala Validitas: \${valStr}\`);
    if (overallStatus === 'abnormal' && ['L','F','K'].some(k => dimensionScores[k]?.score >= 7)) {
       riskFactors.push('Kandidat cenderung manipulatif (faking good/bad) atau sangat defensif dalam menjawab asesmen.');
    } else {
       prosocialStrengths.push('Profil kepribadian relatif jujur dan valid dalam memberikan respon asesmen.');
    }

    const clinicalAbnormals = Object.keys(dimensionScores).filter(k => !['L', 'F', 'K'].includes(k) && dimensionScores[k]?.score >= 7);
    if (clinicalAbnormals.length > 0) {
      riskFactors.push(\`Kerentanan terdeteksi pada skala: \${clinicalAbnormals.join(', ')}.\`);
      psychologicalConsiderations.push('Terdapat indikasi kerentanan pada regulasi emosi, tingkat kecemasan, atau kepatuhan otoritas.');
      counselorRecs.push('Lakukan asesmen wawancara klinis mendalam terkait skala MMPI yang menonjol.');
      referralAdvice = 'Sangat direkomendasikan untuk pemeriksaan Psikometri Lanjutan (Wawancara Terstruktur) oleh Psikolog Klinis/Militer.';
    } else {
      prosocialStrengths.push('Stabilitas mental dan kecerdasan emosional berada dalam taraf yang direkomendasikan untuk penugasan bertekanan.');
      counselorRecs.push('Pertahankan pemantauan berkala (observasi rutin).');
    }
  } else if (testType === 'sdq_25') {
    const emo = dimensionScores['emotional_symptoms'];`;

newContent = newContent.replace(replaceRecs, patchRecs);

fs.writeFileSync('src/services/psychologicalBattery.ts', newContent);
console.log('Patched');
