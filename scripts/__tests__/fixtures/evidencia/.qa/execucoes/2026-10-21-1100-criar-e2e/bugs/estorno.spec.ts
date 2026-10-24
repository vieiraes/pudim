// Possível bug: estorno acima do valor pago é aceito. Falhou em 3 de 3.
// npx playwright test .qa/execucoes/2026-10-21-1100-criar-e2e/bugs/estorno.spec.ts
import { expect, test } from '@playwright/test';

test('estorno acima do pago é recusado', async ({ page }) => {
  test.fail();
  await page.goto('/pagamentos/1/estorno');
  await page.getByLabel('Valor').fill('200');
  await page.getByRole('button', { name: 'Estornar' }).click();
  await expect(page.getByRole('alert')).toContainText('acima do valor pago');
});
