import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, FileText, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
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
  return COMPANY_TYPE_LABELS[option] ?? option;
}

function getEmployeeCountLabel(option: string): string {
  return EMPLOYEE_COUNT_LABELS[option] ?? option;
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
    <section className="overflow-hidden rounded-[26px] border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Etapa 1
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {contextTitle ?? "Identidade da empresa"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {contextDescription ?? "Defina como a empresa será reconhecida na busca, no mapa e na página pública."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <Label className="text-sm font-semibold text-foreground">Logo da empresa</Label>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 rounded-[20px] border border-border bg-muted">
              <AvatarImage src={logoPreview || undefined} />
              <AvatarFallback className="rounded-[20px] bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
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
                className="gap-2 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {logoPreview ? "Trocar logo" : "Adicionar logo"}
              </Button>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Imagem quadrada, nítida e fácil de reconhecer. Até 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
              className="h-11 rounded-xl"
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Razão social</Label>
            <Input
              id="legal_name"
              value={legalName}
              onChange={(event) => onLegalNameChange(event.target.value)}
              placeholder={copy.legalNamePlaceholder}
              className="h-11 rounded-xl"
            />
            {errors.legal_name ? <p className="text-xs text-destructive">{errors.legal_name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(event) => onCnpjChange(event.target.value)}
              placeholder="00.000.000/0000-00"
              className="h-11 rounded-xl"
            />
            {errors.cnpj ? <p className="text-xs text-destructive">{errors.cnpj}</p> : null}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Classificação</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Essas informações ajudam o Achegue-se a organizar a empresa nos lugares corretos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Selecione uma categoria</option>
                {categoryOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
              {categoryLocked && categoryLockedHelp ? (
                <p className="text-xs text-muted-foreground">{categoryLockedHelp}</p>
              ) : null}
              {errors.category ? <p className="text-xs text-destructive">{errors.category}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Input
                id="subcategoria"
                value={subcategory}
                onChange={(event) => onSubcategoryChange(event.target.value)}
                placeholder={copy.subcategoryPlaceholder}
                className="h-11 rounded-xl"
              />
              {errors.subcategoria ? <p className="text-xs text-destructive">{errors.subcategoria}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_type">Tipo societário</Label>
              <select
                id="company_type"
                value={companyType}
                onChange={(event) => onCompanyTypeChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Não informado</option>
                {BUSINESS_COMPANY_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {getCompanyTypeLabel(option)}
                  </option>
                ))}
              </select>
              {errors.company_type ? <p className="text-xs text-destructive">{errors.company_type}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Porte da equipe</Label>
              <select
                id="employee_count"
                value={employeeCount}
                onChange={(event) => onEmployeeCountChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Não informado</option>
                {BUSINESS_EMPLOYEE_COUNTS.map((option) => (
                  <option key={option} value={option}>
                    {getEmployeeCountLabel(option)}
                  </option>
                ))}
              </select>
              {errors.employee_count ? <p className="text-xs text-destructive">{errors.employee_count}</p> : null}
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
                className="h-11 rounded-xl"
              />
              {errors.founded_year ? <p className="text-xs text-destructive">{errors.founded_year}</p> : null}
            </div>

            <div className="space-y-2">
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
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Não informado</option>
                {industryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={INDUSTRY_CUSTOM_VALUE}>Outro (digitar manualmente)</option>
              </select>
              {manualIndustryMode ? (
                <Input
                  value={industry}
                  onChange={(event) => onIndustryChange(event.target.value)}
                  placeholder={copy.industryPlaceholder}
                  className="h-11 rounded-xl"
                />
              ) : null}
              {errors.industry ? <p className="text-xs text-destructive">{errors.industry}</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
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
            className="mt-2 min-h-32 rounded-xl"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className={errors.description ? "text-destructive" : ""}>
              {errors.description || "Mínimo de 10 caracteres"}
            </span>
            <span>{description.length}/1000</span>
          </div>
        </div>

        <div className="rounded-[20px] border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Onde essas informações aparecem
          </div>
          <p className="leading-6">
            Nome, categoria e descrição alimentam o perfil público, a busca e a Central da empresa. Você poderá revisar tudo depois.
          </p>
        </div>

        {showNextButton ? (
          <div className="border-t border-border pt-6">
            <Button type="button" onClick={onNext} className="w-full gap-2 sm:w-auto sm:min-w-48 sm:float-right">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="clear-both" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
