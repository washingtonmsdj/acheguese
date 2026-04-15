/**
 * Dialog acessível com título e descrição obrigatórios
 * Wrapper sobre Dialog do Radix UI que garante acessibilidade
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AccessibleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Dialog acessível que sempre inclui título e descrição
 *
 * @param title - Título do dialog (obrigatório para acessibilidade)
 * @param description - Descrição do dialog (recomendado)
 * @param hideTitle - Se true, esconde visualmente o título mas mantém para screen readers
 * @param hideDescription - Se true, esconde visualmente a descrição mas mantém para screen readers
 *
 * @example
 * ```tsx
 * <AccessibleDialog
 *   title="Confirmar ação"
 *   description="Esta ação não pode ser desfeita"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * >
 *   <p>Conteúdo do dialog</p>
 * </AccessibleDialog>
 * ```
 */
export function AccessibleDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  hideTitle = false,
  hideDescription = false,
  children,
  footer,
  className,
  contentClassName,
}: AccessibleDialogProps) {
  const TitleComponent = hideTitle ? VisuallyHidden : React.Fragment;
  const DescriptionComponent = hideDescription
    ? VisuallyHidden
    : React.Fragment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className={contentClassName}
        aria-describedby={description ? undefined : "dialog-description"}
      >
        <DialogHeader>
          <TitleComponent>
            <DialogTitle>{title}</DialogTitle>
          </TitleComponent>

          {description ? (
            <DescriptionComponent>
              <DialogDescription>{description}</DialogDescription>
            </DescriptionComponent>
          ) : (
            <VisuallyHidden>
              <DialogDescription id="dialog-description">
                {title}
              </DialogDescription>
            </VisuallyHidden>
          )}
        </DialogHeader>

        <div className={className}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Export individual components for flexibility
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
