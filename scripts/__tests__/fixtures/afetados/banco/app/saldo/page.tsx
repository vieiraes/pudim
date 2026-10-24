import { formatarSaldo } from '../../src/saldo/formatar';
export default function Saldo() {
  return <main><h1>Saldo</h1><p>{formatarSaldo(1500)}</p></main>;
}
