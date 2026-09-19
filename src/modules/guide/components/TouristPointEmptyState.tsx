/**
 * TouristPointEmptyState — Estado vazio para listagem de pontos turísticos
 */

import { MapPin } from 'lucide-react';

interface TouristPointEmptyStateProps {
  territoryName?: string;
}

export function TouristPointEmptyState({ territoryName }: TouristPointEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <MapPin className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        Nenhum ponto turístico cadastrado
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {territoryName
          ? `Ainda não há pontos turísticos publicados em ${territoryName}.`
          : 'Ainda não há pontos turísticos publicados neste território.'}
      </p>
    </div>
  );
}
