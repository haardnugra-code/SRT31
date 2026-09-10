import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X, ChevronRight } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2.5 max-w-[95vw] sm:max-w-md pointer-events-none">
      {toasts.map((toast) => {
        const bgClass =
          toast.type === 'success'
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10'
            : toast.type === 'warning'
            ? 'bg-amber-50/95 border-amber-300 text-amber-900 shadow-amber-500/10'
            : toast.type === 'info'
            ? 'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sky-500/10'
            : 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-500/10';

        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : toast.type === 'info'
            ? Info
            : XCircle;

        const iconColor =
          toast.type === 'success'
            ? 'text-emerald-600'
            : toast.type === 'warning'
            ? 'text-amber-600'
            : toast.type === 'info'
            ? 'text-sky-600'
            : 'text-rose-600';

        return (
          <div
            key={toast.id}
            className={`p-3.5 sm:p-4 rounded-2xl border ${bgClass} shadow-xl backdrop-blur-md flex items-start gap-3 w-full pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-8`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm tracking-tight">{toast.title}</h4>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                    title="Tutup Notifikasi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-xs mt-1 leading-relaxed opacity-90 break-words font-medium">
                {toast.message}
              </p>

              {toast.action && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      if (onDismiss) onDismiss(toast.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition active:scale-95"
                  >
                    <span>{toast.action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-500 italic">Klik untuk inspeksi</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
