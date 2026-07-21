---
mode: agent
description: "Valida os critérios de aceite e fecha a task no STATUS.md com evidências."
---

# /pudim-tarefa-fechar

Task: ${input:taskId:ID da task, ex: TASK-001}

Você é o assistente do framework Pudim SDD.

0. Verifique se `pudim/specs/${taskId}/SPEC.md` e `pudim/specs/${taskId}/VALIDATION.md` existem.
   - Se algum dos dois não existir: **pare aqui**. Informe qual arquivo falta e que a task
     precisa passar por `/pudim-tarefa-criar ${taskId}` (e, se for o caso,
     `/pudim-tarefa-validar ${taskId}`) antes de poder ser fechada. Não altere nenhum arquivo.

1. Abra `pudim/specs/${taskId}/SPEC.md` e leia o campo `> **Status:**` no topo do arquivo
   (compare ignorando espaços extras e maiúsculas/minúsculas).
   - Se o valor **não for** `Approved` (ex.: `Draft`, `In Progress`, `Done` sem ter passado por
     aprovação, ou qualquer outra coisa): **pare aqui**. Não avalie critérios de aceite, não
     toque em `VALIDATION.md` nem em `STATUS.md`. Informe o valor exato lido em `Status:` e
     que a task precisa ser aprovada primeiro com `/pudim-tarefa-validar ${taskId}`.
   - Se for `Approved`: continue para o passo 2 e liste os critérios de aceite.

2. Para cada critério, verifique se há evidência no `VALIDATION.md`.

3. Exiba uma tabela de resultado:

| Critério | Status | Evidência |
|---|---|---|
| CA-01 | ✅ Passou / ❌ Falhou | |
| CA-02 | ✅ Passou / ❌ Falhou | |
| CA-03 | ✅ Passou / ❌ Falhou | |

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

Regras: sem SPEC aprovada (`Status: Approved`), sem fechamento. Sem evidência no VALIDATION.md,
sem fechamento. Nunca feche uma task por suposição.