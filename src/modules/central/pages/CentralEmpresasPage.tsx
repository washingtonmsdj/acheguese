import { Sparkles, Building2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useProfileHub } from "@/core/profile/hooks/useProfileHub";
import { BusinessModulesSection } from "@/core/profile/components/hub/BusinessModulesSection";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

/**
 * CentralEmpresasPage
 * 
 * PÃ¡gina lista de empresas na Central (/central/empresas).
 * Lista empresas do usuÃ¡rio com CTAs para acessar painel, criar nova empresa, etc.
 * Usa services/hooks canÃ´nicos jÃ¡ existentes (useProfileHub, BusinessModulesSection).
 */
export default function CentralEmpresasPage() {
  const profileHub = useProfileHub();
  const appUrls = useAppUrls();

  const handleNavigate = (url: string) => {
    window.location.href = url;
  };

  const handleCopy = (url: string, label: string) => {
    profileHub.copyToClipboard(url, label);
  };

  const handleCreateBusiness = () => {
    window.location.href = appUrls.business.create;
  };

  // Se nÃ£o tiver empresas, mostrar empty state
  if (!profileHub.loading && profileHub.businessModules.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma empresa ativa</h3>
              <p className="text-sm text-muted-foreground">
                VocÃª ainda nÃ£o possui empresas administradas. Crie sua primeira empresa para comeÃ§ar a usar o dashboard empresarial.
              </p>
            </div>
            <Button onClick={handleCreateBusiness} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Criar empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie suas empresas e acesse os dashboards operacionais
          </p>
        </div>
        <Button onClick={handleCreateBusiness} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      <BusinessModulesSection
        businessModules={profileHub.businessModules}
        showOnboarding={profileHub.showBusinessOnboarding}
        onCreateBusiness={handleCreateBusiness}
        onNavigate={handleNavigate}
        onCopy={handleCopy}
      />
    </div>
  );
}
