#!/bin/bash
# =============================================================================
# 🍮 Pudim SDD — Instalador de Git Hooks
# Instala o hook pre-commit no repositório local.
#
# Como usar:
#   chmod +x pudim/install-hooks.sh
#   ./pudim/install-hooks.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HOOKS_DIR="$ROOT/.git/hooks"
HOOK_FILE="$HOOKS_DIR/pre-commit"

echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}${BOLD}║   🍮  Pudim SDD — Instalador de Hooks        ║${RESET}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo -e "  ${YELLOW}⚠  Diretório .git/hooks não encontrado. Este script deve ser rodado dentro de um repositório Git.${RESET}"
  exit 1
fi

# Fazer backup se já existir
if [[ -f "$HOOK_FILE" ]]; then
  BACKUP="$HOOK_FILE.backup.$(date +%Y%m%d%H%M%S)"
  cp "$HOOK_FILE" "$BACKUP"
  echo -e "  ${YELLOW}⚠  Hook existente salvo em: $BACKUP${RESET}"
fi

# Escrever o hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# =============================================================================
# 🍮 Pudim SDD — Pre-commit Hook
# Bloqueia commit apenas para erros críticos de processo.
# Warnings são exibidos mas não bloqueiam.
# =============================================================================

ROOT="$(git rev-parse --show-toplevel)"
VALIDATE="$ROOT/pudim/validate-project.sh"

# Se o script não existir, deixar passar (evitar bloquear quem não instalou)
if [[ ! -f "$VALIDATE" ]]; then
  exit 0
fi

echo ""
echo "🍮 Pudim SDD — Validando projeto antes do commit..."
echo ""

# Executa apenas checks rápidos (--quick bloqueia só erros críticos)
if bash "$VALIDATE" --quick; then
  exit 0
else
  echo ""
  echo "  Corrija os erros acima e tente o commit novamente."
  echo "  Para ignorar esta validação (não recomendado): git commit --no-verify"
  echo ""
  exit 1
fi
EOF

chmod +x "$HOOK_FILE"

echo -e "  ${GREEN}✔  Hook pre-commit instalado em: $HOOK_FILE${RESET}"
echo ""
echo -e "  ${DIM}O hook será executado automaticamente a cada 'git commit'.${RESET}"
echo -e "  ${DIM}Só erros críticos bloqueam o commit. Warnings são apenas avisos.${RESET}"
echo -e "  ${DIM}Para desinstalar: rm .git/hooks/pre-commit${RESET}"
echo ""
