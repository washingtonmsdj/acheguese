import { useState, useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityService } from "@/core/community/services/CommunityService";
import type { TerritoryFilter } from "@/core/location";
import { useSessionContext } from "@/core/session";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { DEFAULT_GROUP_RULES } from "@/shared/constants/groupTaxonomy";

export type GroupTab = "todos" | "meus";
export type GroupSort = "recentes" | "populares" | "relevancia";

export interface NewGroupData {
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  location_id?: string;
  join_policy?: string;
  posting_policy?: string;
  member_visibility?: string;
  media_policy?: string;
  rules?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  members_count?: number;
  posts_count?: number;
  created_at: string;
  is_member: boolean;
  is_private: boolean;
  location_id?: string | null;
}

interface UseGruposOptions {
  territoryFilter?: TerritoryFilter;
  defaultLocationId?: string;
}

const GROUPS_PAGE_SIZE = 20;

export function useGrupos(options: UseGruposOptions = {}) {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();
  const { territoryFilter, defaultLocationId } = options;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<GroupTab>("todos");
  const [sortBy, setSortBy] = useState<GroupSort>("recentes");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupData>({
    name: "",
    description: "",
    category: "",
    is_private: false,
    location_id: defaultLocationId,
    join_policy: "open",
    posting_policy: "members",
    member_visibility: "members_count_public",
    media_policy: "manual_download",
    rules: DEFAULT_GROUP_RULES.join("\n"),
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!defaultLocationId) return;
    setNewGroup((prev) => ({ ...prev, location_id: prev.location_id ?? defaultLocationId }));
  }, [defaultLocationId]);

  const { data: memberGroupIds = [] } = useQuery({
    queryKey: ["user-group-ids", activeProfile?.userId],
    queryFn: () => SocialInteractionsService.getUserGroupIds(activeProfile?.userId),
    enabled: !!activeProfile?.userId && tab === "meus",
    staleTime: 60_000,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["grupos", debouncedSearch, tab, sortBy, territoryFilter, memberGroupIds],
    queryFn: async ({ pageParam }) => {
      if (tab === "meus" && memberGroupIds.length === 0) {
        return { items: [], totalCount: 0, hasMore: false, nextOffset: null };
      }

      return CommunityService.getGroupsPage({
        search: debouncedSearch || undefined,
        territoryFilter,
        offset: pageParam as number,
        limit: GROUPS_PAGE_SIZE,
        groupIds: tab === "meus" ? memberGroupIds : undefined,
        sortBy,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 30_000,
  });

  const rawGroups = useMemo(
    () => ((data?.pages || []).flatMap((page) => page.items) || []) as unknown as Group[],
    [data?.pages],
  );
  const groups = useMemo(() => {
    const items = [...rawGroups];
    if (sortBy === "relevancia" && debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const score = (g: Group) => {
        const n = (g.name || "").toLowerCase();
        let s = 0;
        if (n.startsWith(q)) s += 3;
        else if (n.includes(q)) s += 1;
        s += Math.min((g.members_count || 0) / 50, 2);
        return s;
      };
      return items.sort((a, b) => score(b) - score(a));
    }
    // Para recentes/populares, o backend ja retornou ordenado por pagina.
    return items;
  }, [debouncedSearch, rawGroups, sortBy]);
  const totalCount = data?.pages?.[0]?.totalCount ?? rawGroups.length;
  const hasMore = !!hasNextPage;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateNewGroup = useCallback((updates: Partial<NewGroupData>) => {
    setNewGroup((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newGroup.name) {
      toast.error("Nome obrigatorio");
      return;
    }

    if (!newGroup.location_id && !defaultLocationId) {
      toast.error("Bairro obrigatorio para criar grupo");
      return;
    }

    setCreating(true);
    try {
      const result = await CommunityService.createGroup({
        ...newGroup,
        location_id: newGroup.location_id ?? defaultLocationId,
        rules: newGroup.rules
          ? newGroup.rules.split("\n").map((rule) => rule.trim()).filter(Boolean)
          : DEFAULT_GROUP_RULES,
      });
      if (!result) throw new Error("Erro ao criar grupo");
      toast.success("Grupo criado!");
      setShowCreate(false);
      setNewGroup({
        name: "",
        description: "",
        category: "",
        is_private: false,
        location_id: defaultLocationId,
        join_policy: "open",
        posting_policy: "members",
        member_visibility: "members_count_public",
        media_policy: "manual_download",
        rules: DEFAULT_GROUP_RULES.join("\n"),
      });
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["user-group-ids"] });
    } catch {
      toast.error("Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  }, [defaultLocationId, newGroup, queryClient]);

  const handleJoin = useCallback(async (groupId: string) => {
    if (!activeProfile) {
      toast.error("Faça login para entrar no grupo");
      return;
    }

    const result = await SocialInteractionsService.joinGroup(groupId, activeProfile.userId, "member");
    if (!result.success) {
      toast.error(result.error || "Erro ao entrar no grupo");
      return;
    }

    toast.success("Você entrou no grupo");
    queryClient.invalidateQueries({ queryKey: ["grupos"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["user-group-ids"] });
  }, [activeProfile, queryClient]);

  return {
    groups,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    searchQuery,
    tab,
    showCreate,
    creating,
    newGroup,
    setSearchQuery,
    setTab,
    sortBy,
    setSortBy,
    setShowCreate,
    updateNewGroup,
    handleCreate,
    handleJoin,
  };
}
