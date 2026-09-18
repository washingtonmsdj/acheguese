/**
 * Painel do Motorista.
 *
 * As abas sao a fronteira visual e funcional entre viagens, ganhos, plano,
 * notificacoes e configuracoes. Cada conteudo deve existir somente dentro do
 * seu TabsContent correspondente.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Car,
  CheckCircle2,
  Crown,
  Satellite,
  Settings,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { useMotoristaPage } from "@/modules/mobility/hooks/useMotoristaPage";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { ErrorBoundary } from "@/shared/components/errors/ErrorBoundary";\nimport { ErrorState } from "../components/ErrorState";
import { DriverOfferCard } from "../components";
import { CancelRideDialog } from "../components/driver/CancelRideDialog";
import { CompleteRideDialog } from "../components/driver/CompleteRideDialog";
import { DriverEarningsCard } from "../components/driver/DriverEarningsCard";
import { DriverNotifications } from "../components/driver/DriverNotifications";
import { DriverRidesList } from "../components/driver/DriverRidesList";
import { DriverRidesTab } from "../components/driver/DriverRidesTab";
import { DriverSettingsPanel } from "../components/driver/DriverSettingsPanel";
import { DriverSubscriptionCard } from "../components/driver/DriverSubscriptionCard";
import { DriverSuspensionAlert } from "../components/driver/DriverSuspensionAlert";
import { MotoboyDeliveryActions } from "../components/driver/MotoboyDeliveryActions";
import { RatePassengerDialog } from "../components/driver/RatePassengerDialog";
import { WeeklyEarningsChart } from "../components/driver/WeeklyEarningsChart";

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
          <div className="mx-auto max-w-7xl px-4 py-8">
            <ErrorState
              error={hook.error}
              onRetry={() => hook.refetch()}
              title="Erro ao carregar"
              description="Verifique sua conexão."
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (hook.loading || !hook.isDriver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-muted border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <div className="bg-background">
        <PageHeader {...hook} hook={hook} />

        <div className="mx-auto max-w-7xl px-4 py-4">
          <DriverSuspensionAlert />

          <div className="mb-4">
            <DriverOfferCard />
          </div>

          <Tabs
            value={hook.activeTab}
            onValueChange={hook.setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid h-auto w-full grid-cols-5 p-1">
              <TabsTrigger value="corridas" className="flex flex-col gap-1 py-2">
                <Car className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">Viagens</span>
                {hook.availableRides.length + hook.acceptedByMe.length > 0 ? (
                  <Badge variant="secondary" className="h-4 px-1 text-[0.6rem]">
                    {hook.availableRides.length + hook.acceptedByMe.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="ganhos" className="flex flex-col gap-1 py-2">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">R$</span>
              </TabsTrigger>
              <TabsTrigger value="planos" className="flex flex-col gap-1 py-2">
                <Crown className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex flex-col gap-1 py-2">
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">Avisos</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="flex flex-col gap-1 py-2">
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="corridas" className="mt-0 space-y-4">
              {hook.activeDeliveries?.length > 0 ? (
                <section className="space-y-3" aria-label="Entregas ativas">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-category-mobility" />
                    Entregas ativas ({hook.activeDeliveries.length})
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
                </section>
              ) : null}

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
                onStartPickupRoute={hook.startPassengerPickupRoute}
                onConfirmBoarding={hook.confirmPassengerBoarding}
                onStartRide={hook.startRide}
                onCompleteRide={(_rideId, ride) => {
                  if (ride) hook.handleOpenCompleteDialog(ride);
                }}
                onCancelRide={(rideId) => {
                  const ride = hook.acceptedByMe.find(
                    (candidate: DashboardRide) => candidate.id === rideId,
                  );
                  if (ride) hook.handleOpenCancelDialog(ride);
                }}
              />
            </TabsContent>

            <TabsContent value="ganhos" className="mt-0">
              {selectedPeriod ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setSelectedPeriod(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    Voltar
                  </Button>

                  {selectedPeriod === "week" && hook.currentDriverId ? (
                    <WeeklyEarningsChart driverProfileId={hook.currentDriverId} />
                  ) : null}

                  {selectedPeriod === "today" ? (
                    <DriverRidesList
                      rides={hook.completedByMe.filter((ride) => {
                        const today = new Date().toDateString();
                        return new Date(
                          ride.completed_at || ride.updated_at,
                        ).toDateString() === today;
                      })}
                      type="history"
                      loading={hook.loading}
                    />
                  ) : null}

                  {selectedPeriod === "month" ? (
                    <DriverRidesList
                      rides={hook.completedByMe.filter((ride) => {
                        const now = new Date();
                        const rideDate = new Date(
                          ride.completed_at || ride.updated_at,
                        );
                        return (
                          rideDate.getMonth() === now.getMonth() &&
                          rideDate.getFullYear() === now.getFullYear()
                        );
                      })}
                      type="history"
                      loading={hook.loading}
                    />
                  ) : null}

                  {selectedPeriod === "total" ? (
                    <DriverRidesList
                      rides={hook.completedByMe}
                      type="history"
                      loading={hook.loading}
                    />
                  ) : null}
                </div>
              ) : (
                <DriverEarningsCard
                  earnings={hook.driverEarnings}
                  onCardClick={setSelectedPeriod}
                />
              )}
            </TabsContent>

            <TabsContent value="planos" className="mt-0">
              <DriverSubscriptionCard service="motorista" />
            </TabsContent>

            <TabsContent value="alertas" className="mt-0">
              <DriverNotifications />
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <DriverSettingsPanel />
            </TabsContent>
          </Tabs>
        </div>

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

function PageHeader({
  isDriverOnline,
  isTracking,
  isLoadingDriverId,
  handleGoBack,
  toggleDriverOnline,
  hook,
}: {
  isDriverOnline: boolean;
  isTracking: boolean;
  isLoadingDriverId?: boolean;
  handleGoBack: () => void;
  toggleDriverOnline: () => void;
  hook: MotoristaHook;
}) {
  const { unreadCount } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-9 w-9"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-base font-bold">Motorista</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                <span className="text-sm font-bold">
                  {hook.driverStats.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">estrelas</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="text-sm font-bold">{hook.driverStats.totalRides}</span>
              </div>
              <span className="text-xs text-muted-foreground">Viagens</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                <span className="text-sm font-bold">
                  {hook.driverStats.acceptanceRate}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">OK</span>
            </div>
          </div>

          {isDriverOnline ? (
            <Badge
              variant={isTracking ? "default" : "destructive"}
              className="hidden gap-1 sm:inline-flex"
            >
              <Satellite
                className={cn("h-3 w-3", isLoadingDriverId && "animate-spin")}
                aria-hidden="true"
              />
              {isLoadingDriverId ? "..." : isTracking ? "GPS" : "!GPS"}
            </Badge>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => hook.setActiveTab("alertas")}
            className="relative h-9 w-9"
            aria-label={
              unreadCount > 0
                ? `Abrir avisos, ${unreadCount} não lido${unreadCount === 1 ? "" : "s"}`
                : "Abrir avisos"
            }
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 ? (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            ) : null}
          </Button>

          <Button
            onClick={toggleDriverOnline}
            variant={isDriverOnline ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isDriverOnline ? "animate-pulse bg-success" : "bg-muted-foreground",
              )}
              aria-hidden="true"
            />
            {isDriverOnline ? "Online" : "Offline"}
          </Button>
        </div>
      </div>
    </header>
  );
}
