import React from 'react';
import { ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import { AngleUnit, FractionFormat, NumberFormat } from '../types';

interface StatusBarProps {
  angleUnit: AngleUnit;
  onCycleAngleUnit: () => void;
  fractionFormat: FractionFormat;
  onToggleFractionFormat: () => void;
  numberFormat: NumberFormat;
  onCycleNumberFormat: () => void;
  isShift: boolean;
  isAlpha: boolean;
  hasMemory: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  angleUnit,
  onCycleAngleUnit,
  fractionFormat,
  onToggleFractionFormat,
  numberFormat,
  onCycleNumberFormat,
  isShift,
  isAlpha,
  hasMemory,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="w-full bg-[#000000] text-slate-300 px-0 py-1 flex items-center justify-between text-xs select-none font-oryno-bold font-bold">
      {/* Mode Indicators matching screenshot pills */}
      <div className="flex items-center gap-1.5">
        {/* SHIFT Indicator (if active) */}
        {isShift && (
          <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-[#de982a] text-black">
            S
          </span>
        )}

        {/* ALPHA Indicator (if active) */}
        {isAlpha && (
          <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-[#7adf8c] text-black">
            A
          </span>
        )}

        {/* Memory Indicator (if active) */}
        {hasMemory && (
          <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            M
          </span>
        )}

        {/* Angle Mode Toggle Pill (RAD / DEG / GRAD) */}
        <button
          id="btn-status-angle-unit"
          onClick={onCycleAngleUnit}
          title="Click to toggle DEG / RAD / GRAD"
          className="px-2 py-0.5 rounded-[5px] font-medium bg-[#27272a] text-slate-200 hover:bg-[#323236] transition-colors text-[11px]"
        >
          {angleUnit}
        </button>

        {/* Fraction Mode Pill (FRAC / DEC / MIXED) */}
        <button
          id="btn-status-fraction-format"
          onClick={onToggleFractionFormat}
          title="Click to toggle Fraction / Decimal"
          className="px-2 py-0.5 rounded-[5px] font-medium bg-[#27272a] text-slate-200 hover:bg-[#323236] transition-colors text-[11px]"
        >
          {fractionFormat === 'DECIMAL' ? 'DEC' : fractionFormat === 'MIXED' ? 'a b/c' : 'FRAC'}
        </button>

        {/* Norm / Sci / Eng Text */}
        <button
          id="btn-status-number-format"
          onClick={onCycleNumberFormat}
          title="Click to toggle NORM / SCI / ENG"
          className="px-1 py-0.5 font-normal text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
        >
          {numberFormat}
        </button>
      </div>

      {/* Right Controls: Zoom & History Undo/Redo with increased icon size */}
      <div className="flex items-center gap-1 sm:gap-2 text-slate-400">
        <button
          id="btn-status-zoom-out"
          onClick={onZoomOut}
          title="Zoom Out Display"
          className="p-1.5 rounded hover:text-white hover:bg-slate-900 active:scale-90 transition-all"
        >
          <ZoomOut className="w-4.5 h-4.5" strokeWidth={2.2} />
        </button>
        <button
          id="btn-status-zoom-in"
          onClick={onZoomIn}
          title="Zoom In Display"
          className="p-1.5 rounded hover:text-white hover:bg-slate-900 active:scale-90 transition-all"
        >
          <ZoomIn className="w-4.5 h-4.5" strokeWidth={2.2} />
        </button>
        <button
          id="btn-status-undo"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded transition-all ${
            canUndo ? 'hover:text-white hover:bg-slate-900 active:scale-90' : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4.5 h-4.5" strokeWidth={2.2} />
        </button>
        <button
          id="btn-status-redo"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded transition-all ${
            canRedo ? 'hover:text-white hover:bg-slate-900 active:scale-90' : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4.5 h-4.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );

};
