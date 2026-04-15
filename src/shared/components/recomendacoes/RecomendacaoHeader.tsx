import React from "react";
import { ArrowLeft } from "lucide-react";

interface RecomendacaoHeaderProps {
  onGoBack: () => void;
}

export function RecomendacaoHeader({ onGoBack }: RecomendacaoHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
      <button
        onClick={onGoBack}
        className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        aria-label="Voltar à página anterior"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold font-display">Perguntar ao Bairro</h1>
    </div>
  );
}
