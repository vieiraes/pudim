import { useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { cpfValido, formatarCpf } from '@/lib/onboarding/cpf';

export function Onboarding() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3) return setErro('Informe seu nome completo');
    if (!cpfValido(cpf)) return setErro('CPF inválido');
    setErro('');
    setOk(true);
  }

  if (ok) return <main><h1>Conta aberta</h1><p>Bem-vinda, {nome}. Seu CPF: {formatarCpf(cpf)}.</p></main>;
  return (
    <main>
      <h1>Abra sua conta</h1>
      <form onSubmit={enviar}>
        <label>Nome completo <input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <label>CPF <input value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" /></label>
        {erro && <p role="alert">{erro}</p>}
        <Botao>Continuar</Botao>
      </form>
    </main>
  );
}
