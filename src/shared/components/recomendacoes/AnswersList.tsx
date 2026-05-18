 
import React from "react";
import { motion } from "framer-motion";
import { AnswerCard, type Answer } from "./AnswerCard";

interface AnswersListProps {
  answers: Answer[];
  isAuthor: boolean;
  onToggleLike: (answerId: string) => void;
  onMarkBest: (answerId: string) => void;
  onReport: (answerId: string) => void;
  onNavigateToProfessional: (professionalId: string) => void;
  onNavigateToBusiness: (business: any) => void;
}

export function AnswersList({
  answers,
  isAuthor,
  onToggleLike,
  onMarkBest,
  onReport,
  onNavigateToProfessional,
  onNavigateToBusiness,
}: AnswersListProps) {
  if (answers.length === 0) {
    return (
      <div className="px-4 py-3">
        <h3 className="text-sm font-bold mb-3">0 Respostas</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          Seja o primeiro a responder!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-bold mb-3">
        {answers.length} {answers.length === 1 ? "Resposta" : "Respostas"}
      </h3>

      <div className="space-y-3">
        {answers.map((answer, index) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <AnswerCard
              answer={answer}
              isAuthor={isAuthor}
              onToggleLike={() => onToggleLike(answer.id)}
              onMarkBest={() => onMarkBest(answer.id)}
              onReport={() => onReport(answer.id)}
              onNavigateToProfessional={onNavigateToProfessional}
              onNavigateToBusiness={onNavigateToBusiness}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
