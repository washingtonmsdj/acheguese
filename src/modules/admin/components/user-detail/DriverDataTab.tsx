import { Car, FileText, Shield, Clock, TrendingUp, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DriverDetail } from "@/modules/admin/hooks/useAdminUserDetail";

interface DriverDataTabProps {
  driverData: DriverDetail | null;
}

export function DriverDataTab({ driverData }: DriverDataTabProps) {
  if (!driverData) {
    return (
      <Card className="bg-[#1E2529] border-white/10">
        <CardContent className="py-12 text-center">
          <Car className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Este usuário não é motorista</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Veículo */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Modelo</p>
              <p className="text-sm text-white">
                {driverData.vehicle_model || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ano</p>
              <p className="text-sm text-white">
                {driverData.vehicle_year || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Placa</p>
              <p className="text-sm text-white font-mono">
                {driverData.vehicle_plate || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Cor</p>
              <p className="text-sm text-white">
                {driverData.vehicle_color || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CNH */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CNH
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">Número</p>
            <p className="text-sm text-white font-mono">
              {driverData.cnh_number || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Validade</p>
            <p className="text-sm text-white">
              {driverData.cnh_expiry_date
                ? new Date(driverData.cnh_expiry_date).toLocaleDateString(
                    "pt-BR",
                  )
                : "N/A"}
            </p>
          </div>
          {driverData.is_verified && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Solicitações</p>
              <p className="text-lg font-bold text-white">
                {driverData.total_requests_received || 0}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Aceitas</p>
              <p className="text-lg font-bold text-green-400">
                {driverData.total_requests_accepted || 0}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Taxa Aceitação</p>
              <p className="text-lg font-bold text-blue-400">
                {driverData.acceptance_rate || 0}%
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Cancelamentos</p>
              <p className="text-lg font-bold text-red-400">
                {driverData.cancellation_count || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Online</span>
            <Badge
              className={
                driverData.is_online
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }
            >
              {driverData.is_online ? "Sim" : "Não"}
            </Badge>
          </div>
          {driverData.last_online_at && (
            <div>
              <p className="text-xs text-gray-400">Último acesso</p>
              <p className="text-sm text-white">
                {formatDistanceToNow(new Date(driverData.last_online_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
