import { createBrowserRouter, Route, Routes } from 'react-router-dom';
export const router = createBrowserRouter([{ path: '/checkout', element: null }, { path: '*', element: null }]);
export function App() {
  return (<Routes><Route path="/" element={null} /><Route path="/carrinho" element={null} /></Routes>);
}
