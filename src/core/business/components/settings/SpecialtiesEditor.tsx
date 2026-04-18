/**
 * SpecialtiesEditor
 * 
 * Editor de especialidades da empresa usando sistema de tags.
 * Usa SSOT de @/core/business/constants
 */

import { useState } from "react";
import { Award, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { getSpecialtySuggestions } from "@/core/business/constants";

interface SpecialtiesEditorProps {
  specialties: string[];
  onChange: (specialties: string[]) => void;
  maxTags?: number;
  suggestions?: string[];
  category?: string;
  className?: string;
}

export function SpecialtiesEditor({
  specialties,
  onChange,
  maxTags = 10,
  suggestions,
  category,
  className,
}: SpecialtiesEditorProps) {
  const [newSpecialty, setNewSpecialty] = useState("");
  const [showInput, setShowInput] = useState(false);

  // Usar sugestões customizadas ou baseadas na categoria (SSOT)
  const availableSuggestions = suggestions || 
    (category ? getSpecialtySuggestions(category) : []);

  // Filtrar sugestões que já foram adicionadas
  const filteredSuggestions = availableSuggestions.filter(
    (s) => !specialties.includes(s)
  );

  const handleAdd = (specialty: string) => {
    const trimmed = specialty.trim();

    if (!trimmed) {
      toast.error("Digite uma especialidade");
      return;
    }

    if (specialties.includes(trimmed)) {
      toast.error("Esta especialidade já foi adicionada");
      return;
    }

    if (specialties.length >= maxTags) {
      toast.error(`Máximo de ${maxTags} especialidades`);
      return;
    }

    onChange([...specialties, trimmed]);
    setNewSpecialty("");
    setShowInput(false);
    toast.success("Especialidade adicionada");
  };

  const handleRemove = (specialty: string) => {
    onChange(specialties.filter((s) => s !== specialty));
    toast.success("Especialidade removida");
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAdd(suggestion);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Especialidades
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adicione até {maxTags} especialidades que destacam sua empresa
        </p>
      </div>

      {/* Current specialties */}
      {specialties.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Suas Especialidades ({specialties.length}/{maxTags})
          </p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Badge
                key={specialty}
                variant="secondary"
                className="pl-3 pr-2 py-2 text-sm gap-2"
              >
                <span>{specialty}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(specialty)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add new specialty */}
      {specialties.length < maxTags && (
        <div className="space-y-3">
          {showInput ? (
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Ex: Moqueca de Camarão, Acarajé..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd(newSpecialty);
                  }
                }}
                autoFocus
              />
              <Button onClick={() => handleAdd(newSpecialty)} size="sm">
                Adicionar
              </Button>
              <Button
                onClick={() => {
                  setShowInput(false);
                  setNewSpecialty("");
                }}
                size="sm"
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowInput(true)}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Especialidade
            </Button>
          )}
        </div>
      )}

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && specialties.length < maxTags && (
        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Sugestões
          </p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/40 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      {specialties.length === 0 && (
        <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Dica:</p>
          <p>
            Especialidades ajudam clientes a encontrar sua empresa. 
            Adicione pratos, serviços ou produtos que você oferece.
          </p>
        </div>
      )}

      {/* Limit warning */}
      {specialties.length >= maxTags && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600">
          <p className="font-medium">
            Limite atingido: {maxTags} especialidades
          </p>
          <p className="mt-1 text-amber-600/80">
            Remova uma especialidade para adicionar outra
          </p>
        </div>
      )}
    </div>
  );
}
