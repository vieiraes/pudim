# TASKS - TASK-008

## Resumo

- Task principal: TASK-008
- Objetivo curto: `/pudim-const` socrático com ratificação + CONST consultado pelos gates downstream.

## Backlog executavel

- [x] SUB-001 | Reescrever as 6 perguntas + passo de ratificação no `pudim-const.prompt.md` | Depende de: -
- [x] SUB-002 | Enriquecer `templates/CONST.md` (Objetivo e sucesso + regra inegociável) e sincronizar cap de linhas | Depende de: -
- [x] SUB-003 | Consulta ao CONST em `pudim-tarefa-criar` e `pudim-tarefa-validar` | Depende de: SUB-002
- [x] SUB-004 | Sincronizar docs (README, COMMANDS, CARTILHA, WORKFLOW, portal manual) | Depende de: SUB-001, SUB-002, SUB-003
- [x] SUB-005 | Validação: dry-run textual, grep de consistência, validate-project.sh 0/0 | Depende de: SUB-001, SUB-002, SUB-003, SUB-004

## Ordem sugerida

1. SUB-001 e SUB-002
2. SUB-003
3. SUB-004
4. SUB-005

## Evidencias por subtask

- SUB-001: `.github/prompts/pudim-const.prompt.md` reescrito — 6 perguntas socráticas (uma por vez) + Parte 2 (Plano de Ação/ratificação) + guardrail anti-interrogatório.
- SUB-002: `pudim/templates/CONST.md` com "Objetivo e sucesso" + linha "Regra inegociável do projeto"; 56 linhas; cap 60 sincronizado em prompt e `setup.sh:201-202`.
- SUB-003: `pudim-tarefa-criar.prompt.md:20` (passo 2 do gate) e `pudim-tarefa-validar.prompt.md:21,35` (item 2.1 + linha na tabela) consultam o CONST com fallback se ausente.
- SUB-004: README/COMMANDS/CARTILHA/WORKFLOW + `portal/public/index.html:254` sincronizados; `pudim-status` intocado.
- SUB-005: `validate-project.sh` 0 erros/0 avisos (exit 0); greps de consistência conferidos; ver VALIDATION.md por CA.

---

**Pudim-Spec:** v0.3.2
