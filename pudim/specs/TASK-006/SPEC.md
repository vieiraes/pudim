# SPEC — TASK-006

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-006 |
| Título | Portal Pudim — fundação + manual visual (sem execução) |
| Autor | Bruno Vieira (com Claude Code) |
| Data | 2026-07-20 |

---

## Objetivo

Criar um app Node/Express local (`portal/`) que serve, em `http://127.0.0.1:4444`, um manual
visual do Pudim (só leitura nesta task) — a via **preferida** de aprender e instalar o
framework, no estilo de uma página de docs (tipo GitHub), usando o logo criado na TASK-005.

## Problema

Hoje o único jeito de entender e instalar o Pudim é ler vários `.md` (README, INSTALL,
CARTILHA, COMMANDS) em sequência. Não há um fluxo visual guiado, com ilustrações e comandos
prontos para copiar, que reduza o atrito de instalação para um dev iniciante em IA. O usuário
prefere iteração visual à interação por terminal como forma primária de operar o Pudim.

## O que está dentro do escopo

- `portal/server.js` (Express, sem build step) + `portal/package.json` + `portal/README.md` +
  `portal/.gitignore` (cobrindo `node_modules/`).
- `portal/public/{index.html,app.js,styles.css,assets/}` servidos via `express.static`.
- `server.listen(4444, '127.0.0.1', ...)` — bind local apenas.
- Conteúdo do manual (fiel aos arquivos reais — sem inventar comando/passo que não exista):
  1. Explicação das 3 camadas (ferramenta vs framework vs "este repo é dogfood") — reaproveita
     o texto já existente em `README.md`.
  2. Pré-requisitos de instalação.
  3. Passo a passo de instalação para **Claude Code** (terminal) e **GitHub Copilot** (IDE), em
     linguagem fácil, com ilustração SVG por passo (não screenshot) e botão "copiar comando".
  4. Diagrama visual do fluxo `CONST → SPEC → TASKS → BUILD → VALIDATION` com os gates
     (substituindo o ASCII do README/pudim/README).
  5. Cards dos comandos documentados em `pudim/COMMANDS.md`.
  6. Walkthrough da primeira task, fiel ao exemplo de `pudim/CARTILHA.md`.
  7. Seção de erros comuns / FAQ.
- Botão "copiar comando" funcional (clipboard) em cada bloco de comando do manual.
- Layout responsivo, com suporte a tema claro/escuro.
- Atualização de `README.md` (nova seção "Portal do Pudim" com `cd portal && npm install && npm
  start`), `pudim/COMMANDS.md` e `pudim/CARTILHA.md` linkando o portal.
- Atualização de `AGENTS.md`: remover "UI gráfica ou integração web" da lista "Fora de Escopo
  Inicial" e reposicionar o portal como interface visual-first (documentando que o núcleo do
  Pudim continua sendo bash + markdown; o portal é uma camada de apresentação opcional, não uma
  dependência do fluxo SDD).
- Atualização de `.github/agents/docs-curator.agent.md`: incluir `portal/public/index.html` no
  escopo editável do agente curador.

## O que está fora do escopo

- Execução real de scripts e streaming de logs (isso é a TASK-007, que depende desta).
- Publicação da parte estática no GitHub Pages (backlog).
- Suporte a Gemini no manual (backlog; cobre só Claude Code + Copilot nesta task).
- Autenticação, multiusuário ou qualquer estado persistido no servidor.
- Qualquer alteração nos scripts `.sh` ou nos prompts `.prompt.md`/`.agent.md` existentes (o
  portal documenta o fluxo, não o substitui).

## Critérios de Aceite

- [ ] CA-01: `cd portal && npm install && npm start` sobe um servidor Express local em
      `127.0.0.1:4444` sem etapa de build, e a raiz (`/`) serve o manual.
- [ ] CA-02: o manual cobre, fiel ao conteúdo real de `README.md`/`pudim/INSTALL.md`, as 3
      camadas, pré-requisitos, instalação passo a passo para Claude Code (terminal) e Copilot
      (IDE) com ilustração SVG por passo, o diagrama do fluxo com gates, os comandos de
      `pudim/COMMANDS.md` e o walkthrough da primeira task de `pudim/CARTILHA.md`.
- [ ] CA-03: todo bloco de comando no manual tem um botão "copiar" que copia o texto exato do
      comando para a área de transferência (verificável manualmente).
- [ ] CA-04: a página é responsiva (mobile/desktop) e respeita tema claro/escuro (do sistema ou
      de um toggle).
- [ ] CA-05: `grep -nE "https?://" portal/public/*` não mostra nenhum `<script src=`, `<link
      href=` de CDN, fonte remota ou chamada de rede externa (only same-origin assets).
- [ ] CA-06: `README.md`, `pudim/COMMANDS.md`, `pudim/CARTILHA.md` e `AGENTS.md` estão
      atualizados e sem inconsistência com o portal (rodar `./pudim/validate-project.sh` sem
      novos erros).

## Impacto técnico

- Frontend: novo (`portal/public/*`, vanilla JS/HTML/CSS, sem framework/build).
- Backend: novo (`portal/server.js`, Express, servidor de arquivos estáticos).
- Banco de dados: não se aplica.
- Integrações: nenhuma (localhost only).

## Dependências

- Esta task depende de: TASK-005 (logo usado no branding do portal).
- Esta task bloqueia: TASK-007 (execução real de scripts + logs, que estende este `portal/`).

## Riscos

- Risco: manual ficar dessincronizado do conteúdo real dos `.md`/scripts (drift).
  - Como mitigar: cada seção do manual referencia e é revisada contra o arquivo-fonte real
    (README/INSTALL/COMMANDS/CARTILHA) antes de fechar a task; `docs-curator` passa a cobrir
    `portal/public/index.html` para curadorias futuras.
- Risco: mudar `AGENTS.md` (arquivo de alto impacto) pode ser mal-entendido como "Pudim agora
  depende de Node/web".
  - Como mitigar: texto explícito deixando claro que o núcleo do fluxo SDD continua sendo
    bash + markdown; o portal é uma camada de apresentação opcional.

## Decisão

- Aprovado por: Bruno Vieira ("pode continuar")
- Data: 2026-07-20

---

**Pudim-Spec:** v0.3.2
