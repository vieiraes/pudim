import { describe, expect, it } from 'vitest';
import { formatarReais } from './formatar';

describe('formatarReais', () => {
  it('formata milhar com ponto e centavos com vírgula', () => {
    expect(formatarReais(150_000)).toBe('R$ 1.500,00');
  });
  it('mantém o sinal de valores negativos', () => {
    expect(formatarReais(-2345)).toBe('-R$ 23,45');
  });
  it('completa centavos com zero à esquerda', () => {
    expect(formatarReais(1005)).toBe('R$ 10,05');
  });
});
