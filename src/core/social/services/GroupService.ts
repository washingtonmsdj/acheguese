/**
 * GroupService - SSOT para grupos da comunidade
 *
 * Responsável por:
 * - Buscar grupos e detalhes
 * - Criar grupos
 * - Gerenciar memberships (via SocialInteractionsService)
 *
 * Arquitetura: Component → Hook → GroupService → Supabase
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { SocialInteractionsService } from "./SocialInteractionsService";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  is_private: boolean;
  members_count: number;
  posts_count: number;
  created_by: string;
  created_at: string;
  is_member?: boolean;
  creator?: { name: string; avatar_url: string | null } | null;
}

export interface GroupMemberDetail {
  id: string;
  group_id: string;
  member_profile_id: string;
  role: string;
  joined_at: string;
  profile: { id: string; name: string; avatar_url: string | null } | null;
}

export class GroupService {
  /**
   * Busca todos os grupos ordenados por membros
   */
  static async getGroups(): Promise<Group[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("groups")
        .select(`
          *,
          profiles:created_by(name, avatar_url),
          members_count:group_members_new(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((group: any) => ({
        ...group,
        members_count: group.members_count?.[0]?.count ?? 0,
      }));
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getGroups",
      });
      return [];
    }
  }

  /**
   * Busca IDs dos grupos em que o usuário é membro
   * Migrado para usar SocialInteractionsService
   */
  static async getUserGroupIds(userId: string): Promise<string[]> {
    try {
      // Usar SocialInteractionsService que agora tem este método
      return await SocialInteractionsService.getUserGroupIds(userId);
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getUserGroupIds",
      });
      return [];
    }
  }

  /**
   * Busca detalhes de um grupo específico
   */
  static async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("groups")
        .select("*, profiles:created_by(name, avatar_url)")
        .eq("id", groupId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getGroupById",
        metadata: { groupId },
      });
      return null;
    }
  }

  /**
   * Busca membros de um grupo
   * Delegado para SocialInteractionsService
   */
  static async getGroupMembers(
    groupId: string,
    limit = 50,
  ): Promise<GroupMemberDetail[]> {
    try {
      // Usar SocialInteractionsService que já tem este método
      const members = await SocialInteractionsService.getGroupMembers(groupId);

      // Converter para o formato esperado pelo GroupService
      return members.slice(0, limit).map((m) => ({
        id: m.id,
        group_id: m.group_id,
        member_profile_id: m.member_profile_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: (m as any).profile || null,
      }));
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getGroupMembers",
        metadata: { groupId },
      });
      return [];
    }
  }

  /**
   * Cria um novo grupo
   */
  static async createGroup(data: {
    name: string;
    description?: string;
    category?: string;
    is_private?: boolean;
    created_by: string;
  }): Promise<Group> {
    try {
      const { data: group, error } = await (supabase as any)
        .from("groups")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return group;
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "createGroup",
      });
      throw error;
    }
  }

  /**
   * Incrementa contador de membros via RPC
   */
  static async incrementMembersCount(groupId: string): Promise<void> {
    try {
      await (supabase as any).rpc("increment_group_members", { gid: groupId });
    } catch (error) {
      logger.warn("Failed to increment group members count:", error);
    }
  }

  /**
   * Busca mensagem completa de grupo por ID (para realtime enrichment)
   * Migrado para usar SocialInteractionsService
   */
  static async getGroupMessageById(messageId: string): Promise<any | null> {
    try {
      // Usar SocialInteractionsService que agora tem este método
      return await SocialInteractionsService.getGroupMessageById(messageId);
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getGroupMessageById",
      });
      return null;
    }
  }
}
