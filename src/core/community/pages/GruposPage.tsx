import React, { useMemo, useState } from "react";
import { useGrupos, type GroupSort } from "@/core/community/hooks/useGrupos";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { Hash, Loader2, Lock, MessageSquare, Sparkles, Users } from "lucide-react";
import { GruposHeader } from "@/shared/components/grupos/GruposHeader";
import { GruposSearch } from "@/shared/components/grupos/GruposSearch";
import { GruposTabs } from "@/shared/components/grupos/GruposTabs";
import { GruposList } from "@/shared/components/grupos/GruposList";
import { CreateGroupDialog } from "@/shared/components/grupos/CreateGroupDialog";
import { GROUP_CATEGORIES } from "@/shared/constants/groupTaxonomy";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";

const SORT_OPTIONS: Array<{ id: GroupSort; label: string }> = [
  { id: "recentes", label: "Recentes" },
  { id: "populares", label: "Populares" },
  { id: "relevancia", label: "Relevância" },
];

export default function GruposPage() {
  const { homeDistrict } = useUserTerritory();
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const territoryFilter = useMemo(
    () => homeDistrict
      ? { scope: "location" as const, location_id: homeDistrict.id }
      : { scope: "none" as const },
    [homeDistrict],
  );
  const {
    groups,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    searchQuery,
    tab,
    sortBy,
    setSortBy,
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
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading: isLoadingMore,
    onLoadMore: loadMore,
  });
  const myGroupsCount = groups.filter((group) => group.is_member).length;
  const openGroupsCount = groups.filter((group) => !group.is_private).length;
  const postsCount = groups.reduce((sum, group) => sum + (group.posts_count ?? 0), 0);
  const visibleGroups = useMemo(
    () => categoryFilter === "todos"
      ? groups
      : groups.filter((group) => (group.category || "geral") === categoryFilter),
    [categoryFilter, groups],
  );
  const categoryOptions = useMemo(() => {
    const used = new Set(groups.map((group) => group.category || "geral"));
    return GROUP_CATEGORIES.filter((category) => used.has(category.id)).slice(0, 12);
  }, [groups]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b1417] text-white">
      <GruposHeader onCreateClick={() => setShowCreate(true)} />

      <div className="mx-auto w-full max-w-6xl min-w-0 space-y-4 px-3 py-4 sm:px-4 md:space-y-5 md:px-6 md:py-5">
        <section className="overflow-hidden rounded-2xl border border-teal-400/15 bg-[radial-gradient(1200px_220px_at_0%_0%,rgba(45,212,191,0.14),transparent),#0f191d] p-3.5 shadow-2xl shadow-black/20 md:p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/25 bg-teal-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-200">
                <Sparkles className="h-3 w-3" />
                Comunidade ativa
              </div>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl">
                Grupos do bairro, com foco no que importa
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/70 sm:text-sm">
                Entre em conversas locais por tema e mantenha tudo organizado: moradores, serviços,
                comércio e suporte da comunidade em um só lugar.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("meus")}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/90 hover:bg-white/[0.1]"
                >
                  Ver meus grupos
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="rounded-full border border-teal-300/40 bg-teal-400/15 px-3 py-1.5 text-[11px] font-semibold text-teal-100 hover:bg-teal-400/25"
                >
                  Criar grupo
                </button>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2 lg:w-[380px]">
              {[
                { label: "grupos", value: totalCount, icon: Hash },
                { label: "meus", value: myGroupsCount, icon: Users },
                { label: "posts", value: postsCount, icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-2.5 sm:p-3">
                  <Icon className="mb-1.5 h-3.5 w-3.5 text-teal-200 sm:mb-2 sm:h-4 sm:w-4" />
                  <p className="truncate text-base font-semibold sm:text-lg">{value}</p>
                  <p className="truncate text-[10px] uppercase tracking-wide text-white/55 sm:text-[11px]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <main className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 md:p-4">
              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
                <GruposSearch
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
                <GruposTabs
                  tab={tab}
                  onTabChange={setTab}
                  groupsCount={groups.length}
                  myGroupsCount={myGroupsCount}
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs ${
                      sortBy === opt.id
                        ? "border-teal-300 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 md:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-white sm:text-sm">Categorias</h2>
                  <span className="text-xs text-white/40">{visibleGroups.length} visiveis</span>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2">
                  <div className="flex items-center justify-between gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-white/60">
                      <Lock className="h-3.5 w-3.5 text-amber-300" />
                      abertos
                    </span>
                    <span className="font-semibold text-white">{openGroupsCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-white/60">
                      <Users className="h-3.5 w-3.5 text-teal-300" />
                      participando
                    </span>
                    <span className="font-semibold text-white">{myGroupsCount}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("todos")}
                    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                    categoryFilter === "todos"
                      ? "border-teal-300 bg-teal-400/15 text-teal-100"
                      : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {categoryOptions.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:gap-2 sm:px-3 sm:text-xs ${
                      categoryFilter === category.id
                        ? "border-teal-300 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                    }`}
                  >
                    <span className="text-[10px] font-bold">{category.token}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <GruposList
              groups={visibleGroups.map((group) => ({
                ...group,
                members_count: group.members_count ?? 0,
                posts_count: group.posts_count ?? 0,
              }))}
              isLoading={isLoading}
              tab={tab}
              onJoin={(_e, groupId) => handleJoin(groupId)}
              onTabChange={setTab}
            />
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3">
                {isLoadingMore ? <Loader2 className="h-5 w-5 animate-spin text-teal-400" /> : null}
              </div>
            )}
          </main>
        </section>
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
