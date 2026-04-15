/**
 * RideRequestSheet Component (AAA)
 * 
 * Sheet responsivo para solicitação de corrida:
 * - Sheet nativo em mobile (<768px) com swipe to dismiss
 * - Modal tradicional em desktop (≥768px)
 * 
 * @module mobility/components/ride-request/RideRequestSheet
 * @version 2.0.0 (AAA)
 */

import React, { memo, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { RideRequestForm } from './RideRequestForm';
import type { CreateRideRequestData } from '@/modules/mobility/hooks/useMobilidade';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

export interface RideRequestSheetProps {
  /** Aberto/Fechado */
  open: boolean;
  /** Callback ao mudar estado */
  onOpenChange: (open: boolean) => void;
  /** Callback ao submeter formulário */
  onSubmit: (data: CreateRideRequestData) => void | Promise<void>;
  /** Título customizado */
  title?: string;
  /** Descrição customizada */
  description?: string;
}

/**
 * Sheet/Modal responsivo para solicitação de corrida
 * 
 * @example
 * ```tsx
 * <RideRequestSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={async (data) => {
 *     await createRide(data);
 *     setIsOpen(false);
 *   }}
 * />
 * ```
 */
export const RideRequestSheet = memo<RideRequestSheetProps>(function RideRequestSheet({
  open,
  onOpenChange,
  onSubmit,
  title = 'Nova Solicitação',
  description = 'Solicite uma corrida, entrega ou carona compartilhada',
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleSubmit = useCallback(
    async (data: CreateRideRequestData) => {
      await onSubmit(data);
      onOpenChange(false);
    },
    [onSubmit, onOpenChange]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Desktop: Modal tradicional
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'bg-card border-border text-foreground',
            'max-w-md max-h-[90vh] overflow-y-auto',
            'sm:rounded-2xl'
          )}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-foreground">
                {title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <RideRequestForm onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Sheet nativo
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'bg-card border-border text-foreground',
          'h-[95vh] rounded-t-2xl',
          'overflow-y-auto'
        )}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold text-foreground">
              {title}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <RideRequestForm onSubmit={handleSubmit} />
        </div>
      </SheetContent>
    </Sheet>
  );
});

RideRequestSheet.displayName = 'RideRequestSheet';
