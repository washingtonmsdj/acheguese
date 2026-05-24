/**
 * IGovernanceRepository
 * 
 * Contrato de persistência para governança territorial e postal.
 */

import type {
  LocationVersion,
  CreateLocationVersionInput,
  LocationAlias,
  CreateLocationAliasInput,
  TerritoryChangeEvent,
  CreateTerritoryChangeEventInput,
  PostalCodeHistory,
  CreatePostalCodeHistoryInput,
} from '../types';

export interface IGovernanceRepository {
  // Location Versions
  createLocationVersion(data: CreateLocationVersionInput): Promise<LocationVersion>;
  getActiveVersionForLocation(locationId: string): Promise<LocationVersion | null>;
  listVersionsForLocation(locationId: string): Promise<LocationVersion[]>;
  
  // Location Aliases
  createLocationAlias(data: CreateLocationAliasInput): Promise<LocationAlias>;
  findLocationByAlias(aliasValue: string, aliasType?: string): Promise<string | null>;
  listAliasesForLocation(locationId: string): Promise<LocationAlias[]>;
  
  // Territory Change Events
  createTerritoryChangeEvent(data: CreateTerritoryChangeEventInput): Promise<TerritoryChangeEvent>;
  listEventsForLocation(locationId: string): Promise<TerritoryChangeEvent[]>;
  
  // Postal Code History
  createPostalCodeHistory(data: CreatePostalCodeHistoryInput): Promise<PostalCodeHistory>;
  listPostalCodeHistoryForLocation(locationId: string): Promise<PostalCodeHistory[]>;
}
