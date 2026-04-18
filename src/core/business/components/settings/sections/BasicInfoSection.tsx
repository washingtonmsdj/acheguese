/**
 * BasicInfoSection
 * 
 * Seção de informações básicas da empresa.
 * Inclui: nome, slug, categoria, subcategoria, descrição.
 * 
 * SSOT: Usa constantes centralizadas de categorias.
 */

import { Info } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  BUSINESS_CATEGORIES,
  getSubcategories,
  getCategoryLabel,
  type BusinessCategory,
} from "@/core/business/constants";

interface BasicInfo {
  name: string;
  slug: string;
  category: string;
  subcategoria?: string;
  description?: string;
}

interface BasicInfoSectionProps {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  className?: string;
}

export function BasicInfoSection({
  data,
  onChange,
  className,
}: BasicInfoSectionProps) {
  const handleChange = (field: keyof BasicInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-|-$/g, ""); // Remove hífens do início e fim
  };

  const handleNameChange = (name: string) => {
    handleChange("name", name);
    // Auto-gerar slug se estiver vazio
    if (!data.slug) {
      handleChange("slug", generateSlug(name));
    }
  };

  const subcategories = data.category 
    ? getSubcategories(data.category as BusinessCategory)
    : [];

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Informações Básicas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dados essenciais da sua empresa
        </p>
      </div>

      <div className="space-y-6">
        {/* Nome da Empresa */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nome da Empresa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Restaurante Sabor da Bahia"
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            Nome completo como aparecerá para os clientes
          </p>
        </div>

        {/* Slug (Identificador Público) */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-medium">
            Identificador Público (@slug) <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => handleChange("slug", generateSlug(e.target.value))}
              placeholder="sabor-da-bahia"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            URL amigável: /empresas/ba/salvador/pituba/<strong>{data.slug || "seu-slug"}</strong>
          </p>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria <span className="text-destructive">*</span>
          </Label>
          <Select value={data.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Categoria principal do seu negócio
          </p>
        </div>

        {/* Subcategoria (condicional) */}
        {subcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategoria" className="text-sm font-medium">
              Subcategoria
            </Label>
            <Select
              value={data.subcategoria || ""}
              onValueChange={(value) => handleChange("subcategoria", value)}
            >
              <SelectTrigger id="subcategoria">
                <SelectValue placeholder="Selecione a subcategoria (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((subcat) => (
                  <SelectItem key={subcat} value={subcat}>
                    {subcat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Especifique melhor o tipo de negócio
            </p>
          </div>
        )}

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={data.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Descreva sua empresa, o que oferece, diferenciais..."
            rows={5}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Conte aos clientes sobre sua empresa</span>
            <span>{data.description?.length || 0} caracteres</span>
          </div>
        </div>
      </div>
    </div>
  );
}
