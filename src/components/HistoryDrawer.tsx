import React, { useState } from 'react';
import { X, Trash2, ArrowUpRight, Copy, Check, Clock } from 'lucide-react';
import { CalculationRecord } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationRecord[];
  onSelectRecord: (record: CalculationRecord) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base font-oryno-bold">Calculation History</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1f2937] text-amber-400 font-mono font-bold border border-amber-500/30">
                  {history.length}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Tap any item to recall into calculator</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                id="btn-clear-history"
                onClick={() => setShowConfirmClear(true)}
                title="Clear all history"
                className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/30 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {showConfirmClear && (
          <div className="p-3 bg-red-950/50 border-b border-red-900/60 flex items-center justify-between text-xs animate-in fade-in">
            <span className="text-red-200 font-medium">Clear all {history.length} calculations?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm gap-2">
              <Clock className="w-10 h-10 text-neutral-700" />
              <span className="font-semibold text-neutral-400">No calculation history yet</span>
              <span className="text-xs text-neutral-600">Calculated expressions will be saved here automatically</span>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#141416] hover:bg-[#1c1c20] border border-neutral-800 hover:border-amber-500/40 rounded-xl flex flex-col gap-2 transition-all cursor-pointer group active:scale-[0.99] shadow-xs"
                onClick={() => onSelectRecord(item)}
              >
                {/* Expression row */}
                <div className="flex items-center justify-between text-xs text-amber-300/90 font-mono font-medium">
                  <span className="truncate pr-2">{item.expression}</span>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.id, item.resultExact);
                      }}
                      title="Copy Result"
                      className="p-1 rounded bg-[#1f2937] hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-[#61cc70]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span 
                      className="p-1 rounded bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors"
                      title="Recall expression"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Result row */}
                <div className="flex items-baseline justify-between pt-1.5 border-t border-neutral-800/80">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1f2937]">
                    {item.angleUnit}
                  </span>
                  <div className="text-right">
                    <div className="text-[#61cc70] font-mono font-bold text-base">
                      = {item.resultExact}
                    </div>
                    {item.resultExact !== item.resultDecimal && (
                      <div className="text-neutral-400 font-mono text-xs">
                        ≈ {item.resultDecimal}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
