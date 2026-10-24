#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Relatório de qualidade. Junta o que os comandos guardaram em .qa/ e gera
// HTML visual (abre sozinho), Markdown e comentário para Jira. Todo número vem dos JSONs
// das ferramentas (Jest/Vitest/Playwright/coverage-diff/test-quality/e2e-rotas).
//   node relatorio.mjs [--root=.] [--saida=.qa/relatorios] [--agora=<ISO>] [--json]
// Lê (só o que existir):
//   .qa/execucoes/*-cobertura/      summary.json, comparativo.json
//   .qa/execucoes/*-criar-unitario/ comparativo.json, qualidade.json, resultado.json, resumo.md
//   .qa/execucoes/*-criar-e2e/      rotas-antes.json, rotas-depois.json, resultado.json, qualidade.json
//   .qa/portal/execucoes/*.json     execuções do portal
//   .qa/investigacoes/*.md          investigações (/pudim:investigar)
// Status: BLOQUEADO > NECESSITA ATENÇÃO > CONFORME ESPERADO (SEM DADOS se .qa/ estiver vazia).
// Exit: 0 ok · 3 pasta do projeto não existe
// =============================================================================
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport } from './portal/playwright-report.mjs';
import { globToRegex } from './e2e-afetados.mjs';

const DIAS_INVESTIGACAO = 14; // investigação de "Bug no produto" bloqueia por este número de dias (padrão; .qa/config.json muda)
const PORTAL_ULTIMAS = 10;    // execuções do portal lidas por completo (cada uma pode ter 512 KB de log)

// .qa/config.json: { "ignorar": ["**/*.stories.*"], "bloqueiaDias": 14 }
export function readConfig(root) {
  const cfg = readJson(join(root, '.qa', 'config.json')) || {};
  return {
    ignorar: Array.isArray(cfg.ignorar) ? cfg.ignorar.map(String) : [],
    bloqueiaDias: Number.isFinite(cfg.bloqueiaDias) && cfg.bloqueiaDias >= 0 ? cfg.bloqueiaDias : DIAS_INVESTIGACAO,
  };
}
const ignorado = (cfg, arquivo) => cfg.ignorar.some((g) => globToRegex(g)?.test(arquivo));

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const readText = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const ls = (p) => { try { return readdirSync(p).sort(); } catch { return []; } };
export const pct = (n) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '—');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "2026-10-18-1530-cobertura" ou "2026-10-18-185638" → Date
function stampDate(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})?/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) : null;
}
const fmtDate = (d) => (d ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

function git(root, ...a) {
  const r = spawnSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// Resultado de Jest ou Vitest (--json / reporter json): mesmas chaves.
function unitResult(j) {
  if (!j || typeof j.numTotalTests !== 'number') return null;
  return { total: j.numTotalTests, passou: j.numPassedTests, falhou: j.numFailedTests, pulou: (j.numPendingTests || 0) + (j.numTodoTests || 0) };
}

function relFile(file, root) {
  const r = relative(root, file);
  if (!r.startsWith('..')) return r;
  const i = file.search(/\/(src|app|lib|pages|components|server|api|utils|services)\//);
  return i >= 0 ? file.slice(i + 1) : file;
}

export function collect(root, agora = new Date()) {
  const qa = join(root, '.qa');
  const pkg = readJson(join(root, 'package.json')) || {};
  const dados = {
    projeto: pkg.name || root.split('/').pop(),
    branch: git(root, 'rev-parse', '--abbrev-ref', 'HEAD'),
    commit: git(root, 'rev-parse', '--short', 'HEAD'),
    geradoEm: agora.toISOString(),
    cobertura: null, coberturaFoco: null, tendencia: [], unitario: null, e2eCriacao: null, portal: null, e2e: null,
    investigacoes: [], evidencias: [], possiveisBugs: [],
  };
  const cfg = readConfig(root);
  dados.config = cfg;
  const execs = ls(join(qa, 'execucoes'));
  const ev = (p) => { if (existsSync(join(root, p))) dados.evidencias.push(p); };

  // Cobertura: última medição + tendência
  // Cobertura atual = a medição mais recente, do /pudim:cobertura ou do "depois" do /pudim:criar-unitario.
  // Medição com foco numa pasta (-cobertura-foco) nunca vale como cobertura do projeto.
  let referenciaOficial = null;
  const cobExecs = [];
  for (const d of execs.filter((x) => x.endsWith('-cobertura') || x.endsWith('-criar-unitario'))) {
    const daCriacao = d.endsWith('-criar-unitario');
    const comp = readJson(join(qa, 'execucoes', d, 'comparativo.json'));
    const summaryFile = daCriacao ? 'depois.json' : 'summary.json';
    // Só a última medição precisa da lista de arquivos; as anteriores entram só na tendência,
    // e o summary (pode ter centenas de KB) só é lido quando o comparativo não traz o total.
    const summary = comp?.total ? null : readJson(join(qa, 'execucoes', d, summaryFile));
    const total = comp?.total || summary?.total;
    if (!total) continue;
    cobExecs.push({ d, daCriacao, comp, summaryFile, summary, total });
    if (!daCriacao) dados.tendencia.push({ quando: stampDate(d)?.toISOString() || d, linhas: total.lines?.pct, origem: 'cobertura' });
    // No criar-unitario o comparativo é "depois × antes"; a referência oficial continua a do /pudim:cobertura.
    if (!daCriacao && comp?.hasBaseline) referenciaOficial = comp.baselineTotal;
  }
  const ult = cobExecs[cobExecs.length - 1];
  if (ult) {
    const { d, daCriacao, comp, summaryFile, total } = ult;
    const summary = ult.summary || readJson(join(qa, 'execucoes', d, summaryFile));
    const arquivos = (summary
      ? Object.entries(summary).filter(([k]) => k !== 'total').map(([f, v]) => ({ arquivo: relFile(f, root), linhas: v.lines?.pct ?? 0, branches: v.branches?.pct ?? 0 }))
      : (comp?.worst || []).map((w) => ({ arquivo: w.file, linhas: w.lines, branches: w.branches })))
      .filter((a) => !ignorado(cfg, a.arquivo));
    arquivos.sort((a, b) => a.linhas - b.linhas || a.arquivo.localeCompare(b.arquivo));
    const ignorados = cfg.ignorar.length && summary ? Object.keys(summary).filter((k) => k !== 'total' && ignorado(cfg, relFile(k, root))).length : 0;
    dados.cobertura = {
      execucao: d, origem: daCriacao ? 'criar-unitario' : 'cobertura', arquivoFonte: summary ? summaryFile : 'comparativo.json',
      quando: stampDate(d)?.toISOString(), total,
      referencia: referenciaOficial,
      regressoes: comp?.regressions ?? 0,
      // Com lista de arquivos, as contagens respeitam o `ignorar` da config; sem ela, valem as do comparativo.
      arquivosZero: summary ? arquivos.filter((a) => a.linhas === 0).length : (comp?.filesZero ?? 0),
      arquivosTotal: summary ? arquivos.length : (comp?.filesTotal ?? arquivos.length),
      arquivosCompletos: summary ? arquivos.filter((a) => a.linhas === 100).length : (comp?.filesFull ?? 0),
      ignorados,
      // Testes unitários que rodaram na medição (resultado.json gravado pelo runner): falha aqui bloqueia.
      execucaoTestes: daCriacao ? null : unitResult(readJson(join(qa, 'execucoes', d, 'resultado.json'))),
      arquivos,
    };
  }
  if (dados.cobertura) ev(`.qa/execucoes/${dados.cobertura.execucao}/${dados.cobertura.arquivoFonte}`);
  const foco = execs.filter((x) => x.endsWith('-cobertura-foco')).pop();
  if (foco) {
    const comp = readJson(join(qa, 'execucoes', foco, 'comparativo.json'));
    const alvo = readText(join(qa, 'execucoes', foco, 'foco.txt'));
    if (comp?.total) dados.coberturaFoco = { execucao: foco, quando: stampDate(foco)?.toISOString(), total: comp.total, alvo: alvo ? alvo.trim() : null };
  }

  // Criação de testes unitários (última)
  const un = execs.filter((x) => x.endsWith('-criar-unitario')).pop();
  if (un) {
    const base = join(qa, 'execucoes', un);
    const comp = readJson(join(base, 'comparativo.json'));
    const q = readJson(join(base, 'qualidade.json'));
    dados.unitario = {
      execucao: un, quando: stampDate(un)?.toISOString(),
      antes: comp?.baselineTotal?.lines?.pct ?? null, depois: comp?.total?.lines?.pct ?? null,
      execucaoTestes: unitResult(readJson(join(base, 'resultado.json'))),
      qualidade: q ? { total: q.total, aprovados: q.aprovados, recusados: q.recusados, porMotivo: q.porMotivo || {} } : null,
      arquivosTeste: (q?.arquivos || []).map((a) => relFile(a.arquivo, root)),
    };
    if (comp?.total) dados.tendencia.push({ quando: dados.unitario.quando || un, linhas: comp.total.lines?.pct, origem: 'criar-unitario' });
    ['resumo.md', 'comparativo.json', 'qualidade.json', 'possiveis-bugs.md'].forEach((f) => ev(`.qa/execucoes/${un}/${f}`));
  }

  // Criação de testes E2E (última)
  const e2 = execs.filter((x) => x.endsWith('-criar-e2e')).pop();
  if (e2) {
    const base = join(qa, 'execucoes', e2);
    const antes = readJson(join(base, 'rotas-antes.json'));
    const depois = readJson(join(base, 'rotas-depois.json'));
    const res = readJson(join(base, 'resultado.json'));
    const q = readJson(join(base, 'qualidade.json'));
    const sel = readJson(join(base, 'selecao.json'));
    const parsed = res ? parseReport(res, root) : null;
    // resultado-ambiente.json = a execução falhou por ambiente (app fora do ar); não é falha de teste.
    const ambiente = !res && existsSync(join(base, 'resultado-ambiente.json'));
    dados.e2eCriacao = {
      execucao: e2, quando: stampDate(e2)?.toISOString(),
      rotasAntes: antes ? { cobertas: antes.cobertas, total: antes.total, percentual: antes.percentual } : null,
      rotasDepois: depois ? { cobertas: depois.cobertas, total: depois.total, percentual: depois.percentual } : null,
      rotas: (depois || antes)?.rotas || [],
      resultado: parsed ? { resumo: parsed.resumo, falhas: parsed.testes.filter((t) => t.status === 'falhou' || t.status === 'instavel') } : null,
      qualidade: q ? { total: q.total, aprovados: q.aprovados, recusados: q.recusados, porMotivo: q.porMotivo || {} } : null,
      selecao: sel?.totalSpecs ? { selecionados: sel.selecionados, totalSpecs: sel.totalSpecs, areas: sel.areas || [] } : null,
      ambiente,
    };
    ['resultado.json', 'rotas-depois.json', 'possiveis-bugs.md'].forEach((f) => ev(`.qa/execucoes/${e2}/${f}`));
  }

  // Possíveis bugs encontrados ao criar testes (um "## título" por bug), de todas as execuções:
  // um bug não some só porque houve uma rodada nova. Some quando o bloco ganha "Resolvido: sim".
  const vistos = new Set();
  for (const d of execs.filter((x) => x.endsWith('-criar-unitario') || x.endsWith('-criar-e2e')).reverse()) {
    const t = readText(join(qa, 'execucoes', d, 'possiveis-bugs.md'));
    if (!t) continue;
    for (const bloco of t.split(/^(?=##\s)/m)) {
      const m = bloco.match(/^##\s+(.+)$/m);
      if (!m) continue;
      const titulo = m[1].trim();
      const chave = titulo.toLowerCase();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const resolvido = /^\s*Resolvid[oa]:\s*(sim|yes|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/im.test(bloco);
      if (resolvido) { dados.possiveisBugsResolvidos = (dados.possiveisBugsResolvidos || 0) + 1; continue; }
      dados.possiveisBugs.push({ titulo, arquivo: `.qa/execucoes/${d}/possiveis-bugs.md`, execucao: d });
    }
  }
  dados.possiveisBugs.reverse();

  // Portal (últimas execuções)
  const runs = ls(join(qa, 'portal', 'execucoes')).filter((f) => f.endsWith('.json')).slice(-PORTAL_ULTIMAS);
  if (runs.length) {
    const hist = runs.map((f) => readJson(join(qa, 'portal', 'execucoes', f))).filter((r) => r && r.resumo);
    const last = hist[hist.length - 1];
    if (last) {
      dados.portal = {
        execucao: last.execucao, quando: last.inicio, alvo: last.alvo, resumo: last.resumo, parado: last.parado, selecao: last.selecao || null,
        falhas: (last.testes || []).filter((t) => t.status === 'falhou' || t.status === 'instavel'),
        historico: hist.slice(-10).map((r) => ({ quando: r.inicio, ...r.resumo })),
      };
      ev(`.qa/portal/execucoes/${last.execucao}.json`);
    }
  }
  // Última execução E2E que vale para o status: a mais recente entre portal e criar-e2e.
  const cands = [];
  if (dados.portal) cands.push({ fonte: 'portal', quando: dados.portal.quando, resumo: dados.portal.resumo, falhas: dados.portal.falhas, selecao: dados.portal.selecao });
  if (dados.e2eCriacao?.resultado) cands.push({ fonte: 'criar-e2e', quando: dados.e2eCriacao.quando, ...dados.e2eCriacao.resultado, selecao: dados.e2eCriacao.selecao });
  dados.e2e = cands.sort((a, b) => String(a.quando).localeCompare(String(b.quando))).pop() || null;

  // Investigações
  for (const f of ls(join(qa, 'investigacoes')).filter((x) => x.endsWith('.md'))) {
    const t = readText(join(qa, 'investigacoes', f)) || '';
    const linha = (re) => (t.match(re) || [])[1]?.trim() || null;
    const quando = stampDate(f);
    // "Resolvido: sim" (ou "Resolvido: <data>") tira a investigação do bloqueio.
    const resolvido = /^\s*Resolvid[oa]:\s*(sim|yes|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/im.test(t);
    dados.investigacoes.push({
      arquivo: `.qa/investigacoes/${f}`,
      quando: quando?.toISOString() || null,
      titulo: linha(/^\s*T[íi]tulo:\s*(.+)$/m) || linha(/^\s*O que aconteceu:\s*(.+)$/m) || f.replace(/\.md$/, ''),
      classificacao: linha(/classifica[çc][ãa]o:\s*\**([^*\n—]+?)\**\s*$/im) || 'Não informada',
      frequencia: linha(/^\s*Frequ[êe]ncia:\s*(.+)$/m),
      resolvido,
      recente: !resolvido && quando ? (agora - quando) / 86400000 <= cfg.bloqueiaDias : false,
    });
    ev(`.qa/investigacoes/${f}`);
  }
  dados.investigacoes.reverse();
  dados.tendencia.sort((a, b) => String(a.quando).localeCompare(String(b.quando)));
  return dados;
}

export function status(d) {
  const bloq = [];
  const aten = [];
  if (d.e2e?.resumo?.falhou) bloq.push(`E2E: falhou em ${d.e2e.resumo.falhou} de ${d.e2e.resumo.total - d.e2e.resumo.naoRodou} na última execução (${d.e2e.fonte})`);
  const ut = d.cobertura?.execucaoTestes;
  if (ut?.falhou) bloq.push(`Testes unitários: ${ut.falhou} de ${ut.total} falharam na medição de cobertura`);
  const dias = d.config?.bloqueiaDias ?? DIAS_INVESTIGACAO;
  const bugs = d.investigacoes.filter((i) => /bug no produto/i.test(i.classificacao) && i.recente);
  if (bugs.length) bloq.push(`${bugs.length} investigação(ões) com Bug no produto nos últimos ${dias} dias`);
  if (d.e2eCriacao?.ambiente) aten.push('E2E: as specs novas não puderam rodar por problema de ambiente (app fora do ar); rode de novo com o app no ar');
  if (d.possiveisBugs.length) aten.push(`${d.possiveisBugs.length} possível(is) bug(s) no produto encontrado(s) ao criar testes; confirme com /pudim:investigar`);
  if (d.cobertura?.regressoes) aten.push(`Cobertura caiu em ${d.cobertura.regressoes} arquivo(s) em relação à referência`);
  if (d.e2e?.resumo?.instavel) aten.push(`E2E: ${d.e2e.resumo.instavel} teste(s) instável(is) na última execução`);
  if (d.cobertura?.arquivosZero) aten.push(`${d.cobertura.arquivosZero} de ${d.cobertura.arquivosTotal} arquivos sem nenhum teste (0% das linhas)`);
  const rec = (d.unitario?.qualidade?.recusados || 0) + (d.e2eCriacao?.qualidade?.recusados || 0);
  if (rec) aten.push(`${rec} teste(s) recusado(s) pelo filtro de teste falso`);
  const temDados = d.possiveisBugs.length || d.cobertura || d.unitario || d.e2eCriacao || d.portal || d.investigacoes.length;
  if (!temDados) return { status: 'SEM DADOS', motivos: ['Nenhuma medição em .qa/. Rode /pudim:cobertura, /pudim:portal ou /pudim:investigar antes.'] };
  // E2E seletiva (só a área que mudou) não é a suíte completa: o status fica marcado como parcial.
  const sel = d.e2e?.selecao;
  const parcial = Boolean(sel && sel.selecionados < sel.totalSpecs);
  const notaParcial = parcial ? [`E2E seletiva: ${sel.selecionados} de ${sel.totalSpecs} arquivos de teste rodaram (só a área que mudou); a suíte completa não rodou`] : [];
  if (bloq.length) return { status: 'BLOQUEADO', parcial, motivos: [...bloq, ...aten, ...notaParcial] };
  if (aten.length) return { status: 'NECESSITA ATENÇÃO', parcial, motivos: [...aten, ...notaParcial] };
  return { status: 'CONFORME ESPERADO', parcial, motivos: parcial ? notaParcial : ['Nenhum bloqueio ou ponto de atenção nas medições disponíveis.'] };
}

// ── Saídas ──────────────────────────────────────────────────────────────────
const ICON = { 'BLOQUEADO': '⛔', 'NECESSITA ATENÇÃO': '⚠️', 'CONFORME ESPERADO': '✅', 'SEM DADOS': '•' };

function linhasResumo(d) {
  const out = [];
  const c = d.cobertura;
  if (c) out.push(`Cobertura (linhas): ${pct(c.total.lines?.pct)}% · branches ${pct(c.total.branches?.pct)}% · funções ${pct(c.total.functions?.pct)}%` +
    (c.referencia ? ` (referência: ${pct(c.referencia.lines?.pct)}%)` : ''));
  if (c) out.push(`Arquivos: ${c.arquivosTotal} no total, ${c.arquivosCompletos} com 100%, ${c.arquivosZero} sem nenhum teste`);
  if (d.e2e) {
    const r = d.e2e.resumo;
    out.push(`E2E (última execução, ${d.e2e.fonte}): ${r.passou} de ${r.total - r.naoRodou} passaram (falharam: ${r.falhou}, instáveis: ${r.instavel}, pulados: ${r.pulou})`);
    const s = d.e2e.selecao;
    if (s) out.push(`Execução seletiva: ${s.selecionados} de ${s.totalSpecs} arquivos de teste E2E${s.areas?.length ? ` (área: ${s.areas.join(', ')})` : ''}, não é a suíte completa`);
  }
  const rd = d.e2eCriacao?.rotasDepois;
  if (rd) out.push(`Rotas com teste E2E: ${rd.cobertas} de ${rd.total} (${pct(rd.percentual)}%)`);
  if (d.unitario) {
    const u = d.unitario;
    const ex = u.execucaoTestes;
    out.push(`Testes unitários criados: cobertura ${pct(u.antes)}% → ${pct(u.depois)}%` + (ex ? `; ${ex.passou} de ${ex.total} passaram` : ''));
  }
  const q = [d.unitario?.qualidade, d.e2eCriacao?.qualidade].filter(Boolean);
  if (q.length) out.push(`Filtro de teste falso: ${q.reduce((n, x) => n + x.recusados, 0)} recusado(s) de ${q.reduce((n, x) => n + x.total, 0)}`);
  if (d.investigacoes.length) {
    const b = d.investigacoes.filter((i) => /bug no produto/i.test(i.classificacao)).length;
    out.push(`Investigações: ${d.investigacoes.length} (Bug no produto: ${b})`);
  }
  return out;
}

export function toMarkdown(d, st, htmlPath) {
  const L = [];
  L.push(`# 🍮 Relatório de qualidade — ${d.projeto}`, '');
  L.push(`${d.branch ? `Branch \`${d.branch}\`` : ''}${d.commit ? ` @ \`${d.commit}\`` : ''} · gerado em ${fmtDate(new Date(d.geradoEm))}`, '');
  L.push(`## ${ICON[st.status]} ${st.status}${st.parcial ? ' (parcial)' : ''}`, '');
  st.motivos.forEach((m) => L.push(`- ${m}`));
  L.push('', '## Números', '');
  linhasResumo(d).forEach((l) => L.push(`- ${l}`));
  if (d.cobertura?.arquivos.length) {
    L.push('', '## Arquivos com menos cobertura', '', '| Arquivo | Linhas | Branches |', '|---|---:|---:|');
    d.cobertura.arquivos.slice(0, 15).forEach((a) => L.push(`| ${a.arquivo} | ${pct(a.linhas)}% | ${pct(a.branches)}% |`));
  }
  if (d.e2e?.falhas?.length) {
    L.push('', '## Falhas E2E', '');
    d.e2e.falhas.forEach((t) => L.push(`- **${t.status === 'instavel' ? 'Instável' : 'Falhou'}** · ${[...(t.describe || []), t.titulo].join(' › ')} (\`${t.alvo}\`)${t.trace ? ` · trace: \`npx playwright show-trace ${t.trace}\`` : ''}`));
  }
  if (d.e2eCriacao?.rotas.length) {
    L.push('', '## Rotas', '');
    d.e2eCriacao.rotas.forEach((r) => L.push(`- ${r.coberta ? '✔' : '✘'} \`${r.rota}\``));
  }
  if (d.possiveisBugs.length) {
    L.push('', '## Possíveis bugs no produto', '');
    d.possiveisBugs.forEach((b) => L.push(`- ${b.titulo} (\`${b.arquivo}\`)`));
  }
  if (d.investigacoes.length) {
    L.push('', '## Investigações', '', '| Quando | Assunto | Classificação | Frequência |', '|---|---|---|---|');
    d.investigacoes.forEach((i) => L.push(`| ${fmtDate(i.quando && new Date(i.quando))} | ${i.titulo} | ${i.classificacao} | ${i.frequencia || '—'} |`));
  }
  L.push('', '## Evidências', '');
  d.evidencias.forEach((e) => L.push(`- \`${e}\``));
  if (htmlPath) L.push(`- Relatório visual: \`${htmlPath}\``);
  L.push('', '_Gerado pelo Pudim. Todo número acima foi lido dos arquivos de resultado das ferramentas, não estimado._', '');
  return L.join('\n');
}

export function toJira(d, st, htmlPath) {
  const L = [`*🍮 Pudim · Relatório de qualidade* — ${d.projeto}${d.branch ? ` (${d.branch}${d.commit ? ` @ ${d.commit}` : ''})` : ''} — ${fmtDate(new Date(d.geradoEm))}`, ''];
  L.push(`*Status: ${ICON[st.status]} ${st.status}${st.parcial ? ' (parcial: E2E só da área que mudou)' : ''}*`);
  st.motivos.forEach((m) => L.push(`- ${m}`));
  L.push('');
  linhasResumo(d).forEach((l) => L.push(`- ${l}`));
  if (d.e2e?.falhas?.length) {
    L.push('', '*Falhas E2E:*');
    d.e2e.falhas.forEach((t) => L.push(`- ${[...(t.describe || []), t.titulo].join(' › ')} (${t.alvo})`));
  }
  L.push('', `Evidências: ${htmlPath || '.qa/relatorios/'}`);
  return L.join('\n');
}

function barsHtml(arquivos) {
  const tone = (p) => (p === 0 ? 'zero' : p < 50 ? 'low' : p < 80 ? 'mid' : 'high');
  return `<div class="bars" role="list" aria-label="Cobertura de linhas por arquivo">${arquivos.slice(0, 15).map((a) => `
    <div class="bar" role="listitem"><code class="bar-file" title="${esc(a.arquivo)}">${esc(a.arquivo)}</code>
    <span class="bar-track"><span class="bar-fill ${tone(a.linhas)}" style="width:${Math.max(a.linhas, 1)}%"></span></span>
    <b class="bar-val">${pct(a.linhas)}%</b></div>`).join('')}</div>`;
}

function trendSvg(pts) {
  const vals = pts.filter((p) => typeof p.linhas === 'number');
  if (vals.length < 2) return '';
  const w = 640; const h = 120; const pad = 24;
  const x = (i) => pad + (i * (w - 2 * pad)) / (vals.length - 1);
  const y = (v) => h - pad - (v / 100) * (h - 2 * pad);
  const path = vals.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.linhas).toFixed(1)}`).join(' ');
  return `<svg class="trend" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tendência da cobertura de linhas">
    <line x1="${pad}" x2="${w - pad}" y1="${y(0)}" y2="${y(0)}" class="axis"/><line x1="${pad}" x2="${w - pad}" y1="${y(100)}" y2="${y(100)}" class="axis dashed"/>
    <path d="${path}" class="line"/>${vals.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.linhas).toFixed(1)}" r="4" class="pt"/><text x="${x(i).toFixed(1)}" y="${(y(p.linhas) - 9).toFixed(1)}" text-anchor="middle" class="val">${pct(p.linhas)}%</text>`).join('')}</svg>`;
}

export function toHtml(d, st) {
  const cls = { 'BLOQUEADO': 'bloq', 'NECESSITA ATENÇÃO': 'aten', 'CONFORME ESPERADO': 'ok', 'SEM DADOS': 'none' }[st.status];
  // Tudo que entra num card vem de JSON em .qa/ (que pode ter sido plantado no repositório): sempre escapado.
  const card = (valor, rotulo, sub = '', tom = '') => `<div class="card${tom ? ` t-${esc(tom)}` : ''}"><b>${esc(valor)}</b><span>${esc(rotulo)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const cards = [];
  const c = d.cobertura;
  if (c) {
    const delta = c.referencia ? c.total.lines.pct - c.referencia.lines.pct : null;
    cards.push(card(`${pct(c.total.lines?.pct)}%`, 'cobertura de linhas', c.referencia ? `referência ${pct(c.referencia.lines?.pct)}% (${delta >= 0 ? '+' : ''}${pct(delta)} pontos)` : 'primeira medição', c.regressoes ? 'warn' : ''));
    cards.push(card(`${pct(c.total.branches?.pct)}%`, 'branches', `funções ${pct(c.total.functions?.pct)}%`));
    cards.push(card(`${c.arquivosZero} de ${c.arquivosTotal}`, 'arquivos sem teste', `${c.arquivosCompletos} com 100%`, c.arquivosZero ? 'warn' : ''));
  }
  if (d.e2e) {
    const r = d.e2e.resumo; const rodaram = r.total - r.naoRodou;
    const s = d.e2e.selecao;
    cards.push(card(`${r.passou} de ${rodaram}`, s ? `E2E passaram (seletiva: ${s.selecionados} de ${s.totalSpecs} arquivos)` : 'E2E passaram', `falharam: ${r.falhou} · instáveis: ${r.instavel} · pulados: ${r.pulou}`, r.falhou ? 'fail' : r.instavel ? 'warn' : 'good'));
  }
  const rd = d.e2eCriacao?.rotasDepois; const ra = d.e2eCriacao?.rotasAntes;
  if (rd) cards.push(card(`${rd.cobertas} de ${rd.total}`, 'rotas com teste E2E', ra ? `antes: ${ra.cobertas} de ${ra.total}` : `${pct(rd.percentual)}%`));
  if (d.unitario) {
    const u = d.unitario;
    cards.push(card(`${pct(u.antes)}% → ${pct(u.depois)}%`, 'cobertura com os testes criados', u.execucaoTestes ? `${u.execucaoTestes.passou} de ${u.execucaoTestes.total} testes passaram` : ''));
  }
  const q = [d.unitario?.qualidade, d.e2eCriacao?.qualidade].filter(Boolean);
  if (q.length) {
    const rec = q.reduce((n, x) => n + x.recusados, 0); const tot = q.reduce((n, x) => n + x.total, 0);
    cards.push(card(`${rec} de ${tot}`, 'recusados pelo filtro de teste falso', '', rec ? 'warn' : 'good'));
  }
  if (d.investigacoes.length) {
    const b = d.investigacoes.filter((i) => /bug no produto/i.test(i.classificacao)).length;
    cards.push(card(String(d.investigacoes.length), 'investigações', `${b} com Bug no produto`, b ? 'fail' : ''));
  }

  const sec = [];
  if (c?.arquivos.length) sec.push(`<section><h2>Cobertura por arquivo <small>(os ${Math.min(15, c.arquivos.length)} menos cobertos de ${c.arquivosTotal})</small></h2>${barsHtml(c.arquivos)}</section>`);
  const tr = trendSvg(d.tendencia);
  if (tr) sec.push(`<section><h2>Tendência da cobertura de linhas</h2>${tr}</section>`);
  if (d.e2e) {
    const fal = d.e2e.falhas || [];
    sec.push(`<section><h2>Última execução E2E <small>${esc(d.e2e.fonte)} · ${esc(fmtDate(d.e2e.quando && new Date(d.e2e.quando)))}</small></h2>${fal.length ? fal.map((t) => `
      <div class="fail ${t.status}"><h3>${t.status === 'instavel' ? '⚠ Instável' : '✘ Falhou'} · ${esc([...(t.describe || []), t.titulo].join(' › '))}</h3>
      <div class="muted">${esc(t.alvo)}${t.projeto ? ` · ${esc(t.projeto)}` : ''}</div>${t.erro ? `<pre>${esc(t.erro.split('\n').slice(0, 12).join('\n'))}</pre>` : ''}
      ${t.trace ? `<div class="muted">Trace: <code>npx playwright show-trace ${esc(t.trace)}</code></div>` : ''}</div>`).join('') : '<p class="good-text">Nenhuma falha.</p>'}</section>`);
  }
  if (d.e2eCriacao?.rotas.length) {
    sec.push(`<section><h2>Rotas do app</h2><ul class="routes">${d.e2eCriacao.rotas.map((r) => `<li class="${r.coberta ? 'yes' : 'no'}">${r.coberta ? '✔' : '✘'} <code>${esc(r.rota)}</code>${r.coberta ? ` <span class="muted">${esc(r.testes[0])}</span>` : ' <span class="muted">sem teste E2E</span>'}</li>`).join('')}</ul></section>`);
  }
  if (d.possiveisBugs.length) {
    sec.push(`<section><h2>Possíveis bugs no produto <small>(encontrados ao criar testes, ainda sem investigação)</small></h2><ul class="ev">${d.possiveisBugs.map((b) => `<li>⚠ ${esc(b.titulo)} <span class="muted">${esc(b.arquivo)}</span></li>`).join('')}</ul></section>`);
  }
  if (d.investigacoes.length) {
    sec.push(`<section><h2>Investigações</h2><div class="table-wrap"><table><thead><tr><th>Quando</th><th>Assunto</th><th>Classificação</th><th>Frequência</th></tr></thead><tbody>${d.investigacoes.map((i) => `
      <tr><td>${esc(fmtDate(i.quando && new Date(i.quando)))}</td><td>${esc(i.titulo)}</td><td><span class="tag ${/bug no produto/i.test(i.classificacao) ? 'fail' : ''}">${esc(i.classificacao)}</span></td><td>${esc(i.frequencia || '—')}</td></tr>`).join('')}</tbody></table></div></section>`);
  }
  sec.push(`<section><h2>Evidências</h2><ul class="ev">${d.evidencias.map((e) => `<li><code>${esc(e)}</code></li>`).join('') || '<li class="muted">Nenhuma.</li>'}</ul></section>`);

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de qualidade — ${esc(d.projeto)}</title>
<style>
:root{color-scheme:dark;--bg:#14100b;--bg2:#1d1710;--bg3:#2a2116;--bd:rgba(240,168,48,.18);--tx:#f3e9d8;--mu:#a8977f;--pr:#f0a830;--gold:#f6d28b;--car:#c8741a;--ok:#7bc47f;--fail:#e0614b;--warn:#e08a2e;--mid:#f0c060;--track:#2a2116}
@media print{:root{color-scheme:light;--bg:#fff;--bg2:#fff;--bg3:#f7efe2;--bd:#e8dcc8;--tx:#2a1f12;--mu:#7a6a55;--pr:#c8741a;--gold:#8a5a12;--car:#c8741a;--ok:#2f7a3a;--fail:#b8412c;--warn:#c26a12;--mid:#b8892a;--track:#efe5d3}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.55 system-ui,-apple-system,'Segoe UI',Inter,Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:28px 18px 48px}code,pre{font-family:ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:18px}
header{border-bottom:2px solid var(--car);padding-bottom:12px}header h1{margin:0;font-size:24px;color:var(--gold)}header .meta{color:var(--mu);font-size:13px;font-family:ui-monospace,Menlo,monospace}
.status{border-radius:14px;padding:18px 22px;margin-bottom:20px;border:1px solid var(--bd);background:var(--bg2)}
.status h2{margin:0 0 6px;font-size:22px}.status ul{margin:0;padding-left:20px}
.status.bloq{border-left:6px solid var(--fail)}.status.bloq h2{color:var(--fail)}
.status.aten{border-left:6px solid var(--warn)}.status.aten h2{color:var(--warn)}
.status.ok{border-left:6px solid var(--ok)}.status.ok h2{color:var(--ok)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:22px}
.card{background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:2px}
.card b{font-size:24px;font-family:ui-monospace,Menlo,monospace}.card span{color:var(--mu)}.card small{color:var(--mu);font-size:12px}
.card.t-fail b{color:var(--fail)}.card.t-warn b{color:var(--warn)}.card.t-good b{color:var(--ok)}
section{background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:16px 18px;margin-bottom:16px}
section h2{font-size:15px;margin:0 0 12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mu)}section h2 small{text-transform:none;letter-spacing:0;font-weight:400}
svg{width:100%;height:auto}svg .val{font:600 12px ui-monospace,Menlo,monospace;fill:var(--tx)}
svg .axis{stroke:var(--bd)}svg .dashed{stroke-dasharray:4 4}svg .line{fill:none;stroke:var(--pr);stroke-width:2.5}svg .pt{fill:var(--pr)}
.fail{border-left:3px solid var(--fail);background:var(--bg3);border-radius:8px;padding:10px 12px;margin-bottom:10px}.fail.instavel{border-left-color:var(--warn)}
.fail h3{margin:0 0 2px;font-size:14px}pre{white-space:pre-wrap;font-size:12px;margin:8px 0;max-height:220px;overflow:auto}
.muted{color:var(--mu);font-size:13px}.good-text{color:var(--ok);margin:0}
.routes,.ev{list-style:none;margin:0;padding:0}.routes li,.ev li{padding:3px 0}.routes .yes{color:var(--ok)}.routes .no{color:var(--fail)}.routes .muted{color:var(--mu)}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--bd);vertical-align:top}th{color:var(--mu);font-weight:600}
.tag{background:var(--bg3);border-radius:6px;padding:1px 8px;font-size:12px}.tag.fail{color:var(--fail);border:0;margin:0;padding:1px 8px}
.bars{display:flex;flex-direction:column;gap:8px}.bar{display:grid;grid-template-columns:minmax(0,1.3fr) 1fr 72px;gap:12px;align-items:center}
.bar-file{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left}.bar-track{height:12px;background:var(--track);border-radius:4px;overflow:hidden}
.bar-fill{display:block;height:100%;border-radius:4px}.bar-fill.zero{background:var(--fail)}.bar-fill.low{background:var(--warn)}.bar-fill.mid{background:var(--mid)}.bar-fill.high{background:var(--ok)}
.bar-val{font:600 13px ui-monospace,Menlo,monospace;text-align:right}.table-wrap{overflow-x:auto}
@media (max-width:560px){.bar{grid-template-columns:1fr 64px}.bar-file{grid-column:1/-1}}
footer{color:var(--mu);font-size:12px;text-align:center;margin-top:24px}
@media print{body{background:#fff;color:#000}header{border-bottom-color:var(--car)}section,.card,.status{break-inside:avoid}}
</style></head><body><main>
<header><div><div class="meta">🍮 Pudim · relatório de qualidade</div><h1>${esc(d.projeto)}</h1></div>
<div class="meta">${d.branch ? `${esc(d.branch)}${d.commit ? ` @ ${esc(d.commit)}` : ''} · ` : ''}${esc(fmtDate(new Date(d.geradoEm)))}</div></header>
<div class="status ${cls}"><h2>${ICON[st.status]} ${esc(st.status)}${st.parcial ? ' <small>(parcial)</small>' : ''}</h2><ul>${st.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
${cards.length ? `<div class="cards">${cards.join('')}</div>` : ''}
${sec.join('\n')}
<footer>Gerado pelo Pudim. Todo número deste relatório foi lido dos arquivos de resultado das ferramentas (Jest, Vitest, Playwright e scripts do Pudim), não estimado.</footer>
</main></body></html>`;
}

export function generate(root, saida, agora = new Date()) {
  const d = collect(root, agora);
  const st = status(d);
  mkdirSync(saida, { recursive: true });
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}-${p(agora.getHours())}${p(agora.getMinutes())}`;
  const rel = (f) => { const r = relative(root, f); return r && !r.startsWith('..') ? r : f; };
  const html = join(saida, `${stamp}.html`);
  const md = join(saida, `${stamp}.md`);
  const jira = join(saida, `${stamp}-jira.txt`);
  writeFileSync(html, toHtml(d, st));
  writeFileSync(md, toMarkdown(d, st, rel(html)));
  writeFileSync(jira, toJira(d, st, rel(html)));
  copyFileSync(html, join(saida, 'ultimo.html'));
  copyFileSync(md, join(saida, 'ultimo.md'));
  return {
    status: st.status, motivos: st.motivos, numeros: linhasResumo(d),
    arquivos: { html: rel(html), md: rel(md), jira: rel(jira), ultimo: rel(join(saida, 'ultimo.html')) },
    fontes: d.evidencias.length,
  };
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
  const agora = opt('agora') ? new Date(opt('agora')) : new Date();
  const r = generate(root, resolve(root, opt('saida') || '.qa/relatorios'), agora);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    // painel.mjs importa este módulo: carregado depois, sem await no topo, para não travar o ciclo.
    Promise.all([import('./painel.mjs'), import('./ui.mjs')]).then(([{ painelRelatorio }, { c, regua }]) => {
      const d = collect(root, agora);
      console.log(painelRelatorio(d, status(d)).join('\n'));
      console.log(regua());
      console.log(` 📄 ${c.ouro(r.arquivos.html)}`);
      console.log(JSON.stringify(r));
    });
  }
}
