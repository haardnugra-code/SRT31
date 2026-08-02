import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Sliders,
  FileSpreadsheet,
  Signature,
  Image as ImageIcon,
  Server,
  Save,
  Link as LinkIcon,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsTabProps {
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
  onShowToast
}) => {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockPin, setUnlockPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Form State
  const [kopKiri, setKopKiri] = useState<string>(config.kopKiri);
  const [kopKanan, setKopKanan] = useState<string>(config.kopKanan);
  const [kepalaSekolah, setKepalaSekolah] = useState<string>(config.kepalaSekolah);
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState<string>(config.kepalaSekolahNip);
  const [waliAsrama, setWaliAsrama] = useState<string>(config.waliAsrama);
  const [waliAsramaNip, setWaliAsramaNip] = useState<string>(config.waliAsramaNip);
  const [logoKiriUrl, setLogoKiriUrl] = useState<string>(config.logoKiriUrl);
  const [logoKananUrl, setLogoKananUrl] = useState<string>(config.logoKananUrl);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(config.watermarkOpacity);
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(config.googleScriptUrl);
  const [waliAsuhText, setWaliAsuhText] = useState<string>(config.waliAsuhList.join('\n'));
  const [dormText, setDormText] = useState<string>(config.dormList.join('\n'));
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(config.semester || 'Genap');
  const [academicYear, setAcademicYear] = useState<string>(config.academicYear || '2025/2026');

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPin === '817731') {
      setIsLocked(false);
      setIsUnlockModalOpen(false);
      setUnlockPin('');
      setPinError(false);
      onShowToast('PIN Terverifikasi', 'Kolom isian database asrama siap diubah.', 'success');
    } else {
      setPinError(true);
      setUnlockPin('');
    }
  };

  const handleToggleLock = () => {
    if (!isLocked) {
      setIsLocked(true);
      onShowToast('Pengaturan Terkunci', 'Konfigurasi database dan instansi dikunci kembali.', 'success');
    } else {
      setIsUnlockModalOpen(true);
      setUnlockPin('');
      setPinError(false);
    }
  };

  const handleSave = () => {
    const waliAsuhLines = waliAsuhText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    const dormLines = dormText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

    if (!waliAsrama || !kepalaSekolah) {
      onShowToast('Data Tidak Valid', 'Nama Wali Asrama dan Kepala Sekolah tidak boleh kosong.', 'error');
      return;
    }

    const updatedConfig: AppConfig = {
      googleScriptUrl: googleScriptUrl.trim(),
      waliAsrama: waliAsrama.trim(),
      waliAsramaNip: waliAsramaNip.trim(),
      kepalaSekolah: kepalaSekolah.trim(),
      kepalaSekolahNip: kepalaSekolahNip.trim(),
      kopKiri: kopKiri.trim(),
      kopKanan: kopKanan.trim(),
      waliAsuhList: waliAsuhLines,
      dormList: dormLines,
      logoKiriUrl: logoKiriUrl.trim(),
      logoKananUrl: logoKananUrl.trim(),
      watermarkOpacity: watermarkOpacity || 0.04,
      semester,
      academicYear: academicYear.trim()
    };

    onSaveConfig(updatedConfig);
    setIsLocked(true);
    onShowToast('Pengaturan Disimpan', 'Seluruh parameter baru berhasil disimpan dan sistem otomatis dikunci.', 'success');
  };

  const handleTestConnection = async () => {
    if (!googleScriptUrl.trim()) {
      onShowToast('Koneksi Gagal', 'Isi URL Google Apps Script terlebih dahulu.', 'error');
      return;
    }
    onShowToast('Menghubungkan...', 'Melakukan uji jabat tangan (handshake).', 'warning');
    try {
      await fetch(googleScriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });
      onShowToast('Uji Koneksi Selesai', 'Apps Script terpantau aktif dan siap.', 'success');
    } catch (e) {
      onShowToast('Gangguan Server', 'Gagal menghubungi URL. Periksa koneksi internet.', 'error');
    }
  };

  const inputClass = (disabled: boolean) =>
    `w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition ${
      disabled
        ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed border-slate-200'
        : 'bg-white/80 border-slate-300 text-slate-800 focus:ring-2 focus:ring-red-500/30'
    }`;

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-xl p-5 md:p-8 rounded-3xl border border-white/60 shadow-2xl space-y-6 relative z-10">
        {/* Secure Lock Banner */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg flex-shrink-0">
              {isLocked ? <Lock className="w-5 h-5 text-amber-700" /> : <Unlock className="w-5 h-5 text-emerald-700" />}
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-xs">Proteksi Konfigurasi Database</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                {isLocked ? (
                  <>
                    Seluruh kolom parameter database Google Sheet dan profil instansi saat ini{' '}
                    <strong className="text-amber-800">terkunci rapat</strong>.
                  </>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    Keamanan terbuka! Anda dapat mengubah parameter database.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleLock}
            className={`w-full sm:w-auto font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow ${
              isLocked
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isLocked ? 'Buka Kunci' : 'Kunci Kembali'}</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center gap-4 border-b border-slate-200/50 pb-5">
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-3 rounded-xl text-white flex-shrink-0 shadow-lg">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-bold text-slate-900 drop-shadow-sm">
              Pengaturan & Kustomisasi Sistem
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Sesuaikan profil wali asrama, kustomisasi kop surat PDF, penandatangan berkas, serta sinkronisasi Google Sheet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Kop Surat & Signatures */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Kop Surat Instansi (Bagian Bawah)
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Sekolah / Instansi Terkait
              </label>
              <textarea
                disabled={isLocked}
                value={kopKiri}
                onChange={(e) => setKopKiri(e.target.value)}
                rows={3}
                className={inputClass(isLocked)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat / Informasi Kontak
              </label>
              <textarea
                disabled={isLocked}
                value={kopKanan}
                onChange={(e) => setKopKanan(e.target.value)}
                rows={3}
                className={inputClass(isLocked)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Semester Rapor
                </label>
                <select
                  disabled={isLocked}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className={inputClass(isLocked)}
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Tahun Ajaran
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="e.g. 2025/2026"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 mt-6 flex items-center gap-1.5">
              <Signature className="w-4 h-4" /> Daftar Otorisasi / Penandatangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={kepalaSekolahNip}
                  onChange={(e) => setKepalaSekolahNip(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Wali Asrama Utama
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={waliAsrama}
                  onChange={(e) => setWaliAsrama(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Wali Asrama
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={waliAsramaNip}
                  onChange={(e) => setWaliAsramaNip(e.target.value)}
                  className={inputClass(isLocked)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Logos, Watermark & Google Sheet Backend */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Setelan Logo & Watermark PDF
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logo Kiri (URL/Base64)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={logoKiriUrl}
                  onChange={(e) => setLogoKiriUrl(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="Kosongkan untuk logo bawaan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logo Kanan (URL/Base64)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={logoKananUrl}
                  onChange={(e) => setLogoKananUrl(e.target.value)}
                  className={inputClass(isLocked)}
                  placeholder="Kosongkan untuk logo bawaan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kekuatan Transparansi Watermark ({watermarkOpacity})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.15"
                disabled={isLocked}
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value) || 0.04)}
                className={inputClass(isLocked)}
              />
            </div>

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1 border-slate-200 mt-4 flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Database & Konektivitas Sheet
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                disabled={isLocked}
                value={googleScriptUrl}
                onChange={(e) => setGoogleScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={inputClass(isLocked)}
              />
              <p className="text-[9px] text-slate-500 mt-1">
                Kosongkan URL ini jika ingin beroperasi penuh dalam mode offline lokal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daftar Wali Asuh & NIP (Format: Nama|NIP, 1 per baris)
              </label>
              <textarea
                disabled={isLocked}
                value={waliAsuhText}
                onChange={(e) => setWaliAsuhText(e.target.value)}
                rows={3}
                className={`${inputClass(isLocked)} font-mono`}
                placeholder="Bp. Hermawan|NIP. 198005122010121001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daftar Lokasi Gedung Asrama (Satu per baris)
              </label>
              <textarea
                disabled={isLocked}
                value={dormText}
                onChange={(e) => setDormText(e.target.value)}
                rows={3}
                className={`${inputClass(isLocked)} font-mono`}
                placeholder="Asrama Terpadu"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-slate-200/50">
          <button
            onClick={handleSave}
            disabled={isLocked}
            className="justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Simpan Semua Pengaturan
          </button>
          <button
            onClick={handleTestConnection}
            className="justify-center bg-white/60 hover:bg-white/80 backdrop-blur-md text-slate-700 font-bold text-xs px-6 py-3.5 rounded-xl border border-slate-300 shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" /> Uji Koneksi Database
          </button>
        </div>
      </div>

      {/* Unlock PIN Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Buka Kunci Pengaturan</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Masukkan PIN administrasi asrama untuk merubah parameter database.
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <input
                type="password"
                required
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value);
                  if (pinError) setPinError(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="••••••"
                autoComplete="off"
              />
              {pinError && (
                <p className="text-[10px] text-red-500 text-center font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Kata sandi salah. Silakan coba lagi.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition active:scale-95"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs px-4 py-2 rounded-lg shadow transition active:scale-95"
                >
                  Verifikasi PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
