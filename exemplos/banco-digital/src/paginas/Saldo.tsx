import { conta } from '@/lib/conta';
import { formatarReais } from '@/lib/saldo/formatar';

export function Saldo() {
  return (
    <main>
      <h1>Saldo</h1>
      <p>Olá, {conta.titular}</p>
      <p data-testid="saldo">{formatarReais(conta.saldoCentavos)}</p>
    </main>
  );
}
