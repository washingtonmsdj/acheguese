 
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCommunityUrls } from "@/modules/community/hooks/useCommunityUrls";

/**
 * ✅ SSOT COMPLIANT - QuestionsList migrado
 * Usa useCommunityUrls para navegação
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { QuestionCard } from "./QuestionCard";
// QuestionItem type definido localmente abaixo

interface QuestionsListProps {
  questions: QuestionItem[];
  loading: boolean;
  initialLoading: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function QuestionsList({
  questions,
  loading,
  initialLoading,
  sentinelRef,
}: QuestionsListProps) {
  const navigate = useNavigate();
  const communityUrls = useCommunityUrls();

  if (initialLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🤔</p>
        <p className="text-sm text-muted-foreground mb-3">
          Nenhuma pergunta ainda.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(communityUrls.newRecommendation)}
        >
          Fazer a primeira pergunta
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question as any}
          onReport={() => {}}
        />
      ))}

      {loading && !initialLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
