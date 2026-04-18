/**
 * AddressRepositorySupabase - Implementação Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { IAddressRepository } from './IAddressRepository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '../types';
import type { AdminSupabaseClient } from '@/core/admin/types/adminDatabase.types';

export class AddressRepositorySupabase implements IAddressRepository {
  private readonly tableName = 'addresses';

  private getTypedClient(): AdminSupabaseClient {
    return supabase as unknown as AdminSupabaseClient;
  }

  async create(input: CreateAddressInput): Promise<Address> {
    const { data, error } = await this.getTypedClient()
      .from(this.tableName)
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

    return data as Address;
  }

  async findById(id: string): Promise<Address | null> {
    const { data, error } = await this.getTypedClient()
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

    return data as Address;
  }

  async update(id: string, input: UpdateAddressInput): Promise<Address> {
    const { data, error } = await this.getTypedClient()
      .from(this.tableName)
      .update([input] as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    return data as Address;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getTypedClient()
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }

  async findByLocationId(locationId: string): Promise<Address[]> {
    const { data, error } = await this.getTypedClient()
      .from(this.tableName)
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find addresses by location: ${error.message}`);
    }

    return (data as Address[]) ?? [];
  }

  async findByPostalCode(postalCode: string): Promise<Address[]> {
    const { data, error } = await this.getTypedClient()
      .from(this.tableName)
      .select('*')
      .eq('postal_code', postalCode)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find addresses by postal code: ${error.message}`);
    }

    return (data as Address[]) ?? [];
  }
}
