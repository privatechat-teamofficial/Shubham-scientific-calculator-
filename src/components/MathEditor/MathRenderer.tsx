import React from 'react';
import { CursorPath, CursorStep, FractionNode, MathNode, MathSequence } from '../../lib/ast/types';

export const BASE_FONT_SIZE = 26; // Fixed base mathematical typography size in px
export const FRACTION_NUMERATOR_GAP = 0; // Tightly compact gap in px between numerator and fraction bar
export const FRACTION_DENOMINATOR_GAP = 2.5; // Compact gap in px between fraction bar and denominator
export const FRACTION_LINE_THICKNESS = 1.75; // Crisp line thickness in px

interface MathRendererProps {
  sequence: MathSequence;
  cursor: CursorPath;
  onSetCursor: (path: CursorPath) => void;
  fontSize?: number;
}

const Cursor: React.FC = () => (
  <span 
    data-math-cursor="true"
    className="inline-block w-0.5 bg-blue-600 animate-cursor-blink mx-[0.5px] select-none pointer-events-none rounded-[0.5px]" 
    style={{
      height: '0.72em',
      verticalAlign: 'baseline',
      position: 'relative',
      bottom: '0.06em',
    }}
  />
);

export const MathRenderer: React.FC<MathRendererProps> = ({
  sequence,
  cursor,
  onSetCursor,
  fontSize = BASE_FONT_SIZE,
}) => {
  return (
    <div 
      className="inline-flex items-center whitespace-nowrap flex-nowrap min-h-[1.6em] text-[#0f172a] font-oryno-input font-medium select-none"
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: 1.2,
      }}
    >
      <SequenceRenderer
        sequence={sequence}
        steps={[]}
        cursor={cursor}
        onSetCursor={onSetCursor}
        depth={0}
      />
    </div>
  );
};

interface SequenceRendererProps {
  sequence: MathSequence;
  steps: CursorStep[];
  cursor: CursorPath;
  onSetCursor: (path: CursorPath) => void;
  depth?: number;
}

const SequenceRenderer: React.FC<SequenceRendererProps> = ({
  sequence,
  steps,
  cursor,
  onSetCursor,
  depth = 0,
}) => {
  const isCurrentSequence = areStepsEqual(steps, cursor.steps);

  // Empty sequence handling
  if (sequence.length === 0) {
    if (depth === 0) {
      if (isCurrentSequence && cursor.index === 0) {
        return (
          <span 
            className="inline-flex items-baseline select-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({ steps, index: 0 });
            }}
          >
            <span className="invisible select-none inline-block w-0 overflow-hidden leading-none pointer-events-none">0</span>
            <Cursor />
          </span>
        );
      }
      return null;
    }

    // Inside nested template slots (fractions, exponents, roots)
    if (isCurrentSequence && cursor.index === 0) {
      return (
        <span 
          className="relative inline-flex items-center justify-center w-[0.68em] h-[0.75em] mx-0.5 cursor-pointer align-middle"
          onClick={(e) => {
            e.stopPropagation();
            onSetCursor({ steps, index: 0 });
          }}
        >
          <span className="inline-block w-full h-full border-2 border-dashed border-blue-500/90 rounded-[2px] bg-blue-100/30" />
          <Cursor />
        </span>
      );
    }

    // Empty template placeholder box (▫)
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onSetCursor({ steps, index: 0 });
        }}
        className="inline-block w-[0.68em] h-[0.75em] border-2 border-dashed border-slate-400/90 rounded-[2px] bg-slate-200/40 hover:bg-slate-300/60 transition-colors mx-0.5 cursor-pointer align-middle"
        title="Empty template box"
      />
    );
  }

  return (
    <span className="inline-flex items-center align-middle whitespace-nowrap">
      {isCurrentSequence && cursor.index === 0 && <Cursor />}

      {sequence.map((node, i) => (
        <React.Fragment key={node.id}>
          <NodeRenderer
            node={node}
            steps={steps}
            cursor={cursor}
            onSetCursor={onSetCursor}
            index={i}
            depth={depth}
          />
          {isCurrentSequence && cursor.index === i + 1 && <Cursor />}
        </React.Fragment>
      ))}
    </span>
  );
};

interface NodeRendererProps {
  node: MathNode;
  steps: CursorStep[];
  cursor: CursorPath;
  onSetCursor: (path: CursorPath) => void;
  index: number;
  depth: number;
}

const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  steps,
  cursor,
  onSetCursor,
  index,
  depth,
}) => {
  switch (node.type) {
    case 'char':
      return (
        <span
          className="hover:text-blue-700 cursor-pointer select-none font-oryno-input font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onSetCursor({ steps, index: index + 1 });
          }}
        >
          {node.value}
        </span>
      );

    case 'operator': {
      const isFactorial = node.value === '!';
      const isCombinatorics = node.value === 'P' || node.value === 'C';
      return (
        <span
          className={`${isFactorial ? 'mr-0.5' : isCombinatorics ? 'mx-0.5 font-bold' : 'mx-1'} text-[#0f172a] font-oryno-input font-medium hover:text-blue-700 cursor-pointer select-none`}
          onClick={(e) => {
            e.stopPropagation();
            onSetCursor({ steps, index: index + 1 });
          }}
        >
          {node.value === '*' ? '×' : node.value === '/' ? '÷' : node.value}
        </span>
      );
    }

    case 'variable':
      return (
        <span
          className="italic font-serif hover:text-blue-700 cursor-pointer select-none px-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onSetCursor({ steps, index: index + 1 });
          }}
        >
          {node.name}
        </span>
      );

    case 'fraction':
      return (
        <FractionRenderer
          node={node}
          steps={steps}
          cursor={cursor}
          onSetCursor={onSetCursor}
          depth={depth}
        />
      );

    case 'power':
      return (
        <span className="inline-flex items-baseline cursor-pointer">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'base' }],
                index: node.base.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.base}
              steps={[...steps, { nodeId: node.id, slot: 'base' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth}
            />
          </span>
          <sup 
            className="text-[0.7em] -top-[0.6em] relative ml-0.5 font-bold cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'exponent' }],
                index: node.exponent.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.exponent}
              steps={[...steps, { nodeId: node.id, slot: 'exponent' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth + 1}
            />
          </sup>
        </span>
      );

    case 'root':
      return (
        <span className="inline-flex items-center align-middle mx-0.5 cursor-pointer">
          {node.index && (
            <sup 
              className="text-[0.6em] -mr-1 -top-2 relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSetCursor({
                  steps: [...steps, { nodeId: node.id, slot: 'index' }],
                  index: node.index!.length,
                });
              }}
            >
              <SequenceRenderer
                sequence={node.index}
                steps={[...steps, { nodeId: node.id, slot: 'index' }]}
                cursor={cursor}
                onSetCursor={onSetCursor}
                depth={depth + 1}
              />
            </sup>
          )}
          <span className="text-[1.3em] font-serif leading-none pr-0.5">√</span>
          <span 
            className="border-t-2 border-[#0f172a] pt-0.5 px-0.5 -ml-1 inline-flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'radicand' }],
                index: node.radicand.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.radicand}
              steps={[...steps, { nodeId: node.id, slot: 'radicand' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth}
            />
          </span>
        </span>
      );

    case 'function': {
      if (node.name === 'integral') {
        return (
          <span className="inline-flex items-center">
            <span className="font-serif font-normal text-slate-900 text-[1.15em] mr-0.5 select-none leading-none">∫</span>
            <span className="text-slate-700 font-normal">(</span>
            <span 
              className="inline-flex items-center min-w-[6px]"
              onClick={(e) => {
                e.stopPropagation();
                onSetCursor({
                  steps: [...steps, { nodeId: node.id, slot: 'args' }],
                  index: node.args.length,
                });
              }}
            >
              <SequenceRenderer
                sequence={node.args}
                steps={[...steps, { nodeId: node.id, slot: 'args' }]}
                cursor={cursor}
                onSetCursor={onSetCursor}
                depth={depth}
              />
            </span>
            <span className="text-slate-700 font-normal">)</span>
            <span className="font-serif italic font-bold text-slate-900 ml-0.5 select-none text-[0.9em]">dx</span>
          </span>
        );
      }

      if (node.name === 'diff') {
        return (
          <span className="inline-flex items-center">
            <span className="font-mono text-slate-900 mr-0.5 select-none text-[0.95em] tracking-tight">
              <span className="italic font-serif">d</span>/<span className="italic font-serif">dx</span>
            </span>
            <span className="text-slate-700 font-normal">(</span>
            <span 
              className="inline-flex items-center min-w-[6px]"
              onClick={(e) => {
                e.stopPropagation();
                onSetCursor({
                  steps: [...steps, { nodeId: node.id, slot: 'args' }],
                  index: node.args.length,
                });
              }}
            >
              <SequenceRenderer
                sequence={node.args}
                steps={[...steps, { nodeId: node.id, slot: 'args' }]}
                cursor={cursor}
                onSetCursor={onSetCursor}
                depth={depth}
              />
            </span>
            <span className="text-slate-700 font-normal">)</span>
          </span>
        );
      }

      let displayName = node.name;
      if (node.name === 'log10') displayName = 'log';
      else if (node.name === 'asin') displayName = 'sin⁻¹';
      else if (node.name === 'acos') displayName = 'cos⁻¹';
      else if (node.name === 'atan') displayName = 'tan⁻¹';
      else if (node.name === 'sigma') displayName = '∑';
      else if (node.name === 'factor') displayName = 'Factor';

      return (
        <span className="inline-flex items-center">
          <span className="font-normal italic text-slate-800 mr-0.5">{displayName}</span>
          <span className="text-slate-700">(</span>
          <span 
            className="inline-flex items-center min-w-[6px]"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'args' }],
                index: node.args.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.args}
              steps={[...steps, { nodeId: node.id, slot: 'args' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth}
            />
          </span>
          <span className="text-slate-700">)</span>
        </span>
      );
    }

    case 'parentheses':
      return (
        <span className="inline-flex items-center">
          <span className="text-slate-700">(</span>
          <span 
            className="inline-flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'content' }],
                index: node.content.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.content}
              steps={[...steps, { nodeId: node.id, slot: 'content' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth}
            />
          </span>
          <span className="text-slate-700">)</span>
        </span>
      );

    case 'abs':
      return (
        <span className="inline-flex items-center">
          <span className="text-slate-700 font-bold">|</span>
          <span 
            className="inline-flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSetCursor({
                steps: [...steps, { nodeId: node.id, slot: 'content' }],
                index: node.content.length,
              });
            }}
          >
            <SequenceRenderer
              sequence={node.content}
              steps={[...steps, { nodeId: node.id, slot: 'content' }]}
              cursor={cursor}
              onSetCursor={onSetCursor}
              depth={depth}
            />
          </span>
          <span className="text-slate-700 font-bold">|</span>
        </span>
      );
  }
};

/**
 * Dedicated FractionRenderer
 */
interface FractionRendererProps {
  node: FractionNode;
  steps: CursorStep[];
  cursor: CursorPath;
  onSetCursor: (path: CursorPath) => void;
  depth: number;
}

const FractionRenderer: React.FC<FractionRendererProps> = ({
  node,
  steps,
  cursor,
  onSetCursor,
  depth,
}) => {
  return (
    <div 
      className="inline-flex flex-col items-center justify-center align-middle mx-[1px] my-0 cursor-pointer select-none text-[1em]"
      style={{
        verticalAlign: 'middle',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSetCursor({
          steps: [...steps, { nodeId: node.id, slot: 'denominator' }],
          index: node.denominator.length,
        });
      }}
    >
      {/* Numerator */}
      <div 
        className="w-full flex items-center justify-center text-center px-0.5 font-oryno-input font-medium leading-none"
        style={{
          paddingTop: '0px',
          paddingBottom: '0px',
          marginBottom: '0px',
          minHeight: '0.92em',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSetCursor({
            steps: [...steps, { nodeId: node.id, slot: 'numerator' }],
            index: node.numerator.length,
          });
        }}
      >
        <SequenceRenderer
          sequence={node.numerator}
          steps={[...steps, { nodeId: node.id, slot: 'numerator' }]}
          cursor={cursor}
          onSetCursor={onSetCursor}
          depth={depth + 1}
        />
      </div>

      {/* Horizontal Fraction Bar */}
      <div 
        className="w-full bg-[#0f172a] rounded-full min-w-[14px] my-0 shrink-0" 
        style={{ height: '1.5px' }}
      />

      {/* Denominator */}
      <div 
        className="w-full flex items-center justify-center text-center px-0.5 font-oryno-input font-medium leading-none"
        style={{
          paddingTop: '2px',
          paddingBottom: '1px',
          marginTop: '0px',
          minHeight: '1em',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSetCursor({
            steps: [...steps, { nodeId: node.id, slot: 'denominator' }],
            index: node.denominator.length,
          });
        }}
      >
        <SequenceRenderer
          sequence={node.denominator}
          steps={[...steps, { nodeId: node.id, slot: 'denominator' }]}
          cursor={cursor}
          onSetCursor={onSetCursor}
          depth={depth + 1}
        />
      </div>
    </div>
  );
};

function areStepsEqual(a: CursorStep[], b: CursorStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].nodeId !== b[i].nodeId || a[i].slot !== b[i].slot) {
      return false;
    }
  }
  return true;
}
