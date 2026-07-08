/**
 * ITerritorialGroupRepository
 *
 * Contrato de persistência para grupos territoriais.
 */

import type { TerritorialGroup, TerritorialGroupWithMembers, Location } from '../types';

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
  // Read operations
  findById(groupId: string): Promise<TerritorialGroup | null>;
  findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null>;
  findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null>;
  listMembers(groupId: string): Promise<Location[]>;
  hasMember(groupId: string, locationId: string): Promise<boolean>;
  findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]>;
  listAll(): Promise<TerritorialGroupWithMembers[]>;
  
  // Write operations
  create(data: CreateTerritorialGroupData): Promise<TerritorialGroup>;
  update(groupId: string, data: UpdateTerritorialGroupData): Promise<TerritorialGroup>;
  addMembers(groupId: string, locationIds: string[]): Promise<void>;
  removeMembers(groupId: string, locationIds: string[]): Promise<void>;
  replaceMembers(groupId: string, locationIds: string[]): Promise<void>;
}
