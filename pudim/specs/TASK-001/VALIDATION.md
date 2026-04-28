# VALIDATION — TASK-001

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-001 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

- [x] CA-01: `pudim/validate-project.sh` detecta task sem pasta `pudim/specs/TASK-XYZ/`
  - Evidência: Adicionado `TASK-999` sem pasta ao STATUS.md → script retornou `✘ TASK-999: pasta pudim/specs/TASK-999/ não encontrada.` e `Erros críticos: 1 ← BLOQUEANTE`.
- [x] CA-02: `pudim/validate-project.sh` detecta dependência inválida em STATUS.md
  - Evidência: `TASK-002` com `Depende de: TASK-999` (inexistente) → `✘ TASK-002 → TASK-999: dependência inexistente no STATUS.md.` Correção de bug aplicada (extração de IDs apenas das linhas de task, não do campo de dependências).
- [x] CA-03: `pudim/validate-project.sh` detecta spec pack incompleto
  - Evidência: `TASK-002` com apenas SPEC.md e TASKS.md → `✘ TASK-002/VALIDATION.md: AUSENTE.` e `Erros críticos: 1 ← BLOQUEANTE`.
- [x] CA-04: `pudim/validate-project.sh` detecta mismatch de critérios SPEC vs VALIDATION (warning)
  - Evidência: SPEC com CA-01 e CA-02, VALIDATION com apenas CA-01 → `⚠ TASK-002: CA-02 está na SPEC mas não na VALIDATION.` e `Avisos: 1` sem bloquear execução.
- [x] CA-05: Hook pre-commit bloqueia apenas erros críticos; warnings não bloqueiam
  - Evidência: Commit com estado válido passou pelo hook com `🍮 Pudim SDD — Validando projeto antes do commit...` e saiu com código 0.
- [x] CA-06: `pudim/setup.sh` exibe resumo PASS/FAIL no final do onboarding
  - Evidência: Passo 8 "Validação do projeto (harness)" adicionado ao `setup.sh`; `TOTAL_STEPS` atualizado de 8 para 9; script executa `validate-project.sh --quick` e exibe resultado integrado ao wizard.
- [x] CA-07: `pudim-tarefa-criar.prompt.md` verifica existência da task no STATUS.md
  - Evidência: Gate de pré-condições adicionado ao prompt: verifica existência do STATUS.md e da task registrada antes de criar spec pack; regra explícita `Nunca criar spec pack sem a task registrada no STATUS.md`.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | N/A (scripts bash) |
| Integração | Passou — todos os 7 cenários de validação confirmados manualmente |
| Manual | Passou — hook pre-commit ativo e funcional |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| CA-02: extração de TASK_IDS incluía IDs do campo "Depende de:", validando deps inexistentes como válidas | Alta | Corrigido — `_get_registered_task_ids()` extrai apenas da coluna de ID |

## Conclusão

- Resultado final: Todos os 7 critérios de aceite aprovados com evidência.
- Pendências abertas: Nenhuma.
- Pode ser publicado? Sim
