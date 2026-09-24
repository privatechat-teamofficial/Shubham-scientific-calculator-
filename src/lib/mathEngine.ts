import * as math from 'mathjs';
import { AngleUnit, VariableMap } from '../types';

// Default initial variables
export const initialVariables: VariableMap = {
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  X: 0,
  Y: 0,
  M: 0,
  Ans: 0,
};

/**
 * Converts a decimal number to an exact fraction string if rational
 */
export function decimalToFraction(val: number, maxDenominator = 10000): { n: number; d: number } | null {
  if (!isFinite(val) || isNaN(val)) return null;
  // If it's already an integer
  if (Math.abs(val - Math.round(val)) < 1e-10) {
    return { n: Math.round(val), d: 1 };
  }

  // Continued fraction expansion
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = val;
  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(val - h1 / k1) > val * 1e-10 && k1 <= maxDenominator && isFinite(b));

  if (k1 <= maxDenominator && Math.abs(val - h1 / k1) < 1e-7) {
    return { n: h1, d: k1 };
  }
  return null;
}

/**
 * Format exact radical representation for standard angles/squares if possible
 */
export function formatExactSpecialValues(val: number): string | null {
  const eps = 1e-9;
  // Check common sqrt multiples: sqrt(2)/2, sqrt(3)/2, sqrt(3), 1/sqrt(3), etc.
  const specials: Array<{ value: number; latex: string; text: string }> = [
    { value: Math.SQRT2 / 2, latex: '\\frac{\\sqrt{2}}{2}', text: '√2/2' },
    { value: -Math.SQRT2 / 2, latex: '-\\frac{\\sqrt{2}}{2}', text: '-√2/2' },
    { value: Math.sqrt(3) / 2, latex: '\\frac{\\sqrt{3}}{2}', text: '√3/2' },
    { value: -Math.sqrt(3) / 2, latex: '-\\frac{\\sqrt{3}}{2}', text: '-√3/2' },
    { value: Math.SQRT2, latex: '\\sqrt{2}', text: '√2' },
    { value: -Math.SQRT2, latex: '-\\sqrt{2}', text: '-√2' },
    { value: Math.sqrt(3), latex: '\\sqrt{3}', text: '√3' },
    { value: -Math.sqrt(3), latex: '-\\sqrt{3}', text: '-√3' },
    { value: 1 / Math.sqrt(3), latex: '\\frac{\\sqrt{3}}{3}', text: '√3/3' },
    { value: -1 / Math.sqrt(3), latex: '-\\frac{\\sqrt{3}}{3}', text: '-√3/3' },
    { value: Math.PI, latex: '\\pi', text: 'π' },
    { value: 2 * Math.PI, latex: '2\\pi', text: '2π' },
    { value: Math.PI / 2, latex: '\\frac{\\pi}{2}', text: 'π/2' },
    { value: Math.PI / 4, latex: '\\frac{\\pi}{4}', text: 'π/4' },
    { value: Math.E, latex: 'e', text: 'e' },
  ];

  for (const s of specials) {
    if (Math.abs(val - s.value) < eps) {
      return s.latex;
    }
  }
  return null;
}

/**
 * Automatically balances unclosed parentheses at the end of an expression,
 * matching authentic scientific calculator behavior (e.g. sin(30 = 0.5).
 */
function autoBalanceParentheses(str: string): string {
  let openCount = 0;
  for (const ch of str) {
    if (ch === '(') openCount++;
    else if (ch === ')') openCount = Math.max(0, openCount - 1);
  }
  return str + ')'.repeat(openCount);
}

/**
 * Replaces calculator shortcuts and symbols with mathjs compatible syntax
 */
export function preprocessExpression(expr: string, angleUnit: AngleUnit, vars: VariableMap): string {
  let e = expr.trim();
  if (!e) return '0';

  // Trailing incomplete fraction or operator cleanup before parsing
  if (e.endsWith('/(')) e = e.slice(0, -2) + '/(1)';
  else if (e.endsWith('/')) e = e.slice(0, -1);
  else if (e.endsWith('*') || e.endsWith('+') || e.endsWith('-')) e = e.slice(0, -1);

  // Auto balance any unclosed parentheses (e.g. sin(30 or (78)/(5 -> sin(30) or (78)/(5))
  e = autoBalanceParentheses(e);

  // Safely handle unclosed/empty fractions before evaluation: ()/() -> 0, /( ) -> /(1), ( )/ -> (0)/, () -> 0
  e = e.replace(/\(\s*\)\s*\/\s*\(\s*\)/g, '0');
  e = e.replace(/\/\s*\(\s*\)/g, '/(1)');
  e = e.replace(/\(\s*\)\s*\//g, '(0)/');
  e = e.replace(/\(\s*\)/g, '0');

  // Replace unicode symbols
  e = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi');
  
  // Replace x10^x
  e = e.replace(/(\d+)\s*\*\s*10\^/g, '$1e');
  e = e.replace(/(\d+)e([+-]?\d+)/g, '($1 * 10^$2)');

  // Convert trig functions to respect angleUnit
  if (angleUnit === 'DEG') {
    // Wrap arguments in degToRad: sin(x) -> sin(unit(x, 'deg'))
    // Or mathematically: sin(deg * pi / 180)
    e = e.replace(/\bsin\(([^)]+)\)/g, 'sin(($1) * pi / 180)');
    e = e.replace(/\bcos\(([^)]+)\)/g, 'cos(($1) * pi / 180)');
    e = e.replace(/\btan\(([^)]+)\)/g, 'tan(($1) * pi / 180)');
    e = e.replace(/\basin\(([^)]+)\)/g, '(asin($1) * 180 / pi)');
    e = e.replace(/\bacos\(([^)]+)\)/g, '(acos($1) * 180 / pi)');
    e = e.replace(/\batan\(([^)]+)\)/g, '(atan($1) * 180 / pi)');
  } else if (angleUnit === 'GRAD') {
    e = e.replace(/\bsin\(([^)]+)\)/g, 'sin(($1) * pi / 200)');
    e = e.replace(/\bcos\(([^)]+)\)/g, 'cos(($1) * pi / 200)');
    e = e.replace(/\btan\(([^)]+)\)/g, 'tan(($1) * pi / 200)');
    e = e.replace(/\basin\(([^)]+)\)/g, '(asin($1) * 200 / pi)');
    e = e.replace(/\bacos\(([^)]+)\)/g, '(acos($1) * 200 / pi)');
    e = e.replace(/\batan\(([^)]+)\)/g, '(atan($1) * 200 / pi)');
  }

  // Handle log with base: log_{b}(x) or log(x, b)
  e = e.replace(/log_([0-9.]+)\(([^)]+)\)/g, '(log($2) / log($1))');
  // standard log(x) on casio is base 10!
  e = e.replace(/\blog10\(([^)]+)\)/g, 'log10($1)');
  // if naked log(x) without second param, on scientific calculator log(x) is base 10
  e = e.replace(/\blog\(([^,)]+)\)/g, 'log10($1)');

  // Combinatorics infix notation: 5 P 2 -> nPr(5, 2), 5 C 2 -> nCr(5, 2)
  e = e.replace(/(\d+(?:\.\d+)?|\b[A-Za-z]\b|\([^)]+\))\s*P\s*(\d+(?:\.\d+)?|\b[A-Za-z]\b|\([^)]+\))/g, 'nPr($1, $2)');
  e = e.replace(/(\d+(?:\.\d+)?|\b[A-Za-z]\b|\([^)]+\))\s*C\s*(\d+(?:\.\d+)?|\b[A-Za-z]\b|\([^)]+\))/g, 'nCr($1, $2)');
  // Combinatorics function calls
  // nPr(n, r) -> (n! / (n - r)!)
  e = e.replace(/nPr\(([^,]+),([^)]+)\)/g, 'nPr($1, $2)');
  // nCr(n, r) -> combinations(n, r)
  e = e.replace(/nCr\(([^,]+),([^)]+)\)/g, 'nCr($1, $2)');

  return e;
}

/**
 * Result evaluation package
 */
export interface EvaluationResult {
  exact: string;
  decimal: string;
  latex: string;
  rawNumeric: number | math.Complex | null;
  isError: boolean;
  errorMessage?: string;
}

/**
 * Evaluates mathematical string input
 */
export function evaluateMath(
  input: string,
  angleUnit: AngleUnit = 'DEG',
  variables: VariableMap = initialVariables
): EvaluationResult {
  if (!input || !input.trim()) {
    return {
      exact: '0',
      decimal: '0',
      latex: '0',
      rawNumeric: 0,
      isError: false,
    };
  }

  try {
    const processed = preprocessExpression(input, angleUnit, variables);

    // Create custom scope with Casio functions
    const scope: Record<string, any> = {
      ...variables,
      Ans: variables.Ans || 0,
      pi: Math.PI,
      e: Math.E,
      i: math.complex(0, 1),
      // Natural logarithm ln (base e)
      ln: (x: any) => {
        if (typeof x === 'number') {
          if (x <= 0) throw new Error('Math ERROR: Non-positive argument for ln');
          return Math.log(x);
        }
        return (math as any).log(x);
      },
      // Base-10 and arbitrary base log
      log: (x: any, base?: any) => {
        if (base !== undefined) {
          return Math.log(x) / Math.log(base);
        }
        if (typeof x === 'number') {
          if (x <= 0) throw new Error('Math ERROR: Non-positive argument for log');
          return Math.log10(x);
        }
        return (math as any).log10(x);
      },
      log10: (x: any) => {
        if (typeof x === 'number') {
          if (x <= 0) throw new Error('Math ERROR: Non-positive argument for log');
          return Math.log10(x);
        }
        return (math as any).log10(x);
      },
      // Combinatorics
      nPr: (n: number, r: number) => {
        if (r < 0 || r > n) return 0;
        return math.factorial(n) / math.factorial(n - r);
      },
      nCr: (n: number, r: number) => {
        if (r < 0 || r > n) return 0;
        return (math as any).combinations(n, r);
      },
      // Prime Factorization
      factor: (n: number) => {
        if (!Number.isInteger(n) || n <= 1) return n;
        const factors: number[] = [];
        let d = 2;
        let num = n;
        while (num >= d * d) {
          if (num % d === 0) {
            factors.push(d);
            num /= d;
          } else {
            d++;
          }
        }
        factors.push(num);
        return factors.join(' × ');
      },
      // GCD and LCM
      gcd: (a: number, b: number) => math.gcd(a, b),
      lcm: (a: number, b: number) => math.lcm(a, b),
      // Modulo
      mod: (a: number, b: number) => ((a % b) + b) % b,
      // Ceil and Floor
      ceil: (x: number) => Math.ceil(x),
      floor: (x: number) => Math.floor(x),
      cot: (x: number) => 1 / Math.tan(x),
      // Pol: convert rect to polar (r, theta)
      Pol: (x: number, y: number) => {
        const r = Math.sqrt(x * x + y * y);
        let theta = Math.atan2(y, x);
        if (angleUnit === 'DEG') theta = (theta * 180) / Math.PI;
        if (angleUnit === 'GRAD') theta = (theta * 200) / Math.PI;
        return `r=${r.toFixed(4)}, θ=${theta.toFixed(4)}`;
      },
      // Rec: convert polar to rect (x, y)
      Rec: (r: number, theta: number) => {
        let rad = theta;
        if (angleUnit === 'DEG') rad = (theta * Math.PI) / 180;
        if (angleUnit === 'GRAD') rad = (theta * Math.PI) / 200;
        const x = r * Math.cos(rad);
        const y = r * Math.sin(rad);
        return `X=${x.toFixed(4)}, Y=${y.toFixed(4)}`;
      },
      // Limit approximation (x -> c)
      limit: (exprFn: (x: number) => number, c: number) => {
        const h = 1e-7;
        return (exprFn(c + h) + exprFn(c - h)) / 2;
      },
      // Numerical derivative
      diff: (fnStr: string, atX: number) => {
        try {
          const d = math.derivative(fnStr, 'x');
          return d.evaluate({ x: atX });
        } catch {
          const h = 1e-6;
          const node = math.parse(fnStr);
          const f1 = node.evaluate({ x: atX + h });
          const f2 = node.evaluate({ x: atX - h });
          return (f1 - f2) / (2 * h);
        }
      },
      // Numerical integration Simpson's rule
      integral: (fnStr: string, a: number, b: number, n = 100) => {
        const node = math.parse(fnStr);
        const h = (b - a) / n;
        let sum = node.evaluate({ x: a }) + node.evaluate({ x: b });
        for (let i = 1; i < n; i++) {
          const x = a + i * h;
          sum += (i % 2 === 0 ? 2 : 4) * node.evaluate({ x });
        }
        return (sum * h) / 3;
      },
      // Summation
      sigma: (fnStr: string, start: number, end: number) => {
        const node = math.parse(fnStr);
        let sum = 0;
        for (let x = Math.round(start); x <= Math.round(end); x++) {
          sum += Number(node.evaluate({ x }));
        }
        return sum;
      },
    };

    const compiled = math.compile(processed);
    const raw = compiled.evaluate(scope);

    // If result is string (like Pol/Rec output)
    if (typeof raw === 'string') {
      return {
        exact: raw,
        decimal: raw,
        latex: `\\text{${raw}}`,
        rawNumeric: null,
        isError: false,
      };
    }

    // If result is complex number
    if (raw && typeof raw === 'object' && 'isComplex' in raw) {
      const re = Math.abs(raw.re) < 1e-12 ? 0 : raw.re;
      const im = Math.abs(raw.im) < 1e-12 ? 0 : raw.im;
      const compStr = `${re !== 0 ? re : ''}${im >= 0 && re !== 0 ? '+' : ''}${im !== 0 ? `${im}i` : ''}` || '0';
      return {
        exact: compStr,
        decimal: compStr,
        latex: compStr.replace('i', 'i'),
        rawNumeric: raw,
        isError: false,
      };
    }

    // If result is numeric
    if (typeof raw === 'number' || (raw && typeof raw.toNumber === 'function')) {
      const num = typeof raw === 'number' ? raw : raw.toNumber();

      if (isNaN(num)) {
        return {
          exact: 'Math ERROR',
          decimal: 'Math ERROR',
          latex: '\\text{Math ERROR}',
          rawNumeric: null,
          isError: true,
          errorMessage: 'Result is undefined or not a real number',
        };
      }

      if (!isFinite(num)) {
        return {
          exact: num > 0 ? '∞' : '-∞',
          decimal: num > 0 ? 'Infinity' : '-Infinity',
          latex: num > 0 ? '\\infty' : '-\\infty',
          rawNumeric: num,
          isError: false,
        };
      }

      // Check special radical/pi/e values
      const specialLatex = formatExactSpecialValues(num);

      // Check fraction conversion
      const frac = decimalToFraction(num);
      let exactStr = num.toString();
      let latexStr = num.toString();

      if (specialLatex) {
        latexStr = specialLatex;
        exactStr = specialLatex;
      } else if (frac && frac.d > 1) {
        exactStr = `${frac.n}/${frac.d}`;
        latexStr = `\\frac{${frac.n}}{${frac.d}}`;
      }

      // Decimal formatted to standard ClassWiz precision (up to 10 significant digits, trim trailing zeros)
      let decStr = num.toString();
      if (Math.abs(num) > 0 && (Math.abs(num) < 1e-6 || Math.abs(num) >= 1e10)) {
        decStr = num.toExponential(8).replace(/\.?0+e/, 'e');
      } else {
        decStr = parseFloat(num.toFixed(10)).toString();
      }

      return {
        exact: exactStr,
        decimal: decStr,
        latex: latexStr,
        rawNumeric: num,
        isError: false,
      };
    }

    // Default stringification
    const str = String(raw);
    return {
      exact: str,
      decimal: str,
      latex: str,
      rawNumeric: null,
      isError: false,
    };
  } catch (err: any) {
    // Casio displays Syntax ERROR cleanly on the LCD screen
    return {
      exact: 'Syntax ERROR',
      decimal: 'Syntax ERROR',
      latex: '\\text{Syntax ERROR}',
      rawNumeric: null,
      isError: true,
      errorMessage: err.message || 'Syntax Error in calculation',
    };
  }
}

export interface FractionRange {
  fullStart: number;
  fullEnd: number;
  numStart: number;
  numEnd: number;
  denStart: number;
  denEnd: number;
  num: string;
  den: string;
}

/**
 * Scans an expression to identify all natural fraction instances (num)/(den)
 * and their exact character ranges for cursor navigation between numerator and denominator.
 */
export function findFractions(expr: string): FractionRange[] {
  const fractions: FractionRange[] = [];
  let i = 0;
  while (i < expr.length) {
    let numStart = -1;
    let numEnd = -1;
    let afterNumIdx = i;

    if (expr[i] === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < expr.length && depth > 0) {
        if (expr[j] === '(') depth++;
        else if (expr[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        numStart = i + 1;
        numEnd = j - 1;
        afterNumIdx = j;
      }
    }

    if (numStart === -1) {
      const sub = expr.slice(i);
      const matchToken = sub.match(/^([0-9a-zA-Z._]+)/);
      if (matchToken) {
        numStart = i;
        numEnd = i + matchToken[0].length;
        afterNumIdx = numEnd;
      }
    }

    if (numStart !== -1) {
      const rest = expr.slice(afterNumIdx);
      const slashMatch = rest.match(/^\s*\/\s*/);
      if (slashMatch) {
        const afterSlashIdx = afterNumIdx + slashMatch[0].length;
        let denStart = afterSlashIdx;
        let denEnd = afterSlashIdx;
        let k = afterSlashIdx;

        if (afterSlashIdx < expr.length && expr[afterSlashIdx] === '(') {
          let denDepth = 1;
          k = afterSlashIdx + 1;
          while (k < expr.length && denDepth > 0) {
            if (expr[k] === '(') denDepth++;
            else if (expr[k] === ')') denDepth--;
            k++;
          }
          if (denDepth === 0) {
            denStart = afterSlashIdx + 1;
            denEnd = k - 1;
          } else {
            denStart = afterSlashIdx + 1;
            denEnd = expr.length;
            k = expr.length;
          }
        } else if (afterSlashIdx < expr.length) {
          const denSub = expr.slice(afterSlashIdx);
          const denToken = denSub.match(/^([0-9a-zA-Z._]+)/);
          if (denToken) {
            denStart = afterSlashIdx;
            denEnd = afterSlashIdx + denToken[0].length;
            k = denEnd;
          }
        }

        fractions.push({
          fullStart: i,
          fullEnd: k,
          numStart,
          numEnd,
          denStart,
          denEnd,
          num: expr.slice(numStart, numEnd),
          den: expr.slice(denStart, denEnd),
        });
        i = k;
        continue;
      }
    }
    i++;
  }
  return fractions;
}

/**
 * Formats an empty template slot (numerator, denominator, root radicand, power exponent)
 * as an authentic Casio Natural-VPAM placeholder box (▯), with active blinking cursor if focused.
 */
function formatSlotContent(content: string): string {
  const hasCursor = content.includes('§');
  const clean = content.replace(/§/g, '').trim();

  if (clean === '') {
    if (hasCursor) {
      return '{\\htmlClass{calc-box calc-box-active}{\\htmlClass{calc-cursor}{\\rule[0em]{2px}{0.66em}}}}';
    } else {
      return '{\\htmlClass{calc-box}{\\phantom{0}}}';
    }
  }

  return content;
}

/**
 * Replaces natural fractions (both (num)/(den) and num/den) with \frac{num}{den},
 * ensuring the cursor blinks strictly inside the denominator without exposing outer parentheses.
 */
function replaceNaturalFractions(expr: string): string {
  let res = '';
  let i = 0;
  while (i < expr.length) {
    let numStr = '';
    let afterNumIdx = i;

    if (expr[i] === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < expr.length && depth > 0) {
        if (expr[j] === '(') depth++;
        else if (expr[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        numStr = expr.slice(i + 1, j - 1);
        afterNumIdx = j;
      }
    }

    if (numStr === '') {
      const sub = expr.slice(i);
      const matchToken = sub.match(/^([0-9a-zA-Z.§]+)/);
      if (matchToken) {
        numStr = matchToken[1];
        afterNumIdx = i + matchToken[0].length;
      }
    }

    if (numStr !== '') {
      const rest = expr.slice(afterNumIdx);
      const slashMatch = rest.match(/^\s*\/\s*/);
      if (slashMatch) {
        const afterSlashIdx = afterNumIdx + slashMatch[0].length;
        let denStr = '';
        let nextIdx = afterSlashIdx;

        if (afterSlashIdx < expr.length && expr[afterSlashIdx] === '(') {
          let denDepth = 1;
          let k = afterSlashIdx + 1;
          while (k < expr.length && denDepth > 0) {
            if (expr[k] === '(') denDepth++;
            else if (expr[k] === ')') denDepth--;
            k++;
          }
          if (denDepth === 0) {
            denStr = expr.slice(afterSlashIdx + 1, k - 1);
            nextIdx = k;
          } else {
            denStr = expr.slice(afterSlashIdx + 1);
            nextIdx = expr.length;
          }
        } else if (afterSlashIdx < expr.length) {
          const denSub = expr.slice(afterSlashIdx);
          const denToken = denSub.match(/^([0-9a-zA-Z.§]+)/);
          if (denToken) {
            denStr = denToken[1];
            nextIdx = afterSlashIdx + denToken[0].length;
          } else {
            denStr = '';
            nextIdx = afterSlashIdx;
          }
        } else {
          denStr = '';
          nextIdx = expr.length;
        }

        const formattedNum = formatSlotContent(numStr);
        const formattedDen = formatSlotContent(denStr);
        res += `\\frac{${formattedNum}}{${formattedDen}}`;
        i = nextIdx;
        continue;
      }
    }

    res += expr[i];
    i++;
  }
  return res;
}

/**
 * Converts natural calculator input into clean LaTeX for natural textbook display
 */
export function expressionToLatex(expr: string, cursorPos?: number): string {
  if (!expr || !expr.trim()) {
    if (typeof cursorPos === 'number') {
      return '{\\htmlClass{calc-cursor}{\\rule[0em]{2px}{0.66em}}}';
    }
    return '';
  }

  const CURSOR_TOKEN = '§';
  let input = expr;
  const hasCursor = typeof cursorPos === 'number' && cursorPos >= 0 && cursorPos <= expr.length;
  if (hasCursor) {
    input = expr.slice(0, cursorPos) + CURSOR_TOKEN + expr.slice(cursorPos);
  }

  // First process natural stacked fractions (num)/(den) with balanced parentheses
  let l = replaceNaturalFractions(input);

  // Single number or variable fraction with active cursor in denominator: e.g. 78/§
  l = l.replace(/([0-9a-zA-Z.]+)\s*\/\s*§/g, '\\frac{$1}{\\htmlClass{calc-box calc-box-active}{\\htmlClass{calc-cursor}{\\rule[0em]{2px}{0.66em}}}}');

  // Single number or variable fraction: 3/4 -> \frac{3}{4}
  l = l.replace(/([0-9a-zA-Z.§]+)\s*\/\s*([0-9a-zA-Z.§]+)/g, '\\frac{$1}{$2}');

  // Trig and log functions
  l = l.replace(/\basin\(/g, '\\arcsin(');
  l = l.replace(/\bacos\(/g, '\\arccos(');
  l = l.replace(/\batan\(/g, '\\arctan(');
  l = l.replace(/\bsin\(/g, '\\sin(');
  l = l.replace(/\bcos\(/g, '\\cos(');
  l = l.replace(/\btan\(/g, '\\tan(');
  l = l.replace(/\bln\(/g, '\\ln(');
  l = l.replace(/\blog10\(/g, '\\log(');

  // Square roots: sqrt(x) -> \sqrt{x}
  l = l.replace(/sqrt\(([^)]*)\)/g, (_m, inner) => `\\sqrt{${formatSlotContent(inner)}}`);
  // Nth root: nthRoot(x, n) -> \sqrt[n]{x}
  l = l.replace(/nthRoot\(([^,]*),([^)]*)\)/g, (_m, x, n) => `\\sqrt[${formatSlotContent(n)}]{${formatSlotContent(x)}}`);
  // Cube root: cbrt(x) -> \sqrt[3]{x}
  l = l.replace(/cbrt\(([^)]*)\)/g, (_m, inner) => `\\sqrt[3]{${formatSlotContent(inner)}}`);

  // Powers: x^y or x^(y) -> x^{y}
  l = l.replace(/\^([0-9a-zA-Z§]+)/g, '^{$1}');
  l = l.replace(/\^\(([^)]*)\)/g, (_m, exp) => `^{${formatSlotContent(exp)}}`);

  // Multiplications
  l = l.replace(/\*/g, ' \\times ');

  // Division
  l = l.replace(/\//g, ' \\div ');

  // Pi
  l = l.replace(/pi/g, '\\pi');

  // Integrals: integral("f(x)", a, b) -> \int_{a}^{b} f(x) dx
  l = l.replace(/integral\("([^"]+)",\s*([0-9.-]+),\s*([0-9.-]+)\)/g, '\\int_{$2}^{$3} $1 \\, dx');

  // Derivatives: diff("f(x)", x) -> \frac{d}{dx}[f(x)]
  l = l.replace(/diff\("([^"]+)",\s*([0-9.-]+)\)/g, '\\left. \\frac{d}{dx}($1) \\right|_{x=$2}');

  // Summations: sigma("f(x)", a, b) -> \sum_{x=a}^{b} f(x)
  l = l.replace(/sigma\("([^"]+)",\s*([0-9.-]+),\s*([0-9.-]+)\)/g, '\\sum_{x=$2}^{$3} $1');

  // DMS ° ' "
  l = l.replace(/°/g, '^\\circ ');

  if (hasCursor) {
    l = l.replace(/§/g, '{\\htmlClass{calc-cursor}{\\rule[0em]{2px}{0.66em}}}');
  }

  return l;
}

/**
 * Standard Physical Constants (Casio CONST)
 */
export const PHYSICAL_CONSTANTS = [
  { id: 'c', symbol: 'c', name: 'Speed of Light in Vacuum', value: 299792458, unit: 'm/s', category: 'universal' as const },
  { id: 'h', symbol: 'h', name: 'Planck Constant', value: 6.62607015e-34, unit: 'J·s', category: 'universal' as const },
  { id: 'hbar', symbol: 'ħ', name: 'Reduced Planck Constant', value: 1.054571817e-34, unit: 'J·s', category: 'universal' as const },
  { id: 'G', symbol: 'G', name: 'Newtonian Constant of Gravitation', value: 6.6743e-11, unit: 'm³/(kg·s²)', category: 'universal' as const },
  { id: 'e', symbol: 'e', name: 'Elementary Charge', value: 1.602176634e-19, unit: 'C', category: 'electromagnetic' as const },
  { id: 'eps0', symbol: 'ε₀', name: 'Vacuum Electric Permittivity', value: 8.8541878128e-12, unit: 'F/m', category: 'electromagnetic' as const },
  { id: 'mu0', symbol: 'μ₀', name: 'Vacuum Magnetic Permeability', value: 1.25663706212e-6, unit: 'N/A²', category: 'electromagnetic' as const },
  { id: 'me', symbol: 'mₑ', name: 'Electron Mass', value: 9.1093837015e-31, unit: 'kg', category: 'atomic' as const },
  { id: 'mp', symbol: 'mₚ', name: 'Proton Mass', value: 1.67262192369e-27, unit: 'kg', category: 'atomic' as const },
  { id: 'mn', symbol: 'mₙ', name: 'Neutron Mass', value: 1.67492749804e-27, unit: 'kg', category: 'atomic' as const },
  { id: 'Na', symbol: 'Nₐ', name: 'Avogadro Constant', value: 6.02214076e23, unit: 'mol⁻¹', category: 'physico-chemical' as const },
  { id: 'k', symbol: 'k', name: 'Boltzmann Constant', value: 1.380649e-23, unit: 'J/K', category: 'physico-chemical' as const },
  { id: 'R', symbol: 'R', name: 'Molar Gas Constant', value: 8.314462618, unit: 'J/(mol·K)', category: 'physico-chemical' as const },
  { id: 'F', symbol: 'F', name: 'Faraday Constant', value: 96485.33212, unit: 'C/mol', category: 'physico-chemical' as const },
  { id: 'g0', symbol: 'g₀', name: 'Standard Acceleration of Gravity', value: 9.80665, unit: 'm/s²', category: 'universal' as const },
  { id: 'atm', symbol: 'atm', name: 'Standard Atmosphere', value: 101325, unit: 'Pa', category: 'physico-chemical' as const },
];
