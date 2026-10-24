// Possível bug: a taxa do boleto aparece como texto. Falhou em 3 de 3.
// npx playwright test .qa/execucoes/2026-10-21-1100-criar-e2e/bugs/boleto.spec.ts
import { expect, test } from '@playwright/test';

test('taxa do boleto aparece como número', async ({ page }) => {
  test.fail();
  await page.goto('/boleto');
  await page.getByLabel('Valor').fill('250');
  await page.getByRole('button', { name: 'Emitir' }).click();
  await expect(page.getByTestId('taxa')).toHaveText('2.5');
});
