#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Cobertura de fluxos E2E: rotas do app × rotas que algum teste E2E visita.
//   node e2e-rotas.mjs [--root=.] [--e2e-dir=<pasta>] [--json] [--out=<arquivo.json>]
// Rotas lidas por convenção (sem executar o app), só quando o framework está nas dependências:
//   Next.js app router (app/**/page.*), Next.js pages router (pages/**), SvelteKit
//   (src/routes/**/+page.svelte), React Router / Vue Router (path: '/x', <Route path="/x">).
// Rota coberta = algum teste E2E faz page.goto() para ela. [id], :id e ${...} casam com qualquer valor.
// Arquivos: `git ls-files` (respeita o .gitignore); sem git, varredura da pasta com limite.
// Saída: JSON { rotas, total, cobertas, descobertas, percentual, visitasSemRota, origens, truncado }
// Exit: 0 ok · 3 pasta do projeto não existe
// =============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const IGNORE = new Set(['node_modules', '.git', '.qa', 'coverage', 'dist', 'build', '.next', 'out', '.svelte-kit',
  'test-results', 'playwright-report', 'vendor', '.turbo', '.cache', 'storybook-static', '.nuxt', '.output', '.vercel',
  '.expo', '.angular', '.parcel-cache', '.yarn', 'target', 'tmp', '.tmp']);
const MAX_FILES = 50000;

// Lista os arquivos do projeto. Com git: versionados + não versionados que o .gitignore não exclui
// (rápido e sem lixo de build). Sem git: varredura manual, com limite e aviso de corte.
export function listFiles(root) {
  try {
    const out = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-co', '--exclude-standard', '-z'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
    const files = out.split('\0').filter((f) => f && !f.split('/').some((seg) => IGNORE.has(seg)));
    // Arquivos removidos do disco mas ainda no índice não contam.
    files.truncado = false;
    return files;
  } catch { /* sem git: cai na varredura */ }
  const acc = [];
  let truncado = false;
  (function walk(rel, depth) {
    if (truncado) return;
    if (depth > 15 || acc.length >= MAX_FILES) { truncado = true; return; }
    let entries = [];
    try { entries = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r, depth + 1);
      else acc.push(r);
    }
  })('', 0);
  acc.truncado = truncado;
  return acc;
}

const cleanRoute = (r) => {
  let x = `/${r}`.replace(/\/+/g, '/');
  if (x.length > 1) x = x.replace(/\/$/, '');
  return x;
};

// Dependências declaradas no package.json (para só aplicar a convenção do framework presente).
export function readDeps(root) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    return new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
  } catch { return new Set(); }
}

const NEXT_APP_RE = /^(?:src\/)?app\/(?:(.*)\/)?page\.(?:[cm]?[jt]sx?|mdx)$/;
const NEXT_PAGES_RE = /^(?:src\/)?pages\/(.*)\.(?:[cm]?[jt]sx?|mdx)$/;
const SVELTE_RE = /^src\/routes\/(?:(.*)\/)?\+page\.svelte$/;
const ROUTER_FILE_RE = /\.(?:[cm]?[jt]sx?|vue)$/;
const ROUTER_HINT_RE = /createBrowserRouter|createHashRouter|<Routes|<Route\b|createRouter|RouterModule|routes\s*[:=]/;
// Em <Route …>, atributos JSX como element={<Foo />} têm `>` dentro das chaves: pula o conteúdo entre chaves.
const ROUTER_PATH_RE = /<Route\b(?:[^>{]|\{[^}]*\})*?\bpath\s*=\s*\{?\s*['"`]([^'"`]+)['"`]|\bpath\s*:\s*['"`]([^'"`]+)['"`]/g;

// Imports do arquivo de rotas: nome do componente → caminho importado (inclusive lazy(() => import())).
const IMPORT_NAMES_RE = /import\s+(?:(\w+)\s*(?:,\s*\{([^}]*)\})?|\{([^}]*)\})\s*from\s*['"]([^'"]+)['"]/g;
const LAZY_RE = /(?:const|let|var)\s+(\w+)\s*=\s*(?:React\.)?lazy\(\s*(?:async\s*)?\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g;
export function componentImports(text) {
  const map = new Map();
  let m;
  IMPORT_NAMES_RE.lastIndex = 0;
  while ((m = IMPORT_NAMES_RE.exec(text))) {
    if (m[1]) map.set(m[1], m[4]);
    for (const part of `${m[2] || ''},${m[3] || ''}`.split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) map.set(name, m[4]);
    }
  }
  LAZY_RE.lastIndex = 0;
  while ((m = LAZY_RE.exec(text))) map.set(m[1], m[2]);
  return map;
}

// Componente da rota declarada em `at`: element={<Foo/>}, element: <Foo/>, Component: Foo, component: Foo,
// na mesma <Route …/> ou no mesmo objeto { … }.
const ELEMENT_RE = /\b(?:element|Component|component)\s*[:=]\s*\{?\s*(?:<\s*)?([A-Z]\w*)/;
function routeComponent(text, start, end) {
  // Dentro da própria <Route …> (element antes do path).
  const inside = text.slice(start, end).match(ELEMENT_RE);
  if (inside) return inside[1];
  let after = text.slice(end, end + 400);
  const cut = after.search(/<Route\b|\bpath\s*[:=]/);
  if (cut >= 0) after = after.slice(0, cut);
  const m = after.match(ELEMENT_RE);
  if (m) return m[1];
  let before = text.slice(Math.max(0, start - 300), start);
  const corte = Math.max(before.lastIndexOf('<Route'), before.lastIndexOf('{'));
  if (corte >= 0) before = before.slice(corte);
  const all = [...before.matchAll(new RegExp(ELEMENT_RE.source, 'g'))];
  return all.length ? all[all.length - 1][1] : null;
}

export function findRoutes(root, files, { deps = readDeps(root), readCache = new Map() } = {}) {
  const rotas = new Map();
  const add = (rota, origem, arquivo, extra = {}) => { if (!rotas.has(rota)) rotas.set(rota, { rota, origem, arquivo, ...extra }); };
  const read = (f) => {
    if (!readCache.has(f)) { try { readCache.set(f, readFileSync(join(root, f), 'utf8')); } catch { readCache.set(f, null); } }
    return readCache.get(f);
  };
  const hasNext = deps.has('next') || files.some((f) => /^next\.config\.[cm]?[jt]s$/.test(f));
  const hasSvelte = deps.has('@sveltejs/kit');

  for (const f of files) {
    if (hasNext) {
      let m = f.match(NEXT_APP_RE);
      if (m) {
        const segs = (m[1] || '').split('/').filter(Boolean);
        if (!segs.some((s) => s.startsWith('_') || s.startsWith('(.') || s.startsWith('@'))) {
          add(cleanRoute(segs.filter((s) => !/^\(.*\)$/.test(s)).join('/')), 'next-app', f);
        }
        continue;
      }
      m = f.match(NEXT_PAGES_RE);
      if (m && !/\.(test|spec)$/.test(m[1])) {
        const segs = m[1].split('/');
        if (segs[0] !== 'api' && !segs.some((s) => s.startsWith('_')) && !['404', '500'].includes(segs.join('/'))) {
          if (segs[segs.length - 1] === 'index') segs.pop();
          add(cleanRoute(segs.join('/')), 'next-pages', f);
        }
        continue;
      }
    }
    if (hasSvelte) {
      const m = f.match(SVELTE_RE);
      if (m) {
        const segs = (m[1] || '').split('/').filter((s) => s && !/^\(.*\)$/.test(s));
        add(cleanRoute(segs.join('/')), 'sveltekit', f);
        continue;
      }
    }
    // React Router / Vue Router: só arquivos que parecem configurar rotas.
    if (!ROUTER_FILE_RE.test(f) || /\.(test|spec)\./.test(f) || !/^(src|app)\//.test(f)) continue;
    const text = read(f);
    if (!text || !ROUTER_HINT_RE.test(text)) continue;
    const imports = componentImports(text);
    ROUTER_PATH_RE.lastIndex = 0;
    let mm;
    while ((mm = ROUTER_PATH_RE.exec(text))) {
      const p = mm[1] || mm[2];
      if (!p.startsWith('/') || p.includes('*') || p.includes('(')) continue;
      const componente = routeComponent(text, mm.index, mm.index + mm[0].length);
      // `arquivo` é o arquivo de rotas; `importa` é o que a tela importa (resolvido pelo e2e-afetados).
      add(cleanRoute(p), 'router', f, componente ? { componente, importa: imports.get(componente) || null } : {});
    }
  }
  return [...rotas.values()].sort((a, b) => a.rota.localeCompare(b.rota));
}

export const isSpec = (f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f);

// Caminhos que os testes E2E visitam com goto(): nas specs e nos Page Objects/helpers da pasta
// de E2E (a visita vale para as specs que importam o helper; o e2e-afetados faz essa ligação).
const E2E_CODE = /\.[cm]?[jt]sx?$/;
export function findVisits(root, files, e2eDir, { readCache = new Map() } = {}) {
  const visits = [];
  const inDir = (f) => !e2eDir || f === e2eDir || f.startsWith(`${e2eDir}/`);
  for (const f of files) {
    if (!inDir(f) || !(isSpec(f) || (e2eDir && E2E_CODE.test(f)))) continue;
    if (!readCache.has(f)) { try { readCache.set(f, readFileSync(join(root, f), 'utf8')); } catch { readCache.set(f, null); } }
    const text = readCache.get(f);
    if (!text) continue;
    const re = /\.goto\(\s*(['"`])((?:(?!\1)[\s\S])*?)\1/g;
    let m;
    while ((m = re.exec(text))) {
      let p = m[2]
        .replace(/^\$\{[^}]+\}/, '')            // `${baseURL}/x`
        .replace(/^https?:\/\/[^/]+/, '')       // http://localhost:3000/x
        .replace(/[?#].*$/, '')
        .replace(/\$\{[^}]+\}/g, ':valor');     // /produtos/${id}
      if (!p.startsWith('/')) p = `/${p}`;
      visits.push({ caminho: cleanRoute(p), teste: `${f}:${text.slice(0, m.index).split('\n').length}`, helper: !isSpec(f) });
    }
  }
  return visits;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function routeRegex(rota) {
  const body = rota.split('/').map((s) => {
    if (/^\[\[\.\.\..+\]\]$/.test(s)) return '(?:/.*)?';
    if (/^\[\.\.\..+\]$/.test(s)) return '/.+';
    if (/^\[.+\]$/.test(s) || /^:/.test(s)) return '/[^/]+';
    return s ? `/${escapeRe(s)}` : '';
  }).join('');
  return new RegExp(`^${body || '/'}$`);
}

// `files` e `readCache` podem vir de fora para não varrer nem ler o projeto duas vezes.
export function analyze(root, e2eDir, { files = listFiles(root), readCache = new Map(), deps } = {}) {
  const rotas = findRoutes(root, files, { deps, readCache });
  const visits = findVisits(root, files, e2eDir, { readCache });
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
    truncado: Boolean(files.truncado),
  };
}

// Pasta dos testes E2E: testDir do playwright.config (inclusive dentro de projects[] e com
// path.join/__dirname); sem config, `e2e/` ou `tests/` se existirem. null = não dá para saber.
export function detectE2eDir(root) {
  for (const f of ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs', 'playwright.config.cjs', 'playwright.config.mts', 'playwright.config.cts']) {
    let text;
    try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    const m = text.match(/testDir\s*:\s*(?:path\.)?(?:join|resolve)?\(?\s*(?:__dirname\s*,\s*)?['"`]([^'"`]+)['"`]/);
    if (m) return m[1].replace(/^\.\//, '').replace(/\/$/, '') || null;
    break;
  }
  for (const d of ['e2e', 'tests/e2e', 'tests', 'test/e2e']) {
    try { if (statSync(join(root, d)).isDirectory()) return d; } catch { /* não existe */ }
  }
  return null;
}

// Grava JSON em --out (cria a pasta), para a skill não ter que transcrever a saída.
export function writeOut(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
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
  if (opt('out')) writeOut(resolve(root, opt('out')), r);
  if (args.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else if (!r.total) {
    console.log('Não reconheci as rotas do app (suportados: Next.js app/pages, SvelteKit, React Router, Vue Router).');
  } else {
    const ui = await import('./ui.mjs');
    const L = [...ui.cabecalho('rotas com teste E2E', r.origens.join(', '))];
    L.push(ui.linhaBarra('Cobertas', r.percentual, { valor: `${r.cobertas} de ${r.total}`, extra: ui.c.suave(ui.pct(r.percentual)) }));
    L.push(ui.regua());
    const col = Math.min(32, Math.max(8, ...r.rotas.map((x) => ui.width(x.rota))));
    L.push(ui.titulo('🗺️ ', 'Rotas'), ...ui.arvore(r.rotas.map((x) => (x.coberta
      ? `${ui.ok()} ${ui.padEnd(ui.c.ouro(x.rota), col)}  ${ui.c.suave(x.testes[0])}`
      : `${ui.erro()} ${ui.padEnd(x.rota, col)}  ${ui.c.falha('sem teste E2E')}`))));
    if (r.visitasSemRota.length) L.push('', ` ${ui.alerta(`Visitas que não batem com rota conhecida: ${r.visitasSemRota.join(', ')}`)}`);
    if (r.truncado) L.push('', ` ${ui.alerta(`Varredura cortada em ${MAX_FILES} arquivos (sem git): a contagem pode estar incompleta`)}`);
    console.log(L.join('\n'));
  }
}
