import React, { useState } from 'react';
import { X, Check, Edit2, Variable } from 'lucide-react';
import { VariableMap } from '../types';

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: VariableMap;
  onUpdateVariable: (key: keyof VariableMap, value: number) => void;
  onInsertVariable: (key: keyof VariableMap) => void;
}

export const VariablesModal: React.FC<VariablesModalProps> = ({
  isOpen,
  onClose,
  variables,
  onUpdateVariable,
  onInsertVariable,
}) => {
  const [editingKey, setEditingKey] = useState<keyof VariableMap | null>(null);
  const [editVal, setEditVal] = useState('');

  const keys: (keyof VariableMap)[] = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M', 'Ans'];

  const handleSave = (key: keyof VariableMap) => {
    const num = parseFloat(editVal);
    if (!isNaN(num)) {
      onUpdateVariable(key, num);
    }
    setEditingKey(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header with calculator theme */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Variable className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Variables & Memory (STO/RCL)
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Store and recall mathematical values
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

        {/* List */}
        <div className="p-3 overflow-y-auto space-y-2">
          {keys.map((k) => (
            <div
              key={k}
              className="p-2.5 bg-[#141416] hover:bg-[#18181b] border border-neutral-800 rounded-xl flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#1f2937] text-amber-400 font-mono font-black flex items-center justify-center border border-amber-500/30 text-sm">
                  {k}
                </span>
                {editingKey === k ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      placeholder="Enter value"
                      autoFocus
                      className="w-28 px-2 py-1 rounded-md bg-[#000000] border border-amber-400 text-white font-mono text-xs focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleSave(k)}
                      className="p-1.5 rounded-md bg-[#61cc70] text-black hover:bg-[#50a65c] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-sm text-neutral-200">
                    = {variables[k]}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {k !== 'Ans' && editingKey !== k && (
                  <button
                    onClick={() => {
                      setEditingKey(k);
                      setEditVal(variables[k].toString());
                    }}
                    title={`Edit ${k}`}
                    className="p-1.5 rounded-lg bg-[#1f2937] hover:bg-[#27272a] text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onInsertVariable(k);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1f2937] hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-bold transition-all border border-amber-500/20 active:scale-95"
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
