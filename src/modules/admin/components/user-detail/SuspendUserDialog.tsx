import { useState } from "react";
import { Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";

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
  { value: "permanent", label: "Permanente", days: 36500 }, // 100 anos
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
    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo da suspensão");
      return;
    }

    setLoading(true);
    try {
      const selectedDuration = SUSPENSION_DURATIONS.find(
        (d) => d.value === duration,
      );
      const suspendedUntil = new Date();
      suspendedUntil.setDate(
        suspendedUntil.getDate() + (selectedDuration?.days || 7),
      );

      await profileService.updateProfile(userId, {
        suspended: true,
        suspended_until: suspendedUntil.toISOString(),
      });

      logger.info("Usuário suspenso", {
        userId,
        duration: selectedDuration?.label,
        reason,
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
      <DialogContent className="bg-[#1E2529] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            Suspender Usuário
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Suspender{" "}
            <span className="text-white font-semibold">{userName}</span>{" "}
            temporariamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duração */}
          <div className="space-y-3">
            <Label>Duração da Suspensão</Label>
            <RadioGroup value={duration} onValueChange={setDuration}>
              {SUSPENSION_DURATIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Suspensão *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da suspensão..."
              className="bg-[#0A0F14] border-white/10 text-white min-h-[100px]"
            />
          </div>

          {/* Aviso */}
          <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200">
              <p className="font-semibold mb-1">Atenção:</p>
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
            className="border-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSuspend}
            disabled={loading || !reason.trim()}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading ? "Suspendendo..." : "Suspender Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
