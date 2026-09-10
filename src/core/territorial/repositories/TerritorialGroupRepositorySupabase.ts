/**
 * Canonical Supabase repository for territorial groups.
 *
 * Geographic member entities remain owned by core/location; group persistence
 * and membership persistence are owned here in core/territorial.
 */

import { supabase } from '@/integrations/supabase';
import type { SupabaseClient } from '@/integrations/supabase';
import type { Location } from '@/core/location/types';
import type { TerritorialGroup, TerritorialGroupWithMembers } from '../contracts';
import type {
  ITerritorialGroupRepository,
  CreateTerritorialGroupData,
  UpdateTerritorialGroupData,
} from './ITerritorialGroupRepository';

interface TerritorialMembershipLocationRow {
  group_id: string;
  locations: Location | null;
}

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
      .map((row) => row.locations)
      .filter((location): location is Location => Boolean(location));
  }

  async hasMember(groupId: string, locationId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from('territorial_group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('location_id', locationId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async findGroupsContainingLocation(locationId: string): Promise<TerritorialGroup[]> {
    const { data, error } = await this.db
      .from('territorial_group_members')
      .select('territorial_groups(*)')
      .eq('location_id', locationId);
    if (error) throw error;
    return ((data ?? []) as unknown as Array<{ territorial_groups: TerritorialGroup | null }>)
      .map((row) => row.territorial_groups)
      .filter((group): group is TerritorialGroup => Boolean(group));
  }

  private async listWithMembers(status?: 'active'): Promise<TerritorialGroupWithMembers[]> {
    let groupsQuery = this.db
      .from('territorial_groups')
      .select('*');

    if (status) groupsQuery = groupsQuery.eq('status', status);

    const { data: groups, error: groupsError } = await groupsQuery.order('name');
    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) return [];

    const groupIds = groups.map((group) => group.id);
    const { data: membershipData, error: membershipError } = await this.db
      .from('territorial_group_members')
      .select('group_id, locations(*)')
      .in('group_id', groupIds);

    if (membershipError) throw membershipError;

    const membersByGroup = new Map<string, Location[]>();
    for (const row of (membershipData ?? []) as unknown as TerritorialMembershipLocationRow[]) {
      if (!row.locations) continue;
      const members = membersByGroup.get(row.group_id) ?? [];
      members.push(row.locations);
      membersByGroup.set(row.group_id, members);
    }

    return groups.map((group) => ({
      ...group,
      members: membersByGroup.get(group.id) ?? [],
    }));
  }

  /** Product/public inventory remains active-only. */
  async listAll(): Promise<TerritorialGroupWithMembers[]> {
    return this.listWithMembers('active');
  }

  /** Admin RLS may expose inactive groups; public callers still cannot see them. */
  async listAllForAdmin(): Promise<TerritorialGroupWithMembers[]> {
    return this.listWithMembers();
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
      .insert(locationIds.map((locationId) => ({ group_id: groupId, location_id: locationId })));

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
    if (locationIds.length > 0) await this.addMembers(groupId, locationIds);
  }
}
