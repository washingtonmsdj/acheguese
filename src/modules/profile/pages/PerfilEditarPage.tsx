/**
 * /perfil/editar/:profileId â€” Editar perfil completo por tipo
 *
 * SeguranÃ§a:
 *   - Verifica que o profileId pertence ao usuÃ¡rio logado (profiles.user_id = auth.uid)
 *   - Bloqueia acesso a perfis alheios com estado de erro explÃ­cito
 *   - Usa apenas service layer â€” zero acesso direto ao Supabase
 *
 * Campos base (todos os tipos) + campos especÃ­ficos por tipo:
 *   business    â†’ legal_name, cnpj, company_type, industry, endereÃ§o, horÃ¡rios
 *   professional â†’ profession, specialties, license, experience, services, rate
 *   driver      â†’ license, vehicle
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useProfileEditor } from '@/core/profiles';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowLeft, Loader2, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileUsernameSection } from '@/modules/profile/components/identity/ProfileUsernameSection';
import { LocationFields } from '@/modules/profile/components/edit-form/LocationFields';
import { useProfileUsernameSaveGuard } from '@/modules/profile/components/identity/useProfileUsernameSaveGuard';
import { IdentityChangeConfirmDialog } from '@/core/public-identity/components/IdentityChangeConfirmDialog';
import { useIdentitySaveLogger } from '@/core/public-identity/hooks/useIdentitySaveLogger';
import {
  getProfileTypeLabel,
} from '@/modules/profile/utils/profileDomainRules';
import type {
  BusinessData, ProfessionalData, DriverData,
} from '@/core/profiles/services/multi-profile/types';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{children}</p>;
}

// â”€â”€ SeÃ§Ã£o Business â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BusinessSection({ data, onChange }: {
  data: Partial<BusinessData>;
  onChange: (updates: Partial<BusinessData>) => void;
}) {
  const set = <K extends keyof BusinessData>(key: K, value: BusinessData[K]) =>
    onChange({ [key]: value } as Partial<BusinessData>);

  return (
    <div className="space-y-4">
      <SectionTitle>Dados da empresa</SectionTitle>

      <Field id="legal_name" label="Razão social *">
        <Input id="legal_name" value={data.legal_name ?? ''} onChange={e => set('legal_name', e.target.value)} placeholder="Nome legal da empresa" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="cnpj" label="CNPJ">
          <Input id="cnpj" value={data.cnpj ?? ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
        </Field>
        <Field id="company_type" label="Tipo">
          <Select value={data.company_type ?? ''} onValueChange={v => set('company_type', v)}>
            <SelectTrigger id="company_type"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mei">MEI</SelectItem>
              <SelectItem value="ltda">LTDA</SelectItem>
              <SelectItem value="sa">S.A.</SelectItem>
              <SelectItem value="eireli">EIRELI</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field id="industry" label="Setor / Indústria">
        <Input id="industry" value={data.industry ?? ''} onChange={e => set('industry', e.target.value)} placeholder="Ex: Alimentação, Tecnologia, Saúde" />
      </Field>

      <SectionTitle>Endereço comercial</SectionTitle>

      <Field id="business_address" label="Endereço">
        <Input id="business_address" value={data.business_address ?? ''} onChange={e => set('business_address', e.target.value)} placeholder="Rua, número, complemento" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="business_city" label="Cidade">
          <Input id="business_city" value={data.business_city ?? ''} onChange={e => set('business_city', e.target.value)} placeholder="Salvador" />
        </Field>
        <Field id="business_state" label="Estado">
          <Input id="business_state" value={data.business_state ?? ''} onChange={e => set('business_state', e.target.value)} placeholder="BA" maxLength={2} />
        </Field>
      </div>

      <Field id="business_zip" label="CEP">
        <Input id="business_zip" value={data.business_zip ?? ''} onChange={e => set('business_zip', e.target.value)} placeholder="00000-000" />
      </Field>
    </div>
  );
}

// â”€â”€ SeÃ§Ã£o Professional â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProfessionalSection({ data, onChange }: {
  data: Partial<ProfessionalData>;
  onChange: (updates: Partial<ProfessionalData>) => void;
}) {
  const set = <K extends keyof ProfessionalData>(key: K, value: ProfessionalData[K]) =>
    onChange({ [key]: value } as Partial<ProfessionalData>);

  // Arrays como texto separado por vÃ­rgula
  const arrToStr = (arr?: string[]) => arr?.join(', ') ?? '';
  const strToArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      <SectionTitle>Dados profissionais</SectionTitle>

      <Field id="profession" label="Profissão *">
        <Input id="profession" value={data.profession ?? ''} onChange={e => set('profession', e.target.value)} placeholder="Ex: Eletricista, Designer, Advogado" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="years_experience" label="Anos de experiência">
          <Input id="years_experience" type="number" min={0} max={60}
            value={data.years_experience ?? ''}
            onChange={e => set('years_experience', Number(e.target.value))} />
        </Field>
        <Field id="hourly_rate" label="Valor/hora (R$)">
          <Input id="hourly_rate" type="number" min={0}
            value={data.hourly_rate ?? ''}
            onChange={e => set('hourly_rate', Number(e.target.value))} />
        </Field>
      </div>

      <Field id="specialties" label="Especialidades" hint="Separe por vírgula">
        <Input id="specialties" value={arrToStr(data.specialties)}
          onChange={e => set('specialties', strToArr(e.target.value))}
          placeholder="Ex: Instalação elétrica, Manutenção predial" />
      </Field>

      <Field id="services_offered" label="Serviços oferecidos" hint="Separe por vírgula">
        <Input id="services_offered" value={arrToStr(data.services_offered)}
          onChange={e => set('services_offered', strToArr(e.target.value))}
          placeholder="Ex: Visita técnica, Orçamento gratuito" />
      </Field>

      <Field id="service_area" label="Áreas de atendimento" hint="Separe por vírgula">
        <Input id="service_area" value={arrToStr(data.service_area)}
          onChange={e => set('service_area', strToArr(e.target.value))}
          placeholder="Ex: Nordeste de Amaralina, Pituba, Barra" />
      </Field>

      <Field id="education" label="Formação">
        <Input id="education" value={data.education ?? ''} onChange={e => set('education', e.target.value)} placeholder="Ex: Técnico em Eletrotécnica - SENAI" />
      </Field>

      <Field id="certifications" label="Certificações" hint="Separe por vírgula">
        <Input id="certifications" value={arrToStr(data.certifications)}
          onChange={e => set('certifications', strToArr(e.target.value))}
          placeholder="Ex: NR10, NR35" />
      </Field>

      <SectionTitle>Registro profissional</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        <Field id="license_number" label="Número do registro">
          <Input id="license_number" value={data.license_number ?? ''} onChange={e => set('license_number', e.target.value)} placeholder="CRM, CREA, OAB..." />
        </Field>
        <Field id="license_state" label="Estado do registro">
          <Input id="license_state" value={data.license_state ?? ''} onChange={e => set('license_state', e.target.value)} placeholder="BA" maxLength={2} />
        </Field>
      </div>

      <ToggleRow
        label="Atende remotamente"
        description="Aceita clientes fora da área de atendimento presencial"
        checked={data.accepts_remote ?? false}
        onChange={v => set('accepts_remote', v)}
      />
    </div>
  );
}

// â”€â”€ SeÃ§Ã£o Driver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DriverSection({ data, onChange }: {
  data: Partial<DriverData>;
  onChange: (updates: Partial<DriverData>) => void;
}) {
  const set = <K extends keyof DriverData>(key: K, value: DriverData[K]) =>
    onChange({ [key]: value } as Partial<DriverData>);

  return (
    <div className="space-y-4">
      <SectionTitle>Habilitação</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        <Field id="license_number" label="Número da CNH *">
          <Input id="license_number" value={data.license_number ?? ''} onChange={e => set('license_number', e.target.value)} placeholder="00000000000" />
        </Field>
        <Field id="license_category" label="Categoria *">
          <Select value={data.license_category ?? ''} onValueChange={v => set('license_category', v)}>
            <SelectTrigger id="license_category"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              {['A', 'B', 'AB', 'C', 'D', 'E'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field id="license_expiry" label="Validade *">
          <Input id="license_expiry" type="date" value={data.license_expiry ?? ''} onChange={e => set('license_expiry', e.target.value)} />
        </Field>
        <Field id="license_state" label="Estado emissor *">
          <Input id="license_state" value={data.license_state ?? ''} onChange={e => set('license_state', e.target.value)} placeholder="BA" maxLength={2} />
        </Field>
      </div>

      <SectionTitle>Veículo</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        <Field id="vehicle_type" label="Tipo">
          <Select value={data.vehicle_type ?? ''} onValueChange={v => set('vehicle_type', v)}>
            <SelectTrigger id="vehicle_type"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Carro</SelectItem>
              <SelectItem value="motorcycle">Moto</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Caminhão</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="vehicle_plate" label="Placa">
          <Input id="vehicle_plate" value={data.vehicle_plate ?? ''} onChange={e => set('vehicle_plate', e.target.value.toUpperCase())} placeholder="AAA-0000" maxLength={8} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field id="vehicle_model" label="Modelo">
          <Input id="vehicle_model" value={data.vehicle_model ?? ''} onChange={e => set('vehicle_model', e.target.value)} placeholder="Ex: Fiat Uno" />
        </Field>
        <Field id="vehicle_year" label="Ano">
          <Input id="vehicle_year" type="number" min={1990} max={new Date().getFullYear() + 1}
            value={data.vehicle_year ?? ''}
            onChange={e => set('vehicle_year', Number(e.target.value))} />
        </Field>
      </div>

      <Field id="vehicle_color" label="Cor">
        <Input id="vehicle_color" value={data.vehicle_color ?? ''} onChange={e => set('vehicle_color', e.target.value)} placeholder="Ex: Branco" />
      </Field>

      <ToggleRow
        label="Disponível para corridas"
        checked={data.is_available ?? false}
        onChange={v => set('is_available', v)}
      />
    </div>
  );
}

// â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PerfilEditarPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const {
    state,
    error,
    profile,
    editableUsername,
    baseForm,
    setBaseField,
    username,
    setUsername,
    originalUsername,
    bizForm,
    setBizForm,
    proForm,
    setProForm,
    drvForm,
    setDrvForm,
    extLoading,
    saving,
    saveProfile,
  } = useProfileEditor(profileId);
  const profileType = profile?.profile_type ?? null;

  // Hook de logs - sempre chamado, independente do tipo de perfil
  const { logAttempt, logSuccess, logError } = useIdentitySaveLogger({
    entityType: 'profile',
    entityId: profileId || '',
    userId: user?.id || '',
    page: 'PerfilEditarPage',
  });

  // Função doSave definida antes do hook que a usa
  const doSave = async () => {
    if (!profile) return;
    if (!baseForm.display_name?.trim()) {
      toast.error('Nome de exibição é obrigatório');
      return;
    }

    const hasUsernameChange = editableUsername !== null && username !== originalUsername && originalUsername;
    if (hasUsernameChange) {
      logAttempt(originalUsername, username);
    }

    try {
      const result = await saveProfile();
      if (!result.success) throw new Error(result.error);

      if (hasUsernameChange) {
        logSuccess(originalUsername, username);
      }

      toast.success('Perfil atualizado');
      navigate(appUrls.profile.central);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao salvar';
      const errCode =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: unknown }).code ?? '')
          : undefined;
      if (hasUsernameChange) {
        logError(originalUsername, username, errMessage, errCode);
      }
      toast.error(errMessage);
    }
  };

  // Hook de confirmação - sempre chamado, independente do tipo de perfil
  // A condição entra no render, não na chamada do hook
  const { triggerSave: handleSave, confirmProps: usernameConfirmProps } = useProfileUsernameSaveGuard({
    username,
    originalUsername,
    onSave: doSave,
  });

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // EARLY RETURNS - somente apos todos os hooks e effects
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // â”€â”€ Acesso negado â”€â”€
  if (state === 'denied') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para editar este perfil.
        </p>
        <Button variant="outline" onClick={() => navigate(appUrls.profile.central)}>Voltar</Button>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold">Perfil não encontrado</h2>
        <p className="text-sm text-muted-foreground">
          O perfil solicitado não está disponível para edição neste contexto.
        </p>
        <Button variant="outline" onClick={() => navigate(appUrls.profile.central)}>Voltar</Button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-lg font-semibold">Falha ao carregar edição</h2>
        <p className="text-sm text-muted-foreground">
          {error ?? 'Não foi possível carregar o agregado canônico de edição.'}
        </p>
        <Button variant="outline" onClick={() => navigate(appUrls.profile.central)}>Voltar</Button>
      </div>
    );
  }

  if (state === 'checking' || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // HELPERS E RENDER - DEPOIS DOS EARLY RETURNS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.central)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Editar perfil</h1>
          <p className="text-xs text-muted-foreground">
            {profile.display_name} · {getProfileTypeLabel(profile)}
          </p>
        </div>
      </div>

      <Separator />

      {/* Campos base */}
      <div className="space-y-4">
        <SectionTitle>Informações básicas</SectionTitle>

        <Field id="display_name" label="Nome de exibição *">
          <Input id="display_name" value={baseForm.display_name ?? ''} onChange={e => setBaseField('display_name', e.target.value)} />
        </Field>

        <Field id="bio" label="Bio">
          <Textarea id="bio" value={baseForm.bio ?? ''} onChange={e => setBaseField('bio', e.target.value)} rows={3} placeholder="Conte um pouco sobre você ou seu negócio" />
        </Field>

        <Field id="website" label="Website">
          <Input id="website" type="url" value={baseForm.website ?? ''} onChange={e => setBaseField('website', e.target.value)} placeholder="https://" />
        </Field>

        <Field id="location_id" label="Bairro (canônico)">
          <LocationFields
            locationId={baseForm.location_id ?? null}
            onChange={(locationId) => setBaseField('location_id', locationId ?? undefined)}
          />
        </Field>

        <Field id="street" label="Rua">
          <Input
            id="street"
            value={baseForm.street ?? ''}
            onChange={e => setBaseField('street', e.target.value)}
            placeholder="Ex: Rua Afonso Lopes"
          />
        </Field>

        <SectionTitle>Contato público</SectionTitle>

        <Field id="contact_email" label="E-mail de contato" hint="Diferente do e-mail de login">
          <Input id="contact_email" type="email" value={baseForm.contact_email ?? ''} onChange={e => setBaseField('contact_email', e.target.value)} />
        </Field>

        <Field id="phone" label="Telefone">
          <Input id="phone" type="tel" value={baseForm.phone ?? ''} onChange={e => setBaseField('phone', e.target.value)} placeholder="(71) 99999-9999" />
        </Field>

        <SectionTitle>Visibilidade</SectionTitle>

        <ToggleRow label="Perfil público" description="Aparece em buscas e na URL /u/:username"
          checked={baseForm.is_public ?? false} onChange={v => setBaseField('is_public', v)} />
        <ToggleRow label="Mostrar e-mail de contato"
          checked={baseForm.show_contact_email ?? false} onChange={v => setBaseField('show_contact_email', v)} />
        <ToggleRow label="Mostrar telefone"
          checked={baseForm.show_phone ?? false} onChange={v => setBaseField('show_phone', v)} />
        <ToggleRow label="Mostrar vínculos"
          checked={baseForm.show_linked_profiles ?? false} onChange={v => setBaseField('show_linked_profiles', v)} />
      </div>

      {/* Username â€” apenas para perfil pessoal */}
      {editableUsername !== null && (
        <>
          <Separator />
          <ProfileUsernameSection
            username={username}
            onUsernameChange={setUsername}
            originalUsername={originalUsername}
            profileId={profile.id}
          />
          <IdentityChangeConfirmDialog {...usernameConfirmProps} />
        </>
      )}

      {/* ExtensÃ£o por tipo */}      {extLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />Carregando dados específicos...
        </div>
      ) : (
        <>
          {profileType === 'business' && (
            <>
              <Separator />
              <BusinessSection data={bizForm} onChange={u => setBizForm(prev => ({ ...prev, ...u }))} />
            </>
          )}
          {profileType === 'professional' && (
            <>
              <Separator />
              <ProfessionalSection data={proForm} onChange={u => setProForm(prev => ({ ...prev, ...u }))} />
            </>
          )}
          {profileType === 'driver' && (
            <>
              <Separator />
              <DriverSection data={drvForm} onChange={u => setDrvForm(prev => ({ ...prev, ...u }))} />
            </>
          )}
        </>
      )}

      <Separator />

      <div className="flex gap-3 pb-8">
        <Button variant="outline" className="flex-1" onClick={() => navigate(appUrls.profile.central)}>Cancelar</Button>
        <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving || extLoading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

