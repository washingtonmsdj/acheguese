import { useEffect, useRef, useState } from "react";
import { Building2, FileText, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { CATEGORY_CONFIGS } from "@/modules/business/config/categoryFilters";
import { BUSINESS_COMPANY_TYPES, BUSINESS_EMPLOYEE_COUNTS } from "@/shared/schemas/business/businessSchemas";
import { getBusinessCreateFieldCopy } from "./businessCreateCopy";

interface BasicInfoStepProps {
  contextTitle?: string;
  contextDescription?: string;
  categoryLocked?: boolean;
  categoryLockedHelp?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  showNextButton?: boolean;
  name: string;
  legalName: string;
  cnpj: string;
  category: string;
  subcategory: string;
  companyType: string;
  employeeCount: string;
  foundedYear: string;
  industry: string;
  description: string;
  logoPreview: string | null;
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onLegalNameChange: (value: string) => void;
  onCnpjChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onCompanyTypeChange: (value: string) => void;
  onEmployeeCountChange: (value: string) => void;
  onFoundedYearChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLogoChange: (file: File | null) => void;
  onNext: () => void;
}

const COMPANY_TYPE_LABELS: Record<string, string> = {
  mei: "MEI",
  ltda: "LTDA",
  sa: "S/A",
  eireli: "EIRELI",
  other: "Outro",
};

const EMPLOYEE_COUNT_LABELS: Record<string, string> = {
  "1-10": "1 a 10 pessoas",
  "11-50": "11 a 50 pessoas",
  "51-200": "51 a 200 pessoas",
  "201-500": "201 a 500 pessoas",
  "500+": "Mais de 500 pessoas",
};

const INDUSTRY_CUSTOM_VALUE = "__custom__";

function getCompanyTypeLabel(option: string): string {
  switch (option) {
    case "mei":
      return COMPANY_TYPE_LABELS.mei;
    case "ltda":
      return COMPANY_TYPE_LABELS.ltda;
    case "sa":
      return COMPANY_TYPE_LABELS.sa;
    case "eireli":
      return COMPANY_TYPE_LABELS.eireli;
    case "other":
      return COMPANY_TYPE_LABELS.other;
    default:
      return option;
  }
}

function getEmployeeCountLabel(option: string): string {
  switch (option) {
    case "1-10":
      return EMPLOYEE_COUNT_LABELS["1-10"];
    case "11-50":
      return EMPLOYEE_COUNT_LABELS["11-50"];
    case "51-200":
      return EMPLOYEE_COUNT_LABELS["51-200"];
    case "201-500":
      return EMPLOYEE_COUNT_LABELS["201-500"];
    case "500+":
      return EMPLOYEE_COUNT_LABELS["500+"];
    default:
      return option;
  }
}

export function BasicInfoStep({
  contextTitle,
  contextDescription,
  categoryLocked = false,
  categoryLockedHelp,
  nameLabel = "Nome da empresa",
  namePlaceholder,
  descriptionPlaceholder,
  showNextButton = true,
  name,
  legalName,
  cnpj,
  category,
  subcategory,
  companyType,
  employeeCount,
  foundedYear,
  industry,
  description,
  logoPreview,
  errors,
  onNameChange,
  onLegalNameChange,
  onCnpjChange,
  onCategoryChange,
  onSubcategoryChange,
  onCompanyTypeChange,
  onEmployeeCountChange,
  onFoundedYearChange,
  onIndustryChange,
  onDescriptionChange,
  onLogoChange,
  onNext,
}: BasicInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categoryOptions = Object.values(CATEGORY_CONFIGS);
  const copy = getBusinessCreateFieldCopy(category);
  const effectiveNamePlaceholder = namePlaceholder || copy.namePlaceholder;
  const effectiveDescriptionPlaceholder = descriptionPlaceholder || copy.descriptionPlaceholder;
  const industryOptions = copy.industryOptions;
  const [manualIndustryMode, setManualIndustryMode] = useState(false);
  const usesCustomIndustry = Boolean(industry && !industryOptions.includes(industry));

  useEffect(() => {
    if (usesCustomIndustry && !manualIndustryMode) {
      setManualIndustryMode(true);
    }
  }, [manualIndustryMode, usesCustomIndustry]);

  const industrySelectValue = manualIndustryMode ? INDUSTRY_CUSTOM_VALUE : industry;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {contextTitle ?? "Identidade e classificação"}
        </CardTitle>
        <CardDescription>
          {contextDescription ?? "Nome, enquadramento e descrição que definem a empresa no domínio canônico."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo da empresa</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-2xl">
              <AvatarImage src={logoPreview || undefined} />
              <AvatarFallback className="rounded-2xl">
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {logoPreview ? "Trocar logo" : "Adicionar logo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recomendado: imagem quadrada, até 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              {nameLabel} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              data-testid="business-create-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={effectiveNamePlaceholder}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Razão social</Label>
            <Input
              id="legal_name"
              value={legalName}
              onChange={(event) => onLegalNameChange(event.target.value)}
              placeholder={copy.legalNamePlaceholder}
            />
            {errors.legal_name && <p className="text-xs text-destructive">{errors.legal_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(event) => onCnpjChange(event.target.value)}
              placeholder="00.000.000/0000-00"
            />
            {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              data-testid="business-create-category"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              disabled={categoryLocked}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Selecione uma categoria</option>
              {categoryOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
            {categoryLocked && categoryLockedHelp && (
              <p className="text-xs text-muted-foreground">{categoryLockedHelp}</p>
            )}
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategoria">Subcategoria</Label>
            <Input
              id="subcategoria"
              value={subcategory}
              onChange={(event) => onSubcategoryChange(event.target.value)}
              placeholder={copy.subcategoryPlaceholder}
            />
            {errors.subcategoria && <p className="text-xs text-destructive">{errors.subcategoria}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_type">Tipo societário</Label>
            <select
              id="company_type"
              value={companyType}
              onChange={(event) => onCompanyTypeChange(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Não informado</option>
              {BUSINESS_COMPANY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {getCompanyTypeLabel(option)}
                </option>
              ))}
            </select>
            {errors.company_type && <p className="text-xs text-destructive">{errors.company_type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_count">Porte da equipe</Label>
            <select
              id="employee_count"
              value={employeeCount}
              onChange={(event) => onEmployeeCountChange(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Não informado</option>
              {BUSINESS_EMPLOYEE_COUNTS.map((option) => (
                <option key={option} value={option}>
                  {getEmployeeCountLabel(option)}
                </option>
              ))}
            </select>
            {errors.employee_count && <p className="text-xs text-destructive">{errors.employee_count}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="founded_year">Ano de fundação</Label>
            <Input
              id="founded_year"
              type="number"
              value={foundedYear}
              onChange={(event) => onFoundedYearChange(event.target.value)}
              placeholder="2020"
              min={1800}
              max={new Date().getFullYear()}
            />
            {errors.founded_year && <p className="text-xs text-destructive">{errors.founded_year}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="industry">Segmento</Label>
            <select
              id="industry"
              value={industrySelectValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === INDUSTRY_CUSTOM_VALUE) {
                  setManualIndustryMode(true);
                  onIndustryChange("");
                  return;
                }
                setManualIndustryMode(false);
                onIndustryChange(nextValue);
              }}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Não informado</option>
              {industryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={INDUSTRY_CUSTOM_VALUE}>Outro (digitar manualmente)</option>
            </select>
            {manualIndustryMode && (
              <Input
                value={industry}
                onChange={(event) => onIndustryChange(event.target.value)}
                placeholder={copy.industryPlaceholder}
              />
            )}
            {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Descrição <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={effectiveDescriptionPlaceholder}
            maxLength={1000}
            rows={5}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={errors.description ? "text-destructive" : ""}>
              {errors.description || "Mínimo de 10 caracteres"}
            </span>
            <span>{description.length}/1000</span>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <FileText className="h-4 w-4" />
            O que está sendo definido aqui
          </div>
          <p>
            Esta etapa define a identidade principal do seu {copy.entityNoun}, o enquadramento básico no domínio business e a base reutilizada no painel, página pública e extensões verticais.
          </p>
        </div>

        {showNextButton && (
          <Button type="button" onClick={onNext} className="w-full gap-2">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
