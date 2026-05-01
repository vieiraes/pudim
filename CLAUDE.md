# CLAUDE.md

Diretrizes para usar Claude Code neste repositorio com o framework Pudim SDD.

## Fonte de verdade

- Regras de produto: AGENTS.md
- Framework SDD: pudim/README.md
- Workflow: pudim/WORKFLOW.md
- Templates: pudim/templates/SPEC.md, pudim/templates/TASKS.md, pudim/templates/VALIDATION.md
- Status das tasks: STATUS.md

## Regras obrigatorias

- Nao iniciar implementacao sem SPEC aprovada.
- Nao fechar task sem VALIDATION preenchida com evidencias.
- Trabalhar uma task por vez, com escopo minimo.
- Respeitar dependencias definidas no STATUS.md.

## Fluxo obrigatorio por task

1. Criar ou atualizar spec pack em pudim/specs/TASK-XYZ/.
2. Definir objetivo, escopo e criterios de aceite no SPEC.
3. Detalhar subtasks com dependencia no TASKS.
4. Implementar em pequenos incrementos.
5. Validar criterios e registrar evidencias no VALIDATION.
6. Atualizar STATUS.md para concluido quando aprovado.
## Restrições de agente

- **Comandos informativos** (`/pudim-status`, `/pudim-status TASK-XYZ`): APENAS LEITURA. Nunca edite.
- **Edições fora do fluxo SDD** (SPEC → TASKS → BUILD → VALIDATION): PROIBIDAS.
- Se encontrar inconsistências durante `/pudim-status`: Informe, não corrija.
## Formato de resposta recomendado

1. Resumo da task e escopo
2. Plano de execucao
3. Alteracoes realizadas
4. Validacao (pass/fail por criterio)
5. Proximo passo
