#!/bin/bash
# =============================================================================
# 🍮 Pudim — Detecta o que o projeto alvo já usa para testes.
#
# Como usar:
#   bash scripts/qa-detect.sh [pasta-do-projeto]
#
# Saída: um JSON estável em stdout, por exemplo:
#   {"runner":"jest","runnersFound":["jest"],"e2e":"playwright","packageManager":"npm",
#    "coverageProvider":"babel","tsPaths":false,"workspaces":false,"testScript":"jest",
#    "configFiles":["jest.config.js","playwright.config.ts"]}
#
# Nunca altera o projeto. Precisa de Node 18+ (só para ler JSON com segurança).
# Exit 0 sempre que conseguir ler a pasta; 2 se não houver package.json; 3 sem Node.
# =============================================================================

set -euo pipefail

DIR="${1:-.}"

if [[ ! -f "$DIR/package.json" ]]; then
  echo '{"error":"package.json não encontrado","runner":"none","e2e":"none"}'
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo '{"error":"node não encontrado (necessário para ler package.json)","runner":"none","e2e":"none"}'
  exit 3
fi

node - "$DIR" <<'JS'
const fs = require('node:fs');
const path = require('node:path');

const dir = path.resolve(process.argv[2]);
const read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return null; } };
const exists = (f) => fs.existsSync(path.join(dir, f));
const firstExisting = (names) => names.filter(exists);

let pkg = {};
try { pkg = JSON.parse(read('package.json')); } catch (e) {
  console.log(JSON.stringify({ error: 'package.json inválido: ' + e.message, runner: 'none', e2e: 'none' }));
  process.exit(0);
}
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const scripts = pkg.scripts || {};
const testScript = scripts.test || '';

const jestConfigs = firstExisting(['jest.config.js', 'jest.config.cjs', 'jest.config.mjs', 'jest.config.ts', 'jest.config.json']);
const vitestConfigs = firstExisting(['vitest.config.js', 'vitest.config.mjs', 'vitest.config.ts', 'vitest.config.mts', 'vite.config.ts', 'vite.config.js', 'vite.config.mjs']);
const pwConfigs = firstExisting(['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs']);

const hasJest = Boolean(deps.jest || jestConfigs.length || pkg.jest || /\bjest\b/.test(testScript));
const hasVitest = Boolean(deps.vitest || vitestConfigs.some((f) => f.startsWith('vitest.')) || /\bvitest\b/.test(testScript));
const hasPlaywright = Boolean(deps['@playwright/test'] || pwConfigs.length);

const runnersFound = [];
if (hasJest) runnersFound.push('jest');
if (hasVitest) runnersFound.push('vitest');

// Preferência: o runner citado em "npm test"; senão o único encontrado; senão vitest.
let runner = 'none';
if (runnersFound.length === 1) runner = runnersFound[0];
else if (runnersFound.length > 1) runner = /\bvitest\b/.test(testScript) ? 'vitest' : (/\bjest\b/.test(testScript) ? 'jest' : 'vitest');

// Provider de cobertura (default do runner, ou o declarado na config).
let coverageProvider = runner === 'jest' ? 'babel' : runner === 'vitest' ? 'v8' : null;
const grabProvider = (text) => {
  if (!text) return null;
  const m = text.match(/coverageProvider\s*:\s*['"](\w+)['"]/) || text.match(/provider\s*:\s*['"](\w+)['"]/);
  return m ? m[1] : null;
};
if (runner === 'jest') {
  coverageProvider = (pkg.jest && pkg.jest.coverageProvider) || grabProvider(jestConfigs.map(read).join('\n')) || coverageProvider;
} else if (runner === 'vitest') {
  coverageProvider = grabProvider(vitestConfigs.map(read).join('\n')) || coverageProvider;
}

// Gerenciador de pacotes pelo lockfile (fallback: packageManager do package.json, senão npm).
let packageManager = 'npm';
if (exists('pnpm-lock.yaml')) packageManager = 'pnpm';
else if (exists('yarn.lock')) packageManager = 'yarn';
else if (exists('bun.lockb') || exists('bun.lock')) packageManager = 'bun';
else if (typeof pkg.packageManager === 'string') packageManager = pkg.packageManager.split('@')[0];

// TypeScript paths (precisam de moduleNameMapper / vite-tsconfig-paths).
let tsPaths = false;
const tsconfig = read('tsconfig.json');
if (tsconfig) {
  try {
    const stripped = tsconfig.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
    const ts = JSON.parse(stripped);
    tsPaths = Boolean(ts.compilerOptions && ts.compilerOptions.paths && Object.keys(ts.compilerOptions.paths).length);
  } catch { tsPaths = /"paths"\s*:/.test(tsconfig); }
}

// Pastas de código-fonte: sem isso, Jest só mede arquivos importados por algum teste e
// o que não tem teste nenhum some da medição.
const SOURCE_CANDIDATES = ['src', 'app', 'lib', 'pages', 'components', 'server', 'api', 'utils', 'services'];
const sourceDirs = SOURCE_CANDIDATES.filter((d) => {
  try { return fs.statSync(path.join(dir, d)).isDirectory(); } catch { return false; }
});
const coverageInclude = (sourceDirs.length ? sourceDirs : ['.']).map((d) => (d === '.' ? '**/*.{js,jsx,ts,tsx,mjs,cjs}' : `${d}/**/*.{js,jsx,ts,tsx,mjs,cjs}`));
const coverageExclude = ['**/*.{test,spec}.*', '**/__tests__/**', '**/__mocks__/**', '**/*.d.ts', '**/node_modules/**', '**/.qa/**', '**/coverage/**', '**/e2e/**', '**/tests-e2e/**'];

// Monorepo / múltiplos projetos (fora da v1: detectar e avisar).
const workspaces = Boolean(pkg.workspaces || exists('pnpm-workspace.yaml') || exists('lerna.json') ||
  /projects\s*:/.test(jestConfigs.concat(vitestConfigs).map(read).join('\n')));

// ── Como o projeto escreve testes (para os comandos de criação imitarem) ──────
const IGNORE = new Set(['node_modules', '.git', '.qa', 'coverage', 'dist', 'build', '.next', 'out', 'test-results', 'playwright-report']);
const allFiles = [];
(function walk(rel, depth) {
  if (depth > 12 || allFiles.length > 20000) return;
  let entries = [];
  try { entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(r, depth + 1);
    else allFiles.push(r);
  }
})('', 0);

// Diretório de testes E2E e URL base, lidos da config do Playwright (por texto, sem executar).
const pwText = pwConfigs.map(read).join('\n');
const pwTestDir = (pwText.match(/testDir\s*:\s*['"`]([^'"`]+)['"`]/) || [])[1];
const e2eDir = hasPlaywright ? (pwTestDir ? pwTestDir.replace(/^\.\//, '').replace(/\/$/, '') : 'tests') : null;
const baseURL = (pwText.match(/baseURL\s*:\s*['"`]([^'"`]+)['"`]/) || [])[1] || null;
const webServer = /webServer\s*:/.test(pwText);
const inE2eDir = (f) => e2eDir && (f === e2eDir || f.startsWith(`${e2eDir}/`));

const isTest = (f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f);
const unitTests = allFiles.filter((f) => isTest(f) && !inE2eDir(f) && !/(^|\/)(e2e|tests-e2e)\//.test(f));
const e2eTests = allFiles.filter((f) => isTest(f) && inE2eDir(f));

let testStyle = null;
if (unitTests.length) {
  const counts = { '__tests__': 0, 'pasta-tests': 0, 'ao-lado': 0 };
  for (const f of unitTests) {
    if (f.includes('__tests__/')) counts['__tests__']++;
    else if (/^(test|tests)\//.test(f)) counts['pasta-tests']++;
    else counts['ao-lado']++;
  }
  testStyle = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
const ext = (f) => (f.match(/\.(test|spec)\.([cm]?[jt]sx?)$/) || [])[0] || null;
const mostCommon = (arr) => {
  const c = {};
  for (const x of arr) if (x) c[x] = (c[x] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
};
const testExt = mostCommon(unitTests.map(ext)) || (exists('tsconfig.json') ? '.test.ts' : '.test.js');
// Modelo: o menor teste do estilo dominante (mais fácil de imitar).
const sizeOf = (f) => { try { return fs.statSync(path.join(dir, f)).size; } catch { return Infinity; } };
const pickExample = (list) => list.slice().sort((a, b) => sizeOf(a) - sizeOf(b) || a.localeCompare(b))[0] || null;
const testExample = pickExample(unitTests.filter((f) => ext(f) === testExt)) || pickExample(unitTests);
const e2eExample = pickExample(e2eTests);

const moduleType = pkg.type === 'module' ? 'esm' : 'cjs';
const vitestGlobals = runner === 'vitest' && /globals\s*:\s*true/.test(vitestConfigs.map(read).join('\n'));

console.log(JSON.stringify({
  runner,
  runnersFound,
  e2e: hasPlaywright ? 'playwright' : 'none',
  packageManager,
  coverageProvider,
  tsPaths,
  workspaces,
  testScript,
  configFiles: [...jestConfigs, ...vitestConfigs, ...pwConfigs],
  sourceDirs,
  coverageInclude,
  coverageExclude,
  testFiles: unitTests.length,
  testStyle,
  testExt,
  testExample,
  moduleType,
  vitestGlobals,
  e2eDir,
  e2eFiles: e2eTests.length,
  e2eExample,
  baseURL,
  webServer,
}));
JS
