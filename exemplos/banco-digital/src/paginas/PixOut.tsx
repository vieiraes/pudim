import { useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { conta } from '@/lib/conta';
import { tipoDaChave } from '@/lib/pix/chave';
import { excedeLimite } from '@/lib/pix/limite';
import { faltaPara } from '@/lib/saldo/calcular';
import { formatarReais } from '@/lib/saldo/formatar';

export default function PixOut() {
  const [chave, setChave] = useState('');
  const [valor, setValor] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const tipo = tipoDaChave(chave);
    if (!tipo) return setMsg({ tipo: 'erro', texto: 'Chave Pix inválida' });
    const centavos = Math.round(Number(valor.replace(',', '.')) * 100);
    if (!centavos || centavos <= 0) return setMsg({ tipo: 'erro', texto: 'Informe um valor maior que zero' });
    const falta = faltaPara(conta.saldoCentavos, centavos);
    if (falta > 0) return setMsg({ tipo: 'erro', texto: `Saldo insuficiente: faltam ${formatarReais(falta)}` });
    if (excedeLimite(centavos, new Date().getHours())) return setMsg({ tipo: 'erro', texto: 'Valor acima do limite para este horário' });
    setMsg({ tipo: 'ok', texto: `Pix de ${formatarReais(centavos)} enviado para a chave ${tipo}` });
  }

  return (
    <main>
      <h1>Enviar Pix</h1>
      <p>Saldo disponível: <span data-testid="saldo">{formatarReais(conta.saldoCentavos)}</span></p>
      <form onSubmit={enviar}>
        <label>Chave Pix <input value={chave} onChange={(e) => setChave(e.target.value)} /></label>
        <label>Valor (R$) <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" /></label>
        {msg && <p role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}
        <Botao>Enviar</Botao>
      </form>
    </main>
  );
}
