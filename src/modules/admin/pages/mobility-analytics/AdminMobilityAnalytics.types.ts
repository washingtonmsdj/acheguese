export interface MobilidadeStats {
  totalRides: number;
  openRides: number;
  preAcceptRides: number;
  driverOwnedOpenRides: number;
  resolvedRides: number;
  completedRides: number;
  cancelledRides: number;
  failedRides: number;
  expiredRides: number;
  totalDrivers: number;
  verifiedDrivers: number;
  unverifiedDrivers: number;
  completedValue: number;
  avgRating: number;
  verificationRate: number;
  completionRate: number;
  cancellationRate: number;
}

export interface DailyData {
  date: string;
  ridesCreated: number;
  completedValue: number;
  completed: number;
  cancelled: number;
}

export interface AnalyticsRide {
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  status: string;
  final_price?: number | null;
  actual_fare?: number | null;
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
  completedValue: number;
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
  ridesCreated: { label: "Corridas criadas", color: "hsl(var(--primary))" },
  completedValue: { label: "Valor concluído", color: "hsl(142 71% 45%)" },
  completed: { label: "Concluídas", color: "hsl(142 71% 45%)" },
  cancelled: { label: "Canceladas", color: "hsl(var(--destructive))" },
};

export const rideStatusDataKeys = {
  completed: "completed",
  cancelled: "cancelled",
} as const;
