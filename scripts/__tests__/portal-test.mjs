// 🍮 Pudim — Testes do portal (server.mjs + playwright-report.mjs) com Playwright falso.
// Chamado por scripts/test.sh. Última linha: "RESULTADO <passaram> <falharam>".
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SCRIPTS = join(HERE, '..');
const FX = join(HERE, 'fixtures', 'portal');
let pass = 0;
let fail = 0;
const check = (cond, msg, extra) => {
  if (cond) { pass++; console.log(`  ✔ ${msg}`); } else { fail++; console.log(`  ✘ ${msg}`); if (extra !== undefined) console.log(`      ${JSON.stringify(extra)}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── playwright-report.mjs (CLI) ────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'pudim-portal-'));
const root = join(tmp, 'projeto');
cpSync(join(FX, 'projeto'), root, { recursive: true });
const fake = join(FX, 'fake-playwright.mjs');
const runFake = (...a) => spawnSync(fake, a, { cwd: root, encoding: 'utf8', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: join(tmp, 'run.json') } });
spawnSync('sh', ['-c', `"${fake}" test --list --reporter=json > "${join(tmp, 'list.json')}"`], { cwd: root });
runFake('test', '--reporter=list,json');

const report = (...a) => {
  const r = spawnSync(process.execPath, [join(SCRIPTS, 'portal', 'playwright-report.mjs'), ...a], { encoding: 'utf8' });
  return { code: r.status, out: r.status === 0 ? JSON.parse(r.stdout) : null };
};
let r = report(join(tmp, 'run.json'), `--root=${root}`);
check(r.code === 0, 'relatório: exit 0');
check(JSON.stringify(r.out.resumo) === JSON.stringify({ total: 4, passou: 2, falhou: 1, instavel: 0, pulou: 0, naoRodou: 1 }),
  'relatório: 4 testes, passou 2, falhou 1, não rodou 1 (contagem exata)', r.out?.resumo);
const failed = r.out.testes.find((t) => t.status === 'falhou');
check(failed?.alvo === 'tests/carrinho.spec.ts:7', 'relatório: alvo arquivo:linha relativo à raiz', failed?.alvo);
check(failed?.describe.join('>') === 'Cupom' && failed?.titulo === 'recusa cupom vencido', 'relatório: describe e título separados');
check(failed?.erro.startsWith('Error: expect') && !failed.erro.includes('\u001b'), 'relatório: erro sem códigos de cor');
check(failed?.trace === 'test-results/cupom-vencido/trace.zip', 'relatório: caminho do trace relativo', failed?.trace);

r = report(join(tmp, 'list.json'), `--root=${root}`, '--lista');
check(r.out.totalTestes === 4 && r.out.totalArquivos === 2, 'lista: 4 testes em 2 arquivos', r.out && { t: r.out.totalTestes, a: r.out.totalArquivos });
check(r.out.arquivos[0].testes.map((t) => t.linha).join(',') === '3,6,7', 'lista: testes ordenados por linha');

r = report(join(tmp, 'nao-existe.json'));
check(r.code === 3, 'relatório ausente: exit 3');

// ── server.mjs ─────────────────────────────────────────────────────────────
const PORT = 4400 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [join(SCRIPTS, 'portal', 'server.mjs'), `--root=${root}`, `--port=${PORT}`], {
  env: { ...process.env, PUDIM_PLAYWRIGHT_BIN: fake }, stdio: ['ignore', 'pipe', 'pipe'],
});
let url = null;
server.stdout.on('data', (b) => { try { url = JSON.parse(b.toString().split('\n')[0]).url; } catch { /* ignora */ } });

function req(method, path, { body, host, headers = {} } = {}) {
  const u = new URL(url);
  return new Promise((ok) => {
    const rq = http.request({ host: u.hostname, port: u.port, path, method, headers: { host: host || u.host, 'content-type': 'application/json', ...headers } }, (res) => {
      let s = '';
      res.on('data', (c) => { s += c; });
      res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch { j = s; } ok({ status: res.statusCode, body: j, headers: res.headers }); });
    });
    rq.on('error', (e) => ok({ status: 0, body: e.message }));
    if (body) rq.write(JSON.stringify(body));
    rq.end();
  });
}
async function waitIdle() {
  for (let i = 0; i < 50; i++) {
    const info = await req('GET', '/api/info');
    if (!info.body.executando) return true;
    await sleep(100);
  }
  return false;
}

try {
  for (let i = 0; i < 50 && !url; i++) await sleep(100);
  check(Boolean(url), 'servidor: sobe e informa a URL', url);
  check(url?.startsWith('http://127.0.0.1:'), 'servidor: escuta só em 127.0.0.1');

  let res = await req('GET', '/api/info', { host: `evil.com:${new URL(url).port}` });
  check(res.status === 403, 'Host externo (DNS rebinding): 403', res.status);
  res = await req('GET', '/api/info', { host: `localhost:${new URL(url).port}` });
  check(res.status === 200 && res.body.projeto === 'loja-e2e', 'Host localhost: 200 com nome do projeto');

  res = await req('GET', '/api/testes');
  check(res.status === 200 && res.body.totalTestes === 4, 'lista: 4 testes', res.body.totalTestes);
  check(res.body.arquivos?.[0]?.testes.every((t) => t.status === 'nao_rodou'), 'lista: antes de rodar, tudo "nao_rodou"');

  res = await req('POST', '/api/executar', { body: { alvo: '--config=/etc/x' } });
  check(res.status === 400, 'alvo fora da lista (injeção de argumento): 400', res.status);

  res = await req('POST', '/api/executar', { body: { alvo: 'tests/carrinho.spec.ts', headed: true } });
  check(res.status === 202 && res.body.comando === 'npx playwright test tests/carrinho.spec.ts --reporter=list,json --headed',
    'executar arquivo com navegador visível: 202 e comando exato', res.body);
  check(await waitIdle(), 'execução termina');

  res = await req('GET', '/api/relatorio');
  check(res.body.codigoSaida === 1 && res.body.resumo?.falhou === 1 && res.body.resumo?.passou === 2, 'relatório: exit 1, 2 passaram, 1 falhou', res.body.resumo);
  check(typeof res.body.log === 'string' && res.body.log.includes('Running 3 tests'), 'relatório guarda o log (volta quando o portal é religado)');
  res = await req('GET', '/api/testes');
  const st = Object.fromEntries(res.body.arquivos.flatMap((a) => a.testes.map((t) => [t.alvo, t.status])));
  check(st['tests/carrinho.spec.ts:7'] === 'falhou' && st['tests/carrinho.spec.ts:3'] === 'passou' && st['tests/lento.spec.ts:2'] === 'nao_rodou',
    'lista: status de cada teste atualizado pela execução', st);

  res = await req('POST', '/api/executar', { body: { falhos: true } });
  check(res.status === 202 && res.body.comando === 'npx playwright test tests/carrinho.spec.ts:7 --reporter=list,json', 'só os que falharam: roda só o teste que falhou na última execução', res.body);
  check(await waitIdle(), 'só os que falharam: execução termina');
  res = await req('GET', '/api/testes');
  const st2 = Object.fromEntries(res.body.arquivos.flatMap((a) => a.testes.map((t) => [t.alvo, t.status])));
  check(st2['tests/carrinho.spec.ts:7'] === 'falhou', 'status por teste guarda o projeto do Playwright (chave id|chromium) e segue "falhou"', st2);
  res = await req('POST', '/api/executar', { body: { alvo: 'tests/lento.spec.ts' } });
  check(res.status === 202, 'executar teste lento: 202');
  res = await req('POST', '/api/executar', { body: { alvo: null } });
  check(res.status === 409, 'segunda execução ao mesmo tempo: 409', res.status);
  await sleep(300);
  res = await req('POST', '/api/parar', { body: {} });
  check(res.status === 200, 'parar: 200');
  check(await waitIdle(), 'parar: processo encerra em menos de 5 s');
  res = await req('GET', '/api/relatorio');
  check(res.body.parado === true, 'relatório marca a execução como parada');

  res = await req('GET', '/api/historico');
  check(res.body.execucoes?.length === 3, 'histórico: 3 execuções', res.body.execucoes?.length);
  check(readdirSync(join(root, '.qa', 'portal', 'execucoes')).filter((f) => f.endsWith('.json')).length === 3, 'grava em .qa/portal/execucoes/');

  res = await req('GET', '/relatorio');
  check(res.status === 404 && String(res.body).includes('Nenhum relatório'), 'relatório: 404 com orientação antes de gerar', res.status);
  res = await req('GET', '/relatorio?gerar=1');
  check(res.status === 200 && String(res.body).includes('BLOQUEADO') && String(res.body).includes('falhou em 1 de 3'),
    'relatório: gerar pelo portal mostra BLOQUEADO, "falhou em 1 de 3" (o teste que não rodou fica fora da conta)', res.status);
  check(existsSync(join(root, '.qa', 'relatorios', 'ultimo.html')), 'relatório: grava em .qa/relatorios/');

  // Arquivo corrompido no histórico não derruba o portal.
  writeFileSync(join(root, '.qa', 'portal', 'execucoes', '0000-00-00-000000.json'), '{"execucao":');
  res = await req('GET', '/api/historico');
  check(res.status === 200 && res.body.execucoes?.length === 3, 'JSON corrompido em execucoes/: ignorado, portal segue no ar', res.body);
  rmSync(join(root, '.qa', 'portal', 'execucoes', '0000-00-00-000000.json'));
  res = await req('GET', '/api/info', { headers: { 'sec-fetch-site': 'cross-site' } });
  check(res.status === 403, 'pedido de outro site (Sec-Fetch-Site: cross-site): 403', res.status);
  res = await req('GET', '/relatorio?gerar=1');
  check(String(res.headers?.['content-security-policy'] || '').includes("default-src 'none'"), 'relatório servido com Content-Security-Policy', res.headers);

  res = await req('GET', '/');
  check(res.status === 200 && String(res.body).includes('Portal de testes'), 'tela: GET / serve o HTML');
  res = await req('GET', '/../server.mjs');
  check(res.status === 404, 'tela: não serve arquivo fora de public/', res.status);

  // ── Vários alvos e afetados pelo git ──────────────────────────────────────
  res = await req('POST', '/api/executar', { body: { alvos: ['tests/carrinho.spec.ts:3', 'tests/carrinho.spec.ts:7'] } });
  check(res.status === 202 && res.body.comando === 'npx playwright test tests/carrinho.spec.ts:3 tests/carrinho.spec.ts:7 --reporter=list,json',
    'alvos[]: roda os dois testes num comando só', res.body);
  check(await waitIdle(), 'alvos[]: execução termina');
  res = await req('POST', '/api/executar', { body: { alvos: ['tests/carrinho.spec.ts', '--config=/etc/x'] } });
  check(res.status === 400, 'alvos[] com um alvo fora da lista: 400', res.status);
  res = await req('POST', '/api/executar', { body: { alvos: [] } });
  check(res.status === 400, 'alvos[] vazio não vira "rodar todos": 400', res.status);
  res = await req('GET', '/api/afetados');
  check(res.status === 400 && /git/.test(res.body.erro), 'afetados sem git: 400 explicando', res.body);
  const g = (...a) => spawnSync('git', ['-c', 'user.email=pudim@teste.local', '-c', 'user.name=pudim', ...a], { cwd: root });
  g('init', '-b', 'main'); g('add', '-A'); g('commit', '-m', 'base');
  appendFileSync(join(root, 'tests', 'carrinho.spec.ts'), '\n// mudança\n');
  res = await req('GET', '/api/afetados');
  check(res.status === 200 && res.body.alvos?.join() === 'tests/carrinho.spec.ts' && res.body.totalSpecs === 2,
    'afetados: só o spec alterado (1 de 2); .qa/ do portal não conta como mudança', res.body.alvos ?? res.body);
  res = await req('POST', '/api/executar', { body: { afetados: true } });
  check(res.status === 202 && res.body.comando === 'npx playwright test tests/carrinho.spec.ts --reporter=list,json', 'executar afetados: 202 e comando com a lista', res.body);
  check(await waitIdle(), 'afetados: execução termina');
  res = await req('GET', '/api/relatorio');
  check(res.body.selecao?.selecionados === 1 && res.body.selecao?.totalSpecs === 2, 'execução guarda a seleção (1 de 2)', res.body.selecao);
  g('commit', '-am', 'spec');
  res = await req('POST', '/api/executar', { body: { afetados: true } });
  check(res.status === 400 && /Nenhum teste/.test(res.body.erro), 'sem mudança: afetados recusa em vez de rodar tudo', res.body);

  const status = spawnSync(process.execPath, [join(SCRIPTS, 'portal', 'server.mjs'), `--root=${root}`, '--status'], { encoding: 'utf8' });
  check(JSON.parse(status.stdout).rodando === true, '--status: rodando');
  const plantado = mkdtempSync(join(tmpdir(), 'pudim-plantado-'));
  cpSync(join(FX, 'projeto'), plantado, { recursive: true });
  cpSync(join(root, '.qa'), join(plantado, '.qa'), { recursive: true });
  writeFileSync(join(plantado, '.qa', 'portal', 'servidor.json'), JSON.stringify({ pid: -1, url: 'http://127.0.0.1:1' }));
  const parar = spawnSync(process.execPath, [join(SCRIPTS, 'portal', 'server.mjs'), `--root=${plantado}`, '--parar'], { encoding: 'utf8' });
  check(JSON.parse(parar.stdout).rodando === false && !JSON.parse(parar.stdout).parado, 'servidor.json plantado com pid -1: --parar não mata nada', parar.stdout);
  rmSync(plantado, { recursive: true, force: true });
  spawnSync(process.execPath, [join(SCRIPTS, 'portal', 'server.mjs'), `--root=${root}`, '--parar'], { encoding: 'utf8' });
  for (let i = 0; i < 30 && existsSync(join(root, '.qa', 'portal', 'servidor.json')); i++) await sleep(100);
  check(!existsSync(join(root, '.qa', 'portal', 'servidor.json')), '--parar: desliga e apaga servidor.json');
} finally {
  server.kill('SIGKILL');
  rmSync(tmp, { recursive: true, force: true });
}

const nopkg = spawnSync(process.execPath, [join(SCRIPTS, 'portal', 'server.mjs'), `--root=${join(FX, 'nao-existe')}`], { encoding: 'utf8' });
check(nopkg.status === 2, 'sem package.json: exit 2', nopkg.status);

console.log(`RESULTADO ${pass} ${fail}`);
