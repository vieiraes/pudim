import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Onboarding } from '@/paginas/Onboarding';
import { Saldo } from '@/paginas/Saldo';

const PixOut = lazy(() => import('@/paginas/PixOut'));
const Extrato = lazy(() => import('@/paginas/Extrato'));

export function App() {
  return (
    <BrowserRouter>
      <nav aria-label="Menu principal">
        <Link to="/onboarding">Abrir conta</Link> · <Link to="/saldo">Saldo</Link> · <Link to="/pix">Enviar Pix</Link> · <Link to="/extrato">Extrato</Link>
      </nav>
      <Suspense fallback={<p>Carregando…</p>}>
        <Routes>
          <Route path="/" element={<Navigate to="/saldo" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/saldo" element={<Saldo />} />
          <Route path="/pix" element={<PixOut />} />
          <Route path="/extrato" element={<Extrato />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
