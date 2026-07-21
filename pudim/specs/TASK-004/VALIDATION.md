# VALIDATION — TASK-004

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-004 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: `/pudim-tarefa-fechar` contra uma task com SPEC `Draft`/`In Progress` bloqueia explicitamente, sem alterar STATUS.md/VALIDATION.md.
  - Evidência: `.github/prompts/pudim-tarefa-fechar.prompt.md`, passo 1, instrui ler `> **Status:**` do SPEC.md e, se diferente de `Approved`, "parar aqui", sem avaliar critérios nem tocar VALIDATION.md/STATUS.md. Simulado manualmente: criei um SPEC.md de teste (`TASK-DRAFT-TEST`) com `Status: Draft` + um VALIDATION.md válido; aplicando o prompt passo a passo, o passo 0 passa (ambos arquivos existem), o passo 1 lê `Draft`, compara com `Approved`, não bate, e o fluxo para — nenhuma alteração seria feita nos arquivos de teste. Consistente com o texto do prompt.
- [x] CA-02: `/pudim-tarefa-fechar` contra uma task com SPEC já Approved e VALIDATION com todos os CAs evidenciados continua fechando normalmente — sem regressão.
  - Evidência: `grep -m1 "Status:" pudim/specs/TASK-00{1,2,3,4}/SPEC.md` confirma `Approved` nas 4 tasks existentes. Os passos 2-5 do prompt (comparar critérios, tabela de resultado, atualizar VALIDATION/STATUS) não foram alterados nesta mudança — apenas precedidos pelos novos passos 0 e 1, que para essas 4 tasks resolvem como "continuar" sem bloquear.
- [x] CA-03: `taskId` cuja pasta `pudim/specs/TASK-XYZ/` não existe produz erro claro, não comportamento indefinido.
  - Evidência: passo 0 do prompt cobre isso ("Verifique se `pudim/specs/${taskId}/SPEC.md` e `.../VALIDATION.md` existem... Se algum dos dois não existir: pare aqui. Informe qual arquivo falta..."). Confirmado com `ls pudim/specs/TASK-999` que a pasta realmente não existe neste repo hoje, cenário real que o passo 0 cobre.
- [x] CA-04: `pudim/COMMANDS.md` e `pudim/WORKFLOW.md` documentam a checagem como precondição obrigatória.
  - Evidência: `pudim/COMMANDS.md`, seção `/pudim-tarefa-fechar`, passos 1-2 da lista "O agente vai" agora citam a checagem de arquivos e de `Status: Approved`, e o aviso final foi atualizado para "task só fecha se a SPEC estiver Approved...". `pudim/WORKFLOW.md`, Etapa 4 — VALIDATION, ganhou o parágrafo "Pré-condição obrigatória" e o "Gate de saída" passou a citar `SPEC com Status: Approved` além de VALIDATION Passed e STATUS.md atualizado.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável (mudança em prompt/documentação, não em código executável) |
| Integração | `./pudim/validate-project.sh` executado após a mudança: 0 erros, 0 avisos, TASK-004 reconhecida e referenciada no STATUS.md |
| Manual | Simulação passo a passo do prompt atualizado contra um SPEC.md de teste com `Status: Draft` (criado e removido em `/tmp` durante a validação, não faz parte do repo) confirmando que o fluxo para no passo 1 sem tocar VALIDATION/STATUS; leitura literal de `pudim-tarefa-fechar.prompt.md`, `pudim/COMMANDS.md` e `pudim/WORKFLOW.md` confirmando as mudanças descritas acima |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| `/pudim-tarefa-fechar` não verificava `SPEC.md` estar `Approved` antes de fechar uma task (achado original que motivou esta task) | Alta | Corrigido nesta rodada |

## Conclusão

- Resultado final: Todos os critérios de aceite (CA-01 a CA-04) atendidos com evidência verificável nos arquivos reais do repositório e em simulação manual do fluxo do prompt.
- Pendências abertas: Teste manual real dentro de uma sessão de Copilot/Claude Code (invocando `/pudim-tarefa-fechar` de fato) continua como melhoria opcional de confiança operacional, já que o comando é um prompt interpretado pela IA, não um script determinístico. O gap equivalente em `/pudim-tarefa-validar.prompt.md` (arquivo ausente) ficou fora de escopo, conforme a SPEC.
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
