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
 * Modal de denÃºncia de posts e comentÃ¡rios
 *
 * Requirement 12: Sistema de ModeraÃ§Ã£o
 *
 * Funcionalidades:
 * - FormulÃ¡rio de denÃºncia com categorys
 * - Categorias: spam, propaganda, conteÃºdo_ofensivo, links_maliciosos
 * - Campo opcional de descriÃ§Ã£o
 * - ValidaÃ§Ã£o de campos obrigatÃ³rios
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
    description: "ConteÃºdo repetitivo ou nÃ£o solicitado",
  },
  {
    value: "propaganda",
    label: "Propaganda",
    description: "Publicity nÃ£o autorizada ou excessiva",
  },
  {
    value: "conteudo_ofensivo",
    label: "ConteÃºdo Ofensivo",
    description: "Linguagem ofensiva, assÃ©dio ou discriminaÃ§Ã£o",
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

  const contentTypeLabel = contentType === "post" ? "post" : "comentÃ¡rio";

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
            Selecione o motivo da denÃºncia. Nossa equipe de moderaÃ§Ã£o irÃ¡
            revisar o conteÃºdo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Categorias de denÃºncia */}
          <div className="space-y-3">
            <Label>Motivo da denÃºncia *</Label>
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

          {/* DescriÃ§Ã£o adicional (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
            <Textarea
              id="description"
              placeholder="ForneÃ§a mais informaÃ§Ãµes sobre o problema..."
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
            {isSubmitting ? "Enviando..." : "Enviar DenÃºncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

