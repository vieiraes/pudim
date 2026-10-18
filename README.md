# Pudim

<p align="center">
   <img src="assets/pudim-icon.svg" width="120" alt="Pudim" />
</p>

<p align="center">
  <strong>O framework de QA para o seu terminal, em português.</strong><br/>
  Plugin para Claude Code que testa um projeto que já existe: cria testes unitários e end-to-end
  quando você pede, mostra o que está e o que não está coberto e recusa teste que não testa nada.
</p>

## Para quem é

QA e SDET que recebem um produto já em desenvolvimento e precisam testar: pegar uma branch,
entender o que tem teste, criar o que falta e mostrar o resultado com números.

O Pudim **não cria sistema** e **não mexe no código do produto**. Ele só cria testes quando você
pede e guarda medições e relatórios na pasta `.qa/` do projeto testado.

## Comandos

| Comando | O que faz | Situação |
|---|---|---|
| `/pudim:cobertura [pasta]` | Mede a cobertura dos testes unitários e explica o que falta, comparando com a medição anterior | ✅ pronto |
| `/pudim:investigar <teste ou bug>` | Investiga um teste que falha ou um bug relatado com análise socrática, até a causa raiz, e diz se é bug no produto, no teste, instabilidade, ambiente ou dados | ✅ pronto |
| `/pudim:criar-unitario [alvo]` | Cria testes unitários para o que está descoberto e mostra a cobertura antes e depois | em construção |
| `/pudim:criar-e2e [fluxo]` | Cria testes de ponta a ponta com Playwright e mostra quais fluxos estão cobertos | em construção |
| `/pudim:relatorio` | Junta tudo em um relatório (Markdown, HTML ou comentário para Jira) | em construção |

Exemplo real de resposta do `/pudim:cobertura`, em um projeto de pagamentos com Jest:

```
Cobertura de testes unitários: 35,71% das linhas (branches 26,31%, funções 33,33%)
Comparado com a referência: primeira medição, virou a referência
Testes: 2 passaram, 0 falharam
Arquivos: 2 no total, 0 com 100%, 1 sem nenhum teste

O que mais precisa de teste:
  src/pagamentos/estorno.js     0% das linhas
  src/pagamentos/taxa.js        83,33% das linhas
```

## Instalação

No Claude Code:

```
/plugin marketplace add vieiraes/pudim
/plugin install pudim@pudim
```

Depois, dentro do projeto que você quer testar, digite `/pudim:cobertura`.

Requisitos: projeto JavaScript/TypeScript com Jest ou Vitest (Playwright para E2E), Node 18+.

## O que tem de diferente

- **Número vem de script, não da IA.** Toda porcentagem é lida dos relatórios do Jest, Vitest e
  Playwright por scripts sem dependências, versionados neste repositório.
- **O que não tem teste aparece.** A medição sempre inclui todos os arquivos de código, não só os
  que algum teste importa; o arquivo esquecido vai para o topo da lista.
- **Teste falso não conta.** Teste sem verificação, só `toBeTruthy`, pulado ou que imita o
  próprio alvo é recusado.
- **Investigação com análise socrática.** Todo problema é investigado com perguntas, cinco
  porquês e evidência exata ("falhou em 7 de 10 execuções", nunca "às vezes"), separando o que
  foi provado do que ainda é hipótese. O método está em [docs/analise-socratica.md](docs/analise-socratica.md).
- **Em português, para QA.** As respostas explicam o que o número quer dizer para o produto.

## Roadmap

Ver [ROADMAP.md](ROADMAP.md).

## História

Até a versão 0.3.2, o Pudim era um framework de desenvolvimento guiado por especificação
(SPEC → TASKS → BUILD → VALIDATION) para quem usa Claude Code e Copilot. Em outubro de 2026 ele
virou um framework para QA. A versão anterior continua no histórico do repositório.

<p align="center">
  Feito por Bruno Vieira &nbsp;·&nbsp; PT-BR &nbsp;·&nbsp; Licença MIT
</p>
