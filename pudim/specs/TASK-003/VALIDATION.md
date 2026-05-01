# VALIDATION — TASK-003

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-003 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: `/pudim-status` sem argumento continua exibindo o board inteiro e inclui, ao final, um bloco resumido da task não finalizada prioritária.
  - Evidência: Em `.github/prompts/pudim-status.prompt.md`, a seção **Input** define que, sem argumento, o comando exibe "o board inteiro com todas as colunas e o contexto da task prioritária". A seção **Formato de saída - Board inteiro** inclui explicitamente o bloco `🧭 CONTEXTO DA TASK PRIORITARIA` após o board.
- [x] CA-02: A task prioritária é escolhida por regra explícita e documentada nesta ordem: task em andamento com SPEC não aprovada, task em andamento com SPEC aprovada, próxima task desbloqueada sem spec pack.
  - Evidência: Em `.github/prompts/pudim-status.prompt.md`, a seção **Determinacao da task prioritaria** documenta exatamente essa ordem em 3 passos numerados, antes do caso final "se todas estiverem concluídas".
- [x] CA-03: O bloco de contexto exibe pelo menos ID, título, coluna atual e próxima ação sugerida da task priorizada.
  - Evidência: Em `.github/prompts/pudim-status.prompt.md`, a seção **Para a task prioritaria, monte um resumo curto com** exige `ID`, `Titulo`, `Coluna atual` e `Proxima acao sugerida`. O exemplo de saída do board também mostra esses campos no bloco `CONTEXTO DA TASK PRIORITARIA`.
- [x] CA-04: `/pudim-status TASK-XYZ` continua funcionando sem regressão no comportamento da task específica.
  - Evidência: Em `.github/prompts/pudim-status.prompt.md`, a seção **Input** preserva o argumento opcional `TASK-XYZ`; a seção **Formato de saida - Task especifica (com argumento TASK-XYZ)** permanece definida com layout completo; e a seção **Task específica (com argumento TASK-XYZ)** mantém as regras de leitura de `STATUS.md`, `SPEC.md` e `VALIDATION.md`.
- [x] CA-05: A documentação do comando é atualizada para refletir que o contexto agora faz parte do status padrão.
  - Evidência: Em `pudim/COMMANDS.md`, a descrição de `/pudim-status` agora diz que no modo padrão ele "já inclui o contexto da task não finalizada prioritária". Em `pudim/CARTILHA.md`, o comando `/pudim-status` segue documentado como forma de checar o board, alinhado ao fluxo atualizado.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [ ] Testes passando
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável para esta mudança documental/prompt |
| Integração | Não aplicável |
| Manual | Revisão por inspeção dos arquivos `.github/prompts/pudim-status.prompt.md`, `pudim/COMMANDS.md`, `pudim/CARTILHA.md` e `pudim/specs/TASK-003/TASKS.md` confirmando atendimento dos CA-01 a CA-05 |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| Nenhum identificado nesta validação por inspeção | - | - |

## Conclusão

- Resultado final: Evidências registradas para CA-01 a CA-05 com base na especificação do prompt e na documentação atualizada.
- Pendências abertas: Nenhuma para fechamento desta task. Validação manual em sessão real continua como melhoria opcional de confiança operacional.
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2