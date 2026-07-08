import { useQuery } from "@tanstack/react-query";
import { MobilityFacade } from "@/core/mobility/services/MobilityService";
import { useAuth } from "@/core/auth";
import { RIDE_STATUS, MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import type { RideRequest } from "../types/types";

export interface RideHistoryItem {
  id: string;
  origin: string;
  destination: string;
  status: string;
  price: number;
  final_price: number;
  type: string;
  created_at: string;
  driver_name?: string;
  driver?: { name: string; avatar_url: string | null };
  passenger?: { name: string; avatar_url: string | null };
  rating?: number;
}

export interface RideHistoryFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface RideHistoryResult {
  rides: RideHistoryItem[];
  stats: {
    total: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  };
}

export function useRideHistory(
  filters?: RideHistoryFilters,
  page?: number,
  pageSize?: number,
) {
  const { user } = useAuth();
  const queryFilters = filters
    ? ({
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      } satisfies Record<string, unknown>)
    : undefined;
  const cancelledStatuses = new Set<string>([
    RIDE_STATUS.CANCELLED,
    RIDE_STATUS.CANCELLED_BY_DRIVER,
    RIDE_STATUS.CANCELLED_BY_PASSENGER,
  ]);

  const { data, isLoading } = useQuery<RideHistoryResult>({
    queryKey: MOBILITY_QUERY_KEYS.rideHistory(
      user?.id || "",
      queryFilters,
      page,
    ),
    queryFn: async () => {
      if (!user)
        return {
          rides: [],
          stats: { total: 0, completed: 0, cancelled: 0, totalSpent: 0 },
        };
      const allRides = await MobilityFacade.getUserRides(user.id);
      let rides = allRides;
      if (filters?.status)
        rides = rides.filter((r: RideRequest) => r.status === filters.status);
      if (pageSize) rides = rides.slice(0, pageSize);
      const mapped: RideHistoryItem[] = rides.map((r: RideRequest) => ({
        id: r.id,
        origin: r.origin_address || "",
        destination: r.destination_address || "",
        status: r.status,
        price: r.estimated_price || 0,
        final_price: r.final_price || r.estimated_price || 0,
        type: "viagem",
        created_at: r.created_at,
        driver_name: undefined,
        driver: undefined,
        passenger: undefined,
        rating: undefined,
      }));
      return {
        rides: mapped,
        stats: {
          total: mapped.length,
          completed: mapped.filter((r) => r.status === RIDE_STATUS.COMPLETED)
            .length,
          cancelled: mapped.filter((r) =>
            cancelledStatuses.has(String(r.status)),
          ).length,
          totalSpent: mapped.reduce(
            (acc: number, r) => acc + (r.final_price || 0),
            0,
          ),
        },
      };
    },
    enabled: !!user,
  });

  return { rides: data?.rides || [], stats: data?.stats, isLoading };
}
