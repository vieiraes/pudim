# Banco Digital (fictício)

Projeto de exemplo do Pudim. Serve para validar o plugin sem encostar em projeto de verdade:
um internet banking de mentira, com Vite + React Router, Vitest e Playwright.

- Telas: `/onboarding`, `/saldo`, `/pix` (Pix out) e `/extrato`.
- Aliases `@/` declarados em `tsconfig.app.json` (via `references`), como num projeto Vite real.
- `.qa/areas.json` já liga pix-out aos vizinhos saldo e extrato.
- **Sem teste de propósito**: `src/lib/pix/limite.ts`, `src/lib/saldo/calcular.ts` e a tela
  `/extrato` (para o `/qa:cobertura`, `/qa:criar-unitario` e `/qa:criar-e2e` terem o que fazer).
- **Bug proposital**: `excedeLimite()` em `src/lib/pix/limite.ts` compara centavos com reais,
  então um Pix de R$ 999,00 à noite passa pelo limite de R$ 200,00. Serve para demonstrar o
  `/qa:investigar` e o fluxo de "possível bug no produto".

```bash
npm install
npx playwright install chromium   # uma vez
npm test                          # unitários
npm run test:e2e                  # E2E (o Playwright sobe o app sozinho)
```

Para usar o Pudim aqui: abra esta pasta no Claude Code e chame `/qa:cobertura`,
`/qa:criar-e2e`, `/qa:portal`, `/qa:relatorio`.
