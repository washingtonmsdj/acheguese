import { useEffect, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CreatePostModal } from "@/core/community-feed/components/CreatePostModal";
import { CommunityPortalGate } from "@/core/community-experience/access";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { LocationStatus } from "@/core/location/types";
import { useAppUrls } from "@/core/routing/hooks";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { Loader2 } from "lucide-react";

export default function NovoPostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appUrls = useAppUrls();
  const { user, isLoading } = useSessionContext();
  const { activeLocation } = useActiveTerritory();
  const resolved = useMemo<ResolvedTerritory>(() => {
    if (
      !activeLocation?.id ||
      activeLocation.status !== LocationStatus.ACTIVE
    ) {
      return null;
    }

    return { kind: "location", location: activeLocation };
  }, [activeLocation]);

  const defaultType = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (
      type === "discussao" ||
      type === "recomendacao" ||
      type === "evento" ||
      type === "enquete"
    ) {
      return type;
    }
    return "discussao";
  }, [location.search]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(appUrls.community.feed, { replace: true });
  };

  // Redireciona para login preservando o retorno para /novo-post
  useEffect(() => {
    if (!isLoading && !user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
    }
  }, [isLoading, user, location.pathname, location.search, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Fallback enquanto o efeito acima navega
    return <Navigate to="/login" replace />;
  }

  if (!resolved) {
    return (
      <section className="mx-auto flex min-h-[22rem] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-xl font-semibold">
            Selecione um territorio para publicar
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A publicacao comunitaria exige um territorio ativo e valido.
          </p>
        </div>
      </section>
    );
  }

  return (
    <CommunityPortalGate resolved={resolved} action="create_post">
      {(communityAccess) => (
        <CreatePostModal
          open
          onClose={handleClose}
          defaultType={defaultType}
          resolvedTerritory={resolved}
          canCreatePost={communityAccess.can.create_post}
          canCreateAlert={communityAccess.can.create_alert}
          canCreateIssue={communityAccess.can.create_issue}
        />
      )}
    </CommunityPortalGate>
  );
}
