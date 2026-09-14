import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  BellOff,
  CheckCircle2,
  ChevronDown,
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
      <div className="flex min-h-14 items-center rounded-xl bg-territory-raised px-3 py-3" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-territory-brand" aria-hidden="true" />
        <span className="ml-2 text-sm text-territory-muted">Verificando este dispositivo...</span>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl bg-territory-raised px-3 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-territory-surface text-territory-muted">
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-territory-ink">Push indisponível neste navegador</p>
            <p className="mt-1 text-xs leading-4 text-territory-muted">
              Os outros canais continuam funcionando conforme suas preferências.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const permissionBlocked = permission === "denied";
  const deliveryReady = isSubscribed && !permissionBlocked;
  const currentDeviceDescription = permissionBlocked
    ? "As notificações estão bloqueadas nas permissões deste navegador."
    : deliveryReady
      ? "Este navegador está registrado e autorizado para receber notificações push."
      : hasPermission
        ? "A permissão já foi concedida. Falta registrar este navegador para receber push."
        : "Ao ativar, o navegador solicitará sua permissão para receber notificações.";
  const currentDeviceLabel = permissionBlocked
    ? "Push bloqueado no navegador"
    : deliveryReady
      ? "Push ativado neste navegador"
      : hasPermission
        ? "Push permitido; falta ativar"
        : "Push não ativado neste navegador";

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-territory-raised px-3 py-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-territory-surface ${deliveryReady ? "text-emerald-700" : "text-territory-muted"}`}>
            {deliveryReady ? (
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-territory-ink">{currentDeviceLabel}</p>
            <p className="mt-0.5 text-xs leading-4 text-territory-muted">{currentDeviceDescription}</p>
          </div>
          {deliveryReady ? (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[0.6875rem] font-semibold text-emerald-800">
              Ativado
            </span>
          ) : !permissionBlocked ? (
            <Button
              type="button"
              size="sm"
              onClick={subscribe}
              disabled={isSubscribing}
              className="min-h-9 shrink-0 bg-territory-brand text-white hover:bg-territory-brand-strong"
            >
              {isSubscribing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubscribing ? "Ativando..." : "Ativar"}
            </Button>
          ) : null}
        </div>

        {permissionBlocked ? (
          <details className="group mt-2 pl-12">
            <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 text-xs font-semibold text-territory-brand underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand [&::-webkit-details-marker]:hidden">
              Como permitir
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-1 text-xs leading-5 text-territory-muted">
              Altere a permissão de notificações deste site nas configurações do navegador e volte a esta tela.
            </p>
          </details>
        ) : null}
      </div>

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

      <details className="group rounded-xl border border-territory-border bg-territory-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand [&::-webkit-details-marker]:hidden">
          <span className="flex-1">Gerenciar dispositivos e testes</span>
          <ChevronDown className="h-4 w-4 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-3 border-t border-territory-border p-3">
          {deliveryReady ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendTest}
              disabled={isSendingTest}
              className="min-h-10 w-full"
              aria-label="Enviar notificação de teste para os dispositivos registrados nesta conta"
            >
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isSendingTest ? "Enviando..." : "Enviar teste"}
            </Button>
          ) : null}

          {isLoadingSubscriptions ? (
            <div className="flex min-h-14 items-center justify-center rounded-xl bg-territory-raised text-sm text-territory-muted" role="status">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-territory-brand" aria-hidden="true" />
              Carregando dispositivos...
            </div>
          ) : null}

          {!isLoadingSubscriptions && !subscriptionsError && subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-territory-border bg-territory-raised px-4 py-3 text-xs leading-5 text-territory-muted">
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
      </details>
    </div>
  );
}