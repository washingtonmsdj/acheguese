import type { Location } from '@/core/location/types';
import type { TerritorialGroup, TerritorialGroupWithMembers } from '../contracts';

export interface ITerritorialGroupRepository {
  findById(groupId: string): Promise<TerritorialGroup | null>;
  findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null>;
  findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null>;
  listMembers(groupId: string): Promise<Location[]>;
  findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]>;
  /** Public/product inventory: active groups only. */
  listAll(): Promise<TerritorialGroupWithMembers[]>;
  /** Administrative inventory: includes active and inactive groups under admin RLS. */
  listAllForAdmin(): Promise<TerritorialGroupWithMembers[]>;
}
