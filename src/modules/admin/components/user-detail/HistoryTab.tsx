import { Ban, CheckCircle, History, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import type { SuspensionHistory } from "@/modules/admin/hooks/useAdminUserDetail";

interface HistoryTabProps {
  suspensionHistory: SuspensionHistory[];
  user: {
    created_at?: string | null;
    verified_at?: string | null;
    verified?: boolean | null;
  } | null;
}

type HistoryTone = "info" | "success" | "destructive";

const HISTORY_TONE_CLASS: Record<HistoryTone, string> = {
  info: "text-info",
  success: "text-success",
  destructive: "text-destructive",
};

export function HistoryTab({ suspensionHistory, user }: HistoryTabProps) {
  const events: Array<{
    type: string;
    icon: LucideIcon;
    tone: HistoryTone;
    title: string;
    description: string;
    timestamp: string | null | undefined;
    details?: SuspensionHistory;
  }> = [
    {
      type: "created",
      icon: CheckCircle,
      tone: "info" as const,
      title: "Conta criada",
      description: "Usuário se registrou na plataforma",
      timestamp: user?.created_at,
    },
    ...(user?.verified_at
      ? [
          {
            type: "verified",
            icon: Shield,
            tone: "success" as const,
            title: "Conta verificada",
            description: "Perfil aprovado pela verificação administrativa",
            timestamp: user.verified_at,
          },
        ]
      : []),
    ...suspensionHistory.map((suspension) => ({
      type: "suspension",
      icon: Ban,
      tone: "destructive" as const,
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
    <div className="space-y-4 text-foreground">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" aria-hidden="true" />
            Resumo do histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Suspensões</p>
              <p className="text-lg font-bold text-destructive">
                {suspensionHistory.length}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Verificações</p>
              <p className="text-lg font-bold text-success">
                {user?.verified ? 1 : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm">Linha do tempo de eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum evento registrado
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={`${event.type}-${event.timestamp ?? index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full border border-border bg-muted p-2">
                        <Icon
                          className={cn("h-4 w-4", HISTORY_TONE_CLASS[event.tone])}
                          aria-hidden="true"
                        />
                      </div>
                      {index < events.length - 1 ? (
                        <div className="mt-2 h-full w-px bg-border" aria-hidden="true" />
                      ) : null}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {event.title}
                        </p>
                        {event.timestamp ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>

                      {event.type === "suspension" && event.details ? (
                        <div className="mt-2 rounded bg-muted p-2 text-xs">
                          <p className="text-muted-foreground">
                            Por:{" "}
                            <span className="text-foreground">
                              {event.details.suspended_by_name}
                            </span>
                          </p>
                          {event.details.suspended_until ? (
                            <p className="text-muted-foreground">
                              Até:{" "}
                              <span className="text-foreground">
                                {new Date(
                                  event.details.suspended_until,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
