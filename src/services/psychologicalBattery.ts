import {
  PsychologicalTestType,
  PsychologicalAssessment,
  PsychologicalDimensionScore,
  PsychologicalClinicalStatus,
  Student
} from '../types';

export interface QuestionOption {
  value: number;
  label: string;
  emoji?: string;
  description?: string;
}

export interface PsychologicalQuestion {
  id: string;
  number: number;
  dimensionKey: string;
  text: string;
  hint?: string;
  reverseScore?: boolean;
  options: QuestionOption[];
}

export interface PsychologicalTestDefinition {
  type: PsychologicalTestType;
  title: string;
  subtitle: string;
  description: string;
  targetAge: string;
  durationMinutes: number;
  totalQuestions: number;
  dimensions: {
    key: string;
    name: string;
    description: string;
    isStrength?: boolean;
    maxScore: number;
  }[];
  questions: PsychologicalQuestion[];
}

// ---------------------------------------------------------------------------
// OPTIONS SETS

const mmpiOptions: QuestionOption[] = [
  { value: 1, label: 'Ya', description: 'Pernyataan ini sesuai dengan diri saya' },
  { value: 0, label: 'Tidak', description: 'Pernyataan ini tidak sesuai dengan diri saya' }
];

export const mmpiTniPolriBattery: PsychologicalTestDefinition = {
  type: 'mmpi_tni_polri',
  title: 'Tes Psikologi Kepribadian MMPI (Adaptasi Klinis TNI/POLRI)',
  subtitle: 'Evaluasi 100 Item Klinis & Validitas Terstruktur',
  description: 'Instrumen ini dirancang untuk mendeteksi profil kepribadian, stabilitas klinis, kejujuran (validitas), dan potensi kerentanan kejiwaan sesuai dengan standar seleksi atau evaluasi berkala aparat/kandidat kedinasan.',
  targetAge: 'Kandidat Seleksi / Personel (17+ tahun)',
  durationMinutes: 45,
  totalQuestions: 100,
  dimensions: [
    { key: 'L', name: 'Skala L (Kebohongan / Defensiveness)', maxScore: 10, description: 'Kecenderungan untuk menampilkan diri secara berlebihan baik (faking good).' },
    { key: 'F', name: 'Skala F (Infrequency / Faking Bad)', maxScore: 10, description: 'Kecenderungan melebih-lebihkan masalah atau menjawab acak.' },
    { key: 'K', name: 'Skala K (Koreksi / Sikap Bertahan)', maxScore: 10, description: 'Tingkat defensif terhadap tes psikologi.' },
    { key: 'Hs', name: 'Hipokondriasis (Kecemasan Kesehatan)', maxScore: 10, description: 'Kekhawatiran berlebihan terhadap fungsi tubuh dan kesehatan.' },
    { key: 'D', name: 'Depresi (Distres Mental)', maxScore: 10, description: 'Tingkat kesedihan, keputusasaan, dan ketidakpuasan hidup.' },
    { key: 'Hy', name: 'Histeria (Konversi Fisik)', maxScore: 10, description: 'Kecenderungan menggunakan gejala fisik untuk menghindari stres psikologis.' },
    { key: 'Pd', name: 'Penyimpangan Psikopat (Otoritas)', maxScore: 10, description: 'Konflik dengan otoritas, norma sosial, dan impulsivitas.' },
    { key: 'Pa', name: 'Paranoia (Kecurigaan)', maxScore: 10, description: 'Tingkat sensitivitas, kecurigaan, dan perasaan dianiaya.' },
    { key: 'Pt', name: 'Psikastenia (Kecemasan / Obsesif)', maxScore: 10, description: 'Kecemasan kronis, keragu-raguan, dan perilaku obsesif.' },
    { key: 'Sc', name: 'Skizofrenia (Keterasingan Sosial)', maxScore: 10, description: 'Pikiran kacau, keterasingan sosial yang tidak wajar.' },
  ],
  questions: [
    {
      id: 'mmpi_l_1',
      number: 1,
      dimensionKey: 'L',
      text: 'Saya tidak pernah berbohong sekalipun untuk kebaikan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_1',
      number: 2,
      dimensionKey: 'F',
      text: 'Saya sering melihat bayangan hitam yang tidak terlihat orang lain.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_1',
      number: 3,
      dimensionKey: 'K',
      text: 'Saya tidak butuh bantuan siapa pun untuk menyelesaikan masalah pribadi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_1',
      number: 4,
      dimensionKey: 'Hs',
      text: 'Saya sangat sering mengkhawatirkan kondisi kesehatan fisik saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_1',
      number: 5,
      dimensionKey: 'D',
      text: 'Saya sering merasa sangat sedih dan murung hampir sepanjang hari.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_1',
      number: 6,
      dimensionKey: 'Hy',
      text: 'Saya sering tiba-tiba sakit perut ketika harus menghadapi konflik besar.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_1',
      number: 7,
      dimensionKey: 'Pd',
      text: 'Aturan dibuat hanya untuk membatasi kebebasan dan harus sering dilanggar.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_1',
      number: 8,
      dimensionKey: 'Pa',
      text: 'Banyak orang yang secara rahasia ingin menjatuhkan karir atau hidup saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_1',
      number: 9,
      dimensionKey: 'Pt',
      text: 'Saya sering terobsesi pada kesalahan kecil yang saya buat di masa lalu.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_1',
      number: 10,
      dimensionKey: 'Sc',
      text: 'Saya sering memiliki ide-ide aneh yang membuat orang lain bingung.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_2',
      number: 11,
      dimensionKey: 'L',
      text: 'Saya tidak pernah marah saat dikritik atau disalahkan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_2',
      number: 12,
      dimensionKey: 'F',
      text: 'Pikiran saya dikendalikan oleh kekuatan asing dari luar angkasa.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_2',
      number: 13,
      dimensionKey: 'K',
      text: 'Saya tidak pernah merasa gugup walau dalam tekanan berat.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_2',
      number: 14,
      dimensionKey: 'Hs',
      text: 'Saya sering merasa pusing atau sakit kepala berat akhir-akhir ini.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_2',
      number: 15,
      dimensionKey: 'D',
      text: 'Masa depan terlihat sangat suram dan saya tidak punya harapan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_2',
      number: 16,
      dimensionKey: 'Hy',
      text: 'Saya butuh perhatian lebih banyak dari orang di sekitar saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_2',
      number: 17,
      dimensionKey: 'Pd',
      text: 'Saya tidak peduli dengan omongan atau penilaian orang tentang diri saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_2',
      number: 18,
      dimensionKey: 'Pa',
      text: 'Sangat berbahaya mempercayai rekan kerja karena mereka bisa berkhianat.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_2',
      number: 19,
      dimensionKey: 'Pt',
      text: 'Saya punya kebiasaan mengecek hal berulang kali (seperti kunci pintu) karena ragu.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_2',
      number: 20,
      dimensionKey: 'Sc',
      text: 'Saya merasa benar-benar terisolasi dan sendirian di dunia ini.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_3',
      number: 21,
      dimensionKey: 'L',
      text: 'Saya selalu menaati peraturan lalu lintas setiap saat.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_3',
      number: 22,
      dimensionKey: 'F',
      text: 'Saya merasa dunia akan segera kiamat dalam waktu dekat.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_3',
      number: 23,
      dimensionKey: 'K',
      text: 'Kritikan orang lain sama sekali tidak mempengaruhi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_3',
      number: 24,
      dimensionKey: 'Hs',
      text: 'Dada saya sering terasa nyeri atau sesak napas tanpa aktivitas fisik.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_3',
      number: 25,
      dimensionKey: 'D',
      text: 'Hal-hal yang dulu menyenangkan kini tidak lagi menarik minat saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_3',
      number: 26,
      dimensionKey: 'Hy',
      text: 'Saya sering sakit kepala berdenyut hebat saat merasa tertekan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_3',
      number: 27,
      dimensionKey: 'Pd',
      text: 'Saya bosan dengan rutinitas dan selalu mencari sensasi yang menantang.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_3',
      number: 28,
      dimensionKey: 'Pa',
      text: 'Saya merasa sering dibicarakan keburukannya di belakang saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_3',
      number: 29,
      dimensionKey: 'Pt',
      text: 'Pikiran-pikiran buruk terus berputar di otak dan saya tak bisa menghentikannya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_3',
      number: 30,
      dimensionKey: 'Sc',
      text: 'Saya lebih suka melamun dan hidup di khayalan daripada menghadapi dunia nyata.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_4',
      number: 31,
      dimensionKey: 'L',
      text: 'Saya tidak pernah membicarakan keburukan orang lain.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_4',
      number: 32,
      dimensionKey: 'F',
      text: 'Saya sering mendengar suara-suara yang menyuruh saya berbuat hal buruk.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_4',
      number: 33,
      dimensionKey: 'K',
      text: 'Keluarga saya adalah keluarga yang paling harmonis tanpa masalah.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_4',
      number: 34,
      dimensionKey: 'Hs',
      text: 'Saya sering merasakan mual, perut kembung, dan gangguan pencernaan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_4',
      number: 35,
      dimensionKey: 'D',
      text: 'Saya sering merasa diri saya tidak berguna atau berharga.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_4',
      number: 36,
      dimensionKey: 'Hy',
      text: 'Terkadang otot saya terasa kaku dan lumpuh sesaat ketika sangat takut.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_4',
      number: 37,
      dimensionKey: 'Pd',
      text: 'Berbohong untuk menghindari hukuman adalah hal yang wajar bagi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_4',
      number: 38,
      dimensionKey: 'Pa',
      text: 'Saya yakin beberapa orang sengaja membuat masalah bagi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_4',
      number: 39,
      dimensionKey: 'Pt',
      text: 'Saya sering cemas bahwa hal buruk akan segera menimpa orang terdekat saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_4',
      number: 40,
      dimensionKey: 'Sc',
      text: 'Orang lain sering menganggap perilaku atau gaya hidup saya sangat aneh.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_5',
      number: 41,
      dimensionKey: 'L',
      text: 'Saya tidak pernah menunda pekerjaan sekecil apapun.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_5',
      number: 42,
      dimensionKey: 'F',
      text: 'Saya tidak mengenali wajah saya sendiri saat berkaca.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_5',
      number: 43,
      dimensionKey: 'K',
      text: 'Saya selalu bisa mengendalikan emosi saya dengan sempurna.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_5',
      number: 44,
      dimensionKey: 'Hs',
      text: 'Tangan atau kaki saya sering terasa kesemutan atau mati rasa.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_5',
      number: 45,
      dimensionKey: 'D',
      text: 'Saya sering merasa ingin menangis walau tidak ada alasan yang jelas.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_5',
      number: 46,
      dimensionKey: 'Hy',
      text: 'Saya lebih mudah kelelahan secara fisik saat stres pikiran melanda.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_5',
      number: 47,
      dimensionKey: 'Pd',
      text: 'Saya merasa tidak bersalah meski telah mengecewakan orang lain.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_5',
      number: 48,
      dimensionKey: 'Pa',
      text: 'Jika saya lengah, orang pasti akan memanfaatkan kebaikan saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_5',
      number: 49,
      dimensionKey: 'Pt',
      text: 'Perubahan kecil dalam rutinitas membuat saya sangat stres dan terganggu.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_5',
      number: 50,
      dimensionKey: 'Sc',
      text: 'Saya merasa tidak terhubung atau mati rasa terhadap tubuh saya sendiri.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_6',
      number: 51,
      dimensionKey: 'L',
      text: 'Saya selalu ramah kepada semua orang tanpa terkecuali.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_6',
      number: 52,
      dimensionKey: 'F',
      text: 'Semua makanan terasa seperti racun bagi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_6',
      number: 53,
      dimensionKey: 'K',
      text: 'Saya jarang cemas akan hal-hal yang belum terjadi.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_6',
      number: 54,
      dimensionKey: 'Hs',
      text: 'Kesehatan saya terasa lebih buruk dibanding orang lain seusia saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_6',
      number: 55,
      dimensionKey: 'D',
      text: 'Saya merasa sangat lambat dalam berpikir maupun bergerak.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_6',
      number: 56,
      dimensionKey: 'Hy',
      text: 'Bila ada masalah berat, saya mencoba melupakannya dan berpura-pura tidak terjadi.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_6',
      number: 57,
      dimensionKey: 'Pd',
      text: 'Saya sering berkonflik keras dengan figur otoritas (atasan/guru/orangtua).',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_6',
      number: 58,
      dimensionKey: 'Pa',
      text: 'Saya sulit memaafkan dan akan membalas dendam pada yang menyakiti saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_6',
      number: 59,
      dimensionKey: 'Pt',
      text: 'Saya sering ditakuti oleh ketakutan tidak beralasan terhadap ruang tertutup atau gelap.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_6',
      number: 60,
      dimensionKey: 'Sc',
      text: 'Saya percaya kejadian-kejadian acak memiliki arti khusus yang tertuju pada saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_7',
      number: 61,
      dimensionKey: 'L',
      text: 'Saya tidak pernah iri pada kesuksesan orang lain.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_7',
      number: 62,
      dimensionKey: 'F',
      text: 'Saya merasa jantung saya pernah berhenti berdetak selama beberapa menit.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_7',
      number: 63,
      dimensionKey: 'K',
      text: 'Orang lain terlalu membesar-besarkan masalah psikologis mereka.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_7',
      number: 64,
      dimensionKey: 'Hs',
      text: 'Saya sering terbangun karena nyeri otot yang muncul tiba-tiba.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_7',
      number: 65,
      dimensionKey: 'D',
      text: 'Terkadang saya berharap lebih baik tidak pernah dilahirkan.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_7',
      number: 66,
      dimensionKey: 'Hy',
      text: 'Suara saya pernah hilang sesaat akibat syok emosional.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_7',
      number: 67,
      dimensionKey: 'Pd',
      text: 'Saya bisa memanipulasi orang lain dengan mudah demi keuntungan saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_7',
      number: 68,
      dimensionKey: 'Pa',
      text: 'Orang-orang sering berpura-pura baik padahal punya niat buruk tersembunyi.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_7',
      number: 69,
      dimensionKey: 'Pt',
      text: 'Saya harus mengerjakan segalanya secara sangat sempurna atau tidak sama sekali.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_7',
      number: 70,
      dimensionKey: 'Sc',
      text: 'Terkadang pikiran saya tiba-tiba kosong seperti ditarik keluar dari otak.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_8',
      number: 71,
      dimensionKey: 'L',
      text: 'Saya menyukai dan peduli pada semua orang yang saya kenal.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_8',
      number: 72,
      dimensionKey: 'F',
      text: 'Setiap hari saya merasa ingin segera mati saja.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_8',
      number: 73,
      dimensionKey: 'K',
      text: 'Saya merasa memiliki kondisi mental yang 100% stabil setiap hari.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_8',
      number: 74,
      dimensionKey: 'Hs',
      text: 'Saya mudah merasa lelah meskipun baru saja bangun tidur.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_8',
      number: 75,
      dimensionKey: 'D',
      text: 'Saya kesulitan membuat keputusan kecil yang biasanya mudah.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_8',
      number: 76,
      dimensionKey: 'Hy',
      text: 'Sangat penting bagi saya untuk disukai oleh semua orang.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_8',
      number: 77,
      dimensionKey: 'Pd',
      text: 'Kebebasan saya lebih penting dari sekadar menjaga kesopanan sosial.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_8',
      number: 78,
      dimensionKey: 'Pa',
      text: 'Saya sangat sensitif bila ada orang yang melihat saya dengan cara yang salah.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_8',
      number: 79,
      dimensionKey: 'Pt',
      text: 'Ketegangan mental membuat saya sulit bersantai meski di hari libur.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_8',
      number: 80,
      dimensionKey: 'Sc',
      text: 'Saya sangat kesulitan merasakan emosi sedih, senang, atau empati.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_9',
      number: 81,
      dimensionKey: 'L',
      text: 'Saya selalu membaca setiap dokumen sepenuhnya sebelum menyetujuinya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_9',
      number: 82,
      dimensionKey: 'F',
      text: 'Tidak ada satupun orang di dunia ini yang benar-benar nyata.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_9',
      number: 83,
      dimensionKey: 'K',
      text: 'Sangat jarang saya merasa menyesal atas perbuatan saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_9',
      number: 84,
      dimensionKey: 'Hs',
      text: 'Saya sangat cemas jika ada bintik merah atau gejala kecil di tubuh saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_9',
      number: 85,
      dimensionKey: 'D',
      text: 'Orang-orang akan merasa lebih baik jika saya tidak ada.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_9',
      number: 86,
      dimensionKey: 'Hy',
      text: 'Orang lain sering kali tidak mengerti betapa sensitifnya perasaan saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_9',
      number: 87,
      dimensionKey: 'Pd',
      text: 'Saya pernah melanggar peraturan atau hukum secara sadar dan berulang.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_9',
      number: 88,
      dimensionKey: 'Pa',
      text: 'Banyak orang cemburu terhadap kemampuan dan prestasi yang saya miliki.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_9',
      number: 89,
      dimensionKey: 'Pt',
      text: 'Saya sering ragu-ragu sehingga pekerjaan tidak pernah selesai tepat waktu.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_9',
      number: 90,
      dimensionKey: 'Sc',
      text: 'Saya tidak menikmati sosialisasi dan selalu menjauhi orang lain sebisa mungkin.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_l_10',
      number: 91,
      dimensionKey: 'L',
      text: 'Saya tidak pernah mengucapkan kata-kata kotor saat sedang marah.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_f_10',
      number: 92,
      dimensionKey: 'F',
      text: 'Saya merasa organ dalam tubuh saya perlahan membusuk.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_k_10',
      number: 93,
      dimensionKey: 'K',
      text: 'Saya tidak pernah merasa hidup ini tidak adil bagi saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hs_10',
      number: 94,
      dimensionKey: 'Hs',
      text: 'Saya merasa sering sakit-sakitan dalam beberapa bulan terakhir.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_d_10',
      number: 95,
      dimensionKey: 'D',
      text: 'Saya hampir tidak pernah merasa benar-benar bahagia.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_hy_10',
      number: 96,
      dimensionKey: 'Hy',
      text: 'Saya sering merasa pusing seperti berputar ketika dikritik tajam.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pd_10',
      number: 97,
      dimensionKey: 'Pd',
      text: 'Sangat sulit bagi saya untuk menyesuaikan diri dengan sistem kedisiplinan militer.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pa_10',
      number: 98,
      dimensionKey: 'Pa',
      text: 'Saya curiga keluarga atau teman diam-diam berkonspirasi terhadap saya.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_pt_10',
      number: 99,
      dimensionKey: 'Pt',
      text: 'Saya mencemaskan masa depan hingga membuat saya tidak bisa fokus pada masa kini.',
      options: mmpiOptions
    },
    {
      id: 'mmpi_sc_10',
      number: 100,
      dimensionKey: 'Sc',
      text: 'Saya pernah merasa lingkungan saya ini bukanlah dunia nyata.',
      options: mmpiOptions
    },
  ]
};
// ---------------------------------------------------------------------------

const SDQ_OPTIONS: QuestionOption[] = [
  { value: 0, label: 'Tidak Benar / Tidak Pernah', emoji: '🟢', description: 'Hal ini sama sekali tidak menggambarkan diri saya.' },
  { value: 1, label: 'Agak Benar / Kadang-kadang', emoji: '🟡', description: 'Hal ini kadang-kadang terjadi pada diri saya.' },
  { value: 2, label: 'Benar / Sangat Sering', emoji: '🔴', description: 'Hal ini sangat sesuai atau sering saya rasakan/alami.' }
];

const RESILIENCE_OPTIONS: QuestionOption[] = [
  { value: 0, label: 'Jarang / Tidak Pernah', emoji: '⚪', description: 'Hampir tidak pernah saya rasakan.' },
  { value: 1, label: 'Kadang-kadang', emoji: '🟡', description: 'Terkadang saya rasakan tergantung situasi.' },
  { value: 2, label: 'Sering / Sangat Sesuai', emoji: '🟢', description: 'Sangat sering dan mencerminkan diri saya sehari-hari.' }
];

// ---------------------------------------------------------------------------
// TEST 1: SDQ (Strengths and Difficulties Questionnaire) 25 Soal
// ---------------------------------------------------------------------------
export const SDQ_TEST_DEFINITION: PsychologicalTestDefinition = {
  type: 'sdq_25',
  title: 'Skrining Gejala Emosi, Perilaku, & Hubungan Sosial (SDQ 25)',
  subtitle: 'Strengths and Difficulties Questionnaire (Adaptasi Kemenkes / WHO untuk Anak & Remaja)',
  description: 'Instrumen psikologis standar untuk mengidentifikasi kesehatan mental, kesulitan emosional, perilaku, konsentrasi, serta potensi sosial siswa di lingkungan asrama.',
  targetAge: '7 - 18 Tahun (SD, SMP, SMA)',
  durationMinutes: 10,
  totalQuestions: 25,
  dimensions: [
    {
      key: 'emotional_symptoms',
      name: 'Gejala Emosional & Kecemasan',
      description: 'Menilai tingkat kecemasan, kesedihan, keluhan fisik psikis (somatisasi), dan rasa takut.',
      maxScore: 10
    },
    {
      key: 'conduct_problems',
      name: 'Masalah Perilaku & Kepatuhan',
      description: 'Menilai regulasi amarah, kepatuhan terhadap tata tertib, kejujuran, dan relasi disiplin.',
      maxScore: 10
    },
    {
      key: 'hyperactivity',
      name: 'Hiperaktivitas & Daya Konsentrasi',
      description: 'Menilai kegelisahan motorik, kemampuan fokus belajar, dan kontrol impulsivitas.',
      maxScore: 10
    },
    {
      key: 'peer_problems',
      name: 'Masalah Relasi Teman Sebaya',
      description: 'Menilai kecenderungan menyendiri, penerimaan sosial teman asrama, dan risiko isolasi/bullying.',
      maxScore: 10
    },
    {
      key: 'prosocial_behavior',
      name: 'Perilaku Prososial & Empati (Kekuatan)',
      description: 'Menilai kepedulian terhadap teman, kerelaan menolong, empati, dan keramahan sosial.',
      isStrength: true,
      maxScore: 10
    }
  ],
  questions: [
    // 1-5: Gejala Emosi
    {
      id: 'sdq_q1',
      number: 1,
      dimensionKey: 'emotional_symptoms',
      text: 'Saya sering merasa khawatir atau cemas berlebihan terhadap berbagai hal (pelajaran, asrama, keluarga).',
      hint: 'Pikirkan perasaan cemas yang sering membuat hatimu gelisah.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q2',
      number: 2,
      dimensionKey: 'emotional_symptoms',
      text: 'Saya sering merasa sedih, murung, atau ingin menangis tanpa sebab yang benar-benar jelas.',
      hint: 'Apakah perasaan murung sering datang saat kamu sendirian?',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q3',
      number: 3,
      dimensionKey: 'emotional_symptoms',
      text: 'Saya sering merasa takut terhadap hal-hal baru, tempat asing, atau situasi yang belum pernah saya hadapi.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q4',
      number: 4,
      dimensionKey: 'emotional_symptoms',
      text: 'Saya sering mengeluh sakit kepala, sakit perut, atau badan pegal terutama saat merasa stres atau tegang.',
      hint: 'Keluhan fisik yang sering muncul menjelang ujian atau ketika ada masalah.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q5',
      number: 5,
      dimensionKey: 'emotional_symptoms',
      text: 'Saya mudah merasa panik, gugup, atau jantung berdebar kencang ketika ditegur atau dihadapkan pada tugas berat.',
      options: SDQ_OPTIONS
    },

    // 6-10: Masalah Perilaku
    {
      id: 'sdq_q6',
      number: 6,
      dimensionKey: 'conduct_problems',
      text: 'Saya sering kehilangan kendali amarah, mudah tersinggung, atau mengamuk bila ada hal yang mengecewakan.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q7',
      number: 7,
      dimensionKey: 'conduct_problems',
      text: 'Saya merasa berat atau kadang membantah aturan dan perintah wali asuh/guru saat sedang kesal.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q8',
      number: 8,
      dimensionKey: 'conduct_problems',
      text: 'Saya pernah terlibat pertengkaran fisik (mendorong, memukul) atau saling bentak dengan teman asrama.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q9',
      number: 9,
      dimensionKey: 'conduct_problems',
      text: 'Saya pernah berbohong, menutupi kesalahan, atau mengambil barang teman tanpa izin.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q10',
      number: 10,
      dimensionKey: 'conduct_problems',
      text: 'Saya mudah merasa dendam atau ingin membalas perbuatan orang yang menurut saya bersikap tidak adil.',
      options: SDQ_OPTIONS
    },

    // 11-15: Hiperaktivitas & Inatensi
    {
      id: 'sdq_q11',
      number: 11,
      dimensionKey: 'hyperactivity',
      text: 'Saya merasa sangat gelisah dan sulit untuk duduk tenang dalam waktu lama saat di kelas atau musholla.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q12',
      number: 12,
      dimensionKey: 'hyperactivity',
      text: 'Tangan atau kaki saya sering terus bergerak, mengetuk-ngetuk meja, atau menggeliat tanpa saya sadari.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q13',
      number: 13,
      dimensionKey: 'hyperactivity',
      text: 'Perhatian saya sangat mudah teralihkan oleh suara, obrolan, atau hal-hal kecil di sekitar saya saat belajar.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q14',
      number: 14,
      dimensionKey: 'hyperactivity',
      text: 'Saya merasa sulit menyelesaikan tugas atau pekerjaan asrama sampai tuntas karena cepat bosan.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q15',
      number: 15,
      dimensionKey: 'hyperactivity',
      text: 'Saya sering berbicara atau bertindak terburu-buru tanpa memikirkan akibatnya terlebih dahulu.',
      options: SDQ_OPTIONS
    },

    // 16-20: Masalah Relasi Sebaya
    {
      id: 'sdq_q16',
      number: 16,
      dimensionKey: 'peer_problems',
      text: 'Saya cenderung lebih suka menyendiri di kamar atau pojok daripada bermain bersama kelompok teman.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q17',
      number: 17,
      dimensionKey: 'peer_problems',
      text: 'Saya merasa teman-teman di kamar atau kelas kurang menyukai saya atau sengaja menjauhi saya.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q18',
      number: 18,
      dimensionKey: 'peer_problems',
      text: 'Saya merasa sangat sulit memiliki satu teman dekat yang benar-benar bisa saya percayai untuk bercerita.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q19',
      number: 19,
      dimensionKey: 'peer_problems',
      text: 'Saya pernah diejek, diolok-olok nama orang tua, atau diganggu secara fisik oleh teman lain di asrama.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q20',
      number: 20,
      dimensionKey: 'peer_problems',
      text: 'Saya merasa lebih nyaman dan lebih aman berbicara dengan orang dewasa/pengasuh daripada teman sebayaku.',
      options: SDQ_OPTIONS
    },

    // 21-25: Skala Prososial & Empati (Kekuatan)
    {
      id: 'sdq_q21',
      number: 21,
      dimensionKey: 'prosocial_behavior',
      text: 'Saya selalu berusaha memperhatikan perasaan teman dan tidak ingin menyakiti hati mereka.',
      hint: 'Skor tinggi menunjukkan kepekaan sosial dan empati yang sangat baik.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q22',
      number: 22,
      dimensionKey: 'prosocial_behavior',
      text: 'Saya suka dan ikhlas berbagi makanan, alat tulis, atau perlengkapan dengan teman yang membutuhkan.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q23',
      number: 23,
      dimensionKey: 'prosocial_behavior',
      text: 'Saya cepat tergerak untuk menolong atau menghibur ketika melihat teman sedang sakit atau menangis sedih.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q24',
      number: 24,
      dimensionKey: 'prosocial_behavior',
      text: 'Saya bersikap ramah, melindungi, dan menghormati adik kelas atau teman yang lebih pendiam/lemah.',
      options: SDQ_OPTIONS
    },
    {
      id: 'sdq_q25',
      number: 25,
      dimensionKey: 'prosocial_behavior',
      text: 'Saya dengan senang hati menawarkan bantuan kepada wali asuh, guru, atau teman tanpa harus diminta.',
      options: SDQ_OPTIONS
    }
  ]
};

// ---------------------------------------------------------------------------
// TEST 2: Asesmen Tumbuh Kembang & Resiliensi Jiwa Siswa (20 Soal)
// ---------------------------------------------------------------------------
export const RESILIENCE_GROWTH_TEST_DEFINITION: PsychologicalTestDefinition = {
  type: 'resilience_growth_20',
  title: 'Asesmen Tumbuh Kembang & Resiliensi Mental Siswa (20 Soal)',
  subtitle: 'Evaluasi Kemandirian, Regulasi Emosi, Konsep Diri, & Ketahanan Jiwa Hidup Berasrama',
  description: 'Mengukur kematangan psikologis, daya lenting mental (resiliensi), adaptasi hidup berasrama, dan mekanisme penanganan stres siswa binaan Sekolah Rakyat.',
  targetAge: 'Semua Jenjang Siswa (SD / SMP / SMA)',
  durationMinutes: 8,
  totalQuestions: 20,
  dimensions: [
    {
      key: 'dorm_autonomy',
      name: 'Kemandirian & Adaptasi Asrama',
      description: 'Kesiapan mengurus diri sendiri, rasa nyaman tinggal di asrama, dan disiplin waktu harian.',
      isStrength: true,
      maxScore: 10
    },
    {
      key: 'self_concept',
      name: 'Konsep Diri & Efikasi Pribadi',
      description: 'Penghargaan diri (self-esteem), rasa percaya diri, optimisme cita-cita, dan penerimaan diri.',
      isStrength: true,
      maxScore: 10
    },
    {
      key: 'emotional_coping',
      name: 'Regulasi Emosi & Koping Stres',
      description: 'Kematangan mengelola kesedihan/amarah, keterbukaan curhat, dan daya bangkit dari kegagalan.',
      isStrength: true,
      maxScore: 10
    },
    {
      key: 'social_attachment',
      name: 'Kelekatan Sosial & Rasa Aman',
      description: 'Kepercayaan kepada figur wali asuh, persaudaraan antar kamar, dan rasa terlindungi.',
      isStrength: true,
      maxScore: 10
    }
  ],
  questions: [
    // 1-5: Kemandirian & Adaptasi Asrama
    {
      id: 'res_q1',
      number: 1,
      dimensionKey: 'dorm_autonomy',
      text: 'Saya mampu mengurus kebutuhan harian saya (mencuci baju, mandi tepat waktu, merapikan ranjang) secara mandiri.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q2',
      number: 2,
      dimensionKey: 'dorm_autonomy',
      text: 'Saya merasa betah, nyaman, dan menganggap asrama Sekolah Rakyat seperti rumah kedua yang menyenangkan.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q3',
      number: 3,
      dimensionKey: 'dorm_autonomy',
      text: 'Saya dapat membagi waktu antara belajar mandiri, istirahat, piket, dan ibadah dengan tertib tanpa disuruh berulang kali.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q4',
      number: 4,
      dimensionKey: 'dorm_autonomy',
      text: 'Saya tidak merasa rindu rumah (homesick) secara berlebihan hingga mengganggu nafsu makan atau aktivitas belajar saya.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q5',
      number: 5,
      dimensionKey: 'dorm_autonomy',
      text: 'Saya dapat menerima dan menikmati menu makanan asrama serta aturan bersama dengan lapang dada.',
      options: RESILIENCE_OPTIONS
    },

    // 6-10: Konsep Diri & Efikasi Pribadi
    {
      id: 'res_q6',
      number: 6,
      dimensionKey: 'self_concept',
      text: 'Saya merasa diri saya berharga, penting, dan memiliki bakat atau potensi yang dapat saya kembangkan.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q7',
      number: 7,
      dimensionKey: 'self_concept',
      text: 'Saya bangga dengan setiap kemajuan dan usaha yang telah saya tunjukkan selama bersekolah di sini.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q8',
      number: 8,
      dimensionKey: 'self_concept',
      text: 'Saya berani berbicara, bertanya, atau mengutarakan ide saya di depan teman-teman atau saat musyawarah kamar.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q9',
      number: 9,
      dimensionKey: 'self_concept',
      text: 'Saya merasa optimis, bersemangat, dan percaya bahwa cita-cita masa depan saya akan tercapai dengan ikhtiar.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q10',
      number: 10,
      dimensionKey: 'self_concept',
      text: 'Saya tidak merasa rendah diri atau berkecil hati ketika melihat teman lain memiliki kelebihan tertentu.',
      options: RESILIENCE_OPTIONS
    },

    // 11-15: Regulasi Emosi & Koping Stres
    {
      id: 'res_q11',
      number: 11,
      dimensionKey: 'emotional_coping',
      text: 'Ketika saya merasa jengkel atau sedih, saya tahu cara yang baik untuk menenangkan diri (misal wudhu, istighfar, menulis, atau olahraga).',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q12',
      number: 12,
      dimensionKey: 'emotional_coping',
      text: 'Saya tidak ragu untuk mencari bantuan atau curhat secara terbuka kepada wali asuh atau guru BK ketika menghadapi masalah sulit.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q13',
      number: 13,
      dimensionKey: 'emotional_coping',
      text: 'Ketika marah, saya mampu menahan diri agar tidak membanting barang, berkata kasar, atau merugikan orang lain.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q14',
      number: 14,
      dimensionKey: 'emotional_coping',
      text: 'Ketika mengalami kegagalan (misal nilai turun atau ditegur), saya mau belajar dari kesalahan dan berusaha lebih giat lagi.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q15',
      number: 15,
      dimensionKey: 'emotional_coping',
      text: 'Secara umum, hati dan pikiran saya merasa damai, tenteram, dan tidak merasa hampa atau putus asa.',
      options: RESILIENCE_OPTIONS
    },

    // 16-20: Kelekatan Sosial & Rasa Aman
    {
      id: 'res_q16',
      number: 16,
      dimensionKey: 'social_attachment',
      text: 'Saya merasa diperhatikan, disayangi, dan diperlakukan secara adil oleh para wali asuh dan guru di Sekolah Rakyat.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q17',
      number: 17,
      dimensionKey: 'social_attachment',
      text: 'Saya memiliki hubungan persaudaraan yang erat dengan teman satu kamar, saling peduli dan saling mengingatkan dalam kebaikan.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q18',
      number: 18,
      dimensionKey: 'social_attachment',
      text: 'Saya merasa lingkungan asrama dan sekolah adalah tempat yang aman dari ancaman perundungan atau kekerasan.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q19',
      number: 19,
      dimensionKey: 'social_attachment',
      text: 'Saya mudah memaafkan kesalahan teman yang pernah menyakiti saya dan bersedia menjalin kembali hubungan baik.',
      options: RESILIENCE_OPTIONS
    },
    {
      id: 'res_q20',
      number: 20,
      dimensionKey: 'social_attachment',
      text: 'Saya bersyukur menjadi bagian dari Sekolah Rakyat dan merasa hidup saya memiliki tujuan mulia.',
      options: RESILIENCE_OPTIONS
    }
  ]
};

export const PSYCHOLOGICAL_TESTS: Record<PsychologicalTestType, PsychologicalTestDefinition> = {
  sdq_25: SDQ_TEST_DEFINITION,
  resilience_growth_20: RESILIENCE_GROWTH_TEST_DEFINITION,
  mmpi_tni_polri: mmpiTniPolriBattery
};

// ---------------------------------------------------------------------------
// CLINICAL EVALUATION & PSYCHOLOGICAL CONSIDERATION GENERATOR
// ---------------------------------------------------------------------------

export function calculateAssessmentResult(
  testType: PsychologicalTestType,
  answers: Record<string, number>,
  student: { id: string; name: string; class: string; dorm: string },
  filledBy: 'student' | 'counselor_with_student' = 'student',
  assessorName: string = ''
): PsychologicalAssessment {
  const testDef = PSYCHOLOGICAL_TESTS[testType];
  const dimensionScores: Record<string, PsychologicalDimensionScore> = {};

  // 1. Calculate each dimension score
  testDef.dimensions.forEach((dim) => {
    const questionsInDim = testDef.questions.filter((q) => q.dimensionKey === dim.key);
    let sumScore = 0;
    questionsInDim.forEach((q) => {
      const val = answers[q.id] ?? 0;
      sumScore += val;
    });

    let status: PsychologicalClinicalStatus = 'normal';
    let statusLabel = 'Dalam Batas Normal';
    let interpretation = '';

    if (testType === 'mmpi_tni_polri') {
      if (sumScore >= 7) {
        status = 'abnormal';
        statusLabel = dim.key === 'L' || dim.key === 'F' || dim.key === 'K' ? 'Invaliditas Tinggi (Perlu Evaluasi)' : 'Tinggi / Rentan Klinis';
        interpretation = `Skor ${dim.key} tinggi (${sumScore}/10). Mengindikasikan ${dim.name} berada pada taraf yang memerlukan perhatian.`;
      } else if (sumScore >= 5) {
        status = 'borderline';
        statusLabel = 'Ambang Batas (Moderate)';
        interpretation = `Skor ${dim.key} moderat. Terdapat beberapa tanda ${dim.name} namun belum masuk kategori berat.`;
      } else {
        status = 'normal';
        statusLabel = 'Normal (Terkendali)';
        interpretation = `Dalam batas wajar untuk ${dim.name}.`;
      }
    } else if (testType === 'sdq_25') {
      if (dim.key === 'emotional_symptoms') {
        if (sumScore >= 7) {
          status = 'abnormal';
          statusLabel = 'Tinggi / Perlu Perhatian Khusus';
          interpretation = 'Mengindikasikan kecemasan internalisasi, suasana hati tertekan/murung, atau kecenderungan somatisasi stres.';
        } else if (sumScore === 6) {
          status = 'borderline';
          statusLabel = 'Ambang Batas (Borderline)';
          interpretation = 'Menunjukkan gejala kecemasan ringan atau rasa khawatir berkala yang perlu diobservasi.';
        } else {
          status = 'normal';
          statusLabel = 'Normal / Stabil';
          interpretation = 'Kondisi emosional stabil, rasa cemas dalam ambang toleransi wajar usia anak.';
        }
      } else if (dim.key === 'conduct_problems') {
        if (sumScore >= 5) {
          status = 'abnormal';
          statusLabel = 'Tinggi / Perlu Perhatian Khusus';
          interpretation = 'Indikasi kesulitan regulasi amarah, agresivitas verbal/fisik, atau ketidakpatuhan aturan yang butuh pembinaan terstruktur.';
        } else if (sumScore === 4) {
          status = 'borderline';
          statusLabel = 'Ambang Batas (Borderline)';
          interpretation = 'Terdapat riwayat perselisihan atau reaksi emosi reaktif yang perlu pendampingan.';
        } else {
          status = 'normal';
          statusLabel = 'Normal / Kooperatif';
          interpretation = 'Menunjukkan kepatuhan aturan yang baik dan kendali diri memadai.';
        }
      } else if (dim.key === 'hyperactivity') {
        if (sumScore >= 7) {
          status = 'abnormal';
          statusLabel = 'Tinggi / Perlu Perhatian Khusus';
          interpretation = 'Kegelisahan motorik nyata, rentang atensi pendek, atau kecenderungan impulsif yang mempengaruhi fokus belajar.';
        } else if (sumScore === 6) {
          status = 'borderline';
          statusLabel = 'Ambang Batas (Borderline)';
          interpretation = 'Kecenderungan mudah bosan atau terdistraksi jika suasana tidak terstruktur.';
        } else {
          status = 'normal';
          statusLabel = 'Normal / Terkendali';
          interpretation = 'Daya konsentrasi dan ketenangan motorik sesuai dengan tahapan perkembangan usia.';
        }
      } else if (dim.key === 'peer_problems') {
        if (sumScore >= 6) {
          status = 'abnormal';
          statusLabel = 'Tinggi / Perlu Perhatian Khusus';
          interpretation = 'Terdapat hambatan interaksi sosial sebaya, risiko menarik diri (isolasi), atau riwayat perundungan/penolakan kelompok.';
        } else if (sumScore >= 4) {
          status = 'borderline';
          statusLabel = 'Ambang Batas (Borderline)';
          interpretation = 'Sedikit canggung dalam pergaulan asrama atau lebih suka lingkungan pertemanan sangat terbatas.';
        } else {
          status = 'normal';
          statusLabel = 'Normal / Adaptif';
          interpretation = 'Hubungan sosial dengan teman sebaya terjalin hangat dan harmonis.';
        }
      } else if (dim.key === 'prosocial_behavior') {
        // Skala Terbalik: Semakin tinggi = semakin baik
        if (sumScore <= 4) {
          status = 'abnormal';
          statusLabel = 'Rendah / Perlu Stimulasi Empati';
          interpretation = 'Kurang peka terhadap perasaan teman, perlu bimbingan pembiasaan berbagi dan kepedulian sosial.';
        } else if (sumScore === 5) {
          status = 'borderline';
          statusLabel = 'Sedang / Cukup';
          interpretation = 'Memiliki empati dasar, namun belum selalu diekspresikan secara proaktif.';
        } else {
          status = 'normal';
          statusLabel = 'Tinggi / Kekuatan Positif (Kuat)';
          interpretation = 'Memiliki empati yang tinggi, suka menolong, menghargai sesama, dan berpotensi menjadi figur teladan kamar.';
        }
      }
    } else {
      // RESILIENCE GROWTH 20
      // Dimensi Kekuatan & Resiliensi: Skor Maksimal 10 per dimensi
      if (sumScore >= 8) {
        status = 'normal';
        statusLabel = 'Sangat Berkembang (Tinggi)';
        interpretation = `Kematangan dimensi ${dim.name.toLowerCase()} sangat kokoh dan menjadi faktor pelindung (protective factor) anak.`;
      } else if (sumScore >= 5) {
        status = 'borderline';
        statusLabel = 'Cukup Berkembang';
        interpretation = `Dimensi ${dim.name.toLowerCase()} cukup baik namun masih memerlukan penguatan dalam keseharian asrama.`;
      } else {
        status = 'abnormal';
        statusLabel = 'Perlu Stimulasi & Pendampingan Khusus';
        interpretation = `Dimensi ${dim.name.toLowerCase()} rentan dan memerlukan pendampingan intensif dari pengasuh/guru.`;
      }
    }

    dimensionScores[dim.key] = {
      dimensionKey: dim.key,
      dimensionName: dim.name,
      score: sumScore,
      maxScore: dim.maxScore,
      status,
      statusLabel,
      clinicalInterpretation: interpretation,
      isStrengthScale: dim.isStrength
    };
  });

  // 2. Calculate Total Score & Overall Clinical Status
  let totalScore = 0;
  let overallStatus: PsychologicalClinicalStatus = 'normal';
  let overallStatusLabel = '';

  if (testType === 'mmpi_tni_polri') {
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
    // Total Difficulties Score = Emosi + Perilaku + Hiperaktivitas + Sebaya (0 - 40)
    totalScore =
      (dimensionScores['emotional_symptoms']?.score || 0) +
      (dimensionScores['conduct_problems']?.score || 0) +
      (dimensionScores['hyperactivity']?.score || 0) +
      (dimensionScores['peer_problems']?.score || 0);

    if (totalScore >= 17) {
      overallStatus = 'abnormal';
      overallStatusLabel = 'Perlu Perhatian & Pendampingan Khusus (Skor Kesulitan Tinggi)';
    } else if (totalScore >= 14) {
      overallStatus = 'borderline';
      overallStatusLabel = 'Ambang Batas / Perlu Pemantauan (Borderline)';
    } else {
      overallStatus = 'normal';
      overallStatusLabel = 'Tumbuh Kembang Kejiwaan Sehat & Stabil (Batas Wajar)';
    }
  } else {
    // Resilience Growth 20: Total score sum of 4 dimensions (0 - 40)
    totalScore = Object.values(dimensionScores).reduce((acc, curr) => acc + curr.score, 0);
    if (totalScore >= 32) {
      overallStatus = 'normal';
      overallStatusLabel = 'Resiliensi Tinggi & Tumbuh Kembang Sangat Matang';
    } else if (totalScore >= 22) {
      overallStatus = 'borderline';
      overallStatusLabel = 'Resiliensi Cukup / Masih Memerlukan Pendampingan Adaptasi';
    } else {
      overallStatus = 'abnormal';
      overallStatusLabel = 'Resiliensi Rendah / Rentan Mengalami Stres Berasrama';
    }
  }

  // 3. Generate In-Depth Psychological Considerations & Insights
  const psychologicalConsiderations: string[] = [];
  const prosocialStrengths: string[] = [];
  const riskFactors: string[] = [];
  const caretakerRecs: string[] = [];
  const teacherRecs: string[] = [];
  const counselorRecs: string[] = [];
  let referralAdvice: string | undefined = undefined;

  if (testType === 'mmpi_tni_polri') {
    psychologicalConsiderations.push(`Hasil MMPI-TNI/POLRI (Total Skor ${totalScore}/100):`);
    const valStr = ['L','F','K'].map(k => `${k}: ${dimensionScores[k]?.score}`).join(', ');
    psychologicalConsiderations.push(`Skala Validitas: ${valStr}`);
    if (overallStatus === 'abnormal' && ['L','F','K'].some(k => dimensionScores[k]?.score >= 7)) {
       riskFactors.push('Kandidat cenderung manipulatif (faking good/bad) atau sangat defensif dalam menjawab asesmen.');
    } else {
       prosocialStrengths.push('Profil kepribadian relatif jujur dan valid dalam memberikan respon asesmen.');
    }

    const clinicalAbnormals = Object.keys(dimensionScores).filter(k => !['L', 'F', 'K'].includes(k) && dimensionScores[k]?.score >= 7);
    if (clinicalAbnormals.length > 0) {
      riskFactors.push(`Kerentanan terdeteksi pada skala: ${clinicalAbnormals.join(', ')}.`);
      psychologicalConsiderations.push('Terdapat indikasi kerentanan pada regulasi emosi, tingkat kecemasan, atau kepatuhan otoritas.');
      counselorRecs.push('Lakukan asesmen wawancara klinis mendalam terkait skala MMPI yang menonjol.');
      referralAdvice = 'Sangat direkomendasikan untuk pemeriksaan Psikometri Lanjutan (Wawancara Terstruktur) oleh Psikolog Klinis/Militer.';
    } else {
      prosocialStrengths.push('Stabilitas mental dan kecerdasan emosional berada dalam taraf yang direkomendasikan untuk penugasan bertekanan.');
      counselorRecs.push('Pertahankan pemantauan berkala (observasi rutin).');
    }
  } else if (testType === 'sdq_25') {
    const emo = dimensionScores['emotional_symptoms'];
    const cond = dimensionScores['conduct_problems'];
    const hyp = dimensionScores['hyperactivity'];
    const peer = dimensionScores['peer_problems'];
    const prosoc = dimensionScores['prosocial_behavior'];

    // Emotional consideration
    if (emo.status === 'abnormal') {
      psychologicalConsiderations.push(
        `Aspek Kejiwaan Emosional: Menunjukkan indikasi beban psikologis afektif yang tinggi (skor ${emo.score}/10). Siswa teridentifikasi sering memendam kecemasan, rasa takut, murung, serta somatisasi fisik (seperti sakit perut/kepala saat merasa tertekan).`
      );
      riskFactors.push('Kerentanan kecemasan berlebih (anxiety) dan kecenderungan menyembunyikan perasaan sedih.');
      caretakerRecs.push('Bangun komunikasi empatik dari hati ke hati setiap malam, hindari menegur siswa di depan teman kamar.');
      counselorRecs.push('Jadwalkan konseling individu dengan teknik Cognitive Behavioral Therapy (CBT) dan relaksasi pernapasan.');
    } else if (emo.status === 'borderline') {
      psychologicalConsiderations.push(
        `Aspek Kejiwaan Emosional: Terdapat fluktuasi suasana hati dan kecemasan situasional (skor ${emo.score}/10). Membutuhkan ruang aman untuk bercerita agar tidak berkembang menjadi tekanan batin.`
      );
    } else {
      prosocialStrengths.push('Stabilitas emosi baik dan memiliki ambang ketahanan terhadap stres yang sehat.');
    }

    // Conduct consideration
    if (cond.status === 'abnormal') {
      psychologicalConsiderations.push(
        `Aspek Perilaku & Regulasi Diri: Terdapat dinamika tantrum atau reaktivitas emosi (skor ${cond.score}/10). Terindikasi memiliki kesulitan dalam menyalurkan amarah secara asertif sehingga memicu pelanggaran disiplin atau perselisihan kamar.`
      );
      riskFactors.push('Risiko impulsivitas perilaku agresif dan pelanggaran aturan asrama.');
      caretakerRecs.push('Terapkan konsekuensi logis yang mendidik tanpa hukuman fisik, berikan apresiasi saat siswa berhasil menahan amarah.');
      counselorRecs.push('Lakukan pembinaan manajemen kemarahan (Anger Management) dan latihan komunikasi asertif.');
    } else {
      prosocialStrengths.push('Tingkat kepatuhan dan kesadaran disiplin asrama berada pada jalur yang positif.');
    }

    // Hyperactivity consideration
    if (hyp.status === 'abnormal') {
      psychologicalConsiderations.push(
        `Aspek Atensi & Motorik: Menunjukkan tingkat kegelisahan fisik dan distraksi fokus yang nyata (skor ${hyp.score}/10). Siswa cepat merasa jenuh dalam aktivitas duduk tenang berdurasi panjang.`
      );
      teacherRecs.push('Berikan jeda peregangan (brain break) dan pecah materi belajar menjadi beberapa tahapan pendek.');
      caretakerRecs.push('Arahkan energi berlebih ke kegiatan fisik terarah (olahraga sore, kepanduan, atau pencak silat).');
    }

    // Peer relationship consideration
    if (peer.status === 'abnormal') {
      psychologicalConsiderations.push(
        `Aspek Relasi Sosial Sebaya: Mengindikasikan hambatan integrasi pertemanan di asrama (skor ${peer.score}/10). Siswa berisiko terisolasi, merasa tidak diterima, atau memiliki trauma perundungan terdahulu.`
      );
      riskFactors.push('Penarikan diri dari interaksi sosial (social withdrawal) dan rasa kesepian hidup berasrama.');
      caretakerRecs.push('Pasangkan siswa dengan teman sebaya yang memiliki sifat penyabar dan suportif dalam piket kamar.');
      counselorRecs.push('Lakukan bimbingan kelompok kecil (Peer Support Group) untuk melatih keterampilan berteman.');
    } else {
      prosocialStrengths.push('Mampu membaur secara wajar dan memiliki relasi persahabatan yang suportif.');
    }

    // Prosocial strengths
    if (prosoc.status === 'normal') {
      prosocialStrengths.push(
        `Kekuatan Kepedulian Sosial: Memiliki jiwa prososial yang tinggi (skor ${prosoc.score}/10). Memiliki kepekaan moral, suka menolong teman, dan dapat dijadikan agen perdamaian di lingkungan asrama.`
      );
      caretakerRecs.push('Libatkan siswa dalam peran tanggung jawab sosial (seperti ketua piket atau tutor sebaya).');
    } else if (prosoc.status === 'abnormal') {
      riskFactors.push('Kurangnya kepekaan empati terhadap perasaan teman di sekitarnya.');
      counselorRecs.push('Latih bermain peran (role-play) untuk menumbuhkan empati dan memahami sudut pandang orang lain.');
    }

    // Referral Advice if both Emotional & Conduct or Peer are critical
    if ((emo.status === 'abnormal' && cond.status === 'abnormal') || totalScore >= 20) {
      referralAdvice =
        'Pertimbangan Rujukan Medis/Psikologis: Mengingat skor kesulitan psikososial berada pada rentang kritis (>20), disarankan untuk menjadwalkan evaluasi klinis mendalam bersama Psikolog Klinis Anak atau Dokter Spesialis Kedokteran Jiwa (Sp.KJ) untuk penegakan diagnosis komprehensif.';
    }
  } else {
    // RESILIENCE GROWTH TEST
    const auto = dimensionScores['dorm_autonomy'];
    const self = dimensionScores['self_concept'];
    const cope = dimensionScores['emotional_coping'];
    const attach = dimensionScores['social_attachment'];

    if (auto.status === 'abnormal') {
      riskFactors.push('Hambatan adaptasi kemandirian hidup berasrama dan kerinduan rumah (homesick) berkepanjangan.');
      caretakerRecs.push('Berikan bimbingan teknis mengurus perlengkapan pribadi dengan pendampingan bertahap dari kakak asuh.');
    } else {
      prosocialStrengths.push('Kemandirian hidup berasrama dan pengaturan jadwal harian sudah sangat tertata.');
    }

    if (self.status === 'abnormal') {
      psychologicalConsiderations.push(
        'Penghargaan Diri (Self-Esteem): Siswa cenderung merasa rendah diri, meragukan kemampuan sendiri, dan cemas akan masa depannya.'
      );
      riskFactors.push('Konsep diri rapuh dan mudah merasa putus asa ketika menemui kegagalan.');
      teacherRecs.push('Beri panggung apresiasi untuk setiap pencapaian kecil di kelas guna menumbuhkan rasa percaya diri.');
    } else {
      prosocialStrengths.push('Memiliki konsep diri yang sehat, optimis terhadap masa depan, dan berani mengutarakan pendapat.');
    }

    if (cope.status === 'abnormal') {
      psychologicalConsiderations.push(
        'Mekanisme Koping Stres: Siswa belum memiliki strategi sehat dalam menyalurkan emosi negatif, berisiko melampiaskan pada hal destruktif atau menutup diri rapat-rapat.'
      );
      counselorRecs.push('Bimbing siswa mengenali emosi dasar dan berikan jurnal ekspresi emosi harian (Emotional Journaling).');
    } else {
      prosocialStrengths.push('Memiliki daya lenting mental (resilience) yang tangguh saat menghadapi kesulitan.');
    }

    if (attach.status === 'abnormal') {
      psychologicalConsiderations.push(
        'Kelekatan & Rasa Aman: Siswa belum merasa sepenuhnya aman atau belum percaya penuh terhadap figur pengasuh di asrama.'
      );
      caretakerRecs.push('Tingkatkan kehadiran emosional yang hangat, jadilah pendengar aktif tanpa menghakimi keluhan siswa.');
    } else {
      prosocialStrengths.push('Memiliki rasa memiliki (sense of belonging) yang tinggi terhadap asrama Sekolah Rakyat.');
    }

    if (totalScore < 18) {
      referralAdvice =
        'Pertimbangan Khusus: Siswa memerlukan program pendampingan intensif masa transisi (Bridging Care) bersama Tim Psikologi Sekolah untuk mencegah kejenuhan atau potensi kabur/meninggalkan asrama.';
    }
  }

  // Summary narrative paragraph for developmental insights
  const developmentalInsights =
    overallStatus === 'normal'
      ? `Berdasarkan hasil asesmen ${testDef.title}, ananda ${student.name} menunjukkan profil tumbuh kembang kejiwaan yang tergolong SEHAT, STABIL, dan ADAPTIF. Kemampuan dalam menghadapi dinamika kehidupan asrama berada dalam batas perkembangan yang sangat baik, didukung oleh faktor protektif internal yang kokoh.`
      : overallStatus === 'borderline'
      ? `Berdasarkan hasil asesmen ${testDef.title}, ananda ${student.name} berada pada KATEGORI AMBANG BATAS (BORDERLINE). Terdapat beberapa indikator kerentanan psikologis yang memerlukan perhatian serta pemantauan suportif dari wali asuh dan guru agar potensi kesulitan emosional/perilaku tidak meningkat menjadi hambatan belajar yang serius.`
      : `Berdasarkan hasil asesmen ${testDef.title}, ananda ${student.name} MEMERLUKAN PERHATIAN & PENDAMPINGAN KHUSUS (AT RISK). Terdeteksi adanya beban psikologis atau hambatan adaptasi kejiwaan yang signifikan. Diperlukan sinergi terpadu antara wali asuh asrama, guru BK, dan orang tua dalam memberikan pendampingan psikososial berkala.`;

  return {
    id: `psy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    studentId: student.id,
    studentName: student.name,
    studentClass: student.class,
    studentDorm: student.dorm,
    testType,
    testTitle: testDef.title,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    answers,
    totalScore,
    overallStatus,
    overallStatusLabel,
    dimensionScores,
    psychologicalConsiderations:
      psychologicalConsiderations.length > 0
        ? psychologicalConsiderations
        : ['Secara umum kondisi kejiwaan dan tumbuh kembang berada dalam koridor perkembangan anak yang wajar dan seimbang.'],
    developmentalInsights,
    prosocialStrengths:
      prosocialStrengths.length > 0
        ? prosocialStrengths
        : ['Menunjukkan komitmen untuk mengikuti proses pembelajaran dan kehidupan berasrama.'],
    riskFactors:
      riskFactors.length > 0
        ? riskFactors
        : ['Tidak terdeteksi faktor risiko kejiwaan mayor yang mengkhawatirkan saat ini.'],
    recommendations: {
      forCaretaker:
        caretakerRecs.length > 0
          ? caretakerRecs
          : ['Lanjutkan pendekatan pengasuhan yang suportif dan apresiasi perilaku tertib siswa di asrama.'],
      forTeacher:
        teacherRecs.length > 0
          ? teacherRecs
          : ['Pertahankan motivasi belajar siswa dengan memberikan umpan balik yang membangun di kelas.'],
      forCounselor:
        counselorRecs.length > 0
          ? counselorRecs
          : ['Lakukan observasi berkala pada sesi bimbingan klasikal dan penguatan nilai-nilai karakter.'],
      referralAdvice
    },
    filledBy,
    assessorName: assessorName || (filledBy === 'student' ? student.name : 'Wali Asuh / Konselor'),
    createdAt: new Date().toISOString()
  };
}
