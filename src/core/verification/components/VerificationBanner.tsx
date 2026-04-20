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
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      {onDismiss ? (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      ) : null}

      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex-shrink-0">
          <ShieldCheck className="h-6 w-6 text-blue-400" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-white">
            Torne-se um Morador Verificado
          </h3>
          <p className="mb-3 text-sm text-gray-300">
            Usuarios verificados recebem o selo de Morador Verificado, ganham
            reputacao mais rapido e tem acesso completo aos recursos da
            comunidade. A verificacao e feita por administradores para garantir
            a seguranca do bairro.
          </p>

          {onRequestVerification ? (
            <Button
              onClick={onRequestVerification}
              size="sm"
              className="bg-blue-500 text-white hover:bg-blue-400"
            >
              Solicitar Verificacao
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
