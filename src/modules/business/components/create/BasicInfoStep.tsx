import { useRef } from "react";
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

interface BasicInfoStepProps {
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

export function BasicInfoStep({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Identidade e classificacao
        </CardTitle>
        <CardDescription>
          Nome, enquadramento e descricao que definem a empresa no dominio canonico.
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
                Recomendado: imagem quadrada, ate 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Nome da empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Ex: Padaria do Joao"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Razao social</Label>
            <Input
              id="legal_name"
              value={legalName}
              onChange={(event) => onLegalNameChange(event.target.value)}
              placeholder="Ex: Padaria do Joao LTDA"
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
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Selecione uma categoria</option>
              {categoryOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategoria">Subcategoria</Label>
            <Input
              id="subcategoria"
              value={subcategory}
              onChange={(event) => onSubcategoryChange(event.target.value)}
              placeholder="Ex: Padaria artesanal"
            />
            {errors.subcategoria && <p className="text-xs text-destructive">{errors.subcategoria}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_type">Tipo societario</Label>
            <select
              id="company_type"
              value={companyType}
              onChange={(event) => onCompanyTypeChange(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Nao informado</option>
              {BUSINESS_COMPANY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {COMPANY_TYPE_LABELS[option]}
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
              <option value="">Nao informado</option>
              {BUSINESS_EMPLOYEE_COUNTS.map((option) => (
                <option key={option} value={option}>
                  {EMPLOYEE_COUNT_LABELS[option]}
                </option>
              ))}
            </select>
            {errors.employee_count && <p className="text-xs text-destructive">{errors.employee_count}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="founded_year">Ano de fundacao</Label>
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
            <Input
              id="industry"
              value={industry}
              onChange={(event) => onIndustryChange(event.target.value)}
              placeholder="Ex: Alimentacao artesanal, servicos automotivos, clinica odontologica"
            />
            {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Descricao <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Explique o que a empresa oferece, para quem atende e o diferencial do negocio."
            maxLength={1000}
            rows={5}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={errors.description ? "text-destructive" : ""}>
              {errors.description || "Minimo de 10 caracteres"}
            </span>
            <span>{description.length}/1000</span>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <FileText className="h-4 w-4" />
            O que esta sendo definido aqui
          </div>
          <p>
            Esta etapa preenche a identidade principal da empresa, o enquadramento basico do dominio business e a base que sera reutilizada por dashboard, pagina publica e futuras extensoes verticais.
          </p>
        </div>

        <Button type="button" onClick={onNext} className="w-full gap-2">
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
