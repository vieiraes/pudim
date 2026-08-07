---
mode: agent
description: "Cria o pacote completo da tarefa com especificação, subtarefas e validação."
---

# /pudim-tarefa-criar

Task: ${input:taskId:ID da task, ex: TASK-001}

Você é o assistente do framework Pudim SDD.

**Gate de pré-condições (execute antes de qualquer criação):**

0. Verifique se o `STATUS.md` existe na raiz do projeto.
   - Se não existir, informe o usuário e interrompa. Oriente a rodar `pudim/setup.sh` primeiro.
1. Verifique se `${taskId}` já existe no `STATUS.md`.
   - Se não existir, informe o usuário e pergunte se deseja registrá-la agora antes de criar o spec pack.
   - Só avance se a task estiver registrada no STATUS.md.

2. Consulte a constituição do projeto: leia `CONST.md` na raiz, **se existir**.
   - Compare o objetivo/escopo pretendido da task com a seção **Fora de escopo — nunca fazer** e
     com a **regra inegociável do projeto**.
   - Se houver conflito, **sinalize claramente** ao usuário e peça confirmação explícita antes de
     criar o spec pack. Não crie a SPEC de uma task que fura a constituição sem esse aceite.
   - Se `CONST.md` não existir, apenas siga em frente (não interrompa o fluxo).

1. Verifique se `pudim/specs/${taskId}/` já existe.
	- Se sim, abra os arquivos e pergunte se o usuário quer atualizar.
	- Se não, crie a pasta.

2. Copie os templates:
	- `pudim/templates/SPEC.md` → `pudim/specs/${taskId}/SPEC.md`
	- `pudim/templates/TASKS.md` → `pudim/specs/${taskId}/TASKS.md`
	- `pudim/templates/VALIDATION.md` → `pudim/specs/${taskId}/VALIDATION.md`
	- Após copiar, leia `pudim/VERSION` e substitua `{{PUDIM_VERSION}}` nos 3 arquivos.
	- Se `pudim/VERSION` não existir, substitua por `desconhecida`.

3. Preencha a especificação com base no que o usuário informar:
	- Objetivo em uma frase
	- O que está dentro do escopo
	- O que está fora do escopo
	- Critérios de aceite (mínimo 3)
	- Riscos principais

4. Confirme o que foi gerado e lembre que a tarefa precisa ter a SPEC aprovada antes de qualquer implementação.

Regras:
- Critérios de aceite devem ser verificáveis e objetivos.
- Escopo fora deve ser tão claro quanto o dentro.
- Nunca criar spec pack sem a task registrada no STATUS.md.
- O rodapé com `Pudim-Spec` deve aparecer em SPEC.md, TASKS.md e VALIDATION.md.