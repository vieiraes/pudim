# TASKS - TASK-009

## Resumo

- Task principal: TASK-009
- Objetivo curto: hardening do setup + instalador + `/pudim-const` amigável a iniciante (pós-dogfood).

## Backlog executavel

- [x] SUB-001 | `setup.sh`: `clear` tolerante a ambiente sem `TERM` | Depende de: -
- [x] SUB-002 | `INSTALL.md`: instruir limpeza de `pudim/specs/` herdados | Depende de: -
- [x] SUB-003 | `pudim-const.prompt.md`: pergunta de stack leiga-friendly + IA propõe/explica/confirma | Depende de: -
- [x] SUB-004 | Sincronizar docs (COMMANDS/CARTILHA) se a descrição mudar | Depende de: SUB-003
- [x] SUB-005 | Re-teste com persona júnior no projeto demo + `validate-project.sh` 0/0 | Depende de: SUB-001, SUB-002, SUB-003, SUB-004

## Ordem sugerida

1. SUB-001 e SUB-002
2. SUB-003
3. SUB-004
4. SUB-005

## Evidencias por subtask

- SUB-001: `setup.sh` `print_header` → `clear 2>/dev/null || true`; `env -u TERM bash pudim/setup.sh` roda até o fim.
- SUB-002: `INSTALL.md` com `rm -rf pudim/specs/TASK-*` (2 opções + checklist).
- SUB-003: `pudim-const.prompt.md` — guardrail "público iniciante / IA propõe stack" + pergunta 3 reescrita + Parte 2 mostra stack proposta.
- SUB-004: `COMMANDS.md`/`CARTILHA.md` — "você não precisa saber tecnologia, a IA propõe a stack".
- SUB-005: re-teste `/tmp/pudim-demo-junior` — setup sem TERM OK, `/pudim-const` júnior gerou CONST com stack proposta pela IA, harness 0/0.

---

**Pudim-Spec:** v0.3.2
