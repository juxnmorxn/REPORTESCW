'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
}

export default function NotificationModal({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const getDetails = () => {
    switch (type) {
      case 'error':
        return {
          icon: <AlertCircle className="w-7 h-7 text-red-400" />,
          bgColor: 'bg-red-950/30 border-red-900/50',
          btnColor: 'bg-red-600 hover:bg-red-500 shadow-red-950 text-white',
          defaultTitle: 'Aviso',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
          bgColor: 'bg-emerald-950/30 border-emerald-900/50',
          btnColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950 text-white',
          defaultTitle: 'Éxito',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
          bgColor: 'bg-amber-950/30 border-amber-900/50',
          btnColor: 'bg-amber-600 hover:bg-amber-500 shadow-amber-950 text-white',
          defaultTitle: 'Advertencia',
        };
      default:
        return {
          icon: <Info className="w-7 h-7 text-sky-400" />,
          bgColor: 'bg-sky-950/30 border-sky-900/50',
          btnColor: 'bg-sky-600 hover:bg-sky-500 shadow-sky-950 text-white',
          defaultTitle: 'Información',
        };
    }
  };

  const config = getDetails();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-slate-900 border ${config.bgColor} w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4`}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-white leading-snug">
              {title || config.defaultTitle}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition active:scale-95 ${config.btnColor}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
