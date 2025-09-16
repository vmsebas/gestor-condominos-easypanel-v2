import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuthStore } from '@/store/authStore';

// Lazy load pages for better performance
const Login = React.lazy(() => import('@/pages/Login'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Convocatorias = React.lazy(() => import('@/pages/Convocatorias'));
const ConvocatoriaDetail = React.lazy(() => import('@/pages/ConvocatoriaDetail'));
const ConvocatoriasTest = React.lazy(() => import('@/pages/ConvocatoriasTest'));
const Actas = React.lazy(() => import('@/pages/Actas'));
const ActaDetail = React.lazy(() => import('@/pages/ActaDetail'));
const Finanzas = React.lazy(() => import('@/pages/Finanzas'));
const Miembros = React.lazy(() => import('@/pages/Miembros'));
const MemberProfile = React.lazy(() => import('@/pages/MemberProfile'));
const BuildingsManager = React.lazy(() => import('@/components/buildings/BuildingsManager'));
const Comunicaciones = React.lazy(() => import('@/pages/Comunicaciones'));
const Reportes = React.lazy(() => import('@/pages/Reportes'));
const Mantenimiento = React.lazy(() => import('@/pages/Mantenimiento'));
const Tarefas = React.lazy(() => import('@/pages/Tarefas'));
const Documentos = React.lazy(() => import('@/pages/Documentos'));
const Settings = React.lazy(() => import('@/pages/Settings'));

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

// Layout component for authenticated routes
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // ✅ AUTENTICACIÓN TEMPORALMENTE DESHABILITADA PARA DEBUGGING
  // Puedes ver todos los datos sin necesidad de login
  // Para habilitar login: usar admin@condomino.com / admin123
  
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="gestor-theme">
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/convocatorias" element={
                    <ProtectedRoute>
                      <Convocatorias />
                    </ProtectedRoute>
                  } />
                  <Route path="/convocatorias/:id" element={
                    <ProtectedRoute>
                      <ConvocatoriaDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/convocatorias-test" element={
                    <ProtectedRoute>
                      <ConvocatoriasTest />
                    </ProtectedRoute>
                  } />
                  <Route path="/actas" element={
                    <ProtectedRoute>
                      <Actas />
                    </ProtectedRoute>
                  } />
                  <Route path="/actas/:id" element={
                    <ProtectedRoute>
                      <ActaDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/finanzas" element={
                    <ProtectedRoute>
                      <Finanzas />
                    </ProtectedRoute>
                  } />
                  <Route path="/miembros" element={
                    <ProtectedRoute>
                      <Miembros />
                    </ProtectedRoute>
                  } />
                  <Route path="/miembros/:memberId" element={
                    <ProtectedRoute>
                      <MemberProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/edificios" element={
                    <ProtectedRoute>
                      <BuildingsManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/documentos" element={
                    <ProtectedRoute>
                      <Documentos />
                    </ProtectedRoute>
                  } />
                  <Route path="/comunicaciones" element={
                    <ProtectedRoute>
                      <Comunicaciones />
                    </ProtectedRoute>
                  } />
                  <Route path="/reportes" element={
                    <ProtectedRoute>
                      <Reportes />
                    </ProtectedRoute>
                  } />
                  <Route path="/mantenimiento" element={
                    <ProtectedRoute>
                      <Mantenimiento />
                    </ProtectedRoute>
                  } />
                  <Route path="/tarefas" element={
                    <ProtectedRoute>
                      <Tarefas />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Suspense>
            </div>
            <Toaster />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;