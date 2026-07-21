const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 4444;
const HOST = '127.0.0.1';
const ROOT_DIR = path.join(__dirname, '..');
const MAX_BUFFER = 2000;

// Allowlist definida no servidor — o cliente manda só o nome, nunca comando cru.
const SCRIPTS = {
  validate: {
    description: 'Validação completa do fluxo Pudim SDD (specs, STATUS.md, dependências).',
    command: './pudim/validate-project.sh',
  },
  'validate:quick': {
    description: 'Só erros críticos — o mesmo modo usado no hook de pre-commit.',
    command: './pudim/validate-project.sh --quick',
  },
  hooks: {
    description: 'Instala/atualiza o hook de pre-commit local. Grava em .git/hooks/pre-commit.',
    command: './pudim/install-hooks.sh',
  },
};

const running = new Map(); // nome -> { proc }
let logBuffer = [];
let logSeq = 0;
let sseClients = [];

function emit(entry) {
  entry.id = ++logSeq;
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER) logBuffer.shift();
  const payload = `id: ${entry.id}\nevent: message\ndata: ${JSON.stringify(entry)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (_) {
      // cliente desconectou, ignora
    }
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/scripts — allowlist + estado atual de cada script
app.get('/api/scripts', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const list = Object.entries(SCRIPTS).map(([name, meta]) => ({
    name,
    description: meta.description,
    command: meta.command,
    running: running.has(name),
  }));
  res.json({ scripts: list });
});

// POST /api/run — inicia um script da allowlist
app.post('/api/run', (req, res) => {
  const { name } = req.body || {};
  if (!name || !Object.prototype.hasOwnProperty.call(SCRIPTS, name)) {
    return res.status(400).json({ error: 'Script desconhecido (fora da allowlist).' });
  }
  if (running.has(name)) {
    return res.status(409).json({ error: `'${name}' já está em execução.` });
  }

  if (running.size === 0) logBuffer = [];

  const command = SCRIPTS[name].command;
  emit({ event: 'start', name, command, ts: Date.now() });

  const proc = spawn(process.env.SHELL || 'sh', ['-lc', command], {
    cwd: ROOT_DIR,
    env: { ...process.env, FORCE_COLOR: 'true' },
    detached: true,
    stdio: 'pipe',
  });

  running.set(name, { proc });

  const handleOutput = (source) => (chunk) => {
    emit({ event: 'log', name, source, text: chunk.toString(), ts: Date.now() });
  };
  proc.stdout.on('data', handleOutput('stdout'));
  proc.stderr.on('data', handleOutput('stderr'));

  proc.on('close', (code) => {
    emit({ event: 'done', name, exitCode: code, ts: Date.now() });
    running.delete(name);
  });

  proc.on('error', (err) => {
    emit({ event: 'error', name, text: err.message, ts: Date.now() });
    running.delete(name);
  });

  res.json({ ok: true, name, pid: proc.pid });
});

// POST /api/stop — mata o grupo de processo de um script em execução
app.post('/api/stop', (req, res) => {
  const { name } = req.body || {};
  const info = name && running.get(name);
  if (!info) {
    return res.status(400).json({ error: `'${name}' não está em execução.` });
  }
  try {
    process.kill(-info.proc.pid, 'SIGTERM');
  } catch (_1) {
    try {
      info.proc.kill('SIGTERM');
    } catch (_2) {
      // sem o que fazer, o processo provavelmente já morreu
    }
  }
  res.json({ ok: true, name });
});

// GET /api/logs — SSE, com replay via Last-Event-ID e ping de keep-alive
app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const lastEventId = Number(req.headers['last-event-id']) || 0;
  for (const entry of logBuffer) {
    if (entry.id && entry.id <= lastEventId) continue;
    res.write(`id: ${entry.id}\nevent: message\ndata: ${JSON.stringify(entry)}\n\n`);
  }

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_) {
      clearInterval(ping);
    }
  }, 15000);

  sseClients.push(res);

  req.on('close', () => {
    clearInterval(ping);
    sseClients = sseClients.filter((c) => c !== res);
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Portal Pudim rodando em http://${HOST}:${PORT}`);
  console.log('Ctrl+C para parar.');
});
