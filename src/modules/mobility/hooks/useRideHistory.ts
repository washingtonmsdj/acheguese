import { useQuery } from "@tanstack/react-query";
import { MobilityFacade } from "@/core/mobility/services/MobilityService";
import {
  isCancelledRideStatus,
  isClosedRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
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

function matchesStatusFilter(ride: RideRequest, status?: string): boolean {
  if (!status) return true;
  if (status === RIDE_STATUS.CANCELLED) {
    return isCancelledRideStatus(ride.status);
  }
  return ride.status === status;
}

function toHistoryItem(ride: RideRequest): RideHistoryItem {
  return {
    id: ride.id,
    origin: ride.origin_address || "",
    destination: ride.destination_address || "",
    status: ride.status,
    price: ride.estimated_price || 0,
    final_price: ride.final_price ?? 0,
    type: "viagem",
    created_at: ride.created_at,
    driver_name: undefined,
    driver: undefined,
    passenger: undefined,
    rating: undefined,
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

  const { data, isLoading } = useQuery<RideHistoryResult>({
    queryKey: MOBILITY_QUERY_KEYS.rideHistory(
      user?.id || "",
      queryFilters,
      page,
    ),
    queryFn: async () => {
      if (!user) {
        return {
          rides: [],
          stats: { total: 0, completed: 0, cancelled: 0, totalSpent: 0 },
        };
      }

      const allRides = (await MobilityFacade.getUserRides(user.id)) as RideRequest[];
      let filteredRides = allRides.filter(
        (ride) =>
          isClosedRideStatus(ride.status) &&
          matchesStatusFilter(ride, filters?.status),
      );

      if (filters?.dateFrom) {
        const from = Date.parse(filters.dateFrom);
        if (Number.isFinite(from)) {
          filteredRides = filteredRides.filter(
            (ride) => Date.parse(ride.created_at) >= from,
          );
        }
      }

      if (filters?.dateTo) {
        const to = Date.parse(`${filters.dateTo}T23:59:59.999`);
        if (Number.isFinite(to)) {
          filteredRides = filteredRides.filter(
            (ride) => Date.parse(ride.created_at) <= to,
          );
        }
      }

      const stats = {
        total: filteredRides.length,
        completed: filteredRides.filter(
          (ride) => ride.status === RIDE_STATUS.COMPLETED,
        ).length,
        cancelled: filteredRides.filter((ride) =>
          isCancelledRideStatus(ride.status),
        ).length,
        totalSpent: filteredRides
          .filter((ride) => ride.status === RIDE_STATUS.COMPLETED)
          .reduce((sum, ride) => sum + (ride.final_price ?? 0), 0),
      };

      let visibleRides = filteredRides;
      if (pageSize) {
        const pageNumber = Math.max(page ?? 1, 1);
        const start = (pageNumber - 1) * pageSize;
        visibleRides = filteredRides.slice(start, start + pageSize);
      }

      return {
        rides: visibleRides.map(toHistoryItem),
        stats,
      };
    },
    enabled: Boolean(user),
  });

  return { rides: data?.rides || [], stats: data?.stats, isLoading };
}
