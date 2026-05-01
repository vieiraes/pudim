# TASKS - TASK-002

## Resumo

- Task principal: TASK-002
- Objetivo curto: Estender `/pudim-status` para aceitar argumento de task específica

## Backlog executável

- [x] SUB-001 | Atualizar prompt pudim-status.prompt.md para aceitar argumento | Depende de: -
- [x] SUB-002 | Implementar lógica de parse do argumento e validação | Depende de: SUB-001
- [x] SUB-003 | Gerar output para task específica (status, SPEC, deps) | Depende de: SUB-002
- [x] SUB-004 | Testar com tasks concluídas e em andamento | Depende de: SUB-003
- [x] SUB-005 | Atualizar COMMANDS.md e CARTILHA.md com novo uso | Depende de: SUB-003

## Ordem sugerida

1. SUB-001 — lógica e parsing do argumento
2. SUB-002 — validação do formato TASK-XYZ
3. SUB-003 — renderização da task específica
4. SUB-004 — testes manuais (TASK-001 concluída, TASK-002 em andamento)
5. SUB-005 — documentação

## Evidências por subtask

- SUB-001: ✅ `.github/prompts/pudim-status.prompt.md` atualizado com Input validation, lógica de parse e dois formatos de saída
- SUB-002: ✅ Validação `TASK-###` implementada; trata task inválida e não encontrada conforme spec
- SUB-003: ✅ Output para task específica com campos: ID, título, status, coluna, dependências, SPEC details, VALIDATION
- SUB-004: ✅ Testes manuais executados (TASK-001 concluída, TASK-002 em andamento, TASK-999 inexistente, board inteiro sem args)
- SUB-005: ✅ Documentação atualizada em COMMANDS.md (secção `/pudim-status` com exemplos) e CARTILHA.md (tabela de comandos + ciclo)
