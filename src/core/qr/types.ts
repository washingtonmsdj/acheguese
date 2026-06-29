/**
 * CORE QR TYPES — Sistema transversal de QR Codes
 *
 * SSOT: Única fonte de verdade para QR Codes dinâmicos.
 * 
 * Suporta: Empresas, Gastronomia, Serviços, Eventos, Pontos Turísticos,
 * Campanhas e futuros módulos.
 */

// ══════════════════════════════════════════════════════════════════════════
// ENTITY TYPES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Tipos de entidades que podem ter QR Code
 */
export enum QrEntityType {
  BUSINESS = 'business',
  GASTRONOMY = 'gastronomy',
  SERVICE = 'service',
  EVENT = 'event',
  TOURIST_POINT = 'tourist_point',
  CAMPAIGN = 'campaign',
  CLASSIFIED = 'classified',
  PROFESSIONAL = 'professional',
}

/**
 * Variantes de estilo do QR Code
 */
export enum QrStyleVariant {
  BASIC = 'basic',           // Free: QR básico preto e branco
  BRANDED = 'branded',       // Pro: Com logo da empresa
  CUSTOM = 'custom',         // Pro: Cores personalizadas
  PREMIUM = 'premium',       // Delivery: Design premium
}

/**
 * Variantes de destino do QR Code
 */
export enum QrDestinationVariant {
  CANONICAL = 'canonical',   // URL canônica padrão
  SHORT = 'short',           // Link curto /p/:slug
  MENU = 'menu',             // Cardápio direto
  ORDER = 'order',           // Página de pedido
  PROMOTION = 'promotion',   // Promoção específica
  CAMPAIGN = 'campaign',     // Campanha de marketing
}

/**
 * Tipo de dispositivo que escaneou
 */
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  UNKNOWN = 'unknown',
}

// ══════════════════════════════════════════════════════════════════════════
// QR CODE
// ══════════════════════════════════════════════════════════════════════════

/**
 * QR Code dinâmico
 * 
 * Tabela: qr_codes
 */
export interface QrCode {
  id: string;
  token: string;                          // Token único para /q/:token
  entity_type: QrEntityType;
  entity_id: string;
  canonical_url: string;                  // URL canônica da entidade
  short_url: string | null;               // URL curta opcional (/p/:slug)
  campaign_id: string | null;             // Campanha de marketing
  owner_profile_id: string;               // Dono do QR (profile_id)
  is_active: boolean;
  is_dynamic: boolean;                    // Se true, pode mudar destino
  style_variant: QrStyleVariant;
  destination_variant: QrDestinationVariant;
  metadata: QrCodeMetadata | null;        // Dados adicionais
  created_at: string;
  updated_at: string;
}

/**
 * Metadata adicional do QR Code
 */
export interface QrCodeMetadata {
  title?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  custom_data?: Record<string, unknown>;
}

// ══════════════════════════════════════════════════════════════════════════
// QR CODE SCAN
// ══════════════════════════════════════════════════════════════════════════

/**
 * Registro de scan de QR Code
 * 
 * Tabela: qr_code_scans
 */
export interface QrCodeScan {
  id: string;
  qr_code_id: string;
  scanned_at: string;
  device_type: DeviceType;
  user_agent: string | null;
  referrer: string | null;
  approximate_location: string | null;    // Cidade/Estado aproximado
  ip_hash: string | null;                 // Hash do IP (privacidade)
  resolved_url: string;                   // URL final para onde foi redirecionado
}

// ══════════════════════════════════════════════════════════════════════════
// SERVICE TYPES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Parâmetros para criar QR Code
 */
export interface CreateQrCodeParams {
  entity_type: QrEntityType;
  entity_id: string;
  canonical_url: string;
  short_url?: string | null;
  campaign_id?: string | null;
  owner_profile_id: string;
  is_dynamic?: boolean;
  style_variant?: QrStyleVariant;
  destination_variant?: QrDestinationVariant;
  metadata?: QrCodeMetadata;
}

/**
 * Parâmetros para registrar scan
 */
export interface RecordScanParams {
  qr_code_id: string;
  device_type: DeviceType;
  user_agent?: string | null;
  referrer?: string | null;
  approximate_location?: string | null;
  ip_hash?: string | null;
  resolved_url: string;
}

/**
 * Analytics de QR Code
 */
export interface QrCodeAnalytics {
  total_scans: number;
  unique_scans: number;
  scans_by_device: Record<DeviceType, number>;
  scans_by_date: Array<{ date: string; count: number }>;
  top_locations: Array<{ location: string; count: number }>;
  recent_scans: QrCodeScan[];
}

/**
 * Opções de geração de imagem
 */
export interface QrImageOptions {
  format: 'png' | 'svg';
  size: number;                           // Tamanho em pixels
  margin: number;                         // Margem em módulos
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  logoSize?: number;
}

/**
 * Asset para impressão
 */
export interface QrPrintableAsset {
  qr_code_url: string;                    // URL do QR (/q/:token)
  image_data_url: string;                 // Data URL da imagem
  canonical_url: string;                  // URL canônica
  title: string;
  description?: string;
  generated_at: string;
}

