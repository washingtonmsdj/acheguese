import React from "react";
import { Lightbulb } from "lucide-react";

export function RecomendacaoTip() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
      <p className="flex items-center gap-1.5 text-sm text-primary font-medium">
        <Lightbulb className="h-4 w-4" aria-hidden="true" />
        Dica
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Faça perguntas claras e específicas. Ex: "Alguém indica um bom
        eletricista no bairro?"
      </p>
    </div>
  );
}
