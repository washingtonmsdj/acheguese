/**
 * TerritorialGroupRepositorySupabase
 *
 * Implementação Supabase — pronta para quando o banco entrar.
 */

import { supabase } from '@/integrations/supabase';
import type { ITerritorialGroupRepository, CreateTerritorialGroupData, UpdateTerritorialGroupData } from './ITerritorialGroupRepository';
import type { Location, TerritorialGroup, TerritorialGroupWithMembers } from '../types';
import type { SupabaseClient } from '@/integrations/supabase';

export class TerritorialGroupRepositorySupabase implements ITerritorialGroupRepository {
  private readonly db: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.db = client ?? (supabase as unknown as SupabaseClient);
  }

  async findById(groupId: string): Promise<TerritorialGroup | null> {
    const { data, error } = await this.db
      .from('territorial_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  async findBySlugAndCity(slug: string, cityId: string): Promise<TerritorialGroup | null> {
    const { data, error } = await this.db
      .from('territorial_groups')
      .select('*')
      .eq('slug', slug)
      .eq('anchor_city_id', cityId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  async findWithMembers(groupId: string): Promise<TerritorialGroupWithMembers | null> {
    const group = await this.findById(groupId);
    if (!group) return null;
    const members = await this.listMembers(groupId);
    return { ...group, members };
  }

  async listMembers(groupId: string): Promise<Location[]> {
    const { data, error } = await this.db
      .from('territorial_group_members')
      .select('locations(*)')
      .eq('group_id', groupId);
    if (error) throw error;
    return ((data ?? []) as unknown as Array<{ locations: Location | null }>)
      .map((row: { locations: Location | null }) => row.locations)
      .filter((location): location is Location => Boolean(location));
  }

  async findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    const { data, error } = await this.db
      .from('territorial_group_members')
      .select('territorial_groups(*)')
      .eq('location_id', locationId);
    if (error) throw error;
    return ((data ?? []) as unknown as Array<{ territorial_groups: TerritorialGroup | null }>)
      .map((row: { territorial_groups: TerritorialGroup | null }) => row.territorial_groups)
      .filter((group): group is TerritorialGroup => Boolean(group));
  }

  async listAll(): Promise<TerritorialGroupWithMembers[]> {
    const { data: groups, error } = await this.db
      .from('territorial_groups')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    if (!groups) return [];

    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await this.listMembers(group.id);
        return { ...group, members };
      })
    );

    return groupsWithMembers;
  }

  async create(data: CreateTerritorialGroupData): Promise<TerritorialGroup> {
    const { data: group, error } = await this.db
      .from('territorial_groups')
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        anchor_city_id: data.anchor_city_id,
        status: data.status ?? 'inactive',
        metadata: data.metadata ?? {},
      })
      .select()
      .single();
    
    if (error) throw error;
    return group;
  }

  async update(groupId: string, data: UpdateTerritorialGroupData): Promise<TerritorialGroup> {
    const { data: group, error } = await this.db
      .from('territorial_groups')
      .update({
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return group;
  }

  async addMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) return;

    const { error } = await this.db
      .from('territorial_group_members')
      .insert(
        locationIds.map(locationId => ({
          group_id: groupId,
          location_id: locationId,
        }))
      );
    
    if (error) throw error;
  }

  async removeMembers(groupId: string, locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) return;

    const { error } = await this.db
      .from('territorial_group_members')
      .delete()
      .eq('group_id', groupId)
      .in('location_id', locationIds);
    
    if (error) throw error;
  }

  async replaceMembers(groupId: string, locationIds: string[]): Promise<void> {
    const { error: deleteError } = await this.db
      .from('territorial_group_members')
      .delete()
      .eq('group_id', groupId);
    
    if (deleteError) throw deleteError;

    if (locationIds.length > 0) {
      await this.addMembers(groupId, locationIds);
    }
  }
}
