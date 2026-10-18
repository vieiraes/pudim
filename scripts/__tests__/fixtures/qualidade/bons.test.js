// Testes bons: nenhum deve ser recusado. Comentário com expect( e test( não conta.
const { calcular } = require('./calculo');
const verificarTotal = (v) => { expect(v).toBe(10); };

describe('calculo', () => {
  it('soma itens', () => {
    expect(calcular([4, 6])).toBe(10);
  });
  test('recusa negativo', () => {
    expect(() => calcular([-1])).toThrow('valor negativo');
  });
  test('usa helper que verifica', () => {
    verificarTotal(calcular([5, 5]));
  });
  test.each([[1, 1], [2, 2]])('identidade %i', (a, b) => {
    expect(a).toEqual(b);
  });
  test('mistura existência com valor', () => {
    const r = calcular([1]);
    expect(r).toBeDefined();
    expect(r).toBe(1);
  });
  test('string com chaves e barra não confunde', () => {
    const s = '{ } ) /x/ test(';
    expect(s.length).toBeGreaterThan(0);
    expect('a/b'.split(/\//)).toEqual(['a', 'b']);
  });
});
