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
  - Evidência: `.github/prompts/pudim-status.prompt.md` linha 17 (seção **Input**) declara que, sem argumento, o padrão exibe "o board inteiro com todas as colunas e, ao final, o contexto da task prioritária". O exemplo de saída em "Formato de saída — Board inteiro" (linhas 94-98) mostra o bloco `🧭 CONTEXTO DA TASK PRIORITARIA` após "PRÓXIMO PASSO SUGERIDO". A regra de exibição correspondente está nas linhas 166-167.
- [x] CA-02: A task prioritária é escolhida por regra explícita e documentada nesta ordem: task em andamento com SPEC não aprovada, task em andamento com SPEC aprovada, próxima task desbloqueada sem spec pack.
  - Evidência: seção **Determinação da task prioritária** em `.github/prompts/pudim-status.prompt.md` (linhas 29-36) lista exatamente essa ordem em 4 passos numerados (os 3 pedidos pela SPEC + o caso "tudo concluído/bloqueado").
  - Ressalva: a SPEC não define desempate entre múltiplas tasks no mesmo passo da ordem; o prompt resolve isso adotando "a primeira encontrada na ordem do STATUS.md" (linha 34). Registrado aqui por transparência, não bloqueia o CA.
- [x] CA-03: O bloco de contexto exibe pelo menos ID, título, coluna atual e próxima ação sugerida da task priorizada.
  - Evidência: `.github/prompts/pudim-status.prompt.md` linhas 38-45 exigem exatamente os 4 campos (ID, Título, Coluna atual, Próxima ação sugerida) com regra de qual ação sugerir conforme o estado da task. Os exemplos de saída (linhas 94-98 e 108-112) mostram os 4 campos preenchidos.
- [x] CA-04: `/pudim-status TASK-XYZ` continua funcionando sem regressão no comportamento da task específica.
  - Evidência: a seção "Formato de saída — Task específica (com argumento TASK-XYZ)" (linhas 118-151) e a seção "Regras de exibição > Task específica" (linhas 175-184) não foram alteradas em relação à versão da TASK-002 — apenas o texto de "Input" (linha 15) e "Validação do argumento" (linhas 21-27) foi ajustado para acomodar o novo argumento `CONTEXTO`, sem remover ou mudar a lógica de `TASK-XYZ`.
- [x] CA-05: A documentação do comando é atualizada para refletir que o contexto agora faz parte do status padrão.
  - Evidência: `pudim/COMMANDS.md` — seção `/pudim-status` reescrita: descrição menciona "já inclui o contexto da task não finalizada prioritária", exemplo de uso com `CONTEXTO`, exemplo de saída com o bloco de contexto, e explicação da ordem de priorização; a linha da tabela "Resumo rápido" também foi atualizada. `pudim/CARTILHA.md` — tabela de comandos ganhou a linha `/pudim-status CONTEXTO` e a linha de `/pudim-status` menciona o contexto embutido.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável (mudança em prompt/documentação, não em código executável) |
| Integração | `./pudim/validate-project.sh` executado após a mudança: 0 erros, 0 avisos (TASK-003 passou a ser referenciada no STATUS.md, eliminando o aviso de "spec pack órfão" da execução anterior) |
| Manual | Revisão por inspeção de `.github/prompts/pudim-status.prompt.md`, `pudim/COMMANDS.md` e `pudim/CARTILHA.md`, comparando cada trecho citado nas evidências acima com o conteúdo real dos arquivos |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| Validação anterior desta task havia sido marcada `Passed` citando conteúdo que não existia nos arquivos (nenhuma mudança de prompt/doc havia sido feita, e `STATUS.md` nunca foi atualizado) | Alta | Corrigido nesta rodada: task reaberta, implementação feita de fato, evidências revalidadas por inspeção linha a linha |

## Conclusão

- Resultado final: Todos os critérios de aceite (CA-01 a CA-05) atendidos com evidência verificável nos arquivos reais do repositório.
- Pendências abertas: Nenhuma. Teste manual real dentro de uma sessão de Copilot/Claude Code (executando `/pudim-status` de fato) continua como melhoria opcional de confiança operacional, já que o comando é um prompt interpretado pela IA, não um script determinístico.
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
