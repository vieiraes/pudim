# CLAUDE.md

Diretrizes para usar Claude Code neste repositorio com o framework Pudim SDD.

## Fonte de verdade

- Regras de produto: AGENTS.md
- Framework SDD: pudim/README.md
- Workflow: pudim/WORKFLOW.md
- Templates: pudim/templates/SPEC.md, pudim/templates/TASKS.md, pudim/templates/VALIDATION.md
- Status das tasks: STATUS.md

## Análise socrática obrigatória

Para **toda demanda** (feature, correção, refactor, análise, decisão de arquitetura), faça
**primeiro uma análise socrática** antes de implementar ou responder em definitivo.

A análise deve:

1. Fazer perguntas-chave que expõem premissas, ambiguidades e trade-offs da demanda.
2. Apostar na causa raiz — usar "5 porquês" quando necessário, buscando solução e não culpados.
3. Questionar evidências e consequências: "de onde veio essa informação?" e "o que aconteceria
   se levássemos essa ideia ao extremo?".
4. Responder com base no código/contexto real deste repo — ler os arquivos antes de afirmar
   qualquer coisa (ex.: não assumir que uma VALIDATION.md com `Passed` reflete o código real;
   ler o arquivo citado como evidência antes de confiar nela).
5. Explicitar dependências, riscos e o que muda de forma difícil de reverter (ver "Mudanças de
   alto impacto neste projeto" abaixo).
6. Só então propor o plano/execução.

Confirmar com o owner antes de codar quando houver ambiguidade relevante, impacto difícil de
reverter, ou decisão arquitetural que afeta a evolução do framework. Para mudanças locais,
isoladas e reversíveis, a análise pode ser curta e seguir direto para a implementação.

Formato recomendado quando a análise não for trivial:

```
1. Perguntas socráticas
2. Respostas/Achados (com base no código real)
3. Trade-offs e Riscos
4. Plano recomendado
```

## Regras obrigatorias

- Nao iniciar implementacao sem SPEC aprovada.
- Nao fechar task sem VALIDATION preenchida com evidencias.
- Trabalhar uma task por vez, com escopo minimo.
- Respeitar dependencias definidas no STATUS.md.

## Fluxo obrigatorio por task

1. Criar ou atualizar spec pack em pudim/specs/TASK-XYZ/.
2. Definir objetivo, escopo e criterios de aceite no SPEC.
3. Detalhar subtasks com dependencia no TASKS.
4. Implementar em pequenos incrementos.
5. Validar criterios e registrar evidencias no VALIDATION.
6. Atualizar STATUS.md para concluido quando aprovado.

## Git

- **NUNCA commitar ou fazer push automaticamente.**
- Só commitar/push quando o usuário pedir explicitamente (ex.: "commita", "envia pro github",
  "faz o push").
- Após edições de arquivos, apenas confirmar o que foi feito — não encadear
  git add/commit/push por conta própria.

## Mudanças de alto impacto neste projeto

O Pudim não tem banco de dados, migrations nem deploy (ver AGENTS.md — "fora de escopo
inicial"). O equivalente aqui a "schema/migration/API pública" é:

- **Publicar nova versão do framework** (bump de `pudim/VERSION` + fechar seção no
  `CHANGELOG.md`): é uma decisão explícita do usuário, no momento de commit final + envio para
  a branch — nunca decidir o bump sozinho (ver README.md e CHANGELOG.md, seção "Roteiro rápido
  de release").
- **Mudar contratos que outros projetos copiam**: templates (`pudim/templates/*.md`), prompts
  (`.github/prompts/*.prompt.md`), nomes/assinatura de comandos (`/pudim-*`) ou a estrutura de
  pastas esperada (`pudim/specs/TASK-XYZ/{SPEC,TASKS,VALIDATION}.md`). Isso quebra
  compatibilidade retroativa para quem já adotou o Pudim — tratar como mudança difícil de
  reverter e confirmar com o owner antes de codar.

## Documentação de planejamento

- Planejamento de uma feature/task já tem endereço fixo neste projeto:
  `pudim/specs/TASK-XYZ/SPEC.md` (+ `TASKS.md`). Não criar documentos de planejamento soltos em
  `docs/` ou só na memória da sessão — o spec pack é o "docs/" deste framework.
- Se estiver em modo Plan (sem permissão para criar/editar arquivos), avisar o usuário para
  aprovar o plano / mudar para modo de edição antes de continuar.

## Board de acompanhamento

- Este projeto já tem um board de acompanhamento: `STATUS.md` (cards por task) e
  `pudim/specs/TASK-XYZ/TASKS.md` (subtasks por task). Não introduzir um `BOARD_*.md` paralelo
  em `docs/` — seria um segundo board concorrendo com o oficial.
- Ao concluir algo, marcar `[x]` no arquivo correspondente (`STATUS.md` ou `TASKS.md`); itens
  concluídos permanecem no arquivo.

## Curadoria de documentação

- Toda feature implementada deve manter `README.md`, `pudim/COMMANDS.md` e `pudim/CARTILHA.md`
  sincronizados (regra já em AGENTS.md). Isso vale tanto para o produto Pudim quanto para
  mudanças no próprio fluxo SDD.
- Nunca marcar um critério de aceite ou subtask como concluído sem evidência real no código —
  ler o arquivo antes de afirmar (ver o caso registrado na TASK-003, onde uma VALIDATION.md
  citava evidência que não existia).
- Existe um agente dedicado `.github/agents/docs-curator.agent.md` para curadorias/sincronizações
  amplas (README/COMMANDS/CARTILHA/STATUS/spec packs) — invocar quando o usuário pedir
  explicitamente ("cura os docs", "sincroniza o board"), nunca proativamente após cada
  task/feature. A baixa pontual do dia a dia (marcar a própria subtask concluída, atualizar o
  STATUS.md da task em andamento) continua sendo do agente principal, no fluxo normal. Escopo do
  `docs-curator` é restrito aos arquivos listados nele — nunca prompts, skills, código ou
  `CONST.md`/`AGENTS.md`/`CHANGELOG.md`/`pudim/VERSION`.

## Restrições de agente

- **Comandos informativos** (`/pudim-status`, `/pudim-status TASK-XYZ`): APENAS LEITURA. Nunca edite.
- **Edições fora do fluxo SDD** (SPEC → TASKS → BUILD → VALIDATION): PROIBIDAS.
- Se encontrar inconsistências durante `/pudim-status`: Informe, não corrija.

## Formato de resposta recomendado

1. Resumo da task e escopo
2. Plano de execucao
3. Alteracoes realizadas
4. Validacao (pass/fail por criterio)
5. Proximo passo
<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Cloude Code ToolBox)

_Last synced: 2026-08-07T22:15:11.461Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp`. Servers are configured in `~/.claude.json` (user) and `.mcp.json` (project).
- **When the user’s task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.mcp.json` _(workspace: pudim-framework-desenvolvimento)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `/home/bruno_vieira/.claude.json` — _no servers defined_

_No active user-scoped servers in mcp.json._

#### Project skills

- **plan-feature-slice** — `/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.github/skills/plan-feature-slice` — Create a vertical-slice implementation plan for this markdown editor. Use when user asks to plan a feature, break down tasks, define acceptance criteria, or sequence delivery.

- **pudim-sdd** — `/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.github/skills/pudim-sdd` — Run Pudim Spec-Driven Development workflow. Use when: creating a new spec, decomposing into tasks, validating acceptance criteria, and closing a task in STATUS.md.

#### User skills

_All hidden in hub (Turn OFF) or none listed._

_Off in hub (on disk):_ 

- **find-skills** — `/home/bruno_vieira/.agents/skills/find-skills`

- **generic-react-ux-designer** — `/home/bruno_vieira/.agents/skills/generic-react-ux-designer`

- **postman-collection-generator** — `/home/bruno_vieira/.agents/skills/postman-collection-generator`

- **prd-writer** — `/home/bruno_vieira/.agents/skills/prd-writer`

<!-- cloude-code-toolbox:mcp-skills-awareness-end -->
