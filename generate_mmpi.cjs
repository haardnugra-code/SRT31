const fs = require('fs');

const dimensions = [
  { key: 'L', name: 'Skala L (Kebohongan / Defensiveness)', maxScore: 10, description: 'Kecenderungan untuk menampilkan diri secara berlebihan baik (faking good).' },
  { key: 'F', name: 'Skala F (Infrequency / Faking Bad)', maxScore: 10, description: 'Kecenderungan melebih-lebihkan masalah atau menjawab acak.' },
  { key: 'K', name: 'Skala K (Koreksi / Sikap Bertahan)', maxScore: 10, description: 'Tingkat defensif terhadap tes psikologi.' },
  { key: 'Hs', name: 'Hipokondriasis (Kecemasan Kesehatan)', maxScore: 10, description: 'Kekhawatiran berlebihan terhadap fungsi tubuh dan kesehatan.' },
  { key: 'D', name: 'Depresi (Distres Mental)', maxScore: 10, description: 'Tingkat kesedihan, keputusasaan, dan ketidakpuasan hidup.' },
  { key: 'Hy', name: 'Histeria (Konversi Fisik)', maxScore: 10, description: 'Kecenderungan menggunakan gejala fisik untuk menghindari stres psikologis.' },
  { key: 'Pd', name: 'Penyimpangan Psikopat (Otoritas)', maxScore: 10, description: 'Konflik dengan otoritas, norma sosial, dan impulsivitas.' },
  { key: 'Pa', name: 'Paranoia (Kecurigaan)', maxScore: 10, description: 'Tingkat sensitivitas, kecurigaan, dan perasaan dianiaya.' },
  { key: 'Pt', name: 'Psikastenia (Kecemasan / Obsesif)', maxScore: 10, description: 'Kecemasan kronis, keragu-raguan, dan perilaku obsesif.' },
  { key: 'Sc', name: 'Skizofrenia (Keterasingan Sosial)', maxScore: 10, description: 'Pikiran kacau, keterasingan sosial yang tidak wajar.' }
];

const q_data = {
  'L': [
    "Saya tidak pernah berbohong sekalipun untuk kebaikan.",
    "Saya tidak pernah marah saat dikritik atau disalahkan.",
    "Saya selalu menaati peraturan lalu lintas setiap saat.",
    "Saya tidak pernah membicarakan keburukan orang lain.",
    "Saya tidak pernah menunda pekerjaan sekecil apapun.",
    "Saya selalu ramah kepada semua orang tanpa terkecuali.",
    "Saya tidak pernah iri pada kesuksesan orang lain.",
    "Saya menyukai dan peduli pada semua orang yang saya kenal.",
    "Saya selalu membaca setiap dokumen sepenuhnya sebelum menyetujuinya.",
    "Saya tidak pernah mengucapkan kata-kata kotor saat sedang marah."
  ],
  'F': [
    "Saya sering melihat bayangan hitam yang tidak terlihat orang lain.",
    "Pikiran saya dikendalikan oleh kekuatan asing dari luar angkasa.",
    "Saya merasa dunia akan segera kiamat dalam waktu dekat.",
    "Saya sering mendengar suara-suara yang menyuruh saya berbuat hal buruk.",
    "Saya tidak mengenali wajah saya sendiri saat berkaca.",
    "Semua makanan terasa seperti racun bagi saya.",
    "Saya merasa jantung saya pernah berhenti berdetak selama beberapa menit.",
    "Setiap hari saya merasa ingin segera mati saja.",
    "Tidak ada satupun orang di dunia ini yang benar-benar nyata.",
    "Saya merasa organ dalam tubuh saya perlahan membusuk."
  ],
  'K': [
    "Saya tidak butuh bantuan siapa pun untuk menyelesaikan masalah pribadi saya.",
    "Saya tidak pernah merasa gugup walau dalam tekanan berat.",
    "Kritikan orang lain sama sekali tidak mempengaruhi saya.",
    "Keluarga saya adalah keluarga yang paling harmonis tanpa masalah.",
    "Saya selalu bisa mengendalikan emosi saya dengan sempurna.",
    "Saya jarang cemas akan hal-hal yang belum terjadi.",
    "Orang lain terlalu membesar-besarkan masalah psikologis mereka.",
    "Saya merasa memiliki kondisi mental yang 100% stabil setiap hari.",
    "Sangat jarang saya merasa menyesal atas perbuatan saya.",
    "Saya tidak pernah merasa hidup ini tidak adil bagi saya."
  ],
  'Hs': [
    "Saya sangat sering mengkhawatirkan kondisi kesehatan fisik saya.",
    "Saya sering merasa pusing atau sakit kepala berat akhir-akhir ini.",
    "Dada saya sering terasa nyeri atau sesak napas tanpa aktivitas fisik.",
    "Saya sering merasakan mual, perut kembung, dan gangguan pencernaan.",
    "Tangan atau kaki saya sering terasa kesemutan atau mati rasa.",
    "Kesehatan saya terasa lebih buruk dibanding orang lain seusia saya.",
    "Saya sering terbangun karena nyeri otot yang muncul tiba-tiba.",
    "Saya mudah merasa lelah meskipun baru saja bangun tidur.",
    "Saya sangat cemas jika ada bintik merah atau gejala kecil di tubuh saya.",
    "Saya merasa sering sakit-sakitan dalam beberapa bulan terakhir."
  ],
  'D': [
    "Saya sering merasa sangat sedih dan murung hampir sepanjang hari.",
    "Masa depan terlihat sangat suram dan saya tidak punya harapan.",
    "Hal-hal yang dulu menyenangkan kini tidak lagi menarik minat saya.",
    "Saya sering merasa diri saya tidak berguna atau berharga.",
    "Saya sering merasa ingin menangis walau tidak ada alasan yang jelas.",
    "Saya merasa sangat lambat dalam berpikir maupun bergerak.",
    "Terkadang saya berharap lebih baik tidak pernah dilahirkan.",
    "Saya kesulitan membuat keputusan kecil yang biasanya mudah.",
    "Orang-orang akan merasa lebih baik jika saya tidak ada.",
    "Saya hampir tidak pernah merasa benar-benar bahagia."
  ],
  'Hy': [
    "Saya sering tiba-tiba sakit perut ketika harus menghadapi konflik besar.",
    "Saya butuh perhatian lebih banyak dari orang di sekitar saya.",
    "Saya sering sakit kepala berdenyut hebat saat merasa tertekan.",
    "Terkadang otot saya terasa kaku dan lumpuh sesaat ketika sangat takut.",
    "Saya lebih mudah kelelahan secara fisik saat stres pikiran melanda.",
    "Bila ada masalah berat, saya mencoba melupakannya dan berpura-pura tidak terjadi.",
    "Suara saya pernah hilang sesaat akibat syok emosional.",
    "Sangat penting bagi saya untuk disukai oleh semua orang.",
    "Orang lain sering kali tidak mengerti betapa sensitifnya perasaan saya.",
    "Saya sering merasa pusing seperti berputar ketika dikritik tajam."
  ],
  'Pd': [
    "Aturan dibuat hanya untuk membatasi kebebasan dan harus sering dilanggar.",
    "Saya tidak peduli dengan omongan atau penilaian orang tentang diri saya.",
    "Saya bosan dengan rutinitas dan selalu mencari sensasi yang menantang.",
    "Berbohong untuk menghindari hukuman adalah hal yang wajar bagi saya.",
    "Saya merasa tidak bersalah meski telah mengecewakan orang lain.",
    "Saya sering berkonflik keras dengan figur otoritas (atasan/guru/orangtua).",
    "Saya bisa memanipulasi orang lain dengan mudah demi keuntungan saya.",
    "Kebebasan saya lebih penting dari sekadar menjaga kesopanan sosial.",
    "Saya pernah melanggar peraturan atau hukum secara sadar dan berulang.",
    "Sangat sulit bagi saya untuk menyesuaikan diri dengan sistem kedisiplinan militer."
  ],
  'Pa': [
    "Banyak orang yang secara rahasia ingin menjatuhkan karir atau hidup saya.",
    "Sangat berbahaya mempercayai rekan kerja karena mereka bisa berkhianat.",
    "Saya merasa sering dibicarakan keburukannya di belakang saya.",
    "Saya yakin beberapa orang sengaja membuat masalah bagi saya.",
    "Jika saya lengah, orang pasti akan memanfaatkan kebaikan saya.",
    "Saya sulit memaafkan dan akan membalas dendam pada yang menyakiti saya.",
    "Orang-orang sering berpura-pura baik padahal punya niat buruk tersembunyi.",
    "Saya sangat sensitif bila ada orang yang melihat saya dengan cara yang salah.",
    "Banyak orang cemburu terhadap kemampuan dan prestasi yang saya miliki.",
    "Saya curiga keluarga atau teman diam-diam berkonspirasi terhadap saya."
  ],
  'Pt': [
    "Saya sering terobsesi pada kesalahan kecil yang saya buat di masa lalu.",
    "Saya punya kebiasaan mengecek hal berulang kali (seperti kunci pintu) karena ragu.",
    "Pikiran-pikiran buruk terus berputar di otak dan saya tak bisa menghentikannya.",
    "Saya sering cemas bahwa hal buruk akan segera menimpa orang terdekat saya.",
    "Perubahan kecil dalam rutinitas membuat saya sangat stres dan terganggu.",
    "Saya sering ditakuti oleh ketakutan tidak beralasan terhadap ruang tertutup atau gelap.",
    "Saya harus mengerjakan segalanya secara sangat sempurna atau tidak sama sekali.",
    "Ketegangan mental membuat saya sulit bersantai meski di hari libur.",
    "Saya sering ragu-ragu sehingga pekerjaan tidak pernah selesai tepat waktu.",
    "Saya mencemaskan masa depan hingga membuat saya tidak bisa fokus pada masa kini."
  ],
  'Sc': [
    "Saya sering memiliki ide-ide aneh yang membuat orang lain bingung.",
    "Saya merasa benar-benar terisolasi dan sendirian di dunia ini.",
    "Saya lebih suka melamun dan hidup di khayalan daripada menghadapi dunia nyata.",
    "Orang lain sering menganggap perilaku atau gaya hidup saya sangat aneh.",
    "Saya merasa tidak terhubung atau mati rasa terhadap tubuh saya sendiri.",
    "Saya percaya kejadian-kejadian acak memiliki arti khusus yang tertuju pada saya.",
    "Terkadang pikiran saya tiba-tiba kosong seperti ditarik keluar dari otak.",
    "Saya sangat kesulitan merasakan emosi sedih, senang, atau empati.",
    "Saya tidak menikmati sosialisasi dan selalu menjauhi orang lain sebisa mungkin.",
    "Saya pernah merasa lingkungan saya ini bukanlah dunia nyata."
  ]
};

let questionsStr = '';
let q_num = 1;

const mmpiOptionsStr = `const mmpiOptions: QuestionOption[] = [
  { value: 1, label: 'Ya', description: 'Pernyataan ini sesuai dengan diri saya' },
  { value: 0, label: 'Tidak', description: 'Pernyataan ini tidak sesuai dengan diri saya' }
];`;

questionsStr += mmpiOptionsStr + "\n\n";

const allQuestions = [];
for (let i = 0; i < 10; i++) {
  // Mix dimensions order to prevent chunks
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
  title: 'Tes Psikologi Kepribadian MMPI (Adaptasi Klinis TNI/POLRI)',
  subtitle: 'Evaluasi 100 Item Klinis & Validitas Terstruktur',
  description: 'Instrumen ini dirancang untuk mendeteksi profil kepribadian, stabilitas klinis, kejujuran (validitas), dan potensi kerentanan kejiwaan sesuai dengan standar seleksi atau evaluasi berkala aparat/kandidat kedinasan.',
  targetAge: 'Kandidat Seleksi / Personel (17+ tahun)',
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
