import React, { useState } from 'react';
import { X, Sliders, Volume2, Type, Mail, Check, Copy } from 'lucide-react';
import { AngleUnit, FractionFormat, NumberFormat } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  angleUnit: AngleUnit;
  onSetAngleUnit: (unit: AngleUnit) => void;
  fractionFormat: FractionFormat;
  onSetFractionFormat: (fmt: FractionFormat) => void;
  numberFormat: NumberFormat;
  onSetNumberFormat: (fmt: NumberFormat) => void;
  fontSize: number;
  onSetFontSize: (size: number) => void;
  audioFeedback: boolean;
  onSetAudioFeedback: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  angleUnit,
  onSetAngleUnit,
  fractionFormat,
  onSetFractionFormat,
  numberFormat,
  onSetNumberFormat,
  fontSize,
  onSetFontSize,
  audioFeedback,
  onSetAudioFeedback,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header with calculator theme */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Calculator Settings
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                ClassWiz mathematical preferences
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Angle Unit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-neutral-200 font-bold block">
                Angle Unit (Trigonometry)
              </label>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold px-1.5 py-0.5 rounded bg-[#1f2937]">
                Active: {angleUnit}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['DEG', 'RAD', 'GRAD'] as AngleUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => onSetAngleUnit(u)}
                  className={`py-2 rounded-xl font-bold border transition-all active:scale-95 ${
                    angleUnit === u
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                      : 'bg-[#18181b] text-neutral-300 border-neutral-800 hover:bg-[#27272a]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Fraction Format */}
          <div>
            <label className="text-neutral-200 font-bold block mb-1.5">
              Fraction Output Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSetFractionFormat('EXACT')}
                className={`py-2 rounded-xl font-bold border transition-all active:scale-95 ${
                  fractionFormat === 'EXACT'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-[#18181b] text-neutral-300 border-neutral-800 hover:bg-[#27272a]'
                }`}
              >
                a/b (Exact)
              </button>
              <button
                onClick={() => onSetFractionFormat('MIXED')}
                className={`py-2 rounded-xl font-bold border transition-all active:scale-95 ${
                  fractionFormat === 'MIXED'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-[#18181b] text-neutral-300 border-neutral-800 hover:bg-[#27272a]'
                }`}
              >
                c a/b (Mixed)
              </button>
              <button
                onClick={() => onSetFractionFormat('DECIMAL')}
                className={`py-2 rounded-xl font-bold border transition-all active:scale-95 ${
                  fractionFormat === 'DECIMAL'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-[#18181b] text-neutral-300 border-neutral-800 hover:bg-[#27272a]'
                }`}
              >
                Decimal
              </button>
            </div>
          </div>

          {/* Number Display Format */}
          <div>
            <label className="text-neutral-200 font-bold block mb-1.5">
              Number Notation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['NORM', 'SCI', 'ENG'] as NumberFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onSetNumberFormat(fmt)}
                  className={`py-2 rounded-xl font-bold border transition-all active:scale-95 ${
                    numberFormat === fmt
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                      : 'bg-[#18181b] text-neutral-300 border-neutral-800 hover:bg-[#27272a]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Display Font Size */}
          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-200 font-bold flex items-center gap-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                Natural Display Font Size
              </span>
              <span className="text-amber-400 font-mono font-bold">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="32"
              value={fontSize}
              onChange={(e) => onSetFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-[#27272a] rounded-lg"
            />
          </div>

          {/* Key Click Sound */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-neutral-200 font-bold">Keypad Tactile Audio</div>
                <div className="text-neutral-500 text-[11px]">Synthetic mechanical click feedback</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioFeedback}
              onChange={(e) => onSetAudioFeedback(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Contact Developer */}
          <div className="pt-1">
            <div className="bg-[#141416] border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      Developer Support
                    </div>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      SHUBHAM Calculator Official Team
                    </div>
                  </div>
                </div>
                <a
                  href="mailto:support@shubham-calculator.app"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all active:scale-95 shadow-xs"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
