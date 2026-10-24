import { describe, expect, it } from 'vitest';
import { TipoChave, tipoDaChave } from './chave';

describe('tipoDaChave', () => {
  it('11 dígitos é CPF', () => { expect(tipoDaChave('52998224725')).toBe(TipoChave.CPF); });
  it('e-mail', () => { expect(tipoDaChave('ana@banco.local')).toBe(TipoChave.EMAIL); });
  it('telefone com DDI', () => { expect(tipoDaChave('+5511999998888')).toBe(TipoChave.TELEFONE); });
  it('chave aleatória', () => { expect(tipoDaChave('123e4567-e89b-12d3-a456-426614174000')).toBe(TipoChave.ALEATORIA); });
  it('lixo é inválido', () => { expect(tipoDaChave('abc')).toBeNull(); });
});
