// Sistema de cache optimizado para la aplicación
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class EnhancedCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 50; // Máximo número de items en cache

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Si el cache está lleno, eliminar el item más antiguo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar timestamp para LRU
    item.timestamp = Date.now();
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      expiredItems: items.filter(item => now - item.timestamp > item.ttl).length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private hitCount = 0;
  private missCount = 0;

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  private estimateMemoryUsage(): string {
    // Estimación aproximada del uso de memoria
    const jsonString = JSON.stringify(Array.from(this.cache.entries()));
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Limpiar items expirados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia global del cache
export const appCache = new EnhancedCache();

// Cache específico para API responses
export const apiCache = {
  get: <T>(endpoint: string): T | null => {
    return appCache.get<T>(`api:${endpoint}`);
  },
  
  set: <T>(endpoint: string, data: T, ttl?: number): void => {
    appCache.set(`api:${endpoint}`, data, ttl);
  },
  
  invalidate: (pattern?: string): void => {
    if (pattern) {
      // Invalidar cache que coincida con el patrón
      for (const key of Array.from(appCache['cache'].keys())) {
        if (key.startsWith(`api:${pattern}`)) {
          appCache.delete(key);
        }
      }
    } else {
      // Invalidar todo el cache de API
      for (const key of Array.from(appCache['cache'].keys())) {
        if (key.startsWith('api:')) {
          appCache.delete(key);
        }
      }
    }
  }
};

// Cache para imágenes y assets
export const assetCache = {
  get: (url: string): string | null => {
    return appCache.get<string>(`asset:${url}`);
  },
  
  set: (url: string, dataUrl: string): void => {
    // Cache de assets con TTL más largo (30 minutos)
    appCache.set(`asset:${url}`, dataUrl, 30 * 60 * 1000);
  }
};

// Cache para configuración del usuario
export const userCache = {
  get: <T>(key: string): T | null => {
    return appCache.get<T>(`user:${key}`);
  },
  
  set: <T>(key: string, data: T): void => {
    // Cache de usuario con TTL de 1 hora
    appCache.set(`user:${key}`, data, 60 * 60 * 1000);
  }
};

// Funciones de utilidad para cache
export const cacheUtils = {
  // Crear una clave de cache a partir de parámetros
  createKey: (base: string, params?: Record<string, any>): string => {
    if (!params) return base;
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
      
    return `${base}?${sortedParams}`;
  },

  // Wrapper para funciones con cache automático
  withCache: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string,
    ttl?: number
  ) => {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const key = keyFn(...args);
      const cached = appCache.get(key);
      
      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      appCache.set(key, result, ttl);
      
      return result;
    };
  },

  // Invalidar cache basado en tags
  invalidateByTags: (tags: string[]): void => {
    for (const tag of tags) {
      apiCache.invalidate(tag);
    }
  },

  // Precargar datos en cache
  preload: async <T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ): Promise<void> => {
    try {
      const data = await loader();
      appCache.set(key, data, ttl);
    } catch (error) {
      console.warn(`Failed to preload cache for key: ${key}`, error);
    }
  }
};

// Limpiar cache automáticamente cada 10 minutos
setInterval(() => {
  appCache.cleanup();
}, 10 * 60 * 1000);

// Limpiar cache cuando la página se oculta (usuario cambia de pestaña)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    appCache.cleanup();
  }
});

export default appCache;