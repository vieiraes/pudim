# SPEC — TASK-002

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-002 |
| Título | Permitir `/pudim-status` com argumento para task específica |
| Autor | Dev Team |
| Data | 2026-04-30 |

---

## Objetivo

Estender o comando `/pudim-status` para aceitar um argumento opcional (TASK-XYZ) e exibir apenas o status daquela task específica, mesmo que já tenha sido concluída.

## Problema

Atualmente `/pudim-status` só mostra o board inteiro. Devs que querem conferir o status de uma task específica (especialmente as já finalizadas) precisam abrir manualmente os arquivos ou rodar grep no terminal, afastando do fluxo do framework.

## O que está dentro do escopo

- Estender o prompt `/pudim-status` para aceitar argumento opcional `TASK-XYZ`
- Quando argumento é passado: exibir apenas aquela task (coluna, status da SPEC se aplicável, evidências resumidas)
- Quando sem argumento: continuar exibindo o board inteiro (comportamento atual)
- Suportar tasks concluídas (`[x]`) e em andamento (`[ ]`)
- Exibir dependências da task (bloqueadores)

## O que está fora do escopo

- Filtrar board por múltiplas tasks
- Exportar board em outros formatos
- Gráficos ou visualizações avançadas
- Alteração no comportamento padrão do board inteiro

## Critérios de Aceite

- [ ] CA-01: `/pudim-status TASK-001` exibe status específico de TASK-001 (concluída ou não)
- [ ] CA-02: `/pudim-status` sem argumento continua exibindo o board inteiro
- [ ] CA-03: Exibição mostra: ID, título, coluna (A Fazer/Em Andamento/Feito), status SPEC (se aplicável), dependências
- [ ] CA-04: Comando funciona no GitHub Copilot e Claude Code
- [ ] CA-05: Documentação atualizada em COMMANDS.md e CARTILHA.md

## Impacto técnico

- Frontend: N/A
- Backend: Prompt `/pudim-status` (pudim-status.prompt.md)
- Banco de dados: N/A
- Integrações: GitHub Copilot e Claude Code

## Dependências

- Esta task depende de: -
- Esta task bloqueia: -

## Riscos

- Risco: Argumento mal formatado gera confusão (ex: "TASK-001" vs "TASK-1")
  - Como mitigar: Validar formato do argumento e mostrar erro claro
- Risco: Task não encontrada no STATUS.md
  - Como mitigar: Mensagem clara informando que a task não existe e sugerir `/pudim-status` para ver todas

## Decisão

- Aprovado por: Copilot (Validação Automática)
- Data: 2026-04-30
