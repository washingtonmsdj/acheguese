import { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { toast } from "sonner";

const REPORT_REASONS = [
  { id: "spam", label: "Spam ou golpe" },
  { id: "fake", label: "Anúncio falso" },
  { id: "inappropriate", label: "Conteúdo impróprio" },
  { id: "duplicate", label: "Anúncio duplicado" },
  { id: "wrong_category", label: "Categoria errada" },
  { id: "other", label: "Outro motivo" },
];

export function ReportButton() {
  const [open, setOpen] = useState(false);

  const handleReport = (reason: string) => {
    toast.success("Denúncia enviada. Vamos analisar o anúncio.");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] text-muted-foreground gap-1.5"
        >
          <Flag className="h-3 w-3" />
          Denunciar anúncio
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Denunciar anúncio
          </SheetTitle>
        </SheetHeader>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Selecione o motivo da denúncia. Sua identidade será mantida em sigilo.
        </p>
        <div className="space-y-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => handleReport(reason.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <Flag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">{reason.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
