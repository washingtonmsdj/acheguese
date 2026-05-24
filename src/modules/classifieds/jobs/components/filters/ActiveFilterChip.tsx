/**
 * ActiveFilterChip - Chip de filtro ativo com botão de remoção
 * 
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas
 */

import { X } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

export interface ActiveFilterChipProps {
  readonly label: string;
  readonly onRemove: () => void;
}

export function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 px-2 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
