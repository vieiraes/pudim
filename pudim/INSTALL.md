# Instalação do Pudim

> **Para um guia mais completo com exemplos e erros comuns, veja a [CARTILHA.md](CARTILHA.md).**

---

## O que você precisa

- Um repositório Git com seu projeto
- **GitHub Copilot** (VS Code) **ou** **Claude Code**
- Cerca de 5 minutos

---

## Opção A — GitHub Copilot no VS Code

### 1. Instale as extensões necessárias

No VS Code, instale:
- **GitHub Copilot** — o assistente de código
- **GitHub Copilot Chat** — o painel de conversa (onde você digita os comandos)

> `Ctrl+Shift+X` → pesquise pelo nome → clique em Instalar

### 2. Copie os arquivos para seu projeto

```
seu-projeto/
  pudim/                              ← copie esta pasta inteira
  portal/                             ← opcional: manual visual (veja README.md > Portal do Pudim)
  .github/
    skills/pudim-sdd/SKILL.md         ← copie
    prompts/pudim-*.prompt.md         ← copie todos os arquivos pudim-*
    agents/pudim-orchestrator.agent.md← copie
```

> **Não copie** `AGENTS.md`, `STATUS.md` da raiz deste repositório — eles são específicos do projeto de exemplo.
> Use os templates em `pudim/templates/` para criar os seus:
>
> ```bash
> cp pudim/templates/AGENTS.md AGENTS.md
> cp pudim/templates/STATUS.md STATUS.md
> ```
> Depois preencha o `AGENTS.md` com as regras do seu projeto.

### 3. Teste

Abra o Copilot Chat (`Ctrl+Alt+I`) e digite:

```
/pudim-iniciar
```

Se aparecer a sugestão do Pudim, funcionou.

---

## Opção B — Claude Code

### 1. Instale o Claude Code

Siga: https://docs.anthropic.com/claude-code

### 2. Copie os arquivos para seu projeto

```
seu-projeto/
  pudim/       ← copie esta pasta inteira
  portal/      ← opcional: manual visual (veja README.md > Portal do Pudim)
```

> **Não copie** `AGENTS.md`, `CLAUDE.md` e `STATUS.md` da raiz deste repositório — eles são específicos do projeto de exemplo.
> Crie os seus a partir dos templates:
>
> ```bash
> cp pudim/templates/AGENTS.md AGENTS.md
> cp pudim/templates/CLAUDE.md CLAUDE.md
> cp pudim/templates/STATUS.md STATUS.md
> ```
> Depois preencha o `AGENTS.md` com as regras do seu projeto.

### 3. Teste

No terminal, dentro do projeto:

```bash
claude
```

Quando a sessão abrir:

```
Leia o CLAUDE.md e me ajuda com o framework Pudim.
```

---

## Checklist de verificação

- [ ] `pudim/README.md`
- [ ] `pudim/CARTILHA.md`
- [ ] `pudim/WORKFLOW.md`
- [ ] `pudim/COMMANDS.md`
- [ ] `pudim/VERSION`
- [ ] `pudim/setup.sh` (wizard de terminal)
- [ ] `pudim/validate-project.sh` (harness de validação do fluxo)
- [ ] `pudim/install-hooks.sh` (instalador do hook pre-commit)
- [ ] `pudim/templates/CONST.md`
- [ ] `pudim/templates/AGENTS.md`
- [ ] `pudim/templates/CLAUDE.md`
- [ ] `pudim/templates/STATUS.md`
- [ ] `pudim/templates/SPEC.md`
- [ ] `pudim/templates/TASKS.md`
- [ ] `pudim/templates/VALIDATION.md`
- [ ] `portal/` ← opcional (manual visual): `server.js`, `package.json`, `public/`
- [ ] `AGENTS.md` ← criado a partir do template, preenchido com seu projeto
- [ ] `STATUS.md` ← criado a partir do template (começa vazio)
- [ ] `CLAUDE.md` ← criado a partir do template (se usar Claude Code)

Apenas para Copilot:
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

## Primeiro uso após instalar

### 1. Rode o wizard de setup

```bash
chmod +x pudim/setup.sh
./pudim/setup.sh
```

Ele verifica tudo automaticamente, instala o hook de validação e oferece correções.

### 2. Crie o CONST.md

No Copilot Chat ou Claude:

```
/pudim-const
```

### 3. Crie sua primeira tarefa

```
/pudim-iniciar
```

### 4. Consulte o board a qualquer momento

```
/pudim-status
```

---

## Problemas na instalação?

Veja a seção "Erros comuns" na [CARTILHA.md](CARTILHA.md).
