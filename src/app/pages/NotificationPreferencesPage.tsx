import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Clock3,
  Loader2,
  Mail,
  MessageCircleMore,
  MonitorSmartphone,
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/8 text-territory-brand">
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
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => NotificationPreferencesService.get(),
    enabled: !!user,
  });

  useEffect(() => {
    if (data) setPreferences(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => NotificationPreferencesService.patchAll(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({ title: "Preferências salvas", description: "Suas preferências de notificação foram atualizadas." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return <Navigate to={appUrls.auth.login} replace />;

  if (isLoading) {
    return (
      <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
        <Loader2 className="h-8 w-8 animate-spin text-territory-brand" aria-label="Carregando preferências" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Notificações | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Controle o que chega até você"
        description="Escolha como e sobre o que deseja ser notificado."
      >
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
                label="Neste dispositivo"
                description="Use notificações push quando o navegador permitir."
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, push_enabled: checked })}
              />
            </div>
          </Surface>

          <Surface className="p-4 sm:p-5">
            <h2 className="font-heading text-base font-bold text-territory-ink">Tipos de notificação</h2>
            <div className="mt-2">
              <PreferenceRow
                id="transactional"
                icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
                label="Pedidos e atendimentos"
                description="Pedidos, pagamentos e confirmações essenciais."
                checked={preferences.transactional_enabled}
                disabled
              />
              <PreferenceRow
                id="social"
                icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
                label="Comunidade"
                description="Comentários, menções e interações."
                checked={preferences.social_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, social_enabled: checked })}
              />
              <PreferenceRow
                id="system"
                icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
                label="Sistema"
                description="Atualizações e avisos importantes."
                checked={preferences.system_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, system_enabled: checked })}
              />
              <PreferenceRow
                id="marketing"
                icon={<Tag className="h-5 w-5" aria-hidden="true" />}
                label="Ofertas e novidades"
                description="Promoções e conteúdos especiais."
                checked={preferences.marketing_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, marketing_enabled: checked })}
              />
            </div>
          </Surface>
        </div>

        <Surface className="mt-4 p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
              <div className="flex items-center gap-3 sm:self-start sm:pt-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand/8 text-territory-brand">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="sm:hidden">
                  <h2 className="font-heading text-base font-bold text-territory-ink">Horário de silêncio</h2>
                  <p className="text-xs text-territory-muted">Evite avisos em um intervalo definido.</p>
                </div>
              </div>
              <div>
                <Label htmlFor="quiet-start" className="text-xs font-semibold text-territory-muted">Início</Label>
                <input
                  id="quiet-start"
                  type="time"
                  className="mt-1 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink"
                  value={preferences.quiet_hours_start || ""}
                  onChange={(event) => setPreferences({ ...preferences, quiet_hours_start: event.target.value || null })}
                />
              </div>
              <div>
                <Label htmlFor="quiet-end" className="text-xs font-semibold text-territory-muted">Fim</Label>
                <input
                  id="quiet-end"
                  type="time"
                  className="mt-1 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink"
                  value={preferences.quiet_hours_end || ""}
                  onChange={(event) => setPreferences({ ...preferences, quiet_hours_end: event.target.value || null })}
                />
              </div>
            </div>
            <Button
              onClick={() => saveMutation.mutate(preferences)}
              disabled={saveMutation.isPending}
              className="min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90 lg:w-auto lg:min-w-44"
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar preferências
            </Button>
          </div>
        </Surface>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Surface className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Push no dispositivo</h2>
                <p className="text-sm text-territory-muted">Permissão e registro do navegador atual.</p>
              </div>
            </div>
            <div className="mt-4">
              <PushNotificationSettings />
            </div>
          </Surface>

          <Surface className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <MessageCircleMore className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Frequência</h2>
                <p className="text-sm text-territory-muted">Mantenha o recurso atual de resumos além do concept.</p>
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
