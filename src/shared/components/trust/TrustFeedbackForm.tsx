import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

export interface TrustFeedbackTarget {
  id: string;
  label: string;
  subjectRole: string;
  helper?: string;
}

export interface TrustFeedbackReason {
  value: string;
  label: string;
  severity: string;
}

export interface TrustFeedbackSubmission {
  subjectProfileId: string;
  rating: number;
  reasonCode: string;
  description: string | null;
}

interface TrustFeedbackFormProps {
  title?: string;
  notice?: string;
  unavailableMessage?: string;
  targets: TrustFeedbackTarget[];
  reasons: TrustFeedbackReason[];
  enabled: boolean;
  onSubmit: (input: TrustFeedbackSubmission) => Promise<unknown>;
  defaultTargetId?: string | null;
  compact?: boolean;
}

export function TrustFeedbackForm({
  title = "Confianca operacional",
  notice = "Avaliacao privada. Nao aparece publicamente como review; alimenta o painel admin para detectar reincidencia, abusos, avisos e penalidades.",
  unavailableMessage = "Feedback operacional ainda nao disponivel para este contexto.",
  targets,
  reasons,
  enabled,
  onSubmit,
  defaultTargetId,
  compact = false,
}: TrustFeedbackFormProps) {
  const firstTargetId = defaultTargetId ?? targets[0]?.id ?? "";
  const [targetProfileId, setTargetProfileId] = useState(firstTargetId);
  const [rating, setRating] = useState("5");
  const [reasonCode, setReasonCode] = useState(reasons[0]?.value ?? "");
  const [description, setDescription] = useState("");

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === targetProfileId) ?? targets[0],
    [targetProfileId, targets],
  );
  const selectedReason = reasons.find((reason) => reason.value === reasonCode);

  const canSend =
    enabled &&
    Boolean(selectedTarget?.id) &&
    Boolean(selectedReason) &&
    Number(rating) >= 1 &&
    Number(rating) <= 5;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedTarget || !selectedReason) {
        throw new Error("Alvo e motivo sao obrigatorios.");
      }

      return onSubmit({
        subjectProfileId: selectedTarget.id,
        rating: Number(rating),
        reasonCode,
        description: description.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Feedback operacional registrado para analise de confianca.");
      setDescription("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar feedback: ${error.message}`);
    },
  });

  const content = !enabled ? (
    <p className="text-sm text-muted-foreground">{unavailableMessage}</p>
  ) : targets.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      Nenhum participante vinculavel ao SSOT de confianca neste contexto.
    </p>
  ) : (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Participante avaliado</Label>
        <Select value={targetProfileId} onValueChange={setTargetProfileId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o participante" />
          </SelectTrigger>
          <SelectContent>
            {targets.map((target) => (
              <SelectItem key={target.id} value={target.id}>
                {target.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTarget?.helper && (
          <p className="text-xs text-muted-foreground">{selectedTarget.helper}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nota operacional</Label>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger>
            <SelectValue placeholder="Nota" />
          </SelectTrigger>
          <SelectContent>
            {[5, 4, 3, 2, 1].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} estrela{value > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Motivo estruturado</Label>
        <Select value={reasonCode} onValueChange={setReasonCode}>
          <SelectTrigger>
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Observacao para auditoria</Label>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descreva o ocorrido de forma objetiva..."
          disabled={mutation.isPending}
        />
      </div>

      <div className="md:col-span-2">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!canSend || mutation.isPending}
          className="w-full sm:w-auto"
        >
          <Star className="mr-2 h-4 w-4" />
          Registrar feedback privado
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={compact ? "border-border" : "border-amber-200 bg-amber-50/40"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-amber-700" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <div className="rounded-lg border border-amber-200 bg-background p-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>{notice}</p>
            </div>
          </div>
        )}
        {content}
      </CardContent>
    </Card>
  );
}
