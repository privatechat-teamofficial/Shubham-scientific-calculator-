import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Sliders,
} from 'lucide-react';

interface KeypadProps {
  isShift: boolean;
  isAlpha: boolean;
  onToggleShift: () => void;
  onToggleAlpha: () => void;
  onKeyPress: (action: string, meta?: any) => void;
  onCursorMove: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  onOpenOption: () => void;
  onTurnOn?: () => void;
}

let sharedAudioCtx: AudioContext | null = null;

// Physical device haptic vibration feedback only (no audio tap/click sound)
const playVibration = () => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(22); // Responsive 22ms haptic pulse
    }
  } catch {
    // Ignore unsupported vibration
  }
};

export const Keypad: React.FC<KeypadProps> = ({
  isShift,
  isAlpha,
  onToggleShift,
  onToggleAlpha,
  onKeyPress,
  onCursorMove,
  onOpenMenu,
  onOpenSettings,
  onOpenOption,
  onTurnOn,
}) => {
  const handleKey = (action: string, meta?: any) => {
    playVibration();
    onKeyPress(action, meta);
  };

  // Dynamic class generator for Shift (golden) labels:
  // When Shift is ON: golden labels are prominent, vibrant & highlighted
  // When Alpha is ON: golden labels are completely faded out
  // In normal state: golden labels appear in default golden tone
  // Increased size for enhanced readability across all screens
  const getShiftLabelClass = (hasText: boolean) => {
    if (!hasText) return "opacity-0 pointer-events-none select-none";
    if (isShift) {
      return "text-amber-300 font-black text-[11px] sm:text-[12.5px] scale-105 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] transition-all duration-200 inline-block";
    }
    if (isAlpha) {
      return "opacity-0 pointer-events-none select-none text-[11px] sm:text-[12.5px] transition-all duration-200 inline-block";
    }
    return "text-[#de982a] opacity-100 font-extrabold text-[11px] sm:text-[12.5px] transition-all duration-200 inline-block";
  };

  // Dynamic class generator for Alpha (green) labels:
  // When Alpha is ON: green labels are prominent, vibrant & highlighted
  // When Shift is ON: green labels are completely faded out
  // In normal state: green labels appear in default green tone
  const getAlphaLabelClass = (hasText: boolean) => {
    if (!hasText) return "opacity-0 pointer-events-none select-none";
    if (isAlpha) {
      return "text-[#7adf8c] font-black text-[10.5px] sm:text-[11.5px] scale-105 drop-shadow-[0_0_8px_rgba(122,223,140,0.85)] transition-all duration-200 inline-block";
    }
    if (isShift) {
      return "opacity-0 pointer-events-none select-none text-[10.5px] sm:text-[11.5px] transition-all duration-200 inline-block";
    }
    return "text-[#7adf8c] opacity-100 font-bold text-[10.5px] sm:text-[11.5px] transition-all duration-200 inline-block";
  };

  // Dynamic class generator for keypad buttons:
  // When Shift is ON: buttons with a Shift action show an amber guide ring and stay clickable,
  // while non-shift keys fade to 20% opacity.
  // When Alpha is ON: buttons with an Alpha action show an emerald guide ring,
  // while non-alpha keys fade to 20% opacity.
  // In normal state: buttons have 100% full opacity.
  const getKeyBtnClass = (hasShift: boolean, hasAlpha: boolean) => {
    if (isShift) {
      if (hasShift) {
        return "opacity-45 ring-1 ring-amber-400/50 hover:opacity-100 hover:ring-amber-300 transition-all duration-200";
      }
      return "opacity-20 transition-all duration-200";
    }
    if (isAlpha) {
      if (hasAlpha) {
        return "opacity-45 ring-1 ring-emerald-400/50 hover:opacity-100 hover:ring-emerald-300 transition-all duration-200";
      }
      return "opacity-20 transition-all duration-200";
    }
    return "opacity-100 transition-all duration-200";
  };

  // Reusable key label header with consistent height and alignment
  const KeyHeader: React.FC<{ shift?: string; alpha?: string; px?: string }> = ({ shift, alpha, px = "px-0.5" }) => (
    <div className={`h-3.5 sm:h-4 flex items-center justify-between w-full ${px} leading-none mb-0.5 truncate`}>
      <span className={getShiftLabelClass(Boolean(shift))}>{shift || ''}</span>
      <span className={getAlphaLabelClass(Boolean(alpha))}>{alpha || ''}</span>
    </div>
  );

  return (
    <div className="w-full bg-[#000000] px-0 py-1 select-none flex flex-col gap-1.5 font-oryno-bold">
      {/* ============================================================== */}
      {/* ROW 1: SHIFT, ALPHA, LARGE D-PAD, MENU, SETUP                  */}
      {/* ============================================================== */}
      <div className="flex items-end justify-between gap-1 sm:gap-1.5 font-oryno-bold">
        {/* Left Side: SHIFT & ALPHA */}
        <div className="flex-1 grid grid-cols-2 gap-1 sm:gap-1.5">
          {/* SHIFT */}
          <div className="flex flex-col items-center">
            <div className="h-3.5 sm:h-4 flex items-center justify-center mb-0.5 opacity-0 pointer-events-none select-none">
              <span className="text-[11px] sm:text-[12.5px] leading-none">-</span>
            </div>
            <button
              id="key-shift"
              onClick={() => {
                playVibration();
                onToggleShift();
              }}
              className={`w-full h-10 sm:h-11 rounded-[10px] font-oryno-bold font-black text-base sm:text-lg tracking-wider transition-all shadow-xs active:scale-95 ${
                isShift 
                  ? 'bg-[#de982a] text-black ring-2 ring-amber-300 opacity-100 scale-[1.02]' 
                  : isAlpha
                    ? 'bg-[#1f2937] text-[#de982a] opacity-25 hover:bg-[#283548]'
                    : 'bg-[#1f2937] text-[#de982a] hover:bg-[#283548] opacity-100'
              }`}
            >
              SHIFT
            </button>
          </div>

          {/* ALPHA */}
          <div className="flex flex-col items-center">
            <div className="h-3.5 sm:h-4 flex items-center justify-center mb-0.5 opacity-0 pointer-events-none select-none">
              <span className="text-[11px] sm:text-[12.5px] leading-none">-</span>
            </div>
            <button
              id="key-alpha"
              onClick={() => {
                playVibration();
                onToggleAlpha();
              }}
              className={`w-full h-10 sm:h-11 rounded-[10px] font-oryno-bold font-black text-[13.5px] sm:text-[15.5px] tracking-normal transition-all shadow-xs active:scale-95 ${
                isAlpha 
                  ? 'bg-[#7adf8c] text-black ring-2 ring-emerald-300 opacity-100 scale-[1.02]' 
                  : isShift
                    ? 'bg-[#1f2937] text-[#7adf8c] opacity-25 hover:bg-[#283548]'
                    : 'bg-[#1f2937] text-[#7adf8c] hover:bg-[#283548] opacity-100'
              }`}
            >
              ALPHA
            </button>
          </div>
        </div>

        {/* Center: Large Ergonomic D-PAD with Big Arrows & Generous Tap Targets */}
        <div className="shrink-0 flex justify-center items-center px-0.5">
          <div className={`relative w-[114px] h-[74px] sm:w-[124px] sm:h-[78px] rounded-[28px] sm:rounded-[32px] bg-[#1e2736] border-2 border-[#334155] shadow-md shadow-black/40 flex items-center justify-center transition-all duration-200 ${
            isShift || isAlpha ? 'opacity-35' : 'opacity-100'
          }`}>
            {/* Up Arrow - shifted outward towards top edge so Chevron sits centered in the top segment */}
            <button
              id="dpad-up"
              onClick={() => { playVibration(); onCursorMove('up'); }}
              title="History Up / Cursor Up"
              className="absolute top-0 sm:top-0.5 left-1/2 -translate-x-1/2 w-14 h-7.5 flex items-center justify-center text-slate-200 hover:text-amber-400 active:text-amber-300 active:scale-95 transition-all rounded-t-[28px] sm:rounded-t-[32px]"
            >
              <ChevronUp className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.5} />
            </button>

            {/* Down Arrow - shifted outward towards bottom edge so Chevron sits centered in the bottom segment */}
            <button
              id="dpad-down"
              onClick={() => { playVibration(); onCursorMove('down'); }}
              title="History Down / Cursor Down"
              className="absolute bottom-0 sm:bottom-0.5 left-1/2 -translate-x-1/2 w-14 h-7.5 flex items-center justify-center text-slate-200 hover:text-amber-400 active:text-amber-300 active:scale-95 transition-all rounded-b-[28px] sm:rounded-b-[32px]"
            >
              <ChevronDown className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.5} />
            </button>

            {/* Left Arrow */}
            <button
              id="dpad-left"
              onClick={() => { playVibration(); onCursorMove('left'); }}
              title="Cursor Left"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-12 flex items-center justify-center text-slate-200 hover:text-amber-400 active:text-amber-300 active:scale-95 transition-all rounded-l-[24px]"
            >
              <ChevronLeft className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.5} />
            </button>

            {/* Right Arrow */}
            <button
              id="dpad-right"
              onClick={() => { playVibration(); onCursorMove('right'); }}
              title="Cursor Right"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-12 flex items-center justify-center text-slate-200 hover:text-amber-400 active:text-amber-300 active:scale-95 transition-all rounded-r-[24px]"
            >
              <ChevronRight className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.5} />
            </button>

            {/* Center OK / Execute Button */}
            <button
              id="dpad-center"
              onClick={() => handleKey('=')}
              title="Calculate (=)"
              className="w-7 h-6 sm:w-8 sm:h-7 rounded-[9px] sm:rounded-[10px] bg-[#111827] hover:bg-[#162032] active:bg-amber-500/20 border border-slate-600 active:scale-95 transition-all shadow-inner flex items-center justify-center text-[10px] text-slate-400"
            />
          </div>
        </div>

        {/* Right Side: MENU & SETUP */}
        <div className="flex-1 grid grid-cols-2 gap-1 sm:gap-1.5">
          {/* MENU */}
          <div className="flex flex-col items-center">
            <div className="h-3.5 sm:h-4 flex items-center justify-center mb-0.5 opacity-0 pointer-events-none select-none">
              <span className="text-[11px] sm:text-[12.5px] leading-none">-</span>
            </div>
            <button
              id="key-menu"
              onClick={() => { playVibration(); onOpenMenu(); }}
              className={`w-full h-10 sm:h-11 rounded-[10px] font-oryno-bold font-extrabold text-base sm:text-lg tracking-wider bg-[#1f2937] text-white hover:bg-[#283548] active:scale-95 transition-all shadow-xs flex items-center justify-center ${
                isShift || isAlpha ? 'opacity-20' : 'opacity-100'
              }`}
            >
              MENU
            </button>
          </div>

          {/* SETUP / SLIDERS ICON */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="SETUP" px="px-1" />
            <button
              id="key-setup"
              onClick={() => {
                playVibration();
                if (isShift) {
                  onToggleShift();
                  onOpenSettings();
                } else {
                  onOpenSettings();
                }
              }}
              title="Settings & Options"
              className={`w-full h-10 sm:h-11 rounded-[10px] bg-[#1f2937] text-white hover:bg-[#283548] active:scale-95 transition-all shadow-xs flex items-center justify-center relative font-oryno-bold ${getKeyBtnClass(true, false)}`}
            >
              <Sliders className="w-5 h-5" strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: OPTN, CALC, ∫dx, x                                      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 font-oryno-bold">
        {/* OPTN */}
        <div className="flex flex-col items-center">
          <KeyHeader px="px-1" />
          <button
            id="key-optn"
            onClick={() => { playVibration(); onOpenOption(); }}
            className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base tracking-wider hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(false, false)}`}
          >
            OPTN
          </button>
        </div>

        {/* CALC / SOLVE */}
        <div className="flex flex-col items-center">
          <KeyHeader shift="SOLVE" alpha="=" px="px-1" />
          <button
            id="key-calc"
            onClick={() => handleKey('CALC')}
            className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base tracking-wider hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
          >
            CALC
          </button>
        </div>

        {/* ∫▫dx (Integral / d/dx) */}
        <div className="flex flex-col items-center">
          <KeyHeader shift="d/dx" alpha=":" px="px-1" />
          <button
            id="key-integral"
            onClick={() => handleKey('INTEGRAL')}
            className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs flex items-center justify-center ${getKeyBtnClass(true, true)}`}
          >
            <span>∫▫dx</span>
          </button>
        </div>

        {/* x (Variable / Σ / Π) */}
        <div className="flex flex-col items-center">
          <KeyHeader shift="∑" alpha="∏" px="px-1" />
          <button
            id="key-var-x"
            onClick={() => handleKey('x')}
            className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
          >
            x
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCIENTIFIC FUNCTION GRID: 6 columns x 3 rows (ROWS 3 to 5)     */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-1 sm:gap-1.5 font-oryno-bold">
        {/* ROW 3: [■/□] [√▫] [x²] [x^▫] [log_▫] [ln] */}
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
          {/* Fraction */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="a b/c" alpha="÷R" />
            <button
              id="key-fraction"
              onClick={() => handleKey('FRAC')}
              title="Fraction (numerator / denominator)"
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white hover:bg-[#283548] active:scale-95 transition-all shadow-xs flex items-center justify-center ${getKeyBtnClass(true, true)}`}
            >
              <div className="flex flex-col items-center justify-center leading-none py-0.5 pointer-events-none">
                <span className="w-3 sm:w-3.5 h-2 sm:h-2.5 border-[1.5px] border-white/95 bg-white/40 rounded-[1px]"></span>
                <span className="w-4.5 sm:w-5.5 h-[1.5px] bg-white my-[1.5px] rounded-full"></span>
                <span className="w-3 sm:w-3.5 h-2 sm:h-2.5 border-[1.5px] border-white/95 rounded-[1px]"></span>
              </div>
            </button>
          </div>

          {/* Sqrt */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="³√▫" />
            <button
              id="key-sqrt"
              onClick={() => handleKey('SQRT')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              √▫
            </button>
          </div>

          {/* x² */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="x³" alpha="mod" />
            <button
              id="key-x-squared"
              onClick={() => handleKey('X_SQUARE')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold italic text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              x²
            </button>
          </div>

          {/* x^▫ */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="ⁿ√▫" />
            <button
              id="key-x-power"
              onClick={() => handleKey('X_POWER')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold italic text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              x^▫
            </button>
          </div>

          {/* log_▫ */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="10^▫" alpha="cot" />
            <button
              id="key-log-base"
              onClick={() => handleKey('LOG_BASE')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              log▫
            </button>
          </div>

          {/* ln */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="e^▫" />
            <button
              id="key-ln"
              onClick={() => handleKey('LN')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              ln
            </button>
          </div>
        </div>

        {/* ROW 4: [(-)] [° ' "] [x⁻¹] [sin] [cos] [tan] */}
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 font-oryno-bold">
          {/* (-) / log / A */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="log" alpha="A" />
            <button
              id="key-negate"
              onClick={() => handleKey('NEG')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              (-)
            </button>
          </div>

          {/* ° ' " / FACT / B */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="FACT" alpha="B" />
            <button
              id="key-dms"
              onClick={() => handleKey('DMS')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg tracking-wide hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              ° ' "
            </button>
          </div>

          {/* x⁻¹ / x! / C */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="x!" alpha="C" />
            <button
              id="key-inverse"
              onClick={() => handleKey('INV')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold italic text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              x⁻¹
            </button>
          </div>

          {/* sin / sin⁻¹ / D */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="sin⁻¹" alpha="D" />
            <button
              id="key-sin"
              onClick={() => handleKey('SIN')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              sin
            </button>
          </div>

          {/* cos / cos⁻¹ / E */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="cos⁻¹" alpha="E" />
            <button
              id="key-cos"
              onClick={() => handleKey('COS')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              cos
            </button>
          </div>

          {/* tan / tan⁻¹ / F */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="tan⁻¹" alpha="F" />
            <button
              id="key-tan"
              onClick={() => handleKey('TAN')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              tan
            </button>
          </div>
        </div>

        {/* ROW 5: [STO] [ENG] [(] [)] [S<=>D] [M+] */}
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 font-oryno-bold">
          {/* STO / RECALL / ∠ */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="RCL" alpha="∠" />
            <button
              id="key-sto"
              onClick={() => handleKey('STO')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              STO
            </button>
          </div>

          {/* ENG / ← / i */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="←" alpha="i" />
            <button
              id="key-eng"
              onClick={() => handleKey('ENG')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              ENG
            </button>
          </div>

          {/* ( / Abs */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="Abs" />
            <button
              id="key-open-paren"
              onClick={() => handleKey('(')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-xl sm:text-2xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              (
            </button>
          </div>

          {/* ) / , / X */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="," alpha="x" />
            <button
              id="key-close-paren"
              onClick={() => handleKey(')')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-xl sm:text-2xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              )
            </button>
          </div>

          {/* S<=>D / a b/c <=> d/c / Y */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="⇄" alpha="y" />
            <button
              id="key-sd"
              onClick={() => handleKey('S_D')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              S⇔D
            </button>
          </div>

          {/* M+ / M- / M */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="M-" alpha="M" />
            <button
              id="key-m-plus"
              onClick={() => handleKey('M+')}
              className={`w-full h-9 sm:h-10 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              M+
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* NUMERIC KEYPAD & OPERATORS: 5 columns x 4 rows                 */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-1 sm:gap-1.5 pt-0.5 font-oryno-bold">
        {/* Row 6: [7] [8] [9] [DEL] [AC] */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {/* 7 / CONST */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="CONST" px="px-1" />
            <button
              id="key-7"
              onClick={() => handleKey('7')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              7
            </button>
          </div>

          {/* 8 / CONV */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="CONV" px="px-1" />
            <button
              id="key-8"
              onClick={() => handleKey('8')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              8
            </button>
          </div>

          {/* 9 / Limit / ∞ */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="Limit" alpha="∞" px="px-1" />
            <button
              id="key-9"
              onClick={() => handleKey('9')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              9
            </button>
          </div>

          {/* DEL (Coral-red) / INS */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="INS" px="px-1" />
            <button
              id="key-del"
              onClick={() => handleKey('DEL')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#ef4444] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#dc2626] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              DEL
            </button>
          </div>

          {/* AC (Bright Red) / OFF */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="OFF" alpha="CLRv" px="px-1" />
            <button
              id="key-ac"
              onClick={() => handleKey('AC')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#dc2626] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#b91c1c] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              AC
            </button>
          </div>
        </div>

        {/* Row 7: [4] [5] [6] [×] [÷] */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {/* 4 / MATRIX */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="MATRIX" px="px-1" />
            <button
              id="key-4"
              onClick={() => handleKey('4')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              4
            </button>
          </div>

          {/* 5 / VECTOR */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="VECTOR" px="px-1" />
            <button
              id="key-5"
              onClick={() => handleKey('5')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              5
            </button>
          </div>

          {/* 6 */}
          <div className="flex flex-col items-center">
            <KeyHeader px="px-1" />
            <button
              id="key-6"
              onClick={() => handleKey('6')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(false, false)}`}
            >
              6
            </button>
          </div>

          {/* × / nPr / GCD */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="nPr" alpha="GCD" px="px-1" />
            <button
              id="key-multiply"
              onClick={() => handleKey('*')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              ×
            </button>
          </div>

          {/* ÷ / nCr / LCM */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="nCr" alpha="LCM" px="px-1" />
            <button
              id="key-divide"
              onClick={() => handleKey('/')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              ÷
            </button>
          </div>
        </div>

        {/* Row 8: [1] [2] [3] [+] [−] */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {/* 1 / STAT */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="STAT" px="px-1" />
            <button
              id="key-1"
              onClick={() => handleKey('1')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              1
            </button>
          </div>

          {/* 2 / CMPLX */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="CMPLX" px="px-1" />
            <button
              id="key-2"
              onClick={() => handleKey('2')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              2
            </button>
          </div>

          {/* 3 / BASE-N */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="BASE" px="px-1" />
            <button
              id="key-3"
              onClick={() => handleKey('3')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, false)}`}
            >
              3
            </button>
          </div>

          {/* + / Pol / Ceil */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="Pol" alpha="Ceil" px="px-1" />
            <button
              id="key-plus"
              onClick={() => handleKey('+')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              +
            </button>
          </div>

          {/* − / Rec / Floor */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="Rec" alpha="Floor" px="px-1" />
            <button
              id="key-minus"
              onClick={() => handleKey('-')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              −
            </button>
          </div>
        </div>

        {/* Row 9: [0] [•] [×10ˣ] [Ans] [=] */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {/* 0 */}
          <div className="flex flex-col items-center">
            <KeyHeader px="px-1" />
            <button
              id="key-0"
              onClick={() => handleKey('0')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold text-2xl sm:text-3xl hover:bg-[#323236] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(false, false)}`}
            >
              0
            </button>
          </div>

          {/* . / Ran# / RanInt */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="Ran#" alpha="RanInt" px="px-1" />
            <button
              id="key-dot"
              onClick={() => handleKey('.')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#27272a] text-white font-oryno-bold font-bold hover:bg-[#323236] active:scale-95 transition-all shadow-xs flex items-center justify-center ${getKeyBtnClass(true, true)}`}
            >
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white inline-block"></span>
            </button>
          </div>

          {/* ×10ˣ / π / e */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="π" alpha="e" px="px-1" />
            <button
              id="key-exp"
              onClick={() => handleKey('EXP')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-sm sm:text-base hover:bg-[#283548] active:scale-95 transition-all shadow-xs tracking-tight ${getKeyBtnClass(true, true)}`}
            >
              ×10ˣ
            </button>
          </div>

          {/* Ans / % / PreAns */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="%" alpha="PreAns" px="px-1" />
            <button
              id="key-ans"
              onClick={() => handleKey('Ans')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#1f2937] text-white font-oryno-bold font-bold text-base sm:text-lg hover:bg-[#283548] active:scale-95 transition-all shadow-xs ${getKeyBtnClass(true, true)}`}
            >
              Ans
            </button>
          </div>

          {/* = (Vibrant Green: #61cc70) */}
          <div className="flex flex-col items-center">
            <KeyHeader shift="≈" px="px-1" />
            <button
              id="key-equals"
              onClick={() => handleKey('=')}
              className={`w-full h-10 sm:h-11 rounded-lg bg-[#61cc70] text-white font-bold text-3xl sm:text-4xl hover:bg-[#50a65c] active:scale-95 transition-all shadow-xs flex items-center justify-center font-oryno-bold ${getKeyBtnClass(true, false)}`}
            >
              =
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
