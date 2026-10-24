import { expect, test } from '@playwright/test';

test.describe('Enviar Pix', () => {
  test('envia um Pix por CPF dentro do saldo', async ({ page }) => {
    await page.goto('/pix');
    await page.getByLabel('Chave Pix').fill('52998224725');
    await page.getByLabel('Valor (R$)').fill('100,00');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('status')).toHaveText('Pix de R$ 100,00 enviado para a chave cpf');
  });

  test('recusa chave inválida', async ({ page }) => {
    await page.goto('/pix');
    await page.getByLabel('Chave Pix').fill('abc');
    await page.getByLabel('Valor (R$)').fill('10');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Chave Pix inválida');
  });

  test('recusa valor acima do saldo e diz quanto falta', async ({ page }) => {
    await page.goto('/pix');
    await page.getByLabel('Chave Pix').fill('ana@banco.local');
    await page.getByLabel('Valor (R$)').fill('1600');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Saldo insuficiente: faltam R$ 100,00');
  });
});
