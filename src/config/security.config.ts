/**
 * SSOT - Security Configuration
 * 
 * Single Source of Truth for ALL security configurations.
 * 
 * CRITICAL RULES:
 * 1. This is the ONLY place to define security configs
 * 2. All components MUST import from here
 * 3. All generated configs MUST derive from here
 * 4. NO hardcoded security values elsewhere
 * 5. Changes here trigger automatic validation
 * 
 * Architecture:
 * - Type-safe configuration
 * - Immutable by default (as const)
 * - Validated at build time
 * - Auditable and traceable
 * 
 * @module SecurityConfig
 * @version 2.0.0
 * @security-critical
 */

/**
 * Security Domain Registry
 * 
 * Centralized registry of all trusted external domains.
 * Each domain MUST be justified and documented.
 */
export const SECURITY_DOMAINS = {
  // CDN - Content Delivery Network
  CDN_JSDELIVR: {
    url: 'https://cdn.jsdelivr.net',
    purpose: 'Third-party library CDN',
    risk: 'MEDIUM',
    justification: 'Required for external libraries',
    alternatives: 'Self-host libraries (recommended for production)',
  },
  
  // Backend - Supabase
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
  
  // Fonts - Google Fonts
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
  
  // Maps - OpenStreetMap
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

  OPEN_METEO_API: {
    url: 'https://api.open-meteo.com',
    purpose: 'Public weather forecast and current temperature API',
    risk: 'LOW',
    justification: 'Used to show local temperature for the selected territory',
    alternatives: 'Server-side weather proxy or another weather provider',
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
  
  // Monitoring - Sentry
  SENTRY_INGEST: {
    url: 'https://*.ingest.us.sentry.io',
    purpose: 'Error tracking and monitoring',
    risk: 'LOW',
    justification: 'Production error monitoring',
    alternatives: 'Self-hosted Sentry instance',
  },

  // Vercel - Analytics & Speed Insights (injetados automaticamente pelo runtime Vercel)
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

  // Google AdSense - Advertising
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
/**
 * Extract URLs from domain registry
 */
const getDomainUrls = () => {
  return Object.values(SECURITY_DOMAINS).map(d => d.url);
};

/**
 * Content Security Policy Directives
 * 
 * Implements defense-in-depth strategy with restrictive defaults.
 * Each directive is carefully crafted to minimize attack surface.
 * 
 * Security Principles:
 * - Deny by default
 * - Explicit allowlist
 * - No wildcards unless necessary
 * - Regular audit and review
 */
export const CSP_DIRECTIVES = {
  // Default fallback - most restrictive
  'default-src': ["'self'"],
  
  // Scripts - CRITICAL: Most dangerous directive
  // 'unsafe-inline' e 'unsafe-eval' são permitidos APENAS em dev (Vite HMR).
  // Em produção o Vite gera bundles sem inline scripts — não precisamos deles.
  // Os domínios Vercel são necessários para Analytics e preview toolbar.
  // Hashes específicos permitem inline scripts do index.html (AdSense loader e SW cleanup)
  'script-src': [
    "'self'",
    ...(IS_DEV ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    // Hashes dos inline scripts no index.html
    "'sha256-9ll9gJXvcvz1hq1/HNwQ86RhAJQWeiZwEZzJ48i88bM='",
    "'sha256-O162sKaTzi0Yi5Xk/VEeTYLMkdsIVbsGi1ephDdNhZU='",
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.SUPABASE_HTTPS.url,
    SECURITY_DOMAINS.VERCEL_SCRIPTS.url,
    SECURITY_DOMAINS.VERCEL_LIVE.url,
    SECURITY_DOMAINS.CLOUDFLARE_INSIGHTS_SCRIPT.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_SCRIPT.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_ADS.url,
    SECURITY_DOMAINS.GOOGLE_ADSENSE_STATIC.url,
    SECURITY_DOMAINS.GOOGLE_DOUBLECLICK.url,
    SECURITY_DOMAINS.GOOGLE_ADTRAFFIC.url,
    SECURITY_DOMAINS.GOOGLE_CORE.url,
  ],
  
  // Styles - Medium risk
  'style-src': [
    "'self'",
    "'unsafe-inline'",  // Required for styled-components/emotion
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.GOOGLE_FONTS_CSS.url,
  ],
  
  // Fonts - Low risk
  'font-src': [
    "'self'",
    'data:',  // Required for inline fonts
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.GOOGLE_FONTS_FILES.url,
  ],
  
  // Images - Medium risk (data: and blob: required)
  'img-src': [
    "'self'",
    'data:',   // Required for inline images
    'https:',  // Allow all HTTPS images (user content)
    'blob:',   // Required for dynamic images
  ],
  
  // Network connections - CRITICAL: Backend communication
  'connect-src': [
    "'self'",
    SECURITY_DOMAINS.SUPABASE_HTTPS.url,
    SECURITY_DOMAINS.SUPABASE_WSS.url,
    SECURITY_DOMAINS.OPENSTREETMAP_NOMINATIM.url,
    SECURITY_DOMAINS.OPENFREEMAP_TILES.url,
    SECURITY_DOMAINS.OSRM_ROUTER.url,
    SECURITY_DOMAINS.CARTO_BASEMAPS.url,
    SECURITY_DOMAINS.OPEN_METEO_API.url,
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
  
  // Web Workers - Medium risk
  'worker-src': [
    "'self'",
    'blob:',  // Required for MapLibre GL JS workers
  ],
  
  // Frames/iframes - For AdSense ads
  'frame-src': [
    "'self'",
    SECURITY_DOMAINS.GOOGLE_ADSENSE_ADS.url,
    SECURITY_DOMAINS.GOOGLE_DOUBLECLICK.url,
    SECURITY_DOMAINS.GOOGLE_ADTRAFFIC.url,
    SECURITY_DOMAINS.GOOGLE_CORE.url,
  ],
  
  // Frames - CRITICAL: Prevent clickjacking
  'frame-ancestors': ["'none'"],
  
  // Base URI - Prevent base tag injection
  'base-uri': ["'self'"],
  
  // Form actions - Prevent form hijacking
  'form-action': ["'self'"],
  
  // Object/Embed - CRITICAL: Block plugins
  'object-src': ["'none'"],
  
  // Media - Low risk
  'media-src': ["'self'"],
  
  // Manifests - Low risk
  'manifest-src': ["'self'"],
} as const;

/**
 * Generate CSP string for HTTP headers
 * 
 * Converts directive object to CSP header string format.
 * Format: "directive value1 value2; directive2 value1;"
 */
export function generateCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ') + ';';
}

/**
 * Security Headers Configuration
 * 
 * Implements multiple layers of browser-level security.
 * Each header provides specific protection against different attacks.
 */
export const SECURITY_HEADERS = {
  // CSP - Primary XSS defense
  'Content-Security-Policy': generateCSPString(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Control browser features
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
  
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Disable deprecated browser XSS filters; CSP and sanitization are the controls.
  'X-XSS-Protection': '0',
} as const;

/**
 * HTML Sanitization Configuration (DOMPurify)
 * 
 * Whitelist approach - only explicitly allowed tags/attributes pass through.
 * 
 * Security Principles:
 * - Deny by default
 * - Explicit allowlist
 * - No event handlers
 * - No dangerous tags
 */
export const HTML_SANITIZATION_CONFIG = {
  // Allowed HTML tags
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'strong', 'em', 'u', 's', 'mark',
    
    // Links
    'a',
    
    // Lists
    'ul', 'ol', 'li',
    
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    
    // Quotes and code
    'blockquote', 'code', 'pre',
    
    // Tables (if needed)
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  
  // Allowed attributes
  ALLOWED_ATTR: [
    'href',      // Links
    'title',     // Tooltips
    'target',    // Link targets
    'rel',       // Link relationships
    'class',     // Styling (limited)
  ],
  
  // Data attributes - DISABLED for security
  ALLOW_DATA_ATTR: false,
  
  // Forbidden tags - explicit deny list
  FORBID_TAGS: [
    'script',   // JavaScript
    'style',    // CSS injection
    'iframe',   // Frame injection
    'object',   // Plugin injection
    'embed',    // Plugin injection
    'applet',   // Java applets
    'link',     // External resources
    'meta',     // Meta injection
    'base',     // Base URL hijacking
  ],
  
  // Forbidden attributes - explicit deny list
  FORBID_ATTR: [
    // Event handlers
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
    'onmousemove', 'onmouseenter', 'onmouseleave', 'onkeydown',
    'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange',
    'onsubmit', 'onreset', 'onselect', 'onabort', 'ondrag',
    'ondrop', 'oncopy', 'oncut', 'onpaste',
    
    // Dangerous attributes
    'formaction', 'action', 'src', 'data', 'xmlns',
  ],
  
  // Keep comments - NO (can hide malicious code)
  KEEP_CONTENT: false,
  
  // Return DOM - NO (return string for safety)
  RETURN_DOM: false,
  
  // Return DOM fragment - NO
  RETURN_DOM_FRAGMENT: false,
  
  // Force body - YES (wrap in body for consistency)
  FORCE_BODY: true,
  
  // Sanitize DOM - YES (clean existing DOM)
  SANITIZE_DOM: true,
  
  // Whole document - NO (only sanitize content)
  WHOLE_DOCUMENT: false,
} as const;

/**
 * URL Protocol Blocklist
 * 
 * Dangerous protocols that can execute code or leak data.
 * Used by SafeLink component.
 */
export const BLOCKED_URL_PROTOCOLS = [
  'javascript:',  // Execute JavaScript
  'data:',        // Data URLs (can contain scripts)
  'vbscript:',    // VBScript scheme blocked for older browsers
  'file:',        // Local file access
  'about:',       // Browser internals
  'blob:',        // Blob URLs (can be dangerous)
  'filesystem:',  // Filesystem access
] as const;

/**
 * Safe URL Protocol Allowlist
 * 
 * Only these protocols are considered safe for links.
 */
export const ALLOWED_URL_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
] as const;

/**
 * Image Extension Allowlist
 * 
 * Only these image formats are allowed.
 * Prevents SVG injection and other attacks.
 */
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

/**
 * Image URL Protocol Allowlist
 *
 * Separate from link protocols because images may allow safe image data URLs,
 * while interactive links must keep all data: URLs blocked.
 */
export const ALLOWED_IMAGE_PROTOCOLS = [
  'http:',
  'https:',
  'data:',
] as const;

/**
 * Image data URL MIME allowlist
 *
 * SVG is intentionally excluded because it can carry active content.
 */
export const ALLOWED_IMAGE_DATA_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/x-icon',
] as const;

/**
 * Blocked Image Extensions
 * 
 * Dangerous formats that can contain scripts.
 */
export const BLOCKED_IMAGE_EXTENSIONS = [
  '.svg',   // Can contain JavaScript
  '.xml',   // Can contain scripts
  '.html',  // HTML disguised as image
  '.htm',   // HTML disguised as image
] as const;

/**
 * Browser cookie configuration for Supabase auth storage.
 *
 * This SPA can only create browser-readable cookies. HttpOnly must not be
 * claimed here because it requires a server-side auth boundary. The production
 * guarantee in this frontend is strict cookie-only persistence: SameSite=Strict,
 * Secure on HTTPS, no auth token fallback to localStorage, and CSP/sanitization
 * as the XSS control layer.
 */
export const SECURE_COOKIE_CONFIG = {
  // Path - available on all routes
  path: '/',
  
  // SameSite - CRITICAL: Prevents CSRF
  sameSite: 'strict' as const,
  
  // Secure - CRITICAL: HTTPS only
  secure: true,
  
  // Max-Age - 7 days (balance security vs UX)
  maxAge: 60 * 60 * 24 * 7,
  
  // HttpOnly cannot be set by JavaScript. Do not treat this as HttpOnly auth.
  httpOnly: false,
  
  // Domain - Not set (defaults to current domain)
  // domain: undefined,
} as const;

/**
 * Authentication Cookie Prefix
 * 
 * Prefix for all authentication-related cookies.
 * Helps identify and manage auth cookies.
 */
export const AUTH_COOKIE_PREFIX = 'sb-auth' as const;
export const AUTH_STORAGE_KEY = 'acheguese-auth-token' as const;

/**
 * Supabase browser auth storage limits and migration cleanup.
 *
 * Values are centralized because cookie payload size, cleanup timing, and legacy
 * localStorage keys are security-sensitive operational contracts.
 */
export const AUTH_BROWSER_STORAGE_CONFIG = {
  maxCookieChunkSize: 3800,
  maxCookieChunks: 8,
  authUrlCleanupDelayMs: 5 * 1000,
  recoveryEventTimeoutMs: 3 * 1000,
  cookieProbeKey: '__acheguese_auth_cookie_probe__',
  cookieProbeMaxAgeSeconds: 1,
  localStorageProbeKey: '__acheguese_auth_local_storage_probe__',
  legacyLocalStorageKeys: [
    AUTH_STORAGE_KEY,
    'token',
    'sb-auth-token',
  ],
} as const;

/**
 * Rate Limiting Configuration
 * 
 * Client-side rate limiting to prevent abuse.
 */
export const RATE_LIMIT_CONFIG = {
  // Maximum requests per window
  maxRequests: 100,
  
  // Time window in milliseconds (1 minute)
  windowMs: 60 * 1000,
  
  // Block duration after limit exceeded (5 minutes)
  blockDurationMs: 5 * 60 * 1000,
} as const;

/**
 * Input Validation Rules
 * 
 * Maximum lengths for user inputs to prevent DoS.
 */
export const INPUT_VALIDATION = {
  // Text inputs
  MAX_TEXT_LENGTH: 1000,
  MAX_TEXTAREA_LENGTH: 5000,
  MAX_DESCRIPTION_LENGTH: 10000,
  
  // File uploads
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  
  // Arrays
  MAX_ARRAY_LENGTH: 100,
  
  // Strings
  MAX_URL_LENGTH: 2048,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
} as const;

/**
 * Security Audit Log
 * 
 * Track when security config was last reviewed.
 * MUST be updated on every security config change.
 */
export const SECURITY_AUDIT_LOG = {
  lastReview: '2026-06-05',
  reviewer: 'Codex',
  version: '2.14.0',
  changes: [
    'Initial SSOT implementation',
    'CSP directives centralized',
    'Domain registry created',
    'Type-safe configuration',
    'Comprehensive documentation',
    'Browser-readable cookie limitation documented for Vite SPA auth',
    'Defense-in-depth controls centralized without HttpOnly claims',
    'Cache headers added for performance',
    // v2.3.0 — Security fixes
    'FIX: isOriginAllowed — detecção de dev não mais baseada em SUPABASE_URL',
    'FIX: Rate limiting migrado de Map em memória para Deno KV (distribuído)',
    'FIX: auditLog agora persiste na tabela function_audit além do console',
    'FIX: adminAuth — verificação de is_active=true adicionada à query de roles',
    'FIX: auto-dispatch-ride — autenticação migrada de SERVICE_ROLE_KEY para CRON_SECRET',
    'FIX: process-timeouts — fallback para SERVICE_ROLE_KEY como token removido',
    'FIX: send-push — JWT signing real com crypto.subtle (RS256) substituindo btoa placeholder',
    'FIX: MFAService — backup codes gerados com crypto.getRandomValues() em vez de Math.random()',
    'FIX: .env — project ID e anon key reais substituídos por placeholders',
    'FIX: sitemap — CORS wildcard (*) removido, usa getAllSecurityHeaders() do SSOT',
    'FIX: billing checkout/portal — open redirect prevenido com v.redirectUrl() validator',
    'FIX: validation.ts — novo validator redirectUrl() com verificação de domínio permitido',
    // v2.4.0 — Security audit fixes
    'FIX: CSP script-src — unsafe-inline/unsafe-eval removidos de produção (eram hardcoded no vercel.json)',
    'FIX: SECURITY_DOMAINS — domínios Vercel (vitals, scripts, live) adicionados ao registry',
    'FIX: connect-src — VERCEL_VITALS adicionado para Vercel Analytics',
    'FIX: script-src — VERCEL_SCRIPTS e VERCEL_LIVE adicionados para preview toolbar',
    'FIX: storage buckets — políticas de upload com ownership check para business/post/event/classified',
    'FIX: send-push — verificação de ownership (user.id === userId) adicionada',
    'FIX: user-delete-account — userClient migrado de SERVICE_ROLE_KEY para ANON_KEY',
    'FIX: pii_access_log — EXECUTE da função log_pii_access restrito a service_role',
    'FIX: rate limiting — identifier usa CF-Connecting-IP antes de x-forwarded-for',
    'FIX: getCorsHeaders — validação dinâmica de Origin implementada (suporta múltiplas origens)',
    // v2.5.0 — Google AdSense CSP fixes
    'FIX: GOOGLE_ADTRAFFIC — wildcard *.adtrafficquality.google para cobrir ep1, ep2, ep3, etc',
    'FIX: GOOGLE_CORE — domínio *.google.com adicionado para iframe communication',
    'FIX: frame-src — adicionados *.adtrafficquality.google e *.google.com',
    'FIX: script-src — adicionado *.google.com para scripts do AdSense',
    'FIX: connect-src — adicionado *.google.com para conexões do AdSense',
    // v2.6.0 — CSP inline script hashes
    'FIX: script-src — adicionados hashes SHA256 dos inline scripts do index.html',
    'FIX: CSP violation — permite AdSense loader e SW cleanup scripts via hash whitelist',
    // v2.6.1 — Monthly security review
    'AUDIT: revisão mensal de CSP, headers, domínios documentados, vercel.json e hardcodes de segurança sem erros',
    // v2.7.0 — Auth storage hardening
    'FIX: Supabase auth storage migrado para cookie-only sem fallback para localStorage',
    'FIX: Supabase auth flow migrado de implicit para PKCE',
    'FIX: limites de cookie chunking e limpeza de URL centralizados em AUTH_BROWSER_STORAGE_CONFIG',
    // v2.8.0 - URL/media safety centralization
    'FIX: validacao segura de URLs de links e imagens centralizada em utilitario unico',
    'FIX: data URLs de imagem limitadas a MIME types raster seguros',
    // v2.8.1 - IP geolocation CSP
    'FIX: provedores de geolocalizacao por IP registrados no SECURITY_DOMAINS e connect-src',
    // v2.9.0 - SaaS hardening review
    'FIX: send-email restrito ao proprio usuario autenticado e email da sessao',
    'FIX: rate limit por usuario adicionado ao send-email para reduzir abuso',
    'FIX: X-XSS-Protection definido como 0 e defesa de XSS mantida em CSP/sanitizacao',
    // v2.10.0 - Public URL hardening
    'FIX: links de website/redes sociais normalizados e validados antes de renderizar',
    'FIX: imagens de banners, portfolio, CNH e cards publicos migradas para SafeImage',
    // v2.11.0 - Upload and service-role hardening
    'FIX: MediaService valida MIME/tamanho antes de FileReader/canvas e revalida antes do upload',
    'FIX: comprovante de residencia PDF preserva extensao/contentType e foto aceita apenas JPG/PNG',
    'FIX: documentos de verificacao migrados para bucket privado com referencia storage:// e RLS',
    'FIX: territory-ai-content exige admin antes de escrever com service_role',
    // v2.12.0 - Security regression guardrails
    'FIX: security:validate bloqueia Edge Function com service_role sem auth/admin/cron/webhook guard',
    'FIX: security:validate bloqueia getPublicUrl em verification-documents e exige bucket privado com RLS',
    // v2.13.0 - SaaS RLS and view hardening
    'FIX: tabelas publicas de pizzaria agora tem RLS com leitura publica segura e escrita owner/admin',
    'FIX: trigger impede referencias cross-tenant em defaults de pizza_menu_items',
    'FIX: views com GRANT SELECT para anon/authenticated endurecidas com security_invoker=true',
    'FIX: validate:migrations bloqueia tabela publica sem RLS e view publica sem security_invoker',
    // v2.14.0 - Exposed RPC authorization hardening
    'FIX: accept_ride_atomic agora exige driver_profile_id pertencente ao usuario/admin/service_role',
    'FIX: mark_best_answer agora exige autor da pergunta/admin/service_role',
    'FIX: increment_alert_edit_count agora exige dono do alerta/admin/service_role',
    'FIX: expire_stale_work_opportunities ignora p_now de clientes e aceita override apenas service_role',
    'FIX: validate:migrations bloqueia RPC mutante SECURITY DEFINER exposto sem guarda de auth',
  ],
  nextReview: '2026-07-04',
} as const;

/**
 * Cache Control Headers Configuration
 * 
 * Optimized caching strategy for different asset types.
 * Balances performance with freshness requirements.
 * 
 * Patterns use Vercel-compatible syntax:
 * - /assets/:path* for wildcard paths
 * - *.ext for file extensions
 */
export const CACHE_HEADERS = {
  // Static assets (JS, CSS) - Immutable with hash
  STATIC_ASSETS: {
    pattern: '/assets/:path*',
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  
  // Images - Stale while revalidate
  IMAGES: {
    pattern: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico)',
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  },
  
  // Fonts - Long cache
  FONTS: {
    pattern: '/:path*.(woff|woff2|ttf|otf|eot)',
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  
  // HTML - No cache (always fresh)
  HTML: {
    pattern: '/:path*.html',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  
  // Service Worker - No cache
  SERVICE_WORKER: {
    pattern: '/sw.js',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  
  // Manifest - Short cache
  MANIFEST: {
    pattern: '/manifest.json',
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  },
} as const;

/**
 * Security Configuration Metadata
 * 
 * Metadata about this configuration file.
 */
export const SECURITY_CONFIG_METADATA = {
  version: '2.14.0',
  created: '2026-04-18',
  lastModified: '2026-06-05',
  author: 'Kiro AI',
  purpose: 'Single Source of Truth for security configurations',
  criticality: 'CRITICAL',
  changeControl: 'Requires security review and approval',
  httpOnly: 'SERVER_SIDE_REQUIRED',
  architecture: 'Vite SPA with cookie-only browser auth storage',
} as const;

/**
 * Type Exports
 * 
 * Export types for type-safe usage across the application.
 */
export type SecurityDomain = keyof typeof SECURITY_DOMAINS;
export type CSPDirective = keyof typeof CSP_DIRECTIVES;
export type SecurityHeader = keyof typeof SECURITY_HEADERS;
export type AllowedImageExtension = typeof ALLOWED_IMAGE_EXTENSIONS[number];
export type BlockedImageExtension = typeof BLOCKED_IMAGE_EXTENSIONS[number];
export type AllowedImageProtocol = typeof ALLOWED_IMAGE_PROTOCOLS[number];
export type AllowedImageDataMimeType = typeof ALLOWED_IMAGE_DATA_MIME_TYPES[number];
export type AllowedURLProtocol = typeof ALLOWED_URL_PROTOCOLS[number];
export type BlockedURLProtocol = typeof BLOCKED_URL_PROTOCOLS[number];

/**
 * Validation Functions
 * 
 * Runtime validation of security configurations.
 */

/**
 * Validate that CSP is properly configured
 */
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
  
  // Check critical directives exist
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
  
  // Check for dangerous values only outside dev runtime.
  if (!IS_DEV) {
    if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-inline'")) {
      errors.push("WARNING: 'unsafe-inline' in script-src is dangerous");
    }

    if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-eval'")) {
      errors.push("WARNING: 'unsafe-eval' in script-src is dangerous");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL protocol
 */
export function isURLProtocolSafe(url: string): boolean {
  const protocol = url.split(':')[0]?.toLowerCase() + ':';
  return ALLOWED_URL_PROTOCOLS.includes(protocol as AllowedURLProtocol);
}

/**
 * Validate image extension
 */
export function isImageExtensionSafe(filename: string): boolean {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return false;
  
  return (
    ALLOWED_IMAGE_EXTENSIONS.includes(extension as AllowedImageExtension) &&
    !BLOCKED_IMAGE_EXTENSIONS.includes(extension as BlockedImageExtension)
  );
}

/**
 * Get security configuration summary
 */
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

// Validate configuration on module load (build-time check)
// Only in development/build context (not in Node.js scripts)
if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV && import.meta.env.VITE_SECURITY_DEBUG === 'true') {
  const validation = validateCSPConfig();
  if (!validation.valid) {
    console.warn('Security Configuration Warnings:', validation.errors);
  }
}
