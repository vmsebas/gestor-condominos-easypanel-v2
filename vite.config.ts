import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Mock Node.js global for browser
    global: 'window',
  },
  optimizeDeps: {
    // Exclude pg-native and other problematic native modules
    exclude: ['pg-native'],
  },
  server: {
    port: 5173,
    host: true,
    // HMR configurado para desarrollo local - NO usar dominios externos
    hmr: {
      port: 5173,
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    minify: 'terser',
    rollupOptions: {
      // Externalize Node.js specific modules
      external: [
        'pg',
        'pg-native',
        'dns',
        'net',
        'tls',
        'fs',
        'child_process',
      ],
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'animation-vendor': ['framer-motion'],
          'icons': ['lucide-react'],
        },
      },
    },
    commonjsOptions: {
      // Handle mixed ES modules and CommonJS
      transformMixedEsModules: true,
    },
    // Chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
})