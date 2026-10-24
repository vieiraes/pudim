import { conta } from '@/lib/conta';
import { formatarReais } from '@/lib/saldo/formatar';

export default function Extrato() {
  return (
    <main>
      <h1>Extrato</h1>
      <table>
        <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>
          {conta.movimentos.map((m) => (
            <tr key={`${m.data}-${m.descricao}`}><td>{m.data}</td><td>{m.descricao}</td><td>{formatarReais(m.centavos)}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
