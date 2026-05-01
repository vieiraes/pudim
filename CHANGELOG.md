# Changelog

Todas as mudancas relevantes do Pudim ficam registradas neste arquivo.

Este projeto segue versionamento semantico:
- MAJOR: quebra de compatibilidade
- MINOR: nova funcionalidade sem quebra
- PATCH: correcao sem mudanca de comportamento esperado

## Roteiro rapido de release

1. Revise as mudancas em `Unreleased`.
2. Escolha o bump da versao (PATCH, MINOR ou MAJOR).
3. Atualize `pudim/VERSION` com a nova versao.
4. Crie a secao da versao no changelog com data e itens Added/Changed/Fixed.
5. Esvazie `Unreleased` para iniciar o proximo ciclo.
6. Publique com commit final e envio para a branch.

## [Unreleased]

Sem mudancas no momento.

## [0.3.2] - 2026-04-30

### Added
- Arquivo central de versao em [pudim/VERSION](pudim/VERSION).
- Exibicao da versao do Pudim no wizard de setup e no instalador de hooks.
- Rodape de versao `Pudim-Spec` nos templates de SPEC, TASKS e VALIDATION.
- Regra no prompt de criacao de task para substituir `{{PUDIM_VERSION}}` usando [pudim/VERSION](pudim/VERSION).

### Changed
- Fluxo de release definido: nova versao e declarada no momento de publicacao (commit + envio para branch), nao a cada commit intermediario.
- Regra operacional: sempre que houver pedido explicito para commit + envio para branch, a release correspondente deve ser registrada no changelog na mesma entrega.
