// =============================================================================
// 🍮 Pudim — Visual do terminal: paleta caramelo/âmbar/ouro, barras, setas e árvore.
// Sem dependências. Cor só em terminal de verdade: some com NO_COLOR, fora de TTY e em
// TERM=dumb; FORCE_COLOR=1|2|3 força (16 cores, 256 cores, truecolor).
// Os números que entram aqui já vêm calculados; o módulo só desenha.
// =============================================================================

// [truecolor, 256 cores, 16 cores]
const PALETTE = {
  caramelo: [[200, 116, 26], 172, 33],   // marca: calda do pudim
  ambar: [[240, 168, 48], 214, 93],      // barras e destaques
  ouro: [[246, 210, 139], 222, 93],      // creme: títulos e números
  bom: [[123, 196, 127], 114, 32],
  aviso: [[240, 168, 48], 214, 33],
  falha: [[224, 97, 75], 167, 31],       // calda queimada
  suave: [[138, 127, 114], 244, 90],     // cinza quente: trilho da barra, rótulos
};

export function colorLevel(env = process.env, stream = process.stdout) {
  if ('NO_COLOR' in env && env.NO_COLOR !== '') return 0;
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '') {
    const n = Number(env.FORCE_COLOR);
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 2;
  }
  if (!stream || !stream.isTTY || env.TERM === 'dumb') return 0;
  if (/^(truecolor|24bit)$/i.test(env.COLORTERM || '')) return 3;
  return /256/.test(env.TERM || '') ? 2 : 1;
}

let LEVEL = colorLevel();
export const setColorLevel = (n) => { LEVEL = n; };

export function paint(tom, s, { bold = false } = {}) {
  s = String(s);
  if (!LEVEL || !s) return s;
  const p = PALETTE[tom];
  if (!p) return bold ? `\x1b[1m${s}\x1b[22m` : s;
  const open = LEVEL === 3 ? `38;2;${p[0].join(';')}` : LEVEL === 2 ? `38;5;${p[1]}` : String(p[2]);
  return `\x1b[${bold ? '1;' : ''}${open}m${s}\x1b[0m`;
}
export const c = Object.fromEntries(Object.keys(PALETTE).map((t) => [t, (s, o) => paint(t, s, o)]));
export const bold = (s) => paint(null, s, { bold: true });

// Largura visível: sem ANSI, emoji conta 2 colunas.
// Remove CSI (cores), OSC (hyperlink, área de transferência) e caracteres de controle: texto
// vindo do repositório alvo (títulos de teste) não pode mandar comandos para o terminal.
const ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|[\x00-\x08\x0b-\x1f\x7f]/g;
export const stripAnsi = (s) => String(s).replace(ANSI_RE, '');
export function width(s) {
  let w = 0;
  for (const ch of stripAnsi(s)) {
    if (/\p{Extended_Pictographic}/u.test(ch)) w += 2;
    else if (!/[‍️̀-ͯ]/.test(ch)) w += 1;
  }
  return w;
}
export const padEnd = (s, n) => s + ' '.repeat(Math.max(0, n - width(s)));
export const padStart = (s, n) => ' '.repeat(Math.max(0, n - width(s))) + s;

// 63.4 → "63,40%"
export const pct = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${n.toFixed(2).replace('.', ',')}%` : '—');
const num = (n) => Math.abs(n).toFixed(2).replace('.', ',');

// Tom da porcentagem: 100 bom, ≥ 50 âmbar, abaixo falha.
export const tomDe = (p) => (p >= 100 ? 'bom' : p >= 50 ? 'ambar' : 'falha');

// Barra de 0 a 100: cheio em blocos inteiros. Só fica cheia em 100% e só fica vazia em 0%.
export function bar(p, { largura = 20, tom } = {}) {
  const v = Math.max(0, Math.min(100, Number(p) || 0));
  let cheio = Math.floor((v / 100) * largura);
  if (v > 0 && cheio === 0) cheio = 1;
  if (v < 100 && cheio === largura) cheio = largura - 1;
  return paint(tom || tomDe(v), '█'.repeat(cheio)) + paint('suave', '░'.repeat(largura - cheio));
}

// Diferença em pontos: ▲ +5,00 · ▼ −2,50 · ━ 0,00
export function delta(n, { sufixo = '' } = {}) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  if (n > 0) return c.bom(`▲ +${num(n)}${sufixo}`);
  if (n < 0) return c.falha(`▼ −${num(n)}${sufixo}`);
  return c.suave(`━  ${num(n)}${sufixo}`);
}

export const LARGURA = 56;
export const regua = (n = LARGURA) => c.suave('─'.repeat(n));

// 🍮 Pudim · cobertura  ·  subtítulo
export function cabecalho(comando, sub = '') {
  return [`🍮 ${c.caramelo('Pudim', { bold: true })} ${c.suave('·')} ${c.ouro(comando, { bold: true })}${sub ? `  ${c.suave(sub)}` : ''}`, regua()];
}

// Texto vindo de fora (título de teste, caminho) entra no painel sem caracteres de controle.
export const limpo = (s) => stripAnsi(String(s ?? ''));

// Linha de barra: " Linhas     ████████░░  80,00%  ▲ +5,00"
export function linhaBarra(rotulo, p, { largura = 20, extra = '', rotuloLargura = 10, valor, tom } = {}) {
  return ` ${padEnd(c.suave(rotulo), rotuloLargura)} ${bar(p, { largura, tom })}  ${padStart(c.ouro(valor ?? pct(p), { bold: true }), 8)}${extra ? `  ${extra}` : ''}`;
}

const SELOS = {
  'CONFORME ESPERADO': ['✅', 'bom'],
  'NECESSITA ATENÇÃO': ['⚠️', 'aviso'],
  BLOQUEADO: ['⛔', 'falha'],
  'SEM DADOS': ['•', 'suave'],
};
export function selo(status) {
  const [icone, tom] = SELOS[status] || ['•', 'suave'];
  return ` ${icone} ${paint(tom, status, { bold: true })}`;
}

// Título de bloco: " 📂 Menos cobertos"
export const titulo = (icone, texto) => ` ${icone} ${c.ouro(texto, { bold: true })}`;

// Árvore: ├─ … └─
export function arvore(itens) {
  return itens.map((t, i) => ` ${c.suave(i === itens.length - 1 ? '└─' : '├─')} ${t}`);
}

// Marcas de estado
export const ok = (s = '') => `${c.bom('✔')}${s ? ` ${s}` : ''}`;
export const erro = (s = '') => `${c.falha('✘')}${s ? ` ${s}` : ''}`;
export const alerta = (s = '') => `${c.aviso('!')}${s ? ` ${s}` : ''}`;

// plural(1, 'arquivo') → "1 arquivo" · plural(2, 'investigação', 'investigações') → "2 investigações"
export const plural = (n, um, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;
