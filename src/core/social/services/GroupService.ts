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

const MOCK_GROUPS: Group[] = [
  {
    id: "mock-avisos-complexo",
    name: "Avisos do Complexo",
    description: "Comunicados importantes, alertas preventivos e informacoes rapidas para moradores do Complexo.",
    avatar_url: null,
    cover_url: null,
    category: "avisos",
    city: "Salvador",
    neighborhood: "Complexo do Nordeste de Amaralina",
    is_private: false,
    visibility: "public",
    join_policy: "open",
    posting_policy: "admins",
    member_visibility: "members_count_public",
    media_policy: "manual_download",
    rules: "Respeite moradores, comerciantes e liderancas locais.\nEvite boatos: publique alertas com contexto verificavel.\nSomente administradores publicam comunicados oficiais.",
    tags: ["complexo", "avisos", "seguranca"],
    capabilities: { text: true, images: true, audio: true, polls: true, chat: true, reactions: true, reports: true, share_link: true },
    members_count: 128,
    posts_count: 18,
    created_by: "",
    created_at: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "mock-empreendedores-servicos",
    name: "Empreendedores e Servicos Locais",
    description: "Comerciantes, profissionais e moradores trocando indicacoes, oportunidades e pedidos.",
    avatar_url: null,
    cover_url: null,
    category: "comercio",
    city: "Salvador",
    neighborhood: "Complexo do Nordeste de Amaralina",
    is_private: false,
    visibility: "public",
    join_policy: "open",
    posting_policy: "members",
    member_visibility: "members_count_public",
    media_policy: "manual_download",
    rules: "Publique ofertas com clareza e sem spam.\nNegociacoes sao responsabilidade das partes.\nDenuncie golpes, propaganda abusiva ou perfis falsos.",
    tags: ["complexo", "comercio", "servicos"],
    capabilities: { text: true, images: true, audio: true, polls: true, chat: true, reactions: true, reports: true, share_link: true },
    members_count: 64,
    posts_count: 11,
    created_by: "",
    created_at: "2026-04-29T15:30:00.000Z",
  },
];

const MOCK_GROUP_MEMBERS: GroupMemberDetail[] = [
  {
    id: "mock-admin-1",
    group_id: "mock-avisos-complexo",
    member_profile_id: "mock-admin-profile",
    role: "admin",
    joined_at: "2026-05-01T09:00:00.000Z",
    profile: {
      id: "mock-admin-profile",
      name: "Admin Comunidade",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Admin%20Comunidade",
    },
  },
  {
    id: "mock-mod-1",
    group_id: "mock-avisos-complexo",
    member_profile_id: "mock-mod-1",
    role: "moderator",
    joined_at: "2026-05-01T10:00:00.000Z",
    profile: {
      id: "mock-mod-1",
      name: "Lideranca Nordeste",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Lideranca%20Nordeste",
    },
  },
  {
    id: "mock-member-1",
    group_id: "mock-avisos-complexo",
    member_profile_id: "mock-member-1",
    role: "member",
    joined_at: "2026-05-01T11:00:00.000Z",
    profile: {
      id: "mock-member-1",
      name: "Joana Santa Cruz",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Joana%20Santa%20Cruz",
    },
  },
  {
    id: "mock-member-2",
    group_id: "mock-avisos-complexo",
    member_profile_id: "mock-member-2",
    role: "member",
    joined_at: "2026-05-02T08:30:00.000Z",
    profile: {
      id: "mock-member-2",
      name: "Carlos Vale",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Carlos%20Vale",
    },
  },
  {
    id: "mock-admin-2",
    group_id: "mock-empreendedores-servicos",
    member_profile_id: "mock-admin-2",
    role: "admin",
    joined_at: "2026-04-29T15:30:00.000Z",
    profile: {
      id: "mock-admin-2",
      name: "Rede de Comerciantes",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Rede%20de%20Comerciantes",
    },
  },
  {
    id: "mock-member-3",
    group_id: "mock-empreendedores-servicos",
    member_profile_id: "mock-member-3",
    role: "member",
    joined_at: "2026-04-29T16:10:00.000Z",
    profile: {
      id: "mock-member-3",
      name: "Morador Empreendedor",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Morador%20Empreendedor",
    },
  },
  {
    id: "mock-member-4",
    group_id: "mock-empreendedores-servicos",
    member_profile_id: "mock-member-4",
    role: "member",
    joined_at: "2026-04-30T09:00:00.000Z",
    profile: {
      id: "mock-member-4",
      name: "Paula Chapada",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Paula%20Chapada",
    },
  },
];

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
      return MOCK_GROUPS.find((group) => group.id === groupId) ?? null;
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
      if ((!members || members.length === 0) && groupId.startsWith("mock-")) {
        return MOCK_GROUP_MEMBERS.filter((member) => member.group_id === groupId).slice(0, limit);
      }

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
      return MOCK_GROUP_MEMBERS.filter((member) => member.group_id === groupId).slice(0, limit);
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
