import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, MapPin, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { useAppUrls } from "@/core/routing/hooks";
import { withQueryParams } from "@/core/landing/utils/landingPresentation";
import { useCommunityAccess } from "./useCommunityAccess";
import {
  isCommunityAccessRouteTarget,
  type CommunityAccessDecision,
  type CommunityAccessTarget,
  type CommunityAction,
} from "./CommunityAccessPolicy";

export interface CommunityPortalGateProps {
  readonly resolved: CommunityAccessTarget;
  readonly activeMemberIds?: readonly string[];
  readonly action: CommunityAction;
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
}

function getGateCopy(reason: CommunityAccessDecision["reason"]) {
  switch (reason) {
    case "visitor":
      return {
        icon: UserPlus,
        title: "Entre para participar da comunidade",
        description:
          "A leitura publica continua disponivel, mas publicar, comentar e participar dos grupos exige login.",
      };
    case "missing_profile":
      return {
        icon: UserPlus,
        title: "Crie ou selecione um perfil",
        description:
          "A comunidade usa o perfil ativo para autoria, moderacao e auditoria das acoes.",
      };
    case "missing_residence":
    case "out_of_territory":
      return {
        icon: MapPin,
        title: "Confirme sua residencia neste territorio",
        description:
          "Acoes comunitarias sao locais. Cadastre um endereco do bairro ou area correspondente para participar.",
      };
    case "unverified_residence":
      return {
        icon: ShieldCheck,
        title: "Verifique sua residencia",
        description:
          "Voce ja pode acompanhar a comunidade, mas publicar e participar dos grupos exige residencia verificada.",
      };
    case "rollout_blocked":
      return {
        icon: Lock,
        title: "Comunidade ainda nao liberada",
        description:
          "Este territorio ainda nao esta habilitado para acoes comunitarias. A leitura publica permanece disponivel.",
      };
    case "allowed":
    default:
      return {
        icon: Lock,
        title: "Acesso comunitario indisponivel",
        description: "Nao foi possivel liberar esta acao com o contexto atual.",
      };
  }
}

export function CommunityPortalGate({
  resolved,
  activeMemberIds = [],
  action,
  children,
  fallback,
}: CommunityPortalGateProps) {
  const location = useLocation();
  const routeResolved = isCommunityAccessRouteTarget(resolved) ? resolved : null;
  const appUrls = useAppUrls(routeResolved);
  const access = useCommunityAccess({ resolved, activeMemberIds });

  if (access.isLoading) {
    return <PageLoader message="Verificando acesso comunitario..." />;
  }

  if (access.can[action]) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const copy = getGateCopy(access.reason);
  const Icon = copy.icon;
  const redirect = `${location.pathname}${location.search}`;
  const loginHref = withQueryParams(appUrls.auth.login, { redirect });
  const actionHref =
    access.primaryAction === "login"
      ? loginHref
      : access.primaryAction === "create_profile"
        ? appUrls.profile.manage
        : access.primaryAction === "add_address" || access.primaryAction === "verify_address"
          ? appUrls.profile.addresses
          : appUrls.community.feed;
  const actionLabel =
    access.primaryAction === "login"
      ? "Entrar"
      : access.primaryAction === "create_profile"
        ? "Selecionar perfil"
        : access.primaryAction === "add_address"
          ? "Cadastrar endereco"
          : access.primaryAction === "verify_address"
            ? "Verificar residencia"
            : "Acompanhar lancamento";

  return (
    <section className="mx-auto flex min-h-[22rem] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <Icon className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
        <Button asChild className="mt-5 w-full">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
