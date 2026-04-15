import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { CheckCircle2, Shield } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
/**
 * Seção de confirmação de alertas
 *
 * Design System:
 * - Usa cores globais do communityDesignSystem.ts
 * - Texto em branco e cinza claro
 * - Destaque laranja para confirmações
 */

interface AlertConfirmationSectionProps {
  postId: string;
  authorProfileId: string;
  confirmationsCount: number;
  isVerified: boolean;
  hasUserConfirmed: boolean;
  onConfirm: (postId: string) => void;
  isConfirming?: boolean;
}

export function AlertConfirmationSection({
  postId,
  authorProfileId,
  confirmationsCount,
  isVerified,
  hasUserConfirmed,
  onConfirm,
  isConfirming = false,
}: AlertConfirmationSectionProps) {
  const { activeProfile } = useSessionContext();

  // Verificar se usuário é o autor
  const isAuthor = activeProfile?.id === authorProfileId;

  // Desabilitar botão se:
  // - Usuário é o autor
  // - Usuário já confirmou
  // - Está processando confirmação
  const isDisabled = isAuthor || hasUserConfirmed || isConfirming;

  // Mensagem de tooltip
  const getTooltipMessage = () => {
    if (isAuthor) return "Você não pode confirm seu próprio alerta";
    if (hasUserConfirmed) return "Você já confirmou este alerta";
    return "Confirmar que este alerta é verdadeiro";
  };

  return (
    <div
      className="w-full border-t pt-4 mt-2 space-y-4"
      style={INLINE_STYLES.borderSubtle}
    >
      {/* Header com título e badge verificado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield
            className="w-5 h-5 flex-shrink-0"
            style={INLINE_STYLES.confirmationOrange}
          />
          <span
            className="font-semibold text-sm"
            style={INLINE_STYLES.textPrimary}
          >
            Confirmações da Comunidade
          </span>
        </div>

        {isVerified && (
          <Badge
            variant="default"
            className="border-0 hover:bg-emerald-600 flex-shrink-0"
            style={INLINE_STYLES.badgeVerified}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        )}
      </div>

      {/* Contador e botão de confirmação */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-3xl font-bold tabular-nums"
            style={INLINE_STYLES.confirmationOrange}
          >
            {confirmationsCount}
          </span>
          <span
            className="text-sm leading-tight"
            style={INLINE_STYLES.textSecondary}
          >
            {confirmationsCount === 1 ? "confirmação" : "confirmações"}
          </span>
        </div>

        <Button
          onClick={() => onConfirm(postId)}
          disabled={isDisabled}
          variant={hasUserConfirmed ? "secondary" : "default"}
          size="sm"
          title={getTooltipMessage()}
          className="min-w-[160px] h-11 font-semibold flex-shrink-0"
        >
          {isConfirming ? (
            <span className="animate-pulse">Confirmando...</span>
          ) : hasUserConfirmed ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmado
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Confirmar Alerta
            </>
          )}
        </Button>
      </div>

      {/* Mensagens de status */}
      {isVerified ? (
        <p
          className="text-xs leading-relaxed"
          style={INLINE_STYLES.textSecondary}
        >
          ✓ Este alerta foi verificado por 5 ou mais membros da comunidade
        </p>
      ) : confirmationsCount >= 3 ? (
        <p
          className="text-xs leading-relaxed"
          style={INLINE_STYLES.textSecondary}
        >
          Faltam {5 - confirmationsCount}{" "}
          {5 - confirmationsCount === 1 ? "confirmação" : "confirmações"} para
          verificação
        </p>
      ) : null}
    </div>
  );
}
