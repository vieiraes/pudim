import type { ButtonHTMLAttributes } from 'react';

export function Botao(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="submit" {...props} />;
}
