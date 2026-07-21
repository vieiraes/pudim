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

- SUB-001: Seção "Determinação da task prioritária" em `.github/prompts/pudim-status.prompt.md` (linhas 29-45), com ordem explícita de 3 passos + caso "tudo concluído".
- SUB-002: Bloco `🧭 CONTEXTO DA TASK PRIORITARIA` adicionado ao exemplo de "Formato de saída — Board inteiro" (linhas 94-98) e regra de exibição correspondente (linhas 166-167) em `.github/prompts/pudim-status.prompt.md`.
- SUB-003: Argumento `TASK-XYZ` preservado (seção "Formato de saída — Task específica" inalterada); `CONTEXTO` adicionado como alias com formato próprio (linhas 101-116) e regras de exibição (linhas 169-173) no mesmo prompt.
- SUB-004: `pudim/COMMANDS.md` (seção `/pudim-status` reescrita com os 3 modos de uso) e `pudim/CARTILHA.md` (tabela de comandos com a linha `CONTEXTO`) atualizados.
- SUB-005: `pudim/specs/TASK-003/VALIDATION.md` preenchido com evidências objetivas para CA-01 a CA-05, apontando linha/arquivo real de cada mudança.

---

**Pudim-Spec:** v0.3.2