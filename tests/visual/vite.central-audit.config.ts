import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

const fixture = fileURLToPath(
  new URL("./central-audit-fixtures.tsx", import.meta.url),
);
/** Separate test server. Never included by the app's Vite config or route graph. */
export default defineConfig({
  cacheDir: ".tmp/central-audit-vite",
  optimizeDeps: { entries: ["tests/visual/central-audit.html"] },
  plugins: [
    {
      name: "central-audit-relative-profile-fixture",
      enforce: "pre",
      resolveId(source, importer) {
        if (
          source === "../contexts/multi-profile-runtime-context" &&
          importer?.endsWith("/MultiProfileSwitcher.tsx")
        )
          return fixture;
      },
    },
    react(),
  ],
  resolve: {
    alias: [
      ...[
        "@/core/business/hooks/useBusiness",
        "@/core/business/hooks/useDashboardAccess",
        "@/core/business/hooks/useResolvedBusinessPublicUrl",
        "@/core/session/hooks/useSessionContext",
        "@/core/profiles/contexts/multi-profile-runtime-context",
        "@/core/profiles/components/ProfileMembersManager",
        "@/modules/business/dashboard/hooks/useBusinessGallery",
      ].map((find) => ({ find, replacement: fixture })),
      {
        find: "@",
        replacement: fileURLToPath(new URL("../../src", import.meta.url)),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
});
