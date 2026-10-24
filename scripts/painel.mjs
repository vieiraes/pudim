#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Painel do comando: o resumo visual que fecha cada /pudim:*, com barras e ícones.
//   node painel.mjs <cobertura|criar-unitario|criar-e2e|relatorio|investigar|portal> [--root=.] [--top=5]
// Lê o que os comandos gravaram em .qa/ (o mesmo coletor do relatorio.mjs): nenhum número
// é digitado à mão. Cor só em terminal (NO_COLOR desliga, FORCE_COLOR força).
// Exit: 0 ok · 2 comando desconhecido · 3 pasta do projeto não existe · 4 sem dados para o comando
// =============================================================================
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, status } from './relatorio.mjs';
import { alerta, arvore, bar, c, cabecalho, delta, erro, linhaBarra, ok, padEnd, pct, plural, regua, selo, titulo, width } from './ui.mjs';

const ratio = (n, d) => (d ? (n / d) * 100 : 0);

// Caminho longo vira "…/final/do/caminho" para caber na coluna.
function encurta(s, max) {
  if (width(s) <= max) return s;
  return `…${s.slice(s.length - max + 1)}`;
}

function listaArquivos(itens, top) {
  const sel = itens.slice(0, top);
  const col = Math.min(36, Math.max(...sel.map((a) => width(a.arquivo)), 10));
  return arvore(sel.map((a) => `${padEnd(encurta(a.arquivo, col), col)}  ${bar(a.linhas, { largura: 10 })}  ${c.ouro(pct(a.linhas))}`));
}

function sub(d) {
  return [d.projeto, d.branch].filter(Boolean).join(' · ');
}

export function painelCobertura(d, { top = 5 } = {}) {
  const cb = d.cobertura;
  if (!cb) return null;
  // Primeira medição: a referência acabou de ser gravada com os mesmos números.
  const igual = (a, b) => a && b && ['lines', 'branches', 'functions'].every((k) => a[k]?.pct === b[k]?.pct);
  const primeira = d.tendencia.filter((t) => t.origem === 'cobertura').length <= 1 && igual(cb.total, cb.referencia);
  const ref = primeira ? null : cb.referencia;
  const dl = (k) => (ref && cb.total[k] && ref[k] ? delta(+(cb.total[k].pct - ref[k].pct).toFixed(2)) : '');
  const L = [...cabecalho('cobertura', sub(d))];
  L.push(linhaBarra('Linhas', cb.total.lines?.pct, { extra: dl('lines') }));
  L.push(linhaBarra('Branches', cb.total.branches?.pct, { extra: dl('branches') }));
  L.push(linhaBarra('Funções', cb.total.functions?.pct, { extra: dl('functions') }));
  L.push(regua());
  L.push(` 📊 ${c.ouro(cb.arquivosTotal)} arquivos ${c.suave('·')} ${c.bom(cb.arquivosCompletos)} com 100% ${c.suave('·')} ${cb.arquivosZero ? c.falha(cb.arquivosZero) : c.bom(0)} sem nenhum teste${cb.ignorados ? c.suave(` · ${cb.ignorados} ignorados pela .qa/config.json`) : ''}`);
  const ex = cb.execucaoTestes;
  if (ex) L.push(linhaBarra('Testes', ex.total ? (ex.passou / ex.total) * 100 : 0, { valor: `${ex.passou} de ${ex.total}`, extra: ex.falhou ? c.falha(ex.falhou === 1 ? '1 falhou' : `${ex.falhou} falharam`) : c.bom('passaram') }));
  if (!ref) L.push(` ${c.ambar('●')} Primeira medição: virou a referência`);
  else if (cb.regressoes) L.push(` ${alerta(`Cobertura caiu em ${c.falha(plural(cb.regressoes, 'arquivo'), { bold: true })}`)}`);
  else L.push(` ${ok('Nenhum arquivo perdeu cobertura')}`);
  const fracos = cb.arquivos.filter((a) => a.linhas < 100);
  if (fracos.length) {
    L.push('', titulo('📂', 'O que mais precisa de teste'));
    L.push(...listaArquivos(fracos, top));
  }
  return L;
}

export function painelUnitario(d, { top = 5 } = {}) {
  const u = d.unitario;
  if (!u) return null;
  const L = [...cabecalho('criar-unitario', sub(d))];
  if (u.antes != null) L.push(linhaBarra('Antes', u.antes));
  if (u.depois != null) L.push(linhaBarra('Depois', u.depois, { extra: u.antes != null ? delta(+(u.depois - u.antes).toFixed(2)) : '' }));
  if (u.antes != null || u.depois != null) L.push(regua());
  const ex = u.execucaoTestes;
  if (ex) L.push(linhaBarra('Testes', ratio(ex.passou, ex.total), { valor: `${ex.passou} de ${ex.total}`, extra: ex.falhou ? c.falha(ex.falhou === 1 ? '1 falhou' : `${ex.falhou} falharam`) : c.bom('passaram') }));
  const q = u.qualidade;
  if (q) L.push(` 🛡️  Filtro de teste falso: ${q.recusados ? c.falha(q.recusados, { bold: true }) : c.bom(0)} de ${c.ouro(q.total)} ${q.total === 1 ? 'recusado' : 'recusados'}`);
  const bugs = d.possiveisBugs.filter((b) => b.arquivo.includes(u.execucao));
  L.push(` 🐞 Possíveis bugs no produto: ${bugs.length ? c.falha(bugs.length, { bold: true }) : c.bom(0)}`);
  if (u.arquivosTeste.length) {
    L.push('', titulo('📄', 'Arquivos de teste'));
    L.push(...arvore(u.arquivosTeste.slice(0, top)));
  }
  return L;
}

export function painelE2e(d) {
  const e = d.e2eCriacao;
  if (!e) return null;
  const L = [...cabecalho('criar-e2e', sub(d))];
  const ra = e.rotasAntes;
  const rd = e.rotasDepois;
  if (ra) L.push(linhaBarra('Rotas antes', ra.percentual, { valor: `${ra.cobertas} de ${ra.total}`, rotuloLargura: 13 }));
  if (rd) L.push(linhaBarra('Rotas depois', rd.percentual, { valor: `${rd.cobertas} de ${rd.total}`, rotuloLargura: 13, extra: ra ? delta(rd.cobertas - ra.cobertas, { sufixo: ' rotas' }).replace(/,00/, '') : '' }));
  if (ra || rd) L.push(regua());
  const s = e.selecao;
  if (s) L.push(` 🎯 ${s.areas?.length ? `Área ${c.ouro(s.areas.join(', '), { bold: true })} ${c.suave('·')} ` : ''}${c.ouro(s.selecionados)} de ${s.totalSpecs} arquivos de teste ${c.suave('(só o que mudou)')}`);
  const r = e.resultado?.resumo;
  if (r) {
    const rodaram = r.total - r.naoRodou;
    L.push(linhaBarra('Execução', ratio(r.passou, rodaram), { valor: `${r.passou} de ${rodaram}`, rotuloLargura: 13, extra: r.falhou ? c.falha(r.falhou === 1 ? '1 falhou' : `${r.falhou} falharam`) : r.instavel ? c.aviso(plural(r.instavel, 'instável', 'instáveis')) : c.bom('passaram') }));
  }
  const q = e.qualidade;
  if (q) L.push(` 🛡️  Filtro de teste falso: ${q.recusados ? c.falha(q.recusados, { bold: true }) : c.bom(0)} de ${c.ouro(q.total)} ${q.total === 1 ? 'recusado' : 'recusados'}`);
  const bugs = d.possiveisBugs.filter((b) => b.arquivo.includes(e.execucao));
  L.push(` 🐞 Possíveis bugs no produto: ${bugs.length ? c.falha(bugs.length, { bold: true }) : c.bom(0)}`);
  const falhas = e.resultado?.falhas || [];
  if (falhas.length) {
    L.push('', titulo('🔎', 'Falhas'));
    L.push(...arvore(falhas.map((t) => `${erro()} ${[...(t.describe || []), t.titulo].join(' › ')} ${c.suave(t.alvo)}`)));
  }
  return L;
}

export function painelPortal(d) {
  const p = d.portal;
  if (!p) return null;
  const r = p.resumo;
  const rodaram = r.total - r.naoRodou;
  const L = [...cabecalho('portal', sub(d))];
  L.push(linhaBarra('Última', ratio(r.passou, rodaram), { valor: `${r.passou} de ${rodaram}`, extra: r.falhou ? c.falha(r.falhou === 1 ? '1 falhou' : `${r.falhou} falharam`) : c.bom('passaram') }));
  if (p.selecao) L.push(` 🎯 ${c.ouro(p.selecao.selecionados)} de ${p.selecao.totalSpecs} arquivos de teste ${c.suave('(afetados)')}`);
  if (p.parado) L.push(` ${alerta('Execução parada antes do fim')}`);
  if (p.falhas.length) {
    L.push('', titulo('🔎', 'Falhas'));
    L.push(...arvore(p.falhas.map((t) => `${erro()} ${[...(t.describe || []), t.titulo].join(' › ')} ${c.suave(t.alvo)}`)));
  }
  return L;
}

const TOM_CLASSE = (cl) => (/bug no produto/i.test(cl) ? 'falha' : /inst[áa]vel|ambiente|dados/i.test(cl) ? 'aviso' : 'ambar');
export function painelInvestigar(d, { top = 5 } = {}) {
  if (!d.investigacoes.length) return null;
  const [ult, ...resto] = d.investigacoes;
  const L = [...cabecalho('investigar', sub(d))];
  L.push(` 🔎 ${c.ouro(ult.titulo, { bold: true })}`);
  L.push(` ${c.suave('Classificação')}  ${paint(TOM_CLASSE(ult.classificacao), ult.classificacao)}`);
  if (ult.frequencia) L.push(` ${c.suave('Frequência')}     ${ult.frequencia}`);
  L.push(` ${c.suave('Arquivo')}        ${ult.arquivo}`);
  if (resto.length) {
    L.push('', titulo('🗂️ ', 'Anteriores'));
    L.push(...arvore(resto.slice(0, top).map((i) => `${paint(TOM_CLASSE(i.classificacao), i.classificacao)} ${c.suave('·')} ${i.titulo}`)));
  }
  return L;
}

export function painelRelatorio(d, st) {
  const L = [...cabecalho('relatório', sub(d)), selo(st.status) + (st.parcial ? c.suave('  · parcial: E2E só da área que mudou') : '')];
  if (st.motivos.length) L.push(...arvore(st.motivos));
  L.push(regua());
  const cb = d.cobertura;
  if (cb) L.push(linhaBarra('Cobertura', cb.total.lines?.pct, { rotuloLargura: 12, extra: cb.referencia ? delta(+(cb.total.lines.pct - cb.referencia.lines.pct).toFixed(2)) : '' }));
  if (d.e2e) {
    const r = d.e2e.resumo;
    const rodaram = r.total - r.naoRodou;
    L.push(linhaBarra('E2E', ratio(r.passou, rodaram), { rotuloLargura: 12, valor: `${r.passou} de ${rodaram}`, extra: d.e2e.selecao ? c.suave(`seletiva: ${d.e2e.selecao.selecionados} de ${d.e2e.selecao.totalSpecs}`) : c.suave(d.e2e.fonte) }));
  }
  const rd = d.e2eCriacao?.rotasDepois;
  if (rd) L.push(linhaBarra('Rotas E2E', rd.percentual, { rotuloLargura: 12, valor: `${rd.cobertas} de ${rd.total}` }));
  if (d.investigacoes.length) {
    const b = d.investigacoes.filter((i) => /bug no produto/i.test(i.classificacao)).length;
    L.push(` 🔎 ${c.ouro(plural(d.investigacoes.length, 'investigação', 'investigações'))} ${c.suave('·')} Bug no produto: ${b ? c.falha(b, { bold: true }) : c.bom(0)}`);
  }
  return L;
}

const PAINEIS = {
  cobertura: painelCobertura,
  'criar-unitario': painelUnitario,
  'criar-e2e': painelE2e,
  portal: painelPortal,
  investigar: painelInvestigar,
  relatorio: painelRelatorio,
};

function paint(tom, s) { return c[tom] ? c[tom](s) : s; }

export function render(comando, root, opts = {}) {
  const fn = PAINEIS[comando];
  if (!fn) return null;
  const d = collect(root, opts.agora || new Date());
  return comando === 'relatorio' ? fn(d, status(d)) : fn(d, opts);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const comando = args.find((a) => !a.startsWith('--'));
  if (!PAINEIS[comando]) {
    console.error(`Uso: painel.mjs <${Object.keys(PAINEIS).join('|')}> [--root=.] [--top=5]`);
    process.exit(2);
  }
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`Pasta não encontrada: ${root}`);
    process.exit(3);
  }
  const linhas = render(comando, root, { top: Number(opt('top')) || 5, agora: opt('agora') ? new Date(opt('agora')) : undefined });
  if (!linhas) {
    console.error(`Ainda não há dados de /pudim:${comando} em .qa/.`);
    process.exit(4);
  }
  console.log(linhas.join('\n'));
}
