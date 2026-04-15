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
  { id: "spam", label: "Spam ou golpe", emoji: "🚫" },
  { id: "fake", label: "Anúncio falso", emoji: "❌" },
  { id: "inappropriate", label: "Conteúdo impróprio", emoji: "⚠️" },
  { id: "duplicate", label: "Anúncio duplicado", emoji: "📋" },
  { id: "wrong_category", label: "Categoria errada", emoji: "🔄" },
  { id: "other", label: "Outro motivo", emoji: "💬" },
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
              <span className="text-lg">{reason.emoji}</span>
              <span className="text-sm font-medium">{reason.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
