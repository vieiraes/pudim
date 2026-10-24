#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Diff de cobertura contra a baseline (Node puro, sem dependências).
//
// Lê o relatório Istanbul `json-summary` (Jest, Vitest ou c8: coverage/coverage-summary.json)
// e compara com .qa/coverage/baseline.json, arquivo por arquivo.
//
// Uso:
//   node scripts/coverage-diff.mjs [summary] [baseline] [opções]
//     --root=<dir>            raiz para relativizar os caminhos (padrão: cwd)
//     --tolerance=<pct>       queda de linhas tolerada por arquivo (padrão: 0)
//     --provider=<nome>       provider atual (babel|v8|istanbul); comparado com baseline.meta.json
//     --meta=<arquivo>        caminho do meta da baseline (padrão: <baseline> com .meta.json)
//     --json                  imprime só o JSON final
//     --top=<n>               quantos arquivos menos cobertos listar em "worst" (padrão: 10)
//   node scripts/coverage-diff.mjs --save-baseline [summary] [baseline] \
//     --runner=<jest|vitest> --provider=<p> --command="<comando usado>"
//
// Exit: 0 ok | 1 regressão acima da tolerância | 2 baseline incompatível (provider) |
//       3 arquivo ausente/inválido.
// =============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve, isAbsolute } from 'node:path';
import { execSync } from 'node:child_process';
import { arvore, bar, c, cabecalho, delta, erro, linhaBarra, padEnd, pct, plural, regua, titulo, width } from './ui.mjs';

const args = process.argv.slice(2);
const opts = {};
const positional = [];
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, ...rest] = a.slice(2).split('=');
    opts[k] = rest.length ? rest.join('=') : true;
  } else positional.push(a);
}

const summaryPath = positional[0] || 'coverage/coverage-summary.json';
const baselinePath = positional[1] || '.qa/coverage/baseline.json';
const metaPath = opts.meta || baselinePath.replace(/\.json$/, '.meta.json');
const root = resolve(opts.root || process.cwd());
const tolerance = Number(opts.tolerance || 0);
const onlyJson = Boolean(opts.json);
const top = Number(opts.top || 10);

function fail(msg, code) {
  console.error(`✘ ${msg}`);
  process.exit(code);
}

function loadJson(p, what) {
  if (!existsSync(p)) fail(`${what} não encontrado: ${p}`, 3);
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { fail(`${what} inválido (${p}): ${e.message}`, 3); }
}

const rel = (k) => {
  if (k === 'total') return k;
  if (!isAbsolute(k)) return k;
  const r = relative(root, k);
  return r.startsWith('..') ? k : r;
};

// Normaliza: chaves relativas à raiz; mantém só as 4 métricas.
function normalize(summary) {
  const out = {};
  for (const [k, v] of Object.entries(summary)) {
    if (!v || typeof v !== 'object' || !v.lines) continue;
    out[rel(k)] = {
      lines: v.lines, statements: v.statements, functions: v.functions, branches: v.branches,
    };
  }
  return out;
}

function gitCommit(cwd) {
  try { return execSync('git rev-parse --short HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; }
}

// --- modo: gravar baseline -----------------------------------------------------
if (opts['save-baseline']) {
  const summary = normalize(loadJson(summaryPath, 'coverage-summary'));
  if (!summary.total) fail(`coverage-summary sem chave "total": ${summaryPath}`, 3);
  mkdirSync(dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, JSON.stringify(summary, null, 2) + '\n');
  const meta = {
    runner: opts.runner || null,
    provider: opts.provider || null,
    command: opts.command || null,
    commit: gitCommit(root),
    date: new Date().toISOString(),
    root: root,
    files: Object.keys(summary).length - 1,
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(JSON.stringify({ saved: baselinePath, meta: metaPath, total: summary.total, files: meta.files }));
  process.exit(0);
}

// --- modo: diff ---------------------------------------------------------------
const cur = normalize(loadJson(summaryPath, 'coverage-summary'));
if (!cur.total) fail(`coverage-summary sem chave "total": ${summaryPath}`, 3);

let base = {};
let meta = null;
const hasBaseline = existsSync(baselinePath);
if (hasBaseline) {
  base = normalize(loadJson(baselinePath, 'baseline'));
  if (existsSync(metaPath)) meta = loadJson(metaPath, 'baseline.meta');
}

if (meta && opts.provider && meta.provider && meta.provider !== opts.provider) {
  fail(`baseline incompatível: foi gerada com provider "${meta.provider}" e a execução atual usa "${opts.provider}". ` +
       `Branches e linhas não são comparáveis entre providers. Regere a baseline com --save-baseline ou use o mesmo provider.`, 2);
}

const rows = [];
let regressions = 0;
let newFiles = 0;
const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(2);

for (const [file, m] of Object.entries(cur)) {
  if (file === 'total') continue;
  const b = base[file];
  const curLines = m.lines.pct, curBranches = m.branches.pct;
  let deltaLines = null, deltaBranches = null, status = 'novo';
  if (b) {
    deltaLines = +(curLines - b.lines.pct).toFixed(2);
    deltaBranches = +(curBranches - b.branches.pct).toFixed(2);
    if (deltaLines < -tolerance) { status = 'regressão'; regressions++; }
    else if (deltaLines > 0 || deltaBranches > 0) status = 'melhorou';
    else status = 'igual';
  } else newFiles++;
  rows.push({ file, lines: curLines, branches: curBranches, deltaLines, deltaBranches, status });
}

const removed = Object.keys(base).filter((f) => f !== 'total' && !cur[f]);

const worst = rows
  .filter((r) => r.lines < 100)
  .sort((a, b) => a.lines - b.lines || a.branches - b.branches)
  .slice(0, top)
  .map((r) => ({ file: r.file, lines: r.lines, branches: r.branches }));

if (!onlyJson) {
  const t = cur.total, bt = base.total;
  const dl = (k) => (bt ? delta(+(t[k].pct - bt[k].pct).toFixed(2)) : '');
  const L = ['', ...cabecalho('cobertura', hasBaseline ? 'atual × referência' : 'sem referência')];
  if (meta) L.push(` ${c.suave(`referência: ${meta.runner || '?'} · ${meta.provider || '?'} · commit ${meta.commit || '?'} · ${meta.date || '?'}`)}`);
  L.push(linhaBarra('Linhas', t.lines.pct, { extra: dl('lines') }));
  L.push(linhaBarra('Branches', t.branches.pct, { extra: dl('branches') }));
  L.push(linhaBarra('Funções', t.functions.pct, { extra: dl('functions') }));
  L.push(regua());
  L.push(` 📊 ${plural(rows.length, 'arquivo')} ${c.suave('·')} regressões ${regressions ? c.falha(regressions, { bold: true }) : c.bom(0)} ${c.suave(`(tolerância ${tolerance}%)`)} ${c.suave('·')} novos ${c.ouro(newFiles)} ${c.suave('·')} removidos ${c.ouro(removed.length)}`);
  const MARK = { 'regressão': erro(), melhorou: c.bom('▲'), novo: c.ambar('✚'), igual: c.suave('━') };
  const col = Math.min(40, Math.max(10, ...rows.map((r) => width(r.file)), ...removed.map((f) => width(f))));
  const itens = rows.map((r) => {
    const d = r.deltaLines == null ? c.ambar('novo') : `${padEnd(delta(r.deltaLines), 9)}${c.suave('linhas')}  ${padEnd(delta(r.deltaBranches), 9)}${c.suave('branches')}`;
    return `${MARK[r.status]} ${padEnd(r.file, col)}  ${bar(r.lines, { largura: 10 })} ${padEnd(c.ouro(pct(r.lines)), 7)}  ${d}`;
  });
  for (const f of removed) itens.push(`${c.suave('－')} ${padEnd(f, col)}  ${c.suave('estava na referência, não está mais no relatório')}`);
  if (itens.length) L.push('', titulo('📂', 'Por arquivo'), ...arvore(itens));
  if (worst.length) {
    L.push('', titulo('📉', 'Menos cobertos'));
    L.push(...arvore(worst.map((w) => `${padEnd(w.file, col)}  ${bar(w.lines, { largura: 10 })} ${c.ouro(pct(w.lines))}  ${c.suave(`branches ${pct(w.branches)}`)}`)));
  }
  console.log(`${L.join('\n')}\n`);
}

const finalJson = {
  total: cur.total,
  baselineTotal: base.total || null,
  deltaLines: base.total ? +(cur.total.lines.pct - base.total.lines.pct).toFixed(2) : null,
  regressions, newFiles, removed: removed.length, tolerance, hasBaseline,
  filesTotal: rows.length, filesFull: rows.filter((r) => r.lines === 100).length, filesZero: rows.filter((r) => r.lines === 0).length,
  worst,
};
if (opts.out) { mkdirSync(dirname(resolve(opts.out)), { recursive: true }); writeFileSync(resolve(opts.out), JSON.stringify(finalJson, null, 2)); }
console.log(JSON.stringify(finalJson));

process.exit(regressions > 0 ? 1 : 0);
