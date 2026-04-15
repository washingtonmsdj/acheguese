import React from "react";
import { Home, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";
/**
 * Badge de Morador Verificado
 *
 * Indica que o usuário confirmou seu endereço e é um morador verificado da região.
 * Aumenta a confiança para empréstimos, trocas e encontros presenciais.
 *
 * Features:
 * - Ícone de casa com check
 * - Tooltip explicactive
 * - Variantes: small, medium, large
 * - Cores: azul (#3B82F6) para confiança
 */

interface VerifiedResidentBadgeProps {
  size?: "small" | "medium" | "large";
  showTooltip?: boolean;
  className?: string;
  variant?: "default" | "with-text";
}

const sizeClasses = {
  small: "w-4 h-4",
  medium: "w-5 h-5",
  large: "w-6 h-6",
};

export function VerifiedResidentBadge({
  size = "medium",
  showTooltip = true,
  className,
  variant = "default",
}: VerifiedResidentBadgeProps) {
  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1 flex-shrink-0",
        variant === "with-text" && "px-2 py-0.5 rounded-full bg-blue-500/10",
        className,
      )}
    >
      <div className="relative">
        <Home
          className={cn(sizeClasses[size], "text-blue-500")}
          strokeWidth={2.5}
        />
        <ShieldCheck
          className={cn(
            size === "small" && "w-2.5 h-2.5",
            size === "medium" && "w-3 h-3",
            size === "large" && "w-3.5 h-3.5",
            "absolute -bottom-0.5 -right-0.5 text-blue-500 bg-[#1E2529] rounded-full",
          )}
          strokeWidth={3}
        />
      </div>

      {variant === "with-text" && (
        <span className="text-xs font-semibold text-blue-500">Verificado</span>
      )}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs"
          style={{ backgroundColor: "#1E2529", borderColor: "#3B82F6" }}
        >
          <div className="space-y-1">
            <p className="font-semibold text-sm text-blue-500">
              🏠 Morador Verificado
            </p>
            <p className="text-xs text-gray-300">
              Este usuário confirmou seu endereço e é um morador verificado da
              região. Isso aumenta a confiança para empréstimos, trocas e
              encontros.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Badge inline para usar em textos
 */
export function VerifiedResidentInline() {
  return (
    <VerifiedResidentBadge
      size="small"
      showTooltip={true}
      className="inline-flex align-middle mx-0.5"
    />
  );
}

/**
 * Badge com texto para perfis
 */
export function VerifiedResidentWithText() {
  return (
    <VerifiedResidentBadge
      size="small"
      variant="with-text"
      showTooltip={true}
    />
  );
}
