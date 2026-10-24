export const formatarSaldo = (centavos: number) => `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
