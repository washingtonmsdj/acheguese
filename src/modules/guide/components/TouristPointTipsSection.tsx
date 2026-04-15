/**
 * TouristPointTipsSection — Dicas e como chegar
 */

import { Lightbulb, Bus, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

interface TouristPointTipsSectionProps {
  tips: string | null;
  howToGetThere: string | null;
  safetyNotes?: string | null;
  openingHours?: string | null;
}

interface TipBlockProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  accent?: string;
}

function TipBlock({ icon, title, content, accent = 'bg-primary/10 text-primary' }: TipBlockProps) {
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
}

export function TouristPointTipsSection({
  tips,
  howToGetThere,
  safetyNotes,
  openingHours,
}: TouristPointTipsSectionProps) {
  const hasSomething = tips || howToGetThere || safetyNotes;
  if (!hasSomething) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-base font-bold text-foreground mb-2">Dicas úteis</h2>

        {tips && (
          <TipBlock
            icon={<Lightbulb className="h-4 w-4" />}
            title="Dica local"
            content={tips}
          />
        )}

        {howToGetThere && (
          <TipBlock
            icon={<Bus className="h-4 w-4" />}
            title="Como chegar"
            content={howToGetThere}
            accent="bg-accent text-accent-foreground"
          />
        )}

        {openingHours && (
          <TipBlock
            icon={<Clock className="h-4 w-4" />}
            title="Horário de funcionamento"
            content={openingHours}
            accent="bg-secondary text-secondary-foreground"
          />
        )}

        {safetyNotes && (
          <TipBlock
            icon={<Shield className="h-4 w-4" />}
            title="Segurança"
            content={safetyNotes}
            accent="bg-warning/10 text-warning"
          />
        )}
      </CardContent>
    </Card>
  );
}
