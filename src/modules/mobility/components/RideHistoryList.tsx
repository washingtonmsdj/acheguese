/**
 * Componente de lista de histórico de corridas
 */

import { useState } from "react";
import {
  useRideHistory,
  type RideHistoryFilters,
} from "@/modules/mobility/hooks/useRideHistory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Filter,
  TrendingUp,
  TrendingDown,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RIDE_STATUS } from "@/shared/types/constants";
export function RideHistoryList() {
  const [filters, setFilters] = useState<RideHistoryFilters>({
    status: undefined,
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const { rides, stats, isLoading } = useRideHistory(filters, page, 10);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Corridas
                </p>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {stats?.completed ?? 0}
                </p>
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
                <p className="text-2xl font-bold text-red-600">
                  {stats?.cancelled ?? 0}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {(stats?.totalSpent ?? 0) > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold">
                    R$ {(stats?.totalSpent ?? 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Corridas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full mt-1 rounded-md border p-2"
                  value={filters.status || "all"}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status:
                        e.target.value === "all" ? undefined : e.target.value,
                    })
                  }
                >
                  <option value="all">Todos</option>
                  <option value={RIDE_STATUS.COMPLETED}>Concluídas</option>
                  <option value={RIDE_STATUS.CANCELLED}>Canceladas</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="w-full mt-1 rounded-md border p-2"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="viagem">Viagem</option>
                  <option value="entrega">Entrega</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Data Inicial</label>
                <input
                  type="date"
                  className="w-full mt-1 rounded-md border p-2"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Data Final</label>
                <input
                  type="date"
                  className="w-full mt-1 rounded-md border p-2"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilters({});
                setTypeFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Lista de Corridas */}
      <div className="space-y-4">
        {rides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma corrida encontrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                        <p className="text-sm font-medium">{ride.origin}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                        <p className="text-sm font-medium">
                          {ride.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(
                          new Date(ride.created_at),
                          "dd 'de' MMM, HH:mm",
                          { locale: ptBR },
                        )}
                      </div>
                      <Badge
                        variant={
                          ride.type === "viagem" ? "default" : "secondary"
                        }
                      >
                        {ride.type === "viagem" ? "Viagem" : "Entrega"}
                      </Badge>
                      <Badge
                        variant={
                          ride.status === RIDE_STATUS.COMPLETED
                            ? "default"
                            : "destructive"
                        }
                        className={
                          ride.status === RIDE_STATUS.COMPLETED
                            ? "bg-green-600"
                            : ""
                        }
                      >
                        {ride.status === RIDE_STATUS.COMPLETED
                          ? "Concluída"
                          : "Cancelada"}
                      </Badge>
                      {typeof ride.rating === "number" && ride.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{ride.rating}</span>
                        </div>
                      )}
                    </div>

                    {ride.driver && (
                      <p className="text-sm text-muted-foreground">
                        Motorista: {ride.driver.name}
                      </p>
                    )}
                    {ride.passenger && (
                      <p className="text-sm text-muted-foreground">
                        Passageiro: {ride.passenger.name}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      R$ {ride.final_price?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {rides.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={rides.length < 10}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
