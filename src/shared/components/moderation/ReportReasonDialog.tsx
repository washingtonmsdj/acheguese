import { useEffect, useId, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Textarea } from "@/shared/components/ui/textarea";

interface ReportReasonOption<TReason extends string> {
  id: TReason;
  label: string;
}

interface ReportReasonDialogProps<TReason extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentLabel: string;
  reasonOptions: readonly ReportReasonOption<TReason>[];
  onSubmit: (reason: TReason, details?: string) => Promise<void>;
  maxDetailsLength?: number;
  allowDetails?: boolean;
}

export function ReportReasonDialog<TReason extends string>({
  open,
  onOpenChange,
  contentLabel,
  reasonOptions,
  onSubmit,
  maxDetailsLength = 500,
  allowDetails = true,
}: ReportReasonDialogProps<TReason>) {
  const fieldId = useId();
  const [reason, setReason] = useState<TReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setReason("");
    setDetails("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async () => {
    if (!reason || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(reason, details.trim() || undefined);
      onOpenChange(false);
    } catch {
      // The domain mutation owns the user-facing error and audit context.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#172126] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            Denunciar {contentLabel}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Selecione o motivo. A equipe de moderacao recebera somente os dados
            necessarios para analisar a denuncia.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={reason}
          onValueChange={(value) => {
            const selected = reasonOptions.find((option) => option.id === value);
            if (selected) setReason(selected.id);
          }}
          className="gap-2"
          aria-label="Motivo da denuncia"
        >
          {reasonOptions.map((option) => (
            <Label
              key={option.id}
              htmlFor={`${fieldId}-reason-${option.id}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium hover:border-white/20 hover:bg-white/[0.06]"
            >
              <RadioGroupItem
                id={`${fieldId}-reason-${option.id}`}
                value={option.id}
              />
              <span>{option.label}</span>
            </Label>
          ))}
        </RadioGroup>

        {allowDetails ? (
          <div className="space-y-2">
            <Label
              htmlFor={`${fieldId}-details`}
              className="text-sm text-white/80"
            >
              Detalhes adicionais (opcional)
            </Label>
            <Textarea
              id={`${fieldId}-details`}
              value={details}
              onChange={(event) =>
                setDetails(event.target.value.slice(0, maxDetailsLength))
              }
              placeholder="Descreva o contexto sem incluir dados pessoais desnecessarios."
              className="min-h-24 resize-none border-white/10 bg-black/20 text-white placeholder:text-white/35"
            />
            <p className="text-right text-xs text-white/40">
              {details.length}/{maxDetailsLength}
            </p>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enviar denuncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
