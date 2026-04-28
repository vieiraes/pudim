#!/bin/bash
# =============================================================================
# 🍮 Pudim SDD — Wizard de Setup
# Guia o dev junior por todos os pré-requisitos do projeto, passo a passo.
#
# Como usar:
#   chmod +x pudim/setup.sh
#   ./pudim/setup.sh
# =============================================================================

set -e

COMMAND_CONST="/pudim-const"
COMMAND_START="/pudim-iniciar"
COMMAND_TASK_REGISTER="/pudim-tarefa-registrar"
COMMAND_TASK_CREATE="/pudim-tarefa-criar"
COMMAND_TASK_VALIDATE="/pudim-tarefa-validar"
COMMAND_TASK_CLOSE="/pudim-tarefa-fechar"
COMMAND_STATUS="/pudim-status"

# --- Cores -------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# --- Funções de UI -----------------------------------------------------------
print_header() {
  clear
  echo ""
  echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
  echo -e "${BLUE}${BOLD}║   🍮  Pudim SDD — Wizard de Setup            ║${RESET}"
  echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
  echo -e "${DIM}  Projeto: $(basename "$PWD")${RESET}"
  echo ""
}

print_progress_bar() {
  local current=$1
  local total=$2
  local filled=$(( current * 24 / total ))
  local empty=$(( 24 - filled ))
  local bar=""
  local i

  for ((i=0; i<filled; i++)); do bar+="■"; done
  for ((i=0; i<empty; i++)); do bar+="·"; done

  echo -e "${DIM}  Progresso: [${bar}] ${current}/${total}${RESET}"
}

print_step() {
  echo ""
  echo -e "${CYAN}${BOLD}┌─ Passo $1 de $TOTAL_STEPS — $2${RESET}"
  echo -e "${CYAN}${DIM}└──────────────────────────────────────────────${RESET}"
  print_progress_bar "$1" "$TOTAL_STEPS"
  echo ""
}

ok()   { echo -e "  ${GREEN}✔  $1${RESET}"; }
fail() { echo -e "  ${RED}✘  $1${RESET}"; }
warn() { echo -e "  ${YELLOW}⚠  $1${RESET}"; }
info() { echo -e "  ${DIM}ℹ  $1${RESET}"; }
tip()  { echo -e "  ${BLUE}→  $1${RESET}"; }

ask_continue() {
  echo ""
  echo -e "  ${YELLOW}Pressione ENTER para continuar ou Ctrl+C para sair.${RESET}"
  read -r
}

ask_confirm() {
  echo ""
  echo -e "  ${YELLOW}→ $1 (s/n):${RESET} \c"
  read -r RESP
  [[ "$RESP" =~ ^[Ss]$ ]]
}

TOTAL_STEPS=8
ERROS=0

# =============================================================================
print_header

echo -e "  Olá! Este wizard verifica tudo que você precisa para"
echo -e "  usar o ${BOLD}Pudim SDD${RESET} neste projeto."
echo ""
echo -e "  ${DIM}Tempo estimado: 5 minutos.${RESET}"
echo -e "  ${DIM}Ao final, você sai com o projeto pronto para usar os comandos do framework.${RESET}"
ask_continue

# =============================================================================
print_step 1 "Verificando Git"

if command -v git &>/dev/null; then
  ok "Git instalado: $(git --version)"
else
  fail "Git não encontrado."
  info "Instale em: https://git-scm.com/downloads"
  info "Depois rode este script novamente."
  ERROS=$((ERROS+1))
fi

if git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  ok "Repositório Git detectado."
else
  warn "Esta pasta não é um repositório Git."
  if ask_confirm "Quer inicializar um repositório Git agora?"; then
    git init && ok "Repositório inicializado."
  else
    warn "Lembre de rodar 'git init' antes de commitar."
  fi
fi

ask_continue

# =============================================================================
print_step 2 "Verificando Node.js (se aplicável ao projeto)"

if command -v node &>/dev/null; then
  NODE_V=$(node --version)
  ok "Node.js: $NODE_V"
  MAJOR=$(echo "$NODE_V" | sed 's/v//' | cut -d. -f1)
  if [ "$MAJOR" -lt 18 ]; then
    warn "Recomendado Node 18+. Considere atualizar: https://nodejs.org"
  fi
  command -v npm  &>/dev/null && ok "npm:  $(npm --version)"
  command -v pnpm &>/dev/null && ok "pnpm: $(pnpm --version)"
  command -v yarn &>/dev/null && ok "yarn: $(yarn --version)"
else
  info "Node.js não encontrado. Se o projeto não usa Node, tudo bem."
  info "Se precisar: https://nodejs.org"
fi

ask_continue

# =============================================================================
print_step 3 "Verificando estrutura do Pudim"

ARQUIVOS=(
  "pudim/README.md"
  "pudim/CARTILHA.md"
  "pudim/COMMANDS.md"
  "pudim/WORKFLOW.md"
  "pudim/INSTALL.md"
  "pudim/templates/CONST.md"
  "pudim/templates/SPEC.md"
  "pudim/templates/TASKS.md"
  "pudim/templates/VALIDATION.md"
)

TODOS_OK=true
for f in "${ARQUIVOS[@]}"; do
  if [ -f "$f" ]; then ok "$f"
  else fail "Não encontrado: $f"; TODOS_OK=false; ERROS=$((ERROS+1)); fi
done

if [ "$TODOS_OK" = false ]; then
  warn "Copie a pasta pudim/ completa para este projeto."
  info "Veja: pudim/INSTALL.md"
fi

ask_continue

# =============================================================================
print_step 4 "Verificando CONST.md (regras inegociáveis)"

if [ -f "CONST.md" ]; then
  ok "CONST.md encontrado na raiz do projeto."
  LINES=$(wc -l < CONST.md)
  if [ "$LINES" -gt 50 ]; then
    warn "CONST.md tem $LINES linhas. O limite recomendado é 50."
  else
    ok "Tamanho OK: $LINES linhas."
  fi
else
  warn "CONST.md não encontrado — ele deve ser o PRIMEIRO arquivo do projeto."
  if ask_confirm "Quer criar o CONST.md agora a partir do template?"; then
    cp pudim/templates/CONST.md CONST.md
    ok "CONST.md criado. Preencha antes de iniciar qualquer tarefa."
    tip "Use o comando ${COMMAND_CONST} no Copilot Chat ou Claude para preencher guiado."
  else
    warn "Crie o CONST.md antes de abrir a primeira spec."
    ERROS=$((ERROS+1))
  fi
fi

ask_continue

# =============================================================================
print_step 5 "Criando arquivos do projeto"

if [ -f "AGENTS.md" ]; then
  ok "AGENTS.md encontrado."
else
  warn "AGENTS.md não encontrado — define as regras do seu produto para os agentes de IA."
  if ask_confirm "Criar AGENTS.md genérico a partir do template?"; then
    cp pudim/templates/AGENTS.md AGENTS.md
    ok "AGENTS.md criado. Preencha com as regras do seu projeto."
  else
    warn "Crie o AGENTS.md antes de iniciar tarefas."
    ERROS=$((ERROS+1))
  fi
fi

if [ -f "CLAUDE.md" ]; then
  ok "CLAUDE.md encontrado."
else
  warn "CLAUDE.md não encontrado — orienta o Claude Code neste projeto."
  if ask_confirm "Criar CLAUDE.md a partir do template?"; then
    cp pudim/templates/CLAUDE.md CLAUDE.md
    ok "CLAUDE.md criado."
  else
    warn "Crie o CLAUDE.md se for usar Claude Code."
  fi
fi

if [ -f "STATUS.md" ]; then
  ok "STATUS.md encontrado."
else
  warn "STATUS.md não encontrado — rastreia as tarefas do projeto."
  if ask_confirm "Criar STATUS.md vazio a partir do template?"; then
    cp pudim/templates/STATUS.md STATUS.md
    ok "STATUS.md criado."
  else
    warn "Crie o STATUS.md antes de adicionar tarefas."
    ERROS=$((ERROS+1))
  fi
fi

ask_continue

# =============================================================================
print_step 6 "Verificando ferramentas de IA"

echo -e "  ${BOLD}GitHub Copilot:${RESET}"
COPILOT_ARQUIVOS=(
  ".github/skills/pudim-sdd/SKILL.md"
  ".github/prompts/pudim-const.prompt.md"
  ".github/prompts/pudim-iniciar.prompt.md"
  ".github/prompts/pudim-tarefa-registrar.prompt.md"
  ".github/prompts/pudim-tarefa-criar.prompt.md"
  ".github/prompts/pudim-tarefa-validar.prompt.md"
  ".github/prompts/pudim-tarefa-fechar.prompt.md"
  ".github/prompts/pudim-status.prompt.md"
  ".github/agents/pudim-orchestrator.agent.md"
)
COPILOT_OK=true
for f in "${COPILOT_ARQUIVOS[@]}"; do
  if [ -f "$f" ]; then ok "$f"
  else fail "Não encontrado: $f"; COPILOT_OK=false; fi
done

echo ""
if [ "$COPILOT_OK" = false ]; then
  warn "Arquivos do Copilot incompletos. Veja: pudim/INSTALL.md"
  ERROS=$((ERROS+1))
else
  ok "Pacote de prompts do Pudim encontrado e consistente."
  tip "Comandos disponíveis: ${COMMAND_CONST}, ${COMMAND_START}, ${COMMAND_STATUS}"
fi

ask_continue

# =============================================================================
print_step 7 "Verificando .gitignore"

if [ -f ".gitignore" ]; then
  ok ".gitignore encontrado."
  if grep -q "\.env" .gitignore 2>/dev/null; then
    ok ".env está no .gitignore — credenciais protegidas."
  else
    warn ".env não está no .gitignore — risco de vazar credenciais!"
    if ask_confirm "Adicionar .env ao .gitignore agora?"; then
      printf "\n# Variáveis de ambiente\n.env\n.env.local\n.env.*\n" >> .gitignore
      ok ".env adicionado ao .gitignore."
    fi
  fi
else
  warn ".gitignore não encontrado."
  if ask_confirm "Criar um .gitignore básico agora?"; then
    cat > .gitignore << 'GITEOF'
# Dependências
node_modules/

# Variáveis de ambiente
.env
.env.local
.env.*

# Build
dist/
build/
.next/

# Logs
*.log

# Sistema operacional
.DS_Store
Thumbs.db
GITEOF
    ok ".gitignore criado."
  fi
fi

ask_continue

# =============================================================================
print_step 8 "Resumo"

echo ""
if [ "$ERROS" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✔  Tudo certo! Projeto pronto para usar o Pudim SDD.${RESET}"
else
  echo -e "  ${YELLOW}${BOLD}⚠  $ERROS problema(s) encontrado(s). Corrija os itens com ✘.${RESET}"
fi

echo ""
echo -e "  ${BOLD}Próximos passos:${RESET}"
echo ""
echo -e "  ${CYAN}1.${RESET} Preencha o ${BOLD}CONST.md${RESET}"
echo -e "     ${DIM}→ ${COMMAND_CONST}   (no Copilot Chat ou Claude)${RESET}"
echo ""
echo -e "  ${CYAN}2.${RESET} Crie sua primeira tarefa"
echo -e "     ${DIM}→ ${COMMAND_START}${RESET}"
echo ""
echo -e "  ${CYAN}3.${RESET} Fluxo rápido de comandos"
echo -e "     ${DIM}→ ${COMMAND_TASK_REGISTER}  |  ${COMMAND_TASK_CREATE} TASK-001${RESET}"
echo -e "     ${DIM}→ ${COMMAND_TASK_VALIDATE} TASK-001  |  ${COMMAND_TASK_CLOSE} TASK-001${RESET}"
echo -e "     ${DIM}→ ${COMMAND_STATUS}${RESET}"
echo ""
echo -e "  ${CYAN}4.${RESET} Dúvidas? Leia a cartilha"
echo -e "     ${DIM}→ pudim/CARTILHA.md${RESET}"
echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}${BOLD}║   🍮  Bom desenvolvimento!                   ║${RESET}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""
