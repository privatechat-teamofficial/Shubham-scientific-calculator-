import React, { useRef, useEffect } from 'react';
import { CursorPath, MathSequence } from '../lib/ast/types';
import { MathRenderer } from './MathEditor/MathRenderer';
import { ResultView } from './MathEditor/ResultView';
import { EvaluationResult } from '../lib/mathEngine';
import { MoreVertical } from 'lucide-react';

interface NaturalDisplayProps {
  ast: MathSequence;
  cursor: CursorPath;
  onSetCursor: (path: CursorPath) => void;
  result: EvaluationResult | null;
  displayMode: 'EXACT' | 'DECIMAL';
  onToggleDisplayMode: () => void;
  onOpenStepSolver: () => void;
  fontSize: number; // in px
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const NaturalDisplay: React.FC<NaturalDisplayProps> = ({
  ast,
  cursor,
  onSetCursor,
  result,
  displayMode,
  onToggleDisplayMode,
  onOpenStepSolver,
  fontSize = 26,
  onKeyDown,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = ast.length === 0;

  // Keep focus on hidden input for hardware keyboard input
  const handleContainerClick = () => {
    hiddenInputRef.current?.focus();
  };

  return (
    <div className="w-full px-2.5 pt-2 pb-1 select-none bg-[#000000] shrink-0">
      {/* Screen container strictly locked to exact 210px screenshot dimensions with zero movement */}
      <div 
        ref={containerRef}
        tabIndex={0}
        onClick={handleContainerClick}
        onKeyDown={onKeyDown}
        className="w-full relative flex-1 min-h-[140px] max-h-[220px] bg-[#eaf0e2] text-[#1c281d] flex flex-col justify-between p-3.5 sm:p-4 rounded-[14px] border border-[#d3ddcc] shadow-inner font-oryno-bold overflow-hidden outline-none"
        style={{
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        {/* Hidden input to handle desktop/mobile keyboard events */}
        <input
          ref={hiddenInputRef}
          type="text"
          className="sr-only"
          aria-label="Calculator input"
          readOnly
        />

        {/* Top Right Options Menu (Fixed absolute position so it never affects layout or causes shifting) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenStepSolver();
          }} 
          className="absolute top-3 right-3 text-[#657662] hover:text-[#1c281d] active:scale-95 p-1 rounded-lg z-20"
          title="Math Expression Options & Step Solver"
        >
          <MoreVertical className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Top Expression Area (Permanently locked height; zero vertical movement when typing) */}
        <div className="w-full flex-1 flex flex-col justify-start z-10 min-h-0 overflow-y-hidden font-oryno-bold pt-0.5">
          {/* Mathematical Expression with custom horizontal-only scroll */}
          <div className="math-scroll-container w-full flex-1 flex items-start overflow-x-auto overflow-y-hidden pr-8 py-0.5">
            <div className="flex items-center min-w-0 pr-1">
              <MathRenderer
                sequence={ast}
                cursor={cursor}
                onSetCursor={onSetCursor}
                fontSize={fontSize}
              />
              {isEmpty && (
                <span 
                  className="text-[#657662]/60 text-[13px] sm:text-[14px] font-oryno-bold font-bold italic select-none ml-0.5 cursor-pointer pointer-events-none"
                >
                  Enter math: x² - 3x + 1 = 0...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Area: Permanent Fixed Height Result Bar (Always allocated so top area never moves when results appear) */}
        <div className="w-full h-[76px] flex items-end justify-end z-10 shrink-0">
          {result && (
            <div className="max-w-full overflow-x-auto flex justify-end items-end pb-0.5">
              <ResultView
                result={result}
                displayMode={displayMode}
                fontSize={fontSize}
                onToggleDisplayMode={onToggleDisplayMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
