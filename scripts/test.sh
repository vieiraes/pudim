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
echo "  Passaram: $PASS   Falharam: $FAIL"
echo ""
[ "$FAIL" -eq 0 ]
