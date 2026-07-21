# Copilot Instructions

Diretrizes para usar GitHub Copilot neste repositório com o framework Pudim SDD.

## Fonte de verdade

- Regras de produto: [AGENTS.md](../AGENTS.md)
- Framework SDD: [pudim/README.md](../pudim/README.md)
- Workflow: [pudim/WORKFLOW.md](../pudim/WORKFLOW.md)
- Templates: `pudim/templates/SPEC.md`, `pudim/templates/TASKS.md`, `pudim/templates/VALIDATION.md`
- Status das tasks: [STATUS.md](../STATUS.md)
- Skill do fluxo SDD: `.github/skills/pudim-sdd/SKILL.md`
- Agente orquestrador: `.github/agents/pudim-orchestrator.agent.md`

## Análise socrática obrigatória

Para **toda demanda** (feature, correção, refactor, análise, decisão), faça **primeiro** uma
análise socrática: perguntas-chave, respostas com base no código real, trade-offs/riscos, e só
então o plano.

- Ler os arquivos antes de afirmar qualquer coisa — não assumir que uma `VALIDATION.md` com
  `Passed` reflete o código real (já aconteceu neste repo: ver TASK-003 em
  `pudim/specs/TASK-003/`).
- Se houver ambiguidade relevante ou impacto difícil de reverter, apresentar a análise e
  confirmar com o owner antes de codar.

## Mudanças de alto impacto neste projeto

O Pudim não tem banco de dados, migrations nem deploy (ver AGENTS.md — "fora de escopo
inicial"). Trate como difícil de reverter e confirme antes de codar:

- **Publicar nova versão do framework** (bump de `pudim/VERSION` + fechar seção no
  `CHANGELOG.md`) — decisão explícita do usuário, no momento de commit final + envio para a
  branch.
- **Mudar contratos que outros projetos copiam**: templates (`pudim/templates/*.md`), prompts
  (`.github/prompts/*.prompt.md`), nomes/assinatura de comandos (`/pudim-*`) ou a estrutura de
  pastas esperada (`pudim/specs/TASK-XYZ/{SPEC,TASKS,VALIDATION}.md`).

## Documentação de planejamento

- Planejamento de feature já tem endereço fixo: `pudim/specs/TASK-XYZ/SPEC.md` (+ `TASKS.md`).
  Não criar documentos de planejamento soltos em `docs/` ou só na conversa do Copilot Chat.
- Se estiver em modo restrito (sem permissão para criar/editar arquivos), avisar o usuário para
  mudar de modo antes de continuar.

## Git

- **NUNCA commitar ou fazer push automaticamente.**
- Só commitar/push quando o usuário pedir explicitamente (ex.: "commita", "envia pro github",
  "faz o push").
- Após edições de arquivos, apenas confirmar o que foi feito — não encadear
  git add/commit/push por conta própria.

## Board de acompanhamento

- Este projeto já tem um board de acompanhamento: `STATUS.md` (cards por task) e
  `pudim/specs/TASK-XYZ/TASKS.md` (subtasks por task). Não introduzir um `BOARD_*.md` paralelo
  em `docs/` — seria um segundo board concorrendo com o oficial.
- Ao concluir algo, marcar `[x]` no arquivo correspondente; itens concluídos permanecem no
  arquivo (não apagar).

## Curadoria de documentação

- Toda feature implementada deve manter `README.md`, `pudim/COMMANDS.md` e `pudim/CARTILHA.md`
  sincronizados (regra já em AGENTS.md).
- Nunca marcar um critério de aceite ou subtask como concluído sem evidência real no código —
  ler o arquivo antes de afirmar; anexar nota curta de evidência. Itens obsoletos: `~~texto~~` +
  motivo, não apagar.
- Existe um agente dedicado `.github/agents/docs-curator.agent.md` para curadorias/sincronizações
  amplas (README/COMMANDS/CARTILHA/STATUS/spec packs) — invocar quando o usuário pedir
  explicitamente ("cura os docs", "sincroniza o board"), nunca proativamente após cada
  task/feature. A baixa pontual do dia a dia (marcar a própria subtask concluída, atualizar o
  STATUS.md da task em andamento) continua sendo do agente principal, no fluxo normal. Escopo do
  `docs-curator` é restrito aos arquivos listados nele — nunca prompts, skills, código ou
  `CONST.md`/`AGENTS.md`/`CHANGELOG.md`/`pudim/VERSION`.

## Divisão entre os arquivos deste repo

- `AGENTS.md` — regras de **produto** do Pudim, compartilhadas entre Copilot e Claude Code.
- `CLAUDE.md` — instruções de meta-processo equivalentes a este arquivo, para Claude Code.
- `.github/copilot-instructions.md` (este arquivo) — instruções de meta-processo para Copilot.
- Compatibilidade bidirecional: qualquer regra adicionada aqui deve ter equivalente em
  `CLAUDE.md`, e vice-versa (ver AGENTS.md: "Copilot e Claude Code devem funcionar igualmente
  com cada comando").

## Restrições de agente

- **Comandos informativos** (`/pudim-status`, `/pudim-status TASK-XYZ`): APENAS LEITURA. Nunca edite.
- **Edições fora do fluxo SDD** (SPEC → TASKS → BUILD → VALIDATION): PROIBIDAS.
- Se encontrar inconsistências durante `/pudim-status`: informe, não corrija.

## Formato de resposta recomendado

1. Resumo da task e escopo
2. Plano de execução
3. Alterações realizadas
4. Validação (pass/fail por critério)
5. Próximo passo
