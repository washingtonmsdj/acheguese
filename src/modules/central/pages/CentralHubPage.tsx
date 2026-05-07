import { useEffect } from "react";
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
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";

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

  useEffect(() => {
    // Redirecionar para login se não autenticado
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

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
          Hub de gestão e operação para empresas, profissionais e mobilidade.
        </p>
      </div>

      {/* Seção de Entidades Ativas */}
      {(hasBusinesses || hasProfessional || hasDriver || isAdmin) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Suas Áreas de Gestão</h2>
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
                    Gerencie seus negócios, cardápios, pedidos e analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{profileHub.businessModules.length} ativa(s)</Badge>
                    <Button onClick={() => navigate("/central/empresas")}>
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
                    Área Profissional
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus serviços, orçamentos, agenda e avaliações.
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
                  <Button onClick={() => navigate("/central/motorista")}>
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
                  <Button onClick={() => navigate("/central/motoboy")}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Administração */}
            {isAdmin && (
              <Card className="border-primary/20 bg-primary/5">
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
                  <Button onClick={() => navigate("/admin")}>
                    Acessar Admin
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Seção de CTAs para usuários sem entidades */}
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
                  Crie e gerencie seu negócio no Achegue-se.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/create-business")}
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
                  Área Profissional
                </CardTitle>
                <CardDescription>
                  Ofereça serviços e gerencie sua carreira profissional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/services/cadastrar")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar Serviço
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
                  onClick={() => navigate("/central/motorista/cadastro")}
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
                  onClick={() => navigate("/central/motoboy/cadastro")}
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
