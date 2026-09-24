export type AngleUnit = 'RAD' | 'DEG' | 'GRAD';
export type NumberFormat = 'NORM' | 'SCI' | 'ENG';
export type FractionFormat = 'EXACT' | 'MIXED' | 'DECIMAL';

export interface CalculationRecord {
  id: string;
  expression: string;
  latexInput?: string;
  resultExact: string;
  resultDecimal: string;
  latexResult?: string;
  timestamp: number;
  angleUnit: AngleUnit;
  isError?: boolean;
}

export interface VariableMap {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  X: number;
  Y: number;
  M: number;
  Ans: number;
}

export interface PhysicalConstant {
  id: string;
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: 'universal' | 'electromagnetic' | 'atomic' | 'physico-chemical';
}

export interface UnitConversionCategory {
  name: string;
  units: Array<{ id: string; name: string; toBase: (v: number) => number; fromBase: (v: number) => number }>;
}

export interface SolverStep {
  stepNumber: number;
  explanation: string;
  latex: string;
}

export interface SolverResponse {
  expression: string;
  finalAnswer: string;
  decimalAnswer?: string;
  steps: SolverStep[];
  graphHint?: {
    type: string;
    points?: number[];
  } | null;
}
