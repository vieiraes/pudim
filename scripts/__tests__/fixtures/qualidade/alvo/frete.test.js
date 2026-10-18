// Mock parcial do próprio módulo (mantém o real): aceito. Mock de dependência: aceito.
import { frete } from './frete';
vi.mock('./frete', async () => ({ ...(await vi.importActual('./frete')), tabela: () => 1 }));
vi.mock('./correios');
it('frete fixo', () => { expect(frete(10)).toBe(11); });
