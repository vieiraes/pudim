# SPEC — TASK-009

> **Status:** Done

| Campo | Valor |
|---|---|
| Task | TASK-009 |
| Título | Pós-dogfood: setup robusto + instalador sem specs herdados + /pudim-const amigável a iniciante |
| Autor | Bruno Vieira |
| Data | 2026-07-21 |

---

## Objetivo

Corrigir dois bugs encontrados no teste end-to-end e tornar o `/pudim-const` acessível ao público-alvo real (dev iniciante), que descreve o projeto por intenção e não por stack técnica.

## Problema

No teste de dogfood (simulação do projeto "Trinca" em `/tmp/pudim-demo-jogo-velha`) apareceram:
1. `pudim/setup.sh` aborta logo na primeira tela quando `TERM` não está definido — `clear` retorna
   erro e o `set -e` mata o wizard (`TERM environment variable not set.` → exit 1).
2. `INSTALL.md` manda "copie a pasta `pudim/` inteira", o que arrasta `pudim/specs/TASK-*` do
   próprio framework para o projeto do usuário; o harness então os acusa como spec packs órfãos.
3. O `/pudim-const` (mesmo após a TASK-008) ainda pressupõe que o usuário conhece tecnologias — a
   pergunta de stack traz o exemplo "TypeScript + Next.js + Postgres", intimidante para um júnior
   que diria apenas "quero mandar um link pro meu amigo e a gente joga em tempo real".

## O que está dentro do escopo

- `setup.sh`: tornar o `clear` tolerante a ambiente sem `TERM` (não abortar o wizard).
- `INSTALL.md`: instruir explicitamente a limpar `pudim/specs/` após copiar (specs são do usuário,
  não do framework), evitando spec packs órfãos.
- `pudim-const.prompt.md`: reformular a pergunta de stack para aceitar linguagem leiga; a IA
  **propõe** uma stack simples, explica em uma frase e confirma no Plano de Ação. Guardrail geral:
  traduzir intenção em decisão técnica; nunca exigir que o usuário conheça jargão.
- Sincronizar docs afetados (COMMANDS/CARTILHA) se a descrição do comando mudar.

## O que está fora do escopo

- Reescrever o wizard `setup.sh` além do fix pontual do `clear`.
- Distribuir o Pudim como pacote/CLI (empacotamento é outra trilha).
- Mudar as outras 5 perguntas do `/pudim-const` (só a de stack precisa virar leiga-friendly).
- Corrigir o drift de frontmatter `agent:`/`mode:` (spike separado no backlog).

## Critérios de Aceite

> O que precisa ser verdade para considerar essa task concluída?

- [ ] CA-01: `env -u TERM bash pudim/setup.sh </dev/null` (ou equivalente) não aborta por causa do
  `clear`; o wizard prossegue mesmo sem `TERM`.
- [ ] CA-02: `INSTALL.md` instrui a esvaziar/limpar `pudim/specs/` após copiar, deixando claro que
  os spec packs são do projeto do usuário e não devem herdar os do framework.
- [ ] CA-03: `pudim-const.prompt.md` aceita resposta em linguagem leiga na pergunta de stack (o
  exemplo intimidante sai), instrui a IA a propor uma stack simples + explicar + confirmar no Plano
  de Ação, e traz o guardrail "nunca exigir jargão do usuário".
- [ ] CA-04: re-teste no projeto demo com uma resposta de júnior ("mando um link pro meu amigo e a
  gente joga em tempo real") gera um CONST coerente com a stack **proposta pela IA**, sem o usuário
  nomear tecnologia.
- [ ] CA-05: `pudim/validate-project.sh` continua 0 erros / 0 avisos; docs sincronizados.

## Impacto técnico

_Quais partes do sistema são afetadas? (deixe em branco o que não se aplica)_

- Frontend: —
- Backend: `pudim/setup.sh` (fix do `clear`)
- Banco de dados: —
- Integrações: `.github/prompts/pudim-const.prompt.md`, `pudim/INSTALL.md`, docs (COMMANDS/CARTILHA)

## Dependências

- Esta task depende de: TASK-008 (base do `/pudim-const` socrático)
- Esta task bloqueia: —

## Riscos

- Risco: a IA "empurrar" uma stack sem o usuário entender.
- Como mitigar: a proposta é sempre explicada em uma frase e confirmada no Plano de Ação (o usuário
  aceita ou ajusta) — nunca imposta.
- Risco: o fix do `clear` mascarar outros erros de terminal.
- Como mitigar: tornar tolerante só o `clear` (`|| true`), não o wizard inteiro.

## Decisão

- Aprovado por: Bruno Vieira
- Data: 2026-07-21
- Nota: fix do instalador é doc-only no INSTALL.md (decisão do owner); setup.sh não ganha auto-limpeza de specs.

---

**Pudim-Spec:** v0.3.2
