import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member';
  buildingId?: string;
  memberId?: string;
  permissions?: Record<string, boolean>;
  isActive: boolean;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setAccessToken: (accessToken) => set({ accessToken }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (user, accessToken) => set({ 
        user, 
        accessToken, 
        isAuthenticated: true,
        isLoading: false
      }),
      
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
        isLoading: false
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }))
    }),
    {
      name: 'auth-storage',
      // Only persist user and token, not loading state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Helper selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectUserBuilding = (state: AuthState) => state.user?.buildingId;

// Helper functions
export const hasRole = (role: string | string[]) => {
  const userRole = useAuthStore.getState().user?.role;
  if (!userRole) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(userRole);
};

export const hasPermission = (permission: string) => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.role === 'super_admin') return true;
  
  // Check specific permission
  return user.permissions?.[permission] || false;
};

export const canAccessBuilding = (buildingId: string) => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  
  // Super admins can access all buildings
  if (user.role === 'super_admin') return true;
  
  // Check if user belongs to the building
  return user.buildingId === buildingId;
};