import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Eye,
  Globe,
  Loader2,
  Lock,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { profileService } from "@/core/profiles/services";
import type {
  Profile,
  ProfilePrivacySettingsInput,
} from "@/core/profiles/services";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";

interface PrivacySettingsProps {
  profile: Profile | null;
  onUpdate: () => void | Promise<void>;
}

interface PrivacySettingsForm {
  profileVisible: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  showActivity: boolean;
  showBusinesses: boolean;
}

interface ToggleRowProps {
  id: keyof PrivacySettingsForm;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  icon?: LucideIcon;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DEFAULT_SETTINGS: PrivacySettingsForm = {
  profileVisible: true,
  showEmail: false,
  showPhone: false,
  showLocation: true,
  allowMessages: true,
  showActivity: true,
  showBusinesses: true,
};

function toFormState(profile: Profile | null): PrivacySettingsForm {
  return {
    profileVisible: profile?.is_public ?? DEFAULT_SETTINGS.profileVisible,
    showEmail: profile?.show_email ?? DEFAULT_SETTINGS.showEmail,
    showPhone: profile?.show_phone ?? DEFAULT_SETTINGS.showPhone,
    showLocation: profile?.show_location ?? DEFAULT_SETTINGS.showLocation,
    allowMessages: profile?.allow_messages ?? DEFAULT_SETTINGS.allowMessages,
    showActivity: profile?.show_activity ?? DEFAULT_SETTINGS.showActivity,
    showBusinesses: profile?.show_businesses ?? DEFAULT_SETTINGS.showBusinesses,
  };
}

function toServicePayload(
  settings: PrivacySettingsForm,
): ProfilePrivacySettingsInput {
  return {
    is_public: settings.profileVisible,
    show_email: settings.showEmail,
    show_phone: settings.showPhone,
    show_location: settings.showLocation,
    allow_messages: settings.allowMessages,
    show_activity: settings.showActivity,
    show_businesses: settings.showBusinesses,
  };
}

function ToggleRow({
  id,
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: ToggleRowProps) {
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

export function PrivacySettings({ profile, onUpdate }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsForm>(() =>
    toFormState(profile),
  );

  useEffect(() => {
    setSettings(toFormState(profile));
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (nextSettings: PrivacySettingsForm) => {
      if (!profile?.id) {
        throw new Error("Perfil ativo indisponivel para atualizar privacidade.");
      }

      await profileService.updatePrivacySettings(
        profile.id,
        toServicePayload(nextSettings),
      );
    },
    onSuccess: async () => {
      toast.success("Configuracoes de privacidade atualizadas.");
      await Promise.resolve(onUpdate());
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao salvar configuracoes de privacidade.";
      toast.error(message);
    },
  });

  const handleToggle = (
    key: keyof PrivacySettingsForm,
    checked: boolean,
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: checked,
    }));
  };

  const handleReset = () => {
    setSettings(toFormState(profile));
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(settings);
  };

  if (!profile) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Perfil indisponivel
            </h2>
            <p className="text-sm text-muted-foreground">
              O hub privado nao deve editar privacidade sem um perfil ativo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacidade
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Controle quem pode ver seus dados publicos e interagir com voce.
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Visibilidade do perfil
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <ToggleRow
            id="profileVisible"
            icon={Globe}
            label="Perfil publico"
            description="Seu perfil pode ser encontrado por qualquer pessoa."
            checked={settings.profileVisible}
            onToggle={(checked) => handleToggle("profileVisible", checked)}
          />
          <Separator />
          <ToggleRow
            id="showEmail"
            label="Mostrar email"
            description="Outros usuarios podem ver seu email."
            checked={settings.showEmail}
            onToggle={(checked) => handleToggle("showEmail", checked)}
          />
          <ToggleRow
            id="showPhone"
            label="Mostrar telefone"
            description="Outros usuarios podem ver seu telefone."
            checked={settings.showPhone}
            onToggle={(checked) => handleToggle("showPhone", checked)}
          />
          <ToggleRow
            id="showLocation"
            label="Mostrar localizacao"
            description="Outros usuarios podem ver sua cidade e bairro."
            checked={settings.showLocation}
            onToggle={(checked) => handleToggle("showLocation", checked)}
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
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Interacoes</h3>
        </div>
        <div className="p-5 space-y-5">
          <ToggleRow
            id="allowMessages"
            icon={Lock}
            label="Permitir mensagens"
            description="Outros usuarios podem enviar mensagens diretas."
            checked={settings.allowMessages}
            onToggle={(checked) => handleToggle("allowMessages", checked)}
          />
          <Separator />
          <ToggleRow
            id="showActivity"
            label="Mostrar atividade"
            description="Outros usuarios podem ver seus posts e comentarios."
            checked={settings.showActivity}
            onToggle={(checked) => handleToggle("showActivity", checked)}
          />
          <ToggleRow
            id="showBusinesses"
            label="Mostrar empresas"
            description="Outros usuarios podem ver suas empresas vinculadas."
            checked={settings.showBusinesses}
            onToggle={(checked) => handleToggle("showBusinesses", checked)}
          />
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex justify-end gap-3 pt-2"
      >
        <Button variant="outline" onClick={handleReset}>
          Cancelar
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
