import { test, expect } from '@playwright/test';
async function verificarCarrinho(page) { await expect(page.getByRole('heading')).toHaveText('Carrinho'); }
test.describe('checkout', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });
  test('mostra o total', async ({ page }) => {
    await expect(page.getByTestId('total')).toHaveText('R$ 10,00');
  });
  test('usa helper', async ({ page }) => { await verificarCarrinho(page); });
  test('só clica', async ({ page }) => { await page.getByRole('button').click(); });
  test.fixme('quebrado', async ({ page }) => { await expect(page).toHaveURL('/x'); });
});
