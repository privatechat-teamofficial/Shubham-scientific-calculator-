import React from 'react';
import { EvaluationResult } from '../../lib/mathEngine';

interface ResultViewProps {
  result: EvaluationResult | null;
  displayMode: 'EXACT' | 'DECIMAL';
  fontSize?: number;
  onToggleDisplayMode?: () => void;
}

// Helper to convert any raw LaTeX escape sequences to clean unicode representation
const cleanLatexToUnicode = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\\sqrt(\d+)/g, '√$1')
    .replace(/\\pi/g, 'π')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\cdot/g, '·')
    .replace(/\\/g, '')
    .trim();
};

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  displayMode = 'EXACT',
  fontSize = 20,
}) => {
  if (!result) return null;

  if (result.isError) {
    return (
      <div className="flex flex-col items-end justify-center font-oryno-bold select-text text-right">
        <span className="text-red-700 font-bold tracking-wider text-base sm:text-lg">
          {cleanLatexToUnicode(result.exact)}
        </span>
      </div>
    );
  }

  // Check if exact result is a fraction (e.g. "√2/2" or "3/4" or "\frac{...}{...}")
  let fractionParts: { n: string; d: string } | null = null;
  if (displayMode !== 'DECIMAL' && result.exact && result.exact.includes('/') && !result.exact.startsWith('\\')) {
    const slashIdx = result.exact.indexOf('/');
    const n = cleanLatexToUnicode(result.exact.substring(0, slashIdx));
    const d = cleanLatexToUnicode(result.exact.substring(slashIdx + 1));
    if (n && d) {
      fractionParts = { n, d };
    }
  } else if (displayMode !== 'DECIMAL' && result.latex && result.latex.includes('\\frac{')) {
    const match = result.latex.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
    if (match) {
      fractionParts = { 
        n: cleanLatexToUnicode(match[1]), 
        d: cleanLatexToUnicode(match[2]) 
      };
    }
  }

  // Format output text cleanly without 3-digit grouping
  const formatOutput = (numStr: string) => {
    if (!numStr) return '';
    return cleanLatexToUnicode(numStr);
  };

  const displayText = displayMode === 'DECIMAL' 
    ? (result.decimal || cleanLatexToUnicode(result.exact)) 
    : cleanLatexToUnicode(result.exact);

  const showDecimalUnderneath = displayMode !== 'DECIMAL' && fractionParts && result.decimal && result.decimal !== result.exact;

  return (
    <div className="flex flex-col items-end justify-center font-oryno-bold select-text text-right text-[#0f172a] transition-all">
      {/* Rational Fraction Output */}
      {fractionParts ? (
        <div className="flex flex-col items-center justify-center font-bold">
          {/* Numerator */}
          <span 
            className="leading-none px-0.5 font-oryno-bold"
            style={{ fontSize: `${fontSize}px`, paddingBottom: '2px' }}
          >
            {formatOutput(fractionParts.n)}
          </span>
          {/* Fraction Bar */}
          <div className="w-full h-[1.75px] bg-[#0f172a] my-0 min-w-[16px] rounded-full" />
          {/* Denominator */}
          <span 
            className="leading-none px-0.5 font-oryno-bold"
            style={{ fontSize: `${fontSize}px`, paddingTop: '2px' }}
          >
            {formatOutput(fractionParts.d)}
          </span>
        </div>
      ) : (
        /* Standard Single Result Output */
        <span 
          className="font-bold leading-none select-text"
          style={{ fontSize: `${fontSize}px` }}
        >
          {formatOutput(displayText)}
        </span>
      )}

      {/* Approximate Decimal representation underneath only when in exact fraction mode */}
      {showDecimalUnderneath && (
        <div 
          className="flex items-center gap-1 text-[#334155] font-semibold tracking-tight pt-1 leading-none select-text"
          style={{ fontSize: `${Math.max(fontSize * 0.72, 13)}px` }}
        >
          <span className="text-slate-500 font-normal">=</span>
          <span>{formatOutput(result.decimal)}</span>
        </div>
      )}
    </div>
  );
};
