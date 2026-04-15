/**
 * TerritoryAIContentSection
 * 
 * Exibe conteúdo gerado por IA na landing page do território:
 * descrição, história, dados demográficos e eventos.
 */

import { useEffect } from 'react';
import {
  Sparkles, BookOpen, Users, Calendar, MapPin,
  Loader2, RefreshCw, Building2, TrendingUp,
} from 'lucide-react';
import { useTerritoryAIContent } from '../hooks/useTerritoryAIContent';

interface Props {
  territorySlug: string;
  territoryName: string;
  members?: string[];
  isGroup?: boolean;
}

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  cultura: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  esporte: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  religioso: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  comunitário: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
};

export function TerritoryAIContentSection({ territorySlug, territoryName, members, isGroup }: Props) {
  const { content, isLoading, generateWithAI } = useTerritoryAIContent(territorySlug);

  // Auto-generate disabled until Edge Function is deployed
  // useEffect(() => {
  //   if (!isLoading && !content && territorySlug && !generateWithAI.isPending) {
  //     generateWithAI.mutate(
  //       { territory_slug: territorySlug, territory_name: territoryName, members },
  //       { onError: () => { /* Edge Function não disponível — falha silenciosa */ } },
  //     );
  //   }
  // }, [isLoading, content, territorySlug]);

  if (isLoading || generateWithAI.isPending) {
    return (
      <div className="px-4 mb-8">
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-4 w-4 text-teal-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {generateWithAI.isPending ? 'Gerando conteúdo com IA...' : 'Carregando...'}
            </span>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full w-full animate-pulse" />
            <div className="h-3 bg-muted rounded-full w-4/5 animate-pulse" />
            <div className="h-3 bg-muted rounded-full w-3/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const demographics = content.demographics || {};
  const events = content.events || [];

  return (
    <>
      {/* ── Descrição & História ─────────────────────────────────────── */}
      <section className="px-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-teal-500" />
          Sobre {isGroup ? 'o Complexo' : 'o bairro'}
          {content.ai_generated_at && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <Sparkles className="h-2.5 w-2.5" />
              IA
            </span>
          )}
        </h2>
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-5 shadow-sm space-y-3">
          {content.description && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {content.description}
            </p>
          )}
          {content.history && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">História</p>
              <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
                {content.history}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Dados Demográficos ──────────────────────────────────────── */}
      {Object.keys(demographics).length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Dados do território
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {demographics.estimated_population && (
              <div className="bg-gradient-to-br from-teal-500/8 to-teal-500/4 border border-teal-500/20 rounded-xl p-3.5">
                <Users className="h-4 w-4 text-teal-500 mb-1.5" />
                <p className="text-lg font-bold text-foreground">
                  ~{(demographics.estimated_population / 1000).toFixed(0)}mil
                </p>
                <p className="text-[10px] text-muted-foreground">Habitantes</p>
              </div>
            )}
            {demographics.area_km2 && (
              <div className="bg-gradient-to-br from-blue-500/8 to-blue-500/4 border border-blue-500/20 rounded-xl p-3.5">
                <MapPin className="h-4 w-4 text-blue-500 mb-1.5" />
                <p className="text-lg font-bold text-foreground">{demographics.area_km2} km²</p>
                <p className="text-[10px] text-muted-foreground">Área</p>
              </div>
            )}
            {demographics.economy && (
              <div className="col-span-2 bg-gradient-to-br from-amber-500/8 to-amber-500/4 border border-amber-500/20 rounded-xl p-3.5">
                <Building2 className="h-4 w-4 text-amber-500 mb-1.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">{demographics.economy}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Economia local</p>
              </div>
            )}
          </div>

          {demographics.main_characteristics?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {demographics.main_characteristics.map((c: string, i: number) => (
                <span
                  key={i}
                  className="text-[10px] bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Eventos e Agenda Cultural ───────────────────────────────── */}
      {events.length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            Eventos e cultura
          </h2>
          <div className="space-y-2">
            {events.map((event: any, i: number) => {
              const colorClass = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.comunitário;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-3.5 ${colorClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{event.name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed">{event.description}</p>
                    </div>
                    {event.frequency && (
                      <span className="text-[9px] opacity-60 flex-shrink-0 mt-0.5">
                        {event.frequency}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
