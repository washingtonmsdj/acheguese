/**
 * PlanChangeConfirmationModal — Modal de confirmação de mudança de plano
 *
 * Exibe impacto da mudança e solicita confirmação do admin.
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_MIGRACAO_GATES_FRONTEND.md
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Users, FileText } from 'lucide-react';
import type { PlanChangeImpact } from '../services/PlanChangeValidator';

interface PlanChangeConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  impact: PlanChangeImpact | null;
  businessName: string;
  currentPlan: string;
  newPlan: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function PlanChangeConfirmationModal({
  open,
  onOpenChange,
  impact,
  businessName,
  currentPlan,
  newPlan,
  onConfirm,
  isLoading = false,
}: PlanChangeConfirmationModalProps) {
  if (!impact) return null;
  
  const isUpgrade = impact.willGainFeatures.length > impact.willLoseFeatures.length;
  const isDowngrade = impact.willLoseFeatures.length > 0;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDowngrade ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            Confirmar Mudança de Plano
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a alterar o plano de <strong>{businessName}</strong> de{' '}
            <Badge variant="outline">{currentPlan}</Badge> para{' '}
            <Badge variant="outline">{newPlan}</Badge>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          {/* Impacto em Contratos */}
          {impact.affectedContracts > 0 && (
            <Alert variant={isDowngrade ? 'destructive' : 'default'}>
              <AlertDescription className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <strong>Contratos Afetados:</strong>
                  </div>
                  <p className="text-sm">
                    {impact.affectedContracts} contrato(s) ativo(s) serão impactados
                  </p>
                  <p className="text-sm">
                    {impact.affectedUsers} usuário(s) afetado(s)
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Features Perdidas */}
          {impact.willLoseFeatures.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" />
                Recursos que serão removidos:
              </div>
              <ul className="space-y-1 ml-6">
                {impact.willLoseFeatures.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Features Ganhas */}
          {impact.willGainFeatures.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Recursos que serão adicionados:
              </div>
              <ul className="space-y-1 ml-6">
                {impact.willGainFeatures.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Estratégia de Migração */}
          {impact.requiresMigration && impact.migrationStrategy && (
            <Alert>
              <AlertDescription>
                <strong>Estratégia Recomendada:</strong>
                <p className="text-sm mt-1">{impact.migrationStrategy}</p>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Bloqueio */}
          {!impact.canChange && impact.reason && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Mudança Bloqueada:</strong>
                <p className="text-sm mt-1">{impact.reason}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          {impact.canChange && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              className={isDowngrade ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isLoading ? 'Processando...' : 'Confirmar Mudança'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
