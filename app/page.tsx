'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import Dashboard from '@/components/admin/Dashboard';
import DeliveryPage from '@/components/admin/DeliveryPage';
import MesasPage from '@/components/admin/MesasPage';
import CaixaPage from '@/components/admin/CaixaPage';
import ClientesPage from '@/components/admin/ClientesPage';
import CardapioPage from '@/components/admin/CardapioPage';
import RelatoriosPage from '@/components/admin/RelatoriosPage';
import Toast from '@/components/shared/Toast';
import { DeliveryOrder } from '@/lib/data';

export default function AdminHome() {
  const { currentPage, deliveryOrders, deliveryCounter, injectOnlineOrder, loadDemoData } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    loadDemoData();
  }, [loadDemoData]);

  // Poll for online orders every 3 seconds
  const checkOnlineOrders = useCallback(() => {
    try {
      const raw = localStorage.getItem('plp_state');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const saved = parsed?.state || parsed;
      if (!saved?.deliveryOrders) return;
      if (saved.deliveryOrders.length > deliveryOrders.length) {
        const newOrders: DeliveryOrder[] = saved.deliveryOrders.slice(deliveryOrders.length);
        newOrders.forEach((o: DeliveryOrder) => {
          injectOnlineOrder(o, saved.deliveryCounter);
        });
      }
    } catch {}
  }, [deliveryOrders.length, injectOnlineOrder]);

  useEffect(() => {
    const interval = setInterval(checkOnlineOrders, 3000);
    return () => clearInterval(interval);
  }, [checkOnlineOrders]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div style={{ fontSize: '3rem' }}>🍕</div>
          <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 12 }}>Carregando...</div>
        </div>
      </div>
    );
  }

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    delivery: <DeliveryPage />,
    mesas: <MesasPage />,
    caixa: <CaixaPage />,
    clientes: <ClientesPage />,
    cardapio: <CardapioPage />,
    relatorios: <RelatoriosPage />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: 'var(--sidebar-w)' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {pages[currentPage] || <Dashboard />}
        </main>
      </div>
      <Toast />
    </div>
  );
}
