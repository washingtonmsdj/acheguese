import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  MessageSquare,
  Heart,
  Users,
  Building2,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationService } from "@/core/notifications";

interface NotificationSettingsProps {
  userId: string;
  onUpdate: () => void | Promise<void>;
}

type NotificationSettingsForm = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newMessages: boolean;
  newComments: boolean;
  newLikes: boolean;
  newFollowers: boolean;
  businessUpdates: boolean;
  communityUpdates: boolean;
  weeklyDigest: boolean;
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DEFAULT_FORM: NotificationSettingsForm = {
  emailNotifications: true,
  pushNotifications: true,
  newMessages: true,
  newComments: true,
  newLikes: true,
  newFollowers: true,
  businessUpdates: true,
  communityUpdates: true,
  weeklyDigest: true,
};

function toFormState(
  settings?: Partial<{
    email_notifications: boolean;
    push_notifications: boolean;
    new_messages: boolean;
    new_comments: boolean;
    new_likes: boolean;
    new_followers: boolean;
    business_updates: boolean;
    community_updates: boolean;
    weekly_digest: boolean;
  }> | null,
): NotificationSettingsForm {
  return {
    emailNotifications: settings?.email_notifications ?? DEFAULT_FORM.emailNotifications,
    pushNotifications: settings?.push_notifications ?? DEFAULT_FORM.pushNotifications,
    newMessages: settings?.new_messages ?? DEFAULT_FORM.newMessages,
    newComments: settings?.new_comments ?? DEFAULT_FORM.newComments,
    newLikes: settings?.new_likes ?? DEFAULT_FORM.newLikes,
    newFollowers: settings?.new_followers ?? DEFAULT_FORM.newFollowers,
    businessUpdates: settings?.business_updates ?? DEFAULT_FORM.businessUpdates,
    communityUpdates: settings?.community_updates ?? DEFAULT_FORM.communityUpdates,
    weeklyDigest: settings?.weekly_digest ?? DEFAULT_FORM.weeklyDigest,
  };
}

function toServicePayload(settings: NotificationSettingsForm) {
  return {
    email_notifications: settings.emailNotifications,
    push_notifications: settings.pushNotifications,
    new_messages: settings.newMessages,
    new_comments: settings.newComments,
    new_likes: settings.newLikes,
    new_followers: settings.newFollowers,
    business_updates: settings.businessUpdates,
    community_updates: settings.communityUpdates,
    weekly_digest: settings.weeklyDigest,
  };
}

export function NotificationSettings({
  userId,
  onUpdate,
}: NotificationSettingsProps) {
  const notificationService = new NotificationService();
  const [settings, setSettings] = useState<NotificationSettingsForm>(DEFAULT_FORM);

  const settingsQuery = useQuery({
    queryKey: ["profile", "notification-settings", userId],
    queryFn: () => notificationService.getNotificationSettings(userId),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(toFormState(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (nextSettings: NotificationSettingsForm) => {
      await notificationService.updateNotificationSettings(
        userId,
        toServicePayload(nextSettings),
      );
    },
    onSuccess: async () => {
      await settingsQuery.refetch();
      toast.success("Configuracoes de notificacoes atualizadas.");
      await Promise.resolve(onUpdate());
    },
    onError: () => {
      toast.error("Erro ao salvar configuracoes.");
    },
  });

  const handleToggle = (key: keyof NotificationSettingsForm) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleReset = () => {
    setSettings(toFormState(settingsQuery.data));
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(settings);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando preferencias de notificacao...
          </p>
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Falha ao carregar notificacoes
            </h2>
            <p className="text-sm text-muted-foreground">
              O painel privado nao vai operar em cima de defaults locais quando o
              estado persistido nao estiver disponivel.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void settingsQuery.refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificacoes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          O estado abaixo reflete o contrato persistido em
          `user_notification_settings`.
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Canais de notificacao
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <ToggleRow
            id="emailNotifications"
            icon={Mail}
            label="Notificacoes por email"
            description="Receba atualizacoes importantes por email."
            checked={settings.emailNotifications}
            onToggle={() => handleToggle("emailNotifications")}
          />
          <Separator />
          <ToggleRow
            id="pushNotifications"
            icon={Bell}
            label="Notificacoes push"
            description="Receba alertas em tempo real no navegador."
            checked={settings.pushNotifications}
            onToggle={() => handleToggle("pushNotifications")}
          />
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Atividades sociais
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <ToggleRow
            id="newMessages"
            label="Novas mensagens"
            description="Quando alguem enviar uma mensagem direta."
            checked={settings.newMessages}
            onToggle={() => handleToggle("newMessages")}
          />
          <Separator />
          <ToggleRow
            id="newComments"
            label="Novos comentarios"
            description="Quando alguem comentar nos seus posts."
            checked={settings.newComments}
            onToggle={() => handleToggle("newComments")}
          />
          <ToggleRow
            id="newLikes"
            icon={Heart}
            label="Novas curtidas"
            description="Quando alguem curtir seus posts ou comentarios."
            checked={settings.newLikes}
            onToggle={() => handleToggle("newLikes")}
          />
          <ToggleRow
            id="newFollowers"
            icon={Users}
            label="Novos seguidores"
            description="Quando alguem comecar a seguir voce."
            checked={settings.newFollowers}
            onToggle={() => handleToggle("newFollowers")}
          />
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Atualizacoes da plataforma
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <ToggleRow
            id="businessUpdates"
            label="Atualizacoes de empresas"
            description="Novidades sobre empresas que voce acompanha."
            checked={settings.businessUpdates}
            onToggle={() => handleToggle("businessUpdates")}
          />
          <Separator />
          <ToggleRow
            id="communityUpdates"
            label="Atualizacoes da comunidade"
            description="Alertas e novidades da sua comunidade."
            checked={settings.communityUpdates}
            onToggle={() => handleToggle("communityUpdates")}
          />
          <ToggleRow
            id="weeklyDigest"
            label="Resumo semanal"
            description="Receba um resumo semanal das atividades relevantes."
            checked={settings.weeklyDigest}
            onToggle={() => handleToggle("weeklyDigest")}
          />
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex justify-end gap-3 pt-2"
      >
        <Button variant="outline" onClick={handleReset} disabled={saveMutation.isPending}>
          Restaurar estado salvo
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending}
          className="gap-2 min-w-32"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar alteracoes
        </Button>
      </motion.div>
    </div>
  );
}

function ToggleRow({
  id,
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer"
        >
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
