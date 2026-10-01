import { useEffect, useMemo } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
import { ActiveProfileIdentity } from "@/shared/components/ActiveProfileIdentity";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import type { BusinessManagementNavigationItem } from "../businessManagementNavigation";
import { BusinessManagementIdentity } from "../components/BusinessManagementIdentity";

export default function BusinessDashboardShellPage({ navigationItems }: {
  navigationItems: readonly BusinessManagementNavigationItem[];
}) {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setModuleContext } = useMultiProfileContext();
  const { activeProfile } = useSessionContext();

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
        <Skeleton className="h-8 w-full max-w-80" />
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
  const navItems = navigationItems.map((item) => ({
    ...item, to: item.buildRoute(businessId),
  }));

  const sectionLabel = getBusinessManagementSectionLabel(location.pathname);

  const outletContext: ActiveBusinessDashboardContextValue = {
    businessId,
    business,
    publicUrl,
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-3 px-4 py-3 sm:space-y-4 sm:px-6 sm:py-5 xl:px-8">
      {activeProfile ? <ActiveProfileIdentity profile={activeProfile} /> : null}
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
          onClick={() => navigate("/central")}
        >
          Central
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

      <div className="business-management-workspace">
        <div className="business-management-workspace__identity"><BusinessManagementIdentity business={business} publicUrl={publicUrl} /></div>
        <BusinessDashboardNavigation count={navItems.length} sectionLabel={sectionLabel}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              end={item.to === basePath}
              className="business-dashboard-nav__item"
            >
              <item.icon
                className="h-[18px] w-[18px] shrink-0 sm:h-4 sm:w-4"
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </BusinessDashboardNavigation>

        <div className="business-management-workspace__content">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
