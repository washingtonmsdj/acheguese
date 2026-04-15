/**
 * VerificationBanner - Banner informativo para usuários não verificados
 * 
 * ✅ SSOT - Usa VerificationService
 * ✅ Arquitetura Modular
 * ✅ Acessibilidade
 */

import React from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface VerificationBannerProps {
  onDismiss?: () => void;
  onRequestVerification?: () => void;
  className?: string;
}

export function VerificationBanner({
  onDismiss,
  onRequestVerification,
  className,
}: VerificationBannerProps) {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/30 rounded-lg p-4 mb-6",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <ShieldCheck className="h-6 w-6 text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">
            Torne-se um Morador Verificado
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            Usuários verificados recebem o selo de Morador Verificado, ganham reputação mais rápido e têm acesso completo aos recursos da comunidade. A verificação é feita por administradores para garantir a segurança do bairro.
          </p>

          {onRequestVerification && (
            <Button
              onClick={onRequestVerification}
              size="sm"
              className="bg-blue-500 hover:bg-blue-400 text-white"
            >
              Solicitar Verificação
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
