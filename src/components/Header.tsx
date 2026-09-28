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
  onOpenCamera?: () => void;
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
  onOpenCamera: _onOpenCamera,
  onOpenGraph,
  onOpenSettings,
  onOpenSolver: _onOpenSolver,
  onOpenHelp: _onOpenHelp,
  historyCount,
}) => {
  return (
    <header className="w-full bg-[#000000] border-b border-neutral-800/80 text-slate-100 px-3 py-2 flex items-center justify-between select-none">
      {/* Brand: exact amber rounded badge matching user logo */}
      <div className="flex items-center gap-2.5">
        <div 
          className="w-10 h-10 rounded-[10px] overflow-hidden flex items-center justify-center shadow-md shadow-amber-500/35 ring-1.5 ring-amber-300/60 shrink-0 select-none cursor-default"
          title="SHUBHAM Scientific Calculator"
        >
          <svg viewBox="0 0 1024 1024" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="1024" height="1024" rx="225" ry="225" fill="#FFA800" />
            <path d="M 320 316 L 662 316 L 662 404 L 616 404 L 458 374 L 572 512 L 458 650 L 616 620 L 662 620 L 662 708 L 320 708 L 444 512 Z" fill="#000000" />
          </svg>
        </div>
        <span className="tracking-wider font-extrabold text-[17px] font-oryno-bold text-white leading-none">
          SHUBHAM
        </span>
      </div>

      {/* Top action icons sized proportionately to the brand badge */}
      <div className="flex items-center gap-1.5">
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
          className="relative p-1.5 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <History className="w-[18px] h-[18px]" strokeWidth={2.4} />
          {historyCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black"></span>
          )}
        </button>

        {/* Graph Plotter */}
        <button
          id="btn-open-graph"
          onClick={onOpenGraph}
          title="2D Function Graph Plotter"
          className="p-1.5 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <TrendingUp className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>

        {/* Settings / More Menu */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          title="Settings & Options"
          className="p-1.5 rounded-lg bg-[#18181b] text-slate-200 hover:text-amber-300 hover:bg-[#27272a] border border-neutral-800 active:scale-95 transition-all"
        >
          <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
};
