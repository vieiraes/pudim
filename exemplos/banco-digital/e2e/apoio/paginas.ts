import type { Page } from '@playwright/test';

// Page Object compartilhado pelas specs (o e2e-afetados marca as specs que o importam como "helper").
export class PaginaOnboarding {
  constructor(private page: Page) {}
  async abrir() { await this.page.goto('/onboarding'); }
  async preencher(nome: string, cpf: string) {
    await this.page.getByLabel('Nome completo').fill(nome);
    await this.page.getByLabel('CPF').fill(cpf);
    await this.page.getByRole('button', { name: 'Continuar' }).click();
  }
}
