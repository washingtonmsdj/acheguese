import { useNavigate } from "react-router-dom";
import {
  Building2,
  Bike,
  Car,
  GraduationCap,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useSessionContext } from "@/core/session";
import { useProfileHub } from "@/core/profile/hooks/useProfileHub";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

/**
 * CentralHubPage
 * 
 * PÃ¡gina hub da Central (/central).
 * Mostra cards dinÃ¢micos baseados nas entidades do usuÃ¡rio:
 * - Minhas empresas
 * - Ãrea profissional
 * - Motorista
 * - Motoboy/Entregas
 * - AdministraÃ§Ã£o (se for admin)
 */
export default function CentralHubPage() {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const profileHub = useProfileHub();
  const { driverData, isRegistered: driverRegistered } = useDriverProfileIdentity({
    queryScope: "central-hub",
  });

  // Guard jÃ¡ verifica autenticaÃ§Ã£o, nÃ£o precisa de useEffect aqui
  if (!user) {
    return null;
  }

  const hasBusinesses = profileHub.businessModules.length > 0;
  const hasProfessional = profileHub.personalProfile?.professional_data ? true : false;
  const hasDriver = driverRegistered;
  const isAdmin = profileHub.identity?.reputation?.is_moderator || false;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Central</h1>
        <p className="text-muted-foreground">
          Hub de gestÃ£o e operaÃ§Ã£o para empresas, profissionais e mobilidade.
        </p>
      </div>

      {/* SeÃ§Ã£o de Entidades Ativas */}
      {(hasBusinesses || hasProfessional || hasDriver || isAdmin) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Suas Ãreas de GestÃ£o</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Empresas */}
            {hasBusinesses && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Minhas Empresas
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus negÃ³cios, cardÃ¡pios, pedidos e analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{profileHub.businessModules.length} ativa(s)</Badge>
                    <Button onClick={() => navigate(businessManagementRoutes.list())}>
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profissional */}
            {hasProfessional && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Ãrea Profissional
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus serviÃ§os, orÃ§amentos, agenda e avaliaÃ§Ãµes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/central/profissional")}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Motorista */}
            {hasDriver && driverData?.mode === "driver" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Motorista
                  </CardTitle>
                  <CardDescription>
                    Gerencie corridas, disponibilidade e ganhos como motorista.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(mobilityRoutes.motorista.home)}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Motoboy */}
            {hasDriver && driverData?.mode === "motoboy" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5 text-primary" />
                    Motoboy
                  </CardTitle>
                  <CardDescription>
                    Gerencie entregas, disponibilidade e ganhos como motoboy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(mobilityRoutes.motoboy.home)}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AdministraÃ§Ã£o */}
            {isAdmin && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    AdministraÃ§Ã£o
                  </CardTitle>
                  <CardDescription>
                    Acesso ao painel administrativo do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/admin")}>
                    Acessar Admin
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* SeÃ§Ã£o de CTAs para usuÃ¡rios sem entidades */}
      {!hasBusinesses && !hasProfessional && !hasDriver && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Comece a Gerenciar</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Cadastrar Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cadastre sua Empresa
                </CardTitle>
                <CardDescription>
                  Crie e gerencie seu negÃ³cio no Achegue-se.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/central/empresas/nova")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar Empresa
                </Button>
              </CardContent>
            </Card>

            {/* Cadastrar Profissional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Ãrea Profissional
                </CardTitle>
                <CardDescription>
                  OfereÃ§a serviÃ§os e gerencie sua carreira profissional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/services/cadastrar")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar ServiÃ§o
                </Button>
              </CardContent>
            </Card>

            {/* Seja Motorista */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Seja Motorista
                </CardTitle>
                <CardDescription>
                  Trabalhe como motorista de app na sua cidade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(mobilityRoutes.motorista.cadastro)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar Motorista
                </Button>
              </CardContent>
            </Card>

            {/* Seja Motoboy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5" />
                  Seja Entregador
                </CardTitle>
                <CardDescription>
                  Trabalhe como motoboy realizando entregas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(mobilityRoutes.motoboy.cadastro)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar Motoboy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
