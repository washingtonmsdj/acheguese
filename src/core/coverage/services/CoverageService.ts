/**
 * Coverage Service - Implementation
 */

import type { ICoverageService } from './ICoverageService';
import type { ICoverageRepository } from '../repositories/ICoverageRepository';
import type { IGeospatialPort } from '../ports/IGeospatialPort';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import type {
  SetCoverageInput,
  GetCoverageInput,
  DoesCoverInput,
  GetEntitiesCoveringInput,
  RemoveCoverageInput,
  UpdateCoverageStatusInput,
  GetPrimaryCoverageInput,
  ValidateCoverageInput,
  SetCoverageOutput,
  GetCoverageOutput,
  DoesCoverOutput,
  GetEntitiesCoveringOutput,
  RemoveCoverageOutput,
  GetPrimaryCoverageOutput,
  ValidateCoverageOutput,
  ServiceArea,
  CoverageType,
  CoverageWithLocation,
} from '../types';
import { CoverageStatus, CoverageErrorCode, COVERAGE_VALIDATION, COVERAGE_PAGINATION } from '../types';
import { CoverageError } from '../errors/CoverageError';

export class CoverageService implements ICoverageService {
  constructor(
    private repository: ICoverageRepository,
    private locationRepository: ILocationRepository,
    private geospatialPort: IGeospatialPort
  ) {}

  async setCoverage(input: SetCoverageInput): Promise<SetCoverageOutput> {
    // Validar entity_type
    if (!input.entity_type) {
      throw this.createError(CoverageErrorCode.INVALID_ENTITY_TYPE, 'Entity type is required');
    }

    if (!input.entity_id) {
      throw this.createError(CoverageErrorCode.INVALID_ENTITY_ID, 'Entity ID is required');
    }

    if (!input.coverages || input.coverages.length === 0) {
      throw this.createError(CoverageErrorCode.INVALID_COVERAGE_TYPE, 'At least one coverage is required');
    }

    if (input.coverages.length > COVERAGE_VALIDATION.MAX_COVERAGES_PER_ENTITY) {
      throw this.createError(
        CoverageErrorCode.INVALID_COVERAGE_TYPE,
        `Maximum ${COVERAGE_VALIDATION.MAX_COVERAGES_PER_ENTITY} coverages per entity`
      );
    }

    // Validar apenas uma primary
    const primaryCount = input.coverages.filter((c) => c.is_primary).length;
    if (primaryCount > 1) {
      throw this.createError(CoverageErrorCode.MULTIPLE_PRIMARY_COVERAGE, 'Only one primary coverage allowed');
    }

    // Validar cada cobertura
    for (const coverage of input.coverages) {
      await this.validateCoverageDefinition(coverage);
    }

    // Remover coberturas existentes (transação simulada)
    await this.repository.deleteByEntity(input.entity_type, input.entity_id);

    // Criar novas coberturas
    const coveragesToCreate = input.coverages.map((c) => ({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      coverage_type: c.coverage_type,
      location_id: c.location_id,
      radius_km: c.radius_km || null,
      is_primary: c.is_primary || false,
      status: CoverageStatus.ACTIVE,
    }));

    const coverages = await this.repository.createMany(coveragesToCreate);

    return {
      coverages,
      count: coverages.length,
    };
  }

  async getCoverage(input: GetCoverageInput): Promise<GetCoverageOutput> {
    const coverages = await this.repository.findByEntity(input.entity_type, input.entity_id, input.status);

    const coveragesWithLocation: CoverageWithLocation[] = [];

    for (const coverage of coverages) {
      const location = await this.locationRepository.findById(coverage.location_id);
      if (location) {
        coveragesWithLocation.push({
          coverage,
          location_name: location.name,
          location_path: location.geographic_path,
          location_type: location.type,
        });
      }
    }

    return {
      coverages: coveragesWithLocation,
      count: coveragesWithLocation.length,
    };
  }

  async doesCover(input: DoesCoverInput): Promise<DoesCoverOutput> {
    const coverages = await this.repository.findByEntity(input.entity_type, input.entity_id, CoverageStatus.ACTIVE);

    const targetLocation = await this.locationRepository.findById(input.location_id);
    if (!targetLocation) {
      throw this.createError(CoverageErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    for (const coverage of coverages) {
      const coverageLocation = await this.locationRepository.findById(coverage.location_id);
      if (!coverageLocation) continue;

      // DISTRICT: cobre apenas o district exato
      if (coverage.coverage_type === 'district') {
        if (coverage.location_id === input.location_id) {
          return {
            covers: true,
            coverage,
            reason: null,
          };
        }
      }

      // CITY: cobre a city e seus districts
      if (coverage.coverage_type === 'city') {
        if (coverage.location_id === input.location_id) {
          return {
            covers: true,
            coverage,
            reason: null,
          };
        }

        // Verificar se target é descendente da city
        const ancestors = await this.locationRepository.findAncestors(input.location_id, false);
        if (ancestors.some((a) => a.id === coverage.location_id)) {
          return {
            covers: true,
            coverage,
            reason: null,
          };
        }
      }

      // RADIUS: usa IGeospatialPort
      if (coverage.coverage_type === 'radius' && coverage.radius_km) {
        try {
          const isWithin = await this.geospatialPort.isWithinRadius(
            coverage.location_id,
            input.location_id,
            coverage.radius_km
          );

          if (isWithin) {
            return {
              covers: true,
              coverage,
              reason: null,
            };
          }
        } catch (error) {
          // Se falhar cálculo, continua para próxima cobertura
          continue;
        }
      }
    }

    return {
      covers: false,
      coverage: null,
      reason: 'No coverage found for this location',
    };
  }

  async getEntitiesCovering(input: GetEntitiesCoveringInput): Promise<GetEntitiesCoveringOutput> {
    if (!input.entity_type) {
      throw this.createError(CoverageErrorCode.INVALID_ENTITY_TYPE, 'Entity type is required');
    }

    const page = input.page || COVERAGE_PAGINATION.DEFAULT_PAGE;
    const page_size = Math.min(
      input.page_size || COVERAGE_PAGINATION.DEFAULT_PAGE_SIZE,
      COVERAGE_PAGINATION.MAX_PAGE_SIZE
    );

    const result = await this.repository.findEntitiesCovering(input.entity_type, input.location_id, {
      status: input.status,
      page,
      page_size,
    });

    return {
      entity_ids: result.entity_ids,
      entity_type: input.entity_type,
      total_count: result.total_count,
      page,
      page_size,
      has_more: page * page_size < result.total_count,
    };
  }

  async removeCoverage(input: RemoveCoverageInput): Promise<RemoveCoverageOutput> {
    const removed_count = await this.repository.deleteByEntity(
      input.entity_type,
      input.entity_id,
      input.coverage_id
    );

    if (removed_count === 0 && input.coverage_id) {
      throw this.createError(CoverageErrorCode.COVERAGE_NOT_FOUND, `Coverage ${input.coverage_id} not found`);
    }

    return { removed_count };
  }

  async updateCoverageStatus(input: UpdateCoverageStatusInput): Promise<void> {
    const coverage = await this.repository.findById(input.coverage_id);

    if (!coverage) {
      throw this.createError(CoverageErrorCode.COVERAGE_NOT_FOUND, `Coverage ${input.coverage_id} not found`);
    }

    await this.repository.updateStatus(input.coverage_id, input.status);
  }

  async getPrimaryCoverage(input: GetPrimaryCoverageInput): Promise<GetPrimaryCoverageOutput> {
    const coverage = await this.repository.findPrimaryByEntity(input.entity_type, input.entity_id);

    if (!coverage) {
      return { coverage: null };
    }

    const location = await this.locationRepository.findById(coverage.location_id);

    if (!location) {
      return { coverage: null };
    }

    return {
      coverage: {
        coverage,
        location_name: location.name,
        location_path: location.geographic_path,
        location_type: location.type,
      },
    };
  }

  async validateCoverage(input: ValidateCoverageInput): Promise<ValidateCoverageOutput> {
    const errors: string[] = [];

    // Validar location existe
    const location = await this.locationRepository.findById(input.location_id);
    if (!location) {
      errors.push('Location not found');
    } else if (location.status !== 'active') {
      errors.push('Location is not active');
    }

    // Validar radius
    if (input.coverage_type === 'radius') {
      if (!input.radius_km) {
        errors.push('Radius is required for radius coverage type');
      } else if (
        input.radius_km < COVERAGE_VALIDATION.MIN_RADIUS_KM ||
        input.radius_km > COVERAGE_VALIDATION.MAX_RADIUS_KM
      ) {
        errors.push(
          `Radius must be between ${COVERAGE_VALIDATION.MIN_RADIUS_KM} and ${COVERAGE_VALIDATION.MAX_RADIUS_KM} km`
        );
      }
    } else {
      if (input.radius_km) {
        errors.push('Radius is not allowed for non-radius coverage types');
      }
    }

    return {
      is_valid: errors.length === 0,
      validation_errors: errors,
    };
  }

  private async validateCoverageDefinition(coverage: any): Promise<void> {
    // Validar location existe e está ativa
    const location = await this.locationRepository.findById(coverage.location_id);
    if (!location) {
      throw this.createError(CoverageErrorCode.LOCATION_NOT_FOUND, `Location ${coverage.location_id} not found`);
    }

    if (location.status !== 'active') {
      throw this.createError(CoverageErrorCode.LOCATION_INACTIVE, `Location ${coverage.location_id} is not active`);
    }

    // Validar radius
    if (coverage.coverage_type === 'radius') {
      if (!coverage.radius_km) {
        throw this.createError(CoverageErrorCode.RADIUS_REQUIRED, 'Radius is required for radius coverage type');
      }

      if (
        coverage.radius_km < COVERAGE_VALIDATION.MIN_RADIUS_KM ||
        coverage.radius_km > COVERAGE_VALIDATION.MAX_RADIUS_KM
      ) {
        throw this.createError(
          CoverageErrorCode.INVALID_RADIUS,
          `Radius must be between ${COVERAGE_VALIDATION.MIN_RADIUS_KM} and ${COVERAGE_VALIDATION.MAX_RADIUS_KM} km`
        );
      }
    } else {
      if (coverage.radius_km) {
        throw this.createError(
          CoverageErrorCode.RADIUS_NOT_ALLOWED,
          'Radius is not allowed for non-radius coverage types'
        );
      }
    }
  }

  private createError(code: CoverageErrorCode, message: string, details?: Record<string, unknown>): CoverageError {
    return new CoverageError(code, message, details);
  }
}
