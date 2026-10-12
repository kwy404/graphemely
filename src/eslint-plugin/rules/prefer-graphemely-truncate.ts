import type { Rule } from 'eslint';
import type { Node } from 'estree';
import { DOCS_URL, calleeName, staticString } from '../utils';

const CUT_METHODS = new Set(['slice', 'substring', 'substr']);
const ELLIPSIS = /^\s*(?:\.{2,3}|\u2026)\s*$/;

/** True for `x.slice(0, n)`, `x.substring(0, n)` and `x.substr(0, n)`. */
function isPrefixCut(node: Node): boolean {
  if (node.type !== 'CallExpression') return false;
  const name = calleeName(node);
  if (name === undefined || !CUT_METHODS.has(name) || node.arguments.length !== 2) return false;
  const first = node.arguments[0] as Node;
  return first.type === 'Literal' && first.value === 0;
}

function isEllipsis(node: Node): boolean {
  const value = staticString(node);
  return value !== undefined && ELLIPSIS.test(value);
}

/**
 * Conservative heuristic that flags hand-rolled truncation:
 * `str.slice(0, n) + '...'` (also `substring`, `substr`, the single
 * ellipsis character, and the template literal form).
 *
 * Code unit slicing can cut an emoji in half and leave a lone surrogate.
 */
export const preferGraphemelyTruncate: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Prefer `truncate()` from graphemely over `str.slice(0, n) + '...'`, which can cut emoji in half",
      recommended: true,
      url: `${DOCS_URL}prefer-graphemely-truncate.md`,
    },
    schema: [],
    messages: {
      preferTruncate:
        'Cutting with `.{{method}}(0, n)` counts UTF-16 code units and can split an emoji in half. Use `truncate(str, n)` from graphemely instead.',
    },
  },
  create(context) {
    function report(node: Node, cut: Node): void {
      context.report({
        node,
        messageId: 'preferTruncate',
        data: { method: calleeName(cut) as string },
      });
    }
    return {
      BinaryExpression(node) {
        if (node.operator !== '+') return;
        const left = node.left as Node;
        if (isPrefixCut(left) && isEllipsis(node.right)) report(node, left);
      },
      TemplateLiteral(node) {
        const { expressions, quasis } = node;
        if (expressions.length !== 1) return;
        const expression = expressions[0] as Node;
        const head = quasis[0]?.value.cooked;
        const tail = quasis[1]?.value.cooked;
        if (head === '' && tail !== undefined && tail !== null && ELLIPSIS.test(tail) && isPrefixCut(expression)) {
          report(node, expression);
        }
      },
    };
  },
};
