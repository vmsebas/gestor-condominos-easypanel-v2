interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Componente completamente simplificado
  // No hace ninguna verificación de auth para evitar loops
  // Toda la lógica de autenticación está manejada por el store de Zustand
  return <>{children}</>;
}