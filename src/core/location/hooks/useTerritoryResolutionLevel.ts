import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { residenceService } from '@/core/residence/services/ResidenceService';
import { TerritorialGroupService } from '@/core/territorial/services/TerritorialGroupService';
import { useUserTerritory } from './useUserTerritory';

const territorialGroupService = new TerritorialGroupService();

export type TerritoryResolutionLevel =
  | 'none'
  | 'city'
  | 'district'
  | 'territorial_group'
  | 'verified_resident';

export interface TerritoryResolutionState {
  level: TerritoryResolutionLevel;
  hasCity: boolean;
  hasDistrict: boolean;
  hasTerritorialGroup: boolean;
  isVerifiedResident: boolean;
  loading: boolean;
}

export function useTerritoryResolutionLevel(): TerritoryResolutionState {
  const { user } = useAuth();
  const { homeCity, homeDistrict, loading: territoryLoading } = useUserTerritory();

  const { data: residence, isLoading: residenceLoading } = useQuery({
    queryKey: ['territory-resolution', 'residence', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return residenceService.getPrimaryResidence(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: groupMembership, isLoading: groupLoading } = useQuery({
    queryKey: ['territory-resolution', 'group-membership', homeDistrict?.id],
    queryFn: async () => {
      if (!homeDistrict?.id) return false;
      const groups = await territorialGroupService.findGroupsContainingLocation(homeDistrict.id);
      return groups.length > 0;
    },
    enabled: !!homeDistrict?.id,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => {
    const loading = territoryLoading || residenceLoading || groupLoading;
    const hasCity = Boolean(homeCity);
    const hasDistrict = Boolean(homeDistrict);
    const hasTerritorialGroup = Boolean(groupMembership);
    const isVerifiedResident = Boolean(residence?.is_verified);

    let level: TerritoryResolutionLevel = 'none';
    if (hasCity) level = 'city';
    if (hasDistrict) level = 'district';
    if (hasTerritorialGroup) level = 'territorial_group';
    if (isVerifiedResident && hasDistrict) level = 'verified_resident';

    return {
      level,
      hasCity,
      hasDistrict,
      hasTerritorialGroup,
      isVerifiedResident,
      loading,
    };
  }, [
    territoryLoading,
    residenceLoading,
    groupLoading,
    homeCity,
    homeDistrict,
    groupMembership,
    residence?.is_verified,
  ]);
}
