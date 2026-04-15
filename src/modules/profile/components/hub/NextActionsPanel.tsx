/**
 * NextActionsPanel - Painel de próximas ações recomendadas
 * 
 * Exibe ações sugeridas para completar onboarding e melhorar perfil
 */

import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { SectionFrame } from './SectionFrame';

interface NextAction {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

interface NextActionsPanelProps {
  actions: NextAction[];
}

export function NextActionsPanel({ actions }: NextActionsPanelProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <SectionFrame
      title="Proximos passos recomendados"
      description="Acoes objetivas para completar onboarding, ativar modulos e reduzir friccao operacional."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {actions.map((action) => (
          <div key={action.title} className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">{action.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={action.onClick}>
              <ArrowRight className="h-3.5 w-3.5" />
              {action.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
