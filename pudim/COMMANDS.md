# Comandos do Pudim

Referência rápida de todos os comandos disponíveis.

Use no **GitHub Copilot Chat** digitando `/` ou peça ao **Claude Code** pelo nome do comando.

> Prefere ver estes comandos em cards visuais? Rode `cd portal && npm install && npm start` e
> abra `http://127.0.0.1:4444`.

---

## `/pudim-const` ⭐ Comece aqui

**O que faz:** Cria o `CONST.md` — a constituição do projeto (regras inegociáveis que valem para toda feature).

**Quando usar:** **Sempre primeiro.** Antes de qualquer tarefa, em qualquer projeto novo.

**O agente vai:**
1. Fazer 6 perguntas socráticas (uma de cada vez): propósito, definição de sucesso, stack, o que o projeto **não** vai fazer, a regra inegociável e o responsável. Você não precisa saber tecnologia: descreva a ideia em linguagem simples e a IA propõe e explica a stack.
2. Apresentar um **Plano de Ação** (proposta de constituição) no chat para você **aceitar ou contestar**.
3. Só depois do seu aceite, gerar o `CONST.md` preenchido na raiz do projeto.

Depois de pronto, o `CONST.md` é consultado por `/pudim-tarefa-criar` e `/pudim-tarefa-validar`: uma task que fura o "fora de escopo" ou a regra inegociável é sinalizada antes de seguir.

> Arquivo gerado: `CONST.md` (na raiz do projeto). Nenhum outro arquivo é criado — o Plano de Ação vive no chat.

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
1. Verificar que `SPEC.md` e `VALIDATION.md` existem — se algum faltar, avisa e para.
2. Verificar que `SPEC.md` está com `Status: Approved` — se não estiver, **bloqueia o
   fechamento** e informa que é preciso rodar `/pudim-tarefa-validar` antes.
3. Revisar os critérios de aceite da SPEC.
4. Verificar se há evidências no VALIDATION.md.
5. Dar um resultado: `Passed` ou `Failed` com próximos passos.
6. Atualizar o STATUS.md se aprovado.

> Regra: task só fecha se a SPEC estiver **Approved** e **todos** os critérios estiverem
> validados com evidência.

---

## `/pudim-status`

**O que faz:** Exibe o board atual do projeto. No modo padrão, já inclui o contexto da task não finalizada prioritária. Suporta argumento opcional para exibir uma task específica ou apenas o contexto isolado.

**Quando usar:** A qualquer momento do fluxo, para ver o que está em andamento, o que falta e o que já foi feito — ou para retomar rapidamente qual é a próxima ação.

**Como usar:**

### Sem argumento (padrão - exibe board inteiro + contexto da task prioritária)
```
/pudim-status
```

### Com argumento TASK-XYZ (exibe apenas uma task)
```
/pudim-status TASK-001
```

### Com argumento CONTEXTO (exibe apenas o bloco de contexto da task prioritária)
```
/pudim-status CONTEXTO
```

**Resultado esperado (board inteiro):**
```
BOARD DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A FAZER          EM ANDAMENTO     FEITO
TASK-002         TASK-001         —
TASK-003
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧭 CONTEXTO DA TASK PRIORITARIA
   ID           | TASK-001
   Titulo       | Tela de login
   Coluna atual | Em Andamento
   Proxima acao | continuar o build
```

A task prioritária é escolhida nesta ordem: (1) task em andamento com SPEC não aprovada, (2) task em andamento com SPEC aprovada, (3) próxima task desbloqueada sem spec pack.

**Resultado esperado (task específica):**
```
DETALHES: TASK-001

Título          | Harness leve de validação...
Status          | ✅ FEITO
Depende de      | -
Especificação   | ✅ Aprovada
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
| `/pudim-status` | Exibe o board + contexto prioritário (sem args), task específica (TASK-XYZ) ou só o contexto (CONTEXTO) | — |

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

---

## Versão do Pudim e Changelog

O Pudim usa uma fonte única de versão em `pudim/VERSION`.

- Exemplo: `0.3.0`
- O `setup.sh` e o `install-hooks.sh` exibem a versão atual no terminal.
- O comando `/pudim-tarefa-criar` deve preencher o rodapé `Pudim-Spec` com essa versão em:
	- `pudim/specs/TASK-XYZ/SPEC.md`
	- `pudim/specs/TASK-XYZ/TASKS.md`
	- `pudim/specs/TASK-XYZ/VALIDATION.md`

As mudanças por versão ficam em `CHANGELOG.md` (raiz do repositório do framework).

Regra de release:
1. Atualize `CHANGELOG.md`.
2. Atualize `pudim/VERSION`.
3. Faça o commit de release quando decidir publicar.
