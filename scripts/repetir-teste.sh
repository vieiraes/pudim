#!/bin/bash
# =============================================================================
# 🍮 Pudim — Repete um comando de teste N vezes e conta exatamente quantas passaram.
# Serve para separar "bug que sempre acontece" de "teste instável" com número exato.
#
# Uso:
#   bash scripts/repetir-teste.sh <N> -- <comando de teste...>
#   ex.: bash scripts/repetir-teste.sh 10 -- npx jest src/__tests__/taxa.test.js -t "boleto"
#
# Só aceita comandos de teste: o primeiro argumento depois de "--" precisa ser npx, pnpm, yarn,
# bun, bunx, npm ou node, e não pode haver sh/bash/-c/-e/--eval no comando. Essa restrição
# existe porque a skill libera este script sem pedir permissão a cada chamada.
#
# Saída (última linha): JSON
#   {"runs":10,"passed":3,"failed":7,"failRate":"70.00","verdict":"instavel","exitCodes":{"0":3,"1":7},
#    "lastError":"...","noTests":false}
#   verdict: "sempre_passa" | "sempre_falha" | "instavel"
#   noTests: true quando a saída indica que nenhum teste rodou ("No tests found"): aí "falhou"
#   não é evidência de bug, é filtro/caminho errado.
# Exit: 0 se sempre passou, 1 se sempre falhou, 2 se instável, 3 uso inválido ou comando não permitido.
# =============================================================================
set -uo pipefail

N="${1:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]] || [ "$N" -lt 1 ] || [ "$N" -gt 200 ] || [ "${2:-}" != "--" ] || [ $# -lt 3 ]; then
  echo "Uso: repetir-teste.sh <N (1-200)> -- <comando...>" >&2
  exit 3
fi
shift 2

case "$1" in
  npx|pnpm|yarn|bun|bunx|npm|node) ;;
  *) echo "Comando não permitido: '$1'. Use npx, pnpm, yarn, bun, bunx, npm ou node." >&2; exit 3 ;;
esac
for arg in "$@"; do
  case "$arg" in
    sh|bash|zsh|dash|-c|-e|--eval|-p|--print|eval|exec)
      echo "Argumento não permitido em um comando de teste: '$arg'." >&2; exit 3 ;;
  esac
done

# Cores da paleta do Pudim (scripts/ui.mjs), só se o stderr for terminal e sem NO_COLOR.
usa_cor() {
  [ -n "${NO_COLOR:-}" ] && return 1
  [ -n "${FORCE_COLOR:-}" ] && { [ "$FORCE_COLOR" != "0" ]; return; }
  [ -t 2 ] && [ "${TERM:-}" != "dumb" ]
}
if usa_cor; then
  AMB=$'\e[38;5;214m'; OURO=$'\e[1;38;5;222m'; BOM=$'\e[38;5;114m'; FAL=$'\e[38;5;167m'; SUA=$'\e[38;5;244m'; CAR=$'\e[1;38;5;172m'; R=$'\e[0m'
else AMB=''; OURO=''; BOM=''; FAL=''; SUA=''; CAR=''; R=''; fi
# barra <feitos> <total> <largura>
barra() { local f=$(( $1 * $3 / $2 )) j s=''; for ((j=0; j<$3; j++)); do if [ "$j" -lt "$f" ]; then s+="${AMB}█"; else s+="${SUA}░"; fi; done; printf '%s%s' "$s" "$R"; }
LARG=$(( N < 20 ? N : 20 )); [ "$LARG" -lt 10 ] && LARG=10
echo "🍮 ${CAR}Pudim${R} ${SUA}·${R} ${OURO}repetir teste${R}  ${SUA}$N execuções${R}" >&2
echo "${SUA}────────────────────────────────────────────────────────${R}" >&2

PASSED=0; FAILED=0; LAST_ERROR=''; NO_TESTS=false
OUT="$(mktemp)"
declare -A CODES=()
for ((i=1; i<=N; i++)); do
  "$@" >"$OUT" 2>&1
  rc=$?
  CODES[$rc]=$(( ${CODES[$rc]:-0} + 1 ))
  if [ "$rc" -eq 0 ]; then PASSED=$((PASSED+1)); MARCA="${BOM}✔ passou${R}"
  else
    FAILED=$((FAILED+1)); MARCA="${FAL}✘ falhou (código $rc)${R}"
    # Última linha com cara de erro, para a investigação não depender só do código de saída.
    LAST_ERROR="$(grep -m1 -E 'Error|Expected|Received|expect\(|AssertionError|FAIL|✘|×' "$OUT" | head -c 300 | tr -d '\r')"
    grep -qiE 'no tests? found|no test files|0 tests|found 0 test|No tests matched|did not match any' "$OUT" && NO_TESTS=true
  fi
  printf ' %s %s%*d/%d%s  %s\n' "$(barra "$i" "$N" "$LARG")" "$OURO" "${#N}" "$i" "$N" "$R" "$MARCA" >&2
done
rm -f "$OUT"

if   [ "$FAILED" -eq 0 ]; then VERDICT="sempre_passa"; EXIT=0
elif [ "$PASSED" -eq 0 ]; then VERDICT="sempre_falha"; EXIT=1
else VERDICT="instavel"; EXIT=2; fi

RATE=$(LC_ALL=C awk -v f="$FAILED" -v n="$N" 'BEGIN { printf "%.2f", (f*100)/n }')
CODES_JSON=""
for k in "${!CODES[@]}"; do CODES_JSON+="\"$k\":${CODES[$k]},"; done
CODES_JSON="{${CODES_JSON%,}}"
LAST_JSON=$(printf '%s' "$LAST_ERROR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.stringify(s)))')

case "$VERDICT" in
  sempre_passa) SELO="${BOM}✔ SEMPRE PASSA${R}" ;;
  sempre_falha) SELO="${FAL}✘ SEMPRE FALHA${R}" ;;
  *) SELO="${AMB}⚠️  INSTÁVEL${R}" ;;
esac
echo "${SUA}────────────────────────────────────────────────────────${R}" >&2
echo " $SELO  ${SUA}·${R} passou em ${OURO}$PASSED de $N${R}, falhou em ${OURO}$FAILED de $N${R} ${SUA}(${RATE/./,}% de falha)${R}" >&2
[ -n "$LAST_ERROR" ] && echo " ${SUA}último erro:${R} $LAST_ERROR" >&2
[ "$NO_TESTS" = true ] && echo " ${AMB}! Nenhum teste rodou em pelo menos uma execução: confira o filtro ou o caminho do teste.${R}" >&2
echo "{\"runs\":$N,\"passed\":$PASSED,\"failed\":$FAILED,\"failRate\":\"$RATE\",\"verdict\":\"$VERDICT\",\"exitCodes\":$CODES_JSON,\"lastError\":$LAST_JSON,\"noTests\":$NO_TESTS}"
exit $EXIT
