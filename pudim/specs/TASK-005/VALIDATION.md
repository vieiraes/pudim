# VALIDATION — TASK-005

> **Status:** Passed

| Campo | Valor |
|---|---|
| Task | TASK-005 |
| Spec | [SPEC.md](./SPEC.md) |
| Tasks | [TASKS.md](./TASKS.md) |

---

## Critérios de Aceite

_Copie os critérios da SPEC e registre a evidência de cada um._

- [x] CA-01: o novo `pudim-icon.svg` é flat/geométrico (sem gradientes, sem texto), usa a paleta caramelo do mark anterior, e permanece reconhecível como um pudim em 512px e em tamanho de favicon.
  - Evidência: `grep -c "linearGradient\|radialGradient\|<text" pudim/assets/pudim-icon.svg` → `0` (nenhuma ocorrência). O arquivo usa só `<rect>`, `<ellipse>` e `<path>` com fills sólidos (`#2A1200`, `#D9C7A0`, `#F2E8D2`, `#F0B84E`, `#DE9C2E`, `#9A4A0E`, `#6B2E06`, `#FFF3D6`), reaproveitando a paleta caramelo do mark anterior (`#F5D27A`/`#E8A930`/`#C4550A` — mesma família de tons). Renderizado via `chromium-browser --headless --screenshot` em 512px e reamostrado com PIL para 128/64/48/32/16px: nas capturas revisadas visualmente, o pudim (corpo, calda de caramelo com o "buraco" central característico, prato) permanece reconhecível em todos os tamanhos, incluindo 16px. Foi corrigido durante a revisão um artefato onde a face lateral direita (sombreamento) ultrapassava o contorno da elipse do topo, aparecendo como uma ponta solta — ajustado o path para começar em coordenadas dentro do contorno do topo (linha "Face lateral direita" do SVG).
- [x] CA-02: `README.md` e `pudim/README.md` referenciam o SVG local, sem depender de URL externa.
  - Evidência: `grep -rn "flaticon" README.md pudim/README.md` não retorna nenhuma ocorrência. `README.md` linha 4 agora usa `<img src="pudim/assets/pudim-icon.svg" .../>`; `pudim/README.md` linha 4 usa `<img src="assets/pudim-icon.svg" .../>` (caminho relativo correto a partir de `pudim/`).
- [x] CA-03: o arquivo SVG é XML válido e não introduz dependência de rede.
  - Evidência: `python3 -c "import xml.etree.ElementTree as ET; ET.parse('pudim/assets/pudim-icon.svg')"` executa sem erro ("XML valido"). `grep -nE "https?://" pudim/assets/pudim-icon.svg` retorna apenas a linha 1, que é o atributo padrão `xmlns="http://www.w3.org/2000/svg"` — um identificador de namespace XML exigido em todo SVG, não uma requisição de rede (nenhum navegador busca essa URL). Não há `<image href=...>` nem `@import` no arquivo.

## Checklist técnico

- [x] Nenhuma funcionalidade existente foi quebrada
- [x] Testes passando
- [x] Código revisado
- [x] Regras de acesso/segurança respeitadas (quando aplicável)

## Testes executados

| Tipo | Resultado |
|---|---|
| Unitário | Não aplicável (asset visual, não código executável) |
| Integração | `./pudim/validate-project.sh` executado após a mudança: 0 erros, 0 avisos |
| Manual | Renderização real do SVG via `chromium-browser --headless --screenshot` em 512px e reamostragem em 128/64/48/32/16px, revisada visualmente (screenshot lido e inspecionado); um artefato visual encontrado e corrigido nessa revisão (ver CA-01) |

## Bugs encontrados

| Bug | Severidade | Status |
|---|---|---|
| Sombreamento lateral direito do corpo ultrapassava o contorno do topo de caramelo, aparecendo como uma ponta solta no render | Baixa | Corrigido durante a própria validação, antes do fechamento |

## Conclusão

- Resultado final: Todos os critérios de aceite (CA-01 a CA-03) atendidos com evidência real (grep, parse XML e renderização visual inspecionada).
- Pendências abertas: Nenhuma. O SVG fica disponível como branding base para o portal (TASK-006).
- Pode ser publicado? Sim

---

**Pudim-Spec:** v0.3.2
