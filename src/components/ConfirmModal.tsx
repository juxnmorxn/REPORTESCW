'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, X, ShieldAlert, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ShieldAlert className="w-8 h-8 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
      default:
        return <HelpCircle className="w-8 h-8 text-sky-400" />;
    }
  };

  const getConfirmBtnColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 shadow-red-950 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-950 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950 text-white';
      default:
        return 'bg-sky-600 hover:bg-sky-500 shadow-sky-950 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 transform transition-all scale-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${getConfirmBtnColor()}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
