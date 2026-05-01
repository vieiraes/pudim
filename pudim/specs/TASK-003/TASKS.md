# TASKS - TASK-003

## Resumo

- Task principal: TASK-003
- Objetivo curto: Embutir no /pudim-status padrão o contexto da task não finalizada prioritária.

## Backlog executavel

- [x] SUB-001 | Definir regra de priorização da task ativa no /pudim-status | Depende de: -
- [x] SUB-002 | Embutir bloco de contexto no board padrão do /pudim-status | Depende de: SUB-001
- [x] SUB-003 | Preservar /pudim-status TASK-XYZ e manter CONTEXTO como alias opcional | Depende de: SUB-002
- [x] SUB-004 | Atualizar documentação em COMMANDS.md e CARTILHA.md | Depende de: SUB-002
- [x] SUB-005 | Validar evidências e ajustar VALIDATION.md | Depende de: SUB-003, SUB-004

## Ordem sugerida

1. SUB-001
2. SUB-002
3. SUB-003 e SUB-004
4. SUB-005

## Evidencias por subtask

- SUB-001: Regra de priorização documentada no prompt do `/pudim-status` com ordem explícita entre tasks em andamento e tasks desbloqueadas.
- SUB-002: Bloco `CONTEXTO DA TASK PRIORITARIA` adicionado ao formato padrão do board em `.github/prompts/pudim-status.prompt.md`.
- SUB-003: Argumento `TASK-XYZ` preservado; `CONTEXTO` mantido como alias de compatibilidade no mesmo prompt.
- SUB-004: Documentação atualizada em `pudim/COMMANDS.md` e `pudim/CARTILHA.md`.
- SUB-005: `pudim/specs/TASK-003/VALIDATION.md` preenchido com evidências objetivas para CA-01 a CA-05, baseado no prompt e na documentação atualizados.

---

**Pudim-Spec:** v0.3.2