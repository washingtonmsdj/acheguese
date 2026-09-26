import { ArrowRight, Building2, ImagePlus, Upload } from "lucide-react";
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
              Identidade da empresa
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Atualize as informações que ajudam moradores a reconhecer e entender seu negócio.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 shrink-0 rounded-[22px] border border-border bg-card">
              <AvatarImage src={logoPreview || undefined} className="object-cover" />
              <AvatarFallback className="rounded-[22px] bg-primary/5 text-primary">
                {logoPreview ? <Building2 className="h-9 w-9" /> : <ImagePlus className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <Label className="text-sm font-semibold text-foreground">Logo da empresa</Label>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Use uma imagem quadrada e fácil de reconhecer nos cards, busca e página pública.
              </p>
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
                className="mt-3 gap-2 rounded-xl"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : logoPreview ? "Trocar logo" : "Adicionar logo"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Imagem de até 5 MB.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
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
              className="h-11 rounded-xl"
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="description">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{description.length}/1000</span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={copy.descriptionPlaceholder}
              maxLength={1000}
              rows={5}
              className="min-h-32 rounded-xl"
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Escreva pelo menos 10 caracteres.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selecione uma categoria</option>
              {categoryOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category ? <p className="text-xs text-destructive">{errors.category}</p> : null}
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="button" onClick={onNext} className="w-full gap-2 rounded-xl sm:w-auto sm:min-w-36">
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
