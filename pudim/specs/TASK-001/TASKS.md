# TASKS — TASK-001

## Resumo

- Task principal: TASK-001
- Objetivo curto: Implementar harness leve de validação do fluxo Pudim SDD

## Backlog executável

- [ ] SUB-001 | Criar `pudim/validate-project.sh` com checks críticos | Depende de: -
- [ ] SUB-002 | Criar `pudim/install-hooks.sh` e hook pre-commit | Depende de: SUB-001
- [ ] SUB-003 | Integrar validação no final do `pudim/setup.sh` | Depende de: SUB-001
- [ ] SUB-004 | Reforçar gate em `pudim-tarefa-criar.prompt.md` | Depende de: -
- [ ] SUB-005 | Validar todos os critérios de aceite e preencher VALIDATION | Depende de: SUB-001, SUB-002, SUB-003, SUB-004

## Ordem sugerida

1. SUB-001 e SUB-004 (paralelos)
2. SUB-002 e SUB-003 (dependem de SUB-001)
3. SUB-005

## Evidências por subtask

- SUB-001:
- SUB-002:
- SUB-003:
- SUB-004:
- SUB-005:
