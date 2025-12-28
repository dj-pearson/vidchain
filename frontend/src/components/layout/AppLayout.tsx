import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useRequireAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/Spinner';

export function AppLayout() {
  const { isLoading } = useRequireAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:pl-64">
        <div className="container p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
