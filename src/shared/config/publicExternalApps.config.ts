type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

export const PUBLIC_EXTERNAL_APPS = {
  catalog: {
    id: "catalog",
    label: "Catálogo",
    publicPath: "/tonecosstudios/",
    mountPath: "/tonecosstudios",
    legacyMountPath: "/catalogo",
    visitorRedirectSource: "/((?!tonecosstudios(?:/|$)|catalogo-api(?:/|$)|release\\.json$).*)",
    upstreamOrigin: "https://washingtonmsdj.github.io/catalogo",
    apiMountPath: "/catalogo-api",
    apiUpstreamOrigin: "https://tonecos-catalogo-api.ordax-ac1ca1b50d09.workers.dev",
  },
} as const;

export const PUBLIC_CATALOG_PATH = PUBLIC_EXTERNAL_APPS.catalog.publicPath;

export const PUBLIC_CATALOG_ANNOUNCEMENT_ENABLED =
  (publicEnv.VITE_PUBLIC_CATALOG_ANNOUNCEMENT ?? "true") === "true";
