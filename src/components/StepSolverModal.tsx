import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import katex from 'katex';
import { SolverResponse } from '../types';

interface StepSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  expression: string;
}

export const StepSolverModal: React.FC<StepSolverModalProps> = ({
  isOpen,
  onClose,
  expression,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SolverResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && expression) {
      solveProblem(expression);
    }
  }, [isOpen, expression]);

  const solveProblem = async (problemExpr: string) => {
    setLoading(true);
    setErrorMsg(null);
    setData(null);

    try {
      const res = await fetch('/api/ai/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problemExpr, mode: 'steps' }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate solution steps');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to load AI solution steps.');
    } finally {
      setLoading(false);
    }
  };

  const renderKatex = (latex: string) => {
    try {
      return {
        __html: katex.renderToString(latex, { throwOnError: false, displayMode: false }),
      };
    } catch {
      return { __html: latex };
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Step-by-Step Math Solution
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                AI Casio Mathematical Engine
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

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Current Problem Banner */}
          <div className="p-3 bg-[#141416] border border-neutral-800 rounded-xl">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Current Problem:
            </span>
            <div className="text-white font-mono text-base font-bold">
              {expression}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-amber-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="font-mono text-xs tracking-wide text-neutral-300">
                Computing mathematical steps with Gemini...
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Result Steps */}
          {data && (
            <div className="flex flex-col gap-4">
              {/* Final Answer Banner */}
              <div className="p-3.5 bg-[#0f1d13] border border-emerald-600/40 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#61cc70] uppercase tracking-wider">
                  Final Solution:
                </span>
                <div
                  className="text-white font-mono text-xl font-bold"
                  dangerouslySetInnerHTML={renderKatex(data.finalAnswer)}
                />
                {data.decimalAnswer && (
                  <div className="text-neutral-400 text-xs font-mono">
                    Decimal approx: {data.decimalAnswer}
                  </div>
                )}
              </div>

              {/* Steps List */}
              {data.steps && data.steps.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Detailed Step-by-Step Breakdown:</span>
                  </div>

                  <div className="space-y-2.5">
                    {data.steps.map((st) => (
                      <div
                        key={st.stepNumber}
                        className="p-3 rounded-xl bg-[#141416] border border-neutral-800 text-xs flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="text-amber-300 font-semibold text-sm">
                          Step {st.stepNumber}: {st.explanation}
                        </div>
                        <div
                          className="text-white font-mono py-1.5 px-3 bg-[#000000] border border-neutral-800/80 rounded-lg overflow-x-auto text-sm"
                          dangerouslySetInnerHTML={renderKatex(st.latex)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
