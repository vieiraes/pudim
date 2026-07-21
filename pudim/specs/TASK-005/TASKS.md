# TASKS - TASK-005

## Resumo

- Task principal: TASK-005
- Objetivo curto: Redesenhar o logo do Pudim (flat/moderno) e usá-lo localmente nos READMEs.

## Backlog executavel

- [x] SUB-001 | Redesenhar pudim-icon.svg (flat/geometrico, paleta caramelo, sem texto) | Depende de: -
- [x] SUB-002 | Renderizar e revisar visualmente em 512px e em tamanhos de favicon (16-128px) | Depende de: SUB-001
- [x] SUB-003 | Trocar URL externa do flaticon pelo SVG local em README.md e pudim/README.md | Depende de: SUB-002
- [x] SUB-004 | Validar CA-01 a CA-03 e preencher VALIDATION.md com evidência real | Depende de: SUB-002, SUB-003

## Ordem sugerida

1. SUB-001
2. SUB-002
3. SUB-003
4. SUB-004

## Evidencias por subtask

- SUB-001: `pudim/assets/pudim-icon.svg` redesenhado — apenas `<rect>`, `<ellipse>` e `<path>` com fills sólidos, sem `<linearGradient>`/`<radialGradient>`, sem `<text>`.
- SUB-002: renderizado via `chromium-browser --headless --screenshot` em 512px e reamostrado (PIL) em 128/64/48/32/16px; revisado visualmente — corrigido um artefato onde a face lateral direita ultrapassava o contorno do topo de caramelo (ajuste de coordenadas do path).
- SUB-003: `README.md` e `pudim/README.md`, tag `<img>`, `src` trocado da URL do flaticon para `pudim/assets/pudim-icon.svg`.
- SUB-004: `pudim/specs/TASK-005/VALIDATION.md` preenchido com evidência real por CA.

---

**Pudim-Spec:** v0.3.2
