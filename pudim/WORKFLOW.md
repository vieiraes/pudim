# Workflow do Pudim

## O board

Cada task percorre três colunas, igual ao Jira:

```
╔══════════════╗   ╔════════════════╗   ╔═══════════╗
║   A FAZER    ║ → ║  EM ANDAMENTO  ║ → ║   FEITO   ║
╚══════════════╝   ╚════════════════╝   ╚═══════════╝
```

## O ponto de partida obrigatório

Antes do board e antes da primeira task, existe uma etapa zero:

```
0. CONST  →  1. SPEC  →  2. TASKS  →  3. BUILD  →  4. VALIDATION
```

### Etapa 0 — CONST (uma vez por projeto)

**Objetivo:** definir as regras inegociáveis do projeto antes de qualquer coisa.

- Qual é a stack técnica?
- O que está definitivamente fora do escopo?
- Quais são as regras de código e processo?

> Comando: `/pudim-const`
> Arquivo: `CONST.md` (raiz do projeto)
> Wizard: `./pudim/setup.sh` para verificar todos os pré-requisitos

**Gate de saída:** CONST.md aprovado, assinado e na raiz do projeto.

---

## As 4 etapas de uma task

```
1. SPEC  →  2. TASKS  →  3. BUILD  →  4. VALIDATION
```

### Etapa 1 — SPEC

**Objetivo:** definir o que vai ser feito antes de começar.

- O que resolve?
- O que entra e o que fica fora?
- Quais são os critérios de aceite?

> Comando: `/pudim-tarefa-criar TASK-XYZ`
> Arquivo: `pudim/specs/TASK-XYZ/SPEC.md`
> Aprovação: `/pudim-tarefa-validar TASK-XYZ`

**Gate de saída:** SPEC com status `Approved` e critérios de aceite definidos.

---

### Etapa 2 — TASKS

**Objetivo:** quebrar a spec em subtasks executáveis.

- Cada subtask cabe em uma sessão de trabalho.
- Dependências estão explícitas.
- Ordem de execução está clara.

> Arquivo: `pudim/specs/TASK-XYZ/TASKS.md`

**Gate de saída:** lista de subtasks com dependências e ordem definidos.

---

### Etapa 3 — BUILD

**Objetivo:** implementar seguindo as subtasks.

- Uma subtask por vez.
- Não expandir escopo da SPEC.
- Marcar subtasks concluídas no TASKS.md.

**Gate de saída:** todas as subtasks marcadas como concluídas.

---

### Etapa 4 — VALIDATION

**Objetivo:** confirmar que tudo funciona conforme o acordado.

- Cada critério de aceite da SPEC deve ter evidência.
- Registrar bugs encontrados.
- Resultado: Passed ou Failed (com próximos passos).

> Comando: `/pudim-tarefa-fechar TASK-XYZ`
> Arquivo: `pudim/specs/TASK-XYZ/VALIDATION.md`

**Gate de saída:** VALIDATION com status `Passed` e STATUS.md atualizado.

---

## Definição de Pronto

Uma task está **Feita** quando:

- [ ] Todos os critérios de aceite estão validados.
- [ ] VALIDATION.md está preenchido com evidências.
- [ ] STATUS.md está marcado como concluído.

## Regras inegociáveis

| Regra | Por quê |
|---|---|
| Sem SPEC aprovada, sem código | Evita retrabalho por escopo mal definido |
| Uma task por vez | Mantém foco e rastreabilidade |
| Sem evidência, sem fechar | Garante qualidade real, não assumida |

## Atalho mental do fluxo

- `/pudim-tarefa-criar`: cria e preenche a especificação da task
- `/pudim-tarefa-validar`: aprova a especificação e libera execução
- `/pudim-tarefa-fechar`: valida evidências e fecha a task
