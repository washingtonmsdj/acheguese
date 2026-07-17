/**
 * GroupService - SSOT para grupos da comunidade
 *
 * Responsável por:
 * - Buscar grupos e detalhes
 * - Criar grupos
 * - Gerenciar memberships (via SocialGroupInteractionsService)
 *
 * Arquitetura: Component → Hook → GroupService → Supabase
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { SocialGroupInteractionsService } from "./SocialGroupInteractionsService";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface GroupDbClient {
  rpc<TResult>(fn: string, args?: Record<string, unknown>): QueryResult<TResult>;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  category: string | null;
  visibility?: string | null;
  join_policy?: string | null;
  posting_policy?: string | null;
  member_visibility?: string | null;
  media_policy?: string | null;
  rules?: string | null;
  tags?: string[] | null;
  capabilities?: Record<string, boolean> | null;
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
  private static readonly db = supabase as unknown as GroupDbClient;
  /**
   * Busca detalhes de um grupo específico
   */
  static async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const { data, error } = await this.db.rpc("get_community_group_by_id", {
        p_group_id: groupId,
      });

      if (error) throw error;

      return (data as Group) || null;
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
   * Delegado para SocialGroupInteractionsService
   */
  static async getGroupMembers(
    groupId: string,
    limit = 50,
  ): Promise<GroupMemberDetail[]> {
    try {
      // Canonical group interaction owner.
      const members = await SocialGroupInteractionsService.getGroupMembers(groupId);

      // Converter para o formato esperado pelo GroupService
      return members.slice(0, limit).map((m) => ({
        id: m.id,
        group_id: m.group_id,
        member_profile_id: m.member_profile_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: ("profile" in m ? (m as GroupMemberDetail).profile : null) || null,
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
   * Busca mensagem completa de grupo por ID (para realtime enrichment)
   * Delegado para SocialGroupInteractionsService
   */
  static async getGroupMessageById(messageId: string): Promise<Record<string, unknown> | null> {
    try {
      // Canonical group interaction owner.
      return await SocialGroupInteractionsService.getGroupMessageById(messageId);
    } catch (error) {
      trackError(error as Error, {
        component: "GroupService",
        action: "getGroupMessageById",
      });
      return null;
    }
  }
}

