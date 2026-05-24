import { PLATFORM_BRAND } from "@/shared/config/brand";

/**
 * Site Settings Configuration - SSOT
 * 
 * Configurações centralizadas para o sistema de branding
 * Todos os valores padrão, buckets e paths devem vir daqui
 */

/**
 * Storage Configuration
 */
export const SITE_SETTINGS_STORAGE = {
  BUCKET: 'public-assets',
  PATHS: {
    BRANDING: 'branding',
    LOGOS: 'branding/logos',
    FAVICONS: 'branding/favicons',
  },
  MAX_FILE_SIZE: {
    LOGO: 2 * 1024 * 1024, // 2MB
    FAVICON: 500 * 1024, // 500KB
  },
  ALLOWED_TYPES: {
    LOGO: ['image/png', 'image/jpeg', 'image/svg+xml'],
    FAVICON: ['image/png', 'image/x-icon'],
  },
  RECOMMENDED_SIZES: {
    LOGO_DESKTOP: {
      width: 180,
      height: 48,
      description: 'Logo horizontal para desktop (topbar altura 64px) - Alta resolução',
    },
    LOGO_MOBILE: {
      width: 48,
      height: 48,
      description: 'Logo quadrada/ícone para mobile - Alta resolução',
    },
    FAVICON: {
      width: 64,
      height: 64,
      description: 'Favicon para navegador - Alta resolução (será redimensionado automaticamente)',
    },
  },
} as const;

/**
 * Setting Keys - SSOT para chaves de configuração
 */
export const SITE_SETTING_KEYS = {
  LOGO_URL: 'logo_url',
  LOGO_MOBILE_URL: 'logo_mobile_url',
  FAVICON_URL: 'favicon_url',
  PRIMARY_COLOR: 'primary_color',
  SECONDARY_COLOR: 'secondary_color',
  SITE_NAME: 'site_name',
  SITE_TAGLINE: 'site_tagline',
} as const;

/**
 * Default Values - SSOT para valores padrão
 * IMPORTANTE: Estes valores devem estar sincronizados com o seed SQL
 */
export const SITE_SETTINGS_DEFAULTS = {
  [SITE_SETTING_KEYS.LOGO_URL]: '',
  [SITE_SETTING_KEYS.LOGO_MOBILE_URL]: '',
  [SITE_SETTING_KEYS.FAVICON_URL]: '',
  [SITE_SETTING_KEYS.PRIMARY_COLOR]: '#3b82f6',
  [SITE_SETTING_KEYS.SECONDARY_COLOR]: '#8b5cf6',
  [SITE_SETTING_KEYS.SITE_NAME]: PLATFORM_BRAND.name,
  [SITE_SETTING_KEYS.SITE_TAGLINE]: PLATFORM_BRAND.tagline,
} as const;

/**
 * Type-safe setting key type
 */
export type SiteSettingKey = typeof SITE_SETTING_KEYS[keyof typeof SITE_SETTING_KEYS];

/**
 * Validation helpers
 */
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

export const validateFileType = (file: File, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || '';
};

export const generateFileName = (prefix: string, extension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
};
