# README da SPEC (Pudim)

Autor: Bruno Vieira (vieira.es@gmail.com)

Este documento define o padrao de escrita das SPECs no framework Pudim SDD.

## Objetivo

Padronizar como cada task e especificada antes da implementacao, garantindo:
- escopo claro
- criterios de aceite verificaveis
- validacao com evidencia

## Estrutura por task

Para cada task do STATUS, use esta pasta:
- pudim/specs/TASK-XYZ/

Arquivos obrigatorios:
- SPEC.md
- TASKS.md
- VALIDATION.md

## Como preencher a SPEC

1. Defina o objetivo em 1 ou 2 frases.
2. Liste in-scope e out-of-scope sem ambiguidade.
3. Escreva de 3 a 5 criterios de aceite testaveis.
4. Registre riscos e mitigacoes.
5. Relacione impacto tecnico em frontend, backend e dados.

## Regras de aprovacao

- Nenhuma implementacao comeca sem SPEC aprovada.
- Toda task deve ter TASKS com dependencias explicitas.
- Toda task deve fechar com VALIDATION preenchido e evidencias.

## Modelo de ciclo SDD

SPEC -> TASKS -> BUILD -> VALIDATION -> STATUS

## Exemplo de pasta

- pudim/specs/TASK-001/SPEC.md
- pudim/specs/TASK-001/TASKS.md
- pudim/specs/TASK-001/VALIDATION.md

## Checklist rapido

- [ ] Objetivo claro
- [ ] Escopo minimo definido
- [ ] Criterios de aceite testaveis
- [ ] Riscos mapeados
- [ ] Validacao com evidencias
