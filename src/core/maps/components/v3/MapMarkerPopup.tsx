import { CheckCircle2, X, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { getMarkerConfig } from '../../config/markerConfig';
import type { MapMarker } from '../../types/core';

interface MapMarkerPopupProps {
  marker: MapMarker;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export function MapMarkerPopup({ marker, onClose, onNavigate }: MapMarkerPopupProps) {
  const config = getMarkerConfig(marker.type);

  const rating = marker.metadata?.rating as number | undefined;
  const category = marker.metadata?.category as string | undefined;
  const isVerified = marker.metadata?.is_verified as boolean | undefined;
  const distanceMeters =
    typeof marker.metadata?.distance_meters === 'number'
      ? marker.metadata.distance_meters
      : undefined;

  return (
    <div
      className="absolute bottom-20 left-4 right-4 z-[1001] md:left-auto md:right-4 md:w-80"
      role="dialog"
      aria-label={`Detalhes: ${marker.title}`}
    >
      <div className="overflow-hidden rounded-2xl border border-territory-border bg-territory-surface shadow-xl">
        <div className="flex items-start gap-3 p-4 pb-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-territory-on-image"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <span style={{ color: config.color }}>{config.abbr}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate text-sm font-semibold leading-tight text-territory-ink">
                {marker.title}
              </h3>
              {marker.isPremium && (
                <span className="rounded bg-territory-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-territory-warning">
                  PRO
                </span>
              )}
              {isVerified && (
                <span className="rounded bg-territory-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-territory-brand">
                  <CheckCircle2 className="h-3 w-3" aria-label="Verificado" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-territory-muted">{config.label}</span>
              {category && (
                <>
                  <span className="text-territory-muted/40">·</span>
                  <span className="text-xs capitalize text-territory-muted">{category}</span>
                </>
              )}
              {rating !== undefined && rating > 0 && (
                <>
                  <span className="text-territory-muted/40">·</span>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-territory-warning">
                    <Star className="h-3 w-3 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                </>
              )}
              {distanceMeters !== undefined && (
                <>
                  <span className="text-territory-muted/40">·</span>
                  <span className="text-xs font-medium text-territory-brand">
                    {(distanceMeters / 1000).toFixed(1)} km
                  </span>
                </>
              )}
            </div>

            {marker.subtitle && (
              <p className="mt-1.5 line-clamp-2 text-xs text-territory-muted">
                {marker.subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 text-territory-muted transition-colors hover:text-territory-ink"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {marker.url && onNavigate && (
          <div className="px-4 pb-4">
            <Button
              onClick={() => {
                onNavigate(marker.url as string);
                onClose();
              }}
              size="sm"
              className="w-full gap-1.5 bg-territory-brand text-territory-on-image hover:bg-territory-brand-strong"
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
