/**
 * IdentityChangeConfirmDialog
 * Dialog de confirmação explícita ao salvar mudança de slug/username.
 * Exigido quando há mudança real de identificador.
 */

import { useEffect } from 'react';
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
import { logger } from '@/shared/utils/logger';
import type { EntityType } from '@/core/public-identity/domain/types';

interface IdentityChangeConfirmDialogProps {
  open: boolean;
  entityType: EntityType;
  onConfirm: () => void;
  onCancel: () => void;
  oldIdentifier?: string;
  newIdentifier?: string;
}

const DIALOG_CONFIG: Record<EntityType, { title: string; description: string }> = {
  business: {
    title: 'Confirmar alteração de link público',
    description:
      'Você está alterando o link público da empresa. Links antigos continuarão funcionando e serão redirecionados para o novo endereço.',
  },
  profile: {
    title: 'Confirmar alteração de nome de usuário',
    description:
      'Você está alterando seu nome de usuário público. Links antigos podem deixar de funcionar. Use essa troca apenas se for realmente necessário.',
  },
  professional: {
    title: 'Confirmar alteração de link público',
    description:
      'Você está alterando o link público profissional. Links antigos podem deixar de funcionar. Revise bem antes de confirmar.',
  },
};

export function IdentityChangeConfirmDialog({
  open,
  entityType,
  onConfirm,
  onCancel,
  oldIdentifier,
  newIdentifier,
}: IdentityChangeConfirmDialogProps) {
  const config = DIALOG_CONFIG[entityType];

  // Log quando dialog abre
  useEffect(() => {
    if (open) {
      logger.info('[IdentityChangeConfirmDialog] opened', {
        entityType,
        oldIdentifier,
        newIdentifier,
      });
    }
  }, [open, entityType, oldIdentifier, newIdentifier]);

  const handleConfirm = () => {
    logger.info('[IdentityChangeConfirmDialog] confirmed', {
      entityType,
      oldIdentifier,
      newIdentifier,
    });
    onConfirm();
  };

  const handleCancel = () => {
    logger.info('[IdentityChangeConfirmDialog] cancelled', {
      entityType,
      oldIdentifier,
      newIdentifier,
    });
    onCancel();
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmar alteração</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
