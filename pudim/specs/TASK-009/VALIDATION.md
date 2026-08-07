# VALIDATION — TASK-009

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-009 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: setup.sh não aborta sem TERM.
  - Evidência: `print_header` agora usa `clear 2>/dev/null || true` (`setup.sh`). Repro isolado sob
    `set -e` sem TERM passou. Teste real: `env -u TERM bash pudim/setup.sh` no projeto demo rodou
    os 9 passos e terminou com "Tudo certo!" (exit 0). Antes do fix, saía com exit 1 na 1ª tela
    (`TERM environment variable not set.`).
- [x] CA-02: INSTALL.md instrui limpar pudim/specs/ herdados.
  - Evidência: `pudim/INSTALL.md` ganhou bloco `rm -rf pudim/specs/TASK-*` nas duas opções
    (Copilot e Claude) + item no checklist. Aplicado no re-teste: após copiar `pudim/`, limpei os
    specs e sobrou só `pudim/specs/README.md`.
- [x] CA-03: /pudim-const aceita linguagem leiga; IA propõe stack.
  - Evidência: `pudim-const.prompt.md` — bloco "O público é o dev iniciante… traduza a intenção em
    decisão técnica… proponha uma opção simples, explique e confirme"; pergunta 3 reescrita (saiu o
    exemplo "TypeScript + Next.js + Postgres"; entrou "me conte só que tipo de coisa é… que eu
    sugiro uma stack simples e explico") + nota de inferência; Parte 2 mostra a stack proposta na
    ratificação.
- [x] CA-04: re-teste com persona júnior gera CONST coerente sem jargão do usuário.
  - Evidência: diálogo simulado com respostas de júnior ("mando um link pro meu amigo e a gente
    joga", "é tipo um site que a gente abre no navegador"). A IA propôs "JavaScript + Node" e
    explicou; o usuário nunca nomeou tecnologia. `/tmp/pudim-demo-junior/CONST.md` gravado com a
    stack **proposta pela IA** (JS+Node, sem banco) e a regra inegociável traduzida ("o servidor
    decide as jogadas — o navegador não pode trapacear").
- [x] CA-05: validate-project.sh 0/0; docs sincronizados.
  - Evidência: harness 0 erros/0 avisos tanto no projeto demo júnior (board vazio + CONST) quanto
    no framework (com TASK-009 registrada). Docs sincronizados: `pudim/COMMANDS.md` e
    `pudim/CARTILHA.md` agora dizem "você não precisa saber tecnologia… a IA propõe a stack".

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando (harness 0/0 em dois projetos; setup.sh roda com e sem TERM)
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável) — N/A (script/prompt/docs)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | N/A |
| Integração | `env -u TERM bash pudim/setup.sh` → exit 0, 9 passos; `validate-project.sh` → 0/0 (demo júnior e framework) |
| Manual | Dry-run do `/pudim-const` com persona júnior → CONST coerente com stack proposta pela IA |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| setup.sh abortava sem TERM (clear + set -e) | Média | Corrigido (`clear 2>/dev/null || true`) |
| Instalador herdava pudim/specs/TASK-* do framework | Baixa | Corrigido via doc (INSTALL.md instrui limpar) |

## Conclusão

- Resultado final: Passed — 5 CAs com evidência real, provados por execução em projetos demo.
- Pendências abertas: fix do instalador é doc-only (setup.sh não auto-limpa specs — decisão do owner).
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
