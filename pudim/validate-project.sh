#!/bin/bash
# =============================================================================
# 🍮 Pudim SDD — Validador de Projeto
# Verifica a integridade do fluxo Pudim SDD no repositório.
#
# Como usar:
#   chmod +x pudim/validate-project.sh
#   ./pudim/validate-project.sh          # validação completa
#   ./pudim/validate-project.sh --quick  # só erros críticos (para pre-commit)
# =============================================================================

set -euo pipefail

# --- Cores -------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# --- Modo --------------------------------------------------------------------
QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

# --- Contadores --------------------------------------------------------------
ERRORS=0
WARNINGS=0
CHECKS=0

# --- Funções de output -------------------------------------------------------
pass()  { echo -e "  ${GREEN}✔${RESET}  $1"; }
fail()  { echo -e "  ${RED}✘${RESET}  ${RED}$1${RESET}"; ERRORS=$((ERRORS+1)); }
warn()  { echo -e "  ${YELLOW}⚠${RESET}  ${YELLOW}$1${RESET}"; WARNINGS=$((WARNINGS+1)); }
info()  { echo -e "  ${DIM}ℹ  $1${RESET}"; }
check() { CHECKS=$((CHECKS+1)); echo -e "\n${BLUE}${BOLD}[$CHECKS] $1${RESET}"; }

# --- Raiz do projeto ---------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATUS_FILE="$ROOT/STATUS.md"
SPECS_DIR="$ROOT/pudim/specs"

# Extrai apenas os IDs das tasks registradas (não dos campos de dependência)
_get_registered_task_ids() {
  grep -E '^\s*- \[[ x]\] TASK-' "$STATUS_FILE" \
    | grep -oP '(?<=\] )TASK-[0-9]+' \
    | sort -u || true
}

# =============================================================================
echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}${BOLD}║   🍮  Pudim SDD — Validação do Projeto       ║${RESET}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo -e "${DIM}  Projeto: $(basename "$ROOT")${RESET}"
echo ""

# =============================================================================
# CHECK 1: STATUS.md existe
# =============================================================================
check "STATUS.md existe"
if [[ -f "$STATUS_FILE" ]]; then
  pass "STATUS.md encontrado."
else
  fail "STATUS.md não encontrado na raiz do projeto."
  if $QUICK; then exit 1; fi
fi

# =============================================================================
# CHECK 2: Formato das linhas de task no STATUS.md
# =============================================================================
check "Formato das tasks no STATUS.md"
TASK_LINES=$(grep -E '^\s*- \[[ x]\] TASK-' "$STATUS_FILE" 2>/dev/null || true)

if [[ -z "$TASK_LINES" ]]; then
  info "Nenhuma task registrada no STATUS.md ainda."
else
  while IFS= read -r line; do
    # Validar formato: - [ ] TASK-NNN | Título | Depende de: ...
    if echo "$line" | grep -qE '^\s*- \[[ x]\] TASK-[0-9]+ \| .+ \| Depende de: '; then
      task_id=$(echo "$line" | grep -oE 'TASK-[0-9]+' | head -1)
      pass "Formato válido: $task_id"
    else
      fail "Formato inválido: $line"
      info "Esperado: - [ ] TASK-NNN | Título | Depende de: TASK-XXX ou -"
    fi
  done <<< "$TASK_LINES"
fi

# =============================================================================
# CHECK 3: Dependências válidas (referências existem no STATUS.md)
# =============================================================================
check "Dependências válidas no STATUS.md"
TASK_IDS=$(_get_registered_task_ids)

while IFS= read -r line; do
  [[ "$line" =~ ^\s*-\ \[.?\]\ (TASK-[0-9]+) ]] || continue
  current_task="${BASH_REMATCH[1]}"

  # Extrair dependências após "Depende de:"
  deps_raw=$(echo "$line" | grep -oP '(?<=Depende de: ).*' || true)
  deps_raw=$(echo "$deps_raw" | tr ',' '\n' | tr -d ' ')

  while IFS= read -r dep; do
    dep=$(echo "$dep" | tr -d '[:space:]')
    [[ -z "$dep" || "$dep" == "-" ]] && continue
    if echo "$TASK_IDS" | grep -q "^${dep}$"; then
      pass "$current_task → $dep: referência válida."
    else
      fail "$current_task → $dep: dependência inexistente no STATUS.md."
    fi
  done <<< "$deps_raw"
done < "$STATUS_FILE"

# =============================================================================
# CHECK 4: Cada task tem pasta pudim/specs/TASK-XYZ/
# =============================================================================
check "Spec pack existe para cada task"
while IFS= read -r line; do
  task_id=$(echo "$line" | grep -oE 'TASK-[0-9]+' | head -1)
  [[ -z "$task_id" ]] && continue

  spec_dir="$SPECS_DIR/$task_id"
  if [[ -d "$spec_dir" ]]; then
    pass "$task_id: pasta $spec_dir existe."
  else
    fail "$task_id: pasta pudim/specs/$task_id/ não encontrada."
  fi
done < <(grep -E '^\s*- \[[ x]\] TASK-' "$STATUS_FILE" 2>/dev/null || true)

# =============================================================================
# CHECK 5: SPEC.md, TASKS.md e VALIDATION.md presentes em cada spec pack
# =============================================================================
check "Arquivos obrigatórios em cada spec pack"
if [[ -d "$SPECS_DIR" ]]; then
  for spec_dir in "$SPECS_DIR"/TASK-*/; do
    [[ -d "$spec_dir" ]] || continue
    task_id=$(basename "$spec_dir")

    for required_file in SPEC.md TASKS.md VALIDATION.md; do
      if [[ -f "$spec_dir$required_file" ]]; then
        pass "$task_id/$required_file: presente."
      else
        fail "$task_id/$required_file: AUSENTE."
      fi
    done
  done
else
  info "Diretório pudim/specs/ ainda não existe."
fi

# =============================================================================
# CHECK 6: Critérios de aceite na SPEC refletidos na VALIDATION (warnings)
# =============================================================================
if ! $QUICK; then
  check "Alinhamento de critérios de aceite SPEC ↔ VALIDATION"

  if [[ -d "$SPECS_DIR" ]]; then
    for spec_dir in "$SPECS_DIR"/TASK-*/; do
      [[ -d "$spec_dir" ]] || continue
      task_id=$(basename "$spec_dir")
      spec_file="$spec_dir/SPEC.md"
      validation_file="$spec_dir/VALIDATION.md"

      [[ -f "$spec_file" && -f "$validation_file" ]] || continue

      spec_criteria=$(grep -oE 'CA-[0-9]+' "$spec_file" | sort -u || true)
      validation_criteria=$(grep -oE 'CA-[0-9]+' "$validation_file" | sort -u || true)

      while IFS= read -r ca; do
        [[ -z "$ca" ]] && continue
        if echo "$validation_criteria" | grep -q "^${ca}$"; then
          pass "$task_id: $ca presente na VALIDATION."
        else
          warn "$task_id: $ca está na SPEC mas não na VALIDATION."
        fi
      done <<< "$spec_criteria"
    done
  fi
fi

# =============================================================================
# CHECK 7: Pastas órfãs em pudim/specs/ (sem task no STATUS.md)
# =============================================================================
if ! $QUICK; then
  check "Spec packs órfãos (pasta sem task no STATUS.md)"

  if [[ -d "$SPECS_DIR" ]]; then
    for spec_dir in "$SPECS_DIR"/TASK-*/; do
      [[ -d "$spec_dir" ]] || continue
      task_id=$(basename "$spec_dir")

      if grep -qE "^\s*- \[.?\] ${task_id} " "$STATUS_FILE" 2>/dev/null; then
        pass "$task_id: referenciado no STATUS.md."
      else
        warn "$task_id: pasta em pudim/specs/ mas task não encontrada no STATUS.md."
      fi
    done
  fi
fi

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${BLUE}${BOLD}══════════════════════════════════════════════${RESET}"
echo -e "  Checks executados : ${BOLD}$CHECKS${RESET}"
echo -e "  Erros críticos    : ${ERRORS:-0} $([ "$ERRORS" -gt 0 ] && echo -e "${RED}${BOLD}← BLOQUEANTE${RESET}" || echo -e "${GREEN}✔${RESET}")"
echo -e "  Avisos            : ${WARNINGS:-0} $([ "$WARNINGS" -gt 0 ] && echo -e "${YELLOW}(revise antes de continuar)${RESET}" || echo -e "${GREEN}✔${RESET}")"
echo -e "${BLUE}${BOLD}══════════════════════════════════════════════${RESET}"
echo ""

if [[ "$ERRORS" -gt 0 ]]; then
  echo -e "  ${RED}${BOLD}✘  Validação falhou. Corrija os erros acima antes de prosseguir.${RESET}"
  echo ""
  exit 1
else
  echo -e "  ${GREEN}${BOLD}✔  Projeto válido! Fluxo Pudim SDD consistente.${RESET}"
  echo ""
  exit 0
fi
