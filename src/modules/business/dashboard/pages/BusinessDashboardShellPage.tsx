import { useEffect, useMemo, type ComponentType } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, BarChart3, Building2, Pencil, Settings, Store } from "lucide-react";

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
  mobileLabel: string;
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
    { label: "Visão geral", mobileLabel: "Visão", to: basePath, icon: Store },
    {
      label: "Editar empresa",
      mobileLabel: "Editar",
      to: businessManagementRoutes.edit(businessId),
      icon: Pencil,
    },
    {
      label: "Dados da empresa",
      mobileLabel: "Dados",
      to: businessManagementRoutes.dados(businessId),
      icon: Building2,
    },
    {
      label: "Desempenho",
      mobileLabel: "Desempenho",
      to: businessManagementRoutes.analytics(businessId),
      icon: BarChart3,
    },
    {
      label: "Configurações",
      mobileLabel: "Ajustes",
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
        <button
          type="button"
          aria-label="Voltar para minhas empresas"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 font-semibold text-foreground hover:text-primary sm:hidden"
          onClick={() => navigate(businessManagementRoutes.list())}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className="hidden shrink-0 hover:text-foreground sm:inline" onClick={() => navigate("/conta")}>
          Conta
        </button>
        <span className="hidden sm:inline">/</span>
        <button
          type="button"
          className="hidden shrink-0 hover:text-foreground sm:inline"
          onClick={() => navigate(businessManagementRoutes.list())}
        >
          Empresas
        </button>
        <span className="hidden sm:inline">/</span>
        <span className="truncate font-medium text-foreground">{business.name}</span>
        <span className="hidden sm:inline">/</span>
        <span className="hidden shrink-0 sm:inline">{sectionLabel}</span>
      </nav>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label="Navegação da empresa" className="min-w-0 self-start rounded-2xl border border-border bg-card p-2 lg:sticky lg:top-4">
          <div className="hidden px-3 pb-3 pt-2 lg:block">
            <p className="text-sm font-bold text-foreground">Central da empresa</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Gerencie sua presença no território.</p>
          </div>
          <nav className="flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === basePath}
                className={({ isActive }) =>
                  [
                    "flex min-h-14 w-[5.35rem] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold sm:min-h-11 sm:w-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-sm lg:w-full lg:justify-start",
                    isActive
                      ? "bg-primary/10 text-primary ring-1 ring-primary/15"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">{item.mobileLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
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
