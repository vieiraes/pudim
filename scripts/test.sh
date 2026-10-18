#!/bin/bash
# =============================================================================
# 🍮 Pudim — Testes dos scripts auxiliares (sem dependências: bash + node).
#   bash scripts/test.sh
# =============================================================================
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FX="$HERE/__tests__/fixtures"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✔ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✘ $1"; [ -n "${2:-}" ] && echo "      $2"; }

# json_get <json> <expr>  → imprime o valor de uma expressão JS sobre o objeto
json_get() { node -e 'const o=JSON.parse(process.argv[1]); const v=(function(o){return eval(process.argv[2]);})(o); console.log(typeof v==="string"?v:JSON.stringify(v));' "$1" "$2"; }

echo ""
echo "🍮 Pudim — testes dos scripts"
echo ""
echo "[qa-detect.sh]"

OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/jest-playwright")"; RC=$?
[ "$RC" -eq 0 ] && ok "jest+playwright: exit 0" || fail "jest+playwright: exit $RC"
[ "$(json_get "$OUT" 'o.runner')" = "jest" ] && ok "jest+playwright: runner=jest" || fail "runner" "$OUT"
[ "$(json_get "$OUT" 'o.e2e')" = "playwright" ] && ok "jest+playwright: e2e=playwright" || fail "e2e" "$OUT"
[ "$(json_get "$OUT" 'o.coverageProvider')" = "v8" ] && ok "jest+playwright: provider lido da config (v8)" || fail "provider" "$OUT"
[ "$(json_get "$OUT" 'o.packageManager')" = "pnpm" ] && ok "jest+playwright: packageManager=pnpm (lockfile)" || fail "packageManager" "$OUT"
[ "$(json_get "$OUT" 'o.tsPaths')" = "true" ] && ok "jest+playwright: tsPaths=true" || fail "tsPaths" "$OUT"
[ "$(json_get "$OUT" 'o.sourceDirs.join(",")')" = "src" ] && ok "jest+playwright: sourceDirs=src" || fail "sourceDirs" "$OUT"
[ "$(json_get "$OUT" 'o.coverageInclude[0]')" = "src/**/*.{js,jsx,ts,tsx,mjs,cjs}" ] && ok "jest+playwright: coverageInclude cobre src inteiro" || fail "coverageInclude" "$OUT"

OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/vitest")"
[ "$(json_get "$OUT" 'o.runner')" = "vitest" ] && ok "vitest: runner=vitest" || fail "vitest runner" "$OUT"
[ "$(json_get "$OUT" 'o.coverageProvider')" = "istanbul" ] && ok "vitest: provider=istanbul (config)" || fail "vitest provider" "$OUT"
[ "$(json_get "$OUT" 'o.e2e')" = "none" ] && ok "vitest: e2e=none" || fail "vitest e2e" "$OUT"
[ "$(json_get "$OUT" 'o.packageManager')" = "npm" ] && ok "vitest: packageManager=npm (padrão)" || fail "vitest pm" "$OUT"

OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/none")"; RC=$?
[ "$RC" -eq 0 ] && ok "none: exit 0" || fail "none: exit $RC"
[ "$(json_get "$OUT" 'o.runner')" = "none" ] && ok "none: runner=none" || fail "none runner" "$OUT"
[ "$(json_get "$OUT" 'o.coverageInclude[0]')" = "**/*.{js,jsx,ts,tsx,mjs,cjs}" ] && ok "none: sem pasta src, mede a raiz" || fail "none include" "$OUT"

OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/jest-playwright")"
[ "$(json_get "$OUT" '[o.testFiles,o.testStyle,o.testExt].join("|")')" = "2|__tests__|.test.js" ] && ok "jest+playwright: 2 testes no estilo __tests__ (.test.js)" || fail "testStyle" "$OUT"
[ "$(json_get "$OUT" 'o.testExample')" = "src/__tests__/index.test.js" ] && ok "jest+playwright: modelo = menor teste existente" || fail "testExample" "$OUT"
[ "$(json_get "$OUT" '[o.e2eDir,o.e2eFiles,o.e2eExample].join("|")')" = "e2e|1|e2e/home.spec.ts" ] && ok "jest+playwright: e2eDir lido da config, 1 spec de modelo" || fail "e2eDir" "$OUT"
[ "$(json_get "$OUT" '[o.baseURL,o.webServer,o.moduleType].join("|")')" = "http://localhost:3000|true|cjs" ] && ok "jest+playwright: baseURL, webServer e cjs" || fail "baseURL" "$OUT"
OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/vitest")"
[ "$(json_get "$OUT" '[o.testStyle,o.testExt,o.moduleType,o.vitestGlobals,o.e2eDir].join("|")')" = "ao-lado|.test.ts|esm|true|" ] && ok "vitest: testes ao lado, .test.ts, esm, globals, sem e2e" || fail "vitest estilo" "$OUT"

OUT="$(bash "$HERE/qa-detect.sh" "$FX/detect/nao-existe" 2>/dev/null)"; RC=$?
[ "$RC" -eq 2 ] && ok "sem package.json: exit 2" || fail "sem package.json: exit $RC"

echo ""
echo "[coverage-diff.mjs]"
CD="$HERE/coverage-diff.mjs"; CV="$FX/coverage"

OUT="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj --json)"; RC=$?
[ "$RC" -eq 0 ] && ok "melhorou: exit 0" || fail "melhorou: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.regressions')" = "0" ] && ok "melhorou: 0 regressões" || fail "regressões" "$OUT"
[ "$(json_get "$OUT" 'o.newFiles')" = "1" ] && ok "melhorou: 1 arquivo novo (c.js)" || fail "newFiles" "$OUT"
[ "$(json_get "$OUT" 'o.deltaLines')" = "15" ] && ok "melhorou: delta total +15 linhas" || fail "deltaLines" "$OUT"

TXT="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj)"
echo "$TXT" | grep -q "▲ src/b.js" && ok "tabela: b.js marcado como melhorou (caminho relativizado)" || fail "tabela b.js" "$TXT"
echo "$TXT" | grep -q "＋ src/c.js" && ok "tabela: c.js marcado como novo" || fail "tabela c.js" "$TXT"

OUT="$(node "$CD" "$CV/summary-regressed.json" "$CV/baseline.json" --root=/proj --json)"; RC=$?
[ "$RC" -eq 1 ] && ok "regressão: exit 1" || fail "regressão: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.regressions')" = "1" ] && ok "regressão: 1 arquivo (a.js 80→60)" || fail "regressions" "$OUT"

OUT="$(node "$CD" "$CV/summary-regressed.json" "$CV/baseline.json" --root=/proj --tolerance=25 --json)"; RC=$?
[ "$RC" -eq 0 ] && ok "tolerância 25%: queda de 20 pontos não bloqueia" || fail "tolerância: exit $RC" "$OUT"

OUT="$(node "$CD" "$CV/summary-improved.json" "$CV/nao-existe.json" --root=/proj --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.hasBaseline')" = "false" ] && [ "$(json_get "$OUT" 'o.newFiles')" = "3" ] \
  && ok "sem baseline: exit 0, todos novos" || fail "sem baseline" "$OUT"

ERR="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj --provider=v8 --json 2>&1 >/dev/null)"; RC=$?
[ "$RC" -eq 2 ] && echo "$ERR" | grep -q "incompatível" && ok "provider diferente (babel vs v8): exit 2 com mensagem" || fail "provider: exit $RC" "$ERR"

ERR="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj --provider=babel --json 2>&1 >/dev/null)"; RC=$?
[ "$RC" -eq 0 ] && ok "provider igual (babel): ok" || fail "provider igual: exit $RC" "$ERR"

ERR="$(node "$CD" "$CV/nao-existe.json" "$CV/baseline.json" --json 2>&1 >/dev/null)"; RC=$?
[ "$RC" -eq 3 ] && ok "summary ausente: exit 3" || fail "summary ausente: exit $RC"

TMP="$(mktemp -d)"
OUT="$(cd "$TMP" && node "$CD" --save-baseline "$CV/summary-improved.json" "$TMP/.qa/coverage/baseline.json" --root=/proj --runner=jest --provider=babel --command="npx jest --coverage")"; RC=$?
[ "$RC" -eq 0 ] && [ -f "$TMP/.qa/coverage/baseline.json" ] && [ -f "$TMP/.qa/coverage/baseline.meta.json" ] \
  && ok "--save-baseline grava baseline.json + baseline.meta.json" || fail "save-baseline: exit $RC" "$OUT"
grep -q '"src/c.js"' "$TMP/.qa/coverage/baseline.json" && ok "baseline gravada com caminhos relativos" || fail "baseline relativa"
grep -q '"provider": "babel"' "$TMP/.qa/coverage/baseline.meta.json" && ok "meta grava provider" || fail "meta provider"
OUT="$(node "$CD" "$CV/summary-improved.json" "$TMP/.qa/coverage/baseline.json" --root=/proj --json)"
[ "$(json_get "$OUT" 'o.regressions')" = "0" ] && [ "$(json_get "$OUT" 'o.deltaLines')" = "0" ] && ok "diff contra a baseline recém-gravada: igual" || fail "roundtrip" "$OUT"
rm -rf "$TMP"

OUT="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj --top=2 --json)"
[ "$(json_get "$OUT" 'o.worst.length')" = "2" ] && [ "$(json_get "$OUT" 'o.worst[0].file')" = "src/c.js" ] \
  && ok "--top=2: lista os 2 menos cobertos, pior primeiro (c.js 50%)" || fail "worst" "$OUT"
[ "$(json_get "$OUT" 'o.filesTotal')" = "3" ] && ok "filesTotal=3" || fail "filesTotal" "$OUT"

echo ""
echo "[repetir-teste.sh]"
RT="$HERE/repetir-teste.sh"
OUT="$(bash "$RT" 5 -- true 2>/dev/null)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.verdict')" = "sempre_passa" ] && [ "$(json_get "$OUT" 'o.passed')" = "5" ] \
  && ok "true x5: sempre_passa, 5 de 5, exit 0" || fail "sempre_passa: exit $RC" "$OUT"
OUT="$(bash "$RT" 4 -- false 2>/dev/null)"; RC=$?
[ "$RC" -eq 1 ] && [ "$(json_get "$OUT" 'o.verdict')" = "sempre_falha" ] && [ "$(json_get "$OUT" 'o.failRate')" = "100.00" ] \
  && ok "false x4: sempre_falha, 100.00% de falha, exit 1" || fail "sempre_falha: exit $RC" "$OUT"
CNT="$(mktemp)"; rm -f "$CNT"
OUT="$(bash "$RT" 10 -- bash "$FX/repetir/alterna.sh" "$CNT" 2>/dev/null)"; RC=$?
[ "$RC" -eq 2 ] && [ "$(json_get "$OUT" 'o.verdict')" = "instavel" ] && [ "$(json_get "$OUT" 'o.failed')" = "5" ] && [ "$(json_get "$OUT" 'o.failRate')" = "50.00" ] \
  && ok "alterna x10: instavel, falhou em 5 de 10 (50.00%), exit 2" || fail "instavel: exit $RC" "$OUT"
rm -f "$CNT"
bash "$RT" 0 -- true >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "N=0: uso inválido, exit 3" || fail "N=0: exit $RC"
bash "$RT" 3 true >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "sem '--': uso inválido, exit 3" || fail "sem --: exit $RC"

echo ""
echo "[test-quality.mjs]"
TQ="$HERE/test-quality.mjs"; QF="$FX/qualidade"
OUT="$(node "$TQ" "$QF/bons.test.js" --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" '[o.total,o.aprovados].join("/")')" = "6/6" ] \
  && ok "bons: 6 de 6 aprovados (each, helper, regex e chaves em string), exit 0" || fail "bons: exit $RC" "$OUT"
OUT="$(node "$TQ" "$QF/falsos.test.js" --json)"; RC=$?
[ "$RC" -eq 1 ] && [ "$(json_get "$OUT" 'o.recusados')" = "7" ] && ok "falsos: 7 de 7 recusados, exit 1" || fail "falsos: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.arquivos[0].testes.map(t=>t.motivos.join("+")).join(",")')" = "sem_verificacao,so_existencia,so_snapshot,pulado,foco,pulado,pulado" ] \
  && ok "falsos: motivo certo para cada teste (sem verificação, existência, snapshot, skip, only, todo, xit)" || fail "motivos" "$OUT"
OUT="$(node "$TQ" "$QF/alvo/taxa.test.js" --json)"
[ "$(json_get "$OUT" 'o.arquivos[0].testes[0].motivos.join()')" = "mock_do_alvo" ] && ok "jest.mock do próprio módulo testado: recusado" || fail "mock_do_alvo" "$OUT"
OUT="$(node "$TQ" "$QF/alvo/frete.test.js" --json)"; RC=$?
[ "$RC" -eq 0 ] && ok "mock parcial (importActual) e mock de dependência: aceitos" || fail "mock parcial: exit $RC" "$OUT"
OUT="$(node "$TQ" "$QF/checkout.spec.ts" --json)"
[ "$(json_get "$OUT" 'o.arquivos[0].testes.map(t=>t.ok?"ok":t.motivos.join()).join(",")')" = "ok,ok,sem_verificacao,pulado" ] \
  && ok "playwright: expect(page), helper, clique sem expect recusado, fixme recusado; beforeEach ignorado" || fail "playwright" "$OUT"
node "$TQ" "$QF/nao-existe.test.js" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "arquivo ausente: exit 3" || fail "ausente: exit $RC"

echo ""
echo "[e2e-rotas.mjs]"
ER="$HERE/e2e-rotas.mjs"; RF="$FX/rotas"
OUT="$(node "$ER" --root="$RF/next-app" --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.rotas.map(r=>r.rota).join(",")')" = "/,/conta,/produtos,/produtos/[id]" ] \
  && ok "next app router: 4 rotas (grupo (loja) some, _lib e api/route fora)" || fail "next-app rotas" "$OUT"
[ "$(json_get "$OUT" '[o.cobertas,o.total,o.percentual].join("|")')" = "3|4|75" ] && ok "next app router: 3 de 4 cobertas (75%), \${id} casa com [id], URL absoluta e query ignoradas" || fail "next-app cobertura" "$OUT"
[ "$(json_get "$OUT" 'o.visitasSemRota.join()')" = "/sobre" ] && ok "next app router: visita a /sobre aparece como sem rota" || fail "visitasSemRota" "$OUT"
OUT="$(node "$ER" --root="$RF/next-pages" --json)"
[ "$(json_get "$OUT" 'o.rotas.map(r=>r.rota+(r.coberta?"✔":"")).join(",")')" = "/,/login✔,/pedidos/[id]" ] \
  && ok "next pages router: _app, 404 e api fora; \${BASE_URL}/login cobre /login" || fail "next-pages" "$OUT"
OUT="$(node "$ER" --root="$RF/react-router" --json)"
[ "$(json_get "$OUT" '[o.rotas.map(r=>r.rota).join(","),o.cobertas].join("|")')" = "/,/carrinho,/checkout|0" ] \
  && ok "react router: <Route path> e createBrowserRouter, '*' ignorado, 0 cobertas" || fail "react-router" "$OUT"
node "$ER" --root="$RF/nao-existe" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "pasta ausente: exit 3" || fail "rotas ausente: exit $RC"

echo ""
echo "[relatorio.mjs]"
RL="$HERE/relatorio.mjs"; RX="$FX/relatorio"; AG="--agora=2026-10-18T15:00:00"
T="$(mktemp -d)"
OUT="$(node "$RL" --root="$RX/bloqueado" --saida="$T/b" $AG --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.status')" = "BLOQUEADO" ] && ok "bloqueado: falha E2E + Bug no produto recente → BLOQUEADO" || fail "bloqueado: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.motivos[0]')" = "E2E: falhou em 1 de 5 na última execução (portal)" ] && ok "bloqueado: motivo com contagem exata (1 de 5)" || fail "motivo" "$OUT"
[ "$(json_get "$OUT" 'o.numeros[0]')" = "Cobertura (linhas): 35,71% · branches 26,31% · funções 33,33% (referência: 35,71%)" ] \
  && ok "bloqueado: números copiados da fonte com vírgula, sem arredondar" || fail "numeros" "$OUT"
[ -f "$T/b/2026-10-18-1500.html" ] && [ -f "$T/b/2026-10-18-1500.md" ] && [ -f "$T/b/2026-10-18-1500-jira.txt" ] && [ -f "$T/b/ultimo.html" ] \
  && ok "bloqueado: gera HTML, Markdown, Jira e ultimo.html" || fail "arquivos" "$(ls "$T/b")"
grep -q 'falhou em 5 de 5' "$T/b/2026-10-18-1500.html" && grep -q 'src/pagamentos/estorno.js' "$T/b/2026-10-18-1500.html" \
  && ok "bloqueado: HTML traz a investigação e o arquivo com 0%" || fail "html conteúdo"
OUT="$(node "$RL" --root="$RX/atencao" --saida="$T/a" $AG --json)"
[ "$(json_get "$OUT" '[o.status,o.motivos.length].join("|")')" = "NECESSITA ATENÇÃO|2" ] \
  && ok "atenção: cobertura caiu + 1 possível bug ao criar testes → NECESSITA ATENÇÃO; Bug no produto de 47 dias atrás não bloqueia" || fail "atencao" "$OUT"
OUT="$(node "$RL" --root="$RX/conforme" --saida="$T/c" $AG --json)"
[ "$(json_get "$OUT" 'o.status')" = "CONFORME ESPERADO" ] && ok "conforme: sem bloqueio nem atenção → CONFORME ESPERADO" || fail "conforme" "$OUT"
[ "$(json_get "$OUT" 'o.numeros.find(n=>n.startsWith("Testes unit"))')" = "Testes unitários criados: cobertura 60,00% → 90,00%; 5 de 5 passaram" ] \
  && ok "conforme: antes/depois do criar-unitario lido do comparativo e do JSON do Jest" || fail "unitario" "$OUT"
[ "$(json_get "$OUT" 'o.numeros.find(n=>n.startsWith("Rotas"))')" = "Rotas com teste E2E: 3 de 3 (100,00%)" ] && ok "conforme: rotas cobertas do criar-e2e" || fail "rotas" "$OUT"
OUT="$(node "$RL" --root="$RX/depois-do-unitario" --saida="$T/d" $AG --json)"
[ "$(json_get "$OUT" '[o.status,o.numeros[0]].join("|")')" = "CONFORME ESPERADO|Cobertura (linhas): 100,00% · branches 94,73% · funções 100,00% (referência: 35,71%)" ] \
  && ok "depois do criar-unitario: usa a medição mais nova (100,00%), referência oficial continua 35,71%" || fail "depois-do-unitario" "$OUT"
OUT="$(node "$RL" --root="$RX/vazio" --saida="$T/v" $AG --json)"
[ "$(json_get "$OUT" 'o.status')" = "SEM DADOS" ] && ok "vazio: SEM DADOS com orientação" || fail "vazio" "$OUT"
node "$RL" --root="$RX/nao-existe" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "pasta ausente: exit 3" || fail "relatorio ausente: exit $RC"
rm -rf "$T"

echo ""
echo "[portal (server.mjs + playwright-report.mjs)]"
PT="$(node "$HERE/__tests__/portal-test.mjs" 2>&1)"
echo "$PT" | grep -v '^RESULTADO '
LINE="$(echo "$PT" | grep '^RESULTADO ' | tail -1)"
if [ -n "$LINE" ]; then
  set -- $LINE; PASS=$((PASS+$2)); FAIL=$((FAIL+$3))
else
  fail "portal-test.mjs não terminou" "$(echo "$PT" | tail -5)"
fi

echo ""
echo "  Passaram: $PASS   Falharam: $FAIL"
echo ""
[ "$FAIL" -eq 0 ]
