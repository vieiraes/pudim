#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Lê o JSON do Playwright (lista ou execução) e devolve números exatos.
//   node playwright-report.mjs <arquivo.json> [--root=<projeto>] [--lista]
// Saída: JSON { testes: [...], resumo: { total, passou, falhou, instavel, pulou, naoRodou } }
// Exit: 0 ok · 3 arquivo ausente ou JSON inválido
// Também é importado pelo server.mjs (parseReport, parseList, stripAnsi).
// =============================================================================
import { readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|[\x00-\x08\x0b-\x1f\x7f]/g; // CSI, OSC e controle
export const stripAnsi = (s) => String(s ?? '').replace(ANSI, '');

const toPosix = (p) => p.split(sep).join('/');

// Caminho do arquivo de teste relativo à raiz do projeto (é o que vai na linha de comando).
function fileFromSuite(report, file, root) {
  const base = report?.config?.rootDir || root;
  const abs = isAbsolute(file) ? file : join(base, file);
  return toPosix(relative(root, abs));
}

function relPath(p, root) {
  if (!p) return null;
  const r = relative(root, p);
  return toPosix(r.startsWith('..') ? p : r);
}

// Percorre suites aninhadas: arquivo → describe → spec.
function walk(suite, trail, out, ctx) {
  const file = suite.file ? fileFromSuite(ctx.report, suite.file, ctx.root) : trail.file;
  // A suite de primeiro nível é o arquivo; o título dela não entra no caminho do describe.
  const describes = trail.depth === 0 ? [] : [...trail.describes, suite.title].filter(Boolean);
  for (const spec of suite.specs || []) out.push({ spec, file, describes });
  for (const child of suite.suites || []) walk(child, { file, describes, depth: trail.depth + 1 }, out, ctx);
}

// Status final de um teste (spec × projeto), no vocabulário do Pudim.
function statusOf(test) {
  const results = test.results || [];
  if (results.length === 0) return 'nao_rodou';
  if (test.status === 'flaky') return 'instavel';
  if (test.status === 'skipped') return 'pulou';
  if (test.status === 'unexpected') return 'falhou';
  if (test.status === 'expected') return 'passou';
  return 'nao_rodou';
}

function attachment(results, name, root) {
  for (let i = results.length - 1; i >= 0; i--) {
    const a = (results[i].attachments || []).find((x) => x.name === name && x.path);
    if (a) return relPath(a.path, root);
  }
  return null;
}

function flatten(report, root) {
  const specs = [];
  for (const s of report.suites || []) walk(s, { file: null, describes: [], depth: 0 }, specs, { report, root });
  const testes = [];
  for (const { spec, file, describes } of specs) {
    const tests = spec.tests && spec.tests.length ? spec.tests : [{ projectName: '', results: [] }];
    for (const t of tests) {
      const results = t.results || [];
      const last = results[results.length - 1];
      const err = last?.error || (last?.errors || [])[0];
      testes.push({
        id: spec.id,
        projeto: t.projectName || '',
        arquivo: file,
        linha: spec.line,
        alvo: `${file}:${spec.line}`,
        describe: describes,
        titulo: spec.title,
        status: statusOf(t),
        tentativas: results.length,
        duracaoMs: results.reduce((acc, r) => acc + (r.duration || 0), 0),
        erro: err ? stripAnsi(err.message || err.value || '').slice(0, 4000) : null,
        trace: attachment(results, 'trace', root),
        screenshot: attachment(results, 'screenshot', root),
      });
    }
  }
  return testes;
}

export function summarize(testes) {
  const r = { total: testes.length, passou: 0, falhou: 0, instavel: 0, pulou: 0, naoRodou: 0 };
  for (const t of testes) {
    if (t.status === 'passou') r.passou++;
    else if (t.status === 'falhou') r.falhou++;
    else if (t.status === 'instavel') r.instavel++;
    else if (t.status === 'pulou') r.pulou++;
    else r.naoRodou++;
  }
  return r;
}

// Resultado de uma execução (--reporter=json).
export function parseReport(report, root) {
  const testes = flatten(report, resolve(root));
  const erros = (report.errors || []).map((e) => stripAnsi(e.message || e.value || '').slice(0, 4000));
  return { testes, resumo: summarize(testes), erros };
}

// Lista de testes (--list --reporter=json): agrupa por arquivo, sem status.
export function parseList(report, root) {
  const testes = flatten(report, resolve(root));
  const porArquivo = new Map();
  for (const t of testes) {
    if (!porArquivo.has(t.arquivo)) porArquivo.set(t.arquivo, new Map());
    const specs = porArquivo.get(t.arquivo);
    if (!specs.has(t.id)) specs.set(t.id, { id: t.id, alvo: t.alvo, linha: t.linha, describe: t.describe, titulo: t.titulo, projetos: [] });
    if (t.projeto) specs.get(t.id).projetos.push(t.projeto);
  }
  const arquivos = [...porArquivo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([arquivo, specs]) => ({ arquivo, testes: [...specs.values()].sort((a, b) => a.linha - b.linha) }));
  return { arquivos, totalTestes: arquivos.reduce((n, a) => n + a.testes.length, 0), totalArquivos: arquivos.length };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const root = (args.find((a) => a.startsWith('--root=')) || '--root=.').slice(7);
  let report;
  try {
    report = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Não consegui ler o relatório do Playwright: ${file || '(nenhum arquivo)'} (${e.message})`);
    process.exit(3);
  }
  const out = args.includes('--lista') ? parseList(report, root) : parseReport(report, root);
  console.log(JSON.stringify(out, null, 2));
}
