import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PostsFacade } from "@/core/posts/services"; // ✅ SSOT v2.0
import { Poll, PollOption } from "@/shared/types/poll";
import { profileService } from "@/core/profiles/services/ProfileService";
import { communityFeedQueryKeys } from "@/core/feed";
/**
 * Hook para gerenciar votação em enquetes
 *
 * Implementa otimistic updates e rollback em caso de erro.
 */

interface UsePollVoteProps {
  pollId: string;
  initialPoll: Poll;
}

interface PollState {
  poll: Poll;
  isVoting: boolean;
  hasVoted: boolean;
}

interface VoteMutationResult {
  options: PollOption[];
  total_votes: number;
  optionId: string;
}

export function usePollVote({ pollId, initialPoll }: UsePollVoteProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calcular porcentagens iniciais se não existirem
  const initialPollWithPercentages = {
    ...initialPoll,
    options: initialPoll.options.map((opt) => ({
      ...opt,
      percentage:
        opt.percentage ??
        (initialPoll.total_votes > 0
          ? Math.round((opt.votes / initialPoll.total_votes) * 100)
          : 0),
    })),
  };

  const [state, setState] = useState<PollState>({
    poll: initialPollWithPercentages,
    isVoting: false,
    hasVoted: initialPoll.user_voted,
  });

  /**
   * Calcula as porcentagens atualizadas após um voto
   */
  const calculatePercentages = (
    options: PollOption[],
    totalVotes: number,
  ): PollOption[] => {
    if (totalVotes === 0) {
      return options.map((opt) => ({ ...opt, percentage: 0 }));
    }

    return options.map((opt) => ({
      ...opt,
      percentage: Math.round((opt.votes / totalVotes) * 100),
    }));
  };

  /**
   * Mutation para registrar voto (apenas uma vez)
   */
  const voteMutation = useMutation<
    VoteMutationResult,
    Error,
    string,
    { previousState: PollState }
  >({
    mutationFn: async (optionId: string) => {
      // ✅ FASE 2: Usar ProfileService.getRequiredActiveProfile() para contexto social
      const activeProfile = await profileService.getRequiredActiveProfile();

      // ✅ MIGRADO - Registrar voto usando PostsFacade.polls (SSOT v2.0)
      const result = await PostsFacade.polls.votePoll(
        pollId,
        optionId,
        activeProfile.id,
      );

      return {
        options: result.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes || 0,
          percentage: 0,
        })),
        total_votes: result.total_votes,
        optionId,
      };
    },
    onMutate: async (optionId: string) => {
      // Salvar state anterior para rollback
      const previousState = { ...state };

      // Otimistic update
      const updatedOptions = state.poll.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt,
      );

      const newTotalVotes = state.poll.total_votes + 1;
      const optionsWithPercentages = calculatePercentages(
        updatedOptions,
        newTotalVotes,
      );

      setState({
        poll: {
          ...state.poll,
          options: optionsWithPercentages,
          total_votes: newTotalVotes,
          user_voted: true,
          user_vote_option_id: optionId,
        },
        isVoting: true,
        hasVoted: true,
      });

      return { previousState };
    },
    onSuccess: (data) => {
      // Atualizar com dados reais do servidor
      const optionsWithPercentages = calculatePercentages(
        data.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes || 0,
          percentage: 0,
        })),
        data.total_votes,
      );

      setState((prev) => ({
        ...prev,
        poll: {
          ...prev.poll,
          options: optionsWithPercentages,
          total_votes: data.total_votes,
          user_voted: true,
          user_vote_option_id: data.optionId, // Manter opção votada
        },
        isVoting: false,
      }));

      // Invalidate cache do feed
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: ["community-post"] });

      toast({
        title: "Voto registrado",
        description: "Seu voto foi computado com sucesso!",
      });
    },
    onError: (error: Error, _, context) => {
      // Rollback em caso de erro
      if (context?.previousState) {
        setState(context.previousState);
      }

      toast({
        title: "Error votar",
        description:
          error.message ||
          "Não foi possível registrar seu voto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  /**
   * Registra voto em uma opção (apenas uma vez)
   */
  const vote = async (optionId: string) => {
    // Prevenir voto duplo ou votação durante processamento
    if (state.hasVoted || state.isVoting) {
      toast({
        title: "Você já votou",
        description: "Não é possível votar mais de uma vez na mesma enquete.",
        variant: "destructive",
      });
      return;
    }

    voteMutation.mutate(optionId);
  };

  /**
   * Verifica se a enquete está encerrada
   */
  const isExpired = () => {
    const endDate = new Date(state.poll.expires_at || state.poll.ends_at);
    return endDate < new Date();
  };

  /**
   * Calcula tempo restante em formato legível
   */
  const getTimeRemaining = (): string => {
    const endDate = new Date(state.poll.expires_at || state.poll.ends_at);
    const now = new Date();

    // Validar se a date é válida
    if (isNaN(endDate.getTime())) {
      return "Data inválida";
    }

    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Encerrada";
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? "s" : ""} restante${diffDays > 1 ? "s" : ""}`;
    }

    if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? "s" : ""} restante${diffHours > 1 ? "s" : ""}`;
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} minuto${diffMins > 1 ? "s" : ""} restante${diffMins > 1 ? "s" : ""}`;
  };

  return {
    poll: state.poll,
    isVoting: state.isVoting,
    hasVoted: state.hasVoted,
    isExpired: isExpired(),
    timeRemaining: getTimeRemaining(),
    vote,
  };
}
