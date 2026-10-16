/**
 * Date logic of the docs site's special date themes (assets/seasons/seasons.js).
 * The script is plain browser JavaScript, so it runs here against a small fake
 * window.
 */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface Resolved {
  id: string;
  on: boolean;
  forced: boolean;
  name?: string;
}
interface Seasons {
  ids: string[];
  easter(year: number): Date;
  detect(date: Date, lang?: string): string;
  name(id: string, lang?: string): string;
  resolve(search: string, date: Date, lang: string, isOff: (id: string) => boolean): Resolved;
  set(on: boolean): void;
  state: Resolved | null;
}
interface FakeWindow {
  GraphemelySeasons?: Seasons;
  document?: { documentElement: { setAttribute(k: string, v: string): void; removeAttribute(k: string): void } };
  location?: { search: string };
  navigator?: { language: string };
  localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };
}

const source = readFileSync(new URL('../assets/seasons/seasons.js', import.meta.url), 'utf8');

function run(w: FakeWindow): Seasons {
  new Function('globalThis', source)(w);
  return w.GraphemelySeasons as Seasons;
}

/** Loads the script like a page would, with a query string, a language and stored choices. */
function page({ search = '', lang = 'en-US', stored = {} as Record<string, string> } = {}) {
  const attrs = new Map<string, string>();
  const storage = new Map(Object.entries(stored));
  const w: FakeWindow = {
    document: {
      documentElement: {
        setAttribute: (k, v) => void attrs.set(k, v),
        removeAttribute: (k) => void attrs.delete(k),
      },
    },
    location: { search },
    navigator: { language: lang },
    localStorage: {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => void storage.set(k, v),
      removeItem: (k) => void storage.delete(k),
    },
  };
  return { api: run(w), attrs, storage };
}

const api = run({});
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

afterEach(() => {
  vi.useRealTimers();
});

describe('easter', () => {
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2028, '2028-04-16'],
    [2029, '2029-04-01'],
    [2030, '2030-04-21'],
  ])('%i is on %s', (year, expected) => {
    expect(iso(api.easter(year))).toBe(expected);
  });
});

describe('detect', () => {
  it.each([
    // New Year: Dec 30 to Jan 2
    ['2026-12-29', ''],
    ['2026-12-30', 'newyear'],
    ['2027-01-01', 'newyear'],
    ['2027-01-02', 'newyear'],
    ['2027-01-03', ''],
    // Carnival 2026: Ash Wednesday is Feb 18, the window starts on Saturday Feb 14
    ['2026-02-13', ''],
    ['2026-02-15', 'carnival'],
    ['2026-02-18', 'carnival'],
    ['2026-02-19', ''],
    // Carnival 2025 and 2027
    ['2025-03-01', 'carnival'],
    ['2025-03-05', 'carnival'],
    ['2025-03-06', ''],
    ['2027-02-05', ''],
    ['2027-02-06', 'carnival'],
    ['2027-02-10', 'carnival'],
    // Easter 2026: Good Friday Apr 3 to Sunday Apr 5
    ['2026-04-02', ''],
    ['2026-04-03', 'easter'],
    ['2026-04-05', 'easter'],
    ['2026-04-06', ''],
    // Valentine's
    ['2027-02-13', ''],
    ['2027-02-14', 'valentine'],
    ['2027-02-15', ''],
    // Festa Junina / Midsummer
    ['2026-06-12', ''],
    ['2026-06-13', 'junina'],
    ['2026-06-29', 'junina'],
    ['2026-06-30', ''],
    // Halloween
    ['2026-10-23', ''],
    ['2026-10-24', 'halloween'],
    ['2026-10-31', 'halloween'],
    ['2026-11-01', ''],
    // Christmas
    ['2026-12-17', ''],
    ['2026-12-18', 'christmas'],
    ['2026-12-26', 'christmas'],
    ['2026-12-27', ''],
    // An ordinary day
    ['2026-10-15', ''],
  ])('%s is %s', (date, expected) => {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    expect(api.detect(day(y, m, d), 'en-US')).toBe(expected);
  });

  it("gives Valentine's Day priority when it falls in Carnival", () => {
    expect(api.detect(day(2026, 2, 14), 'en-US')).toBe('valentine');
  });

  it('ignores the time of day', () => {
    expect(api.detect(new Date(2026, 9, 24, 0, 0, 1), 'en')).toBe('halloween');
    expect(api.detect(new Date(2026, 9, 31, 23, 59, 59), 'en')).toBe('halloween');
  });
});

describe('Brazilian Portuguese', () => {
  it("adds June 12 as Valentine's Day", () => {
    expect(api.detect(day(2026, 6, 12), 'pt-BR')).toBe('valentine');
    expect(api.detect(day(2026, 6, 12), 'pt-br')).toBe('valentine');
    expect(api.detect(day(2026, 6, 12), 'pt-PT')).toBe('');
    expect(api.detect(day(2026, 6, 12), 'en-US')).toBe('');
  });

  it('calls June Festa Junina in Brazil and Midsummer elsewhere', () => {
    expect(api.name('junina', 'pt-BR')).toBe('Festa Junina');
    expect(api.name('junina', 'en-US')).toBe('Midsummer');
    expect(api.name('junina', 'pt-PT')).toBe('Midsummer');
    expect(api.name('halloween', 'pt-BR')).toBe('Halloween');
    expect(api.name('', 'en')).toBe('');
  });
});

describe('resolve and overrides', () => {
  const never = () => false;

  it('forces a season with ?season=<id>', () => {
    expect(api.resolve('?season=christmas', day(2026, 7, 1), 'en', never)).toEqual({ id: 'christmas', on: true, forced: true });
    expect(api.resolve('?a=1&season=easter', day(2026, 7, 1), 'en', () => true)).toEqual({ id: 'easter', on: true, forced: true });
  });

  it('turns everything off with ?season=off', () => {
    expect(api.resolve('?season=off', day(2026, 10, 30), 'en', never)).toEqual({ id: '', on: false, forced: true });
  });

  it('ignores an unknown season in the query', () => {
    expect(api.resolve('?season=summer', day(2026, 10, 30), 'en', never)).toEqual({ id: 'halloween', on: true, forced: false });
  });

  it('keeps a season off when the visitor switched it off', () => {
    expect(api.resolve('', day(2026, 10, 30), 'en', (id) => id === 'halloween')).toEqual({ id: 'halloween', on: false, forced: false });
  });

  it('lists the seven seasons', () => {
    expect(api.ids).toEqual(['newyear', 'carnival', 'easter', 'valentine', 'junina', 'halloween', 'christmas']);
  });
});

describe('on a page', () => {
  it('sets data-season and data-season-id on the root element', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 12));
    const { api: live, attrs } = page();
    expect(attrs.get('data-season')).toBe('halloween');
    expect(attrs.get('data-season-id')).toBe('halloween');
    expect(live.state).toMatchObject({ id: 'halloween', on: true, name: 'Halloween' });
  });

  it('remembers the off switch per season', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 20, 12));
    const { api: live, attrs, storage } = page();
    live.set(false);
    expect(attrs.has('data-season')).toBe(false);
    expect(storage.get('graphemely-season-off:christmas')).toBe('1');

    const again = page({ stored: Object.fromEntries(storage) });
    expect(again.attrs.has('data-season')).toBe(false);
    expect(again.attrs.get('data-season-id')).toBe('christmas');
    again.api.set(true);
    expect(again.attrs.get('data-season')).toBe('christmas');
    expect(again.storage.has('graphemely-season-off:christmas')).toBe(false);
  });

  it('does not store a choice made on a forced preview', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 12));
    const { api: live, attrs, storage } = page({ search: '?season=carnival' });
    expect(attrs.get('data-season')).toBe('carnival');
    live.set(false);
    expect(attrs.has('data-season')).toBe(false);
    expect(storage.size).toBe(0);
  });

  it('does nothing on an ordinary day or with ?season=off', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 12));
    const plain = page();
    expect(plain.attrs.size).toBe(0);
    plain.api.set(true);
    expect(plain.attrs.size).toBe(0);
    vi.setSystemTime(new Date(2026, 9, 28, 12));
    expect(page({ search: '?season=off' }).attrs.size).toBe(0);
  });

  it('survives blocked storage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 28, 12));
    const attrs = new Map<string, string>();
    const blocked = () => {
      throw new Error('blocked');
    };
    const w: FakeWindow = {
      document: { documentElement: { setAttribute: (k, v) => void attrs.set(k, v), removeAttribute: (k) => void attrs.delete(k) } },
      location: { search: '' },
      navigator: { language: 'pt-BR' },
      localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked },
    };
    const live = run(w);
    expect(attrs.get('data-season')).toBe('halloween');
    expect(() => live.set(false)).not.toThrow();
    expect(attrs.has('data-season')).toBe(false);
  });
});
