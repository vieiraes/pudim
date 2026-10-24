import { lazy } from 'react';
import { createBrowserRouter, Route, Routes } from 'react-router-dom';
import Carrinho from './pages/Carrinho';
const Checkout = lazy(() => import('./pages/Checkout'));
export const router = createBrowserRouter([{ path: '/checkout', element: <Checkout /> }, { path: '*', element: null }]);
export function App() {
  return (<Routes><Route path="/" element={null} /><Route element={<Carrinho />} path="/carrinho" /></Routes>);
}
