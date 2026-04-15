import { Activity, Smartphone, MapPin, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityTabProps {
  user: any;
  driverData: any;
}

export function ActivityTab({ user, driverData }: ActivityTabProps) {
  // Dados de atividade (por enquanto baseados nos dados disponíveis)
  const lastActivity =
    driverData?.last_online_at || user?.updated_at || user?.created_at;
  const isOnline = driverData?.is_online || false;

  return (
    <div className="space-y-4">
      {/* Status Atual */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#0A0F14] rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-400" : "bg-gray-400"} animate-pulse`}
              />
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm text-white">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <Badge
              className={
                isOnline
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }
            >
              {isOnline ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {lastActivity && (
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Última atividade</p>
                  <p className="text-sm text-white">
                    {formatDistanceToNow(new Date(lastActivity), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Localização (se motorista) */}
      {driverData && (driverData.current_lat || driverData.current_lng) && (
        <Card className="bg-[#1E2529] border-white/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Última Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Coordenadas</p>
              <p className="text-sm text-white font-mono">
                {driverData.current_lat?.toFixed(6)},{" "}
                {driverData.current_lng?.toFixed(6)}
              </p>
              {driverData.last_location_update && (
                <p className="text-xs text-gray-400 mt-2">
                  Atualizado{" "}
                  {formatDistanceToNow(
                    new Date(driverData.last_location_update),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    },
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispositivos (placeholder) */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-400 py-4 text-sm">
            Rastreamento de dispositivos será implementado em breve
          </p>
          <div className="text-xs text-gray-500 mt-2 p-2 bg-[#0A0F14] rounded">
            <p className="mb-1">📱 Funcionalidades futuras:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Lista de dispositivos usados</li>
              <li>Histórico de IPs</li>
              <li>Localização por IP</li>
              <li>Detecção de dispositivos suspeitos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Atividade (placeholder) */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs de Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-400 py-4 text-sm">
            Logs detalhados serão implementados em breve
          </p>
          <div className="text-xs text-gray-500 mt-2 p-2 bg-[#0A0F14] rounded">
            <p className="mb-1">📋 Funcionalidades futuras:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Histórico de logins</li>
              <li>Ações realizadas</li>
              <li>Mudanças no perfil</li>
              <li>Transações e pagamentos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Perfil */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm">Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Tipo de perfil</span>
            <Badge className="text-xs capitalize">
              {user?.profile_type || "personal"}
            </Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Criado em</span>
            <span className="text-white">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("pt-BR")
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Atualizado em</span>
            <span className="text-white">
              {user?.updated_at
                ? new Date(user.updated_at).toLocaleDateString("pt-BR")
                : "N/A"}
            </span>
          </div>
          {user?.user_id && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">User ID</span>
              <span className="text-white font-mono text-[10px]">
                {user.user_id.slice(0, 8)}...
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
