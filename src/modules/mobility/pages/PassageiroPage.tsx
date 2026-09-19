/**
 * Painel do Passageiro - mobile-first
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isOpenRideStatus,
  isPreAcceptRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { PASSENGER_PAGE_LABELS } from "@/core/mobility/constants/passengerPageLabels";
import type { RideRequest } from "@/core/mobility/types";
import { useMobilidade } from "@/modules/mobility/hooks/useMobilidade";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { RIDE_STATUS } from "@/shared/types/constants";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ChevronRight,
  History,
  Navigation,
  Package,
  Plus,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CreateDeliveryModal } from "../components/CreateDeliveryModal";
import { CreateRideModal } from "../components/CreateRideModal";
import { EmergencyButton } from "../components/EmergencyButton";
import { ErrorBoundary } from "@/shared/components/errors/ErrorBoundary";
import { ErrorState } from "../components/ErrorState";
import { RideHistoryUnified } from "../components/RideHistoryUnified";
import { CancelRideDialog } from "../components/driver/CancelRideDialog";
import { ActiveRideCard } from "../components/passenger/ActiveRideCard";
import { RateDriverModal } from "../components/passenger/RateDriverModal";
import { RideCompletionConfirmation } from "../components/passenger/RideCompletionConfirmation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

type ActiveTab = "ativas" | "historico" | "seguranca";

export default function PassageiroPage() {
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const {
    myRides,
    createRide,
    cancelRide,
    rateRide,
    confirmRideCompletion,
    reportRideProblem,
    error,
    refetch,
    passengerRating = 0,
  } = useMobilidade({ realtimeEnabled: true });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeliveryCreateOpen, setIsDeliveryCreateOpen] = useState(false);
  const [ratingRide, setRatingRide] = useState<RideRequest | null>(null);
  const [confirmationRide, setConfirmationRide] = useState<RideRequest | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<RideRequest | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ativas");

  const activeRides = myRides.filter((ride) => isOpenRideStatus(ride.status));

  useEffect(() => {
    if (activeRides.length > 0) {
      setActiveTab("ativas");
    }
  }, [activeRides.length]);

  const completedRides = myRides.filter(
    (ride) => ride.status === RIDE_STATUS.COMPLETED,
  );
  const needsRating = completedRides.filter((ride) => ride.rating == null);
  const needsConfirmation = completedRides.filter(
    (ride) => !ride.passenger_confirmed,
  );
  const pendingConfirmationRide = needsConfirmation[0] ?? null;

  useEffect(() => {
    if (pendingConfirmationRide && !confirmationRide) {
      setConfirmationRide(pendingConfirmationRide);
    }
  }, [confirmationRide, pendingConfirmationRide]);

  const handleOpenCancelDialog = (ride: RideRequest) => {
    setRideToCancel(ride);
    setCancelDialogOpen(true);
  };

  const handleCancelRide = async (reason: string) => {
    if (!rideToCancel) return;
    const success = await cancelRide(rideToCancel.id, reason);
    if (success) {
      setCancelDialogOpen(false);
      setRideToCancel(null);
    }
  };

  const stats = {
    total: myRides.length,
    completed: completedRides.length,
    avgRating: passengerRating,
  };

  if (error) {
    return (
      <ErrorBoundary onReset={() => window.location.reload()}>
        <div className="bg-background">
          <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-xl border-border">
            <div className="max-w-lg mx-auto h-14 px-4 flex items-center gap-3">
              <button
                onClick={() => navigate(mobilityUrls.home)}
                className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                aria-label={PASSENGER_PAGE_LABELS.BUTTON_BACK}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-sm font-bold text-foreground">
                {PASSENGER_PAGE_LABELS.ERROR_TITLE}
              </h1>
            </div>
          </div>
          <div className="max-w-lg mx-auto px-4 py-8">
            <ErrorState
              error={
                error
                  ? new Error(error)
                  : new Error(PASSENGER_PAGE_LABELS.ERROR_UNKNOWN)
              }
              onRetry={() => refetch()}
              title={PASSENGER_PAGE_LABELS.ERROR_TITLE}
              description={PASSENGER_PAGE_LABELS.ERROR_DESCRIPTION}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: LucideIcon;
    count?: number;
  }[] = [
    {
      id: "ativas",
      label: PASSENGER_PAGE_LABELS.TAB_ACTIVE,
      icon: Navigation,
      count: activeRides.length || undefined,
    },
    {
      id: "historico",
      label: PASSENGER_PAGE_LABELS.TAB_HISTORY,
      icon: History,
    },
    {
      id: "seguranca",
      label: PASSENGER_PAGE_LABELS.TAB_SECURITY,
      icon: Shield,
    },
  ];

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <div className="bg-background">
        <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-2xl border-b border-border">
          <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(mobilityUrls.home)}
                className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-sm font-bold text-foreground tracking-tight">
                  {PASSENGER_PAGE_LABELS.HEADER_TITLE}
                </h1>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl text-xs h-9 px-4 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {PASSENGER_PAGE_LABELS.BUTTON_NEW}
            </Button>
          </div>
        </div>

        <motion.div
          className="max-w-lg mx-auto px-4 pt-5 pb-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
          >
            <button
              onClick={() => setIsCreateOpen(true)}
              className="relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group active:scale-[0.98]"
              aria-label={PASSENGER_PAGE_LABELS.ACTION_REQUEST_RIDE_ARIA}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">
                {PASSENGER_PAGE_LABELS.ACTION_REQUEST_RIDE_TITLE}
              </p>
              <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                {PASSENGER_PAGE_LABELS.ACTION_REQUEST_RIDE_SUBTITLE}
              </p>
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </button>
            <button
              onClick={() => setIsDeliveryCreateOpen(true)}
              className="relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all group active:scale-[0.98]"
              aria-label={PASSENGER_PAGE_LABELS.ACTION_SEND_DELIVERY_ARIA}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-bold text-foreground">
                {PASSENGER_PAGE_LABELS.ACTION_SEND_DELIVERY_TITLE}
              </p>
              <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                {PASSENGER_PAGE_LABELS.ACTION_SEND_DELIVERY_SUBTITLE}
              </p>
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5 text-accent" />
              </div>
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 mb-5 overflow-x-auto pb-1"
          >
            {[
              {
                icon: Car,
                value: stats.total,
                label: PASSENGER_PAGE_LABELS.STAT_TRIPS_LABEL,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: CheckCircle2,
                value: stats.completed,
                label: PASSENGER_PAGE_LABELS.STAT_COMPLETED_LABEL,
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                icon: Star,
                value:
                  stats.avgRating > 0
                    ? stats.avgRating.toFixed(1)
                    : "Sem avaliações",
                label: PASSENGER_PAGE_LABELS.STAT_RATING_LABEL,
                color: "text-warning",
                bg: "bg-warning/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-card border border-border min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-bold leading-none", stat.color)}>
                    {stat.value}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground mt-0.5 truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {needsRating.length > 0 && (
            <motion.div variants={fadeUp}>
              <button
                onClick={() => setRatingRide(needsRating[0])}
                className="w-full mb-5 p-4 rounded-2xl bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 flex items-center gap-3 text-left hover:border-warning/40 transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-warning fill-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {PASSENGER_PAGE_LABELS.RATING_ALERT_TITLE}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {PASSENGER_PAGE_LABELS.RATING_ALERT_SUBTITLE(needsRating.length)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge className="bg-warning/20 text-warning border-0 text-[0.6rem] rounded-full">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {PASSENGER_PAGE_LABELS.RATING_ALERT_BADGE}
                  </Badge>
                </div>
              </button>
            </motion.div>
          )}

          <motion.div
            variants={fadeUp}
            className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border mb-5"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full text-[0.55rem] flex items-center justify-center font-bold",
                      activeTab === tab.id
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

          <AnimatePresence mode="wait">
            {activeTab === "ativas" && (
              <motion.div
                key="ativas"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {activeRides.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Navigation className="h-8 w-8 text-primary/50" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1.5">
                      {PASSENGER_PAGE_LABELS.ACTIVE_EMPTY_TITLE}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[220px] mx-auto mb-5">
                      {PASSENGER_PAGE_LABELS.ACTIVE_EMPTY_SUBTITLE}
                    </p>
                    <Button
                      onClick={() => setIsCreateOpen(true)}
                      className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {PASSENGER_PAGE_LABELS.ACTIVE_EMPTY_BUTTON}
                    </Button>
                  </div>
                ) : (
                  activeRides.map((ride) => {
                    const isPreAccept = isPreAcceptRideStatus(ride.status);

                    return (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {isPreAccept ? (
                          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-5 text-center">
                            <div className="flex items-center justify-center mb-3">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                  <Car className="h-7 w-7 text-primary" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-1">
                              {PASSENGER_PAGE_LABELS.SEARCHING_TITLE}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-1">
                              {ride.origin || "Origem"}{" "}
                              {PASSENGER_PAGE_LABELS.SEARCHING_ROUTE_SEPARATOR}{" "}
                              {ride.destination || "Destino"}
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">
                              {PASSENGER_PAGE_LABELS.SEARCHING_SUBTITLE}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCancelDialog(ride)}
                              className="mt-4 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              {PASSENGER_PAGE_LABELS.SEARCHING_CANCEL_BUTTON}
                            </Button>
                          </div>
                        ) : (
                          <ActiveRideCard
                            ride={ride}
                            onCancel={(id) => {
                              const activeRide = activeRides.find(
                                (candidate) => candidate.id === id,
                              );
                              if (activeRide) handleOpenCancelDialog(activeRide);
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {activeTab === "historico" && (
              <motion.div
                key="historico"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <RideHistoryUnified
                  variant="compact"
                  onRate={(ride) => setRatingRide(ride)}
                />
              </motion.div>
            )}

            {activeTab === "seguranca" && (
              <motion.div
                key="seguranca"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <EmergencyButton ride={activeRides[0]} variant="full" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {activeTab !== "ativas" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-20 right-4 z-40"
          >
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}

        <CreateRideModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={async (data) => {
            const ride = (await createRide(data)) as { id?: string } | null;
            if (ride?.id) {
              navigate(mobilityUrls.passageiro.buscando(ride.id));
            }
          }}
        />
        <CreateDeliveryModal
          open={isDeliveryCreateOpen}
          onOpenChange={setIsDeliveryCreateOpen}
          sourceType="passenger"
        />
        <RateDriverModal
          ride={ratingRide}
          onClose={() => setRatingRide(null)}
          onRate={rateRide}
        />
        <RideCompletionConfirmation
          open={Boolean(confirmationRide)}
          onOpenChange={(open) => !open && setConfirmationRide(null)}
          ride={confirmationRide}
          onConfirm={(rideId: string) => confirmRideCompletion(rideId)}
          onReportProblem={(rideId: string, problem: string) =>
            reportRideProblem(rideId, problem)
          }
        />
        <CancelRideDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          rideId={rideToCancel?.id || ""}
          onConfirm={handleCancelRide}
          isDriver={false}
        />
      </div>
    </ErrorBoundary>
  );
}
