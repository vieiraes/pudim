#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Specs E2E afetados pelo que mudou: roda só a área mexida, não a suíte inteira.
//   node e2e-afetados.mjs [--root=.] [--e2e-dir=<pasta>] [--base=<commit>] [--arquivos=a,b] [--json] [--out=<arquivo.json>]
//   node e2e-afetados.mjs --sugerir-mapa [--root=.] [--e2e-dir=<pasta>] [--json] [--out=<arquivo.json>]
// Alterados: git diff <base>...HEAD + o que não foi commitado + arquivos novos.
//   <base> padrão = merge-base com o branch principal (origin/HEAD, init.defaultBranch, main,
//   master, develop, trunk). --arquivos dispensa o git. Sem base, a saída traz `aviso`.
// Um spec entra quando (motivos):
//   spec   — o próprio spec mudou
//   helper — mudou um arquivo que o spec importa (page object, fixture)
//   rota   — o alterado chega a uma página pelos imports (relativos e paths do tsconfig, inclusive
//            por extends/references), ou é um layout acima dela, e o spec visita essa rota com goto()
//   nome   — uma pasta/arquivo do alterado tem o mesmo nome que o caminho do spec (pix-out = pixOut)
//   mapa   — .qa/areas.json: o alterado está numa área; entram os specs dela e dos vizinhos
// Transversal (perguntar antes de rodar tudo): package.json, lockfile, playwright.config,
//   tsconfig, .env, middleware, layout raiz, arquivo de rotas, ou arquivo usado por mais da
//   metade das telas ou dos specs. Em monorepo, os da raiz do repositório também contam.
// Saída: JSON { base, aviso, alterados, specs[{arquivo,motivos}], semEfeito, transversal, totalSpecs, selecionados, areas, mapa, truncado }
// Exit: 0 ok · 3 pasta do projeto não existe, --base inválido, ou sem git e sem --arquivos
// =============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, detectE2eDir, isSpec, listFiles, readDeps, writeOut } from './e2e-rotas.mjs';

const CODE = /\.(?:[cm]?[jt]sx?|vue|svelte)$/;
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.vue', '.svelte'];
// import './x.js' em TypeScript com ESM aponta para x.ts no disco.
const TS_FOR_JS = { '.js': ['.ts', '.tsx'], '.jsx': ['.tsx'], '.mjs': ['.mts'], '.cjs': ['.cts'] };
const GENERIC = new Set(['src', 'app', 'apps', 'components', 'component', 'lib', 'libs', 'utils', 'util',
  'helpers', 'helper', 'hooks', 'hook', 'types', 'type', 'pages', 'page', 'index', 'layout', 'features',
  'feature', 'modules', 'module', 'services', 'service', 'api', 'server', 'client', 'shared', 'common',
  'core', 'e2e', 'tests', 'test', 'spec', 'specs', 'styles', 'style', 'assets', 'public', 'config',
  'constants', 'store', 'stores', 'models', 'model', 'routes', 'route', 'views', 'view', 'screens',
  'screen', 'ui', 'enums', 'enum', 'domain', 'fixtures', 'fixture', 'mocks', 'data', 'tsx', 'jsx']);

// pix-out, pixOut, pix_out e PixOut → "pixout"
export const norm = (s) => s.toLowerCase().replace(/[-_\s.]/g, '');

// Nomes que identificam uma área num caminho: pastas e o nome do arquivo sem extensão/sufixos.
export function tokens(path) {
  const segs = path.split('/');
  const last = segs.pop().replace(/\.(test|spec)(?=\.)/, '').replace(/\.[^.]+$/, '');
  return [...new Set([...segs, ...last.split('.')]
    .map((s) => s.replace(/^\((.*)\)$/, '$1'))
    .filter((s) => !/^\[.*\]$/.test(s) && !s.startsWith(':'))
    .map(norm)
    .filter((t) => t.length >= 3 && !GENERIC.has(t)))];
}

// Glob simples: ** (qualquer nível), * (dentro de um nível), ? e {a,b}. Glob inválido → null.
const globCache = new Map();
export function globToRegex(glob) {
  if (globCache.has(glob)) return globCache.get(glob);
  let re = '';
  let braces = 0;
  let stars = 0;
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      stars++;
      if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '{') { braces++; re += '(?:'; }
    else if (c === '}' && braces) { braces--; re += ')'; }
    else if (c === ',' && braces) re += '|';
    else re += c.replace(/[.+^$()|[\]\\{}]/g, '\\$&');
  }
  let out = null;
  // Chaves sem fechar ou mais de 4 `**` (backtracking) não viram regex.
  if (!braces && stars <= 4 && glob.length <= 300) { try { out = new RegExp(`^${re}$`); } catch { out = null; } }
  globCache.set(glob, out);
  return out;
}
const matchAny = (globs, f) => (globs || []).some((g) => globToRegex(String(g).replace(/^\.\//, ''))?.test(f));

// tsconfig/jsconfig com comentários e vírgula sobrando.
function readJsonc(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return null; }
  let out = '';
  for (let i = 0, str = false; i < text.length; i++) {
    const c = text[i];
    if (str) { out += c; if (c === '\\') out += text[++i] ?? ''; else if (c === '"') str = false; continue; }
    if (c === '"') { str = true; out += c; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2); if (i < 0) break; i++; continue; }
    out += c;
  }
  try { return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')); } catch { return null; }
}

// Aliases (paths) de tsconfig.json/jsconfig.json, seguindo `extends` (arquivo ou pacote) e
// `references` (tsconfig.app.json do Vite). baseUrl é relativo ao arquivo que o declarou.
export function readAliases(root) {
  const result = { baseUrl: null, paths: [] };
  const seen = new Set();
  const visit = (file, depth) => {
    const abs = resolve(root, file);
    if (seen.has(abs) || depth > 8) return;
    seen.add(abs);
    const cfg = readJsonc(abs);
    if (!cfg) return;
    const dir = posix.dirname(posix.relative(root, abs).split('\\').join('/')) || '.';
    const co = cfg.compilerOptions || {};
    if (co.paths) {
      const baseUrl = posix.normalize(posix.join(dir, co.baseUrl || '.'));
      for (const [k, v] of Object.entries(co.paths)) {
        if (!Array.isArray(v)) continue;
        result.paths.push({ prefix: k.replace(/\*$/, ''), wild: k.endsWith('*'), targets: v.map((t) => posix.normalize(posix.join(baseUrl, String(t).replace(/\*$/, '')))) });
      }
      if (co.baseUrl && !result.baseUrl) result.baseUrl = baseUrl;
    } else if (co.baseUrl && !result.baseUrl) result.baseUrl = posix.normalize(posix.join(dir, co.baseUrl));
    for (const ext of [].concat(cfg.extends || [])) {
      const target = ext.startsWith('.') ? resolve(root, dir, ext) : join(root, 'node_modules', ext);
      for (const cand of [target, `${target}.json`, join(target, 'tsconfig.json')]) {
        if (existsSync(cand) && statSync(cand).isFile()) { visit(cand, depth + 1); break; }
      }
    }
    for (const ref of cfg.references || []) {
      if (!ref || !ref.path) continue;
      const target = resolve(root, dir, ref.path);
      visit(existsSync(target) && statSync(target).isDirectory() ? join(target, 'tsconfig.json') : target, depth + 1);
    }
  };
  for (const f of ['tsconfig.json', 'jsconfig.json']) if (existsSync(join(root, f))) visit(f, 0);
  return result;
}

const IMPORT_RE = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

// Resolve o texto de um import (relativo, alias do tsconfig ou baseUrl) para um arquivo do projeto.
export function makeResolver(root, files, extra = []) {
  const known = new Set([...files, ...extra]);
  const aliases = readAliases(root);
  const tryResolve = (p) => {
    p = posix.normalize(p).replace(/^\.\//, '');
    if (known.has(p)) return p;
    const ext = posix.extname(p);
    for (const e of TS_FOR_JS[ext] || []) { const q = p.slice(0, -ext.length) + e; if (known.has(q)) return q; }
    for (const e of EXTS) if (known.has(p + e)) return p + e;
    for (const e of EXTS) if (known.has(`${p}/index${e}`)) return `${p}/index${e}`;
    return null;
  };
  const resolveSpec = (from, spec) => {
    if (spec.startsWith('.')) return tryResolve(posix.join(posix.dirname(from), spec));
    for (const a of aliases.paths) {
      if (a.wild ? spec.startsWith(a.prefix) : spec === a.prefix) {
        for (const t of a.targets) {
          const r = tryResolve(a.wild ? t + spec.slice(a.prefix.length) : t);
          if (r) return r;
        }
      }
    }
    return aliases.baseUrl ? tryResolve(posix.join(aliases.baseUrl, spec)) : null;
  };
  return resolveSpec;
}

// Grafo reverso de imports: arquivo → quem o importa.
export function importGraph(root, files, extra = [], { readCache = new Map(), resolveSpec = makeResolver(root, files, extra) } = {}) {
  const importers = new Map();
  for (const f of files) {
    if (!CODE.test(f)) continue;
    if (!readCache.has(f)) { try { readCache.set(f, readFileSync(join(root, f), 'utf8')); } catch { readCache.set(f, null); } }
    const text = readCache.get(f);
    if (!text) continue;
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(text))) {
      const r = resolveSpec(f, m[1] || m[2] || m[3] || m[4]);
      if (!r || r === f) continue;
      if (!importers.has(r)) importers.set(r, new Set());
      importers.get(r).add(f);
    }
  }
  return importers;
}

// Fecho reverso: tudo que depende de `start` (inclusive ele). BFS com índice, sem shift().
function reach(importers, start) {
  const seen = new Set([start]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const imp of importers.get(queue[i]) || []) if (!seen.has(imp)) { seen.add(imp); queue.push(imp); }
  }
  return seen;
}

const LAYOUT_RE = /^((?:src\/)?app(?:\/.*)?)\/(?:layout|template|loading|error|not-found)\.(?:[cm]?[jt]sx?)$/;
const TRANSVERSAL = [
  [/(^|\/)package\.json$/, 'dependências do projeto (package.json)'],
  [/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/, 'versões das dependências (lockfile)'],
  [/(^|\/)playwright\.config\.[cm]?[jt]s$/, 'configuração do Playwright'],
  [/(^|\/)[tj]sconfig[^/]*\.json$/, 'configuração do TypeScript'],
  [/(^|\/)\.env[^/]*$/, 'variáveis de ambiente (.env)'],
  [/^(src\/)?middleware\.[cm]?[jt]s$/, 'middleware, roda em todas as telas'],
  [/^(src\/)?(app\/(layout|template)|pages\/_(app|document))\.[cm]?[jt]sx?$/, 'layout raiz, aparece em todas as telas'],
];
const isTransversalName = (f) => TRANSVERSAL.some(([re]) => re.test(f));

function git(root, args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
}
const zlines = (s) => s.split('\0').filter(Boolean);

// Branch principal do repositório, na ordem: origin/HEAD, init.defaultBranch, nomes comuns.
export function defaultBase(root) {
  const cands = [];
  try { cands.push(git(root, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']).trim().replace(/^refs\/remotes\//, '')); } catch { /* sem origin */ }
  try { const b = git(root, ['config', '--get', 'init.defaultBranch']).trim(); if (b) cands.push(b, `origin/${b}`); } catch { /* sem config */ }
  cands.push('main', 'master', 'develop', 'trunk', 'origin/main', 'origin/master', 'origin/develop', 'origin/trunk');
  for (const b of cands) {
    try { return git(root, ['merge-base', 'HEAD', b]).trim(); } catch { /* não existe */ }
  }
  return null;
}

export function changedFiles(root, base) {
  if (base && base.startsWith('-')) throw new Error(`--base inválido: ${base}`);
  const top = git(root, ['rev-parse', '--show-toplevel']).trim();
  let aviso = null;
  if (base) {
    try { base = git(root, ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`]).trim(); } catch { throw new Error(`--base não é um commit: ${base}`); }
  } else {
    base = defaultBase(root);
    if (!base) aviso = 'Não achei o branch principal (main, master, develop, trunk): só o que não foi commitado conta como alterado.';
  }
  let hasHead = true;
  try { git(root, ['rev-parse', '--verify', 'HEAD']); } catch { hasHead = false; }
  const out = new Set();
  if (base) zlines(git(root, ['diff', '--name-only', '-z', '--relative', `${base}...HEAD`])).forEach((f) => out.add(f));
  if (hasHead) zlines(git(root, ['diff', '--name-only', '-z', '--relative', 'HEAD'])).forEach((f) => out.add(f));
  zlines(git(root, ['ls-files', '--others', '--exclude-standard', '-z'])).forEach((f) => out.add(f));
  // Monorepo: --relative esconde o package.json/lockfile da raiz do repositório. Só os
  // transversais de lá entram, com o caminho a partir da raiz do repositório.
  const raizRepo = [];
  if (resolve(top) !== resolve(root)) {
    const all = new Set();
    if (base) zlines(git(root, ['diff', '--name-only', '-z', `${base}...HEAD`])).forEach((f) => all.add(f));
    if (hasHead) zlines(git(root, ['diff', '--name-only', '-z', 'HEAD'])).forEach((f) => all.add(f));
    const prefix = posix.relative(top.split('\\').join('/'), resolve(root).split('\\').join('/'));
    for (const f of all) if (!f.startsWith(`${prefix}/`) && isTransversalName(f)) raizRepo.push(f);
  }
  // .qa/ é a saída do próprio Pudim, não mudança do produto.
  return { base: base || null, aviso, alterados: [...out].filter((f) => !f.startsWith('.qa/')).sort(), raizRepo };
}

export function readMap(root) {
  const file = join(root, '.qa', 'areas.json');
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return { erro: 'não é um JSON válido' }; }
}

export function affected(root, alterados, { e2eDir = null, mapa = readMap(root), raizRepo = [] } = {}) {
  const files = listFiles(root);
  const readCache = new Map();
  const deps = readDeps(root);
  const inE2e = (f) => !e2eDir || f === e2eDir || f.startsWith(`${e2eDir}/`);
  const specsAll = files.filter((f) => isSpec(f) && inE2e(f)).sort();
  const specSet = new Set(specsAll);
  const resolveSpec = makeResolver(root, files, alterados);
  const importers = importGraph(root, files, alterados, { readCache, resolveSpec });
  const rotasInfo = analyze(root, e2eDir, { files, readCache, deps });
  const rotas = rotasInfo.rotas;
  const routerFiles = new Set(rotas.filter((r) => r.origem === 'router').map((r) => r.arquivo));
  // Tela de cada rota: a página (Next/SvelteKit) ou o componente importado pelo arquivo de rotas (React/Vue Router).
  for (const r of rotas) r.tela = r.origem === 'router' ? (r.importa ? resolveSpec(r.arquivo, r.importa) : null) : r.arquivo;
  // Índices para não percorrer todas as rotas a cada arquivo alcançado.
  const rotasPorArquivo = new Map();
  for (const r of rotas) { if (!r.tela) continue; if (!rotasPorArquivo.has(r.tela)) rotasPorArquivo.set(r.tela, []); rotasPorArquivo.get(r.tela).push(r); }
  const rotasPorLayout = new Map();
  const rotasSob = (dir) => {
    if (!rotasPorLayout.has(dir)) rotasPorLayout.set(dir, rotas.filter((r) => r.tela && r.tela.startsWith(`${dir}/`)));
    return rotasPorLayout.get(dir);
  };
  const specTokens = new Map(specsAll.map((s) => [s, tokens(e2eDir ? s.slice(e2eDir.length + 1) : s)]));
  const areas = mapa && mapa.areas && typeof mapa.areas === 'object' ? mapa.areas : {};
  const globsInvalidos = [];
  for (const a of Object.values(areas)) {
    for (const g of [...(a?.arquivos || []), ...(a?.specs || [])]) if (globToRegex(String(g).replace(/^\.\//, '')) === null) globsInvalidos.push(g);
  }

  const escolhidos = new Map();
  const add = (spec, tipo, origem, detalhe) => {
    if (!specSet.has(spec)) return false;
    if (!escolhidos.has(spec)) escolhidos.set(spec, []);
    const ms = escolhidos.get(spec);
    if (!ms.some((m) => m.tipo === tipo && m.origem === origem)) ms.push({ tipo, origem, detalhe });
    return true;
  };
  const transversal = [];
  const semEfeito = [];
  const areasTocadas = new Set();
  for (const f of raizRepo) transversal.push({ arquivo: f, motivo: `${TRANSVERSAL.find(([re]) => re.test(f))[1]} (raiz do repositório)` });

  for (const f of alterados) {
    let efeito = false;
    const t = TRANSVERSAL.find(([re]) => re.test(f));
    if (t) { transversal.push({ arquivo: f, motivo: t[1] }); efeito = true; }
    if (routerFiles.has(f)) { transversal.push({ arquivo: f, motivo: 'arquivo de rotas do app' }); efeito = true; }

    // Imports: quem depende do alterado (páginas, layouts, specs, helpers).
    const reached = reach(importers, f);
    const telas = new Set();
    for (const r of reached) {
      for (const rota of rotasPorArquivo.get(r) || []) telas.add(rota);
      const lay = r.match(LAYOUT_RE);
      if (lay) for (const rota of rotasSob(lay[1])) telas.add(rota);
    }
    for (const rota of telas) {
      for (const teste of rota.testes) {
        const arq = teste.slice(0, teste.lastIndexOf(':'));
        // goto() num Page Object: valem as specs que importam o Page Object.
        const alvos = specSet.has(arq) ? [arq] : [...reach(importers, arq)].filter((x) => specSet.has(x));
        for (const s of alvos) efeito = add(s, 'rota', f, `tela ${rota.rota} usa ${f}`) || efeito;
      }
    }
    const specsPorImport = [...reached].filter((r) => specSet.has(r));
    for (const s of specsPorImport) efeito = add(s, s === f ? 'spec' : 'helper', f, s === f ? 'o spec mudou' : `importa ${f}`) || efeito;

    if (rotas.length >= 3 && telas.size / rotas.length > 0.5 && !t) {
      transversal.push({ arquivo: f, motivo: `usado por ${telas.size} de ${rotas.length} telas` });
    }
    const helperSpecs = specsPorImport.filter((s) => s !== f).length;
    if (specsAll.length >= 3 && helperSpecs / specsAll.length > 0.5) {
      transversal.push({ arquivo: f, motivo: `importado por ${helperSpecs} de ${specsAll.length} specs` });
    }

    // Nome: a pasta do alterado tem o mesmo nome que a pasta/arquivo do spec.
    if (!isSpec(f) || !specSet.has(f)) {
      const ft = new Set(tokens(f));
      if (ft.size) {
        for (const [s, st] of specTokens) {
          const comum = st.find((x) => ft.has(x));
          if (comum) efeito = add(s, 'nome', f, `mesmo nome "${comum}"`) || efeito;
        }
      }
    }

    // Mapa de áreas: specs da área e dos vizinhos.
    for (const [nome, area] of Object.entries(areas)) {
      if (!area || !matchAny(area.arquivos, f)) continue;
      areasTocadas.add(nome);
      for (const s of specsAll) if (matchAny(area.specs, s)) efeito = add(s, 'mapa', f, `área ${nome}`) || efeito;
      for (const v of area.vizinhos || []) {
        areasTocadas.add(v);
        for (const s of specsAll) if (matchAny(areas[v]?.specs, s)) efeito = add(s, 'mapa', f, `vizinho de ${nome}: ${v}`) || efeito;
      }
    }
    if (!efeito) semEfeito.push(f);
  }

  const specs = [...escolhidos].map(([arquivo, motivos]) => ({ arquivo, motivos })).sort((a, b) => a.arquivo.localeCompare(b.arquivo));
  return {
    alterados,
    specs,
    semEfeito,
    transversal: { sim: transversal.length > 0, motivos: transversal },
    totalSpecs: specsAll.length,
    selecionados: specs.length,
    areas: [...areasTocadas].sort(),
    mapa: mapa ? (mapa.erro ? `.qa/areas.json ${mapa.erro}` : '.qa/areas.json') : null,
    globsInvalidos,
    e2eDir: e2eDir || null,
    truncado: Boolean(files.truncado),
  };
}

// Rascunho do .qa/areas.json: uma área por primeiro nível de rota com nome próprio.
export function suggestMap(root, e2eDir = null) {
  const files = listFiles(root);
  const inE2e = (f) => !e2eDir || f === e2eDir || f.startsWith(`${e2eDir}/`);
  const specsAll = files.filter((f) => isSpec(f) && inE2e(f));
  const nomes = new Map();
  for (const r of analyze(root, e2eDir, { files }).rotas) {
    const seg = r.rota.split('/').filter(Boolean)[0];
    if (seg && !/^[[:]/.test(seg) && !GENERIC.has(norm(seg))) nomes.set(norm(seg), seg);
  }
  for (const s of specsAll) {
    const seg = (e2eDir ? s.slice(e2eDir.length + 1) : s).split('/')[0].replace(/\.(test|spec)\..*$/, '');
    if (!GENERIC.has(norm(seg)) && norm(seg).length >= 3 && !nomes.has(norm(seg))) nomes.set(norm(seg), seg);
  }
  const dirs = new Set(files.filter((f) => !isSpec(f) && !inE2e(f)).flatMap((f) => {
    const segs = f.split('/');
    return segs.slice(0, -1).map((_, i) => segs.slice(0, i + 1).join('/'));
  }));
  const areas = {};
  for (const [n, nome] of [...nomes].sort((a, b) => a[1].localeCompare(b[1]))) {
    const arquivos = [...dirs].filter((d) => norm(d.split('/').pop().replace(/^\((.*)\)$/, '$1')) === n).sort().map((d) => `${d}/**`);
    const specs = specsAll.filter((s) => tokens(e2eDir ? s.slice(e2eDir.length + 1) : s).includes(n)).sort();
    if (arquivos.length || specs.length) areas[nome] = { arquivos, specs, vizinhos: [] };
  }
  return { areas };
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
  const e2eDir = opt('e2e-dir') || detectE2eDir(root);
  const json = args.includes('--json');
  const out = opt('out') ? resolve(root, opt('out')) : null;

  if (args.includes('--sugerir-mapa')) {
    const m = suggestMap(root, e2eDir);
    if (out) writeOut(out, m);
    if (json) console.log(JSON.stringify(m, null, 2));
    else {
      const ui = await import('./ui.mjs');
      console.log([...ui.cabecalho('mapa de áreas', 'rascunho de .qa/areas.json'),
        ...ui.arvore(Object.entries(m.areas).map(([n, a]) => `${ui.c.ouro(n, { bold: true })} ${ui.c.suave('·')} ${ui.plural(a.arquivos.length, 'pasta')} ${ui.c.suave('·')} ${ui.plural(a.specs.length, 'spec')}`)),
        '', ` ${ui.c.ambar('●')} Preencha "vizinhos" (ex.: pix-out → saldo) e grave em .qa/areas.json:`, '',
        JSON.stringify(m, null, 2)].join('\n'));
    }
    process.exit(0);
  }

  let base = null;
  let aviso = null;
  let alterados;
  let raizRepo = [];
  if (opt('arquivos')) {
    alterados = opt('arquivos').split(',').map((s) => s.trim().replace(/^\.\//, '')).filter(Boolean);
    if (alterados.some((f) => f.startsWith('-') || f.startsWith('/') || f.split('/').includes('..'))) {
      console.error('--arquivos aceita só caminhos relativos ao projeto, sem ".." e sem começar com "-".');
      process.exit(3);
    }
  } else {
    try { ({ base, aviso, alterados, raizRepo } = changedFiles(root, opt('base'))); } catch (e) {
      if (/--base/.test(e.message)) console.error(e.message);
      else console.error('Não consegui ler o git nesta pasta (não é um repositório ou o git falhou): passe os arquivos alterados com --arquivos=a,b');
      process.exit(3);
    }
  }
  const r = { base, aviso, ...affected(root, alterados, { e2eDir, raizRepo }) };
  if (out) writeOut(out, r);
  if (json) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const ui = await import('./ui.mjs');
    const { c } = ui;
    const L = [...ui.cabecalho('E2E afetados', `${ui.plural(r.alterados.length, 'arquivo alterado', 'arquivos alterados')}${r.base ? ` desde ${r.base.slice(0, 7)}` : ''}`)];
    L.push(ui.linhaBarra('A rodar', r.totalSpecs ? (r.selecionados / r.totalSpecs) * 100 : 0,
      { valor: `${r.selecionados} de ${r.totalSpecs}`, extra: c.suave(r.selecionados < r.totalSpecs ? `${r.totalSpecs - r.selecionados} ficam de fora` : 'todos'), tom: 'ambar' }));
    if (r.areas.length) L.push(` 🎯 Área ${c.ouro(r.areas.join(', '), { bold: true })}`);
    L.push(ui.regua());
    const ICONE = { spec: '📝', helper: '🧩', rota: '🧭', nome: '🏷️ ', mapa: '🗺️ ' };
    const col = Math.min(40, Math.max(10, ...r.specs.map((s) => ui.width(s.arquivo))));
    if (r.specs.length) {
      // Um motivo por tipo; "(+N)" quando o mesmo tipo veio de mais de um arquivo alterado.
      const motivos = (ms) => [...new Set(ms.map((m) => m.tipo))].map((t) => {
        const doTipo = ms.filter((m) => m.tipo === t);
        return `${ICONE[t] || '•'} ${c.suave(doTipo[0].detalhe)}${doTipo.length > 1 ? c.suave(` (+${doTipo.length - 1})`) : ''}`;
      }).join(c.suave('  ·  '));
      L.push(ui.titulo('▶️ ', 'Specs a rodar'), ...ui.arvore(r.specs.map((s) => `${ui.padEnd(c.ouro(s.arquivo), col)}  ${motivos(s.motivos)}`)));
    } else L.push(` ${c.suave('Nenhum spec E2E ligado ao que mudou.')}`);
    if (r.semEfeito.length) L.push('', ` ${c.suave('○ Sem spec ligado:')} ${r.semEfeito.join(', ')}`);
    if (r.transversal.sim) {
      L.push('', ` ${c.aviso('⚠️  Mudança transversal', { bold: true })} ${c.suave('(a suíte completa pode valer a pena)')}`);
      L.push(...ui.arvore(r.transversal.motivos.map((m) => `${c.ouro(m.arquivo)} ${c.suave('·')} ${m.motivo}`)));
    }
    if (r.aviso) L.push('', ` ${ui.alerta(r.aviso)}`);
    if (r.globsInvalidos.length) L.push('', ` ${ui.alerta(`Padrões inválidos em .qa/areas.json, ignorados: ${r.globsInvalidos.join(', ')}`)}`);
    if (!r.mapa) L.push('', ` ${c.ambar('●')} Sem .qa/areas.json: vizinhos de negócio (ex.: pix-out → saldo) não entram. Rode com --sugerir-mapa.`);
    if (r.truncado) L.push('', ` ${ui.alerta('Varredura cortada (sem git): a seleção pode estar incompleta')}`);
    console.log(L.join('\n'));
  }
}
