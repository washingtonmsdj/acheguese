import { useEffect, type ComponentType } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CreditCard,
  Link as LinkIcon,
  Settings,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useBusinessSubscription } from "@/core/billing/hooks/useBusinessSubscription";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
import { useGastronomyStatus } from "@/core/verticals/gastronomy/hooks/useGastronomyStatus";
import { isEligibleForVertical } from "@/core/verticals/config";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import {
  businessManagementRoutes,
  getBusinessManagementSectionLabel,
} from "@/core/business/utils/businessManagementRoutes";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import type { BusinessDashboardContextValue } from "@/modules/business/dashboard/businessDashboardContext";

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

export default function BusinessDashboardShellPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setModuleContext } = useMultiProfileContext();

  useEffect(() => {
    setModuleContext("business");
    return () => setModuleContext(null);
  }, [setModuleContext]);

  const { business, isLoading: loadingBusiness } = useBusiness(businessId || "");
  const { planTier, entitlements, isLoading: loadingSubscription } =
    useBusinessSubscription(businessId);
  const { status: gastronomyStatus, isLoading: loadingGastronomy } =
    useGastronomyStatus(businessId || "", true);
  const { permissions, loading: loadingAccess } = useDashboardAccess(
    business?.profile_id,
  );

  useEffect(() => {
    if (!loadingAccess && business && !permissions.hasAccess) {
      toast.error("Voce nao tem permissao para gerenciar esta empresa.");
      navigate("/central/empresas", { replace: true });
    }
  }, [business, loadingAccess, navigate, permissions.hasAccess]);

  if (loadingBusiness || loadingSubscription || loadingAccess || loadingGastronomy) {
    return (
      <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!businessId || !business || !permissions.hasAccess) {
    return null;
  }

  const isGastronomyEligible = isEligibleForVertical(business.category, "gastronomy");
  const isGastronomyActive = gastronomyStatus === "active";

  const publicUrl =
    business.slug && business.geographic_path
      ? BusinessUrlService.getCanonicalUrl({
          id: business.id,
          slug: business.slug,
          is_premium: business.is_premium,
          geographic_path: business.geographic_path,
        })
      : null;
  const premiumUrl =
    business.slug && entitlements.canUseShortPremiumLink
      ? `/p/${business.slug}`
      : null;

  const basePath = businessManagementRoutes.overview(businessId);
  const navItems: NavItem[] = [
    { label: "Visao geral", to: basePath, icon: Store },
    { label: "Dados da empresa", to: businessManagementRoutes.dados(businessId), icon: Building2 },
    ...(isGastronomyEligible
      ? [
          {
            label: "Gastronomia",
            to: businessManagementRoutes.gastronomia(businessId),
            icon: UtensilsCrossed,
          },
        ]
      : []),
    { label: "Planos", to: businessManagementRoutes.planos(businessId), icon: CreditCard },
    { label: "Link premium", to: businessManagementRoutes.linkPremium(businessId), icon: LinkIcon },
    { label: "Analytics", to: businessManagementRoutes.analytics(businessId), icon: BarChart3 },
    { label: "Configuracoes", to: businessManagementRoutes.configuracoes(businessId), icon: Settings },
  ];

  const sectionLabel = getBusinessManagementSectionLabel(location.pathname);

  const outletContext: BusinessDashboardContextValue = {
    businessId,
    business,
    planTier,
    entitlements,
    isGastronomyEligible,
    isGastronomyActive,
    publicUrl,
    premiumUrl,
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => navigate("/perfil")}>
          Perfil
        </button>
        <span>/</span>
        <button
          className="hover:text-foreground"
          onClick={() => navigate("/central/empresas")}
        >
          Empresas
        </button>
        <span>/</span>
        <span className="text-foreground">{business.name}</span>
        <span>/</span>
        <span>{sectionLabel}</span>
      </div>

      <Card className="border">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
                <Badge variant="secondary">{planTier.toUpperCase()}</Badge>
                <Badge variant="outline">{business.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{business.category}</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/central/empresas")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para empresas
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {publicUrl && (
              <Button variant="outline" size="sm" onClick={() => navigate(publicUrl)}>
                Pagina publica
              </Button>
            )}
            {premiumUrl && (
              <Button variant="outline" size="sm" onClick={() => navigate(premiumUrl)}>
                Mini-site premium
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(businessManagementRoutes.planos(businessId))}>
              Ver planos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="space-y-2 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === basePath}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <div className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Verticais futuras: Saude, Educacao, Loja e Servicos.
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
