import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Building } from '@/types/buildingTypes';
import { Member } from '@/types/memberTypes';

// === TIPOS DE ESTADO ===

interface AppState {
  // Estado de autenticação
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
  } | null;
  
  // Estado de edificio atual
  currentBuilding: Building | null;
  buildings: Building[];
  
  // Estado de carregamento global
  isLoading: boolean;
  loadingMessage: string;
  
  // Estado de notificações
  notifications: Notification[];
  
  // Configurações da aplicação
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: 'pt' | 'en';
    currency: 'EUR';
    dateFormat: 'dd/MM/yyyy' | 'yyyy-MM-dd';
    autoSave: boolean;
    notificationsEnabled: boolean;
  };
  
  // Cache de dados
  cache: {
    members: Member[];
    lastMembersUpdate: number;
    financialSummary: any;
    lastFinancialUpdate: number;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  autoClose?: number; // milliseconds
}

// === AÇÕES ===

interface AppActions {
  // Autenticação
  login: (user: AppState['user']) => void;
  logout: () => void;
  updateUser: (userData: Partial<AppState['user']>) => void;
  
  // Edificios
  setCurrentBuilding: (building: Building) => void;
  setBuildings: (buildings: Building[]) => void;
  addBuilding: (building: Building) => void;
  updateBuilding: (id: string, building: Partial<Building>) => void;
  removeBuilding: (id: string) => void;
  
  // Estados de carregamento
  setLoading: (loading: boolean, message?: string) => void;
  
  // Notificações
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Configurações
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // Cache
  updateMembersCache: (members: Member[]) => void;
  updateFinancialCache: (financialData: any) => void;
  clearCache: () => void;
  isCacheValid: (cacheKey: 'members' | 'financial', maxAge?: number) => boolean;
  
  // Reset
  resetStore: () => void;
}

// === ESTADO INICIAL ===

const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  currentBuilding: null,
  buildings: [],
  isLoading: false,
  loadingMessage: '',
  notifications: [],
  settings: {
    theme: 'system',
    language: 'pt',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    autoSave: true,
    notificationsEnabled: true
  },
  cache: {
    members: [],
    lastMembersUpdate: 0,
    financialSummary: null,
    lastFinancialUpdate: 0
  }
};

// === STORE PRINCIPAL ===

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // === AÇÕES DE AUTENTICAÇÃO ===
      
      login: (user) => {
        set({ 
          isAuthenticated: true, 
          user,
          notifications: [
            ...get().notifications,
            {
              id: `login-${Date.now()}`,
              type: 'success',
              title: 'Bem-vindo!',
              message: `Olá ${user?.name}, sessão iniciada com sucesso.`,
              timestamp: Date.now(),
              read: false,
              autoClose: 5000
            }
          ]
        });
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null,
          currentBuilding: null,
          cache: initialState.cache
        });
      },
      
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
      
      // === AÇÕES DE EDIFICIOS ===
      
      setCurrentBuilding: (building) => {
        set({ currentBuilding: building });
        
        // Limpar cache quando muda de edifício
        if (building?.id !== get().currentBuilding?.id) {
          get().clearCache();
        }
      },
      
      setBuildings: (buildings) => {
        set({ buildings });
      },
      
      addBuilding: (building) => {
        set({ buildings: [...get().buildings, building] });
        
        get().addNotification({
          type: 'success',
          title: 'Edifício adicionado',
          message: `${building.name} foi adicionado com sucesso.`,
          read: false,
          autoClose: 3000
        });
      },
      
      updateBuilding: (id, buildingData) => {
        const buildings = get().buildings.map(building => 
          building.id === id ? { ...building, ...buildingData } : building
        );
        set({ buildings });
        
        // Atualizar edifício atual se for o mesmo
        const currentBuilding = get().currentBuilding;
        if (currentBuilding?.id === id) {
          set({ currentBuilding: { ...currentBuilding, ...buildingData } });
        }
      },
      
      removeBuilding: (id) => {
        const building = get().buildings.find(b => b.id === id);
        const buildings = get().buildings.filter(b => b.id !== id);
        set({ buildings });
        
        // Limpar edifício atual se for o removido
        if (get().currentBuilding?.id === id) {
          set({ currentBuilding: null });
        }
        
        if (building) {
          get().addNotification({
            type: 'info',
            title: 'Edifício removido',
            message: `${building.name} foi removido.`,
            read: false,
            autoClose: 3000
          });
        }
      },
      
      // === AÇÕES DE CARREGAMENTO ===
      
      setLoading: (loading, message = '') => {
        set({ isLoading: loading, loadingMessage: message });
      },
      
      // === AÇÕES DE NOTIFICAÇÕES ===
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          ...notification
        };
        
        set({ notifications: [...get().notifications, newNotification] });
        
        // Auto-remover se especificado
        if (newNotification.autoClose) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, newNotification.autoClose);
        }
      },
      
      removeNotification: (id) => {
        set({ 
          notifications: get().notifications.filter(n => n.id !== id)
        });
      },
      
      markNotificationAsRead: (id) => {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        set({ notifications });
      },
      
      clearAllNotifications: () => {
        set({ notifications: [] });
      },
      
      // === AÇÕES DE CONFIGURAÇÕES ===
      
      updateSettings: (newSettings) => {
        set({ 
          settings: { ...get().settings, ...newSettings }
        });
      },
      
      // === AÇÕES DE CACHE ===
      
      updateMembersCache: (members) => {
        set({
          cache: {
            ...get().cache,
            members,
            lastMembersUpdate: Date.now()
          }
        });
      },
      
      updateFinancialCache: (financialData) => {
        set({
          cache: {
            ...get().cache,
            financialSummary: financialData,
            lastFinancialUpdate: Date.now()
          }
        });
      },
      
      clearCache: () => {
        set({ cache: initialState.cache });
      },
      
      isCacheValid: (cacheKey, maxAge = 5 * 60 * 1000) => { // 5 minutos por padrão
        const cache = get().cache;
        const lastUpdate = cacheKey === 'members' 
          ? cache.lastMembersUpdate 
          : cache.lastFinancialUpdate;
        
        return (Date.now() - lastUpdate) < maxAge;
      },
      
      // === RESET ===
      
      resetStore: () => {
        set(initialState);
      }
    }),
    {
      name: 'gestor-condominos-store',
      partialize: (state) => ({
        // Persistir apenas dados importantes
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentBuilding: state.currentBuilding,
        buildings: state.buildings,
        settings: state.settings
        // Não persistir cache, notifications, isLoading
      })
    }
  )
);

// === HOOKS ESPECIALIZADOS ===

// Hook para estado de autenticação
export const useAuth = () => {
  const { isAuthenticated, user, login, logout, updateUser } = useStore();
  return { isAuthenticated, user, login, logout, updateUser };
};

// Hook para edificios
export const useBuildings = () => {
  const { 
    currentBuilding, 
    buildings, 
    setCurrentBuilding, 
    setBuildings, 
    addBuilding, 
    updateBuilding, 
    removeBuilding 
  } = useStore();
  
  return { 
    currentBuilding, 
    buildings, 
    setCurrentBuilding, 
    setBuildings, 
    addBuilding, 
    updateBuilding, 
    removeBuilding 
  };
};

// Hook para notificações
export const useNotifications = () => {
  const { 
    notifications, 
    addNotification, 
    removeNotification, 
    markNotificationAsRead, 
    clearAllNotifications 
  } = useStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return { 
    notifications, 
    unreadCount,
    addNotification, 
    removeNotification, 
    markNotificationAsRead, 
    clearAllNotifications 
  };
};

// Hook para carregamento
export const useLoading = () => {
  const { isLoading, loadingMessage, setLoading } = useStore();
  return { isLoading, loadingMessage, setLoading };
};

// Hook para configurações
export const useSettings = () => {
  const { settings, updateSettings } = useStore();
  return { settings, updateSettings };
};

// Hook para cache
export const useCache = () => {
  const { 
    cache, 
    updateMembersCache, 
    updateFinancialCache, 
    clearCache, 
    isCacheValid 
  } = useStore();
  
  return { 
    cache, 
    updateMembersCache, 
    updateFinancialCache, 
    clearCache, 
    isCacheValid 
  };
};

export default useStore;