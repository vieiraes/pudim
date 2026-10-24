import { test, expect } from '@playwright/test';

test('mostra o saldo', async ({ page }) => {
  await page.goto('/saldo');
  await expect(page.getByText('R$ 15,00')).toBeVisible();
});
