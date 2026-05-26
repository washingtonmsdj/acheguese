/**
 * Painel do Motoboy - Pagina dedicada para Entregas
 *
 * Separacao profissional entre motorista (corridas) e motoboy (entregas)
 * seguindo SSOT e arquitetura limpa.
 *
 * Rota: /mobilidade/motoboy
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ErrorBoundary, ErrorState } from "../components/ErrorBoundary";
import { useMotoboyPage } from "@/modules/mobility/hooks/useMotoboyPage";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
import { DriverSuspensionAlert } from "../components/driver/DriverSuspensionAlert";
import { DriverOfferCard } from "../components";
import { MotoboyDeliveryActions } from "../components/driver/MotoboyDeliveryActions";
import { DriverEarningsCard } from "../components/driver/DriverEarningsCard";
import { WeeklyEarningsChart } from "../components/driver/WeeklyEarningsChart";
import { DriverRidesList } from "../components/driver/DriverRidesList";
import { DriverNotifications } from "../components/driver/DriverNotifications";
import { DriverSubscriptionCard } from "../components/driver/DriverSubscriptionCard";
import { DriverSettingsPanel } from "../components/driver/DriverSettingsPanel";
import { CompleteRideDialog } from "../components/driver/CompleteRideDialog";
import { CancelRideDialog } from "../components/driver/CancelRideDialog";
import { RatePassengerDialog } from "../components/driver/RatePassengerDialog";
import { cn } from "@/shared/utils/cn";
import {
  ArrowLeft,
  Package,
  Satellite,
  Star,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Crown,
  Bell,
  Settings,
  Bike,
} from "lucide-react";

type MotoboyHook = ReturnType<typeof useMotoboyPage>;

interface DashboardRide {
  id: string;
  status: string;
  ride_mode?: string | null;
  completed_at?: string;
  updated_at?: string;
  passenger?: { name?: string };
  [key: string]: unknown;
}

export default function MotoboyPage() {
  const hook = useMotoboyPage();
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const [selectedPeriod, setSelectedPeriod] = React.useState<
    "today" | "week" | "month" | "total" | null
  >(null);

  // SSOT compliant: Redirecionar para cadastro se nao for motoboy
  React.useEffect(() => {
    if (!hook.loading && !hook.isDriver) {
      navigate(mobilityUrls.motoboy.cadastro);
    }
  }, [hook.isDriver, hook.loading, navigate, mobilityUrls.motoboy.cadastro]);

  // Verifica capacidade de entrega pelo SSOT operacional.
  React.useEffect(() => {
    if (!hook.loading && hook.isDriver && !hook.canAcceptDeliveryOffers) {
      // Redirecionar para habilitar entregas
      navigate("/conta");
    }
  }, [hook.isDriver, hook.loading, hook.canAcceptDeliveryOffers, navigate]);

  if (hook.error) {
    return (
      <ErrorBoundary onReset={() => window.location.reload()}>
        <div className="min-h-screen bg-background">
          <PageHeader {...hook} hook={hook} />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ErrorState
              error={hook.error}
              onRetry={() => hook.refetch()}
              title="Erro ao carregar"
              description="Verifique sua conexao."
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Mostrar loading
  if (hook.loading || !hook.isDriver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <div className="bg-background">
        {/* Header da pagina */}
        <PageHeader {...hook} hook={hook} />

        {/* Conteudo */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <DriverSuspensionAlert />

          {/* Badge de Motoboy */}
          <div className="mb-4 flex items-center gap-2">
            <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">
              <Bike className="h-3 w-3 mr-1" />
              Modo Motoboy
            </Badge>
            <span className="text-xs text-muted-foreground">
              Apenas entregas disponiveis
            </span>
          </div>

          {/* Ofertas de Entrega em Tempo Real */}
          <div className="mb-4">
            <DriverOfferCard />
          </div>

          {/* Tabs */}
          <Tabs
            value={hook.activeTab}
            onValueChange={hook.setActiveTab}
            className="space-y-4"
          >
            <TabsList className="w-full grid grid-cols-5 h-auto p-1">
              <TabsTrigger
                value="entregas"
                className="flex flex-col gap-1 py-2"
              >
                <Package className="h-4 w-4" />
                <span className="text-xs">Entregas</span>
                {hook.deliveryCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[0.6rem]">
                    {hook.deliveryCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ganhos" className="flex flex-col gap-1 py-2">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">R$</span>
              </TabsTrigger>
              <TabsTrigger value="planos" className="flex flex-col gap-1 py-2">
                <Crown className="h-4 w-4" />
                <span className="text-xs">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex flex-col gap-1 py-2">
                <Bell className="h-4 w-4" />
                <span className="text-xs">Avisos</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="flex flex-col gap-1 py-2">
                <Settings className="h-4 w-4" />
                <span className="text-xs">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entregas" className="mt-0">
              {/* Entregas Ativas */}
              {hook.activeDeliveries?.length > 0 && (
                <div className="mb-4 space-y-3">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Entregas Ativas ({hook.activeDeliveries.length})
                  </h3>
                  {hook.activeDeliveries.map((delivery: DashboardRide) => (
                    <MotoboyDeliveryActions
                      key={delivery.id}
                      ride={delivery}
                      driverProfileId={hook.currentDriverId || ""}
                      onGoToPickup={hook.handleGoToPickup}
                      onConfirmPickup={hook.handleConfirmPickup}
                      onStartDelivery={hook.handleStartDelivery}
                      onConfirmDelivery={hook.handleConfirmDelivery}
                      onFailDelivery={hook.handleFailDelivery}
                    />
                  ))}
                </div>
              )}

              {/* Entregas Disponiveis */}
              {hook.availableDeliveries?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-orange-500" />
                    Entregas Disponiveis ({hook.availableDeliveries.length})
                  </h3>
                  {hook.availableDeliveries.map((delivery: DashboardRide) => (
                    <div
                      key={delivery.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {String(delivery.origin ?? "")} -&gt; {String(delivery.destination ?? "")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {String(delivery.package_description || "Pacote")}
                          </p>
                        </div>
                        <Badge className="bg-orange-500/10 text-orange-600">
                          R$ {typeof delivery.suggested_price === "number" ? delivery.suggested_price.toFixed(2) : "0.00"}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => hook.acceptRide(delivery.id)}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        disabled={!hook.isDriverOnline || hook.actionsLoading}
                      >
                        Aceitar Entrega
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Estado vazio */}
              {!hook.activeDeliveries?.length &&
                !hook.availableDeliveries?.length && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhuma entrega disponivel
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hook.isDriverOnline
                        ? "Aguardando novas entregas..."
                        : "Fique online para receber entregas"}
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="ganhos" className="mt-0">
              {selectedPeriod ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setSelectedPeriod(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  {selectedPeriod === "week" && hook.currentDriverId && (
                    <WeeklyEarningsChart
                      driverProfileId={hook.currentDriverId}
                    />
                  )}
                  {selectedPeriod === "today" && (
                    <DriverRidesList
                      rides={hook.completedDeliveries.filter((r) => {
                        const today = new Date().toDateString();
                        return (
                          new Date(
                            r.completed_at || r.updated_at,
                          ).toDateString() === today
                        );
                      })}
                      type="history"
                      loading={hook.loading}
                    />
                  )}
                  {selectedPeriod === "month" && (
                    <DriverRidesList
                      rides={hook.completedDeliveries.filter((r) => {
                        const now = new Date();
                        const rideDate = new Date(
                          r.completed_at || r.updated_at,
                        );
                        return (
                          rideDate.getMonth() === now.getMonth() &&
                          rideDate.getFullYear() === now.getFullYear()
                        );
                      })}
                      type="history"
                      loading={hook.loading}
                    />
                  )}
                  {selectedPeriod === "total" && (
                    <DriverRidesList
                      rides={hook.completedDeliveries}
                      type="history"
                      loading={hook.loading}
                    />
                  )}
                </div>
              ) : (
                <DriverEarningsCard
                  earnings={hook.driverEarnings}
                  onCardClick={(period) => setSelectedPeriod(period)}
                />
              )}
            </TabsContent>

            <TabsContent value="planos" className="mt-0">
              <DriverSubscriptionCard currentPlan="prioritario" service="motoboy" />
            </TabsContent>

            <TabsContent value="alertas" className="mt-0">
              <DriverNotifications />
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <DriverSettingsPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <CompleteRideDialog
          open={hook.completeDialogOpen}
          onOpenChange={hook.setCompleteDialogOpen}
          ride={hook.rideToComplete}
          onComplete={hook.handleCompleteRide}
          loading={hook.actionsLoading}
        />
        <CancelRideDialog
          open={hook.cancelDialogOpen}
          onOpenChange={hook.setCancelDialogOpen}
          rideId={hook.rideToCancel?.id || ""}
          onConfirm={hook.handleCancelRide}
          isDriver
        />
        <RatePassengerDialog
          open={hook.ratePassengerOpen}
          onOpenChange={hook.setRatePassengerOpen}
          passengerName={hook.rideToRate?.passenger?.name || "Remetente"}
          onSubmit={hook.handleRatePassenger}
        />
      </div>
    </ErrorBoundary>
  );
}

/* Page Header */

function PageHeader({
  isDriverOnline,
  isTracking,
  isLoadingDriverId,
  inProgressCount,
  handleGoBack,
  toggleDriverOnline,
  hook,
}: {
  isDriverOnline: boolean;
  isTracking: boolean;
  isLoadingDriverId?: boolean;
  inProgressCount: number;
  handleGoBack: () => void;
  toggleDriverOnline: () => void;
  hook: MotoboyHook;
}) {
  const { unreadCount } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
              <Bike className="h-5 w-5 text-orange-500" />
            </div>
            <h1 className="text-base font-bold">Motoboy</h1>
          </div>
        </div>

        {/* Right: Stats + Status + Actions */}
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-warning" />
                <span className="text-sm font-bold">
                  {hook.driverStats.avgRating.toFixed(1)}
                </span>
              </div>
              <Star className="h-3 w-3 fill-current text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-sm font-bold">
                  {hook.driverStats.totalRides}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Entregas</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-sm font-bold">
                  {hook.driverStats.acceptanceRate}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">OK</span>
            </div>
          </div>

          {/* GPS Status */}
          {isDriverOnline && (
            <Badge
              variant={isTracking ? "default" : "destructive"}
              className="gap-1"
            >
              <Satellite
                className={cn("h-3 w-3", isLoadingDriverId && "animate-spin")}
              />
              {isLoadingDriverId ? "..." : isTracking ? "GPS" : "!GPS"}
            </Badge>
          )}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => hook.setActiveTab("alertas")}
            className="relative h-9 w-9"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Online Toggle */}
          <Button
            onClick={toggleDriverOnline}
            variant={isDriverOnline ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              isDriverOnline && "bg-orange-500 hover:bg-orange-600"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isDriverOnline
                  ? "bg-white animate-pulse"
                  : "bg-muted-foreground",
              )}
            />
            {isDriverOnline ? "Online" : "Offline"}
          </Button>
        </div>
      </div>
    </div>
  );
}
