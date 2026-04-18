/**
 * AdminTerritoryAlertsSection
 * 
 * Seção de alertas para duplicados detectados.
 * Exibe avisos de duplicados visuais e por slug.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import type { AdminTerritoryAlertsSectionProps } from './types';

export function AdminTerritoryAlertsSection({
  visualDuplicates,
  slugDuplicates,
}: AdminTerritoryAlertsSectionProps) {
  if (visualDuplicates.length === 0 && slugDuplicates.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Duplicados Detectados</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Encontrados {visualDuplicates.length} territórios com nomes duplicados. 
          Isso pode causar confusão na navegação.
        </p>
        <div className="flex flex-wrap gap-2">
          {visualDuplicates.map((dup, idx) => (
            <Badge key={idx} variant="destructive" className="gap-1">
              {dup.name} ({dup.type})
              <span className="ml-1 px-1 bg-destructive-foreground/20 rounded">
                {dup.count}x
              </span>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <Trash2 className="h-3 w-3" />
            Recarregar Página
          </Button>
          <p className="text-xs text-muted-foreground">
            Se o problema persistir, execute o script de correção no banco de dados.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
