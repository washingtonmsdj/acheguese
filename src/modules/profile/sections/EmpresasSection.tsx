/**
 * EmpresasSection - secao de empresas do perfil
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Logica clara e organizada
 */

import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  LayoutGrid,
} from "lucide-react";

import {
  SectionFrame,
  HubLinkCard,
  BusinessModulesSection,
} from "@/modules/profile/components/hub";
import { BusinessOwnerQuickAccess } from "@/modules/profile/components/BusinessOwnerQuickAccess";

import type { EmpresasSectionProps } from "./types";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";

export function EmpresasSection({
  businessModules,
  showBusinessOnboarding,
  navigate,
  appUrls,
  copyToClipboard,
}: EmpresasSectionProps) {
  const primaryBusinessModule = businessModules[0] ?? null;
  const primaryGastronomyModule = businessModules.find((item) => item.gastronomy.active) ?? null;
  const showJobs = isLaunchSurfaceEnabled("jobs");
  const showPublicAnalytics = isLaunchSurfaceEnabled("publicAnalytics");

  return (
    <div className="space-y-6">
      {/* Widget de acesso rapido para donos - destaque na secao empresas */}
      {businessModules.length > 0 && (
        <BusinessOwnerQuickAccess
          businesses={businessModules}
          onNavigate={(url) => navigate(url)}
        />
      )}

      <BusinessModulesSection
        businessModules={businessModules}
        showOnboarding={showBusinessOnboarding}
        onCreateBusiness={() => navigate(appUrls.business.create)}
        onNavigate={(url) => navigate(url)}
        onCopy={copyToClipboard}
      />

      <SectionFrame
        title="Ações empresariais"
        description="Atalhos para gerir empresa, classificados e operação gastronômica."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <HubLinkCard
            icon={Building2}
            title="Nova empresa"
            description="Inicie o fluxo de criação de empresa."
            onClick={() => navigate(appUrls.business.create)}
          />
          <HubLinkCard
            icon={ArrowRight}
            title="Explorar empresas do território"
            description="Ver ecossistema de empresas e referências locais."
            onClick={() => navigate(appUrls.business.list)}
          />
          {showJobs ? (
            <HubLinkCard
              icon={Briefcase}
              title="Publicar vaga"
              description="Abra uma vaga e publique no módulo de empregos."
              onClick={() => navigate(`${appUrls.jobs}/publicar`)}
            />
          ) : null}
          <HubLinkCard
            icon={LayoutGrid}
            title="Novo classificado"
            description="Publique produto ou serviço nos classificados."
            onClick={() => navigate(appUrls.classifieds.new)}
          />
          {showPublicAnalytics ? (
            <HubLinkCard
              icon={BarChart3}
              title="Analytics geral"
              description="Acesse indicadores agregados e visitantes."
              onClick={() => navigate("/analytics")}
            />
          ) : null}
          {primaryBusinessModule ? (
            <HubLinkCard
              icon={Building2}
              title="Dashboard da empresa principal"
              description={`Abrir painel de ${primaryBusinessModule.name}.`}
              onClick={() => navigate(primaryBusinessModule.dashboardUrl)}
            />
          ) : null}
          {showPublicAnalytics && primaryGastronomyModule?.gastronomy.analyticsUrl ? (
            <HubLinkCard
              icon={BarChart3}
              title="Analytics gastronomia"
              description="Visitas, engajamento e performance da operação gastronômica."
              onClick={() => navigate(primaryGastronomyModule.gastronomy.analyticsUrl!)}
            />
          ) : null}
          {primaryGastronomyModule?.gastronomy.menuUrl ? (
            <HubLinkCard
              icon={LayoutGrid}
              title="Produtos e cardápio"
              description="Gerencie itens, categorias e preços da gastronomia."
              onClick={() => navigate(primaryGastronomyModule.gastronomy.menuUrl!)}
            />
          ) : null}
        </div>
      </SectionFrame>
    </div>
  );
}
