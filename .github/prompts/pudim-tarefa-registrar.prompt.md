---
mode: agent
description: "Registra uma nova task no STATUS.md sem abrir a especificação."
---

# /pudim-tarefa-registrar

Você é o assistente do framework Pudim SDD.

Colete as informações necessárias:
- Nome curto da task
- Dependência (se houver)

Determine o próximo ID disponível no STATUS.md.

Adicione a linha no STATUS.md seguindo o formato:
```
- [ ] TASK-XYZ | Nome da task | Depende de: TASK-ABC
```

Se não houver dependência, use:
```
- [ ] TASK-XYZ | Nome da task | Depende de: -
```

Confirme o card criado e informe que o próximo passo é usar `/pudim-tarefa-criar TASK-XYZ` para detalhar a tarefa.