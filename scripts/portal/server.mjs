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
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseList, parseReport } from './playwright-report.mjs';
import { generate } from '../relatorio.mjs';

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
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
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

// ── Lista de testes ─────────────────────────────────────────────────────────
let listCache = null;
function listTests() {
  const { cmd, pre } = playwrightCmd();
  const r = spawnSync(cmd, [...pre, 'test', '--list', '--reporter=json'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0' },
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
  if (buffer.length > 20000) buffer = buffer.slice(-20000);
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
    return files.length ? JSON.parse(readFileSync(join(RUNS, files[files.length - 1]), 'utf8')) : null;
  } catch { return null; }
}

function startRun(alvo, headed) {
  mkdirSync(RUNS, { recursive: true });
  // Duas execuções no mesmo segundo não podem sobrescrever uma à outra no histórico.
  let id = stamp();
  for (let n = 2; existsSync(join(RUNS, `${id}.json`)); n++) id = `${stamp()}-${n}`;
  const jsonOut = join(QA, `ultima-${process.pid}.json`);
  rmSync(jsonOut, { force: true });
  const argv = ['test', ...(alvo ? [alvo] : []), '--reporter=list,json', ...(headed ? ['--headed'] : [])];
  const { cmd, pre } = playwrightCmd();
  const child = spawn(cmd, [...pre, ...argv], {
    cwd: ROOT,
    detached: process.platform !== 'win32',
    env: { ...process.env, FORCE_COLOR: '1', PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut, PLAYWRIGHT_JSON_OUTPUT_FILE: jsonOut },
  });
  buffer = [];
  running = { id, child, inicio: new Date().toISOString(), alvo: alvo || null, headed, argv, parado: false, log: '' };
  emit('inicio', { execucao: id, alvo: alvo || null, headed, comando: commandText(argv) });
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
    writeFileSync(join(RUNS, `${id}.json`), JSON.stringify(run, null, 2));
    for (const t of run.testes) {
      if (t.status !== 'nao_rodou') state.porTeste[t.id] = { status: t.status, execucao: id };
    }
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    lastRun = run;
    running = null;
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
    req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
    req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch { ok(null); } });
  });
}

let PORT = Number(opt('port', '4455'));
const localHosts = () => new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

const server = createServer(async (req, res) => {
  // Defesa contra DNS rebinding: só atende quem chama pelo endereço local.
  if (!localHosts().has(req.headers.host || '')) return send(res, 403, { erro: 'Acesso só por 127.0.0.1 ou localhost.' });
  const origin = req.headers.origin;
  if (req.method === 'POST' && origin && !localHosts().has(origin.replace(/^https?:\/\//, ''))) {
    return send(res, 403, { erro: 'Origem não permitida.' });
  }
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
    const arquivos = listCache.arquivos.map((a) => ({
      ...a, testes: a.testes.map((t) => ({ ...t, status: state.porTeste[t.id]?.status || 'nao_rodou' })),
    }));
    return send(res, 200, { ...listCache, arquivos });
  }

  if (path === '/api/executar' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body) return send(res, 400, { erro: 'Corpo inválido.' });
    if (running) return send(res, 409, { erro: 'Já tem uma execução rodando. Pare antes de começar outra.', execucao: running.id });
    const alvo = body.alvo || null;
    if (alvo) {
      if (!listCache || listCache.erro) listCache = listTests();
      if (listCache.erro || !knownTargets(listCache).has(alvo)) return send(res, 400, { erro: `Teste ou arquivo desconhecido: ${alvo}` });
    }
    startRun(alvo, Boolean(body.headed));
    return send(res, 202, { execucao: running.id, comando: commandText(running.argv) });
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
    const items = files.map((f) => {
      const r = JSON.parse(readFileSync(join(RUNS, f), 'utf8'));
      return { execucao: r.execucao, inicio: r.inicio, alvo: r.alvo, parado: r.parado, codigoSaida: r.codigoSaida, resumo: r.resumo };
    });
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

  // Relatório visual (/pudim:relatorio). Com ?gerar=1, gera de novo antes de mostrar.
  if (path === '/relatorio') {
    const dirRel = join(ROOT, '.qa', 'relatorios');
    if (url.searchParams.get('gerar') === '1') {
      try { generate(ROOT, dirRel); } catch (e) { return send(res, 500, { erro: `Não consegui gerar o relatório: ${e.message}` }); }
    }
    const file = join(dirRel, 'ultimo.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!doctype html><meta charset="utf-8"><title>Sem relatório</title><body style="font-family:system-ui;padding:32px">' +
        '<h1>🍮 Nenhum relatório ainda</h1><p>Rode <code>/pudim:relatorio</code> no Claude Code ou use o botão "📊 Relatório" do portal.</p></body>');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(readFileSync(file));
  }

  // Arquivos da tela
  if (req.method === 'GET') {
    const file = path === '/' ? 'index.html' : path.slice(1);
    const abs = resolve(PUBLIC, file);
    if (!abs.startsWith(PUBLIC) || !existsSync(abs)) return send(res, 404, { erro: 'Não encontrado.' });
    res.writeHead(200, { 'Content-Type': TYPES[extname(abs)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(readFileSync(abs));
  }
  return send(res, 405, { erro: 'Método não permitido.' });
});

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
