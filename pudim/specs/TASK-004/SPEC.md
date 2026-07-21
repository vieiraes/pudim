# SPEC — TASK-004

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-004 |
| Título | Fechamento de tarefa deve exigir SPEC.md com Status Approved |
| Autor | Claude Code |
| Data | 2026-07-20 |

---

## Objetivo

Impedir que `/pudim-tarefa-fechar` marque uma task como concluída quando o `SPEC.md`
correspondente não está com `Status: Approved`.

## Problema

`.github/prompts/pudim-tarefa-fechar.prompt.md` hoje só compara `VALIDATION.md` contra os
critérios de aceite do `SPEC.md` — nunca verifica se o próprio SPEC foi aprovado. Isso permite
fechar uma task cujo SPEC ainda está `Draft` ou `In Progress`, violando a regra não-negociável
do framework ("Sem SPEC aprovada, sem código", declarada em `AGENTS.md`, `CONST.md`,
`CLAUDE.md` e `.github/copilot-instructions.md`). É a mesma classe de falha identificada e
corrigida na TASK-003 (um gate que deveria travar uma transição de estado não trava).

## O que está dentro do escopo

- Novo passo inicial em `pudim-tarefa-fechar.prompt.md`: ler `> **Status:**` do `SPEC.md` antes
  de checar critérios de aceite.
- Se `Status` != `Approved`: abortar o fechamento, exibir mensagem explícita, não alterar
  `STATUS.md` nem `VALIDATION.md`.
- Tratar ausência de `pudim/specs/${taskId}/SPEC.md` ou `VALIDATION.md` com mensagem de erro
  clara (apenas neste prompt).
- Atualizar `pudim/COMMANDS.md` e `pudim/WORKFLOW.md` para refletir a nova precondição.

## O que está fora do escopo

- Comando de reabertura de task (candidato a TASK-005).
- Reset automático de `Approved` → `Draft` quando um SPEC aprovado é editado (candidato a
  TASK-006).
- O mesmo gap de "arquivo não encontrado" em `pudim-tarefa-validar.prompt.md`.
- Drift de frontmatter (`agent:` vs `mode:`), `CONST.md` em branco, ajustes em `setup.sh`.

## Critérios de Aceite

> O que precisa ser verdade para considerar essa task concluída?

- [ ] CA-01: `/pudim-tarefa-fechar` contra uma task cujo `SPEC.md` tem `Status: Draft` (ou
  `In Progress`) bloqueia explicitamente o fechamento, sem alterar `STATUS.md` nem
  `VALIDATION.md`.
- [ ] CA-02: `/pudim-tarefa-fechar` contra uma task com SPEC já `Approved` e `VALIDATION.md` com
  todos os critérios evidenciados continua fechando normalmente — sem regressão (testar contra
  TASK-001/002/003).
- [ ] CA-03: `/pudim-tarefa-fechar` com um `taskId` cuja pasta `pudim/specs/TASK-XYZ/` não
  existe produz mensagem de erro clara, não comportamento indefinido.
- [ ] CA-04: `pudim/COMMANDS.md` (e `pudim/WORKFLOW.md`, na etapa de fechamento) documentam a
  checagem de `Status: Approved` como precondição obrigatória de fechamento.

## Impacto técnico

_Quais partes do sistema são afetadas? (deixe em branco o que não se aplica)_

- Frontend: não aplicável
- Backend: `.github/prompts/pudim-tarefa-fechar.prompt.md`, `pudim/COMMANDS.md`,
  `pudim/WORKFLOW.md`
- Banco de dados: não aplicável
- Integrações: GitHub Copilot e Claude Code

## Dependências

- Esta task depende de: -
- Esta task bloqueia: TASK-005 (reabertura), TASK-006 (gates de criação/edição de SPEC) — fazem
  mais sentido depois deste gate estar em vigor, mas não são bloqueadas tecnicamente por ele.

## Riscos

- Risco: a nova checagem bloquear fechamentos legítimos por um `Status` escrito de forma
  ligeiramente diferente do esperado (ex.: espaços extras, caixa diferente).
- Como mitigar: comparar de forma tolerante a espaços/caixa, e exibir o valor lido literalmente
  na mensagem de erro para facilitar diagnóstico.

## Decisão

- Aprovado por: Bruno Vieira (aprovação do plano de execução nesta sessão, via análise
  socrática + roadmap priorizado)
- Data: 2026-07-20

---

**Pudim-Spec:** v0.3.2
