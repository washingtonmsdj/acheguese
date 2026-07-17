/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useRecomendacaoDetail — Hook para detalhes de perguntas e respostas Q&A
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/shared/hooks/use-toast";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { logger } from "@/shared/utils/logger";
import { CommunityQAService } from "@/core/community/services/CommunityQAService";
import type {
  CommunityQuestion,
  CommunityAnswer,
  MentionResult,
} from "@/core/community/qa-types";

export type Question = CommunityQuestion;
export type Answer = CommunityAnswer;

export function useRecomendacaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, activeProfile } = useSessionContext();
  const appUrls = useAppUrls();

  const [question, setQuestion] = useState<CommunityQuestion | null>(null);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (!id) return;
    const questionData = await CommunityQAService.getQuestionById(id);
    if (!questionData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setQuestion(questionData);
    await loadAnswers();
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const loadAnswers = async () => {
    if (!id) return;
    const answersData = await CommunityQAService.getAnswersByQuestionId(id, user?.id);
    setAnswers(answersData);
  };

  const submitAnswer = async (): Promise<boolean> => {
    if (!user) {
      toast({ title: "Faça login para responder", variant: "destructive" });
      navigate(appUrls.auth.login);
      return false;
    }
    if (!activeProfile) {
      toast({ title: "Selecione um perfil ativo para responder", variant: "destructive" });
      return false;
    }
    if (!answerText.trim()) return false;

    setSubmitting(true);
    try {
      const newAnswer = await CommunityQAService.createAnswer({
        question_id: id!,
        texto: answerText.trim(),
        professional_id: selectedPro || null,
        business_id: selectedBiz || null,
      });
      if (!newAnswer) throw new Error("Failed to create answer");
      setAnswerText("");
      setSelectedPro(null);
      setSelectedBiz(null);
      setShowMention(false);
      toast({ title: "Resposta enviada!" });
      await loadAnswers();
      return true;
    } catch (error) {
      logger.error("Error submitting answer:", error);
      toast({ title: "Erro ao responder", variant: "destructive" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (answerId: string) => {
    if (!user || !activeProfile) {
      toast({
        title: user ? "Selecione um perfil ativo para curtir" : "Faça login para curtir",
        variant: "destructive",
      });
      return;
    }
    const result = await CommunityQAService.toggleAnswerLike(answerId);
    if (result) {
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? { ...a, liked: result.liked, curtidas: result.newCount }
            : a,
        ),
      );
    }
  };

  const markBestAnswer = async (answerId: string) => {
    if (!user || question?.autor_id !== activeProfile?.id) return;
    const success = await CommunityQAService.markBestAnswer(id!, answerId);
    if (success) {
      toast({ title: "Melhor resposta marcada!" });
      loadQuestion();
    }
  };

  const searchMentions = async (query: string) => {
    setMentionSearch(query);
    if (query.length < 2) { setMentionResults([]); return; }
    const results = await CommunityQAService.searchMentions(query);
    setMentionResults(results);
  };

  const selectMention = (result: MentionResult) => {
    if (result.type === "professional") {
      setSelectedPro(result.id);
      setSelectedBiz(null);
    } else {
      setSelectedBiz(result.id);
      setSelectedPro(null);
    }
    setShowMention(false);
    setMentionSearch("");
    setMentionResults([]);
  };

  const clearMention = () => { setSelectedPro(null); setSelectedBiz(null); };
  const handleGoBack = () => navigate(-1);
  const isAuthor = activeProfile?.id === question?.autor_id;

  return {
    question, answers, loading, notFound, user,
    answerText, setAnswerText, submitting,
    mentionSearch, mentionResults, selectedPro, selectedBiz, showMention, setShowMention,
    isAuthor,
    submitAnswer, toggleLike, markBestAnswer, searchMentions, selectMention, clearMention, handleGoBack,
  };
}

