import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CommunityReportContentDialog } from "@/core/community/moderation";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useBusinessNavigation } from "@/core/business";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { useRecomendacaoDetail } from "@/core/community/hooks/useRecomendacaoDetail";
import { QuestionCard } from "@/shared/components/recomendacoes/QuestionCard";
import { AnswersList } from "@/shared/components/recomendacoes/AnswersList";
import { AnswerForm } from "@/shared/components/recomendacoes/AnswerForm";

interface NavigableBusiness {
  id?: string | null;
  slug?: string | null;
}

export default function RecomendacaoDetailPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const { navigateToBusiness } = useBusinessNavigation();

  const {
    // Data
    question,
    answers,
    loading,
    notFound,

    // Answer form
    answerText,
    setAnswerText,
    submitting,

    // Mentions
    mentionSearch,
    mentionResults,
    selectedPro,
    selectedBiz,
    showMention,
    setShowMention,

    // Computed
    isAuthor,

    // Actions
    submitAnswer,
    toggleLike,
    markBestAnswer,
    searchMentions,
    selectMention,
    clearMention,
    handleGoBack,
  } = useRecomendacaoDetail();

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: "question" | "answer";
  } | null>(null);

  const handleReport = (id: string, type: "question" | "answer") => {
    setReportTarget({ id, type });
    setReportOpen(true);
  };

  const handleNavigateToProfessional = async (professionalId: string) => {
    const ctx =
      await ProfessionalUrlService.resolveByProfessionalDataId(professionalId);
    navigate(
      ctx
        ? ProfessionalUrlService.getCanonicalUrl(ctx)
        : professionalPublicRoutes.home(),
    );
  };

  const handleNavigateToBusiness = (business: NavigableBusiness) => {
    navigateToBusiness({
      id: business.id || "",
      slug: business.slug || "",
      is_premium: false,
    });
  };

  if (loading) {
    return (
      <div className="px-4 pt-16 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (notFound || !question) {
    return (
      <div className="p-4 text-center">
        <p>Pergunta não encontrada.</p>
        <Button
          variant="outline"
          onClick={() => navigate(appUrls.community.recommendations)} // ✅ SSOT
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button
          onClick={handleGoBack}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold font-display">Pergunta</h1>
      </div>

      {/* Question */}
      <div className="relative">
        <QuestionCard
          question={question}
          onReport={() => handleReport(question.id, "question")}
        />
      </div>

      {/* Answers */}
      <AnswersList
        answers={answers}
        isAuthor={isAuthor}
        onToggleLike={toggleLike}
        onMarkBest={markBestAnswer}
        onReport={(answerId) => handleReport(answerId, "answer")}
        onNavigateToProfessional={handleNavigateToProfessional}
        onNavigateToBusiness={handleNavigateToBusiness}
      />

      {/* Answer form */}
      <AnswerForm
        answerText={answerText}
        submitting={submitting}
        showMention={showMention}
        mentionSearch={mentionSearch}
        mentionResults={mentionResults}
        selectedPro={selectedPro}
        selectedBiz={selectedBiz}
        onAnswerTextChange={setAnswerText}
        onToggleMention={() => setShowMention(!showMention)}
        onMentionSearchChange={searchMentions}
        onSelectMention={selectMention}
        onClearMention={clearMention}
        onSubmit={submitAnswer}
      />

      {/* Report dialog */}
      {reportTarget && (
        <CommunityReportContentDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
