#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Cria a pasta de uma execução em .qa/execucoes/ e imprime o caminho.
//   node nova-execucao.mjs <cobertura|cobertura-foco|criar-unitario|criar-e2e> [--root=.] [--json]
// O nome leva a data e a hora reais (AAAA-MM-DD-HHMM-<comando>), para o relatório ordenar
// as execuções certo. Duas no mesmo minuto ganham sufixo -2, -3…
// Saída: o caminho relativo (texto) ou {"pasta":"...","comando":"..."} com --json.
// Exit: 0 ok · 2 comando desconhecido · 3 pasta do projeto não existe
// =============================================================================
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const COMANDOS = ['cobertura', 'cobertura-foco', 'criar-unitario', 'criar-e2e'];

export function novaExecucao(root, comando, agora = new Date()) {
  if (!COMANDOS.includes(comando)) throw new Error(`comando desconhecido: ${comando}`);
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}-${p(agora.getHours())}${p(agora.getMinutes())}`;
  let rel = `.qa/execucoes/${stamp}-${comando}`;
  for (let n = 2; existsSync(join(root, rel)); n++) rel = `.qa/execucoes/${stamp}-${n}-${comando}`;
  mkdirSync(join(root, rel), { recursive: true });
  return rel;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const comando = args.find((a) => !a.startsWith('--'));
  if (!COMANDOS.includes(comando)) {
    console.error(`Uso: nova-execucao.mjs <${COMANDOS.join('|')}> [--root=.] [--json]`);
    process.exit(2);
  }
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`Pasta não encontrada: ${root}`);
    process.exit(3);
  }
  const pasta = novaExecucao(root, comando);
  console.log(args.includes('--json') ? JSON.stringify({ pasta, comando }) : pasta);
}
