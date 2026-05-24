import React from "react";
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
import { AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isAlert?: boolean;
}

export function PublishWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  isAlert,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-warning" />
            <AlertDialogTitle className="font-display text-base">
              Antes de publicar
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">
                Você é responsável pelo conteúdo que publica. Não publique
                acusações contra pessoas ou empresas. Conteúdos ofensivos ou
                ilegais podem ser removidos e levar à suspensão da conta.
              </p>
              {isAlert && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="flex items-start gap-2 text-xs text-destructive leading-relaxed font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      Alertas falsos podem causar pânico e resultam em
                      suspensão imediata do recurso de alertas.
                    </span>
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Leia nossas{" "}
                <Link
                  to="/regras"
                  className="text-primary underline"
                  onClick={() => onOpenChange(false)}
                >
                  Regras da Comunidade
                </Link>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Continuar publicação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
