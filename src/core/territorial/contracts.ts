import type { Location } from '@/core/location/types';

export const TERRITORIAL_GROUP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type TerritorialGroupStatus =
  (typeof TERRITORIAL_GROUP_STATUS)[keyof typeof TERRITORIAL_GROUP_STATUS];

export interface TerritorialGroup {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  anchor_city_id: string;
  status: TerritorialGroupStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TerritorialGroupMember {
  group_id: string;
  location_id: string;
  created_at: string;
}

export interface TerritorialGroupWithMembers extends TerritorialGroup {
  members: Location[];
}
