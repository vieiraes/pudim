import { test, expect } from '@playwright/test';
const id = 7;
test('home', async ({ page }) => { await page.goto('/'); await expect(page).toHaveTitle(/Loja/); });
test('lista', async ({ page }) => { await page.goto('http://localhost:3000/produtos?pagina=2'); await expect(page.getByRole('list')).toBeVisible(); });
test('detalhe', async ({ page }) => { await page.goto(`/produtos/${id}`); await expect(page.getByRole('heading')).toBeVisible(); });
test('sobre', async ({ page }) => { await page.goto('/sobre'); await expect(page).toHaveURL('/sobre'); });
