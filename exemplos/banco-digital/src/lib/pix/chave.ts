export enum TipoChave { CPF = 'cpf', EMAIL = 'email', TELEFONE = 'telefone', ALEATORIA = 'aleatoria' }

// Descobre o tipo de uma chave Pix pelo formato. Chave inválida → null.
export function tipoDaChave(chave: string): TipoChave | null {
  const c = chave.trim();
  if (/^\d{11}$/.test(c)) return TipoChave.CPF;
  if (/^\+?\d{12,13}$/.test(c)) return TipoChave.TELEFONE;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return TipoChave.EMAIL;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return TipoChave.ALEATORIA;
  return null;
}
