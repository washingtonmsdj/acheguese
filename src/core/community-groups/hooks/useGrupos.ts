import { useState, useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityGroupsService } from "@/core/community-groups/services/CommunityGroupsService";
import type { TerritoryFilter } from "@/core/location";
import { useSessionContext } from "@/core/session";
import { SocialGroupInteractionsService } from "@/core/social/services/SocialGroupInteractionsService";
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

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["grupos", debouncedSearch, tab, sortBy, territoryFilter, activeProfile?.id],
    queryFn: async ({ pageParam }) => {
      if (tab === "meus" && !activeProfile) {
        return { items: [], totalCount: 0, hasMore: false, nextOffset: null };
      }

      return CommunityGroupsService.getGroupsPage({
        search: debouncedSearch || undefined,
        territoryFilter,
        offset: pageParam as number,
        limit: GROUPS_PAGE_SIZE,
        onlyMemberGroups: tab === "meus",
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
  const groups = rawGroups;
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

    const locationId = newGroup.location_id ?? defaultLocationId;
    if (!locationId) {
      toast.error("Bairro obrigatorio para criar grupo");
      return;
    }

    setCreating(true);
    try {
      const result = await CommunityGroupsService.createGroup({
        ...newGroup,
        location_id: locationId,
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

    const result = await SocialGroupInteractionsService.joinGroup(groupId);
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
