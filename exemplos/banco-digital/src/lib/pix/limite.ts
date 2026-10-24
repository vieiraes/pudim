// Limite diário de Pix: R$ 1.000,00 de dia; R$ 200,00 à noite (20h às 6h), regra do Banco Central.
export const LIMITE_DIA_CENTAVOS = 100_000;
export const LIMITE_NOITE_CENTAVOS = 20_000;

export function limiteParaHora(hora: number): number {
  return hora >= 20 || hora < 6 ? LIMITE_NOITE_CENTAVOS : LIMITE_DIA_CENTAVOS;
}

// BUG PROPOSITAL (para demonstrar o /pudim:investigar): compara o valor em centavos com o
// limite em reais, então um Pix de R$ 999,00 à noite passa. O certo seria `valor > limite`.
export function excedeLimite(valorCentavos: number, hora: number): boolean {
  return valorCentavos / 100 > limiteParaHora(hora);
}
