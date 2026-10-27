#!/bin/bash
# =============================================================================
# 🍮 Pudim — Testes dos scripts auxiliares (sem dependências: bash + node).
#   bash scripts/test.sh
# =============================================================================
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FX="$HERE/__tests__/fixtures"
PASS=0; FAIL=0
# Paleta do Pudim (scripts/ui.mjs) só em terminal. Os scripts testados rodam sem TTY: saem sem cor.
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  BOM=$'\e[38;5;114m'; FAL=$'\e[38;5;167m'; OURO=$'\e[1;38;5;222m'; CAR=$'\e[1;38;5;172m'; SUA=$'\e[38;5;244m'; AMB=$'\e[38;5;214m'; R=$'\e[0m'
else BOM=''; FAL=''; OURO=''; CAR=''; SUA=''; AMB=''; R=''; fi
ok()   { PASS=$((PASS+1)); echo "  ${BOM}✔${R} $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ${FAL}✘ $1${R}"; [ -n "${2:-}" ] && echo "      ${SUA}$2${R}"; }
secao() { echo ""; echo "${OURO}$1${R}"; }

# json_get <json> <expr>  → imprime o valor de uma expressão JS sobre o objeto
json_get() { node -e 'const o=JSON.parse(process.argv[1]); const v=(function(o){return eval(process.argv[2]);})(o); console.log(typeof v==="string"?v:JSON.stringify(v));' "$1" "$2"; }

echo ""
echo "🍮 ${CAR}Pudim${R} ${SUA}·${R} ${OURO}testes dos scripts${R}"
echo "${SUA}────────────────────────────────────────────────────────${R}"
secao "[qa-detect.sh]"

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

secao "[coverage-diff.mjs]"
CD="$HERE/coverage-diff.mjs"; CV="$FX/coverage"

OUT="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj --json)"; RC=$?
[ "$RC" -eq 0 ] && ok "melhorou: exit 0" || fail "melhorou: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.regressions')" = "0" ] && ok "melhorou: 0 regressões" || fail "regressões" "$OUT"
[ "$(json_get "$OUT" 'o.newFiles')" = "1" ] && ok "melhorou: 1 arquivo novo (c.js)" || fail "newFiles" "$OUT"
[ "$(json_get "$OUT" 'o.deltaLines')" = "15" ] && ok "melhorou: delta total +15 linhas" || fail "deltaLines" "$OUT"

TXT="$(node "$CD" "$CV/summary-improved.json" "$CV/baseline.json" --root=/proj)"
echo "$TXT" | grep -q "▲ src/b.js" && ok "tabela: b.js marcado como melhorou (caminho relativizado)" || fail "tabela b.js" "$TXT"
echo "$TXT" | grep -q "✚ src/c.js" && ok "tabela: c.js marcado como novo" || fail "tabela c.js" "$TXT"

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

secao "[repetir-teste.sh]"
RT="$HERE/repetir-teste.sh"
OUT="$(bash "$RT" 5 -- node "$FX/repetir/sai.mjs" 0 2>/dev/null)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.verdict')" = "sempre_passa" ] && [ "$(json_get "$OUT" 'o.passed')" = "5" ] \
  && ok "true x5: sempre_passa, 5 de 5, exit 0" || fail "sempre_passa: exit $RC" "$OUT"
OUT="$(bash "$RT" 4 -- node "$FX/repetir/sai.mjs" 1 2>/dev/null)"; RC=$?
[ "$RC" -eq 1 ] && [ "$(json_get "$OUT" 'o.verdict')" = "sempre_falha" ] && [ "$(json_get "$OUT" 'o.failRate')" = "100.00" ] \
  && ok "false x4: sempre_falha, 100.00% de falha, exit 1" || fail "sempre_falha: exit $RC" "$OUT"
CNT="$(mktemp)"; rm -f "$CNT"
OUT="$(bash "$RT" 10 -- node "$FX/repetir/alterna.mjs" "$CNT" 2>/dev/null)"; RC=$?
[ "$RC" -eq 2 ] && [ "$(json_get "$OUT" 'o.verdict')" = "instavel" ] && [ "$(json_get "$OUT" 'o.failed')" = "5" ] && [ "$(json_get "$OUT" 'o.failRate')" = "50.00" ] \
  && ok "alterna x10: instavel, falhou em 5 de 10 (50.00%), exit 2" || fail "instavel: exit $RC" "$OUT"
rm -f "$CNT"
bash "$RT" 0 -- true >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "N=0: uso inválido, exit 3" || fail "N=0: exit $RC"
bash "$RT" 3 true >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "sem '--': uso inválido, exit 3" || fail "sem --: exit $RC"
[ "$(json_get "$OUT" 'o.lastError')" = "Error: expect(received).toBe(expected)" ] && ok "guarda a última linha de erro da rodada que falhou" || fail "lastError" "$OUT"
bash "$RT" 2 -- sh -c 'echo oi' >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "comando que não é de teste (sh -c): recusado, exit 3" || fail "sh -c: exit $RC"
bash "$RT" 2 -- node -e 'process.exit(0)' >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "node -e: recusado, exit 3" || fail "node -e: exit $RC"
OUT="$(bash "$RT" 2 -- node "$FX/repetir/sai.mjs" 1 "No tests found, exiting with code 1" 2>/dev/null)"
[ "$(json_get "$OUT" 'o.noTests')" = "true" ] && ok "\"No tests found\" marca noTests=true: falha sem teste não é evidência" || fail "noTests" "$OUT"

secao "[test-quality.mjs]"
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
OUT="$(node "$TQ" "$QF/novos.test.js" --json --out="$QF/../../tmp/qualidade-out.json")"
[ "$(json_get "$OUT" 'o.arquivos[0].testes.map(t=>t.ok?"ok":t.motivos.join("+")).join(",")')" = "ok,sem_verificacao,so_existencia,espera_fixa,credencial" ] \
  && ok "novos: each com template contado; arrow sem corpo não empresta expect; not.toBeTruthy; waitForTimeout; senha no código" || fail "novos" "$OUT"
[ -f "$HERE/__tests__/tmp/qualidade-out.json" ] && grep -q '"credencial"' "$HERE/__tests__/tmp/qualidade-out.json" && ok "--out grava o JSON do filtro" || fail "tq --out"
rm -rf "$HERE/__tests__/tmp"
node "$TQ" "$QF/nao-existe.test.js" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "arquivo ausente: exit 3" || fail "ausente: exit $RC"

secao "[e2e-rotas.mjs]"
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
[ "$(json_get "$OUT" '[o.rotas.map(r=>r.rota).join(","),o.cobertas].join("|")')" = "/,/carrinho,/checkout|1" ] \
  && ok "react router: <Route path> e createBrowserRouter, '*' ignorado, /carrinho coberta" || fail "react-router" "$OUT"
[ "$(json_get "$OUT" 'o.rotas.map(r=>(r.componente||"-")+":"+(r.importa||"-")).join(",")')" = "-:-,Carrinho:./pages/Carrinho,Checkout:./pages/Checkout" ] \
  && ok "react router: componente de cada rota (element antes ou depois do path, lazy(() => import))" || fail "componentes" "$OUT"
OUT="$(node "$ER" --root="$FX/rotas/next-app" --json)"
echo "$OUT" | grep -q '"truncado": false' && ok "com git: lista via git ls-files, sem corte" || fail "truncado" "$OUT"
node "$ER" --root="$RF/nao-existe" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "pasta ausente: exit 3" || fail "rotas ausente: exit $RC"

secao "[e2e-afetados.mjs]"
EA="$HERE/e2e-afetados.mjs"; BK="$FX/afetados/banco"
OUT="$(node "$EA" --root="$BK" --arquivos=src/pix-out/enums.ts --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo).join(",")')" = "e2e/pix-out.spec.ts,e2e/saldo.spec.ts" ] \
  && ok "enum do pix-out: roda pix-out e saldo, onboarding fica de fora" || fail "enum pix-out: exit $RC" "$OUT"
[ "$(json_get "$OUT" '[o.selecionados,o.totalSpecs,o.transversal.sim].join("|")')" = "2|3|false" ] && ok "enum do pix-out: 2 de 3 specs, não é transversal" || fail "contagem" "$OUT"
[ "$(json_get "$OUT" 'o.specs[0].motivos.map(m=>m.tipo).join(",")')" = "rota,nome,mapa" ] && ok "pix-out: motivos rota (import pelo alias @/), nome e mapa" || fail "motivos pix-out" "$OUT"
[ "$(json_get "$OUT" 'o.specs[1].motivos[0].detalhe')" = "vizinho de pix-out: saldo" ] && ok "saldo: entra como vizinho de negócio pelo .qa/areas.json" || fail "vizinho" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=src/components/Botao.tsx --json)"
[ "$(json_get "$OUT" '[o.specs.map(s=>s.arquivo).join(","),o.transversal.motivos[0].motivo].join("|")')" = "e2e/onboarding.spec.ts,e2e/pix-out.spec.ts|usado por 2 de 3 telas" ] \
  && ok "componente compartilhado: onboarding e pix-out, transversal (2 de 3 telas)" || fail "compartilhado" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=e2e/helpers/cadastro.ts --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo+":"+s.motivos[0].tipo).join(",")')" = "e2e/onboarding.spec.ts:helper" ] && ok "helper do E2E: só o spec que importa" || fail "helper" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=e2e/onboarding.spec.ts --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo+":"+s.motivos.map(m=>m.tipo)).join(",")')" = "e2e/onboarding.spec.ts:spec" ] && ok "spec alterado: roda só ele mesmo" || fail "spec" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=src/lib/datas.ts --json)"
[ "$(json_get "$OUT" '[o.selecionados,o.semEfeito.join()].join("|")')" = "0|src/lib/datas.ts" ] && ok "arquivo sem tela nem spec: 0 specs, listado em semEfeito" || fail "semEfeito" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=package.json --json)"
[ "$(json_get "$OUT" '[o.transversal.sim,o.selecionados].join("|")')" = "true|0" ] && ok "package.json: transversal" || fail "package.json" "$OUT"
OUT="$(node "$EA" --root="$BK" --arquivos=app/layout.tsx --json)"
[ "$(json_get "$OUT" '[o.transversal.sim,o.selecionados].join("|")')" = "true|3" ] && ok "layout raiz: transversal, chega às 3 telas" || fail "layout" "$OUT"
OUT="$(node "$EA" --root="$BK" --sugerir-mapa --json)"
[ "$(json_get "$OUT" 'Object.entries(o.areas).map(([k,a])=>k+"="+a.specs.join()).join(",")')" = "onboarding=e2e/onboarding.spec.ts,pix-out=e2e/pix-out.spec.ts,saldo=e2e/saldo.spec.ts" ] \
  && ok "--sugerir-mapa: 3 áreas com specs, vizinhos em branco" || fail "sugerir-mapa" "$OUT"
OUT="$(node "$EA" --root="$FX/rotas/react-router" --arquivos=src/pages/Carrinho.jsx --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo+":"+s.motivos[0].tipo).join()')" = "e2e/carrinho.spec.ts:rota" ] && ok "react router: tela resolvida pelo componente da rota → spec do /carrinho" || fail "rr tela" "$OUT"
OUT="$(node "$EA" --root="$FX/rotas/react-router" --arquivos=src/lib/preco.ts --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo).join()')" = "e2e/carrinho.spec.ts" ] && ok "import '../lib/preco.js' resolve para preco.ts (TS + ESM)" || fail "js→ts" "$OUT"
OUT="$(node "$EA" --root="$FX/rotas/react-router" --arquivos=src/App.jsx --json)"
[ "$(json_get "$OUT" 'o.transversal.motivos[0].motivo')" = "arquivo de rotas do app" ] && ok "arquivo de rotas alterado: transversal" || fail "router transversal" "$OUT"
node "$EA" --root="$BK" --base=--output=/tmp/x >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && [ ! -e /tmp/x...HEAD ] && ok "--base começando com '-': recusado (sem virar opção do git)" || fail "base injetado: exit $RC"
node "$EA" --root="$BK" --arquivos=../fora.ts >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "--arquivos com '..': recusado" || fail "arquivos fora: exit $RC"
OUT="$(node "$EA" --root="$BK" --arquivos=src/pix-out/enums.ts --out=.qa/tmp-selecao.json --json >/dev/null && cat "$BK/.qa/tmp-selecao.json")"; rm -f "$BK/.qa/tmp-selecao.json"
[ "$(json_get "$OUT" 'o.selecionados')" = "2" ] && ok "--out grava o mesmo JSON em arquivo (a skill não transcreve)" || fail "--out" "$OUT"
G="$(mktemp -d)"; cp -r "$BK/." "$G/"
gq() { git -C "$G" -c user.email=pudim@teste.local -c user.name=pudim "$@" >/dev/null 2>&1; }
gq init -b trunk; gq add -A; gq commit -m base; gq checkout -b feat/pix
echo "export const LIMITE = 1000;" >> "$G/src/pix-out/enums.ts"; gq commit -am pix
echo "// rascunho" >> "$G/e2e/helpers/cadastro.ts"
OUT="$(node "$EA" --root="$G" --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.alterados.join(",")')" = "e2e/helpers/cadastro.ts,src/pix-out/enums.ts" ] \
  && ok "git: commit da branch + mudança não commitada, comparando com o branch principal (trunk)" || fail "git: exit $RC" "$OUT"
[ "$(json_get "$OUT" 'o.selecionados')" = "3" ] && ok "git: 3 specs (pix-out, saldo e o onboarding do helper)" || fail "git specs" "$OUT"
mkdir -p "$G/src/app/página"; echo "export default function P(){return null}" > "$G/src/app/página/page.tsx"
OUT="$(node "$EA" --root="$G" --json)"
echo "$OUT" | grep -q '"src/app/página/page.tsx"' && ok "git: caminho com acento sem aspas nem escape (core.quotePath=false)" || fail "quotePath" "$OUT"
rm -rf "$G"
G="$(mktemp -d)"; node "$EA" --root="$G" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "sem git e sem --arquivos: exit 3" || fail "sem git: exit $RC"
rm -rf "$G"
node "$EA" --root="$FX/afetados/nao-existe" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "pasta ausente: exit 3" || fail "afetados ausente: exit $RC"

secao "[ui.mjs]"
UI="$(node --input-type=module -e "
import * as u from '$HERE/ui.mjs';
u.setColorLevel(0);
const t = (n, cond) => console.log((cond ? 'OK ' : 'NOK ') + n);
t('barra 80% em 10 blocos: 8 cheios e 2 vazios', u.bar(80, { largura: 10 }) === '████████░░');
t('barra 0% e 100%', u.bar(0, { largura: 4 }) === '░░░░' && u.bar(100, { largura: 4 }) === '████');
t('barra arredonda ao bloco mais próximo (35,71% de 20 = 7)', u.bar(35.71) === '█'.repeat(7) + '░'.repeat(13));
t('porcentagem em pt-BR com 2 casas', u.pct(63.4) === '63,40%' && u.pct(null) === '—');
t('setas: ▲ +5,00 · ▼ −2,50 · ━  0,00', u.delta(5) === '▲ +5,00' && u.delta(-2.5) === '▼ −2,50' && u.delta(0) === '━  0,00');
t('largura visível: emoji conta 2, ANSI conta 0', u.width('🍮a') === 3 && u.width('\x1b[31mab\x1b[0m') === 2);
t('NO_COLOR vence FORCE_COLOR', u.colorLevel({ NO_COLOR: '1', FORCE_COLOR: '3' }) === 0);
t('FORCE_COLOR=3: truecolor; fora de terminal: sem cor', u.colorLevel({ FORCE_COLOR: '3' }) === 3 && u.colorLevel({}, { isTTY: false }) === 0);
t('terminal com COLORTERM=truecolor: 3; TERM 256: 2', u.colorLevel({ COLORTERM: 'truecolor' }, { isTTY: true }) === 3 && u.colorLevel({ TERM: 'xterm-256color' }, { isTTY: true }) === 2);
u.setColorLevel(3);
t('truecolor usa o caramelo da marca (200,116,26)', u.c.caramelo('x').includes('38;2;200;116;26'));
u.setColorLevel(2);
t('256 cores: âmbar 214 na barra', u.bar(60, { largura: 2 }).includes('38;5;214'));
t('plural', u.plural(1, 'arquivo') === '1 arquivo' && u.plural(2, 'investigação', 'investigações') === '2 investigações');
t('stripAnsi remove OSC (hyperlink, área de transferência) e controle', u.stripAnsi('a\x1b]8;;http://x\x07b\x1b]52;c;Zm9v\x07c\x07d') === 'abcd');
u.setColorLevel(0);
t('barra só cheia em 100%: 95% de 10 blocos = 9', u.bar(95, { largura: 10 }) === '█████████░');
t('barra só vazia em 0%: 2% de 20 blocos = 1', u.bar(2, { largura: 20 }) === '█' + '░'.repeat(19));
")"
while IFS= read -r l; do case "$l" in "OK "*) ok "${l#OK }";; *) fail "${l#NOK }";; esac; done <<< "$UI"

secao "[painel.mjs]"
PN="$HERE/painel.mjs"; RX="$FX/relatorio"
OUT="$(node "$PN" cobertura --root="$RX/conforme")"; RC=$?
[ "$RC" -eq 0 ] && echo "$OUT" | grep -qF " Linhas     ██████████████████░░    90,00%  ▲ +30,00" \
  && ok "cobertura: barra de linhas 90,00% com ▲ +30,00 sobre a referência" || fail "painel cobertura: exit $RC" "$OUT"
OUT="$(node "$PN" cobertura --root="$RX/bloqueado")"
echo "$OUT" | grep -qF "├─ src/pagamentos/estorno.js  ░░░░░░░░░░  0,00%" && ok "cobertura: árvore com o arquivo sem teste primeiro (0,00%)" || fail "painel arvore" "$OUT"
echo "$OUT" | grep -qF "● Primeira medição: virou a referência" && ! echo "$OUT" | grep -qF "━" && ok "cobertura: primeira medição sem setas de diferença" || fail "primeira medição" "$OUT"
OUT="$(node "$PN" criar-e2e --root="$RX/conforme")"
echo "$OUT" | grep -qF "3 de 3  ▲ +2 rotas" && echo "$OUT" | grep -qF "🎯 Área carrinho · 1 de 3 arquivos de teste" \
  && ok "criar-e2e: rotas 1 → 3 de 3 (+2) e execução seletiva da área" || fail "painel e2e" "$OUT"
OUT="$(node "$PN" criar-unitario --root="$RX/conforme")"
echo "$OUT" | grep -qF "5 de 5  passaram" && echo "$OUT" | grep -qF "▲ +30,00" && ok "criar-unitario: antes 60,00% → depois 90,00% e 5 de 5 testes" || fail "painel unitario" "$OUT"
OUT="$(node "$PN" relatorio --root="$RX/bloqueado" --agora=2026-10-18T15:00:00)"
echo "$OUT" | grep -qF "⛔ BLOQUEADO" && echo "$OUT" | grep -qF "└─ 1 de 2 arquivos sem nenhum teste" && ok "relatorio: selo BLOQUEADO e motivos em árvore" || fail "painel relatorio" "$OUT"
OUT="$(node "$PN" portal --root="$RX/bloqueado")"
echo "$OUT" | grep -qF "4 de 5  1 falhou" && ok "portal: 4 de 5, \"1 falhou\" no singular" || fail "painel portal" "$OUT"
echo "$OUT" | grep -q $'\e' && fail "sem terminal: painel não pode ter cor" || ok "sem terminal: sai sem códigos de cor"
FORCE_COLOR=3 node "$PN" portal --root="$RX/bloqueado" | grep -q $'\e\[38;2;' && ok "FORCE_COLOR=3: cores em truecolor" || fail "FORCE_COLOR"
node "$PN" investigar --root="$RX/conforme" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 4 ] && ok "sem dados do comando: exit 4" || fail "sem dados: exit $RC"
node "$PN" nao-existe --root="$RX/conforme" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 2 ] && ok "comando desconhecido: exit 2" || fail "desconhecido: exit $RC"

secao "[nova-execucao.mjs + produto-intacto.mjs]"
NE="$HERE/nova-execucao.mjs"; PI="$HERE/produto-intacto.mjs"
T="$(mktemp -d)"; cp -r "$BK/." "$T/"
P1="$(node "$NE" criar-unitario --root="$T")"; P2="$(node "$NE" criar-unitario --root="$T")"
[[ "$P1" =~ ^\.qa/execucoes/[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}-criar-unitario$ ]] && [ -d "$T/$P1" ] && ok "nova-execucao: cria .qa/execucoes/AAAA-MM-DD-HHMM-criar-unitario com a hora real" || fail "nova-execucao" "$P1"
[ "$P1" != "$P2" ] && [ -d "$T/$P2" ] && ok "nova-execucao: duas no mesmo minuto não se sobrescrevem ($P2)" || fail "nova-execucao sufixo" "$P2"
node "$NE" board --root="$T" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 2 ] && ok "nova-execucao: comando desconhecido, exit 2" || fail "ne desconhecido: exit $RC"
OUT="$(node "$PI" --foto="$P1/produto-antes.json" --root="$T")"
[ "$(json_get "$OUT" 'o.totalProduto')" -gt 5 ] && [ -f "$T/$P1/produto-antes.json" ] && ok "produto-intacto: foto grava hash dos arquivos de produto (testes e .qa fora)" || fail "foto" "$OUT"
echo "// novo teste" > "$T/e2e/novo.spec.ts"
OUT="$(node "$PI" --comparar="$P1/produto-antes.json" --root="$T" --json)"; RC=$?
[ "$RC" -eq 0 ] && [ "$(json_get "$OUT" 'o.intacto')" = "true" ] && ok "produto-intacto: spec novo não conta como mudança no produto" || fail "intacto com spec: exit $RC" "$OUT"
echo "export const X = 1;" >> "$T/src/pix-out/enums.ts"; echo "x" > "$T/src/novo.ts"
OUT="$(node "$PI" --comparar="$P1/produto-antes.json" --root="$T" --json)"; RC=$?
[ "$RC" -eq 1 ] && [ "$(json_get "$OUT" '[o.alterados.join(),o.novosDeProduto.join()].join("|")')" = "src/pix-out/enums.ts|src/novo.ts" ] \
  && ok "produto-intacto: arquivo de produto alterado e novo → intacto=false, exit 1" || fail "alterado: exit $RC" "$OUT"
rm -rf "$T"

secao "[exemplos/banco-digital (projeto fictício)]"
BD="$HERE/../exemplos/banco-digital"
OUT="$(bash "$HERE/qa-detect.sh" "$BD")"
[ "$(json_get "$OUT" '[o.runner,o.e2e,o.e2eDir,o.tsPaths,o.webServer].join("|")')" = "vitest|playwright|e2e|true|true" ] \
  && ok "detect: vitest + playwright, e2eDir da config, aliases achados no tsconfig.app.json, webServer" || fail "detect banco" "$OUT"
OUT="$(node "$ER" --root="$BD" --json)"
[ "$(json_get "$OUT" '[o.rotas.map(r=>r.rota).join(","),o.cobertas,o.total].join("|")')" = "/,/extrato,/onboarding,/pix,/saldo|3|5" ] \
  && ok "rotas: 5 rotas do React Router (lazy e import direto), 3 cobertas; /onboarding conta pelo goto do Page Object" || fail "rotas banco" "$OUT"
OUT="$(node "$EA" --root="$BD" --arquivos=src/lib/pix/limite.ts --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo.replace("e2e/","")+":"+[...new Set(s.motivos.map(m=>m.tipo))].join("+")).join(",")')" = "pix-out.spec.ts:rota+mapa,saldo.spec.ts:mapa" ] \
  && ok "afetados: enum do pix (via alias @/ de tsconfig.app.json) → pix-out e vizinho saldo; onboarding fora" || fail "afetados banco" "$OUT"
OUT="$(node "$EA" --root="$BD" --arquivos=e2e/apoio/paginas.ts --json)"
[ "$(json_get "$OUT" 'o.specs.map(s=>s.arquivo+":"+s.motivos[0].tipo).join()')" = "e2e/onboarding.spec.ts:helper" ] && ok "afetados: Page Object alterado → só a spec que o importa" || fail "helper banco" "$OUT"
OUT="$(node "$EA" --root="$BD" --arquivos=src/componentes/Botao.tsx --json)"
[ "$(json_get "$OUT" '[o.specs.map(s=>s.arquivo.replace("e2e/","")).join(","),o.transversal.sim].join("|")')" = "onboarding.spec.ts,pix-out.spec.ts|false" ] \
  && ok "afetados: componente usado em 2 de 5 telas → as 2 specs, sem ser transversal" || fail "botao banco" "$OUT"
FT="$(mktemp -d)"
OUT="$(node "$HERE/produto-intacto.mjs" --foto="$FT/foto.json" --root="$BD")"
[ "$(json_get "$OUT" 'o.totalProduto')" -ge 15 ] && ! grep -q 'e2e/\|\.test\.ts\|\.qa/' "$FT/foto.json" \
  && ok "produto-intacto: lista só arquivos de produto do banco (testes, e2e e .qa fora)" || fail "foto banco" "$OUT"
rm -rf "$FT"

secao "[risco.mjs + instavel.mjs]"
RK="$HERE/risco.mjs"; IV="$HERE/instavel.mjs"
G="$(mktemp -d)"; cp -r "$BK/." "$G/"
gq() { git -C "$G" -c user.email=pudim@teste.local -c user.name=pudim "$@" >/dev/null 2>&1; }
gq init -b main; gq add -A; gq commit -m base
for i in 1 2 3; do echo "// $i" >> "$G/src/pix-out/enums.ts"; gq commit -am "pix $i"; done
echo "// x" >> "$G/src/saldo/formatar.ts"; gq commit -am saldo
OUT="$(node "$RK" --root="$G" --json)"
[ "$(json_get "$OUT" '[o.commits,o.arquivos[0].arquivo,o.arquivos[0].mudancas,o.arquivos[0].medido,o.aviso!==null].join("|")')" = "5|src/pix-out/enums.ts|4|false|true" ] \
  && ok "risco sem cobertura: ranking por mudanças (enums.ts 4 commits), aviso para rodar /qa:cobertura" || fail "risco sem cobertura" "$OUT"
mkdir -p "$G/.qa/execucoes/2026-10-01-1000-cobertura"
node -e 'const r=process.argv[1];require("fs").writeFileSync(r+"/.qa/execucoes/2026-10-01-1000-cobertura/summary.json",JSON.stringify({total:{lines:{pct:50}},[r+"/src/pix-out/enums.ts"]:{lines:{pct:20}},[r+"/src/saldo/formatar.ts"]:{lines:{pct:100}}}))' "$G"
OUT="$(node "$RK" --root="$G" --json)"
[ "$(json_get "$OUT" '[o.arquivos[0].arquivo,o.arquivos[0].cobertura,o.arquivos[0].risco,o.arquivos.find(a=>a.arquivo==="src/saldo/formatar.ts").risco].join("|")')" = "src/pix-out/enums.ts|20|3.2|0" ] \
  && ok "risco com cobertura: enums 4 × (100−20)/100 = 3,20 no topo; formatar com 100% tem risco 0 e vai para o fim" || fail "risco com cobertura" "$OUT"
[ "$(json_get "$OUT" 'o.arquivos.find(a=>a.arquivo==="app/layout.tsx").medido')" = "false" ] && ok "risco: arquivo fora da medição aparece como não medido" || fail "não medido" "$OUT"
rm -rf "$G"
OUT="$(node "$IV" --root="$RX/bloqueado" --json)"
[ "$(json_get "$OUT" '[o.execucoes,o.testes[0].classe,o.testes[0].alvo,o.aviso!==null].join("|")')" = "1|sempre_falha|tests/soma.spec.ts:4|true" ] \
  && ok "instavel: 1 execução → soma.spec sempre_falha, aviso de poucas rodadas" || fail "instavel bloqueado" "$OUT"
H="$(mktemp -d)"; mkdir -p "$H/.qa/portal/execucoes"
for i in 1 2 3 4; do st=$([ $((i % 2)) -eq 0 ] && echo passou || echo falhou)
  node -e 'const [d,i,st]=process.argv.slice(1);require("fs").writeFileSync(`${d}/.qa/portal/execucoes/2026-10-0${i}-100000.json`,JSON.stringify({execucao:`2026-10-0${i}-100000`,inicio:`2026-10-0${i}T10:00:00Z`,fim:`2026-10-0${i}T10:00:${10+Number(i)*5}Z`,alvo:null,parado:false,testes:[{id:"a",alvo:"e2e/a.spec.ts:3",titulo:"alterna",describe:[],projeto:"chromium",status:st},{id:"b",alvo:"e2e/b.spec.ts:3",titulo:"firme",describe:[],projeto:"chromium",status:"passou"}]}))' "$H" "$i" "$st"; done
OUT="$(node "$IV" --root="$H" --json)"
[ "$(json_get "$OUT" '[o.execucoes,o.instaveis,o.testes[0].titulo,o.testes[0].falhou,o.testes[0].rodadas,o.testes[0].taxaFalha,o.testes[1].classe].join("|")')" = "4|1|alterna|2|4|50|sempre_passa" ] \
  && ok "instavel: teste que alterna = instável, falhou em 2 de 4 (50,00%); o firme = sempre passa" || fail "instavel alterna" "$OUT"
[ "$(json_get "$OUT" '[o.duracoes.length,o.duracoes[3].duracaoMs].join("|")')" = "4|30000" ] && ok "instavel: duração de cada rodada (última 30 s)" || fail "duracoes" "$OUT"
rm -rf "$H"
OUT="$(bash "$HERE/qa-detect.sh" "$BD")"
[ "$(json_get "$OUT" '[o.typescript,o.eslint,o.tsconfigPrincipal].join("|")')" = "true|false|tsconfig.app.json" ] && ok "detect: typescript sim, eslint não, tsconfig principal = tsconfig.app.json" || fail "detect lint" "$OUT"

secao "[relatorio.mjs]"
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
[ "$(json_get "$OUT" 'o.numeros.find(n=>n.startsWith("Execução seletiva"))')" = "Execução seletiva: 1 de 3 arquivos de teste E2E (área: carrinho), não é a suíte completa" ] \
  && ok "conforme: execução da área (selecao.json) aparece como seletiva, 1 de 3" || fail "seletiva" "$OUT"
grep -q 'seletiva: 1 de 3 arquivos' "$T/c/"*-1500.html && ok "conforme: HTML marca a execução E2E como seletiva" || fail "seletiva html"
OUT="$(node "$RL" --root="$RX/depois-do-unitario" --saida="$T/d" $AG --json)"
[ "$(json_get "$OUT" '[o.status,o.numeros[0]].join("|")')" = "CONFORME ESPERADO|Cobertura (linhas): 100,00% · branches 94,73% · funções 100,00% (referência: 35,71%)" ] \
  && ok "depois do criar-unitario: usa a medição mais nova (100,00%), referência oficial continua 35,71%" || fail "depois-do-unitario" "$OUT"
# Alavancas do QA: .qa/config.json (ignorar, bloqueiaDias) e "Resolvido: sim"
B2="$(mktemp -d)"; cp -r "$RX/bloqueado/." "$B2/"
echo '{ "ignorar": ["src/pagamentos/estorno.js"], "bloqueiaDias": 1 }' > "$B2/.qa/config.json"
printf '\nResolvido: sim\n' >> "$B2/.qa/investigacoes/"*.md
OUT="$(node "$RL" --root="$B2" --saida="$T/b2" $AG --json)"
[ "$(json_get "$OUT" 'o.motivos.join("|")')" = "E2E: falhou em 1 de 5 na última execução (portal)" ] \
  && ok "config.json ignora o arquivo com 0% e 'Resolvido: sim' tira a investigação do bloqueio: só a falha E2E fica" || fail "config/resolvido" "$OUT"
echo '{"numTotalTests":4,"numPassedTests":3,"numFailedTests":1,"numPendingTests":0}' > "$B2/.qa/execucoes/2026-10-18-1000-cobertura/resultado.json"
OUT="$(node "$RL" --root="$B2" --saida="$T/b2" $AG --json)"
echo "$OUT" | grep -q "Testes unitários: 1 de 4 falharam na medição de cobertura" && ok "resultado.json da cobertura com falha → bloqueia" || fail "unit fail" "$OUT"
# Possível bug persiste entre rodadas e some com "Resolvido: sim"
mkdir -p "$B2/.qa/execucoes/2026-10-19-0900-criar-unitario"
printf '## Taxa vira texto\n\nEsperado: 3.5\nObtido: "3.5"\n\n## Estorno negativo aceito\n\nResolvido: sim\n' > "$B2/.qa/execucoes/2026-10-19-0900-criar-unitario/possiveis-bugs.md"
mkdir -p "$B2/.qa/execucoes/2026-10-20-0900-criar-unitario"; printf '## Taxa vira texto\n\nde novo\n' > "$B2/.qa/execucoes/2026-10-20-0900-criar-unitario/possiveis-bugs.md"
OUT="$(node "$RL" --root="$B2" --saida="$T/b2" $AG --json)"
echo "$OUT" | grep -q "1 possível(is) bug(s)" && ok "possíveis bugs: mesmo título em 2 rodadas conta 1; bloco com 'Resolvido: sim' sai" || fail "bugs resolvidos" "$OUT"
rm -rf "$B2"
# Valor plantado em .qa/ não pode virar HTML
X2="$(mktemp -d)"; cp -r "$RX/atencao/." "$X2/"
node -e 'const f=process.argv[1];const o=JSON.parse(require("fs").readFileSync(f));o.filesZero="<img src=x onerror=alert(1)>";require("fs").writeFileSync(f,JSON.stringify(o))' "$X2/.qa/execucoes/2026-10-18-1000-cobertura/comparativo.json"
node "$RL" --root="$X2" --saida="$T/x2" $AG --json >/dev/null
grep -q "<img src=x" "$T/x2/ultimo.html" && fail "XSS: valor de .qa/ entrou cru no HTML" || ok "valor plantado em comparativo.json sai escapado no HTML (sem XSS)"
rm -rf "$X2"
OUT="$(node "$RL" --root="$RX/vazio" --saida="$T/v" $AG --json)"
[ "$(json_get "$OUT" 'o.status')" = "SEM DADOS" ] && ok "vazio: SEM DADOS com orientação" || fail "vazio" "$OUT"
node "$RL" --root="$RX/nao-existe" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 3 ] && ok "pasta ausente: exit 3" || fail "relatorio ausente: exit $RC"
rm -rf "$T"

secao "[evidencia.mjs]"
EV="$HERE/evidencia.mjs"; EF="$FX/evidencia"
E="$(mktemp -d)"; cp -r "$EF/." "$E/"
ge() { git -C "$E" -c user.email=pudim@teste.local -c user.name=pudim "$@" >/dev/null 2>&1; }
ge init -b main; ge add -A; ge commit -m "arredonda taxa"
# resultado.json como o Playwright grava (anexos com caminho absoluto); o trace não existe de propósito.
node -e 'const r=process.argv[1];require("fs").writeFileSync(r+"/.qa/execucoes/2026-10-21-1100-criar-e2e/resultado.json",JSON.stringify({suites:[{title:"boleto.spec.ts",file:"e2e/boleto.spec.ts",specs:[{title:"taxa do boleto aparece como número",id:"x1",line:5,tests:[{projectName:"chromium",status:"unexpected",results:[{status:"failed",duration:1200,error:{message:"Expected string: \"2.5\"\nReceived string: \"2.50\""},attachments:[{name:"screenshot",path:r+"/test-results/boleto/test-failed-1.png"},{name:"trace",path:r+"/test-results/boleto/trace.zip"}]}]}]}]}]}))' "$E"
OUT="$(node "$EV" --root="$E" --listar --json)"
[ "$(json_get "$OUT" '[o.bugs.length,o.bugs[0].titulo,o.bugs[0].classificacao,o.bugs[0].frequencia,o.bugs[0].investigacao!==null&&o.bugs[0].registro!==null,o.bugs[1].classificacao].join("|")')" = "2|Taxa do boleto vira texto|Bug no produto|falhou em 5 de 5|true|Possível bug (ao criar testes)" ] \
  && ok "evidencia --listar: 2 bugs; investigação e possiveis-bugs.md com o mesmo título viram um só" || fail "evidencia listar" "$OUT"
OUT="$(node "$EV" --root="$E" --bug=boleto --json)"
PASTA="$(json_get "$OUT" 'o.pasta')"
[ "$(json_get "$OUT" '[/^\.qa\/evidencias\/\d{4}-\d{2}-\d{2}-taxa-boleto-vira-texto$/.test(o.pasta),o.arquivos.map(a=>a.split("/").slice(3).join("/")).join(","),o.faltando.length,o.anexos.length,o.testes[0].comando,o.historico[0].arquivo,o.historico[0].blame!==null].join("|")')" = "true|pacote.md,relato.md,registro-criacao.md,teste/boleto.spec.ts,anexos/taxa-boleto-aparece-numero-test-failed-1.png|1|2|npx playwright test .qa/execucoes/2026-10-21-1100-criar-e2e/bugs/boleto.spec.ts|src/cobranca/taxa.js|true" ] \
  && ok "evidencia --bug: pacote com relato, registro, só o teste do boleto (estorno fica fora), 2 execuções falhas (criar-e2e e portal) com o screenshot copiado uma vez, trace em faltando, blame da linha 4" || fail "evidencia bug" "$OUT"
P="$E/$PASTA/pacote.md"
grep -q '^\- \*\*Commit suspeito:\*\* abc1234' "$P" && grep -q '^## Trecho' "$P" && grep -q 'return taxa.toFixed(2);' "$P" && grep -q '^## Teste que reproduz' "$P" && grep -q '^1. npx jest' "$P" && grep -q '^2. Observar' "$P" \
  && ok "pacote.md: commit suspeito, trecho, teste que reproduz e passos sem indentação" || fail "pacote.md" "$(cat "$P")"
node "$EV" --root="$E" --bug=boleto >/dev/null
[ "$(find "$E/$PASTA/anexos" "$E/$PASTA/teste" -type f | wc -l)" -eq 2 ] && ok "rodar de novo regrava o pacote sem duplicar anexos" || fail "duplicou" "$(find "$E/$PASTA" -type f)"
node "$EV" --root="$E" --bug=xyz >/dev/null 2>&1; RC=$?
[ "$RC" -eq 4 ] && ok "termo sem bug: exit 4" || fail "evidencia exit 4: $RC"
node "$EV" --root="$E" --bug=.qa/execucoes >/dev/null 2>&1; RC=$?
[ "$RC" -eq 5 ] && ok "termo ambíguo (bate em 2 bugs): exit 5" || fail "evidencia exit 5: $RC"
node "$EV" --root="$E" >/dev/null 2>&1; RC=$?
[ "$RC" -eq 2 ] && ok "sem --bug nem --listar: exit 2" || fail "evidencia exit 2: $RC"
rm -rf "$E"

secao "[portal (server.mjs + playwright-report.mjs)]"
PT="$(node "$HERE/__tests__/portal-test.mjs" 2>&1)"
echo "$PT" | grep -v '^RESULTADO '
LINE="$(echo "$PT" | grep '^RESULTADO ' | tail -1)"
if [ -n "$LINE" ]; then
  set -- $LINE; PASS=$((PASS+$2)); FAIL=$((FAIL+$3))
else
  fail "portal-test.mjs não terminou" "$(echo "$PT" | tail -5)"
fi

TOTAL=$((PASS+FAIL)); CHEIO=$(( TOTAL ? PASS * 20 / TOTAL : 0 )); BARRA=''
for ((j=0; j<20; j++)); do if [ "$j" -lt "$CHEIO" ]; then BARRA+="${AMB}█"; else BARRA+="${SUA}░"; fi; done
echo ""
echo "${SUA}────────────────────────────────────────────────────────${R}"
echo " ${BARRA}${R}  ${OURO}$PASS de $TOTAL${R}  $([ "$FAIL" -eq 0 ] && echo "${BOM}✔ tudo passou${R}" || echo "${FAL}✘ $FAIL falharam${R}")"
echo "  Passaram: $PASS   Falharam: $FAIL"
echo ""
[ "$FAIL" -eq 0 ]
