// Conta fictícia usada por todas as telas (sem backend).
export type Movimento = { data: string; descricao: string; centavos: number };

export const conta = {
  titular: 'Ana Souza',
  saldoCentavos: 150_000, // R$ 1.500,00
  movimentos: [
    { data: '2026-10-20', descricao: 'Salário', centavos: 500_000 },
    { data: '2026-10-21', descricao: 'Mercado', centavos: -23_450 },
    { data: '2026-10-22', descricao: 'Pix recebido · João', centavos: 12_000 },
  ] as Movimento[],
};
