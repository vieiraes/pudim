# Pudim

<p align="center">
   <img src="https://cdn-icons-png.flaticon.com/512/3465/3465429.png" width="120" alt="Pudim logo" />
</p>

<p align="center">
  <strong>O framework simples para Dev.</strong><br/>
  Em português. Passo a passo. Sem complicação.
</p>

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

**Opcional — instale o hook de validação automática:**

```bash
chmod +x pudim/install-hooks.sh
./pudim/install-hooks.sh
```

A partir daí, cada `git commit` valida automaticamente a integridade do fluxo Pudim (spec packs, dependências, alinhamento de critérios). Só erros críticos bloqueam o commit.

### Passo 3 — Defina as regras do projeto

No Copilot Chat ou Claude, digite:

```
/pudim-const
```

A IA faz 6 perguntas e gera o `CONST.md` (CONSTANTE)— as regras inegociáveis do projeto. Faça isso **uma vez**, antes de qualquer tarefa.

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

> Explicação detalhada de cada comando: [COMMANDS.md](COMMANDS.md)

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
