/**
 * EmpresasSection - Seção de empresas do perfil
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
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

export function EmpresasSection({
  businessModules,
  showBusinessOnboarding,
  navigate,
  appUrls,
  copyToClipboard,
}: EmpresasSectionProps) {
  const primaryBusinessModule = businessModules[0] ?? null;
  const primaryGastronomyModule = businessModules.find((item) => item.gastronomy.active) ?? null;

  return (
    <div className="space-y-6">
      {/* Widget de acesso rápido para donos - destaque na seção empresas */}
      {businessModules.length > 0 && (
        <BusinessOwnerQuickAccess
          businesses={businessModules as any}
          onNavigate={(url) => navigate(url)}
        />
      )}

      <BusinessModulesSection
        businessModules={businessModules as any}
        showOnboarding={showBusinessOnboarding}
        onCreateBusiness={() => navigate(appUrls.business.create)}
        onNavigate={(url) => navigate(url)}
        onCopy={copyToClipboard}
      />

      <SectionFrame
        title="Ações empresariais"
        description="Atalhos para gerir empresa, classificados, vagas, analytics e operação gastronômica."
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
          <HubLinkCard
            icon={Briefcase}
            title="Publicar vaga"
            description="Abra uma vaga e publique no módulo de empregos."
            onClick={() => navigate(`${appUrls.jobs}/publicar`)}
          />
          <HubLinkCard
            icon={LayoutGrid}
            title="Novo classificado"
            description="Publique produto/serviço nos classificados."
            onClick={() => navigate(appUrls.classifieds.new)}
          />
          <HubLinkCard
            icon={BarChart3}
            title="Analytics geral"
            description="Acesse indicadores agregados e visitantes."
            onClick={() => navigate("/analytics")}
          />
          {primaryBusinessModule ? (
            <HubLinkCard
              icon={Building2}
              title="Dashboard da empresa principal"
              description={`Abrir painel de ${primaryBusinessModule.name}.`}
              onClick={() => navigate(primaryBusinessModule.dashboardUrl)}
            />
          ) : null}
          {primaryGastronomyModule?.gastronomy.analyticsUrl ? (
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
