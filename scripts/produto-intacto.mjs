#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Prova de que o código do produto não mudou: foto (hash) dos arquivos antes e depois.
//   node produto-intacto.mjs --foto=<arquivo.json> [--root=.]          grava a foto do estado atual
//   node produto-intacto.mjs --comparar=<foto.json> [--root=.] [--json] compara o estado atual com a foto
// Arquivo de produto = tudo que o git conhece ou não ignora, menos testes (*.test.*, *.spec.*,
// __tests__/, __mocks__/, a pasta de E2E), .qa/ e arquivos de configuração de teste.
// Saída da comparação: { intacto, alterados[], removidos[], novosDeProduto[], totalProduto }
// Exit: 0 intacto · 1 produto alterado · 3 pasta/foto ausente
// =============================================================================
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectE2eDir, listFiles } from './e2e-rotas.mjs';

const TEST_RE = /(^|\/)(__tests__|__mocks__|__snapshots__)\/|\.(test|spec)\.[cm]?[jt]sx?$|\.snap$|(^|\/)(jest|vitest|playwright)\.config\.[cm]?[jt]s$|(^|\/)jest\.setup\.[cm]?[jt]s$/;

export function productFiles(root, e2eDir = detectE2eDir(root)) {
  const inE2e = (f) => e2eDir && (f === e2eDir || f.startsWith(`${e2eDir}/`));
  return listFiles(root).filter((f) => !f.startsWith('.qa/') && !TEST_RE.test(f) && !inE2e(f));
}

export function snapshot(root) {
  const hashes = {};
  for (const f of productFiles(root)) {
    try { hashes[f] = createHash('sha256').update(readFileSync(join(root, f))).digest('hex'); } catch { /* removido no meio */ }
  }
  return { quando: new Date().toISOString(), total: Object.keys(hashes).length, hashes };
}

export function compare(root, foto) {
  const atual = snapshot(root).hashes;
  const alterados = [];
  const removidos = [];
  for (const [f, h] of Object.entries(foto.hashes || {})) {
    if (!(f in atual)) removidos.push(f);
    else if (atual[f] !== h) alterados.push(f);
  }
  const novosDeProduto = Object.keys(atual).filter((f) => !(f in (foto.hashes || {}))).sort();
  return {
    intacto: !alterados.length && !removidos.length && !novosDeProduto.length,
    alterados: alterados.sort(), removidos: removidos.sort(), novosDeProduto,
    totalProduto: Object.keys(foto.hashes || {}).length,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`Pasta não encontrada: ${root}`);
    process.exit(3);
  }
  if (opt('foto')) {
    const file = resolve(root, opt('foto'));
    const s = snapshot(root);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(s));
    console.log(JSON.stringify({ foto: opt('foto'), totalProduto: s.total }));
    process.exit(0);
  }
  if (opt('comparar')) {
    const file = resolve(root, opt('comparar'));
    if (!existsSync(file)) { console.error(`Foto não encontrada: ${file}`); process.exit(3); }
    const r = compare(root, JSON.parse(readFileSync(file, 'utf8')));
    if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else {
      const ui = await import('./ui.mjs');
      const L = [...ui.cabecalho('produto intacto?', `${r.totalProduto} arquivos de produto`)];
      if (r.intacto) L.push(` ${ui.ok(`Nenhum arquivo do produto foi alterado, removido ou criado`)}`);
      else {
        L.push(` ${ui.erro(`Produto alterado: ${r.alterados.length} modificados, ${r.removidos.length} removidos, ${r.novosDeProduto.length} novos`)}`);
        L.push(...ui.arvore([...r.alterados.map((f) => `${ui.c.falha('~')} ${f}`), ...r.removidos.map((f) => `${ui.c.falha('−')} ${f}`), ...r.novosDeProduto.map((f) => `${ui.c.aviso('+')} ${f}`)]));
      }
      console.log(L.join('\n'));
    }
    process.exit(r.intacto ? 0 : 1);
  }
  console.error('Uso: produto-intacto.mjs --foto=<arquivo.json> | --comparar=<foto.json> [--root=.] [--json]');
  process.exit(3);
}
