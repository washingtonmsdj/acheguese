import { useMemo, useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useLocationContext } from "@/core/location";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useSessionContext } from "@/core/session";
import { buildCommunityTerritoryPresentation } from "@/core/community-issues/utils/communityTerritoryPresentation";
import { CommunityPortalGate, useCommunityAccess } from "@/core/community-experience/access";
import {
  resolveCommunityRouteDefaultLocationId,
  resolveCommunityRouteTerritoryFilter,
} from "@/core/community-experience/utils/communityRouteTerritory";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { CreateIssueModal } from "@/core/community-issues/components/CreateIssueModal";
import { IssueCard } from "@/core/community-issues/components/IssueCard";
import { IssueCardSkeleton } from "@/core/community-issues/components/IssueCardSkeleton";
import { ISSUE_STATUS_LABELS } from "@/core/community-issues/config/issueConfig";
import type { IssueStatus } from "@/core/community-issues/domain/types";
import { useIssues } from "@/core/community-issues/hooks/useIssues";

interface ProblemasPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: readonly string[];
}

const EMPTY_ACTIVE_MEMBER_IDS: readonly string[] = [];

export default function ProblemasPage({
  resolved,
  activeMemberIds = EMPTY_ACTIVE_MEMBER_IDS,
}: ProblemasPageProps) {
  const { activeProfile: profile } = useSessionContext();
  const { activeLocation } = useLocationContext();
  const { homeDistrict, homeCity } = useUserTerritory();
  const accessTarget = useMemo(
    () =>
      resolved ??
      (homeDistrict
        ? ({ kind: "location", location: homeDistrict } as const)
        : homeCity
          ? ({ kind: "location", location: homeCity } as const)
          : null),
    [homeCity, homeDistrict, resolved],
  );
  const communityAccess = useCommunityAccess({
    resolved: accessTarget,
    activeMemberIds,
  });
  const territoryFilter = useMemo(
    () => resolveCommunityRouteTerritoryFilter(accessTarget, activeMemberIds),
    [accessTarget, activeMemberIds],
  );
  const issueLocationId = useMemo(
    () => resolveCommunityRouteDefaultLocationId(accessTarget, activeMemberIds),
    [accessTarget, activeMemberIds],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | undefined>("aberto");

  const resolvedLocation =
    resolved?.kind === "location"
      ? resolved.location
      : resolved?.kind === "group"
        ? resolved.group.members.at(0) ?? null
        : null;
  const routeTerritoryPresentation = buildCommunityTerritoryPresentation({
    resolvedLocation,
    activeLocation,
    profile,
  });
  const territoryPresentation = !resolved && (homeDistrict || homeCity)
    ? {
      city: homeCity?.name ?? profile?.city ?? "",
      neighborhood: homeDistrict?.name ?? "",
      locationId: homeDistrict?.id ?? homeCity?.id ?? "",
    }
    : routeTerritoryPresentation;

  const { data: issues = [], isLoading } = useIssues({
    territoryFilter,
    status: filterStatus,
    limit: 30,
  });

  const handleOpenCreateIssue = () => {
    if (!communityAccess.can.create_issue) {
      toast.info("Reportar problemas exige participacao ativa e residencia verificada neste territorio.");
      return;
    }

    if (!issueLocationId) {
      toast.info("Selecione um territorio valido para reportar problemas.");
      return;
    }

    setModalOpen(true);
  };

  if (communityAccess.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!communityAccess.can.view_member_feed) {
    return (
      <div className="min-h-screen bg-background">
        <CommunityPortalGate
          resolved={accessTarget}
          activeMemberIds={activeMemberIds}
          action="view_member_feed"
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background" role="main">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-warning" aria-hidden />
              <h1 className="text-lg font-semibold text-foreground">Problemas urbanos</h1>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreateIssue}
              disabled={!profile || !issueLocationId}
              aria-label="Reportar novo problema"
            >
              Reportar
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por status">
            {([undefined, "aberto", "em_analise", "em_andamento", "resolvido"] as const).map(
              (status) => (
                <button
                  key={status ?? "todos"}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                  aria-pressed={filterStatus === status}
                >
                  {status ? getRecordValue(ISSUE_STATUS_LABELS, status) ?? status : "Todos"}
                </button>
              ),
            )}
          </div>

          <div className="space-y-4" role="feed" aria-label="Lista de problemas urbanos">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <IssueCardSkeleton key={index} />)
            ) : territoryFilter.scope === "none" ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Territorio nao resolvido para carregar problemas.</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum problema encontrado nesta regiao.</p>
              </div>
            ) : (
              issues.map((issue) => <IssueCard key={issue.id} issue={issue} profileId={profile?.id} />)
            )}
          </div>
        </div>

        <CreateIssueModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          city={territoryPresentation.city}
          neighborhood={territoryPresentation.neighborhood}
          locationId={issueLocationId}
          canCreate={communityAccess.can.create_issue}
          blockedMessage="Reportar problemas exige participacao ativa e residencia verificada neste territorio."
        />
      </div>
    </TooltipProvider>
  );
}
