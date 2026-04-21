/**
 * Admin Types - SSOT v2.0
 * 
 * Tipos compartilhados para operações administrativas
 */

/**
 * Configuração para criar usuário admin
 */
export interface AdminUserConfig {
  email: string;
  password: string;
  name?: string;
}

/**
 * Resultado da criação de usuário admin
 */
export interface AdminUserResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Métricas em tempo real do sistema
 */
export interface RealtimeMetrics {
  driversOnline: number;
  driversTotal: number;
  driversVerified: number;
  driversPending: number;
  ridesActive: number;
  ridesPending: number;
  ridesToday: number;
  ridesCompleted: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  avgResponseTime: number;
  avgRating: number;
  completionRate: number;
  lastUpdate: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * Corrida ativa para dashboard admin
 */
export interface ActiveRide {
  id: string;
  status: string;
  passenger_name: string;
  driver_name: string;
  origin: string;
  destination: string;
  created_at: string;
  estimated_duration?: number;
  current_price: number;
}

/**
 * Motorista online para dashboard admin
 */
export interface OnlineDriver {
  id: string;
  name: string;
  avatar_url?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  rating: number;
  total_rides: number;
  last_location_update?: string;
  is_available: boolean;
  current_ride_id?: string;
}

/**
 * Estatísticas de reputação
 */
export interface ReputationStats {
  totalPassengers: number;
  avgPassengerRating: number;
  totalDrivers: number;
  avgDriverRating: number;
  trustedPassengers: number;
  suspendedDrivers: number;
}

/**
 * Saúde operacional de um módulo no admin
 */
export type AdminOperationalHealth = "healthy" | "attention" | "inactive";

/**
 * Cobertura operacional por módulo no admin
 */
export interface AdminModuleCoverage {
  key: string;
  label: string;
  route: string;
  count: number;
  pendingCount: number;
  status: AdminOperationalHealth;
  source: string;
}

/**
 * Snapshot consolidado da operação administrativa
 */
export interface AdminOperationalOverview {
  generatedAt: string;
  windowDays: number;
  totalRecords: number;
  stats: {
    profiles: number;
    businesses: number;
    professionals: number;
    classifieds: number;
    events: number;
    posts: number;
    comments: number;
    drivers: number;
    ride_requests: number;
  };
  trends: Record<
    string,
    {
      value: number;
      direction: "up" | "down" | "neutral";
    }
  >;
  modules: AdminModuleCoverage[];
  activity: Array<{
    date: string;
    posts: number;
    users: number;
    businesses: number;
    eventos: number;
    classificados: number;
  }>;
  recentActivity: Array<{
    type: string;
    label: string;
    date: string;
  }>;
}
