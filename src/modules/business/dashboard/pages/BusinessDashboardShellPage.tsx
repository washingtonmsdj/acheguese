import { useEffect, useMemo, type ComponentType } from "react";
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
  Clock,
  Images,
  MapPin,
  Pencil,
  Package,
  Settings,
  Store,
} from "lucide-react";

import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useResolvedBusinessPublicUrl } from "@/core/business/hooks/useResolvedBusinessPublicUrl";
import {
  businessManagementRoutes,
  getBusinessManagementSectionLabel,
} from "@/core/business/utils/businessManagementRoutes";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import type { ActiveBusinessDashboardContextValue } from "@/modules/business/dashboard/businessDashboardContext";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BusinessDashboardNavigation } from "../components/BusinessDashboardNavigation";

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
    if (!business?.id || !business.slug || !business.geographic_path)
      return null;
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
      label: "Fotos",
      mobileLabel: "Fotos",
      to: businessManagementRoutes.photos(businessId),
      icon: Images,
    },
    {
      label: "Horário de funcionamento",
      mobileLabel: "Horário",
      to: businessManagementRoutes.hours(businessId),
      icon: Clock,
    },
    {
      label: "Localização",
      mobileLabel: "Local",
      to: businessManagementRoutes.location(businessId),
      icon: MapPin,
    },
    {
      label: "Produtos e serviços",
      mobileLabel: "Catálogo",
      to: businessManagementRoutes.catalog(businessId),
      icon: Package,
    },
    {
      label: "Desempenho",
      mobileLabel: "Métricas",
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
      <nav
        aria-label="Caminho da central"
        className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground sm:text-sm"
      >
        <button
          type="button"
          aria-label="Voltar para minhas empresas"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 font-semibold text-foreground hover:text-primary sm:hidden"
          onClick={() => navigate(businessManagementRoutes.list())}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hidden shrink-0 hover:text-foreground sm:inline"
          onClick={() => navigate("/conta")}
        >
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
        <span className="truncate font-medium text-foreground">
          {business.name}
        </span>
        <span className="hidden sm:inline">/</span>
        <span className="hidden shrink-0 sm:inline">{sectionLabel}</span>
      </nav>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <BusinessDashboardNavigation count={navItems.length}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              end={item.to === basePath}
              className={({ isActive }) =>
                [
                  "business-dashboard-nav__item",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20 lg:bg-primary/10 lg:text-primary lg:shadow-none"
                    : "text-foreground hover:bg-muted active:bg-muted",
                ].join(" ")
              }
            >
              <item.icon
                className="h-[18px] w-[18px] shrink-0 sm:h-4 sm:w-4"
                aria-hidden="true"
              />
              <span className="lg:hidden">{item.mobileLabel}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </BusinessDashboardNavigation>

        <div className="min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
