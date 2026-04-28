---
agent: ask
description: "Exibe o board atual do projeto no estilo Jira com colunas A Fazer, Em Andamento e Feito."
---

# /pudim-status

Você é o assistente do framework Pudim SDD.

1. Leia o STATUS.md e classifique cada task em uma coluna:
   - **A Fazer** → `- [ ]` sem spec aberta
   - **Em Andamento** → `- [ ]` com spec aberta em `pudim/specs/TASK-XYZ/`
   - **Feito** → `- [x]`

2. Exiba o board neste formato:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BOARD DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 A FAZER          EM ANDAMENTO     FEITO
 TASK-002         TASK-001         —
 TASK-003         
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Total: X tasks | Y em andamento | Z concluídas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

3. Se houver tasks bloqueadas por dependência ainda não concluída, indique com ⚠️.
