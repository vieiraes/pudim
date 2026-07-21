# SPEC — TASK-007

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-007 |
| Título | Portal Pudim — execução real de scripts + logs em tempo real (SSE) |
| Autor | Bruno Vieira (com Claude Code) |
| Data | 2026-07-20 |

---

## Objetivo

Estender o `portal/` (TASK-006) para **executar de verdade** os scripts não-interativos do
Pudim (`validate-project.sh`, `install-hooks.sh`) a partir de um clique, com os logs
transmitidos em tempo real na própria página — modelado no padrão já usado em
`/home/bruno_vieira/projects/gh/pw-test/portal` (referência estudada nas TASK-005/006).

## Problema

Hoje, para rodar `validate-project.sh` ou `install-hooks.sh` o dev precisa sair do portal e ir
ao terminal. Isso quebra a proposta "visual-first" — o portal mostra os comandos mas não os
executa. Falta fechar esse ciclo: clicar, ver rodando, ver o resultado.

## O que está dentro do escopo

- Allowlist de scripts executáveis pelo portal, definida **no servidor** (nunca o cliente manda
  comando cru, só um nome):
  - `validate` → `./pudim/validate-project.sh` (validação completa)
  - `validate:quick` → `./pudim/validate-project.sh --quick` (só erros críticos, o mesmo modo
    usado no hook de pre-commit)
  - `hooks` → `./pudim/install-hooks.sh` (instala/atualiza o hook de pre-commit local — grava em
    `.git/hooks/pre-commit`; ver risco abaixo)
- Backend (`portal/server.js`):
  - `GET /api/scripts` — retorna a allowlist (nome, descrição, comando exibível).
  - `POST /api/run` — recebe `{ name }`, valida contra a allowlist, recusa se já houver uma
    execução em andamento para aquele nome, faz `spawn(shell, ['-lc', cmd], { cwd: raiz do
    repo, detached: true, stdio: 'pipe', env: { ...process.env, FORCE_COLOR: 'true' } })`.
  - `POST /api/stop` — recebe `{ name }`, mata o grupo do processo (`process.kill(-pid,
    'SIGTERM')`) se estiver rodando.
  - `GET /api/logs?name=...` — Server-Sent Events: ring-buffer em memória por execução, replay
    via header `Last-Event-ID` em caso de reconexão, ping de keep-alive periódico.
- Frontend (`portal/public/`):
  - Cada script da allowlist vira um card com botão **▶ Executar** / **Parar**, status
    (ocioso/rodando/concluído/falhou) e um painel de terminal (`<pre>`/`<div>`) com conversão
    ANSI→HTML (paleta GitHub-dark), auto-scroll com trava manual quando o usuário rola para
    cima. O card de `hooks` traz, sempre visível (sem exigir clique extra), uma frase curta
    explicando que a execução grava/atualiza `.git/hooks/pre-commit` no repositório local —
    documentação clara substitui confirmação extra, por decisão do usuário.
  - `EventSource('/api/logs?name=...')` no cliente, com dedupe por id de evento (reconexão não
    duplica linha).
- `setup.sh` **não** ganha botão de execução (é interativo — permanece só com explicação +
  botão "copiar comando", já existente desde a TASK-006).
- Atualizar `portal/README.md` e a seção "Portal do Pudim" em `README.md`/`pudim/README.md`
  avisando explicitamente que o portal passa a **rodar processos locais de verdade** (mesmo
  shell/permissões do usuário).

## O que está fora do escopo

- Executar `setup.sh` (interativo, faria o `spawn` travar esperando stdin).
- Qualquer script além dos 3 da allowlist acima.
- Histórico persistido de execuções/logs antigos (SQLite ou similar) — a referência usa isso,
  mas é avaliado como provável exagero para este projeto; fica como backlog.
- Autenticação, multiusuário, exposição fora de `127.0.0.1`.
- Alterar o conteúdo dos próprios scripts `.sh`.

## Critérios de Aceite

- [ ] CA-01: `GET /api/scripts` retorna a allowlist (`validate`, `validate:quick`, `hooks`) com
      nome, descrição e o comando exibível — e nenhum outro comando é aceito por `/api/run`
      (nome fora da allowlist → HTTP 400, sem `spawn`).
- [ ] CA-02: clicar ▶ no card "Validar projeto" dispara `POST /api/run { name: "validate" }`, o
      processo real roda (`./pudim/validate-project.sh`), e a saída (incluindo cores ANSI)
      aparece no painel de terminal via SSE, terminando com o mesmo resultado (0 erros/0 avisos)
      que rodar no terminal manualmente.
- [ ] CA-03: clicar **Parar** durante uma execução em andamento mata o processo (grupo) e o
      status do card muda para "parado" — uma nova execução do mesmo script pode ser iniciada
      depois.
- [ ] CA-04: reconectar o `EventSource` (ex.: recarregar a página durante uma execução) não
      duplica linhas já exibidas (replay via `Last-Event-ID` funciona).
- [ ] CA-05: `setup.sh` continua sem botão de execução no portal (só copiar comando) — comprovar
      que a allowlist do servidor não inclui `setup`.
- [ ] CA-06: servidor continua bind em `127.0.0.1` e o cliente nunca envia comando cru, só o
      nome — inspecionável no código-fonte de `app.js`/`server.js`.

## Impacto técnico

- Frontend: `portal/public/app.js`/`index.html`/`styles.css` ganham cards de execução + painel
  de terminal + cliente SSE.
- Backend: `portal/server.js` ganha 4 rotas novas (`/api/scripts`, `/api/run`, `/api/stop`,
  `/api/logs`) e gerência de processos filhos.
- Banco de dados: não se aplica.
- Integrações: nenhuma (localhost only); processos filhos rodam com o mesmo usuário/permissões
  de quem iniciou o portal.

## Dependências

- Esta task depende de: TASK-006 (portal precisa já existir).
- Esta task bloqueia: nenhuma task futura definida ainda.

## Riscos

- Risco: `install-hooks.sh` grava em `.git/hooks/pre-commit` — é uma escrita real no repositório
  local do usuário, disparada por um clique no navegador.
  - Como mitigar: o script já é idempotente e local (mesma coisa que rodar no terminal); o card
    do portal exibe, sempre visível, que a execução "instala/atualiza o hook de pre-commit
    local" — decisão do usuário: documentação clara é suficiente, sem exigir confirmação extra
    (segundo clique/modal) além do próprio botão ▶ Executar.
- Risco: processo travado (ex.: script pendurado) deixando a execução "presa" no estado
  "rodando" para sempre.
  - Como mitigar: `POST /api/stop` sempre disponível; ping/keep-alive do SSE detecta conexão
    perdida; timeout de segurança pode ser avaliado durante o BUILD se necessário.
- Risco: dois cliques rápidos no mesmo ▶ disparando duas execuções concorrentes do mesmo script.
  - Como mitigar: servidor recusa novo `POST /api/run` para um nome que já está em execução
    (guard de concorrência, CA-03 cobre o ciclo executar→parar→executar de novo).

## Decisão

- Aprovado por: Bruno Vieira ("sem problemas se estiver claramente explicida na documentação")
- Data: 2026-07-20

---

**Pudim-Spec:** v0.3.2
