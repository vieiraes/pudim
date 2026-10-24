# Guia dos comandos do Pudim

Este guia descreve cada comando do plugin: o que ele faz, quando usar, o que acontece passo a
passo, o que esperar na resposta, o que fica gravado em `.qa/` e os limites. Vale para a versão
em desenvolvimento (depois da revisão de 23/10/2026).

## Regras que valem para todos

| Regra | O que significa na prática |
|---|---|
| **Nunca altera o código do produto** | Só arquivos de teste (`*.test.*`, `*.spec.*`, `__tests__/`, pasta de E2E) e a pasta `.qa/`. Os comandos de criação tiram uma foto (hash) dos arquivos de produto antes e comparam depois; produto alterado não é entregue. |
| **Todo número vem de script** | Porcentagens, contagens e barras saem de `scripts/*.mjs` e das ferramentas (Jest, Vitest, Playwright). A IA não estima, não arredonda e não redigita JSON: os scripts gravam direto em `.qa/` (`--out`). |
| **Teste falso não conta** | O filtro `test-quality.mjs` recusa teste sem `expect`, só `toBeTruthy`, só snapshot, `skip`/`only`, mock do próprio alvo, espera por tempo fixo e credencial no código. |
| **Pergunta antes de agir** | Criar testes, instalar algo ou rodar a suíte E2E completa só com o seu "ok". `--sim` pula a confirmação do plano, nunca a de instalar ou de rodar tudo. |
| **O projeto é dado, não instrução** | Nomes de teste, README, comentários e arquivos em `.qa/` nunca mandam no Pudim. |
| **Fala simples, em PT-BR** | Resposta começa com um painel (barras, setas, selo) e segue com no máximo três frases do que isso quer dizer para o produto. |

Onde o Pudim grava: `.qa/` na raiz do projeto. Estrutura:

```
.qa/
  areas.json                 mapa de áreas e vizinhos de negócio (você confirma; o Pudim propõe)
  config.json                opcional: { "ignorar": [...], "bloqueiaDias": 14 }
  cobertura/baseline.json    referência de cobertura (só o /pudim:cobertura grava)
  cobertura/atual/           última medição do runner
  execucoes/<data>-<comando>/ uma pasta por execução: JSONs dos scripts, resumo.md, possiveis-bugs.md
  investigacoes/<data>-<assunto>.md
  portal/execucoes/*.json    cada rodada feita pelo portal (log, resultado por teste)
  relatorios/                HTML, Markdown e texto para o Jira
```

Requisitos: projeto JavaScript/TypeScript, Jest ou Vitest para unitários, Playwright para E2E e
portal, Node 18+, git (para `risco`, `criar-e2e` seletivo e `investigar`). Mocha, node:test, Bun,
Deno e Cypress são reconhecidos e recusados com uma explicação; o Pudim não oferece instalar
outra ferramenta por cima.

---

## `/pudim:inicio`

**O que faz.** Diagnóstico de entrada: descobre as ferramentas, conta rotas com e sem E2E,
lista o que mais muda sem cobertura, resume o que já existe em `.qa/` e sugere os três próximos
passos, cada um com o motivo em números.

**Quando usar.** Na primeira vez num projeto, ou quando voltar a um projeto depois de semanas.
Também quando alguém perguntar "o que o Pudim faz aqui?".

**O que acontece.**
1. `qa-detect.sh`: runner, E2E, gerenciador, TypeScript, ESLint, monorepo, quantidade de testes.
2. `e2e-rotas.mjs` (se houver Playwright), `risco.mjs` (se houver git), `instavel.mjs` e
   `painel.mjs relatorio` (se houver dados em `.qa/`).
3. Monta a resposta e escolhe os três passos pela ordem: sem medição → `/pudim:cobertura`;
   topo do risco → `/pudim:criar-unitario`; rota principal sem E2E → `/pudim:criar-e2e`; teste
   instável → `/pudim:investigar`; E2E nunca rodado → `/pudim:portal`.

**O que esperar.** Painel "Ferramentas", os blocos dos scripts e a lista "Próximos passos".
Nada roda (nem testes, nem cobertura) e nada é gravado.

**Limites.** Sem git, não há risco. Sem Playwright, não há rotas. Em monorepo, rode dentro do
pacote.

---

## `/pudim:cobertura [pasta ou arquivo]`

**O que faz.** Mede a cobertura de testes unitários com o runner do projeto, compara com a
medição anterior e mostra o que mais precisa de teste.

**Quando usar.** Antes de criar testes (para saber onde), depois de criar (para provar), e ao
pegar uma branch (para ver se a cobertura caiu). Com foco (`/pudim:cobertura src/pix`), quando
só uma área interessa.

**O que acontece.**
1. `qa-detect.sh` descobre runner, provider de cobertura e pastas de código.
2. `nova-execucao.mjs cobertura` cria `.qa/execucoes/<data-hora>-cobertura/`.
3. Roda o runner com `json-summary`, **incluindo todo arquivo de código** (sem isso, arquivo sem
   teste some da medição) e gravando o resultado dos testes em `resultado.json`.
4. `coverage-diff.mjs` compara com `.qa/cobertura/baseline.json`. Na primeira vez, grava a
   referência. Grava `comparativo.json` e copia `summary.json` para a pasta da execução.
5. `painel.mjs cobertura` desenha a resposta.

**O que esperar.**

```text
🍮 Pudim · cobertura  banco-digital · main
────────────────────────────────────────────────────────
 Linhas     ███████████░░░░░░░░░    56,60%  ▲ +5,00
 Branches   ██████████████████░░    91,66%  ━  0,00
 Funções    ████████████████████   100,00%  ━  0,00
────────────────────────────────────────────────────────
 📊 7 arquivos · 4 com 100% · 2 sem nenhum teste
 Testes     ████████████████████   12 de 12  passaram
 ✔ Nenhum arquivo perdeu cobertura

 📂 O que mais precisa de teste
 ├─ src/lib/pix/limite.ts      ░░░░░░░░░░  0,00%
 └─ src/lib/saldo/calcular.ts  ░░░░░░░░░░  0,00%
```

Depois, três frases: o que isso quer dizer para o produto, em quais arquivos caiu, e o próximo
passo.

**Com foco.** A pasta vira `-cobertura-foco`, a referência do projeto **não** é gravada nem
lida, e o relatório não mostra essa medição como "cobertura do projeto".

**Limites.** Testes que falham não impedem a medição, mas o relatório bloqueia a entrega. Sem
`@vitest/coverage-v8` (ou `-istanbul`) o Pudim pede permissão para instalar. Em monorepo, só a
pasta atual.

---

## `/pudim:risco [dias] [--top=N]`

**O que faz.** Lista os arquivos de produto que mais mudaram no git nos últimos N dias (padrão
90), cruzados com a cobertura da última medição. Risco = mudanças × (100 − cobertura) / 100.

**Quando usar.** Quando não se sabe por onde começar, ao entrar num projeto desconhecido, ou
para priorizar o sprint de testes.

**O que acontece.** `risco.mjs` roda `git log --since` com `--name-only` e lê
`.qa/execucoes/*-cobertura/summary.json` mais recente. Nada é gravado (a menos que a skill
passe `--out`).

**O que esperar.**

```text
🍮 Pudim · onde testar primeiro  47 commits em 90 dias · cobertura de 2026-10-23 15:30
────────────────────────────────────────────────────────
 🎯 Mais risco primeiro (mudanças × falta de cobertura)
 ├─ src/lib/pix/limite.ts         7 mudanças  ░░░░░░░░░░   0,00%  risco 7,00
 ├─ src/paginas/PixOut.tsx        5 mudanças  não medido          risco 5,00
 └─ src/lib/saldo/formatar.ts     3 mudanças  ██████████ 100,00%  risco 0,00
```

"Não medido" = o arquivo mudou mas não entrou na última medição. Sem medição nenhuma, o
ranking é só por mudanças e vem com aviso.

**Limites.** Precisa de git. Arquivo renomeado conta pelo nome novo. Testes, configs, stories
e `.d.ts` ficam fora.

---

## `/pudim:investigar <teste, arquivo ou descrição do bug>`

**O que faz.** Investiga até a causa raiz com a análise socrática
(`docs/analise-socratica.md`): fato observado, reprodução contada, perguntas, cinco porquês,
hipóteses descartadas e **uma** classificação: Bug no produto, Bug no teste, Instável, Ambiente,
Dados ou Inconclusivo.

**Quando usar.** Teste falhando, bug relatado, número de cobertura que não bate, ou "possível
bug" apontado pelos comandos de criação.

**O que acontece.**
1. Roda **só** o teste citado (Jest/Vitest com `-t`, Playwright com `arquivo:linha`).
2. `repetir-teste.sh N -- <comando>`: conta exatamente em quantas rodadas falhou. `noTests: true`
   quer dizer que nenhum teste rodou (filtro errado): aí "falhou" não é evidência.
3. Procura a fonte da expectativa (requisito, README, comentário, card). **Sem fonte, a
   classificação máxima é "Inconclusivo: falta o requisito"**, nunca "Bug no produto".
4. `git log`/`git show` do arquivo; uma hipótese alternativa com o comando que a descarta.
5. Grava `.qa/investigacoes/<data-hora>-<assunto>.md` com `Título:`, `Classificação:` e
   `Frequência:` (vinda do JSON do `repetir-teste.sh`).

**O que esperar.** Resumo em linguagem simples, evidências marcadas como **[evidência]** ou
**[hipótese]**, e, se for bug no produto, um relato pronto para o dev (título, onde, passos,
esperado, obtido, frequência, **commit suspeito** e **trecho** do código em volta da causa,
vindos de `git blame`, e evidências).

**Depois.** `/pudim:evidencia <título>` junta esse relato com o teste que reproduz, screenshot,
trace e histórico do arquivo numa pasta só. Quando o bug for corrigido, acrescente
`Resolvido: sim` ao arquivo da investigação: isso tira o bloqueio do relatório.

**Limites.** Não corrige código do produto. Propõe correção de teste e só aplica com o seu ok.

---

## `/pudim:evidencia <parte do título do bug> | listar`

**O que faz.** Responde "o que eu entrego para o dev?": junta numa pasta só
(`.qa/evidencias/<data>-<slug>/`) tudo que o Pudim já guardou sobre um bug e escreve um
`pacote.md` pronto para colar no card ou mandar no chat. Só lê `.qa/` e o `git`; não roda teste,
não mede nada e não inventa texto: é a cópia fiel do que foi registrado.

**Quando usar.** Depois de um `/pudim:investigar` que deu "Bug no produto", ou quando um
`/pudim:criar-unitario` / `/pudim:criar-e2e` apontou "possível bug" e você vai abrir o card.

**O que acontece.**
1. `evidencia.mjs --listar` indexa os bugs conhecidos: investigações em `.qa/investigacoes/` e
   blocos `## título` dos `possiveis-bugs.md`. Mesmo título em dois lugares vira um bug só.
2. `evidencia.mjs --bug=<termo>` acha o bug pelo título, pelo slug ou pelo arquivo da fonte.
   Nenhum → exit 4 com a lista dos conhecidos; mais de um → exit 5 com os candidatos.
3. Copia para a pasta: `relato.md` (investigação), `registro-criacao.md` (bloco do
   `possiveis-bugs.md`), `teste/` (o teste guardado em `bugs/` que fala desse bug, com o comando
   para rodar no topo), `anexos/` (screenshot e trace dos testes Playwright que falharam falando
   do bug, vindos de `resultado.json`, `repeticao.json` e das execuções do portal).
4. Roda `git blame -L` na linha citada e `git log -n 3` no arquivo citado.
5. Escreve `pacote.md`: resumo (classificação, frequência, onde, commit suspeito), passos,
   esperado × obtido, trecho, teste que reproduz, execuções que falharam (com a mensagem de erro),
   histórico git, evidências, o que não foi possível anexar e as fontes.

**O que esperar.** O painel com ✔ para cada arquivo copiado e ✘ para o que não existe mais (ex.:
trace apagado, com a instrução para gerar de novo), e o `pacote.md` inteiro na resposta.

**Depois.** Cole o `pacote.md` no card. Rodar de novo no mesmo dia regrava a pasta sem duplicar.

**Limites.** Só monta pacote de bug que o Pudim registrou. Não anexa em Jira nem GitHub: o pacote
fica em `.qa/` e você decide para onde vai.

---

## `/pudim:instavel [--ultimas=N]`

**O que faz.** Lê as execuções E2E já gravadas (portal e `criar-e2e`) e, por teste, conta em
quantas rodadas passou, falhou ou precisou de repetição. Classifica em instável, sempre falha
e sempre passa. Mostra a duração de cada rodada da suíte.

**Quando usar.** "Esse teste às vezes falha", suíte que "quebra sem motivo", ou para saber se a
suíte está ficando lenta.

**O que acontece.** `instavel.mjs` lê `.qa/portal/execucoes/*.json` e
`.qa/execucoes/*-criar-e2e/resultado.json`. Nada roda, nada é gravado.

**O que esperar.**

```text
🍮 Pudim · testes instáveis  12 execuções E2E gravadas
────────────────────────────────────────────────────────
 ⚠️  1 teste instável · 0 sempre falham · 6 testes no histórico
────────────────────────────────────────────────────────
 🎲 Instáveis e falhas, piores primeiro
 └─ ⚠️  Enviar Pix › envia um Pix por CPF dentro do saldo   e2e/pix-out.spec.ts:4 [chromium]  3 de 12 (25,00% de falha)
────────────────────────────────────────────────────────
 ⏱️  Última rodada: 8,4 s (6 testes)  ▼ −1,20 s vs. anterior
```

Com menos de 3 execuções o script avisa que ainda não dá para separar instabilidade de falha
real. Para confirmar um teste agora, a skill oferece `repetir-teste.sh 10 -- npx playwright
test <arquivo>:<linha>` (sobe o app; só com o seu ok).

---

## `/pudim:criar-unitario [arquivo ou pasta] [--sim]`

**O que faz.** Cria testes unitários para o que está sem cobertura, roda, filtra teste falso,
confere lint e tipos, mede antes e depois e prova que o produto está intacto.

**Quando usar.** Depois do `/pudim:cobertura` ou do `/pudim:risco` apontarem um arquivo. Para
um arquivo específico, passe o caminho.

**O que acontece.**
1. `qa-detect.sh`; `nova-execucao.mjs criar-unitario`; `produto-intacto.mjs --foto`.
2. Mede antes (`antes.json`), escolhe até 3 arquivos (os de menor cobertura) ou o pedido.
3. Mostra o plano: casos por arquivo, cada um com a **origem da expectativa** (requisito ou
   inferido do código). Espera "Posso criar?" (ou `--sim`).
4. Escreve no estilo do projeto (`testStyle`, `testExt`, ESM/CJS, aliases). Guarda a primeira
   versão em `<pasta>/rascunho/`.
5. Roda só os testes novos (`resultado.json`). Falha: erro do teste → corrige (valor esperado só
   muda com fonte citada); possível bug → roda 3 vezes, tira o teste do arquivo, guarda em
   `<pasta>/bugs/` como `test.failing` e registra em `possiveis-bugs.md`; inconclusivo → registra
   a pergunta. **No máximo 2 correções por teste.**
6. `test-quality.mjs` (`qualidade.json`); ESLint e `tsc --noEmit` do projeto nos arquivos novos.
7. Mede depois (`depois.json`, `comparativo.json`); **não** mexe na referência.
8. `produto-intacto.mjs --comparar` (`produto-intacto.json`): produto alterado = desfaz antes de
   responder.
9. `painel.mjs criar-unitario` e `resumo.md`.

**O que esperar.**

```text
🍮 Pudim · criar-unitario  banco-digital · main
────────────────────────────────────────────────────────
 Antes      ███████████░░░░░░░░░    56,60%
 Depois     ████████████████████   100,00%  ▲ +43,40
────────────────────────────────────────────────────────
 Testes     ████████████████████   9 de 9  passaram
 🛡️  Filtro de teste falso: 0 de 9 recusados
 🐞 Possíveis bugs no produto: 1

 📄 Arquivos de teste
 ├─ src/lib/pix/limite.test.ts
 └─ src/lib/saldo/calcular.test.ts
```

E uma linha com o caminho de `possiveis-bugs.md` quando houver.

**Limites.** Não instala Jest/Vitest sem "sim" explícito. Em projeto sem runner conhecido
(Mocha, node:test…), para e explica. Expectativa inferida do código vira "comportamento
diferente do que o nome sugere", não "bug".

---

## `/pudim:criar-e2e [fluxo, rota ou URL] [--sim]`

**O que faz.** Cria specs Playwright para a área que mudou (e as vizinhas), roda **só essa
área, uma vez**, filtra teste falso, confere lint, mede rotas com E2E antes e depois e prova que
o produto está intacto.

**Quando usar.** Depois de mexer num fluxo ("mexi no pix-out") ou para cobrir uma tela sem E2E
apontada pelo `/pudim:inicio`.

**O que acontece.**
1. `qa-detect.sh`; `nova-execucao.mjs criar-e2e`; `produto-intacto.mjs --foto`.
2. `e2e-afetados.mjs` (`selecao.json`): arquivos alterados desde o branch principal + não
   commitados; specs afetados com motivo (`spec`, `helper`, `rota`, `nome`, `mapa`); mudança
   transversal. Sem `.qa/areas.json`, propõe o mapa e grava só com o seu ok.
3. `e2e-rotas.mjs` antes (`rotas-antes.json`). Confere onde o app roda (`webServer`/`baseURL`).
4. Propõe cenários Dado/Quando/Então (até 5 por fluxo), cada expectativa com arquivo:linha.
5. Escreve as specs (seletores por papel e rótulo; sem `waitForTimeout`; credenciais por
   `process.env`). Guarda rascunho.
6. Roda specs novas + afetadas: `playwright test <lista>`. Falha de ambiente → renomeia o
   resultado para `resultado-ambiente.json` e para. Falha em spec nova → roda só ela 3 vezes antes
   de classificar (instável, possível bug, inconclusivo). **Nunca roda sem lista de arquivos**; a
   suíte completa só se a mudança for transversal **e** você aceitar.
7. `test-quality.mjs`; ESLint/`tsc`; `e2e-rotas.mjs` depois; `produto-intacto.mjs --comparar`.
8. `painel.mjs criar-e2e` e `resumo.md`.

**O que esperar.**

```text
🍮 Pudim · criar-e2e  banco-digital · feat/pix-limite
────────────────────────────────────────────────────────
 Rotas antes   ████████████░░░░░░░░    3 de 5
 Rotas depois  ████████████████░░░░    4 de 5  ▲ +1 rotas
────────────────────────────────────────────────────────
 🎯 Área pix-out, saldo, extrato · 3 de 4 arquivos de teste (só o que mudou)
 Execução      ████████████████████   7 de 7  passaram
 🛡️  Filtro de teste falso: 0 de 2 recusados
 🐞 Possíveis bugs no produto: 0
```

Mais a lista de arquivos novos, variáveis de ambiente a definir e sugestões de `data-testid`.

**Limites.** Com Cypress no projeto, para e explica (não instala Playwright por cima). Sem git,
pede a lista de arquivos alterados. Repetir 3 vezes todas as specs novas só sob pedido.

---

## `/pudim:portal [parar | status]`

**O que faz.** Sobe em `http://127.0.0.1:4455` (ou a próxima porta livre) um portal local que
lista os testes Playwright do projeto e permite rodar, acompanhar e ver o resultado sem
terminal.

**Quando usar.** Para rodar E2E com um clique, para quem não usa terminal (PO, suporte, outro
QA), ou para alimentar o histórico que o `/pudim:instavel` e o relatório usam.

**O que acontece.** `portal/server.mjs --root=. --abrir` em segundo plano. O servidor só escuta
em `127.0.0.1`, confere `Host`, `Origin` e `Sec-Fetch-Site`, só roda alvos que o Playwright
listou, remove `ANTHROPIC_*`/`CLAUDE_*` do ambiente dos testes e grava tudo em `.qa/portal/`
(com `.gitignore` próprio, porque o log pode conter saída do app).

**O que esperar na tela.**
- Lista de testes por arquivo, com o status da última vez (pior status entre os navegadores).
- **Rodar afetados**: só os specs ligados ao que mudou, com o motivo de cada um; aviso quando a
  mudança é transversal.
- **Só os que falharam**: repete só os que falharam ou ficaram instáveis na última execução.
- **Executar** um teste, um arquivo ou todos; **Parar**; "Ver o navegador" (`--headed`).
- Log ao vivo com cores; ao final, "falhou em X de N" com o erro e o comando do trace.
- Botão **📊 Relatório** abre o relatório de qualidade.

**Limites.** Só Playwright. Sem autenticação para outros usuários da mesma máquina (pendente).
`playwright --list` roda de forma síncrona na primeira lista.

---

## `/pudim:relatorio [jira] [abrir]`

**O que faz.** Junta tudo que está em `.qa/` num relatório de qualidade em três formatos:
HTML (tema escuro âmbar, pronto para imprimir), Markdown e texto para o Jira. Status:
**CONFORME ESPERADO**, **NECESSITA ATENÇÃO**, **BLOQUEADO** ou **SEM DADOS**, com marca de
**parcial** quando a última E2E foi seletiva.

**Quando usar.** No fim de uma rodada de testes, para anexar no card, ou para a reunião de
release.

**Como o status é decidido.**

| Bloqueia (BLOQUEADO) | Pede atenção (NECESSITA ATENÇÃO) |
|---|---|
| Falha E2E na última execução | Possível bug ao criar testes (não resolvido) |
| Teste unitário falhou na medição de cobertura | Cobertura caiu em algum arquivo |
| Investigação "Bug no produto" nos últimos `bloqueiaDias` (14) sem `Resolvido: sim` | Teste instável; arquivo com 0%; teste recusado pelo filtro; E2E das specs novas não rodou por ambiente |

**O que esperar.** Painel com selo e motivos, cards (cobertura, E2E, rotas, investigações),
barras por arquivo, tendência de cobertura, lista de falhas com comando do trace, tabela de
investigações e lista de evidências (os arquivos de `.qa/` lidos). Caminhos do HTML e do
Markdown ao fim.

**Alavancas do QA.**
- `.qa/config.json`: `"ignorar": ["**/*.stories.*", "src/types/**"]` tira arquivos das
  contagens; `"bloqueiaDias": 7` muda o prazo do bloqueio por investigação.
- `Resolvido: sim` numa investigação ou num bloco de `possiveis-bugs.md` fecha o item.

**Limites.** Não roda testes. Lê as 10 últimas execuções do portal por completo (as mais
antigas só pelo resumo).

---

## Fluxos de trabalho recomendados

**Primeiro contato com um projeto**
`/pudim:inicio` → `/pudim:cobertura` → `/pudim:risco` → `/pudim:criar-unitario <topo do risco>`
→ `/pudim:relatorio`.

**Mexi numa feature (ex.: pix-out)**
`/pudim:criar-e2e pix-out` (roda só pix-out e vizinhas) → se algo falhou, `/pudim:investigar
<teste>` → `/pudim:relatorio` (sai como parcial, de propósito).

**Achei um bug e vou falar com o dev**
`/pudim:investigar <teste ou descrição>` (classificação com evidência, commit suspeito e
trecho) → `/pudim:evidencia <título>` (pasta com relato, teste que reproduz, screenshot, trace e
histórico) → colar o `pacote.md` no card → `Resolvido: sim` quando fechar.

**Teste "quebra sem motivo"**
`/pudim:instavel` → `/pudim:investigar <teste>` → corrigir o teste (com seu ok) ou abrir o bug
→ marcar `Resolvido: sim` quando fechar.

**Fechamento de release**
`/pudim:portal` → "Rodar todos" (uma vez, completa) → `/pudim:cobertura` → `/pudim:relatorio
jira`.

## Scripts por trás dos comandos

| Script | Para quê | Saída |
|---|---|---|
| `qa-detect.sh` | Descobrir ferramentas, pastas, estilo de teste, E2E, lint, tipos | JSON |
| `nova-execucao.mjs` | Criar `.qa/execucoes/<data-hora>-<comando>/` | caminho |
| `coverage-diff.mjs` | Comparar `json-summary` com a referência; gravar referência | JSON + painel |
| `test-quality.mjs` | Filtro de teste falso | JSON + painel |
| `e2e-rotas.mjs` | Rotas do app × `goto()` dos testes | JSON + painel |
| `e2e-afetados.mjs` | Specs afetados pelo git diff; mapa de áreas | JSON + painel |
| `produto-intacto.mjs` | Foto e comparação dos arquivos de produto | JSON + painel |
| `repetir-teste.sh` | Repetir um comando de teste N vezes | JSON + barra |
| `risco.mjs` | Mudanças × cobertura | JSON + painel |
| `instavel.mjs` | Histórico E2E por teste e duração | JSON + painel |
| `evidencia.mjs` | Pacote de evidência de um bug a partir de `.qa/` e do git | pasta + `pacote.md` + JSON |
| `relatorio.mjs` | HTML, Markdown e Jira a partir de `.qa/` | arquivos + JSON |
| `painel.mjs` | O painel de cada comando a partir de `.qa/` | texto |
| `portal/server.mjs` | Portal local | HTTP em 127.0.0.1 |

Todos sem dependências, testados por `scripts/test.sh` (211 verificações) e validados no
projeto fictício `exemplos/banco-digital/`.
