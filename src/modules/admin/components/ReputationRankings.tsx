import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { PassengerTrustBadge } from "@/shared/components/badges/PassengerTrustBadge";
import { Star, Users, Car } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService"; // ✅ SSOT - Usa instância do ProfileService
import { MobilityService } from "@/core/mobility/services/runtime"; // ✅ SSOT - Importa MobilityService correto

type TopPassenger = Awaited<ReturnType<typeof profileService.getTopPassengers>>[number];
type TopDriver = Awaited<ReturnType<typeof MobilityService.getTopDrivers>>[number];
type DriverRow = {
  id: string;
  name?: string;
  total_rides?: number;
  rating?: number;
  profile?: {
    avatar_url?: string;
  };
};

export function ReputationRankings() {
  const [topPassengers, setTopPassengers] = useState<TopPassenger[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  async function loadRankings() {
    try {
      // ✅ SSOT - Usar profileService (instância) para top passageiros
      const passengers = await profileService.getTopPassengers({
        minRides: 1,
        limit: 10,
      });

      setTopPassengers(passengers || []);

      // ✅ SSOT - Usar MobilityService para top motoristas
      const drivers = await MobilityService.getTopDrivers({
        minRides: 1,
        limit: 10,
      });

      setTopDrivers(((drivers || []) as DriverRow[]) as TopDriver[]);
    } catch (error) {
      logger.error("Error loading rankings:", error);
      toast.error("Erro ao carregar rankings");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Passageiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Top 10 Passageiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPassengers.map((passenger, index) => (
              <div
                key={passenger.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50"
              >
                <div className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={passenger.avatar_url} />
                  <AvatarFallback>{passenger.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{passenger.name}</p>
                  <PassengerTrustBadge
                    trustLevel={passenger.passenger_trust_level}
                    rating={passenger.passenger_rating}
                    totalRides={passenger.passenger_completed_rides}
                  />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-yellow-500" />
                    <span className="font-bold">
                      {passenger.passenger_rating?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Motoristas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-green-500" />
            Top 10 Motoristas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topDrivers.map((driver, index) => {
              const row = driver as DriverRow;
              return (
              <div
                key={row.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50"
              >
                <div className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={row.profile?.avatar_url} />
                  <AvatarFallback>{row.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.total_rides ?? 0} corridas
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-yellow-500" />
                    <span className="font-bold">
                      {typeof row.rating === "number" ? row.rating.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

