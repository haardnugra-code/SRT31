import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmBtnText?: string;
  btnColorClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmBtnText = 'Hapus Data',
  btnColorClass = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:left-64 z-[40] bg-slate-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition active:scale-95"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${btnColorClass} text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition active:scale-95`}
          >
            {confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};
