import type { Rule } from 'eslint';
import { DOCS_URL, isSplitEmpty } from '../utils';

/**
 * Flags `str.split('')`, which splits by UTF-16 code unit and breaks emoji,
 * flags, accented letters and any character outside the Basic Multilingual
 * Plane.
 */
export const noUnsafeStringSplit: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow `.split('')`, which breaks emoji and combining characters into pieces",
      recommended: true,
      url: `${DOCS_URL}no-unsafe-string-split.md`,
    },
    schema: [],
    messages: {
      unsafeSplit:
        "`.split('')` splits by UTF-16 code unit and breaks emoji and accented letters. Use `graphemes(str)` from graphemely instead.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (isSplitEmpty(node)) {
          context.report({ node, messageId: 'unsafeSplit' });
        }
      },
    };
  },
};
