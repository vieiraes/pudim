// Alterna falha/sucesso a cada chamada, guardando o contador no arquivo passado.
import { readFileSync, writeFileSync } from 'node:fs';
const f = process.argv[2];
let n = 0;
try { n = Number(readFileSync(f, 'utf8')) || 0; } catch { /* primeira vez */ }
writeFileSync(f, String(n + 1));
if (n % 2 === 0) { console.log('Error: expect(received).toBe(expected)'); process.exit(1); }
