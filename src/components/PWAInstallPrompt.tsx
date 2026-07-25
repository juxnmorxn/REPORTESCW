'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-sky-950 border border-sky-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-bounce-short">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-sky-500 rounded-xl text-white font-bold">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Instalar PWA ISP</h4>
          <p className="text-xs text-sky-200">Acceso directo en pantalla y trabajo offline</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
