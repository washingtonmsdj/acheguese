import { Building2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { BusinessModulesSection } from "@/core/profiles/components/hub/BusinessModulesSection";
import { useProfileHub } from "@/core/profiles/hooks/useProfileHub";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { navigateToSafeRedirect } from "@/shared/utils/safeRedirect";
import "./CentralEmpresasPage.css";

/**
 * CentralEmpresasPage
 *
 * Página lista de empresas na Central (/central/empresas).
 * Lista empresas do usuário com CTAs para acessar painel e criar nova empresa.
 */
interface CentralEmpresasPageProps {
  readonly billingEnabled: boolean;
}

export default function CentralEmpresasPage({
  billingEnabled,
}: CentralEmpresasPageProps) {
  const navigate = useNavigate();
  const profileHub = useProfileHub();
  const appUrls = useAppUrls();

  const handleNavigate = (url: string) => {
    if (/^https?:\/\//i.test(url)) {
      navigateToSafeRedirect(url, {
        allowAnyHttpOrigin: true,
        allowRelative: false,
        context: "central-business-module",
      });
      return;
    }

    navigate(url);
  };

  const handleCopy = (url: string, label: string) => {
    profileHub.copyToClipboard(url, label);
  };

  const handleCreateBusiness = () => {
    navigate(appUrls.business.create);
  };

  if (profileHub.loading) {
    return (
      <div className="central-business-page space-y-4" role="status" aria-label="Carregando suas empresas">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <Card className="rounded-xl">
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-56 max-w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileHub.loading && profileHub.businessModules.length === 0) {
    return (
      <div className="central-business-page">
        <header className="central-business-heading"><div><span className="central-business-eyebrow">Sua central</span><h1>Minhas empresas</h1><p>Cuide da presença do seu negócio no território.</p></div></header>
        <Card className="central-business-empty">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Seu negócio começa aqui</h2>
              <p className="text-sm text-muted-foreground">
                Você ainda não possui empresas administradas. Crie sua primeira empresa para começar a usar o painel empresarial.
              </p>
            </div>
            <Button onClick={handleCreateBusiness} className="central-business-create w-full gap-2 sm:w-auto">
              <Sparkles className="h-4 w-4" />
              Criar empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="central-business-page">
      <header className="central-business-heading">
        <div>
          <span className="central-business-eyebrow">Sua central</span>
          <h1>Minhas empresas</h1>
          <p>Atualize seus dados, acompanhe seus negócios e veja suas páginas públicas.</p>
        </div>
        <Button onClick={handleCreateBusiness} className="central-business-create gap-2">
          <Sparkles className="h-4 w-4" />
          Nova empresa
        </Button>
      </header>

      <BusinessModulesSection
        showCreateAction={false}
        businessModules={profileHub.businessModules}
        billingEnabled={billingEnabled}
        showOnboarding={profileHub.showBusinessOnboarding}
        onCreateBusiness={handleCreateBusiness}
        onNavigate={handleNavigate}
        onCopy={handleCopy}
      />
    </div>
  );
}
