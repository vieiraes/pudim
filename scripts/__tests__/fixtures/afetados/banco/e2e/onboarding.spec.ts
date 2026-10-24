import { test, expect } from '@playwright/test';
import { preencherCadastro } from './helpers/cadastro';

test('abre a conta', async ({ page }) => {
  await page.goto('/onboarding');
  await preencherCadastro(page);
  await expect(page.getByRole('heading', { name: 'Abra sua conta' })).toBeVisible();
});
