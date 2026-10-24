import { test, expect } from '@playwright/test';
test('carrinho', async ({ page }) => { await page.goto('/carrinho'); await expect(page.getByRole('heading')).toBeVisible(); });
