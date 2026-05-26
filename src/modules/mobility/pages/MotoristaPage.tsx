/**
 * Painel do Motorista - Estrutura Profissional AAA
 * Layout otimizado sem gambiarras, seguindo padroes de design system
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
import { useMotoristaPage } from "@/modules/mobility/hooks/useMotoristaPage";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
import { DriverSuspensionAlert } from "../components/driver/DriverSuspensionAlert";
import { DriverOfferCard } from "../components";
import { DriverRidesTab } from "../components/driver/DriverRidesTab";
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
  Car,
  Satellite,
  Star,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Crown,
  Bell,
  Settings,
} from "lucide-react";

type MotoristaHook = ReturnType<typeof useMotoristaPage>;

interface DashboardRide {
  id: string;
  status: string;
  ride_mode?: string | null;
  completed_at?: string;
  updated_at?: string;
  passenger?: { name?: string };
  [key: string]: unknown;
}

export default function MotoristaPage() {
  const hook = useMotoristaPage();
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const [selectedPeriod, setSelectedPeriod] = React.useState<
    "today" | "week" | "month" | "total" | null
  >(null);

  // SSOT compliant: redirecionar para cadastro se nao for motorista
  React.useEffect(() => {
    if (!hook.loading && !hook.isDriver) {
      navigate(mobilityUrls.motorista.cadastro);
    }
  }, [hook.isDriver, hook.loading, navigate, mobilityUrls.motorista.cadastro]);

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

  // Mostrar loading enquanto verifica se e motorista
  if (hook.loading || !hook.isDriver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      {/* Layout simples - sem h-screen pois o Layout global ja gerencia */}
      <div className="bg-background">
        {/* Header da pagina */}
        <PageHeader {...hook} hook={hook} />

        {/* Conteudo */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <DriverSuspensionAlert />

          {/* Ofertas de Corrida em Tempo Real */}
          <div className="mb-4">
            <DriverOfferCard />
          </div>

          {/* Tabs com lista horizontal */}
          <Tabs
            value={hook.activeTab}
            onValueChange={hook.setActiveTab}
            className="space-y-4"
          >
            <TabsList className="w-full grid grid-cols-5 h-auto p-1">
              <TabsTrigger
                value="corridas"
                className="flex flex-col gap-1 py-2"
              >
                <Car className="h-4 w-4" />
                <span className="text-xs">Viagens</span>
                {hook.availableRides.length + hook.acceptedByMe.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[0.6rem]">
                    {hook.availableRides.length + hook.acceptedByMe.length}
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

        {/* Conteudo */}
              {/* Entregas motoboy ativas - mostradas acima das corridas de passageiro */}
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
              <DriverRidesTab
                isDriverOnline={hook.isDriverOnline}
                isTracking={hook.isTracking}
                gpsError={hook.gpsError || null}
                currentDriverId={hook.currentDriverId}
                acceptedRides={hook.activeRides ?? hook.acceptedByMe}
                availableRides={hook.availableRides}
                loading={hook.loading}
                isSuspended={hook.isSuspended}
                canAcceptRideOffers={hook.canAcceptRideOffers}
                canAcceptDeliveryOffers={hook.canAcceptDeliveryOffers}
                offerModeFilter={hook.offerModeFilter}
                onOfferModeFilterChange={hook.setOfferModeFilter}
                onToggleOnline={hook.toggleDriverOnline}
                onAcceptRide={hook.acceptRide}
                onStartRide={hook.startRide}
                onCompleteRide={(rideId, ride) => {
                  if (ride) hook.handleOpenCompleteDialog(ride);
                }}
                onCancelRide={(id) => {
                  const ride = hook.acceptedByMe.find((r: DashboardRide) => r.id === id);
                  if (ride) hook.handleOpenCancelDialog(ride);
                }}
              />
        {/* Conteudo */}

        {/* Conteudo */}
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
                      rides={hook.completedByMe.filter((r) => {
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
                      rides={hook.completedByMe.filter((r) => {
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
                      rides={hook.completedByMe}
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
        {/* Conteudo */}

        {/* Conteudo */}
              <DriverSubscriptionCard currentPlan="prioritario" service="motorista" />
        {/* Conteudo */}

        {/* Conteudo */}
              <DriverNotifications />
        {/* Conteudo */}

        {/* Conteudo */}
              <DriverSettingsPanel />
        {/* Conteudo */}
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
          passengerName={hook.rideToRate?.passenger?.name || "Passageiro"}
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
  hook: MotoristaHook;
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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
              <Car className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-base font-bold">Motorista</h1>
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
              <span className="text-xs text-muted-foreground">estrelas</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold">
                  {hook.driverStats.totalRides}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Viagens</span>
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
            className="gap-2"
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isDriverOnline
                  ? "bg-success animate-pulse"
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
