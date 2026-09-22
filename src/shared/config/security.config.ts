/**
 * Security configuration SSOT.
 *
 * External origins, CSP, browser auth storage limits and shared validation
 * contracts live here so deployment headers and runtime consumers do not grow
 * independent security allowlists.
 */

export const SECURITY_DOMAINS = {
  CDN_JSDELIVR: {
    url: 'https://cdn.jsdelivr.net',
    purpose: 'Third-party library CDN',
    risk: 'MEDIUM',
    justification: 'Required for external libraries',
    alternatives: 'Self-host libraries (recommended for production)',
  },
  SUPABASE_HTTPS: {
    url: 'https://*.supabase.co',
    purpose: 'Backend API and authentication',
    risk: 'LOW',
    justification: 'Core backend infrastructure',
    alternatives: 'None (core dependency)',
  },
  SUPABASE_WSS: {
    url: 'wss://*.supabase.co',
    purpose: 'Real-time WebSocket connections',
    risk: 'LOW',
    justification: 'Real-time features',
    alternatives: 'None (core dependency)',
  },
  HIBP_PASSWORDS: {
    url: 'https://api.pwnedpasswords.com',
    purpose: 'k-Anonymity leaked-password range lookup',
    risk: 'LOW',
    justification: 'Blocks known compromised passwords without sending the password or full hash',
    alternatives: 'Supabase leaked-password protection when the hosted plan supports it',
  },
  GOOGLE_FONTS_CSS: {
    url: 'https://fonts.googleapis.com',
    purpose: 'Font stylesheets',
    risk: 'LOW',
    justification: 'Typography',
    alternatives: 'Self-host fonts (recommended)',
  },
  GOOGLE_FONTS_FILES: {
    url: 'https://fonts.gstatic.com',
    purpose: 'Font files (woff2, ttf)',
    risk: 'LOW',
    justification: 'Typography',
    alternatives: 'Self-host fonts (recommended)',
  },
  OPENSTREETMAP_NOMINATIM: {
    url: 'https://nominatim.openstreetmap.org',
    purpose: 'Geocoding and reverse geocoding',
    risk: 'LOW',
    justification: 'Location services',
    alternatives: 'Self-hosted Nominatim instance',
  },
  OPENFREEMAP_TILES: {
    url: 'https://tiles.openfreemap.org',
    purpose: 'Map tiles',
    risk: 'LOW',
    justification: 'Map rendering',
    alternatives: 'Self-hosted tile server',
  },
  OSRM_ROUTER: {
    url: 'https://router.project-osrm.org',
    purpose: 'Route calculation and navigation',
    risk: 'LOW',
    justification: 'Routing service for mobility features',
    alternatives: 'Self-hosted OSRM instance',
  },
  CARTO_BASEMAPS: {
    url: 'https://basemaps.cartocdn.com',
    purpose: 'MapLibre base map style and tile metadata',
    risk: 'LOW',
    justification: 'Required by the configured dark matter base map style',
    alternatives: 'Self-hosted style JSON and tiles',
  },
  CARTO_BASEMAP_TILES: {
    url: 'https://tiles.basemaps.cartocdn.com',
    purpose: 'MapLibre vector tile metadata and sprites for CARTO basemaps',
    risk: 'LOW',
    justification: 'Required by CARTO style JSON references used by the configured base map',
    alternatives: 'Self-hosted style assets and vector tiles',
  },
  OPEN_METEO_API: {
    url: 'https://api.open-meteo.com',
    purpose: 'Public weather forecast and current temperature API',
    risk: 'LOW',
    justification: 'Used to show local temperature for the selected territory',
    alternatives: 'Server-side weather proxy or another weather provider',
  },
  ARCGIS_BOUNDARIES: {
    url: 'https://services6.arcgis.com',
    purpose: 'Official territorial boundary GeoJSON source',
    risk: 'LOW',
    justification: 'Used to fetch municipal neighborhood geometries registered in location_boundaries',
    alternatives: 'Store normalized GeoJSON in Supabase and serve from first-party API',
  },
  IPAPI_GEOLOCATION: {
    url: 'https://ipapi.co',
    purpose: 'IP-based geolocation fallback',
    risk: 'LOW',
    justification: 'Used only when browser GPS is unavailable or denied',
    alternatives: 'Server-side geolocation proxy or self-hosted GeoIP database',
  },
  IPWHOIS_GEOLOCATION: {
    url: 'https://ipwho.is',
    purpose: 'Secondary IP-based geolocation fallback',
    risk: 'LOW',
    justification: 'HTTPS replacement for insecure ip-api.com fallback',
    alternatives: 'Server-side geolocation proxy or self-hosted GeoIP database',
  },
  SENTRY_INGEST: {
    url: 'https://*.ingest.us.sentry.io',
    purpose: 'Error tracking and monitoring',
    risk: 'LOW',
    justification: 'Production error monitoring',
    alternatives: 'Self-hosted Sentry instance',
  },
  VERCEL_VITALS: {
    url: 'https://vitals.vercel-insights.com',
    purpose: 'Web Vitals analytics',
    risk: 'LOW',
    justification: 'Performance monitoring via Vercel Analytics',
    alternatives: 'Disable Vercel Analytics',
  },
  VERCEL_SCRIPTS: {
    url: 'https://va.vercel-scripts.com',
    purpose: 'Vercel Analytics script',
    risk: 'LOW',
    justification: 'Required for Vercel Analytics to function',
    alternatives: 'Disable Vercel Analytics',
  },
  VERCEL_LIVE: {
    url: 'https://*.vercel.live',
    purpose: 'Vercel preview/live collaboration toolbar',
    risk: 'LOW',
    justification: 'Required for Vercel preview deployments',
    alternatives: 'Only present in preview environments',
  },
  CLOUDFLARE_INSIGHTS_SCRIPT: {
    url: 'https://static.cloudflareinsights.com',
    purpose: 'Cloudflare Web Analytics beacon script',
    risk: 'LOW',
    justification: 'Required when Cloudflare Web Analytics injects the beacon on production pages',
    alternatives: 'Disable Cloudflare Web Analytics injection',
  },
  CLOUDFLARE_INSIGHTS_COLLECT: {
    url: 'https://cloudflareinsights.com',
    purpose: 'Cloudflare Web Analytics collection endpoint',
    risk: 'LOW',
    justification: 'Required for Cloudflare Web Analytics beacon delivery',
    alternatives: 'Disable Cloudflare Web Analytics injection',
  },
  CLOUDFLARE_TURNSTILE: {
    url: 'https://challenges.cloudflare.com',
    purpose: 'Cloudflare Turnstile client script and challenge iframe',
    risk: 'MEDIUM',
    justification: 'Required for production anti-abuse verification on protected forms',
    alternatives: 'Replace Turnstile with an equivalent server-verified anti-abuse provider',
  },
  STRIPE_CHECKOUT: {
    url: 'https://checkout.stripe.com',
    purpose: 'Stripe hosted checkout redirect',
    risk: 'LOW',
    justification: 'Required for billing checkout sessions',
    alternatives: 'Self-hosted checkout with higher PCI scope',
  },
  STRIPE_BILLING_PORTAL: {
    url: 'https://billing.stripe.com',
    purpose: 'Stripe hosted customer portal redirect',
    risk: 'LOW',
    justification: 'Required for customer subscription management',
    alternatives: 'Self-hosted billing portal with higher PCI scope',
  },
  GOOGLE_ADSENSE_SCRIPT: {
    url: 'https://pagead2.googlesyndication.com',
    purpose: 'Google AdSense advertising scripts',
    risk: 'MEDIUM',
    justification: 'Monetization via Google AdSense',
    alternatives: 'Alternative ad networks or direct sponsorships',
  },
  GOOGLE_ADSENSE_ADS: {
    url: 'https://*.googlesyndication.com',
    purpose: 'Google AdSense ad delivery',
    risk: 'MEDIUM',
    justification: 'Required for displaying AdSense ads',
    alternatives: 'Alternative ad networks',
  },
  GOOGLE_ADSENSE_STATIC: {
    url: 'https://*.googleadservices.com',
    purpose: 'Google AdSense static resources',
    risk: 'MEDIUM',
    justification: 'Ad assets and tracking',
    alternatives: 'Alternative ad networks',
  },
  GOOGLE_DOUBLECLICK: {
    url: 'https://*.doubleclick.net',
    purpose: 'Google DoubleClick ad serving',
    risk: 'MEDIUM',
    justification: 'Ad delivery infrastructure',
    alternatives: 'Alternative ad networks',
  },
  GOOGLE_ADTRAFFIC: {
    url: 'https://*.adtrafficquality.google',
    purpose: 'Google Ad Traffic Quality monitoring (all endpoints)',
    risk: 'LOW',
    justification: 'Ad fraud detection and quality monitoring - uses multiple endpoints (ep1, ep2, etc)',
    alternatives: 'None (required by AdSense)',
  },
  GOOGLE_CORE: {
    url: 'https://*.google.com',
    purpose: 'Google core services for AdSense',
    risk: 'MEDIUM',
    justification: 'Required for AdSense iframe communication and core functionality',
    alternatives: 'None (required by AdSense)',
  },
} as const;

const IS_DEV = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

export const COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG = {
  minimumFillMs: 3_000,
  turnstileAction: 'community-interest',
  turnstileRequiredInProduction: true,
} as const;

export const TURNSTILE_CLIENT_CONFIG = {
  origin: SECURITY_DOMAINS.CLOUDFLARE_TURNSTILE.url,
  scriptUrl: `${SECURITY_DOMAINS.CLOUDFLARE_TURNSTILE.url}/turnstile/v0/api.js`,
} as const;

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    ...(IS_DEV ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.SUPABASE_HTTPS.url,
    SECURITY_DOMAINS.VERCEL_SCRIPTS.url,
    SECURITY_DOMAINS.VERCEL_LIVE.url,
    SECURITY_DOMAINS.CLOUDFLARE_INSIGHTS_SCRIPT.url,
    SECURITY_DOMAINS.CLOUDFLARE_TURNSTILE.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_SCRIPT.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_ADS.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_STATIC.url,
    SECURITY_DOMAINS.GOOGLE_DOUBLECLICK.url,
    SECURITY_DOMAINS.GOOGLE_ADTRAFFIC.url,
    SECURITY_DOMAINS.GOOGLE_CORE.url,
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.GOOGLE_FONTS_CSS.url,
  ],
  'font-src': [
    "'self'",
    'data:',
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.GOOGLE_FONTS_FILES.url,
  ],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    SECURITY_DOMAINS.SUPABASE_HTTPS.url,
    SECURITY_DOMAINS.SUPABASE_WSS.url,
    SECURITY_DOMAINS.HIBP_PASSWORDS.url,
    SECURITY_DOMAINS.OPENSTREETMAP_NOMINATIM.url,
    SECURITY_DOMAINS.OPENFREEMAP_TILES.url,
    SECURITY_DOMAINS.OSRM_ROUTER.url,
    SECURITY_DOMAINS.CARTO_BASEMAPS.url,
    SECURITY_DOMAINS.CARTO_BASEMAP_TILES.url,
    SECURITY_DOMAINS.OPEN_METEO_API.url,
    SECURITY_DOMAINS.ARCGIS_BOUNDARIES.url,
    SECURITY_DOMAINS.IPAPI_GEOLOCATION.url,
    SECURITY_DOMAINS.IPWHOIS_GEOLOCATION.url,
    SECURITY_DOMAINS.SENTRY_INGEST.url,
    SECURITY_DOMAINS.VERCEL_VITALS.url,
    SECURITY_DOMAINS.CLOUDFLARE_INSIGHTS_COLLECT.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_SCRIPT.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_ADS.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_STATIC.url,
    SECURITY_DOMAINS.GOOGLE_DOUBLECLICK.url,
    SECURITY_DOMAINS.GOOGLE_ADTRAFFIC.url,
    SECURITY_DOMAINS.GOOGLE_CORE.url,
  ],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': [
    "'self'",
    SECURITY_DOMAINS.CLOUDFLARE_TURNSTILE.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_ADS.url,
    SECURITY_DOMAINS.GOOGLE_DOUBLECLICK.url,
    SECURITY_DOMAINS.GOOGLE_ADTRAFFIC.url,
    SECURITY_DOMAINS.GOOGLE_CORE.url,
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'manifest-src': ["'self'"],
} as const;

export function generateCSPString(): string {
  return (
    Object.entries(CSP_DIRECTIVES)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ') + ';'
  );
}

export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPString(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '0',
} as const;

export const HTML_SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'mark',
    'a',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed', 'applet', 'link', 'meta', 'base',
  ],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
    'onmousemove', 'onmouseenter', 'onmouseleave', 'onkeydown',
    'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange',
    'onsubmit', 'onreset', 'onselect', 'onabort', 'ondrag',
    'ondrop', 'oncopy', 'oncut', 'onpaste',
    'formaction', 'action', 'src', 'data', 'xmlns',
  ],
  KEEP_CONTENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: true,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
} as const;

export const BLOCKED_URL_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
  'filesystem:',
] as const;

export const ALLOWED_URL_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.bmp',
  '.ico',
] as const;

export const ALLOWED_IMAGE_PROTOCOLS = ['http:', 'https:', 'data:'] as const;

export const ALLOWED_IMAGE_DATA_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/x-icon',
] as const;

export const BLOCKED_IMAGE_EXTENSIONS = ['.svg', '.xml', '.html', '.htm'] as const;

export const SECURE_COOKIE_CONFIG = {
  path: '/',
  // Auth callbacks are top-level navigations from Supabase, Google, or an
  // email client. Strict would drop the PKCE verifier on that cross-site
  // navigation and make a valid confirmation link look unauthenticated.
  sameSite: 'lax' as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: false,
} as const;

export const AUTH_COOKIE_PREFIX = 'sb-auth' as const;
export const AUTH_STORAGE_KEY = 'acheguese-auth-token' as const;

export const AUTH_BROWSER_STORAGE_CONFIG = {
  maxCookieChunkSize: 3800,
  maxCookieChunks: 8,
  authUrlCleanupDelayMs: 5 * 1000,
  recoveryEventTimeoutMs: 3 * 1000,
  cookieProbeKey: '__acheguese_auth_cookie_probe__',
  cookieProbeMaxAgeSeconds: 1,
  localStorageProbeKey: '__acheguese_auth_local_storage_probe__',
  legacyLocalStorageKeys: [AUTH_STORAGE_KEY, 'token', 'sb-auth-token'],
} as const;

export const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
} as const;

export const INPUT_VALIDATION = {
  MAX_TEXT_LENGTH: 1000,
  MAX_TEXTAREA_LENGTH: 5000,
  MAX_DESCRIPTION_LENGTH: 10000,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_IMAGE_SIZE: 2 * 1024 * 1024,
  MAX_ARRAY_LENGTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
} as const;

export const SECURITY_AUDIT_LOG = {
  lastReview: '2026-09-16',
  reviewer: 'OpenAI',
  version: '2.24.0',
  changes: [
    'CSP/security domain registry remain the canonical browser security authority',
    'HIBP k-Anonymity endpoint explicitly allowed in connect-src',
    'Historical change log moved out of executable configuration to keep the SSOT operational',
  ],
  nextReview: '2026-10-16',
} as const;

export const CACHE_HEADERS = {
  STATIC_ASSETS: {
    pattern: '/assets/:path*',
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  },
  IMAGES: {
    pattern: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico)',
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  },
  FONTS: {
    pattern: '/:path*.(woff|woff2|ttf|otf|eot)',
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  },
  HTML: {
    pattern: '/:path*.html',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  RELEASE_IDENTITY: {
    pattern: '/release.json',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  SERVICE_WORKER: {
    pattern: '/sw.js',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  SERVICE_WORKER_COMPAT: {
    pattern: '/service-worker.js',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  MANIFEST: {
    pattern: '/manifest.json',
    headers: { 'Cache-Control': 'public, max-age=3600' },
  },
} as const;

export const SECURITY_CONFIG_METADATA = {
  version: '2.24.0',
  created: '2026-04-18',
  lastModified: '2026-09-21',
  author: 'Achegue-se engineering',
  purpose: 'Single Source of Truth for security configurations',
  criticality: 'CRITICAL',
  changeControl: 'Requires security review and approval',
  httpOnly: 'SERVER_SIDE_REQUIRED',
  architecture: 'Vite SPA with cookie-only browser auth storage',
} as const;

export type SecurityDomain = keyof typeof SECURITY_DOMAINS;
export type CSPDirective = keyof typeof CSP_DIRECTIVES;
export type SecurityHeader = keyof typeof SECURITY_HEADERS;
export type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];
export type BlockedImageExtension = (typeof BLOCKED_IMAGE_EXTENSIONS)[number];
export type AllowedImageProtocol = (typeof ALLOWED_IMAGE_PROTOCOLS)[number];
export type AllowedImageDataMimeType = (typeof ALLOWED_IMAGE_DATA_MIME_TYPES)[number];
export type AllowedURLProtocol = (typeof ALLOWED_URL_PROTOCOLS)[number];
export type BlockedURLProtocol = (typeof BLOCKED_URL_PROTOCOLS)[number];

export function validateCSPConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const getDirectiveValue = (directive: CSPDirective): readonly string[] => {
    switch (directive) {
      case 'default-src':
        return CSP_DIRECTIVES['default-src'];
      case 'script-src':
        return CSP_DIRECTIVES['script-src'];
      case 'frame-ancestors':
        return CSP_DIRECTIVES['frame-ancestors'];
      case 'base-uri':
        return CSP_DIRECTIVES['base-uri'];
      default:
        return [];
    }
  };

  const criticalDirectives: CSPDirective[] = [
    'default-src',
    'script-src',
    'frame-ancestors',
    'base-uri',
  ];

  for (const directive of criticalDirectives) {
    if (getDirectiveValue(directive).length === 0) {
      errors.push(`Missing critical CSP directive: ${directive}`);
    }
  }

  if (!IS_DEV) {
    if (CSP_DIRECTIVES['script-src'].includes("'unsafe-inline'")) {
      errors.push("WARNING: 'unsafe-inline' in script-src is dangerous");
    }
    if (CSP_DIRECTIVES['script-src'].includes("'unsafe-eval'")) {
      errors.push("WARNING: 'unsafe-eval' in script-src is dangerous");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isURLProtocolSafe(url: string): boolean {
  const protocol = `${url.split(':')[0]?.toLowerCase()}:`;
  return ALLOWED_URL_PROTOCOLS.includes(protocol as AllowedURLProtocol);
}

export function isImageExtensionSafe(filename: string): boolean {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return false;
  return (
    ALLOWED_IMAGE_EXTENSIONS.includes(extension as AllowedImageExtension) &&
    !BLOCKED_IMAGE_EXTENSIONS.includes(extension as BlockedImageExtension)
  );
}

export function getSecurityConfigSummary() {
  return {
    version: SECURITY_CONFIG_METADATA.version,
    lastModified: SECURITY_CONFIG_METADATA.lastModified,
    totalDomains: Object.keys(SECURITY_DOMAINS).length,
    cspDirectives: Object.keys(CSP_DIRECTIVES).length,
    securityHeaders: Object.keys(SECURITY_HEADERS).length,
    lastAudit: SECURITY_AUDIT_LOG.lastReview,
    nextAudit: SECURITY_AUDIT_LOG.nextReview,
  };
}

if (
  typeof import.meta.env !== 'undefined' &&
  import.meta.env.DEV &&
  import.meta.env.VITE_SECURITY_DEBUG === 'true'
) {
  const validation = validateCSPConfig();
  if (!validation.valid) {
    console.warn('Security Configuration Warnings:', validation.errors);
  }
}
