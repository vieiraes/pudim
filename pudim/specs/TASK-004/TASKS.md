# TASKS - TASK-004

## Resumo

- Task principal: TASK-004
- Objetivo curto: Fazer `/pudim-tarefa-fechar` exigir SPEC.md com Status Approved antes de fechar.

## Backlog executavel

- [x] SUB-001 | Adicionar passo de leitura do Status do SPEC.md em pudim-tarefa-fechar.prompt.md | Depende de: -
- [x] SUB-002 | Implementar bloqueio quando Status != Approved, sem tocar STATUS.md/VALIDATION.md | Depende de: SUB-001
- [x] SUB-003 | Tratar SPEC.md/VALIDATION.md ausentes com mensagem de erro clara | Depende de: SUB-001
- [x] SUB-004 | Atualizar pudim/COMMANDS.md e pudim/WORKFLOW.md com a nova precondição | Depende de: SUB-002
- [x] SUB-005 | Validar CA-01 a CA-04 e preencher VALIDATION.md com evidência real | Depende de: SUB-002, SUB-003, SUB-004

## Ordem sugerida

1. SUB-001
2. SUB-002 e SUB-003
3. SUB-004
4. SUB-005

## Evidencias por subtask

- SUB-001: Passo 0 (checagem de arquivos) e passo 1 (leitura de `> **Status:**`) adicionados em `.github/prompts/pudim-tarefa-fechar.prompt.md`.
- SUB-002: Passo 1 do prompt bloqueia explicitamente quando `Status` != `Approved`, sem avançar para os passos 2-5 (critérios/VALIDATION/STATUS).
- SUB-003: Passo 0 do prompt aborta com mensagem clara se `SPEC.md` ou `VALIDATION.md` não existirem, antes de qualquer outra checagem.
- SUB-004: `pudim/COMMANDS.md` (seção `/pudim-tarefa-fechar`) e `pudim/WORKFLOW.md` (Etapa 4 — VALIDATION) atualizados com a pré-condição.
- SUB-005: `pudim/specs/TASK-004/VALIDATION.md` preenchido com evidência real para CA-01 a CA-04, incluindo simulação manual do passo 1 contra um SPEC de teste com `Status: Draft`.

---

**Pudim-Spec:** v0.3.2
