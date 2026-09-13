import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/Sonner';
import { TooltipProvider } from './components/ui/Tooltip';
import { AppShell } from './components/AppShell';
import { InventoryProvider } from './contexts/InventoryContext';
import { useInventory } from './contexts/InventoryContext';
import { InventoryList } from './pages/InventoryList';
import { ItemDetail } from './pages/ItemDetail';
import { Login } from './pages/Login';

type DefaultSort = 'name' | 'stock-asc' | 'category' | 'recently-counted';

interface AppProps {
  defaultSort?: DefaultSort;
}

export function App({ defaultSort = 'stock-asc' }: AppProps) {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={200}>
        <InventoryProvider>
          <AuthenticatedRoutes defaultSort={defaultSort} />
          <Toaster position="bottom-center" richColors closeButton />
        </InventoryProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}

function AuthenticatedRoutes({ defaultSort }: { defaultSort: DefaultSort }) {
  const { authenticated } = useInventory();
  if (!authenticated) return <Login />;
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<InventoryList defaultSort={defaultSort} />} />
        <Route path="/items/:itemId" element={<ItemDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
