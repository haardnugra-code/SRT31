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
  Check,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkle
} from 'lucide-react';

const pptSlides = [
  {
    title: "Sistem Informasi Keasramaan Sekolah Rakyat",
    subtitle: "Panduan Operasional & Presentasi Modul Manajemen Keasramaan Terpadu",
    tag: "SLIDE 1 • JUDUL UTAMA",
    color: "from-slate-900 via-slate-800 to-red-950",
    content: (
      <div className="space-y-5 text-center py-4">
        <div className="w-16 h-16 bg-red-600/20 border-2 border-red-500/40 rounded-2xl mx-auto flex items-center justify-center text-red-400 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="max-w-2xl mx-auto space-y-1.5">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Digitalisasi Pengelolaan Asrama & Pembinaan Murid</h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            Solusi terintegrasi untuk pencatatan observasi harian, rekam medis UKS, perizinan pulang, poin kedisiplinan, rapor karakter, serta sinkronisasi Google Sheets 2-arah.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] font-semibold">
          <span className="px-3 py-1 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ Google Sheets Sync</span>
          <span className="px-3 py-1 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ Cetak PDF Resmi Kop Sekolah</span>
          <span className="px-3 py-1 bg-white/10 text-slate-200 rounded-full border border-white/10">✓ TTD Custom Wali Asuh & Wali Asrama</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-left">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" /> Mode Online Cloud
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">
            Terhubung langsung ke Google Sheets melalui Apps Script Web App URL. Data tersimpan terpusat dan dapat diakses multi-user.
          </p>
          <ul className="text-slate-300 text-[11px] space-y-1 list-disc pl-4">
            <li>Sinkronisasi otomatis saat simpan data</li>
            <li>Pembaruan data real-time via Tarik Data Cloud</li>
            <li>Backup terpusat di Google Drive sekolah</li>
          </ul>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Sliders className="w-4 h-4" /> Mode Offline Standalone
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">
            Jika koneksi internet terputus, seluruh transaksi data disimpan di LocalStorage browser tanpa hambatan.
          </p>
          <ul className="text-slate-300 text-[11px] space-y-1 list-disc pl-4">
            <li>Tetap bisa input data & cetak PDF</li>
            <li>Bisa sinkronisasi kapan saja saat internet tersedia</li>
            <li>Penyimpanan cepat dan responsif</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Form Dashboard & Ringkasan Statistik KPI",
    subtitle: "Pusat Pemantauan Indikator Kinerja Utama & Log Aktivitas Asrama",
    tag: "SLIDE 3 • FORM DASHBOARD",
    color: "from-slate-900 via-slate-800 to-blue-950",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-blue-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Menampilkan ringkasan KPI real-time (Total Murid, Izin Aktif di Luar, Rawat UKS, Total Poin Pelanggaran Bulan Ini), grafik statistik distribusi, serta log aktivitas harian terbaru.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-blue-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">1</span>
            <span className="font-bold text-blue-300 block">Monitoring KPI</span>
            <p className="text-[11px] text-slate-300">Pantau 4 kartu indikator utama kondisi asrama.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-blue-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">2</span>
            <span className="font-bold text-blue-300 block">Shortcut Sync</span>
            <p className="text-[11px] text-slate-300">Klik "Sinkronkan Sekarang" untuk update data cloud.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-blue-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">3</span>
            <span className="font-bold text-blue-300 block">Analisis Grafik</span>
            <p className="text-[11px] text-slate-300">Tinjau grafik perizinan & kategori pelanggaran.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-blue-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">4</span>
            <span className="font-bold text-blue-300 block">Log Terkini</span>
            <p className="text-[11px] text-slate-300">Cek perizinan keluar, rekam medis & konseling terbaru.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Data Murid & Impor Massal Excel/CSV",
    subtitle: "Pengelolaan Master Biodata, Gedung Asrama, Wali Asuh & Riwayat Terpadu",
    tag: "SLIDE 4 • FORM DATA MURID",
    color: "from-slate-900 via-blue-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-blue-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mendaftarkan murid baru, menentukan Gedung Asrama & Wali Asuh penanggung jawab, melakukan impor massal file Excel/CSV, serta menelusuri modal rekam jejak murid terpadu.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-blue-300 block">A. Pendaftaran Manual & Impor Excel:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Klik tombol <strong className="text-red-400">+ Tambah Murid</strong> atau <strong className="text-emerald-400">Impor Excel</strong>.</li>
              <li>Isi NISN/ID, Nama Lengkap, Kelas, Gedung Asrama & Wali Asuh.</li>
              <li>Klik <strong>Simpan Murid</strong> untuk merekam biodata master.</li>
            </ol>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-blue-300 block">B. Penelusuran Riwayat Terpadu:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Cari nama murid pada kotak pencarian atau filter per kelas/asrama.</li>
              <li>Klik tombol <strong className="text-cyan-300">Riwayat</strong> pada baris murid.</li>
              <li>Buka modal gabungan rekam medis, izin pulang, poin & konseling.</li>
            </ol>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Ceklist Observasi Harian Pembiasaan",
    subtitle: "Jurnal Harian 4 Aspek Karakter & Catatan Observasi Wali Asuh",
    tag: "SLIDE 5 • FORM CEKLIST OBSERVASI",
    color: "from-slate-900 via-emerald-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-emerald-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mencatat jurnal observasi pembiasaan harian murid (Bangun Pagi, Shalat Berjamaah, Kebersihan Kamar, Etika Sosial) dan memberikan catatan perkembangan khusus dari Wali Asuh.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">1</span>
            <span className="font-bold text-emerald-300 block">Pilih Tanggal</span>
            <p className="text-[11px] text-slate-300">Pilih tanggal observasi & nama murid.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">2</span>
            <span className="font-bold text-emerald-300 block">Bangun Pagi</span>
            <p className="text-[11px] text-slate-300">Centang kedisiplinan bangun tepat waktu.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">3</span>
            <span className="font-bold text-emerald-300 block">Shalat Berjamaah</span>
            <p className="text-[11px] text-slate-300">Centang keikutsertaan ibadah harian.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">4</span>
            <span className="font-bold text-emerald-300 block">Kebersihan Kamar</span>
            <p className="text-[11px] text-slate-300">Centang kerapihan ranjang & lemari.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">5</span>
            <span className="font-bold text-emerald-300 block">Catatan Wali Asuh</span>
            <p className="text-[11px] text-slate-300">Tuliskan pesan khusus & simpan jurnal.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Pelanggaran & Surat Panggilan Orang Tua",
    subtitle: "Input Kasus Kedisiplinan, Akumulasi Poin, & Cetak Surat Panggilan PDF",
    tag: "SLIDE 6 • FORM PELANGGARAN",
    color: "from-slate-900 via-rose-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-rose-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mencatat kasus pelanggaran tata tertib asrama, mengkalkulasi akumulasi bobot poin kedisiplinan murid, dan menerbitkan Surat Panggilan Orang Tua PDF resmi.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-rose-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">1</span>
            <span className="font-bold text-rose-300 block">Tombol Tambah</span>
            <p className="text-[11px] text-slate-300">Klik "+ Catat Pelanggaran".</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-rose-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">2</span>
            <span className="font-bold text-rose-300 block">Pilih Murid</span>
            <p className="text-[11px] text-slate-300">Pilih nama, NISN & Kelas terisi otomatis.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-rose-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">3</span>
            <span className="font-bold text-rose-300 block">Kategori & Poin</span>
            <p className="text-[11px] text-slate-300">Atur Ringan/Sedang/Berat & bobot poin.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-rose-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">4</span>
            <span className="font-bold text-rose-300 block">Deskripsi Kasus</span>
            <p className="text-[11px] text-slate-300">Input tanggal, lokasi & uraian kejadian.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="w-5 h-5 bg-rose-500 text-white font-extrabold rounded-full inline-flex items-center justify-center text-[10px] mb-1">5</span>
            <span className="font-bold text-rose-300 block">Cetak PDF</span>
            <p className="text-[11px] text-slate-300">Klik "Cetak Surat Panggilan" ber-Kop.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Bimbingan Konseling (BK)",
    subtitle: "Pencatatan Sesi Psikologis, Penanganan Masalah & Tindak Lanjut Pembinaan",
    tag: "SLIDE 7 • FORM KONSELING BK",
    color: "from-slate-900 via-indigo-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-indigo-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Merekam sesi konsultasi psikologis, keluhan murid, rekomendasi penanganan, klasifikasi sifat catatan (Rahasia/Umum), dan memantau status penyelesaian masalah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-indigo-300 block">1. Sesi & Konselor</span>
            <p className="text-[11px] text-slate-300">Klik "+ Tambah Sesi", pilih Murid & Konselor BK.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-indigo-300 block">2. Sifat Catatan</span>
            <p className="text-[11px] text-slate-300">Atur Rahasia (khusus tim BK) atau Umum.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-indigo-300 block">3. Keluhan & Solusi</span>
            <p className="text-[11px] text-slate-300">Isi uraian masalah, hasil & rekomendasi.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-indigo-300 block">4. Status Pemantauan</span>
            <p className="text-[11px] text-slate-300">Update status: Belum Selesai / Dalam Pemantauan / Selesai.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Perizinan Pulang & Surat Izin PDF",
    subtitle: "Pengajuan Keluar Asrama, Tanggal Kembali, & Cetak Surat Izin Pulang PDF",
    tag: "SLIDE 8 • FORM PERIZINAN PULANG",
    color: "from-slate-900 via-purple-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-purple-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mengajukan perizinan keluar/pulang murid, menetapkan batas tanggal kembali, melacak status perizinan secara otomatis (Aktif/Kembali/Terlambat), dan mencetak Surat Izin Pulang PDF.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-purple-300 block">A. Input Perizinan & TTD:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Klik <strong>+ Buat Perizinan Baru</strong>, pilih Nama Murid & Alasan.</li>
              <li>Isi Tanggal Berangkat & Tanggal Wajib Kembali.</li>
              <li>Pilih / Input Nama & NIP Wali Asuh serta Wali Asrama.</li>
            </ol>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-purple-300 block">B. Pratinjau PDF & Update Status:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Klik ikon <strong>Cetak PDF Surat Izin</strong> pada tabel perizinan.</li>
              <li>Edit Nama/NIP TTD langsung di jendela pratinjau jika diperlukan.</li>
              <li>Klik <strong>Sudah Kembali</strong> saat murid telah pulang ke asrama.</li>
            </ol>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form UKS & Rekam Medis Murid",
    subtitle: "Pemeriksaan Vital Signs, Diagnosis, Obat UKS & Surat Izin Sakit PDF",
    tag: "SLIDE 9 • FORM REKAM MEDIS UKS",
    color: "from-slate-900 via-teal-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-teal-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Merekam pemeriksaan kesehatan fisik murid, mencatat vital signs (Suhu Tubuh °C, Tensi, Nadi), diagnosis penyakit, resep obat UKS, status perawatan, dan mencetak Surat Izin Sakit PDF.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-teal-300 block">1. Vital Signs</span>
            <p className="text-[11px] text-slate-300">Input Suhu (°C), Tekanan Darah & Nadi murid.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-teal-300 block">2. Diagnosis & Obat</span>
            <p className="text-[11px] text-slate-300">Tulis keluhan utama, diagnosis & resep obat UKS.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-teal-300 block">3. Status & Cetak PDF</span>
            <p className="text-[11px] text-slate-300">Atur status (Rawat UKS/Rujukan) & unduh Surat Sakit PDF.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Rapor Keasramaan & Karakter Murid",
    subtitle: "Evaluasi Semesteran Capaian Karakter, Catatan Perkembangan & Export A4 PDF",
    tag: "SLIDE 10 • FORM RAPOR KEASRAMAAN",
    color: "from-slate-900 via-amber-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-amber-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Menilai indikator karakter semesteran murid (Kedisiplinan, Ibadah, Kebersihan, Kemandirian, Sosial) dengan predikat A/B/C/D, menyusun deskripsi perkembangan, serta mencetak Rapor A4 PDF Kop Sekolah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-amber-300 block">A. Nilai Indikator Karakter:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Pilih Nama Murid, Semester & Tahun Ajaran.</li>
              <li>Isi predikat (A / B / C / D) untuk 4 indikator karakter.</li>
              <li>Tuliskan narasi deskripsi perkembangan murid oleh Wali Asuh.</li>
            </ol>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="font-bold text-amber-300 block">B. Pengesahan & Unduh PDF:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[11px]">
              <li>Masukkan Nama & NIP Wali Asuh serta Wali Asrama.</li>
              <li>Klik <strong>Simpan Data Rapor</strong>.</li>
              <li>Klik <strong>Unduh PDF Rapor Keasramaan</strong> (Format A4).</li>
            </ol>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Rekapitulasi & Laporan Pengesahan Pimpinan",
    subtitle: "Filter Laporan Berkala (Pelanggaran, Izin, UKS, Karakter) & Dual TTD",
    tag: "SLIDE 11 • FORM REKAPITULASI",
    color: "from-slate-900 via-cyan-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-cyan-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Menyusun laporan rekapitulasi ringkasan berkala untuk pimpinan, Kepala Sekolah, dan Dinas Pendidikan dengan Dual TTD pengesahan resmi.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-cyan-300 block">1. Jenis Laporan</span>
            <p className="text-[11px] text-slate-300">Pilih Rekap Poin, Perizinan, UKS, atau Karakter.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-cyan-300 block">2. Periode Laporan</span>
            <p className="text-[11px] text-slate-300">Atur filter bulan atau semester tertentu.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-cyan-300 block">3. Dual TTD</span>
            <p className="text-[11px] text-slate-300">Isi TTD Wali Asrama & Kepala Sekolah + NIP.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-cyan-300 block">4. Cetak PDF</span>
            <p className="text-[11px] text-slate-300">Klik "Pratinjau / Cetak Laporan Rekap PDF".</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Form Pengaturan Sistem & Integrasi Google Sheets",
    subtitle: "Identitas Sekolah, Kop Surat, Master Wali Asuh, & Dual-Sync Cloud Database",
    tag: "SLIDE 12 • FORM PENGATURAN",
    color: "from-slate-900 via-emerald-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
          <span className="font-bold text-emerald-300 block">Fungsi Utama Form:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mengatur identitas sekolah, Kop Surat resmi, URL Logo, master daftar Wali Asuh, default penandatangan, dan mengelola sinkronisasi 2-arah dengan Google Sheets.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">1. Identitas & Kop Surat</span>
            <p className="text-[11px] text-slate-300">Isi Nama Sekolah, Alamat, Telp & URL Logo.</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">2. Master Wali Asuh</span>
            <p className="text-[11px] text-slate-300">Daftarkan list Wali Asuh & NIP (Nama|NIP).</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">3. Dual Sync Cloud</span>
            <p className="text-[11px] text-slate-300">Pasang Apps Script URL, jalankan Tarik/Kirim Data.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Modul Kustomisasi Penandatangan Dokumen",
    subtitle: "Fleksibilitas Pengubahan Nama & NIP Wali Asuh, Wali Asrama & Kepala Sekolah",
    tag: "SLIDE 13 • KUSTOMISASI TTD",
    color: "from-slate-900 via-slate-800 to-indigo-950",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="p-3.5 bg-white/10 border border-white/10 rounded-xl space-y-2">
          <span className="font-bold text-indigo-300 block">Fitur Kustomisasi TTD di Seluruh Dokumen:</span>
          <p className="text-slate-200 text-[11px] leading-relaxed">
            Seluruh lembar pengesahan dan dokumen PDF (Surat Izin Pulang, Surat Sakit, Surat Panggilan, Rapor & Laporan Rekap) mendukung pengubahan Nama dan NIP penandatangan secara dinamis langsung pada form transaksi maupun pada jendela modal pratinjau sebelum dicetak.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Panduan Setup Google Apps Script",
    subtitle: "Langkah Pemasangan Database Cloud Gratis Menggunakan Google Sheets",
    tag: "SLIDE 14 • SETUP GOOGLE SHEETS",
    color: "from-slate-900 via-emerald-950 to-slate-900",
    content: (
      <div className="space-y-3 py-1 text-left text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">Langkah 1: Salin Script</span>
            <p className="text-[11px] text-slate-300">Buka Pengaturan Sistem &rarr; Klik "Salin Kode Apps Script".</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">Langkah 2: Deploy Web App</span>
            <p className="text-[11px] text-slate-300">Buka Google Sheets &rarr; Extensions &rarr; Apps Script &rarr; Tempel Kode &rarr; Deploy Web App (Who has access: Anyone).</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 block">Langkah 3: Paste URL & Sync</span>
            <p className="text-[11px] text-slate-300">Salin Web App URL, masukan ke Pengaturan Sistem, lalu klik "Sinkronkan Sekarang".</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Penutup & Petunjuk Cetak PPT ke PDF",
    subtitle: "Siap Digunakan Secara Penuh untuk Efisiensi Pengelolaan Asrama",
    tag: "SLIDE 15 • PENUTUP & CETAK SLIDE",
    color: "from-slate-900 via-slate-800 to-red-950",
    content: (
      <div className="space-y-4 text-center py-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Sistem Keasramaan Siap Digunakan</h3>
        <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
          Klik tombol di bawah ini untuk mencetak seluruh slide presentasi ini ke dalam format PDF berorientasi cetak bersih per halaman.
        </p>
        <div className="pt-2 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xl transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" /> Cetak / Export Seluruh Slide PPT ke PDF
          </button>
        </div>
      </div>
    )
  }
];

export const PptPrintSlides: React.FC = () => {
  return (
    <div className="hidden print:block print-ppt-container space-y-6">
      <div className="text-center pb-4 border-b border-white/20 mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          PANDUAN OPERASIONAL & PRESENTASI PPT SISTEM KEASRAMAAN
        </h1>
        <p className="text-xs font-semibold text-slate-300 mt-1">
          Sekolah Rakyat • Dokumentasi Langkah Demi Langkah Setiap Form, Cetak PDF, & Pengaturan TTD
        </p>
      </div>

      {pptSlides.map((slide, idx) => (
        <div
          key={idx}
          className="page-break-after border-2 border-slate-700 rounded-2xl p-6 bg-slate-950 text-white space-y-4 my-4 shadow-none min-h-[175mm] flex flex-col justify-between"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {/* Header Slide */}
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <span className="text-[11px] font-extrabold text-red-400 bg-red-950 border border-red-500/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {slide.tag}
            </span>
            <span className="text-xs font-mono text-slate-300 font-bold">
              SLIDE {idx + 1} / {pptSlides.length}
            </span>
          </div>

          {/* Title & Body */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">{slide.title}</h2>
            <p className="text-xs text-slate-300 font-medium mb-3">{slide.subtitle}</p>
            <div className="text-xs text-slate-100">{slide.content}</div>
          </div>

          {/* Footer Slide */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Sistem Keasramaan • Sekolah Rakyat Terintegrasi 31 Palembang</span>
            <span>Slide {idx + 1} dari {pptSlides.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface GuideTabProps {
  onSelectTab?: (tab: string) => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({ onSelectTab }) => {
  const [viewMode, setViewMode] = useState<'demo' | 'presentation' | 'manual'>('demo');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Demo simulator state
  const [demoFormModule, setDemoFormModule] = useState<string>('students');
  const [demoSimulated, setDemoSimulated] = useState<boolean>(false);
  const [demoSampleName, setDemoSampleName] = useState<string>('Ahmad Rizky Pratama');
  const [demoSampleClass, setDemoSampleClass] = useState<string>('X-A');

  const sections = [
    { id: 'intro', title: '1. Pengenalan & Arsitektur', icon: Sparkles },
    { id: 'dashboard', title: '2. Dashboard & Statistik', icon: LineChart },
    { id: 'checklist', title: '3. Form Ceklist Observasi', icon: CheckSquare },
    { id: 'students', title: '4. Form Data Murid & Import', icon: Users },
    { id: 'violations', title: '5. Form Pelanggaran & Poin', icon: AlertTriangle },
    { id: 'counseling', title: '6. Form Konseling & BK', icon: MessageSquare },
    { id: 'leaves', title: '7. Form Izin Pulang & PDF', icon: DoorOpen },
    { id: 'medical', title: '8. Form UKS & Rekam Medis', icon: HeartPulse },
    { id: 'reportCard', title: '9. Form Rapor Keasramaan', icon: FileSignature },
    { id: 'recap', title: '10. Form Rekapitulasi PDF', icon: FileText },
    { id: 'settings', title: '11. Pengaturan & Google Sheets', icon: Sliders },
  ];

  const demoModules = [
    { id: 'students', title: 'Form Data Murid', icon: Users, color: 'border-blue-500 bg-blue-50 text-blue-900', targetTab: 'students' },
    { id: 'checklist', title: 'Form Ceklist Harian', icon: CheckSquare, color: 'border-emerald-500 bg-emerald-50 text-emerald-900', targetTab: 'checklist' },
    { id: 'violations', title: 'Form Pelanggaran & Poin', icon: AlertTriangle, color: 'border-rose-500 bg-rose-50 text-rose-900', targetTab: 'violations' },
    { id: 'counseling', title: 'Form Konseling BK', icon: MessageSquare, color: 'border-indigo-500 bg-indigo-50 text-indigo-900', targetTab: 'counseling' },
    { id: 'leaves', title: 'Form Perizinan Pulang', icon: DoorOpen, color: 'border-purple-500 bg-purple-50 text-purple-900', targetTab: 'leaves' },
    { id: 'medical', title: 'Form UKS & Rekam Medis', icon: HeartPulse, color: 'border-teal-500 bg-teal-50 text-teal-900', targetTab: 'medical' },
    { id: 'reportCard', title: 'Form Rapor Keasramaan', icon: FileSignature, color: 'border-amber-500 bg-amber-50 text-amber-900', targetTab: 'report-card' },
    { id: 'settings', title: 'Pengaturan & Google Sheets', icon: Sliders, color: 'border-slate-500 bg-slate-50 text-slate-900', targetTab: 'settings' },
  ];

  const runDemoSimulation = () => {
    setDemoSimulated(true);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* SCREEN HEADER BANNER (Hidden on print) */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-red-200 text-xs font-semibold mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Panduan & Simulator Demo App
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Panduan Operasional & Demo Cara Input Data
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Pelajari simulasi cara input data murid, jurnal observasi, perizinan, rekam medis UKS, rapor karakter, serta cetak dokumen PDF resmi.
            </p>
          </div>

          {/* Action Controls: Mode Switch + Print Button */}
          <div className="no-print flex flex-wrap items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
            {/* Mode Switcher */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('demo')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  viewMode === 'demo'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Demo Cara Input
              </button>
              <button
                type="button"
                onClick={() => setViewMode('presentation')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  viewMode === 'presentation'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" /> Slide PPT ({pptSlides.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  viewMode === 'manual'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Dokumentasi Manual
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Cetak / Export PDF PPT
            </button>
          </div>
        </div>
        <HelpCircle className="absolute right-4 -bottom-6 w-56 h-56 text-white/5 pointer-events-none" />
      </div>

      {/* MODE 1: INTERACTIVE DEMO CARA INPUT (FEATURED DEFAULT) */}
      {viewMode === 'demo' && (
        <div className="no-print space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-600 fill-current" /> Interactive Demo & Langkah Input Data
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih salah satu modul di bawah ini untuk melihat panduan visual langkah demi langkah & mencoba simulasi input data.
                </p>
              </div>
            </div>

            {/* Module Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {demoModules.map((m) => {
                const Icon = m.icon;
                const isSelected = demoFormModule === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setDemoFormModule(m.id);
                      setDemoSimulated(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-950 font-bold ring-2 ring-red-500/30 shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                    <span className="text-xs leading-tight">{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE DEMO SIMULATOR CONTAINER */}
          {demoFormModule === 'students' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Demo Cara Input: Data Murid & Impor Massal Excel</h3>
                    <p className="text-xs text-slate-500">Mendaftarkan biodata murid baru, memasukkan NISN, Kelas, Gedung Asrama & Wali Asuh.</p>
                  </div>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('students')}
                    className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
                  >
                    🚀 Buka Form Asli
                  </button>
                )}
              </div>

              {/* Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">Langkah 1</span>
                  <h4 className="font-bold text-slate-900 pt-1">Buka Form Data Murid</h4>
                  <p className="text-slate-600 text-[11px]">Klik menu <strong>Data Murid</strong> di sidebar kiri, lalu klik tombol <strong className="text-red-600">+ Tambah Murid</strong>.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">Langkah 2</span>
                  <h4 className="font-bold text-slate-900 pt-1">Isi Identitas Lengkap</h4>
                  <p className="text-slate-600 text-[11px]">Ketik NISN (10 digit), Nama Lengkap, Kelas (misal X-A), Gedung Asrama & pilih Wali Asuh.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">Langkah 3</span>
                  <h4 className="font-bold text-slate-900 pt-1">Atau Impor File Excel</h4>
                  <p className="text-slate-600 text-[11px]">Gunakan tombol <strong>Impor Excel/CSV</strong> untuk mengunggah puluhan murid sekaligus secara otomatis.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">Langkah 4</span>
                  <h4 className="font-bold text-slate-900 pt-1">Simpan & Sync Cloud</h4>
                  <p className="text-slate-600 text-[11px]">Klik <strong>Simpan Data Murid</strong>. Data tersimpan di browser & otomatis ter-sync ke Google Sheets.</p>
                </div>
              </div>

              {/* Interactive Simulation Sandbox */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" /> Kotak Simulasi Input Live
                  </span>
                  <span className="text-[11px] text-slate-400">Cobalah memasukkan data contoh di bawah</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Nama Lengkap Murid:</label>
                    <input
                      type="text"
                      value={demoSampleName}
                      onChange={(e) => setDemoSampleName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Kelas:</label>
                    <select
                      value={demoSampleClass}
                      onChange={(e) => setDemoSampleClass(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="X-A">Kelas X-A</option>
                      <option value="X-B">Kelas X-B</option>
                      <option value="XI-A">Kelas XI-A</option>
                      <option value="XII-A">Kelas XII-A</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={runDemoSimulation}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Uji Coba Simulasikan Input
                    </button>
                  </div>
                </div>

                {demoSimulated && (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl space-y-2 text-emerald-200 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Hasil Simulasi Input Berhasil!
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Murid <strong>{demoSampleName}</strong> ({demoSampleClass}) telah disimulasikan terdaftar di database asrama. Rekam jejak murid kini aktif & dapat dipantau di seluruh modul!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {demoFormModule === 'checklist' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Demo Cara Input: Ceklist Observasi Pembiasaan Harian</h3>
                    <p className="text-xs text-slate-500">Mencatat jurnal pembiasaan harian (Bangun Pagi, Shalat, Kebersihan Kamar) & Catatan Wali Asuh.</p>
                  </div>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('checklist')}
                    className="hidden md:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
                  >
                    🚀 Buka Form Asli
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">Langkah 1</span>
                  <h4 className="font-bold text-slate-900 pt-1">Pilih Tanggal & Murid</h4>
                  <p className="text-slate-600 text-[11px]">Tentukan tanggal jurnal observasi lalu pilih nama murid dari dropdown.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">Langkah 2</span>
                  <h4 className="font-bold text-slate-900 pt-1">Centang 4 Indikator</h4>
                  <p className="text-slate-600 text-[11px]">Centang aspek Bangun Pagi Tepat Waktu, Shalat Berjamaah, Kebersihan Kamar & Etika Sosial.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">Langkah 3</span>
                  <h4 className="font-bold text-slate-900 pt-1">Catatan Wali Asuh</h4>
                  <p className="text-slate-600 text-[11px]">Tuliskan pesan perkembangan khusus atau catatan bimbingan wali asuh hari itu.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">Langkah 4</span>
                  <h4 className="font-bold text-slate-900 pt-1">Simpan Jurnal</h4>
                  <p className="text-slate-600 text-[11px]">Klik <strong>Simpan Jurnal Observasi</strong>. Jurnal akan masuk ke rekap statistik harian.</p>
                </div>
              </div>

              {/* Simulation */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" /> Kotak Simulasi Observasi Harian
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg cursor-pointer border border-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <span>Bangun Pagi</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg cursor-pointer border border-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <span>Shalat Berjamaah</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg cursor-pointer border border-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <span>Kebersihan Kamar</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg cursor-pointer border border-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <span>Etika Sosial</span>
                  </label>
                </div>
                <button
                  onClick={runDemoSimulation}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Simulasikan Simpan Jurnal
                </button>

                {demoSimulated && (
                  <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-xs text-emerald-200">
                    ✓ Jurnal observasi harian murid disimulasikan tersimpan! Statistik kehadiran & pembiasaan ter-update di Dashboard.
                  </div>
                )}
              </div>
            </div>
          )}

          {demoFormModule === 'violations' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Demo Cara Input: Pelanggaran, Poin & Surat Panggilan PDF</h3>
                    <p className="text-xs text-slate-500">Mencatat kasus pelanggaran kedisiplinan, bobot poin, dan mencetak Surat Panggilan Orang Tua PDF.</p>
                  </div>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('violations')}
                    className="hidden md:inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
                  >
                    🚀 Buka Form Asli
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]">Langkah 1</span>
                  <h4 className="font-bold text-slate-900 pt-1">Pilih Murid & Kategori</h4>
                  <p className="text-slate-600 text-[11px]">Pilih murid, lalu tentukan Kategori Pelanggaran (Ringan, Sedang, atau Berat).</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]">Langkah 2</span>
                  <h4 className="font-bold text-slate-900 pt-1">Masukan Poin & Uraian</h4>
                  <p className="text-slate-600 text-[11px]">Isi bobot poin (misal 20 poin), lokasi kejadian, serta detail kronologi kasus.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]">Langkah 3</span>
                  <h4 className="font-bold text-slate-900 pt-1">Atur Tindakan / Sanksi</h4>
                  <p className="text-slate-600 text-[11px]">Tuliskan sanksi pembinaan yang diberikan oleh Wali Asrama / Guru BK.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]">Langkah 4</span>
                  <h4 className="font-bold text-slate-900 pt-1">Cetak Surat PDF</h4>
                  <p className="text-slate-600 text-[11px]">Klik <strong>Cetak Surat Panggilan</strong> untuk mengunduh dokumen resmi Kop Sekolah.</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" /> Kotak Simulasi Pelanggaran
                  </span>
                </div>
                <button
                  onClick={runDemoSimulation}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Simulasikan Input Pelanggaran (25 Poin)
                </button>

                {demoSimulated && (
                  <div className="p-3.5 bg-rose-950/90 border border-rose-500/50 rounded-xl text-xs text-rose-200">
                    ✓ Kasus pelanggaran disimulasikan tercatat! Akumulasi poin murid menjadi 25 Poin & Surat Panggilan Orang Tua PDF siap diunduh.
                  </div>
                )}
              </div>
            </div>
          )}

          {demoFormModule === 'leaves' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Demo Cara Input: Perizinan Pulang & Surat Izin PDF</h3>
                    <p className="text-xs text-slate-500">Pengajuan izin keluar/pulang asrama, penetapan tanggal kembali, dan cetak Surat Izin Pulang PDF.</p>
                  </div>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('leaves')}
                    className="hidden md:inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
                  >
                    🚀 Buka Form Asli
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded text-[10px]">Langkah 1</span>
                  <h4 className="font-bold text-slate-900 pt-1">Buat Perizinan Baru</h4>
                  <p className="text-slate-600 text-[11px]">Klik <strong>+ Buat Perizinan Baru</strong>, pilih nama murid & alasan izin.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded text-[10px]">Langkah 2</span>
                  <h4 className="font-bold text-slate-900 pt-1">Tanggal Berangkat & Kembali</h4>
                  <p className="text-slate-600 text-[11px]">Atur tanggal keluar asrama & batas wajib tanggal kembali.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded text-[10px]">Langkah 3</span>
                  <h4 className="font-bold text-slate-900 pt-1">Kustomisasi TTD Pengesahan</h4>
                  <p className="text-slate-600 text-[11px]">Isi Nama & NIP Wali Asuh serta Wali Asrama penanggung jawab.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded text-[10px]">Langkah 4</span>
                  <h4 className="font-bold text-slate-900 pt-1">Cetak PDF & Update Status</h4>
                  <p className="text-slate-600 text-[11px]">Unduh Surat Izin PDF. Klik <strong>Sudah Kembali</strong> jika murid tiba di asrama.</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                <button
                  onClick={runDemoSimulation}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Simulasikan Input Perizinan Pulang
                </button>

                {demoSimulated && (
                  <div className="p-3.5 bg-purple-950/90 border border-purple-500/50 rounded-xl text-xs text-purple-200">
                    ✓ Surat Perizinan Pulang PDF disimulasikan terbit! Status perizinan murid bertanda "Izin Aktif di Luar".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTHER DEMO MODULES SHORTCUTS */}
          {['counseling', 'medical', 'reportCard', 'settings'].includes(demoFormModule) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Panduan Demo Input Modul: {demoModules.find(m => m.id === demoFormModule)?.title}
                  </h3>
                  <p className="text-xs text-slate-500">Pelajari cara pengisian form & pengesahan tanda tangan dokumen.</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Setiap form dalam sistem dilengkapi validasi otomatis, pengisian TTD custom (Wali Asuh & Wali Asrama), serta tombol cetak PDF resmi Kop Sekolah.
              </p>

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab(demoModules.find(m => m.id === demoFormModule)?.targetTab || 'dashboard')}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-2"
                >
                  🚀 Buka Modul {demoModules.find(m => m.id === demoFormModule)?.title} Sekarang
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: PRESENTATION SLIDES (PPT INTERACTIVE MODE - SCREEN ONLY) */}
      {viewMode === 'presentation' && (
        <div className="no-print space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {pptSlides[currentSlide].tag}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {pptSlides[currentSlide].title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pptSlides[currentSlide].subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 font-bold transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold font-mono text-slate-600 px-2">
                  {currentSlide + 1} / {pptSlides.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentSlide(prev => Math.min(pptSlides.length - 1, prev + 1))}
                  disabled={currentSlide === pptSlides.length - 1}
                  className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 font-bold transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide Body Container */}
            <div className={`p-6 md:p-8 rounded-2xl bg-gradient-to-br ${pptSlides[currentSlide].color} text-white shadow-xl min-h-[300px] flex flex-col justify-center`}>
              {pptSlides[currentSlide].content}
            </div>

            {/* Thumbnails Navigator */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Daftar Slide Presentasi:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {pptSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border text-xs transition-all max-w-[180px] truncate ${
                      currentSlide === idx
                        ? 'bg-red-600 text-white font-bold border-red-600 shadow-md scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] opacity-80 font-mono">Slide {idx + 1}</span>
                    <span className="truncate block font-semibold">{slide.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: MANUAL DOCUMENTATION */}
      {viewMode === 'manual' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm h-fit">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
              Daftar Modul Panduan:
            </span>
            {sections.map(sec => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    activeSection === sec.id
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {sec.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
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
                      <span><strong>Manajemen Data Murid Terpadu:</strong> Riwayat pelanggaran, perizinan, konseling, dan kesehatan murid tersimpan lengkap dalam satu tempat.</span>
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

            {activeSection === 'students' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" /> Modul Data Murid & Riwayat Terpadu
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengelolaan biodata murid, pendaftaran manual/impor, dan pelacakan riwayat rekam jejak.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-900 text-sm">Langkah Penggunaan & Fitur Data Murid:</h3>
                  <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                    <li><strong>Tambah Murid Baru:</strong> Klik tombol <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">+ Tambah Murid</span>, isi NISN/ID, Nama Lengkap, Kelas, Gedung Asrama, dan Wali Asuh Penanggung Jawab.</li>
                    <li><strong>Impor Massal (Excel / CSV):</strong> Klik tombol <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold inline-flex items-center gap-1"><FileSpreadsheet className="w-3 h-3 inline" /> Impor Excel</span> untuk memasukkan puluhan data murid sekaligus sesuai format kolom.</li>
                    <li><strong>Pencarian & Filter:</strong> Gunakan kotak pencarian untuk mencari nama/NISN murid, atau filter berdasarkan Kelas dan Asrama.</li>
                    <li><strong>Lihat Riwayat Lengkap:</strong> Klik tombol <span className="bg-slate-100 border px-2 py-0.5 rounded text-blue-600 font-bold">Riwayat</span> pada baris murid untuk melihat gabungan rekam medis, izin pulang, poin pelanggaran, dan rekam konseling dalam satu panel modal.</li>
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
