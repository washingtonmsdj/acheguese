import { useEffect, useMemo, type ComponentType } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Building2, Pencil, Settings, Store } from "lucide-react";

import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useResolvedBusinessPublicUrl } from "@/core/business/hooks/useResolvedBusinessPublicUrl";
import {
  businessManagementRoutes,
  getBusinessManagementSectionLabel,
} from "@/core/business/utils/businessManagementRoutes";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import type { ActiveBusinessDashboardContextValue } from "@/modules/business/dashboard/businessDashboardContext";
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
      <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-6 sm:px-6 xl:px-8">
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
      label: "Editar empresa",
      to: businessManagementRoutes.edit(businessId),
      icon: Pencil,
    },
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
    <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6 xl:px-8">
      <nav aria-label="Caminho da central" className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground sm:text-sm">
        <button className="shrink-0 hover:text-foreground" onClick={() => navigate("/conta")}>
          Conta
        </button>
        <span>/</span>
        <button
          className="shrink-0 hover:text-foreground"
          onClick={() => navigate(businessManagementRoutes.list())}
        >
          Empresas
        </button>
        <span>/</span>
        <span className="truncate text-foreground">{business.name}</span>
        <span className="hidden sm:inline">/</span>
        <span className="hidden shrink-0 sm:inline">{sectionLabel}</span>
      </nav>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label="Navegação da empresa" className="min-w-0 self-start rounded-2xl border border-border bg-card p-2 lg:sticky lg:top-4">
          <div className="hidden px-3 pb-3 pt-2 lg:block">
            <p className="text-sm font-bold text-foreground">Central da empresa</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Gerencie sua presença no território.</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto overscroll-x-contain pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === basePath}
                className={({ isActive }) =>
                  [
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium lg:w-full",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
