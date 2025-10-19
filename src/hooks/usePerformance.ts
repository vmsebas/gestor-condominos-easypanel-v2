import { useEffect, useCallback, useRef } from 'react';

// Hook para optimización de rendimiento
export const usePerformance = () => {
  const performanceRef = useRef<{
    navigationStart: number;
    loadTime: number;
  }>({
    navigationStart: performance.now(),
    loadTime: 0
  });

  // Función para medir el tiempo de carga de componentes
  const measureComponentLoad = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} cargado en ${loadTime.toFixed(2)}ms`);
      }
      
      return loadTime;
    };
  }, []);

  // Función para reportar métricas web vitals
  const reportWebVitals = useCallback((metric: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', metric);
    }
    
    // Aquí podrías enviar las métricas a un servicio de analytics
    // analytics.track('Web Vital', metric);
  }, []);

  // Hook para detectar renderizados innecesarios
  const useRenderTracker = (componentName: string, props?: any) => {
    const renderCount = useRef(0);
    const prevProps = useRef(props);

    useEffect(() => {
      renderCount.current += 1;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 ${componentName} renderizado ${renderCount.current} veces`);
        
        if (props && prevProps.current) {
          const changedProps = Object.keys(props).filter(
            key => props[key] !== prevProps.current[key]
          );
          
          if (changedProps.length > 0) {
            console.log(`📝 Props cambiadas en ${componentName}:`, changedProps);
          }
        }
      }
      
      prevProps.current = props;
    });

    return renderCount.current;
  };

  // Función para lazy loading de imágenes
  const useLazyImage = (src: string, placeholder?: string) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imageSrc, setImageSrc] = useState(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    return { imgRef, imageSrc, isLoaded, handleLoad };
  };

  // Función para detectar conexión lenta
  const useConnectionSpeed = () => {
    const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

    useEffect(() => {
      const connection = (navigator as any).connection;
      
      if (connection) {
        const updateConnectionSpeed = () => {
          const { effectiveType, downlink } = connection;
          
          if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
            setConnectionSpeed('slow');
          } else {
            setConnectionSpeed('fast');
          }
        };

        updateConnectionSpeed();
        connection.addEventListener('change', updateConnectionSpeed);

        return () => {
          connection.removeEventListener('change', updateConnectionSpeed);
        };
      }
    }, []);

    return connectionSpeed;
  };

  // Función para prefetch de rutas
  const prefetchRoute = useCallback(async (routePath: string) => {
    try {
      // Prefetch dinámico de componentes de ruta
      switch (routePath) {
        case '/dashboard':
          await import('@/pages/Dashboard');
          break;
        case '/finanzas':
          await import('@/pages/Financas');
          break;
        case '/miembros':
          await import('@/pages/Miembros');
          break;
        case '/convocatorias':
          await import('@/pages/Convocatorias');
          break;
        case '/actas':
          await import('@/pages/Actas');
          break;
        case '/comunicaciones':
          await import('@/pages/Comunicaciones');
          break;
        // Añadir más rutas según sea necesario
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Ruta ${routePath} prefetched`);
      }
    } catch (error) {
      console.warn(`❌ Error prefetching route ${routePath}:`, error);
    }
  }, []);

  return {
    measureComponentLoad,
    reportWebVitals,
    useRenderTracker,
    useLazyImage,
    useConnectionSpeed,
    prefetchRoute,
    performanceData: performanceRef.current
  };
};

// Hook para debounce optimizado
export const useOptimizedDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle optimizado
export const useOptimizedThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - (now - lastCallRef.current));
      }
    },
    [callback, delay]
  ) as T;
};

// Hook para memoización profunda
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList) => {
  const ref = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  if (!depsRef.current || !deps.every((dep, i) => dep === depsRef.current![i])) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current!;
};

import { useState } from 'react';