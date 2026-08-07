# VALIDATION — TASK-008

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-008 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: 6 perguntas socráticas, uma por vez.
  - Evidência: `pudim-const.prompt.md` tem exatamente 6 perguntas numeradas
    (`grep -cE '^> "[1-6]\.'` = 6), cada uma seguida de `Aguarde. Depois:`. O conjunto é
    socrático: Q2 = definição de sucesso ("o que vai estar funcionando que hoje não funciona?"),
    Q4 = anti-escopo, Q5 = regra inegociável — não trivia. Guardrail anti-interrogatório
    ("no máximo um 'por quê?'") no bloco de abertura do prompt.
- [x] CA-02: proposta de ratificação no chat + gravação só após aceite.
  - Evidência: `pudim-const.prompt.md` "Parte 2 — Plano de Ação" (L55) manda `**NÃO grave o
    arquivo ainda**`, apresentar "Plano de Ação — Proposta de Constituição" no chat e perguntar
    "você **aceita** … ou quer **contestar/ajustar**"; loop "Repita até ele aceitar" (L70);
    Parte 3 (gravar) só começa "Com o Plano de Ação ratificado".
- [x] CA-03: nenhum arquivo novo de inception (só CONST.md).
  - Evidência: regra explícita no prompt (L93): "Não crie nenhum outro arquivo de inception — o
    Plano de Ação vive no chat; o único artefato persistido é o CONST.md."
- [x] CA-04: consulta ao CONST em tarefa-criar e tarefa-validar.
  - Evidência: `pudim-tarefa-criar.prompt.md:20` — passo 2 do gate de pré-condições "Consulte a
    constituição … leia `CONST.md` … se houver conflito, sinalize e peça confirmação explícita".
    `pudim-tarefa-validar.prompt.md:21` — item 2.1 "Coerência com a constituição" + nova linha
    "Coerência com CONST.md" na tabela de resultado (L35). Ambos com fallback "se `CONST.md` não
    existir, siga/N/A" (não quebra projeto sem CONST).
- [x] CA-05: coerência do cap de linhas em todos os pontos.
  - Evidência (no fechamento): cap unificado em 60 no template, prompt, `setup.sh` e WORKFLOW.
  - ~~Cap numérico de 60 linhas~~ **Emenda (2026-07-21, pós-fechamento):** a pedido do owner, a
    **regra de contagem de linhas foi removida por completo** — não há mais cap numérico em lugar
    nenhum. Saiu do template (`CONST.md:4` agora "curto e direto, sem firulas"), do prompt
    (`pudim-const.prompt.md` Parte 3 e Regras), do `setup.sh` (bloco `wc -l`/warn removido) e do
    `WORKFLOW.md:38`. Também alinhei a menção obsoleta no `CONST.md` da raiz. Guardrail passa a ser
    só qualitativo. `grep -rniE "[0-9]+ linhas|-gt (50|60)"` não retorna cap ativo (só referências
    históricas neste spec pack). `validate-project.sh` segue 0/0.
- [x] CA-06: README/COMMANDS/CARTILHA/WORKFLOW sincronizados; status read-only; compat mantida.
  - Evidência: editados `README.md:134`, `pudim/COMMANDS.md:12-24`, `pudim/CARTILHA.md:308,323`,
    `pudim/WORKFLOW.md:23-40` e o manual do Portal `portal/public/index.html:254` para descrever
    perguntas socráticas + Plano de Ação + consulta downstream. `pudim-status.prompt.md` não foi
    tocado (`git diff --stat` vazio) — segue read-only. Frontmatter do `pudim-const` continua
    `agent: agent` e o nome do comando não mudou (sem rename `/pd-*`) → compat Copilot/Claude e
    retroativa preservadas.
- [x] CA-07: validate-project.sh 0/0; sem gate duro novo.
  - Evidência: `./pudim/validate-project.sh` → "Erros críticos: 0 / Avisos: 0" com a TASK-008 já
    no board (exit 0). Nenhuma checagem de CONST foi adicionada ao script — a governança é soft,
    no nível do prompt, para não quebrar projetos com CONST em branco.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando (validate-project.sh 0/0)
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável) — N/A (só prompts/docs/template)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | N/A (mudanças em prompts/docs/template) |
| Integração | `./pudim/validate-project.sh` → 0 erros / 0 avisos (exit 0) |
| Manual | Dry-run textual do fluxo do prompt + greps de consistência (6 perguntas, ratificação, cap 60, consulta ao CONST nos 2 gates) |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| Template CONST inicial ficou com 62 linhas (acima do novo cap 60) | Baixa | Corrigido — removidos separadores decorativos redundantes, agora 56 linhas |

## Conclusão

- Resultado final: Passed — todos os 7 CAs com evidência real.
- Pendências abertas: `CONST.md` da raiz continua **em branco** (constituição do próprio repo
  nunca preenchida) — território de governança, sinalizado. A menção obsoleta a "50 linhas" nele
  foi alinhada na emenda de remoção do cap.
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
