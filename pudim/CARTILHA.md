# Cartilha do Pudim

**Guia completo para devs iniciantes.**  
Leia isso antes de qualquer coisa. Leva uns 10 minutos.

---

## O que você vai aprender aqui

- O que é o Pudim e por que ele existe
- Como rodar o wizard de setup no terminal
- Como criar o CONST.md (regras do projeto)
- Como instalar no GitHub Copilot (VS Code) e no Claude Code
- Como usar cada comando
- Como criar sua primeira tarefa do zero até o fim
- Como checar o board a qualquer momento com `/pudim-status`
- Erros comuns e como evitar

---

## Parte 1 — Entendendo o Pudim

### O que é SDD?

SDD significa **Spec-Driven Development** — em português: _desenvolvimento guiado por especificação_.

Na prática, é uma regra simples:

> **Você só começa a escrever código depois de saber exatamente o que vai fazer.**

Parece óbvio, mas a maioria dos devs (especialmente iniciantes usando IA) pula essa etapa.  
O resultado? A IA gera código para a coisa errada, e você perde horas com retrabalho.

### Por que usar o Pudim?

Sem o Pudim, uma sessão com IA costuma ser assim:

```
Você: "cria um sistema de login"
IA: [gera 300 linhas de código]
Você: "não era bem isso, refaz"
IA: [gera mais 300 linhas]
Você: "ainda não... esquece"
```

Com o Pudim:

```
Você: /pudim-iniciar
IA: "Qual é o objetivo da tarefa?"
Você: "Criar tela de login com email e senha"
IA: "O que está dentro do escopo? O que fica fora?"
Você: define os limites
IA: "Quais são os critérios para considerar pronto?"
Você: define os critérios
IA: [agora sim começa a codar, com escopo claro]
```

### O fluxo em 5 etapas

Toda tarefa no Pudim passa por etapas. Sem pular:

```
┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌────────────┐
│ CONST │ → │ SPEC  │ → │ TASKS │ → │ BUILD │ → │ VALIDATION │
└───────┘   └───────┘   └───────┘   └───────┘   └────────────┘
Uma vez     Por tarefa  Quebra em   Constrói    Confirma que
por projeto             partes      o código    funciona
```

**CONST** — Feito uma única vez, quando o projeto começa:
- Qual é a stack?
- O que nunca vai ser feito neste projeto?
- Quais são as regras de código e processo?

**SPEC** — Define o que vai ser feito antes de começar a codar:
- O que a tarefa faz
- O que ela NÃO faz (importante!)
- Como saber que está pronta (critérios de aceite)

**TASKS** — Quebra em subtarefas com dependências claras:
- Cada subtarefa cabe em uma sessão de trabalho
- As dependências estão explícitas (ex.: "SUB-002 depende da SUB-001")

**BUILD** — Implementa uma subtarefa por vez, sem expandir o escopo.

**VALIDATION** — Confirma cada critério de aceite com evidência antes de fechar.

---

## Parte 2 — Instalação

### O que você precisa antes de começar

- **VS Code** instalado ([baixar aqui](https://code.visualstudio.com/))
- **GitHub Copilot** (extensão) **ou** **Claude Code**
- Um projeto/repositório já criado

---

### Opção A — Instalando com GitHub Copilot

#### Passo 1 — Instale a extensão GitHub Copilot

1. Abra o VS Code
2. Pressione `Ctrl+Shift+X` (ou `Cmd+Shift+X` no Mac) para abrir extensões
3. Pesquise por **"GitHub Copilot"**
4. Clique em **Instalar**
5. Quando pedir, faça login com sua conta GitHub

> Você precisa de uma assinatura do Copilot. Há um plano gratuito disponível.

#### Passo 2 — Instale a extensão GitHub Copilot Chat

1. Na mesma aba de extensões, pesquise **"GitHub Copilot Chat"**
2. Instale

> O Copilot Chat é o painel de conversa onde você vai digitar os comandos do Pudim.

#### Passo 3 — Copie os arquivos do Pudim para seu projeto

Dentro do seu projeto, crie essa estrutura (copie da pasta `pudim/` deste repositório):

```
seu-projeto/
  pudim/                          ← copie essa pasta inteira
    README.md
    CARTILHA.md
    COMMANDS.md
    WORKFLOW.md
    INSTALL.md
    setup.sh
    assets/
    templates/
    specs/
  .github/                        ← copie essa pasta inteira
    skills/
      pudim-sdd/
        SKILL.md
    prompts/
      pudim-const.prompt.md
      pudim-iniciar.prompt.md
      pudim-tarefa-registrar.prompt.md
      pudim-tarefa-criar.prompt.md
      pudim-tarefa-validar.prompt.md
      pudim-tarefa-fechar.prompt.md
      pudim-status.prompt.md
    agents/
      pudim-orchestrator.agent.md
```

Depois crie os arquivos do SEU projeto a partir dos templates:

```bash
cp pudim/templates/AGENTS.md AGENTS.md
cp pudim/templates/STATUS.md STATUS.md
```

> **Não copie** o `AGENTS.md` e o `STATUS.md` da raiz deste repositório.
> Eles têm dados do projeto de exemplo.
> Os templates em `pudim/templates/` são os genéricos.

#### Passo 4 — Abra o Copilot Chat

1. No VS Code, clique no ícone do Copilot na barra lateral esquerda  
   _(parece um ícone de chat)_
2. O painel de chat abre à esquerda ou à direita
3. Digite `/pudim-iniciar` e pressione Enter

Se aparecer uma sugestão com o comando Pudim, funcionou!

---

### Opção B — Instalando com Claude Code

#### Passo 1 — Instale o Claude Code

Siga o guia oficial em: https://docs.anthropic.com/claude-code

#### Passo 2 — Copie os arquivos do Pudim para seu projeto

```
seu-projeto/
  pudim/           ← copie essa pasta inteira
```

Depois crie os arquivos do SEU projeto a partir dos templates:

```bash
cp pudim/templates/AGENTS.md AGENTS.md
cp pudim/templates/CLAUDE.md CLAUDE.md
cp pudim/templates/STATUS.md STATUS.md
```

> **Não copie** esses arquivos da raiz deste repositório — eles têm dados do projeto de exemplo.
> Use os templates genéricos de `pudim/templates/`.

#### Passo 3 — Inicie uma sessão

No terminal, dentro do seu projeto:

```bash
claude
```

Quando a sessão abrir, diga:

```
Leia o CLAUDE.md e me ajuda a usar o framework Pudim.
```

O Claude vai ler as regras e já estar pronto para usar os comandos.

---

### Verificando se funcionou

Após a instalação, confirme que esses arquivos existem:

- [ ] `pudim/README.md`
- [ ] `pudim/COMMANDS.md`
- [ ] `pudim/templates/SPEC.md`
- [ ] `pudim/templates/TASKS.md`
- [ ] `pudim/templates/VALIDATION.md`
- [ ] `pudim/setup.sh`
- [ ] `STATUS.md`
- [ ] `AGENTS.md`

Se estiver usando Copilot, confirme também:

- [ ] `.github/skills/pudim-sdd/SKILL.md`
- [ ] `.github/prompts/pudim-const.prompt.md`
- [ ] `.github/prompts/pudim-iniciar.prompt.md`
- [ ] `.github/prompts/pudim-tarefa-registrar.prompt.md`
- [ ] `.github/prompts/pudim-tarefa-criar.prompt.md`
- [ ] `.github/prompts/pudim-tarefa-validar.prompt.md`
- [ ] `.github/prompts/pudim-tarefa-fechar.prompt.md`
- [ ] `.github/prompts/pudim-status.prompt.md`
- [ ] `.github/agents/pudim-orchestrator.agent.md`

---

## Parte 3 — Rodando o wizard de setup

Antes de escrever uma linha de código, rode o wizard. Ele verifica tudo de uma vez.

```bash
chmod +x pudim/setup.sh
./pudim/setup.sh
```

O wizard vai fazer 7 verificações:

| # | O que verifica |
|---|---|
| 1 | Git instalado e repositório inicializado |
| 2 | Node.js instalado e versão ≥ 18 |
| 3 | Todos os arquivos do Pudim estão no lugar |
| 4 | CONST.md existe na raiz |
| 5 | Arquivos do Copilot e Claude estão presentes |
| 6 | .gitignore com .env protegido |
| 7 | Resumo com próximos passos |

Se der algum erro, o wizard mostra **o que está errado** e oferece **opções de correção** diretamente no terminal. Sem precisar sair para procurar no Google.

Apenas siga as instruções até o wizard mostrar:

```
╔══════════════════════════════════════════════╗
║   🍮  Bom desenvolvimento!                   ║
╚══════════════════════════════════════════════╝
```

Aí sim você está pronto para o próximo passo.

---

## Parte 4 — Usando o Pudim

### Primeiro: crie o CONST.md

**CONST.md** é o documento de regras inegociáveis do projeto. Ele é criado **uma única vez**, antes de qualquer tarefa.

Se o wizard já criou o arquivo para você, edite-o com os dados reais do projeto.
Se ainda não tem, use o comando:

**Copilot Chat:**
```
/pudim-const
```

**Claude Code:**
```
/pudim-const
```

O agente vai fazer 6 perguntas (uma de cada vez) e gerar o `CONST.md` preenchido.

### Agora: crie sua primeira tarefa

Vamos criar uma tarefa do zero. Exemplo: _"criar página inicial do site"_.

> **Em qualquer momento do fluxo, rode `/pudim-status` para ver o status atual do projeto e da task.**

---

#### Passo 1 — Crie a tarefa

No Copilot Chat, digite:

```
/pudim-tarefa-registrar
```

A IA vai perguntar o nome da tarefa. Responda:

```
Criar página inicial do site
```

O `STATUS.md` vai ficar assim:

```
- [ ] TASK-001 | Criar página inicial do site | Depende de: -
```

Pronto. Você tem um card no board.

---

#### Passo 2 — Abra a especificação

```
/pudim-tarefa-criar TASK-001
```

Depois de preencher a SPEC, aprove com:

```
/pudim-tarefa-validar TASK-001
```

A IA vai criar a pasta `pudim/specs/TASK-001/` com três arquivos.

Depois da aprovação da SPEC, você pode rodar `/pudim-status` para confirmar que a task entrou em andamento.

Ela também vai te fazer perguntas para preencher o `SPEC.md`:

**Pergunta 1: Qual é o objetivo?**
```
Criar a página inicial com hero, lista de serviços e rodapé.
```

**Pergunta 2: O que está dentro do escopo?**
```
- Seção hero com título e botão de CTA
- Lista de 3 serviços com ícone e descrição
- Rodapé com links e copyright
```

**Pergunta 3: O que está FORA do escopo?**
```
- Menu de navegação (será feito na TASK-002)
- Formulário de contato
- Versão mobile (será adaptado depois)
```

**Pergunta 4: Critérios de aceite (como saber que está pronto)?**
```
- A página abre sem erros no navegador
- O botão de CTA está visível e clicável
- Os 3 serviços aparecem corretamente
- O rodapé exibe copyright com o ano atual
```

> **Dica:** Critérios de aceite devem ser verificáveis. "Está bonito" não vale. "O botão está visível e clicável" vale.

---

#### Passo 3 — Quebre em subtarefas

A IA vai preencher o `TASKS.md` automaticamente. Deve ficar assim:

```
- [ ] SUB-001 | Criar estrutura HTML da página         | Depende de: -
- [ ] SUB-002 | Implementar seção hero                 | Depende de: SUB-001
- [ ] SUB-003 | Implementar lista de serviços          | Depende de: SUB-001
- [ ] SUB-004 | Implementar rodapé                     | Depende de: SUB-001
- [ ] SUB-005 | Testar no navegador e validar critérios| Depende de: SUB-002, SUB-003, SUB-004
```

---

#### Passo 4 — Implemente com a IA

Agora você pode pedir para a IA implementar:

```
Implemente a SUB-001: criar estrutura HTML da página
```

Siga na ordem das dependências. Não pule etapas.

Se quiser confirmar a coluna da task durante a execução, rode `/pudim-status`.

Conforme cada subtarefa for concluída, marque no `TASKS.md`:

```
- [x] SUB-001 | Criar estrutura HTML da página
```

---

#### Passo 5 — Feche a tarefa

Quando todas as subtarefas estiverem marcadas, feche:

```
/pudim-tarefa-fechar TASK-001
```

A IA vai verificar cada critério de aceite e pedir evidência:

```
CA-01: "A página abre sem erros no navegador"
→ Evidência: testado no Chrome e Firefox, sem erros no console

CA-02: "O botão de CTA está visível e clicável"
→ Evidência: botão renderizado, clique redireciona para /contato
```

Se tudo passar, o `STATUS.md` é atualizado:

```
- [x] TASK-001 | Criar página inicial do site | Depende de: -
```

Para confirmar o fechamento no board, rode `/pudim-status`.

---

## Parte 5 — Erros comuns

### ❌ "Vou codar primeiro e preencher a spec depois"

**Problema:** A IA não vai respeitar o escopo porque ele não estava definido.  
**Solução:** SPEC sempre primeiro. Leva 5 minutos e evita horas de retrabalho.

---

### ❌ "Vou fazer 3 tarefas ao mesmo tempo"

**Problema:** Você perde o fio. Fica difícil saber o que está pronto de verdade.  
**Solução:** Uma tarefa por vez. Feche antes de abrir a próxima.

---

### ❌ "Critério de aceite: deve funcionar corretamente"

**Problema:** "Funcionar corretamente" não diz nada. Você não vai saber quando está pronto.  
**Solução:** Seja específico. "O formulário exibe mensagem de erro quando o email é inválido."

---

### ❌ "Já acabei, vou só marcar como concluído"

**Problema:** Sem evidência, você não sabe se realmente acabou ou só acha que acabou.  
**Solução:** Use `/pudim-tarefa-fechar TASK-XYZ`. A IA vai checar os critérios com você.

---

### ❌ "O comando /pudim-iniciar não aparece"

**Possíveis causas:**
1. A pasta `.github/prompts/` não foi copiada para o projeto
2. O Copilot Chat não está instalado (é uma extensão separada)
3. O arquivo `pudim-iniciar.prompt.md` está com o nome errado

**Solução:** Verifique o checklist de instalação no [INSTALL.md](INSTALL.md).

---

## Parte 6 — Referência rápida

### Comandos

| Comando | Quando usar |
|---|---|
| `/pudim-iniciar` | Primeiro comando. Cria card + spec + tasks de uma vez |
| `/pudim-tarefa-registrar` | Só quer adicionar um card ao board por enquanto |
| `/pudim-tarefa-criar TASK-XYZ` | Card já existe, quer detalhar a tarefa agora |
| `/pudim-tarefa-validar TASK-XYZ` | Terminou a especificação e quer aprovar para seguir |
| `/pudim-tarefa-fechar TASK-XYZ` | Implementação concluída, quer validar e fechar |
| `/pudim-status` | Quer ver o board completo |

### Arquivos que você vai editar

| Arquivo | Para que serve |
|---|---|
| `STATUS.md` | Board do projeto. Um card por linha. |
| `pudim/specs/TASK-XYZ/SPEC.md` | Especificação da tarefa |
| `pudim/specs/TASK-XYZ/TASKS.md` | Subtarefas com dependências |
| `pudim/specs/TASK-XYZ/VALIDATION.md` | Evidências de conclusão |

### O ciclo completo

```
./pudim/setup.sh       ← uma vez, no início do projeto
    ↓
/pudim-const          ← uma vez, cria as regras do projeto
    ↓
/pudim-tarefa-registrar ← para cada nova feature
    ↓
/pudim-tarefa-criar TASK-XYZ
  ↓
/pudim-tarefa-validar TASK-XYZ
    ↓
Preenche SPEC com a IA
    ↓
Implementa subtarefa por subtarefa
    ↓
/pudim-tarefa-fechar TASK-XYZ
    ↓
/pudim-status  ← pode rodar a qualquer momento para checar andamento
  ↓
STATUS.md atualizado ✓
```

---

## Precisa de ajuda?

- Documentação do framework: [README.md](README.md)
- Fluxo detalhado: [WORKFLOW.md](WORKFLOW.md)
- Referência de comandos: [COMMANDS.md](COMMANDS.md)
- Como escrever boas specs: [specs/README.md](specs/README.md)
- Problemas de instalação: [INSTALL.md](INSTALL.md)

---

_Pudim — feito para funcionar. 🍮_
