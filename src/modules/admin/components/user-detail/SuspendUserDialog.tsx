import { useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
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
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

const SUSPENSION_DURATIONS = [
  { value: "1", label: "1 dia", days: 1 },
  { value: "3", label: "3 dias", days: 3 },
  { value: "7", label: "7 dias", days: 7 },
  { value: "14", label: "14 dias", days: 14 },
  { value: "30", label: "30 dias", days: 30 },
  { value: "permanent", label: "Permanente", days: 36500 },
];

export function SuspendUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: SuspendUserDialogProps) {
  const [duration, setDuration] = useState("7");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      toast.error("Por favor, informe o motivo da suspensão");
      return;
    }

    setLoading(true);
    try {
      const selectedDuration = SUSPENSION_DURATIONS.find(
        (option) => option.value === duration,
      );
      const suspendedUntil = new Date();
      suspendedUntil.setDate(
        suspendedUntil.getDate() + (selectedDuration?.days || 7),
      );

      await AdminUserService.suspendProfile(
        userId,
        normalizedReason,
        suspendedUntil,
      );

      logger.info("Usuário suspenso", {
        userId,
        duration: selectedDuration?.label,
        reason: normalizedReason,
      });
      toast.success(`${userName} foi suspenso por ${selectedDuration?.label}`);

      onSuccess();
      onOpenChange(false);
      setReason("");
      setDuration("7");
    } catch (error) {
      logger.error("Erro ao suspender usuário:", error);
      toast.error("Erro ao suspender usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" aria-hidden="true" />
            Suspender usuário
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Suspender <span className="font-semibold text-foreground">{userName}</span>{" "}
            temporariamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Duração da suspensão</Label>
            <RadioGroup value={duration} onValueChange={setDuration}>
              {SUSPENSION_DURATIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`suspension-${option.value}`} />
                  <Label
                    htmlFor={`suspension-${option.value}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspension-reason">Motivo da suspensão *</Label>
            <Textarea
              id="suspension-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Descreva o motivo da suspensão..."
              className="min-h-[100px] border-input bg-background text-foreground"
            />
          </div>

          <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div className="text-xs text-foreground/85">
              <p className="mb-1 font-semibold text-warning">Atenção</p>
              <p>
                O usuário não poderá acessar a plataforma durante o período de
                suspensão.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSuspend()}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Suspendendo..." : "Suspender usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
