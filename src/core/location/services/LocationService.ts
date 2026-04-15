/**
 * Location Service - Implementation
 */

import type { ILocationService } from './ILocationService';
import type { ILocationRepository } from '../repositories/ILocationRepository';
import type {
  GetLocationByIdInput,
  GetLocationByPathInput,
  GetLocationBySlugWithinParentInput,
  GetAncestorsInput,
  GetDescendantsInput,
  GetChildrenInput,
  ValidateLocationInput,
  GetLocationOutput,
  GetAncestorsOutput,
  GetDescendantsOutput,
  GetChildrenOutput,
  ValidateLocationOutput,
  GetLocationTreeOutput,
  Location,
  LocationTree,
} from '../types';
import { LocationErrorCode, LOCATION_PAGINATION } from '../types';
import { LocationError } from '../errors/LocationError';

export class LocationService implements ILocationService {
  constructor(private repository: ILocationRepository) {}

  async getLocationById(input: GetLocationByIdInput): Promise<GetLocationOutput> {
    if (!input.id || typeof input.id !== 'string') {
      throw this.createError(LocationErrorCode.INVALID_LOCATION_ID, 'Invalid location ID');
    }

    const location = await this.repository.findById(input.id);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location ${input.id} not found`);
    }

    return { location };
  }

  async getLocationByPath(input: GetLocationByPathInput): Promise<GetLocationOutput> {
    if (!input.path || !input.path.startsWith('/')) {
      throw this.createError(LocationErrorCode.INVALID_PATH, 'Path must start with /');
    }

    const location = await this.repository.findByPath(input.path);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location with path ${input.path} not found`);
    }

    return { location };
  }

  async getLocationBySlugWithinParent(input: GetLocationBySlugWithinParentInput): Promise<GetLocationOutput> {
    if (!input.slug) {
      throw this.createError(LocationErrorCode.INVALID_SLUG, 'Slug is required');
    }

    if (!input.parent_id) {
      throw this.createError(LocationErrorCode.PARENT_NOT_FOUND, 'Parent ID is required');
    }

    // Validar que parent existe
    const parent = await this.repository.findById(input.parent_id);
    if (!parent) {
      throw this.createError(LocationErrorCode.PARENT_NOT_FOUND, `Parent ${input.parent_id} not found`);
    }

    const location = await this.repository.findBySlugWithinParent(input.slug, input.parent_id);

    if (!location) {
      throw this.createError(
        LocationErrorCode.LOCATION_NOT_FOUND,
        `Location with slug ${input.slug} not found within parent ${input.parent_id}`
      );
    }

    return { location };
  }

  async getAncestors(input: GetAncestorsInput): Promise<GetAncestorsOutput> {
    const location = await this.repository.findById(input.location_id);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    const ancestors = await this.repository.findAncestors(input.location_id, input.include_self);

    return {
      ancestors,
      count: ancestors.length,
    };
  }

  async getDescendants(input: GetDescendantsInput): Promise<GetDescendantsOutput> {
    const location = await this.repository.findById(input.location_id);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    const max_depth = input.max_depth || LOCATION_PAGINATION.MAX_DEPTH;
    if (max_depth > LOCATION_PAGINATION.MAX_DEPTH) {
      throw this.createError(
        LocationErrorCode.INVALID_HIERARCHY,
        `Max depth cannot exceed ${LOCATION_PAGINATION.MAX_DEPTH}`
      );
    }

    const page = input.page || LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = Math.min(
      input.page_size || LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
      LOCATION_PAGINATION.MAX_PAGE_SIZE
    );

    const result = await this.repository.findDescendants(input.location_id, {
      include_self: input.include_self,
      max_depth,
      page,
      page_size,
    });

    return {
      descendants: result.locations,
      total_count: result.total_count,
      page,
      page_size,
      has_more: page * page_size < result.total_count,
    };
  }

  async getChildren(input: GetChildrenInput): Promise<GetChildrenOutput> {
    const location = await this.repository.findById(input.location_id);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    const page = input.page || LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = Math.min(
      input.page_size || LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
      LOCATION_PAGINATION.MAX_PAGE_SIZE
    );

    const result = await this.repository.findChildren(input.location_id, {
      type: input.type,
      status: input.status,
      page,
      page_size,
    });

    return {
      children: result.locations,
      total_count: result.total_count,
      page,
      page_size,
      has_more: page * page_size < result.total_count,
    };
  }

  async validateLocation(input: ValidateLocationInput): Promise<ValidateLocationOutput> {
    const errors: string[] = [];

    const location = await this.repository.findById(input.location_id);

    if (!location) {
      return {
        is_valid: false,
        location: null,
        validation_errors: ['Location not found'],
      };
    }

    if (input.required_status && location.status !== input.required_status) {
      errors.push(`Location status is ${location.status}, expected ${input.required_status}`);
    }

    if (input.required_type && location.type !== input.required_type) {
      errors.push(`Location type is ${location.type}, expected ${input.required_type}`);
    }

    return {
      is_valid: errors.length === 0,
      location,
      validation_errors: errors,
    };
  }

  async getLocationTree(input: GetLocationByIdInput): Promise<GetLocationTreeOutput> {
    const location = await this.repository.findById(input.id);

    if (!location) {
      throw this.createError(LocationErrorCode.LOCATION_NOT_FOUND, `Location ${input.id} not found`);
    }

    const tree = await this.buildTree(location, 0);
    const total_nodes = this.countNodes(tree);

    return { tree, total_nodes };
  }

  private async buildTree(location: Location, depth: number): Promise<LocationTree> {
    const childrenResult = await this.repository.findChildren(location.id, {
      page: 1,
      page_size: 1000, // Get all children for tree
    });

    const children: LocationTree[] = [];
    for (const child of childrenResult.locations) {
      children.push(await this.buildTree(child, depth + 1));
    }

    return {
      location,
      children,
      depth,
    };
  }

  private countNodes(tree: LocationTree): number {
    let count = 1; // Current node
    for (const child of tree.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  private createError(code: LocationErrorCode, message: string, details?: Record<string, unknown>): LocationError {
    return new LocationError(code, message, details);
  }
}
