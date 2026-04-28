# SPEC — TASK-001

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-001 |
| Título | Harness leve de validação do fluxo Pudim SDD |
| Autor | vieiraes |
| Data | 2026-04-28 |

---

## Objetivo

Criar um harness de validação de processo leve que detecte erros críticos no fluxo Pudim SDD antes do commit, sem travar a produtividade do time.

## Problema

O fluxo Pudim SDD depende de consistência manual entre STATUS.md, spec packs e VALIDATION. Sem checagem automática, erros de processo (task sem spec, dependência inválida, critério sem evidência) só são descobertos no fechamento da task, gerando retrabalho.

## O que está dentro do escopo

- Script central de validação estrutural do projeto (`pudim/validate-project.sh`)
- Verificação de consistência entre STATUS.md e `pudim/specs/TASK-XYZ/`
- Verificação de presença de SPEC.md, TASKS.md e VALIDATION.md por task
- Verificação de alinhamento de critérios de aceite entre SPEC e VALIDATION
- Hook pre-commit leve que executa validação rápida (bloqueia apenas erros críticos)
- Instalador do hook (`pudim/install-hooks.sh`)
- Integração da validação no final do `pudim/setup.sh`
- Reforço de gate em `pudim-tarefa-criar.prompt.md`

## O que está fora do escopo

- Testes de performance ou de runtime do produto final
- Validações de regras de negócio fora do fluxo Pudim
- CI/CD remoto (GitHub Actions)
- Geração automática de evidências de teste

## Critérios de Aceite

- [ ] CA-01: `pudim/validate-project.sh` detecta task em STATUS.md sem pasta `pudim/specs/TASK-XYZ/` e exibe erro crítico com identificação da task.
- [ ] CA-02: `pudim/validate-project.sh` detecta dependência inválida em STATUS.md (referência a task inexistente) e exibe erro crítico.
- [ ] CA-03: `pudim/validate-project.sh` detecta spec pack incompleto (faltando SPEC.md, TASKS.md ou VALIDATION.md) e exibe erro crítico.
- [ ] CA-04: `pudim/validate-project.sh` detecta mismatch entre critérios de aceite em SPEC e VALIDATION e exibe warning acionável.
- [ ] CA-05: Hook pre-commit bloqueia commit apenas quando há erros críticos; warnings não bloqueiam.
- [ ] CA-06: `pudim/setup.sh` exibe resumo de validação (PASS/FAIL por check) ao final do onboarding.
- [ ] CA-07: `pudim-tarefa-criar.prompt.md` verifica se task já existe no STATUS.md antes de criar spec pack.

## Impacto técnico

- Frontend: não aplicável
- Backend: não aplicável
- Banco de dados: não aplicável
- Integrações: hook git local, pudim/setup.sh, prompts do Copilot

## Dependências

- Esta task depende de: -
- Esta task bloqueia: -

## Riscos

- Risco: hook pre-commit muito restritivo gera fricção e equipe desabilita.
- Como mitigar: bloquear somente erros críticos (CA-01, CA-02, CA-03); demais checks são apenas warnings.

## Decisão

- Aprovado por: vieiraes
- Data: 2026-04-28
