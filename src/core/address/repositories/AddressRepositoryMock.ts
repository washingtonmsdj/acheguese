/**
 * AddressRepositoryMock - Implementação mock para testes
 */

import type { IAddressRepository } from './IAddressRepository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '../types';

export class AddressRepositoryMock implements IAddressRepository {
  private addresses: Map<string, Address> = new Map();
  private idCounter = 1;

  async create(input: CreateAddressInput): Promise<Address> {
    const id = `addr-mock-${this.idCounter++}`;
    const now = new Date().toISOString();

    const address: Address = {
      id,
      location_id: input.location_id,
      postal_code: input.postal_code ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      address_type: input.address_type ?? 'exact',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      geocoded_at: input.geocoded_at ?? null,
      geocoding_source: input.geocoding_source ?? null,
      geocoding_confidence: input.geocoding_confidence ?? null,
      is_verified: false,
      verified_at: null,
      verified_by: null,
      created_at: now,
      updated_at: now,
    };

    this.addresses.set(id, address);
    return address;
  }

  async findById(id: string): Promise<Address | null> {
    return this.addresses.get(id) ?? null;
  }

  async update(id: string, input: UpdateAddressInput): Promise<Address> {
    const existing = this.addresses.get(id);
    if (!existing) {
      throw new Error(`Address not found: ${id}`);
    }

    const updated: Address = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };

    this.addresses.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.addresses.delete(id);
  }

  async findByLocationId(locationId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(
      (addr) => addr.location_id === locationId
    );
  }

  async findByPostalCode(postalCode: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(
      (addr) => addr.postal_code === postalCode
    );
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.addresses.clear();
    this.idCounter = 1;
  }

  getAll(): Address[] {
    return Array.from(this.addresses.values());
  }
}
