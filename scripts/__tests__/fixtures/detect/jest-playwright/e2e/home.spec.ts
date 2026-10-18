import { test, expect } from '@playwright/test';
test('home', async ({ page }) => { await page.goto('/'); await expect(page).toHaveTitle(/Loja/); });
