import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Clock,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { PushNotificationSettings } from "@/app/components/notifications/PushNotificationSettings";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesService,
  type NotificationPreferences,
} from "@/core/notifications/services";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

function PreferenceRow({
  id,
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  id: string;
  icon?: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="pt-0.5 text-muted-foreground">{icon}</div>
        ) : null}
        <div>
          <Label htmlFor={id} className="font-medium text-foreground">
            {label}
          </Label>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => NotificationPreferencesService.get(),
    enabled: !!user,
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) =>
      NotificationPreferencesService.patchAll(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Preferências salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <Navigate to={appUrls.auth.login} replace />;
  }

  if (isLoading) {
    return (
      <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Preferências de notificações</title>
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1080px] px-3 pb-24 pt-4 focus:outline-none sm:px-6 sm:pb-10 sm:pt-6 lg:px-8"
        >
          <div className="sticky top-0 z-20 -mx-3 mb-5 border-b border-territory-border bg-territory-canvas/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(appUrls.profile.preferences)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Comunicação
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Preferências de notificações
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Configure canais, tipos e horários de entrega.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                  Entrega de alertas
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Controle o que chega até você
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Ajuste notificações por e-mail, push e app interno sem
                  misturar com as configurações de privacidade da conta.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Preferências pessoais
              </div>
            </div>
          </section>

          <div className="mt-5 space-y-5">
            <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
              <CardHeader>
                <CardTitle>Canais de notificação</CardTitle>
                <CardDescription>
                  Escolha como você quer receber notificações.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceRow
                  id="email"
                  icon={<Mail className="h-5 w-5" />}
                  label="E-mail"
                  description="Receber notificações por e-mail."
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, email_enabled: checked })
                  }
                />
                <PreferenceRow
                  id="push"
                  icon={<Smartphone className="h-5 w-5" />}
                  label="Push"
                  description="Receber notificações push no dispositivo."
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, push_enabled: checked })
                  }
                />
                <PreferenceRow
                  id="inapp"
                  icon={<Bell className="h-5 w-5" />}
                  label="No app"
                  description="Mostrar notificações dentro da plataforma."
                  checked={preferences.inapp_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, inapp_enabled: checked })
                  }
                />
              </CardContent>
            </Card>

            <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
              <CardHeader>
                <CardTitle>Tipos de notificação</CardTitle>
                <CardDescription>
                  Escolha quais categorias você quer manter ativas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceRow
                  id="transactional"
                  label="Transacionais"
                  description="Pedidos, pagamentos e confirmações. Sempre ativo."
                  checked={preferences.transactional_enabled}
                  disabled
                />
                <PreferenceRow
                  id="social"
                  label="Sociais"
                  description="Comentários, menções e interações."
                  checked={preferences.social_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, social_enabled: checked })
                  }
                />
                <PreferenceRow
                  id="system"
                  label="Sistema"
                  description="Atualizações, manutenção e novos recursos."
                  checked={preferences.system_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, system_enabled: checked })
                  }
                />
                <PreferenceRow
                  id="marketing"
                  label="Marketing"
                  description="Promoções e novidades da plataforma."
                  checked={preferences.marketing_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      marketing_enabled: checked,
                    })
                  }
                />
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
                <CardHeader>
                  <CardTitle>Frequência</CardTitle>
                  <CardDescription>
                    Defina com que ritmo as notificações chegam.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={preferences.frequency}
                    onValueChange={(
                      value: NotificationPreferences["frequency"],
                    ) => setPreferences({ ...preferences, frequency: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Imediato</SelectItem>
                      <SelectItem value="daily">Resumo diário</SelectItem>
                      <SelectItem value="weekly">Resumo semanal</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horário silencioso
                  </CardTitle>
                  <CardDescription>
                    Defina um intervalo sem notificações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="quiet-start">Início</Label>
                      <input
                        id="quiet-start"
                        type="time"
                        className="mt-1 h-11 w-full rounded-md border bg-background px-3 py-2"
                        value={preferences.quiet_hours_start || ""}
                        onChange={(event) =>
                          setPreferences({
                            ...preferences,
                            quiet_hours_start: event.target.value || null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end">Fim</Label>
                      <input
                        id="quiet-end"
                        type="time"
                        className="mt-1 h-11 w-full rounded-md border bg-background px-3 py-2"
                        value={preferences.quiet_hours_end || ""}
                        onChange={(event) =>
                          setPreferences({
                            ...preferences,
                            quiet_hours_end: event.target.value || null,
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Exemplo: 22:00 - 08:00 para evitar alertas durante a noite.
                  </p>
                </CardContent>
              </Card>
            </div>

            <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6">
              <PushNotificationSettings />
            </section>

            <div className="sticky bottom-0 -mx-4 flex border-t border-border/70 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
              <Button
                onClick={() => saveMutation.mutate(preferences)}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar preferências"
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
