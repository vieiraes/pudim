import { Botao } from '@/components/Botao';
import { TipoChave } from '@/pix-out/enums';
export default function PixOut() {
  return <main><h1>Enviar Pix</h1><p>{TipoChave.CPF}</p><Botao>Enviar</Botao></main>;
}
