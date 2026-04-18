/**
 * PaymentMethodsSelector
 * 
 * Seletor de formas de pagamento com opções predefinidas e customizáveis.
 * Usa SSOT de @/core/business/constants
 */

import { useState } from "react";
import { CreditCard, Plus, X, Wallet } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { PAYMENT_METHODS } from "@/core/business/constants";

interface PaymentMethodsSelectorProps {
  selected: string[];
  onChange: (methods: string[]) => void;
  allowCustom?: boolean;
  className?: string;
}

export function PaymentMethodsSelector({
  selected,
  onChange,
  allowCustom = true,
  className,
}: PaymentMethodsSelectorProps) {
  const [customMethod, setCustomMethod] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggle = (methodId: string) => {
    const newSelected = selected.includes(methodId)
      ? selected.filter((m) => m !== methodId)
      : [...selected, methodId];
    onChange(newSelected);
  };

  const handleAddCustom = () => {
    if (!customMethod.trim()) {
      toast.error("Digite o nome da forma de pagamento");
      return;
    }

    if (selected.includes(customMethod)) {
      toast.error("Esta forma de pagamento já foi adicionada");
      return;
    }

    onChange([...selected, customMethod.trim()]);
    setCustomMethod("");
    setShowCustomInput(false);
    toast.success("Forma de pagamento adicionada");
  };

  const handleRemoveCustom = (method: string) => {
    onChange(selected.filter((m) => m !== method));
    toast.success("Forma de pagamento removida");
  };

  const customMethods = selected.filter(
    (method) => !PAYMENT_METHODS.some((p) => p.id === method)
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Formas de Pagamento
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecione as formas de pagamento aceitas pela empresa
        </p>
      </div>

      {/* Predefined methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected.includes(method.id);

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleToggle(method.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "rounded-lg p-2",
                  isSelected ? "bg-primary/10" : "bg-secondary"
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : method.color)} />
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {method.label}
                </p>
              </div>

              <Checkbox checked={isSelected} />
            </button>
          );
        })}
      </div>

      {/* Custom methods */}
      {customMethods.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Formas Personalizadas
          </p>
          <div className="flex flex-wrap gap-2">
            {customMethods.map((method) => (
              <div
                key={method}
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg border border-border"
              >
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{method}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(method)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom method */}
      {allowCustom && (
        <div className="pt-3 border-t border-border">
          {showCustomInput ? (
            <div className="flex gap-2">
              <Input
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                placeholder="Ex: Cheque, Boleto, etc"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                autoFocus
              />
              <Button onClick={handleAddCustom} size="sm">
                Adicionar
              </Button>
              <Button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomMethod("");
                }}
                size="sm"
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowCustomInput(true)}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Forma Personalizada
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {selected.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">
            {selected.length} {selected.length === 1 ? "forma" : "formas"}
          </span>{" "}
          de pagamento selecionada{selected.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
