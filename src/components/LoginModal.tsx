import React, { useState } from 'react';
import { GraduationCap, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isLoggedIn, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (isLoggedIn) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '313131') {
      sessionStorage.setItem('sr_auth_status', 'logged_in');
      onLoginSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
        <h1 className="text-[12rem] md:text-[20rem] font-black text-white tracking-tighter mix-blend-overlay">
          SRT31
        </h1>
      </div>
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl shadow-[0_0_15px_rgba(220,38,38,0.5)] mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white text-center leading-tight">Sekolah Rakyat</h1>
        <p className="text-xs text-slate-300 text-center font-medium uppercase tracking-wider mb-6">
          Portal Disiplin Asrama
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
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
            className="w-full bg-red-600 text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-red-700 shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Masuk Sistem
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-4 w-full">
          <p className="text-[9px] text-slate-400 font-bold tracking-widest">KEMENSOS RI © 2026</p>
        </div>
      </div>
    </div>
  );
};
