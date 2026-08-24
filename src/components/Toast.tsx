import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-[90vw] md:max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const bgClass =
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : toast.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800';

        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : XCircle;

        const iconColor =
          toast.type === 'success'
            ? 'text-emerald-500'
            : toast.type === 'warning'
            ? 'text-amber-500'
            : 'text-red-500';

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border ${bgClass} shadow-lg flex items-start gap-3 w-full max-w-sm pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-8`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs truncate">{toast.title}</h4>
              <p className="text-[11px] mt-0.5 leading-relaxed opacity-90 break-words">
                {toast.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
