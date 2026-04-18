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
} as const;

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
  'script-src': [
    "'self'",
    "'unsafe-inline'",  // TODO: Remove after refactoring inline scripts
    "'unsafe-eval'",    // TODO: Remove after removing eval() usage
    SECURITY_DOMAINS.CDN_JSDELIVR.url,
    SECURITY_DOMAINS.SUPABASE_HTTPS.url,
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
  ],
  
  // Web Workers - Medium risk
  'worker-src': [
    "'self'",
    'blob:',  // Required for MapLibre GL JS workers
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
  
  // XSS Protection (legacy, but defense-in-depth)
  // Note: Deprecated but kept for older browsers
  'X-XSS-Protection': '1; mode=block',
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
  'vbscript:',    // VBScript (IE legacy)
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
 * Secure Cookie Configuration
 * 
 * Implements secure cookie best practices.
 * Used by cookie storage implementation.
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
  
  // HttpOnly - Would be ideal but requires server-side
  // Currently false (client-side cookies)
  // TODO: Implement server-side middleware for true HttpOnly
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
  lastReview: '2026-04-18',
  reviewer: 'Kiro AI',
  version: '2.0.0',
  changes: [
    'Initial SSOT implementation',
    'CSP directives centralized',
    'Domain registry created',
    'Type-safe configuration',
    'Comprehensive documentation',
  ],
  nextReview: '2026-05-18', // Monthly review
} as const;

/**
 * Security Configuration Metadata
 * 
 * Metadata about this configuration file.
 */
export const SECURITY_CONFIG_METADATA = {
  version: '2.0.0',
  created: '2026-04-18',
  lastModified: '2026-04-18',
  author: 'Kiro AI',
  purpose: 'Single Source of Truth for security configurations',
  criticality: 'CRITICAL',
  changeControl: 'Requires security review and approval',
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
  
  // Check critical directives exist
  const criticalDirectives: CSPDirective[] = [
    'default-src',
    'script-src',
    'frame-ancestors',
    'base-uri',
  ];
  
  for (const directive of criticalDirectives) {
    if (!CSP_DIRECTIVES[directive]) {
      errors.push(`Missing critical CSP directive: ${directive}`);
    }
  }
  
  // Check for dangerous values
  if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-inline'")) {
    errors.push("WARNING: 'unsafe-inline' in script-src is dangerous");
  }
  
  if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-eval'")) {
    errors.push("WARNING: 'unsafe-eval' in script-src is dangerous");
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
if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
  const validation = validateCSPConfig();
  if (!validation.valid) {
    console.warn('⚠️ Security Configuration Warnings:', validation.errors);
  }
}
