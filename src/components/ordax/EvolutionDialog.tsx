/**
 * FASE 11: Game Evolution Engine - UI Component
 * 
 * Dialog para evolução automática de jogos.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import type { GameGenome } from '@/lib/ordax/game-genome';
import type { EvolutionResult, SelectionStrategy } from '@/lib/ordax/evolution-engine';
import { evolveGenomeSync, selectGenomes } from '@/lib/ordax/evolution-engine';

interface EvolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genome: GameGenome;
  onSelectVariant: (genome: GameGenome) => void;
}

export function EvolutionDialog({
  open,
  onOpenChange,
  genome,
  onSelectVariant,
}: EvolutionDialogProps) {
  const [generations, setGenerations] = useState(10);
  const [aggressiveness, setAggressiveness] = useState(0.5);
  const [strategy, setStrategy] = useState<SelectionStrategy>('top-k');
  const [isEvolving, setIsEvolving] = useState(false);
  const [result, setResult] = useState<EvolutionResult | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  const handleEvolve = () => {
    setIsEvolving(true);
    setResult(null);
    setSelectedVariantIndex(null);

    // Simula processamento assíncrono
    setTimeout(() => {
      const evolutionResult = evolveGenomeSync(genome, {
        generations,
        aggressiveness,
        seed: Date.now(),
      });

      setResult(evolutionResult as EvolutionResult);
      setIsEvolving(false);
    }, 500);
  };

  const handleSelectVariant = (index: number) => {
    if (!result) return;
    
    const variant = result.variants[index];
    onSelectVariant(variant.genome);
    onOpenChange(false);
  };

  const getTopVariants = () => {
    if (!result) return [];

    const selected = selectGenomes(
      result.variants.map(v => ({ genome: v.genome, score: v.score })),
      { strategy, count: 5, seed: Date.now() }
    );

    return selected.map(s => result.variants[s.index]);
  };

  const topVariants = getTopVariants();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Evoluir Jogo
          </DialogTitle>
          <DialogDescription>
            Gere variações automáticas do seu jogo através de mutações genômicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controles */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gerações: {generations}
              </label>
              <Slider
                value={[generations]}
                onValueChange={([v]) => setGenerations(v)}
                min={5}
                max={50}
                step={5}
                disabled={isEvolving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de variações a gerar
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Agressividade: {Math.round(aggressiveness * 100)}%
              </label>
              <Slider
                value={[aggressiveness * 100]}
                onValueChange={([v]) => setAggressiveness(v / 100)}
                min={10}
                max={100}
                step={10}
                disabled={isEvolving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Intensidade das mutações
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Estratégia de Seleção
              </label>
              <div className="flex gap-2">
                <Button
                  variant={strategy === 'top-k' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStrategy('top-k')}
                  disabled={isEvolving}
                >
                  Top-K
                </Button>
                <Button
                  variant={strategy === 'roulette' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStrategy('roulette')}
                  disabled={isEvolving}
                >
                  Roleta
                </Button>
                <Button
                  variant={strategy === 'pareto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStrategy('pareto')}
                  disabled={isEvolving}
                >
                  Pareto
                </Button>
              </div>
            </div>

            <Button
              onClick={handleEvolve}
              disabled={isEvolving}
              className="w-full"
            >
              {isEvolving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Evoluindo...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Evoluir Jogo
                </>
              )}
            </Button>
          </div>

          {/* Resultados */}
          {result && (
            <div className="space-y-4">
              {/* Estatísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Geradas</div>
                      <div className="text-lg font-bold">
                        {result.stats.totalGenerated}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Score Médio</div>
                      <div className="text-lg font-bold">
                        {result.stats.averageScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Melhor Score</div>
                      <div className="text-lg font-bold text-green-600">
                        {result.stats.bestScore}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Variantes */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Melhores Variações ({strategy})
                </h3>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {topVariants.map((variant, idx) => (
                      <Card
                        key={idx}
                        className={`cursor-pointer transition-colors ${
                          selectedVariantIndex === idx
                            ? 'border-primary'
                            : 'hover:border-muted-foreground'
                        }`}
                        onClick={() => setSelectedVariantIndex(idx)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium">
                                Variação #{variant.generation}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variant.mutations.length} mutações
                              </div>
                            </div>
                            <Badge variant="secondary">
                              Score: {variant.score.total}
                            </Badge>
                          </div>

                          <Tabs defaultValue="scores" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="scores">Scores</TabsTrigger>
                              <TabsTrigger value="mutations">Mutações</TabsTrigger>
                              <TabsTrigger value="feedback">Feedback</TabsTrigger>
                            </TabsList>

                            <TabsContent value="scores" className="space-y-1">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Fun:</span>{' '}
                                  {variant.score.breakdown.fun}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Difficulty:</span>{' '}
                                  {variant.score.breakdown.difficulty}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Chaos:</span>{' '}
                                  {variant.score.breakdown.chaos}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Readability:</span>{' '}
                                  {variant.score.breakdown.readability}
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="mutations" className="space-y-1">
                              {variant.mutations.slice(0, 3).map((mut, i) => (
                                <div key={i} className="text-xs">
                                  <Badge variant="outline" className="mr-1">
                                    {mut.operation}
                                  </Badge>
                                  {mut.field}
                                </div>
                              ))}
                              {variant.mutations.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{variant.mutations.length - 3} mais...
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="feedback" className="space-y-1">
                              {variant.score.bonuses.length > 0 && (
                                <div className="space-y-1">
                                  {variant.score.bonuses.map((bonus, i) => (
                                    <div key={i} className="text-xs text-green-600">
                                      ✓ {bonus}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {variant.score.penalties.length > 0 && (
                                <div className="space-y-1">
                                  {variant.score.penalties.map((penalty, i) => (
                                    <div key={i} className="text-xs text-orange-600">
                                      ⚠ {penalty}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>

                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectVariant(idx);
                            }}
                          >
                            Usar Esta Variação
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
