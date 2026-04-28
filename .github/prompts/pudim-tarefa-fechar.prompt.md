---
mode: agent
description: "Valida os critérios de aceite e fecha a task no STATUS.md com evidências."
---

# /pudim-tarefa-fechar

Task: ${input:taskId:ID da task, ex: TASK-001}

Você é o assistente do framework Pudim SDD.

1. Abra `pudim/specs/${taskId}/SPEC.md` e liste os critérios de aceite.

2. Para cada critério, verifique se há evidência no `VALIDATION.md`.

3. Exiba uma tabela de resultado:

| Critério | Status | Evidência |
|---|---|---|
| CA-01 | ✅ Passou / ❌ Falhou | |
| CA-02 | ✅ Passou / ❌ Falhou | |

4. Se **todos passaram:**
   - Atualize o VALIDATION.md com status `Passed`.
   - Marque o checkbox da task no STATUS.md:
     ```
     - [x] TASK-XYZ | ...
     ```
   - Informe que a task está concluída.

5. Se **algum falhou:**
   - Mantenha a task aberta.
   - Liste o que precisa ser corrigido.
   - Não altere o STATUS.md.

Regra: sem evidência = sem fechamento. Nunca feche uma task por suposição.