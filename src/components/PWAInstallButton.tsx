import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-oryno-bold text-xs font-bold transition-all shadow-sm"
        title="Install SHUBHAM Calculator App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-oryno-bold text-xs font-bold transition-all border border-amber-500/40"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-amber-400 mb-2">Install on iPhone / iPad</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                1. Tap the <strong className="text-white">Share</strong> icon in Safari toolbar.<br />
                2. Scroll down and select <strong className="text-amber-300">Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={install}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-oryno-bold text-xs font-bold transition-all shadow-sm"
      title="Install App"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install</span>
    </button>
  );
};
