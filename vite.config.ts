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
    id.includes("class-variance-authority") ||
    id.includes("clsx") ||
    id.includes("tailwind-merge")
  ) {
    return "vendor-utils";
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

  if (
    id.includes("react-router-dom") ||
    id.includes("@tanstack/react-query") ||
    id.includes("zustand")
  ) {
    return "vendor-runtime";
  }

  if (id.includes("@radix-ui")) {
    return "vendor-radix";
  }

  if (id.includes("framer-motion")) {
    return "vendor-motion";
  }

  if (
    id.includes("date-fns") ||
    id.includes("zod") ||
    id.includes("lodash-es")
  ) {
    return "vendor-utils";
  }

  return undefined;
}

export default defineConfig(({ command, mode }) => {
  const shouldUploadSourcemaps =
    mode === "production" && Boolean(process.env.SENTRY_AUTH_TOKEN);
  const skipSourcemap = process.env.VITE_SKIP_SOURCEMAP === "true";
  const skipCompressedSize = process.env.VITE_SKIP_COMPRESSED_SIZE === "true";
  const shouldAnalyzeBundle =
    command === "build" &&
    (mode === "analyze" || process.env.ANALYZE_BUNDLE === "true");

  return {
    server: {
      host: process.env.VITE_DEV_HOST || "127.0.0.1",
      port: 8080,
      proxy: {
        "/api": {
          target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: false,
      },
      allowedHosts: [
        ".ngrok-free.dev",
        ".ngrok.io",
        ".ngrok-free.app",
        ".loca.lt",
        ".localhost.run",
      ],
    },

    plugins: [
      react(),
      mode === "development" ? componentTagger() : null,
      shouldAnalyzeBundle
        ? visualizer({
            filename: "./dist/stats.html",
            open: false,
            gzipSize: false,
            brotliSize: false,
          })
        : null,
      shouldUploadSourcemaps
        ? sentryVitePlugin({
            org: process.env.SENTRY_ORG || "ordax",
            project: process.env.SENTRY_PROJECT || "ordax-saas",
            authToken: process.env.SENTRY_AUTH_TOKEN,
            telemetry: false,
            sourcemaps: {
              assets: "./dist/assets/**",
              ignore: ["node_modules"],
              filesToDeleteAfterUpload: ["./dist/assets/**/*.map"],
            },
          })
        : null,
    ].filter((plugin): plugin is NonNullable<typeof plugin> => plugin !== null),

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
        lodash: "lodash-es",
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
      mainFields: ["browser", "module", "main"],
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },

    build: {
      target: "es2020",
      minify: "esbuild",
      cssCodeSplit: true,
      sourcemap: shouldUploadSourcemaps && !skipSourcemap,
      reportCompressedSize: !skipCompressedSize,
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks: (id) => getVendorChunk(id),
          hoistTransitiveImports: false,
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "lodash-es",
      ],
    },

    preview: {
      port: 8080,
      host: process.env.VITE_PREVIEW_HOST || "127.0.0.1",
    },
  };
});
