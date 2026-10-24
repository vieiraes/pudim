import { test, expect } from '@playwright/test';

test('envia um Pix por CPF', async ({ page }) => {
  await page.goto('/pix-out');
  await expect(page.getByRole('heading', { name: 'Enviar Pix' })).toBeVisible();
});
