/**
 * TerritorialGroupService (location facade)
 *
 * Compat layer for legacy location imports.
 * Canonical implementation lives in core/territorial/services/TerritorialGroupService.
 */

import type { ITerritorialGroupRepository } from '../repositories/ITerritorialGroupRepository';
import type { Location, TerritorialGroup, TerritorialGroupWithMembers } from '../types';
import { createLocationRepository } from '../repositories/createLocationRepository';
import {
  TerritorialGroupService as CanonicalTerritorialGroupService,
  territorialGroupService as canonicalTerritorialGroupService,
} from '@/core/territorial/services/TerritorialGroupService';

export class TerritorialGroupService {
  private readonly delegate: CanonicalTerritorialGroupService;

  constructor(repo?: ITerritorialGroupRepository) {
    this.delegate = repo
      ? new CanonicalTerritorialGroupService(repo, createLocationRepository())
      : canonicalTerritorialGroupService;
  }

  findById(groupId: string): Promise<TerritorialGroup | null> {
    return this.delegate.getGroupById(groupId);
  }

  findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null> {
    return this.delegate.getGroupBySlugAndCity(slug, cityId);
  }

  findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null> {
    return this.delegate.getGroupWithMembers(groupId);
  }

  listMembers(groupId: string): Promise<Location[]> {
    return this.delegate.listAllMembers(groupId);
  }

  findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    return this.delegate.findGroupsContainingLocation(locationId);
  }
}
