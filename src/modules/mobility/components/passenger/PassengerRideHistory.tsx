import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Car,
  Clock,
  DollarSign,
  Filter,
  Package,
  Search,
  Star,
} from "lucide-react";

import { isCancelledRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import type { RideRequest } from "@/core/mobility/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { getPaymentMethodLabel, RIDE_STATUS } from "@/shared/types/constants";
import { cn } from "@/shared/utils/cn";
import { formatBrl, formatBrlNoCents } from "@/shared/utils/currency";
import { StatusBadge } from "../StatusBadge";

type PassengerRide = RideRequest & {
  driver?: { name?: string | null; vehicle_plate?: string | null } | null;
  rating?: number | { rating?: number; comment?: string } | null;
  departure_time?: string | null;
  cancellation_reason?: string | null;
};

interface PassengerRideHistoryProps {
  completedRides: PassengerRide[];
  cancelledRides: PassengerRide[];
  onRate: (ride: PassengerRide) => void;
}

type RideTypeFilter = "all" | "viagem" | "entrega";
type RideStatusFilter = "all" | "completed" | "cancelled";

function getPassengerRideRatingMeta(rating: unknown): {
  numericRating: number | null;
  commentRating?: string;
} {
  if (typeof rating === "number" && Number.isFinite(rating)) {
    return { numericRating: rating };
  }

  if (rating && typeof rating === "object") {
    const typedRating = rating as { rating?: unknown; comment?: unknown };
    return {
      numericRating:
        typeof typedRating.rating === "number" &&
        Number.isFinite(typedRating.rating)
          ? typedRating.rating
          : null,
      commentRating:
        typeof typedRating.comment === "string" && typedRating.comment.trim()
          ? typedRating.comment.trim()
          : undefined,
    };
  }

  return { numericRating: null };
}

function isDeliveryRide(ride: PassengerRide): boolean {
  return (
    ride.type === "entrega" ||
    ride.type === "delivery" ||
    ride.ride_mode === "motoboy"
  );
}

function matchesRideType(
  ride: PassengerRide,
  filter: RideTypeFilter,
): boolean {
  if (filter === "all") return true;
  return filter === "entrega" ? isDeliveryRide(ride) : !isDeliveryRide(ride);
}

function getRidePrice(ride: PassengerRide): number | null {
  return ride.final_price ?? ride.suggested_price ?? null;
}

function getRideEventTimestamp(ride: PassengerRide): string {
  if (ride.status === RIDE_STATUS.COMPLETED && ride.completed_at) {
    return ride.completed_at;
  }
  if (isCancelledRideStatus(ride.status) && ride.cancelled_at) {
    return ride.cancelled_at;
  }
  return ride.updated_at;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PassengerRideHistory({
  completedRides,
  cancelledRides,
  onRate,
}: PassengerRideHistoryProps) {
  const [filterType, setFilterType] = useState<RideTypeFilter>("all");
  const [filterStatus, setFilterStatus] = useState<RideStatusFilter>("all");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allRides = useMemo<PassengerRide[]>(() => {
    return [...completedRides, ...cancelledRides].sort(
      (a, b) =>
        new Date(getRideEventTimestamp(b)).getTime() -
        new Date(getRideEventTimestamp(a)).getTime(),
    );
  }, [completedRides, cancelledRides]);

  const filteredRides = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const minPrice = filterPriceMin ? Number(filterPriceMin) : null;
    const maxPrice = filterPriceMax ? Number(filterPriceMax) : null;
    const startDate = filterDateStart ? new Date(`${filterDateStart}T00:00:00`) : null;
    const endDate = filterDateEnd ? new Date(`${filterDateEnd}T23:59:59`) : null;

    return allRides.filter((ride) => {
      if (!matchesRideType(ride, filterType)) return false;

      if (
        filterStatus === "completed" &&
        ride.status !== RIDE_STATUS.COMPLETED
      ) {
        return false;
      }
      if (
        filterStatus === "cancelled" &&
        !isCancelledRideStatus(ride.status)
      ) {
        return false;
      }

      const price = getRidePrice(ride);
      if (minPrice != null && Number.isFinite(minPrice)) {
        if (price == null || price < minPrice) return false;
      }
      if (maxPrice != null && Number.isFinite(maxPrice)) {
        if (price == null || price > maxPrice) return false;
      }

      const rideDate = new Date(getRideEventTimestamp(ride));
      if (!Number.isNaN(rideDate.getTime())) {
        if (startDate && rideDate < startDate) return false;
        if (endDate && rideDate > endDate) return false;
      }

      if (normalizedSearch) {
        const matchOrigin = (ride.origin ?? ride.origin_address ?? "")
          .toLowerCase()
          .includes(normalizedSearch);
        const matchDestination = (
          ride.destination ??
          ride.destination_address ??
          ""
        )
          .toLowerCase()
          .includes(normalizedSearch);
        const matchDriver = (ride.driver?.name ?? "")
          .toLowerCase()
          .includes(normalizedSearch);
        if (!matchOrigin && !matchDestination && !matchDriver) return false;
      }

      return true;
    });
  }, [
    allRides,
    filterDateEnd,
    filterDateStart,
    filterPriceMax,
    filterPriceMin,
    filterStatus,
    filterType,
    searchQuery,
  ]);

  const stats = useMemo(() => {
    const completed = filteredRides.filter(
      (ride) => ride.status === RIDE_STATUS.COMPLETED,
    );
    const totalSpent = completed.reduce((sum, ride) => {
      const price = getRidePrice(ride);
      return price == null ? sum : sum + price;
    }, 0);

    return {
      total: filteredRides.length,
      completed: completed.length,
      cancelled: filteredRides.filter((ride) =>
        isCancelledRideStatus(ride.status),
      ).length,
      totalSpent,
    };
  }, [filteredRides]);

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchQuery("");
  };

  const hasActiveFilters = Boolean(
    filterType !== "all" ||
      filterStatus !== "all" ||
      filterPriceMin ||
      filterPriceMax ||
      filterDateStart ||
      filterDateEnd ||
      searchQuery,
  );

  if (allRides.length === 0) {
    return (
      <div className="py-16 text-center">
        <Clock
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Nenhum histórico
        </h3>
        <p className="text-xs text-muted-foreground">
          Suas operações concluídas ou canceladas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
          <p className="text-[0.6rem] uppercase text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-success">{stats.completed}</p>
          <p className="text-[0.6rem] uppercase text-muted-foreground">
            Concluídas
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-destructive">
            {stats.cancelled}
          </p>
          <p className="text-[0.6rem] uppercase text-muted-foreground">
            Canceladas
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-success">
            {formatBrlNoCents(stats.totalSpent)}
          </p>
          <p className="text-[0.6rem] uppercase text-muted-foreground">
            Gasto registrado
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por origem, destino ou motorista..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-border bg-card pl-9 text-foreground"
          />
        </div>
        <Button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          variant="outline"
          aria-expanded={showFilters}
          className={cn(
            "border-border",
            hasActiveFilters && "border-primary text-primary",
          )}
        >
          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
          Filtros
          {hasActiveFilters ? (
            <Badge className="ml-2 h-4 rounded-full bg-primary/20 px-1.5 text-[0.6rem] text-primary">
              ativo
            </Badge>
          ) : null}
        </Button>
      </div>

      {showFilters ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Tipo
              </span>
              <div className="flex gap-2" role="group" aria-label="Filtrar por tipo">
                {[
                  { value: "all" as const, label: "Todos" },
                  { value: "viagem" as const, label: "Viagem" },
                  { value: "entrega" as const, label: "Entrega" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filterType === option.value}
                    onClick={() => setFilterType(option.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      filterType === option.value
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Status
              </span>
              <div className="flex gap-2" role="group" aria-label="Filtrar por status">
                {[
                  { value: "all" as const, label: "Todos" },
                  { value: "completed" as const, label: "Concluídas" },
                  { value: "cancelled" as const, label: "Canceladas" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filterStatus === option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      filterStatus === option.value
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="passenger-history-price-min"
              className="text-xs font-semibold text-muted-foreground"
            >
              Faixa de preço
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="passenger-history-price-min"
                type="number"
                min="0"
                step="0.01"
                placeholder="Mínimo"
                value={filterPriceMin}
                onChange={(event) => setFilterPriceMin(event.target.value)}
                className="border-border bg-secondary/50 text-foreground"
              />
              <Input
                aria-label="Preço máximo"
                type="number"
                min="0"
                step="0.01"
                placeholder="Máximo"
                value={filterPriceMax}
                onChange={(event) => setFilterPriceMax(event.target.value)}
                className="border-border bg-secondary/50 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Período
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                aria-label="Data inicial"
                type="date"
                value={filterDateStart}
                onChange={(event) => setFilterDateStart(event.target.value)}
                className="border-border bg-secondary/50 text-foreground"
              />
              <Input
                aria-label="Data final"
                type="date"
                value={filterDateEnd}
                onChange={(event) => setFilterDateEnd(event.target.value)}
                className="border-border bg-secondary/50 text-foreground"
              />
            </div>
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              onClick={clearFilters}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredRides.length}{" "}
          {filteredRides.length === 1 ? "operação encontrada" : "operações encontradas"}
        </span>
        {hasActiveFilters ? <span className="text-primary">Filtros ativos</span> : null}
      </div>

      {filteredRides.length === 0 ? (
        <div className="py-12 text-center">
          <Filter
            className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Nenhuma operação encontrada com esses filtros.
          </p>
          <Button
            type="button"
            onClick={clearFilters}
            variant="link"
            className="mt-2 text-primary"
            size="sm"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => {
            const isCompleted = ride.status === RIDE_STATUS.COMPLETED;
            const isCancelled = isCancelledRideStatus(ride.status);
            const isDelivery = isDeliveryRide(ride);
            const needsRating = isCompleted && ride.rating == null;
            const ridePrice = getRidePrice(ride);
            const eventTimestamp = getRideEventTimestamp(ride);
            const eventTime = formatTime(eventTimestamp);
            const ratingMeta = getPassengerRideRatingMeta(ride.rating);
            const driverName = ride.driver?.name?.trim() || null;
            const vehiclePlate = ride.driver?.vehicle_plate?.trim() || null;

            return (
              <div
                key={ride.id}
                className={cn(
                  "rounded-2xl border bg-card p-4",
                  isCancelled ? "border-destructive/20" : "border-border",
                )}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.6rem] font-semibold",
                        isDelivery
                          ? "border-warning/30 bg-warning/10 text-warning"
                          : "border-category-mobility/30 bg-category-mobility/10 text-category-mobility",
                      )}
                    >
                      {isDelivery ? (
                        <Package className="mr-1 h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Car className="mr-1 h-3 w-3" aria-hidden="true" />
                      )}
                      {isDelivery ? "Entrega" : "Viagem"}
                    </Badge>
                    <StatusBadge status={ride.status} size="sm" />
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground">
                    {formatDate(eventTimestamp)}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {ride.origin || ride.origin_address || "Origem não informada"}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {ride.destination ||
                      ride.destination_address ||
                      "Destino não informado"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {eventTime ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {eventTime}
                    </div>
                  ) : null}
                  {ridePrice != null ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" aria-hidden="true" />
                      <span className="font-bold text-success">
                        {formatBrl(ridePrice)}
                      </span>
                    </div>
                  ) : null}
                  {ride.payment_method ? (
                    <span>{getPaymentMethodLabel(ride.payment_method)}</span>
                  ) : null}
                </div>

                {driverName || vehiclePlate ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-category-mobility/15 text-[0.55rem] font-bold text-category-mobility">
                      {(driverName || "M").charAt(0).toUpperCase()}
                    </div>
                    {driverName ? (
                      <span className="text-foreground">{driverName}</span>
                    ) : null}
                    {driverName && vehiclePlate ? <span aria-hidden="true">•</span> : null}
                    {vehiclePlate ? (
                      <span className="font-mono">{vehiclePlate}</span>
                    ) : null}
                  </div>
                ) : null}

                {ratingMeta.numericRating != null || ratingMeta.commentRating ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {ratingMeta.numericRating != null
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "h-3 w-3",
                              index < Math.round(ratingMeta.numericRating!)
                                ? "fill-warning text-warning"
                                : "text-muted-foreground/30",
                            )}
                            aria-hidden="true"
                          />
                        ))
                      : null}
                    {ratingMeta.commentRating ? (
                      <span className="ml-1 text-[0.6rem] italic text-muted-foreground">
                        “{ratingMeta.commentRating}”
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {isCancelled && ride.cancellation_reason?.trim() ? (
                  <p className="mt-2 text-[0.65rem] italic text-destructive/80">
                    Motivo: {ride.cancellation_reason.trim()}
                  </p>
                ) : null}

                {needsRating ? (
                  <Button
                    type="button"
                    onClick={() => onRate(ride)}
                    size="sm"
                    variant="outline"
                    className="mt-3 h-8 w-full rounded-xl border-warning/30 text-xs text-warning hover:bg-warning/10 hover:text-warning"
                  >
                    <Star className="mr-1.5 h-3 w-3" aria-hidden="true" />
                    Avaliar motorista
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
