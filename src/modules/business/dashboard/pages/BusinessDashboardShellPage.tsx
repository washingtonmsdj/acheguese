import { useEffect, useMemo, type ComponentType } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Building2, Settings, Store } from "lucide-react";

import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useResolvedBusinessPublicUrl } from "@/core/business/hooks/useResolvedBusinessPublicUrl";
import {
  businessManagementRoutes,
  getBusinessManagementSectionLabel,
} from "@/core/business/utils/businessManagementRoutes";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import type { ActiveBusinessDashboardContextValue } from "@/modules/business/dashboard/businessDashboardContext";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

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

  const { business, isLoading } = useBusiness(businessId || "");

  const publicUrlContext = useMemo(() => {
    if (!business?.id || !business.slug || !business.geographic_path) return null;
    return {
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    };
  }, [
    business?.geographic_path,
    business?.id,
    business?.is_premium,
    business?.slug,
  ]);
  const { url: publicUrl } = useResolvedBusinessPublicUrl(publicUrlContext);

  if (isLoading) {
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

  if (!businessId || !business) {
    return null;
  }

  const basePath = businessManagementRoutes.overview(businessId);
  const navItems: NavItem[] = [
    { label: "Visão geral", to: basePath, icon: Store },
    {
      label: "Dados da empresa",
      to: businessManagementRoutes.dados(businessId),
      icon: Building2,
    },
    {
      label: "Configurações",
      to: businessManagementRoutes.configuracoes(businessId),
      icon: Settings,
    },
  ];

  const sectionLabel = getBusinessManagementSectionLabel(location.pathname);

  const outletContext: ActiveBusinessDashboardContextValue = {
    businessId,
    business,
    publicUrl,
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => navigate("/conta")}>
          Conta
        </button>
        <span>/</span>
        <button
          className="hover:text-foreground"
          onClick={() => navigate(businessManagementRoutes.list())}
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
                <h1 className="text-2xl font-semibold text-foreground">
                  {business.name}
                </h1>
                <Badge variant="outline">{business.status}</Badge>
              </div>
              <p className="text-sm capitalize text-muted-foreground">
                {business.category}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(businessManagementRoutes.list())}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para empresas
            </Button>
          </div>
          {publicUrl ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(publicUrl)}
              >
                Página pública
              </Button>
            </div>
          ) : null}
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
          </CardContent>
        </Card>

        <div className="min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
