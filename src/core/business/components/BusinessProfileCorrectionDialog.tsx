import { useEffect, useState } from "react";

import {
  BUSINESS_PROFILE_CORRECTION_FIELDS,
  BusinessProfileCorrectionService,
  type BusinessProfileCorrectionField,
} from "@/core/business/services/BusinessProfileCorrectionService";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";

interface BusinessProfileCorrectionDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessProfileCorrectionDialog({
  businessId,
  open,
  onOpenChange,
}: BusinessProfileCorrectionDialogProps) {
  const { toast } = useToast();
  const [fieldCode, setFieldCode] =
    useState<BusinessProfileCorrectionField>("name");
  const [proposedValue, setProposedValue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFieldCode("name");
      setProposedValue("");
      setSourceUrl("");
      setExplanation("");
      setSubmitting(false);
    }
  }, [open]);

  const submit = async () => {
    if (!proposedValue.trim()) {
      toast({
        title: "Informe o dado correto",
        description: "Descreva qual valor deve substituir a informacao atual.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await BusinessProfileCorrectionService.suggest({
        businessId,
        fieldCode,
        proposedValue,
        sourceUrl,
        explanation,
      });
      toast({
        title: "Sugestao enviada",
        description:
          "A correcao entrou na fila de qualidade de dados para verificacao.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Nao foi possivel enviar",
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sugerir correcao de dados</DialogTitle>
          <DialogDescription>
            Use este fluxo para dados factuais incorretos. Denuncias de fraude,
            seguranca ou abuso continuam no fluxo de denuncia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="correction-field">Qual dado esta incorreto?</Label>
            <Select
              value={fieldCode}
              onValueChange={(value) =>
                setFieldCode(value as BusinessProfileCorrectionField)
              }
            >
              <SelectTrigger id="correction-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_PROFILE_CORRECTION_FIELDS.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correction-value">Valor correto</Label>
            <Textarea
              id="correction-value"
              value={proposedValue}
              onChange={(event) => setProposedValue(event.target.value)}
              maxLength={1200}
              placeholder="Informe somente o que deve constar no perfil."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correction-source">Fonte publica (opcional)</Label>
            <Input
              id="correction-source"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              maxLength={1200}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correction-explanation">
              Explicacao (opcional)
            </Label>
            <Textarea
              id="correction-explanation"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              maxLength={1000}
              placeholder="Explique como a informacao pode ser verificada."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar sugestao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
