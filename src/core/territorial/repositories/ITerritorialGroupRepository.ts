import type { Location } from '@/core/location/types';
import type { TerritorialGroup, TerritorialGroupWithMembers } from '../contracts';

export interface CreateTerritorialGroupData {
  slug: string;
  name: string;
  description?: string | null;
  anchor_city_id: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
}

export interface UpdateTerritorialGroupData {
  slug?: string;
  name?: string;
  description?: string | null;
  status?: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
}

export interface ITerritorialGroupRepository {
  findById(groupId: string): Promise<TerritorialGroup | null>;
  findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null>;
  findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null>;
  listMembers(groupId: string): Promise<Location[]>;
  hasMember(groupId: string, locationId: string): Promise<boolean>;
  findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]>;
  /** Public/product inventory: active groups only. */
  listAll(): Promise<TerritorialGroupWithMembers[]>;
  /** Administrative inventory: includes active and inactive groups under admin RLS. */
  listAllForAdmin(): Promise<TerritorialGroupWithMembers[]>;
  create(data: CreateTerritorialGroupData): Promise<TerritorialGroup>;
  update(groupId: string, data: UpdateTerritorialGroupData): Promise<TerritorialGroup>;
  addMembers(groupId: string, locationIds: string[]): Promise<void>;
  removeMembers(groupId: string, locationIds: string[]): Promise<void>;
  replaceMembers(groupId: string, locationIds: string[]): Promise<void>;
}
