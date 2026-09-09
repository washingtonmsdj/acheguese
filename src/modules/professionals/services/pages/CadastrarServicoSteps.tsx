import type { ChangeEvent } from "react";
import {
  Award,
  Briefcase,
  Clock,
  DollarSign,
  Globe,
  GraduationCap,
  MapPin,
  MessageCircle,
  Phone,
  Upload,
} from "lucide-react";

import { ProfessionalSlugSection } from "@/modules/professionals/services/components/identity/ProfessionalSlugSection";
import type { ServiceAreaOption } from "@/modules/professionals/services/hooks/useServiceAreaOptions";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";

import {
  FORM_CATEGORIES,
  type ProfessionalServiceFormState,
} from "./CadastrarServicoPage.model";

type UpdateField = (
  key: keyof ProfessionalServiceFormState,
  value: string | string[],
) => void;

type CadastrarServicoInfoStepProps = {
  form: ProfessionalServiceFormState;
  photoPreview: string | null;
  slug: string;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (value: string) => void;
  onUpdateField: UpdateField;
};

export function CadastrarServicoInfoStep({
  form,
  photoPreview,
  slug,
  onPhotoChange,
  onSlugChange,
  onUpdateField,
}: CadastrarServicoInfoStepProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <label className="group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview do profissional"
                className="h-24 w-24 rounded-2xl border-2 border-primary/25 object-cover transition-opacity group-hover:opacity-85"
              />
            ) : (
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/35 bg-secondary/35 transition-colors group-hover:border-primary/45">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 text-[10px] text-muted-foreground">Sua foto</span>
              </div>
            )}
          </label>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-foreground">Apresente quem vai atender</p>
            <p className="text-xs text-muted-foreground">
              Uma foto clara aumenta confianca e resposta dos clientes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-primary" />
            Informacoes basicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(event) => onUpdateField("name", event.target.value)}
              placeholder="Seu nome"
              maxLength={100}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Categoria do servico <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(value) => onUpdateField("category", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {FORM_CATEGORIES.map((category) => {
                  const Icon = category.icon;

                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Titulo do servico <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.subcategory}
              onChange={(event) => onUpdateField("subcategory", event.target.value)}
              placeholder="Ex: Eletricista residencial"
              maxLength={100}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descricao do servico</Label>
            <Textarea
              value={form.description}
              onChange={(event) => onUpdateField("description", event.target.value)}
              placeholder="Descreva seus servicos, experiencia e diferenciais."
              rows={5}
              maxLength={2000}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {form.description.length}/2000
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfessionalSlugSection
        slug={slug}
        onSlugChange={onSlugChange}
        professionalName={form.name}
      />
    </div>
  );
}

type CadastrarServicoDetailsStepProps = {
  form: ProfessionalServiceFormState;
  serviceAreaOptions: ServiceAreaOption[];
  serviceAreaCityName: string | null;
  isLoadingServiceAreaOptions: boolean;
  serviceAreaOptionsUnavailable: boolean;
  onToggleArea: (locationId: string) => void;
  onUpdateField: UpdateField;
};

export function CadastrarServicoDetailsStep({
  form,
  serviceAreaOptions,
  serviceAreaCityName,
  isLoadingServiceAreaOptions,
  serviceAreaOptionsUnavailable,
  onToggleArea,
  onUpdateField,
}: CadastrarServicoDetailsStepProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Cobertura local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              Bairros onde atende <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              {serviceAreaCityName
                ? `Selecione os bairros cadastrados em ${serviceAreaCityName}.`
                : "Selecione seu territorio para carregar bairros do banco."}
            </p>
          </div>

          <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-border/70 bg-background/40 p-3 sm:grid-cols-2">
            {isLoadingServiceAreaOptions ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Carregando areas de atendimento...
              </p>
            ) : null}

            {!isLoadingServiceAreaOptions && serviceAreaOptionsUnavailable ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Nenhuma area disponivel para o territorio atual. Atualize o territorio ou cadastre
                os bairros no admin.
              </p>
            ) : null}

            {!isLoadingServiceAreaOptions
              ? serviceAreaOptions.map((area) => (
                  <label
                    key={area.id}
                    className="flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-2 text-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
                  >
                    <Checkbox
                      checked={form.serviceAreaLocationIds.includes(area.id)}
                      onCheckedChange={() => onToggleArea(area.id)}
                    />
                    <span className="leading-5">{area.name}</span>
                  </label>
                ))
              : null}
          </div>

          {form.serviceAreaLocationIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {serviceAreaOptions
                .filter((area) => form.serviceAreaLocationIds.includes(area.id))
                .map((area) => (
                  <Badge key={area.id} variant="secondary" className="gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {area.name}
                  </Badge>
                ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            Experiencia e posicionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Anos de experiencia
              </Label>
              <Input
                type="number"
                value={form.experienceYears}
                onChange={(event) => onUpdateField("experienceYears", event.target.value)}
                placeholder="Ex: 5"
                min="0"
                max="50"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faixa de preco
              </Label>
              <Input
                value={form.priceRange}
                onChange={(event) => onUpdateField("priceRange", event.target.value)}
                placeholder="Ex: R$ 80 a R$ 200"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horario de atendimento
            </Label>
            <Input
              value={form.availableHours}
              onChange={(event) => onUpdateField("availableHours", event.target.value)}
              placeholder="Ex: Seg a Sex, 8h as 18h"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Formacao ou qualificacao
            </Label>
            <Input
              value={form.education}
              onChange={(event) => onUpdateField("education", event.target.value)}
              placeholder="Ex: Curso tecnico em eletrica"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificacoes
            </Label>
            <Input
              value={form.certifications}
              onChange={(event) => onUpdateField("certifications", event.target.value)}
              placeholder="Separe por virgula: NR-10, CREA"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">
              Separe cada certificacao com virgula.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type CadastrarServicoContactStepProps = {
  form: ProfessionalServiceFormState;
  onUpdateField: UpdateField;
};

export function CadastrarServicoContactStep({
  form,
  onUpdateField,
}: CadastrarServicoContactStepProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Informacoes de contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={form.phone}
              onChange={(event) => onUpdateField("phone", event.target.value)}
              placeholder="(71) 99999-9999"
              type="tel"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              WhatsApp
            </Label>
            <Input
              value={form.whatsapp}
              onChange={(event) => onUpdateField("whatsapp", event.target.value)}
              placeholder="(71) 99999-9999"
              type="tel"
              className="h-11"
            />
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Informe pelo menos um telefone ou WhatsApp para contato.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/30 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Presenca digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input
              value={form.instagram}
              onChange={(event) => onUpdateField("instagram", event.target.value)}
              placeholder="@seuperfil"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(event) => onUpdateField("website", event.target.value)}
              placeholder="https://seusite.com"
              type="url"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
