/**
 * EmptyPanel - Estado vazio reutilizável
 *
 * Exibe mensagem e ação quando não há conteúdo
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface EmptyPanelProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyPanel({ title, description, actionLabel, onAction }: EmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button className="mt-5 gap-2" onClick={onAction}>
        <Sparkles className="h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}
