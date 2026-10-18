# CLAUDE.md — desenvolvimento do Pudim

Este repositório é o **plugin** Pudim para Claude Code. Ele não é instalado como pasta dentro
de outro projeto: o usuário instala o plugin e chama os comandos no projeto que quer testar.

## O produto

- Público: QA e SDET. Linguagem dos comandos e das respostas: português simples, sem jargão.
- Entra em projeto JS/TS **que já existe** e nunca altera código de produto. Só cria testes
  (quando pedido) e escreve na pasta `.qa/` do projeto.
- Comandos sob demanda, sem ordem obrigatória: `/pudim:cobertura`, `/pudim:investigar`,
  `/pudim:portal`, `/pudim:criar-unitario`, `/pudim:criar-e2e` e `/pudim:relatorio` (ver ROADMAP.md).
- Os comandos de criação guardam a saída bruta das ferramentas em `.qa/execucoes/`; o
  `scripts/relatorio.mjs` calcula tudo a partir dela.
- Toda investigação (bug, teste falhando, número que não bate) segue `docs/analise-socratica.md`:
  evidência × hipótese, números e contagens exatos, causa raiz sem culpados.
- Regra inegociável: todo número que o plugin mostra vem de script (`scripts/`), nunca de
  estimativa da IA. Teste sem verificação real (sem `expect`, só `toBeTruthy`, `skip`, mock do
  próprio alvo) não conta.

## Estrutura

- `.claude-plugin/plugin.json` e `marketplace.json` — manifesto e instalação.
- `skills/<comando>/SKILL.md` — um por comando; scripts referenciados por `${CLAUDE_PLUGIN_ROOT}`.
- `scripts/` — Node puro e bash, **zero dependências** (o portal fica em `scripts/portal/`, com a tela em `public/`); cada script tem teste em `scripts/test.sh`
  com fixtures em `scripts/__tests__/fixtures/`.

## Regras de trabalho

- Antes de dizer que algo funciona: `bash scripts/test.sh` e `claude plugin validate .`.
- Toda mudança de comportamento atualiza README.md e ROADMAP.md.
- **Nunca commitar ou fazer push sem pedido explícito.**
- Release (quando pedido): versão em `.claude-plugin/plugin.json`, entrada no `CHANGELOG.md`, seção
  "Versões" da documentação (`pudim-landingpage/public/docs.html#versoes`), tag `vX.Y.Z` e release
  no GitHub.
- Nomes de variáveis em inglês; textos, comentários e docs em PT-BR.

## Histórico

- Até a v0.3.2 o Pudim era um framework de SDD para desenvolvedores. Esse código está no branch
  local `legado/framework-dev` e no histórico do git. Não reintroduzir board/SPEC/CONST no plugin.
