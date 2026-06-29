/**
 * /conta/editar/:profileId - Editar perfil completo por tipo
 *
 * Segurança:
 *   - Verifica que o profileId pertence ao usuário logado (profiles.user_id = auth.uid)
 *   - Bloqueia acesso a perfis alheios com estado de erro explícito
 *   - Usa apenas service layer - zero acesso direto ao Supabase
 *
 * Campos base (todos os tipos) + campos específicos por tipo:
 *   business     -> legal_name, cnpj, company_type, industry, endereco, horarios
 *   professional -> profession, specialties, license, experience, services, rate
 *   driver       -> license, vehicle
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
} from '@/core/profile/utils/profileDomainRules';
import type {
  BusinessData, ProfessionalData, DriverData,
} from '@/core/profiles/services/multi-profile/types';

// Helpers

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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{children}</p>;
}

// Business section

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="cnpj" label="CNPJ">
          <Input id="cnpj" value={data.cnpj ?? ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
        </Field>
        <Field id="company_type" label="Tipo">
          <Select
            value={data.company_type ?? ''}
            onValueChange={(v) => set('company_type', v as BusinessData['company_type'])}
          >
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="business_city" label="Cidade">
          <Input id="business_city" value={data.business_city ?? ''} onChange={e => set('business_city', e.target.value)} placeholder="Cidade" />
        </Field>
        <Field id="business_state" label="Estado">
          <Input id="business_state" value={data.business_state ?? ''} onChange={e => set('business_state', e.target.value)} placeholder="UF" maxLength={2} />
        </Field>
      </div>

      <Field id="business_zip" label="CEP">
        <Input id="business_zip" value={data.business_zip ?? ''} onChange={e => set('business_zip', e.target.value)} placeholder="00000-000" />
      </Field>
    </div>
  );
}

// Professional section

function ProfessionalSection({ data, onChange }: {
  data: Partial<ProfessionalData>;
  onChange: (updates: Partial<ProfessionalData>) => void;
}) {
  const set = <K extends keyof ProfessionalData>(key: K, value: ProfessionalData[K]) =>
    onChange({ [key]: value } as Partial<ProfessionalData>);

  // Arrays como texto separado por virgula
  const arrToStr = (arr?: string[]) => arr?.join(', ') ?? '';
  const strToArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      <SectionTitle>Dados profissionais</SectionTitle>

      <Field id="profession" label="Profissão *">
        <Input id="profession" value={data.profession ?? ''} onChange={e => set('profession', e.target.value)} placeholder="Ex: Eletricista, Designer, Advogado" />
      </Field>

      <Field id="professional_name" label="Nome profissional">
        <Input
          id="professional_name"
          value={data.professional_name ?? ''}
          onChange={e => set('professional_name', e.target.value)}
          placeholder="Como este perfil profissional deve aparecer publicamente"
        />
      </Field>

      <Field id="service_category" label="Categoria profissional">
        <Input
          id="service_category"
          value={data.service_category ?? ''}
          onChange={e => set('service_category', e.target.value)}
          placeholder="Ex: Construção, Alimentação, Elétrica"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          placeholder="Ex: Centro, Zona Norte, bairros atendidos" />
      </Field>

      <Field id="availability_notes" label="Disponibilidade">
        <Textarea
          id="availability_notes"
          rows={2}
          value={data.availability_notes ?? ''}
          onChange={e => set('availability_notes', e.target.value)}
          placeholder="Ex: Segunda a sexta, 08:00 às 18:00. Sábados sob agendamento."
        />
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="license_number" label="Número do registro">
          <Input id="license_number" value={data.license_number ?? ''} onChange={e => set('license_number', e.target.value)} placeholder="CRM, CREA, OAB..." />
        </Field>
        <Field id="license_state" label="Estado do registro">
          <Input id="license_state" value={data.license_state ?? ''} onChange={e => set('license_state', e.target.value)} placeholder="UF" maxLength={2} />
        </Field>
      </div>

      <ToggleRow
        label="Atende remotamente"
        description="Aceita clientes fora da area de atendimento presencial"
        checked={data.accepts_remote ?? false}
        onChange={v => set('accepts_remote', v)}
      />

      <Field
        id="professional_visibility"
        label="Visibilidade do perfil profissional"
        hint="Controla se o perfil aparece no marketplace público."
      >
        <Select
          value={data.visibility ?? 'public_listed'}
          onValueChange={v =>
            set('visibility', v as 'public_listed' | 'public_unlisted' | 'private')
          }
        >
          <SelectTrigger id="professional_visibility">
            <SelectValue placeholder="Selecione a visibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public_listed">Público listado</SelectItem>
            <SelectItem value="public_unlisted">Público não listado</SelectItem>
            <SelectItem value="private">Privado</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
// Driver section

function DriverSection({ data, onChange }: {
  data: Partial<DriverData>;
  onChange: (updates: Partial<DriverData>) => void;
}) {
  const set = <K extends keyof DriverData>(key: K, value: DriverData[K]) =>
    onChange({ [key]: value } as Partial<DriverData>);

  return (
    <div className="space-y-4">
      <SectionTitle>Habilitação</SectionTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="license_expiry" label="Validade *">
          <Input id="license_expiry" type="date" value={data.license_expiry ?? ''} onChange={e => set('license_expiry', e.target.value)} />
        </Field>
        <Field id="license_state" label="Estado emissor *">
          <Input id="license_state" value={data.license_state ?? ''} onChange={e => set('license_state', e.target.value)} placeholder="UF" maxLength={2} />
        </Field>
      </div>

      <SectionTitle>Veículo</SectionTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="vehicle_type" label="Tipo">
          <Select
            value={data.vehicle_type ?? ''}
            onValueChange={(v) => set('vehicle_type', v as DriverData['vehicle_type'])}
          >
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

// Main component

export default function ContaEditarPerfilPage() {
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
    page: 'ContaEditarPerfilPage',
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
      navigate('/conta');
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

  // Early returns: somente apos todos os hooks e effects

  // Acesso negado
  if (state === 'denied') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para editar este perfil.
        </p>
        <Button variant="outline" onClick={() => navigate('/conta')}>Voltar</Button>
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
        <Button variant="outline" onClick={() => navigate('/conta')}>Voltar</Button>
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
        <Button variant="outline" onClick={() => navigate('/conta')}>Voltar</Button>
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

  // HELPERS E RENDER - DEPOIS DOS EARLY RETURNS
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]">
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        {/* Header */}
        <div className="sticky top-0 z-20 -mx-3 mb-4 border-b border-border/60 bg-background/92 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => navigate('/conta')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">Editor de identidade</p>
                <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">Editar perfil</h1>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.display_name} | {getProfileTypeLabel(profile)}
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 gap-2 sm:flex">
              <Button variant="outline" onClick={() => navigate('/conta')}>Cancelar</Button>
              <Button className="gap-2" onClick={handleSave} disabled={saving || extLoading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5">
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-3 rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-foreground">Nesta tela</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Identidade pública</p>
                <p>Contato exibido</p>
                <p>Visibilidade</p>
                {editableUsername !== null && <p>URL pública</p>}
                {profileType !== 'personal' && <p>Dados operacionais</p>}
              </div>
              <Separator />
              <div className="rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                Endereço residencial e entrega ficam em Configurações operacionais, não neste formulário.
              </div>
            </div>
          </aside>

          <main className="space-y-4 sm:space-y-5">
            {/* Campos base */}
            <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
              <div className="space-y-4">
                <SectionTitle>Informações básicas</SectionTitle>

                <Field id="display_name" label="Nome de exibição *">
                  <Input id="display_name" value={baseForm.display_name ?? ''} onChange={e => setBaseField('display_name', e.target.value)} />
                </Field>

                <Field id="bio" label="Bio">
                  <Textarea id="bio" value={baseForm.bio ?? ''} onChange={e => setBaseField('bio', e.target.value)} rows={3} placeholder="Conte um pouco sobre você ou seu negócio" />
                </Field>

                {profileType === 'personal' && (
                  <Field id="short_bio" label="Bio curta social" hint="Resumo curto para identidade social (máx. 280)">
                    <Textarea
                      id="short_bio"
                      value={baseForm.short_bio ?? ''}
                      onChange={e => setBaseField('short_bio', e.target.value.slice(0, 280))}
                      rows={2}
                      placeholder="Quem é você na sua comunidade e território"
                    />
                  </Field>
                )}

                <Field id="website" label="Website">
                  <Input id="website" type="url" value={baseForm.website ?? ''} onChange={e => setBaseField('website', e.target.value)} placeholder="https://" />
                </Field>

                {profileType !== 'personal' && (
                  <Field id="location_id" label="Bairro (canônico)">
                    <LocationFields
                      locationId={baseForm.location_id ?? null}
                      onChange={(locationId) => setBaseField('location_id', locationId ?? undefined)}
                    />
                  </Field>
                )}

                {profileType === 'personal' && (
                  <Field id="main_territory_location_id" label="Território principal">
                    <LocationFields
                      locationId={baseForm.main_territory_location_id ?? null}
                      onChange={(locationId) => setBaseField('main_territory_location_id', locationId ?? undefined)}
                    />
                  </Field>
                )}

                {profileType === 'personal' && (
                  <Field
                    id="community_reputation_score"
                    label="Reputação comunitária"
                    hint="Pontuação social na comunidade local."
                  >
                    <Input
                      id="community_reputation_score"
                      type="number"
                      min={0}
                      value={baseForm.community_reputation_score ?? 0}
                      onChange={(e) => setBaseField('community_reputation_score', Number(e.target.value))}
                    />
                  </Field>
                )}

                {profileType === 'personal' && (
                  <div className="rounded-2xl border border-border bg-muted/30 p-3">
                    <p className="text-sm font-medium">Participação e grupos</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A participação em grupos é vinculada automaticamente pela sua atuação em comunidades e organizações.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Endereço de entrega não é salvo aqui</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta tela edita apenas identidade pública, como bio e visibilidade de localização.
                    Endereço completo de entrega é restrito e fica somente em Configurações operacionais.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full sm:w-auto"
                    onClick={() => navigate(appUrls.profile.addresses)}
                  >
                    Abrir configurações operacionais
                  </Button>
                </div>

                <SectionTitle>Contato público</SectionTitle>

                <Field id="contact_email" label="E-mail de contato" hint="Diferente do e-mail de login">
                  <Input id="contact_email" type="email" value={baseForm.contact_email ?? ''} onChange={e => setBaseField('contact_email', e.target.value)} />
                </Field>

                <Field id="phone" label="Telefone">
                  <Input id="phone" type="tel" value={baseForm.phone ?? ''} onChange={e => setBaseField('phone', e.target.value)} placeholder="(00) 00000-0000" />
                </Field>

                <SectionTitle>Visibilidade</SectionTitle>

                <ToggleRow label="Perfil público" description="Aparece em buscas e na URL /u/:username"
                  checked={baseForm.is_public ?? false} onChange={v => setBaseField('is_public', v)} />
                {profileType === 'personal' && (
                  <Field
                    id="public_location_visibility"
                    label="Localização pública"
                    hint="Cidade/bairro público é derivado do endereço residencial canônico."
                  >
                    <Select
                      value={baseForm.public_location_visibility ?? 'city_only'}
                      onValueChange={(value) =>
                        setBaseField(
                          'public_location_visibility',
                          value as 'hidden' | 'city_only' | 'district',
                        )
                      }
                    >
                      <SelectTrigger id="public_location_visibility">
                        <SelectValue placeholder="Selecione a visibilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hidden">Ocultar localização</SelectItem>
                        <SelectItem value="city_only">Mostrar somente cidade/UF</SelectItem>
                        <SelectItem value="district">Mostrar bairro + cidade/UF</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <ToggleRow label="Mostrar e-mail de contato"
                  checked={baseForm.show_contact_email ?? false} onChange={v => setBaseField('show_contact_email', v)} />
                <ToggleRow label="Mostrar telefone"
                  checked={baseForm.show_phone ?? false} onChange={v => setBaseField('show_phone', v)} />
                <ToggleRow label="Mostrar vínculos"
                  checked={baseForm.show_linked_profiles ?? false} onChange={v => setBaseField('show_linked_profiles', v)} />
              </div>
            </section>

            {/* Username - apenas para perfil pessoal */}
            {editableUsername !== null && (
              <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                <ProfileUsernameSection
                  username={username}
                  onUsernameChange={setUsername}
                  originalUsername={originalUsername}
                  profileId={profile.id}
                />
                <IdentityChangeConfirmDialog {...usernameConfirmProps} />
              </section>
            )}

            {/* Extensão por tipo */}
            {extLoading ? (
              <div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card/90 p-5 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados específicos...
              </div>
            ) : (
              <>
                {profileType === 'business' && (
                  <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                    <BusinessSection data={bizForm} onChange={u => setBizForm(prev => ({ ...prev, ...u }))} />
                  </section>
                )}
                {profileType === 'professional' && (
                  <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                    <ProfessionalSection data={proForm} onChange={u => setProForm(prev => ({ ...prev, ...u }))} />
                  </section>
                )}
                {profileType === 'driver' && (
                  <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                    <DriverSection data={drvForm} onChange={u => setDrvForm(prev => ({ ...prev, ...u }))} />
                  </section>
                )}
              </>
            )}

            <div className="sticky bottom-0 -mx-3 flex gap-3 border-t border-border/70 bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-8 sm:pt-0">
              <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={() => navigate('/conta')}>Cancelar</Button>
              <Button className="h-11 flex-1 gap-2 rounded-2xl" onClick={handleSave} disabled={saving || extLoading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
