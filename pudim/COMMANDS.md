# Comandos do Pudim

Referência rápida de todos os comandos disponíveis.

Use no **GitHub Copilot Chat** digitando `/` ou peça ao **Claude Code** pelo nome do comando.

---

## `/pudim-const` ⭐ Comece aqui

**O que faz:** Cria o `CONST.md` — as regras inegociáveis do projeto.

**Quando usar:** **Sempre primeiro.** Antes de qualquer tarefa, em qualquer projeto novo.

**O agente vai:**
1. Fazer 6 perguntas rápidas (uma de cada vez).
2. Gerar o `CONST.md` preenchido na raiz do projeto.
3. Pedir sua aprovação antes de salvar.

> Arquivo gerado: `CONST.md` (na raiz do projeto)

---

## `/pudim-iniciar`

**O que faz:** Inicia o fluxo Pudim do zero para uma task nova.

**Quando usar:** Quando você quer começar a trabalhar em uma feature ou correção.

**O agente vai:**
1. Perguntar o nome e objetivo da task.
2. Criar o card no STATUS.md.
3. Gerar o pacote SPEC + TASKS + VALIDATION em `pudim/specs/TASK-XYZ/`.

---

## `/pudim-tarefa-registrar`

**O que faz:** Registra uma nova task no STATUS.md.

**Quando usar:** Quando você quer colocar a task no board, mas ainda não vai detalhar a especificação.

**Resultado no STATUS.md:**
```
- [ ] TASK-XYZ | Nome da tarefa | Depende de: TASK-001
```

---

## `/pudim-tarefa-criar`

**O que faz:** Cria o pacote completo da tarefa: especificação, subtarefas e validação.

**Quando usar:** Quando a task já existe no STATUS.md e você quer detalhar o que será feito.

**Uso:**
```
/pudim-tarefa-criar TASK-003
```

**O agente vai criar:**
```
pudim/specs/TASK-003/SPEC.md
pudim/specs/TASK-003/TASKS.md
pudim/specs/TASK-003/VALIDATION.md
```

---

## `/pudim-tarefa-validar`

**O que faz:** Valida a tarefa no fim da fase de especificação, aprova a SPEC e libera a fase de execução.

**Quando usar:** Quando você terminou de escrever a especificação e quer liberar a próxima fase.

**Uso:**
```
/pudim-tarefa-validar TASK-003
```

**O agente vai:**
1. Revisar objetivo, escopo, critérios de aceite e riscos da SPEC.
2. Informar o que falta, se houver lacunas.
3. Marcar a SPEC como `Approved` se estiver completa.
4. Preencher a decisão de aprovação na SPEC.

> Regra: validar aqui **não fecha a task**. Só libera a fase de execução.

---

## `/pudim-tarefa-fechar`

**O que faz:** Valida os critérios de aceite e fecha a task com evidências.

**Quando usar:** Quando você terminou de implementar e quer encerrar a task.

**Uso:**
```
/pudim-tarefa-fechar TASK-003
```

**O agente vai:**
1. Revisar os critérios de aceite da SPEC.
2. Verificar se há evidências no VALIDATION.md.
3. Dar um resultado: `Passed` ou `Failed` com próximos passos.
4. Atualizar o STATUS.md se aprovado.

> Regra: task só fecha se **todos** os critérios estiverem validados.

---

## `/pudim-status`

**O que faz:** Exibe o board atual do projeto.

**Quando usar:** A qualquer momento do fluxo, para ver o que está em andamento, o que falta e o que já foi feito.

**Resultado esperado:**
```
BOARD DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A FAZER          EM ANDAMENTO     FEITO
TASK-002         TASK-001         —
TASK-003
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Resumo rápido

| Comando | Ação | Arquivo gerado |
|---|---|---|
| `/pudim-const` ⭐ | Cria regras do projeto | `CONST.md` (raiz) |
| `/pudim-iniciar` | Inicia do zero | STATUS.md + spec pack |
| `/pudim-tarefa-registrar` | Registra card no board | STATUS.md |
| `/pudim-tarefa-criar TASK-XYZ` | Gera pacote da tarefa | pudim/specs/TASK-XYZ/ |
| `/pudim-tarefa-validar TASK-XYZ` | Aprova a especificação e libera execução | SPEC.md |
| `/pudim-tarefa-fechar TASK-XYZ` | Valida e fecha | VALIDATION.md + STATUS.md |
| `/pudim-status` | Exibe o board (a qualquer momento) | — |

---

## `setup.sh` — Wizard de terminal

**O que faz:** Verifica e configura todos os pré-requisitos do projeto, passo a passo no terminal.

**Como usar:**
```bash
chmod +x pudim/setup.sh
./pudim/setup.sh
```

**O wizard verifica:**
1. Git instalado e repositório inicializado
2. Node.js e gerenciadores de pacotes
3. Estrutura de arquivos do Pudim
4. CONST.md presente
5. Arquivos de IA (Copilot / Claude)
6. .gitignore com .env protegido
7. Resumo com próximos passos

> Rode o `setup.sh` **antes** de qualquer outro comando.
