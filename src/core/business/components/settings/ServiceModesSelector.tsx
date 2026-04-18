/**
 * ServiceModesSelector
 * 
 * Seletor de modos de atendimento com configuração de áreas de entrega.
 * Usa SSOT de @/core/business/constants
 */

import { useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { SERVICE_MODES } from "@/core/business/constants";

interface ServiceModesSelectorProps {
  selected: string[];
  onChange: (modes: string[]) => void;
  deliveryAreas?: string[];
  onDeliveryAreasChange?: (areas: string[]) => void;
  className?: string;
}

export function ServiceModesSelector({
  selected,
  onChange,
  deliveryAreas = [],
  onDeliveryAreasChange,
  className,
}: ServiceModesSelectorProps) {
  const [newArea, setNewArea] = useState("");
  const [showAreaInput, setShowAreaInput] = useState(false);

  const handleToggle = (modeId: string) => {
    const newSelected = selected.includes(modeId)
      ? selected.filter((m) => m !== modeId)
      : [...selected, modeId];
    onChange(newSelected);
  };

  const handleAddArea = () => {
    if (!newArea.trim()) {
      toast.error("Digite o nome do bairro/área");
      return;
    }

    if (deliveryAreas.includes(newArea.trim())) {
      toast.error("Esta área já foi adicionada");
      return;
    }

    if (onDeliveryAreasChange) {
      onDeliveryAreasChange([...deliveryAreas, newArea.trim()]);
      setNewArea("");
      setShowAreaInput(false);
      toast.success("Área adicionada");
    }
  };

  const handleRemoveArea = (area: string) => {
    if (onDeliveryAreasChange) {
      onDeliveryAreasChange(deliveryAreas.filter((a) => a !== area));
      toast.success("Área removida");
    }
  };

  const hasDeliveryMode = selected.some((mode) =>
    SERVICE_MODES.find((m) => m.id === mode && m.hasAreas)
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Modos de Atendimento</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecione como sua empresa atende os clientes
        </p>
      </div>

      {/* Service modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICE_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selected.includes(mode.id);

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleToggle(mode.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "rounded-lg p-2 mt-0.5",
                  isSelected ? "bg-primary/10" : "bg-secondary"
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : mode.color)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium mb-0.5",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {mode.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode.description}
                </p>
              </div>

              <Checkbox checked={isSelected} className="mt-1" />
            </button>
          );
        })}
      </div>

      {/* Delivery areas (if delivery or domicilio is selected) */}
      {hasDeliveryMode && onDeliveryAreasChange && (
        <div className="pt-4 border-t border-border space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Áreas de Atendimento
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione os bairros ou regiões onde você atende
            </p>
          </div>

          {/* Areas list */}
          {deliveryAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deliveryAreas.map((area) => (
                <div
                  key={area}
                  className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg border border-border"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(area)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add area */}
          {showAreaInput ? (
            <div className="flex gap-2">
              <Input
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Ex: Pituba, Itaigara, Centro"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddArea();
                  }
                }}
                autoFocus
              />
              <Button onClick={handleAddArea} size="sm">
                Adicionar
              </Button>
              <Button
                onClick={() => {
                  setShowAreaInput(false);
                  setNewArea("");
                }}
                size="sm"
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowAreaInput(true)}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Área
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {selected.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">
            {selected.length} {selected.length === 1 ? "modo" : "modos"}
          </span>{" "}
          de atendimento selecionado{selected.length !== 1 ? "s" : ""}
          {hasDeliveryMode && deliveryAreas.length > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-primary">{deliveryAreas.length}</span>{" "}
              {deliveryAreas.length === 1 ? "área" : "áreas"} de atendimento
            </>
          )}
        </div>
      )}
    </div>
  );
}
