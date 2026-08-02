import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  LineChart,
  CheckSquare,
  Users,
  AlertTriangle,
  MessageSquare,
  DoorOpen,
  HeartPulse,
  FileSignature,
  FileText,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Printer,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Presentation,
  Grid,
  Maximize2
} from 'lucide-react';

export const GuideTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'manual' | 'presentation'>('manual');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const sections = [
    { id: 'intro', title: '1. Pengenalan & Arsitektur', icon: Sparkles },
    { id: 'dashboard', title: '2. Dashboard & Statistik', icon: LineChart },
    { id: 'checklist', title: '3. Ceklist / Jurnal Observasi', icon: CheckSquare },
    { id: 'students', title: '4. Data Murid & Riwayat', icon: Users },
    { id: 'violations', title: '5. Form Pelanggaran & Poin', icon: AlertTriangle },
    { id: 'counseling', title: '6. Form Konseling & BK', icon: MessageSquare },
    { id: 'leaves', title: '7. Form Izin Pulang & PDF', icon: DoorOpen },
    { id: 'medical', title: '8. Form UKS & Rekam Medis', icon: HeartPulse },
    { id: 'reportCard', title: '9. Form Rapor Keasramaan', icon: FileSignature },
    { id: 'recap', title: '10. Rekapitulasi & Laporan', icon: FileText },
    { id: 'settings', title: '11. Pengaturan & Google Sheets', icon: Sliders },
  ];

  const pptSlides = [
    {
      title: "Sistem Informasi Keasramaan Sekolah Rakyat",
      subtitle: "Panduan Operasional & Presentasi Modul Manajemen Keasramaan Terpadu",
      tag: "SLIDE 1 • JUDUL UTAMA",
      color: "from-slate-900 via-slate-800 to-red-950",
      content: (
        <div className="space-y-6 text-center py-6">
          <div className="w-20 h-20 bg-red-600/20 border-2 border-red-500/40 rounded-3xl mx-auto flex items-center justify-center text-red-400 shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Digitalisasi Pengelolaan Asrama & Pembinaan Santri</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Solusi terintegrasi untuk pencatatan observasi harian, rekam medis UKS, perizinan pulang, poin kedisiplinan, rapor karakter, serta sinkronisasi Google Sheets 2-arah.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-4 text-xs font-semibold">
            <span className="px-3 py-1.5 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ Google Sheets Sync</span>
            <span className="px-3 py-1.5 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ Cetak PDF Resmi Kop Sekolah</span>
            <span className="px-3 py-1.5 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ TTD Custom Wali Asuh & Wali Asrama</span>
          </div>
        </div>
      )
    },
    {
      title: "Arsitektur Multi-Mode & Sinkronisasi",
      subtitle: "Dua Moda Kerja: Cloud Google Sheets & Offline LocalStorage",
      tag: "SLIDE 2 • ARSITEKTUR SYSTEM",
      color: "from-blue-950 via-slate-900 to-indigo-950",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-left">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> Mode Online Cloud
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              Terhubung langsung ke Google Sheets melalui Apps Script Web App URL. Data tersimpan terpusat dan dapat diakses multi-user.
            </p>
            <ul className="text-slate-300 text-[11px] space-y-1.5 list-disc pl-4">
              <li>Sinkronisasi otomatis saat simpan data</li>
              <li>Pembaruan data real-time via Tarik Data Cloud</li>
              <li>Backup terpusat di Google Drive sekolah</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sliders className="w-4 h-4" /> Mode Offline Standalone
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              Jika koneksi internet terputus, seluruh transaksi data disimpan di LocalStorage browser tanpa hambatan.
            </p>
            <ul className="text-slate-300 text-[11px] space-y-1.5 list-disc pl-4">
              <li>Tetap bisa input data & cetak PDF</li>
              <li>Bisa sinkronisasi kapan saja saat internet tersedia</li>
              <li>Penyimpanan cepat dan responsif</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Modul Ceklist & Observasi Harian",
      subtitle: "Jurnal Pembiasaan Karakter & Kedisiplinan oleh Wali Asuh",
      tag: "SLIDE 3 • CEKLIST HARIAN",
      color: "from-slate-900 via-emerald-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <span className="block text-emerald-400 font-bold text-xs mb-1">1. Bangun Pagi</span>
              <span className="text-[11px] text-slate-300">Kedisiplinan jadwal asrama</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <span className="block text-emerald-400 font-bold text-xs mb-1">2. Shalat Berjamaah</span>
              <span className="text-[11px] text-slate-300">Presensi ibadah 5 waktu</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <span className="block text-emerald-400 font-bold text-xs mb-1">3. Kebersihan Kamar</span>
              <span className="text-[11px] text-slate-300">Kerapihan & kebersihan</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <span className="block text-emerald-400 font-bold text-xs mb-1">4. Etika & Sosial</span>
              <span className="text-[11px] text-slate-300">Sikap berkomunikasi</span>
            </div>
          </div>
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 text-xs text-slate-200">
            <strong>Prosedur Pengisian:</strong> Pilih Nama Murid & Tanggal &rarr; Centang aspek indikator &rarr; Masukkan catatan observasi Wali Asuh &rarr; Klik Simpan.
          </div>
        </div>
      )
    },
    {
      title: "Modul Pelanggaran & Akumulasi Poin",
      subtitle: "Pencatatan Kedisiplinan & Penerbitan Surat Panggilan Orang Tua",
      tag: "SLIDE 4 • KEDISIPLINAN",
      color: "from-slate-900 via-rose-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-rose-900/30 border border-rose-500/40 rounded-xl">
              <span className="text-xs font-bold text-rose-300 block">Pelanggaran Ringan</span>
              <span className="text-[11px] text-slate-300">Poin 5 - 15 (Pembinaan Internal)</span>
            </div>
            <div className="p-3 bg-amber-900/30 border border-amber-500/40 rounded-xl">
              <span className="text-xs font-bold text-amber-300 block">Pelanggaran Sedang</span>
              <span className="text-[11px] text-slate-300">Poin 20 - 45 (Peringatan & Orang Tua)</span>
            </div>
            <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-xl">
              <span className="text-xs font-bold text-red-300 block">Pelanggaran Berat</span>
              <span className="text-[11px] text-slate-300">Poin &ge; 50 (Sidang Asrama / Skorsing)</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sistem secara otomatis mengumpulkan total akumulasi poin per santri. Tersedia fitur <strong>Cetak Surat Panggilan Orang Tua PDF</strong> berformat resmi yang dapat disesuaikan nama penandatangan-nya.
          </p>
        </div>
      )
    },
    {
      title: "Modul Perizinan Pulang & Surat Izin PDF",
      subtitle: "Pengajuan Keluar Asrama, Pelacakan Status, & Surat Bertanda Tangan",
      tag: "SLIDE 5 • PERIZINAN PULANG",
      color: "from-slate-900 via-purple-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <span className="font-bold text-purple-300">Alur Pengajuan Izin:</span>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Input Nama Santri, Kategori Izin & Tanggal</li>
                <li>Isi Nama & NIP Wali Asuh Pendamping</li>
                <li>Isi Nama & NIP Wali Asrama</li>
                <li>Simpan & Buka Pratinjau Surat</li>
              </ol>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <span className="font-bold text-purple-300">Fitur PDF & Status:</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Cetak Surat Izin Pulang langsung ke PDF</li>
                <li>Ubah TTD Wali Asuh / Wali Asrama di Modal PDF</li>
                <li>Update otomatis status Aktif / Kembali / Terlambat</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Modul UKS & Rekam Medis Santri",
      subtitle: "Pencatatan Vital Signs, Diagnosa, Obat, & Surat Izin Sakit",
      tag: "SLIDE 6 • REKAM MEDIS UKS",
      color: "from-slate-900 via-teal-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-teal-900/30 border border-teal-500/30 rounded-xl">
              <span className="block text-teal-300 font-bold text-xs">Vital Signs</span>
              <span className="text-[11px] text-slate-300">Suhu, Tensi, & Nadi</span>
            </div>
            <div className="p-3 bg-teal-900/30 border border-teal-500/30 rounded-xl">
              <span className="block text-teal-300 font-bold text-xs">Perawatan UKS</span>
              <span className="text-[11px] text-slate-300">Istirahat / Rawat Jalan / Rujukan</span>
            </div>
            <div className="p-3 bg-teal-900/30 border border-teal-500/30 rounded-xl">
              <span className="block text-teal-300 font-bold text-xs">Surat Izin Sakit</span>
              <span className="text-[11px] text-slate-300">Export PDF Kop Sekolah</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Blok penandatangan pada Surat Izin Sakit mendukung kustomisasi <strong>Nama Wali Asrama</strong> dan <strong>NIP Wali Asrama</strong> secara fleksibel baik pada form pengisian maupun pada jendela pratinjau cetak PDF.
          </p>
        </div>
      )
    },
    {
      title: "Modul Rapor Keasramaan & Karakter",
      subtitle: "Evaluasi Berkala Indikator Capaian Karakter Santri",
      tag: "SLIDE 7 • RAPOR KEASRAMAAN",
      color: "from-slate-900 via-indigo-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 bg-white/10 rounded-lg border border-white/10">Kedisiplinan</div>
            <div className="p-2 bg-white/10 rounded-lg border border-white/10">Keagamaan</div>
            <div className="p-2 bg-white/10 rounded-lg border border-white/10">Kebersihan</div>
            <div className="p-2 bg-white/10 rounded-lg border border-white/10">Kemandirian</div>
            <div className="p-2 bg-white/10 rounded-lg border border-white/10">Sosial</div>
          </div>
          <div className="bg-indigo-950/80 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-2">
            <div className="font-bold text-indigo-300">Penandatangan Blok Rapor:</div>
            <p className="text-slate-300">
              Disahkan oleh <strong>Wali Asuh</strong> dan <strong>Wali Asrama</strong> dengan Nama dan NIP yang dapat disesuaikan per lembar rapor sebelum dicetak.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Kustomisasi Penandatangan & Lembar Pengesahan",
      subtitle: "Fleksibilitas Pengubahan TTD Wali Asuh & Wali Asrama",
      tag: "SLIDE 8 • KUSTOMISASI TTD",
      color: "from-slate-900 via-blue-950 to-slate-900",
      content: (
        <div className="space-y-4 py-3 text-left text-xs">
          <div className="p-4 bg-blue-900/30 border border-blue-500/40 rounded-xl space-y-2">
            <span className="font-bold text-blue-300 block">Struktur Penandatangan Standar Dokumen:</span>
            <div className="grid grid-cols-2 gap-4 text-slate-200">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="font-bold text-emerald-400 block mb-1">1. Wali Asuh</span>
                <span>Nama Wali Asuh & NIP/NIK (Dapat diisi dari master daftar atau disesuaikan)</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="font-bold text-cyan-400 block mb-1">2. Wali Asrama</span>
                <span>Nama Wali Asrama & NIP (Custom per dokumen / mengikuti default sistem)</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Panduan Integrasi Google Sheets",
      subtitle: "Setup Google Apps Script Web App & Sinkronisasi 2-Arah",
      tag: "SLIDE 9 • INTEGRASI CLOUD",
      color: "from-slate-900 via-emerald-950 to-slate-900",
      content: (
        <div className="space-y-3 py-3 text-left text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-emerald-300 block">Langkah 1</span>
              <span>Salin Kode Apps Script dari Modul Pengaturan Sistem.</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-emerald-300 block">Langkah 2</span>
              <span>Buka Google Sheets &rarr; Extensions &rarr; Apps Script &rarr; Tempel Kode &rarr; Deploy Web App (Anyone).</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
              <span className="font-bold text-emerald-300 block">Langkah 3</span>
              <span>Tempel Web App URL ke aplikasi & lakukan Sinkronisasi 2-Arah.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Kesimpulan & Penutup",
      subtitle: "Peningkatan Efisiensi Pengelolaan Asrama Sekolah Rakyat",
      tag: "SLIDE 10 • PENUTUP",
      color: "from-slate-900 via-slate-800 to-red-950",
      content: (
        <div className="space-y-5 text-center py-6">
          <h3 className="text-xl font-bold text-white">Sistem Keasramaan Siap Digunakan Secara Penuh</h3>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            Dengan sistem ini, pengawasan kedisiplinan santri, kesehatan UKS, perizinan pulang, dan laporan rekapitulasi dapat dijalankan secara akurat, transparan, dan teratur.
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Cetak Seluruh Panduan & Slide PDF
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-red-200 text-xs font-semibold mb-3 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5" /> Panduan & Presentasi Aplikasi
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Panduan Lengkap & Slide Presentasi PPT
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Panduan penggunaan lengkap setiap form, cetak PDF resmi, kustomisasi tanda tangan (Wali Asuh & Wali Asrama), serta slide presentasi interaktif.
            </p>
          </div>

          {/* Action Controls: Mode Switch + Print Button */}
          <div className="no-print flex flex-wrap items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
            {/* Mode Switcher */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'manual'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Dokumen Manual
              </button>
              <button
                onClick={() => setViewMode('presentation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'presentation'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" /> Slide PPT
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Cetak / Export PDF
            </button>
          </div>
        </div>
        <HelpCircle className="absolute right-4 -bottom-6 w-56 h-56 text-white/5 pointer-events-none" />
      </div>

      {/* VIEW MODE 1: PRESENTATION SLIDES (PPT MODE) */}
      {viewMode === 'presentation' && (
        <div className="space-y-6">
          {/* Main Slide Card */}
          <div className={`bg-gradient-to-br ${pptSlides[currentSlide].color} text-white rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[380px] flex flex-col justify-between border border-slate-700/50`}>
            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span className="text-[11px] font-bold tracking-wider text-red-300 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-full uppercase">
                {pptSlides[currentSlide].tag}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Slide {currentSlide + 1} dari {pptSlides.length}
              </span>
            </div>

            {/* Slide Title & Body */}
            <div className="my-auto space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {pptSlides[currentSlide].title}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                {pptSlides[currentSlide].subtitle}
              </p>
              <div className="pt-2">
                {pptSlides[currentSlide].content}
              </div>
            </div>

            {/* Slide Navigation Bar */}
            <div className="no-print pt-6 border-t border-white/10 flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                disabled={currentSlide === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold transition-all disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" /> Slide Sebelumnya
              </button>

              {/* Dots / Thumbnails */}
              <div className="hidden sm:flex items-center gap-1.5">
                {pptSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentSlide === idx ? 'bg-red-500 w-6' : 'bg-white/30 hover:bg-white/60'
                    }`}
                    title={`Ke Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentSlide((prev) => Math.min(pptSlides.length - 1, prev + 1))}
                disabled={currentSlide === pptSlides.length - 1}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-bold transition-all disabled:pointer-events-none"
              >
                Slide Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Overview of All PPT Slides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-4 h-4 text-red-600" /> Ringkasan Seluruh Slide Presentasi (Slide Deck)
              </h3>
              <span className="text-xs text-slate-500">Klik slide untuk menampilkan secara penuh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {pptSlides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-32 ${
                    currentSlide === idx
                      ? 'bg-slate-900 text-white border-red-600 ring-2 ring-red-500 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-red-500 uppercase">
                      Slide {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold line-clamp-2 leading-tight">
                      {slide.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] line-clamp-1 ${currentSlide === idx ? 'text-slate-400' : 'text-slate-500'}`}>
                    {slide.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DOCUMENT MANUAL MODE */}
      {viewMode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="no-print lg:col-span-1 space-y-1 bg-white p-3 border border-slate-200 rounded-2xl shadow-sm h-fit sticky top-20">
            <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Daftar Modul Panduan
            </p>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            {/* SECTION 1: INTRO */}
            {activeSection === 'intro' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-600" /> Pengenalan & Arsitektur Sistem
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gambaran umum arsitektur penyimpanan dan moda kerja sistem keasramaan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      1. Mode Online (Cloud Database)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Sistem terhubung langsung dengan Google Sheets melalui Google Apps Script Web App. Data dari semua pengguna (Wali Asrama, Wali Asuh, Petugas UKS) tersimpan aman dan tersinkronisasi secara real-time.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      2. Mode Offline (Penyimpanan Lokal)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Jika tidak terhubung dengan URL Google Apps Script, sistem menyimpan seluruh data di browser (LocalStorage). Anda tetap bisa menginput data, mencetak PDF, lalu melakukan sinkronisasi saat terhubung internet.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Fitur Unggulan Sistem:
                  </h3>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Manajemen Data Santri Terpadu:</strong> Riwayat pelanggaran, perizinan, konseling, dan kesehatan santri tersimpan lengkap dalam satu tempat.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Pencetakan PDF Resmi:</strong> Ekspor Surat Perizinan Pulang, Surat Izin Sakit, Surat Panggilan Orang Tua, Rapor Keasramaan, dan Laporan Rekapitulasi dengan Kop Resmi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Fleksibilitas Penandatangan:</strong> Kustomisasi nama Wali Asuh, Wali Asrama, dan NIP pada setiap dokumen dan lembar pengesahan.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION 2: DASHBOARD */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-red-600" /> Modul Dashboard & Ringkasan Statistik
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pusat pemantauan statistik utama dan pintasan aktivitas harian.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Penggunaan & Elemen Utama:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li><strong>Ringkasan KPI Card:</strong> Menampilkan total santri aktif, jumlah perizinan aktif (santri yang sedang di luar asrama), santri sakit di UKS, dan total poin pelanggaran bulan ini.</li>
                    <li><strong>Tombol Sinkronisasi Cepat:</strong> Klik tombol <span className="bg-slate-100 border px-1.5 py-0.5 rounded font-mono text-[11px]">Sinkronkan Sekarang</span> di bagian atas untuk memperbarui data dari Google Sheets.</li>
                    <li><strong>Statistik Grafik & Distribusi:</strong> Pemantauan grafik perizinan bulanan dan grafik kategori pelanggaran secara visual.</li>
                    <li><strong>Aktivitas Terkini:</strong> Memantau log perizinan keluar, konseling terbaru, dan riwayat kesehatan terkini santri.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 3: CHECKLIST */}
            {activeSection === 'checklist' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-red-600" /> Modul Ceklist & Jurnal Observasi Harian
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pencatatan kedisiplinan, ibadah, kebersihan kamar, dan observasi perilaku harian santri oleh Wali Asuh.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form Observasi Harian:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Pilih <strong>Tanggal Observasi</strong> dan pilih <strong>Nama Santri</strong> dari menu dropdown.</li>
                    <li>Isi aspek penilaian harian:
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                        <li>Kedisiplinan Bangun Pagi & Kegiatan Asrama</li>
                        <li>Pelaksanaan Shalat Berjamaah & Ibadah</li>
                        <li>Kebersihan & Kerapihan Kamar / Asrama</li>
                        <li>Sikap Sosial & Etika Berkomunikasi</li>
                      </ul>
                    </li>
                    <li>Isi <strong>Catatan Khusus Wali Asuh</strong> untuk mencatat perkembangan spesifik santri pada hari tersebut.</li>
                    <li>Klik <strong>Simpan Jurnal Observasi</strong>. Data akan tersimpan dalam riwayat harian santri.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 4: STUDENTS */}
            {activeSection === 'students' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" /> Modul Data Murid / Santri & Riwayat Terpadu
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengelolaan biodata santri, pendaftaran manual/impor, dan pelacakan riwayat rekam jejak.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Penggunaan & Fitur Data Murid:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li><strong>Tambah Murid Baru:</strong> Klik tombol <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">+ Tambah Murid</span>, isi NISN/ID, Nama Lengkap, Kelas, Gedung Asrama, dan Wali Asuh Penanggung Jawab.</li>
                    <li><strong>Impor Massal (Excel / CSV):</strong> Klik tombol <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold flex-inline items-center gap-1"><FileSpreadsheet className="w-3 h-3 inline" /> Impor Excel</span> untuk memasukkan puluhan data murid sekaligus sesuai format kolom.</li>
                    <li><strong>Pencarian & Filter:</strong> Gunakan kotak pencarian untuk mencari nama/NISN murid, atau filter berdasarkan Kelas dan Asrama.</li>
                    <li><strong>Lihat Riwayat Lengkap:</strong> Klik tombol <span className="bg-slate-100 border px-2 py-0.5 rounded text-blue-600 font-bold">Riwayat</span> pada baris murid untuk melihat gabungan rekam medis, izin pulang, poin pelanggaran, dan rekam konseling dalam satu panel modal.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 5: VIOLATIONS */}
            {activeSection === 'violations' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" /> Modul Pelanggaran & Poin Kedisiplinan
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pencatatan kasus pelanggaran tata tertib, perhitungan akumulasi poin, dan pengeluaran Surat Panggilan.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form Pelanggaran:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Klik tombol <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">+ Catat Pelanggaran</span>.</li>
                    <li>Pilih <strong>Nama Santri</strong>. NISN, Kelas, dan Asrama akan terisi otomatis.</li>
                    <li>Pilih <strong>Kategori Pelanggaran</strong> (Ringan / Sedang / Berat) dan masukan <strong>Bobot Poin</strong> (misal: 10, 25, 50).</li>
                    <li>Isi Tanggal Kejadian, Lokasi, Nama Pelapor (Wali Asrama/Guru/Wali Asuh), serta Detail Kejadian & Tindakan/Sanksi yang diberikan.</li>
                    <li>Klik <strong>Simpan Catatan Pelanggaran</strong>.</li>
                    <li><strong>Cetak Surat Panggilan Orang Tua (PDF):</strong> Untuk pelanggaran sedang/berat, klik tombol <span className="bg-rose-100 text-rose-700 border px-2 py-0.5 rounded font-bold">Cetak Surat Panggilan</span> untuk mengunduh dokumen resmi bertanda tangan.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 6: COUNSELING */}
            {activeSection === 'counseling' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-600" /> Modul Konseling & Bimbingan Konseling (BK)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pencatatan sesi bimbingan psikologis, konsultasi masalah santri, dan rencana tindak lanjut pembinaan.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form Bimbingan Konseling:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Klik tombol <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold">+ Tambah Sesi Bimbingan</span>.</li>
                    <li>Pilih <strong>Nama Santri</strong> dan masukan Tanggal Bimbingan serta Nama Konselor / Guru BK / Wali Asuh.</li>
                    <li>Pilih <strong>Sifat Catatan:</strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600">
                        <li><em>Rahasia:</em> Hanya konselor dan tim inti yang dapat membaca detail.</li>
                        <li><em>Umum:</em> Dapat dilihat sebagai catatan perkembangan terbuka.</li>
                      </ul>
                    </li>
                    <li>Tuliskan <strong>Keluhan / Topik Permasalahan</strong>, <strong>Solusi / Rekomendasi Hasil Konseling</strong>, serta <strong>Rencana Tindak Lanjut</strong>.</li>
                    <li>Atur Status Perkembangan (Belum Selesai / Dalam Pemantauan / Selesai).</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 7: LEAVES */}
            {activeSection === 'leaves' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-red-600" /> Modul Perizinan Pulang & Cetak PDF Surat Izin
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengajuan izin keluar/pulangan asrama, pelacakan tanggal kembali, dan pencetakan dokumen izin bertanda tangan resmi.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form & Cetak Surat Izin Pulang:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Klik tombol <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">+ Buat Perizinan Baru</span>.</li>
                    <li>Pilih <strong>Nama Santri</strong>, Kategori Perizinan (Izin Sakit, Acara Keluarga, Mudik/Libur, Tugas Sekolah), Tanggal Berangkat, dan Tanggal Wajib Kembali.</li>
                    <li><strong>Penandatangan TTD Kustom:</strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600">
                        <li>Isi <strong>Nama & NIP Wali Asuh Pendamping</strong></li>
                        <li>Isi <strong>Nama & NIP Wali Asrama</strong></li>
                      </ul>
                    </li>
                    <li>Klik <strong>Simpan Perizinan</strong>.</li>
                    <li><strong>Cetak Surat Perizinan Pulang PDF:</strong>
                      <p className="mt-1 leading-relaxed">
                        Klik ikon <Printer className="w-3.5 h-3.5 inline text-blue-600" /> atau <FileText className="w-3.5 h-3.5 inline text-rose-600" /> pada baris tabel untuk membuka pratinjau surat. Anda dapat menyesuaikan Nama & NIP Wali Asuh / Wali Asrama langsung pada jendela pratinjau sebelum mengunduh PDF!
                      </p>
                    </li>
                    <li><strong>Update Status Kembali:</strong> Apabila santri telah tiba kembali di asrama, ubah status menjadi <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Sudah Kembali</span>. Jika melewati batas tanggal kembali, status otomatis bertanda <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">Terlambat</span>.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 8: MEDICAL */}
            {activeSection === 'medical' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-600" /> Modul UKS & Rekam Medis Santri
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pencatatan pemeriksaan kesehatan, riwayat penyakit, pemberian obat UKS, dan cetak Surat Izin Sakit PDF.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form Rekam Medis:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Klik tombol <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">+ Catat Rekam Medis</span>.</li>
                    <li>Pilih <strong>Nama Santri</strong>.</li>
                    <li>Isi Vital Signs (Suhu Tubuh misal 38.2°C, Tensi/Nadi misal 120/80 mmHg).</li>
                    <li>Isi <strong>Keluhan Utama</strong>, <strong>Diagnosis Medis</strong>, <strong>Tindakan & Resep Obat UKS</strong>, serta Status Perawatan (Istirahat UKS / Rawat Jalan / Rujukan Rumah Sakit).</li>
                    <li><strong>Penandatangan Wali Asrama (Blok TTD):</strong> Masukkan Nama Wali Asrama & NIP kustom untuk lembar pengesahan.</li>
                    <li><strong>Cetak Surat Izin Sakit PDF:</strong> Klik tombol <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold">Unduh PDF Surat Izin Sakit</span>. Anda juga dapat mengubah Nama & NIP Wali Asrama secara langsung di jendela modal pratinjau sebelum diunduh.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 9: REPORT CARD */}
            {activeSection === 'reportCard' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-red-600" /> Modul Rapor Keasramaan & Karakter
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Penyusunan capaian indikator nilai karakter, deskripsi perkembangan santri, dan pengesahan kustomisasi penandatangan.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Pengisian Form Rapor Keasramaan:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Pilih <strong>Nama Santri</strong>, Semester (Ganjil/Genap), dan Tahun Ajaran.</li>
                    <li>Isi Nilai Indikator Karakter (Kedisiplinan, Keagamaan/Ibadah, Kebersihan & Kerapihan, Kemandirian, Kemampuan Sosial). Pilih predikat (A / B / C / D).</li>
                    <li>Tuliskan <strong>Deskripsi Catatan Perkembangan Karakter</strong> santri oleh Wali Asuh.</li>
                    <li><strong>Pengaturan Penandatangan (Blok TTD Rapor):</strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600">
                        <li><strong>Wali Asuh:</strong> Isi Nama Wali Asuh & NIP</li>
                        <li><strong>Wali Asrama:</strong> Isi Nama Wali Asrama & NIP</li>
                      </ul>
                    </li>
                    <li>Klik <strong>Simpan Data Rapor</strong>.</li>
                    <li>Klik tombol <span className="bg-rose-600 text-white px-2.5 py-1 rounded font-bold">Unduh PDF Rapor Keasramaan</span> untuk mencetak dokumen rapor berformat A4 dengan Kop Resmi Sekolah Rakyat.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 10: RECAP */}
            {activeSection === 'recap' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" /> Modul Rekapitulasi & Laporan Pengesahan
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pembuatan laporan ringkasan berkala untuk pimpinan, Kepala Sekolah, dan Dinas Terkait.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Ekspor Laporan Rekapitulasi:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li>Pilih <strong>Jenis Rekapitulasi:</strong> Rekapitulasi Poin Pelanggaran, Rekapitulasi Perizinan, Rekapitulasi Kesehatan UKS, atau Rekapitulasi Karakter.</li>
                    <li>Atur Filter Periode (Bulan / Semester).</li>
                    <li><strong>Pengesahan Penandatangan Laporan:</strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600">
                        <li>Penandatangan 1: Wali Asrama / Wali Asuh (Nama & NIP)</li>
                        <li>Penandatangan 2: Kepala Sekolah / Pimpinan Instansi (Nama & NIP)</li>
                      </ul>
                    </li>
                    <li>Klik <strong>Pratinjau / Cetak Laporan Rekapitulasi PDF</strong> untuk mencetak dokumen siap TTD.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 11: SETTINGS */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-red-600" /> Modul Pengaturan Sistem & Integration Google Sheets
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Konfigurasi identitas sekolah, Kop Surat, integrasi Google Apps Script, dan manajemen admin.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Konfigurasi Identitas & Google Sheets:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li><strong>Pengaturan Kop Surat & Sekolah:</strong> Masukkan Nama Sekolah (misal: <em>Sekolah Rakyat Terintegrasi 31 Palembang</em>), Alamat Lengkap, Nomor Telepon, Email, dan URL Logo Sekolah.</li>
                    <li><strong>Penandatangan Default:</strong> Atur Nama Wali Asrama, NIP Wali Asrama, dan Nama Kepala Sekolah & NIP utama yang akan menjadi default di seluruh aplikasi.</li>
                    <li><strong>Daftar Wali Asuh & NIP Terdaftar:</strong> Masukkan daftar Wali Asuh pendamping dengan format <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Nama|NIP</code> (satu per baris).</li>
                    <li><strong>Integrasi Google Sheets:</strong>
                      <p className="mt-1 leading-relaxed text-slate-600">
                        Salin kode Google Apps Script yang disediakan di modul Pengaturan, tempel ke Extensions &gt; Apps Script di Google Sheets Anda, lalu Publish sebagai Web App (Access: Anyone). Masukkan <strong>Web App URL</strong> yang didapat ke dalam kolom Google Script URL pada Pengaturan Sistem.
                      </p>
                    </li>
                    <li><strong>Sinkronisasi 2-Arah:</strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600">
                        <li><strong>Tarik Data Cloud:</strong> Memuat seluruh data terbaru dari Google Sheets ke browser.</li>
                        <li><strong>Kirim Data ke Cloud:</strong> Mengunggah seluruh data dari browser ke Google Sheets secara menyeluruh.</li>
                      </ul>
                    </li>
                    <li><strong>Keamanan Admin:</strong> Ubah Kata Sandi Admin secara berkala melalui menu Keamanan Login.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

