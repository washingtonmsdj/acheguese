import React from "react";
import { useNavigate } from "react-router-dom";
import { CircleHelp, Loader2 } from "lucide-react";

import { useCommunityUrls } from "@/core/community/hooks/useCommunityUrls";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { QuestionCard } from "@/shared/components/recomendacoes/QuestionCard";
import type { QuestionItem } from "@/core/community/hooks/useRecomendacoes";

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
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center">
        <CircleHelp className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="mb-3 text-sm text-muted-foreground">
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
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
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
