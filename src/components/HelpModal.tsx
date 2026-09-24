import React from 'react';
import { X, HelpCircle, Keyboard } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header with calculator theme */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                ClassWiz Guide & Shortcuts
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                How to use scientific features
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

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs text-neutral-300">
          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
              SHIFT Mode (Golden Yellow)
            </h4>
            <p className="text-neutral-400 leading-relaxed">
              Press <span className="font-extrabold text-amber-400">SHIFT</span> to activate the golden secondary functions above keys (e.g. <span className="text-amber-300 font-mono">sin⁻¹</span>, <span className="text-amber-300 font-mono">x!</span>, <span className="text-amber-300 font-mono">³√</span>, <span className="text-amber-300 font-mono">π</span>, <span className="text-amber-300 font-mono">CONST</span>). Non-shift keys dim to 20% opacity for instant visual guidance.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7adf8c] shadow-xs shadow-emerald-400/50" />
              ALPHA Mode (ClassWiz Mint Green)
            </h4>
            <p className="text-neutral-400 leading-relaxed">
              Press <span className="font-extrabold text-[#7adf8c]">ALPHA</span> to access stored algebraic variables (<span className="text-[#7adf8c] font-mono font-bold">A, B, C, D, E, F, X, Y, M</span>) and secondary operators.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#61cc70] shadow-xs shadow-green-400/50" />
              S⇔D Exact Fraction to Decimal Conversion
            </h4>
            <p className="text-neutral-400 leading-relaxed">
              Press <span className="font-bold text-white bg-[#1f2937] px-1.5 py-0.5 rounded border border-neutral-700">S⇔D</span> to toggle the displayed result between an exact fraction / radical (<span className="font-mono text-amber-300">7/4</span> or <span className="font-mono text-amber-300">√2/2</span>) and its decimal approximation (<span className="font-mono text-[#61cc70]">1.75</span> or <span className="font-mono text-[#61cc70]">0.707106</span>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800">
            <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-400" />
              Physical Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2 text-neutral-400 font-mono">
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">=</kbd> : Calculate</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">Escape</kbd> : Clear (AC)</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">Backspace</kbd> : Delete</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">Arrow keys</kbd> : Move cursor</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">/</kbd> : Fraction</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#000000] border border-neutral-700 rounded text-amber-300">^</kbd> : Exponent / Power</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141416] border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">Developer Contact</div>
              <div className="text-neutral-400 text-[11px] font-mono mt-0.5">imshubhamk9@gmail.com</div>
            </div>
            <a
              href="mailto:imshubhamk9@gmail.com"
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all active:scale-95"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
