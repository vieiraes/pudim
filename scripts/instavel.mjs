#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Testes instáveis a partir do histórico: o que ora passa, ora falha, sem rodar nada.
//   node instavel.mjs [--root=.] [--ultimas=50] [--json] [--out=<arquivo.json>]
// Lê as execuções E2E já gravadas (portal: .qa/portal/execucoes/*.json; criar-e2e:
//   .qa/execucoes/*-criar-e2e/resultado.json) e, por teste, conta em quantas rodadas passou,
//   falhou ou precisou de repetição. Também traz a duração de cada rodada da suíte.
// Classificação por teste: "instavel" (passou e falhou no histórico, ou passou só na repetição),
//   "sempre_falha", "sempre_passa". Instável vem primeiro.
// Saída: JSON { execucoes, testes[{alvo,titulo,rodadas,passou,falhou,repeticoes,taxaFalha,classe,ultimo}], duracoes[], aviso }
// Exit: 0 ok · 3 pasta do projeto não existe
// =============================================================================
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport } from './portal/playwright-report.mjs';
import { writeOut } from './e2e-rotas.mjs';

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

// Todas as rodadas E2E gravadas, da mais antiga para a mais nova: { quando, fonte, testes[], duracaoMs }.
export function runs(root, ultimas = 50) {
  const out = [];
  const portal = join(root, '.qa', 'portal', 'execucoes');
  let files = [];
  try { files = readdirSync(portal).filter((f) => f.endsWith('.json')).sort().slice(-ultimas); } catch { /* sem portal */ }
  for (const f of files) {
    const r = readJson(join(portal, f));
    if (!r || !Array.isArray(r.testes)) continue;
    const dur = r.inicio && r.fim ? new Date(r.fim) - new Date(r.inicio) : null;
    out.push({ quando: r.inicio || f, fonte: 'portal', testes: r.testes, duracaoMs: dur, parcial: Boolean(r.alvo), parado: Boolean(r.parado) });
  }
  const execs = join(root, '.qa', 'execucoes');
  let dirs = [];
  try { dirs = readdirSync(execs).filter((d) => d.endsWith('-criar-e2e')).sort().slice(-ultimas); } catch { /* sem execuções */ }
  for (const d of dirs) {
    const j = readJson(join(execs, d, 'resultado.json'));
    if (!j) continue;
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
    const quando = m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).toISOString() : d;
    out.push({ quando, fonte: 'criar-e2e', testes: parseReport(j, root).testes, duracaoMs: null, parcial: true, parado: false });
  }
  return out.sort((a, b) => String(a.quando).localeCompare(String(b.quando)));
}

export function flaky(root, { ultimas = 50 } = {}) {
  const execucoes = runs(root, ultimas);
  const porTeste = new Map();
  for (const run of execucoes) {
    for (const t of run.testes) {
      if (t.status === 'nao_rodou' || t.status === 'pulou') continue;
      const chave = `${t.alvo}|${t.projeto || ''}`;
      if (!porTeste.has(chave)) porTeste.set(chave, { alvo: t.alvo, projeto: t.projeto || null, titulo: [...(t.describe || []), t.titulo].join(' › '), rodadas: 0, passou: 0, falhou: 0, repeticoes: 0, ultimo: null, ultimoQuando: null });
      const x = porTeste.get(chave);
      x.rodadas++;
      if (t.status === 'passou') x.passou++;
      else if (t.status === 'falhou') x.falhou++;
      else if (t.status === 'instavel') { x.passou++; x.repeticoes++; }
      x.ultimo = t.status;
      x.ultimoQuando = run.quando;
    }
  }
  const testes = [...porTeste.values()].map((x) => {
    const classe = x.repeticoes || (x.passou && x.falhou) ? 'instavel' : x.falhou ? 'sempre_falha' : 'sempre_passa';
    return { ...x, taxaFalha: x.rodadas ? Math.round(((x.falhou + x.repeticoes) / x.rodadas) * 10000) / 100 : 0, classe };
  });
  const ordem = { instavel: 0, sempre_falha: 1, sempre_passa: 2 };
  testes.sort((a, b) => ordem[a.classe] - ordem[b.classe] || b.taxaFalha - a.taxaFalha || a.alvo.localeCompare(b.alvo));
  const duracoes = execucoes.filter((r) => r.duracaoMs != null && !r.parado).map((r) => ({ quando: r.quando, duracaoMs: r.duracaoMs, parcial: r.parcial, testes: r.testes.filter((t) => t.status !== 'nao_rodou').length }));
  return {
    execucoes: execucoes.length,
    testes,
    instaveis: testes.filter((t) => t.classe === 'instavel').length,
    sempreFalham: testes.filter((t) => t.classe === 'sempre_falha').length,
    duracoes,
    aviso: execucoes.length < 3 ? `Só ${execucoes.length} execução(ões) gravada(s): com menos de 3 rodadas não dá para separar instabilidade de falha real.` : null,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) { console.error(`Pasta não encontrada: ${root}`); process.exit(3); }
  const r = flaky(root, { ultimas: Number(opt('ultimas')) || 50 });
  if (opt('out')) writeOut(resolve(root, opt('out')), r);
  if (args.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  const ui = await import('./ui.mjs');
  const { c } = ui;
  const fmtMs = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);
  const L = [...ui.cabecalho('testes instáveis', `${ui.plural(r.execucoes, 'execução E2E gravada', 'execuções E2E gravadas')}`)];
  if (!r.testes.length) L.push(` ${c.suave('Nenhuma execução E2E em .qa/ ainda. Rode pelo /qa:portal ou /qa:criar-e2e.')}`);
  else {
    L.push(` ${r.instaveis ? c.aviso(`⚠️  ${ui.plural(r.instaveis, 'teste instável', 'testes instáveis')}`) : ui.ok('nenhum teste instável')} ${c.suave('·')} ${r.sempreFalham ? c.falha(`${r.sempreFalham} sempre falham`) : c.bom('0 sempre falham')} ${c.suave('·')} ${c.ouro(r.testes.length)} testes no histórico`);
    const mostrar = r.testes.filter((t) => t.classe !== 'sempre_passa').slice(0, 15);
    if (mostrar.length) {
      L.push(ui.regua(), ui.titulo('🎲', 'Instáveis e falhas, piores primeiro'));
      L.push(...ui.arvore(mostrar.map((t) => `${t.classe === 'instavel' ? c.aviso('⚠️ ') : ui.erro()} ${ui.padEnd(ui.limpo(t.titulo).slice(0, 48), 48)} ${c.suave(t.alvo)}${t.projeto ? c.suave(` [${t.projeto}]`) : ''}  ${c.ouro(`${t.falhou + t.repeticoes} de ${t.rodadas}`)} ${c.suave(`(${ui.pct(t.taxaFalha)} de falha)`)}`)));
    }
  }
  if (r.duracoes.length >= 2) {
    const ult = r.duracoes[r.duracoes.length - 1];
    const ant = r.duracoes[r.duracoes.length - 2];
    L.push(ui.regua(), ` ⏱️  Última rodada: ${c.ouro(fmtMs(ult.duracaoMs))} ${c.suave(`(${ult.testes} testes${ult.parcial ? ', seletiva' : ''})`)}  ${ui.delta(+((ult.duracaoMs - ant.duracaoMs) / 1000).toFixed(2), { sufixo: ' s' })} ${c.suave('vs. anterior')}`);
  }
  if (r.aviso) L.push('', ` ${ui.alerta(r.aviso)}`);
  console.log(L.join('\n'));
}
