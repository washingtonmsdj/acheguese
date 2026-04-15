/**
 * TerritorialGroupRepositoryMock
 *
 * Implementação in-memory para desenvolvimento sem banco.
 * Seed: Complexo do Nordeste de Amaralina com 4 bairros.
 */

import type { ITerritorialGroupRepository, CreateTerritorialGroupData, UpdateTerritorialGroupData } from './ITerritorialGroupRepository';
import type { Location, TerritorialGroup, TerritorialGroupMember, TerritorialGroupWithMembers } from '../types';
import { LocationRepositoryMock } from './LocationRepositoryMock';

const NOW = new Date().toISOString();

const COMPLEXO: TerritorialGroup = {
  id: 'tg-complexo-nordeste',
  slug: 'complexo-do-nordeste-de-amaralina',
  name: 'Complexo do Nordeste de Amaralina',
  description: 'Agrupamento territorial dos bairros Nordeste de Amaralina, Santa Cruz, Chapada do Rio Vermelho e Vale das Pedrinhas.',
  anchor_city_id: 'loc-salvador',
  status: 'active',
  metadata: {},
  created_at: NOW,
  updated_at: NOW,
};

const COMPLEXO_MEMBERS: TerritorialGroupMember[] = [
  { group_id: 'tg-complexo-nordeste', location_id: 'loc-nordeste-de-amaralina', created_at: NOW },
  { group_id: 'tg-complexo-nordeste', location_id: 'loc-santa-cruz',            created_at: NOW },
  { group_id: 'tg-complexo-nordeste', location_id: 'loc-chapada-do-rio-vermelho', created_at: NOW },
  { group_id: 'tg-complexo-nordeste', location_id: 'loc-vale-das-pedrinhas',    created_at: NOW },
];

export class TerritorialGroupRepositoryMock implements ITerritorialGroupRepository {
  private groups: Map<string, TerritorialGroup> = new Map([[COMPLEXO.id, COMPLEXO]]);
  private members: TerritorialGroupMember[] = [...COMPLEXO_MEMBERS];
  private locationRepo = new LocationRepositoryMock();

  async findById(groupId: string): Promise<TerritorialGroup | null> {
    return this.groups.get(groupId) ?? null;
  }

  async findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null> {
    return Array.from(this.groups.values()).find(
      (g) => g.slug === slug && g.anchor_city_id === cityId,
    ) ?? null;
  }

  async findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null> {
    const group = await this.findById(groupId);
    if (!group) return null;
    const members = await this.listMembers(groupId);
    return { ...group, members };
  }

  async listMembers(groupId: string): Promise<Location[]> {
    const memberIds = this.members
      .filter((m) => m.group_id === groupId)
      .map((m) => m.location_id);

    const locations = await Promise.all(memberIds.map((id) => this.locationRepo.findById(id)));
    return locations.filter((l): l is Location => l !== null);
  }

  async findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    const groupIds = this.members
      .filter((m) => m.location_id === locationId)
      .map((m) => m.group_id);

    return groupIds
      .map((id) => this.groups.get(id))
      .filter((g): g is TerritorialGroup => g !== undefined);
  }

  async listAll(): Promise<TerritorialGroupWithMembers[]> {
    const allGroups = Array.from(this.groups.values());
    const groupsWithMembers = await Promise.all(
      allGroups.map(async (group) => {
        const members = await this.listMembers(group.id);
        return { ...group, members };
      })
    );
    return groupsWithMembers;
  }

  async create(data: CreateTerritorialGroupData): Promise<TerritorialGroup> {
    const id = `tg-${Date.now()}`;
    const now = new Date().toISOString();
    
    const group: TerritorialGroup = {
      id,
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      anchor_city_id: data.anchor_city_id,
      status: data.status ?? 'inactive',
      metadata: data.metadata ?? {},
      created_at: now,
      updated_at: now,
    };

    this.groups.set(id, group);
    return group;
  }

  async update(groupId: string, data: UpdateTerritorialGroupData): Promise<TerritorialGroup> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);

    const updated: TerritorialGroup = {
      ...group,
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      updated_at: new Date().toISOString(),
    };

    this.groups.set(groupId, updated);
    return updated;
  }

  async addMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) return;

    const now = new Date().toISOString();
    for (const locationId of locationIds) {
      // Evitar duplicatas
      const exists = this.members.some(
        m => m.group_id === groupId && m.location_id === locationId
      );
      if (!exists) {
        this.members.push({
          group_id: groupId,
          location_id: locationId,
          created_at: now,
        });
      }
    }
  }

  async removeMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) return;

    this.members = this.members.filter(
      m => !(m.group_id === groupId && locationIds.includes(m.location_id))
    );
  }

  async replaceMembers(groupId: string, locationIds: string[]): Promise<void> {
    // Remove todos os membros do grupo
    this.members = this.members.filter(m => m.group_id !== groupId);
    
    // Adiciona novos membros
    await this.addMembers(groupId, locationIds);
  }
}
