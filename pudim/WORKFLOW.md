# Workflow do Pudim

## O board

Cada task percorre três colunas, igual ao Jira:

```
╔══════════════╗   ╔════════════════╗   ╔═══════════╗
║   A FAZER    ║ → ║  EM ANDAMENTO  ║ → ║   FEITO   ║
╚══════════════╝   ╚════════════════╝   ╚═══════════╝
```

> Você pode rodar `/pudim-status` em qualquer fase para ver em qual coluna cada task está.

## O ponto de partida obrigatório

Antes do board e antes da primeira task, existe uma etapa zero:

```
0. CONST  →  1. SPEC  →  2. TASKS  →  3. BUILD  →  4. VALIDATION
```

### Etapa 0 — CONST (uma vez por projeto)

**Objetivo:** definir a constituição do projeto — as regras inegociáveis que valem para toda feature — antes de qualquer coisa.

O `/pudim-const` faz 6 perguntas socráticas (uma por vez):

- Qual o propósito do projeto e a **definição de sucesso** ("deu certo quando…")?
- Qual é a stack técnica?
- O que o projeto **deliberadamente não** vai fazer (fora de escopo)?
- Qual é a **regra inegociável** que, se quebrada, compromete o projeto?
- Quem é o responsável e onde vive o repositório?

Depois das respostas, o agente apresenta um **Plano de Ação** (proposta de constituição) no chat, que o usuário **aceita ou contesta**. Só após o aceite o `CONST.md` é gravado — nenhum outro arquivo de inception é criado.

> Comando: `/pudim-const`
> Arquivo: `CONST.md` (raiz do projeto)
> Wizard: `./pudim/setup.sh` para verificar todos os pré-requisitos

**Gate de saída:** CONST.md ratificado, assinado e na raiz do projeto. A partir daí, `/pudim-tarefa-criar` e `/pudim-tarefa-validar` consultam o CONST e sinalizam tasks que furam o "fora de escopo" ou a regra inegociável.

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

**Pré-condição obrigatória:** `/pudim-tarefa-fechar` verifica, antes de qualquer coisa, que
`SPEC.md` está com `Status: Approved`. Se não estiver, o fechamento é bloqueado e a task
permanece aberta — mesmo que o `VALIDATION.md` já tenha evidências preenchidas.

**Gate de saída:** SPEC com `Status: Approved`, VALIDATION com status `Passed` e STATUS.md
atualizado.

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
- `/pudim-status`: consulta o board a qualquer momento
