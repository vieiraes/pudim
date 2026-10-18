#!/bin/bash
# =============================================================================
# 🍮 Pudim — Repete um comando N vezes e conta exatamente quantas passaram.
# Serve para separar "bug que sempre acontece" de "teste instável" com número exato.
#
# Uso:
#   bash scripts/repetir-teste.sh <N> -- <comando de teste...>
#   ex.: bash scripts/repetir-teste.sh 10 -- npx jest src/__tests__/taxa.test.js -t "boleto"
#
# Saída (última linha): JSON
#   {"runs":10,"passed":3,"failed":7,"failRate":"70.00","verdict":"instavel","exitCodes":{"0":3,"1":7}}
#   verdict: "sempre_passa" | "sempre_falha" | "instavel"
# Exit: 0 se sempre passou, 1 se sempre falhou, 2 se instável, 3 uso inválido.
# =============================================================================
set -uo pipefail

N="${1:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]] || [ "$N" -lt 1 ] || [ "${2:-}" != "--" ] || [ $# -lt 3 ]; then
  echo "Uso: repetir-teste.sh <N> -- <comando...>" >&2
  exit 3
fi
shift 2

PASSED=0; FAILED=0
declare -A CODES=()
for ((i=1; i<=N; i++)); do
  "$@" >/dev/null 2>&1
  rc=$?
  CODES[$rc]=$(( ${CODES[$rc]:-0} + 1 ))
  if [ "$rc" -eq 0 ]; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  echo "  execução $i/$N: $([ "$rc" -eq 0 ] && echo passou || echo "falhou (código $rc)")" >&2
done

if   [ "$FAILED" -eq 0 ]; then VERDICT="sempre_passa"; EXIT=0
elif [ "$PASSED" -eq 0 ]; then VERDICT="sempre_falha"; EXIT=1
else VERDICT="instavel"; EXIT=2; fi

RATE=$(LC_ALL=C awk -v f="$FAILED" -v n="$N" 'BEGIN { printf "%.2f", (f*100)/n }')
CODES_JSON=""
for k in "${!CODES[@]}"; do CODES_JSON+="\"$k\":${CODES[$k]},"; done
CODES_JSON="{${CODES_JSON%,}}"

echo "Resultado: passou em $PASSED de $N, falhou em $FAILED de $N ($RATE% de falha) → $VERDICT" >&2
echo "{\"runs\":$N,\"passed\":$PASSED,\"failed\":$FAILED,\"failRate\":\"$RATE\",\"verdict\":\"$VERDICT\",\"exitCodes\":$CODES_JSON}"
exit $EXIT
