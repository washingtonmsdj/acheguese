/**
 * PRIVACY SETTINGS - FASE 6
 * Componente para configurar privacidade granular do perfil.
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { useState } from 'react';
import { MultiProfileService } from '../services/multi-profile';
import type { Profile } from '../services/multi-profile/types';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';

interface PrivacySettingsProps {
  profile: Profile;
  onUpdate?: (profile: Profile) => void;
}

interface PrivacySettingsState {
  is_public: boolean;
  show_contact_email: boolean;
  show_phone: boolean;
  show_linked_profiles: boolean;
  show_business_links: boolean;
  show_professional_links: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getInitialSettings(profile: Profile): PrivacySettingsState {
  return {
    is_public: profile.is_public,
    show_contact_email: profile.show_contact_email,
    show_phone: profile.show_phone,
    show_linked_profiles: profile.show_linked_profiles,
    show_business_links: profile.show_business_links,
    show_professional_links: profile.show_professional_links,
  };
}

export function PrivacySettings({ profile, onUpdate }: PrivacySettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsState>(() => getInitialSettings(profile));

  const handleSave = async () => {
    setSaving(true);

    try {
      const result = await MultiProfileService.updateProfile(profile.id, settings);

      if (result.success && result.data) {
        toast({
          title: 'Configurações salvas',
          description: 'Suas configurações de privacidade foram atualizadas.',
        });
        onUpdate?.(result.data);
      } else {
        throw new Error(result.error || 'Failed to update settings');
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(error, 'Não foi possível salvar as configurações.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initialSettings = getInitialSettings(profile);
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Configurações de Privacidade</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Controle quais informações são visíveis publicamente no seu perfil.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_public">Perfil Público</Label>
            <p className="text-sm text-muted-foreground">
              Seu perfil pode ser encontrado e visualizado por qualquer pessoa.
            </p>
          </div>
          <Switch
            id="is_public"
            checked={settings.is_public}
            onCheckedChange={(checked) => setSettings({ ...settings, is_public: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show_contact_email">Mostrar Email</Label>
            <p className="text-sm text-muted-foreground">
              Exibir seu email de contato no perfil público.
            </p>
          </div>
          <Switch
            id="show_contact_email"
            checked={settings.show_contact_email}
            onCheckedChange={(checked) => setSettings({ ...settings, show_contact_email: checked })}
            disabled={!settings.is_public}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show_phone">Mostrar Telefone</Label>
            <p className="text-sm text-muted-foreground">
              Exibir seu telefone no perfil público.
            </p>
          </div>
          <Switch
            id="show_phone"
            checked={settings.show_phone}
            onCheckedChange={(checked) => setSettings({ ...settings, show_phone: checked })}
            disabled={!settings.is_public}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show_linked_profiles">Mostrar Vínculos</Label>
            <p className="text-sm text-muted-foreground">
              Exibir seus vínculos com outros perfis.
            </p>
          </div>
          <Switch
            id="show_linked_profiles"
            checked={settings.show_linked_profiles}
            onCheckedChange={(checked) => setSettings({ ...settings, show_linked_profiles: checked })}
            disabled={!settings.is_public}
          />
        </div>

        {(profile.profile_type === 'business' || profile.profile_type === 'professional') && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_business_links">Mostrar Vínculos Comerciais</Label>
              <p className="text-sm text-muted-foreground">
                Exibir vínculos do tipo &quot;proprietário&quot; e &quot;parceiro&quot;.
              </p>
            </div>
            <Switch
              id="show_business_links"
              checked={settings.show_business_links}
              onCheckedChange={(checked) => setSettings({ ...settings, show_business_links: checked })}
              disabled={!settings.is_public || !settings.show_linked_profiles}
            />
          </div>
        )}

        {profile.profile_type === 'professional' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_professional_links">Mostrar Vínculos Profissionais</Label>
              <p className="text-sm text-muted-foreground">
                Exibir vínculos do tipo &quot;trabalha em&quot; e &quot;motorista de&quot;.
              </p>
            </div>
            <Switch
              id="show_professional_links"
              checked={settings.show_professional_links}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_professional_links: checked })
              }
              disabled={!settings.is_public || !settings.show_linked_profiles}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
