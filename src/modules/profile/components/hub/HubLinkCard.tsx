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
  emphasis?: "default" | "primary" | "quiet";
  onClick: () => void;
}

export function HubLinkCard({ icon: Icon, title, description, badge, emphasis = "default", onClick }: HubLinkCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        emphasis === "primary"
          ? "border-primary/25 bg-primary text-primary-foreground shadow-sm hover:bg-primary/92"
          : emphasis === "quiet"
            ? "border-border/70 bg-muted/35 hover:border-primary/25 hover:bg-muted/55"
            : "border-border/70 bg-background/85 hover:border-primary/30 hover:bg-accent/30",
      ].join(" ")}
      aria-label={title}
    >
      <div className={emphasis === "primary" ? "rounded-2xl bg-primary-foreground/15 p-2 text-primary-foreground" : "rounded-2xl bg-primary/10 p-2 text-primary"}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={emphasis === "primary" ? "text-sm font-semibold text-primary-foreground" : "text-sm font-semibold text-foreground"}>{title}</p>
          {badge ? <Badge variant="outline" className="h-5 text-[10px]">{badge}</Badge> : null}
        </div>
        <p className={emphasis === "primary" ? "mt-1 text-xs text-primary-foreground/80" : "mt-1 text-xs text-muted-foreground"}>{description}</p>
      </div>
      <ArrowRight className={emphasis === "primary" ? "mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/80 transition-transform group-hover:translate-x-0.5" : "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"} />
    </button>
  );
}
