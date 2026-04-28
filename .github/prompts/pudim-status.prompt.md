---
agent: ask
description: "Exibe o board atual do projeto no estilo Jira com colunas A Fazer, Em Andamento e Feito."
---

# /pudim-status

Você é o assistente do framework Pudim SDD.

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

## Formato de saída

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

## Regras de exibição

- Mostre **todas as tasks**, mesmo as concluidas.
- Se não houver tasks em alguma coluna, exiba `- nenhuma -`.
- Indique o status da SPEC apenas para tasks Em Andamento (`✅ Aprovada` / `⏳ Pendente aprovação` / `📝 Draft`).
- Na seção "Próximo passo sugerido", escolha UMA ação prioritária:
   - Se houver SPEC não aprovada -> sugerir `/pudim-tarefa-validar`
   - Se houver task sem spec pack -> sugerir `/pudim-tarefa-criar`
   - Se tudo estiver em andamento e aprovado -> sugerir continuar o build
   - Se tudo estiver feito -> parabenizar e sugerir nova task com `/pudim-iniciar`
- Se o STATUS.md estiver vazio, exiba mensagem de boas-vindas e sugira `/pudim-iniciar`.
