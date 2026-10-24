#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Risco: o que mais muda no git × o que tem menos cobertura. Responde "por onde começo?".
//   node risco.mjs [--root=.] [--dias=90] [--top=10] [--json] [--out=<arquivo.json>]
// Mudanças: commits dos últimos N dias que tocaram cada arquivo de produto (git log --name-only).
// Cobertura: a última medição em .qa/execucoes/*-cobertura/summary.json (ou depois.json do
//   criar-unitario). Sem medição, o ranking sai só por mudanças, com aviso.
// Risco = mudanças × (100 − cobertura) / 100. Arquivo que mudou e não entrou na medição aparece
//   como "não medido" (conta como 0% para o ranking, mas é dito).
// Saída: JSON { dias, commits, medicao, arquivos[{arquivo,mudancas,cobertura,medido,risco}], aviso }
// Exit: 0 ok · 3 pasta do projeto não existe ou sem git
// =============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeOut } from './e2e-rotas.mjs';

const CODE = /\.(?:[cm]?[jt]sx?|vue|svelte)$/;
const NOT_PRODUCT = /(^|\/)(__tests__|__mocks__|__snapshots__|e2e|tests?|node_modules|dist|build|coverage)\/|\.(test|spec)\.|\.d\.ts$|(^|\/)(jest|vitest|playwright|vite|next|tailwind|eslint|prettier)\.config\.|\.stories\.|^\.qa\//;

function git(root, args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
}

// Quantos commits tocaram cada arquivo nos últimos `dias`, com caminho relativo ao root.
export function churn(root, dias) {
  const out = git(root, ['log', `--since=${dias} days ago`, '--name-only', '--relative', '--pretty=format:%H', '--', '.']);
  const porArquivo = new Map();
  let commits = 0;
  for (const linha of out.split('\n')) {
    const l = linha.trim();
    if (!l) continue;
    if (/^[0-9a-f]{40}$/.test(l)) { commits++; continue; }
    if (!CODE.test(l) || NOT_PRODUCT.test(l)) continue;
    porArquivo.set(l, (porArquivo.get(l) || 0) + 1);
  }
  return { commits, porArquivo };
}

// Última medição de cobertura gravada pelo Pudim: { execucao, arquivos: Map(caminho → % linhas) } ou null.
export function latestCoverage(root) {
  const dir = join(root, '.qa', 'execucoes');
  let execs = [];
  try { execs = readdirSync(dir).filter((d) => d.endsWith('-cobertura') || d.endsWith('-criar-unitario')).sort(); } catch { return null; }
  for (const d of execs.reverse()) {
    const file = join(dir, d, d.endsWith('-cobertura') ? 'summary.json' : 'depois.json');
    try {
      const j = JSON.parse(readFileSync(file, 'utf8'));
      const arquivos = new Map();
      for (const [k, v] of Object.entries(j)) {
        if (k === 'total') continue;
        const rel = relative(root, k);
        arquivos.set(rel.startsWith('..') ? k.replace(/^.*?\/(src|app|lib|pages|components|server|api|utils|services)\//, '$1/') : rel, v.lines?.pct ?? 0);
      }
      return { execucao: d, arquivos };
    } catch { /* tenta a anterior */ }
  }
  return null;
}

export function risk(root, { dias = 90, top = 10 } = {}) {
  const { commits, porArquivo } = churn(root, dias);
  const cob = latestCoverage(root);
  const arquivos = [];
  for (const [arquivo, mudancas] of porArquivo) {
    if (!existsSync(join(root, arquivo))) continue; // apagado ou renomeado
    const medido = Boolean(cob && cob.arquivos.has(arquivo));
    const cobertura = medido ? cob.arquivos.get(arquivo) : null;
    const risco = Math.round(mudancas * (100 - (cobertura ?? 0))) / 100;
    arquivos.push({ arquivo, mudancas, cobertura, medido, risco });
  }
  arquivos.sort((a, b) => b.risco - a.risco || b.mudancas - a.mudancas || a.arquivo.localeCompare(b.arquivo));
  const avisos = [];
  if (!cob) avisos.push('Sem medição de cobertura em .qa/: o ranking é só por quantidade de mudanças. Rode /pudim:cobertura.');
  if (!commits) avisos.push(`Nenhum commit nos últimos ${dias} dias.`);
  return {
    dias, commits, medicao: cob ? cob.execucao : null,
    totalArquivos: arquivos.length,
    arquivos: arquivos.slice(0, top),
    aviso: avisos.length ? avisos.join(' ') : null,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) { console.error(`Pasta não encontrada: ${root}`); process.exit(3); }
  let r;
  try { r = risk(root, { dias: Number(opt('dias')) || 90, top: Number(opt('top')) || 10 }); } catch {
    console.error('Não consegui ler o git nesta pasta: o risco precisa do histórico de commits.');
    process.exit(3);
  }
  if (opt('out')) writeOut(resolve(root, opt('out')), r);
  if (args.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  const ui = await import('./ui.mjs');
  const { c } = ui;
  const quando = r.medicao ? r.medicao.replace(/^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2}).*$/, '$1 $2:$3') : null;
  const L = [...ui.cabecalho('onde testar primeiro', `${ui.plural(r.commits, 'commit')} em ${r.dias} dias${quando ? ` · cobertura de ${quando}` : ''}`)];
  if (!r.arquivos.length) L.push(` ${c.suave('Nenhum arquivo de produto mudou no período.')}`);
  else {
    const col = Math.min(44, Math.max(10, ...r.arquivos.map((a) => ui.width(a.arquivo))));
    L.push(ui.titulo('🎯', 'Mais risco primeiro (mudanças × falta de cobertura)'));
    L.push(...ui.arvore(r.arquivos.map((a) => `${ui.padEnd(c.ouro(a.arquivo), col)}  ${ui.padStart(c.ouro(a.mudancas), 3)} ${c.suave(a.mudancas === 1 ? 'mudança ' : 'mudanças')}  ${a.medido ? `${ui.bar(a.cobertura, { largura: 10 })} ${ui.padStart(ui.pct(a.cobertura), 7)}` : c.aviso('não medido'.padEnd(18))}  ${c.suave('risco')} ${c.ouro(a.risco.toFixed(2).replace('.', ','))}`)));
  }
  if (r.aviso) L.push('', ` ${ui.alerta(r.aviso)}`);
  console.log(L.join('\n'));
}
