import { CursorPath, CursorStep, MathNode, MathSequence, SlotName } from './types';

let nextId = 1;
export function createId(): string {
  return `n_${nextId++}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Deep clone an AST sequence
 */
export function cloneSequence(seq: MathSequence): MathSequence {
  return seq.map((node) => {
    switch (node.type) {
      case 'char':
      case 'operator':
      case 'variable':
        return { ...node };
      case 'fraction':
        return {
          ...node,
          numerator: cloneSequence(node.numerator),
          denominator: cloneSequence(node.denominator),
        };
      case 'power':
        return {
          ...node,
          base: cloneSequence(node.base),
          exponent: cloneSequence(node.exponent),
        };
      case 'root':
        return {
          ...node,
          index: node.index ? cloneSequence(node.index) : undefined,
          radicand: cloneSequence(node.radicand),
        };
      case 'function':
        return {
          ...node,
          args: cloneSequence(node.args),
        };
      case 'parentheses':
      case 'abs':
        return {
          ...node,
          content: cloneSequence(node.content),
        };
    }
  });
}

/**
 * Locate the sequence at the given cursor path steps
 */
export function getSequenceAtSteps(root: MathSequence, steps: CursorStep[]): MathSequence | null {
  let curr = root;
  for (const step of steps) {
    const node = curr.find((n) => n.id === step.nodeId);
    if (!node) return null;

    if (node.type === 'fraction') {
      if (step.slot === 'numerator') curr = node.numerator;
      else if (step.slot === 'denominator') curr = node.denominator;
      else return null;
    } else if (node.type === 'power') {
      if (step.slot === 'base') curr = node.base;
      else if (step.slot === 'exponent') curr = node.exponent;
      else return null;
    } else if (node.type === 'root') {
      if (step.slot === 'radicand') curr = node.radicand;
      else if (step.slot === 'index') {
        if (!node.index) node.index = [];
        curr = node.index;
      } else return null;
    } else if (node.type === 'function') {
      if (step.slot === 'args') curr = node.args;
      else return null;
    } else if (node.type === 'parentheses' || node.type === 'abs') {
      if (step.slot === 'content') curr = node.content;
      else return null;
    } else {
      return null;
    }
  }
  return curr;
}

/**
 * Finds the parent node of the current cursor path if any
 */
export function getParentNode(root: MathSequence, steps: CursorStep[]): MathNode | null {
  if (steps.length === 0) return null;
  const parentSteps = steps.slice(0, -1);
  const targetId = steps[steps.length - 1].nodeId;
  const parentSeq = getSequenceAtSteps(root, parentSteps);
  if (!parentSeq) return null;
  return parentSeq.find((n) => n.id === targetId) || null;
}

/**
 * Finds preceding term (e.g. continuous digits/dots or parenthesized expression or power)
 * before cursor to absorb into numerator or power base.
 */
function extractPrecedingTerm(seq: MathSequence, index: number): { term: MathSequence; startIndex: number } {
  if (index <= 0 || seq.length === 0) {
    return { term: [], startIndex: index };
  }

  let i = index - 1;
  const last = seq[i];

  // If last node is a bracketed, root, or power term, extract it
  if (last.type === 'parentheses' || last.type === 'power' || last.type === 'root' || last.type === 'fraction' || last.type === 'variable') {
    return { term: [last], startIndex: i };
  }

  // If digits or decimal points, extract the contiguous number
  if (last.type === 'char') {
    while (i >= 0 && seq[i].type === 'char') {
      i--;
    }
    const startIndex = i + 1;
    const term = seq.slice(startIndex, index);
    return { term, startIndex };
  }

  return { term: [], startIndex: index };
}

/**
 * Insert a character (digit or decimal point) at cursor
 */
export function insertChar(root: MathSequence, cursor: CursorPath, char: string): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const newNode: MathNode = {
    id: createId(),
    type: 'char',
    value: char,
  };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  targetSeq.splice(idx, 0, newNode);

  return {
    root: newRoot,
    cursor: {
      steps: cursor.steps,
      index: idx + 1,
    },
  };
}

/**
 * Insert an operator (+, −, ×, ÷) at cursor
 */
export function insertOperator(root: MathSequence, cursor: CursorPath, op: string): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);

  // If preceding node is an operator in the same sequence, replace it unless minus (negative sign)
  if (idx > 0 && targetSeq[idx - 1].type === 'operator') {
    if (op !== '−' && op !== '-') {
      targetSeq[idx - 1] = {
        id: createId(),
        type: 'operator',
        value: op,
      };
      return {
        root: newRoot,
        cursor: {
          steps: cursor.steps,
          index: idx,
        },
      };
    }
  }

  const newNode: MathNode = {
    id: createId(),
    type: 'operator',
    value: op,
  };

  targetSeq.splice(idx, 0, newNode);

  return {
    root: newRoot,
    cursor: {
      steps: cursor.steps,
      index: idx + 1,
    },
  };
}

/**
 * Insert a variable (e.g. x, π, e, Ans) at cursor
 */
export function insertVariable(root: MathSequence, cursor: CursorPath, name: string): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const newNode: MathNode = {
    id: createId(),
    type: 'variable',
    name,
  };

  targetSeq.splice(idx, 0, newNode);

  return {
    root: newRoot,
    cursor: {
      steps: cursor.steps,
      index: idx + 1,
    },
  };
}

/**
 * Insert a Fraction [■/□]
 * If there is an existing number/expression before cursor, wrap it as the numerator
 * and put cursor in the empty denominator.
 * If nothing before cursor, create empty numerator and denominator, put cursor in numerator.
 */
export function insertFraction(root: MathSequence, cursor: CursorPath): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const { term, startIndex } = extractPrecedingTerm(targetSeq, idx);

  const fracId = createId();

  if (term.length > 0) {
    // Replace preceding term with FractionNode whose numerator is that term
    const fracNode: MathNode = {
      id: fracId,
      type: 'fraction',
      numerator: term,
      denominator: [],
    };

    targetSeq.splice(startIndex, term.length, fracNode);

    // Place cursor in the empty denominator
    return {
      root: newRoot,
      cursor: {
        steps: [...cursor.steps, { nodeId: fracId, slot: 'denominator' }],
        index: 0,
      },
    };
  } else {
    // Empty fraction, cursor in numerator
    const fracNode: MathNode = {
      id: fracId,
      type: 'fraction',
      numerator: [],
      denominator: [],
    };

    targetSeq.splice(idx, 0, fracNode);

    return {
      root: newRoot,
      cursor: {
        steps: [...cursor.steps, { nodeId: fracId, slot: 'numerator' }],
        index: 0,
      },
    };
  }
}

/**
 * Insert Power (e.g. x², x^▫, x⁻¹)
 */
export function insertPower(root: MathSequence, cursor: CursorPath, exponentChars?: string[]): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const { term, startIndex } = extractPrecedingTerm(targetSeq, idx);

  const powerId = createId();
  const baseSeq = term.length > 0 ? term : [{ id: createId(), type: 'variable' as const, name: 'x' }];

  if (exponentChars && exponentChars.length > 0) {
    const expNodes: MathNode[] = exponentChars.map((ch) => ({
      id: createId(),
      type: 'char',
      value: ch,
    }));

    const powerNode: MathNode = {
      id: powerId,
      type: 'power',
      base: baseSeq,
      exponent: expNodes,
    };

    if (term.length > 0) {
      targetSeq.splice(startIndex, term.length, powerNode);
    } else {
      targetSeq.splice(idx, 0, powerNode);
    }

    // Place cursor after the power node
    const newIdx = term.length > 0 ? startIndex + 1 : idx + 1;
    return {
      root: newRoot,
      cursor: {
        steps: cursor.steps,
        index: newIdx,
      },
    };
  } else {
    // Empty exponent (x^▫), place cursor inside exponent
    const powerNode: MathNode = {
      id: powerId,
      type: 'power',
      base: baseSeq,
      exponent: [],
    };

    if (term.length > 0) {
      targetSeq.splice(startIndex, term.length, powerNode);
    } else {
      targetSeq.splice(idx, 0, powerNode);
    }

    return {
      root: newRoot,
      cursor: {
        steps: [...cursor.steps, { nodeId: powerId, slot: 'exponent' }],
        index: 0,
      },
    };
  }
}

/**
 * Insert Root (√▫ or ³√▫ or ⁿ√▫)
 */
export function insertRoot(root: MathSequence, cursor: CursorPath, indexChars?: string[]): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const rootId = createId();

  const rootNode: MathNode = {
    id: rootId,
    type: 'root',
    index: indexChars ? indexChars.map((ch) => ({ id: createId(), type: 'char', value: ch })) : undefined,
    radicand: [],
  };

  targetSeq.splice(idx, 0, rootNode);

  return {
    root: newRoot,
    cursor: {
      steps: [...cursor.steps, { nodeId: rootId, slot: 'radicand' }],
      index: 0,
    },
  };
}

/**
 * Insert Function (sin, cos, tan, ln, log)
 */
export function insertFunction(root: MathSequence, cursor: CursorPath, name: string): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const funcId = createId();

  const funcNode: MathNode = {
    id: funcId,
    type: 'function',
    name,
    args: [],
  };

  targetSeq.splice(idx, 0, funcNode);

  return {
    root: newRoot,
    cursor: {
      steps: [...cursor.steps, { nodeId: funcId, slot: 'args' }],
      index: 0,
    },
  };
}

/**
 * Insert Parentheses ( )
 */
export function insertParentheses(root: MathSequence, cursor: CursorPath): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const parenId = createId();

  const parenNode: MathNode = {
    id: parenId,
    type: 'parentheses',
    content: [],
  };

  targetSeq.splice(idx, 0, parenNode);

  return {
    root: newRoot,
    cursor: {
      steps: [...cursor.steps, { nodeId: parenId, slot: 'content' }],
      index: 0,
    },
  };
}

/**
 * Insert Absolute Value |x|
 */
export function insertAbs(root: MathSequence, cursor: CursorPath): { root: MathSequence; cursor: CursorPath } {
  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  const idx = Math.min(Math.max(0, cursor.index), targetSeq.length);
  const absId = createId();

  const absNode: MathNode = {
    id: absId,
    type: 'abs',
    content: [],
  };

  targetSeq.splice(idx, 0, absNode);

  return {
    root: newRoot,
    cursor: {
      steps: [...cursor.steps, { nodeId: absId, slot: 'content' }],
      index: 0,
    },
  };
}

/**
 * Delete at cursor (DEL)
 */
export function deleteAtCursor(root: MathSequence, cursor: CursorPath): { root: MathSequence; cursor: CursorPath } {
  if (cursor.index === 0 && cursor.steps.length === 0) {
    return { root, cursor };
  }

  const newRoot = cloneSequence(root);
  const targetSeq = getSequenceAtSteps(newRoot, cursor.steps);
  if (!targetSeq) return { root, cursor };

  // Case 1: Cursor has an element before it in current sequence
  if (cursor.index > 0) {
    const nodeToDelete = targetSeq[cursor.index - 1];

    // If node is a simple character/operator/variable, remove it
    if (nodeToDelete.type === 'char' || nodeToDelete.type === 'operator' || nodeToDelete.type === 'variable') {
      targetSeq.splice(cursor.index - 1, 1);
      return {
        root: newRoot,
        cursor: {
          steps: cursor.steps,
          index: cursor.index - 1,
        },
      };
    }

    // If node is a structured node (fraction, power, root, etc.):
    // If it's completely empty, remove it
    if (isNodeEmpty(nodeToDelete)) {
      targetSeq.splice(cursor.index - 1, 1);
      return {
        root: newRoot,
        cursor: {
          steps: cursor.steps,
          index: cursor.index - 1,
        },
      };
    }

    // If it has content, enter into its last slot at the end so user can delete inside
    const lastSlot = getLastSlot(nodeToDelete);
    if (lastSlot) {
      return {
        root: newRoot,
        cursor: {
          steps: [...cursor.steps, { nodeId: nodeToDelete.id, slot: lastSlot.slot }],
          index: lastSlot.seq.length,
        },
      };
    }

    targetSeq.splice(cursor.index - 1, 1);
    return {
      root: newRoot,
      cursor: {
        steps: cursor.steps,
        index: cursor.index - 1,
      },
    };
  }

  // Case 2: Cursor is at index 0 inside a nested slot (path.length > 0)
  if (cursor.steps.length > 0) {
    const parentSteps = cursor.steps.slice(0, -1);
    const currStep = cursor.steps[cursor.steps.length - 1];
    const parentSeq = getSequenceAtSteps(newRoot, parentSteps);
    if (!parentSeq) return { root, cursor };

    const parentNodeIdx = parentSeq.findIndex((n) => n.id === currStep.nodeId);
    if (parentNodeIdx === -1) return { root, cursor };

    const parentNode = parentSeq[parentNodeIdx];

    // Sub-case: Fraction
    if (parentNode.type === 'fraction') {
      if (currStep.slot === 'denominator') {
        if (parentNode.denominator.length === 0) {
          // Dissolve fraction into numerator elements
          const numElements = parentNode.numerator;
          parentSeq.splice(parentNodeIdx, 1, ...numElements);
          return {
            root: newRoot,
            cursor: {
              steps: parentSteps,
              index: parentNodeIdx + numElements.length,
            },
          };
        } else {
          // Move cursor to end of numerator
          return {
            root: newRoot,
            cursor: {
              steps: [...parentSteps, { nodeId: parentNode.id, slot: 'numerator' }],
              index: parentNode.numerator.length,
            },
          };
        }
      } else if (currStep.slot === 'numerator') {
        if (parentNode.numerator.length === 0) {
          if (parentNode.denominator.length === 0) {
            // Remove empty fraction
            parentSeq.splice(parentNodeIdx, 1);
            return {
              root: newRoot,
              cursor: {
                steps: parentSteps,
                index: parentNodeIdx,
              },
            };
          } else {
            // Dissolve fraction into denominator elements
            const denElements = parentNode.denominator;
            parentSeq.splice(parentNodeIdx, 1, ...denElements);
            return {
              root: newRoot,
              cursor: {
                steps: parentSteps,
                index: parentNodeIdx,
              },
            };
          }
        } else {
          // Exit to before fraction
          return {
            root: newRoot,
            cursor: {
              steps: parentSteps,
              index: parentNodeIdx,
            },
          };
        }
      }
    }

    // Sub-case: Power
    if (parentNode.type === 'power') {
      if (currStep.slot === 'exponent') {
        if (parentNode.exponent.length === 0) {
          // Dissolve power into base
          const baseElements = parentNode.base;
          parentSeq.splice(parentNodeIdx, 1, ...baseElements);
          return {
            root: newRoot,
            cursor: {
              steps: parentSteps,
              index: parentNodeIdx + baseElements.length,
            },
          };
        } else {
          return {
            root: newRoot,
            cursor: {
              steps: [...parentSteps, { nodeId: parentNode.id, slot: 'base' }],
              index: parentNode.base.length,
            },
          };
        }
      }
    }

    // Sub-case: Root / Function / Parentheses
    if (parentNode.type === 'root' || parentNode.type === 'function' || parentNode.type === 'parentheses' || parentNode.type === 'abs') {
      const innerContent = 
        parentNode.type === 'root' ? parentNode.radicand :
        parentNode.type === 'function' ? parentNode.args : parentNode.content;

      if (innerContent.length === 0) {
        parentSeq.splice(parentNodeIdx, 1);
        return {
          root: newRoot,
          cursor: {
            steps: parentSteps,
            index: parentNodeIdx,
          },
        };
      } else {
        // Exit to before the node
        return {
          root: newRoot,
          cursor: {
            steps: parentSteps,
            index: parentNodeIdx,
          },
        };
      }
    }
  }

  return { root, cursor };
}

function isNodeEmpty(node: MathNode): boolean {
  switch (node.type) {
    case 'fraction':
      return node.numerator.length === 0 && node.denominator.length === 0;
    case 'power':
      return node.base.length === 0 && node.exponent.length === 0;
    case 'root':
      return (!node.index || node.index.length === 0) && node.radicand.length === 0;
    case 'function':
      return node.args.length === 0;
    case 'parentheses':
    case 'abs':
      return node.content.length === 0;
    default:
      return false;
  }
}

function getLastSlot(node: MathNode): { slot: SlotName; seq: MathSequence } | null {
  switch (node.type) {
    case 'fraction':
      return { slot: 'denominator', seq: node.denominator };
    case 'power':
      return { slot: 'exponent', seq: node.exponent };
    case 'root':
      return { slot: 'radicand', seq: node.radicand };
    case 'function':
      return { slot: 'args', seq: node.args };
    case 'parentheses':
    case 'abs':
      return { slot: 'content', seq: node.content };
    default:
      return null;
  }
}

function getFirstSlot(node: MathNode): { slot: SlotName; seq: MathSequence } | null {
  switch (node.type) {
    case 'fraction':
      return { slot: 'numerator', seq: node.numerator };
    case 'power':
      return { slot: 'base', seq: node.base };
    case 'root':
      return node.index && node.index.length > 0
        ? { slot: 'index', seq: node.index }
        : { slot: 'radicand', seq: node.radicand };
    case 'function':
      return { slot: 'args', seq: node.args };
    case 'parentheses':
    case 'abs':
      return { slot: 'content', seq: node.content };
    default:
      return null;
  }
}

/**
 * Move Cursor Left (←)
 */
export function moveCursorLeft(root: MathSequence, cursor: CursorPath): CursorPath {
  const targetSeq = getSequenceAtSteps(root, cursor.steps);
  if (!targetSeq) return cursor;

  // If we can move left in the current sequence
  if (cursor.index > 0) {
    const prevNode = targetSeq[cursor.index - 1];
    const lastSlot = getLastSlot(prevNode);
    if (lastSlot) {
      // Descend into the last slot of the node
      return {
        steps: [...cursor.steps, { nodeId: prevNode.id, slot: lastSlot.slot }],
        index: lastSlot.seq.length,
      };
    } else {
      return {
        steps: cursor.steps,
        index: cursor.index - 1,
      };
    }
  }

  // If at index 0 and inside a slot
  if (cursor.steps.length > 0) {
    const parentSteps = cursor.steps.slice(0, -1);
    const currStep = cursor.steps[cursor.steps.length - 1];
    const parentSeq = getSequenceAtSteps(root, parentSteps);
    if (!parentSeq) return cursor;

    const parentNodeIdx = parentSeq.findIndex((n) => n.id === currStep.nodeId);
    if (parentNodeIdx === -1) return cursor;

    const parentNode = parentSeq[parentNodeIdx];

    // Inside fraction denominator -> move to end of numerator
    if (parentNode.type === 'fraction' && currStep.slot === 'denominator') {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'numerator' }],
        index: parentNode.numerator.length,
      };
    }

    // Inside power exponent -> move to end of base
    if (parentNode.type === 'power' && currStep.slot === 'exponent') {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'base' }],
        index: parentNode.base.length,
      };
    }

    // Inside root radicand with index -> move to index
    if (parentNode.type === 'root' && currStep.slot === 'radicand' && parentNode.index) {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'index' }],
        index: parentNode.index.length,
      };
    }

    // Otherwise, exit to before the parent node
    return {
      steps: parentSteps,
      index: parentNodeIdx,
    };
  }

  return cursor;
}

/**
 * Move Cursor Right (→)
 */
export function moveCursorRight(root: MathSequence, cursor: CursorPath): CursorPath {
  const targetSeq = getSequenceAtSteps(root, cursor.steps);
  if (!targetSeq) return cursor;

  // If there is a node to the right in current sequence
  if (cursor.index < targetSeq.length) {
    const nextNode = targetSeq[cursor.index];
    const firstSlot = getFirstSlot(nextNode);
    if (firstSlot) {
      // Enter the first slot of the node
      return {
        steps: [...cursor.steps, { nodeId: nextNode.id, slot: firstSlot.slot }],
        index: 0,
      };
    } else {
      return {
        steps: cursor.steps,
        index: cursor.index + 1,
      };
    }
  }

  // If at the end of current sequence and inside a slot
  if (cursor.steps.length > 0) {
    const parentSteps = cursor.steps.slice(0, -1);
    const currStep = cursor.steps[cursor.steps.length - 1];
    const parentSeq = getSequenceAtSteps(root, parentSteps);
    if (!parentSeq) return cursor;

    const parentNodeIdx = parentSeq.findIndex((n) => n.id === currStep.nodeId);
    if (parentNodeIdx === -1) return cursor;

    const parentNode = parentSeq[parentNodeIdx];

    // Inside fraction numerator -> move to beginning of denominator
    if (parentNode.type === 'fraction' && currStep.slot === 'numerator') {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'denominator' }],
        index: 0,
      };
    }

    // Inside power base -> move to beginning of exponent
    if (parentNode.type === 'power' && currStep.slot === 'base') {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'exponent' }],
        index: 0,
      };
    }

    // Inside root index -> move to radicand
    if (parentNode.type === 'root' && currStep.slot === 'index') {
      return {
        steps: [...parentSteps, { nodeId: parentNode.id, slot: 'radicand' }],
        index: 0,
      };
    }

    // Otherwise, exit to after the parent node
    return {
      steps: parentSteps,
      index: parentNodeIdx + 1,
    };
  }

  return cursor;
}

/**
 * Move Cursor Up (↑)
 * Inside denominator -> moves to numerator!
 * Inside power base -> moves to exponent!
 */
export function moveCursorUp(root: MathSequence, cursor: CursorPath): CursorPath {
  if (cursor.steps.length === 0) return cursor;

  const parentSteps = cursor.steps.slice(0, -1);
  const currStep = cursor.steps[cursor.steps.length - 1];
  const parentSeq = getSequenceAtSteps(root, parentSteps);
  if (!parentSeq) return cursor;

  const parentNode = parentSeq.find((n) => n.id === currStep.nodeId);
  if (!parentNode) return cursor;

  if (parentNode.type === 'fraction' && currStep.slot === 'denominator') {
    return {
      steps: [...parentSteps, { nodeId: parentNode.id, slot: 'numerator' }],
      index: Math.min(cursor.index, parentNode.numerator.length),
    };
  }

  if (parentNode.type === 'power' && currStep.slot === 'base') {
    return {
      steps: [...parentSteps, { nodeId: parentNode.id, slot: 'exponent' }],
      index: Math.min(cursor.index, parentNode.exponent.length),
    };
  }

  if (parentNode.type === 'root' && currStep.slot === 'radicand' && parentNode.index) {
    return {
      steps: [...parentSteps, { nodeId: parentNode.id, slot: 'index' }],
      index: Math.min(cursor.index, parentNode.index.length),
    };
  }

  return cursor;
}

/**
 * Move Cursor Down (↓)
 * Inside numerator -> moves to denominator!
 * Inside exponent -> moves to base or exits!
 */
export function moveCursorDown(root: MathSequence, cursor: CursorPath): CursorPath {
  if (cursor.steps.length === 0) return cursor;

  const parentSteps = cursor.steps.slice(0, -1);
  const currStep = cursor.steps[cursor.steps.length - 1];
  const parentSeq = getSequenceAtSteps(root, parentSteps);
  if (!parentSeq) return cursor;

  const parentNode = parentSeq.find((n) => n.id === currStep.nodeId);
  if (!parentNode) return cursor;

  if (parentNode.type === 'fraction' && currStep.slot === 'numerator') {
    return {
      steps: [...parentSteps, { nodeId: parentNode.id, slot: 'denominator' }],
      index: Math.min(cursor.index, parentNode.denominator.length),
    };
  }

  if (parentNode.type === 'power' && currStep.slot === 'exponent') {
    const parentNodeIdx = parentSeq.findIndex((n) => n.id === currStep.nodeId);
    return {
      steps: parentSteps,
      index: parentNodeIdx + 1,
    };
  }

  if (parentNode.type === 'root' && currStep.slot === 'index') {
    return {
      steps: [...parentSteps, { nodeId: parentNode.id, slot: 'radicand' }],
      index: Math.min(cursor.index, parentNode.radicand.length),
    };
  }

  return cursor;
}

/**
 * Convert AST to evaluatable mathematical string for mathEngine
 */
export function astToMathString(seq: MathSequence): string {
  if (seq.length === 0) return '';

  let out = '';
  for (let i = 0; i < seq.length; i++) {
    const node = seq[i];
    switch (node.type) {
      case 'char':
        out += node.value;
        break;
      case 'operator':
        if (node.value === '×') out += ' * ';
        else if (node.value === '÷') out += ' / ';
        else if (node.value === '−') out += ' - ';
        else out += ` ${node.value} `;
        break;
      case 'variable':
        out += node.name === 'π' ? 'pi' : node.name;
        break;
      case 'fraction': {
        const numStr = astToMathString(node.numerator) || '0';
        const denStr = astToMathString(node.denominator) || '1';
        out += `(${numStr})/(${denStr})`;
        break;
      }
      case 'power': {
        const baseStr = astToMathString(node.base) || 'x';
        const expStr = astToMathString(node.exponent) || '1';
        out += `(${baseStr})^(${expStr})`;
        break;
      }
      case 'root': {
        const radStr = astToMathString(node.radicand) || '0';
        if (node.index && node.index.length > 0) {
          const idxStr = astToMathString(node.index) || '2';
          out += `nthRoot(${radStr}, ${idxStr})`;
        } else {
          out += `sqrt(${radStr})`;
        }
        break;
      }
      case 'function': {
        const argsStr = astToMathString(node.args) || '0';
        out += `${node.name}(${argsStr})`;
        break;
      }
      case 'parentheses': {
        const contentStr = astToMathString(node.content);
        out += `(${contentStr})`;
        break;
      }
      case 'abs': {
        const contentStr = astToMathString(node.content) || '0';
        out += `abs(${contentStr})`;
        break;
      }
    }
  }

  return out.trim();
}

/**
 * Convert AST to clean LaTeX representation for step-solver or display
 */
export function astToLatex(seq: MathSequence): string {
  if (seq.length === 0) return '';

  let out = '';
  for (const node of seq) {
    switch (node.type) {
      case 'char':
        out += node.value;
        break;
      case 'operator':
        if (node.value === '×') out += ' \\times ';
        else if (node.value === '÷') out += ' \\div ';
        else if (node.value === '−') out += ' - ';
        else out += ` ${node.value} `;
        break;
      case 'variable':
        out += node.name === 'π' ? '\\pi ' : node.name;
        break;
      case 'fraction': {
        const num = astToLatex(node.numerator) || ' ';
        const den = astToLatex(node.denominator) || ' ';
        out += `\\frac{${num}}{${den}}`;
        break;
      }
      case 'power': {
        const base = astToLatex(node.base) || 'x';
        const exp = astToLatex(node.exponent) || ' ';
        out += `{${base}}^{${exp}}`;
        break;
      }
      case 'root': {
        const rad = astToLatex(node.radicand) || ' ';
        if (node.index && node.index.length > 0) {
          const idx = astToLatex(node.index);
          out += `\\sqrt[${idx}]{${rad}}`;
        } else {
          out += `\\sqrt{${rad}}`;
        }
        break;
      }
      case 'function': {
        const args = astToLatex(node.args);
        out += `\\${node.name}\\left(${args}\\right)`;
        break;
      }
      case 'parentheses': {
        const content = astToLatex(node.content);
        out += `\\left(${content}\\right)`;
        break;
      }
      case 'abs': {
        const content = astToLatex(node.content);
        out += `\\left|${content}\\right|`;
        break;
      }
    }
  }

  return out;
}

/**
 * Convert a math string (e.g. from history or constants) into an AST sequence
 */
export function mathStringToAst(str: string): MathSequence {
  if (!str) return [];
  const seq: MathSequence = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number digits and dot
    if (/[0-9.]/.test(ch)) {
      seq.push({ id: createId(), type: 'char', value: ch });
      i++;
      continue;
    }

    // Operators
    if (ch === '+' || ch === '-' || ch === '−' || ch === '*' || ch === '×' || ch === '/' || ch === '÷') {
      const op = ch === '*' ? '×' : ch === '/' ? '÷' : ch === '-' || ch === '−' ? '−' : '+';
      seq.push({ id: createId(), type: 'operator', value: op });
      i++;
      continue;
    }

    // Parenthesized expression
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < str.length && depth > 0) {
        if (str[j] === '(') depth++;
        else if (str[j] === ')') depth--;
        j++;
      }
      const innerStr = str.substring(i + 1, depth === 0 ? j - 1 : j);
      seq.push({
        id: createId(),
        type: 'parentheses',
        content: mathStringToAst(innerStr),
      });
      i = j;
      continue;
    }

    // Identifier / Function / Variable
    const wordMatch = str.slice(i).match(/^([a-zA-Zπ_][a-zA-Z0-9π_]*)/);
    if (wordMatch) {
      const word = wordMatch[1];
      const afterWordIdx = i + word.length;
      if (afterWordIdx < str.length && str[afterWordIdx] === '(') {
        let depth = 1;
        let j = afterWordIdx + 1;
        while (j < str.length && depth > 0) {
          if (str[j] === '(') depth++;
          else if (str[j] === ')') depth--;
          j++;
        }
        const innerStr = str.substring(afterWordIdx + 1, depth === 0 ? j - 1 : j);
        if (word === 'sqrt') {
          seq.push({
            id: createId(),
            type: 'root',
            radicand: mathStringToAst(innerStr),
          });
        } else if (word === 'abs') {
          seq.push({
            id: createId(),
            type: 'abs',
            content: mathStringToAst(innerStr),
          });
        } else {
          seq.push({
            id: createId(),
            type: 'function',
            name: word,
            args: mathStringToAst(innerStr),
          });
        }
        i = j;
        continue;
      } else {
        seq.push({
          id: createId(),
          type: 'variable',
          name: word,
        });
        i += word.length;
        continue;
      }
    }

    // Default char
    seq.push({ id: createId(), type: 'char', value: ch });
    i++;
  }
  return seq;
}
