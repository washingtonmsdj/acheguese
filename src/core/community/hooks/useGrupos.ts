import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityService } from "@/core/community/services/CommunityService";
import type { TerritoryFilter } from "@/core/location";

export interface NewGroupData {
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  location_id?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_at: string;
  is_member: boolean;
  is_private: boolean;
  location_id?: string | null;
}

interface UseGruposOptions {
  territoryFilter?: TerritoryFilter;
  defaultLocationId?: string;
}

export function useGrupos(options: UseGruposOptions = {}) {
  const queryClient = useQueryClient();
  const { territoryFilter, defaultLocationId } = options;
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupData>({
    name: "",
    description: "",
    category: "",
    is_private: false,
    location_id: defaultLocationId,
  });

  useEffect(() => {
    if (!defaultLocationId) return;
    setNewGroup((prev) => ({ ...prev, location_id: prev.location_id ?? defaultLocationId }));
  }, [defaultLocationId]);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["grupos", searchQuery, tab, territoryFilter],
    queryFn: async () => {
      const data = await CommunityService.getGroups(searchQuery || undefined, territoryFilter);
      return (data || []) as Group[];
    },
  });

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
      });
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
    } catch {
      toast.error("Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  }, [defaultLocationId, newGroup, queryClient]);

  const handleJoin = useCallback(async (_groupId: string) => {
    toast.info("Funcionalidade em desenvolvimento");
  }, []);

  return {
    groups,
    isLoading,
    searchQuery,
    tab,
    showCreate,
    creating,
    newGroup,
    setSearchQuery,
    setTab,
    setShowCreate,
    updateNewGroup,
    handleCreate,
    handleJoin,
  };
}
