/**
 * TerritorialGroupService - leitura de grupos territoriais.
 *
 * A escrita administrativa pertence a TerritorialGroupAdminService, que usa o
 * broker autenticado e a transação SQL canônica. Este serviço permanece como
 * owner das leituras usadas por roteamento, SEO e disponibilidade pública.
 */

import type { TerritorialGroup, TerritorialGroupWithMembers } from '@/core/territorial/contracts';
import { createTerritorialGroupRepository } from '@/core/territorial/repositories/createTerritorialGroupRepository';
import type { ITerritorialGroupRepository } from '@/core/territorial/repositories/ITerritorialGroupRepository';

export class TerritorialGroupService {
  private repository: ITerritorialGroupRepository;

  constructor(repository?: ITerritorialGroupRepository) {
    this.repository = repository ?? createTerritorialGroupRepository();
  }

  async getGroupById(groupId: string): Promise<TerritorialGroup | null> {
    if (!groupId) throw new Error('Group ID is required');
    return this.repository.findById(groupId);
  }

  async getGroupBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null> {
    if (!slug || !cityId) throw new Error('Slug and city ID are required');
    return this.repository.findBySlugAndCity(slug, cityId);
  }

  async getGroupWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null> {
    if (!groupId) throw new Error('Group ID is required');
    return this.repository.findWithMembers(groupId);
  }

  async findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    if (!locationId) throw new Error('Location ID is required');
    return this.repository.findGroupsContainingLocation(locationId);
  }

  async listAllGroups(): Promise<TerritorialGroupWithMembers[]> {
    return this.repository.listAll();
  }

  async isMemberOfGroup(locationId: string, groupId: string): Promise<boolean> {
    return (await this.repository.listMembers(groupId)).some(
      (member) => member.id === locationId,
    );
  }

}

export const territorialGroupService = new TerritorialGroupService();
