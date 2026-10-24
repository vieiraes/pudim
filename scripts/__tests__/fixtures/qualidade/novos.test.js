import { test, expect } from '@playwright/test';
const dobro = (n) => n * 2;
function confere(page) { expect(page).toBeTruthy(); }

test.each`
  a    | b
  ${1} | ${2}
`('each com template $a', ({ a, b }) => { expect(dobro(a)).toBe(b); });

test('sem expect, só chama helper com nome de arrow sem corpo', async () => { dobro(2); });

test('não é verdade', () => { expect(dobro(1)).not.toBeTruthy(); });

test('espera fixa', async ({ page }) => { await page.waitForTimeout(500); await expect(page).toHaveURL('/'); });

test('senha no código', async ({ page }) => {
  const senha = 'Segredo123!';
  await page.getByLabel('Senha').fill(senha);
  await expect(page).toHaveURL('/home');
});
