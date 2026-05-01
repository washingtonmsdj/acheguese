import React, { useMemo } from "react";
import { useGrupos } from "@/core/community/hooks/useGrupos";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { GruposHeader } from "@/shared/components/grupos/GruposHeader";
import { GruposSearch } from "@/shared/components/grupos/GruposSearch";
import { GruposTabs } from "@/shared/components/grupos/GruposTabs";
import { GruposList } from "@/shared/components/grupos/GruposList";
import { CreateGroupDialog } from "@/shared/components/grupos/CreateGroupDialog";

export default function GruposPage() {
  const { homeDistrict } = useUserTerritory();
  const territoryFilter = useMemo(
    () => homeDistrict
      ? { scope: "location" as const, location_id: homeDistrict.id }
      : { scope: "none" as const },
    [homeDistrict],
  );
  const {
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
  } = useGrupos({
    territoryFilter,
    defaultLocationId: homeDistrict?.id,
  });

  return (
    <div className="bg-background">
      <GruposHeader onCreateClick={() => setShowCreate(true)} />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <GruposSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <GruposTabs
          tab={tab as "todos" | "meus"}
          onTabChange={(t) => setTab(t)}
          groupsCount={groups.length}
        />

        <GruposList
          groups={groups}
          isLoading={isLoading}
          tab={tab as "todos" | "meus"}
          onJoin={(_e, groupId) => handleJoin(groupId)}
          onTabChange={(t) => setTab(t)}
        />
      </div>

      <CreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        newGroup={newGroup}
        onUpdateGroup={updateNewGroup}
        creating={creating}
        onSubmit={handleCreate}
      />
    </div>
  );
}
