#!/usr/bin/env node
// =============================================================================
// 🍮 Pudim — Filtro de teste falso. Lê arquivos de teste (Jest, Vitest, Playwright) e recusa
// teste que não testa nada. Análise estática, sem executar e sem dependências.
//   node test-quality.mjs <arquivo...> [--json]
// Motivos de recusa:
//   sem_verificacao  nenhum expect/assert no teste (nem num helper do mesmo arquivo)
//   so_existencia    só toBeTruthy/toBeDefined/toBeFalsy/not.toBeNull/not.toBeUndefined
//   so_snapshot      só toMatchSnapshot/toMatchInlineSnapshot
//   pulado           skip, todo, fixme, xit/xtest ou test.skip() sem condição
//   foco             only/fit (faz o resto da suíte não rodar)
//   mock_do_alvo     jest.mock/vi.mock do próprio módulo que o arquivo testa
// Limite conhecido: verificação dentro de Page Object de OUTRO arquivo não é vista (o teste aparece
// como sem_verificacao). Nos testes que o Pudim cria, o expect fica sempre no corpo do teste.
// Exit: 0 todos aprovados · 1 algum recusado · 3 arquivo ausente ou nenhum arquivo
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MOTIVOS = {
  sem_verificacao: 'sem verificação (nenhum expect ou assert)',
  so_existencia: 'só verifica que existe (toBeTruthy/toBeDefined)',
  so_snapshot: 'só compara snapshot',
  pulado: 'pulado (skip/todo/fixme)',
  foco: 'com foco (only), esconde o resto da suíte',
  mock_do_alvo: 'faz mock do próprio módulo que testa',
};

// Troca comentários e conteúdo de strings/regex por espaços, mantendo posições e quebras de linha.
export function mask(src) {
  const out = src.split('');
  const blank = (i) => { if (out[i] !== '\n') out[i] = ' '; };
  let i = 0;
  let lastSignificant = '';
  const regexAllowedAfter = '(,=:[!&|?{};+-*%<>~^';
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') blank(i++);
      continue;
    }
    if (c === '/' && n === '*') {
      blank(i++); blank(i++);
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) blank(i++);
      if (i < src.length) { blank(i++); blank(i++); }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') { blank(i++); }
        if (i < src.length) blank(i++);
      }
      i++;
      lastSignificant = c;
      continue;
    }
    if (c === '/' && (lastSignificant === '' || regexAllowedAfter.includes(lastSignificant))) {
      i++;
      let inClass = false;
      while (i < src.length && src[i] !== '\n' && (inClass || src[i] !== '/')) {
        if (src[i] === '\\') blank(i++);
        else if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        if (i < src.length) blank(i++);
      }
      i++;
      lastSignificant = '/';
      continue;
    }
    if (!/\s/.test(c)) lastSignificant = /[\w$)\]]/.test(c) ? 'x' : c;
    i++;
  }
  return out.join('');
}

// Posição do parêntese/chave que fecha o que abre em `open`.
function matchClose(code, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const stack = [];
  for (let i = open; i < code.length; i++) {
    const ch = code[i];
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === ')' || ch === '}' || ch === ']') {
      if (stack.pop() !== ch) return -1;
      if (!stack.length) return i;
    }
  }
  return -1;
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;
const NOT_A_TEST = new Set(['describe', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'use', 'extend', 'step', 'info',
  'setTimeout', 'slow', 'expect', 'configure', 'parallel', 'serial']);
const EXISTENCE = new Set(['toBeTruthy', 'toBeDefined', 'toBeFalsy', 'not.toBeNull', 'not.toBeUndefined']);
const SNAPSHOT = new Set(['toMatchSnapshot', 'toMatchInlineSnapshot']);

// Matchers usados em um trecho: ["toBe", "not.toBeNull", ...]
function matchersIn(code) {
  const found = [];
  const re = /\bexpect(?:\s*\.\s*(?:soft|poll))?\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const close = matchClose(code, m.index + m[0].length - 1);
    if (close < 0) break;
    const tail = code.slice(close + 1).match(/^((?:\s*\.\s*(?:not|resolves|rejects))*)\s*\.\s*(\w+)/);
    if (tail) found.push(`${/\bnot\b/.test(tail[1]) ? 'not.' : ''}${tail[2]}`);
    re.lastIndex = close + 1;
  }
  return found;
}
const hasAssert = (code) => /\bassert(?:\s*\.\s*\w+)?\s*\(/.test(code) || /\bexpect\s*\.\s*assertions\s*\(\s*[1-9]/.test(code);

// Funções do próprio arquivo que contêm expect (helpers de verificação).
function verifyingHelpers(code) {
  const names = new Set();
  const re = /\b(?:async\s+)?function\s+(\w+)\s*\(|\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/g;
  let m;
  while ((m = re.exec(code))) {
    const name = m[1] || m[2];
    const brace = code.indexOf('{', m.index + m[0].length - 1);
    if (brace < 0) continue;
    const end = matchClose(code, brace);
    if (end > 0 && (matchersIn(code.slice(brace, end)).length || hasAssert(code.slice(brace, end)))) names.add(name);
  }
  return names;
}

// Módulo que o arquivo testa: o import cujo nome bate com o do arquivo de teste.
function targetMocked(src, code, file) {
  const base = basename(file).replace(/\.(test|spec)\.[cm]?[jt]sx?$/, '');
  const specs = [];
  const reImp = /\b(?:require|import)\s*\(\s*(['"])([^'"]+)\1\s*\)|\bfrom\s*(['"])([^'"]+)\3/g;
  let m;
  while ((m = reImp.exec(src))) if (code[m.index] !== ' ') specs.push(m[2] || m[4]);
  const stem = (p) => {
    const parts = p.replace(/\.[cm]?[jt]sx?$/, '').split('/');
    const last = parts[parts.length - 1];
    return last === 'index' ? parts[parts.length - 2] : last;
  };
  const target = specs.find((s) => s.startsWith('.') && stem(s) === base);
  if (!target) return false;
  const norm = (p) => resolve(dirname(file), p).replace(/\.[cm]?[jt]sx?$/, '').replace(/\/index$/, '');
  const reMock = /\b(?:jest|vi)\s*\.\s*(?:mock|doMock)\s*\(\s*(['"])([^'"]+)\1/g;
  while ((m = reMock.exec(src))) {
    if (code[m.index] === ' ') continue; // está em comentário
    if (!m[2].startsWith('.') || norm(m[2]) !== norm(target)) continue;
    // Mock parcial (mantém o módulo real e troca só uma parte) é aceito.
    const close = matchClose(code, src.indexOf('(', m.index));
    const call = src.slice(m.index, close + 1);
    if (/requireActual|importActual/.test(call)) continue;
    return true;
  }
  return false;
}

export function analyzeSource(src, file = 'teste.test.js') {
  const code = mask(src);
  const helpers = verifyingHelpers(code);
  const mockAlvo = targetMocked(src, code, file);
  const testes = [];
  const re = /\b(it|test|xit|xtest|fit)\b((?:\s*\.\s*\w+)*)\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > 0 && /[.\w$]/.test(code[m.index - 1])) continue;
    const chain = m[2].split('.').map((s) => s.trim()).filter(Boolean);
    if (chain.some((c) => NOT_A_TEST.has(c))) continue;
    let open = m.index + m[0].length - 1;
    if (chain.includes('each')) {
      // test.each(tabela)(titulo, fn): pula a tabela.
      const tableEnd = matchClose(code, open);
      const next = code.slice(tableEnd + 1).match(/^\s*\(/);
      if (tableEnd < 0 || !next) continue;
      open = tableEnd + next[0].length;
    }
    const close = matchClose(code, open);
    if (close < 0) continue;
    const body = code.slice(open, close + 1);
    // test.skip(condição, 'motivo') e test.fixme(condição) do Playwright são anotações, não testes:
    // teste de verdade sempre recebe uma função (exceto test.todo).
    if (!chain.includes('todo') && !/=>|\bfunction\b/.test(body)) continue;
    const titleMatch = src.slice(open + 1, close).match(/^\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/);
    const titulo = titleMatch ? titleMatch[2] : '(sem título)';
    const motivos = [];
    const name = m[1];
    if (chain.includes('only') || name === 'fit') motivos.push('foco');
    const conditionalSkip = /\btest\s*\.\s*(?:skip|fixme)\s*\(\s*\)/.test(body);
    if (chain.some((c) => c === 'skip' || c === 'todo' || c === 'fixme') || name === 'xit' || name === 'xtest' || conditionalSkip) {
      motivos.push('pulado');
    }
    if (!chain.includes('todo')) {
      const matchers = matchersIn(body);
      const usesHelper = [...helpers].some((h) => new RegExp(`\\b${h}\\s*\\(`).test(body));
      if (!matchers.length && !hasAssert(body) && !usesHelper) motivos.push('sem_verificacao');
      else if (matchers.length && !usesHelper && !hasAssert(body)) {
        if (matchers.every((x) => EXISTENCE.has(x))) motivos.push('so_existencia');
        else if (matchers.every((x) => SNAPSHOT.has(x))) motivos.push('so_snapshot');
      }
    }
    if (mockAlvo) motivos.push('mock_do_alvo');
    testes.push({ titulo, linha: lineOf(src, m.index), ok: motivos.length === 0, motivos });
    re.lastIndex = open + 1; // continua dentro do corpo (testes não se aninham, mas describe sim)
  }
  return testes;
}

export function analyzeFiles(files) {
  const arquivos = files.map((f) => ({ arquivo: f, testes: analyzeSource(readFileSync(f, 'utf8'), resolve(f)) }));
  const all = arquivos.flatMap((a) => a.testes);
  const porMotivo = {};
  for (const t of all) for (const mo of t.motivos) porMotivo[mo] = (porMotivo[mo] || 0) + 1;
  return { arquivos, total: all.length, aprovados: all.filter((t) => t.ok).length, recusados: all.filter((t) => !t.ok).length, porMotivo };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--'));
  const missing = files.filter((f) => !existsSync(f));
  if (!files.length || missing.length) {
    console.error(files.length ? `Arquivo não encontrado: ${missing.join(', ')}` : 'Uso: node test-quality.mjs <arquivo...> [--json]');
    process.exit(3);
  }
  const r = analyzeFiles(files);
  if (args.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Qualidade dos testes: ${r.aprovados} de ${r.total} aprovados, ${r.recusados} recusados`);
    for (const a of r.arquivos) {
      for (const t of a.testes) {
        if (!t.ok) console.log(`  ✘ ${a.arquivo}:${t.linha}  "${t.titulo}": ${t.motivos.map((x) => MOTIVOS[x]).join('; ')}`);
      }
    }
  }
  process.exit(r.recusados ? 1 : 0);
}
