import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  MailWarning,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  FileSignature,
  CheckCircle2
} from 'lucide-react';
import { Student, Violation, AppConfig, ParentSummonsOptions } from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';
import { generateParentSummonsPDF } from '../services/pdfGenerator';

interface ParentSummonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  violations: Violation[];
  config: AppConfig;
  selectedViolation?: Violation | null;
  selectedStudentId?: string;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ParentSummonsModal: React.FC<ParentSummonsModalProps> = ({
  isOpen,
  onClose,
  students,
  violations,
  config,
  selectedViolation,
  selectedStudentId,
  onShowToast
}) => {
  // Target violation & student selection
  const [activeViolationId, setActiveViolationId] = useState<string>('');
  const [activeStudentId, setActiveStudentId] = useState<string>('');

  // Form Fields
  const [summonsLevel, setSummonsLevel] = useState<string>('Panggilan I (SP-1)');
  const [letterNumber, setLetterNumber] = useState<string>('');
  
  // Default meeting date: tomorrow
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [meetingDate, setMeetingDate] = useState<string>(getTomorrowDateString());
  const [meetingTime, setMeetingTime] = useState<string>('09.00 WIB s.d. Selesai');
  const [meetingPlace, setMeetingPlace] = useState<string>('Ruang Bimbingan & Konseling (BK) / Kantor Pengelola Asrama');
  const [meetingWith, setMeetingWith] = useState<string>('Tim Disiplin Keasramaan, Guru BK, & Wali Asrama Mandiri');
  const [agenda, setAgenda] = useState<string>('Pembahasan Pelanggaran Tata Tertib & Bimbingan Khusus Peserta Didik');
  const [specialNotes, setSpecialNotes] = useState<string>('Mohon membawa surat panggilan ini dan hadir tepat waktu tanpa diwakilkan.');
  const [parentName, setParentName] = useState<string>('');
  const [includeViolationHistory, setIncludeViolationHistory] = useState<boolean>(true);

  // Signatories
  const [signatoryTitle, setSignatoryTitle] = useState<string>(config.waliAsramaTitle || 'Wali Asrama Mandiri,');
  const [signatoryName, setSignatoryName] = useState<string>(config.waliAsrama || 'Wali Asrama Mandiri');
  const [signatoryNip, setSignatoryNip] = useState<string>(config.waliAsramaNip || '');
  const [headTitle, setHeadTitle] = useState<string>('Kepala Sekolah Rakyat,');
  const [headName, setHeadName] = useState<string>(config.kepalaSekolah || 'Kepala Sekolah');
  const [headNip, setHeadNip] = useState<string>(config.kepalaSekolahNip || '');

  // Initialize or reset when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const curMonthRoman = romanMonths[new Date().getMonth()] || 'VIII';
      const curYear = new Date().getFullYear();

      if (selectedViolation) {
        setActiveViolationId(selectedViolation.id);
        setActiveStudentId(selectedViolation.studentId);
        const s = students.find((st) => String(st.id) === String(selectedViolation.studentId));
        setParentName(s?.parentName || 'Bapak / Ibu Orang Tua / Wali Siswa');
        const code = selectedViolation.id.replace(/[^0-9]/g, '').slice(-3) || '101';
        setLetterNumber(`0${code}/SRT31-ASR/SP-ORTU/${curMonthRoman}/${curYear}`);

        // Set level based on violation level
        if (selectedViolation.level >= 4) {
          setSummonsLevel('Panggilan III (SP-3 / Sidang Disiplin)');
        } else if (selectedViolation.level === 3) {
          setSummonsLevel('Panggilan II (SP-2)');
        } else {
          setSummonsLevel('Panggilan I (SP-1)');
        }
      } else if (selectedStudentId) {
        setActiveStudentId(selectedStudentId);
        const studentV = violations.filter((v) => String(v.studentId) === String(selectedStudentId));
        if (studentV.length > 0) {
          setActiveViolationId(studentV[0].id);
        } else if (violations.length > 0) {
          setActiveViolationId(violations[0].id);
        }
        const s = students.find((st) => String(st.id) === String(selectedStudentId));
        setParentName(s?.parentName || 'Bapak / Ibu Orang Tua / Wali Siswa');
        setLetterNumber(`012/SRT31-ASR/SP-ORTU/${curMonthRoman}/${curYear}`);
      } else if (violations.length > 0) {
        setActiveViolationId(violations[0].id);
        setActiveStudentId(violations[0].studentId);
        const s = students.find((st) => String(st.id) === String(violations[0].studentId));
        setParentName(s?.parentName || 'Bapak / Ibu Orang Tua / Wali Siswa');
        setLetterNumber(`001/SRT31-ASR/SP-ORTU/${curMonthRoman}/${curYear}`);
      }

      setMeetingDate(getTomorrowDateString());
      setSignatoryTitle(config.waliAsramaTitle || 'Wali Asrama Mandiri,');
      setSignatoryName(config.waliAsrama || 'Wali Asrama Mandiri');
      setSignatoryNip(config.waliAsramaNip || '');
      setHeadTitle('Kepala Sekolah Rakyat,');
      setHeadName(config.kepalaSekolah || 'Kepala Sekolah');
      setHeadNip(config.kepalaSekolahNip || '');
    }
  }, [isOpen, selectedViolation, selectedStudentId, violations, students, config]);

  // Active student and violation objects
  const currentViolation = violations.find((v) => v.id === activeViolationId) || selectedViolation || violations[0];
  const currentStudent = students.find(
    (s) => String(s.id) === String(currentViolation?.studentId || activeStudentId)
  );

  // Student's full violation history
  const studentAllViolations = currentStudent
    ? violations.filter(
        (v) =>
          String(v.studentId).trim().toLowerCase() === String(currentStudent.id).trim().toLowerCase() ||
          String(v.studentName).trim().toLowerCase() === String(currentStudent.name).trim().toLowerCase()
      )
    : [];

  const handleStudentChange = (stId: string) => {
    setActiveStudentId(stId);
    const s = students.find((item) => String(item.id) === String(stId));
    if (s?.parentName) setParentName(s.parentName);
    const studentV = violations.filter((v) => String(v.studentId) === String(stId));
    if (studentV.length > 0) {
      setActiveViolationId(studentV[0].id);
    }
  };

  const handleViolationChange = (vId: string) => {
    setActiveViolationId(vId);
    const v = violations.find((item) => item.id === vId);
    if (v) {
      setActiveStudentId(v.studentId);
      const s = students.find((item) => String(item.id) === String(v.studentId));
      if (s?.parentName) setParentName(s.parentName);
    }
  };

  const handleGeneratePDF = async () => {
    if (!currentViolation) {
      onShowToast('Data Kosong', 'Silakan pilih catatan pelanggaran yang akan dibuatkan surat panggilan.', 'warning');
      return;
    }

    const options: ParentSummonsOptions = {
      letterNumber,
      summonsLevel,
      meetingDate,
      meetingTime,
      meetingPlace,
      meetingWith,
      agenda,
      specialNotes,
      parentName,
      signatoryTitle,
      signatoryName,
      signatoryNip,
      headTitle,
      headName,
      headNip,
      includeViolationHistory
    };

    onShowToast('Menyiapkan Dokumen', `Membuat Surat Panggilan Orang Tua untuk ${currentViolation.studentName}...`, 'warning');
    await generateParentSummonsPDF(currentViolation, currentStudent, config, options, studentAllViolations);
    onShowToast('Berhasil Diunduh', `Surat Panggilan Orang Tua untuk ${currentViolation.studentName} siap dicetak.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <MailWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Generator Surat Panggilan Orang Tua
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  Kertas Legal • Multipage
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format resmi Legal (8.5 x 14 in) dengan pemecahan otomatis ke halaman berikutnya (*multipage/auto-flow*) jika teks panjang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Target Student & Violation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-red-600" /> Target Siswa & Laporan Pelanggaran
              </span>
              {currentViolation && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                  Tingkat {currentViolation.level}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pilih Peserta Didik
                </label>
                <select
                  value={activeStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.dorm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kasus Pelanggaran Terkait
                </label>
                <select
                  value={activeViolationId}
                  onChange={(e) => handleViolationChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {studentAllViolations.length > 0 ? (
                    studentAllViolations.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.date}] Tk.{v.level}: {v.violation}
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada riwayat pelanggaran tercatat</option>
                  )}
                </select>
              </div>
            </div>

            {currentViolation && (
              <div className="p-2.5 bg-red-50/70 border border-red-100 rounded-lg text-slate-700 text-xs space-y-1">
                <div className="font-bold text-red-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Pelanggaran: {currentViolation.violation}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Tanggal: <strong className="text-slate-800">{formatDateIndonesian(currentViolation.date, true)}</strong> | Sanksi: <span className="italic">{currentViolation.sanction || 'Dalam Pembinaan'}</span>
                </div>
                {currentViolation.note && (
                  <div className="text-[10px] text-slate-500 italic">
                    Catatan: "{currentViolation.note}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Letter Level & Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Jenis / Tingkat Surat Panggilan
              </label>
              <select
                value={summonsLevel}
                onChange={(e) => setSummonsLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="Panggilan I (SP-1)">Panggilan I (SP-1) - Kasus Ringan/Sedang</option>
                <option value="Panggilan II (SP-2)">Panggilan II (SP-2) - Kasus Berulang/Berat</option>
                <option value="Panggilan III (SP-3 / Sidang Disiplin)">Panggilan III (SP-3) - Sidang Disiplin Pleno</option>
                <option value="Panggilan Khusus / Klarifikasi Kasus">Panggilan Khusus / Klarifikasi Kasus Mendadak</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nomor Surat Resmi
              </label>
              <input
                type="text"
                value={letterNumber}
                onChange={(e) => setLetterNumber(e.target.value)}
                placeholder="e.g. 042/SRT31-ASR/SP-ORTU/VIII/2026"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Parent Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tujukan Kepada (Nama Orang Tua / Wali Siswa)
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Bapak Hendra & Ibu / Orang Tua Siswa"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Schedule Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-600" /> Waktu & Tempat Pertemuan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hari & Tanggal Menghadap
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pukul / Waktu
                </label>
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="e.g. 09.00 WIB s.d. Selesai"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['08.30 WIB', '09.00 WIB', '10.00 WIB', '13.30 WIB', '14.00 WIB'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMeetingTime(`${t} s.d. Selesai`)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tempat / Ruangan
              </label>
              <input
                type="text"
                value={meetingPlace}
                onChange={(e) => setMeetingPlace(e.target.value)}
                placeholder="e.g. Ruang Bimbingan & Konseling (BK) / Kantor Pengelola Asrama"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[
                  'Ruang Bimbingan & Konseling (BK)',
                  'Kantor Wali Asrama Mandiri',
                  'Ruang Kepala Sekolah & Sidang Disiplin'
                ].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMeetingPlace(p)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Menghadap Kepada
                </label>
                <input
                  type="text"
                  value={meetingWith}
                  onChange={(e) => setMeetingWith(e.target.value)}
                  placeholder="e.g. Tim Disiplin Keasramaan & Guru BK"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Agenda / Pokok Bahasan
                </label>
                <input
                  type="text"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="e.g. Pembahasan Pelanggaran & Tindak Lanjut Disiplin"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Instruksi / Catatan Khusus untuk Orang Tua
            </label>
            <textarea
              rows={2}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Mohon hadir tepat waktu tanpa diwakilkan demi kelangsungan pendidikan ananda."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* History Appendix Toggle */}
          <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <input
              type="checkbox"
              id="includeHistory"
              checked={includeViolationHistory}
              onChange={(e) => setIncludeViolationHistory(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="includeHistory" className="text-xs text-amber-950 font-medium cursor-pointer">
              Sertakan Lampiran Rekap Riwayat Seluruh Pelanggaran Siswa (Halaman 2 jika ada lebih dari 1 kasus)
            </label>
          </div>

          {/* Signatories Section */}
          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-bold text-xs text-slate-800 mb-2.5">
              Pengesahan / Pejabat Penandatangan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 text-[11px]">Pengelola / Tim Disiplin</span>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Nama Penandatangan"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={signatoryNip}
                  onChange={(e) => setSignatoryNip(e.target.value)}
                  placeholder="NIP / NIK"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 text-[11px]">Kepala Sekolah</span>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  placeholder="Nama Kepala Sekolah"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={headNip}
                  onChange={(e) => setHeadNip(e.target.value)}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak & Unduh Surat Panggilan (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
