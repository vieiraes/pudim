import { expect, test } from '@playwright/test';
import { PaginaOnboarding } from './apoio/paginas';

test.describe('Onboarding', () => {
  test('abre a conta com nome e CPF válidos', async ({ page }) => {
    const tela = new PaginaOnboarding(page);
    await tela.abrir();
    await tela.preencher('Ana Souza', '529.982.247-25');
    await expect(page.getByRole('heading', { name: 'Conta aberta' })).toBeVisible();
    await expect(page.getByText('Seu CPF: 529.982.247-25')).toBeVisible();
  });

  test('recusa CPF inválido', async ({ page }) => {
    const tela = new PaginaOnboarding(page);
    await tela.abrir();
    await tela.preencher('Ana Souza', '123.456.789-00');
    await expect(page.getByRole('alert')).toHaveText('CPF inválido');
  });
});
