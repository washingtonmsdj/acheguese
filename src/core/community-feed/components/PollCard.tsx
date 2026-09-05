import React from "react";
import { Button } from "@/shared/components/ui/button";
import { usePollVote } from "@/core/community-feed/hooks/usePollVote";
import { Poll } from "@/shared/types/poll";
import { INLINE_STYLES, SPACING } from "@/core/community/components/styles/communityDesignSystem";
import { Check, Clock } from "lucide-react";
import { cn } from "@/shared/utils/cn";
/**
 * Componente profissional de enquete
 * Exibe opções, permite votação e mostra resultados em tempo real
 *
 * Features:
 * - Votação com otimistic updates
 * - Barras de progresso animadas
 * - Indicador de tempo restante
 * - Estados: pode votar, já votou, encerrada
 * - Acessibilidade completa
 */

interface PollCardProps {
  pollId: string;
  poll: Poll;
  className?: string;
}

export function PollCard({ pollId, poll, className }: PollCardProps) {
  const {
    poll: currentPoll,
    isVoting,
    hasVoted,
    isExpired,
    timeRemaining,
    vote,
  } = usePollVote({ pollId, initialPoll: poll });

  const canVote = !hasVoted && !isExpired && !isVoting;
  const showResults = hasVoted || isExpired;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Cabeçalho da enquete */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className="text-base font-semibold leading-snug flex-1"
          style={INLINE_STYLES.textPrimary}
        >
          {currentPoll.question}
        </h3>

        {/* Indicador de tempo */}
        <div
          className="flex items-center gap-1.5 text-xs flex-shrink-0"
          style={isExpired ? INLINE_STYLES.textMuted : INLINE_STYLES.textCyan}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">{timeRemaining}</span>
        </div>
      </div>

      {/* Opções da enquete */}
      <div className={SPACING.itemGapCompact}>
        {currentPoll.options.map((option) => {
          const isSelected = currentPoll.user_vote_option_id === option.id;
          const isWinning =
            showResults &&
            option.votes ===
              Math.max(...currentPoll.options.map((o) => o.votes));

          return (
            <div key={option.id} className="relative">
              {/* Botão de opção (quando pode votar) */}
              {canVote ? (
                <Button
                  onClick={() => vote(option.id)}
                  disabled={isVoting}
                  className="w-full h-auto py-3 px-4 text-left justify-start font-medium text-sm rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                  variant="outline"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: "#FFFFFF",
                  }}
                >
                  {option.text}
                </Button>
              ) : (
                /* Resultado da opção (quando já votou ou encerrou) */
                <div
                  className="relative w-full py-3 px-4 rounded-lg border overflow-hidden"
                  style={{
                    borderColor: isSelected
                      ? "rgba(79, 209, 197, 0.5)"
                      : "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {/* Barra de progresso */}
                  <div
                    className="absolute inset-0 transition-all duration-500 ease-out"
                    style={{
                      width: `${option.percentage}%`,
                      backgroundColor: isSelected
                        ? "rgba(79, 209, 197, 0.2)"
                        : isWinning
                          ? "rgba(79, 209, 197, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                    }}
                  />

                  {/* Conteúdo da opção */}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isSelected && (
                        <Check
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: "#4FD1C5" }}
                        />
                      )}
                      <span
                        className="text-sm font-medium truncate"
                        style={INLINE_STYLES.textPrimary}
                      >
                        {option.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-sm font-bold"
                        style={
                          isSelected
                            ? INLINE_STYLES.textCyan
                            : INLINE_STYLES.textPrimary
                        }
                      >
                        {option.percentage}%
                      </span>
                      <span className="text-xs" style={INLINE_STYLES.textMuted}>
                        ({option.votes})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé com total de votos */}
      <div
        className="flex items-center justify-between text-xs pt-1"
        style={INLINE_STYLES.textSecondary}
      >
        <span>
          {currentPoll.total_votes} voto
          {currentPoll.total_votes !== 1 ? "s" : ""}
        </span>

        {hasVoted && !isExpired && (
          <span className="inline-flex items-center gap-1" style={INLINE_STYLES.textCyan}>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Você votou
          </span>
        )}

        {isExpired && (
          <span style={INLINE_STYLES.textMuted}>Enquete encerrada</span>
        )}
      </div>
    </div>
  );
}
