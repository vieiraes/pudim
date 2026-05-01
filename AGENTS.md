# AGENTS.md

> Regras para qualquer agente de IA (Copilot, Claude Code) que trabalhar no desenvolvimento do Pudim.

---

## Objetivo do Produto

**Pudim é um framework leve de desenvolvimento** para devs que usam IA (Copilot ou Claude Code).

Ele simplifica o fluxo: SPEC → TASKS → BUILD → VALIDATION, forçando clareza antes de codar e evidência após.

**Problema que resolve:** Sem especificação clara, devs e IAs perdem horas em retrabalho, mudança de escopo e "quase pronto".

---

## Regras de Produto (Sempre Seguir)

- **Toda feature implementada deve atualizar documentação em 3 lugares:** README.md (porta de entrada), COMMANDS.md (referência) e CARTILHA.md (guia iniciante). Sem exceção.
- **README.md é ponto de entrada obrigatório.** Qualquer mudança de comando, workflow ou behavior deve estar lá.
- **Toda nova versão publicada deve atualizar `pudim/VERSION` e `CHANGELOG.md`.** Sem release sem histórico.
- **Sem SPEC aprovada, sem código.** A regra inegociável do framework.
- **Sem evidência, sem fechamento.** Task só fecha com validação e provas.
- **Compatibilidade bidirecional.** Copilot e Claude Code devem funcionar igualmente com cada comando.
- **Comandos informativos nunca editam.** `/pudim-status` e `/pudim-status TASK-XYZ` são garantidamente read-only. Agentes devem respeitar essa restrição absolutamente.

---

## Escopo Funcional Mínimo

Para o Pudim ser viável:
1. Setup wizard (`pudim/setup.sh`) — verifica pré-requisitos
2. Criar tasks com SPEC + TASKS + VALIDATION (`/pudim-const`, `/pudim-iniciar`, `/pudim-tarefa-criar`)
3. Aprovar specs (`/pudim-tarefa-validar`)
4. Fechar tasks com evidência (`/pudim-tarefa-fechar`)
5. Visualizar board (`/pudim-status`)

---

## Direção Tecnológica

### Frontend
N/A — Pudim é orquestração de texto e arquivos, roda no terminal e chat de IA.

### Backend
- **Linguagem:** Bash (scripts)
- **IA:** GitHub Copilot (VS Code) e Claude Code
- **Armazenamento:** Markdown (.md) em Git
- **Workflows:** Prompts (`.prompt.md` e `.agent.md`)

---

## Padrões de Implementação para Agentes

- **Entregar vertical slices:** Cada task deve incluir código + docs + testes de uma vez.
- **Documentação obrigatória:** Atualizar README.md + COMMANDS.md + CARTILHA.md após qualquer feature.
- **Compatibilidade:** Verificar se o comando funciona em Copilot e Claude antes de aprovar.
- **Evidência antes de fechar:** Sempre pedir proof-of-concept ou teste manual.
- **Clareza na linguagem:** PT-BR, direto ao ponto, sem jargão técnico desnecessário.
- **Comandos read-only:** `/pudim-status` e `/pudim-status TASK-XYZ` são APENAS LEITURA. Nenhuma edição é permitida. Violação = falha crítica.

---

## Prioridade de Entrega

1. ✅ TASK-001 — Harness leve de validação do fluxo
2. ✅ TASK-002 — `/pudim-status` com argumento (concluso)
3. (Próximas tasks — a definir)

---

## Fora de Escopo Inicial

- UI gráfica ou integração web
- Suporte a múltiplos repositórios remotos
- Versionamento de specs (1 spec per task, sem histórico)
- APIs externas ou webhooks
- Integração com Jira, Linear ou outros ferramentais

---

## Critérios de Qualidade

- ✅ Sem erros de sintaxe (shell, markdown, prompt)
- ✅ Todas as palavras-chave funcionais testadas (ex: `/pudim-status`, `/pudim-tarefa-criar`)
- ✅ Documentação sincronizada (README.md + COMMANDS.md + CARTILHA.md + código)
- ✅ Compatibilidade testada (Copilot + Claude Code)
- ✅ Todas as tasks têm SPEC aprovada, TASKS executadas e VALIDATION com evidências
