// @ts-nocheck
/**
 * Location Repository Mock - In-Memory Implementation
 * 
 * Implementação mock para desenvolvimento sem banco.
 */

import type { ILocationRepository } from './ILocationRepository';
import type { Location, LocationType, LocationStatus } from '../types';
import { LOCATION_PAGINATION } from '../types';

export class LocationRepositoryMock implements ILocationRepository {
  private locations: Map<string, Location> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // Brasil
    const brasil: Location = {
      id: 'loc-br',
      parent_id: null,
      type: 'country' as LocationType,
      slug: 'br',
      name: 'Brasil',
      full_name: 'Brasil',
      geographic_path: '/br',
      status: 'active' as LocationStatus,
      metadata: { country_code: 'br', timezone: 'America/Sao_Paulo', locale: 'pt-BR' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Bahia
    const bahia: Location = {
      id: 'loc-ba',
      parent_id: 'loc-br',
      type: 'state' as LocationType,
      slug: 'ba',
      name: 'Bahia',
      full_name: 'Bahia, Brasil',
      geographic_path: '/br/ba',
      status: 'active' as LocationStatus,
      metadata: { state_code: 'ba', timezone: 'America/Bahia' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // São Paulo (estado)
    const sp: Location = {
      id: 'loc-sp',
      parent_id: 'loc-br',
      type: 'state' as LocationType,
      slug: 'sp',
      name: 'São Paulo',
      full_name: 'São Paulo, Brasil',
      geographic_path: '/br/sp',
      status: 'active' as LocationStatus,
      metadata: { state_code: 'sp', timezone: 'America/Sao_Paulo' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Salvador
    const salvador: Location = {
      id: 'loc-salvador',
      parent_id: 'loc-ba',
      type: 'city' as LocationType,
      slug: 'salvador',
      name: 'Salvador',
      full_name: 'Salvador, Bahia',
      geographic_path: '/br/ba/salvador',
      status: 'active' as LocationStatus,
      metadata: { timezone: 'America/Bahia', population: 2900000 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // São Paulo (cidade)
    const saoPauloCity: Location = {
      id: 'loc-sao-paulo',
      parent_id: 'loc-sp',
      type: 'city' as LocationType,
      slug: 'sao-paulo',
      name: 'São Paulo',
      full_name: 'São Paulo, São Paulo',
      geographic_path: '/br/sp/sao-paulo',
      status: 'active' as LocationStatus,
      metadata: { timezone: 'America/Sao_Paulo', population: 12300000 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Bairros de Salvador (Launch Area)
    const bairrosSalvador = [
      { id: 'loc-pituba',                slug: 'pituba',                  name: 'Pituba', lat: -12.9900, lng: -38.4600 },
      { id: 'loc-rio-vermelho',          slug: 'rio-vermelho',            name: 'Rio Vermelho', lat: -13.0000, lng: -38.4900 },
      { id: 'loc-barra',                 slug: 'barra',                   name: 'Barra', lat: -13.0100, lng: -38.5200 },
      { id: 'loc-itaigara',              slug: 'itaigara',                name: 'Itaigara', lat: -12.9950, lng: -38.4700 },
      { id: 'loc-amaralina',             slug: 'amaralina',               name: 'Amaralina', lat: -12.9850, lng: -38.4850 },
      // Complexo do Nordeste de Amaralina — 4 bairros independentes sob Salvador
      { id: 'loc-nordeste-de-amaralina', slug: 'nordeste-de-amaralina',   name: 'Nordeste de Amaralina', lat: -12.9750, lng: -38.4750 },
      { id: 'loc-santa-cruz',            slug: 'santa-cruz',              name: 'Santa Cruz', lat: -12.9700, lng: -38.4800 },
      { id: 'loc-chapada-do-rio-vermelho', slug: 'chapada-do-rio-vermelho', name: 'Chapada do Rio Vermelho', lat: -12.9650, lng: -38.4850 },
      { id: 'loc-vale-das-pedrinhas',    slug: 'vale-das-pedrinhas',      name: 'Vale das Pedrinhas', lat: -12.9600, lng: -38.4900 },
    ];

    // Bairros de São Paulo (para testes de validação)
    const bairrosSaoPaulo = [
      { id: 'loc-pinheiros', slug: 'pinheiros', name: 'Pinheiros', parent: 'loc-sao-paulo', lat: -23.5629, lng: -46.6825 },
    ];

    this.locations.set(brasil.id, brasil);
    this.locations.set(bahia.id, bahia);
    this.locations.set(sp.id, sp);
    this.locations.set(salvador.id, salvador);
    this.locations.set(saoPauloCity.id, saoPauloCity);

    bairrosSalvador.forEach(({ id, slug, name, lat, lng }) => {
      const bairro: Location = {
        id,
        parent_id: 'loc-salvador',
        type: 'district' as LocationType,
        slug,
        name,
        full_name: `${name}, Salvador`,
        geographic_path: `/br/ba/salvador/${slug}`,
        status: 'active' as LocationStatus,
        metadata: {
          canonical_lat: lat,
          canonical_lng: lng,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.locations.set(id, bairro);
    });

    bairrosSaoPaulo.forEach(({ id, slug, name, parent, lat, lng }) => {
      const bairro: Location = {
        id,
        parent_id: parent,
        type: 'district' as LocationType,
        slug,
        name,
        full_name: `${name}, São Paulo`,
        geographic_path: `/br/sp/sao-paulo/${slug}`,
        status: 'active' as LocationStatus,
        metadata: {
          canonical_lat: lat,
          canonical_lng: lng,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.locations.set(id, bairro);
    });
  }

  async findById(id: string): Promise<Location | null> {
    return this.locations.get(id) || null;
  }

  async findByPath(path: string): Promise<Location | null> {
    return Array.from(this.locations.values()).find(
      (loc) => loc.geographic_path === path
    ) || null;
  }

  async findBySlugWithinParent(slug: string, parent_id: string): Promise<Location | null> {
    return Array.from(this.locations.values()).find(
      (loc) => loc.slug === slug && loc.parent_id === parent_id
    ) || null;
  }

  async findAncestors(location_id: string, include_self = false): Promise<Location[]> {
    const ancestors: Location[] = [];
    let current = await this.findById(location_id);

    if (!current) return [];

    if (include_self) {
      ancestors.push(current);
    }

    while (current?.parent_id) {
      const parent = await this.findById(current.parent_id);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
    }

    return ancestors;
  }

  async findDescendants(
    location_id: string,
    options: {
      include_self?: boolean;
      max_depth?: number;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }> {
    const descendants: Location[] = [];
    const max_depth = options.max_depth || LOCATION_PAGINATION.MAX_DEPTH;
    const page = options.page || LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size || LOCATION_PAGINATION.DEFAULT_PAGE_SIZE;

    const collectDescendants = (parent_id: string, depth: number) => {
      if (depth > max_depth) return;

      const children = Array.from(this.locations.values()).filter(
        (loc) => loc.parent_id === parent_id
      );

      children.forEach((child) => {
        descendants.push(child);
        collectDescendants(child.id, depth + 1);
      });
    };

    if (options.include_self) {
      const self = await this.findById(location_id);
      if (self) descendants.push(self);
    }

    collectDescendants(location_id, 1);

    const total_count = descendants.length;
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginated = descendants.slice(start, end);

    return { locations: paginated, total_count };
  }

  async findChildren(
    location_id: string,
    options: {
      type?: LocationType;
      status?: LocationStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }> {
    const page = options.page || LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size || LOCATION_PAGINATION.DEFAULT_PAGE_SIZE;

    let children = Array.from(this.locations.values()).filter(
      (loc) => loc.parent_id === location_id
    );

    if (options.type) {
      children = children.filter((loc) => loc.type === options.type);
    }

    if (options.status) {
      children = children.filter((loc) => loc.status === options.status);
    }

    const total_count = children.length;
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginated = children.slice(start, end);

    return { locations: paginated, total_count };
  }

  async findAll(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
}
