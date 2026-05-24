import React from "react";
import { AlertCircle, CheckCircle2, MapPin, Shield } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { VagaModalidade } from "../../types/vagas.types";

export interface LocationStepProps {
  hasActiveLocation: boolean;
  activeLocationName: string;
  errors: Record<string, string>;
  modalidade: VagaModalidade;
}

export function LocationStep({
  hasActiveLocation,
  activeLocationName,
  errors,
  modalidade,
}: LocationStepProps) {
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border",
          hasActiveLocation ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20",
        )}
      >
        <MapPin
          className={cn(
            "h-5 w-5 shrink-0",
            hasActiveLocation ? "text-primary" : "text-destructive",
          )}
        />
        <div className="flex-1">
          {hasActiveLocation ? (
            <>
              <p className="text-sm font-semibold text-foreground">{activeLocationName}</p>
              <p className="text-[10px] text-muted-foreground">Localização ativa — sua vaga aparecerá nesta região</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-destructive">Nenhuma localização ativa</p>
              <p className="text-[10px] text-muted-foreground">Selecione uma comunidade/cidade para publicar sua vaga</p>
            </>
          )}
        </div>
        {hasActiveLocation && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
      </div>

      {errors.location && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{errors.location}</p>
        </div>
      )}

      {errors.publishPermission && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <Shield className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-warning">{errors.publishPermission}</p>
        </div>
      )}

      {modalidade === "remoto" && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-xs text-muted-foreground">
            Vaga remota - a localizacao indica a sede da empresa para referencia.
          </p>
        </div>
      )}
    </div>
  );
}
