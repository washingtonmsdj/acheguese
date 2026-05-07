import { Package, MapPin, Route, Wallet, Settings2, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useDriverProfileIdentity } from "@/core/profiles/services/useDriverProfileIdentity";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useNavigate } from "react-router-dom";

/**
 * CentralMotoboyPage
 * 
 * Página hub para motoboy na Central (/central/motoboy).
 * Mostra resumo operacional: status do perfil, disponibilidade, atalhos para entregas/ganhos/configurações.
 * Usa services/hooks canônicos já existentes (useDriverProfileIdentity, useAppUrls).
 */
export default function CentralMotoboyPage() {
  const driverIdentity = useDriverProfileIdentity({ queryScope: 'central-motoboy' });
  const appUrls = useAppUrls();
  const navigate = useNavigate();

  const driverData = driverIdentity.driverData;
  const isRegistered = driverIdentity.isRegistered;
  const isLoading = driverIdentity.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando perfil de motoboy...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered || !driverData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil de motoboy não encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Você ainda não ativou seu perfil de motoboy. Cadastre-se para começar a receber solicitações de entregas.
              </p>
            </div>
            <Button
              onClick={() => navigate(appUrls.profile.mobilidade.motoboy.cadastro)}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Cadastrar como motoboy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canDoRides = driverData.can_do_rides !== false;
  const canDoDelivery = driverData.can_do_delivery === true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Motoboy</h1>
          <p className="text-muted-foreground">
            Gerencie seu perfil de motoboy e acompanhe suas operações
          </p>
        </div>
        <Badge variant={canDoDelivery ? "default" : "secondary"}>
          {canDoDelivery ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Resumo do perfil */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Status do perfil</p>
                <p className="text-xs text-muted-foreground">
                  {driverData.background_check_status === 'approved' ? 'Aprovado' : 'Em verificação'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Taxa de aceitação</p>
                <p className="text-xs text-muted-foreground">
                  {driverData.acceptance_rate ? `${driverData.acceptance_rate}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Capacidades</p>
                <p className="text-xs text-muted-foreground">
                  {canDoRides && canDoDelivery ? 'Corridas e Entregas' : canDoDelivery ? 'Apenas Entregas' : 'Nenhuma'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos para sub-rotas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ações rápidas</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.cadastro)}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm">Cadastro</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.disponibilidade)}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-sm">Disponibilidade</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.entregas)}
          >
            <Package className="h-5 w-5" />
            <span className="text-sm">Entregas</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.ganhos)}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-sm">Ganhos</span>
          </Button>
        </div>
      </div>

      {/* Mensagem de contexto para reforçar fluxo unificado */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Settings2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Fluxo unificado na Central</p>
              <p className="text-xs text-muted-foreground">
                Todas as ações acima permanecem dentro da Central para evitar perda de contexto durante a operação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
