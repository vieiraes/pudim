# VALIDATION — TASK-007

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-007 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: `GET /api/scripts` retorna a allowlist (`validate`, `validate:quick`, `hooks`) com nome, descrição e o comando exibível — e nenhum outro comando é aceito por `/api/run`.
  - Evidência: `curl -s http://127.0.0.1:4444/api/scripts` retornou os 3 scripts com `name`/`description`/`command`/`running`. `curl -X POST .../api/run -d '{"name":"rm -rf /"}'` → `HTTP 400 {"error":"Script desconhecido (fora da allowlist)."}` (nenhum `spawn` chamado — `server.js` checa `Object.prototype.hasOwnProperty.call(SCRIPTS, name)` antes de qualquer spawn).
- [x] CA-02: clicar ▶ em "Validar projeto" dispara `POST /api/run { name: "validate" }`, o processo real roda, e a saída aparece via SSE, terminando com o mesmo resultado do terminal.
  - Evidência: `curl -X POST .../api/run -d '{"name":"validate"}'` → `{"ok":true,"name":"validate","pid":2402089}`. Stream capturado de `GET /api/logs` mostrou `event:start` → 82 eventos `event:log` (texto real do script, incluindo códigos ANSI de cor) → `event:done` com `"exitCode":0`. Rodar `./pudim/validate-project.sh` manualmente no terminal no mesmo momento confirmou o mesmo resultado (0 erros, 0 avisos). Também testado com `hooks`: saída real capturada incluindo o aviso `⚠ Hook existente salvo em: .git/hooks/pre-commit.backup...` e `✔ Hook pre-commit instalado`, `exitCode:0` — comparado byte a byte (`diff`) com o backup automático do hook de maio/2026, confirmando que `install-hooks.sh` é idempotente (nenhuma mudança de comportamento, só reinstalou o mesmo conteúdo).
- [x] CA-03: clicar **Parar** mata o processo e o card libera para nova execução; guard de concorrência recusa uma 2ª execução do mesmo script enquanto a 1ª está rodando.
  - Evidência (guard de concorrência): duas chamadas sequenciais de `POST /api/run {"name":"validate:quick"}` sem esperar a 1ª terminar → 1ª `HTTP 200`, 2ª `HTTP 409 {"error":"'validate:quick' já está em execução."}`. Evidência (kill): os 3 scripts da allowlist terminam em <0.5s (medido com `time ./pudim/validate-project.sh` → 0.304s total), tempo insuficiente para um round-trip HTTP de `/api/stop` interceptar o processo em execução real. Para comprovar o mecanismo exato usado em `POST /api/stop` (`process.kill(-pid,'SIGTERM')` sobre um processo `spawn(...,{detached:true})`), reproduzi isoladamente com `sleep 5` no lugar do script real: processo iniciado, `process.kill(-pid,'SIGTERM')` chamado após 300ms → evento `close` disparou com `code=null, signal=SIGTERM` e nenhuma saída do `echo` posterior ao `sleep` apareceu — confirma que o grupo de processo é morto antes de completar, mesmo padrão que `server.js` usa para os 3 scripts reais.
  - Nota: `/api/stop` chamado quando nada está rodando retorna `HTTP 400 {"error":"'x' não está em execução."}` (testado com `hooks` logo após o processo já ter terminado).
- [x] CA-04: reconectar o `EventSource` não duplica linhas já exibidas (replay via `Last-Event-ID` funciona).
  - Evidência: capturei o stream, identifiquei o último `id` visto (`177`), disparei uma nova execução (ids seguintes) e reconectei com o header `Last-Event-ID: 177` — a resposta trouxe só `83` linhas novas (todas com `id > 177`), confirmando o filtro `if (entry.id && entry.id <= lastEventId) continue;` em `GET /api/logs`. O `EventSource` nativo do navegador já envia esse header automaticamente em reconexões (usa o último `id:` recebido), então o comportamento do cliente é correto sem código extra de dedupe.
- [x] CA-05: `setup.sh` continua sem botão de execução — allowlist do servidor não inclui `setup`.
  - Evidência: `curl -X POST .../api/run -d '{"name":"setup"}'` → `HTTP 400 {"error":"Script desconhecido..."}`. `grep -n "setup" portal/server.js` não retorna nenhuma entrada em `SCRIPTS` (só existe nos comentários/README, nunca na allowlist executável). Confirmado no código-fonte de `setup.sh` que ele usa `read -r` interativo (linhas 81/87/96) — rodá-lo via `spawn` sem stdin travaria, por isso a exclusão é também tecnicamente necessária, não só de design.
- [x] CA-06: servidor bind em `127.0.0.1`; cliente nunca envia comando cru, só o nome.
  - Evidência: `ss -ltnp | grep 4444` → `LISTEN ... 127.0.0.1:4444 ... node`. Revisão de `portal/public/app.js`: `runScript()`/`stopScript()` chamam `fetch('/api/run'/'/api/stop', { body: JSON.stringify({ name: name }) })` — nunca monta ou envia uma string de comando; o mapeamento nome→comando real só existe no objeto `SCRIPTS` dentro de `server.js` (servidor).

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada (manual da TASK-006 intacto; `./pudim/validate-project.sh` continua 0 erros/0 avisos)
- [x] Testes passando (ver evidências de execução real acima)
- [x] Código revisado (`server.js` completo reescrito e revisado; `app.js`/`index.html`/`styles.css` revisados após adicionar a seção `#executar`)
- [x] Regras de acesso/segurança respeitadas — bind `127.0.0.1`, allowlist fixa no servidor, cliente só envia nome, `setup.sh` (interativo) fora da allowlist

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável (sem lógica de negócio isolada; testado end-to-end via HTTP real) |
| Integração | Servidor real rodando (`npm start`) + `curl` para `/api/scripts`, `/api/run`, `/api/stop`, `/api/logs` (incluindo `Last-Event-ID`); guard de concorrência (409) e allowlist (400) testados com requisições reais; `./pudim/validate-project.sh` 0 erros/0 avisos após todas as mudanças |
| Manual | Screenshot da seção `#executar` renderizada (chromium headless) confirmando os 3 cards, botões e aviso do `hooks`; estado dinâmico (rodando/concluído) verificado via HTTP em vez de screenshot ao vivo, porque o modo `--screenshot` do chromium headless não é compatível com uma conexão SSE persistente (o `EventSource` aberto no load impede o disparo do "load" que o modo single-shot espera) |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| Nenhum bug de comportamento encontrado nesta task | — | — |

## Conclusão

- Resultado final: Todos os critérios de aceite (CA-01 a CA-06) atendidos com evidência real de execução (HTTP, SSE, kill de processo, código-fonte).
- Pendências abertas: histórico persistido de execuções (backlog, avaliado como provável exagero); reconexão automática do navegador em quedas de rede não foi simulada artificialmente (só o filtro server-side de `Last-Event-ID` foi testado diretamente via curl).
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
