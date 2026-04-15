/**
 * HubLinkCard - Card de link/ação reutilizável
 * 
 * Usado para navegação entre seções do hub
 */

import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

interface HubLinkCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}

export function HubLinkCard({ icon: Icon, title, description, badge, onClick }: HubLinkCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-primary/30 hover:bg-accent/30"
      aria-label={title}
    >
      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {badge ? <Badge variant="outline" className="h-5 text-[10px]">{badge}</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
