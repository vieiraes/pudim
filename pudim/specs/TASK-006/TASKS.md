# TASKS - TASK-006

## Resumo

- Task principal: TASK-006
- Objetivo curto: App Express local que serve o manual visual do Pudim (leitura), com o novo logo.

## Backlog executavel

- [x] SUB-001 | Estrutura base (`portal/server.js`, `package.json`, `.gitignore`, `express.static`, `listen(4444,'127.0.0.1')`) | Depende de: -
- [x] SUB-002 | Layout base do manual (`index.html`, `styles.css`, tema claro/escuro, responsivo) | Depende de: SUB-001
- [x] SUB-003 | Seção 3 camadas + pré-requisitos + instalação Claude Code/Copilot com SVGs e botão copiar comando (`app.js`) | Depende de: SUB-002
- [x] SUB-004 | Diagrama do fluxo CONST→SPEC→TASKS→BUILD→VALIDATION + cards dos comandos + walkthrough da primeira task + FAQ | Depende de: SUB-002
- [x] SUB-005 | Atualizar README.md, COMMANDS.md, CARTILHA.md, AGENTS.md e docs-curator.agent.md | Depende de: SUB-003, SUB-004
- [x] SUB-006 | Validar CA-01 a CA-06 com evidência real e preencher VALIDATION.md | Depende de: SUB-005

## Ordem sugerida

1. SUB-001
2. SUB-002
3. SUB-003 e SUB-004
4. SUB-005
5. SUB-006

## Evidencias por subtask

- SUB-001: `portal/{server.js,package.json,.gitignore,README.md}` criados; `npm install` (68 pacotes, 0 vulnerabilidades) e `npm start` testados com `curl` (200 na raiz).
- SUB-002: `portal/public/styles.css` (variáveis de tema, media queries) + esqueleto de `index.html` (topbar, sidebar, main); revisado via chromium headless (1280px e 375px).
- SUB-003: seções `#camadas`, `#pre-requisitos`, `#instalacao` (abas Claude/Copilot, SVGs inline, `.codeblock`+`copy-btn`) e `app.js` (clipboard, tema, nav mobile, tabs).
- SUB-004: seções `#fluxo` (5 nós + gates), `#comandos` (7 cards), `#primeira-tarefa` (4 passos) e `#faq` (5 itens), fiéis a COMMANDS.md/CARTILHA.md.
- SUB-005: `README.md`, `pudim/README.md`, `pudim/COMMANDS.md`, `pudim/CARTILHA.md`, `pudim/INSTALL.md`, `AGENTS.md` e `.github/agents/docs-curator.agent.md` atualizados (ver VALIDATION.md CA-06).
- SUB-006: `pudim/specs/TASK-006/VALIDATION.md` preenchido com evidência real por CA; `./pudim/validate-project.sh` 0 erros/0 avisos.

---

**Pudim-Spec:** v0.3.2
