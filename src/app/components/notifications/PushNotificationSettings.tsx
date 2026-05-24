import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { usePush } from "@/core/notifications/hooks/usePush";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  Bell,
  BellOff,
  Smartphone,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure notificações push para este dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notificações push não são suportadas neste navegador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Configure notificações push para este dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${isSubscribed ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800"}`}
            >
              {isSubscribed ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium">{isSubscribed ? "Ativado" : "Desativado"}</p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "Você receberá notificações neste dispositivo"
                  : "Ative para receber notificações"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isSubscribed ? (
              <Button onClick={sendTest} disabled={isSendingTest} variant="outline" size="sm">
                {isSendingTest ? "Enviando..." : "Testar"}
              </Button>
            ) : (
              <Button onClick={subscribe} disabled={isSubscribing} size="sm">
                {isSubscribing ? "Ativando..." : "Ativar"}
              </Button>
            )}
          </div>
        </div>

        {!hasPermission && !isSubscribed && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você precisa permitir notificações no navegador.
            </AlertDescription>
          </Alert>
        )}

        {subscriptions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Dispositivos Ativos</h3>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {sub.device_name || "Dispositivo Desconhecido"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ativado{" "}
                        {formatDistanceToNow(new Date(sub.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => unsubscribe(sub.id)}
                    disabled={isUnsubscribing}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
