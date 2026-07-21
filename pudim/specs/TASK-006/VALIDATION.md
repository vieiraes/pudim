# VALIDATION — TASK-006

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-006 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: `cd portal && npm install && npm start` sobe um servidor Express local em `127.0.0.1:4444` sem etapa de build, e a raiz (`/`) serve o manual.
  - Evidência: `npm install` executado em `portal/` (68 pacotes, 0 vulnerabilidades). `npm start` executa `node server.js` (sem passo de build no `package.json`). `server.js` usa `express.static(path.join(__dirname,'public'))` e `app.listen(PORT, HOST, ...)` com `PORT=4444`, `HOST='127.0.0.1'`. Com o servidor rodando, `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4444/` → `200`; `/styles.css`, `/app.js` e `/assets/pudim-icon.svg` também retornaram `200`.
- [x] CA-02: o manual cobre, fiel ao conteúdo real de `README.md`/`pudim/INSTALL.md`, as 3 camadas, pré-requisitos, instalação passo a passo para Claude Code (terminal) e Copilot (IDE) com ilustração SVG por passo, o diagrama do fluxo com gates, os comandos de `pudim/COMMANDS.md` e o walkthrough da primeira task de `pudim/CARTILHA.md`.
  - Evidência: `portal/public/index.html` tem as seções `#camadas` (3 camadas — ferramenta/framework/projeto, mesma analogia carro/piloto automático do README.md), `#pre-requisitos`, `#instalacao` (abas Claude Code/Copilot, 4 passos com `<svg>` inline por passo — instalação, cópia de arquivos, wizard/extensões, teste — e blocos `.codeblock` com os comandos reais do INSTALL.md: `cp pudim/templates/...`, `./pudim/setup.sh`, `claude`, `/pudim-iniciar`), `#fluxo` (5 nós CONST→SPEC→TASKS→BUILD→VALIDATION + os 2 gates reais descritos em `pudim/COMMANDS.md`), `#comandos` (7 cards — um por comando documentado em `pudim/COMMANDS.md`: const, iniciar, tarefa-registrar, tarefa-criar, tarefa-validar, tarefa-fechar, status), `#primeira-tarefa` (4 passos replicando o exemplo "Criar página inicial do site" da `pudim/CARTILHA.md`) e `#faq` (5 erros comuns, texto adaptado 1:1 da Parte 5 da CARTILHA). Renderização revisada visualmente via `chromium-browser --headless --screenshot` em desktop (1280px) e mobile (375px) — todas as seções e os 2 estados de aba (Claude Code / Copilot) inspecionados.
  - Nota de correção: a SPEC original mencionava "8 comandos"; o `pudim/COMMANDS.md` real documenta 7 (`/pudim-status TASK-XYZ`/`CONTEXTO` são o mesmo comando com argumento, não um 8º comando). SPEC.md corrigido para "os comandos" antes do fechamento, para não fixar um número que diverge do arquivo-fonte.
- [x] CA-03: todo bloco de comando no manual tem um botão "copiar" que copia o texto exato do comando para a área de transferência.
  - Evidência: `grep -c "copy-btn" portal/public/index.html` → `10` botões, um por bloco `.codeblock` com comando de terminal/chat (os blocos que só mostram *resultado* do comando, como o board `- [ ] TASK-001 | ...`, não têm botão — comportamento esperado, pois não são comandos para copiar). `portal/public/app.js` usa `navigator.clipboard.writeText(btn.getAttribute('data-copy'))` e cada `data-copy` foi conferido manualmente contra o `<pre>` correspondente (texto idêntico). Feedback visual: o botão muda para "Copiado!" com classe `.copied` por 1.5s.
- [x] CA-04: a página é responsiva (mobile/desktop) e respeita tema claro/escuro.
  - Evidência: `portal/public/styles.css` define variáveis de cor em `:root`, sobrescritas por `:root[data-theme="dark"]` e por `@media (prefers-color-scheme: dark)`; `#theme-toggle` em `app.js` alterna `data-theme` e persiste em `localStorage`. Media queries em `styles.css` (`min-width: 640px`, `min-width: 960px`, `max-width: 959px`) controlam a tagline, o comportamento da sidebar (fixa em desktop, off-canvas com overlay em mobile) e o `nav-toggle`. Renderização real via chromium headless em 1280px (desktop, sidebar fixa) e 375px (mobile, sidebar oculta atrás do botão ☰, tagline escondida) confirmou os dois layouts.
- [x] CA-05: `grep -nE "https?://" portal/public/*` não mostra nenhum `<script src=`, `<link href=` de CDN, fonte remota ou chamada de rede externa.
  - Evidência: `grep -nE "https?://" portal/public/index.html portal/public/styles.css portal/public/app.js` retorna uma única ocorrência — um link de texto (`<a href="https://docs.anthropic.com/claude-code" target="_blank">`) apontando para a documentação oficial do Claude Code, clicável pelo usuário, não uma requisição de rede automática (sem `<script src=`, `<link rel="stylesheet" href="http...">`, `@import` ou `<img src="http...">`). Todos os assets (`styles.css`, `app.js`, `assets/pudim-icon.svg`) são same-origin, servidos pelo próprio `express.static`.
- [x] CA-06: `README.md`, `pudim/COMMANDS.md`, `pudim/CARTILHA.md` e `AGENTS.md` estão atualizados e sem inconsistência com o portal.
  - Evidência: `README.md:87` e `pudim/README.md:60` têm a seção "Portal do Pudim (via visual)" com o comando `cd portal && npm install && npm start`. `pudim/COMMANDS.md:7`, `pudim/CARTILHA.md:94/141/234` e `pudim/INSTALL.md:30/69/115` referenciam o portal (checklist de instalação, callout na Parte 2, estrutura de cópia). `AGENTS.md` teve "UI gráfica ou integração web" removido de "Fora de Escopo Inicial" e ganhou texto explícito em "Direção Tecnológica > Frontend" e um 6º item em "Escopo Funcional Mínimo" deixando claro que o portal é uma camada opcional — nenhum comando `/pudim-*` passa a depender dele. `.github/agents/docs-curator.agent.md` teve `portal/public/index.html` adicionado ao escopo editável. `./pudim/validate-project.sh` executado após todas as mudanças: 0 erros, 0 avisos.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada (`./pudim/validate-project.sh` continua 0 erros/0 avisos após as mudanças)
- [x] Testes passando (verificação manual via curl + chromium headless, ver evidências acima)
- [x] Código revisado (server.js, package.json, index.html, styles.css, app.js lidos e revisados; doctype/html/head/body corrigido durante a própria revisão)
- [x] Regras de acesso/segurança respeitadas — servidor bind em `127.0.0.1` (não `0.0.0.0`), sem dependência de rede externa

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável (sem lógica de negócio isolada; app estático + servidor de arquivos) |
| Integração | `npm install` (0 vulnerabilidades) + `npm start` real, com `curl` confirmando `200` em `/`, `/styles.css`, `/app.js`, `/assets/pudim-icon.svg`; `./pudim/validate-project.sh` 0 erros/0 avisos |
| Manual | Renderização via `chromium-browser --headless --screenshot` em 1280px (dark, seções inicio/instalação/fluxo/comandos/walkthrough/faq) e 375px (mobile); revisão de código de `app.js` (clipboard, tema, tabs, nav) |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| `index.html` foi escrito sem `<!DOCTYPE html>`/`<html>`/`<head>`/`<body>` (só as tags internas) | Média | Corrigido durante a própria validação, antes do fechamento |
| SPEC.md/TASKS.md diziam "8 comandos", mas `pudim/COMMANDS.md` documenta 7 | Baixa | Corrigido no SPEC.md antes do fechamento (ver nota em CA-02) |

## Conclusão

- Resultado final: Todos os critérios de aceite (CA-01 a CA-06) atendidos com evidência real (execução do servidor, grep, revisão visual).
- Pendências abertas: Nenhuma para esta task. Execução real de scripts + logs em tempo real é a TASK-007 (fora de escopo aqui, por SPEC).
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
