// Arquivo maior, para o detector escolher o menor como modelo.
const { soma } = require('../index');
describe('soma', () => {
  test('positivos', () => { expect(soma(2, 2)).toBe(4); });
  test('negativos', () => { expect(soma(-2, -2)).toBe(-4); });
});
