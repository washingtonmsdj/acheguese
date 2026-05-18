/**
 * CORE QR CODE SERVICE — Serviço central de QR Codes
 *
 * SSOT: Única fonte de verdade para operações de QR Code.
 * 
 * Responsabilidades:
 * - Criar QR Code para entidades
 * - Resolver token para URL
 * - Registrar scans
 * - Gerar analytics
 * - Gerar assets para impressão
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { nanoid } from 'nanoid';
import {
  DeviceType,
  QrDestinationVariant,
  QrStyleVariant,
  type QrCode,
  type QrCodeAnalytics,
  type QrCodeScan,
  type CreateQrCodeParams,
  type QrEntityType,
  type RecordScanParams,
} from './types';
// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ══════════════════════════════════════════════════════════════════════════
// QR CODE SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class QrCodeService {
  
  /**
   * Gera token único para QR Code
   */
  private static generateToken(): string {
    return nanoid(12); // 12 caracteres, URL-safe
  }
  
  /**
   * Constrói URL do QR Code
   */
  private static buildQrUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/q/${token}`;
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Cria QR Code para uma entidade
   */
  static async createForEntity(
    params: CreateQrCodeParams
  ): Promise<ServiceResult<QrCode>> {
    try {
      const token = this.generateToken();
      
      const qrCode = {
        token,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        canonical_url: params.canonical_url,
        short_url: params.short_url || null,
        campaign_id: params.campaign_id || null,
        owner_profile_id: params.owner_profile_id,
        is_active: true,
        is_dynamic: params.is_dynamic ?? true,
        style_variant: params.style_variant || QrStyleVariant.BASIC,
        destination_variant: params.destination_variant || QrDestinationVariant.CANONICAL,
        metadata: params.metadata || null,
      };
      
      const { data, error } = await (supabase as any)
        .from('qr_codes')
        .insert(qrCode)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCode, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar QR Code';
      logger.error('[QrCodeService] Erro ao criar QR Code:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Busca QR Code por entidade
   */
  static async getByEntity(
    entityType: QrEntityType,
    entityId: string
  ): Promise<ServiceResult<QrCode>> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const row = (data as QrCode[] | null)?.[0] ?? null;
      return { data: row, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar QR Code';
      logger.error('[QrCodeService] Erro ao buscar QR Code:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Busca QR Code por token
   */
  static async getByToken(token: string): Promise<ServiceResult<QrCode>> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCode, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'QR Code não encontrado';
      logger.error('[QrCodeService] Erro ao buscar QR Code por token:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Regenera token do QR Code
   */
  static async regenerateToken(qrCodeId: string): Promise<ServiceResult<QrCode>> {
    try {
      const newToken = this.generateToken();
      
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          token: newToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', qrCodeId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCode, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao regenerar token';
      logger.error('[QrCodeService] Erro ao regenerar token:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Desativa QR Code
   */
  static async deactivate(qrCodeId: string): Promise<ServiceResult<QrCode>> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', qrCodeId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCode, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao desativar QR Code';
      logger.error('[QrCodeService] Erro ao desativar QR Code:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Ativa QR Code
   */
  static async activate(qrCodeId: string): Promise<ServiceResult<QrCode>> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', qrCodeId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCode, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao ativar QR Code';
      logger.error('[QrCodeService] Erro ao ativar QR Code:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // RESOLVE
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Resolve token para URL de destino
   */
  static async resolveToken(token: string): Promise<ServiceResult<string>> {
    try {
      const result = await this.getByToken(token);
      
      if (result.error || !result.data) {
        return { data: null, error: 'QR Code não encontrado' };
      }
      
      const qrCode = result.data;
      
      // Verificar se está ativo
      if (!qrCode.is_active) {
        return { data: null, error: 'QR Code inativo' };
      }
      
      // Determinar URL de destino baseado na variante
      let destinationUrl: string;
      
      switch (qrCode.destination_variant) {
        case QrDestinationVariant.SHORT:
          destinationUrl = qrCode.short_url || qrCode.canonical_url;
          break;
        case QrDestinationVariant.CANONICAL:
        default:
          destinationUrl = qrCode.canonical_url;
          break;
      }
      
      return { data: destinationUrl, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao resolver token';
      logger.error('[QrCodeService] Erro ao resolver token:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // SCANS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Registra scan de QR Code
   */
  static async recordScan(params: RecordScanParams): Promise<ServiceResult<QrCodeScan>> {
    try {
      const scan = {
        qr_code_id: params.qr_code_id,
        device_type: params.device_type,
        user_agent: params.user_agent || null,
        referrer: params.referrer || null,
        approximate_location: params.approximate_location || null,
        ip_hash: params.ip_hash || null,
        resolved_url: params.resolved_url,
        scanned_at: new Date().toISOString(),
      };
      
      const { data, error } = await (supabase as any)
        .from('qr_code_scans')
        .insert(scan)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as QrCodeScan, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar scan';
      logger.error('[QrCodeService] Erro ao registrar scan:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Busca analytics de QR Code
   */
  static async getAnalytics(qrCodeId: string): Promise<ServiceResult<QrCodeAnalytics>> {
    try {
      // Buscar todos os scans
      const { data: scans, error } = await supabase
        .from('qr_code_scans')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .order('scanned_at', { ascending: false });
      
      if (error) throw error;
      
      const scansList = (scans || []) as QrCodeScan[];
      
      // Calcular métricas
      const totalScans = scansList.length;
      const uniqueScans = new Set(scansList.map(s => s.ip_hash)).size;
      
      // Scans por dispositivo
      const scansByDevice = scansList.reduce((acc, scan) => {
        acc[scan.device_type] = (acc[scan.device_type] || 0) + 1;
        return acc;
      }, {} as Record<DeviceType, number>);
      
      // Scans por data (últimos 30 dias)
      const scansByDate = this.groupScansByDate(scansList);
      
      // Top localizações
      const topLocations = this.getTopLocations(scansList);
      
      // Scans recentes (últimos 10)
      const recentScans = scansList.slice(0, 10);
      
      const analytics: QrCodeAnalytics = {
        total_scans: totalScans,
        unique_scans: uniqueScans,
        scans_by_device: scansByDevice,
        scans_by_date: scansByDate,
        top_locations: topLocations,
        recent_scans: recentScans,
      };
      
      return { data: analytics, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar analytics';
      logger.error('[QrCodeService] Erro ao buscar analytics:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Agrupa scans por data
   */
  private static groupScansByDate(scans: QrCodeScan[]): Array<{ date: string; count: number }> {
    const groupsMap = scans.reduce((acc, scan) => {
      const date = scan.scanned_at.split('T')[0];
      acc.set(date, (acc.get(date) || 0) + 1);
      return acc;
    }, new Map<string, number>());
    
    return [...groupsMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }
  
  /**
   * Retorna top localizações
   */
  private static getTopLocations(scans: QrCodeScan[]): Array<{ location: string; count: number }> {
    const locationsMap = scans
      .filter(s => s.approximate_location)
      .reduce((acc, scan) => {
        const loc = scan.approximate_location!;
        acc.set(loc, (acc.get(loc) || 0) + 1);
        return acc;
      }, new Map<string, number>());
    
    return [...locationsMap.entries()]
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Detecta tipo de dispositivo pelo user agent
   */
  static detectDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return DeviceType.TABLET;
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(ua)) {
      return DeviceType.MOBILE;
    }
    
    if (/mozilla|chrome|safari|firefox|opera|msie|trident/i.test(ua)) {
      return DeviceType.DESKTOP;
    }
    
    return DeviceType.UNKNOWN;
  }
  
  /**
   * Gera hash do IP (privacidade)
   */
  static async hashIp(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + process.env.IP_SALT || 'default-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

