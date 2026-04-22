/**
 * Painel do Motorista V1
 * 
 * Esta pagina e mantida para suporte a rota historica V1.
 * MotoristaPageV2 permanece como superficie oficial.
 * 
 * Rota oficial: /mobilidade/motorista → MotoristaPageV2
 * Rota historica V1: /motorista-v1 → MotoristaPage (esta)
 */

import React from "react";
import { Tabs, TabsContent } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { ErrorBoundary, ErrorState } from "../components/ErrorBoundary";
import { useMotoristaPage } from "@/modules/mobility/hooks/useMotoristaPage";
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useEffect } from "react";
import { DriverRegistrationCTA } from "../components/driver/DriverRegistrationCTA";
import { DriverRegistrationModal } from "../components/DriverRegistrationModal";
import { DriverSuspensionAlert } from "../components/driver/DriverSuspensionAlert";
import { DriverRidesTab } from "../components/driver/DriverRidesTab";
import { DriverEarningsCard } from "../components/driver/DriverEarningsCard";
import { WeeklyEarningsChart } from "../components/driver/WeeklyEarningsChart";
import { DriverRidesList } from "../components/driver/DriverRidesList";
import { DriverRealtimeStatus } from "../components/driver/DriverRealtimeStatus";
import { DriverNotifications } from "../components/driver/DriverNotifications";
import { DriverSubscriptionCard } from "../components/driver/DriverSubscriptionCard";
import { DriverSettingsPanel } from "../components/driver/DriverSettingsPanel";
import { CompleteRideDialog } from "../components/driver/CompleteRideDialog";
import { CancelRideDialog } from "../components/driver/CancelRideDialog";
import { RatePassengerDialog } from "../components/driver/RatePassengerDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import {
  ArrowLeft,
  Car,
  Satellite,
  Star,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  Shield,
  Bell,
  Settings,
  History,
  Zap,
  Navigation,
  Power,
  MapPin,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function MotoristaPage() {
  const hook = useMotoristaPage();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [selectedPeriod, setSelectedPeriod] = React.useState<
    "today" | "week" | "month" | "total" | null
  >(null);

  // Definir contexto driver ao montar, limpar ao desmontar
  useEffect(() => {
    setModuleContext('driver');
    return () => setModuleContext(null);
  }, [setModuleContext]);

  if (!hook.isDriver) {
    return (
      <>
        <DriverRegistrationCTA
          onRegister={() => hook.setIsRegOpen(true)}
          onGoBack={hook.handleGoBack}
        />
        <DriverRegistrationModal
          open={hook.isRegOpen}
          onOpenChange={hook.setIsRegOpen}
          onRegister={() => hook.setIsDriver(true)}
        />
      </>
    );
  }

  if (hook.error && !hook.isDriver) {
    return (
      <ErrorBoundary onReset={() => window.location.reload()}>
        <div className="bg-background">
          <PremiumDriverHeader {...hook} hook={hook} />
          <div className="max-w-lg mx-auto px-4 py-8">
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

  const tabItems = [
    {
      id: "corridas",
      label: "Viagens",
      icon: Car,
      count: hook.availableRides.length + hook.acceptedByMe.length,
    },
    { id: "ganhos", label: "R$", icon: Wallet },
    { id: "planos", label: "Plano", icon: Crown },
    { id: "alertas", label: "Avisos", icon: Bell },
    { id: "config", label: "Config", icon: Settings },
  ];

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <div className="bg-background">
        {/* Banner de Deprecação */}
        <div className="bg-warning/10 border-b border-warning/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning text-sm">
              <span className="font-semibold">⚠️ Versao V1</span>
              <span>Esta é a versão antiga do painel. Use a versão oficial.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = '/mobilidade/motorista'}
              className="border-warning/30 text-warning hover:bg-warning/10"
            >
              Ir para Nova Versão
            </Button>
          </div>
        </div>

        <PremiumDriverHeader {...hook} hook={hook} />

        <motion.div
          className="max-w-7xl mx-auto px-4 pb-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <DriverSuspensionAlert />

          {/* Autoria explícita */}
          {effectiveProfile && (
            <motion.div variants={fadeUp} className="mb-2">
              <ActiveProfileBadge profile={effectiveProfile} action="operando como" />
            </motion.div>
          )}

          {/* Tabs fixas */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-1 p-0.5 rounded-xl bg-card border border-border mb-2"
          >
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => hook.setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[0.65rem] font-bold transition-all",
                  hook.activeTab === tab.id
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-3 w-3" />
                <span className="hidden min-[380px]:inline">{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full text-[0.5rem] flex items-center justify-center font-bold",
                      hook.activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Conteúdo das tabs */}
          <Tabs value={hook.activeTab} onValueChange={hook.setActiveTab}>
            <TabsContent value="corridas" className="m-0">
              <DriverRidesTab
                isDriverOnline={hook.isDriverOnline}
                isTracking={hook.isTracking}
                gpsError={hook.gpsError || null}
                currentDriverId={hook.currentDriverId}
                acceptedRides={hook.acceptedByMe}
                availableRides={hook.availableRides}
                loading={hook.loading}
                isSuspended={hook.isSuspended}
                canAcceptRideOffers={true}
                canAcceptDeliveryOffers={true}
                offerModeFilter={"all"}
                onOfferModeFilterChange={() => undefined}
                onToggleOnline={hook.toggleDriverOnline}
                onAcceptRide={hook.acceptRide}
                onStartRide={hook.startRide}
                onCompleteRide={(rideId, ride) => {
                  if (ride) hook.handleOpenCompleteDialog(ride);
                }}
                onCancelRide={(id) => {
                  const ride = hook.acceptedByMe.find((r) => r.id === id);
                  if (ride) hook.handleOpenCancelDialog(ride);
                }}
              />
            </TabsContent>

            <TabsContent value="ganhos" className="m-0">
              {selectedPeriod ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => setSelectedPeriod(null)}
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
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
            </TabsContent>

            <TabsContent value="planos" className="m-0">
              <DriverSubscriptionCard currentPlan="prioritario" />
            </TabsContent>

            <TabsContent value="alertas" className="m-0">
              <DriverNotifications />
            </TabsContent>

            <TabsContent value="config" className="m-0">
              <DriverSettingsPanel />
            </TabsContent>
          </Tabs>
        </motion.div>

        <DriverRegistrationModal
          open={hook.isRegOpen}
          onOpenChange={hook.setIsRegOpen}
          onRegister={() => hook.setIsDriver(true)}
        />
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

/* ─── Premium Driver Header ─── */

function PremiumDriverHeader({
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
  hook: any;
}) {
  const { unreadCount } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });

  return (
    <div className="bg-card border-b border-border flex-shrink-0">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
              <Car className="h-4 w-4 text-warning" />
            </div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">
              Motorista
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {inProgressCount > 0 && (
            <Badge className="bg-warning/15 text-warning text-[0.6rem] px-2 rounded-full animate-pulse border-0">
              {inProgressCount} ativa{inProgressCount > 1 ? "s" : ""}
            </Badge>
          )}

          {/* Stats inline - Sempre visível */}
          <div className="flex items-center gap-2 lg:gap-3">
            {[
              {
                icon: Star,
                value: hook.driverStats.avgRating.toFixed(1),
                label: "★",
                color: "text-warning",
              },
              {
                icon: TrendingUp,
                value: hook.driverStats.totalRides,
                label: "Viagens",
                color: "text-primary",
              },
              {
                icon: CheckCircle2,
                value: `${hook.driverStats.acceptanceRate}%`,
                label: "OK",
                color: "text-success",
              },
            ].map((s) => (
              <div key={s.label} className="text-center px-1 lg:px-2">
                <p
                  className={cn(
                    "text-[0.6rem] lg:text-xs font-bold leading-none",
                    s.color,
                  )}
                >
                  {s.value}
                </p>
                <p className="text-[0.45rem] lg:text-[0.5rem] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {isDriverOnline && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[0.6rem] font-bold",
                isLoadingDriverId
                  ? "bg-warning/10 text-warning"
                  : isTracking
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
              )}
            >
              <Satellite
                className={cn(
                  "h-3 w-3",
                  isLoadingDriverId
                    ? "animate-spin"
                    : isTracking && "animate-pulse",
                )}
              />
              {isLoadingDriverId ? "..." : isTracking ? "GPS" : "!GPS"}
            </div>
          )}

          {/* Notificações */}
          <button
            onClick={() => hook.setActiveTab("alertas")}
            className="relative p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[0.5rem] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Online Toggle — Premium style */}
          <button
            onClick={toggleDriverOnline}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs",
              isDriverOnline
                ? "bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/30"
                : "bg-secondary/80 text-muted-foreground border border-border hover:border-success/30 hover:text-success",
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isDriverOnline
                  ? "bg-success animate-pulse"
                  : "bg-muted-foreground/40",
              )}
            />
            {isDriverOnline ? "Online" : "Offline"}
          </button>
        </div>
      </div>
    </div>
  );
}

