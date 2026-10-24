import { expect, test } from '@playwright/test';

test('mostra o saldo da conta formatado', async ({ page }) => {
  await page.goto('/saldo');
  await expect(page.getByRole('heading', { name: 'Saldo' })).toBeVisible();
  await expect(page.getByTestId('saldo')).toHaveText('R$ 1.500,00');
});
