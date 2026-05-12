import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface WarnUserDialogProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  isLoading: boolean;
  onClose: () => void;
  onWarn: (
    userId: string,
    type: "advertencia" | "suspensao_7d" | "suspensao_permanente",
    motivo: string,
  ) => Promise<boolean>;
}
type WarnType = "advertencia" | "suspensao_7d" | "suspensao_permanente";

export function WarnUserDialog({
  isOpen,
  userId,
  userName,
  isLoading,
  onClose,
  onWarn,
}: WarnUserDialogProps) {
  const [warnType, setWarnType] = useState<WarnType>("advertencia");
  const [motivo, setMotivo] = useState("");

  const handleWarn = async () => {
    if (!motivo.trim()) return;

    const success = await onWarn(userId, warnType, motivo);
    if (success) {
      setMotivo("");
      setWarnType("advertencia");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Advertir Usuário
          </DialogTitle>
          <DialogDescription>
            Aplicar advertência ou suspensão para {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Tipo de ação
            </p>
            <Select
              value={warnType}
              onValueChange={(v: WarnType) => setWarnType(v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advertencia">⚠️ Advertência</SelectItem>
                <SelectItem value="suspensao_7d">
                  🚫 Suspensão (7 dias)
                </SelectItem>
                <SelectItem value="suspensao_permanente">
                  ❌ Suspensão Permanente
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Motivo
            </p>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da ação..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant={warnType === "advertencia" ? "default" : "destructive"}
              className="flex-1 gap-1.5"
              onClick={handleWarn}
              disabled={!motivo.trim() || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
