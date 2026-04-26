/**
 * 🪝 USE NICHE VERSIONING HOOK
 *
 * Hook React para gerenciar versionamento de nichos.
 *
 * @version 1.0.0
 */

import { useEffect, useState, useCallback } from 'react';
import { NicheVersioningService } from '../NicheVersioningService';
import type {
  ProfileNicheConfig,
  GastronomyProfileWithNiche,
  NicheUpgradeHistory,
  AddCapabilityResult,
  UpgradeNicheResult,
} from '../types';
import type { NicheCapability } from '../../types';

interface UseNicheVersioningOptions {
  businessId: string;
  autoLoad?: boolean;
}

interface UseNicheVersioningReturn {
  config: ProfileNicheConfig | null;
  profileInfo: GastronomyProfileWithNiche | null;
  history: NicheUpgradeHistory[];
  loading: boolean;
  error: Error | null;
  
  // Verificações
  hasCapability: (capability: NicheCapability) => boolean;
  hasAllCapabilities: (capabilities: NicheCapability[]) => boolean;
  hasAnyCapability: (capabilities: NicheCapability[]) => boolean;
  
  // Estado
  needsUpgrade: boolean;
  missingCount: number;
  enabledCount: number;
  
  // Ações
  addCapability: (capability: NicheCapability, upgradedBy?: string) => Promise<AddCapabilityResult>;
  upgradeNiche: (params: Omit<Parameters<typeof NicheVersioningService.upgradeNiche>[0], 'business_id'>) => Promise<UpgradeNicheResult>;
  reload: () => Promise<void>;
}

/**
 * Hook para gerenciar versionamento de nicho de um perfil gastronômico.
 *
 * @example
 * ```tsx
 * function AdminDashboard({ businessId }) {
 *   const {
 *     config,
 *     hasCapability,
 *     needsUpgrade,
 *     addCapability,
 *     loading
 *   } = useNicheVersioning({ businessId });
 *
 *   if (loading) return <Loading />;
 *
 *   return (
 *     <div>
 *       {needsUpgrade && <UpgradeBanner />}
 *       {hasCapability('pizza_multi_flavor') && <MultiFlavorSection />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNicheVersioning({
  businessId,
  autoLoad = true,
}: UseNicheVersioningOptions): UseNicheVersioningReturn {
  const [config, setConfig] = useState<ProfileNicheConfig | null>(null);
  const [profileInfo, setProfileInfo] = useState<GastronomyProfileWithNiche | null>(null);
  const [history, setHistory] = useState<NicheUpgradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);

      const [configData, profileData, historyData] = await Promise.all([
        NicheVersioningService.getProfileNicheConfig(businessId),
        NicheVersioningService.getProfileWithNicheInfo(businessId),
        NicheVersioningService.getUpgradeHistory(businessId),
      ]);

      setConfig(configData);
      setProfileInfo(profileData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar configuração'));
      console.error('Erro ao carregar niche versioning:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  // Verificações
  const hasCapability = useCallback(
    (capability: NicheCapability): boolean => {
      return config?.enabled_capabilities.includes(capability) ?? false;
    },
    [config],
  );

  const hasAllCapabilities = useCallback(
    (capabilities: NicheCapability[]): boolean => {
      if (!config) return false;
      return capabilities.every((cap) => config.enabled_capabilities.includes(cap));
    },
    [config],
  );

  const hasAnyCapability = useCallback(
    (capabilities: NicheCapability[]): boolean => {
      if (!config) return false;
      return capabilities.some((cap) => config.enabled_capabilities.includes(cap));
    },
    [config],
  );

  // Estado
  const needsUpgrade = config?.needs_niche_upgrade ?? false;
  const missingCount = config?.missing_capabilities.length ?? 0;
  const enabledCount = config?.enabled_capabilities.length ?? 0;

  // Ações
  const addCapability = useCallback(
    async (capability: NicheCapability, upgradedBy?: string): Promise<AddCapabilityResult> => {
      const result = await NicheVersioningService.addCapability({
        business_id: businessId,
        capability,
        upgraded_by: upgradedBy,
      });

      if (result.success) {
        await load(); // Recarregar dados
      }

      return result;
    },
    [businessId, load],
  );

  const upgradeNiche = useCallback(
    async (
      params: Omit<Parameters<typeof NicheVersioningService.upgradeNiche>[0], 'business_id'>,
    ): Promise<UpgradeNicheResult> => {
      const result = await NicheVersioningService.upgradeNiche({
        ...params,
        business_id: businessId,
      });

      if (result.success) {
        await load(); // Recarregar dados
      }

      return result;
    },
    [businessId, load],
  );

  return {
    config,
    profileInfo,
    history,
    loading,
    error,
    hasCapability,
    hasAllCapabilities,
    hasAnyCapability,
    needsUpgrade,
    missingCount,
    enabledCount,
    addCapability,
    upgradeNiche,
    reload: load,
  };
}
