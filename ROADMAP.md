# Roadmap do Pudim

Legenda: `[x]` feito e testado · `[ ]` a fazer

As etapas 1 a 6 foram entregues juntas na **v0.4.0** (ver [CHANGELOG.md](CHANGELOG.md)).

## Etapa 1 — Medir

- [x] `scripts/qa-detect.sh`: descobre Jest/Vitest/Playwright, gerenciador, provider, paths TS, monorepo
- [x] `scripts/coverage-diff.mjs`: compara cobertura com a referência, arquivo a arquivo, e lista os menos cobertos
- [x] `scripts/test.sh`: testes dos scripts com fixtures
- [x] `/cobertura`: mede, compara com a referência e explica em português simples
- [x] Testar o `/cobertura` em projeto real com Jest (demo de pagamentos: 35,71% das linhas, arquivo sem teste listado em primeiro; rodado via `claude -p "/pudim:cobertura" --plugin-dir .`)
- [ ] Testar o `/cobertura` em projeto real com Vitest

## Etapa 2 — Investigar com análise socrática

- [x] `docs/analise-socratica.md`: método de investigação com evidência exata (fato, perguntas, cinco porquês, classificação, consequências, conclusão)
- [x] `scripts/repetir-teste.sh`: repete um teste N vezes e conta exatamente quantas passaram (sempre falha × instável)
- [x] `/pudim:investigar`: troubleshooting de teste que falha ou bug relatado até a causa raiz; gera relato de bug para o time
- [x] `/pudim:cobertura` aplica o método quando algo não bate e encaminha para `/pudim:investigar`

## Etapa 3 — Portal de testes E2E

- [x] `scripts/portal/playwright-report.mjs`: lê o JSON do Playwright (lista e execução) e conta exatamente passou, falhou, instável, pulado e não rodou
- [x] `scripts/portal/server.mjs`: portal em localhost (Node puro), lista os testes, executa por teste/arquivo/todos, para, log ao vivo (SSE), histórico em `.qa/portal/`; só aceita 127.0.0.1/localhost
- [x] Tela do portal: lateral com status por teste, Executar/Parar, "Ver o navegador", log com cores, "falhou em X de N", trace e histórico
- [x] `/pudim:portal [parar | status]`: sobe, informa a URL e desliga (rodado via `claude -p "/pudim:portal"` em projeto com Playwright 1.58)
- [ ] Rodar mais de uma execução ao mesmo tempo (fila)

## Etapa 4 — Criar testes unitários

- [x] `scripts/test-quality.mjs`: recusa teste falso (sem `expect`, só `toBeTruthy`/`toBeDefined`, snapshot-only, `skip`/`only`, mock do próprio alvo); conferido em 129 specs reais de Playwright (12 apontados, todos de verificação em Page Object de outro arquivo)
- [x] `qa-detect.sh` descobre o estilo dos testes (`testStyle`, `testExample`, `testExt`, `moduleType`, `vitestGlobals`) e do E2E (`e2eDir`, `e2eExample`, `baseURL`, `webServer`)
- [x] `/pudim:criar-unitario [alvo]`: escolhe o que está descoberto, mostra plano curto, gera, roda, filtra teste falso, mede antes/depois; possível bug vai para `possiveis-bugs.md` (rodado via `claude -p` no demo de pagamentos: 35,71% → 100%, 10 de 10, produto intacto por md5)
- [x] Oferecer configuração mínima de Jest/Vitest quando o projeto não tem (só com "sim" explícito)

## Etapa 5 — Criar testes E2E

- [x] Leitura do resultado do Playwright (passou, falhou, instável, pulado): feita no `scripts/portal/playwright-report.mjs`
- [x] `scripts/e2e-rotas.mjs`: rotas do app (Next.js app/pages, SvelteKit, React Router, Vue Router) × rotas que algum teste visita com `page.goto`
- [x] `/pudim:criar-e2e [fluxo ou URL]`: descobre telas, propõe cenários Dado/Quando/Então, gera com Playwright, roda 3 vezes (`--repeat-each=3`), filtra teste falso, mede rotas antes/depois (rodado via `claude -p` numa loja de exemplo: rotas 1 de 4 → 3 de 4, 12 de 12 execuções)
- [x] `scripts/e2e-afetados.mjs`: specs afetados pelo git diff (imports, rotas, nome da pasta e mapa de áreas `.qa/areas.json` com vizinhos de negócio), aviso de mudança transversal; o `/pudim:criar-e2e` roda só a área, uma vez (`--repeat-each=3` só sob pedido), e o portal ganhou "Rodar afetados"
- [ ] Cobertura de código pelo E2E (opcional, Chromium)

## Etapa 6 — Relatório

- [x] `scripts/relatorio.mjs` + `/pudim:relatorio`: junta `.qa/` (cobertura, criação de testes, portal, investigações) em Markdown (`.qa/relatorios/`)
- [x] Versão HTML visual, clara e escura, pronta para imprimir; abre também pelo botão "📊 Relatório" do portal
- [x] Comentário de evidência para Jira (CONFORME ESPERADO / NECESSITA ATENÇÃO / BLOQUEADO)
- [ ] Adaptar ao formato de relatório visual que o autor usa no dia a dia (prints anotados por passo)

## Revisão de 23/10/2026 (segurança, desempenho, produto)

- [x] Ver `docs/REVISAO-2026-10-23.md`: 13 achados de segurança, 20 de desempenho/correção e 18 de produto/skills, com o estado de cada um
- [x] `scripts/nova-execucao.mjs` (pasta da execução com hora real) e `--out` em todos os scripts: a skill não transcreve JSON
- [x] `scripts/produto-intacto.mjs`: foto dos arquivos de produto antes e depois; o painel mostra "produto intacto"
- [x] `exemplos/banco-digital/`: projeto fictício para validar o Pudim (nunca em projeto real)
- [x] Relatório: status parcial (E2E seletiva), testes unitários vermelhos bloqueiam, `.qa/config.json`, `Resolvido: sim`
- [x] `qa-detect` reconhece Mocha, node:test, Bun, Deno, AVA, Jasmine e Cypress e as skills recusam com elegância em vez de oferecer instalar outra ferramenta
- [x] `/pudim:risco`, `/pudim:instavel` (pelo histórico) e `/pudim:inicio`; lint + `tsc` nos testes gerados; "só os que falharam" no portal; status por projeto do Playwright; possíveis bugs com `Resolvido: sim`
- [ ] Pendentes da revisão: token do portal para máquina compartilhada, `playwright --list` assíncrono, índice do histórico, "medido com" no painel de cobertura, release

## Visual

- [x] `scripts/ui.mjs` + `scripts/painel.mjs`: painel com barras, setas, selos e árvore nas cores do pudim, desenhado a partir de `.qa/`; todos os comandos fecham a resposta com ele e os scripts saem no mesmo formato no terminal

## Ideias para as próximas versões

- [ ] `/pudim:testar-branch`: cria testes só para o que mudou na branch em relação à `main` (o cenário "peguei uma branch, testa o que mudou"). Parte E2E já feita pelo `e2e-afetados.mjs`; falta o lado unitário com *diff coverage*
- [x] `/pudim:instavel`: pelo histórico do portal e do criar-e2e (repetir a suíte fica sob pedido, via `repetir-teste.sh`)
- [x] `/pudim:risco`: arquivos que mais mudam no git × menor cobertura

## Depois

- [ ] Mutation testing opcional (Stryker) como prova de que o teste pega bug
- [ ] Suporte ao GitHub Copilot pelo mesmo formato de skills
- [ ] Dogfood público: aplicar em um projeto open source e mostrar o antes/depois no README
