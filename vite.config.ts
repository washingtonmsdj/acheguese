/**
 * VITE CONFIG - PRODUCTION READY
 * 
 * ✅ CONFIGURAÇÃO SIMPLIFICADA E ROBUSTA:
 * - Code splitting otimizado
 * - Build confiável para Vercel
 * - Sem over-engineering
 * 
 * @version 3.0.0
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
    mainFields: ['module', 'main'],
    // CRÍTICO: Garantir que React não seja duplicado
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // SOLUÇÃO: Não fazer code splitting manual - deixar Vite otimizar
        // Isso garante que React seja carregado na ordem correta
        manualChunks: undefined,
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
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
    ],
  },
  
  preview: {
    port: 8080,
    host: true,
  },
}));
