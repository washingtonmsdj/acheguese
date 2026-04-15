import React from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";

interface ClassificadoFormProps {
  titulo: string;
  onTituloChange: (titulo: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  price: string;
  onPriceChange: (price: string) => void;
  neighborhood: string;
  onNeighborhoodChange: (neighborhood: string) => void;
  errors: Record<string, string>;
}

export function ClassificadoForm({
  titulo,
  onTituloChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  neighborhood,
  onNeighborhoodChange,
  errors,
}: ClassificadoFormProps) {
  return (
    <>
      {/* Título */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Título</label>
        <Input
          placeholder="Ex: Sofá 3 lugares semi-novo"
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          maxLength={100}
          className={cn(errors.titulo && "border-destructive")}
        />
        {errors.titulo && (
          <p className="text-xs text-destructive">{errors.titulo}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Descrição</label>
        <Textarea
          placeholder="Descreva o item, estado de conservação, etc."
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={1000}
          className={cn(errors.description && "border-destructive")}
        />
        <div className="flex justify-between">
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground ml-auto">
            {description.length}/1000
          </p>
        </div>
      </div>

      {/* Preço */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Preço (R$)</label>
        <Input
          type="number"
          placeholder="0,00"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          min={0}
          className={cn(errors.price && "border-destructive")}
        />
        {errors.price && (
          <p className="text-xs text-destructive">{errors.price}</p>
        )}
      </div>

      {/* Bairro */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">
          Bairro{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ex: Rio Vermelho"
            value={neighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            className="pl-9"
            maxLength={100}
          />
        </div>
      </div>
    </>
  );
}
