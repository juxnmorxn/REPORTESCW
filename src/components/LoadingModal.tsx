'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export default function LoadingModal({
  isOpen,
  title = 'Cargando datos...',
  message = 'Por favor espera un momento mientras procesamos tu solicitud.',
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
