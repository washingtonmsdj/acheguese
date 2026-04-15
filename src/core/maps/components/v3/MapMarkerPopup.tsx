/**
 * MapMarkerPopup — Painel de detalhes do marcador selecionado.
 *
 * Componente de apresentação puro — sem lógica de navegação.
 * O consumidor (MapaPageV4) passa onNavigate para manter SSOT de roteamento.
 */

import { X, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { getMarkerConfig } from '../../config/markerConfig';
import type { MapMarker } from '../../types/core';

interface MapMarkerPopupProps {
  marker: MapMarker;
  onClose: () => void;
  /** Chamado quando o usuário clica em "Ver detalhes" */
  onNavigate?: (url: string) => void;
}

export function MapMarkerPopup({ marker, onClose, onNavigate }: MapMarkerPopupProps) {
  const config = getMarkerConfig(marker.type);

  const rating = marker.metadata?.rating as number | undefined;
  const category = marker.metadata?.category as string | undefined;
  const isVerified = marker.metadata?.is_verified as boolean | undefined;

  return (
    <div
      className="absolute bottom-20 left-4 right-4 z-[1001] md:left-auto md:right-4 md:w-80"
      role="dialog"
      aria-label={`Detalhes: ${marker.title}`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          {/* Ícone do tipo — usa SSOT markerConfig */}
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-base mt-0.5"
            style={{ backgroundColor: config.color + '20' }}
          >
            <span>{config.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground leading-tight truncate">
                {marker.title}
              </h3>
              {marker.isPremium && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
              {isVerified && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  ✓
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{config.label}</span>
              {category && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground capitalize">{category}</span>
                </>
              )}
              {rating !== undefined && rating > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {rating.toFixed(1)}
                  </span>
                </>
              )}
              {marker.metadata?.distance_meters !== undefined && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-blue-600 font-medium">
                    📍 {(marker.metadata.distance_meters / 1000).toFixed(1)} km
                  </span>
                </>
              )}
            </div>

            {marker.subtitle && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                {marker.subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ação */}
        {marker.url && onNavigate && (
          <div className="px-4 pb-4">
            <Button
              onClick={() => { onNavigate(marker.url!); onClose(); }}
              size="sm"
              className="w-full gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver detalhes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
