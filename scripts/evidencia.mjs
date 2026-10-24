#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Pacote de evidência de um bug: junta numa pasta só tudo que o Pudim já guardou em
//   .qa/ sobre ele (relato da investigação, registro feito ao criar testes, teste que reproduz,
//   screenshot e trace do Playwright, histórico do arquivo citado) e escreve um pacote.md pronto
//   para entregar ao time de desenvolvimento.
//   node evidencia.mjs --bug=<termo> [--root=.] [--json]
//   node evidencia.mjs --listar [--root=.] [--json]
// Fontes (só leitura): .qa/investigacoes/*.md · .qa/execucoes/*-criar-*/{possiveis-bugs.md,bugs/,
//   resultado.json,repeticao.json} · .qa/portal/execucoes/*.json
// Destino: .qa/evidencias/<AAAA-MM-DD>-<slug>/ (pacote.md, relato.md, registro-criacao.md,
//   teste/, anexos/). Nada do produto é lido além de `git log`/`git blame` do arquivo citado.
// Exit: 0 ok · 2 uso errado · 3 pasta do projeto não existe · 4 nenhum bug encontrado · 5 termo ambíguo
// =============================================================================
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arvore, c, cabecalho, erro, ok, plural, regua, titulo } from './ui.mjs';

const ls = (d) => (existsSync(d) ? readdirSync(d).sort() : []);
const readText = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null);
const readJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
const RESOLVIDO = /^\s*Resolvid[oa]:\s*(sim|yes|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/im;
const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'o', 'a', 'os', 'as', 'em', 'no', 'na', 'nos', 'nas', 'que', 'um', 'uma', 'para', 'com', 'e', 'ou', 'ao', 'se', 'por', 'the', 'and', 'of', 'to', 'is', 'não', 'nao', 'sem', 'mais', 'menos', 'quando', 'como', 'teste', 'test', 'spec', 'bug', 'erro']);

// "Taxa do boleto vira texto" → ["taxa","boleto","vira","texto"]: sem acento, sem palavra vazia.
export function tokens(s) {
  return [...new Set(String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t)))];
}
export const slug = (s) => tokens(s).slice(0, 6).join('-') || 'bug';
const comum = (a, b) => a.filter((t) => b.includes(t)).length;
// Um texto "fala do bug" quando compartilha ao menos 2 tokens com o título (ou 1, se o título só tem 1).
const fala = (toks, texto) => comum(toks, tokens(texto)) >= Math.min(2, toks.length) && toks.length > 0;

const linha = (t, re) => (t.match(re) || [])[1]?.trim() || null;
const campo = (t, nome) => linha(t, new RegExp(`^\\s*\\**${nome}\\**:\\**\\s*(.+)$`, 'im'));
const CAMINHO = /(?:^|[\s(`'"])((?:[\w.-]+\/)*[\w.-]+\.(?:[cm]?[jt]sx?|vue|svelte))(?::(\d+))?/g;

// Caminhos "src/x/y.ts:12" citados num texto (fora de .qa/ e de node_modules).
export function caminhosCitados(texto) {
  const out = new Map();
  for (const m of String(texto || '').matchAll(CAMINHO)) {
    const p = m[1].replace(/^\.\//, '');
    if (/^\.qa\/|node_modules\/|^test-results\//.test(p) || /\.(test|spec)\./.test(p)) continue;
    if (!out.has(p) || (!out.get(p) && m[2])) out.set(p, m[2] ? Number(m[2]) : null);
  }
  return [...out.entries()].map(([arquivo, linha]) => ({ arquivo, linha }));
}

// Índice dos bugs conhecidos. Investigação e registro de criação com o mesmo título viram um só.
export function indexar(root) {
  const qa = join(root, '.qa');
  const bugs = [];
  const acha = (tit) => bugs.find((b) => b.chave === tokens(tit).join(' '));
  const novo = (tit) => { const b = { titulo: tit, chave: tokens(tit).join(' '), fontes: [], classificacao: null, frequencia: null, resolvido: false, investigacao: null, registro: null, execucoes: [] }; bugs.push(b); return b; };

  for (const f of ls(join(qa, 'investigacoes')).filter((x) => x.endsWith('.md'))) {
    const t = readText(join(qa, 'investigacoes', f)) || '';
    const tit = campo(t, 'T[íi]tulo') || campo(t, 'O que aconteceu') || f.replace(/\.md$/, '');
    const b = acha(tit) || novo(tit);
    b.investigacao = { arquivo: `.qa/investigacoes/${f}`, texto: t };
    b.classificacao = linha(t, /classifica[çc][ãa]o:\s*\**([^*\n—]+?)\**\s*$/im) || b.classificacao;
    b.frequencia = campo(t, 'Frequ[êe]ncia') || b.frequencia;
    b.resolvido = b.resolvido || RESOLVIDO.test(t);
    b.fontes.push(`.qa/investigacoes/${f}`);
  }
  const execs = ls(join(qa, 'execucoes')).filter((d) => /-criar-(unitario|e2e)$/.test(d));
  for (const d of execs) {
    const t = readText(join(qa, 'execucoes', d, 'possiveis-bugs.md'));
    if (!t) continue;
    for (const bloco of t.split(/^(?=##\s)/m)) {
      const m = bloco.match(/^##\s+(.+)$/m);
      if (!m) continue;
      const tit = m[1].trim();
      const b = acha(tit) || novo(tit);
      b.registro = { arquivo: `.qa/execucoes/${d}/possiveis-bugs.md`, texto: bloco.trim(), execucao: d };
      b.frequencia = b.frequencia || linha(bloco, /falhou em \d+ de \d+/i) && (bloco.match(/falhou em \d+ de \d+/i) || [])[0];
      b.resolvido = b.resolvido || RESOLVIDO.test(bloco);
      if (!b.execucoes.includes(d)) b.execucoes.push(d);
      b.fontes.push(`.qa/execucoes/${d}/possiveis-bugs.md`);
    }
  }
  for (const b of bugs) b.classificacao = b.classificacao || (b.registro ? 'Possível bug (ao criar testes)' : 'Não informada');
  return bugs;
}

// Testes falhos de um JSON do Playwright que falam do bug (título, describe ou arquivo).
function falhasDe(json, toks) {
  const testes = json?.testes || [];
  return testes.filter((t) => ['falhou', 'instavel'].includes(t.status) && fala(toks, [t.titulo, ...(t.describe || []), t.arquivo].join(' ')));
}
async function lerPlaywright(file, root) {
  const raw = readJson(file);
  if (!raw) return null;
  if (raw.testes) return raw; // já no formato do Pudim (portal)
  if (raw.suites) { const { parseReport } = await import('./portal/playwright-report.mjs'); return parseReport(raw, root); }
  return null;
}

function git(root, args) {
  try { return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
}
// Para cada arquivo citado: quem mexeu na linha (blame) e os últimos 3 commits do arquivo.
export function historico(root, citados) {
  const out = [];
  for (const { arquivo, linha: n } of citados.slice(0, 3)) {
    if (!existsSync(join(root, arquivo))) continue;
    const item = { arquivo, linha: n, blame: null, commits: [] };
    if (n) {
      const b = git(root, ['blame', '-L', `${n},${n}`, '--date=short', '--', arquivo]);
      if (b) item.blame = b.split('\n')[0];
    }
    const log = git(root, ['log', '-n', '3', '--date=short', '--format=%h %ad %an · %s', '--', arquivo]);
    if (log) item.commits = log.split('\n').filter(Boolean);
    if (item.blame || item.commits.length) out.push(item);
  }
  return out;
}

function hoje(agora = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}
function copiar(src, destDir, nome) {
  mkdirSync(destDir, { recursive: true });
  let dest = join(destDir, nome);
  for (let i = 2; existsSync(dest); i++) dest = join(destDir, `${basename(nome, extname(nome))}-${i}${extname(nome)}`);
  copyFileSync(src, dest);
  return dest;
}
// Primeira linha de comentário com um comando de teste ("// npx playwright test …").
const comandoNoTopo = (texto) => (String(texto || '').split('\n').slice(0, 10).map((l) => l.replace(/^\s*(\/\/|#|\*|\/\*)\s*/, '').trim()).find((l) => /^(npx|pnpm|yarn|bunx|npm|node)\b/.test(l)) || null);

// Monta o pacote. Devolve {pasta, arquivos[], faltando[], anexos[], historico[]}.
export async function montar(root, bug, { agora = new Date() } = {}) {
  const qa = join(root, '.qa');
  const toks = tokens(bug.titulo);
  const rel = `.qa/evidencias/${hoje(agora)}-${slug(bug.titulo)}`;
  const pasta = join(root, rel);
  // Rodar de novo no mesmo dia regrava o pacote: as cópias antigas de teste/ e anexos/ saem antes.
  for (const sub of ['teste', 'anexos']) rmSync(join(pasta, sub), { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  const arquivos = [];
  const faltando = [];
  const relRoot = (p) => relative(root, p).split('\\').join('/');
  const relPasta = (p) => relative(pasta, p).split('\\').join('/');

  if (bug.investigacao) { writeFileSync(join(pasta, 'relato.md'), bug.investigacao.texto); arquivos.push(`${rel}/relato.md`); }
  if (bug.registro) { writeFileSync(join(pasta, 'registro-criacao.md'), `${bug.registro.texto}\n\nFonte: ${bug.registro.arquivo}\n`); arquivos.push(`${rel}/registro-criacao.md`); }

  // Teste que reproduz: arquivos em bugs/ das execuções do registro que falam do bug.
  const testes = [];
  for (const d of bug.execucoes) {
    const dir = join(qa, 'execucoes', d, 'bugs');
    const todos = ls(dir).filter((f) => statSync(join(dir, f)).isFile());
    let sel = todos.filter((f) => fala(toks, `${f} ${readText(join(dir, f))}`));
    let nota = null;
    if (!sel.length && todos.length) { sel = todos; nota = 'não deu para ligar o arquivo ao título do bug; foram todos os testes guardados nesta execução'; }
    for (const f of sel) {
      const dest = copiar(join(dir, f), join(pasta, 'teste'), f);
      testes.push({ arquivo: relPasta(dest), origem: `.qa/execucoes/${d}/bugs/${f}`, comando: comandoNoTopo(readText(join(dir, f))), nota });
      arquivos.push(relRoot(dest));
    }
  }

  // Anexos do Playwright: screenshot e trace dos testes falhos que falam do bug.
  const anexos = [];
  const fontesPw = [];
  for (const d of bug.execucoes) for (const f of ['resultado.json', 'repeticao.json']) fontesPw.push({ file: join(qa, 'execucoes', d, f), origem: `.qa/execucoes/${d}/${f}` });
  for (const f of ls(join(qa, 'portal', 'execucoes')).filter((x) => x.endsWith('.json')).slice(-10)) fontesPw.push({ file: join(qa, 'portal', 'execucoes', f), origem: `.qa/portal/execucoes/${f}` });
  const vistos = new Set();
  const copiados = new Map(); // mesmo arquivo citado por duas execuções entra uma vez só
  for (const { file, origem } of fontesPw) {
    const json = await lerPlaywright(file, root);
    if (!json) continue;
    for (const t of falhasDe(json, toks)) {
      const chave = `${t.alvo}|${t.erro}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const item = { alvo: t.alvo, titulo: t.titulo, origem, erro: t.erro || null, screenshot: null, trace: null };
      for (const k of ['screenshot', 'trace']) {
        if (!t[k]) continue;
        const src = resolve(root, t[k]);
        if (copiados.has(src)) { item[k] = copiados.get(src); continue; }
        if (existsSync(src)) { const dest = copiar(src, join(pasta, 'anexos'), `${slug(t.titulo)}-${basename(src)}`); item[k] = relPasta(dest); copiados.set(src, item[k]); arquivos.push(relRoot(dest)); }
        else if (!copiados.has(`falta:${src}`)) { copiados.set(`falta:${src}`, null); faltando.push(`${k} de "${t.titulo}": ${t[k]} (não existe mais; rode o teste de novo para gerar)`); }
      }
      anexos.push(item);
    }
  }

  const textoBase = [bug.investigacao?.texto, bug.registro?.texto].filter(Boolean).join('\n');
  const citados = caminhosCitados(textoBase);
  const hist = historico(root, citados);
  const info = { bug, rel, testes, anexos, hist, citados, faltando, agora };
  writeFileSync(join(pasta, 'pacote.md'), pacoteMd(info));
  arquivos.unshift(`${rel}/pacote.md`);
  return { pasta: rel, arquivos, faltando, anexos, testes, historico: hist, citados };
}

// Tira a indentação comum das linhas (a primeira já vem sem, por ficar depois de "Chave:").
export function dedent(texto) {
  const linhas = String(texto || '').trim().split('\n');
  const resto = linhas.slice(1).filter((l) => l.trim());
  const ind = resto.length ? Math.min(...resto.map((l) => l.match(/^\s*/)[0].length)) : 0;
  return [linhas[0].trim(), ...linhas.slice(1).map((l) => l.slice(ind))].join('\n');
}

// O texto que vai para o dev. Só repete o que já está nas fontes; nada é inventado aqui.
export function pacoteMd({ bug, rel, testes, anexos, hist, citados, faltando, agora }) {
  const inv = bug.investigacao?.texto || '';
  const reg = bug.registro?.texto || '';
  const pega = (nome) => campo(inv, nome) || campo(reg, nome);
  const bloco = (nome) => {
    // "Passos para reproduzir:" pode ser multilinha: pega até a próxima linha "Chave:" ou vazia dupla.
    const m = (inv || reg).match(new RegExp(`^\\s*\\**${nome}\\**:\\**[ \\t]*(.*(?:\\n(?!\\s*\\**[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\\wáéíóúâêôãõç ]{1,30}\\**:).*)*)`, 'im'));
    return m ? dedent(m[1]) : null;
  };
  const L = [];
  L.push(`# ${bug.titulo}`, '');
  L.push(`Pacote de evidência gerado pelo Pudim em ${agora.toLocaleDateString('pt-BR')} ${agora.toTimeString().slice(0, 5)}, só com o que está em \`.qa/\`.`, '');
  L.push('## Resumo', '');
  L.push(`- **Classificação:** ${bug.classificacao}${bug.resolvido ? ' (marcado como resolvido)' : ''}`);
  if (bug.frequencia) L.push(`- **Frequência:** ${bug.frequencia}`);
  const onde = pega('Onde') || (citados.length ? citados.map((x) => (x.linha ? `${x.arquivo}:${x.linha}` : x.arquivo)).join(', ') : null);
  if (onde) L.push(`- **Onde:** ${onde}`);
  const commit = pega('Commit suspeito');
  if (commit) L.push(`- **Commit suspeito:** ${commit}`);
  L.push('');
  const passos = bloco('Passos para reproduzir') || bloco('Passos');
  if (passos) L.push('## Passos para reproduzir', '', passos, '');
  const esperado = bloco('Esperado');
  const obtido = bloco('Obtido');
  if (esperado || obtido) {
    L.push('## Esperado × obtido', '');
    if (esperado) L.push(`- **Esperado:** ${esperado}`);
    if (obtido) L.push(`- **Obtido:** ${obtido}`);
    L.push('');
  }
  const trecho = (inv.match(/^\s*\**Trecho\**:\**\s*\n+```[\s\S]*?```/im) || [])[0];
  if (trecho) L.push('## Trecho', '', trecho.replace(/^\s*\**Trecho\**:\**\s*\n+/i, ''), '');
  if (testes.length) {
    L.push('## Teste que reproduz', '');
    for (const t of testes) {
      L.push(`- \`${t.arquivo}\` (origem: \`${t.origem}\`)${t.nota ? ` — ${t.nota}` : ''}`);
      if (t.comando) L.push(`  - Rodar: \`${t.comando}\``);
    }
    L.push('', 'O teste está guardado como falha esperada (`test.failing` / `test.fail()`). Quando a correção entrar, basta tirar essa marca e movê-lo para a suíte.', '');
  }
  if (anexos.length) {
    L.push('## Execuções que falharam (Playwright)', '');
    for (const a of anexos) {
      L.push(`- **${a.titulo}** · \`${a.alvo}\` · fonte: \`${a.origem}\``);
      if (a.erro) L.push('', '  ```text', ...a.erro.split('\n').slice(0, 12).map((l) => `  ${l}`), '  ```', '');
      if (a.screenshot) L.push(`  - Screenshot: \`${a.screenshot}\``);
      if (a.trace) L.push(`  - Trace: \`${a.trace}\` → \`npx playwright show-trace ${rel}/${a.trace}\``);
    }
    L.push('');
  }
  if (hist.length) {
    L.push('## Histórico do arquivo citado (git)', '');
    for (const h of hist) {
      L.push(`- \`${h.arquivo}${h.linha ? `:${h.linha}` : ''}\``);
      if (h.blame) L.push(`  - Linha ${h.linha}: \`${h.blame}\``);
      for (const cm of h.commits) L.push(`  - ${cm}`);
    }
    L.push('');
  }
  if (inv) {
    const evid = (inv.match(/^\s*\**Evid[êe]ncias\**:?\**\s*\n([\s\S]*?)(?=^\s*\**(Cinco porqu[êe]s|Hip[óo]teses)|\n{2,}\S*:|$(?![\s\S]))/im) || [])[1];
    if (evid?.trim()) L.push('## Evidências da investigação', '', dedent(evid), '');
  }
  if (faltando.length) L.push('## O que não foi possível anexar', '', ...faltando.map((f) => `- ${f}`), '');
  L.push('## Fontes', '', ...bug.fontes.map((f) => `- \`${f}\``), '');
  L.push('---', 'Gerado por `/pudim:evidencia`. O Pudim não altera o código do produto; este pacote só reúne o que já foi medido.');
  return `${L.join('\n')}\n`;
}

// Procura o bug pelo termo: título, slug ou arquivo das fontes. Vários diferentes → ambíguo.
export function procurar(bugs, termo) {
  const t = tokens(termo);
  const txt = String(termo || '').toLowerCase();
  if (!t.length && !txt) return [];
  return bugs.filter((b) => {
    if (b.titulo.toLowerCase().includes(txt)) return true;
    if (b.fontes.some((f) => f.toLowerCase().includes(txt))) return true;
    return t.length > 0 && t.every((k) => b.chave.split(' ').includes(k));
  });
}

export function painel(root, r, bug) {
  const L = [...cabecalho('evidência', basename(root))];
  L.push(` 🧾 ${c.ouro(bug.titulo, { bold: true })}`);
  L.push(` ${c.suave('Classificação')}  ${/bug no produto/i.test(bug.classificacao) ? c.falha(bug.classificacao) : c.ambar(bug.classificacao)}${bug.resolvido ? c.suave('  · resolvido') : ''}`);
  if (bug.frequencia) L.push(` ${c.suave('Frequência')}     ${bug.frequencia}`);
  L.push('', titulo('📦', `Pacote em ${r.pasta}/`));
  L.push(...arvore(r.arquivos.map((a) => ok(relative(r.pasta, a).split('\\').join('/')))));
  if (r.faltando.length) { L.push('', titulo('⚠️ ', 'Não anexado')); L.push(...arvore(r.faltando.map((f) => erro(f)))); }
  L.push(regua(), ` ${c.suave(`${plural(r.arquivos.length, 'arquivo')} · ${plural(r.anexos.length, 'execução falha', 'execuções falhas')} · ${plural(r.historico.length, 'arquivo com histórico', 'arquivos com histórico')}`)}`);
  L.push(` ${c.suave('Entregue ao dev:')} ${c.ouro(`${r.pasta}/pacote.md`)}`);
  return L;
}

export function painelLista(root, bugs) {
  const L = [...cabecalho('evidência', basename(root))];
  if (!bugs.length) { L.push(` ${c.suave('Nenhum bug registrado em .qa/ (investigações ou possiveis-bugs.md).')}`); return L; }
  L.push(titulo('🧾', plural(bugs.length, 'bug conhecido', 'bugs conhecidos')));
  L.push(...arvore(bugs.map((b) => `${b.resolvido ? c.bom('✔') : /bug no produto/i.test(b.classificacao) ? c.falha('●') : c.ambar('●')} ${b.titulo} ${c.suave(`· ${b.classificacao}${b.frequencia ? ` · ${b.frequencia}` : ''}`)}`)));
  L.push(regua(), ` ${c.suave('Monte o pacote com')} ${c.ouro('--bug=<parte do título>')}`);
  return L;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3) || null;
  const json = args.includes('--json');
  const root = resolve(opt('root') || '.');
  if (!existsSync(root) || !statSync(root).isDirectory()) { console.error(`Pasta não encontrada: ${root}`); process.exit(3); }
  const bugs = indexar(root);
  if (args.includes('--listar')) {
    if (json) console.log(JSON.stringify({ bugs: bugs.map(({ investigacao, registro, ...b }) => ({ ...b, investigacao: investigacao?.arquivo || null, registro: registro?.arquivo || null })) }, null, 2));
    else console.log(painelLista(root, bugs).join('\n'));
    process.exit(0);
  }
  const termo = opt('bug');
  if (!termo) { console.error('Uso: evidencia.mjs --bug=<termo> [--root=.] [--json] | --listar'); process.exit(2); }
  const achados = procurar(bugs, termo);
  if (!achados.length) {
    if (json) console.log(JSON.stringify({ erro: 'nenhum bug encontrado', termo, conhecidos: bugs.map((b) => b.titulo) }));
    else console.error(`Nenhum bug em .qa/ bate com "${termo}". Conhecidos: ${bugs.map((b) => b.titulo).join(' · ') || 'nenhum'}`);
    process.exit(4);
  }
  if (achados.length > 1) {
    if (json) console.log(JSON.stringify({ erro: 'termo ambíguo', termo, candidatos: achados.map((b) => b.titulo) }));
    else console.error(`"${termo}" bate com ${achados.length} bugs; seja mais específico:\n${achados.map((b) => `  · ${b.titulo}`).join('\n')}`);
    process.exit(5);
  }
  const bug = achados[0];
  const r = await montar(root, bug);
  if (json) console.log(JSON.stringify({ bug: { titulo: bug.titulo, classificacao: bug.classificacao, frequencia: bug.frequencia, resolvido: bug.resolvido, fontes: bug.fontes }, ...r }, null, 2));
  else console.log(painel(root, r, bug).join('\n'));
}
