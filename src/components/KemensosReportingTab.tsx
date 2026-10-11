import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Building2,
  Printer,
  ExternalLink,
  Users,
  Camera,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
  Download,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  Award,
  Signature
} from 'lucide-react';
import {
  Student,
  Violation,
  Counseling,
  Leave,
  MedicalRecord,
  AppConfig,
  PrayerAttendance,
  OfficialLetter
} from '../types';
import { generateOfficialLetterPDF } from '../services/letterPdfGenerator';
import { formatDateIndonesian } from '../utils/dateFormatter';

interface KemensosReportingTabProps {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  medicalRecords?: MedicalRecord[];
  prayerAttendance?: PrayerAttendance[];
  config: AppConfig;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onNavigateTab?: (tab: string) => void;
}

export const KemensosReportingTab: React.FC<KemensosReportingTabProps> = ({
  students,
  violations,
  counseling,
  leaves,
  medicalRecords = [],
  prayerAttendance = [],
  config,
  onShowToast,
  onNavigateTab
}) => {
  const [selectedFormat, setSelectedFormat] = useState<
    'laporan_periodik' | 'ba_presensi' | 'ba_insiden' | 'catatan_harian' | 'rujukan_sosial'
  >('laporan_periodik');

  const [reportPeriod, setReportPeriod] = useState<string>('Bulan Oktober 2025');
  const [targetClass, setTargetClass] = useState<string>('Semua Kelas');
  const [targetDorm, setTargetDorm] = useState<string>('Semua Asrama');

  // Signatories
  const [authorName, setAuthorName] = useState<string>(config.waliAsrama || 'Wali Asuh Pendamping');
  const [authorRole, setAuthorRole] = useState<string>('Wali Asuh / Pembina Asrama');
  const [authorId, setAuthorId] = useState<string>('');
  const [caretakerName, setCaretakerName] = useState<string>(config.waliAsrama || 'HISNUL HASHIN, SE');
  const [caretakerNip, setCaretakerNip] = useState<string>(config.waliAsramaNip || '197406262025211027');
  const [headName, setHeadName] = useState<string>(config.kepalaSekolah || 'YUNI ARSI, S.Pd');
  const [headNip, setHeadNip] = useState<string>(config.kepalaSekolahNip || '197206051999032002');

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = targetClass === 'Semua Kelas' || s.class === targetClass;
      const matchDorm = targetDorm === 'Semua Asrama' || s.dorm === targetDorm;
      return matchClass && matchDorm;
    });
  }, [students, targetClass, targetDorm]);

  // Aggregate stats
  const totalStudents = filteredStudents.length;

  const attendanceStats = useMemo(() => {
    const records = prayerAttendance || [];
    let face = 0;
    let qr = 0;
    let rfid = 0;
    let manual = 0;
    let sick = 0;
    let leave = 0;
    let late = 0;
    let alpha = 0;

    records.forEach((r) => {
      if (r.method === 'face' || r.isFaceVerified) face++;
      else if (r.method === 'qr') qr++;
      else if (r.method === 'rfid') rfid++;
      else if (r.status === 'Hadir') manual++;

      if (r.status === 'Sakit') sick++;
      if (r.status === 'Izin') leave++;
      if (r.status === 'Terlambat') late++;
      if (r.status === 'Alpa') alpha++;
    });

    const totalPresent = face + qr + rfid + manual;
    return { face, qr, rfid, manual, sick, leave, late, alpha, totalPresent };
  }, [prayerAttendance]);

  const activeCasesCount = violations.length;
  const counselingSessionsCount = counseling.length;
  const sickCount = medicalRecords.filter((m) => m.isSickLeave || m.status?.includes('Istirahat')).length;

  // Print Laporan Periodik Kemensos RI
  const handlePrintKemensosPeriodicReport = async (action: 'download' | 'print' = 'download') => {
    try {
      setIsExporting(true);
      onShowToast('Memproses Dokumen', 'Menyusun Laporan Resmi Format Kemensos RI & Sekolah Rakyat...', 'warning');

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomCode = Math.floor(100 + Math.random() * 900);

      const officialDoc: OfficialLetter = {
        id: `kemensos-rep-${Date.now()}`,
        letterType: 'laporan_kemensos_periodik',
        letterNumber: `B-${randomCode}/SR.31/KS.01.02/${month}/${year}`,
        letterTitle: 'LAPORAN PERIODIK KEASRAMAAN & PEMBINAAN PESERTA DIDIK',
        letterDate: new Date().toISOString().split('T')[0],
        letterCity: 'Palembang',
        recipientName: 'Kepala Sekolah Rakyat 31 Palembang (Kemensos RI)',
        recipientTitle: 'Kuasa Pengguna Anggaran / Pimpinan Satker',
        recipientOffice: 'Kementerian Sosial Republik Indonesia',
        recipientAddress: 'Palembang',
        authorName: authorName.trim() || 'Wali Asuh Pendamping',
        authorNipOrId: authorId.trim() || undefined,
        authorRole: authorRole.trim() || 'Wali Asuh Asrama',
        kemensosReportPeriod: reportPeriod,
        kemensosLegalBasis:
          '1. Undang-Undang Republik Indonesia Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\n2. Undang-Undang Nomor 14 Tahun 2019 tentang Pekerja Sosial.\n3. Peraturan Menteri Sosial RI tentang Standar Pelayanan Minimal (SPM) Asrama Sekolah Rakyat.\n4. Standar Operasional Prosedur (SOP) Tata Kelola Keasramaan Terpadu Sekolah Rakyat 31 Palembang.',
        kemensosObjectives:
          'Sebagai wujud pertanggungjawaban program pembinaan pengasuhan, rekapitulasi presensi sholat 5 waktu berbasis biometrik AI, pencatatan rekam medis peserta didik, dan evaluasi kepatuhan tata tertib di lingkungan asrama Sekolah Rakyat Kemensos RI.',
        kemensosEvaluation: `Hasil evaluasi menunjukkan mayoritas peserta didik (${totalStudents} santri) aktif mengikuti pembinaan asrama. Tingkat kedisiplinan ibadah sholat berjamaah terpantau sangat baik melalui verifikasi Face Recognition AI (${attendanceStats.face} deteksi) dan QR Scanner (${attendanceStats.qr} tap). Terdapat ${activeCasesCount} catatan pelanggaran tata tertib yang telah ditindaklanjuti melalui ${counselingSessionsCount} sesi konseling bimbingan karakter.`,
        kemensosRecommendations:
          '1. Peningkatan jadwal supervisi piket malam dan apel kedisiplinan oleh Wali Asuh.\n2. Bimbingan konseling berkala & pendampingan psikososial bagi peserta didik berstatus perhatian khusus.\n3. Koordinasi berkala antara Wali Asuh, Guru BK, dan Wali Asrama Mandiri.',
        attendanceDate: new Date().toISOString().split('T')[0],
        attendanceSession: 'Rekapitulasi Periode',
        attendanceTargetClass: targetClass,
        attendanceTargetDorm: targetDorm,
        attendanceTotalStudents: totalStudents,
        attendancePresentCount: attendanceStats.totalPresent,
        attendanceFaceCount: attendanceStats.face,
        attendanceQrCount: attendanceStats.qr,
        attendanceRfidCount: attendanceStats.rfid,
        attendanceManualCount: attendanceStats.manual,
        attendanceSickCount: sickCount,
        attendanceLeaveCount: leaves.length,
        attendanceLateCount: attendanceStats.late,
        attendanceAlphaCount: attendanceStats.alpha,
        subject: `Laporan Periodik Keasramaan & Pembinaan Peserta Didik (${reportPeriod})`,
        enclosure: '1 (Satu) Berkas Rekapitulasi Terpadu',
        bodyIntro:
          'Sebagai bentuk akuntabilitas pembinaan pengasuhan, kedisiplinan ibadah santri, dan tata kelola keasramaan sesuai Standar Operasional Prosedur Kementerian Sosial RI, bersama ini kami sampaikan Laporan Periodik Keasramaan:',
        bodyMain: `Seluruh kegiatan pembinaan karakter, pendampingan ibadah sholat 5 waktu berjamaah dengan verifikasi biometrik wajah AI, apel harian, dan pemantauan kebersihan kamar berlangsung tertib dan terkendali sesuai ketentuan SPM Kemensos RI. Dari total ${totalStudents} peserta didik di ${targetClass} / ${targetDorm}, tercatat ${attendanceStats.totalPresent} kehadiran sholat berjamaah, ${sickCount} catatan izin sakit UKS, dan ${leaves.length} izin keluar resmi.`,
        bodyClosing:
          'Demikian Laporan Periodik Keasramaan ini kami sampaikan dengan sebenarnya sebagai bahan evaluasi dan perumusan kebijakan pembinaan keasramaan Sekolah Rakyat Kementerian Sosial RI.',
        signatureAuthorLabel: 'Pembuat Laporan / Wali Asuh,',
        acknowledgementName: caretakerName.trim() || 'HISNUL HASHIN, SE',
        acknowledgementNip: caretakerNip.trim() || '197406262025211027',
        acknowledgementTitle: 'Wali Asrama Mandiri,',
        approvalName: headName.trim() || 'YUNI ARSI, S.Pd',
        approvalNip: headNip.trim() || '197206051999032002',
        approvalTitle: 'Kepala Sekolah Rakyat 31 (Kemensos RI),',
        createdAt: new Date().toISOString()
      };

      await generateOfficialLetterPDF(officialDoc, config, action);
      onShowToast('Laporan Siap', 'Laporan Keasramaan Format Resmi Kemensos RI berhasil dibuat.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Export', 'Terjadi kesalahan saat memproses laporan PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Print Berita Acara Presensi Kemensos
  const handlePrintKemensosAttendanceBA = async (action: 'download' | 'print' = 'download') => {
    try {
      setIsExporting(true);
      onShowToast('Memproses Berita Acara', 'Menyusun Berita Acara Presensi Face Recognition Kemensos RI...', 'warning');

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomCode = Math.floor(100 + Math.random() * 900);

      const officialDoc: OfficialLetter = {
        id: `kemensos-ba-${Date.now()}`,
        letterType: 'berita_acara_presensi',
        letterNumber: `BA-${randomCode}/SR.31/ABS/${month}/${year}`,
        letterTitle: 'BERITA ACARA PENCATATAN PRESENSI KEHADIRAN (FACE AI & ASRAMA)',
        letterDate: new Date().toISOString().split('T')[0],
        letterCity: 'Palembang',
        recipientName: 'Wali Asrama Mandiri & Kepala Sekolah Rakyat',
        recipientTitle: 'Pimpinan Satuan Pendidikan & Pengasuhan',
        recipientOffice: 'Sekolah Rakyat 31 Palembang (Kemensos RI)',
        recipientAddress: 'di Tempat',
        authorName: authorName.trim() || 'Wali Asuh Pendamping',
        authorRole: authorRole.trim() || 'Pembina Presensi Asrama',
        authorNipOrId: authorId.trim() || undefined,
        attendanceDate: new Date().toISOString().split('T')[0],
        attendanceSession: 'Sholat Berjamaah & Asrama',
        attendanceTargetClass: targetClass,
        attendanceTargetDorm: targetDorm,
        attendanceTotalStudents: totalStudents,
        attendancePresentCount: attendanceStats.totalPresent,
        attendanceFaceCount: attendanceStats.face,
        attendanceQrCount: attendanceStats.qr,
        attendanceRfidCount: attendanceStats.rfid,
        attendanceManualCount: attendanceStats.manual,
        attendanceSickCount: sickCount,
        attendanceLeaveCount: leaves.length,
        attendanceLateCount: attendanceStats.late,
        attendanceAlphaCount: attendanceStats.alpha,
        attendanceNotes:
          'Presensi berlangsung tertib dengan verifikasi Biometrik AI Face Recognition, Barcode QR Code, dan RFID Card sesuai SOP Keasramaan Kemensos RI.',
        followUpActions:
          '1. Pembinaan bagi santri alpa oleh Wali Asuh.\n2. Koordinasi dengan tim UKS bagi santri yang berstatus sakit.\n3. Evaluasi kedisiplinan pada apel malam asrama.',
        subject: 'Berita Acara Rekapitulasi Presensi Kehadiran Santri Terpadu',
        enclosure: '1 (Satu) Berkas Lembar Presensi',
        bodyIntro:
          'Pada hari ini telah dilaksanakan pencatatan presensi kehadiran santri menggunakan Sistem Presensi Terintegrasi Face Recognition Biometrik AI, Kartu QR Code, dan WebSerial RFID di Lingkungan Asrama Sekolah Rakyat 31 Palembang:',
        signatureAuthorLabel: 'Pembuat Berita Acara / Pembina,',
        acknowledgementName: caretakerName.trim() || 'HISNUL HASHIN, SE',
        acknowledgementNip: caretakerNip.trim() || '197406262025211027',
        acknowledgementTitle: 'Wali Asrama Mandiri,',
        approvalName: headName.trim() || 'YUNI ARSI, S.Pd',
        approvalNip: headNip.trim() || '197206051999032002',
        approvalTitle: 'Kepala Sekolah Rakyat 31,',
        createdAt: new Date().toISOString()
      };

      await generateOfficialLetterPDF(officialDoc, config, action);
      onShowToast('Berita Acara Siap', 'Dokumen Berita Acara Presensi berhasil diekspor.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Export', 'Terjadi kesalahan saat memproses Berita Acara.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Kemensos RI */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-red-800/40">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-800/80 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider text-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Standar Kementerian Sosial Republik Indonesia
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 text-amber-400" />
              Format Pencatatan & Pelaporan Keasramaan Sekolah Rakyat
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              Pusat instrumen administrasi dan pelaporan berkala berlandaskan <strong>Undang-Undang No. 11 Tahun 2009 tentang Kesejahteraan Sosial</strong>, UU No. 14 Tahun 2019 tentang Pekerja Sosial, serta Standar Operasional Prosedur (SOP) Tata Naskah Dinas Kementerian Sosial RI & Sekolah Rakyat Terpadu 31 Palembang.
            </p>
          </div>

          {/* Quick Action Button to Letter Generator */}
          {onNavigateTab && (
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('letter-generator');
                  onShowToast('Membuka Generator Surat', 'Beralih ke Generator Surat Resmi untuk mengedit dokumen Kemensos...', 'info');
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Buka Generator Surat Resmi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Indicator Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Santri Terbina</p>
            <p className="text-lg font-black text-slate-900">{totalStudents} <span className="text-xs font-normal text-slate-500">Santri</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Verif Presensi Sholat</p>
            <p className="text-lg font-black text-emerald-900">{attendanceStats.totalPresent} <span className="text-xs font-normal text-slate-500">Hadir</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Pelanggaran & Disiplin</p>
            <p className="text-lg font-black text-amber-900">{activeCasesCount} <span className="text-xs font-normal text-slate-500">Kasus</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Rekam Medis UKS</p>
            <p className="text-lg font-black text-blue-900">{sickCount} <span className="text-xs font-normal text-slate-500">Izin Sakit</span></p>
          </div>
        </div>
      </div>

      {/* Format Selector Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          {
            id: 'laporan_periodik' as const,
            label: '1. Laporan Periodik Keasramaan Kemensos',
            icon: FileSpreadsheet,
            badge: '5 Bab Standar'
          },
          {
            id: 'ba_presensi' as const,
            label: '2. Berita Acara Presensi Face AI',
            icon: Camera,
            badge: 'Biometrik'
          },
          {
            id: 'ba_insiden' as const,
            label: '3. Berita Acara Penanganan Insiden',
            icon: ShieldAlert,
            badge: 'SOP Kasus'
          },
          {
            id: 'catatan_harian' as const,
            label: '4. Buku Catatan Harian & Mutasi Perilaku',
            icon: BookOpen,
            badge: 'Anecdotal'
          },
          {
            id: 'rujukan_sosial' as const,
            label: '5. Format Rujukan Kesejahteraan Sosial',
            icon: FileCheck,
            badge: 'Sentra Balai'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedFormat === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFormat(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                  isSelected ? 'bg-red-800 text-amber-200' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {selectedFormat === 'laporan_periodik' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">
                  Format Standar Kemensos RI
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode Klasifikasi: KS.01.02</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Laporan Periodik Keasramaan & Pembinaan Peserta Didik
              </h2>
              <p className="text-xs text-slate-500">
                Laporan resmi terpadu yang memuat Dasar Hukum, Maksud & Tujuan, Data Statistik Kehadiran, Rekam Konseling & Medis, serta Pengesahan 3 Pejabat.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handlePrintKemensosPeriodicReport('print')}
                disabled={isExporting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintKemensosPeriodicReport('download')}
                disabled={isExporting}
                className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isExporting ? 'Memproses...' : 'Unduh PDF Format Kemensos'}</span>
              </button>
            </div>
          </div>

          {/* Filter & Signatories Setting */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Signature className="w-4 h-4 text-red-600" />
              Parameter Laporan & Pejabat Penandatangan (SOP Kemensos RI)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Periode Laporan:</label>
                <input
                  type="text"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                  placeholder="e.g. Bulan Oktober 2025"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Kelas:</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Asrama:</label>
                <select
                  value={targetDorm}
                  onChange={(e) => setTargetDorm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Semua Asrama">Semua Asrama</option>
                  <option value="Asrama Putra">Asrama Putra</option>
                  <option value="Asrama Putri">Asrama Putri</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200">
              <div>
                <label className="block text-slate-600 font-bold mb-1">1. Wali Asuh (Pembuat):</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-bold"
                  placeholder="Nama Wali Asuh"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">2. Wali Asrama Mandiri (Mengetahui):</label>
                <input
                  type="text"
                  value={caretakerName}
                  onChange={(e) => setCaretakerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-bold"
                  placeholder="Nama Wali Asrama"
                />
                <input
                  type="text"
                  value={caretakerNip}
                  onChange={(e) => setCaretakerNip(e.target.value)}
                  className="w-full px-2.5 py-1 rounded border border-slate-300 bg-white mt-1 text-[11px]"
                  placeholder="NIP Wali Asrama"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">3. Kepala Sekolah (Menyetujui):</label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-bold"
                  placeholder="Nama Kepala Sekolah"
                />
                <input
                  type="text"
                  value={headNip}
                  onChange={(e) => setHeadNip(e.target.value)}
                  className="w-full px-2.5 py-1 rounded border border-slate-300 bg-white mt-1 text-[11px]"
                  placeholder="NIP Kepala Sekolah"
                />
              </div>
            </div>
          </div>

          {/* Structure Preview of 5 Chapters */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="p-3 bg-red-50/60 flex items-center justify-between">
              <span className="font-bold text-red-950">I. DASAR PELAKSANAAN & LANDASAN HUKUM KEMENSOS RI</span>
              <span className="text-[10px] text-red-700 font-mono">UU 11/2009 & Permensos RI</span>
            </div>
            <div className="p-3 bg-white text-slate-700 leading-relaxed pl-5">
              • UU RI No. 11 Tahun 2009 tentang Kesejahteraan Sosial<br />
              • UU RI No. 14 Tahun 2019 tentang Pekerja Sosial<br />
              • Peraturan Menteri Sosial RI tentang Standar Pelayanan Minimal (SPM) Asrama Sekolah Rakyat<br />
              • SOP Tata Kelola & Disiplin Keasramaan Terpadu Sekolah Rakyat 31 Palembang
            </div>

            <div className="p-3 bg-red-50/60 flex items-center justify-between">
              <span className="font-bold text-red-950">II. MAKSUD DAN TUJUAN</span>
              <span className="text-[10px] text-red-700 font-mono">Akuntabilitas Satker</span>
            </div>
            <div className="p-3 bg-white text-slate-700 leading-relaxed pl-5">
              Laporan ini disusun sebagai bentuk akuntabilitas kinerja pembinaan pengasuhan, pemantauan kepatuhan ibadah sholat berjamaah berbasis teknologi Face Recognition Biometrik AI, rekam kesehatan UKS, dan laporan dinamika psikososial peserta didik Sekolah Rakyat di lingkungan Kemensos RI.
            </div>

            <div className="p-3 bg-red-50/60 flex items-center justify-between">
              <span className="font-bold text-red-950">III. REKAPITULASI PELAKSANAAN & DATA STATISTIK KEASRAMAAN</span>
              <span className="text-[10px] text-red-700 font-mono">Tabel Agregat Riil</span>
            </div>
            <div className="p-3 bg-white text-slate-700 leading-relaxed pl-5 overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-200 p-1.5 text-left">Indikator Kinerja Keasramaan</th>
                    <th className="border border-slate-200 p-1.5 text-center w-28">Jumlah / Angka</th>
                    <th className="border border-slate-200 p-1.5 text-left">Keterangan Verifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-1.5 font-bold">Total Peserta Didik Terdaftar</td>
                    <td className="border border-slate-200 p-1.5 text-center font-mono font-bold">{totalStudents}</td>
                    <td className="border border-slate-200 p-1.5 text-slate-500">Database Siswa Sekolah Rakyat</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-1.5 font-bold text-emerald-800">Kehadiran Sholat Berjamaah</td>
                    <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-emerald-800">{attendanceStats.totalPresent}</td>
                    <td className="border border-slate-200 p-1.5 text-slate-500">
                      Face AI ({attendanceStats.face}), QR ({attendanceStats.qr}), RFID ({attendanceStats.rfid})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-1.5 font-bold text-rose-800">Alpa / Ketidakhadiran Sholat</td>
                    <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-rose-800">{attendanceStats.alpha}</td>
                    <td className="border border-slate-200 p-1.5 text-slate-500">Rekap Presensi Harian Asrama</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-1.5 font-bold text-blue-800">Peserta Didik Izin Sakit UKS</td>
                    <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-blue-800">{sickCount}</td>
                    <td className="border border-slate-200 p-1.5 text-slate-500">Buku Rekam Medis Klinik UKS</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-1.5 font-bold text-purple-800">Sesi Pendampingan Konseling BK</td>
                    <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-purple-800">{counselingSessionsCount}</td>
                    <td className="border border-slate-200 p-1.5 text-slate-500">Jurnal Bimbingan & Konseling</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-red-50/60 flex items-center justify-between">
              <span className="font-bold text-red-950">IV. EVALUASI, KENDALA LAPANGAN & TINDAK LANJUT</span>
              <span className="text-[10px] text-red-700 font-mono">SOP Restoratif</span>
            </div>
            <div className="p-3 bg-white text-slate-700 leading-relaxed pl-5">
              Pemantauan konsistensi bangun sholat subuh, peningkatan sarana wudhu, dan apresiasi sertifikat santri teladan kedisiplinan ibadah.
            </div>

            <div className="p-3 bg-red-50/60 flex items-center justify-between">
              <span className="font-bold text-red-950">V. PENGESAHAN DOKUMEN BERJENJANG KEMENSOS RI</span>
              <span className="text-[10px] text-red-700 font-mono">Triple Signatory</span>
            </div>
            <div className="p-3 bg-white text-slate-700 leading-relaxed pl-5 flex items-center justify-around text-center py-4">
              <div>
                <p className="font-bold text-slate-900">{caretakerName || 'HISNUL HASHIN, SE'}</p>
                <p className="text-[10px] text-slate-500">Wali Asrama Mandiri (NIP: {caretakerNip || '-'})</p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <p className="font-bold text-slate-900">{authorName || 'Wali Asuh Pendamping'}</p>
                <p className="text-[10px] text-slate-500">Wali Asuh / Pembina Asrama</p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <p className="font-bold text-slate-900">{headName || 'YUNI ARSI, S.Pd'}</p>
                <p className="text-[10px] text-slate-500">Kepala Sekolah Rakyat 31 (NIP: {headNip || '-'})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'ba_presensi' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Face Recognition AI & Digital
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode Klasifikasi: ABS.01</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Berita Acara Rekonsiliasi & Pencatatan Presensi Sholat Kemensos RI
              </h2>
              <p className="text-xs text-slate-500">
                Dokumen yuridis administratif pembuktian kehadiran ibadah sholat 5 waktu dan kegiatan asrama santri melalui Biometrik Wajah AI.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintKemensosAttendanceBA('print')}
                disabled={isExporting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintKemensosAttendanceBA('download')}
                disabled={isExporting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>{isExporting ? 'Memproses...' : 'Unduh Berita Acara PDF'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Rekap Hasil Audit Biometrik Face Recognition AI
              </h4>
              <p className="text-slate-600">
                Pencatatan presensi terverifikasi melalui kamera live stream AI dengan face descriptor 128-dimensi Euclidean distance, kartu QR Code berenkripsi ID santri, serta WebSerial RFID reader.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Face AI</span>
                  <span className="font-black text-slate-900 text-sm">{attendanceStats.face}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">QR Code</span>
                  <span className="font-black text-slate-900 text-sm">{attendanceStats.qr}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Manual/Dispensasi</span>
                  <span className="font-black text-slate-900 text-sm">{attendanceStats.manual}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Klausul Sah Berita Acara Presensi Kemensos RI
              </h4>
              <p className="text-slate-600 leading-relaxed">
                "Pada hari ini telah dilaksanakan pencatatan presensi kehadiran santri menggunakan Sistem Presensi Terintegrasi Face Recognition Biometrik AI di Lingkungan Asrama Sekolah Rakyat 31 Palembang..."
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Pengesahan: Wali Asrama Mandiri ({caretakerName || 'HISNUL HASHIN, SE'}) & Pembina Presensi ({authorName}).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'ba_insiden' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                  SOP Penanganan Kasus Kemensos
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode Klasifikasi: PS.02.01</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Format Berita Acara Penanganan Insiden / Kasus Khusus Keasramaan
              </h2>
              <p className="text-xs text-slate-500">
                Instrumen resmi pelaporan kronologi kejadian, intervensi pekerja sosial/wali asuh, serta komitmen restorative justice peserta didik.
              </p>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('letter-generator');
                  onShowToast('Membuka Generator Surat', 'Beralih ke format Berita Acara Insiden Kemensos RI...', 'info');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buat Berita Acara Insiden di Generator Surat</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-3">
            <h4 className="font-bold text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Ketentuan SOP Penanganan Insiden di Asrama Sekolah Rakyat Kemensos RI
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div className="bg-white p-3 rounded-lg border border-amber-200">
                <p className="font-bold text-slate-900 mb-1">1. Tahap Klarifikasi Fakta</p>
                <p className="text-[11px] text-slate-600">Wawancara terpisah para pihak, pencatatan saksi mata, dan pemeriksaan dokumentasi CCTV / piket.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200">
                <p className="font-bold text-slate-900 mb-1">2. Intervensi Psikososial</p>
                <p className="text-[11px] text-slate-600">Pendampingan oleh Wali Asuh & Pekerja Sosial, tanpa kekerasan fisik, mengedepankan pembinaan edukatif.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200">
                <p className="font-bold text-slate-900 mb-1">3. Pengesahan Berita Acara</p>
                <p className="text-[11px] text-slate-600">Penandatanganan berita acara oleh siswa, saksi, wali asuh, dan pelaporan kepada Wali Asrama Mandiri.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'catatan_harian' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase">
                  Buku Catatan Wali Asuh
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode Klasifikasi: BK.01</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Formulir Buku Catatan Harian & Anecdotal Record Perkembangan Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Format standar pencatatan harian observasi perilaku, kemandirian kebersihan asrama, kepatuhan sholat, dan hubungan sosial peserta didik.
              </p>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('connecting-journal');
                  onShowToast('Membuka Jurnal Penghubung', 'Beralih ke Jurnal Penghubung & Task Order Sekolah Rakyat...', 'info');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Buka Jurnal Penghubung Materi</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800">Komponen Utama Format Buku Catatan Harian Wali Asuh:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-red-900 block mb-1">A. Dimensi Ibadah & Moral</span>
                <p className="text-[11px] text-slate-600">Ketepatan waktu sholat 5 waktu berjamaah, tilawah Al-Qur'an, adab makan, dan akhlak kepada pembina.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-blue-900 block mb-1">B. Kemandirian & Kerapian</span>
                <p className="text-[11px] text-slate-600">Merapikan tempat tidur, mencuci pakaian, piket kebersihan kamar, dan pemeliharaan inventaris BMN.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block mb-1">C. Hubungan Sosial</span>
                <p className="text-[11px] text-slate-600">Toleransi sesama teman sekamar, empati, keaktifan gotong royong (ro'an), dan penyelesaian konflik.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-purple-900 block mb-1">D. Kebugaran & Kesehatan</span>
                <p className="text-[11px] text-slate-600">Pola istirahat tidur malam, olahraga pagi, keluhan kesehatan fisik, dan kunjungan ke klinik UKS.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'rujukan_sosial' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                  Layanan Rujukan Sentra Kemensos
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode Klasifikasi: RUJ.01</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Format Lembar Disposisi & Surat Rujukan Layanan Kesejahteraan Sosial
              </h2>
              <p className="text-xs text-slate-500">
                Format rujukan peserta didik yang membutuhkan layanan rehabilitasi sosial tingkat lanjut, terapi psikologis klinis, atau bantuan atensi khusus Kementerian Sosial RI.
              </p>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('letter-generator');
                  onShowToast('Membuka Generator Surat', 'Beralih ke Surat Rujukan Medis/Psikologis...', 'info');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buat Pengantar Rujukan di Generator Surat</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-3">
            <h4 className="font-bold text-purple-950">Alur Standar Alih Tangan Kasus & Rujukan Sentra Balai Kemensos RI:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <p className="font-bold text-slate-900 mb-1">1. Asesmen Komprehensif</p>
                <p className="text-[11px] text-slate-600">Pemeriksaan psikologis oleh Guru BK / Psikolog dan rekam medis klinik asrama.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <p className="font-bold text-slate-900 mb-1">2. Disposisi Wali Asrama & Pimpinan</p>
                <p className="text-[11px] text-slate-600">Persetujuan tertulis Kepala Sekolah Rakyat dan koordinasi orang tua/wali siswa.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <p className="font-bold text-slate-900 mb-1">3. Penerbitan Surat Pengantar</p>
                <p className="text-[11px] text-slate-600">Surat pengantar dinas Kemensos RI ditujukan ke Sentra Budi Perkasa / RSUD rujukan.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
