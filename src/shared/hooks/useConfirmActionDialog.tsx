import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

type ConfirmVariant = "default" | "destructive";

export interface ConfirmActionOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

const DEFAULT_OPTIONS: Required<Omit<ConfirmActionOptions, "description">> = {
  title: "Confirmar acao",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  variant: "default",
};

export function useConfirmActionDialog() {
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmActionOptions | null>(null);

  const resolveAndClose = useCallback((confirmed: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolver?.(confirmed);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmActionOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const ConfirmDialog = useCallback(() => {
    const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
    const isDestructive = resolvedOptions.variant === "destructive";

    return (
      <AlertDialog
        open={Boolean(options)}
        onOpenChange={(open) => {
          if (!open) resolveAndClose(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{resolvedOptions.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {resolvedOptions.description ?? "Esta acao precisa de confirmacao."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => resolveAndClose(false)}>
              {resolvedOptions.cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveAndClose(true)}
              className={
                isDestructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {resolvedOptions.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [options, resolveAndClose]);

  return { confirm, ConfirmDialog };
}
