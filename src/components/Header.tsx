import React from 'react';
import { 
  History, 
  TrendingUp, 
  MoreVertical, 
} from 'lucide-react';
import { AngleUnit } from '../types';

interface HeaderProps {
  angleUnit?: AngleUnit;
  onCycleAngleUnit?: () => void;
  onOpenHistory: () => void;
  onOpenVariables?: () => void;
  onOpenCamera: () => void;
  onOpenGraph: () => void;
  onOpenSettings: () => void;
  onOpenSolver?: () => void;
  onOpenHelp?: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  angleUnit,
  onCycleAngleUnit,
  onOpenHistory,
  onOpenVariables: _onOpenVariables,
  onOpenCamera,
  onOpenGraph,
  onOpenSettings,
  onOpenSolver: _onOpenSolver,
  onOpenHelp: _onOpenHelp,
  historyCount,
}) => {
  return (
    <header className="w-full bg-[#000000] border-b border-neutral-800/80 text-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between select-none">
      {/* Brand: older icon size (w-8 h-8) with larger inside Sigma Σ, and only SHUBHAM text */}
      <div className="flex items-center gap-2.5">
        <div 
          className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/35 ring-1.5 ring-amber-300/60 shrink-0 select-none cursor-default"
          title="SHUBHAM Scientific Calculator"
        >
          <span className="text-black font-black text-xl select-none leading-none -translate-y-[0.5px]">Σ</span>
        </div>
        <span className="tracking-wider font-extrabold text-[16px] sm:text-[17px] font-oryno-bold text-white leading-none">
          SHUBHAM
        </span>
      </div>

      {/* Top action icons sized proportionately to the brand badge */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Angle Unit Badge / Toggle */}
        {angleUnit && onCycleAngleUnit && (
          <button
            id="btn-angle-unit"
            onClick={onCycleAngleUnit}
            title="Click to switch DEG / RAD / GRAD"
            className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider bg-[#1f2937] text-amber-400 border border-amber-400/30 hover:bg-neutral-800 hover:border-amber-400/60 active:scale-95 transition-all shadow-xs"
          >
            {angleUnit}
          </button>
        )}

        {/* History Button */}
        <button
          id="btn-open-history"
          onClick={onOpenHistory}
          title="Calculation History"
          className="relative p-1.5 sm:p-2 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <History className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px]" strokeWidth={2.4} />
          {historyCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black"></span>
          )}
        </button>

        {/* Graph Plotter */}
        <button
          id="btn-open-graph"
          onClick={onOpenGraph}
          title="2D Function Graph Plotter"
          className="p-1.5 sm:p-2 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <TrendingUp className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px]" strokeWidth={2.4} />
        </button>

        {/* Settings / More Menu */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          title="Settings & Options"
          className="p-1.5 sm:p-2 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <MoreVertical className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px]" strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
};
