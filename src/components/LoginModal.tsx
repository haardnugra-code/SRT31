import React, { useState } from 'react';
import { GraduationCap, Lock, LogIn, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginModalProps {
  isLoggedIn: boolean;
  onLoginSuccess: (role: 'admin' | 'guru') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isLoggedIn, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guru'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (isLoggedIn) return null;

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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
        <h1 className="text-[12rem] md:text-[20rem] font-black text-white tracking-tighter mix-blend-overlay">
          SRT31
        </h1>
      </div>
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center">
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
              <span>Pengasuh / Admin</span>
            </div>
            <span className="text-[9px] font-normal opacity-80 mt-0.5">Akses Lengkap</span>
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
              <span>Guru / Staf</span>
            </div>
            <span className="text-[9px] font-normal opacity-80 mt-0.5">Akses Khusus</span>
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

        <div className="mt-6 text-center border-t border-white/10 pt-4 w-full">
          <p className="text-[9px] text-slate-400 font-bold tracking-widest">KEMENSOS RI © 2026</p>
        </div>
      </div>
    </div>
  );
};

