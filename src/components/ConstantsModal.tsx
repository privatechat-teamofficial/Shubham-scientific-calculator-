import React, { useState } from 'react';
import { X, Search, Atom } from 'lucide-react';
import { PHYSICAL_CONSTANTS } from '../lib/mathEngine';

interface ConstantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertConstant: (symbol: string, value: number) => void;
}

export const ConstantsModal: React.FC<ConstantsModalProps> = ({
  isOpen,
  onClose,
  onInsertConstant,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = PHYSICAL_CONSTANTS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || c.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Atom className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Scientific & Physical Constants
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                [SHIFT] [7] (CONST)
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

        {/* Search & Categories */}
        <div className="p-3 bg-[#0f0f11] border-b border-neutral-800 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search constants (e.g. speed of light, planck)..."
              className="w-full bg-[#000000] border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto text-xs pb-0.5">
            {['all', 'universal', 'electromagnetic', 'atomic', 'physico-chemical'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize whitespace-nowrap transition-all text-xs ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-black border border-amber-400 shadow-xs'
                    : 'bg-[#18181b] text-neutral-300 hover:bg-[#27272a] border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-[#141416] hover:bg-[#18181b] border border-neutral-800 rounded-xl flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-[#1f2937] text-amber-300 font-serif italic text-base flex items-center justify-center border border-amber-500/30">
                  {item.symbol}
                </span>
                <div>
                  <div className="text-white text-xs font-bold">{item.name}</div>
                  <div className="text-neutral-400 font-mono text-[11px] mt-0.5">
                    {item.value.toExponential(4)} {item.unit}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onInsertConstant(item.symbol, item.value);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1f2937] hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/20 text-xs font-bold transition-all active:scale-95"
              >
                Insert
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
