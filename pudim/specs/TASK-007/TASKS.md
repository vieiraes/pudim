# TASKS - TASK-007

## Resumo

- Task principal: TASK-007
- Objetivo curto: Portal executa `validate-project.sh`/`install-hooks.sh` de verdade, com logs em tempo real via SSE.

## Backlog executavel

- [x] SUB-001 | Allowlist + `GET /api/scripts` no server.js | Depende de: -
- [x] SUB-002 | `POST /api/run` (spawn, guard de concorrência) + `POST /api/stop` (kill do grupo) | Depende de: SUB-001
- [x] SUB-003 | `GET /api/logs` via SSE (ring-buffer, replay por Last-Event-ID, ping) | Depende de: SUB-002
- [x] SUB-004 | Frontend: cards ▶ Executar/Parar + painel de terminal com ANSI→HTML + cliente EventSource | Depende de: SUB-003
- [x] SUB-005 | Aviso sempre visível antes de rodar `hooks` (grava em .git/hooks) + atualizar portal/README.md e READMEs | Depende de: SUB-004
- [x] SUB-006 | Validar CA-01 a CA-06 com evidência real e preencher VALIDATION.md | Depende de: SUB-005

## Ordem sugerida

1. SUB-001
2. SUB-002
3. SUB-003
4. SUB-004
5. SUB-005
6. SUB-006

## Evidencias por subtask

- SUB-001: `portal/server.js` ganhou `SCRIPTS` (allowlist) e `GET /api/scripts`; testado com `curl` (200 com os 3 scripts; 400 para nome fora da allowlist).
- SUB-002: `POST /api/run` (spawn detached + FORCE_COLOR, guard de concorrência 409) e `POST /api/stop` (`process.kill(-pid,'SIGTERM')`); testado com execuções reais e reprodução isolada do kill (`sleep 5`).
- SUB-003: `GET /api/logs` (SSE, ring-buffer `MAX_BUFFER=2000`, replay filtrado por `Last-Event-ID`, ping a cada 15s); testado com reconexão real via curl.
- SUB-004: seção `#executar` em `index.html` (template + container) e bloco novo em `app.js` (fetch inicial, `renderCard`, `runScript`/`stopScript`, `ansiToHtml`, `EventSource`); CSS em `styles.css` (`.script-card`, `.terminal`, etc.); revisado via screenshot.
- SUB-005: aviso fixo no card `hooks` (`.script-warning`); `portal/README.md`, `README.md` e `pudim/README.md` atualizados para refletir execução real (não é mais "só leitura").
- SUB-006: `pudim/specs/TASK-007/VALIDATION.md` preenchido com evidência real por CA; `./pudim/validate-project.sh` 0 erros/0 avisos.

---

**Pudim-Spec:** v0.3.2
