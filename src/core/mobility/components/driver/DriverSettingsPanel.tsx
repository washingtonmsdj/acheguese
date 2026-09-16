import { useEffect, useState } from "react";
import { Bell, Loader2, Settings, ShieldCheck, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  NotificationPreferencesService,
  type NotificationPreferences,
} from "@/core/notifications/services/NotificationPreferencesService";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { toast } from "sonner";

type PersistedChannel = "push_enabled" | "inapp_enabled";

const CHANNELS: ReadonlyArray<{
  id: PersistedChannel;
  icon: typeof Bell;
  label: string;
  description: string;
}> = [
  {
    id: "inapp_enabled",
    icon: Bell,
    label: "Avisos dentro do Achegue-se",
    description: "Mostra notificações operacionais na central e no aplicativo.",
  },
  {
    id: "push_enabled",
    icon: Smartphone,
    label: "Notificações push",
    description: "Permite alertas push quando o canal estiver disponível no dispositivo.",
  },
];

export function DriverSettingsPanel() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PersistedChannel | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadPreferences = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setPreferences(await NotificationPreferencesService.get());
    } catch {
      setLoadError(true);
      toast.error("Não foi possível carregar suas preferências de notificação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void NotificationPreferencesService.get()
      .then((next) => {
        if (active) setPreferences(next);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateChannel = async (field: PersistedChannel, checked: boolean) => {
    if (!preferences || saving) return;

    setSaving(field);
    try {
      const next = await NotificationPreferencesService.patchChannels(
        field === "push_enabled"
          ? { push_enabled: checked }
          : { inapp_enabled: checked },
      );
      setPreferences(next);
      toast.success(checked ? "Preferência ativada." : "Preferência desativada.");
    } catch {
      toast.error("Não foi possível salvar essa preferência.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-xl border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Carregando preferências</span>
      </div>
    );
  }

  if (loadError || !preferences) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Preferências indisponíveis
        </p>
        <p className="text-xs text-muted-foreground">
          Não foi possível consultar a configuração persistida desta conta.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadPreferences()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground">
      <div className="flex items-center gap-2 border-b p-3">
        <Settings className="h-4 w-4 text-primary" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">Preferências do motorista</h3>
          <p className="text-xs text-muted-foreground">
            Alterações abaixo são salvas na sua conta.
          </p>
        </div>
      </div>

      <div className="divide-y">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const checked = preferences[channel.id];
          const isSaving = saving === channel.id;

          return (
            <div
              key={channel.id}
              className="flex items-center justify-between gap-4 p-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{channel.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : null}
                <Switch
                  checked={checked}
                  onCheckedChange={(next) => void updateChannel(channel.id, next)}
                  disabled={Boolean(saving)}
                  aria-label={`${checked ? "Desativar" : "Ativar"} ${channel.label}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t bg-muted/20 p-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p>
            Alertas transacionais e de segurança continuam obrigatórios. Modos operacionais de corrida e entrega são capabilities verificadas no servidor e não são alterados por um switch local.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate(ACCOUNT_PATHS.notifications)}
        >
          Abrir todas as preferências de notificação
        </Button>
      </div>
    </section>
  );
}
