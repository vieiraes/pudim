import { describe, expect, it } from 'vitest';
import { cpfValido, formatarCpf } from './cpf';

describe('cpfValido', () => {
  it('aceita CPF válido com pontuação', () => { expect(cpfValido('529.982.247-25')).toBe(true); });
  it('recusa dígito verificador errado', () => { expect(cpfValido('52998224726')).toBe(false); });
  it('recusa sequência repetida', () => { expect(cpfValido('11111111111')).toBe(false); });
});

describe('formatarCpf', () => {
  it('coloca pontos e traço', () => { expect(formatarCpf('52998224725')).toBe('529.982.247-25'); });
});
