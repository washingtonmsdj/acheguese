import {
  History,
  Shield,
  Ban,
  CheckCircle,
  TrendingUp,
  Edit,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/shared/utils/cn";
import type { LucideIcon } from "lucide-react";
import type { SuspensionHistory } from "@/modules/admin/hooks/useAdminUserDetail";

interface HistoryTabProps {
  suspensionHistory: SuspensionHistory[];
  user: {
    created_at?: string | null;
    verified_at?: string | null;
    is_verified_resident?: boolean | null;
  } | null;
}

export function HistoryTab({ suspensionHistory, user }: HistoryTabProps) {
  // Criar timeline de eventos
  const events: Array<{
    type: string;
    icon: LucideIcon;
    color: string;
    title: string;
    description: string;
    timestamp: string | null;
    details?: SuspensionHistory;
  }> = [
    {
      type: "created",
      icon: CheckCircle,
      color: "text-blue-400",
      title: "Conta criada",
      description: "Usuário se registrou na plataforma",
      timestamp: user?.created_at,
    },
    ...(user?.verified_at
      ? [
          {
            type: "verified",
            icon: Shield,
            color: "text-green-400",
            title: "Conta verificada",
            description: "Usuário foi verificado como morador",
            timestamp: user.verified_at,
          },
        ]
      : []),
    ...suspensionHistory.map((suspension) => ({
      type: "suspension",
      icon: Ban,
      color: "text-red-400",
      title: suspension.is_active ? "Suspenso" : "Suspensão removida",
      description: suspension.reason || "Sem motivo especificado",
      timestamp: suspension.is_active
        ? suspension.suspended_at
        : suspension.lifted_at,
      details: suspension,
    })),
  ].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Resumo do Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Suspensões</p>
              <p className="text-lg font-bold text-red-400">
                {suspensionHistory.length}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Verificações</p>
              <p className="text-lg font-bold text-green-400">
                {user?.is_verified_resident ? 1 : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Eventos */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm">Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              Nenhum evento registrado
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={index} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "p-2 rounded-full bg-[#0A0F14] border border-white/10",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", event.color)} />
                      </div>
                      {index < events.length - 1 && (
                        <div className="w-px h-full bg-white/10 mt-2" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold text-white">
                          {event.title}
                        </p>
                        {event.timestamp && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {event.description}
                      </p>

                      {/* Detalhes da suspensão */}
                      {event.type === "suspension" && event.details && (
                        <div className="mt-2 p-2 bg-[#0A0F14] rounded text-xs">
                          <p className="text-gray-400">
                            Por:{" "}
                            <span className="text-white">
                              {event.details.suspended_by_name}
                            </span>
                          </p>
                          {event.details.suspended_until && (
                            <p className="text-gray-400">
                              Até:{" "}
                              <span className="text-white">
                                {new Date(
                                  event.details.suspended_until,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mudanças de Reputação (placeholder) */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Mudanças de Reputação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-400 py-4 text-sm">
            Histórico de mudanças será implementado em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
