// Entry for docs/lint.js: runs the graphemely ESLint rules in the browser.
//
// The rules are the real ones from dist/eslint-plugin.js. ESLint itself is too
// big to ship to a docs page, so this file does the small part of its job the
// rules rely on: parse with acorn (the parser behind espree), walk the tree in
// the same depth first order, set `node.parent`, call the rule listeners and
// collect what they report, with ESLint's message templates filled in.
import { parse } from 'acorn';
import plugin from '../../dist/eslint-plugin.js';

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Message text as HTML, with `code` spans like the ESLint docs render them. */
const toHtml = (message) => escape(message).replace(/`([^`]+)`/g, '<code>$1</code>');

function walk(node, parent, enter) {
  node.parent = parent;
  enter(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child.type === 'string') walk(child, node, enter);
    } else if (value && typeof value.type === 'string') {
      walk(value, node, enter);
    }
  }
}

/**
 * Lints `code` with every rule of `graphemely.configs.recommended`.
 * Returns the problems sorted by position, or a parsing error like ESLint's.
 */
export function lint(code) {
  let ast;
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true, allowHashBang: true });
  } catch (error) {
    const loc = error.loc || { line: 1, column: 0 };
    const message = `Parsing error: ${String(error.message).replace(/\s*\(\d+:\d+\)$/, '')}`;
    return {
      problems: [{ rule: '', severity: 'error', message, html: escape(message), line: loc.line, column: loc.column + 1, start: error.pos ?? 0, end: (error.pos ?? 0) + 1 }],
      fatal: true,
    };
  }

  const problems = [];
  const listeners = Object.entries(plugin.rules).map(([name, rule]) =>
    rule.create({
      id: `graphemely/${name}`,
      options: [],
      report({ node, messageId, data = {} }) {
        const message = rule.meta.messages[messageId].replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(data[key]));
        problems.push({
          rule: `graphemely/${name}`,
          url: rule.meta.docs.url,
          severity: 'warning',
          message,
          html: toHtml(message),
          line: node.loc.start.line,
          column: node.loc.start.column + 1,
          start: node.start,
          end: node.end,
        });
      },
    }),
  );

  walk(ast, null, (node) => {
    for (const listener of listeners) listener[node.type]?.(node);
  });
  problems.sort((a, b) => a.start - b.start || a.end - b.end);
  return { problems, fatal: false };
}

export const rules = Object.keys(plugin.rules).map((name) => `graphemely/${name}`);
