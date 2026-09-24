// Mathematical Expression AST Types

export type SlotName = 
  | 'numerator' 
  | 'denominator' 
  | 'base' 
  | 'exponent' 
  | 'radicand' 
  | 'index' 
  | 'args' 
  | 'content';

export interface BaseNode {
  id: string;
}

export interface CharNode extends BaseNode {
  type: 'char';
  value: string; // '0'-'9', '.', etc.
}

export interface OperatorNode extends BaseNode {
  type: 'operator';
  value: string; // '+', '−', '×', '÷'
}

export interface VariableNode extends BaseNode {
  type: 'variable';
  name: string; // 'x', 'π', 'e', 'Ans', 'A', etc.
}

export interface FractionNode extends BaseNode {
  type: 'fraction';
  numerator: MathNode[];
  denominator: MathNode[];
}

export interface PowerNode extends BaseNode {
  type: 'power';
  base: MathNode[];
  exponent: MathNode[];
}

export interface RootNode extends BaseNode {
  type: 'root';
  index?: MathNode[]; // optional for cube root or nth root
  radicand: MathNode[];
}

export interface FunctionNode extends BaseNode {
  type: 'function';
  name: string; // 'sin', 'cos', 'tan', 'ln', 'log', 'asin', 'acos', 'atan'
  args: MathNode[];
}

export interface ParenthesesNode extends BaseNode {
  type: 'parentheses';
  content: MathNode[];
}

export interface AbsNode extends BaseNode {
  type: 'abs';
  content: MathNode[];
}

export type MathNode = 
  | CharNode 
  | OperatorNode 
  | VariableNode 
  | FractionNode 
  | PowerNode 
  | RootNode 
  | FunctionNode 
  | ParenthesesNode 
  | AbsNode;

export type MathSequence = MathNode[];

export interface CursorStep {
  nodeId: string;
  slot: SlotName;
}

export interface CursorPath {
  steps: CursorStep[];
  index: number;
}
