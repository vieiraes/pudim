# STATUS

Formato: uma linha por task, estilo card Jira, com status simples e dependencias.

- [ ] TASK-001 | Estrutura base do editor por blocos | Depende de: -
- [ ] TASK-002 | Drag-and-drop estavel com reordenacao previsivel | Depende de: TASK-001
- [ ] TASK-003 | Barra de formatacao e comandos rapidos | Depende de: TASK-001
- [ ] TASK-004 | Preview em tempo real confiavel | Depende de: TASK-001, TASK-003
- [ ] TASK-005 | Persistencia com Supabase | Depende de: TASK-001, TASK-002, TASK-004
- [ ] TASK-006 | Exportacao/importacao de Markdown (.md) | Depende de: TASK-002, TASK-004, TASK-005
- [ ] TASK-007 | PWA e refinamentos de UX | Depende de: TASK-001, TASK-004, TASK-006
