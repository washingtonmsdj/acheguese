import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bike,
  Building2,
  Car,
  GraduationCap,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useSessionContext } from "@/core/session";
import { useProfileHub } from "@/core/profile/hooks/useProfileHub";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

/**
 * CentralHubPage
 *
 * Página hub da Central (/central).
 * Mostra cards dinâmicos baseados nas entidades do usuário:
 * - Minhas empresas
 * - Área profissional
 * - Motorista
 * - Motoboy/Entregas
 * - Administração (se for admin)
 */
export default function CentralHubPage() {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const profileHub = useProfileHub();
  const { driverData, isRegistered: driverRegistered } = useDriverProfileIdentity({
    queryScope: "central-hub",
  });

  if (!user) {
    return null;
  }

  const hasBusinesses = profileHub.businessModules.length > 0;
  const hasProfessionalData = Boolean(
    (profileHub.profile as { professional_data?: unknown } | null)?.professional_data,
  );
  const hasProfessionalProfile = profileHub.allProfiles.some((profile) => profile.profile_type === "professional");
  const hasProfessional = hasProfessionalData || hasProfessionalProfile;
  const hasDriver = driverRegistered;
  const canDoRides = hasDriver && driverData?.can_do_rides !== false;
  const canDoDelivery = hasDriver && driverData?.can_do_delivery === true;
  const showDriverCard = hasDriver && canDoRides;
  const showMotoboyCard = hasDriver && canDoDelivery;
  const showMobilitySetupCard = hasDriver && !showDriverCard && !showMotoboyCard;
  const isAdmin = Boolean(
    (profileHub.identity?.reputation as { is_moderator?: boolean } | undefined)?.is_moderator,
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Central</h1>
          <p className="text-muted-foreground">Hub de gestão e operação para empresas, profissionais e mobilidade.</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => navigate("/")}>
          Ir para o site
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      {(hasBusinesses || hasProfessional || hasDriver || isAdmin) ? (
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
                  <CardDescription>Gerencie seus negócios, operação e analytics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant="secondary">{profileHub.businessModules.length} ativa(s)</Badge>
                    <Button className="w-full sm:w-auto" onClick={() => navigate(businessManagementRoutes.list())}>
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {hasProfessional ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Área profissional
                  </CardTitle>
                  <CardDescription>Gerencie serviços, orçamentos, agenda e avaliações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => navigate(centralRoutes.profissional.home)}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {showDriverCard ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Motorista
                  </CardTitle>
                  <CardDescription>Gerencie corridas, disponibilidade e ganhos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full sm:w-auto" onClick={() => navigate(centralRoutes.motorista.home)}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {showMotoboyCard ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5 text-primary" />
                    Motoboy
                  </CardTitle>
                  <CardDescription>Gerencie entregas, disponibilidade e ganhos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full sm:w-auto" onClick={() => navigate(centralRoutes.motoboy.home)}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {showMobilitySetupCard ? (
              <Card className="rounded-lg border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Mobilidade
                  </CardTitle>
                  <CardDescription>Finalize seu cadastro para ativar corridas ou entregas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full sm:w-auto" onClick={() => navigate(centralRoutes.motorista.cadastro)}>
                    Continuar cadastro
                  </Button>
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
                  <CardDescription>Acesso ao painel administrativo do sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full sm:w-auto" onClick={() => navigate(centralRoutes.admin.home)}>
                    Acessar admin
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {!hasBusinesses && !hasProfessional && !hasDriver ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Comece a gerenciar</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cadastre sua empresa
                </CardTitle>
                <CardDescription>Crie e gerencie seu negócio no Achegue-se.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => navigate(centralRoutes.empresas.create)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar empresa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Área profissional
                </CardTitle>
                <CardDescription>Ofereça serviços e gerencie sua carreira profissional.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => navigate(centralRoutes.servicos.create)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar serviço
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Seja motorista
                </CardTitle>
                <CardDescription>Trabalhe como motorista de app na sua cidade.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(centralRoutes.motorista.cadastro)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar motorista
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5" />
                  Seja entregador
                </CardTitle>
                <CardDescription>Trabalhe como motoboy realizando entregas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(centralRoutes.motoboy.cadastro)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar motoboy
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
