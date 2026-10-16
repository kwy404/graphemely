// Seasonal art for the docs site, written as SVG into assets/seasons/<id>/:
//
//   gem-light.svg, gem-dark.svg        Gem in costume, drawn over the mascot
//   accent-light.svg, accent-dark.svg  a garland that hangs across the top of the page
//   icon-<name>.svg                    three icons in the site's line style
//
// plus assets/seasons/icons.svg (the same icons as one sprite) and
// docs/seasons.css (the custom properties that point the page at the art).
// scripts/build-docs.mjs runs it; the files are committed so they can be reviewed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const INK = '#231F3A';

/** Gem without its outer <svg>, title and description, to dress up. */
function gemBody(root) {
  const svg = readFileSync(new URL('assets/mascot.svg', root), 'utf8');
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s*<title[\s\S]*?<\/title>/, '')
    .replace(/\s*<desc[\s\S]*?<\/desc>/, '')
    .replace(/\s*<!--[\s\S]*?-->/g, '')
    .trim();
}

const round = 'stroke-linecap="round" stroke-linejoin="round"';
const heart = (x, y, s, fill, extra = '') =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 12C-14 3-18-6-12-11c4-3 9-2 12 3 3-5 8-6 12-3 6 5 2 14-12 23Z" fill="${fill}" ${extra}/>`;
const flake = (x, y, r, c) =>
  `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="3" ${round} fill="none"><path d="M0 ${-r}V${r}M${(-r * 0.87).toFixed(1)} ${-r / 2}L${(r * 0.87).toFixed(1)} ${r / 2}M${(-r * 0.87).toFixed(1)} ${r / 2}L${(r * 0.87).toFixed(1)} ${-r / 2}"/></g>`;
const burst = (x, y, r, c, rays = 10) =>
  `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="3.2" stroke-linecap="round">${Array.from({ length: rays }, (_, i) => {
    const a = (i * 2 * Math.PI) / rays;
    const p = (k) => `${(Math.cos(a) * r * k).toFixed(1)} ${(Math.sin(a) * r * k).toFixed(1)}`;
    return `<path d="M${p(0.42)}L${p(1)}"/>`;
  }).join('')}<circle r="3.5" fill="${c}" stroke="none"/></g>`;
const bat = (x, y, s, fill) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0C6-8 15-9 22-14c-2 8 3 13 11 15-9 2-14 6-17 12-4-5-10-6-16-2-6-4-12-3-16 2-3-6-8-10-17-12 8-2 13-7 11-15C-15-9-6-8 0 0Z" fill="${fill}"/>`;

/** Costume pieces, in the mascot's own coordinates (head centre 170 160, paw 290 226, yarn 330 326). */
function costume(id, dark) {
  const line = dark ? '#C9C1FF' : INK;
  switch (id) {
    case 'halloween': {
      const hat = dark ? '#43357A' : '#2E2448';
      return `
  ${bat(52, 58, 0.9, dark ? '#A79BF2' : '#3A2E5C')}${bat(372, 112, 0.6, dark ? '#A79BF2' : '#3A2E5C')}
  <path d="M110 92C128 62 146 34 166 16c10-9 28-11 38-2-10 1-15 9-13 21 6 22 20 40 36 57Z" fill="${hat}" stroke="${line}" stroke-width="${dark ? 2 : 0}" ${round}/>
  <path d="M118 78Q170 66 224 78L230 90Q170 78 112 90Z" fill="#F59E0B"/>
  <rect x="160" y="70" width="18" height="16" rx="2" fill="none" stroke="#FDE68A" stroke-width="3"/>
  <ellipse cx="170" cy="94" rx="112" ry="17" fill="${hat}" stroke="${line}" stroke-width="${dark ? 2 : 0}"/>
  <path d="M88 92q82-14 164 0" fill="none" stroke="${dark ? '#6C5BB0' : '#4A3D6E'}" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(330 330)">
    <path d="M-4-44q2-14 14-18" fill="none" stroke="#4D7C0F" stroke-width="7" stroke-linecap="round"/>
    <ellipse rx="58" ry="46" fill="#F97316"/>
    <ellipse rx="30" ry="46" fill="#FB923C"/>
    <path d="M-30-40q-16 40 0 80M30-40q16 40 0 80" fill="none" stroke="#C2410C" stroke-width="3.5"/>
    <path d="M-30-12l12-14 12 14ZM6-12l12-14 12 14ZM-34 12q8 16 16 4l8 10 10-10 10 10 8-10q8 12 16-4-34 12-68 0Z" fill="#FDE047"/>
  </g>`;
    }
    case 'christmas': {
      const red = dark ? '#E5485F' : '#C8283F';
      const snow = dark ? '#DCE6F5' : '#9DB8E0';
      return `
  ${flake(40, 64, 13, snow)}${flake(366, 54, 10, snow)}${flake(386, 176, 8, snow)}${flake(26, 196, 7, snow)}
  <path d="M84 116C94 58 150 26 214 34c44 6 76 34 88 72l-20 6c-10-22-26-34-44-38 10 16 18 30 22 44Z" fill="${red}"/>
  <path d="M78 118Q170 76 262 118l2 20Q170 98 76 138Z" fill="#F8FAFC" stroke="${dark ? 'none' : '#D5DCE8'}" stroke-width="2"/>
  <circle cx="294" cy="114" r="17" fill="#F8FAFC" stroke="${dark ? 'none' : '#D5DCE8'}" stroke-width="2"/>
  <path d="M104 234Q170 270 236 234l4 20Q170 294 100 254Z" fill="#16A34A"/>
  <path d="M124 246l6 14M148 254l4 14M176 257l0 15M204 254l-4 14M226 246l-6 14" stroke="${red}" stroke-width="6" stroke-linecap="round"/>
  <path d="M196 262l18 68-24 4-10-68Z" fill="#16A34A"/>
  <path d="M199 286l14-2M203 306l13-2" stroke="${red}" stroke-width="6" stroke-linecap="round"/>
  <path d="M192 336l-2 12M200 335v12M208 333l2 12" stroke="#16A34A" stroke-width="4" stroke-linecap="round"/>`;
    }
    case 'carnival': {
      const conf = [
        [34, 52, '#F43F5E', 20],
        [70, 24, '#22D3EE', -30],
        [26, 120, '#FBBF24', 45],
        [356, 60, '#8B5CF6', 15],
        [380, 140, '#22D3EE', -40],
        [366, 206, '#F43F5E', 30],
        [250, 22, '#FBBF24', -12],
      ];
      return `
  ${conf.map(([x, y, c, r]) => `<rect x="${x}" y="${y}" width="15" height="8" rx="2" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('')}
  <path d="M300 40c10-12 24-6 18 6s8 18 18 8" fill="none" stroke="#F43F5E" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M96 138C78 104 76 74 92 50c4 30 14 54 30 74Z" fill="#F43F5E"/>
  <path d="M104 136c-6-36 4-66 26-84-6 30-6 56 4 80Z" fill="#FBBF24"/>
  <path d="M114 134c4-30 20-52 44-62-14 22-20 44-18 64Z" fill="#22D3EE"/>
  <path d="M90 150c4-26 38-28 58-16q22 12 44 0c20-12 54-10 58 16-2 26-26 34-46 26q-20-8-34 2-14-10-34-2c-20 8-44 0-46-26Z" fill="${dark ? '#8B5CF6' : '#6D28D9'}" stroke="#F5B301" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="170" cy="150" r="5" fill="#F5B301"/><circle cx="104" cy="164" r="3" fill="#F5B301"/><circle cx="236" cy="164" r="3" fill="#F5B301"/>
  <ellipse cx="132" cy="152" rx="15" ry="17" fill="#EEEBFF"/><ellipse cx="208" cy="152" rx="15" ry="17" fill="#EEEBFF"/>
  <ellipse cx="132" cy="152" rx="12" ry="15" fill="${INK}"/><ellipse cx="208" cy="152" rx="12" ry="15" fill="${INK}"/>
  <circle cx="136" cy="146" r="4.5" fill="#EEEBFF"/><circle cx="212" cy="146" r="4.5" fill="#EEEBFF"/>`;
    }
    case 'junina': {
      const flags = ['#E63946', '#F4A261', '#2A9D8F', '#8B5CF6', '#E9C46A', '#22D3EE', '#E63946', '#F4A261'];
      return `
  <path d="M0 12Q200 52 400 12" fill="none" stroke="${dark ? '#B8AFD6' : '#5B5470'}" stroke-width="2"/>
  ${flags
    .map((c, i) => {
      const x = 26 + i * 50;
      const t = x / 400;
      const y = (1 - t) ** 2 * 12 + 2 * (1 - t) * t * 52 + t * t * 12;
      return `<path d="M${x - 11} ${(y - 1).toFixed(1)}h22v24l-11-8-11 8Z" fill="${c}"/>`;
    })
    .join('')}
  <path d="M116 100Q118 50 170 48q52 2 54 52Z" fill="#E9C46A"/>
  <path d="M120 84q50-10 100 0l2 14q-52-10-104 0Z" fill="#C0392B"/>
  <path d="M138 66l6 12M160 56l3 14M184 56l-2 14M204 64l-6 12" stroke="#B8902F" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="170" cy="102" rx="130" ry="21" fill="#E9C46A"/>
  <path d="M52 100l14 6M84 112l10 4M250 114l12-4M282 104l14-6M122 116l6 3M220 117l8-3" stroke="#B8902F" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="226" y="96" width="18" height="14" rx="2" fill="#2A9D8F" transform="rotate(-8 235 103)"/>
  <path d="M229 99l12-2M229 104l12-2" stroke="#E9C46A" stroke-width="1.6" stroke-dasharray="2 2"/>
  <g transform="translate(46 372)">
    <path d="M-30 18 30 2M-30 2l60 16" stroke="#7C4A24" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 8C-24-2-18-28-6-40c0 12 8 14 10 4 12 12 20 28-4 44Z" fill="#F97316"/>
    <path d="M0 4C-8-2-6-14 0-22c4 8 9 14 0 26Z" fill="#FDE047"/>
  </g>`;
    }
    case 'valentine': {
      return `
  <path d="M296 216c14-30 6-52 24-80s-2-26 8-42" fill="none" stroke="${dark ? '#C9C1FF' : '#5B5470'}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M330 92l-7 10h14Z" fill="${dark ? '#F43F5E' : '#E11D48'}"/>
  ${heart(330, 54, 3.1, dark ? '#F43F5E' : '#E11D48')}
  <path d="M302 30q4-12 18-12" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
  ${heart(60, 70, 1.2, '#FB7185')}${heart(100, 30, 0.8, '#FDA4AF')}${heart(386, 168, 0.8, '#FDA4AF')}
  ${heart(108, 182, 0.62, '#FF6F91')}${heart(232, 182, 0.62, '#FF6F91')}`;
    }
    case 'easter': {
      const eggs = [
        [-24, -22, '#A5B4FC'],
        [2, -30, '#FDE68A'],
        [26, -20, '#F9A8D4'],
      ];
      return `
  <g transform="rotate(-14 136 70)"><ellipse cx="136" cy="40" rx="19" ry="50" fill="#FFF7ED"/><ellipse cx="136" cy="44" rx="9" ry="36" fill="#F9A8D4"/></g>
  <g transform="rotate(12 206 66)"><ellipse cx="206" cy="36" rx="19" ry="50" fill="#FFF7ED"/><ellipse cx="206" cy="40" rx="9" ry="36" fill="#F9A8D4"/></g>
  <path d="M88 112Q170 60 252 112" fill="none" stroke="${dark ? '#F9A8D4' : '#EC4899'}" stroke-width="9" stroke-linecap="round"/>
  <g transform="translate(330 330)">
    <path d="M-48-8q48-80 96 0" fill="none" stroke="#9A5B2A" stroke-width="7" stroke-linecap="round"/>
    ${eggs.map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="20" fill="${c}"/><path d="M${x - 13} ${y}l5 4 5-4 5 4 5-4 5 4" fill="none" stroke="#FFFFFF" stroke-width="2.5" ${round}/>`).join('')}
    <path d="M-56-12h112l-14 58h-84Z" fill="#C08A4A"/>
    <path d="M-52 4h104M-46 22h92M-40 38h80" stroke="#8A5A2B" stroke-width="3.5"/>
    <path d="M-30-12l6 58M0-12v58M30-12l-6 58" stroke="#8A5A2B" stroke-width="3"/>
  </g>`;
    }
    case 'newyear': {
      return `
  ${burst(52, 62, 34, '#FBBF24')}${burst(116, 22, 16, '#22D3EE', 8)}${burst(370, 40, 22, '#F472B6', 8)}
  <path d="M152 96L204 10l34 92Z" fill="${dark ? '#8B5CF6' : '#6D28D9'}"/>
  <path d="M168 70l42 12M184 44l32 10M160 88l52 12" stroke="#FBBF24" stroke-width="6" stroke-linecap="round"/>
  <circle cx="204" cy="10" r="9" fill="#FBBF24"/>
  <path d="M292 222L332 152" stroke="${dark ? '#CBD5E1' : '#64748B'}" stroke-width="4" stroke-linecap="round"/>
  ${burst(336, 144, 22, '#FDE047', 12)}
  <circle cx="362" cy="122" r="2.5" fill="#FDE047"/><circle cx="314" cy="118" r="2" fill="#FDE047"/><circle cx="356" cy="168" r="2" fill="#FDE047"/>`;
    }
    default:
      throw new Error(`unknown season ${id}`);
  }
}

const TITLES = {
  newyear: 'Gem, the graphemely cat, in a party hat with fireworks and a sparkler',
  carnival: 'Gem, the graphemely cat, in a carnival mask with feathers and confetti',
  easter: 'Gem, the graphemely cat, in bunny ears with a basket of painted eggs',
  valentine: "Gem, the graphemely cat, holding a heart balloon for Valentine's Day",
  junina: 'Gem, the graphemely cat, in a straw hat by a small bonfire under paper flags',
  halloween: 'Gem, the graphemely cat, in a witch hat with a carved pumpkin and bats',
  christmas: 'Gem, the graphemely cat, in a red hat and a striped scarf with snowflakes',
};

// Seasons whose prop takes the place of the ball of yarn.
const NO_YARN = new Set(['halloween', 'easter']);
const withoutYarn = (body) => body.replace(/<circle cx="330" cy="326" r="52"[^>]*\/>\s*<g[^>]*>[\s\S]*?<\/g>/, '');

function gem(id, dark, body) {
  if (NO_YARN.has(id)) body = withoutYarn(body);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${TITLES[id]}">
  <title>${TITLES[id]}</title>
  ${body}${costume(id, dark)}
</svg>
`;
}

/** A garland across the top of the page; the tile repeats horizontally. */
function accent(id, dark) {
  const W = 1200;
  const string = dark ? '#A39BBF' : '#5B5470';
  const n = 12;
  const at = (x) => {
    const t = x / W;
    return (1 - t) ** 2 * 8 + 2 * (1 - t) * t * 40 + t * t * 8;
  };
  const motif = (x, y, i) => {
    const s = `stroke="${string}" stroke-width="1.4"`;
    const hang = (len) => `<path d="M${x} ${y}v${len}" ${s}/>`;
    switch (id) {
      case 'halloween':
        if (i % 3 === 1) return `${hang(8)}${bat(x, y + 14, 0.42, dark ? '#A79BF2' : '#3A2E5C')}`;
        if (i % 3 === 2) return `${hang(6)}<path d="M${x - 9} ${y + 30}v-14a9 9 0 0 1 18 0v14l-3-2-3 2-3-2-3 2-3-2Z" fill="${dark ? '#EDE9FE' : '#FFFFFF'}" ${s}/><circle cx="${x - 3}" cy="${y + 17}" r="1.3" fill="${INK}"/><circle cx="${x + 3}" cy="${y + 17}" r="1.3" fill="${INK}"/>`;
        return `${hang(7)}<ellipse cx="${x}" cy="${y + 18}" rx="12" ry="10" fill="#F97316"/><path d="M${x} ${y + 8}v-2" stroke="#4D7C0F" stroke-width="3"/><path d="M${x - 5} ${y + 16}l2-3 2 3M${x + 1} ${y + 16}l2-3 2 3M${x - 5} ${y + 21}q5 3 10 0" fill="none" stroke="#7C2D12" stroke-width="1.4"/>`;
      case 'christmas': {
        const c = ['#C8283F', '#D4A017', '#16A34A'][i % 3];
        return `${hang(10)}<rect x="${x - 4}" y="${y + 9}" width="8" height="5" rx="1" fill="${string}"/><circle cx="${x}" cy="${y + 24}" r="10" fill="${c}"/><path d="M${x - 5} ${y + 20}q3-3 7-2" stroke="#FFFFFF" stroke-opacity=".65" stroke-width="2" fill="none"/>`;
      }
      case 'carnival': {
        const c = ['#F43F5E', '#22D3EE', '#FBBF24', '#8B5CF6'][i % 4];
        return `<path d="M${x - 14} ${y - 1}h28l-14 26Z" fill="${c}"/>${i % 2 ? `<circle cx="${x + 18}" cy="${y + 20}" r="2" fill="${c}"/>` : `<rect x="${x - 22}" y="${y + 18}" width="7" height="4" rx="1" fill="${c}" transform="rotate(30 ${x - 18} ${y + 20})"/>`}`;
      }
      case 'junina': {
        const c = ['#E63946', '#F4A261', '#2A9D8F', '#8B5CF6', '#E9C46A'][i % 5];
        return `<path d="M${x - 12} ${y - 1}h24v28l-12-8-12 8Z" fill="${c}"/>`;
      }
      case 'valentine':
        return `${hang(8)}${heart(x, y + 19, 0.7, ['#E11D48', '#FB7185', '#FDA4AF'][i % 3])}`;
      case 'easter': {
        const c = ['#A5B4FC', '#FDE68A', '#F9A8D4', '#86EFAC'][i % 4];
        return `${hang(8)}<ellipse cx="${x}" cy="${y + 20}" rx="9" ry="12" fill="${c}"/><path d="M${x - 8} ${y + 20}l4 3 4-3 4 3 4-3" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>`;
      }
      case 'newyear':
        return i % 2
          ? `${hang(6)}<path d="M${x} ${y + 8}l3.4 7 7.6 1-5.5 5.3 1.3 7.5L${x} ${y + 25}l-6.8 3.8 1.3-7.5-5.5-5.3 7.6-1Z" fill="#FBBF24"/>`
          : `${hang(6)}<rect x="${x - 3}" y="${y + 6}" width="6" height="4" fill="${string}"/><ellipse cx="${x}" cy="${y + 17}" rx="6" ry="8" fill="${['#22D3EE', '#F472B6', '#FDE047'][i % 3]}"/>`;
      default:
        throw new Error(id);
    }
  };
  const items = Array.from({ length: n }, (_, i) => {
    const x = Math.round(((i + 0.5) * W) / n);
    return motif(x, Number(at(x).toFixed(1)), i);
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 72" width="${W}" height="72" aria-hidden="true">
  <path d="M0 8Q${W / 2} 72 ${W} 8" fill="none" stroke="${string}" stroke-width="1.6"/>
  ${items}
</svg>
`;
}

/** Three icons per season on the 24 px grid of docs/assets/icons.svg: 1.6 stroke, round caps. */
const ICONS = {
  newyear: {
    firework: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/><circle cx="12" cy="12" r="1.2"/>',
    glass: '<path d="M8 3h8l-.5 5a3.5 3.5 0 0 1-7 0Z"/><path d="M12 11.5V20M8.5 20.5h7M8.3 6h7.4"/>',
    clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9 3h6M12 3v2.5"/>',
  },
  carnival: {
    mask: '<path d="M3 9.5c3-1.5 6-1 9 .5 3-1.5 6-2 9-.5 0 4-2 7-5 7-2 0-3-1.5-4-3-1 1.5-2 3-4 3-3 0-5-3-5-7Z"/><path d="M7 11.5h2M15 11.5h2"/>',
    popper: '<path d="M4 20 8.5 8l7.5 7.5Z"/><path d="M13 4v2M18.5 5.5 17 7M20 11h-2M14 9.5c1-1.2 2.6-1.2 3.6 0"/>',
    drum: '<ellipse cx="12" cy="9" rx="7" ry="2.5"/><path d="M5 9v7.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V9M5 11l3.5 7M12 11.5v7.5M19 11l-3.5 7M8 3.5l3 4M16 3.5l-3 4"/>',
  },
  easter: {
    egg: '<path d="M12 3c-3.5 0-6 5.5-6 10a6 6 0 0 0 12 0c0-4.5-2.5-10-6-10Z"/><path d="m6.4 12 2 1.5 2-1.5 1.6 1.5 1.6-1.5 2 1.5 2-1.5"/>',
    bunny: '<path d="M9.5 9.6C8.4 6.2 8.5 3 9.6 3s2.1 3 1.8 6.4M14.5 9.6c1.1-3.4 1-6.6-.1-6.6s-2.1 3-1.8 6.4"/><circle cx="12" cy="14.5" r="5.5"/><path d="M10.2 14v.4M13.8 14v.4M11.3 16.6h1.4"/>',
    tulip: '<path d="M12 21v-9M12 17c-2 0-4-1-4.5-3M12 12c-3 0-5-2-5-5.5L9.5 8 12 5l2.5 3L17 6.5C17 10 15 12 12 12Z"/>',
  },
  valentine: {
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4 4 0 0 1 12 7.6 4 4 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
    letter: '<rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
    balloon: '<path d="M12 14s-5-3-5-6.6A2.7 2.7 0 0 1 12 6a2.7 2.7 0 0 1 5 1.4C17 11 12 14 12 14Z"/><path d="M12 14c-1 2 1 3 0 4.5s-1 2 0 3"/>',
  },
  junina: {
    bonfire: '<path d="M12 3c2.5 3 4.5 5.2 4.5 8.2a4.5 4.5 0 0 1-9 0c0-1.9 1-3.2 2-4.2.2 1.6 1 2.5 2 2.8-.5-2.5-.2-4.5.5-6.8Z"/><path d="m4 21 16-3.5M4 17.5 20 21"/>',
    corn: '<path d="M12 3c-2.4 2-3.4 5-3.4 8.4 0 3 1 5.4 3.4 7.4 2.4-2 3.4-4.4 3.4-7.4C15.4 8 14.4 5 12 3Z"/><path d="M9 9.5h6M8.7 13h6.6M12 4v14.5M12 19c-2-1-5-1.5-7-4M12 19c2-1 5-1.5 7-4"/>',
    flags: '<path d="M2 5c6 3 14 3 20 0"/><path d="M4.5 6.2 6 12l2.5-5ZM10.5 7.4 12 13l1.5-5.6ZM15.5 7 18 12l1.5-5.8Z"/>',
  },
  halloween: {
    pumpkin: '<path d="M12 7.5c-1.3-1.5-4.6-1.6-6.4.4-2.2 2.4-2 7.6 0 10 1.7 2 4.6 2.2 6.4.6 1.8 1.6 4.7 1.4 6.4-.6 2-2.4 2.2-7.6 0-10-1.8-2-5.1-1.9-6.4-.4Z"/><path d="M12 7.5c-1 2.5-1 8.5 0 11M12 7.5V5c.5-1 1.5-1.6 2.5-1.6"/>',
    bat: '<path d="M12 10c-1-1.8-3.6-2.6-5.6-1.8.6 1.4.2 2.8-1 3.6-1.4-.8-2.8-.6-3.9.4 2.4.6 4.4 2 5.3 4.3 1.3-1 3-1.2 4.2-.2L12 17.5l1-1.2c1.2-1 2.9-.8 4.2.2.9-2.3 2.9-3.7 5.3-4.3-1.1-1-2.5-1.2-3.9-.4-1.2-.8-1.6-2.2-1-3.6-2-.8-4.6 0-5.6 1.8Z"/>',
    ghost: '<path d="M6 20v-9a6 6 0 0 1 12 0v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5Z"/><path d="M10 11v.5M14 11v.5"/>',
  },
  christmas: {
    tree: '<path d="M12 3 7.5 9H10l-4 5.5h3L5 20h14l-4-5.5h3L14 9h2.5Z"/><path d="M12 20v1.5"/>',
    snowflake: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-4-5.5-2S9 9 12 9Zm0 0c1.5-3 5-4 5.5-2S15 9 12 9Z"/>',
  },
};

const iconAttrs = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

export const SEASONS = Object.keys(TITLES);

/** The icon names of a season, in order; the first one marks the chip. */
export const iconNames = (id) => Object.keys(ICONS[id]);

export function writeSeasonArt(root) {
  const body = gemBody(root);
  const symbols = [];
  let css = `/* Generated by scripts/docs/seasons-art.mjs, do not edit by hand.
   Points the page at the art of the season set on <html data-season>. */\n`;
  for (const id of SEASONS) {
    const dir = new URL(`assets/seasons/${id}/`, root);
    mkdirSync(dir, { recursive: true });
    for (const dark of [false, true]) {
      const tone = dark ? 'dark' : 'light';
      writeFileSync(new URL(`gem-${tone}.svg`, dir), gem(id, dark, body));
      writeFileSync(new URL(`accent-${tone}.svg`, dir), accent(id, dark));
    }
    for (const [name, paths] of Object.entries(ICONS[id])) {
      writeFileSync(new URL(`icon-${name}.svg`, dir), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${iconAttrs} aria-hidden="true">${paths}</svg>\n`);
      symbols.push(`  <symbol id="s-${id}-${name}" viewBox="0 0 24 24" ${iconAttrs}>${paths}</symbol>`);
    }
    const vars = (tone) => `--season-gem: url('assets/seasons/${id}/gem-${tone}.svg'); --season-accent: url('assets/seasons/${id}/accent-${tone}.svg');`;
    css += `:root[data-season='${id}'] { ${vars('light')} }\n`;
    css += `:root[data-theme='dark'][data-season='${id}'] { ${vars('dark')} }\n`;
    css += `@media (prefers-color-scheme: dark) { :root:not([data-theme='light'])[data-season='${id}'] { ${vars('dark')} } }\n`;
  }
  writeFileSync(
    new URL('assets/seasons/icons.svg', root),
    `<svg xmlns="http://www.w3.org/2000/svg">\n  <!-- Seasonal icons, generated by scripts/docs/seasons-art.mjs. Same grid and stroke as docs/assets/icons.svg. -->\n${symbols.join('\n')}\n</svg>\n`,
  );
  return css;
}
