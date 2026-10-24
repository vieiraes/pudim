// Formata centavos como moeda brasileira: 150000 → "R$ 1.500,00"; -2345 → "-R$ 23,45".
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100).toLocaleString('pt-BR');
  const cents = String(abs % 100).padStart(2, '0');
  return `${sinal}R$ ${reais},${cents}`;
}
