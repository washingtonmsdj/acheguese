import { Building2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { BusinessModulesSection } from "@/core/profile/components/hub/BusinessModulesSection";
import { useProfileHub } from "@/core/profile/hooks/useProfileHub";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

/**
 * CentralEmpresasPage
 *
 * Pagina lista de empresas na Central (/central/empresas).
 * Lista empresas do usuario com CTAs para acessar painel e criar nova empresa.
 */
export default function CentralEmpresasPage() {
  const navigate = useNavigate();
  const profileHub = useProfileHub();
  const appUrls = useAppUrls();

  const handleNavigate = (url: string) => {
    if (/^https?:\/\//i.test(url)) {
      window.location.assign(url);
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
      <div className="space-y-4">
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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full rounded-lg">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma empresa ativa</h3>
              <p className="text-sm text-muted-foreground">
                Voce ainda nao possui empresas administradas. Crie sua primeira empresa para comecar a usar o painel empresarial.
              </p>
            </div>
            <Button onClick={handleCreateBusiness} className="w-full gap-2 sm:w-auto">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Gerencie suas empresas e acesse os paineis operacionais.</p>
        </div>
        <Button onClick={handleCreateBusiness} className="w-full gap-2 sm:w-auto">
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
