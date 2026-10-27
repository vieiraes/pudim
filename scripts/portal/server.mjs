#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Portal de testes E2E (Playwright) em localhost. Node puro, zero dependências.
//   node server.mjs --root=<projeto> [--port=4455] [--abrir]
//   node server.mjs --root=<projeto> --status    → diz se o portal está no ar
//   node server.mjs --root=<projeto> --parar     → desliga o portal
// Escreve só em <projeto>/.qa/portal/. Nunca altera código do produto.
// Exit: 0 ok · 2 projeto sem package.json · 4 nenhuma porta livre
// =============================================================================
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseList, parseReport } from './playwright-report.mjs';
import { generate } from '../relatorio.mjs';
import { affected, changedFiles } from '../e2e-afetados.mjs';
import { detectE2eDir } from '../e2e-rotas.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(HERE, 'public');
const HOST = '127.0.0.1';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};
const ROOT = resolve(opt('root', '.'));
const QA = join(ROOT, '.qa', 'portal');
const RUNS = join(QA, 'execucoes');
const SERVER_FILE = join(QA, 'servidor.json');
const STATE_FILE = join(QA, 'estado.json');

// ── Modos auxiliares: --status e --parar ────────────────────────────────────
function readServerFile() {
  try { return JSON.parse(readFileSync(SERVER_FILE, 'utf8')); } catch { return null; }
}
// Só um PID inteiro > 1 que seja mesmo um portal do Pudim (o servidor.json pode vir plantado no repositório).
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try { process.kill(pid, 0); } catch { return false; }
  try {
    const cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    return cmd.includes('server.mjs');
  } catch { return process.platform !== 'linux'; }
}
if (args.includes('--status') || args.includes('--parar')) {
  const s = readServerFile();
  const on = s && alive(s.pid);
  if (args.includes('--parar') && on) {
    process.kill(s.pid, 'SIGTERM');
    console.log(JSON.stringify({ rodando: false, parado: true, url: s.url }));
  } else {
    console.log(JSON.stringify(on ? { rodando: true, url: s.url, pid: s.pid } : { rodando: false }));
  }
  process.exit(0);
}

if (!existsSync(join(ROOT, 'package.json'))) {
  console.error(`Não achei package.json em ${ROOT}. Rode o portal na raiz do projeto.`);
  process.exit(2);
}

// ── Como chamar o Playwright do projeto ─────────────────────────────────────
function playwrightCmd() {
  if (process.env.PUDIM_PLAYWRIGHT_BIN) return { cmd: process.env.PUDIM_PLAYWRIGHT_BIN, pre: [] };
  const local = join(ROOT, 'node_modules', '.bin', 'playwright');
  if (existsSync(local)) return { cmd: local, pre: [] };
  return { cmd: 'npx', pre: ['playwright'] };
}
const commandText = (argv) => ['npx playwright', ...argv].join(' ');
// Ambiente do Playwright: o do portal, sem as variáveis do Claude Code (os testes e o webServer
// do app não precisam delas e o stdout vai para o log em .qa/).
function childEnv(extra) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!/^(ANTHROPIC_|CLAUDE_)/.test(k)) env[k] = v;
  return { ...env, ...extra };
}
// Grava sem deixar arquivo pela metade se o processo cair no meio.
function writeAtomic(file, data) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}
function readRun(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

// ── Lista de testes ─────────────────────────────────────────────────────────
let listCache = null;
function listTests() {
  const { cmd, pre } = playwrightCmd();
  const r = spawnSync(cmd, [...pre, 'test', '--list', '--reporter=json'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: childEnv({ FORCE_COLOR: '0' }),
  });
  if (r.error) return { erro: `Não consegui chamar o Playwright: ${r.error.message}` };
  try {
    const start = r.stdout.indexOf('{');
    return parseList(JSON.parse(r.stdout.slice(start)), ROOT);
  } catch {
    const tail = `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').slice(-15).join('\n');
    return { erro: 'O Playwright não devolveu a lista de testes.', detalhe: tail };
  }
}
function knownTargets(list) {
  const set = new Set();
  for (const a of list.arquivos || []) {
    set.add(a.arquivo);
    for (const t of a.testes) set.add(t.alvo);
  }
  return set;
}

// Specs que a mudança atual afeta (git diff), só os que o Playwright conhece.
// Cache pela "versão" do repositório (HEAD + status), porque o botão da tela chama GET e POST em sequência.
let affectedCache = null;
function repoVersion() {
  try {
    return execFileSync('git', ['-c', 'core.quotePath=false', 'status', '--porcelain', '-z', '--branch'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch { return null; }
}
function affectedSelection() {
  const version = repoVersion();
  if (version === null) return { erro: 'O projeto não está num repositório git: não dá para saber o que mudou.' };
  if (affectedCache && affectedCache.version === version && Date.now() - affectedCache.quando < 60000) return affectedCache.sel;
  let base;
  let aviso;
  let alterados;
  let raizRepo;
  try { ({ base, aviso, alterados, raizRepo } = changedFiles(ROOT)); } catch { return { erro: 'Não consegui ler o git deste projeto.' }; }
  const r = { base, aviso, ...affected(ROOT, alterados, { e2eDir: detectE2eDir(ROOT), raizRepo }) };
  if (!listCache || listCache.erro) listCache = listTests();
  if (listCache.erro) return { erro: `Não consegui listar os testes do Playwright: ${listCache.erro}` };
  // Spec novo (caso típico de "afetados") ainda não está na lista: relê uma vez.
  let known = knownTargets(listCache);
  if (r.specs.some((s) => !known.has(s.arquivo))) { listCache = listTests(); if (!listCache.erro) known = knownTargets(listCache); }
  r.alvos = r.specs.map((s) => s.arquivo).filter((a) => known.has(a) && !a.startsWith('-'));
  affectedCache = { version, quando: Date.now(), sel: r };
  return r;
}

// ── Estado por teste (último status conhecido) ──────────────────────────────
let state = { porTeste: {} };
try { state = JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { /* primeira vez */ }

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ── Log ao vivo (SSE) ───────────────────────────────────────────────────────
const clients = new Set();
let buffer = [];           // eventos da execução atual, para replay
let nextEventId = 1;
function emit(type, data) {
  const ev = { id: nextEventId++, type, data };
  buffer.push(ev);
  // Poda com folga: cortar a cada evento depois do limite custa O(n) por evento.
  if (buffer.length > 25000) buffer = buffer.slice(-20000);
  for (const res of clients) writeEvent(res, ev);
}
function writeEvent(res, ev) {
  res.write(`id: ${ev.id}\nevent: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
}

// ── Execução ────────────────────────────────────────────────────────────────
let running = null;   // { id, child, inicio, alvo, headed, argv, parado }
let lastRun = null;

function lastSavedRun() {
  try {
    const files = readdirSync(RUNS).filter((f) => f.endsWith('.json')).sort();
    return files.length ? readRun(join(RUNS, files[files.length - 1])) : null;
  } catch { return null; }
}

function startRun(alvos, headed, selecao = null) {
  mkdirSync(RUNS, { recursive: true });
  // Duas execuções no mesmo segundo não podem sobrescrever uma à outra no histórico.
  let id = stamp();
  for (let n = 2; existsSync(join(RUNS, `${id}.json`)); n++) id = `${stamp()}-${n}`;
  const jsonOut = join(QA, `ultima-${process.pid}.json`);
  rmSync(jsonOut, { force: true });
  const argv = ['test', ...alvos, '--reporter=list,json', ...(headed ? ['--headed'] : [])];
  const alvo = alvos.length ? alvos.join(' ') : null;
  const { cmd, pre } = playwrightCmd();
  const child = spawn(cmd, [...pre, ...argv], {
    cwd: ROOT,
    detached: process.platform !== 'win32',
    env: childEnv({ FORCE_COLOR: '1', PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut, PLAYWRIGHT_JSON_OUTPUT_FILE: jsonOut }),
  });
  buffer = [];
  running = { id, child, inicio: new Date().toISOString(), alvo, headed, argv, parado: false, log: '', selecao };
  emit('inicio', { execucao: id, alvo, selecao, headed, comando: commandText(argv) });
  const onData = (b) => {
    const texto = b.toString('utf8');
    // Guarda até 512 KB do log para mostrar de novo depois que o portal for religado.
    if (running && running.log.length < 512 * 1024) running.log += texto;
    emit('log', { execucao: id, texto });
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  let done = false;
  const finish = (code, err) => {
    if (done) return;
    done = true;
    let parsed = { testes: [], resumo: null, erros: [] };
    try { parsed = parseReport(JSON.parse(readFileSync(jsonOut, 'utf8')), ROOT); } catch { /* sem relatório */ }
    rmSync(jsonOut, { force: true });
    const run = {
      execucao: id,
      inicio: running.inicio,
      fim: new Date().toISOString(),
      alvo: running.alvo,
      alvos,
      selecao: running.selecao,
      headed,
      comando: commandText(argv),
      codigoSaida: code,
      parado: running.parado,
      erroAoIniciar: err ? err.message : null,
      log: running.log,
      resumo: parsed.resumo,
      erros: parsed.erros,
      testes: parsed.testes,
    };
    writeAtomic(join(RUNS, `${id}.json`), JSON.stringify(run, null, 2));
    for (const t of run.testes) {
      // Um teste pode falhar no chromium e passar no firefox: o estado é por projeto do Playwright.
      if (t.status !== 'nao_rodou') state.porTeste[`${t.id}|${t.projeto || ''}`] = { status: t.status, execucao: id };
    }
    writeAtomic(STATE_FILE, JSON.stringify(state, null, 2));
    lastRun = run;
    running = null;
    // Specs criados ou renomeados durante a execução entram na próxima lista.
    listCache = null;
    affectedCache = null;
    emit('fim', { execucao: id, codigoSaida: code, parado: run.parado, resumo: run.resumo });
  };
  child.on('error', (e) => finish(null, e));
  child.on('close', (code) => finish(code, null));
}

function stopRun() {
  if (!running) return false;
  running.parado = true;
  const { child } = running;
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
    else child.kill('SIGTERM');
  } catch { child.kill('SIGTERM'); }
  setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* já saiu */ } }, 3000).unref();
  return true;
}

// ── HTTP ────────────────────────────────────────────────────────────────────
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((ok) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) { req.destroy(); ok(null); } });
    req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch { ok(null); } });
    req.on('error', () => ok(null));
  });
}

let PORT = Number(opt('port', '4455'));
const localHosts = () => new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

const server = createServer((req, res) => {
  handle(req, res).catch((e) => {
    // Um JSON corrompido em .qa/ não pode derrubar o portal.
    if (!res.headersSent) send(res, 500, { erro: `Erro interno do portal: ${e.message}` });
    else res.end();
  });
});
async function handle(req, res) {
  // Defesa contra DNS rebinding: só atende quem chama pelo endereço local.
  if (!localHosts().has(req.headers.host || '')) return send(res, 403, { erro: 'Acesso só por 127.0.0.1 ou localhost.' });
  const origin = req.headers.origin;
  if (req.method === 'POST' && origin && !localHosts().has(origin.replace(/^https?:\/\//, ''))) {
    return send(res, 403, { erro: 'Origem não permitida.' });
  }
  // Pedido vindo de uma página de outro site (inclusive GET com efeito, como /relatorio?gerar=1).
  if (req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { erro: 'Origem não permitida.' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path === '/api/info') {
    let nome = '';
    try { nome = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name || ''; } catch { /* sem nome */ }
    return send(res, 200, { projeto: nome, raiz: ROOT, executando: running ? { execucao: running.id, alvo: running.alvo } : null });
  }

  if (path === '/api/testes') {
    if (!listCache || url.searchParams.get('atualizar') === '1') listCache = listTests();
    if (listCache.erro) return send(res, 502, listCache);
    const PIOR = ['falhou', 'instavel', 'passou', 'pulou'];
    const statusDe = (id) => {
      const vistos = Object.entries(state.porTeste).filter(([k]) => k === id || k.startsWith(`${id}|`)).map(([, v]) => v.status);
      return PIOR.find((s) => vistos.includes(s)) || 'nao_rodou';
    };
    const arquivos = listCache.arquivos.map((a) => ({
      ...a, testes: a.testes.map((t) => ({ ...t, status: statusDe(t.id) })),
    }));
    return send(res, 200, { ...listCache, arquivos });
  }

  if (path === '/api/executar' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body) return send(res, 400, { erro: 'Corpo inválido.' });
    if (running) return send(res, 409, { erro: 'Já tem uma execução rodando. Pare antes de começar outra.', execucao: running.id });
    // Afetados: o servidor calcula a lista; vazia não vira "rodar todos".
    if (body.afetados) {
      const sel = affectedSelection();
      if (sel.erro) return send(res, 400, { erro: sel.erro });
      if (!sel.alvos.length) return send(res, 400, { erro: 'Nenhum teste E2E afetado pelo que mudou.' });
      const selecao = { base: sel.base, alterados: sel.alterados.length, selecionados: sel.alvos.length, totalSpecs: sel.totalSpecs, areas: sel.areas, transversal: sel.transversal.sim };
      startRun(sel.alvos, Boolean(body.headed), selecao);
      return send(res, 202, { execucao: running.id, comando: commandText(running.argv) });
    }
    // Só os que falharam ou ficaram instáveis na última execução.
    if (body.falhos) {
      const last = lastRun || lastSavedRun();
      const falhos = [...new Set((last?.testes || []).filter((t) => t.status === 'falhou' || t.status === 'instavel').map((t) => t.alvo))];
      if (!falhos.length) return send(res, 400, { erro: 'Nenhum teste falhou na última execução.' });
      if (!listCache || listCache.erro) listCache = listTests();
      const known = listCache.erro ? new Set() : knownTargets(listCache);
      const alvos = falhos.filter((a) => known.has(a));
      if (!alvos.length) return send(res, 400, { erro: 'Os testes que falharam não estão mais na lista do Playwright. Atualize a lista.' });
      startRun(alvos, Boolean(body.headed));
      return send(res, 202, { execucao: running.id, comando: commandText(running.argv) });
    }
    const alvos = Array.isArray(body.alvos) ? body.alvos : body.alvo ? [body.alvo] : [];
    if (Array.isArray(body.alvos) && !alvos.length) return send(res, 400, { erro: 'Lista de testes vazia.' });
    if (alvos.length) {
      if (!listCache || listCache.erro) listCache = listTests();
      const known = listCache.erro ? new Set() : knownTargets(listCache);
      const desconhecido = alvos.find((a) => typeof a !== 'string' || !known.has(a));
      if (desconhecido !== undefined) return send(res, 400, { erro: `Teste ou arquivo desconhecido: ${desconhecido}` });
    }
    startRun(alvos, Boolean(body.headed));
    return send(res, 202, { execucao: running.id, comando: commandText(running.argv) });
  }

  if (path === '/api/afetados') {
    const sel = affectedSelection();
    return send(res, sel.erro ? 400 : 200, sel);
  }

  if (path === '/api/parar' && req.method === 'POST') {
    const id = running?.id;
    return stopRun() ? send(res, 200, { parando: id }) : send(res, 409, { erro: 'Nada rodando.' });
  }

  if (path === '/api/relatorio') {
    const run = lastRun || lastSavedRun();
    return send(res, run ? 200 : 404, run || { erro: 'Nenhuma execução ainda.' });
  }

  if (path === '/api/historico') {
    let files = [];
    try { files = readdirSync(RUNS).filter((f) => f.endsWith('.json')).sort().reverse().slice(0, 20); } catch { /* vazio */ }
    const items = files.map((f) => readRun(join(RUNS, f))).filter(Boolean).map((r) => (
      { execucao: r.execucao, inicio: r.inicio, alvo: r.alvo, selecao: r.selecao || null, parado: r.parado, codigoSaida: r.codigoSaida, resumo: r.resumo }));
    return send(res, 200, { execucoes: items });
  }

  if (path === '/api/logs') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n');
    const last = Number(req.headers['last-event-id'] || url.searchParams.get('desde') || 0);
    for (const ev of buffer) if (ev.id > last) writeEvent(res, ev);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => { clients.delete(res); clearInterval(ping); });
    return undefined;
  }

  // Relatório visual (/qa:relatorio). Com ?gerar=1, gera de novo antes de mostrar.
  if (path === '/relatorio') {
    const dirRel = join(ROOT, '.qa', 'relatorios');
    if (url.searchParams.get('gerar') === '1') {
      try { generate(ROOT, dirRel); } catch (e) { return send(res, 500, { erro: `Não consegui gerar o relatório: ${e.message}` }); }
    }
    const file = join(dirRel, 'ultimo.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!doctype html><meta charset="utf-8"><title>Sem relatório</title><body style="font-family:system-ui;padding:32px">' +
        '<h1>🍮 Nenhum relatório ainda</h1><p>Rode <code>/qa:relatorio</code> no Claude Code ou use o botão "📊 Relatório" do portal.</p></body>');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:" });
    return res.end(readFileSync(file));
  }

  // Arquivos da tela
  if (req.method === 'GET') {
    const file = path === '/' ? 'index.html' : path.slice(1);
    const abs = resolve(PUBLIC, file);
    if (!abs.startsWith(PUBLIC + '/') || !existsSync(abs)) return send(res, 404, { erro: 'Não encontrado.' });
    res.writeHead(200, { 'Content-Type': TYPES[extname(abs)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(readFileSync(abs));
  }
  return send(res, 405, { erro: 'Método não permitido.' });
}

// Tenta a porta pedida e as 10 seguintes.
const firstPort = PORT;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && PORT < firstPort + 10) { PORT++; server.listen(PORT, HOST); return; }
  console.error(e.code === 'EADDRINUSE' ? `Nenhuma porta livre entre ${firstPort} e ${PORT}.` : e.message);
  process.exit(4);
});
server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  mkdirSync(QA, { recursive: true });
  // Logs do portal podem conter saída do app: ficam fora do git do projeto.
  if (!existsSync(join(QA, '.gitignore'))) writeFileSync(join(QA, '.gitignore'), '*\n');
  writeFileSync(SERVER_FILE, JSON.stringify({ pid: process.pid, url, inicio: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ url, raiz: ROOT }));
  if (args.includes('--abrir')) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(opener, [url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  }
});

const shutdown = () => {
  stopRun();
  try { if (readServerFile()?.pid === process.pid) rmSync(SERVER_FILE, { force: true }); } catch { /* ok */ }
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
