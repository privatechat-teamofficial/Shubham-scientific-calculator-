import React from 'react';
import { X, Maximize2, Smartphone, Monitor, RotateCcw, ZoomIn } from 'lucide-react';

export type ScreenFitMode = 'AUTO_FIT' | 'FULL_SCREEN' | 'COMPACT';

interface ScreenFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  fitMode: ScreenFitMode;
  onSetFitMode: (mode: ScreenFitMode) => void;
  screenScale: number; // percentage, e.g. 100
  onSetScreenScale: (scale: number) => void;
  keyHeight: number; // in px, e.g. 44
  onSetKeyHeight: (height: number) => void;
  displayHeight: number; // in px, e.g. 210
  onSetDisplayHeight: (height: number) => void;
  onResetDefaults: () => void;
}

export const ScreenFitModal: React.FC<ScreenFitModalProps> = ({
  isOpen,
  onClose,
  fitMode,
  onSetFitMode,
  screenScale,
  onSetScreenScale,
  keyHeight,
  onSetKeyHeight,
  displayHeight,
  onSetDisplayHeight,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0c] border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121215] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Maximize2 className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Screen Fit & Adjustment
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Customize scale & button dimensions for your screen
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-oryno-bold">
          {/* Quick Fit Mode Preset */}
          <div>
            <label className="text-neutral-400 font-bold block mb-2 text-[11px] uppercase tracking-wider">
              Screen Layout Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSetFitMode('AUTO_FIT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  fitMode === 'AUTO_FIT'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-[#141416] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-[11px]">Auto Fill</span>
                <span className="text-[9px] text-neutral-400 leading-tight">Fills phone screen height</span>
              </button>

              <button
                type="button"
                onClick={() => onSetFitMode('FULL_SCREEN')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  fitMode === 'FULL_SCREEN'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-[#141416] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <Maximize2 className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-[11px]">Full Stretch</span>
                <span className="text-[9px] text-neutral-400 leading-tight">Max edge-to-edge size</span>
              </button>

              <button
                type="button"
                onClick={() => onSetFitMode('COMPACT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  fitMode === 'COMPACT'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-[#141416] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <Monitor className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-[11px]">Compact</span>
                <span className="text-[9px] text-neutral-400 leading-tight">Fixed classic scale</span>
              </button>
            </div>
          </div>

          {/* Keypad Button Height Slider */}
          <div className="bg-[#141416] border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-xs">
                Keypad Button Height
              </span>
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {keyHeight}px
              </span>
            </div>
            <input
              type="range"
              min="36"
              max="62"
              step="2"
              value={keyHeight}
              onChange={(e) => onSetKeyHeight(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-[#27272a] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Compact (36px)</span>
              <span>Standard (44px)</span>
              <span>Tall (62px)</span>
            </div>
          </div>

          {/* Screen Zoom Level */}
          <div className="bg-[#141416] border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-neutral-200 text-xs">
                  Overall Zoom Scale
                </span>
              </div>
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {screenScale}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {[85, 95, 100, 105, 115, 125].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSetScreenScale(s)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs font-mono transition-all ${
                    screenScale === s
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                      : 'bg-[#222226] text-neutral-300 hover:bg-[#2c2c32]'
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Natural Display Screen Height */}
          <div className="bg-[#141416] border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-xs">
                Display Viewport Height
              </span>
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {displayHeight}px
              </span>
            </div>
            <input
              type="range"
              min="170"
              max="260"
              step="5"
              value={displayHeight}
              onChange={(e) => onSetDisplayHeight(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-[#27272a] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Compact (170px)</span>
              <span>ClassWiz (210px)</span>
              <span>Large (260px)</span>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold flex items-center gap-1.5 text-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md active:scale-95 text-center"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
