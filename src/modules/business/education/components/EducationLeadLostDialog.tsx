import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

interface EducationLeadLostDialogProps {
  open: boolean;
  leadName?: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean> | boolean;
}

export function EducationLeadLostDialog({
  open,
  leadName,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: EducationLeadLostDialogProps) {
  const [reason, setReason] = useState('');
  const normalizedReason = reason.trim();
  const canSubmit = normalizedReason.length >= 3 && !isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    if (!nextOpen) setReason('');
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const moved = await onConfirm(normalizedReason);
    if (moved) {
      setReason('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-territory-border bg-territory-surface text-territory-ink">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5 text-territory-warning"
              aria-hidden="true"
            />
            Marcar como perdido
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-territory-muted">
            {leadName
              ? `Registre por que o contato com ${leadName} foi encerrado.`
              : 'Registre por que este contato foi encerrado.'}
          </p>

          <div>
            <Label htmlFor="education-lost-reason">Motivo operacional *</Label>
            <Textarea
              id="education-lost-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={4}
              required
              placeholder="Ex: família optou por outra instituição"
            />
            <p className="mt-1 text-xs leading-5 text-territory-muted">
              Não inclua CPF, documentos, diagnóstico, prontuário ou outros
              dados sensíveis. Registre apenas o contexto operacional necessário.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-territory-error text-territory-on-image hover:bg-territory-error/90"
            >
              {isSubmitting ? 'Atualizando...' : 'Marcar como perdido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
