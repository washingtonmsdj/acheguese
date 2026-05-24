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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="space-y-4 p-4">
        <Skeleton className="mx-auto h-24 w-24 rounded-2xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <p className="mb-4 text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onBackToServices}>
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
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="font-display text-lg font-bold">Editar Perfil Profissional</h1>
      {hasChanges && (
        <Badge variant="secondary" className="ml-auto text-xs">
          Alterações pendentes
        </Badge>
      )}
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
    <div className="flex overflow-x-auto border-b border-border">
      {EDIT_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
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
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-secondary">
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary shadow-lg">
                <Upload className="h-4 w-4 text-primary-foreground" />
                <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Clique para alterar a foto</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-primary" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Profissional *</Label>
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
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategory">Título do Serviço</Label>
            <Input
              id="subcategory"
              value={form.subcategory}
              onChange={(event) => onFieldChange("subcategory", event.target.value)}
              placeholder="Ex: Eletricista Residencial"
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
            <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/2000</p>
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
  loadingServiceAreaOptions,
  onFieldChange,
  onToggleServiceArea,
}: {
  form: ProfessionalEditForm;
  serviceAreaOptions: ServiceAreaOption[];
  loadingServiceAreaOptions: boolean;
  onFieldChange: UpdateField;
  onToggleServiceArea: (area: string) => void;
}) {
  const displayOptions = [
    ...serviceAreaOptions.map((area) => area.name),
    ...form.serviceAreas.filter((area) => !serviceAreaOptions.some((option) => option.name === area)),
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Experiência e Formação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="experienceYears">Anos de Experiência</Label>
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
              placeholder="Ex: Técnico em Eletrotécnica"
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
            <p className="mt-1 text-xs text-muted-foreground">Ex: NR-10, NR-35, CREA</p>
          </div>

          <div>
            <Label htmlFor="priceRange">Faixa de Preço</Label>
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Áreas de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {loadingServiceAreaOptions && (
              <p className="text-sm text-muted-foreground">Carregando áreas de atendimento...</p>
            )}

            {!loadingServiceAreaOptions && displayOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma área disponível para o território deste profissional. Cadastre bairros no admin territorial antes de atualizar a cobertura.
              </p>
            )}

            {!loadingServiceAreaOptions && displayOptions.map((area) => {
              const selected = form.serviceAreas.includes(area);

              return (
                <Badge
                  key={area}
                  variant={selected ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selected ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                  onClick={() => onToggleServiceArea(area)}
                >
                  {area}
                </Badge>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {form.serviceAreas.length} bairro(s) selecionado(s)
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
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Dados de Contato
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Redes Sociais
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
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-primary" />
            Portfólio de Trabalhos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione fotos dos seus trabalhos para mostrar a qualidade do seu serviço. Máximo de
            10 imagens.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {portfolioPreviews.map((preview, index) => (
              <div key={`${preview}-${index}`} className="group relative aspect-square">
                <img
                  src={preview}
                  alt={`Portfólio ${index + 1}`}
                  className="h-full w-full rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePortfolioImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {portfolioPreviews.length < 10 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 text-[10px] text-muted-foreground">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPortfolioAdd}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
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
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Disponibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div>
              <p className="text-sm font-medium">Aceitando novos clientes</p>
              <p className="text-xs text-muted-foreground">
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

          <Separator />

          <div>
            <Label htmlFor="availableHours">Horário de Atendimento</Label>
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

      <Card className="border border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Desativar seu perfil profissional irá ocultá-lo de todos os resultados de busca.
          </p>
          <Button variant="destructive" size="sm" onClick={onDeactivateProfile}>
            Desativar Perfil
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
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-2xl gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={onSave} disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
