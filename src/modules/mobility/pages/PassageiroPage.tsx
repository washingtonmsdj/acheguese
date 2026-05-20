/**
 * Painel do Passageiro - mobile-first
 * UI superior a Uber/99, otimizada para mobile
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMobilidade } from "@/modules/mobility/hooks/useMobilidade";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { RIDE_STATUS } from "@/shared/types/constants";
import { PASSENGER_PAGE_LABELS } from "@/modules/mobility/constants/passengerPageLabels";
import { CreateRideModal } from "../components/CreateRideModal";
import { RideHistoryUnified } from "../components/RideHistoryUnified";
import { RateDriverModal } from "../components/passenger/RateDriverModal";
import { RideCompletionConfirmation } from "../components/passenger/RideCompletionConfirmation";
import { CancelRideDialog } from "../components/driver/CancelRideDialog";
import { ActiveRideCard } from "../components/passenger/ActiveRideCard";
import { RideTrackingMap } from "../components/RideTrackingMap";
import { EmergencyButton } from "../components/EmergencyButton";
import { toast } from "sonner";
import { trackError } from "@/shared/utils/errorTracking";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Plus,
  ArrowLeft,
  MapPin,
  History,
  Star,
  CheckCircle2,
  Shield,
  Package,
  Navigation,
  Clock,
  Zap,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/modules/mobility/types";
import { ErrorBoundary, ErrorState } from "../components/ErrorBoundary";

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

const ACTIVE_RIDE_STATUSES: string[] = [
  RIDE_STATUS.PENDING,
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
  RIDE_STATUS.PASSENGER_BOARDED,
  RIDE_STATUS.PASSENGER_ON_BOARD,
  RIDE_STATUS.IN_PROGRESS,
];

const SEARCHING_RIDE_STATUSES: string[] = [
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.REQUESTED,
];

const TRACKABLE_RIDE_STATUSES: string[] = [
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.PASSENGER_BOARDED,
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
  RIDE_STATUS.IN_PROGRESS,
];

export default function PassageiroPage() {
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const {
    myRides,
    createRideRequest,
    cancelRide,
    rateRide,
    confirmRideCompletion,
    reportRideProblem,
    error,
    refetch,
    passengerRating = 5.0, // SSOT: rating vem do hook.
  } = useMobilidade();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<"viagem" | "entrega">("viagem");
  const [ratingRide, setRatingRide] = useState<RideRequest | null>(null);
  const [confirmationRide, setConfirmationRide] = useState<RideRequest | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<RideRequest | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ativas");

  const activeRides = myRides.filter((r) => ACTIVE_RIDE_STATUSES.includes(r.status));

  // Auto-switch para aba "Ativas" quando ha corrida ativa.
  useEffect(() => {
    if (activeRides.length > 0) {
      setActiveTab("ativas");
    }
  }, [activeRides.length]);
  const completedRides = myRides.filter(
    (r) => r.status === RIDE_STATUS.COMPLETED,
  );
  const cancelledRides = myRides.filter(
    (r) => r.status === RIDE_STATUS.CANCELLED || 
           r.status === RIDE_STATUS.CANCELLED_BY_PASSENGER || 
           r.status === RIDE_STATUS.CANCELLED_BY_DRIVER,
  );
  const needsRating = completedRides.filter((r) => !r.rating);
  const needsConfirmation = completedRides.filter(
    (r) => !r.passenger_confirmed,
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
              error={error ? new Error(error) : new Error(PASSENGER_PAGE_LABELS.ERROR_UNKNOWN)}
              onRetry={() => refetch()}
              title={PASSENGER_PAGE_LABELS.ERROR_TITLE}
              description={PASSENGER_PAGE_LABELS.ERROR_DESCRIPTION}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: LucideIcon; count?: number }[] = [
    {
      id: "ativas",
      label: PASSENGER_PAGE_LABELS.TAB_ACTIVE,
      icon: Navigation,
      count: activeRides.length || undefined,
    },
    { id: "historico", label: PASSENGER_PAGE_LABELS.TAB_HISTORY, icon: History },
    { id: "seguranca", label: PASSENGER_PAGE_LABELS.TAB_SECURITY, icon: Shield },
  ];

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <div className="bg-background">
        {/* Header */}
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
              onClick={() => {
                setCreateModalInitialType("viagem");
                setIsCreateOpen(true);
              }}
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
          {/* Quick actions */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => {
                setCreateModalInitialType("viagem");
                setIsCreateOpen(true);
              }}
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
              onClick={() => {
                setCreateModalInitialType("entrega");
                setIsCreateOpen(true);
              }}
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

          {/* Stats strip */}
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
                value: stats.avgRating.toFixed(1),
                label: PASSENGER_PAGE_LABELS.STAT_RATING_LABEL,
                color: "text-warning",
                bg: "bg-warning/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-card border border-border min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                    s.bg,
                  )}
                >
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-bold leading-none", s.color)}>
                    {s.value}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground mt-0.5 truncate">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Rating Alert */}
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

          {/* Tab navigation */}
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

          {/* Tab Content */}
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
                      onClick={() => {
                        setCreateModalInitialType("viagem");
                        setIsCreateOpen(true);
                      }}
                      className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      <Zap className="h-4 w-4 mr-2" /> {PASSENGER_PAGE_LABELS.ACTIVE_EMPTY_BUTTON}
                    </Button>
                  </div>
                ) : (
                  activeRides.map((ride) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Card de busca proeminente para searching_driver/requested */}
                      {SEARCHING_RIDE_STATUSES.includes(ride.status) && (
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
                            {ride.origin || "Origem"} {PASSENGER_PAGE_LABELS.SEARCHING_ROUTE_SEPARATOR} {ride.destination || "Destino"}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground">
                            {PASSENGER_PAGE_LABELS.SEARCHING_SUBTITLE}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const r = activeRides.find((x) => x.id === ride.id);
                              if (r) handleOpenCancelDialog(r);
                            }}
                            className="mt-4 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            {PASSENGER_PAGE_LABELS.SEARCHING_CANCEL_BUTTON}
                          </Button>
                        </div>
                      )}

                      {/* Card normal para outros estados */}
                      {!SEARCHING_RIDE_STATUSES.includes(ride.status) && (
                        <ActiveRideCard
                          ride={ride}
                          onCancel={(id) => {
                            const r = activeRides.find((x) => x.id === id);
                            if (r) handleOpenCancelDialog(r);
                          }}
                          onContact={() => toast.info(PASSENGER_PAGE_LABELS.TOAST_OPENING_CHAT)}
                        />
                      )}

                      {ride.driver_profile_id &&
                        TRACKABLE_RIDE_STATUSES.includes(ride.status) && (
                          <div className="rounded-2xl overflow-hidden border border-border">
                            <RideTrackingMap
                              driverProfileId={ride.driver_profile_id}
                              rideId={ride.id}
                              destinationLat={ride.destination_lat}
                              destinationLon={ride.destination_lng}
                              originLat={ride.origin_lat}
                              originLon={ride.origin_lng}
                              showETA
                            />
                          </div>
                        )}
                    </motion.div>
                  ))
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

        {/* Floating action button */}
        {activeTab !== "ativas" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-20 right-4 z-40"
          >
            <Button
              onClick={() => {
                setCreateModalInitialType("viagem");
                setIsCreateOpen(true);
              }}
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
          initialType={createModalInitialType}
          onSubmit={async (data) => {
            const ride = await createRideRequest(data) as { id?: string } | null;
            if (ride?.id) {
              navigate(`/mobilidade/buscando/${ride.id}`);
            }
          }}
        />
        <RateDriverModal
          ride={ratingRide}
          onClose={() => setRatingRide(null)}
          onRate={rateRide}
        />
        <RideCompletionConfirmation
          open={!!confirmationRide}
          onOpenChange={(open) => !open && setConfirmationRide(null)}
          ride={confirmationRide}
          onConfirm={async (rideId: string) => {
            await confirmRideCompletion(rideId);
          }}
          onReportProblem={async (rideId: string, problem: string) => {
            await reportRideProblem(rideId, problem);
          }}
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
