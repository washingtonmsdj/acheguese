import React from "react";
import { Button } from "@/shared/components/ui/button";

interface OnboardingFooterProps {
  onConfirm: () => void;
  canConfirm: boolean;
}

export function OnboardingFooter({ onConfirm, canConfirm }: OnboardingFooterProps) {
  return (
    <div className="px-4 py-4">
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="h-12 w-full rounded-xl text-base font-semibold"
      >
        Continuar
      </Button>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        A navegação será ajustada ao território selecionado quando houver dados disponíveis.
      </p>
    </div>
  );
}
