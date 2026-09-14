import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { usePush } from "@/core/notifications/hooks/usePush";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  AlertCircle,
  BellOff,
  CheckCircle2,
  MonitorSmartphone,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

export function PushNotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    hasPermission,
    isSubscribed,
    subscriptions,
    isSubscribing,
    isUnsubscribing,
    isSendingTest,
    subscribe,
    unsubscribe,
    sendTest,
  } = usePush(user?.id);

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-territory-border bg-territory-raised p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-surface text-territory-muted">
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-territory-ink">Push indisponível neste navegador</p>
            <p className="mt-1 text-xs leading-5 text-territory-muted">
              Os outros canais de notificação continuam funcionando conforme suas preferências.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-territory-border bg-territory-raised p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSubscribed ? "bg-emerald-100 text-emerald-700" : "bg-territory-surface text-territory-muted"}`}>
            {isSubscribed ? (
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-territory-ink">
              {isSubscribed ? "Ativado neste dispositivo" : "Neste dispositivo"}
            </p>
            <p className="mt-1 text-xs leading-4 text-territory-muted">
              {isSubscribed
                ? "Este navegador está registrado para receber notificações push."
                : hasPermission
                  ? "A permissão existe; ative o registro para começar a receber push."
                  : "A permissão do navegador é necessária para receber push."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 pl-[52px] sm:pl-0">
          {isSubscribed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendTest}
              disabled={isSendingTest}
              className="min-h-10"
            >
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isSendingTest ? "Enviando..." : "Testar"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={subscribe}
              disabled={isSubscribing}
              className="min-h-10 bg-territory-brand text-white hover:bg-territory-brand-strong"
            >
              {isSubscribing ? "Ativando..." : "Ativar push"}
            </Button>
          )}
        </div>
      </div>

      {!hasPermission && !isSubscribed ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs leading-5">
            Se o navegador estiver bloqueando notificações, altere a permissão do site e tente novamente.
          </AlertDescription>
        </Alert>
      ) : null}

      {subscriptions.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted">
            Dispositivos registrados
          </h3>
          <div className="mt-2 divide-y divide-territory-border rounded-xl border border-territory-border bg-territory-surface">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                <Smartphone className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-territory-ink">
                    {sub.device_name || "Dispositivo sem nome"}
                  </p>
                  <p className="mt-0.5 text-xs text-territory-muted">
                    Ativado {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => unsubscribe(sub.id)}
                  disabled={isUnsubscribing}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-territory-muted hover:text-destructive"
                  aria-label={`Remover ${sub.device_name || "dispositivo"}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
