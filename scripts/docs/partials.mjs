// Shared pieces of the docs site, written into every page by scripts/build-docs.mjs.
// Each page marks a region with <!-- @name args --> ... <!-- /@name --> and the
// build replaces what is inside, so running it twice gives the same files.

export const SITE = 'https://kwy404.github.io/graphemely/';
export const MONSOON = 'https://kwy404.github.io/monsoon/';
export const VOODOO = 'https://kwy404.github.io/Voodoo.js/';

export const guides = [
  {
    file: 'truncate-string-with-emoji.html',
    short: 'Truncate',
    title: 'Truncate a string with emoji',
    desc: 'Cut text to a length with an ellipsis, never half an emoji.',
    icon: 'truncate',
  },
  {
    file: 'string-length-emoji.html',
    short: 'Length',
    title: 'String length with emoji',
    desc: 'Why an emoji has length 2, and how to count what users see.',
    icon: 'length',
  },
  {
    file: 'reverse-string-unicode.html',
    short: 'Reverse',
    title: 'Reverse a string with Unicode',
    desc: 'Reverse text without scrambling flags, accents or emoji.',
    icon: 'reverse',
  },
  {
    file: 'split-string-into-characters.html',
    short: 'Split',
    title: 'Split a string into characters',
    desc: 'Get the visible characters, not code units or code points.',
    icon: 'split',
  },
  {
    file: 'substring-without-breaking-emoji.html',
    short: 'Substring',
    title: 'Substring without breaking emoji',
    desc: 'A Unicode safe substring and slice with negative indices.',
    icon: 'slice',
  },
  {
    file: 'lone-surrogates.html',
    short: 'Surrogates',
    title: 'Remove lone surrogates',
    desc: 'Detect and repair the broken halves of emoji.',
    icon: 'well',
  },
];

const others = [
  ['Monsoon', MONSOON, 'Utility first CSS from one file, no build step.'],
  ['Voodoo.js', VOODOO, 'The HTML first JavaScript framework.'],
  ['breakhound', 'https://kwy404.github.io/breakhound/', 'Find bugs in any JavaScript library, no tests required.'],
  ['vueleap', 'https://kwy404.github.io/vueleap/', 'Migrate Vue 2 to Vue 3 with one command.'],
  ['numberparrot', 'https://kwy404.github.io/numberparrot/', 'Parse localized number and currency strings.'],
  ['edgegoat', 'https://kwy404.github.io/edgegoat/', 'Edge case test inputs: time zones, unicode, NaN and more.'],
  ['cookieowl', 'https://kwy404.github.io/cookieowl/', 'Cookie consent for LGPD and GDPR that really blocks trackers.'],
  ['installkite', 'https://kwy404.github.io/installkite/', 'Make any website installable and offline capable.'],
  ['a11ymedic', 'https://kwy404.github.io/a11ymedic/', 'Accessibility checker that gives the exact fix.'],
  ['fontsketch', 'https://kwy404.github.io/fontsketch/', 'Turn your handwriting into a font, in your browser.'],
  ['kastor', 'https://kwy404.github.io/kastor/', 'The TypeScript ORM for almost every database.'],
];

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="assets/icons.svg#i-${name}"/></svg>`;

const two = (n) => String(n).padStart(2, '0');

/** Masthead, sticky bar, mobile menu and the search dialog. */
export function header(_args, page) {
  const here = (key) => (page.section === key ? ' aria-current="page"' : '');
  const nav = [
    ['lab', './#playground', 'Text Lab'],
    ['guides', './#guides', 'Guides'],
    ['api', './#api', 'API'],
    ['eslint', './#eslint', 'Linter'],
  ];
  const links = nav.map(([key, href, label]) => `<a href="${href}"${here(key)}>${label}</a>`).join('\n          ');
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead" v-data="{ menu: false }" @keydown.esc="menu = false" @keydown.ctrl.k.prevent.window="openSearch()" @keydown.meta.k.prevent.window="openSearch()">
    <div class="strip">
      <div class="wrap strip-row">
        <span>Vol. 1.0.0</span>
        <span class="strip-mid">A field guide to Unicode safe strings in JavaScript</span>
        <a href="https://www.npmjs.com/package/@kwy404/graphemely">npm i @kwy404/graphemely</a>
      </div>
    </div>
    <div class="bar">
      <div class="wrap bar-row">
        <a class="wordmark" href="./" aria-label="graphemely home"><img src="assets/mascot.svg" alt="" width="34" height="34"><span>graphemely</span></a>
        <nav class="mast-nav" id="site-nav" aria-label="Site" :class="{ open: menu }" @click="menu = false">
          ${links}
          <a href="https://github.com/kwy404/graphemely">GitHub ${icon('out', 'icon icon-xs')}</a>
        </nav>
        <div class="bar-tools">
          <button type="button" class="tool search-btn" @click="openSearch()" aria-haspopup="dialog" aria-controls="search">
            ${icon('search')}<span class="search-label">Search</span><kbd class="kbd kbd-xs">Ctrl K</kbd>
          </button>
          <button type="button" class="tool theme-btn" v-theme-toggle.cycle aria-label="Theme: system. Change theme">
            ${icon('system', 'icon i-system')}${icon('sun', 'icon i-sun')}${icon('moon', 'icon i-moon')}
          </button>
          <button type="button" class="tool menu-btn" aria-controls="site-nav" aria-expanded="false" :aria-expanded="menu ? 'true' : 'false'" @click="menu = !menu">
            ${icon('menu')}<span class="sr-only">Menu</span>
          </button>
        </div>
      </div>
    </div>
    <dialog id="search" class="modal modal-top search-dialog" aria-label="Search the docs" v-data="{ q: '', at: 0 }" @close="q = ''; at = 0">
      <div class="command-palette">
        <label class="command-palette-search">${icon('search')}
          <input class="command-palette-input" id="search-input" type="search" placeholder="Search guides, functions and sections" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="search-results" v-model="q" @input="at = 0" @keydown.down.prevent="at = Math.min(at + 1, find(q).length - 1)" @keydown.up.prevent="at = Math.max(at - 1, 0)" @keydown.enter.prevent="go(find(q)[at])">
          <kbd class="kbd kbd-xs">Esc</kbd>
        </label>
        <div class="command-palette-list" id="search-results" role="listbox" aria-label="Results">
          <a class="command-palette-item" v-for="(r, i) in find(q)" :key="r.url" :href="r.url" role="option" :aria-selected="i === at ? 'true' : 'false'" @mouseenter="at = i">
            <span class="hit-kind" v-text="r.kind"></span><span class="hit-text"><span class="hit-title" v-text="r.title"></span><span class="hit-page" v-text="r.page"></span></span>
          </a>
          <p class="command-palette-empty" v-show="!find(q).length">Nothing matches. Try truncate, length or ESLint.</p>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button aria-label="Close search">Close</button></form>
    </dialog>
  </header>
  `;
}

/** The colophon: author, credits and the other projects. */
export function footer(_args, page) {
  const guideLinks = guides.map((g) => `<li><a href="${g.file}">${g.title}</a></li>`).join('\n            ');
  const more = others
    .filter(([name]) => name !== page.project)
    .map(([name, url, desc]) => `<li><a href="${url}">${name}</a><span>${desc}</span></li>`)
    .join('\n            ');
  return `
  <footer class="colophon">
    <div class="wrap">
      <div class="colophon-head">
        <p class="colophon-word">graphemely</p>
        <p class="colophon-tag">Truncate, slice and count strings with emoji safely in JavaScript and TypeScript.</p>
      </div>
      <div class="colophon-grid">
        <div class="colophon-col">
          <h2 class="colophon-title">Colophon</h2>
          <p>Made by <a href="https://github.com/kwy404" rel="me noopener">Alexandre Kohler</a>.</p>
          <p class="social">
            <a href="https://github.com/kwy404" rel="me noopener" aria-label="Alexandre Kohler on GitHub">${icon('github')}GitHub</a>
            <a href="https://www.linkedin.com/in/alexandre-silva-173687256/" rel="me noopener" aria-label="Alexandre Kohler on LinkedIn">${icon('linkedin')}LinkedIn</a>
          </p>
          <p>Built with <a href="${MONSOON}">Monsoon</a>.<br>Interactive parts built with <a href="${VOODOO}">Voodoo.js</a>.</p>
          <p class="colophon-type">Set in Fraunces, Newsreader and JetBrains Mono. Mascot Gem, drawings and code are MIT licensed.</p>
        </div>
        <nav class="colophon-col" aria-labelledby="f-guides">
          <h2 class="colophon-title" id="f-guides">Guides</h2>
          <ul>
            ${guideLinks}
          </ul>
        </nav>
        <nav class="colophon-col" aria-labelledby="f-project">
          <h2 class="colophon-title" id="f-project">Project</h2>
          <ul>
            <li><a href="./#playground">Text Lab</a></li>
            <li><a href="./#api">API index</a></li>
            <li><a href="https://github.com/kwy404/graphemely">GitHub</a></li>
            <li><a href="https://www.npmjs.com/package/@kwy404/graphemely">npm</a></li>
            <li><a href="https://github.com/kwy404/graphemely/blob/main/CHANGELOG.md">Changelog</a></li>
            <li><a href="https://github.com/kwy404/graphemely/issues">Report an issue</a></li>
          </ul>
        </nav>
        <nav class="colophon-col colophon-more" aria-labelledby="f-more">
          <h2 class="colophon-title" id="f-more">More from kwy404</h2>
          <ul>
            ${more}
          </ul>
        </nav>
      </div>
      <p class="colophon-base"><span>MIT licensed, 2026.</span><span>Every character on this site was counted by grapheme.</span></p>
    </div>
  </footer>
  `;
}

/** Package manager tabs with one install command each (Voodoo.js v-tabs). */
export function install() {
  const managers = [
    ['npm', 'npm install @kwy404/graphemely'],
    ['pnpm', 'pnpm add @kwy404/graphemely'],
    ['yarn', 'yarn add @kwy404/graphemely'],
    ['bun', 'bun add @kwy404/graphemely'],
  ];
  const tabs = managers
    .map(
      ([name], i) =>
        `<button type="button" class="tab" role="tab" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} v-tab="${name}">${name}</button>`,
    )
    .join('\n          ');
  const panels = managers
    .map(
      ([name, cmd], i) =>
        `<div class="install-panel" role="tabpanel" v-tab-panel="${name}"${i ? ' hidden' : ''}>\n<pre><code class="language-bash">${cmd}</code></pre>\n        </div>`,
    )
    .join('\n        ');
  return `
      <div class="install" v-tabs>
        <div class="tabs tabs-line" role="tablist" aria-label="Package manager">
          ${tabs}
        </div>
        ${panels}
      </div>
      `;
}

/** The rail table of contents, built from the h2 headings of the article. */
export function toc(_args, page) {
  const items = page.sections
    .map((s, i) => `<li><a href="#${s.id}"><span class="toc-n">${two(i + 1)}</span>${s.text}</a></li>`)
    .join('\n            ');
  return `
          <nav class="rail-toc" aria-labelledby="toc-title" v-scrollspy v-scrollspy-class="toc-active" v-scroll-offset="120">
            <p class="toc-title" id="toc-title">In this guide</p>
            <ol class="toc">
            ${items}
            </ol>
          </nav>
          `;
}

/** Numbered list of the guides for the end of an article, without the current one. */
export function related(_args, page) {
  const items = guides
    .map((g, i) => ({ ...g, n: i + 1 }))
    .filter((g) => g.file !== page.file)
    .map(
      (g) =>
        `<li><a href="${g.file}"><span class="read-n">${two(g.n)}</span><span class="read-text"><span class="read-title">${g.title}</span><span class="read-desc">${g.desc}</span></span>${icon(g.icon, 'icon read-icon')}</a></li>`,
    )
    .join('\n        ');
  return `
      <ol class="reading">
        ${items}
      </ol>
      `;
}

/** Other guides as a compact list for the rail. */
export function railguides(_args, page) {
  const items = guides
    .map(
      (g, i) =>
        `<li><a href="${g.file}"${g.file === page.file ? ' aria-current="page"' : ''}><span class="toc-n">${two(i + 1)}</span>${g.short}</a></li>`,
    )
    .join('\n            ');
  return `
          <nav class="rail-guides" aria-labelledby="rail-guides-title">
            <p class="toc-title" id="rail-guides-title">All guides</p>
            <ol>
            ${items}
            </ol>
          </nav>
          `;
}
