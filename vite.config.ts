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
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

function getVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("maplibre-gl")) {
    return "vendor-maplibre";
  }

  if (
    id.includes("recharts") ||
    id.includes("victory-vendor") ||
    id.includes(`${path.sep}d3-`) ||
    id.includes("/d3-")
  ) {
    return "vendor-charts";
  }

  if (id.includes("qrcode") || id.includes("qrcode.react")) {
    return "vendor-qr";
  }

  if (id.includes("@sentry")) {
    return "vendor-sentry";
  }

  if (id.includes("@supabase")) {
    return "vendor-supabase";
  }

  return undefined;
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Permite usar frontend em :8080 com API serverless local (vercel dev) em :3000
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
    },
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
    mode === "production" && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Sentry plugin para upload de source maps (apenas se configurado)
    mode === "production" && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG || "ordax",
      project: process.env.SENTRY_PROJECT || "ordax-saas",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      sourcemaps: {
        assets: './dist/assets/**',
        ignore: ['node_modules'],
        filesToDeleteAfterUpload: ['./dist/assets/**/*.map'],
      },
    }),
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
    mainFields: ['browser', 'module', 'main'],
    // CRÍTICO: Garantir que React não seja duplicado
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: true, // Habilitar source maps para Sentry
    // maplibre-gl já é carregado em chunk isolado e lazy; elevamos o limite
    // para reduzir falso positivo e manter foco em regressões reais.
    chunkSizeWarningLimit: 1100,
    
    rollupOptions: {
      output: {
        // Split explícito apenas para vendors pesados. O restante continua
        // sob heurística do Vite para evitar regressões em carregamento.
        manualChunks: (id) => getVendorChunk(id),
        
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
