/**
 * AdminTerritoryHeaderSection
 * 
 * Seção de cabeçalho com título, descrição e botão de novo grupo.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { AdminTerritoryHeaderSectionProps } from './types';

export function AdminTerritoryHeaderSection({
  onNewGroup,
}: AdminTerritoryHeaderSectionProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Territórios</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Controle a visibilidade dos territórios no seletor principal. 
          Territórios ocultos permanecem disponíveis para uso interno.
        </p>
      </div>
      <Button onClick={onNewGroup} size="lg" className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Grupo
      </Button>
    </div>
  );
}
