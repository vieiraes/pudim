# Pudim

Framework simples de Spec-Driven Development para usar com GitHub Copilot e Claude Code.

## O que é

O Pudim organiza o trabalho em um fluxo claro:

`CONST -> SPEC -> TASKS -> BUILD -> VALIDATION`

Ele foi feito para reduzir retrabalho, deixar o escopo explícito e ajudar times pequenos ou devs solo a trabalhar com IA de forma mais previsível.

## Estrutura principal

- `pudim/`: documentação, templates e utilitários do framework
- `.github/`: prompts, skills e agents para uso com Copilot
- `lavajato/`: projeto de teste usado para validar o fluxo do framework

## Como começar

1. Leia `pudim/CARTILHA.md`
2. Rode `./pudim/setup.sh`
3. Use `/pudim-const`
4. Registre a primeira tarefa com `/pudim-tarefa-registrar` ou `/pudim-iniciar`

## Licença

Este projeto usa a licença MIT.

Copyright (c) 2026 Bruno Vieira
