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
    <>
      <div className="flex flex-col items-center gap-2">
        <label className="cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoChange}
          />
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-24 w-24 rounded-2xl object-cover border-2 border-primary group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-secondary border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center group-hover:border-primary transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1">
                Sua foto
              </span>
            </div>
          )}
        </label>
        <span className="text-xs text-muted-foreground">
          Toque para adicionar foto
        </span>
      </div>

      <div className="space-y-1.5">
        <Label>
          Nome completo <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.name}
          onChange={(event) => onUpdateField("name", event.target.value)}
          placeholder="Seu nome"
          maxLength={100}
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
          <SelectTrigger>
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
          placeholder="Ex: Eletricista residencial e predial"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Descricao do servico</Label>
        <Textarea
          value={form.description}
          onChange={(event) => onUpdateField("description", event.target.value)}
          placeholder="Descreva seus servicos, experiencia, diferenciais e qualificacoes..."
          rows={4}
          maxLength={2000}
        />
        <p className="text-[10px] text-muted-foreground text-right">
          {form.description.length}/2000
        </p>
      </div>

      <ProfessionalSlugSection
        slug={slug}
        onSlugChange={onSlugChange}
        professionalName={form.name}
      />
    </>
  );
}

type CadastrarServicoDetailsStepProps = {
  form: ProfessionalServiceFormState;
  serviceAreaOptions: ServiceAreaOption[];
  serviceAreaCityName: string | null;
  isLoadingServiceAreaOptions: boolean;
  serviceAreaOptionsUnavailable: boolean;
  onToggleArea: (areaName: string) => void;
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
    <>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Bairros onde atende <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          {serviceAreaCityName
            ? `Selecione os bairros cadastrados em ${serviceAreaCityName}`
            : "Selecione seu territorio para carregar bairros do banco"}
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-card">
          {isLoadingServiceAreaOptions && (
            <p className="col-span-2 text-sm text-muted-foreground">
              Carregando areas de atendimento...
            </p>
          )}

          {!isLoadingServiceAreaOptions && serviceAreaOptionsUnavailable && (
            <p className="col-span-2 text-sm text-muted-foreground">
              Nenhuma area disponivel para o territorio atual. Atualize seu
              territorio ou cadastre os bairros no admin.
            </p>
          )}

          {!isLoadingServiceAreaOptions &&
            serviceAreaOptions.map((area) => (
              <label
                key={area.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  checked={form.serviceAreas.includes(area.name)}
                  onCheckedChange={() => onToggleArea(area.name)}
                />
                {area.name}
              </label>
            ))}
        </div>
        {form.serviceAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {form.serviceAreas.map((areaName) => (
              <Badge
                key={areaName}
                variant="secondary"
                className="text-xs gap-1"
              >
                <MapPin className="h-3 w-3" />
                {areaName}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Anos de experiencia
          </Label>
          <Input
            type="number"
            value={form.experienceYears}
            onChange={(event) =>
              onUpdateField("experienceYears", event.target.value)
            }
            placeholder="Ex: 5"
            min="0"
            max="50"
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
            placeholder="Ex: R$ 80 - R$ 200"
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
        />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Formacao / Qualificacao
        </Label>
        <Input
          value={form.education}
          onChange={(event) => onUpdateField("education", event.target.value)}
          placeholder="Ex: Curso tecnico em eletrica"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Certificacoes
        </Label>
        <Input
          value={form.certifications}
          onChange={(event) =>
            onUpdateField("certifications", event.target.value)
          }
          placeholder="Separadas por virgula (ex: NR-10, CREA)"
        />
        <p className="text-[10px] text-muted-foreground">
          Separe cada certificacao com virgula
        </p>
      </div>
    </>
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
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Informacoes de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={form.phone}
              onChange={(event) => onUpdateField("phone", event.target.value)}
              placeholder="(21) 99999-9999"
              type="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" />
              WhatsApp
            </Label>
            <Input
              value={form.whatsapp}
              onChange={(event) => onUpdateField("whatsapp", event.target.value)}
              placeholder="(21) 99999-9999"
              type="tel"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Informe pelo menos um telefone ou WhatsApp para contato
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Redes sociais (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input
              value={form.instagram}
              onChange={(event) => onUpdateField("instagram", event.target.value)}
              placeholder="@seuperfil"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(event) => onUpdateField("website", event.target.value)}
              placeholder="https://seusite.com"
              type="url"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
