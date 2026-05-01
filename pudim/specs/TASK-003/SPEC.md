# SPEC — TASK-003

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-003 |
| Título | Incrementar contexto no comando /pudim-status |
| Autor | vieiraes |
| Data | 2026-05-01 |

---

## Objetivo

Incrementar o comando `/pudim-status` para exibir tambem o contexto da task nao finalizada prioritaria, facilitando a retomada do projeto.

## Problema

O comando de status hoje exige uma variacao extra para retomada; queremos que o proprio status ja mostre a task nao finalizada prioritaria e seu contexto.

## O que está dentro do escopo

- Exibir no `/pudim-status` o contexto da task nao finalizada prioritaria.
- Definir regra objetiva de priorizacao para a task ativa mostrada no status.

## O que está fora do escopo

- Criar um novo comando para retomada.
- Automatizacoes por hook ou alteracoes no setup.

## Critérios de Aceite

> O que precisa ser verdade para considerar essa task concluída?

- [ ] CA-01: `/pudim-status` sem argumento continua exibindo o board inteiro e inclui, ao final, um bloco resumido da task não finalizada prioritária.
- [ ] CA-02: A task prioritária é escolhida por regra explícita e documentada nesta ordem: task em andamento com SPEC não aprovada, task em andamento com SPEC aprovada, próxima task desbloqueada sem spec pack.
- [ ] CA-03: O bloco de contexto exibe pelo menos ID, título, coluna atual e próxima ação sugerida da task priorizada.
- [ ] CA-04: `/pudim-status TASK-XYZ` continua funcionando sem regressão no comportamento da task específica.
- [ ] CA-05: A documentação do comando é atualizada para refletir que o contexto agora faz parte do status padrão.

## Impacto técnico

_Quais partes do sistema são afetadas? (deixe em branco o que não se aplica)_

- Frontend: não aplicável
- Backend: prompt `.github/prompts/pudim-status.prompt.md`
- Banco de dados: não aplicável
- Integrações: GitHub Copilot e Claude Code

## Dependências

- Esta task depende de: -
- Esta task bloqueia: futuras melhorias de retomada do projeto

## Riscos

- Risco: a priorização automática escolher uma task diferente da expectativa do usuário.
- Como mitigar: documentar a ordem de prioridade e exibir claramente o critério usado na sugestão.

- Risco: o status padrão ficar mais longo e perder legibilidade.
- Como mitigar: limitar o bloco de contexto a um resumo curto com no máximo uma task priorizada.

## Decisão

- Aprovado por: Copilot
- Data: 2026-05-01

---

**Pudim-Spec:** v0.3.2