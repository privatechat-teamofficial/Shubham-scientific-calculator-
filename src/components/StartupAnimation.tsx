import React, { useEffect, useState } from 'react';

interface StartupAnimationProps {
  onComplete: () => void;
  brandTitle?: string;
}

const MATH_CHARS = [
  'I', '+', 'π', '±', '×', 'Δ', 'Σ', '=', '∈', '∫',
  '√', 'θ', 'λ', 'φ', '∂', '∞', '≈', '≠', '≤', '≥', '∏', 'µ', 'Ω'
];

export const StartupAnimation: React.FC<StartupAnimationProps> = ({
  onComplete,
  brandTitle = 'SHUBHAM SCIENTIFIC CALCULATOR',
}) => {
  const targetWord = 'INITIALISING';
  const totalLength = 12; // Total length of prompt display
  const [fixedLettersCount, setFixedLettersCount] = useState(0);
  const [scrambleChars, setScrambleChars] = useState<string[]>([]);
  const [bracketChar, setBracketChar] = useState('∂');
  const [isFading, setIsFading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Progressive letter lock-in effect with moving symbols for remaining characters:
  // e.g. "I" + rest moving -> "IN" + rest moving -> "INI" + rest moving ... up to "INITIALISING"
  useEffect(() => {
    // Fade in on mount
    const startTimer = setTimeout(() => setHasStarted(true), 25);

    // Continuous scrambler for the remaining positions
    const scrambleInterval = setInterval(() => {
      setScrambleChars(() => {
        return Array.from({ length: totalLength }, () => 
          MATH_CHARS[Math.floor(Math.random() * MATH_CHARS.length)]
        );
      });
      const bracketSymbols = ['∂', '≤', '■', '▫', '∆', '•', '∫'];
      setBracketChar(bracketSymbols[Math.floor(Math.random() * bracketSymbols.length)]);
    }, 55);

    // Letter-by-letter lock-in step
    let letterIndex = 0;
    const stepInterval = setInterval(() => {
      letterIndex++;
      setFixedLettersCount(letterIndex);

      if (letterIndex >= targetWord.length) {
        clearInterval(stepInterval);
        // Pause briefly on complete "INITIALISING" before fading out
        setTimeout(() => {
          clearInterval(scrambleInterval);
          setIsFading(true);
          setTimeout(() => {
            onComplete();
          }, 400);
        }, 500);
      }
    }, 110);

    return () => {
      clearTimeout(startTimer);
      clearInterval(scrambleInterval);
      clearInterval(stepInterval);
    };
  }, [onComplete, targetWord.length]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(onComplete, 200);
  };

  // Construct the display string: locked letters + moving randomized symbols
  const renderedPrompt = () => {
    const lockedPart = targetWord.slice(0, fixedLettersCount);
    const remainingCount = Math.max(0, totalLength - fixedLettersCount);
    const movingPart = scrambleChars.slice(0, remainingCount).join('');
    return `${lockedPart}${movingPart}`;
  };

  return (
    <div 
      onClick={handleSkip}
      title="Tap anywhere to skip"
      className={`fixed inset-0 z-50 bg-[#000000] text-slate-100 flex flex-col items-center justify-center select-none transition-all duration-400 cursor-pointer ${
        isFading 
          ? 'opacity-0 scale-[1.02] pointer-events-none' 
          : hasStarted 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-98'
      }`}
    >
      <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center space-y-6">
        {/* Brand header: older layout with same font-oryno-bold as the calculator */}
        <div className="text-slate-200 text-[14px] sm:text-[16px] tracking-widest uppercase font-oryno-bold font-bold drop-shadow-sm">
          {brandTitle}
        </div>

        {/* Dynamic prompt: reduced initializing font size a bit as requested */}
        <div className="text-[#68d391] text-base sm:text-lg font-mono tracking-wider font-semibold min-h-[34px] flex items-center justify-center bg-black/60 px-3.5 py-1.5 rounded-lg border border-emerald-500/25 shadow-[0_0_20px_rgba(104,211,145,0.15)]">
          <span>
            &gt; {renderedPrompt()}
            <span className="text-emerald-400 inline-block animate-pulse ml-1 font-bold">_</span>
          </span>
        </div>

        {/* Dynamic bracket accent [ ∂ ] or [ ≤ ] or [ ■ ] */}
        <div className="text-slate-400 text-sm sm:text-base font-mono tracking-widest">
          [ <span className="text-[#a0aec0] mx-2 inline-block font-bold">{bracketChar}</span> ]
        </div>
      </div>
    </div>
  );
};
