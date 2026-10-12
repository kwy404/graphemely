import type { Rule } from 'eslint';
import type { MemberExpression, Node } from 'estree';
import { DOCS_URL, calleeName, isSplitEmpty } from '../utils';

/** True for `[...x]` (an array literal with one spread and nothing else). */
function isSpreadToArray(node: Node): boolean {
  return (
    node.type === 'ArrayExpression' &&
    node.elements.length === 1 &&
    node.elements[0]?.type === 'SpreadElement'
  );
}

/** True for `Array.from(x)` with a single argument. */
function isArrayFrom(node: Node): boolean {
  return (
    node.type === 'CallExpression' &&
    calleeName(node) === 'from' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Array' &&
    node.arguments.length === 1
  );
}

/** True when the expression is followed by `.join(...)`. */
function isJoined(node: Rule.Node): boolean {
  const parent = node.parent;
  if (parent?.type !== 'MemberExpression' || parent.object !== node) return false;
  const call = parent.parent;
  return call?.type === 'CallExpression' && calleeName(call) === 'join';
}

/**
 * Flags string reversal through code units or code points:
 * `str.split('').reverse()`, `[...str].reverse().join('')` and
 * `Array.from(str).reverse().join('')`.
 *
 * `split('')` is always reported. For `[...x]` and `Array.from(x)` the rule
 * only reports when the result is joined back into a string, because
 * reversing a real array is fine.
 */
export const noUnsafeReverse: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reversing strings by code unit or code point, which scrambles emoji, flags and accents',
      recommended: true,
      url: `${DOCS_URL}no-unsafe-reverse.md`,
    },
    schema: [],
    messages: {
      unsafeReverse:
        'Reversing a string this way breaks emoji, flags and combining accents. Use `reverse(str)` from graphemely instead.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (calleeName(node) !== 'reverse' || node.arguments.length !== 0) return;
        const target = (node.callee as MemberExpression).object as Node;
        if (isSplitEmpty(target) || ((isSpreadToArray(target) || isArrayFrom(target)) && isJoined(node))) {
          context.report({ node, messageId: 'unsafeReverse' });
        }
      },
    };
  },
};
