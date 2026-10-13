import { readFileSync } from 'node:fs';
import { RuleTester } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';
import plugin from '../src/eslint-plugin/index';

const { rules } = plugin;

Object.assign(RuleTester, { afterAll, describe, it, itOnly: it.only });

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const rule = (name: string) => {
  const found = rules[name];
  if (found === undefined) throw new Error(`missing rule ${name}`);
  return found;
};

describe('plugin shape', () => {
  it('exposes rules and a recommended flat config', () => {
    expect(Object.keys(plugin.rules)).toEqual([
      'no-unsafe-string-split',
      'no-unsafe-reverse',
      'prefer-graphemely-truncate',
    ]);
    expect(plugin.meta.name).toBe('@kwy404/graphemely/eslint-plugin');
    // Compared with package.json, so a release only has to bump the version in one more place.
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(plugin.meta.version).toBe(pkg.version);
    expect(plugin.configs.recommended.plugins?.graphemely).toBe(plugin);
    expect(plugin.configs.recommended.rules).toEqual({
      'graphemely/no-unsafe-string-split': 'warn',
      'graphemely/no-unsafe-reverse': 'warn',
      'graphemely/prefer-graphemely-truncate': 'warn',
    });
  });

  it('documents every rule', () => {
    for (const [name, module] of Object.entries(plugin.rules)) {
      expect(module.meta?.docs?.url).toBe(
        `https://github.com/kwy404/graphemely/blob/main/docs/rules/${name}.md`,
      );
      expect(module.meta?.docs?.description).toBeTruthy();
    }
  });
});

ruleTester.run('no-unsafe-string-split', rule('no-unsafe-string-split'), {
  valid: [
    "str.split(' ')",
    "str.split(',')",
    'str.split(/,/)',
    'str.split()',
    "str.split('', 2)",
    'str.split(sep)',
    'split(str)',
    "str['split'](',')",
    'str[method]("")',
    'str.split(`a`)',
    'str.split(`${x}`)',
  ],
  invalid: [
    { code: "str.split('')", errors: [{ messageId: 'unsafeSplit' }] },
    { code: 'str.split("")', errors: [{ messageId: 'unsafeSplit' }] },
    { code: 'str.split(``)', errors: [{ messageId: 'unsafeSplit' }] },
    { code: "str['split']('')", errors: [{ messageId: 'unsafeSplit' }] },
    { code: "name.trim().split('').map(f)", errors: [{ messageId: 'unsafeSplit' }] },
  ],
});

ruleTester.run('no-unsafe-reverse', rule('no-unsafe-reverse'), {
  valid: [
    'arr.reverse()',
    '[...items].reverse()',
    '[...items].reverse().map(f)',
    'Array.from(items).reverse()',
    "str.split(',').reverse().join(',')",
    '[a, ...b].reverse().join("")',
    'Array.from(a, f).reverse().join("")',
    'Foo.from(str).reverse().join("")',
    "str.split('').reverse(compare)",
    'reverse(str)',
    'x[0].reverse().join("")',
  ],
  invalid: [
    { code: "str.split('').reverse().join('')", errors: [{ messageId: 'unsafeReverse' }] },
    { code: "str.split('').reverse()", errors: [{ messageId: 'unsafeReverse' }] },
    { code: "[...str].reverse().join('')", errors: [{ messageId: 'unsafeReverse' }] },
    { code: "Array.from(str).reverse().join('')", errors: [{ messageId: 'unsafeReverse' }] },
    { code: "[...str]['reverse']()['join']('')", errors: [{ messageId: 'unsafeReverse' }] },
  ],
});

ruleTester.run('prefer-graphemely-truncate', rule('prefer-graphemely-truncate'), {
  valid: [
    "str.slice(0, 10) + 'abc'",
    "str.slice(1, 10) + '...'",
    "str.slice(0) + '...'",
    "str.slice(n, 10) + '...'",
    "'...' + str.slice(0, 10)",
    "str.slice(0, 10) - '...'",
    "str.trim() + '...'",
    'str.slice(0, 10) + suffix',
    '`${str.slice(0, 10)} and more`',
    '`>${str.slice(0, 10)}...`',
    '`${a}${b}...`',
    '`${str}...`',
    'truncate(str, 10)',
  ],
  invalid: [
    {
      code: "str.slice(0, 10) + '...'",
      errors: [{ messageId: 'preferTruncate', data: { method: 'slice' } }],
    },
    {
      code: "str.substring(0, n) + '..'",
      errors: [{ messageId: 'preferTruncate', data: { method: 'substring' } }],
    },
    {
      code: "str.substr(0, 5) + ' ...'",
      errors: [{ messageId: 'preferTruncate', data: { method: 'substr' } }],
    },
    {
      code: "title.slice(0, max - 1) + '\\u2026'",
      errors: [{ messageId: 'preferTruncate' }],
    },
    {
      code: 'str.slice(0, 10) + `...`',
      errors: [{ messageId: 'preferTruncate' }],
    },
    {
      code: '`${str.slice(0, 10)}...`',
      errors: [{ messageId: 'preferTruncate', data: { method: 'slice' } }],
    },
  ],
});
