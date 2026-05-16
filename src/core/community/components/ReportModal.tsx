import React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { ReportReason } from "@/core/community/types";
import { AlertTriangle } from "lucide-react";
/**
 * Modal de denúncia de posts e comentários
 *
 * Requirement 12: Sistema de Moderação
 *
 * Funcionalidades:
 * - Formulário de denúncia com categorys
 * - Categorias: spam, propaganda, conteúdo_ofensivo, links_maliciosos
 * - Campo opcional de descrição
 * - Validação de campos obrigatórios
 */

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: ReportReason, description?: string) => void;
  isSubmitting?: boolean;
  contentType?: "post" | "comment";
}

const REPORT_CATEGORIES: {
  value: ReportReason;
  label: string;
  description: string;
}[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Conteúdo repetitivo ou não solicitado",
  },
  {
    value: "propaganda",
    label: "Propaganda",
    description: "Publicity não autorizada ou excessiva",
  },
  {
    value: "conteudo_ofensivo",
    label: "Conteúdo Ofensivo",
    description: "Linguagem ofensiva, assédio ou discriminação",
  },
  {
    value: "links_maliciosos",
    label: "Links Maliciosos",
    description: "Links suspeitos ou potencialmente perigosos",
  },
];

export function ReportModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  contentType = "post",
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!selectedReason) return;

    onSubmit(selectedReason as ReportReason, description.trim() || undefined);

    // Reset form
    setSelectedReason("");
    setDescription("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setDescription("");
    onOpenChange(false);
  };

  const contentTypeLabel = contentType === "post" ? "post" : "comentário";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-[28px] shadow-2xl sm:max-w-[500px]"
        style={{ backgroundColor: "#252D32" }}
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Denunciar {contentTypeLabel}</DialogTitle>
          </div>
          <DialogDescription id="dialog-description">
            Selecione o motivo da denúncia. Nossa equipe de moderação irá
            revisar o conteúdo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Categorias de denúncia */}
          <div className="space-y-3">
            <Label>Motivo da denúncia *</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) =>
                setSelectedReason(value as ReportReason)
              }
            >
              {REPORT_CATEGORIES.map((category) => (
                <div
                  key={category.value}
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent"
                >
                  <RadioGroupItem value={category.value} id={category.value} />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={category.value}
                      className="font-medium cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Descrição adicional (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Forneça mais informações sobre o problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

