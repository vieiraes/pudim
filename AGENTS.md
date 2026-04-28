# AGENTS.md

## Objetivo do Produto

Construir um editor visual de Markdown com experiencia estilo WordPress (blocos editaveis, interacao por mouse e arrastar/soltar), reduzindo a necessidade de edicao manual no texto bruto.

## Regras de Produto (Sempre Seguir)

- Priorizar edicao por blocos com interacao visual direta.
- Toda funcionalidade de formatacao deve refletir no Markdown gerado.
- O preview deve permanecer sincronizado em tempo real com o conteudo.
- Recursos de insercao (links, imagens, listas, titulos) devem ser orientados por UI e nao por terminal.
- A estrutura exportada precisa manter Markdown limpo e interoperavel.

## Escopo Funcional Minimo

- Edicao visual de arquivos Markdown.
- Drag-and-drop de blocos.
- Formatacao de texto (negrito, italico, listas, headings, quotes e codigo).
- Insercao facilitada de links e imagens.
- Preview em tempo real.
- Atalhos de teclado essenciais.
- Exportacao/importacao de `.md`.

## Direcao Tecnologica

### Frontend

- Base: Vite.
- Framework: React (preferencial) ou Vue quando explicitamente solicitado.
- Drag-and-drop: `react-dnd` (React) ou `vue-draggable` (Vue).
- Parsing/renderizacao Markdown: `markdown-it` (preferencial) ou `marked`.
- Estado global: Redux Toolkit (React) ou Vuex/Pinia (Vue).
- Preparar para PWA apos fluxo principal de edicao estar estavel.

### Backend

- Supabase para autenticacao, banco e storage.
- BFF em monorepo para encapsular regras de dominio e evitar acoplamento direto com cliente.

### Supabase (obrigatorio considerar)

- Auth: usuarios, sessoes e permissoes por projeto.
- Database: armazenamento de documentos e metadados com RLS habilitado.
- Storage: ativos de midia (imagens e anexos).
- API: CRUD para documentos, blocos e historico de alteracoes.

## Padroes de Implementacao para Agentes

- Entregar vertical slices pequenos (UI + estado + persistencia da feature) em vez de blocos isolados.
- Antes de adicionar biblioteca, validar compatibilidade com Vite e manutencao ativa.
- Evitar lock-in prematuro de framework: manter componentes e contratos portaveis.
- Tratar acessibilidade basica desde o inicio (foco de teclado, labels e navegacao).
- Incluir testes nas partes criticas de parser, serializacao Markdown e ordenacao de blocos.

## Prioridade de Entrega

1. Estrutura basica do editor por blocos.
2. Drag-and-drop estavel com reordenacao previsivel.
3. Barra de formatacao e comandos rapidos.
4. Preview em tempo real confiavel.
5. Persistencia com Supabase.
6. Exportacao/importacao Markdown.
7. PWA e refinamentos de UX.

## Fora de Escopo Inicial

- Colaboracao em tempo real multiusuario.
- Sistema complexo de plugins.
- Suporte a formatos diferentes de Markdown no MVP.

## Criterios de Qualidade

- Markdown de saida valido e legivel.
- Sem perda de conteudo ao alternar entre blocos e preview.
- Reordenacao de blocos sem efeitos colaterais na serializacao.
- Performance aceitavel com documentos medios (ex.: 200+ blocos).
