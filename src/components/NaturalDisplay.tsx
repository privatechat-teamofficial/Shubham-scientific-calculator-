import React, { useRef, useEffect } from 'react';
import { CursorPath, MathSequence } from '../lib/ast/types';
import { MathRenderer } from './MathEditor/MathRenderer';
import { ResultView } from './MathEditor/ResultView';
import { EvaluationResult } from '../lib/mathEngine';

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
  fontSize = 26,
  onKeyDown,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = ast.length === 0;

  // Auto-scroll horizontally & vertically to always keep the active cursor and newly entered text in view
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const cursorEl = container.querySelector('[data-math-cursor="true"]') as HTMLElement | null;
      if (!cursorEl) return;

      const containerRect = container.getBoundingClientRect();
      const cursorRect = cursorEl.getBoundingClientRect();

      // Horizontal auto-scroll with comfortable margin
      const diffRight = cursorRect.right - (containerRect.right - 28);
      if (diffRight > 0) {
        container.scrollLeft += diffRight;
      } else {
        const diffLeft = (containerRect.left + 28) - cursorRect.left;
        if (diffLeft > 0) {
          container.scrollLeft -= diffLeft;
        }
      }

      // Vertical auto-scroll for tall nested structures (fractions, exponents)
      const diffBottom = cursorRect.bottom - (containerRect.bottom - 10);
      if (diffBottom > 0) {
        container.scrollTop += diffBottom;
      } else {
        const diffTop = (containerRect.top + 10) - cursorRect.top;
        if (diffTop > 0) {
          container.scrollTop -= diffTop;
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [ast, cursor, fontSize]);

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
        className="w-full relative h-[210px] min-h-[210px] max-h-[210px] bg-[#eaf0e2] text-[#1c281d] flex flex-col justify-between p-3.5 rounded-[14px] border border-[#d3ddcc] shadow-inner font-oryno-bold overflow-hidden outline-none shrink-0"
        style={{
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.2)',
          height: '210px',
          minHeight: '210px',
          maxHeight: '210px',
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

        {/* Top Expression Area (Locked height container with internal multi-directional scroll) */}
        <div className="w-full flex-1 flex flex-col justify-start z-10 min-h-0 overflow-hidden font-oryno-bold pt-0.5">
          {/* Mathematical Expression with smooth horizontal & vertical scroll */}
          <div 
            ref={scrollContainerRef}
            className="math-scroll-container w-full flex-1 overflow-x-auto overflow-y-auto pr-3 py-0.5 scroll-smooth"
          >
            <div className="flex items-center min-w-0 pr-1">
              <MathRenderer
                sequence={ast}
                cursor={cursor}
                onSetCursor={onSetCursor}
                fontSize={fontSize}
              />
              {isEmpty && (
                <span 
                  className="text-[#657662]/60 text-[14px] font-oryno-bold font-bold italic select-none ml-1 cursor-pointer pointer-events-none -translate-y-[2.5px] leading-none"
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
            <div 
              className="max-w-full overflow-x-auto scrollbar-none flex justify-end items-end pb-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
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
