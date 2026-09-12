/**
 * RideHistoryUnified - histórico consolidado de viagens e entregas.
 *
 * Lifecycle/status authority pertence a RideLifecycleStatus e StatusBadge.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import {
  isCancelledRideStatus,
  isClosedRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { mobilityService } from "@/core/mobility/services/MobilityService";
import { MobilityTrustService } from "@/core/mobility/services/MobilityTrustService";
import {
  MOBILITY_QUERY_KEYS,
  RIDE_MODE,
  RIDE_STATUS,
} from "@/core/mobility/constants";
import type { RideRequest } from "@/core/mobility/types/types";
import {
  TRUST_ACTOR_ROLES,
  TrustFeedbackForm,
  type TrustFeedbackReason,
  type TrustFeedbackTarget,
} from "@/core/trust";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatBrl } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/cn";
import { ptBR } from "@/shared/utils/dateLocale";
import { format } from "date-fns";
import {
  Award,
  Calendar,
  Car,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Package,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const PASSENGER_FEEDBACK_REASONS: TrustFeedbackReason[] = [
  { value: "smooth_operation", label: "Atendimento correto / sem problema", severity: "low" },
  { value: "driver_delay", label: "Motorista/motoboy atrasou", severity: "medium" },
  { value: "unsafe_behavior", label: "Conduta insegura", severity: "critical" },
  { value: "route_or_delivery_issue", label: "Problema na rota ou entrega", severity: "medium" },
  { value: "package_or_vehicle_issue", label: "Problema com pacote ou veiculo", severity: "high" },
  { value: "abusive_behavior", label: "Conduta abusiva", severity: "critical" },
  { value: "other_operational_issue", label: "Outro problema operacional", severity: "medium" },
];

interface RideHistoryUnifiedProps {
  onRate?: (ride: RideRequest) => void;
  variant?: "full" | "compact";
  initialTypeFilter?: "all" | "viagem" | "motoboy";
}

export function RideHistoryUnified({
  onRate,
  variant = "full",
  initialTypeFilter = "all",
}: RideHistoryUnifiedProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<"all" | "viagem" | "motoboy">(
    initialTypeFilter,
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "cancelled"
  >("all");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: rides = [], isLoading } = useQuery<RideRequest[]>({
    queryKey: MOBILITY_QUERY_KEYS.rideHistory(user?.id || ""),
    queryFn: async () => {
      if (!user) return [];
      const allRides = await mobilityService.getUserRides(user.id);
      return (allRides || []).filter((ride) => isClosedRideStatus(ride.status));
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      if (filterType === "viagem" && ride.ride_mode !== RIDE_MODE.RIDE) return false;
      if (filterType === "motoboy" && ride.ride_mode !== RIDE_MODE.MOTOBOY) return false;

      if (filterStatus === "completed" && ride.status !== RIDE_STATUS.COMPLETED) {
        return false;
      }
      if (filterStatus === "cancelled" && !isCancelledRideStatus(ride.status)) {
        return false;
      }

      const realizedPrice = ride.final_price ?? 0;
      if (filterPriceMin && realizedPrice < Number.parseFloat(filterPriceMin)) return false;
      if (filterPriceMax && realizedPrice > Number.parseFloat(filterPriceMax)) return false;

      const rideDate = new Date(ride.updated_at);
      if (filterDateStart && rideDate < new Date(filterDateStart)) return false;
      if (filterDateEnd && rideDate > new Date(`${filterDateEnd}T23:59:59`)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchOrigin = ride.pickup_address?.toLowerCase().includes(query);
        const matchDestination = ride.dropoff_address?.toLowerCase().includes(query);
        const matchDriver = ride.driver_profile?.name?.toLowerCase().includes(query);
        if (!matchOrigin && !matchDestination && !matchDriver) return false;
      }

      return true;
    });
  }, [
    rides,
    filterType,
    filterStatus,
    filterPriceMin,
    filterPriceMax,
    filterDateStart,
    filterDateEnd,
    searchQuery,
  ]);

  const paginatedRides = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRides.slice(start, start + pageSize);
  }, [filteredRides, page]);

  const stats = useMemo(() => {
    const completed = filteredRides.filter(
      (ride) => ride.status === RIDE_STATUS.COMPLETED,
    );
    return {
      total: filteredRides.length,
      completed: completed.length,
      cancelled: filteredRides.filter((ride) =>
        isCancelledRideStatus(ride.status),
      ).length,
      totalSpent: completed.reduce(
        (sum, ride) => sum + (ride.final_price ?? 0),
        0,
      ),
    };
  }, [filteredRides]);

  const hasActiveFilters = Boolean(
    filterType !== "all" ||
      filterStatus !== "all" ||
      filterPriceMin ||
      filterPriceMax ||
      filterDateStart ||
      filterDateEnd ||
      searchQuery,
  );

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchQuery("");
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold mb-1">Nenhum histórico</h3>
        <p className="text-xs text-muted-foreground">
          Suas viagens e entregas encerradas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {variant === "full" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold">{formatBrl(stats.totalSpent)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(hasActiveFilters && "border-primary text-primary")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 bg-primary/20 text-primary text-xs px-1.5 h-4 rounded-full">
                  ativo
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por origem, destino ou motorista..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <div className="flex gap-2">
                  {[
                    { value: "all" as const, label: "Todos" },
                    { value: "viagem" as const, label: "Viagem" },
                    { value: "motoboy" as const, label: "Motoboy" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => setFilterType(option.value)}
                      variant={filterType === option.value ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  {[
                    { value: "all" as const, label: "Todos" },
                    { value: "completed" as const, label: "Concluídas" },
                    { value: "cancelled" as const, label: "Canceladas" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => setFilterStatus(option.value)}
                      variant={filterStatus === option.value ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Faixa de valor final</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={filterPriceMin}
                  onChange={(event) => setFilterPriceMin(event.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={filterPriceMax}
                  onChange={(event) => setFilterPriceMax(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Período
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filterDateStart}
                  onChange={(event) => setFilterDateStart(event.target.value)}
                />
                <Input
                  type="date"
                  value={filterDateEnd}
                  onChange={(event) => setFilterDateEnd(event.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredRides.length} {filteredRides.length === 1 ? "resultado" : "resultados"}
        </span>
        {hasActiveFilters && <span className="text-primary">Filtros ativos</span>}
      </div>

      {filteredRides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Nenhum resultado encontrado com esses filtros
            </p>
            <Button onClick={clearFilters} variant="link" size="sm">
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedRides.map((ride) => {
            const isCompleted = ride.status === RIDE_STATUS.COMPLETED;
            const isCancelled = isCancelledRideStatus(ride.status);
            const isMotoboy = ride.ride_mode === RIDE_MODE.MOTOBOY;
            const needsRating = isCompleted && onRate && !ride.driver_rating;
            const driverProfileId =
              typeof ride.driver_profile_id === "string" ? ride.driver_profile_id : null;
            const feedbackTargets: TrustFeedbackTarget[] = driverProfileId
              ? [
                  {
                    id: driverProfileId,
                    label: isMotoboy ? "Motoboy da entrega" : "Motorista da corrida",
                    subjectRole: isMotoboy
                      ? TRUST_ACTOR_ROLES.COURIER
                      : TRUST_ACTOR_ROLES.DRIVER,
                    helper:
                      "Feedback privado para confianca operacional e analise admin.",
                  },
                ]
              : [];

            return (
              <Card
                key={ride.id}
                className={cn(
                  "hover:shadow-md transition-shadow",
                  isCancelled && "opacity-70",
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={isMotoboy ? "secondary" : "default"}>
                        {isMotoboy ? (
                          <Package className="h-3 w-3 mr-1" />
                        ) : (
                          <Car className="h-3 w-3 mr-1" />
                        )}
                        {isMotoboy ? "Motoboy" : "Viagem"}
                      </Badge>
                      <StatusBadge status={ride.status} size="sm" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ride.updated_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <p className="text-sm font-medium">
                        {ride.pickup_address || "Origem"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                      <p className="text-sm font-medium">
                        {ride.dropoff_address || "Destino"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {ride.driver_profile?.name && (
                        <p className="text-sm text-muted-foreground">
                          Motorista: {ride.driver_profile.name}
                        </p>
                      )}
                      {ride.driver_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {typeof ride.driver_rating === "number"
                              ? ride.driver_rating.toFixed(1)
                              : ride.driver_rating.rating?.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor final</p>
                      <p className="text-2xl font-bold text-primary">
                        {ride.final_price == null ? "—" : formatBrl(ride.final_price)}
                      </p>
                    </div>
                  </div>

                  {isCancelled && ride.cancellation_reason && (
                    <p className="mt-3 text-xs text-destructive italic">
                      Motivo: {ride.cancellation_reason}
                    </p>
                  )}

                  {needsRating && (
                    <Button
                      onClick={() => onRate(ride)}
                      size="sm"
                      className="mt-3 w-full"
                      variant="outline"
                    >
                      <Star className="h-4 w-4 mr-2" /> Avaliar Motorista
                    </Button>
                  )}

                  {isCompleted && feedbackTargets.length > 0 && (
                    <div className="mt-4">
                      <TrustFeedbackForm
                        title={isMotoboy ? "Avaliar motoboy" : "Avaliar motorista"}
                        notice="Feedback privado operacional. Reviews publicos e nota operacional continuam separados."
                        targets={feedbackTargets}
                        reasons={PASSENGER_FEEDBACK_REASONS}
                        enabled={isCompleted}
                        compact
                        onSubmit={(input) =>
                          MobilityTrustService.submitFeedback(ride.id, input)
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredRides.length > pageSize && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Página {page} de {Math.ceil(filteredRides.length / pageSize)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={page >= Math.ceil(filteredRides.length / pageSize)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
