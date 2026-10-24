import type { Movimento } from '@/lib/conta';

// Saldo depois de aplicar os movimentos do período, em centavos.
export function saldoAposMovimentos(saldoInicial: number, movimentos: Movimento[]): number {
  return movimentos.reduce((acc, m) => acc + m.centavos, saldoInicial);
}

// Quanto falta para o saldo cobrir um valor (0 quando já cobre).
export function faltaPara(saldo: number, valor: number): number {
  return Math.max(0, valor - saldo);
}
