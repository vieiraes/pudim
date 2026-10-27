# Pudim

<p align="center">
   <img src="assets/pudim-icon.svg" width="120" alt="Pudim" />
</p>

<p align="center">
  <strong>Feito por QA, para QA.</strong><br/>
  O primeiro plugin especialista para QA e SDET em português do Brasil.
</p>

<p align="center">
  Plugin para Claude Code que testa um projeto JavaScript/TypeScript que já existe e usa Jest ou
  Vitest (e Playwright para E2E): mede a cobertura com números exatos, cria testes unitários e E2E
  quando você pede, investiga falhas até a causa raiz, roda os E2E num portal no seu navegador,
  recusa teste que não testa nada, prova que o código do produto não mudou e entrega o relatório
  de qualidade.
</p>

<p align="center">
  📖 <a href="https://pudim-spec.web.app/docs.html"><strong>Documentação completa</strong></a>
  &nbsp;·&nbsp; <a href="https://pudim-spec.web.app">Site</a>
</p>

## Para quem é

QA e SDET que recebem um produto já em desenvolvimento e precisam testar: pegar uma branch,
entender o que tem teste, criar o que falta e mostrar o resultado com números.

O Pudim **não cria sistema** e **não mexe no código do produto**. Ele só cria testes quando você
pede e guarda medições e relatórios na pasta `.qa/` do projeto testado.

## Comandos

Todos os comandos usam o prefixo `/qa:`. Pudim é o nome do produto; `qa` é o nome do plugin.

| Comando | O que faz | Situação |
|---|---|---|
| `/qa:inicio` | Diagnóstico de entrada: ferramentas, rotas com e sem E2E, o que mais muda sem cobertura, histórico em `.qa/`, e os 3 próximos passos | ✅ pronto |
| `/qa:cobertura [pasta]` | Mede a cobertura dos testes unitários e explica o que falta, comparando com a medição anterior | ✅ pronto |
| `/qa:risco [dias]` | Cruza o que mais mudou no git com o que tem menos cobertura e lista os arquivos de maior risco: "por onde começo?" | ✅ pronto |
| `/qa:investigar <teste ou bug>` | Investiga um teste que falha ou um bug relatado com análise socrática, até a causa raiz, e diz se é bug no produto, no teste, instabilidade, ambiente ou dados | ✅ pronto |
| `/qa:evidencia <bug>` | Junta numa pasta só o que entregar ao dev: relato da investigação, teste que reproduz, screenshot e trace, histórico do arquivo no git e um `pacote.md` pronto para o card | ✅ pronto |
| `/qa:instavel` | Aponta os testes E2E que ora passam, ora falham (e os que sempre falham) a partir do histórico, sem rodar nada; mostra o tempo da suíte | ✅ pronto |
| `/qa:portal [parar]` | Abre no navegador um portal local (localhost) que lista os testes E2E do Playwright, roda cada um com um clique, mostra o log ao vivo e o resultado com números exatos | ✅ pronto |
| `/qa:criar-unitario [alvo]` | Cria testes unitários (Jest ou Vitest) para o que está descoberto, recusa teste falso e mostra a cobertura antes e depois | ✅ pronto |
| `/qa:criar-e2e [fluxo]` | Cria testes E2E com Playwright só para a área que mudou (e as vizinhas), roda uma vez só essa área e mostra quantas rotas do app têm teste antes e depois | ✅ pronto |
| `/qa:relatorio [jira]` | Junta tudo em um relatório visual (HTML), Markdown e comentário para o Jira, com status CONFORME ESPERADO, NECESSITA ATENÇÃO ou BLOQUEADO | ✅ pronto |

Exemplo real de resposta do `/qa:cobertura`, em um projeto de pagamentos com Jest:

```
Cobertura de testes unitários: 35,71% das linhas (branches 26,31%, funções 33,33%)
Comparado com a referência: primeira medição, virou a referência
Testes: 2 passaram, 0 falharam
Arquivos: 2 no total, 0 com 100%, 1 sem nenhum teste

O que mais precisa de teste:
  src/pagamentos/estorno.js     0% das linhas
  src/pagamentos/taxa.js        83,33% das linhas
```

Exemplo real do `/qa:criar-unitario --sim` no mesmo projeto (o arquivo de produto não mudou;
o teste que já falhava por causa de um bug no boleto continuou falhando, sem "ajuste" da expectativa):

```
Testes unitários criados ✅

Cobertura de linhas do projeto: 35,71% → 100%
  src/pagamentos/estorno.js   0,00% → 100%
  src/pagamentos/taxa.js      83,33% → 100%

Testes criados: 10 em 2 arquivos, 10 de 10 passaram
Filtro de teste falso: 0 recusados de 10
```

E do `/qa:criar-e2e --sim` numa loja de exemplo (v0.4.0, quando cada teste ainda rodava 3 vezes):

```
Rotas com teste E2E: 1 de 4 → 3 de 4
Testes criados: 4 em 2 arquivos, cada um rodado 3 vezes: 12 de 12 execuções passaram
Filtro de teste falso: 0 recusados de 4
```

### Visual no terminal

Todo comando fecha a resposta com um painel do `scripts/painel.mjs`: barras de progresso,
setas de subida e descida, selo de status e listas em árvore, nas cores do pudim (caramelo,
âmbar e ouro). O painel é desenhado a partir do que está em `.qa/`, então nenhuma barra ou
número é digitado à mão. Saída do painel sobre a fixture de testes que reproduz o projeto de
pagamentos acima:

```text
🍮 Pudim · cobertura  loja-bloqueada · main
────────────────────────────────────────────────────────
 Linhas     ███████░░░░░░░░░░░░░    35,71%
 Branches   █████░░░░░░░░░░░░░░░    26,31%
 Funções    ███████░░░░░░░░░░░░░    33,33%
────────────────────────────────────────────────────────
 📊 2 arquivos · 0 com 100% · 1 sem nenhum teste
 ● Primeira medição: virou a referência

 📂 O que mais precisa de teste
 ├─ src/pagamentos/estorno.js  ░░░░░░░░░░  0,00%
 └─ src/pagamentos/taxa.js     ████████░░  83,33%
```

Os scripts também saem nesse formato quando rodam direto no terminal, com cor de verdade
(truecolor ou 256 cores). Fora de terminal a cor some sozinha; `NO_COLOR=1` desliga e
`FORCE_COLOR=1|2|3` força. O `repetir-teste.sh` mostra uma barra de progresso a cada execução.

### E2E só da área que mudou

O `/qa:criar-e2e` e o portal não rodam a suíte E2E inteira a cada mudança. O
`scripts/e2e-afetados.mjs` lê o que mudou no git (desde a `main`, mais o que não foi commitado)
e escolhe os specs ligados a essas mudanças, cada um com o motivo:

| Motivo | Quando entra |
|---|---|
| `spec` | o próprio spec mudou |
| `helper` | mudou um page object ou fixture que o spec importa |
| `rota` | o arquivo alterado chega a uma tela pelos imports (inclusive `@/` do `tsconfig`) ou é um layout acima dela, e o spec visita essa tela |
| `nome` | a pasta alterada tem o mesmo nome do spec (`pix-out`, `pixOut` e `pix_out` são o mesmo nome) |
| `mapa` | o `.qa/areas.json` liga a área a vizinhas de negócio |

Exemplo num internet banking: mexer num enum do pix-out roda `pix-out.spec.ts` e
`saldo.spec.ts` (vizinha no mapa); `onboarding.spec.ts` fica de fora.

O mapa é proposto pelo Pudim na primeira vez (`--sugerir-mapa`) e só é gravado com o seu ok:

```json
{ "areas": {
    "pix-out": { "arquivos": ["src/**/pix-out/**"], "specs": ["e2e/pix-out*.spec.ts"], "vizinhos": ["saldo", "extrato"] },
    "saldo":   { "arquivos": ["src/**/saldo/**"],   "specs": ["e2e/saldo.spec.ts"] } } }
```

Mudança transversal (`package.json`, lockfile, `playwright.config`, `tsconfig`, `.env`,
middleware, layout raiz, arquivo de rotas, ou arquivo usado por mais da metade das telas): o Pudim
avisa o motivo e pergunta antes de rodar a suíte completa. A repetição 3 vezes
(`--repeat-each=3`) fica só para quando você pedir prova de estabilidade.

### O que o relatório considera

- **Parcial**: quando a última execução E2E foi seletiva (só a área que mudou), o status vem
  marcado como parcial. CONFORME ESPERADO (parcial) não quer dizer "a suíte passou".
- **Testes unitários vermelhos bloqueiam**: o `/qa:cobertura` grava o resultado do runner e
  qualquer falha vira BLOQUEADO.
- **`.qa/config.json`**: `{ "ignorar": ["**/*.stories.*", "src/types/**"], "bloqueiaDias": 7 }`
  tira arquivos das contagens e muda por quantos dias uma investigação "Bug no produto" bloqueia.
- **`Resolvido: sim`** numa investigação em `.qa/investigacoes/` tira o bloqueio dela.
- **Produto intacto**: os comandos de criação tiram uma foto (hash) dos arquivos de produto antes
  e comparam depois (`scripts/produto-intacto.mjs`). Produto alterado nunca é entregue.

### O que o QA entrega ao dev

Quando algo quebra, o Pudim não entrega "deu erro": entrega evidência.

- O `/qa:investigar` só conclui "Bug no produto" com evidência (comando rodado, arquivo e
  linha, commit) e com a fonte da expectativa. O relato final traz título, onde, passos, esperado
  × obtido, frequência contada ("falhou em 5 de 5"), **commit suspeito** e o **trecho** do código
  em volta da causa, vindos de `git blame`.
- Os comandos de criação não "ajustam" um teste que falha 3 de 3 contra o requisito: guardam o
  teste como falha esperada em `bugs/` e registram o caso em `possiveis-bugs.md`.
- O `/qa:evidencia <bug>` junta tudo isso numa pasta só, `.qa/evidencias/<data>-<bug>/`:
  relato, teste que reproduz (com o comando para rodar), screenshot e trace do Playwright,
  histórico do arquivo no git e um `pacote.md` pronto para colar no card.

### Relatório de qualidade

O `/qa:relatorio` lê tudo que os outros comandos guardaram em `.qa/` e gera uma página HTML
que abre sozinha no navegador (também pelo botão "📊 Relatório" do portal), um Markdown e um
comentário pronto para o Jira. O status segue regras fixas:

| Status | Quando |
|---|---|
| ⛔ BLOQUEADO | a última execução E2E falhou, ou há investigação com Bug no produto nos últimos 14 dias |
| ⚠️ NECESSITA ATENÇÃO | a cobertura caiu, há teste instável, arquivo sem nenhum teste, teste recusado pelo filtro ou possível bug encontrado ao criar testes |
| ✅ CONFORME ESPERADO | nenhum dos casos acima |

<p align="center">
  <img src="assets/relatorio.png" width="720" alt="Relatório de qualidade do Pudim: status BLOQUEADO por um bug no produto, cobertura 35,71% → 100,00%, 10 de 10 testes passaram, 0 de 10 recusados pelo filtro, tendência e investigações" />
</p>

### Portal de testes

O `/qa:portal` sobe um portal self-service em `http://127.0.0.1:4455`. Quem não usa terminal
(outro QA, o PO, o suporte) também consegue rodar os testes E2E e ver o resultado:

- todos os testes Playwright do projeto, por arquivo, com o resultado da última vez;
- **Rodar afetados**: só os testes ligados ao que mudou no git, com o motivo de cada um e aviso quando a mudança é transversal;
- **Só os que falharam**: roda de novo só os testes que falharam ou ficaram instáveis na última execução;
- **Executar** um teste, um arquivo ou todos; **Parar** quando quiser; "Ver o navegador" para assistir;
- log ao vivo com cores e, ao final, "falhou em X de N" com o erro e o comando para abrir o trace;
- histórico salvo em `.qa/portal/`. O portal só aceita acesso da própria máquina.

<p align="center">
  <img src="assets/portal.png" width="820" alt="Portal de testes do Pudim: lista de testes à esquerda, log ao vivo e resultado 'Falhou em 1 de 5 (20,00%)'" />
</p>

## Guia dos comandos

[`docs/COMANDOS.md`](docs/COMANDOS.md) descreve cada comando: o que faz, quando usar, o que acontece
passo a passo, o que esperar na resposta, o que fica gravado em `.qa/` e os limites.

## Projeto de exemplo

[`exemplos/banco-digital/`](exemplos/banco-digital/) é um internet banking fictício (Vite + React
Router + Vitest + Playwright) feito para validar o Pudim sem encostar em projeto de verdade. Tem
telas sem teste E2E, arquivos sem teste unitário, `.qa/areas.json` com vizinhos de negócio e um
bug proposital em `src/lib/pix/limite.ts`. Toda mudança no Pudim é validada ali primeiro.

## Instalação

No Claude Code:

```
/plugin marketplace add vieiraes/pudim
/plugin install qa@pudim
```

Depois, dentro do projeto que você quer testar, digite `/qa:cobertura`.

Requisitos: projeto JavaScript/TypeScript com Jest ou Vitest (Playwright para E2E e para o portal), Node 18+.

## O que tem de diferente

- **Número vem de script, não da IA.** Toda porcentagem é lida dos relatórios do Jest, Vitest e
  Playwright por scripts sem dependências, versionados neste repositório.
- **O que não tem teste aparece.** A medição sempre inclui todos os arquivos de código, não só os
  que algum teste importa; o arquivo esquecido vai para o topo da lista.
- **Teste falso não conta.** O `scripts/test-quality.mjs` recusa teste sem `expect`, só com
  `toBeTruthy`/`toBeDefined`, só snapshot, pulado, com `only` ou com mock do próprio módulo
  testado. (Limite: verificação escondida num Page Object de outro arquivo não é vista; nos
  testes que o Pudim cria, o `expect` fica sempre no corpo do teste.)
- **Bug não vira teste "ajustado".** Quando o produto contraria o que a função deveria fazer, o
  teste não entra: o caso vai para `possiveis-bugs.md` e para o `/qa:investigar`.
- **Investigação com análise socrática.** Todo problema é investigado com perguntas, cinco
  porquês e evidência exata ("falhou em 7 de 10 execuções", nunca "às vezes"), separando o que
  foi provado do que ainda é hipótese. O método está em [docs/analise-socratica.md](docs/analise-socratica.md).
- **Em português, para QA.** As respostas explicam o que o número quer dizer para o produto.

## Versões e roadmap

Versão atual: **0.5.1**. O que mudou em cada versão está no [CHANGELOG.md](CHANGELOG.md); o que vem
a seguir, no [ROADMAP.md](ROADMAP.md).

## Por que Pudim?

Porque, se fizer certinho, todo mundo gosta. 🍮

## Quem criou

<img src="https://avatars.githubusercontent.com/u/5919134?v=4" width="96" align="left" alt="Foto de Bruno Vieira" style="border-radius:50%;margin-right:16px" />

**Bruno Vieira**, QA Engineer Sênior e SDET.
[LinkedIn](https://www.linkedin.com/in/bruno-vieira) · [GitHub](https://github.com/vieiraes)

Sou QA. São 9 anos no mercado financeiro, mais de 4 deles em qualidade de software, especializado
em meios de pagamento: Pix (SPI e DICT), boletos, pagamentos em lote, Open Finance e BaaS. Comecei
coordenando rollout e migração de tecnologia em bancos, corretoras e seguradoras, em ambientes
críticos de mesas de operações. Passei por operações e por Product Owner de produtos de pagamento,
e hoje construo automação E2E com Playwright e TypeScript e testes de carga com K6. Pós-graduado em
Engenharia da Qualidade de Software.

Testar pagamento ensina uma coisa: um centavo errado vira incidente. Por isso o Pudim não aceita
"acho que passou".

Criei o Pudim para quem trabalha como eu. QA e SDET precisam de ferramentas que garantam a
qualidade do trabalho, não só que acelerem. O Pudim é o meu jeito de trabalhar transformado em
plugin: investigar com análise socrática, provar com número exato, acompanhar a execução num
portal local e entregar relatório visual.

Criação, design e desenvolvimento: Bruno Vieira.

<br clear="left"/>

### História do projeto

Até a versão 0.3.2, o Pudim era um framework de desenvolvimento guiado por especificação
(SPEC → TASKS → BUILD → VALIDATION) para quem usa Claude Code e Copilot. Em outubro de 2026 ele
virou um framework para QA. A versão anterior continua no histórico do repositório.

<p align="center">
  Feito por Bruno Vieira, QA para QA &nbsp;·&nbsp; PT-BR &nbsp;·&nbsp; Licença MIT
</p>
