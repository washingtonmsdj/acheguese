import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  BellOff,
  CheckCircle2,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { usePush } from "@/core/notifications/hooks/usePush";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { ptBR } from "@/shared/utils/dateLocale";

export function PushNotificationSettings() {
  const { user } = useAuth();
  const {
    isSupportResolved,
    isSupported,
    hasPermission,
    permission,
    isSubscribed,
    currentSubscriptionId,
    subscriptions,
    isLoadingSubscriptions,
    isSubscribing,
    isUnsubscribing,
    unsubscribingSubscriptionId,
    isSendingTest,
    subscriptionsError,
    subscribe,
    unsubscribe,
    sendTest,
    refetchSubscriptions,
  } = usePush(user?.id);

  if (!isSupportResolved) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-xl border border-territory-border bg-territory-raised p-4" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-territory-brand" aria-hidden="true" />
        <span className="ml-2 text-sm text-territory-muted">Verificando este dispositivo...</span>
      </div>
    );
  }

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

  const permissionBlocked = permission === "denied";
  const currentDeviceDescription = isSubscribed
    ? "Este navegador está registrado para receber notificações push."
    : hasPermission
      ? "A permissão já foi concedida. Falta registrar este navegador para receber push."
      : permissionBlocked
        ? "As notificações estão bloqueadas nas permissões deste navegador."
        : "Ao ativar, o navegador solicitará sua permissão para receber notificações.";

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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-territory-ink">Este dispositivo</p>
              <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${isSubscribed ? "bg-emerald-100 text-emerald-800" : permissionBlocked ? "bg-red-50 text-red-700" : "bg-territory-surface text-territory-muted"}`}>
                {isSubscribed ? "Ativado" : permissionBlocked ? "Bloqueado" : hasPermission ? "Permitido" : "Não ativado"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-4 text-territory-muted">{currentDeviceDescription}</p>
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
              disabled={isSubscribing || permissionBlocked}
              className="min-h-10 bg-territory-brand text-white hover:bg-territory-brand-strong"
            >
              {isSubscribing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubscribing ? "Ativando..." : permissionBlocked ? "Bloqueado" : "Ativar neste dispositivo"}
            </Button>
          )}
        </div>
      </div>

      {permissionBlocked && !isSubscribed ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs leading-5">
            Para ativar o push, altere a permissão de notificações deste site nas configurações do navegador e volte a esta tela.
          </AlertDescription>
        </Alert>
      ) : null}

      {subscriptionsError ? (
        <Alert className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs leading-5">
            Não foi possível carregar os dispositivos registrados.
            <button
              type="button"
              onClick={() => void refetchSubscriptions()}
              className="ml-1 inline-flex min-h-8 items-center gap-1 font-semibold underline underline-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoadingSubscriptions ? (
        <div className="flex min-h-14 items-center justify-center rounded-xl border border-territory-border bg-territory-surface text-sm text-territory-muted" role="status">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-territory-brand" aria-hidden="true" />
          Carregando dispositivos...
        </div>
      ) : null}

      {!isLoadingSubscriptions && !subscriptionsError && subscriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-territory-border bg-territory-surface px-4 py-3 text-xs leading-5 text-territory-muted">
          Nenhum dispositivo está registrado para receber push nesta conta.
        </div>
      ) : null}

      {!isLoadingSubscriptions && !subscriptionsError && subscriptions.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted">
            Dispositivos registrados
          </h3>
          <div className="mt-2 divide-y divide-territory-border rounded-xl border border-territory-border bg-territory-surface">
            {subscriptions.map((sub) => {
              const isCurrent = sub.id === currentSubscriptionId;
              const removingThis = isUnsubscribing && unsubscribingSubscriptionId === sub.id;
              return (
                <div key={sub.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                  <Smartphone className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-territory-ink">
                        {sub.device_name || "Dispositivo sem nome"}
                      </p>
                      {isCurrent ? (
                        <span className="rounded-full bg-territory-brand/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-territory-brand">
                          Este dispositivo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-territory-muted">
                      Ativado {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => unsubscribe(sub.id, sub.endpoint)}
                    disabled={isUnsubscribing}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-territory-muted hover:text-destructive"
                    aria-label={`Remover ${sub.device_name || "dispositivo"}${isCurrent ? " atual" : ""}`}
                  >
                    {removingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
