import { ArrowRight, Building2, Upload } from "lucide-react";
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
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { CATEGORY_CONFIGS } from "@/modules/business/config/categoryFilters";
import { getBusinessCreateFieldCopy } from "@/modules/business/components/create/businessCreateCopy";

interface BasicInfoStepProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  logoPreview: string | null;
  logoRef: React.RefObject<HTMLInputElement>;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  errors: Record<string, string>;
  onNext: () => void;
}

export function BasicInfoStep({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  category,
  onCategoryChange,
  logoPreview,
  logoRef,
  onLogoChange,
  uploading = false,
  errors,
  onNext,
}: BasicInfoStepProps) {
  const categoryOptions = Object.values(CATEGORY_CONFIGS);
  const copy = getBusinessCreateFieldCopy(category);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Identidade da empresa
        </CardTitle>
        <CardDescription>Atualize os dados principais que aparecem no perfil público.</CardDescription>
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
            <div className="flex-1">
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : logoPreview ? "Trocar logo" : "Adicionar logo"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Recomendado: imagem quadrada, máximo 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Nome da empresa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={100}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Descrição <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={copy.descriptionPlaceholder}
            maxLength={1000}
            rows={4}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {errors.description ? (
              <span className="text-destructive">{errors.description}</span>
            ) : (
              <span>Mínimo 10 caracteres</span>
            )}
            <span>{description.length}/1000</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            Categoria <span className="text-destructive">*</span>
          </Label>
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="">Selecione uma categoria</option>
            {categoryOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>

        <Button type="button" onClick={onNext} className="w-full gap-2">
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
