import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { SPACING } from "../styles/communityDesignSystem";

interface AlertConfirmationProps {
  confirmationsCount: number;
  hasUserConfirmed: boolean;
  onConfirm: () => void;
}

export function AlertConfirmation({
  confirmationsCount,
  hasUserConfirmed,
  onConfirm,
}: AlertConfirmationProps) {
  return (
    <div className={`${SPACING.cardPadding} pt-0`}>
      <div
        className="w-full mb-4 p-3 bg-gray-800/30 rounded-lg"
        role="region"
        aria-label="Confirmação da comunidade"
      >
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span className="text-xs text-gray-400">
            Confirmação da comunidade
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className={`flex-1 h-8 text-xs ${
              hasUserConfirmed
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "border-gray-600 text-gray-400 hover:bg-green-500/10"
            }`}
            aria-label={`Confirmar alerta. ${confirmationsCount} confirmações`}
            aria-pressed={hasUserConfirmed}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
            Confirmar ({confirmationsCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-gray-600 text-gray-400 hover:bg-red-500/10"
            aria-label="Informar que não presenciou este alerta"
          >
            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Não vi isso
          </Button>
        </div>
      </div>
    </div>
  );
}
