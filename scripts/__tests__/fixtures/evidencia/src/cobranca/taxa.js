export const taxaBoleto = (valor) => {
  // taxa de 1%
  const taxa = valor * 0.01;
  return taxa.toFixed(2);
};
