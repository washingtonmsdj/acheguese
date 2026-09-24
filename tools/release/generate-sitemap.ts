import type { SitemapSurfaceKey } from "@/core/routing/seo/generateSitemap";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env", override: false });

const PRODUCTION_SITEMAP_BASE_URL = "https://acheguese.com.br";

function isLocalBaseUrl(value: string | undefined): boolean {
  if (!value) return true;

  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return true;
  }
}

function configureSitemapBaseUrl(): void {
  const explicitSitemapBaseUrl = process.env.SITEMAP_PUBLIC_SITE_URL?.trim();
  if (explicitSitemapBaseUrl) {
    process.env.VITE_PUBLIC_SITE_URL = explicitSitemapBaseUrl;
    return;
  }

  if (isLocalBaseUrl(process.env.VITE_PUBLIC_SITE_URL?.trim())) {
    process.env.VITE_PUBLIC_SITE_URL = PRODUCTION_SITEMAP_BASE_URL;
  }
}

function allowTransientSourceFallback(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.SITEMAP_ALLOW_TRANSIENT_SOURCE_FALLBACK === "1"
  );
}

async function main() {
  configureSitemapBaseUrl();

  const [
    { generateAndSaveSitemap },
    { logger },
    { isPlatformCapabilityEnabled, isProductModuleEnabled },
  ] = await Promise.all([
    import("@/core/routing/seo/generateSitemap"),
    import("@/shared/utils/logger"),
    import("@/app/config/lifecycleRegistry"),
  ]);

  const isSitemapSurfaceEnabled = (surface: SitemapSurfaceKey): boolean => {
    if (surface === "map" || surface === "nearby") {
      return isPlatformCapabilityEnabled(surface);
    }
    return isProductModuleEnabled(surface);
  };

  await generateAndSaveSitemap({
    allowTransientSourceFallback: allowTransientSourceFallback(),
    surfaceScope: {
      isEnabled: isSitemapSurfaceEnabled,
    },
  });

  logger.info("scripts.generate-sitemap.success");
}

main().catch((error) => {
  console.error("[scripts.generate-sitemap] failure", error);
  process.exitCode = 1;
});
