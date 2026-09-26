import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NaturalDisplay } from './components/NaturalDisplay';
import { StatusBar } from './components/StatusBar';
import { Keypad } from './components/Keypad';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VariablesModal } from './components/VariablesModal';
import { ConstantsModal } from './components/ConstantsModal';
import { ConversionModal } from './components/ConversionModal';
import { GraphModal } from './components/GraphModal';
import { CameraScannerModal } from './components/CameraScannerModal';
import { StepSolverModal } from './components/StepSolverModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { StartupAnimation } from './components/StartupAnimation';
import { evaluateMath, initialVariables, EvaluationResult } from './lib/mathEngine';
import { AngleUnit, CalculationRecord, FractionFormat, NumberFormat, VariableMap } from './types';
import { CursorPath, MathSequence } from './lib/ast/types';
import {
  insertChar,
  insertOperator,
  insertVariable,
  insertFraction,
  insertPower,
  insertRoot,
  insertFunction,
  insertParentheses,
  insertAbs,
  deleteAtCursor,
  moveCursorLeft,
  moveCursorRight,
  moveCursorUp,
  moveCursorDown,
  astToMathString,
  astToLatex,
  mathStringToAst,
  cloneSequence,
  getSequenceAtSteps,
} from './lib/ast/model';

export default function App() {
  // Structured AST & Mathematical Cursor Model
  const [ast, setAst] = useState<MathSequence>([]);
  const [cursor, setCursor] = useState<CursorPath>({ steps: [], index: 0 });

  // Undo / Redo Stacks storing AST snapshots
  const [undoStack, setUndoStack] = useState<Array<{ ast: MathSequence; cursor: CursorPath }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ ast: MathSequence; cursor: CursorPath }>>([]);

  // Live Result State
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [displayMode, setDisplayMode] = useState<'EXACT' | 'DECIMAL'>('EXACT');

  // Keypad Modifiers
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);

  // Settings & Modes
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('DEG');
  const [fractionFormat, setFractionFormat] = useState<FractionFormat>('EXACT');
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('NORM');
  const [fontSize, setFontSize] = useState(26);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Variables & Memory
  const [variables, setVariables] = useState<VariableMap>(() => {
    try {
      const saved = localStorage.getItem('mathda_variables');
      return saved ? JSON.parse(saved) : initialVariables;
    } catch {
      return initialVariables;
    }
  });

  // History state
  const [history, setHistory] = useState<CalculationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mathda_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isConstantsOpen, setIsConstantsOpen] = useState(false);
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStepSolverOpen, setIsStepSolverOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 20);
    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mathda_history', JSON.stringify(history.slice(0, 50)));
    } catch {
      // quota
    }
  }, [history]);

  // Save variables to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mathda_variables', JSON.stringify(variables));
    } catch {
      // quota
    }
  }, [variables]);

  // Push current state onto undo stack before modifying AST
  const pushUndo = useCallback((currentAst: MathSequence, currentCursor: CursorPath) => {
    setUndoStack((prev) => [
      ...prev.slice(-30),
      { ast: cloneSequence(currentAst), cursor: { steps: [...currentCursor.steps], index: currentCursor.index } },
    ]);
    setRedoStack([]);
    setHistoryCursor(null);
  }, []);

  // Update AST and Cursor with undo tracking
  const updateAst = useCallback((newAst: MathSequence, newCursor: CursorPath) => {
    pushUndo(ast, cursor);
    setAst(newAst);
    setCursor(newCursor);
  }, [ast, cursor, pushUndo]);

  // User typing experience: Clear any previous result or error whenever the user edits formula
  // Casio standard: No syntax error or transient message while typing.
  // Evaluation and errors are only shown once the user enters equal to (=).
  useEffect(() => {
    setResult(null);
  }, [ast]);

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [
      ...prev,
      { ast: cloneSequence(ast), cursor: { steps: [...cursor.steps], index: cursor.index } },
    ]);
    setUndoStack((prev) => prev.slice(0, -1));
    setAst(last.ast);
    setCursor(last.cursor);
  }, [undoStack, ast, cursor]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [
      ...prev,
      { ast: cloneSequence(ast), cursor: { steps: [...cursor.steps], index: cursor.index } },
    ]);
    setRedoStack((prev) => prev.slice(0, -1));
    setAst(next.ast);
    setCursor(next.cursor);
  }, [redoStack, ast, cursor]);

  // Evaluate and record calculation in history (= button)
  const handleCalculate = useCallback(() => {
    const mathStr = astToMathString(ast);
    if (!mathStr.trim()) return;

    // Check if equation with variable x e.g. x^2 - 3x + 1 = 0
    if (mathStr.includes('=') && (mathStr.includes('x') || mathStr.includes('X'))) {
      setIsStepSolverOpen(true);
      return;
    }

    const evalResult = evaluateMath(mathStr, angleUnit, variables);
    setResult(evalResult);

    if (!evalResult.isError) {
      const numericVal = typeof evalResult.rawNumeric === 'number' ? evalResult.rawNumeric : 0;
      setVariables((prev) => ({ ...prev, Ans: numericVal }));

      const newRecord: CalculationRecord = {
        id: Date.now().toString(),
        expression: mathStr,
        latexInput: astToLatex(ast),
        resultExact: evalResult.exact,
        resultDecimal: evalResult.decimal,
        latexResult: evalResult.latex,
        timestamp: Date.now(),
        angleUnit,
        isError: false,
      };

      setHistory((prev) => [newRecord, ...prev]);
    }
  }, [ast, angleUnit, variables]);

  // Cycle angle units (DEG -> RAD -> GRAD -> DEG)
  const handleCycleAngleUnit = useCallback(() => {
    const units: AngleUnit[] = ['DEG', 'RAD', 'GRAD'];
    const nextUnit = units[(units.indexOf(angleUnit) + 1) % units.length];
    setAngleUnit(nextUnit);
  }, [angleUnit]);

  // Keypad button press handler
  const handleKeyPress = useCallback((action: string, _meta?: any) => {
    // SHIFT mode routing
    if (isShift) {
      setIsShift(false);
      switch (action) {
        case '=': {
          const mathStr = astToMathString(ast);
          if (mathStr.trim()) {
            const evalResult = evaluateMath(mathStr, angleUnit, variables);
            setResult(evalResult);
            if (!evalResult.isError) {
              const numericVal = typeof evalResult.rawNumeric === 'number' ? evalResult.rawNumeric : 0;
              setVariables((prev) => ({ ...prev, Ans: numericVal }));
            }
          }
          setDisplayMode('DECIMAL');
          return;
        }
        case 'CALC':
          // Golden SOLVE
          setIsStepSolverOpen(true);
          return;
        case 'INTEGRAL': {
          // Golden d/dx
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'diff');
          setAst(root); setCursor(c);
          return;
        }
        case 'x': {
          // Golden ∑ (summation)
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'sigma');
          setAst(root); setCursor(c);
          return;
        }
        case 'FRAC': {
          // Golden a b/c
          setDisplayMode((prev) => (prev === 'EXACT' ? 'DECIMAL' : 'EXACT'));
          return;
        }
        case 'SQRT': {
          // Golden ³√▫
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertRoot(ast, cursor, ['3']);
          setAst(root); setCursor(c);
          return;
        }
        case 'X_POWER': {
          // Golden ⁿ√▫
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertRoot(ast, cursor, []);
          setAst(root); setCursor(c);
          return;
        }
        case 'X_SQUARE': {
          // Golden x³
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertPower(ast, cursor, ['3']);
          setAst(root); setCursor(c);
          return;
        }
        case 'LOG_BASE': {
          // Golden 10^▫
          pushUndo(ast, cursor);
          const { root: r1, cursor: c1 } = insertChar(ast, cursor, '1');
          const { root: r2, cursor: c2 } = insertChar(r1, c1, '0');
          const { root, cursor: c } = insertPower(r2, c2);
          setAst(root); setCursor(c);
          return;
        }
        case 'LN': {
          // Golden e^▫
          pushUndo(ast, cursor);
          const { root: r1, cursor: c1 } = insertVariable(ast, cursor, 'e');
          const { root, cursor: c } = insertPower(r1, c1);
          setAst(root); setCursor(c);
          return;
        }
        case 'NEG':
        case 'LOG': {
          // Golden log
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'log10');
          setAst(root); setCursor(c);
          return;
        }
        case 'DMS': {
          // Golden FACT (prime factorization)
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'factor');
          setAst(root); setCursor(c);
          return;
        }
        case 'INV': {
          // Golden x! (Factorial)
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertOperator(ast, cursor, '!');
          setAst(root); setCursor(c);
          return;
        }
        case 'SIN': {
          // Golden sin⁻¹
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'asin');
          setAst(root); setCursor(c);
          return;
        }
        case 'COS': {
          // Golden cos⁻¹
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'acos');
          setAst(root); setCursor(c);
          return;
        }
        case 'TAN': {
          // Golden tan⁻¹
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'atan');
          setAst(root); setCursor(c);
          return;
        }
        case 'STO':
          // Golden RCL
          setIsVariablesOpen(true);
          return;
        case 'ENG':
          // Golden ←
          setDisplayMode((prev) => (prev === 'EXACT' ? 'DECIMAL' : 'EXACT'));
          return;
        case '(': {
          // Golden Abs
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertAbs(ast, cursor);
          setAst(root); setCursor(c);
          return;
        }
        case ')': {
          // Golden ,
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertChar(ast, cursor, ',');
          setAst(root); setCursor(c);
          return;
        }
        case 'S_D':
          // Golden ⇄
          setDisplayMode((prev) => (prev === 'EXACT' ? 'DECIMAL' : 'EXACT'));
          return;
        case 'M+': {
          // Golden M-
          const valToSub = result && typeof result.rawNumeric === 'number' ? result.rawNumeric : (variables.Ans || 0);
          setVariables((prev) => ({ ...prev, M: (prev.M || 0) - valToSub }));
          return;
        }
        case '7':
          // Golden CONST
          setIsConstantsOpen(true);
          return;
        case '8':
          // Golden CONV
          setIsConversionOpen(true);
          return;
        case '9': {
          // Golden Limit
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'limit');
          setAst(root); setCursor(c);
          return;
        }
        case 'DEL':
          // Golden INS
          return;
        case 'AC':
          // Golden OFF
          setVariables(initialVariables);
          setResult(null);
          setAst([]);
          setCursor({ steps: [], index: 0 });
          return;
        case '4':
          // Golden MATRIX
          setIsHelpOpen(true);
          return;
        case '5':
          // Golden VECTOR
          setIsHelpOpen(true);
          return;
        case '*': {
          // Golden nPr
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertOperator(ast, cursor, 'P');
          setAst(root); setCursor(c);
          return;
        }
        case '/': {
          // Golden nCr
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertOperator(ast, cursor, 'C');
          setAst(root); setCursor(c);
          return;
        }
        case '1':
          // Golden STAT
          setIsHelpOpen(true);
          return;
        case '2': {
          // Golden CMPLX
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'i');
          setAst(root); setCursor(c);
          return;
        }
        case '3':
          // Golden BASE
          setIsHelpOpen(true);
          return;
        case '+': {
          // Golden Pol
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'Pol');
          setAst(root); setCursor(c);
          return;
        }
        case '-': {
          // Golden Rec
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'Rec');
          setAst(root); setCursor(c);
          return;
        }
        case '.': {
          // Golden Ran#
          pushUndo(ast, cursor);
          const rand = Math.random().toFixed(3);
          let currentAst = ast;
          let currentCursor = cursor;
          for (const ch of rand) {
            const res = insertChar(currentAst, currentCursor, ch);
            currentAst = res.root;
            currentCursor = res.cursor;
          }
          setAst(currentAst); setCursor(currentCursor);
          return;
        }
        case 'EXP': {
          // Golden π
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'π');
          setAst(root); setCursor(c);
          return;
        }
        case 'Ans': {
          // Golden %
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertOperator(ast, cursor, '%');
          setAst(root); setCursor(c);
          return;
        }
        default: break;
      }
    }

    // ALPHA mode routing
    if (isAlpha) {
      setIsAlpha(false);
      switch (action) {
        case 'NEG': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'A');
          setAst(root); setCursor(c);
          return;
        }
        case 'DMS': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'B');
          setAst(root); setCursor(c);
          return;
        }
        case 'INV': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'C');
          setAst(root); setCursor(c);
          return;
        }
        case 'SIN': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'D');
          setAst(root); setCursor(c);
          return;
        }
        case 'COS': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'E');
          setAst(root); setCursor(c);
          return;
        }
        case 'TAN': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'F');
          setAst(root); setCursor(c);
          return;
        }
        case ')': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'X');
          setAst(root); setCursor(c);
          return;
        }
        case 'S_D': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'Y');
          setAst(root); setCursor(c);
          return;
        }
        case 'M+': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'M');
          setAst(root); setCursor(c);
          return;
        }
        case 'x': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'x');
          setAst(root); setCursor(c);
          return;
        }
        case 'EXP': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'e');
          setAst(root); setCursor(c);
          return;
        }
        case '.': {
          pushUndo(ast, cursor);
          const randInt = String(Math.floor(Math.random() * 10) + 1);
          let currentAst = ast;
          let currentCursor = cursor;
          for (const ch of randInt) {
            const res = insertChar(currentAst, currentCursor, ch);
            currentAst = res.root;
            currentCursor = res.cursor;
          }
          setAst(currentAst); setCursor(currentCursor);
          return;
        }
        case 'Ans': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'Ans');
          setAst(root); setCursor(c);
          return;
        }
        case 'CALC': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertChar(ast, cursor, '=');
          setAst(root); setCursor(c);
          return;
        }
        case 'INTEGRAL': {
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertChar(ast, cursor, ':');
          setAst(root); setCursor(c);
          return;
        }
        case 'X_SQUARE': {
          // Alpha mod
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'mod');
          setAst(root); setCursor(c);
          return;
        }
        case 'LOG_BASE': {
          // Alpha cot
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'cot');
          setAst(root); setCursor(c);
          return;
        }
        case '*': {
          // Alpha GCD
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'gcd');
          setAst(root); setCursor(c);
          return;
        }
        case '/': {
          // Alpha LCM
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'lcm');
          setAst(root); setCursor(c);
          return;
        }
        case '+': {
          // Alpha Ceil
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'ceil');
          setAst(root); setCursor(c);
          return;
        }
        case '-': {
          // Alpha Floor
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertFunction(ast, cursor, 'floor');
          setAst(root); setCursor(c);
          return;
        }
        case 'ENG': {
          // Alpha i
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'i');
          setAst(root); setCursor(c);
          return;
        }
        case 'STO': {
          // Alpha ∠
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertChar(ast, cursor, '∠');
          setAst(root); setCursor(c);
          return;
        }
        case '9': {
          // Alpha ∞
          pushUndo(ast, cursor);
          const { root, cursor: c } = insertVariable(ast, cursor, 'Infinity');
          setAst(root); setCursor(c);
          return;
        }
        case 'AC': {
          // Alpha CLRv
          setVariables(initialVariables);
          return;
        }
        default: break;
      }
    }

    // Normal Calculator Mode Actions
    switch (action) {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '.': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertChar(ast, cursor, action);
        setAst(root); setCursor(c);
        break;
      }

      case '+':
      case '-': {
        pushUndo(ast, cursor);
        const op = action === '-' ? '−' : '+';
        const { root, cursor: c } = insertOperator(ast, cursor, op);
        setAst(root); setCursor(c);
        break;
      }

      case '*': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertOperator(ast, cursor, '×');
        setAst(root); setCursor(c);
        break;
      }

      case '/':
      case 'FRAC': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertFraction(ast, cursor);
        setAst(root); setCursor(c);
        break;
      }

      case 'X_SQUARE': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertPower(ast, cursor, ['2']);
        setAst(root); setCursor(c);
        break;
      }

      case 'X_POWER': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertPower(ast, cursor);
        setAst(root); setCursor(c);
        break;
      }

      case 'INV': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertPower(ast, cursor, ['-', '1']);
        setAst(root); setCursor(c);
        break;
      }

      case 'SQRT': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertRoot(ast, cursor);
        setAst(root); setCursor(c);
        break;
      }

      case 'SIN':
      case 'COS':
      case 'TAN': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertFunction(ast, cursor, action.toLowerCase());
        setAst(root); setCursor(c);
        break;
      }

      case 'LN': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertFunction(ast, cursor, 'ln');
        setAst(root); setCursor(c);
        break;
      }

      case 'LOG_BASE': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertFunction(ast, cursor, 'log10');
        setAst(root); setCursor(c);
        break;
      }

      case '(': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertParentheses(ast, cursor);
        setAst(root); setCursor(c);
        break;
      }

      case ')': {
        // If cursor inside parentheses, function args, or abs, exit to after the node
        if (cursor.steps.length > 0) {
          const lastStep = cursor.steps[cursor.steps.length - 1];
          if (lastStep.slot === 'content' || lastStep.slot === 'args') {
            const parentSteps = cursor.steps.slice(0, -1);
            const parentSeq = getSequenceAtSteps(ast, parentSteps);
            const nodeIdx = parentSeq?.findIndex((n: any) => n.id === lastStep.nodeId) ?? -1;
            if (nodeIdx !== -1) {
              setCursor({ steps: parentSteps, index: nodeIdx + 1 });
              break;
            }
          }
        }
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertChar(ast, cursor, ')');
        setAst(root); setCursor(c);
        break;
      }

      case 'DEL': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = deleteAtCursor(ast, cursor);
        setAst(root); setCursor(c);
        break;
      }

      case 'AC': {
        pushUndo(ast, cursor);
        setAst([]);
        setCursor({ steps: [], index: 0 });
        setResult(null);
        break;
      }

      case '=':
        handleCalculate();
        break;

      case 'S_D':
        setDisplayMode((m) => (m === 'EXACT' ? 'DECIMAL' : 'EXACT'));
        break;

      case 'NEG': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertOperator(ast, cursor, '−');
        setAst(root); setCursor(c);
        break;
      }

      case 'EXP': {
        // Scientific notation: * 10 ^
        pushUndo(ast, cursor);
        const { root: r1, cursor: c1 } = insertOperator(ast, cursor, '×');
        const { root: r2, cursor: c2 } = insertChar(r1, c1, '1');
        const { root: r3, cursor: c3 } = insertChar(r2, c2, '0');
        const { root, cursor: c } = insertPower(r3, c3);
        setAst(root); setCursor(c);
        break;
      }

      case 'Ans': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertVariable(ast, cursor, 'Ans');
        setAst(root); setCursor(c);
        break;
      }

      case 'x': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertVariable(ast, cursor, 'x');
        setAst(root); setCursor(c);
        break;
      }

      case 'CALC':
        handleCalculate();
        break;

      case 'STO':
        setIsVariablesOpen(true);
        break;

      case 'M+': {
        const valToAdd = result && typeof result.rawNumeric === 'number' ? result.rawNumeric : (variables.Ans || 0);
        setVariables((prev) => ({ ...prev, M: (prev.M || 0) + valToAdd }));
        break;
      }

      case 'INTEGRAL': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertFunction(ast, cursor, 'integral');
        setAst(root); setCursor(c);
        break;
      }

      case 'ENG': {
        setDisplayMode((prev) => (prev === 'EXACT' ? 'DECIMAL' : 'EXACT'));
        break;
      }

      case 'DMS': {
        pushUndo(ast, cursor);
        const { root, cursor: c } = insertChar(ast, cursor, '°');
        setAst(root); setCursor(c);
        break;
      }

      default:
        break;
    }
  }, [
    isShift,
    isAlpha,
    ast,
    cursor,
    pushUndo,
    handleCalculate,
    result,
  ]);

  // Cursor movement via D-PAD (functional physical scientific calculator behavior)
  const handleCursorMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (dir === 'left') {
      setCursor((c) => moveCursorLeft(ast, c));
      return;
    }

    if (dir === 'right') {
      setCursor((c) => moveCursorRight(ast, c));
      return;
    }

    if (dir === 'up') {
      // If inside nested mathematical structure (e.g. denominator -> numerator), navigate upward!
      if (cursor.steps.length > 0) {
        setCursor((c) => moveCursorUp(ast, c));
        return;
      }

      // Otherwise navigate history upward
      if (history.length === 0) return;
      const nextIdx = historyCursor === null ? 0 : Math.min(historyCursor + 1, history.length - 1);
      setHistoryCursor(nextIdx);
      const record = history[nextIdx];
      if (record) {
        const loadedAst = mathStringToAst(record.expression);
        setAst(loadedAst);
        setCursor({ steps: [], index: loadedAst.length });
        setResult({
          exact: record.resultExact,
          decimal: record.resultDecimal,
          latex: record.latexResult || record.resultExact,
          rawNumeric: parseFloat(record.resultDecimal) || null,
          isError: false,
        });
      }
      return;
    }

    if (dir === 'down') {
      // If inside nested mathematical structure (e.g. numerator -> denominator), navigate downward!
      if (cursor.steps.length > 0) {
        setCursor((c) => moveCursorDown(ast, c));
        return;
      }

      // Otherwise navigate history downward
      if (historyCursor === null || history.length === 0) return;
      const nextIdx = historyCursor - 1;
      if (nextIdx < 0) {
        setHistoryCursor(null);
        setAst([]);
        setCursor({ steps: [], index: 0 });
        setResult(null);
      } else {
        setHistoryCursor(nextIdx);
        const record = history[nextIdx];
        if (record) {
          const loadedAst = mathStringToAst(record.expression);
          setAst(loadedAst);
          setCursor({ steps: [], index: loadedAst.length });
          setResult({
            exact: record.resultExact,
            decimal: record.resultDecimal,
            latex: record.latexResult || record.resultExact,
            rawNumeric: parseFloat(record.resultDecimal) || null,
            isError: false,
          });
        }
      }
      return;
    }
  }, [ast, cursor, history, historyCursor]);

  // Global Hardware Keyboard support for physical desktop typing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleCursorMove('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleCursorMove('right');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleCursorMove('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleCursorMove('down');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      handleKeyPress('DEL');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleKeyPress('AC');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleKeyPress('=');
    } else if (e.key === '/') {
      e.preventDefault();
      handleKeyPress('FRAC');
    } else if (e.key === '*') {
      e.preventDefault();
      handleKeyPress('*');
    } else if (e.key === '+') {
      e.preventDefault();
      handleKeyPress('+');
    } else if (e.key === '-') {
      e.preventDefault();
      handleKeyPress('-');
    } else if (/[0-9.]/.test(e.key)) {
      e.preventDefault();
      handleKeyPress(e.key);
    } else if (e.key === '(' || e.key === ')') {
      e.preventDefault();
      handleKeyPress(e.key);
    }
  }, [handleCursorMove, handleKeyPress, handleUndo, handleRedo]);

  const mathStringRepr = astToMathString(ast);

  return (
    <div 
      className={`min-h-screen w-full max-w-none sm:max-w-md mx-auto bg-[#000000] text-slate-100 flex flex-col justify-start select-none shadow-2xl relative overflow-x-hidden overflow-y-auto font-oryno-bold transition-opacity duration-300 ease-out ${isReady ? 'opacity-100' : 'opacity-0'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Main Calculator Viewport */}
      <div className="w-full flex flex-col bg-[#000000]">
        {/* Header with App Branding and Utility Modals */}
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenVariables={() => setIsVariablesOpen(true)}
          onOpenCamera={() => setIsCameraOpen(true)}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSolver={() => setIsStepSolverOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          historyCount={history.length}
        />

        {/* Compact Mathematical Expression Editor Display Screen */}
        <NaturalDisplay
          ast={ast}
          cursor={cursor}
          onSetCursor={setCursor}
          result={result}
          displayMode={displayMode}
          onToggleDisplayMode={() => setDisplayMode((m) => (m === 'EXACT' ? 'DECIMAL' : 'EXACT'))}
          onOpenStepSolver={() => setIsStepSolverOpen(true)}
          fontSize={fontSize}
          onKeyDown={handleKeyDown}
        />

        {/* Status Bar */}
        <StatusBar
          angleUnit={angleUnit}
          onCycleAngleUnit={handleCycleAngleUnit}
          fractionFormat={fractionFormat}
          onToggleFractionFormat={() => setFractionFormat((f) => (f === 'EXACT' ? 'DECIMAL' : f === 'DECIMAL' ? 'MIXED' : 'EXACT'))}
          numberFormat={numberFormat}
          onCycleNumberFormat={() => setNumberFormat((n) => (n === 'NORM' ? 'SCI' : n === 'SCI' ? 'ENG' : 'NORM'))}
          isShift={isShift}
          isAlpha={isAlpha}
          hasMemory={variables.M !== 0}
          onZoomIn={() => setFontSize((s) => Math.min(s + 2, 28))}
          onZoomOut={() => setFontSize((s) => Math.max(s - 2, 16))}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
        />

        {/* ClassWiz Keypad - seamlessly connected directly below Status Bar */}
        <div className="w-full bg-[#000000] pb-2 sm:pb-3 shrink-0">
          <Keypad
            isShift={isShift}
            isAlpha={isAlpha}
            onToggleShift={() => setIsShift((s) => !s)}
            onToggleAlpha={() => setIsAlpha((a) => !a)}
            onKeyPress={handleKeyPress}
            onCursorMove={handleCursorMove}
            onOpenMenu={() => setIsHelpOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenOption={() => setIsVariablesOpen(true)}
            onTurnOn={() => setShowStartup(true)}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={(rec) => {
          const loaded = mathStringToAst(rec.expression);
          setAst(loaded);
          setCursor({ steps: [], index: loaded.length });
          setResult({
            exact: rec.resultExact,
            decimal: rec.resultDecimal,
            latex: rec.latexResult || rec.resultExact,
            rawNumeric: parseFloat(rec.resultDecimal) || null,
            isError: false,
          });
          setIsHistoryOpen(false);
        }}
        onClearHistory={() => setHistory([])}
      />

      <VariablesModal
        isOpen={isVariablesOpen}
        onClose={() => setIsVariablesOpen(false)}
        variables={variables}
        onUpdateVariable={(k, v) => setVariables((prev) => ({ ...prev, [k]: v }))}
        onInsertVariable={(k) => {
          const { root, cursor: c } = insertVariable(ast, cursor, k);
          updateAst(root, c);
        }}
      />

      <ConstantsModal
        isOpen={isConstantsOpen}
        onClose={() => setIsConstantsOpen(false)}
        onInsertConstant={(_sym, val) => {
          const valAst = mathStringToAst(val.toString());
          const newAst = [...ast];
          newAst.splice(cursor.index, 0, ...valAst);
          updateAst(newAst, { steps: cursor.steps, index: cursor.index + valAst.length });
        }}
      />

      <ConversionModal
        isOpen={isConversionOpen}
        onClose={() => setIsConversionOpen(false)}
        onInsertValue={(val) => {
          const valAst = mathStringToAst(val.toString());
          const newAst = [...ast];
          newAst.splice(cursor.index, 0, ...valAst);
          updateAst(newAst, { steps: cursor.steps, index: cursor.index + valAst.length });
        }}
      />

      <GraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        initialFunction={mathStringRepr.includes('x') ? mathStringRepr : 'x^2 - 3*x + 1'}
      />

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onInsertToCalculator={(scanned) => {
          const scannedAst = mathStringToAst(scanned);
          updateAst(scannedAst, { steps: [], index: scannedAst.length });
        }}
      />

      <StepSolverModal
        isOpen={isStepSolverOpen}
        onClose={() => setIsStepSolverOpen(false)}
        expression={mathStringRepr || 'x^2 - 3x + 1 = 0'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        angleUnit={angleUnit}
        onSetAngleUnit={setAngleUnit}
        fractionFormat={fractionFormat}
        onSetFractionFormat={setFractionFormat}
        numberFormat={numberFormat}
        onSetNumberFormat={setNumberFormat}
        fontSize={fontSize}
        onSetFontSize={setFontSize}
        audioFeedback={audioFeedback}
        onSetAudioFeedback={setAudioFeedback}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {showStartup && (
        <StartupAnimation
          brandTitle="SHUBHAM SCIENTIFIC CALCULATOR"
          onComplete={() => setShowStartup(false)}
        />
      )}
    </div>
  );
}
