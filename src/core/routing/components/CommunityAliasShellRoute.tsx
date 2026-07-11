import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { isCommunityStatusPubliclyRenderable } from "@/core/community-experience/constants/statuses";
import { useGroupAvailability } from "@/core/territorial/hooks/useGroupAvailability";
import { ModuleKey } from "@/core/rollout/types";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import {
  resolveCommunityPublicAliasTerritory,
  type CommunityPublicAliasTerritoryResolution,
} from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";
import { TerritorialSEO } from "@/core/routing/seo/TerritorialSEO";
import type { TerritorialLayoutContext } from "./TerritorialLayout";
import { TerritorialNotFound } from "./TerritorialNotFound";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import { buildCommunityPortalUrl } from "@/core/routing/policies";

type AliasShellState =
  | { status: "loading" }
  | { status: "resolved"; resolution: Extract<CommunityPublicAliasTerritoryResolution, { status: "resolved" }> }
  | { status: "not-found"; message: string };

const ALIAS_RESOLVE_TIMEOUT_MS = 10_000;

function withAliasResolveTimeout(
  promise: Promise<CommunityPublicAliasTerritoryResolution>,
): Promise<CommunityPublicAliasTerritoryResolution> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Community alias resolution timeout"));
    }, ALIAS_RESOLVE_TIMEOUT_MS);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function resolveModuleKeyFromAliasPath(pathname: string): ModuleKey {
  const parts = pathname.split("/").filter(Boolean);
  const moduleSlug =
    parts[0] === APP_MODULE_SLUGS.community
      ? parts[2] ?? APP_MODULE_SLUGS.community
      : APP_MODULE_SLUGS.community;

  switch (moduleSlug) {
    case APP_MODULE_SLUGS.business:
      return ModuleKey.BUSINESS;
    case APP_MODULE_SLUGS.services:
      return ModuleKey.SERVICES;
    case APP_MODULE_SLUGS.classifieds:
      return ModuleKey.CLASSIFIEDS;
    case APP_MODULE_SLUGS.gastronomy:
      return ModuleKey.GASTRONOMY;
    case APP_MODULE_SLUGS.education:
      return ModuleKey.BUSINESS;
    case APP_MODULE_SLUGS.events:
      return ModuleKey.EVENTS;
    case APP_MODULE_SLUGS.jobs:
      return ModuleKey.JOBS;
    case APP_MODULE_SLUGS.mobility:
      return ModuleKey.MOBILITY;
    case APP_MODULE_SLUGS.map:
    case APP_MODULE_SLUGS.community:
    default:
      return ModuleKey.COMMUNITY;
  }
}

export function CommunityAliasShellRoute() {
  const location = useLocation();
  const { communitySlug } = useParams<{ communitySlug?: string }>();
  const [state, setState] = useState<AliasShellState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveAlias() {
      if (!communitySlug) {
        setState({
          status: "not-found",
          message: "Informe o alias da comunidade.",
        });
        return;
      }

      let resolution: CommunityPublicAliasTerritoryResolution;
      try {
        resolution = await withAliasResolveTimeout(
          resolveCommunityPublicAliasTerritory(communitySlug),
        );
      } catch {
        if (!cancelled) {
          setState({
            status: "not-found",
            message: "Nao foi possivel resolver esta comunidade agora. Recarregue para tentar novamente.",
          });
        }
        return;
      }

      if (cancelled) return;

      if (resolution.status !== "resolved") {
        setState({
          status: "not-found",
          message: resolution.reason,
        });
        return;
      }

      setState({ status: "resolved", resolution });
    }

    void resolveAlias();

    return () => {
      cancelled = true;
    };
  }, [communitySlug]);

  const resolved = state.status === "resolved" ? state.resolution.resolved : null;
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : "";
  const profileQuery = useCommunityProfile(resolved);
  const groupId = resolved?.kind === "group" ? resolved.group.id : null;
  const currentModuleKey = resolveModuleKeyFromAliasPath(location.pathname);
  const {
    availability,
    active_member_ids,
    result: availabilityResult,
    isLoading: availabilityLoading,
  } = useGroupAvailability(groupId, currentModuleKey);
  const communityBaseUrl = useMemo(() => {
    if (state.status !== "resolved") return "";

    return buildCommunityPortalUrl(state.resolution.alias);
  }, [state]);

  const outletContext = useMemo<TerritorialLayoutContext | null>(() => {
    if (state.status !== "resolved") return null;

    const effectiveAvailability =
      state.resolution.resolved.kind === "group" ? availability : "full";

    return {
      resolved: state.resolution.resolved,
      baseUrl: state.resolution.publicTerritoryPath,
      communityBaseUrl,
      groupAvailability: effectiveAvailability,
      activeMemberIds:
        state.resolution.resolved.kind === "group" ? active_member_ids : [],
    };
  }, [active_member_ids, availability, communityBaseUrl, state]);

  useEffect(() => {
    if (state.status !== "resolved" || !territoryName) return;

    lastTerritoryStore.set({
      name: territoryName,
      baseUrl: communityBaseUrl,
    });
  }, [communityBaseUrl, state, territoryName]);

  if (state.status === "loading") {
    return (
      <PageLoader
        fullScreen
        message="Abrindo comunidade..."
        recoveryAfterMs={9000}
        recoveryTitle="A comunidade esta demorando para abrir"
        recoveryDescription="A rota do portal depende da resolucao do territorio. Recarregue se a pagina nao avancar."
      />
    );
  }

  if (state.status === "not-found" || !outletContext) {
    return (
      <TerritorialNotFound
        message={
          state.status === "not-found"
            ? state.message
            : "A comunidade informada nao corresponde a um territorio ativo."
        }
      />
    );
  }

  const communityStatus = profileQuery.data?.status ?? "active";
  if (!isCommunityStatusPubliclyRenderable(communityStatus)) {
    return (
      <TerritorialNotFound message="Esta comunidade esta indisponivel neste momento." />
    );
  }

  return (
    <>
      <TerritorialSEO
        resolved={outletContext.resolved}
        baseUrl={outletContext.baseUrl}
      />

      {outletContext.resolved.kind === "group" && currentModuleKey ? (
        <>
          {outletContext.groupAvailability === "partial" && availabilityResult ? (
            <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Cobertura parcial: {availabilityResult.active_module_members} de{" "}
                {availabilityResult.total_active_members} bairros disponiveis neste modulo.
              </span>
            </div>
          ) : null}
          {outletContext.groupAvailability === "none" && !availabilityLoading ? (
            <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Este modulo ainda nao esta disponivel neste territorio.</span>
            </div>
          ) : null}
        </>
      ) : null}

      <Outlet context={outletContext} />
    </>
  );
}
