import React from "react";
import { Button } from "@/shared/components/ui/button";

interface OnboardingFooterProps {
  onConfirm: () => void;
  canConfirm: boolean;
}

export function OnboardingFooter({
  onConfirm,
  canConfirm,
}: OnboardingFooterProps) {
  return (
    <div className="px-4 py-4">
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="w-full h-12 text-base font-semibold rounded-xl"
      >
        Entrar no Complexo
      </Button>
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        Você verá conteúdo de todos os 4 neighborhoods do complexo
      </p>
    </div>
  );
}
