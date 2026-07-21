# SPEC — TASK-005

> **Status:** Approved

| Campo | Valor |
|---|---|
| Task | TASK-005 |
| Título | Novo logo/brand do Pudim (SVG moderno e minimalista) |
| Autor | Claude Code |
| Data | 2026-07-20 |

---

## Objetivo

Substituir o mark visual do Pudim (`pudim/assets/pudim-icon.svg`, considerado feio) por um logo
moderno, flat/geométrico e minimalista, e usá-lo localmente nos lugares que hoje dependem de uma
imagem externa.

## Problema

O `pudim-icon.svg` atual usa gradientes pesados, texto serifado embutido e detalhes (3 caldas
escorrendo, prato de duplo gradiente) que não escalam bem para tamanhos pequenos (favicon) e não
têm acabamento moderno. Além disso, `README.md` e `pudim/README.md` referenciam um logo via URL
externa (`cdn-icons-png.flaticon.com`), criando dependência de rede para exibir a marca do
próprio projeto — o SVG local existe mas não é usado.

## O que está dentro do escopo

- Redesenhar `pudim/assets/pudim-icon.svg`: flat/geométrico, paleta caramelo já estabelecida
  (`#F5D27A`/`#E8A930`/`#C4550A` e tons próximos), sem gradientes pesados, sem texto serifado
  embutido, legível como favicon (16px) até tamanho grande (512px).
- Trocar a referência de logo em `README.md` e `pudim/README.md`: sair da URL externa do
  flaticon e usar o SVG local.

## O que está fora do escopo

- Construção do portal visual (Fases 2 e 3 — TASK-006/TASK-007).
- Qualquer mudança em prompts, scripts ou fluxo SDD.
- Gerar variações de favicon em outros formatos (`.ico`, PNG multi-resolução) — fica só o SVG.

## Critérios de Aceite

> O que precisa ser verdade para considerar essa task concluída?

- [ ] CA-01: o novo `pudim-icon.svg` é flat/geométrico (sem gradientes, sem texto), usa a paleta
  caramelo do mark anterior, e permanece reconhecível como um pudim (corpo, calda de caramelo,
  prato) tanto em 512px quanto reduzido para tamanho de favicon (~16-32px).
- [ ] CA-02: `README.md` e `pudim/README.md` referenciam o SVG local
  (`pudim/assets/pudim-icon.svg`), sem depender de URL externa para exibir o logo.
- [ ] CA-03: o arquivo SVG é XML válido (sem tags quebradas) e não introduz nenhuma dependência
  de rede (sem `<image>`/`href` remoto, sem `@import`).

## Impacto técnico

- Frontend: não aplicável (ainda não existe portal — isso é o asset base para ele)
- Backend: `pudim/assets/pudim-icon.svg`, `README.md`, `pudim/README.md`
- Banco de dados: não aplicável
- Integrações: nenhuma

## Dependências

- Esta task depende de: -
- Esta task bloqueia: TASK-006 (portal usa este mark como branding)

## Riscos

- Risco: o novo design não ser do agrado do usuário na primeira tentativa.
- Como mitigar: renderizar e revisar visualmente (screenshot) antes de considerar concluído,
  ajustando antes de fechar a task.

## Decisão

- Aprovado por: Bruno Vieira (aprovação do plano de execução em fases nesta sessão)
- Data: 2026-07-20

---

**Pudim-Spec:** v0.3.2
