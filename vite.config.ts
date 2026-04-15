/**
 * VITE CONFIG - OTIMIZADO
 * 
 * ✅ OTIMIZAÇÕES:
 * - Code splitting avançado
 * - Tree shaking otimizado
 * - Minification agressiva
 * - Cache busting
 * - Bundle analysis
 * 
 * @version 2.1.0
 * @author Kiro AI
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok-free.app',
      '.loca.lt',
      '.localhost.run',
    ],
  },
  
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/integrations": path.resolve(__dirname, "./src/integrations"),
      "@/modules": path.resolve(__dirname, "./src/modules"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "lodash": "lodash-es",
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  
  build: {
    target: 'es2020',
    minify: 'esbuild',
    
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          
          if (id.includes('@radix-ui/react-dialog') ||
              id.includes('@radix-ui/react-dropdown-menu') ||
              id.includes('@radix-ui/react-select') ||
              id.includes('@radix-ui/react-tabs') ||
              id.includes('@radix-ui/react-toast') ||
              id.includes('@radix-ui/react-popover')) {
            return 'vendor-radix-core';
          }
          
          if (id.includes('@radix-ui/')) {
            return 'vendor-radix-extended';
          }
          
          if (id.includes('leaflet')) {
            return 'vendor-maps';
          }
          
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          
          if (id.includes('framer-motion')) {
            return 'vendor-animation';
          }
          
          if (id.includes('@supabase/')) {
            return 'vendor-supabase';
          }
          
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          
          if (id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              id.includes('zod')) {
            return 'vendor-forms';
          }
          
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          const ext = name.split('.').pop() || '';
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
      },
      
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lodash-es',
      'recharts',
    ],
  },
  
  preview: {
    port: 8080,
    host: true,
  },
}));
