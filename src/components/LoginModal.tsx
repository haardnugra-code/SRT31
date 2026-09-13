import React, { useState } from 'react';
import { GraduationCap, Lock, LogIn, AlertCircle, ShieldCheck, UserCheck, Brain, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { KageLandingPage } from '../shaders/landing-pages/LandingPages';
import '../shaders/threeui.css';

interface LoginModalProps {
  isLoggedIn: boolean;
  onLoginSuccess: (role: 'admin' | 'guru') => void;
  onOpenStudentAssessment?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isLoggedIn,
  onLoginSuccess,
  onOpenStudentAssessment
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guru'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPwd = password.trim();

    if (selectedRole === 'admin') {
      if (cleanPwd === '313131' || cleanPwd.toLowerCase() === 'admin' || cleanPwd === 'admin31') {
        sessionStorage.setItem('sr_auth_status', 'logged_in');
        sessionStorage.setItem('sr_user_role', 'admin');
        onLoginSuccess('admin');
      } else {
        setError(true);
        setPassword('');
      }
    } else {
      // Guru Login
      if (cleanPwd === '313131' || cleanPwd.toLowerCase() === 'guru' || cleanPwd === 'guru31' || cleanPwd === '123456') {
        sessionStorage.setItem('sr_auth_status', 'logged_in');
        sessionStorage.setItem('sr_user_role', 'guru');
        onLoginSuccess('guru');
      } else {
        setError(true);
        setPassword('');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* Background Music (YouTube Hidden Embed) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 invisible overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/hN0k8qmgyKQ?autoplay=1&loop=1&playlist=hN0k8qmgyKQ&controls=0&showinfo=0&modestbranding=1&enablejsapi=1&mute=${isMuted ? 1 : 0}`}
          title="BGM"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <div className="absolute inset-0">
        <KageLandingPage
          backgroundCanvasSelector="#gl"
          className="w-full h-full"
          primaryColor="#e0231c"
        />
      </div>
      
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center">
        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all z-20 group"
          title={isMuted ? "Aktifkan Musik" : "Matikan Musik"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
          {isMuted && (
            <span className="absolute right-full mr-2 whitespace-nowrap bg-black/60 px-2 py-1 rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Putar Lagu (BGM)
            </span>
          )}
        </button>

        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl shadow-[0_0_15px_rgba(220,38,38,0.5)] mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white text-center leading-tight">Sekolah Rakyat</h1>
        <p className="text-xs text-slate-300 text-center font-medium uppercase tracking-wider mb-5">
          Portal Disiplin Asrama & Pengajar
        </p>

        {/* 2 Login Option Tabs */}
        <div className="w-full grid grid-cols-2 gap-2 bg-black/30 p-1.5 rounded-2xl mb-5 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setError(false);
            }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all text-xs font-bold ${
              selectedRole === 'admin'
                ? 'bg-red-600 text-white shadow-lg border border-red-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Pengampu / Wali Asuh</span>
            </div>
            <span className="text-[9px] font-normal opacity-80 mt-0.5">Admin & Respon Asrama</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('guru');
              setError(false);
            }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all text-xs font-bold ${
              selectedRole === 'guru'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Guru Pengampu</span>
            </div>
            <span className="text-[9px] font-normal opacity-80 mt-0.5">Input Capaian Belajar</span>
          </button>
        </div>


        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 text-center">
              {selectedRole === 'admin'
                ? 'Kata Sandi / PIN Pengasuh'
                : 'Kata Sandi / PIN Guru'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 font-mono tracking-widest text-center text-white placeholder-slate-400 backdrop-blur-sm transition-all"
                placeholder="••••••"
                autoComplete="off"
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-400 mt-2 font-semibold text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Kata sandi salah. Silakan coba lagi.
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full font-bold text-sm px-4 py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-white shadow-lg ${
              selectedRole === 'admin'
                ? 'bg-red-600 hover:bg-red-700 shadow-[0_4px_14px_0_rgba(220,38,38,0.39)]'
                : 'bg-amber-600 hover:bg-amber-700 shadow-[0_4px_14px_0_rgba(217,119,6,0.39)]'
            }`}
          >
            <LogIn className="w-4 h-4" /> Masuk sebagai {selectedRole === 'admin' ? 'Pengasuh / Admin' : 'Guru / Staf'}
          </button>
        </form>

        {onOpenStudentAssessment && (
          <div className="w-full pt-4 mt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onOpenStudentAssessment}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-emerald-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-400/40 text-emerald-200 hover:text-white transition flex items-center justify-between group cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    Akses Siswa: Tes Psikologi Mandiri
                  </p>
                  <p className="text-[10px] text-slate-300">
                    SDQ 25 & Resiliensi Tumbuh Kembang Jiwa
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        )}

        <div className="mt-5 text-center border-t border-white/10 pt-3 w-full">
          <p className="text-[9px] text-slate-400 font-bold tracking-widest">KEMENSOS RI © 2026</p>
        </div>
      </div>
    </motion.div>
  );
};

