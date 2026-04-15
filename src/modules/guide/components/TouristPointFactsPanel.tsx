/**
 * TouristPointFactsPanel — Bloco de informações rápidas do ponto turístico
 */

import { Clock, MapPin, DollarSign, Accessibility, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { TouristPoint } from '../types';
import { PRICE_TYPE_LABELS } from '../types';

interface TouristPointFactsPanelProps {
  point: TouristPoint;
}

interface FactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

function FactRow({ icon, label, value, href }: FactRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

export function TouristPointFactsPanel({ point }: TouristPointFactsPanelProps) {
  const hasFacts =
    point.opening_hours ||
    point.address_text ||
    point.price_text ||
    point.accessibility_notes ||
    point.official_url;

  if (!hasFacts) return null;

  const priceLabel = point.price_text
    ? `${PRICE_TYPE_LABELS[point.price_type]} — ${point.price_text}`
    : PRICE_TYPE_LABELS[point.price_type];

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold text-foreground mb-1">Informações</h2>

        {point.opening_hours && (
          <FactRow
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Horário"
            value={point.opening_hours}
          />
        )}

        {point.address_text && (
          <FactRow
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            label="Endereço"
            value={point.address_text}
          />
        )}

        <FactRow
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          label="Entrada"
          value={priceLabel}
        />

        {point.accessibility_notes && (
          <FactRow
            icon={<Accessibility className="h-4 w-4 text-muted-foreground" />}
            label="Acessibilidade"
            value={point.accessibility_notes}
          />
        )}

        {point.official_url && (
          <FactRow
            icon={<ExternalLink className="h-4 w-4 text-muted-foreground" />}
            label="Site oficial"
            value="Visitar site"
            href={point.official_url}
          />
        )}
      </CardContent>
    </Card>
  );
}
