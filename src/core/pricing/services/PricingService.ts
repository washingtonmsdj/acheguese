/**
 * PricingService - SSOT para precificação e estimativas
 *
 * Responsabilidades:
 * - Calcular estimativas de preço
 * - Gerenciar regras de precificação
 * - Aplicar multiplicadores (horário de pico, etc.)
 * - Calcular detalhamento de preço
 *
 * Regras:
 * - Separação clara: routing fornece distância/tempo, pricing calcula preço
 * - Suporte a múltiplos modos (ride, delivery, mototaxi, motoboy)
 * - Preparado para pricing dinâmico futuro
 *
 * Padrão: Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { trackError } from '@/shared/utils/errorTracking';
import { calculateDistance } from '@/shared/utils/geolocation';
import { PricingError } from '../types';
import type {
  PricingMode,
  PricingContext,
  PriceEstimateRequest,
  PriceEstimateResponse,
  PricingBreakdown,
  PricingBreakdownItem,
  AdditionalFee,
  PricingRule,
  PricingServiceConfig,
  PRICING_CONSTANTS,
} from '../types';

export class PricingService {
  private static instance: PricingService;
  private readonly db = supabase as any;
  private config: PricingServiceConfig;
  private rulesCache: Map<PricingMode, { rule: PricingRule; cachedAt: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    this.config = {
      defaultMode: 'ride',
      currency: 'BRL',
      enablePeakHours: true,
      enableDynamicPricing: false,
      cacheEstimates: false,
      cacheTtlSeconds: 300,
    };

    this.rulesCache = new Map();
  }

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  /**
   * Configura o serviço
   */
  configure(config: Partial<PricingServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // PRICE ESTIMATION
  // ============================================

  /**
   * Calcula estimativa de preço
   */
  async calculateEstimate(
    request: PriceEstimateRequest
  ): Promise<PriceEstimateResponse> {
    try {
      // 1. Calcular distância
      const distanceMeters = calculateDistance(
        request.origin.latitude,
        request.origin.longitude,
        request.destination.latitude,
        request.destination.longitude
      );
      const distanceKm = distanceMeters / 1000;

      // 2. Estimar duração
      const durationMinutes = this.estimateDuration(distanceKm);

      // 3. Obter regra de precificação
      const rule = await this.getRule(request.mode);

      // 4. Calcular preço base
      const basePrice = this.calculateBasePrice(
        distanceKm,
        durationMinutes,
        rule
      );

      // 5. Aplicar multiplicadores
      let finalPrice = basePrice;
      let peakHourMultiplier = 1.0;

      if (request.options?.applyPeakHours !== false && this.config.enablePeakHours) {
        peakHourMultiplier = this.getPeakHourMultiplier(request.timestamp);
        finalPrice *= peakHourMultiplier;
      }

      if (request.options?.customMultiplier) {
        finalPrice *= request.options.customMultiplier;
      }

      // 6. Aplicar mínimo
      finalPrice = Math.max(finalPrice, rule.minimumFare);

      // 7. Aplicar máximo (se definido)
      if (rule.maximumFare) {
        finalPrice = Math.min(finalPrice, rule.maximumFare);
      }

      // 8. Gerar breakdown se solicitado
      let breakdown: PricingBreakdown | undefined;
      if (request.options?.includeBreakdown) {
        breakdown = this.generateBreakdown(
          distanceKm,
          durationMinutes,
          rule,
          peakHourMultiplier,
          request.options?.customMultiplier
        );
      }

      return {
        estimatedPrice: Number(finalPrice.toFixed(2)),
        minimumPrice: rule.minimumFare,
        maximumPrice: rule.maximumFare,
        currency: this.config.currency,
        breakdown,
        metadata: {
          distanceKm: Number(distanceKm.toFixed(2)),
          durationMinutes: Math.round(durationMinutes),
          peakHourMultiplier: peakHourMultiplier !== 1.0 ? peakHourMultiplier : undefined,
          mode: request.mode,
        },
      };
    } catch (error) {
      logger.error('[PricingService] Error calculating estimate:', error);
      throw error;
    }
  }

  /**
   * Calcula estimativa rápida (sem breakdown)
   */
  async calculateQuickEstimate(
    mode: PricingMode,
    distanceKm: number,
    durationMinutes: number
  ): Promise<number> {
    const rule = await this.getRule(mode);
    const basePrice = this.calculateBasePrice(distanceKm, durationMinutes, rule);
    
    let finalPrice = basePrice;
    if (this.config.enablePeakHours) {
      finalPrice *= this.getPeakHourMultiplier();
    }
    
    return Math.max(Number(finalPrice.toFixed(2)), rule.minimumFare);
  }

  // ============================================
  // PRICING RULES
  // ============================================

  /**
   * Obtém regra de precificação para um modo (com cache)
   */
  async getRule(mode: PricingMode): Promise<PricingRule> {
    // Verificar cache
    const cached = this.rulesCache.get(mode);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.rule;
    }

    // Buscar do banco
    try {
      const now = new Date().toISOString();
      
      const { data: ruleData, error: ruleError } = await this.db
        .from('pricing_rules')
        .select('*')
        .eq('mode', mode)
        .eq('is_active', true)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ruleError) throw ruleError;

      if (!ruleData) {
        logger.warn(`[PricingService] No active rule found for mode: ${mode}, using fallback`);
        return this.getFallbackRule(mode);
      }

      // Buscar multiplicadores de horário de pico
      const { data: multipliersData } = await this.db
        .from('pricing_peak_hour_multipliers')
        .select('*')
        .eq('rule_id', ruleData.id)
        .eq('is_active', true);

      // Buscar taxas adicionais
      const { data: feesData } = await this.db
        .from('pricing_additional_fees')
        .select('*')
        .eq('rule_id', ruleData.id)
        .eq('is_active', true);

      const rule = this.mapToRule(ruleData, multipliersData || [], feesData || []);

      // Atualizar cache
      this.rulesCache.set(mode, { rule, cachedAt: Date.now() });

      return rule;
    } catch (error) {
      logger.error('[PricingService] Error fetching rule from database:', error);
      trackError(error as Error, {
        component: 'PricingService',
        action: 'getRule',
        metadata: { mode },
      });
      return this.getFallbackRule(mode);
    }
  }

  /**
   * Atualiza regra de precificação
   */
  async updateRule(
    ruleId: string,
    updates: Partial<PricingRule>,
    performedBy: string
  ): Promise<void> {
    try {
      // Se está ativando uma regra, usar RPC para evitar conflito com trigger
      if (updates.isActive === true) {
        const { error: rpcError } = await this.db.rpc('activate_pricing_rule', {
          p_rule_id: ruleId,
          p_performed_by: performedBy,
        });

        if (rpcError) {
          throw new Error(rpcError.message || 'Erro ao ativar regra');
        }

        // Se só está ativando, não precisa fazer mais nada
        if (Object.keys(updates).length === 1) {
          this.rulesCache.clear();
          return;
        }
      }

      // Atualizar outros campos (se houver)
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.baseFare !== undefined) updateData.base_fare = updates.baseFare;
      if (updates.pricePerKm !== undefined) updateData.price_per_km = updates.pricePerKm;
      if (updates.pricePerMinute !== undefined) updateData.price_per_minute = updates.pricePerMinute;
      if (updates.minimumFare !== undefined) updateData.minimum_fare = updates.minimumFare;
      if (updates.maximumFare !== undefined) updateData.maximum_fare = updates.maximumFare;
      if (updates.isActive === false) updateData.is_active = false; // Desativar é seguro
      if (updates.validFrom !== undefined) updateData.valid_from = updates.validFrom?.toISOString();
      if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil?.toISOString();
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_by = performedBy;

        const { error } = await this.db
          .from('pricing_rules')
          .update(updateData)
          .eq('id', ruleId);

        if (error) {
          const errorMessage = error.message || JSON.stringify(error);
          const errorCode = error.code || '';
          const errorHint = error.hint || '';
          
          if (errorCode === '23514' || errorHint.includes('validate_single_active_rule')) {
            throw PricingError.conflict('Não é possível desativar a única regra ativa desta modalidade');
          }
          if (errorMessage.includes('Conflito') || errorMessage.includes('conflito')) {
            throw PricingError.conflict(errorMessage);
          }
          throw new Error(errorMessage);
        }
      }

      // Limpar cache
      this.rulesCache.clear();
    } catch (error: unknown) {
      const providerError =
        error && typeof error === "object"
          ? (error as { message?: string; code?: string; hint?: string })
          : undefined;
      const errorMessage = providerError?.message || String(error);
      const errorCode = providerError?.code || '';
      const errorHint = providerError?.hint || '';
      
      logger.error('[PricingService] Error updating rule:', errorMessage);
      
      // Re-lançar PricingError
      if (error instanceof PricingError) {
        throw error;
      }
      
      // Detectar conflito de regra ativa
      if (errorCode === '23514' || errorHint.includes('validate_single_active_rule')) {
        throw PricingError.conflict('Não é possível desativar a única regra ativa desta modalidade');
      }
      if (errorMessage.includes('Conflito') || errorMessage.includes('conflito') || errorMessage.includes('já existe regra ativa')) {
        throw PricingError.conflict('Já existe uma regra ativa para este modo no período especificado');
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Lista todas as regras ativas
   */
  async listRules(includeInactive: boolean = false): Promise<PricingRule[]> {
    try {
      let query = this.db
        .from('pricing_rules')
        .select(`
          *,
          peak_hour_multipliers:pricing_peak_hour_multipliers(*),
          additional_fees:pricing_additional_fees(*)
        `)
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item) =>
        this.mapToRule(
          item,
          item.peak_hour_multipliers || [],
          item.additional_fees || []
        )
      );
    } catch (error) {
      logger.error('[PricingService] Error listing rules:', error);
      return [];
    }
  }

  /**
   * Cria nova regra de precificação
   */
  async createRule(
    rule: Omit<PricingRule, 'id'>,
    performedBy: string
  ): Promise<string> {
    try {
      // Usar RPC para criar regra ativa (desativa outras automaticamente)
      if (rule.isActive) {
        const { data: ruleId, error: rpcError } = await this.db.rpc('create_active_pricing_rule', {
          p_mode: rule.mode,
          p_name: rule.name,
          p_base_fare: rule.baseFare,
          p_price_per_km: rule.pricePerKm,
          p_price_per_minute: rule.pricePerMinute,
          p_minimum_fare: rule.minimumFare,
          p_maximum_fare: rule.maximumFare || null,
          p_is_active: rule.isActive,
          p_valid_from: rule.validFrom?.toISOString() || null,
          p_valid_until: rule.validUntil?.toISOString() || null,
          p_metadata: (rule.metadata || {}) as Record<string, unknown>,
          p_performed_by: performedBy,
        });

        if (rpcError) {
          throw new Error(rpcError.message || 'Erro ao criar regra');
        }

        const newRuleId = ruleId as string;

        // Inserir multiplicadores se houver
        if (rule.peakHourMultipliers) {
          const multipliers = [];
          if (rule.peakHourMultipliers.morning) {
            multipliers.push({
              rule_id: newRuleId,
              period_type: 'morning',
              multiplier: rule.peakHourMultipliers.morning,
              start_hour: 7,
              end_hour: 9,
              days_of_week: [1, 2, 3, 4, 5],
            });
          }
          if (rule.peakHourMultipliers.afternoon) {
            multipliers.push({
              rule_id: newRuleId,
              period_type: 'afternoon',
              multiplier: rule.peakHourMultipliers.afternoon,
              start_hour: 17,
              end_hour: 19,
              days_of_week: [1, 2, 3, 4, 5],
            });
          }
          if (rule.peakHourMultipliers.night) {
            multipliers.push({
              rule_id: newRuleId,
              period_type: 'night',
              multiplier: rule.peakHourMultipliers.night,
              start_hour: 22,
              end_hour: 24,
              days_of_week: [1, 2, 3, 4, 5],
            });
          }

          if (multipliers.length > 0) {
            await this.db.from('pricing_peak_hour_multipliers').insert(multipliers);
          }
        }

        // Inserir taxas adicionais se houver
        if (rule.additionalFees && rule.additionalFees.length > 0) {
          const fees = rule.additionalFees.map((fee) => ({
            rule_id: newRuleId,
            label: fee.label,
            amount: fee.amount,
            fee_type: fee.type,
            reason: fee.reason,
          }));

          await this.db.from('pricing_additional_fees').insert(fees);
        }

        // Limpar cache
        this.rulesCache.clear();

        return newRuleId;
      }

      // Criar regra inativa (não precisa de RPC)
      const ruleData = {
        mode: rule.mode,
        name: rule.name,
        base_fare: rule.baseFare,
        price_per_km: rule.pricePerKm,
        price_per_minute: rule.pricePerMinute,
        minimum_fare: rule.minimumFare,
        maximum_fare: rule.maximumFare,
        is_active: false,
        valid_from: rule.validFrom?.toISOString(),
        valid_until: rule.validUntil?.toISOString(),
        metadata: (rule.metadata || {}) as Record<string, unknown>,
        created_by: performedBy,
        updated_by: performedBy,
      };

      const { data, error } = await this.db
        .from('pricing_rules')
        .insert(ruleData)
        .select('id')
        .single();

      if (error) throw error;

      // Inserir multiplicadores se houver
      if (rule.peakHourMultipliers) {
        const multipliers = [];
        if (rule.peakHourMultipliers.morning) {
          multipliers.push({
            rule_id: data.id,
            period_type: 'morning',
            multiplier: rule.peakHourMultipliers.morning,
            start_hour: 7,
            end_hour: 9,
            days_of_week: [1, 2, 3, 4, 5],
          });
        }
        if (rule.peakHourMultipliers.afternoon) {
          multipliers.push({
            rule_id: data.id,
            period_type: 'afternoon',
            multiplier: rule.peakHourMultipliers.afternoon,
            start_hour: 17,
            end_hour: 19,
            days_of_week: [1, 2, 3, 4, 5],
          });
        }
        if (rule.peakHourMultipliers.night) {
          multipliers.push({
            rule_id: data.id,
            period_type: 'night',
            multiplier: rule.peakHourMultipliers.night,
            start_hour: 22,
            end_hour: 24,
            days_of_week: [1, 2, 3, 4, 5],
          });
        }

        if (multipliers.length > 0) {
          await this.db.from('pricing_peak_hour_multipliers').insert(multipliers);
        }
      }

      // Inserir taxas adicionais se houver
      if (rule.additionalFees && rule.additionalFees.length > 0) {
        const fees = rule.additionalFees.map((fee) => ({
          rule_id: data.id,
          label: fee.label,
          amount: fee.amount,
          fee_type: fee.type,
          reason: fee.reason,
        }));

        await this.db.from('pricing_additional_fees').insert(fees);
      }

      // Limpar cache
      this.rulesCache.clear();

      return data.id;
    } catch (error: unknown) {
      const providerError =
        error && typeof error === "object"
          ? (error as { message?: string; code?: string; hint?: string })
          : undefined;
      const errorMessage = providerError?.message || String(error);
      const errorCode = providerError?.code || '';
      const errorHint = providerError?.hint || '';
      
      logger.error('[PricingService] Error creating rule:', errorMessage);
      
      // Detectar conflito de regra ativa
      if (errorCode === '23514' || errorHint.includes('validate_single_active_rule')) {
        throw PricingError.conflict('Já existe uma regra ativa para este modo no período especificado');
      }
      if (errorMessage.includes('Conflito') || errorMessage.includes('conflito') || errorMessage.includes('já existe regra ativa')) {
        throw PricingError.conflict('Já existe uma regra ativa para este modo no período especificado');
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Limpa cache de regras
   */
  clearCache(): void {
    this.rulesCache.clear();
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Obtém regra fallback (quando banco falha)
   */
  private getFallbackRule(mode: PricingMode): PricingRule {
    const fallbacks: Record<PricingMode, PricingRule> = {
      ride: {
        id: 'fallback-ride',
        mode: 'ride',
        name: 'Corrida Padrão (Fallback)',
        baseFare: 5.0,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 8.0,
        peakHourMultipliers: {
          morning: 1.3,
          afternoon: 1.5,
          night: 1.2,
        },
        isActive: true,
      },
      delivery: {
        id: 'fallback-delivery',
        mode: 'delivery',
        name: 'Entrega Padrão (Fallback)',
        baseFare: 4.0,
        pricePerKm: 2.0,
        pricePerMinute: 0.3,
        minimumFare: 7.0,
        isActive: true,
      },
      mototaxi: {
        id: 'fallback-mototaxi',
        mode: 'mototaxi',
        name: 'Mototáxi Padrão (Fallback)',
        baseFare: 4.0,
        pricePerKm: 2.0,
        pricePerMinute: 0.4,
        minimumFare: 6.0,
        peakHourMultipliers: {
          morning: 1.2,
          afternoon: 1.3,
          night: 1.1,
        },
        isActive: true,
      },
      motoboy: {
        id: 'fallback-motoboy',
        mode: 'motoboy',
        name: 'Motoboy Padrão (Fallback)',
        baseFare: 3.5,
        pricePerKm: 1.8,
        pricePerMinute: 0.3,
        minimumFare: 6.0,
        isActive: true,
      },
      custom: {
        id: 'fallback-custom',
        mode: 'custom',
        name: 'Customizado (Fallback)',
        baseFare: 5.0,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 8.0,
        isActive: true,
      },
    };

    switch (mode) {
      case 'ride':
        return fallbacks.ride;
      case 'mototaxi':
        return fallbacks.mototaxi;
      case 'motoboy':
        return fallbacks.motoboy;
      case 'custom':
        return fallbacks.custom;
      default:
        return fallbacks.ride;
    }
  }

  /**
   * Mapeia dados do banco para PricingRule
   */
  private mapToRule(
    data: Record<string, unknown>,
    multipliers: Record<string, unknown>[],
    fees: Record<string, unknown>[]
  ): PricingRule {
    const peakHourMultipliers: Record<string, number> = {};
    
    multipliers.forEach((m) => {
      if (m.period_type === 'morning') peakHourMultipliers.morning = Number(m.multiplier);
      if (m.period_type === 'afternoon') peakHourMultipliers.afternoon = Number(m.multiplier);
      if (m.period_type === 'night') peakHourMultipliers.night = Number(m.multiplier);
    });

    const additionalFees: AdditionalFee[] = fees.map((f) => ({
      id: String(f.id ?? ""),
      label: String(f.label ?? ""),
      amount: Number(f.amount),
      type: String(f.fee_type ?? "fixed") as "fixed" | "percentage",
      reason: String(f.reason ?? ""),
    }));

    return {
      id: String(data.id ?? ""),
      mode: String(data.mode ?? "ride") as PricingMode,
      name: String(data.name ?? ""),
      baseFare: Number(data.base_fare),
      pricePerKm: Number(data.price_per_km),
      pricePerMinute: Number(data.price_per_minute),
      minimumFare: Number(data.minimum_fare),
      maximumFare: data.maximum_fare ? Number(data.maximum_fare) : undefined,
      peakHourMultipliers: Object.keys(peakHourMultipliers).length > 0 ? peakHourMultipliers : undefined,
      additionalFees: additionalFees.length > 0 ? additionalFees : undefined,
      isActive: Boolean(data.is_active),
      validFrom: data.valid_from ? new Date(String(data.valid_from)) : undefined,
      validUntil: data.valid_until ? new Date(String(data.valid_until)) : undefined,
      metadata: (data.metadata || {}) as Record<string, unknown>,
    };
  }

  /**
   * Calcula preço base (sem multiplicadores)
   */
  private calculateBasePrice(
    distanceKm: number,
    durationMinutes: number,
    rule: PricingRule
  ): number {
    const distanceFare = distanceKm * rule.pricePerKm;
    const timeFare = durationMinutes * rule.pricePerMinute;
    return rule.baseFare + distanceFare + timeFare;
  }

  /**
   * Estima duração baseada em distância
   */
  private estimateDuration(distanceKm: number): number {
    const AVERAGE_SPEED_KMH = 40;
    const durationHours = distanceKm / AVERAGE_SPEED_KMH;
    return durationHours * 60; // minutos
  }

  /**
   * Obtém multiplicador de horário de pico
   */
  private getPeakHourMultiplier(date: Date = new Date()): number {
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado

    // Fim de semana: sem multiplicador
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.0;
    }

    // Horários de pico manhã (7h-9h)
    if (hour >= 7 && hour < 9) {
      return 1.3;
    }

    // Horários de pico tarde (17h-19h)
    if (hour >= 17 && hour < 19) {
      return 1.5;
    }

    // Horários de pico noite (22h-2h)
    if (hour >= 22 || hour < 2) {
      return 1.2;
    }

    return 1.0;
  }

  /**
   * Gera detalhamento de preço
   */
  private generateBreakdown(
    distanceKm: number,
    durationMinutes: number,
    rule: PricingRule,
    peakHourMultiplier: number,
    customMultiplier?: number
  ): PricingBreakdown {
    const distanceFare = distanceKm * rule.pricePerKm;
    const timeFare = durationMinutes * rule.pricePerMinute;
    const subtotal = rule.baseFare + distanceFare + timeFare;

    const items: PricingBreakdownItem[] = [
      {
        label: 'Tarifa base',
        value: Number(rule.baseFare.toFixed(2)),
        type: 'base',
      },
      {
        label: `Distância (${distanceKm.toFixed(1)}km)`,
        value: Number(distanceFare.toFixed(2)),
        type: 'distance',
      },
      {
        label: `Tempo (${Math.round(durationMinutes)}min)`,
        value: Number(timeFare.toFixed(2)),
        type: 'time',
      },
    ];

    let total = subtotal;

    // Multiplicador de horário de pico
    if (peakHourMultiplier > 1.0) {
      const peakFee = subtotal * (peakHourMultiplier - 1);
      items.push({
        label: `Horário de pico (${peakHourMultiplier}x)`,
        value: Number(peakFee.toFixed(2)),
        type: 'multiplier',
      });
      total *= peakHourMultiplier;
    }

    // Multiplicador customizado
    if (customMultiplier && customMultiplier > 1.0) {
      const customFee = total * (customMultiplier - 1);
      items.push({
        label: `Ajuste (${customMultiplier}x)`,
        value: Number(customFee.toFixed(2)),
        type: 'multiplier',
      });
      total *= customMultiplier;
    }

    // Taxas adicionais
    const additionalFees: AdditionalFee[] = rule.additionalFees || [];
    const totalFees = additionalFees.reduce((sum, fee) => {
      const amount = fee.type === 'percentage' ? total * (fee.amount / 100) : fee.amount;
      return sum + amount;
    }, 0);

    if (additionalFees.length > 0) {
      additionalFees.forEach((fee) => {
        const amount = fee.type === 'percentage' ? total * (fee.amount / 100) : fee.amount;
        items.push({
          label: fee.label,
          value: Number(amount.toFixed(2)),
          type: 'fee',
        });
      });
    }

    total += totalFees;

    // Aplicar mínimo
    if (total < rule.minimumFare) {
      items.push({
        label: 'Ajuste para valor mínimo',
        value: Number((rule.minimumFare - total).toFixed(2)),
        type: 'fee',
      });
      total = rule.minimumFare;
    }

    return {
      baseFare: rule.baseFare,
      distanceFare: Number(distanceFare.toFixed(2)),
      timeFare: Number(timeFare.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      additionalFees,
      totalFees: Number(totalFees.toFixed(2)),
      total: Number(total.toFixed(2)),
      items,
    };
  }

  /**
   * Obtém log de auditoria de pricing
   */
  async getAuditLog(limit: number = 20): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.db
        .from('pricing_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('[PricingService] Error fetching audit log:', error);
      trackError(error as Error, {
        component: "PricingService",
        action: "getAuditLog",
      });
      throw error;
    }
  }
}

// Singleton instance
export const pricingService = PricingService.getInstance();
