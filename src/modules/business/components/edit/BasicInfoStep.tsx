import { Building2, Upload, ArrowRight } from "lucide-react";
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

const categories = [
  "Alimentação",
  "Beleza e Estética",
  "Construção",
  "Educação",
  "Saúde",
  "Serviços",
  "Tecnologia",
  "Varejo",
  "Outros",
];

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informações Básicas
        </CardTitle>
        <CardDescription>Dados essenciais da sua empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo da Empresa</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoPreview || undefined} />
              <AvatarFallback>
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
                {uploading ? "Enviando..." : logoPreview ? "Trocar Logo" : "Adicionar Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: 400x400px, máximo 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Nome da Empresa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Padaria do João"
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
            placeholder="Descreva sua empresa e o que você oferece..."
            maxLength={500}
            rows={4}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {errors.description ? (
              <span className="text-destructive">{errors.description}</span>
            ) : (
              <span>Mínimo 10 caracteres</span>
            )}
            <span>{description.length}/500</span>
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
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>

        <Button onClick={onNext} className="w-full gap-2">
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
