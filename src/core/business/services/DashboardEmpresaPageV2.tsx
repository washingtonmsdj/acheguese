import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "sonner";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
import { useBusiness } from "@/core/business/hooks/useBusiness";
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useDashboardTabs } from "@/core/business/hooks/useDashboardTabs";
import { DashboardBreadcrumb } from "@/shared/components/dashboard/DashboardBreadcrumb";
import { DashboardHeader } from "@/shared/components/dashboard/DashboardHeader";
import {
  DashboardTabs,
  TabPanel,
  GASTRONOMY_TAB,
} from "@/shared/components/dashboard/DashboardTabs";
import { SettingsTab } from "@/core/business/components/SettingsTab";
import EmpresaDashboardTab from '@/core/business/components/EmpresaDashboardTab';
import AnalyticsDashboard from '@/core/business/components/AnalyticsDashboard';
import CouponManager from '@/core/business/components/CouponManager';
import SubscriptionPlans from '@/core/business/components/SubscriptionPlans';
import { NetworkTab } from '@/core/business';
import { QrCodeWidget } from '@/core/qr';
import type { PlanType } from "@/shared/types/subscription";
import { SUBSCRIPTION_PLAN } from "@/shared/types/constants";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import type { BusinessData } from "@/shared/types/dashboard";

// Vertical gastronomia — importado do módulo gastronomy, orquestrado aqui na camada app/shell
import { isEligibleForVertical } from '@/core/verticals/config';
import { useGastronomyStatus } from '@/core/gastronomy/hooks/useGastronomyStatus';
import { GastronomyVerticalCTA } from '@/core/gastronomy/components/GastronomyVerticalCTA';
import GastronomySetupPage from '@/core/gastronomy/pages/GastronomySetupPage';

export default function DashboardEmpresaPageV2() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const [currentPlan, setCurrentPlan] = useState<PlanType>(SUBSCRIPTION_PLAN.BASICO);
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();

  useEffect(() => {
    setModuleContext('business');
    return () => setModuleContext(null);
  }, [setModuleContext]);

  const { permissions, loading: accessLoading } = useDashboardAccess(profileId);
  const { activeTab, setActiveTab } = useDashboardTabs();
  const { business, isLoading: dataLoading } = useBusiness(profileId || "");

  const dashboardBusiness: BusinessData | null = business
    ? { id: business.id, name: business.name, logo: business.logo_url || "", category: business.category, slug: business.slug || "" }
    : null;

  // Vertical gastronomia
  const isGastronomyEligible = business ? isEligibleForVertical(business.category, 'gastronomy') : false;
  const { status: gastronomyStatus } = useGastronomyStatus(business?.id ?? '', isGastronomyEligible);
  const extraTabs = isGastronomyEligible ? [GASTRONOMY_TAB] : [];

  useEffect(() => {
    if (accessLoading || dataLoading) return;
    if (!permissions.hasAccess) {
      toast.error("Você não tem permissão para acessar este dashboard");
      navigate(appUrls.profile.central);
      return;
    }
    if (!business) {
      toast.error("Empresa não encontrada");
      navigate(appUrls.profile.central);
    }
  }, [accessLoading, dataLoading, permissions.hasAccess, business, navigate, appUrls]);

  const handleBack = () => navigate(appUrls.profile.central);

  const handleViewPublic = () => {
    if (business?.slug && business.geographic_path) {
      navigate(BusinessUrlService.getCanonicalUrl({
        id: business.id,
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
      }));
    }
  };

  const handleEditBusiness = () => {
    if (business) navigate(appUrls.business.edit(business.id));
  };

  const handlePlanSelect = (planId: PlanType) => {
    setCurrentPlan(planId);
    toast.success(`Plano ${planId} selecionado!`);
  };

  if (accessLoading || dataLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!permissions.hasAccess || !business || !dashboardBusiness) return null;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <DashboardBreadcrumb />

      {effectiveProfile && (
        <ActiveProfileBadge profile={effectiveProfile} action="gerenciando como" className="mb-4" />
      )}

      <DashboardHeader
        business={dashboardBusiness}
        onBack={handleBack}
        onViewPublic={handleViewPublic}
      />

      {/* CTA de vertical gastronomia — visível na visão geral quando não configurado */}
      {isGastronomyEligible && activeTab === 'visao-geral' && (
        <div className="mb-4">
          <GastronomyVerticalCTA businessId={business.id} status={gastronomyStatus} />
        </div>
      )}

      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} extraTabs={extraTabs}>
        <TabPanel value="visao-geral">
          <EmpresaDashboardTab businessId={business.id} />
        </TabPanel>

        <TabPanel value="analytics">
          <AnalyticsDashboard businessId={business.id} />
        </TabPanel>

        <TabPanel value="qr-code">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">QR Code da Empresa</h2>
              <p className="text-muted-foreground">
                Gere e gerencie o QR Code da sua empresa para compartilhar com clientes
              </p>
            </div>
            
            <QrCodeWidget
              entityType="business"
              entityId={business.id}
              businessId={business.id}
              canonicalUrl={business.slug && business.geographic_path 
                ? BusinessUrlService.getCanonicalUrl({
                    id: business.id,
                    slug: business.slug,
                    is_premium: business.is_premium,
                    geographic_path: business.geographic_path,
                  })
                : `/empresas/${business.id}`
              }
              ownerProfileId={business.profile_id || profileId || ''}
              title="QR Code da Empresa"
              description="Compartilhe este QR Code para clientes acessarem sua página"
            />
          </div>
        </TabPanel>

        <TabPanel value="cupons">
          <CouponManager businessId={business.id} planType={currentPlan} />
        </TabPanel>

        <TabPanel value="plano">
          <SubscriptionPlans currentPlan={currentPlan} onSelectPlan={handlePlanSelect} />
        </TabPanel>

        <TabPanel value="configuracoes">
          <SettingsTab businessId={business.id} onEditBusiness={handleEditBusiness} />
        </TabPanel>

        <TabPanel value="rede">
          <NetworkTab
            profileId={business.profile_id || profileId || ""}
            businessId={business.id}
            businessRole={business.business_role}
            parentBusinessId={business.parent_business_id}
            locationId={business.location_id}
          />
        </TabPanel>

        {isGastronomyEligible && (
          <TabPanel value="gastronomia">
            <GastronomySetupPage businessId={business.id} />
          </TabPanel>
        )}
      </DashboardTabs>
    </div>
  );
}
