/**
 * CommunityService - SSOT para sistema comunitário
 *
 * Escopo:
 * - Fachada canônica de grupos comunitários.
 *
 * Perfis, reputação e gamificação não pertencem a este contrato: o schema
 * remoto não possui essas entidades como um domínio publicado.
 */

import type { TerritoryFilter } from "@/core/location";
import {
  CommunityGroupsService,
  type GroupCreateInput,
  type GroupRow,
} from "./CommunityGroupsService";
class CommunityServiceClass {
  async getGroupsPage(params: {
    search?: string;
    territoryFilter?: TerritoryFilter;
    offset?: number;
    limit?: number;
    groupIds?: string[];
    onlyMemberGroups?: boolean;
    sortBy?: "recentes" | "populares" | "relevancia";
  }): Promise<{ items: GroupRow[]; totalCount: number; hasMore: boolean; nextOffset: number | null }> {
    return CommunityGroupsService.getGroupsPage(params);
  }

  async getGroups(search?: string, territoryFilter?: TerritoryFilter): Promise<GroupRow[]> {
    return CommunityGroupsService.getGroups(search, territoryFilter);
  }

  async getGroupById(groupId: string): Promise<GroupRow | null> {
    return CommunityGroupsService.getGroupById(groupId);
  }

  async createGroup(groupData: GroupCreateInput): Promise<GroupRow | null> {
    return CommunityGroupsService.createGroup(groupData);
  }

}

export const CommunityService = new CommunityServiceClass();
export { CommunityService as communityService };
