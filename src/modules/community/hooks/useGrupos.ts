import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityService } from "@/core/community/services/CommunityService"; // ✅ LOTE 7

export interface NewGroupData {
  name: string;
  description: string;
  category: string;
  is_private: boolean;
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
}

export function useGrupos() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupData>({
    name: "",
    description: "",
    category: "",
    is_private: false,
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["grupos", searchQuery, tab],
    queryFn: async () => {
      // ✅ LOTE 7 - CommunityService.getGroups
      const data = await CommunityService.getGroups(searchQuery || undefined);
      return (data || []) as Group[];
    },
  });

  const updateNewGroup = useCallback((updates: Partial<NewGroupData>) => {
    setNewGroup((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newGroup.name) {
      toast.error("Nome obrigatório");
      return;
    }
    setCreating(true);
    try {
      // ✅ LOTE 7 - CommunityService.createGroup
      const result = await CommunityService.createGroup(newGroup);
      if (!result) throw new Error("Erro ao criar grupo");
      toast.success("Grupo criado!");
      setShowCreate(false);
      setNewGroup({
        name: "",
        description: "",
        category: "",
        is_private: false,
      });
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
    } catch {
      toast.error("Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  }, [newGroup, queryClient]);

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
