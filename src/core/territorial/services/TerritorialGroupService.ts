/**
 * TerritorialGroupService - Serviço de gerenciamento de grupos territoriais
 * 
 * SSOT para operações de grupos territoriais (agrupamentos de bairros).
 * 
 * Regras:
 * - Grupos NÃO são locations fake
 * - Grupos agregam apenas districts (bairros) de uma mesma cidade
 * - Grupos têm slug próprio e status independente
 * - Membros inativos são ignorados em queries
 * - Grupo só pode ficar ativo se tiver pelo menos 1 membro válido
 */

import type { ITerritorialGroupRepository, CreateTerritorialGroupData, UpdateTerritorialGroupData } from '@/core/location/repositories/ITerritorialGroupRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import type { Location, TerritorialGroup, TerritorialGroupWithMembers } from '@/core/location/types';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import { EntityStatus, LocationType } from '@/shared/types/enums';

export interface CreateTerritorialGroupInput {
  slug: string;
  name: string;
  description?: string;
  anchor_city_id: string;
  member_location_ids?: string[];
}

export interface UpdateTerritorialGroupInput {
  slug?: string;
  name?: string;
  description?: string | null;
  status?: EntityStatus.ACTIVE | EntityStatus.INACTIVE;
}

export interface AddMembersInput {
  group_id: string;
  location_ids: string[];
}

export interface RemoveMembersInput {
  group_id: string;
  location_ids: string[];
}

export class TerritorialGroupService {
  private repository: ITerritorialGroupRepository;
  private locationRepository: ILocationRepository;

  constructor(repository?: ITerritorialGroupRepository, locationRepository?: ILocationRepository) {
    this.repository = repository ?? createTerritorialGroupRepository();
    this.locationRepository = locationRepository ?? createLocationRepository();
  }

  /**
   * Buscar grupo por ID
   */
  async getGroupById(groupId: string): Promise<TerritorialGroup | null> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    return await this.repository.findById(groupId);
  }

  /**
   * Buscar grupo por slug e cidade
   */
  async getGroupBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null> {
    if (!slug || !cityId) {
      throw new Error('Slug and city ID are required');
    }
    return await this.repository.findBySlugAndCity(slug, cityId);
  }

  /**
   * Buscar grupo com membros
   */
  async getGroupWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    return await this.repository.findWithMembers(groupId);
  }

  /**
   * Listar membros de um grupo (apenas ativos)
   */
  async listActiveMembers(groupId: string): Promise<Location[]> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    const members = await this.repository.listMembers(groupId);
    return members.filter(m => m.status === EntityStatus.ACTIVE);
  }

  /**
   * Listar todos os membros de um grupo (incluindo inativos)
   */
  async listAllMembers(groupId: string): Promise<Location[]> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    return await this.repository.listMembers(groupId);
  }

  /**
   * Buscar grupos que contêm uma localização
   */
  async findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.findGroupsContainingLocation(locationId);
  }

  /**
   * Listar todos os grupos
   */
  async listAllGroups(): Promise<TerritorialGroupWithMembers[]> {
    return await this.repository.listAll();
  }

  /**
   * Resolver IDs de bairros a partir de um grupo (apenas membros ativos)
   */
  async resolveGroupToLocationIds(groupId: string): Promise<string[]> {
    const members = await this.listActiveMembers(groupId);
    return members.map(m => m.id);
  }

  /**
   * Verificar se um bairro pertence a um grupo
   */
  async isMemberOfGroup(locationId: string, groupId: string): Promise<boolean> {
    const members = await this.repository.listMembers(groupId);
    return members.some(m => m.id === locationId);
  }

  /**
   * Verificar se um grupo está ativo
   */
  async isGroupActive(groupId: string): Promise<boolean> {
    const group = await this.repository.findById(groupId);
    return group?.status === EntityStatus.ACTIVE;
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  /**
   * Criar grupo territorial
   * 
   * Regras:
   * - Slug único por cidade
   * - Cidade âncora deve existir e ser do tipo 'city'
   * - Grupo criado como 'inactive' por padrão
   * - Membros iniciais opcionais (validados)
   */
  async createGroup(input: CreateTerritorialGroupInput): Promise<TerritorialGroup> {
    // Validar entrada
    if (!input.slug || !input.name || !input.anchor_city_id) {
      throw new Error('Slug, name, and anchor_city_id are required');
    }

    // Validar cidade âncora
    const city = await this.locationRepository.findById(input.anchor_city_id);
    if (!city) {
      throw new Error(`Anchor city ${input.anchor_city_id} not found`);
    }
    if (city.type !== LocationType.CITY) {
      throw new Error(`Anchor location must be a city, got ${city.type}`);
    }

    // Validar slug único por cidade
    const existing = await this.repository.findBySlugAndCity(input.slug, input.anchor_city_id);
    if (existing) {
      throw new Error(`Group with slug '${input.slug}' already exists in city ${input.anchor_city_id}`);
    }

    // Criar grupo
    const group = await this.repository.create({
      slug: input.slug,
      name: input.name,
      description: input.description,
      anchor_city_id: input.anchor_city_id,
      status: EntityStatus.INACTIVE, // Sempre inativo inicialmente
    });

    // Adicionar membros iniciais se fornecidos
    if (input.member_location_ids && input.member_location_ids.length > 0) {
      await this.addMembers(group.id, input.member_location_ids);
    }

    return group;
  }

  /**
   * Atualizar grupo territorial
   * 
   * Regras:
   * - Se mudar slug, validar unicidade por cidade
   * - Não pode ativar grupo vazio
   */
  async updateGroup(groupId: string, input: UpdateTerritorialGroupInput): Promise<TerritorialGroup> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    const group = await this.repository.findById(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    // Validar slug único se estiver mudando
    if (input.slug && input.slug !== group.slug) {
      const existing = await this.repository.findBySlugAndCity(input.slug, group.anchor_city_id);
      if (existing) {
        throw new Error(`Group with slug '${input.slug}' already exists in city ${group.anchor_city_id}`);
      }
    }

    // Validar ativação de grupo vazio
    if (input.status === EntityStatus.ACTIVE) {
      const members = await this.listAllMembers(groupId);
      if (members.length === 0) {
        throw new Error('Cannot activate group with no members');
      }
    }

    return await this.repository.update(groupId, input);
  }

  /**
   * Ativar grupo
   * 
   * Regra: Grupo deve ter pelo menos 1 membro
   */
  async activateGroup(groupId: string): Promise<TerritorialGroup> {
    return await this.updateGroup(groupId, { status: EntityStatus.ACTIVE });
  }

  /**
   * Desativar grupo
   */
  async deactivateGroup(groupId: string): Promise<TerritorialGroup> {
    return await this.updateGroup(groupId, { status: EntityStatus.INACTIVE });
  }

  /**
   * Adicionar membros ao grupo
   * 
   * Regras:
   * - Membros devem ser districts
   * - Membros devem pertencer à cidade âncora
   * - Membros devem estar ativos
   * - Duplicatas são ignoradas
   */
  async addMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    if (!locationIds || locationIds.length === 0) {
      throw new Error('At least one location ID is required');
    }

    const group = await this.repository.findById(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    // Validar cada membro
    for (const locationId of locationIds) {
      const location = await this.locationRepository.findById(locationId);
      
      if (!location) {
        throw new Error(`Location ${locationId} not found`);
      }
      
      if (location.type !== LocationType.DISTRICT) {
        throw new Error(`Location ${locationId} must be a district, got ${location.type}`);
      }
      
      if (location.parent_id !== group.anchor_city_id) {
        throw new Error(`Location ${locationId} does not belong to anchor city ${group.anchor_city_id}`);
      }
      
      if (location.status !== EntityStatus.ACTIVE) {
        throw new Error(`Location ${locationId} is not active`);
      }
    }

    await this.repository.addMembers(groupId, locationIds);
  }

  /**
   * Remover membros do grupo
   */
  async removeMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    if (!locationIds || locationIds.length === 0) {
      throw new Error('At least one location ID is required');
    }

    const group = await this.repository.findById(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    await this.repository.removeMembers(groupId, locationIds);
  }

  /**
   * Substituir todos os membros do grupo
   * 
   * Operação transacional: remove todos e adiciona novos.
   * Validações aplicadas aos novos membros.
   */
  async replaceMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    const group = await this.repository.findById(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    // Validar novos membros se houver
    if (locationIds.length > 0) {
      for (const locationId of locationIds) {
        const location = await this.locationRepository.findById(locationId);
        
        if (!location) {
          throw new Error(`Location ${locationId} not found`);
        }
        
        if (location.type !== LocationType.DISTRICT) {
          throw new Error(`Location ${locationId} must be a district, got ${location.type}`);
        }
        
        if (location.parent_id !== group.anchor_city_id) {
          throw new Error(`Location ${locationId} does not belong to anchor city ${group.anchor_city_id}`);
        }
        
        if (location.status !== EntityStatus.ACTIVE) {
          throw new Error(`Location ${locationId} is not active`);
        }
      }
    }

    // Se grupo está ativo e vai ficar vazio, rejeitar
    if (group.status === EntityStatus.ACTIVE && locationIds.length === 0) {
      throw new Error('Cannot remove all members from active group');
    }

    await this.repository.replaceMembers(groupId, locationIds);
  }
}

export const territorialGroupService = new TerritorialGroupService();
