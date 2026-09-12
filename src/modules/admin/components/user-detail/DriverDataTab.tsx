import {
  Car,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import type { DriverDetail } from "@/modules/admin/hooks/useAdminUserDetail";

interface DriverDataTabProps {
  driverData: DriverDetail | null;
}

function formatRelativeDate(value: string | null): string {
  if (!value) return "Sem registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function DriverDataTab({ driverData }: DriverDataTabProps) {
  if (!driverData) {
    return (
      <Card className="bg-[#1E2529] border-white/10">
        <CardContent className="py-12 text-center">
          <Car className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Este perfil não possui cadastro de motorista</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
              <p className="text-xs text-gray-400">Tipo</p>
              <p className="text-sm text-white">{driverData.vehicle_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Modelo</p>
              <p className="text-sm text-white">{driverData.vehicle_model || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ano</p>
              <p className="text-sm text-white">{driverData.vehicle_year || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Placa</p>
              <p className="text-sm text-white font-mono">{driverData.vehicle_plate || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Cor</p>
              <p className="text-sm text-white">{driverData.vehicle_color || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Modalidade</p>
              <p className="text-sm text-white">
                {driverData.can_do_delivery
                  ? "Entregas"
                  : driverData.can_do_rides
                    ? "Corridas"
                    : "Não habilitada"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CNH e verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Número</p>
              <p className="text-sm text-white font-mono">{driverData.license_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Categoria</p>
              <p className="text-sm text-white">{driverData.license_category || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">UF</p>
              <p className="text-sm text-white">{driverData.license_state || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Validade</p>
              <p className="text-sm text-white">
                {driverData.license_expiry
                  ? new Date(`${driverData.license_expiry}T00:00:00`).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge
              className={
                driverData.documents_verified
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
              }
            >
              <Shield className="h-3 w-3 mr-1" />
              {driverData.documents_verified ? "Documentos verificados" : "Documentos pendentes"}
            </Badge>
            <Badge className="bg-white/5 text-gray-300 border-white/10">
              Antecedentes: {driverData.background_check_status || "não informado"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Histórico operacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Corridas registradas</p>
              <p className="text-lg font-bold text-white">{driverData.total_rides ?? 0}</p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Concluídas</p>
              <p className="text-lg font-bold text-green-400">
                {driverData.total_rides_completed ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Canceladas</p>
              <p className="text-lg font-bold text-red-400">
                {driverData.total_rides_cancelled ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Taxa de aceitação</p>
              <p className="text-lg font-bold text-blue-400">
                {driverData.acceptance_rate ?? 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Presença operacional
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Disponível</span>
            <Badge
              className={
                driverData.is_available
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }
            >
              {driverData.is_available ? "Sim" : "Não"}
            </Badge>
          </div>
          {driverData.active_ride_id && (
            <div>
              <p className="text-xs text-gray-400">Operação ativa</p>
              <p className="text-sm text-white">
                {driverData.active_ride_mode === "motoboy" ? "Entrega" : "Corrida"}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Último sinal</p>
            <p className="text-sm text-white">{formatRelativeDate(driverData.last_seen_at)}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-400">Última atualização de localização</p>
              <p className="text-sm text-white">
                {formatRelativeDate(driverData.last_location_update)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
