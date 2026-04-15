import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ReportContentDialog } from "@/shared/components/ReportContentDialog";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useBusinessNavigation } from '@/core/business';
import { useRecomendacaoDetail } from "@/modules/community/hooks/useRecomendacaoDetail";
import { QuestionCard } from "@/shared/components/recomendacoes/QuestionCard";
import { AnswersList } from "@/shared/components/recomendacoes/AnswersList";
import { AnswerForm } from "@/shared/components/recomendacoes/AnswerForm";

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
    type: "post" | "comment";
  } | null>(null);

  const handleReport = (id: string, type: "post" | "comment") => {
    setReportTarget({ id, type });
    setReportOpen(true);
  };

  const handleNavigateToProfessional = (professionalId: string) => {
    navigate(`/services/${professionalId}`);
  };

  const handleNavigateToBusiness = (business: any) => {
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
          onReport={() => handleReport(question.id, "post")}
        />
      </div>

      {/* Answers */}
      <AnswersList
        answers={answers}
        isAuthor={isAuthor}
        onToggleLike={toggleLike}
        onMarkBest={markBestAnswer}
        onReport={(answerId) => handleReport(answerId, "comment")}
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
        <ReportContentDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
