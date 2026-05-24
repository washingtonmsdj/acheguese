import React from "react";
import { Users, Star, TrendingUp, Shield } from "lucide-react";
import { StatCard } from "./stats/StatCard";
import { useReputationStats } from "@/core/admin/hooks/useReputationStats";

export function ReputationStats() {
  const { stats, loading } = useReputationStats();

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Total Passageiros"
        value={stats.totalPassengers}
        icon={Users}
        color="text-blue-500"
      />
      <StatCard
        label="Rating Médio Passageiros"
        value={stats.avgPassengerRating.toFixed(2)}
        icon={Star}
        color="text-yellow-500"
      />
      <StatCard
        label="Passageiros Verificados"
        value={stats.trustedPassengers}
        icon={Shield}
        color="text-emerald-500"
      />
      <StatCard
        label="Total Motoristas"
        value={stats.totalDrivers}
        icon={Users}
        color="text-green-500"
      />
      <StatCard
        label="Rating Médio Motoristas"
        value={stats.avgDriverRating.toFixed(2)}
        icon={Star}
        color="text-yellow-500"
      />
      <StatCard
        label="Motoristas Suspensos"
        value={stats.suspendedDrivers}
        icon={TrendingUp}
        color="text-red-500"
      />
    </div>
  );
}
