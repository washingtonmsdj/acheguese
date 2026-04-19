/**
 * Coverage Repository Mock - In-Memory Implementation
 */

import type { ICoverageRepository } from './ICoverageRepository';
import type { ServiceArea, EntityType, CoverageStatus } from '../types';
import { COVERAGE_PAGINATION } from '../types';

export class CoverageRepositoryMock implements ICoverageRepository {
  private coverages: Map<string, ServiceArea> = new Map();
  private idCounter = 1;

  async createMany(
    coverages: Omit<ServiceArea, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<ServiceArea[]> {
    const created: ServiceArea[] = [];

    for (const coverage of coverages) {
      const id = `cov-${this.idCounter++}`;
      const now = new Date().toISOString();

      const newCoverage: ServiceArea = {
        ...coverage,
        id,
        created_at: now,
        updated_at: now,
      };

      this.coverages.set(id, newCoverage);
      created.push(newCoverage);
    }

    return created;
  }

  async findByEntity(
    entity_type: EntityType,
    entity_id: string,
    status?: CoverageStatus
  ): Promise<ServiceArea[]> {
    let results = Array.from(this.coverages.values()).filter(
      (c) => c.entity_type === entity_type && c.entity_id === entity_id
    );

    if (status) {
      results = results.filter((c) => c.status === status);
    }

    return results;
  }

  async findPrimaryByEntity(
    entity_type: EntityType,
    entity_id: string
  ): Promise<ServiceArea | null> {
    return (
      Array.from(this.coverages.values()).find(
        (c) =>
          c.entity_type === entity_type &&
          c.entity_id === entity_id &&
          c.is_primary === true
      ) || null
    );
  }

  async findEntitiesCovering(
    entity_type: EntityType,
    location_id: string,
    options: {
      status?: CoverageStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ entity_ids: string[]; total_count: number }> {
    const page = options.page || COVERAGE_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size || COVERAGE_PAGINATION.DEFAULT_PAGE_SIZE;

    let results = Array.from(this.coverages.values()).filter(
      (c) => c.entity_type === entity_type && c.location_id === location_id
    );

    if (options.status) {
      results = results.filter((c) => c.status === options.status);
    }

    const entity_ids = [...new Set(results.map((c) => c.entity_id))];
    const total_count = entity_ids.length;

    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginated = entity_ids.slice(start, end);

    return { entity_ids: paginated, total_count };
  }

  async deleteByEntity(
    entity_type: EntityType,
    entity_id: string,
    coverage_id?: string
  ): Promise<number> {
    let deleted = 0;

    if (coverage_id) {
      const coverage = this.coverages.get(coverage_id);
      if (
        coverage &&
        coverage.entity_type === entity_type &&
        coverage.entity_id === entity_id
      ) {
        this.coverages.delete(coverage_id);
        deleted = 1;
      }
    } else {
      for (const [id, coverage] of this.coverages.entries()) {
        if (
          coverage.entity_type === entity_type &&
          coverage.entity_id === entity_id
        ) {
          this.coverages.delete(id);
          deleted++;
        }
      }
    }

    return deleted;
  }

  async updateStatus(coverage_id: string, status: CoverageStatus): Promise<void> {
    const coverage = this.coverages.get(coverage_id);
    if (coverage) {
      coverage.status = status;
      coverage.updated_at = new Date().toISOString();
    }
  }

  async findById(coverage_id: string): Promise<ServiceArea | null> {
    return this.coverages.get(coverage_id) || null;
  }
}
