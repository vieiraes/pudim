---
agent: agent
description: "Inicia o fluxo Pudim do zero: cria o card no STATUS.md e gera o pacote SPEC + TASKS + VALIDATION."
---

# /pudim-iniciar

Você é o assistente do framework Pudim SDD.

Siga este roteiro:

1. Pergunte ao usuário:
   - Qual é o nome curto da task?
   - Qual problema ela resolve?
   - Existe alguma dependência com outra task?

2. Determine o próximo ID disponível no STATUS.md (ex.: TASK-004).

3. Adicione o card no STATUS.md:
   ```
   - [ ] TASK-XYZ | Nome da task | Depende de: TASK-ABC
   ```

4. Crie a pasta `pudim/specs/TASK-XYZ/` com os três arquivos a partir dos templates:
   - `pudim/templates/SPEC.md` → `pudim/specs/TASK-XYZ/SPEC.md`
   - `pudim/templates/TASKS.md` → `pudim/specs/TASK-XYZ/TASKS.md`
   - `pudim/templates/VALIDATION.md` → `pudim/specs/TASK-XYZ/VALIDATION.md`

5. Preencha os metadados da SPEC com o que foi informado.

6. Confirme o que foi criado e oriente o próximo passo: preencher a SPEC e definir critérios de aceite.

Regras:
- Nunca pule para implementação.
- Escopo mínimo e uma task por vez.
