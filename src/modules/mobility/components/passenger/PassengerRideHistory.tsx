import React, { useState, useMemo } from "react";
import {
  Car,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Star,
  Filter,
  Calendar,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/core/mobility/types";
import { RIDE_STATUS, PAYMENT_METHOD } from "@/shared/types/constants";

type PassengerRide = RideRequest & {
  driver?: { name?: string; vehicle_plate?: string } | null;
  rating?: number | { rating?: number; comment?: string } | null;
  departure_time?: string;
  cancellation_reason?: string | null;
};
interface PassengerRideHistoryProps {
  completedRides: PassengerRide[];
  cancelledRides: PassengerRide[];
  onRate: (ride: PassengerRide) => void;
}

export function PassengerRideHistory({
  completedRides,
  cancelledRides,
  onRate,
}: PassengerRideHistoryProps) {
  const [filterType, setFilterType] = useState<"all" | "viagem" | "entrega">(
    "all",
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

  const allRides = useMemo<PassengerRide[]>(() => {
    return [...completedRides, ...cancelledRides].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [completedRides, cancelledRides]);

  const filteredRides = useMemo(() => {
    return allRides.filter((ride) => {
      // Filtro de tipo
      if (filterType !== "all" && ride.type !== filterType) return false;

      // Filtro de status
      if (
        filterStatus === RIDE_STATUS.COMPLETED &&
        ride.status !== RIDE_STATUS.COMPLETED
      )
        return false;
      if (
        filterStatus === RIDE_STATUS.CANCELLED &&
        ride.status !== RIDE_STATUS.CANCELLED
      )
        return false;

      // Filtro de preço
      const price = ride.final_price || ride.suggested_price;
      if (filterPriceMin && price < parseFloat(filterPriceMin)) return false;
      if (filterPriceMax && price > parseFloat(filterPriceMax)) return false;

      // Filtro de data
      const rideDate = new Date(ride.updated_at);
      if (filterDateStart && rideDate < new Date(filterDateStart)) return false;
      if (filterDateEnd && rideDate > new Date(filterDateEnd + "T23:59:59"))
        return false;

      // Busca por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchOrigin = (ride.origin ?? "").toLowerCase().includes(query);
        const matchDestination = (ride.destination ?? "").toLowerCase().includes(query);
        const matchDriver = (ride.driver?.name ?? "").toLowerCase().includes(query);
        if (!matchOrigin && !matchDestination && !matchDriver) return false;
      }

      return true;
    });
  }, [
    allRides,
    filterType,
    filterStatus,
    filterPriceMin,
    filterPriceMax,
    filterDateStart,
    filterDateEnd,
    searchQuery,
  ]);

  const stats = useMemo(() => {
    const completed = filteredRides.filter(
      (r) => r.status === RIDE_STATUS.COMPLETED,
    );
      const totalSpent = completed.reduce(
      (sum, r) => sum + (r.final_price || r.suggested_price || 0),
      0,
    );
    return {
      total: filteredRides.length,
      completed: completed.length,
      cancelled: filteredRides.filter((r) => r.status === RIDE_STATUS.CANCELLED)
        .length,
      totalSpent,
    };
  }, [filteredRides]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    filterType !== "all" ||
    filterStatus !== "all" ||
    filterPriceMin ||
    filterPriceMax ||
    filterDateStart ||
    filterDateEnd ||
    searchQuery;

  if (allRides.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-white mb-1">
          Nenhum histórico
        </h3>
        <p className="text-xs text-gray-500">
          Suas viagens concluídas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-card border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
          <p className="text-[0.6rem] text-muted-foreground uppercase">Total</p>
        </div>
        <div className="bg-card border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-success">{stats.completed}</p>
          <p className="text-[0.6rem] text-muted-foreground uppercase">
            Concluídas
          </p>
        </div>
        <div className="bg-card border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-destructive">
            {stats.cancelled}
          </p>
          <p className="text-[0.6rem] text-muted-foreground uppercase">
            Canceladas
          </p>
        </div>
        <div className="bg-card border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-success">
            R$ {stats.totalSpent.toFixed(0)}
          </p>
          <p className="text-[0.6rem] text-muted-foreground uppercase">Gasto</p>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por origem, destino ou motorista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-foreground"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={cn(
            "border-border",
            hasActiveFilters && "border-primary text-primary",
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <Badge className="ml-2 bg-primary/20 text-primary text-[0.6rem] px-1.5 h-4 rounded-full">
              ativo
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border-border rounded-xl p-4 space-y-4">
          {/* Type and Status Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">
                Tipo
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all" as const, label: "Todos" },
                  { value: "viagem" as const, label: "Viagem" },
                  { value: "entrega" as const, label: "Entrega" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      filterType === opt.value
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">
                Status
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all" as const, label: "Todos" },
                  { value: "completed" as const, label: "Concluídas" },
                  { value: "cancelled" as const, label: "Canceladas" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      filterStatus === opt.value
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-semibold">
              Faixa de Preço
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-border text-muted-foreground hover:text-foreground"
              size="sm"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredRides.length}{" "}
          {filteredRides.length === 1 ? "viagem" : "viagens"} encontrada
          {filteredRides.length !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <span className="text-primary">Filtros ativos</span>
        )}
      </div>

      {/* Rides List */}
      {filteredRides.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma viagem encontrada com esses filtros
          </p>
          <Button
            onClick={clearFilters}
            variant="link"
            className="text-primary mt-2"
            size="sm"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => {
            const isCompleted = ride.status === RIDE_STATUS.COMPLETED;
            const isCancelled = ride.status === RIDE_STATUS.CANCELLED;
            const needsRating = isCompleted && !ride.rating;

            return (
              <div
                key={ride.id}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  "bg-card",
                  isCancelled
                    ? "border-destructive/10 opacity-70"
                    : "border-border",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[0.6rem] font-semibold px-2 py-0.5 rounded-full",
                        ride.type === "entrega"
                          ? "bg-warning/20 text-warning"
                          : "bg-primary/20 text-primary",
                      )}
                    >
                      {ride.type === "entrega" ? (
                        <Package className="h-3 w-3 mr-1" />
                      ) : (
                        <Car className="h-3 w-3 mr-1" />
                      )}
                      {ride.type === "entrega" ? "Entrega" : "Viagem"}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-success/20 text-success text-[0.6rem] px-2 rounded-full">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Concluída
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge className="bg-destructive/20 text-destructive text-[0.6rem] px-2 rounded-full">
                        <XCircle className="h-3 w-3 mr-1" /> Cancelada
                      </Badge>
                    )}
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground">
                    {formatDate(ride.updated_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="text-foreground font-medium">
                    {ride.origin}
                  </span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  <span className="text-foreground font-medium">
                    {ride.destination}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(ride.departure_time || ride.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-success font-bold">
                      R$ {(ride.final_price || ride.suggested_price || 0).toFixed(2)}
                    </span>
                  </div>
                  {ride.payment_method && (
                    <span>
                      {ride.payment_method === PAYMENT_METHOD.PIX
                        ? "💳 Pix"
                        : "💵 Dinheiro"}
                    </span>
                  )}
                </div>

                {ride.driver && ride.driver.name && ride.driver.vehicle_plate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-[0.55rem] font-bold">
                      {ride.driver.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-foreground">{ride.driver.name}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {ride.driver.vehicle_plate}
                    </span>
                  </div>
                )}

                {ride.rating && (
                  <div className="mt-2 flex items-center gap-1">
                    {(() => {
                      const ratingValue = ride.rating as any;
                      const numericRating =
                        typeof ratingValue === "number"
                          ? ratingValue
                          : (ratingValue?.rating ?? 0);
                      const commentRating =
                        typeof ratingValue === "object" && ratingValue
                          ? ratingValue.comment
                          : undefined;
                      return (
                        <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < numericRating
                            ? "text-warning fill-warning"
                            : "text-muted",
                        )}
                      />
                    ))}
                    {commentRating && (
                      <span className="text-[0.6rem] text-muted-foreground ml-1 italic">
                        "{commentRating}"
                      </span>
                    )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {isCancelled && ride.cancellation_reason && (
                  <p className="mt-2 text-[0.65rem] text-destructive/70 italic">
                    Motivo: {ride.cancellation_reason}
                  </p>
                )}

                {needsRating && (
                  <Button
                    onClick={() => onRate(ride)}
                    size="sm"
                    className="mt-3 bg-warning/20 text-warning hover:bg-warning/30 rounded-xl text-xs h-8 w-full"
                  >
                    <Star className="h-3 w-3 mr-1.5" /> Avaliar Motorista
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
