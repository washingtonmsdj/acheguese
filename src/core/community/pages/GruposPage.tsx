import React from "react";
import { useGrupos } from "@/core/community/hooks/useGrupos";
import { GruposHeader } from "@/shared/components/grupos/GruposHeader";
import { GruposSearch } from "@/shared/components/grupos/GruposSearch";
import { GruposTabs } from "@/shared/components/grupos/GruposTabs";
import { GruposList } from "@/shared/components/grupos/GruposList";
import { CreateGroupDialog } from "@/shared/components/grupos/CreateGroupDialog";

export default function GruposPage() {
  const {
    // Data
    groups,
    isLoading,

    // State
    searchQuery,
    tab,
    showCreate,
    creating,
    newGroup,

    // Actions
    setSearchQuery,
    setTab,
    setShowCreate,
    updateNewGroup,
    handleCreate,
    handleJoin,
  } = useGrupos();

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

