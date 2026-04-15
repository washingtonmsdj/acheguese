import React from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
interface Props {
  onBack: () => void;
  title: string;
  onShare?: () => void;
}

export default function CatalogHeader({ onBack, title, onShare }: Props) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur">
      <button
        onClick={onBack}
        className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <p className="text-sm font-semibold truncate max-w-[60%]">{title}</p>
      {onShare ? (
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9"
          onClick={onShare}
          aria-label="Compartilhar link"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      ) : (
        <span className="w-9" />
      )}
    </div>
  );
}
