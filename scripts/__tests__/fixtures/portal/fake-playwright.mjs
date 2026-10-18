#!/usr/bin/env node
// Playwright falso para os testes do portal: devolve JSON no formato real (v1.58) sem abrir navegador.
// --list → lista · "tests/lento.spec.ts" → demora 30 s (para testar o Parar) · resto → 2 passam, 1 falha.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const rootDir = join(process.cwd(), 'tests');
const spec = (id, title, line, status, extra = {}) => ({
  title, ok: status !== 'unexpected', id, file: 'carrinho.spec.ts', line, column: 3,
  tests: [{ projectName: 'chromium', status, results: status === 'none' ? [] : [{ status: status === 'unexpected' ? 'failed' : 'passed', duration: 120, attachments: [], ...extra }] }],
});
const report = (st) => ({
  config: { rootDir },
  suites: [
    { title: 'carrinho.spec.ts', file: 'carrinho.spec.ts', specs: [spec('c-3', 'adiciona item', 3, st[0])],
      suites: [{ title: 'Cupom', file: 'carrinho.spec.ts', specs: [
        spec('c-6', 'aplica desconto de 10%', 6, st[1]),
        spec('c-7', 'recusa cupom vencido', 7, st[2], st[2] === 'unexpected' ? {
          error: { message: '\u001b[31mError: expect(received).toBe(expected)\u001b[39m\nExpected: "Cupom vencido"\nReceived: ""' },
          attachments: [{ name: 'trace', contentType: 'application/zip', path: join(process.cwd(), 'test-results/cupom-vencido/trace.zip') }],
        } : {}),
      ] }] },
    { title: 'lento.spec.ts', file: 'lento.spec.ts', specs: [{ ...spec('l-2', 'demora', 2, st[3]), file: 'lento.spec.ts' }] },
  ],
  errors: [],
});

if (args.includes('--list')) {
  process.stdout.write(JSON.stringify(report(['none', 'none', 'none', 'none'])));
  process.exit(0);
}
if (args.includes('tests/lento.spec.ts')) {
  console.log('Running 1 test using 1 worker');
  setTimeout(() => process.exit(0), 30000);
} else {
  console.log('Running 3 tests using 1 worker');
  console.log('  \u001b[32m✓\u001b[39m  1 carrinho.spec.ts:3:3 › adiciona item');
  console.log('  \u001b[31m✘\u001b[39m  3 carrinho.spec.ts:7:3 › Cupom › recusa cupom vencido');
  writeFileSync(process.env.PLAYWRIGHT_JSON_OUTPUT_NAME, JSON.stringify(report(['expected', 'expected', 'unexpected', 'none'])));
  process.exit(1);
}
