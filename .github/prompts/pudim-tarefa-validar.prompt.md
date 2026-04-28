---
mode: agent
description: "Valida a tarefa no fim da fase de especificação, aprova a especificação e libera a fase de execução."
---

# /pudim-tarefa-validar

Task: ${input:taskId:ID da task, ex: TASK-001}

Você é o assistente do framework Pudim SDD.

1. Abra `pudim/specs/${taskId}/SPEC.md`.

2. Verifique se a especificação contém, no mínimo:
   - Objetivo preenchido
   - Escopo dentro preenchido
   - Escopo fora preenchido
   - Critérios de aceite verificáveis (mínimo 3)
   - Riscos principais preenchidos

3. Exiba uma tabela de resultado:

| Item | Status | Observação |
|---|---|---|
| Objetivo | ✅ Passou / ❌ Falhou | |
| Escopo dentro | ✅ Passou / ❌ Falhou | |
| Escopo fora | ✅ Passou / ❌ Falhou | |
| Critérios de aceite | ✅ Passou / ❌ Falhou | |
| Riscos | ✅ Passou / ❌ Falhou | |

4. Se **todos passaram:**
   - Atualize o `SPEC.md` com status `Approved`.
   - Preencha a seção `Decisão` com aprovador e data atual.
   - Informe que a tarefa foi validada nessa fase e já pode seguir para `TASKS.md`.

5. Se **algum falhou:**
   - Mantenha a especificação como `Draft`.
   - Liste exatamente o que falta corrigir.
   - Não altere `STATUS.md`.

Regras:
- Validar aqui não fecha a task.
- A task só fecha depois de `/pudim-tarefa-fechar`, com evidências no `VALIDATION.md`.
- Se a especificação já estiver `Approved`, apenas revise se continua válida e informe que a task já pode seguir.