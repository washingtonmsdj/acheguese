import { RIDE_STATUS } from "@/shared/types/constants";

export interface MobilidadeStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  pendingRides: number;
  inProgressRides: number;
  totalDrivers: number;
  verifiedDrivers: number;
  pendingDrivers: number;
  rejectedDrivers: number;
  totalRevenue: number;
  avgRating: number;
  approvalRate: number;
  completionRate: number;
}

export interface DailyData {
  date: string;
  rides: number;
  revenue: number;
  completed: number;
  cancelled: number;
}

export interface AnalyticsRide {
  created_at: string;
  status: string;
  final_price?: number | null;
  suggested_price?: number | null;
  driver_profile_id?: string | null;
}

export interface DriverProfileLite {
  id: string;
  is_verified?: boolean;
  name?: string;
  profile?: { name?: string; avatar_url?: string; neighborhood?: string };
}

export interface TopDriverAnalytics {
  driver: {
    id: string;
    name?: string;
    profile?: { name?: string; avatar_url?: string; neighborhood?: string };
  };
  count: number;
  revenue: number;
}

export interface RideDistributionItem {
  name: string;
  value: number;
}

export const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 71% 45%)",
  "hsl(var(--destructive))",
  "hsl(45 93% 47%)",
];

export const chartConfig = {
  rides: { label: "Corridas", color: "hsl(var(--primary))" },
  revenue: { label: "Receita", color: "hsl(142 71% 45%)" },
  completed: { label: "Completas", color: "hsl(142 71% 45%)" },
  cancelled: { label: "Canceladas", color: "hsl(var(--destructive))" },
};

export const rideStatusDataKeys = {
  completed: RIDE_STATUS.COMPLETED,
  cancelled: RIDE_STATUS.CANCELLED,
};
