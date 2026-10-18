#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Cobertura de fluxos E2E: rotas do app × rotas que algum teste E2E visita.
//   node e2e-rotas.mjs [--root=.] [--e2e-dir=<pasta>] [--json]
// Rotas lidas por convenção (sem executar o app):
//   Next.js app router (app/**/page.*), Next.js pages router (pages/**), SvelteKit
//   (src/routes/**/+page.svelte), React Router / Vue Router (path: '/x', <Route path="/x">).
// Rota coberta = algum teste E2E faz page.goto() para ela. [id], :id e ${...} casam com qualquer valor.
// Saída: JSON { rotas, total, cobertas, descobertas, percentual, visitasSemRota, origens }
// Exit: 0 ok · 3 pasta do projeto não existe
// =============================================================================
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORE = new Set(['node_modules', '.git', '.qa', 'coverage', 'dist', 'build', '.next', 'out', '.svelte-kit', 'test-results', 'playwright-report']);

function listFiles(root, rel = '', acc = [], depth = 0) {
  if (depth > 15 || acc.length > 50000) return acc;
  let entries = [];
  try { entries = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) listFiles(root, r, acc, depth + 1);
    else acc.push(r);
  }
  return acc;
}

const cleanRoute = (r) => {
  let x = `/${r}`.replace(/\/+/g, '/');
  if (x.length > 1) x = x.replace(/\/$/, '');
  return x;
};

export function findRoutes(root, files) {
  const rotas = new Map();
  const add = (rota, origem, arquivo) => { if (!rotas.has(rota)) rotas.set(rota, { rota, origem, arquivo }); };

  for (const base of ['app', 'src/app']) {
    for (const f of files) {
      const m = f.match(new RegExp(`^${base.replace('/', '\\/')}\\/(?:(.*)\\/)?page\\.(?:[cm]?[jt]sx?|mdx)$`));
      if (!m) continue;
      const segs = (m[1] || '').split('/').filter(Boolean);
      if (segs.some((s) => s.startsWith('_') || s.startsWith('(.') || s.startsWith('@'))) continue;
      add(cleanRoute(segs.filter((s) => !/^\(.*\)$/.test(s)).join('/')), 'next-app', f);
    }
  }
  for (const base of ['pages', 'src/pages']) {
    for (const f of files) {
      const m = f.match(new RegExp(`^${base.replace('/', '\\/')}\\/(.*)\\.(?:[cm]?[jt]sx?|mdx)$`));
      if (!m || /\.(test|spec)$/.test(m[1])) continue;
      const segs = m[1].split('/');
      if (segs[0] === 'api' || segs.some((s) => s.startsWith('_')) || ['404', '500'].includes(segs.join('/'))) continue;
      if (segs[segs.length - 1] === 'index') segs.pop();
      add(cleanRoute(segs.join('/')), 'next-pages', f);
    }
  }
  for (const f of files) {
    const m = f.match(/^src\/routes\/(?:(.*)\/)?\+page\.svelte$/);
    if (!m) continue;
    const segs = (m[1] || '').split('/').filter((s) => s && !/^\(.*\)$/.test(s));
    add(cleanRoute(segs.join('/')), 'sveltekit', f);
  }
  // React Router / Vue Router: só arquivos que parecem configurar rotas.
  for (const f of files) {
    if (!/\.(?:[cm]?[jt]sx?|vue)$/.test(f) || /\.(test|spec)\./.test(f) || !/^(src|app)\//.test(f)) continue;
    let text = '';
    try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    if (!/createBrowserRouter|createHashRouter|<Routes|<Route\b|createRouter|RouterModule|routes\s*[:=]/.test(text)) continue;
    const re = /<Route\b[^>]*?\bpath\s*=\s*\{?\s*['"`]([^'"`]+)['"`]|\bpath\s*:\s*['"`]([^'"`]+)['"`]/g;
    let mm;
    while ((mm = re.exec(text))) {
      const p = mm[1] || mm[2];
      if (!p.startsWith('/') || p.includes('*') || p.includes('(')) continue;
      add(cleanRoute(p), 'router', f);
    }
  }
  return [...rotas.values()].sort((a, b) => a.rota.localeCompare(b.rota));
}

// Caminhos que os testes E2E visitam com goto().
export function findVisits(root, files, e2eDir) {
  const visits = [];
  const inDir = (f) => !e2eDir || f === e2eDir || f.startsWith(`${e2eDir}/`);
  for (const f of files) {
    if (!/\.(test|spec)\.[cm]?[jt]sx?$/.test(f) || !inDir(f)) continue;
    let text = '';
    try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    const re = /\.goto\(\s*(['"`])((?:(?!\1)[\s\S])*?)\1/g;
    let m;
    while ((m = re.exec(text))) {
      let p = m[2]
        .replace(/^\$\{[^}]+\}/, '')            // `${baseURL}/x`
        .replace(/^https?:\/\/[^/]+/, '')       // http://localhost:3000/x
        .replace(/[?#].*$/, '')
        .replace(/\$\{[^}]+\}/g, ':valor');     // /produtos/${id}
      if (!p.startsWith('/')) p = `/${p}`;
      visits.push({ caminho: cleanRoute(p), teste: `${f}:${text.slice(0, m.index).split('\n').length}` });
    }
  }
  return visits;
}

function routeRegex(rota) {
  const body = rota.split('/').map((s) => {
    if (/^\[\[\.\.\..+\]\]$/.test(s)) return '(?:/.*)?';
    if (/^\[\.\.\..+\]$/.test(s)) return '/.+';
    if (/^\[.+\]$/.test(s) || /^:/.test(s)) return '/[^/]+';
    return s ? `/${s.replace(/[.+?^$()|{}\\]/g, '\\$&')}` : '';
  }).join('');
  return new RegExp(`^${body || '/'}$`);
}

export function analyze(root, e2eDir) {
  const files = listFiles(root);
  const rotas = findRoutes(root, files);
  const visits = findVisits(root, files, e2eDir);
  const used = new Set();
  for (const r of rotas) {
    const re = routeRegex(r.rota);
    r.testes = [...new Set(visits.filter((v) => re.test(v.caminho)).map((v) => { used.add(v); return v.teste; }))];
    r.coberta = r.testes.length > 0;
  }
  const cobertas = rotas.filter((r) => r.coberta).length;
  const total = rotas.length;
  return {
    rotas,
    total,
    cobertas,
    descobertas: total - cobertas,
    percentual: total ? Math.round((cobertas / total) * 10000) / 100 : 0,
    visitasSemRota: [...new Set(visits.filter((v) => !used.has(v)).map((v) => v.caminho))],
    origens: [...new Set(rotas.map((r) => r.origem))],
    e2eDir: e2eDir || null,
  };
}

function detectE2eDir(root) {
  for (const f of ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs']) {
    try {
      const m = readFileSync(join(root, f), 'utf8').match(/testDir\s*:\s*['"`]([^'"`]+)['"`]/);
      if (m) return m[1].replace(/^\.\//, '').replace(/\/$/, '');
    } catch { /* sem config */ }
  }
  return null;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`Pasta não encontrada: ${root}`);
    process.exit(3);
  }
  const r = analyze(root, opt('e2e-dir') || detectE2eDir(root));
  if (args.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else if (!r.total) {
    console.log('Não reconheci as rotas do app (suportados: Next.js app/pages, SvelteKit, React Router, Vue Router).');
  } else {
    const pct = r.percentual.toFixed(2).replace('.', ',');
    console.log(`Rotas com teste E2E: ${r.cobertas} de ${r.total} (${pct}%)`);
    for (const x of r.rotas) console.log(`  ${x.coberta ? '✔' : '✘'} ${x.rota.padEnd(32)} ${x.coberta ? x.testes[0] : 'sem teste E2E'}`);
    if (r.visitasSemRota.length) console.log(`Visitas que não batem com rota conhecida: ${r.visitasSemRota.join(', ')}`);
  }
}
