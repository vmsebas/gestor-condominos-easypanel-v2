import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Convocatorias = React.lazy(() => import('@/pages/Convocatorias'));
const ConvocatoriasTest = React.lazy(() => import('@/pages/ConvocatoriasTest'));
const Actas = React.lazy(() => import('@/pages/Actas'));
const Finanzas = React.lazy(() => import('@/pages/Finanzas'));
const Miembros = React.lazy(() => import('@/pages/Miembros'));
const MemberProfile = React.lazy(() => import('@/pages/MemberProfile'));
const Edificios = React.lazy(() => import('@/pages/Edificios'));
const Comunicaciones = React.lazy(() => import('@/pages/Comunicaciones'));
const Reportes = React.lazy(() => import('@/pages/Reportes'));
const Mantenimiento = React.lazy(() => import('@/pages/Mantenimiento'));
const Tarefas = React.lazy(() => import('@/pages/Tarefas'));
const Documentos = React.lazy(() => import('@/pages/Documentos'));

// Import layout components (keep these as regular imports since they're always needed)
import Navigation from '@/components/layout/Navigation';
import Header from '@/components/layout/Header';

// Loading component for suspense fallback
const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Skeleton className="h-64 w-full" />
      </div>
      <div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      suspense: false,
      useErrorBoundary: false,
    },
    mutations: {
      retry: 1,
      useErrorBoundary: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="gestor-theme">
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <div className="flex">
              {/* Sidebar Navigation */}
              <Navigation />
              
              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                <Header />
                
                <main className="flex-1 overflow-auto">
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/convocatorias" element={<Convocatorias />} />
                      <Route path="/convocatorias-test" element={<ConvocatoriasTest />} />
                      <Route path="/actas" element={<Actas />} />
                      <Route path="/finanzas" element={<Finanzas />} />
                      <Route path="/miembros" element={<Miembros />} />
                      <Route path="/miembros/:memberId" element={<MemberProfile />} />
                      <Route path="/edificios" element={<Edificios />} />
                      <Route path="/documentos" element={<Documentos />} />
                      <Route path="/comunicaciones" element={<Comunicaciones />} />
                      <Route path="/reportes" element={<Reportes />} />
                      <Route path="/mantenimiento" element={<Mantenimiento />} />
                      <Route path="/tarefas" element={<Tarefas />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </div>
          <Toaster />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;