/**
 * AddressRepositorySupabase - Implementação Supabase
 *
 * Usa o cliente Supabase padrão (schema gerado).
 * Os tipos de domínio (Address, CreateAddressInput) são mapeados via cast
 * porque o schema gerado usa enums do banco que não estão nos tipos de domínio.
 */

import { supabase } from '@/integrations/supabase/supabase';
import type { IAddressRepository } from './IAddressRepository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '../types';

export class AddressRepositorySupabase implements IAddressRepository {
  private readonly tableName = 'addresses' as const;

  async create(input: CreateAddressInput): Promise<Address> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

    return data as unknown as Address;
  }

  async findById(id: string): Promise<Address | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find address: ${error.message}`);
    }

    return data as unknown as Address;
  }

  async update(id: string, input: UpdateAddressInput): Promise<Address> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    return data as unknown as Address;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }

  async findByLocationId(locationId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find addresses by location: ${error.message}`);
    }

    return (data as unknown as Address[]) ?? [];
  }

  async findByPostalCode(postalCode: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('postal_code', postalCode)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find addresses by postal code: ${error.message}`);
    }

    return (data as unknown as Address[]) ?? [];
  }
}

