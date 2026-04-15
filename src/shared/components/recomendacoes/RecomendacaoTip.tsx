import React from "react";

export function RecomendacaoTip() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
      <p className="text-sm text-primary font-medium">💡 Dica</p>
      <p className="text-xs text-muted-foreground mt-1">
        Faça perguntas claras e específicas. Ex: "Alguém indica um bom
        eletricista no bairro?"
      </p>
    </div>
  );
}
