import type React from "react";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Camera,
  Clock,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { IdentityChangeConfirmDialog } from "@/core/public-identity/components/IdentityChangeConfirmDialog";
import { ProfessionalSlugSection } from "@/modules/professionals/services/components/identity/ProfessionalSlugSection";
import { SERVICE_FORM_CATEGORY_OPTIONS } from "@/modules/professionals/services/domain/professionalCategories";
import type { ServiceArea as CanonicalServiceArea } from "@/core/service-areas";
import type { ServiceAreaOption } from "@/modules/professionals/services/hooks/useServiceAreaOptions";
import type { ProfessionalEditForm, ProfessionalEditTab } from "./EditarServicoPage.model";

type UpdateField = (
  key: keyof ProfessionalEditForm,
  value: string | string[] | boolean,
) => void;

const EDIT_TABS: { key: ProfessionalEditTab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "Informações", icon: Briefcase },
  { key: "details", label: "Detalhes", icon: Award },
  { key: "contact", label: "Contato", icon: Phone },
  { key: "portfolio", label: "Portfólio", icon: Camera },
  { key: "availability", label: "Horários", icon: Clock },
];

export function EditarServicoLoadingState() {
  return (
    <div className="flex min-h-screen flex-col bg-territory-canvas text-territory-ink">
      <div className="sticky top-0 z-10 border-b border-territory-border bg-territory-surface/95 backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Skeleton className="h-10 w-10 rounded-full bg-territory-raised" />
          <Skeleton className="h-6 w-48 bg-territory-raised" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <Skeleton className="mx-auto h-24 w-24 rounded-2xl bg-territory-raised" />
        <Skeleton className="h-10 w-full bg-territory-raised" />
        <Skeleton className="h-10 w-full bg-territory-raised" />
        <Skeleton className="h-20 w-full bg-territory-raised" />
      </div>
    </div>
  );
}

export function EditarServicoErrorState({
  message,
  onBackToServices,
}: {
  message: string;
  onBackToServices: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-territory-canvas p-4 text-territory-ink">
      <p className="mb-4 text-territory-muted">{message}</p>
      <Button
        variant="outline"
        className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
        onClick={onBackToServices}
      >
        Voltar para Serviços
      </Button>
    </div>
  );
}

export function EditarServicoHeader({
  hasChanges,
  onBack,
}: {
  hasChanges: boolean;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-territory-border bg-territory-surface/95 px-4 py-3 text-territory-ink backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-territory-border bg-territory-surface text-territory-ink transition-colors hover:bg-territory-raised"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-territory-ink sm:text-lg">
          Editar perfil profissional
        </h1>
        <p className="text-xs text-territory-muted">
          Ajuste dados públicos, contato e cobertura.
        </p>
      </div>
      {hasChanges ? (
        <Badge
          variant="outline"
          className="ml-auto shrink-0 border-territory-warning/30 bg-territory-warning/10 text-[0.68rem] uppercase tracking-[0.12em] text-territory-warning"
        >
          Alterações pendentes
        </Badge>
      ) : null}
    </div>
  );
}

export function EditarServicoTabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: ProfessionalEditTab;
  onTabChange: (tab: ProfessionalEditTab) => void;
}) {
  return (
    <div className="sticky top-[4.0625rem] z-10 border-b border-territory-border bg-territory-surface/95 backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85">
      <div className="mx-auto w-full max-w-3xl overflow-x-auto px-4 py-3 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {EDIT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-territory-brand/30 bg-territory-brand text-territory-on-image shadow-sm"
                    : "border-territory-border bg-territory-surface text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EditarServicoInfoTab({
  form,
  photoPreview,
  slug,
  originalSlug,
  professionalId,
  isVerifiedProfessional,
  slugConfirmProps,
  onFieldChange,
  onPhotoChange,
  onSlugChange,
}: {
  form: ProfessionalEditForm;
  photoPreview: string | null;
  slug: string;
  originalSlug: string;
  professionalId: string;
  isVerifiedProfessional?: boolean;
  slugConfirmProps: React.ComponentProps<typeof IdentityChangeConfirmDialog>;
  onFieldChange: UpdateField;
  onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6 text-territory-ink">
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-territory-border bg-territory-raised">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto do profissional"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-territory-muted" aria-hidden="true" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-territory-brand shadow-sm">
                <Upload className="h-4 w-4 text-territory-on-image" aria-hidden="true" />
                <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-territory-muted">Clique para alterar a foto</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <Briefcase className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Informações básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome profissional *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={form.category} onValueChange={(value) => onFieldChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_FORM_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <category.icon className="h-4 w-4 text-territory-muted" aria-hidden="true" />
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategory">Título do serviço</Label>
            <Input
              id="subcategory"
              value={form.subcategory}
              onChange={(event) => onFieldChange("subcategory", event.target.value)}
              placeholder="Ex: Eletricista residencial"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="Descreva seus serviços, experiência e diferenciais..."
              rows={4}
            />
            <p className="mt-1 text-xs text-territory-muted">
              {form.description.length}/2000
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfessionalSlugSection
        slug={slug}
        onSlugChange={onSlugChange}
        originalSlug={originalSlug}
        professionalId={professionalId}
        professionalName={form.name}
        isVerifiedProfessional={isVerifiedProfessional}
      />
      <IdentityChangeConfirmDialog {...slugConfirmProps} />
    </div>
  );
}

export function EditarServicoDetailsTab({
  form,
  serviceAreaOptions,
  canonicalServiceAreas,
  loadingServiceAreaOptions,
  onFieldChange,
  onToggleServiceArea,
}: {
  form: ProfessionalEditForm;
  serviceAreaOptions: ServiceAreaOption[];
  canonicalServiceAreas: CanonicalServiceArea[];
  loadingServiceAreaOptions: boolean;
  onFieldChange: UpdateField;
  onToggleServiceArea: (locationId: string) => void;
}) {
  const displayOptions = [
    ...serviceAreaOptions.map((area) => ({ id: area.id, name: area.name })),
    ...canonicalServiceAreas
      .filter(
        (area) =>
          form.serviceAreaLocationIds.includes(area.location_id) &&
          !serviceAreaOptions.some((option) => option.id === area.location_id),
      )
      .map((area) => ({ id: area.location_id, name: area.location_name })),
  ];

  return (
    <div className="space-y-6 text-territory-ink">
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <GraduationCap className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Experiência e formação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="experienceYears">Anos de experiência</Label>
            <Input
              id="experienceYears"
              type="number"
              min="0"
              max="50"
              value={form.experienceYears}
              onChange={(event) => onFieldChange("experienceYears", event.target.value)}
              placeholder="Ex: 5"
            />
          </div>

          <div>
            <Label htmlFor="education">Formação</Label>
            <Input
              id="education"
              value={form.education}
              onChange={(event) => onFieldChange("education", event.target.value)}
              placeholder="Ex: Técnico em eletrotécnica"
            />
          </div>

          <div>
            <Label htmlFor="certifications">Certificações</Label>
            <Input
              id="certifications"
              value={form.certifications}
              onChange={(event) => onFieldChange("certifications", event.target.value)}
              placeholder="Separe por vírgula"
            />
            <p className="mt-1 text-xs text-territory-muted">Ex: NR-10, NR-35, CREA</p>
          </div>

          <div>
            <Label htmlFor="priceRange">Faixa de preço</Label>
            <Select value={form.priceRange} onValueChange={(value) => onFieldChange("priceRange", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ - Econômico</SelectItem>
                <SelectItem value="$$">$$ - Moderado</SelectItem>
                <SelectItem value="$$$">$$$ - Premium</SelectItem>
                <SelectItem value="$$$$">$$$$ - Luxo</SelectItem>
                <SelectItem value="negociavel">Negociável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Áreas de atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {loadingServiceAreaOptions ? (
              <p className="text-sm text-territory-muted">Carregando áreas de atendimento...</p>
            ) : null}

            {!loadingServiceAreaOptions && displayOptions.length === 0 ? (
              <p className="text-sm text-territory-muted">
                Nenhuma área disponível para o território deste profissional. Cadastre bairros no
                admin territorial antes de atualizar a cobertura.
              </p>
            ) : null}

            {!loadingServiceAreaOptions
              ? displayOptions.map((area) => {
                  const selected = form.serviceAreaLocationIds.includes(area.id);

                  return (
                    <Badge
                      key={area.id}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        selected
                          ? "border-territory-brand bg-territory-brand text-territory-on-image"
                          : "border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                      }`}
                      onClick={() => onToggleServiceArea(area.id)}
                    >
                      {area.name}
                    </Badge>
                  );
                })
              : null}
          </div>
          <p className="mt-2 text-xs text-territory-muted">
            {form.serviceAreaLocationIds.length} bairro(s) selecionado(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditarServicoContactTab({
  form,
  onFieldChange,
}: {
  form: ProfessionalEditForm;
  onFieldChange: UpdateField;
}) {
  return (
    <div className="space-y-6 text-territory-ink">
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <Phone className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Dados de contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              placeholder="(21) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp}
              onChange={(event) => onFieldChange("whatsapp", event.target.value)}
              placeholder="(21) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <Globe className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Redes sociais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={form.instagram}
              onChange={(event) => onFieldChange("instagram", event.target.value)}
              placeholder="@seuperfil"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(event) => onFieldChange("website", event.target.value)}
              placeholder="https://seusite.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditarServicoPortfolioTab({
  portfolioPreviews,
  onPortfolioAdd,
  onRemovePortfolioImage,
}: {
  portfolioPreviews: string[];
  onPortfolioAdd: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePortfolioImage: (index: number) => void;
}) {
  return (
    <div className="space-y-6 text-territory-ink">
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <Camera className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Portfólio de trabalhos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-territory-muted">
            Adicione fotos dos seus trabalhos para mostrar a qualidade do seu serviço. Máximo de
            10 imagens.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portfolioPreviews.map((preview, index) => (
              <div key={`${preview}-${index}`} className="group relative aspect-square">
                <img
                  src={preview}
                  alt={`Portfólio ${index + 1}`}
                  className="h-full w-full rounded-lg border border-territory-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePortfolioImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-territory-error text-territory-on-image opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remover imagem ${index + 1} do portfólio`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}

            {portfolioPreviews.length < 10 ? (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-territory-muted/30 bg-territory-surface transition-colors hover:border-territory-brand/50 hover:bg-territory-raised">
                <Upload className="h-6 w-6 text-territory-muted" aria-hidden="true" />
                <span className="mt-1 text-[10px] text-territory-muted">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPortfolioAdd}
                  className="hidden"
                />
              </label>
            ) : null}
          </div>

          <p className="text-xs text-territory-muted">
            {portfolioPreviews.length}/10 imagens - Máximo 5MB por imagem
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditarServicoAvailabilityTab({
  form,
  onFieldChange,
  onDeactivateProfile,
}: {
  form: ProfessionalEditForm;
  onFieldChange: UpdateField;
  onDeactivateProfile: () => void;
}) {
  return (
    <div className="space-y-6 text-territory-ink">
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
            <Clock className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Disponibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-territory-raised p-3">
            <div>
              <p className="text-sm font-medium text-territory-ink">Aceitando novos clientes</p>
              <p className="text-xs text-territory-muted">
                {form.isAcceptingClients
                  ? "Seu perfil está visível para novos clientes"
                  : "Seu perfil está oculto para novos clientes"}
              </p>
            </div>
            <Switch
              checked={form.isAcceptingClients}
              onCheckedChange={(value) => onFieldChange("isAcceptingClients", value)}
            />
          </div>

          <Separator className="bg-territory-border" />

          <div>
            <Label htmlFor="availableHours">Horário de atendimento</Label>
            <Textarea
              id="availableHours"
              value={form.availableHours}
              onChange={(event) => onFieldChange("availableHours", event.target.value)}
              placeholder="Ex: Seg-Sex: 8h às 18h&#10;Sáb: 8h às 12h"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-territory-error/30 bg-territory-error/5 text-territory-ink shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-territory-error">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Zona de perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-territory-muted">
            Desativar seu perfil profissional irá ocultá-lo de todos os resultados de busca.
          </p>
          <Button
            size="sm"
            className="bg-territory-error text-territory-on-image hover:bg-territory-error/90"
            onClick={onDeactivateProfile}
          >
            Desativar perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditarServicoSaveBar({
  saving,
  hasChanges,
  onCancel,
  onSave,
}: {
  saving: boolean;
  hasChanges: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-territory-border bg-territory-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="h-11 flex-1 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          className="h-11 flex-1 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
          onClick={onSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
