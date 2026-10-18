import { test, expect } from '@playwright/test';
test('login', async ({ page }) => { await page.goto(`${process.env.BASE_URL}/login`); await expect(page.getByLabel('E-mail')).toBeVisible(); });
