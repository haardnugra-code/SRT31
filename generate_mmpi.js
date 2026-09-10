const fs = require('fs');

const dimensions = [
  { key: 'L', name: 'Skala L (Kebohongan / Defensiveness)', maxScore: 10, description: 'Kecenderungan untuk menampilkan diri secara berlebihan baik (faking good).' },
  { key: 'F', name: 'Skala F (Infrequency / Faking Bad)', maxScore: 10, description: 'Kecenderungan melebih-lebihkan masalah atau menjawab acak.' },
  { key: 'K', name: 'Skala K (Koreksi / Sikap Bertahan)', maxScore: 10, description: 'Tingkat defensif terhadap tes psikologi.' },
  { key: 'Hs', name: 'Hipokondriasis (Kecemasan Kesehatan)', maxScore: 10, description: 'Kekhawatiran berlebihan terhadap fungsi tubuh dan kesehatan.' },
  { key: 'D', name: 'Depresi', maxScore: 10, description: 'Tingkat kesedihan, keputusasaan, dan ketidakpuasan hidup.' },
  { key: 'Hy', name: 'Histeria (Konversi Emosi ke Fisik)', maxScore: 10, description: 'Kecenderungan menggunakan gejala fisik untuk menghindari konflik.' },
  { key: 'Pd', name: 'Penyimpangan Psikopat (Otoritas)', maxScore: 10, description: 'Konflik dengan otoritas, norma sosial, dan ketidakpedulian.' },
  { key: 'Pa', name: 'Paranoia (Kecurigaan)', maxScore: 10, description: 'Tingkat sensitivitas, kecurigaan, dan perasaan dianiaya.' },
  { key: 'Pt', name: 'Psikastenia (Kecemasan / Obsesif)', maxScore: 10, description: 'Kecemasan, fobia, ragu-ragu, dan perilaku obsesif-kompulsif.' },
  { key: 'Sc', name: 'Skizofrenia (Keterasingan / Pikiran Aneh)', maxScore: 10, description: 'Pikiran kacau, halusinasi, keterasingan sosial yang tidak wajar.' }
];

// Generate 100 questions (10 per dimension)
const q_data = {
  'L': [
    "Saya selalu mengatakan yang sebenarnya dalam segala situasi.", // reverse (if they say Ya, it's a point on L - meaning they lie to look good)
    "Saya tidak pernah marah sekalipun orang lain sangat keterlaluan.",
    "Saya selalu menaati peraturan lalu lintas walaupun tidak ada polisi.",
    "Saya tidak pernah menggosipkan keburukan orang lain.",
    "Saya selalu menyelesaikan tugas tepat waktu tanpa pernah menunda.",
    "Saya selalu tersenyum dan ramah kepada semua orang setiap saat.",
    "Saya tidak pernah merasa malas sedikitpun setiap bangun pagi.",
    "Saya menyukai setiap orang yang saya kenal.",
    "Saya tidak pernah merasa cemburu atau iri hati.",
    "Saya tidak pernah berbicara kasar sekalipun sedang sangat emosi."
  ], // "Ya" = 1 to L scale.
  'F': [
    "Saya sering melihat makhluk atau hal-hal yang tidak bisa dilihat orang lain.",
    "Saya merasa ada orang yang mengendalikan pikiran saya dari jauh.",
    "Saya sering merasa ingin melompat ketika berada di tempat tinggi.",
    "Saya merasa roh saya kadang-kadang keluar dari tubuh saya.",
    "Dunia ini terasa sangat tidak nyata dan seperti ilusi belaka.",
    "Saya sering mendengar suara-suara aneh di kepala saya yang menyuruh saya berbuat jahat.",
    "Saya percaya bahwa ada konspirasi besar yang mengawasi saya setiap hari.",
    "Kadang-kadang saya merasa kepala saya sakit sampai ingin meledak.",
    "Saya tidak tahu siapa diri saya sebenarnya.",
    "Saya merasa hidup ini benar-benar tidak ada gunanya sama sekali dan dunia akan kiamat besok."
  ],
  'K': [
    "Saya jarang meminta bantuan orang lain untuk menyelesaikan masalah saya.",
    "Saya merasa orang lain lebih banyak memiliki masalah dibanding saya.",
    "Saya sangat jarang merasa gugup saat menghadapi ujian atau atasan.",
    "Kritik dari orang lain tidak pernah membuat saya merasa terganggu.",
    "Saya merasa sangat percaya diri bahwa saya tidak memiliki kelemahan psikologis.",
    "Saya hampir tidak pernah merasa khawatir akan hal-hal yang belum terjadi.",
    "Keluarga saya tidak pernah memiliki masalah yang berarti.",
    "Saya merasa selalu bisa mengontrol emosi saya dalam kondisi seburuk apa pun.",
    "Saya merasa orang lain sering membesar-besarkan masalah mereka.",
    "Saya tidak pernah merasa bahwa hidup ini tidak adil bagi saya."
  ],
  'Hs': [
    "Saya sering merasa perut saya mual dan tidak nyaman.",
    "Saya sering mengalami sakit kepala yang hebat lebih dari seminggu sekali.",
    "Kesehatan saya terasa lebih buruk daripada kebanyakan orang seumuran saya.",
    "Saya merasa jantung saya sering berdebar sangat kencang tanpa alasan.",
    "Napas saya sering terasa sesak walau tidak sedang berolahraga.",
    "Saya sering merasa ada bagian tubuh saya yang mati rasa atau kesemutan.",
    "Saya sangat mengkhawatirkan penyakit yang mungkin sedang saya derita.",
    "Otot-otot saya sering terasa tegang dan kaku tanpa sebab.",
    "Saya merasa gampang lelah dan tidak bertenaga setiap hari.",
    "Saya sering merasakan nyeri di berbagai bagian tubuh yang berpindah-pindah."
  ],
  'D': [
    "Saya sering merasa sedih dan murung tanpa alasan yang jelas.",
    "Masa depan terasa suram dan tidak ada yang bisa saya harapkan.",
    "Hal-hal yang dulu saya sukai kini tidak menarik lagi bagi saya.",
    "Saya sering terbangun di malam hari dan sulit tidur kembali karena gelisah.",
    "Saya merasa tidak berharga dan sering menyalahkan diri sendiri.",
    "Saya sering merasa ingin menangis tanpa sebab.",
    "Energi saya terasa sangat rendah dan saya kesulitan memulai aktivitas.",
    "Saya merasa hidup ini tidak layak untuk dijalani.",
    "Saya sulit mengambil keputusan bahkan untuk hal yang paling sepele.",
    "Orang lain akan jauh lebih baik jika saya tidak ada."
  ],
  'Hy': [
    "Saat saya sedang tertekan, saya sering tiba-tiba merasa sakit perut atau sakit kepala.",
    "Saya merasa butuh banyak perhatian dan kasih sayang dari orang-orang di sekitar saya.",
    "Saya sering merasa pusing hingga ingin pingsan ketika sedang berkonflik.",
    "Orang-orang di sekitar saya sering kali mengecewakan saya secara emosional.",
    "Saat saya marah, terkadang otot saya menjadi kaku dan sulit digerakkan.",
    "Saya sering merasa tidak dimengerti oleh teman dan keluarga saya.",
    "Bila ada masalah besar, saya cenderung menghindar atau menganggapnya tidak ada.",
    "Saya lebih mudah merasa lelah dibanding orang lain ketika menghadapi ujian mental.",
    "Terkadang saya tiba-tiba tidak bisa bersuara ketika sedang sangat stres.",
    "Saya merasa saya lebih sensitif dan perasa dibandingkan orang kebanyakan."
  ],
  'Pd': [
    "Saya sering merasa aturan dibuat hanya untuk dilanggar.",
    "Saya pernah melanggar hukum atau aturan disiplin secara sadar.",
    "Saya tidak peduli dengan apa yang orang lain pikirkan tentang saya.",
    "Saya merasa bosan dengan sangat mudah dan suka mencari tantangan yang berisiko.",
    "Saya sering berkonflik dengan atasan, guru, atau orang tua.",
    "Saya kadang memanipulasi orang lain agar mendapatkan apa yang saya inginkan.",
    "Bagi saya, berbohong adalah hal biasa selama saya tidak ketahuan.",
    "Saya merasa kebebasan saya jauh lebih penting daripada norma masyarakat.",
    "Saya sering tidak merasa bersalah setelah melakukan kesalahan yang merugikan orang lain.",
    "Saya merasa sangat sulit untuk patuh pada rutinitas atau disiplin yang kaku."
  ],
  'Pa': [
    "Saya merasa banyak orang yang diam-diam mencoba menjatuhkan saya.",
    "Sangat berbahaya jika saya terlalu percaya kepada orang lain.",
    "Seringkali ada orang yang membicarakan keburukan saya di belakang.",
    "Seseorang pernah merencanakan hal buruk terhadap saya.",
    "Jika saya tidak berhati-hati, orang lain pasti akan memanfaatkan kelemahan saya.",
    "Saya yakin banyak orang iri terhadap kemampuan yang saya miliki.",
    "Saya merasa ada pihak yang sengaja menghambat karier atau kesuksesan saya.",
    "Orang sering berpura-pura peduli padahal mereka punya niat buruk.",
    "Sangat sulit memaafkan orang yang pernah menyakiti atau menghina saya.",
    "Saya sering mencurigai kesetiaan teman-teman di sekitar saya."
  ],
  'Pt': [
    "Saya sering harus memeriksa sesuatu berulang kali (seperti kunci pintu) sebelum bisa tenang.",
    "Pikiran-pikiran buruk terus berputar di kepala saya dan saya tidak bisa menghentikannya.",
    "Saya merasa sangat cemas terhadap hal-hal kecil yang tidak penting.",
    "Saya sering merasa ada bahaya yang akan datang walaupun keadaannya aman.",
    "Saya merasa tertekan jika rutinitas dan jadwal saya terganggu sedikit saja.",
    "Saya memiliki ketakutan yang tidak masuk akal terhadap benda atau situasi tertentu.",
    "Saya sangat perfeksionis hingga membuat saya frustrasi sendiri.",
    "Bahkan saat beristirahat, otak saya terus tegang memikirkan tugas-tugas.",
    "Saya sering merasa ragu-ragu hingga sulit mengambil keputusan dengan cepat.",
    "Kecemasan saya sering membuat saya sulit berkonsentrasi pada pekerjaan."
  ],
  'Sc': [
    "Saya sering memiliki pikiran aneh yang sangat berbeda dari orang kebanyakan.",
    "Saya merasa tidak ada orang yang benar-benar bisa memahami jalan pikiran saya.",
    "Saya kadang merasa tubuh saya berubah bentuk secara tidak wajar.",
    "Saya lebih suka menyendiri jauh dari keramaian sepanjang waktu.",
    "Banyak hal yang terjadi di dunia ini memiliki arti khusus bagi saya sendiri.",
    "Kadang-kadang pikiran saya seolah-olah kosong dan berhenti bekerja.",
    "Saya lebih sering hidup di dunia khayalan saya dibanding di dunia nyata.",
    "Orang lain sering menganggap perilaku atau ucapan saya sangat aneh.",
    "Saya sulit merasakan emosi sedih maupun bahagia (terasa datar saja).",
    "Saya merasa tidak terhubung dengan tubuh saya maupun kenyataan di sekitar saya."
  ]
};

let questionsStr = '';
let q_num = 1;

const mmpiOptionsStr = `const mmpiOptions: QuestionOption[] = [
  { value: 1, label: 'Ya', description: 'Pernyataan ini SESUAI dengan diri saya' },
  { value: 0, label: 'Tidak', description: 'Pernyataan ini TIDAK SESUAI dengan diri saya' }
];`;

questionsStr += mmpiOptionsStr + "\n\n";

const allQuestions = [];
for (let i = 0; i < 10; i++) {
  // mix questions from dimensions to avoid 10 in a row
  for (const dim of dimensions) {
    const q_text = q_data[dim.key][i];
    allQuestions.push({
      id: `mmpi_${dim.key.toLowerCase()}_${i+1}`,
      number: q_num++,
      dimensionKey: dim.key,
      text: q_text,
      options: 'mmpiOptions'
    });
  }
}

let code = `export const mmpiTniPolriBattery: PsychologicalTestDefinition = {
  type: 'mmpi_tni_polri',
  title: 'Inventori Kepribadian MMPI (Adaptasi Polri/TNI)',
  subtitle: 'Evaluasi 100 Item Klinis & Validitas',
  description: 'Tes ini mengukur stabilitas kepribadian, ketahanan mental, kepatuhan otoritas, dan kejujuran untuk kelayakan rekrutmen atau penugasan.',
  targetAge: 'Kandidat Seleksi / Dewasa (17+ tahun)',
  durationMinutes: 45,
  totalQuestions: 100,
  dimensions: [\n`;

dimensions.forEach(d => {
  code += `    { key: '${d.key}', name: '${d.name}', maxScore: ${d.maxScore}, description: '${d.description}' },\n`;
});
code += `  ],\n  questions: [\n`;

allQuestions.forEach(q => {
  code += `    {
      id: '${q.id}',
      number: ${q.number},
      dimensionKey: '${q.dimensionKey}',
      text: '${q.text}',
      options: mmpiOptions
    },\n`;
});
code += `  ]\n};\n`;

fs.writeFileSync('mmpi_battery.ts_snippet', code);
