 
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Loader2 } from "lucide-react";

type NovaRecomendacaoData = {
  titulo: string;
  description: string;
};

interface RecomendacaoFormProps {
  formData: NovaRecomendacaoData;
  loading: boolean;
  isFormValid: boolean;
  onFieldChange: (field: keyof NovaRecomendacaoData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RecomendacaoForm({
  formData,
  loading,
  isFormValid,
  onFieldChange,
  onSubmit,
}: RecomendacaoFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Sua pergunta *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) =>
            onFieldChange("titulo", e.target.value.slice(0, 200))
          }
          placeholder="Ex: Alguém indica um bom eletricista?"
          maxLength={200}
          aria-describedby="titulo-counter"
        />
        <p
          id="titulo-counter"
          className="text-xs text-muted-foreground text-right"
        >
          {formData.titulo.length}/200
        </p>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Detalhes (opcional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            onFieldChange("description", e.target.value.slice(0, 500))
          }
          placeholder="Adicione mais contexto sobre o que precisa..."
          rows={3}
          maxLength={500}
          aria-describedby="description-counter"
        />
        <p
          id="description-counter"
          className="text-xs text-muted-foreground text-right"
        >
          {formData.description.length}/500
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !isFormValid}
        aria-label="Publicar pergunta na comunidade"
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Publicar Pergunta
      </Button>
    </form>
  );
}
