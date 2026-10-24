import type { Page } from '@playwright/test';
export async function preencherCadastro(page: Page) {
  await page.getByLabel('CPF').fill('12345678909');
}
