import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { pricingService } from "@/core/pricing/services/PricingService";
import { PricingError } from "@/core/pricing/types";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import type { PricingRule } from "@/core/pricing/types";

interface PricingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: PricingRule;
  onSuccess: () => void;
}

export function PricingRuleDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: PricingRuleDialogProps) {
  const { activeProfile, user } = useSessionContext();
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState(rule?.mode || "ride");
  const [name, setName] = useState(rule?.name || "");
  const [baseFare, setBaseFare] = useState(rule?.baseFare.toString() || "");
  const [pricePerKm, setPricePerKm] = useState(rule?.pricePerKm.toString() || "");
  const [pricePerMinute, setPricePerMinute] = useState(rule?.pricePerMinute.toString() || "");
  const [minimumFare, setMinimumFare] = useState(rule?.minimumFare.toString() || "");
  const [maximumFare, setMaximumFare] = useState(rule?.maximumFare?.toString() || "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);

  useEffect(() => {
    if (!rule) return;
    setMode(rule.mode);
    setName(rule.name);
    setBaseFare(rule.baseFare.toString());
    setPricePerKm(rule.pricePerKm.toString());
    setPricePerMinute(rule.pricePerMinute.toString());
    setMinimumFare(rule.minimumFare.toString());
    setMaximumFare(rule.maximumFare?.toString() || "");
    setIsActive(rule.isActive);
  }, [rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = activeProfile?.id ?? user?.id ?? null;
    if (!userId) {
      toast.error("Sessao administrativa indisponivel");
      return;
    }

    setLoading(true);
    try {
      const data = {
        mode: mode as PricingRule["mode"],
        name,
        baseFare: parseFloat(baseFare),
        pricePerKm: parseFloat(pricePerKm),
        pricePerMinute: parseFloat(pricePerMinute),
        minimumFare: parseFloat(minimumFare),
        maximumFare: maximumFare ? parseFloat(maximumFare) : undefined,
        isActive,
      };

      if (rule) {
        await pricingService.updateRule(rule.id, data, userId);
        toast.success("Regra atualizada com sucesso");
      } else {
        await pricingService.createRule(data, userId);
        toast.success("Regra criada com sucesso");
      }

      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      logger.error("Error saving pricing rule:", errorMessage);

      if (err instanceof PricingError && err.isConflict()) {
        toast.error("Conflito: ja existe regra ativa para este modo");
      } else if (errorMessage.includes("Conflito") || errorMessage.includes("conflito")) {
        toast.error("Ja existe uma regra ativa para esta modalidade");
      } else if (err?.code === "23514" || err?.hint?.includes("validate_single_active_rule")) {
        toast.error("Ja existe uma regra ativa para esta modalidade");
      } else {
        toast.error(errorMessage || "Erro ao salvar regra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar Regra" : "Nova Regra de Pricing"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select value={mode} onValueChange={setMode} disabled={!!rule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ride">Corrida</SelectItem>
                <SelectItem value="delivery">Entrega</SelectItem>
                <SelectItem value="mototaxi">Mototaxi</SelectItem>
                <SelectItem value="motoboy">Motoboy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome da Regra</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corrida Padrao"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tarifa Base (R$)</Label>
            <Input type="number" step="0.01" min="0" value={baseFare} onChange={(e) => setBaseFare(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Preco por Km (R$)</Label>
            <Input type="number" step="0.01" min="0" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Preco por Minuto (R$)</Label>
            <Input type="number" step="0.01" min="0" value={pricePerMinute} onChange={(e) => setPricePerMinute(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Valor Minimo (R$)</Label>
            <Input type="number" step="0.01" min="0" value={minimumFare} onChange={(e) => setMinimumFare(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Valor Maximo (R$) - Opcional</Label>
            <Input type="number" step="0.01" min="0" value={maximumFare} onChange={(e) => setMaximumFare(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Regra Ativa</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {isActive && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning">
                Apenas uma regra pode estar ativa por modalidade.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : rule ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
