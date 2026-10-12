import type { Node, TemplateElement } from 'estree';

/** Base URL of the rule documentation. */
export const DOCS_URL = 'https://github.com/kwy404/graphemely/blob/main/docs/rules/';

/**
 * Returns the property name of a member expression callee, for both
 * `a.name()` and `a['name']()`.
 */
export function calleeName(node: Node): string | undefined {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return undefined;
  const { property, computed } = node.callee;
  if (!computed && property.type === 'Identifier') return property.name;
  if (computed && property.type === 'Literal' && typeof property.value === 'string') {
    return property.value;
  }
  return undefined;
}

/** True for `''`, `""` and an empty template literal. */
export function isEmptyString(node: Node): boolean {
  if (node.type === 'Literal') return node.value === '';
  if (node.type === 'TemplateLiteral') {
    return node.expressions.length === 0 && (node.quasis[0] as TemplateElement).value.cooked === '';
  }
  return false;
}

/** True for a call like `x.split('')`. */
export function isSplitEmpty(node: Node): boolean {
  return (
    node.type === 'CallExpression' &&
    calleeName(node) === 'split' &&
    node.arguments.length === 1 &&
    isEmptyString(node.arguments[0] as Node)
  );
}

/** Returns the static string value of a literal or a template without expressions. */
export function staticString(node: Node): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    // `cooked` is only null inside tagged templates, which never reach here.
    return (node.quasis[0] as TemplateElement).value.cooked as string;
  }
  return undefined;
}
