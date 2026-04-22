/**
 * EmpresaAvaliacoesSection
 * 
 * Seção de avaliações com resumo de rating, distribuição e lista de reviews.
 * CTA para escrever avaliação.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import { RatingSummary, RatingDistribution } from '../components/rating';
import { ReviewCard } from '../components/cards';
import type { EmpresaAvaliacoesSectionProps } from './types';

export function EmpresaAvaliacoesSection({
  business,
  reviews,
  user,
  navigate,
}: EmpresaAvaliacoesSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Avaliações</h2>
          </div>
        </div>

        {/* Rating summary */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RatingSummary
              rating={business.rating || 0}
              totalReviews={business.total_reviews || 0}
            />
            <RatingDistribution reviews={reviews} />
          </div>
        </div>

        {/* Individual reviews */}
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Write review CTA */}
        <div className="mt-4 bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            Já visitou {business.name}?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Compartilhe sua experiência com os vizinhos
          </p>
          <Button
            onClick={() =>
              user ? toast.info('Em breve!') : navigate?.('/login')
            }
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/5 gap-2"
          >
            <Star className="h-4 w-4" /> Escrever avaliação
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
