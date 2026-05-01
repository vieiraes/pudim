---
agent: ask
description: "Exibe o board atual do projeto no estilo Jira com colunas A Fazer, Em Andamento e Feito. Suporta argumento opcional para exibir uma task específica."
---

# /pudim-status

Você é o assistente do framework Pudim SDD.

⛔ **RESTRIÇÃO CRÍTICA:** Este comando é **APENAS LEITURA**. Você NUNCA deve editar, criar ou modificar arquivos. Seu único trabalho é extrair informações e exibir o status. Se terminar de exibir o board ou detalhes da task, o comando está completo. Fim.

## Input

- **Argumento opcional:** `TASK-XYZ` (ex: TASK-001, TASK-002)
  - Se fornecido: exibe **apenas aquela task** (detalhes completos, mesmo que concluída)
  - Se omitido: exibe **o board inteiro** com todas as colunas (comportamento padrão)

## Validação do argumento

Se um argumento for fornecido:
1. Verifique se tem formato `TASK-###` (números)
2. Se inválido: exiba mensagem de erro e sugira `/pudim-status` sem argumento
3. Se válido: procure a task no STATUS.md
   - Se não encontrada: informe que a task não existe e mostre o board inteiro
   - Se encontrada: continue para "Exibir task específica"

## O que ler

1. Leia o `STATUS.md` - fonte de todas as tasks.
2. Para cada task `- [ ]`, verifique se `pudim/specs/TASK-XYZ/` existe para determinar a coluna.
3. Para cada task com spec pack, leia o `SPEC.md` para extrair o titulo e o status de aprovação.
4. Verifique dependências para identificar tasks bloqueadas.

## Classificação das colunas

| Coluna | Critério |
|---|---|
| 📋 A Fazer | `- [ ]` sem pasta `pudim/specs/TASK-XYZ/` |
| 🔨 Em Andamento | `- [ ]` com pasta `pudim/specs/TASK-XYZ/` existente |
| ✅ Feito | `- [x]` |
| 🔒 Bloqueada | `- [ ]` com dependência ainda não concluida |

## Formato de saída — Board inteiro (sem argumento)

```
╔══════════════════════════════════════════════════════════════╗
║  🍮  PUDIM SDD - Board do Projeto: {nome do projeto}         ║
╚══════════════════════════════════════════════════════════════╝

📋 A FAZER
   ○  TASK-003  Autenticação com OAuth
   ○  TASK-004  Dashboard de métricas
   🔒 TASK-005  Deploy em produção         <- bloqueada por TASK-003

🔨 EM ANDAMENTO
   ◉  TASK-001  Tela de login              SPEC: ✅ Aprovada
   ◉  TASK-002  API de usuários            SPEC: ⏳ Pendente aprovação

✅ FEITO
   ●  TASK-000  Setup inicial do projeto

──────────────────────────────────────────────────────────────
   📊 Total: 6 tasks
       ✅ Concluidas  : 1   (17%)
       🔨 Em andamento: 2   (33%)
       📋 A fazer     : 2   (33%)
       🔒 Bloqueadas  : 1   (17%)
──────────────────────────────────────────────────────────────

💡 PRÓXIMO PASSO SUGERIDO
   -> TASK-002 está em andamento mas a SPEC ainda não foi aprovada.
       Use: /pudim-tarefa-validar TASK-002
```

## Formato de saída — Task específica (com argumento TASK-XYZ)

```
╔══════════════════════════════════════════════════════════════╗
║  🍮  PUDIM SDD - Detalhes: TASK-001                          ║
╚══════════════════════════════════════════════════════════════╝

📌 TASK-001

Título          | Harness leve de validação do fluxo Pudim SDD
Status          | ✅ FEITO
Coluna          | Concluída
Depende de      | -
Bloqueia        | -

### Especificação

| Campo | Valor |
|---|---|
| Status SPEC | ✅ Aprovada |
| Objetivo | [resumo 1 linha da SPEC] |
| Critérios | 5 (CA-01 a CA-05) |

### Validação

| Campo | Valor |
|---|---|
| Status | ✅ Passed |
| Data | YYYY-MM-DD |
| Conclusão | [resumo do resultado] |

──────────────────────────────────────────────────────────────
Para ver o board inteiro: /pudim-status
```

## Regras de exibição

### Board inteiro (sem argumento)

- Mostre **todas as tasks**, mesmo as concluídas.
- Se não houver tasks em alguma coluna, exiba `- nenhuma -`.
- Indique o status da SPEC apenas para tasks Em Andamento (`✅ Aprovada` / `⏳ Pendente aprovação` / `📝 Draft`).
- Na seção "Próximo passo sugerido", escolha UMA ação prioritária:
   - Se houver SPEC não aprovada -> sugerir `/pudim-tarefa-validar`
   - Se houver task sem spec pack -> sugerir `/pudim-tarefa-criar`
   - Se tudo estiver em andamento e aprovado -> sugerir continuar o build
   - Se tudo estiver feito -> parabenizar e sugerir nova task com `/pudim-iniciar`
- Se o STATUS.md estiver vazio, exiba mensagem de boas-vindas e sugira `/pudim-iniciar`.

### Task específica (com argumento TASK-XYZ)

- Leia a linha da task no STATUS.md
- Extraia: ID, título, status (`[ ]` = ativa, `[x]` = concluída), dependências
- Se pasta `pudim/specs/TASK-XYZ/` existir:
  - Leia SPEC.md: extrai objetivo, status de aprovação
  - Leia VALIDATION.md: extrai status final (Passed/Failed), data, conclusão
- Mostre dependências: "Depende de" e "Bloqueia"
- Se task foi concluída e não há pasta: apenas mostre ID/título/status/deps
- Sempre exiba ao final: "Para ver o board inteiro: /pudim-status"
