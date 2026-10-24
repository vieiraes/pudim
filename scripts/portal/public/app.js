// 🍮 Pudim — Portal de testes (tela). Sem build, sem dependências.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMs = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2).replace('.', ',')} s`);
const fmtPct =(n, d) => (d ? ((n / d) * 100).toFixed(2).replace('.', ',') : '0,00');

const ui = { list: null, selected: null, running: null, filter: '', affected: null };
const AFETADOS = '@afetados';

// ── ANSI → HTML com estado (cor e negrito continuam entre pedaços do log) ──
const ansi = { bold: false, dim: false, color: null, pending: '' };
function ansiToHtml(chunk) {
  let text = ansi.pending + chunk;
  ansi.pending = '';
  const cut = text.lastIndexOf('\x1b');
  if (cut !== -1 && !/^\x1b\[[0-9;?]*[A-Za-z]/.test(text.slice(cut))) {
    ansi.pending = text.slice(cut);
    text = text.slice(0, cut);
  }
  let html = '';
  let last = 0;
  const re = /\x1b\[([0-9;?]*)([A-Za-z])/g;
  const span = (s) => {
    if (!s) return '';
    const cls = [ansi.bold && 'b', ansi.dim && 'd', ansi.color && `c${ansi.color}`].filter(Boolean).join(' ');
    return cls ? `<span class="${cls}">${esc(s)}</span>` : esc(s);
  };
  let m;
  while ((m = re.exec(text))) {
    html += span(text.slice(last, m.index));
    last = re.lastIndex;
    if (m[2] !== 'm') continue; // movimento de cursor e afins: ignora
    for (const code of (m[1] || '0').split(';').map(Number)) {
      if (code === 0) { ansi.bold = false; ansi.dim = false; ansi.color = null; }
      else if (code === 1) ansi.bold = true;
      else if (code === 2) ansi.dim = true;
      else if (code === 22) { ansi.bold = false; ansi.dim = false; }
      else if (code === 39) ansi.color = null;
      else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) ansi.color = code;
    }
  }
  return html + span(text.slice(last));
}
function appendLog(html) {
  const log = $('log');
  log.insertAdjacentHTML('beforeend', html);
  if ($('autoscroll').checked) log.scrollTop = log.scrollHeight;
}
const sysLine = (s) => appendLog(`<span class="sys">${esc(s)}</span>\n`);

// ── API ─────────────────────────────────────────────────────────────────────
async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.erro || `HTTP ${res.status}`), { data });
  return data;
}

// ── Lista de testes ─────────────────────────────────────────────────────────
async function loadTests(refresh = false) {
  $('side-count').textContent = 'Lendo os testes do projeto…';
  try {
    ui.list = await api(`/api/testes${refresh ? '?atualizar=1' : ''}`);
    renderTree();
  } catch (e) {
    ui.list = null;
    $('tree').innerHTML = `<p class="muted">${esc(e.message)}</p>${e.data?.detalhe ? `<pre class="log">${esc(e.data.detalhe)}</pre>` : ''}`;
    $('side-count').textContent = '';
  }
}

function renderTree() {
  const f = ui.filter.toLowerCase();
  const openFiles = new Set([...document.querySelectorAll('.file[open]')].map((d) => d.dataset.file));
  let shown = 0;
  const html = ui.list.arquivos.map((a) => {
    const tests = a.testes.filter((t) => !f || `${a.arquivo} ${t.describe.join(' ')} ${t.titulo}`.toLowerCase().includes(f));
    if (!tests.length) return '';
    shown += tests.length;
    const open = f || openFiles.has(a.arquivo) || ui.list.arquivos.length <= 3 ? ' open' : '';
    const sel = ui.selected === a.arquivo ? ' sel' : '';
    return `<details class="file" data-file="${esc(a.arquivo)}"${open}>
      <summary class="${sel.trim()}" data-alvo="${esc(a.arquivo)}"><span class="name" title="${esc(a.arquivo)}">${esc(a.arquivo)}</span><span class="n">${a.testes.length}</span></summary>
      ${tests.map((t) => {
        const st = ui.running && (ui.running.alvo === null || ui.running.alvo === a.arquivo || ui.running.alvo === t.alvo) ? 'rodando' : t.status;
        return `<div class="test${ui.selected === t.alvo ? ' sel' : ''}" data-alvo="${esc(t.alvo)}" title="${esc(statusLabel(t.status))}">
          <span class="dot ${st}"></span><span>${esc(t.titulo)}${t.describe.length ? `<span class="desc">${esc(t.describe.join(' › '))}</span>` : ''}</span></div>`;
      }).join('')}
    </details>`;
  }).join('');
  $('tree').innerHTML = html || '<p class="muted">Nenhum teste encontrado.</p>';
  const total = ui.list.totalTestes;
  $('side-count').textContent = f ? `${shown} de ${total} testes` : `${total} testes em ${ui.list.totalArquivos} arquivos`;
}

function statusLabel(s) {
  return { passou: 'Passou na última execução', falhou: 'Falhou na última execução', instavel: 'Instável: falhou e depois passou', pulou: 'Pulado', nao_rodou: 'Ainda não rodou' }[s] || s;
}

function findTarget(alvo) {
  if (!ui.list || !alvo) return null;
  for (const a of ui.list.arquivos) {
    if (a.arquivo === alvo) return { tipo: 'arquivo', arquivo: a };
    const t = a.testes.find((x) => x.alvo === alvo);
    if (t) return { tipo: 'teste', arquivo: a, teste: t };
  }
  return null;
}

function renderAffected() {
  const a = ui.affected;
  const headed = $('headed').checked ? ' --headed' : '';
  $('crumb').textContent = 'Afetados pelo que mudou';
  $('affected').classList.remove('hidden');
  if (!a) { $('title').textContent = 'Calculando o que mudou…'; $('affected').innerHTML = ''; return; }
  if (a.erro) { $('title').textContent = 'Não deu para saber o que mudou'; $('affected').innerHTML = `<p>${esc(a.erro)}</p>`; $('cmd').textContent = ''; return; }
  $('title').textContent = `${a.alvos.length} de ${a.totalSpecs} arquivos de teste`;
  $('cmd').textContent = a.alvos.length ? `npx playwright test ${a.alvos.join(' ')}${headed}` : '';
  const porSpec = new Map(a.specs.map((s) => [s.arquivo, s.motivos]));
  $('affected').innerHTML = `
    <div class="muted">${a.alterados.length} arquivos alterados${a.areas.length ? ` · áreas: ${esc(a.areas.join(', '))}` : ''}${a.mapa ? '' : ' · sem .qa/areas.json (vizinhos de negócio não entram)'}</div>
    ${a.transversal.sim ? `<div class="warn"><strong>Mudança transversal:</strong> pode valer rodar todos.<ul>${a.transversal.motivos.map((m) => `<li><code>${esc(m.arquivo)}</code>: ${esc(m.motivo)}</li>`).join('')}</ul></div>` : ''}
    ${a.alvos.length ? `<ul>${a.alvos.map((s) => `<li><code>${esc(s)}</code> · ${esc(porSpec.get(s).map((m) => `${m.tipo}: ${m.detalhe}`).join(' · '))}</li>`).join('')}</ul>` : '<p>Nenhum teste E2E ligado ao que mudou.</p>'}
    ${a.semEfeito.length ? `<div class="muted">Sem teste ligado: ${esc(a.semEfeito.join(', '))}</div>` : ''}`;
}

async function selectAffected() {
  ui.selected = AFETADOS;
  ui.affected = null;
  renderAffected();
  try { ui.affected = await api('/api/afetados'); } catch (e) { ui.affected = { erro: e.message }; }
  if (ui.selected === AFETADOS) renderAffected();
  if (ui.list) renderTree();
}

function select(alvo) {
  if (alvo === AFETADOS) return selectAffected();
  ui.selected = alvo;
  $('affected').classList.add('hidden');
  const found = findTarget(alvo);
  const headed = $('headed').checked ? ' --headed' : '';
  if (!found) {
    $('crumb').textContent = 'Todos os arquivos';
    $('title').textContent = 'Testes E2E do projeto';
    $('cmd').textContent = `npx playwright test${headed}`;
  } else if (found.tipo === 'arquivo') {
    $('crumb').textContent = found.arquivo.arquivo;
    $('title').textContent = `${found.arquivo.testes.length} testes neste arquivo`;
    $('cmd').textContent = `npx playwright test ${alvo}${headed}`;
  } else {
    const t = found.teste;
    $('crumb').textContent = [found.arquivo.arquivo, ...t.describe].join(' › ');
    $('title').textContent = t.titulo;
    $('cmd').textContent = `npx playwright test ${alvo}${headed}`;
  }
  if (ui.list) renderTree();
}

// ── Executar e parar ────────────────────────────────────────────────────────
async function run(alvo) {
  try {
    const headed = $('headed').checked;
    await api('/api/executar', alvo === AFETADOS ? { afetados: true, headed } : { alvo: alvo || null, headed });
  } catch (e) {
    sysLine(`✘ ${e.message}`);
  }
}
async function stop() {
  try { await api('/api/parar', {}); sysLine('■ Pedido de parada enviado.'); } catch (e) { sysLine(`✘ ${e.message}`); }
}
function setRunning(r) {
  ui.running = r;
  $('btn-run').classList.toggle('hidden', !!r);
  $('btn-stop').classList.toggle('hidden', !r);
  $('btn-all').disabled = !!r;
  $('btn-affected').disabled = !!r;
  if (r) $('btn-failed').disabled = true;
  $('run-state').textContent = r ? `Rodando: ${r.selecao ? `afetados (${r.selecao.selecionados} de ${r.selecao.totalSpecs})` : r.alvo || 'todos os testes'}` : '';
  if (ui.list) renderTree();
}

// ── Relatório ───────────────────────────────────────────────────────────────
async function loadReport() {
  let r;
  try { r = await api('/api/relatorio'); } catch { return; }
  $('report-when').textContent = `${new Date(r.inicio).toLocaleString('pt-BR')} · ${r.alvo || 'todos os testes'}`;
  if (!r.resumo) {
    $('report-body').innerHTML = `<p class="verdict">${r.parado ? 'Execução parada antes de gerar relatório.' : 'O Playwright não gerou relatório.'} Código de saída: ${esc(r.codigoSaida ?? '—')}.</p>`;
    return;
  }
  // Portal religado: o log ao vivo está vazio, então mostra o log salvo da última execução.
  if (!ui.running && !$('log').textContent && r.log) {
    sysLine(`▶ ${r.comando}  (log salvo de ${new Date(r.inicio).toLocaleString('pt-BR')})`);
    appendLog(ansiToHtml(r.log));
  }
  const s = r.resumo;
  const rodaram = s.total - s.naoRodou;
  let verdict;
  if (s.falhou) verdict = `Falhou em ${s.falhou} de ${rodaram} (${fmtPct(s.falhou, rodaram)}%).`;
  else if (s.instavel) verdict = `Passou, mas ${s.instavel} de ${rodaram} só passou na repetição: teste instável.`;
  else verdict = `Passou em ${s.passou} de ${rodaram}.`;
  if (r.parado) verdict += ' Execução parada no meio: os números cobrem só o que rodou.';
  const box = (k, label) => `<div class="total ${k}"><b>${esc(s[k])}</b>${label}</div>`;
  const problems = r.testes.filter((t) => t.status === 'falhou' || t.status === 'instavel');
  $('btn-failed').disabled = !!ui.running || !problems.length;
  $('btn-failed').textContent = problems.length ? `↻ Só os que falharam (${problems.length})` : '↻ Só os que falharam';
  $('report-body').innerHTML = `
    <p class="verdict">${esc(verdict)}</p>
    <div class="totals">${box('passou', 'passaram')}${box('falhou', 'falharam')}${box('instavel', 'instáveis')}${box('pulou', 'pulados')}</div>
    ${(r.erros || []).map((e) => `<div class="fail-item"><h3>Erro fora dos testes</h3><pre>${esc(e)}</pre></div>`).join('')}
    ${problems.map((t) => `
      <div class="fail-item ${t.status}">
        <h3>${t.status === 'instavel' ? '⚠ Instável' : '✘ Falhou'} · ${esc([...t.describe, t.titulo].join(' › '))}${t.projeto ? ` <span class="muted">[${esc(t.projeto)}]</span>` : ''}</h3>
        <div class="muted">${esc(t.alvo)} · ${esc(t.tentativas)} tentativa(s) · ${fmtMs(Number(t.duracaoMs) || 0)}</div>
        ${t.erro ? `<pre>${esc(t.erro)}</pre>` : ''}
        ${t.trace ? `<div class="trace">Abrir o trace: <code>npx playwright show-trace ${esc(t.trace)}</code><button class="btn ghost small" data-copy="npx playwright show-trace ${esc(t.trace)}">Copiar</button></div>` : ''}
        ${t.screenshot ? `<div class="trace">Screenshot: <code>${esc(t.screenshot)}</code></div>` : ''}
        <div class="row" style="margin-top:6px"><button class="btn ghost small" data-run="${esc(t.alvo)}">▶ Rodar de novo só este</button></div>
      </div>`).join('')}
  `;
}

async function loadHistory() {
  let h;
  try { h = await api('/api/historico'); } catch { return; }
  $('history').innerHTML = h.execucoes.map((e) => {
    const s = e.resumo;
    const nums = s ? esc(`${s.passou} passaram · ${s.falhou} falharam${s.instavel ? ` · ${s.instavel} instáveis` : ''}${s.pulou ? ` · ${s.pulou} pulados` : ''}`) : 'sem relatório';
    return `<li><span class="tag">${esc(new Date(e.inicio).toLocaleString('pt-BR'))}</span> · ${esc(e.selecao ? `afetados (${e.selecao.selecionados} de ${e.selecao.totalSpecs})` : e.alvo || 'todos')} · ${nums}${e.parado ? ' · parada' : ''}</li>`;
  }).join('') || '<li class="muted">Vazio.</li>';
}

// ── Stream ──────────────────────────────────────────────────────────────────
function connect() {
  const es = new EventSource('/api/logs');
  es.addEventListener('inicio', (ev) => {
    const d = JSON.parse(ev.data);
    $('log').innerHTML = '';
    Object.assign(ansi, { bold: false, dim: false, color: null, pending: '' });
    sysLine(`▶ ${d.comando}`);
    setRunning({ id: d.execucao, alvo: d.alvo, selecao: d.selecao });
  });
  es.addEventListener('log', (ev) => appendLog(ansiToHtml(JSON.parse(ev.data).texto)));
  es.addEventListener('fim', async (ev) => {
    const d = JSON.parse(ev.data);
    sysLine(`\n■ Fim. Código de saída: ${d.codigoSaida ?? '—'}${d.parado ? ' (parada pelo usuário)' : ''}.`);
    setRunning(null);
    await Promise.all([loadReport(), loadHistory(), ui.list ? loadTests() : null]);
  });
  es.onopen = () => { $('run-state').classList.remove('muted'); };
  es.onerror = () => { $('run-state').textContent = 'Conexão com o portal caiu. Reconectando…'; };
}

// ── Eventos da tela ─────────────────────────────────────────────────────────
document.addEventListener('click', (ev) => {
  const copy = ev.target.closest('[data-copy]');
  if (copy) { navigator.clipboard?.writeText(copy.dataset.copy); copy.textContent = 'Copiado'; return; }
  const again = ev.target.closest('[data-run]');
  if (again) { select(again.dataset.run); run(again.dataset.run); return; }
  const item = ev.target.closest('#tree [data-alvo]');
  if (item) {
    if (item.tagName === 'SUMMARY' && ui.selected !== item.dataset.alvo) ev.preventDefault();
    select(item.dataset.alvo);
  }
});
$('btn-run').onclick = () => run(ui.selected);
$('btn-stop').onclick = stop;
$('btn-all').onclick = () => { select(null); run(null); };
$('btn-failed').onclick = async () => {
  try { await api('/api/executar', { falhos: true, headed: $('headed').checked }); } catch (e) { sysLine(`✘ ${e.message}`); }
};
$('btn-affected').onclick = async () => { await selectAffected(); if (ui.affected?.alvos?.length) run(AFETADOS); else sysLine('✘ Nenhum teste E2E afetado pelo que mudou.'); };
$('btn-refresh').onclick = () => loadTests(true);
$('btn-clear').onclick = () => { $('log').innerHTML = ''; };
$('btn-copy').onclick = () => navigator.clipboard?.writeText($('log').innerText);
$('headed').onchange = () => (ui.selected === AFETADOS ? renderAffected() : select(ui.selected));
$('search').oninput = (e) => { ui.filter = e.target.value; if (ui.list) renderTree(); };

(async () => {
  try {
    const info = await api('/api/info');
    $('project').textContent = `${info.projeto || 'projeto'} · ${info.raiz}`;
    if (info.executando) setRunning({ id: info.executando.execucao, alvo: info.executando.alvo });
  } catch { /* segue */ }
  connect();
  await loadTests();
  select(null);
  await Promise.all([loadReport(), loadHistory()]);
})();
