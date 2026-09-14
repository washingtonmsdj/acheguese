import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Clock3,
  Loader2,
  Mail,
  MessageCircleMore,
  MonitorSmartphone,
  RefreshCw,
  Settings2,
  ShoppingCart,
  Smartphone,
  Tag,
  UsersRound,
} from "lucide-react";

import { PushNotificationSettings } from "@/app/components/notifications/PushNotificationSettings";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesService,
  type NotificationPreferences,
} from "@/core/notifications/services";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/utils/cn";

const QUIET_DAY_OPTIONS = [
  { value: 1, short: "Seg", label: "Segunda-feira" },
  { value: 2, short: "Ter", label: "Terça-feira" },
  { value: 3, short: "Qua", label: "Quarta-feira" },
  { value: 4, short: "Qui", label: "Quinta-feira" },
  { value: 5, short: "Sex", label: "Sexta-feira" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 7, short: "Dom", label: "Domingo" },
] as const;

const ALL_QUIET_DAYS = QUIET_DAY_OPTIONS.map((day) => day.value);

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
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-[66px] items-center gap-3 border-b border-territory-border py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-semibold text-territory-ink">
          {label}
        </Label>
        <p className="mt-0.5 text-xs leading-4 text-territory-muted">{description}</p>
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

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-territory-border bg-territory-surface ${className}`}>
      {children}
    </section>
  );
}

export default function NotificationPreferencesPage() {
  const location = useLocation();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => NotificationPreferencesService.get(),
    enabled: !!user,
  });

  useEffect(() => {
    if (data) setPreferences(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => NotificationPreferencesService.patchAll(prefs),
    onSuccess: (saved) => {
      setPreferences(saved);
      queryClient.setQueryData(["notification-preferences", user?.id], saved);
      toast({ title: "Preferências salvas", description: "Suas preferências de notificação foram atualizadas." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  if (location.pathname === "/settings/notifications") {
    return <Navigate to={ACCOUNT_PATHS.notifications} replace />;
  }

  if (!user) return <Navigate to={appUrls.auth.login} replace />;

  if (isLoading) {
    return (
      <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
        <div className="text-center" role="status">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-territory-brand" aria-hidden="true" />
          <p className="mt-3 text-sm text-territory-muted">Carregando preferências...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <AccountSettingsShell title="Notificações" description="Não foi possível carregar suas preferências agora.">
        <Surface className="p-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="mt-3 text-sm text-territory-muted">
            {loadError instanceof Error ? loadError.message : "Tente novamente sem alterar nenhuma preferência."}
          </p>
          <Button type="button" variant="outline" className="mt-4 min-h-11" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
        </Surface>
      </AccountSettingsShell>
    );
  }

  const quietHoursActive = Boolean(preferences.quiet_hours_start && preferences.quiet_hours_end);
  const quietHoursPairInvalid = Boolean(preferences.quiet_hours_start) !== Boolean(preferences.quiet_hours_end);
  const selectedQuietDays = preferences.quiet_hours_days ?? ALL_QUIET_DAYS;
  const quietDaysInvalid = quietHoursActive && selectedQuietDays.length === 0;
  const quietHoursInvalid = quietHoursPairInvalid || quietDaysInvalid;
  const isDirty = data ? JSON.stringify(preferences) !== JSON.stringify(data) : false;

  const toggleQuietDay = (day: number) => {
    const current = preferences.quiet_hours_days ?? ALL_QUIET_DAYS;
    const next = current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort((a, b) => a - b);
    setPreferences({ ...preferences, quiet_hours_days: next });
  };

  return (
    <>
      <Helmet><title>Notificações | Achegue-se</title></Helmet>

      <AccountSettingsShell title="Controle o que chega até você" description="Escolha como e sobre o que deseja ser notificado.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="p-4 sm:p-5">
            <h2 className="font-heading text-base font-bold text-territory-ink">Canais de notificação</h2>
            <div className="mt-2">
              <PreferenceRow
                id="email"
                icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                label="E-mail"
                description="Receba avisos no seu e-mail."
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, email_enabled: checked })}
              />
              <PreferenceRow
                id="inapp"
                icon={<Smartphone className="h-5 w-5" aria-hidden="true" />}
                label="No aplicativo"
                description="Receba avisos dentro do Achegue-se."
                checked={preferences.inapp_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, inapp_enabled: checked })}
              />
              <PreferenceRow
                id="push"
                icon={<MonitorSmartphone className="h-5 w-5" aria-hidden="true" />}
                label="Canal push"
                description="Permita avisos push nos dispositivos que você registrar."
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, push_enabled: checked })}
              />
            </div>
          </Surface>

          <Surface className="p-4 sm:p-5">
            <h2 className="font-heading text-base font-bold text-territory-ink">Tipos de notificação</h2>
            <div className="mt-2">
              <PreferenceRow id="transactional" icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />} label="Pedidos e atendimentos" description="Pedidos, pagamentos e confirmações essenciais." checked={preferences.transactional_enabled} disabled />
              <PreferenceRow id="social" icon={<UsersRound className="h-5 w-5" aria-hidden="true" />} label="Comunidade" description="Comentários, menções e interações." checked={preferences.social_enabled} onCheckedChange={(checked) => setPreferences({ ...preferences, social_enabled: checked })} />
              <PreferenceRow id="system" icon={<Settings2 className="h-5 w-5" aria-hidden="true" />} label="Sistema" description="Atualizações e avisos importantes." checked={preferences.system_enabled} onCheckedChange={(checked) => setPreferences({ ...preferences, system_enabled: checked })} />
              <PreferenceRow id="marketing" icon={<Tag className="h-5 w-5" aria-hidden="true" />} label="Ofertas e novidades" description="Promoções e conteúdos especiais." checked={preferences.marketing_enabled} onCheckedChange={(checked) => setPreferences({ ...preferences, marketing_enabled: checked })} />
            </div>
          </Surface>
        </div>

        <Surface className="mt-4 p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-bold text-territory-ink">Horário de silêncio</h2>
                  <p className="text-xs text-territory-muted">Defina o intervalo e os dias em que deseja suspender avisos.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="quiet-start" className="text-xs font-semibold text-territory-muted">Início</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    aria-invalid={quietHoursPairInvalid}
                    aria-describedby={quietHoursPairInvalid ? "quiet-hours-error" : undefined}
                    className="mt-1 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15"
                    value={preferences.quiet_hours_start || ""}
                    onChange={(event) => setPreferences({ ...preferences, quiet_hours_start: event.target.value || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-xs font-semibold text-territory-muted">Fim</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    aria-invalid={quietHoursPairInvalid}
                    aria-describedby={quietHoursPairInvalid ? "quiet-hours-error" : undefined}
                    className="mt-1 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15"
                    value={preferences.quiet_hours_end || ""}
                    onChange={(event) => setPreferences({ ...preferences, quiet_hours_end: event.target.value || null })}
                  />
                </div>
              </div>

              {quietHoursActive ? (
                <fieldset className="mt-4">
                  <legend className="text-xs font-semibold text-territory-muted">Dias</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUIET_DAY_OPTIONS.map((day) => {
                      const selected = selectedQuietDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${day.label}: ${selected ? "incluído" : "não incluído"} no horário de silêncio`}
                          onClick={() => toggleQuietDay(day.value)}
                          className={cn(
                            "min-h-10 min-w-12 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
                            selected
                              ? "border-territory-brand bg-territory-brand text-white"
                              : "border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/50",
                          )}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {quietHoursPairInvalid ? (
                <p id="quiet-hours-error" className="mt-2 text-xs font-medium text-destructive" role="alert">
                  Informe início e fim do horário silencioso, ou deixe os dois campos vazios.
                </p>
              ) : quietDaysInvalid ? (
                <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                  Selecione pelo menos um dia para aplicar o horário de silêncio.
                </p>
              ) : null}
            </div>

            <Button
              onClick={() => saveMutation.mutate(preferences)}
              disabled={saveMutation.isPending || quietHoursInvalid || !isDirty}
              className="min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90 disabled:bg-territory-raised disabled:text-territory-muted lg:w-auto lg:min-w-44"
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {saveMutation.isPending ? "Salvando..." : isDirty ? "Salvar preferências" : "Preferências salvas"}
            </Button>
          </div>
        </Surface>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Surface className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Neste dispositivo</h2>
                <p className="text-sm text-territory-muted">Permissão e registro reais do navegador atual.</p>
              </div>
            </div>
            <div className="mt-4"><PushNotificationSettings /></div>
          </Surface>

          <Surface className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <MessageCircleMore className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Frequência</h2>
                <p className="text-sm text-territory-muted">O recurso de resumos existente continua disponível.</p>
              </div>
            </div>
            <Select
              value={preferences.frequency}
              onValueChange={(value: NotificationPreferences["frequency"]) => setPreferences({ ...preferences, frequency: value })}
            >
              <SelectTrigger className="mt-4 h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediato</SelectItem>
                <SelectItem value="daily">Resumo diário</SelectItem>
                <SelectItem value="weekly">Resumo semanal</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </Surface>
        </div>
      </AccountSettingsShell>
    </>
  );
}
