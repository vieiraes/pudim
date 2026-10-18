# Roadmap do Pudim

Legenda: `[x]` feito e testado · `[ ]` a fazer

## v0.1 — Medir

- [x] `scripts/qa-detect.sh`: descobre Jest/Vitest/Playwright, gerenciador, provider, paths TS, monorepo
- [x] `scripts/coverage-diff.mjs`: compara cobertura com a referência, arquivo a arquivo, e lista os menos cobertos
- [x] `scripts/test.sh`: testes dos scripts com fixtures
- [x] `/cobertura`: mede, compara com a referência e explica em português simples
- [x] Testar o `/cobertura` em projeto real com Jest (demo de pagamentos: 35,71% das linhas, arquivo sem teste listado em primeiro; rodado via `claude -p "/pudim:cobertura" --plugin-dir .`)
- [ ] Testar o `/cobertura` em projeto real com Vitest

## v0.1.1 — Investigar com análise socrática

- [x] `docs/analise-socratica.md`: método de investigação com evidência exata (fato, perguntas, cinco porquês, classificação, consequências, conclusão)
- [x] `scripts/repetir-teste.sh`: repete um teste N vezes e conta exatamente quantas passaram (sempre falha × instável)
- [x] `/pudim:investigar`: troubleshooting de teste que falha ou bug relatado até a causa raiz; gera relato de bug para o time
- [x] `/pudim:cobertura` aplica o método quando algo não bate e encaminha para `/pudim:investigar`

## v0.2 — Criar testes unitários

- [ ] `scripts/test-quality.mjs`: recusa teste falso (sem `expect`, só `toBeTruthy`/`toBeDefined`, snapshot-only, `skip`/`only`, mock do próprio alvo)
- [ ] `/criar-unitario [alvo]`: escolhe o que está descoberto, mostra plano curto, gera, roda, filtra teste falso, mede antes/depois
- [ ] Oferecer configuração mínima de Jest/Vitest quando o projeto não tem (sempre perguntando)

## v0.3 — Criar testes E2E

- [ ] `scripts/e2e-results.mjs`: lê o `results.json` do Playwright (passou, falhou, instável, pulado)
- [ ] Cobertura de fluxos: rotas/telas do app × rotas com teste E2E
- [ ] `/criar-e2e [fluxo ou URL]`: descobre telas, propõe cenários Dado/Quando/Então, gera com Playwright, roda, guarda evidência (trace, screenshot)
- [ ] Cobertura de código pelo E2E (opcional, Chromium)

## v0.4 — Relatório

- [ ] `/relatorio`: junta as execuções de `.qa/execucoes/` em Markdown (`.qa/relatorios/`)
- [ ] Versão HTML visual
- [ ] Comentário de evidência para Jira (CONFORME ESPERADO / NECESSITA ATENÇÃO / BLOQUEADO)

## Ideias para depois da v0.4

- [ ] `/pudim:testar-branch`: cria testes só para o que mudou na branch em relação à `main` (o cenário "peguei uma branch, testa o que mudou")
- [ ] `/pudim:instavel`: roda a suíte várias vezes e aponta testes que às vezes passam e às vezes falham
- [ ] `/pudim:risco`: cruza arquivos que mais mudam no git com os de menor cobertura para dizer onde testar primeiro

## Depois

- [ ] Mutation testing opcional (Stryker) como prova de que o teste pega bug
- [ ] Suporte ao GitHub Copilot pelo mesmo formato de skills
- [ ] Dogfood público: aplicar em um projeto open source e mostrar o antes/depois no README
