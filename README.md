# Pudim

<p align="center">
   <img src="pudim/assets/pudim-icon.svg" width="120" alt="Pudim logo" />
</p>

<p align="center">
  <strong>O framework simples para Dev.</strong><br/>
  Em português. Passo a passo. Sem complicação.
</p>

---

## Antes de tudo: ferramenta, framework ou este repo?

Se você chegou aqui confuso sobre "estou desenvolvendo no Claude/Copilot ou pelo Pudim?", a
resposta é: **sempre na ferramenta de IA** (Claude Code ou GitHub Copilot). "Pelo Pudim" é a
*disciplina* que essa ferramenta passa a seguir dentro de um projeto — não é uma alternativa a
ela. É a diferença entre o carro (a ferramenta) e o piloto automático (o Pudim): você continua
dirigindo o mesmo carro, só que com um modo de operar mais disciplinado.

Isso fica especialmente confuso **neste repositório específico**, porque ele faz duas coisas ao
mesmo tempo:

1. **É o código-fonte do produto Pudim** — os arquivos que você copia para o SEU projeto:
   `pudim/templates/*`, `pudim/{README,COMMANDS,CARTILHA,WORKFLOW,INSTALL}.md`,
   `pudim/{setup,validate-project,install-hooks}.sh` e `.github/{prompts,skills,agents}/`.
2. **Usa o próprio Pudim para se desenvolver** (dogfooding) — `STATUS.md`, `CONST.md`,
   `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` e `pudim/specs/TASK-00X/` na
   raiz **não são exemplos genéricos**: são o board e as specs reais de construção do próprio
   framework Pudim (TASK-001, TASK-002... = tarefas de desenvolver o Pudim em si).

Regra prática: **arquivo em `pudim/templates/` ou prompt em `.github/` → copiável para outro
projeto. Arquivo solto na raiz (STATUS/CONST/AGENTS/CLAUDE) ou pasta com número de task
(`pudim/specs/TASK-00X/`) → é deste repo, não copie.** Quando você instala o Pudim em outro
projeto (ver [INSTALL.md](pudim/INSTALL.md) e [CARTILHA.md](pudim/CARTILHA.md)), aquele projeto
cria seu **próprio** STATUS.md/CONST.md/specs, totalmente independente do board deste repo.

---

## O problema que o Pudim resolve

Você abre o Copilot ou o Claude e diz: _"cria uma tela de login"_.

A IA começa a codar. Mas:

- O que exatamente deveria ser feito?
- Quais eram os critérios para considerar pronto?
- A tarefa realmente foi concluída ou só parece?

Sem uma especificação antes, o resultado vira um ciclo de retrabalho.

**O Pudim resolve isso.** Ele obriga você a pensar antes de codar — e garante que a IA trabalhe dentro do escopo que você definiu.

---

## O que é o Pudim?

Pudim é um **framework leve de desenvolvimento** para quem usa IA como assistente (GitHub Copilot ou Claude Code).

Ele funciona como um **board do Jira simplificado** combinado com um fluxo Agile:

```
[ A Fazer ] → [ Em Andamento ] → [ Feito ]
```

Cada tarefa obrigatoriamente passa por 4 etapas:

```
SPEC  →  TASKS  →  BUILD  →  VALIDATION
 ↓          ↓         ↓           ↓
Define    Quebra   Constrói   Confirma
o quê    em partes  o código    que funciona
```

---

## Para quem é o Pudim?

- Devs **iniciantes** que querem trabalhar de forma organizada
- Devs que usam **GitHub Copilot** ou **Claude Code** no dia a dia
- Times que precisam de **rastreabilidade simples** sem burocracia
- Qualquer pessoa que já perdeu horas com retrabalho por falta de alinhamento

---

## Portal do Pudim (via visual)

Prefere ver passo a passo em vez de ler vários `.md` em sequência? Rode o portal local:

```bash
cd portal
npm install
npm start
```

Abra `http://127.0.0.1:4444` — manual visual com instalação (Claude Code + Copilot), o fluxo
SPEC→TASKS→BUILD→VALIDATION, todos os comandos e um walkthrough da primeira tarefa. O portal
também **executa de verdade** `validate-project.sh` e `install-hooks.sh` (allowlist fixa, ver
[portal/README.md](portal/README.md)), com os logs em tempo real na própria página — `setup.sh`
continua só com "copiar comando" por ser interativo.

---

## Começando em 4 passos

### Passo 1 — Instale

Copie a pasta `pudim/` e `.github/` para o seu projeto.

> Guia completo de instalação: [INSTALL.md](INSTALL.md)  
> Cartilha para iniciantes: [CARTILHA.md](CARTILHA.md)

### Passo 2 — Rode o wizard de setup

No terminal, dentro do seu projeto:

```bash
chmod +x pudim/setup.sh
./pudim/setup.sh
```

Ele verifica tudo (Git, Node, arquivos do Pudim, .gitignore) e mostra o que está faltando.


### Passo 3 — Defina as regras do projeto

No Copilot Chat ou Claude, digite:

```
/pudim-const
```

A IA faz 6 perguntas socráticas (uma de cada vez), apresenta um **Plano de Ação** (proposta de constituição) que você **aceita ou contesta**, e só então gera o `CONST.md` (CONSTANTE) — as regras inegociáveis do projeto. Faça isso **uma vez**, antes de qualquer tarefa.

### Passo 4 — Crie sua primeira tarefa

No Copilot Chat ou Claude, digite:

```
/pudim-iniciar
```

A IA vai te guiar para criar o card, a especificação e o plano de execução.

### Passo 5 — Desenvolva e feche

Quando terminar, use:

```
/pudim-tarefa-fechar TASK-001
```

A IA verifica se tudo foi validado antes de marcar como concluído.

### Passo 6 — Consulte o status a qualquer momento

Para ver o board completo:
```
/pudim-status
```

Para ver o status de uma tarefa específica (mesmo após conclusão):
```
/pudim-status TASK-001
```

---

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/pudim-const` ⭐ | Cria as regras inegociáveis do projeto (faça primeiro) |
| `/pudim-iniciar` | Começa uma nova tarefa do zero |
| `/pudim-tarefa-registrar` | Registra um card no board (STATUS.md) |
| `/pudim-tarefa-criar TASK-XYZ` | Gera a estrutura completa da tarefa |
| `/pudim-tarefa-validar TASK-XYZ` | Aprova a especificação e libera execução |
| `/pudim-tarefa-fechar TASK-XYZ` | Valida e fecha a tarefa com evidências |
| `/pudim-status` | Mostra o board atual do projeto |
| `/pudim-status TASK-XYZ` | Mostra o status de uma task específica (mesmo fechada) |

> Explicação detalhada de cada comando: [COMMANDS.md](COMMANDS.md)

---

## Versão e Changelog

O Pudim usa uma versão central em `pudim/VERSION`.

- Exemplo de valor: `0.3.0`
- O `setup.sh` e o `install-hooks.sh` mostram essa versão no terminal.
- Cada spec pack novo recebe rodapé com `Pudim-Spec: vX.Y.Z` em `SPEC.md`, `TASKS.md` e `VALIDATION.md`.

As mudanças por versão ficam em `CHANGELOG.md`.

Regra prática de release:

1. Trabalhe normalmente em `Unreleased`.
2. Quando for publicar (momento de commit final e envio para branch), escolha o bump de versão.
3. Atualize `pudim/VERSION` e feche a seção da versão no `CHANGELOG.md`.

---

## Como funciona na prática

### Exemplo real — passo a passo

**1. Você tem uma ideia de feature. Cria a tarefa:**

```
/pudim-tarefa-registrar
```

O board no `STATUS.md` fica assim:
```
- [ ] TASK-003 | Tela de login com email e senha | Depende de: -
```

**2. Abre a especificação da tarefa:**

```
/pudim-tarefa-criar TASK-003
```

Depois de preencher a SPEC:

```
/pudim-tarefa-validar TASK-003
```

A IA cria automaticamente:
```
pudim/specs/TASK-003/
  SPEC.md        ← o que fazer, o que não fazer, critérios de pronto
  TASKS.md       ← lista de subtarefas com dependências
  VALIDATION.md  ← checklist para validar antes de fechar
```

**3. Você preenche a SPEC com a IA:**

- Objetivo: _"Criar tela de login com email e senha"_
- Dentro do escopo: _formulário, validação, mensagem de erro_
- Fora do escopo: _recuperação de senha, login social_
- Critério de aceite: _usuário consegue logar com email válido_

**4. A IA quebra em subtarefas no TASKS.md:**

```
- [ ] SUB-001 | Criar componente de formulário
- [ ] SUB-002 | Adicionar validação de campos
- [ ] SUB-003 | Integrar com endpoint de auth
- [ ] SUB-004 | Testar fluxo completo
```

**5. Você implementa com a IA, uma subtarefa por vez.**

**6. Quando terminar, fecha com evidência:**

```
/pudim-tarefa-fechar TASK-003
```

A IA verifica cada critério de aceite, pede evidência e só fecha se tudo passou.

---

## As 3 regras do Pudim

> **1. Sem SPEC aprovada, sem código.**  
> Evita construir a coisa errada.

> **2. Uma tarefa por vez. Escopo mínimo.**  
> Mantém o foco e evita distração.

> **3. Sem evidência, sem fechar.**  
> Garante que "feito" realmente significa feito.

---

## Estrutura de arquivos

```
pudim/
  README.md       ← você está aqui
  CARTILHA.md     ← guia completo para iniciantes
  COMMANDS.md     ← referência de comandos
  WORKFLOW.md     ← fluxo detalhado com gates
  INSTALL.md      ← instalação no Copilot e Claude
  assets/
    pudim-icon.svg
  templates/
    SPEC.md       ← template de especificação
    TASKS.md      ← template de subtarefas
    VALIDATION.md ← template de validação
    VERSION       ← versão central do framework
  specs/
    README.md     ← como escrever boas specs
    TASK-XYZ/     ← criada automaticamente pelo /pudim-tarefa-criar
```

---

## Documentação completa

| Documento | Para que serve |
|---|---|
| [CARTILHA.md](CARTILHA.md) | Guia do zero para dev junior |
| [INSTALL.md](INSTALL.md) | Como instalar no Copilot e Claude |
| [COMMANDS.md](COMMANDS.md) | Referência de todos os comandos |
| [WORKFLOW.md](WORKFLOW.md) | Fluxo detalhado com gates |
| [specs/README.md](specs/README.md) | Como escrever boas specs |


<p align="center">
  Feito por <a href="mailto:vieira.es@gmail.com">Bruno Vieira</a> &nbsp;·&nbsp; PT-BR &nbsp;·&nbsp; Licença MIT
</p>
