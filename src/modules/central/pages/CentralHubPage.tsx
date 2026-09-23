import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, Shield, Sparkles } from "lucide-react";

import { isProductModuleEnabled } from "@/app/config/lifecycleRegistry";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useProfileHub } from "@/core/profiles/hooks/useProfileHub";
import { useSessionContext } from "@/core/session";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function CentralHubPage() {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const profileHub = useProfileHub();

  if (!user) {
    return null;
  }

  const businessEnabled = isProductModuleEnabled("business");
  const hasBusinesses = businessEnabled && profileHub.businessModules.length > 0;
  const isAdmin = Boolean(
    (profileHub.identity?.reputation as
      | { is_moderator?: boolean }
      | undefined)?.is_moderator,
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Central</h1>
          <p className="text-muted-foreground">
            Hub de gestão das suas empresas no Achegue-se.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          onClick={() => navigate("/")}
        >
          Ir para o site
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      {hasBusinesses || isAdmin ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Suas áreas de gestão</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hasBusinesses ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Minhas Empresas
                  </CardTitle>
                  <CardDescription>
                    Gerencie dados, operação e presença local das suas empresas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant="secondary">
                      {profileHub.businessModules.length} ativa(s)
                    </Badge>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => navigate(businessManagementRoutes.list())}
                    >
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {isAdmin ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Administração
                  </CardTitle>
                  <CardDescription>
                    Acesso ao painel administrativo do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => navigate(centralRoutes.admin.home)}
                  >
                    Acessar admin
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {businessEnabled && !hasBusinesses ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Comece a gerenciar</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cadastre sua empresa
                </CardTitle>
                <CardDescription>
                  Crie e gerencie seu negócio no Achegue-se.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(businessManagementRoutes.create())}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar empresa
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
