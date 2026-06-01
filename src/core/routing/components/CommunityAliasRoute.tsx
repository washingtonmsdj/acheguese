import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";
import { TerritorialNotFound } from "./TerritorialNotFound";

type AliasRouteState =
  | { status: "loading" }
  | { status: "resolved"; targetPath: string }
  | { status: "not-found"; message: string };

function appendSuffix(basePath: string, suffix: string | undefined): string {
  const cleanSuffix = suffix?.replace(/^\/+|\/+$/g, "") ?? "";
  return cleanSuffix ? `${basePath}/${cleanSuffix}` : basePath;
}

function extractAliasSuffix(pathname: string): string {
  return pathname
    .split("/")
    .filter(Boolean)
    .slice(2)
    .join("/");
}

export function CommunityAliasRoute() {
  const location = useLocation();
  const params = useParams<{ communitySlug?: string }>();
  const communitySlug = params.communitySlug;
  const suffix = extractAliasSuffix(location.pathname);
  const [state, setState] = useState<AliasRouteState>({ status: "loading" });

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

      const resolution = await CommunityPublicAliasService.resolve(communitySlug);
      if (cancelled) return;

      if (resolution.status !== "resolved") {
        setState({
          status: "not-found",
          message:
            resolution.reason ??
            "A URL curta informada nao corresponde a uma comunidade ativa.",
        });
        return;
      }

      setState({
        status: "resolved",
        targetPath: appendSuffix(`/${resolution.alias}`, suffix),
      });
    }

    void resolveAlias();

    return () => {
      cancelled = true;
    };
  }, [communitySlug, suffix]);

  if (state.status === "loading") {
    return <PageLoader fullScreen message="Abrindo comunidade..." />;
  }

  if (state.status === "not-found") {
    return <TerritorialNotFound message={state.message} />;
  }

  return (
    <Navigate
      to={`${state.targetPath}${location.search}${location.hash}`}
      replace
    />
  );
}
