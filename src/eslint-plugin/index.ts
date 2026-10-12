/**
 * ESLint plugin for graphemely (flat config).
 *
 * @example
 * ```js
 * // eslint.config.js
 * import graphemely from '@kwy404/graphemely/eslint-plugin';
 *
 * export default [
 *   graphemely.configs.recommended,
 * ];
 * ```
 *
 * @packageDocumentation
 */

import type { ESLint, Linter, Rule } from 'eslint';
import { noUnsafeReverse } from './rules/no-unsafe-reverse';
import { noUnsafeStringSplit } from './rules/no-unsafe-string-split';
import { preferGraphemelyTruncate } from './rules/prefer-graphemely-truncate';

/** All rules provided by the plugin, keyed by rule name. */
const rules: Record<string, Rule.RuleModule> = {
  'no-unsafe-string-split': noUnsafeStringSplit,
  'no-unsafe-reverse': noUnsafeReverse,
  'prefer-graphemely-truncate': preferGraphemelyTruncate,
};

/** The plugin object, plus ready-made flat configs. */
export interface GraphemelyPlugin extends ESLint.Plugin {
  meta: { name: string; version: string };
  rules: Record<string, Rule.RuleModule>;
  configs: {
    /** Enables every rule as a warning. */
    recommended: Linter.Config;
  };
}

const plugin: GraphemelyPlugin = {
  meta: { name: '@kwy404/graphemely/eslint-plugin', version: '0.1.0' },
  rules,
  configs: { recommended: {} },
};

plugin.configs.recommended = {
  name: 'graphemely/recommended',
  plugins: { graphemely: plugin },
  rules: {
    'graphemely/no-unsafe-string-split': 'warn',
    'graphemely/no-unsafe-reverse': 'warn',
    'graphemely/prefer-graphemely-truncate': 'warn',
  },
};

export default plugin;
