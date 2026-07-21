# Portal do Pudim

App local (Node + Express, sem build) que serve o manual visual do Pudim: instalação passo a
passo, comandos, primeira tarefa — e, desde a TASK-007, **executa de verdade** os scripts
não-interativos do Pudim, com os logs aparecendo em tempo real na própria página.

## Scripts executáveis (allowlist do servidor)

| Nome | Comando real | O que faz |
|---|---|---|
| `validate` | `./pudim/validate-project.sh` | Validação completa do fluxo Pudim SDD |
| `validate:quick` | `./pudim/validate-project.sh --quick` | Só erros críticos (modo do hook de pre-commit) |
| `hooks` | `./pudim/install-hooks.sh` | Instala/atualiza o hook de pre-commit local — **grava em `.git/hooks/pre-commit`** |

`setup.sh` é interativo (espera resposta no terminal) e por isso **não** tem botão de execução
— continua só com "copiar comando" no manual. Os processos rodam com o mesmo usuário/permissões
de quem iniciou o portal; o servidor só aceita os 3 nomes acima (nunca um comando cru vindo do
cliente).

## Como rodar

```bash
cd portal
npm install
npm start
```

Abra `http://127.0.0.1:4444` no navegador.

## Estrutura

```
portal/
  server.js       ← Express, serve public/ como estático, bind em 127.0.0.1:4444
  package.json
  public/
    index.html    ← manual (página única)
    styles.css
    app.js        ← copiar comando, toggle de tema, navegação
    assets/       ← logo e ilustrações SVG
```

Sem dependência de rede externa: nenhuma fonte, script ou CDN remoto é carregado.
