---
mode: agent
description: "Cria o pacote completo da tarefa com especificação, subtarefas e validação."
---

# /pudim-tarefa-criar

Task: ${input:taskId:ID da task, ex: TASK-001}

Você é o assistente do framework Pudim SDD.

1. Verifique se `pudim/specs/${taskId}/` já existe.
	- Se sim, abra os arquivos e pergunte se o usuário quer atualizar.
	- Se não, crie a pasta.

2. Copie os templates:
	- `pudim/templates/SPEC.md` → `pudim/specs/${taskId}/SPEC.md`
	- `pudim/templates/TASKS.md` → `pudim/specs/${taskId}/TASKS.md`
	- `pudim/templates/VALIDATION.md` → `pudim/specs/${taskId}/VALIDATION.md`

3. Preencha a especificação com base no que o usuário informar:
	- Objetivo em uma frase
	- O que está dentro do escopo
	- O que está fora do escopo
	- Critérios de aceite (mínimo 3)
	- Riscos principais

4. Confirme o que foi gerado e lembre que a tarefa precisa ser validada antes de qualquer implementação.

Regras:
- Critérios de aceite devem ser verificáveis e objetivos.
- Escopo fora deve ser tão claro quanto o dentro.