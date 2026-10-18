# Changelog

Todas as mudanças relevantes do Pudim ficam registradas aqui. O formato segue o
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa
[versionamento semântico](https://semver.org/lang/pt-BR/):

- **MAJOR**: quebra de compatibilidade
- **MINOR**: funcionalidade nova sem quebra
- **PATCH**: correção sem mudança de comportamento esperado

Cada versão publicada tem uma tag `vX.Y.Z` e uma release no GitHub. A versão também aparece
em `.claude-plugin/plugin.json` e na [documentação](https://pudim-spec.web.app/docs.html#versoes).

## [Não lançado]

Nada por enquanto.

## [0.4.0] - 2026-10-18

O Pudim deixa de ser um framework de desenvolvimento guiado por especificação e vira o
**primeiro framework de testes feito por QA, para QA**: um plugin do Claude Code para QA e
SDET, em português do Brasil, que entra num projeto JavaScript/TypeScript que já existe.

### Adicionado
- `/pudim:cobertura`: mede a cobertura unitária (Jest ou Vitest) com **todos os arquivos de
  código** na conta, compara com a referência arquivo por arquivo e lista o que mais precisa de
  teste. Se o projeto tem Playwright, mostra também quantas rotas têm teste E2E.
- `/pudim:investigar`: investigação de teste que falha ou bug relatado com **análise
  socrática** (`docs/analise-socratica.md`): evidência × hipótese, repetição com contagem exata
  ("falhou em 5 de 5"), cinco porquês, classificação (Bug no produto, Bug no teste, Instável,
  Ambiente, Dados, Inconclusivo) e relato de bug pronto para o time.
- `/pudim:criar-unitario`: cria testes unitários imitando o estilo do projeto, mede a cobertura
  antes e depois e passa tudo pelo filtro de teste falso. Quando o produto contraria o próprio
  contrato, o teste não é ajustado ao bug: o caso vai para `possiveis-bugs.md`.
- `/pudim:criar-e2e`: cria specs Playwright com seletores acessíveis, roda cada teste 3 vezes
  (`--repeat-each=3`) e mostra as rotas com teste E2E antes e depois. Credenciais só por
  variável de ambiente.
- `/pudim:portal`: portal self-service em `http://127.0.0.1:4455` para listar, rodar e parar os
  testes Playwright pelo navegador, com log ao vivo, resultado exato, trace e histórico.
- `/pudim:relatorio`: relatório de qualidade em HTML visual (claro e escuro, pronto para
  imprimir), Markdown e comentário para o Jira, com status por regras fixas: CONFORME
  ESPERADO, NECESSITA ATENÇÃO ou BLOQUEADO. Abre também pelo botão "📊 Relatório" do portal.
- Scripts sem dependências, todos com teste em `scripts/test.sh` (106 verificações):
  `qa-detect.sh`, `coverage-diff.mjs`, `repetir-teste.sh`, `test-quality.mjs`,
  `e2e-rotas.mjs`, `relatorio.mjs`, `portal/server.mjs` e `portal/playwright-report.mjs`.
- Filtro de teste falso (`test-quality.mjs`): recusa teste sem verificação, só de existência,
  só snapshot, pulado, com `only` ou com mock do próprio módulo testado.
- Pasta `.qa/` como único lugar de escrita do plugin no projeto testado.
- Instalação pelo marketplace: `/plugin marketplace add vieiraes/pudim` e
  `/plugin install pudim@pudim`.
- Documentação técnica em <https://pudim-spec.web.app/docs.html>.

### Removido
- **Quebra de compatibilidade:** o framework de desenvolvimento (board, SPEC, TASKS,
  VALIDATION, CONST, portal de scripts e prompts do Copilot) saiu do plugin. Ele continua no
  branch `legado/framework-dev` e na tag `v0.3.2`.

### Segurança
- O portal escuta só em `127.0.0.1`, recusa `Host` e `Origin` externos (proteção contra DNS
  rebinding) e só executa alvos que existem na lista de testes do projeto.

## Versões do framework de desenvolvimento (legado)

Até a 0.3.2, o Pudim era um framework de desenvolvimento guiado por especificação para
Claude Code e Copilot. O código está no branch `legado/framework-dev`.

## [0.3.2] - 2026-04-30

### Adicionado
- Arquivo central de versão (`pudim/VERSION`), exibido no wizard de setup e no instalador de hooks.
- Rodapé de versão `Pudim-Spec` nos templates de SPEC, TASKS e VALIDATION.

### Alterado
- Fluxo de release: a versão nova é declarada no momento da publicação (commit + envio), não a
  cada commit intermediário.

[Não lançado]: https://github.com/vieiraes/pudim/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/vieiraes/pudim/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/vieiraes/pudim/releases/tag/v0.3.2
