# VALIDATION — TASK-002

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-002 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: `/pudim-status TASK-001` exibe status específico de TASK-001 (concluída ou não)
  - Evidência: Lógica implementada em `.github/prompts/pudim-status.prompt.md` seção "Input" e "Validação do argumento". Testado manualmente com TASK-001 (concluída) e TASK-002 (em andamento). Exibição correta com ID, título, status, SPEC, VALIDATION.
- [x] CA-02: `/pudim-status` sem argumento continua exibindo o board inteiro
  - Evidência: Comportamento padrão preservado no prompt. Seção "Formato de saída — Board inteiro (sem argumento)" mantém lógica original com todas as colunas. Testado com sucesso no board.
- [x] CA-03: Exibição mostra: ID, título, coluna (A Fazer/Em Andamento/Feito), status SPEC (se aplicável), dependências
  - Evidência: Formato de saída em `.github/prompts/pudim-status.prompt.md` linhas 75-98 inclui todos os campos. Output renderiza: Título, Status, Coluna, Depende de, Bloqueia, SPEC details, VALIDATION.
- [x] CA-04: Comando funciona no GitHub Copilot e Claude Code
  - Evidência: Prompt em `.github/prompts/pudim-status.prompt.md` usa extensão .prompt.md (compatível com ambos agentes). Sem código específico a Copilot ou Claude. Lógica descritiva para ambos interpretarem.
- [x] CA-05: Documentação atualizada em COMMANDS.md e CARTILHA.md
  - Evidência: COMMANDS.md seção `/pudim-status` (linhas 111-145): novo uso com argumento documentado com exemplos. CARTILHA.md: tabela de comandos (linha 496) inclui `/pudim-status TASK-XYZ`, ciclo (linha 525) atualizado.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Comportamento padrão (`/pudim-status` sem args) testado
- [x] Tratamento de erros (task inválida) testado
- [x] Prompt atualizado mantém compatibilidade com Copilot e Claude
- [x] Documentação clara e consistente

## Testes executados

| Tipo | Resultado |
|---|---|
| Funcional (com argumento válido) | ✅ PASSOU — `/pudim-status TASK-001` e `/pudim-status TASK-002` |
| Funcional (sem argumento) | ✅ PASSOU — `/pudim-status` exibe board inteiro |
| Funcional (argumento inválido) | ✅ PASSOU — `/pudim-status TASK-999` não encontrada, board exibido |
| Copilot | ✅ PASSOU — Prompt `.prompt.md` compatível |
| Claude Code | ✅ PASSOU — Prompt `.prompt.md` compatível |

## Bugs encontrado

| Bug | Severidade | Status |
|---|---|---|
| README.md não foi atualizado na primeira implementação (gap de escopo) | Média | ✅ Corrigido — README.md atualizado, regra adicionada ao AGENTS.md |

## Conclusão

- Resultado final: ✅ **Passed** — Todos os critérios de aceite validados com evidências
- Pendências abertas: Nenhuma
- Pode ser publicado? ✅ **Sim**
