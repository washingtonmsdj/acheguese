import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Plus, Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useAppUrls } from "@/core/routing/hooks";
import { useRecomendacoes } from "@/core/community/hooks/useRecomendacoes";
import { CategoryFilters } from "@/shared/components/recomendacoes/CategoryFilters";
import { QuestionsList } from "@/core/community/components/QuestionsList";
import { CommunityPortalGate, useCommunityAccess } from "@/core/community-experience/access";
import type { TerritorialLayoutContext } from "@/core/routing/components/TerritorialLayout";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { resolveCommunityRouteTerritoryFilter } from "@/core/community-experience/utils/communityRouteTerritory";
import type { TerritoryFilter } from "@/core/location";

export default function RecomendacoesPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const territorialContext = useOutletContext<TerritorialLayoutContext | null>() ?? null;
  const { homeDistrict, homeCity } = useUserTerritory();
  const resolved = useMemo(
    () =>
      territorialContext?.resolved ??
      (homeDistrict
        ? ({ kind: "location", location: homeDistrict } as const)
        : homeCity
          ? ({ kind: "location", location: homeCity } as const)
          : null),
    [homeCity, homeDistrict, territorialContext?.resolved],
  );
  const activeMemberIds = useMemo(
    () => territorialContext?.activeMemberIds ?? [],
    [territorialContext?.activeMemberIds],
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const communityAccess = useCommunityAccess({
    resolved,
    activeMemberIds,
  });
  const territoryFilter = useMemo<TerritoryFilter>(
    () =>
      resolveCommunityRouteTerritoryFilter(
        resolved,
        activeMemberIds,
      ),
    [activeMemberIds, resolved],
  );

  const {
    questions,
    loading,
    initialLoading,
    sentinelRef,
    isError,
    refetch,
  } = useRecomendacoes({
    filter,
    search,
    territoryFilter,
  });

  const handleAskRecommendation = () => {
    if (!communityAccess.can.create_post) {
      toast.info("Perguntar na comunidade exige participacao ativa nesta comunidade.");
      return;
    }

    navigate(appUrls.community.newRecommendation);
  };

  if (communityAccess.isLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!communityAccess.can.view_member_feed) {
    return (
      <div className="min-h-screen bg-[#12181B] text-white">
        <CommunityPortalGate
          resolved={resolved}
          activeMemberIds={activeMemberIds}
          action="view_member_feed"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold font-display">Perguntar ao Bairro</h1>
            <p className="text-sm text-muted-foreground">
              Peca recomendacoes da comunidade
            </p>
          </div>
          <Button size="sm" onClick={handleAskRecommendation}>
            <Plus className="h-4 w-4 mr-1" /> Perguntar
          </Button>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perguntas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <CategoryFilters filter={filter} onFilterChange={setFilter} />

      {isError ? (
        <div className="mx-4 my-6 border border-border bg-card p-4 text-center" role="alert">
          <p className="text-sm text-muted-foreground">
            Nao foi possivel carregar as perguntas.
          </p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <QuestionsList
          questions={questions}
          loading={loading}
          initialLoading={initialLoading}
          sentinelRef={sentinelRef}
        />
      )}
    </div>
  );
}
