import { Activity, Clock, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

interface ActivityTabProps {
  user: {
    profile_type?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    user_id?: string | null;
  } | null;
  driverData: {
    last_online_at?: string | null;
    is_online?: boolean | null;
    current_lat?: number | null;
    current_lng?: number | null;
    last_location_update?: string | null;
  } | null;
}

export function ActivityTab({ user, driverData }: ActivityTabProps) {
  const lastActivity =
    driverData?.last_online_at || user?.updated_at || user?.created_at;
  const isOnline = driverData?.is_online || false;
  const hasCoordinates =
    driverData?.current_lat != null && driverData?.current_lng != null;

  return (
    <div className="space-y-4 text-foreground">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Status atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isOnline
                    ? "animate-pulse bg-success motion-reduce:animate-none"
                    : "bg-muted-foreground"
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm text-foreground">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <Badge
              className={
                isOnline
                  ? "bg-success/10 text-success hover:bg-success/10"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }
            >
              {isOnline ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {lastActivity ? (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-info" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Última atividade</p>
                  <p className="text-sm text-foreground">
                    {formatDistanceToNow(new Date(lastActivity), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {driverData && hasCoordinates ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Última localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-2 text-xs text-muted-foreground">Coordenadas</p>
              <p className="font-mono text-sm text-foreground">
                {driverData.current_lat?.toFixed(6)}, {driverData.current_lng?.toFixed(6)}
              </p>
              {driverData.last_location_update ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Atualizado{" "}
                  {formatDistanceToNow(
                    new Date(driverData.last_location_update),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    },
                  )}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm">Informações do perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Tipo de perfil</span>
            <Badge className="text-xs capitalize">
              {user?.profile_type || "personal"}
            </Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Criado em</span>
            <span className="text-foreground">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("pt-BR")
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Atualizado em</span>
            <span className="text-foreground">
              {user?.updated_at
                ? new Date(user.updated_at).toLocaleDateString("pt-BR")
                : "N/A"}
            </span>
          </div>
          {user?.user_id ? (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-[10px] text-foreground">
                {user.user_id.slice(0, 8)}...
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
