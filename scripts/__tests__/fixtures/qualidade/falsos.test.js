const { calcular } = require('./calculo');

describe('falsos', () => {
  test('sem verificação', () => {
    calcular([1, 2]);
  });
  test('só existência', () => {
    expect(calcular([1])).toBeTruthy();
    expect(calcular([2])).not.toBeNull();
  });
  test('só snapshot', () => {
    expect(calcular([3])).toMatchSnapshot();
  });
  test.skip('pulado', () => {
    expect(calcular([1])).toBe(1);
  });
  it.only('com foco', () => {
    expect(calcular([1])).toBe(1);
  });
  test.todo('a fazer');
  xit('x pulado', () => { expect(1).toBe(1); });
});
