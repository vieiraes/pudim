# SPEC — TASK-008

> **Status:** Done

| Campo | Valor |
|---|---|
| Task | TASK-008 |
| Título | /pudim-const socrático + CONST como constituição real |
| Autor | Bruno Vieira |
| Data | 2026-07-21 |

---

## Objetivo

Transformar o `/pudim-const` de um questionário trivial em um passo de inception socrático que
gera uma constituição de projeto **ratificada** e que **de fato governa** as tarefas seguintes.

## Problema

Hoje o CONST.md é decorativo: `pudim/validate-project.sh` não o referencia (grep = 0),
`pudim-iniciar` não o consulta e `setup.sh` só checa existência + contagem de linhas — um
template em branco passa liso (é o caso do CONST.md da raiz deste repo). Além disso, metade das
6 perguntas atuais é trivia (repo, gerenciador de pacotes, banco) que não define "regra
inegociável". Resultado: o documento que deveria ser a "regra universal de toda feature" não é
lido nem forçado por ninguém.

## O que está dentro do escopo

- Reescrever as 6 perguntas do `/pudim-const` para um conjunto socrático (identidade+propósito,
  definição de sucesso, stack, anti-escopo, regra inegociável, responsável+repo), mantendo
  "uma pergunta por vez".
- Adicionar o passo de ratificação: a IA sintetiza um "Plano de Ação / Proposta de Constituição"
  **no chat** e só grava o CONST.md após o usuário aceitar/contestar.
- Enriquecer o template `pudim/templates/CONST.md` com "Objetivo e sucesso" + linha da regra
  inegociável, mantendo-o enxuto; sincronizar o cap de linhas em todos os pontos.
- Fazer `/pudim-tarefa-criar` e `/pudim-tarefa-validar` **consultarem** o CONST (quando existe) e
  sinalizarem conflito com "fora de escopo"/regra inegociável antes de prosseguir (gate soft).
- Sincronizar os docs obrigatórios (README, COMMANDS, CARTILHA) + WORKFLOW + manual do Portal.

## O que está fora do escopo

- Novo artefato persistido (PLANO_DE_ACAO.md): o "Plano de Ação" é o momento de ratificação no
  chat; o único artefato de inception continua sendo o CONST.md.
- Gate duro em `validate-project.sh` (quebraria projetos com CONST em branco, inclusive este repo).
- Rename de comandos (`/pd-*`): mantém-se `/pudim-*`.
- Corrigir o drift de frontmatter `agent:` vs `mode:` nos prompts (spike separado no backlog).
- Editar `AGENTS.md` "Prioridade de Entrega" (decisão de produto do owner, não sincronização).

## Critérios de Aceite

> O que precisa ser verdade para considerar essa task concluída?

- [ ] CA-01: `/pudim-const` faz exatamente 6 perguntas, uma por vez, e o conjunto é socrático
  (define sucesso, anti-escopo e regra inegociável), não trivia pura.
- [ ] CA-02: após as respostas, o prompt manda a IA apresentar um "Plano de Ação / Proposta de
  Constituição" no chat e só gravar o CONST.md após ratificação explícita (aceitar/contestar),
  com loop até ratificar.
- [ ] CA-03: nenhum arquivo novo de inception é criado — o único artefato persistido é o CONST.md.
- [ ] CA-04: `/pudim-tarefa-criar` e `/pudim-tarefa-validar` consultam o CONST.md (quando existe) e
  sinalizam conflito com "fora de escopo"/regra inegociável antes de prosseguir.
- [ ] CA-05: o cap de linhas do CONST é coerente em todos os pontos (template, prompt, setup.sh) e
  o template gerado não dispara o `warn` do `setup.sh`.
- [ ] CA-06: README, COMMANDS, CARTILHA e WORKFLOW refletem o novo comportamento; `/pudim-status`
  segue read-only e a compatibilidade Copilot/Claude Code é mantida.
- [ ] CA-07: `pudim/validate-project.sh` continua 0 erros / 0 avisos; nenhum gate duro novo.

## Impacto técnico

_Quais partes do sistema são afetadas? (deixe em branco o que não se aplica)_

- Frontend: `portal/public/index.html` (card/manual do /pudim-const, via docs-curator)
- Backend: `pudim/setup.sh` (apenas o cap de linhas do warn de CONST)
- Banco de dados: —
- Integrações: prompts `.github/prompts/pudim-const|tarefa-criar|tarefa-validar.prompt.md`,
  template `pudim/templates/CONST.md`, docs (README/COMMANDS/CARTILHA/WORKFLOW)

## Dependências

- Esta task depende de: — (autônoma)
- Esta task bloqueia: —

## Riscos

- Risco: tornar o passo 0 mais pesado e afugentar o dev iniciante (contra o valor "leve").
- Como mitigar: manter 6 perguntas; guardrail anti-interrogatório (no máx. 1 "por quê?" por
  resposta vaga); proposta de ratificação curta; nenhum arquivo novo.
- Risco: gate de CONST quebrar projetos com CONST em branco.
- Como mitigar: gate soft no nível do prompt (julgamento + confirmação), sem check duro de script.
- Risco: quebrar compatibilidade retroativa (contrato copiado por outros projetos).
- Como mitigar: escopo mínimo, sincronizar os 3 docs + WORKFLOW na mesma entrega, validar 0/0.

## Decisão

- Aprovado por: Bruno Vieira
- Data: 2026-07-21
- Nota: cap do CONST definido em 60 linhas (decisão do owner).
- Emenda (2026-07-21, pós-fechamento): o owner decidiu **remover a regra de contagem de linhas**
  por completo. O cap numérico saiu do template, prompt, `setup.sh` e WORKFLOW; ficou só o
  guardrail qualitativo ("curto e direto, sem firulas"). Ver CA-05 na VALIDATION.

---

**Pudim-Spec:** v0.3.2
