/**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */

import { supabase } from '@/core/infrastructure/supabase/client';
import type { NicheCapability, NicheStatus } from '../types';
import type {
  AddCapabilityParams,
  AddCapabilityResult,
  CapabilityCheckResult,
  MarkNeedsUpgradeParams,
  MarkNeedsUpgradeResult,
  MultiCapabilityCheckResult,
  ProfileNicheConfig,
  OperationalMode,
  UpgradeNicheParams,
  UpgradeNicheResult,
  NicheUpgradeHistory,
  GastronomyProfileWithNiche,
  UpgradeType,
} from './types';

export class NicheVersioningService {
  private static toCapabilities(values: unknown): NicheCapability[] {
    if (!Array.isArray(values)) return [];
    return values.filter((value): value is NicheCapability => typeof value === 'string') as NicheCapability[];
  }
  private static toNicheStatus(value: unknown): NicheStatus {
    const valid: NicheStatus[] = ['full_enabled', 'basic_enabled', 'beta_enabled', 'hidden', 'coming_soon'];
    return valid.includes(value as NicheStatus) ? (value as NicheStatus) : 'basic_enabled';
  }

  private static toOperationalMode(value: unknown): OperationalMode {
    const valid: OperationalMode[] = [
      'basic_menu', 'menu_variants', 'menu_addons', 'menu_combos', 'pizzaria_full',
      'sushi_full', 'acai_full', 'pastel_full', 'churrascaria_full', 'bar_full',
    ];
    return valid.includes(value as OperationalMode) ? (value as OperationalMode) : 'basic_menu';
  }

  private static toUpgradeType(value: unknown): UpgradeType {
    const valid: UpgradeType[] = ['automatic', 'manual', 'admin'];
    return valid.includes(value as UpgradeType) ? (value as UpgradeType) : 'manual';
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async hasCapability(
    business_id: string,
    capability: NicheCapability,
  ): Promise<CapabilityCheckResult> {
    const { data, error } = await supabase.rpc('has_niche_capability', {
      p_business_id: business_id,
      p_capability: capability,
    });

    if (error) {
      console.error('Erro ao verificar capability:', error);
      return {
        has_capability: false,
        capability,
        business_id,
      };
    }

    return {
      has_capability: data ?? false,
      capability,
      business_id,
    };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async hasCapabilities(
    business_id: string,
    capabilities: NicheCapability[],
  ): Promise<MultiCapabilityCheckResult> {
    const { data: profile, error } = await supabase
      .from('gastronomy_profiles')
      .select('enabled_capabilities')
      .eq('business_id', business_id)
      .single();

    if (error || !profile) {
      return {
        business_id,
        capabilities: Object.fromEntries(
          capabilities.map((cap) => [cap, false]),
        ) as Record<NicheCapability, boolean>,
        all_enabled: false,
        any_enabled: false,
        enabled_count: 0,
        total_count: capabilities.length,
      };
    }

    const enabledCaps = (profile.enabled_capabilities as string[]) || [];
    const capabilityMap = Object.fromEntries(
      capabilities.map((cap) => [cap, enabledCaps.includes(cap)]),
    ) as Record<NicheCapability, boolean>;

    const enabledCount = Object.values(capabilityMap).filter(Boolean).length;

    return {
      business_id,
      capabilities: capabilityMap,
      all_enabled: enabledCount === capabilities.length,
      any_enabled: enabledCount > 0,
      enabled_count: enabledCount,
      total_count: capabilities.length,
    };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async addCapability(
    params: AddCapabilityParams,
  ): Promise<AddCapabilityResult> {
    const { data, error } = await supabase.rpc('add_niche_capability', {
      p_business_id: params.business_id,
      p_capability: params.capability,
      p_upgraded_by: params.upgraded_by || null,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      already_exists: data === false,
    };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async addCapabilities(
    business_id: string,
    capabilities: NicheCapability[],
    upgraded_by?: string,
  ): Promise<AddCapabilityResult[]> {
    const results: AddCapabilityResult[] = [];

    for (const capability of capabilities) {
      const result = await this.addCapability({
        business_id,
        capability,
        upgraded_by,
      });
      results.push(result);
    }

    return results;
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async markNeedsUpgrade(
    params: MarkNeedsUpgradeParams,
  ): Promise<MarkNeedsUpgradeResult> {
    const { data, error } = await supabase.rpc('mark_niche_needs_upgrade', {
      p_niche_key: params.niche_key,
      p_missing_capabilities: params.missing_capabilities,
    });

    if (error) {
      console.error('Erro ao marcar necessidade de upgrade:', error);
      return { updated_count: 0 };
    }

    return { updated_count: data ?? 0 };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async upgradeNiche(
    params: UpgradeNicheParams,
  ): Promise<UpgradeNicheResult> {
    // Buscar configuração atual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('gastronomy_profiles')
      .select('niche_config_version, operational_mode, enabled_capabilities')
      .eq('business_id', params.business_id)
      .single();

    if (fetchError || !currentProfile) {
      return {
        success: false,
        from_version: '0.0.0',
        to_version: params.to_version,
        added_capabilities: [],
        error: 'Perfil gastronômico não encontrado',
      };
    }

    const fromVersion = currentProfile.niche_config_version as string;
    const fromMode = currentProfile.operational_mode as string;
    const currentCaps = (currentProfile.enabled_capabilities as string[]) || [];

    // Adicionar novas capabilities
    const newCaps = params.add_capabilities.filter(
      (cap) => !currentCaps.includes(cap),
    );
    const updatedCaps = [...currentCaps, ...newCaps];

    // Atualizar perfil
    const { error: updateError } = await supabase
      .from('gastronomy_profiles')
      .update({
        niche_config_version: params.to_version,
        operational_mode: params.to_operational_mode,
        enabled_capabilities: updatedCaps,
        needs_niche_upgrade: false,
        last_niche_upgrade_at: new Date().toISOString(),
      })
      .eq('business_id', params.business_id);

    if (updateError) {
      return {
        success: false,
        from_version: fromVersion,
        to_version: params.to_version,
        added_capabilities: newCaps,
        error: updateError.message,
      };
    }

    // Registrar no histórico
    await supabase.from('gastronomy_niche_upgrade_history').insert({
      business_id: params.business_id,
      from_version: fromVersion,
      to_version: params.to_version,
      added_capabilities: newCaps,
      from_operational_mode: fromMode,
      to_operational_mode: params.to_operational_mode,
      upgrade_type: params.upgrade_type,
      notes: params.notes,
      upgraded_by: params.upgraded_by,
    });

    return {
      success: true,
      from_version: fromVersion,
      to_version: params.to_version,
      added_capabilities: newCaps,
    };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async getProfileNicheConfig(
    business_id: string,
  ): Promise<ProfileNicheConfig | null> {
    const { data, error } = await supabase
      .from('gastronomy_profiles')
      .select(
        `
        primary_niche_key,
        niche_config_version,
        support_level,
        operational_mode,
        enabled_capabilities,
        missing_capabilities,
        needs_niche_upgrade,
        last_niche_upgrade_at
      `,
      )
      .eq('business_id', business_id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      primary_niche_key: data.primary_niche_key as string,
      niche_config_version: data.niche_config_version as string,
      support_level: this.toNicheStatus(data.support_level),
      operational_mode: this.toOperationalMode(data.operational_mode),
      enabled_capabilities: this.toCapabilities(data.enabled_capabilities),
      missing_capabilities: this.toCapabilities(data.missing_capabilities),
      needs_niche_upgrade: data.needs_niche_upgrade as boolean,
      last_niche_upgrade_at: data.last_niche_upgrade_at as string | null,
    };
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async getProfileWithNicheInfo(
    business_id: string,
  ): Promise<GastronomyProfileWithNiche | null> {
    const { data, error } = await supabase
      .from('gastronomy_profiles_with_niche_info')
      .select('*')
      .eq('business_id', business_id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as unknown as GastronomyProfileWithNiche;
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async getUpgradeHistory(
    business_id: string,
  ): Promise<NicheUpgradeHistory[]> {
    const { data, error } = await supabase
      .from('gastronomy_niche_upgrade_history')
      .select('*')
      .eq('business_id', business_id)
      .order('upgraded_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((record) => ({
      id: record.id,
      business_id: record.business_id,
      from_version: record.from_version,
      to_version: record.to_version,
      added_capabilities: this.toCapabilities(record.added_capabilities),
      from_operational_mode: this.toOperationalMode(record.from_operational_mode),
      to_operational_mode: this.toOperationalMode(record.to_operational_mode),
      upgrade_type: this.toUpgradeType(record.upgrade_type),
      notes: record.notes,
      upgraded_at: record.upgraded_at,
      upgraded_by: record.upgraded_by,
    }));
  }

  /**
 * NicheVersioningService
 *
 * Servi?o para gerenciar versionamento e evolu??o de nichos.
 * Garante que upgrades n?o quebrem registros antigos.
 */
  static async listProfilesNeedingUpgrade(
    niche_key?: string,
  ): Promise<GastronomyProfileWithNiche[]> {
    let query = supabase
      .from('gastronomy_profiles_with_niche_info')
      .select('*')
      .eq('needs_niche_upgrade', true);

    if (niche_key) {
      query = query.eq('primary_niche_key', niche_key);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data as unknown as GastronomyProfileWithNiche[];
  }
}
