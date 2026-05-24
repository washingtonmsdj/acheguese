/**
 * 🔧 STEP: Seletor de Tipo de Preço + Input
 *
 * ✅ SSOT — importa de constants/price-types
 */

import React from "react";
import { DollarSign } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { PRICE_TYPES } from "@/modules/classifieds/constants/price-types";

interface PriceStepProps {
  priceType: string;
  onPriceTypeChange: (type: string) => void;
  price: string;
  onPriceChange: (price: string) => void;
  error?: string;
}

export function PriceStep({
  priceType,
  onPriceTypeChange,
  price,
  onPriceChange,
  error,
}: PriceStepProps) {
  const selectedType = PRICE_TYPES.find((p) => p.id === priceType);

  return (
    <div className="space-y-4">
      {/* Price Type Selector */}
      <div className="grid grid-cols-2 gap-2">
        {PRICE_TYPES.map((pt) => {
          const PriceTypeIcon = pt.icon;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => {
                onPriceTypeChange(pt.id);
                if (!pt.showInput) onPriceChange("0");
              }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                priceType === pt.id
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-card border-border text-foreground hover:border-primary/30"
              )}
            >
              <PriceTypeIcon className="h-4 w-4 shrink-0" />
              <div>
                <span className="text-xs font-semibold block">{pt.label}</span>
                <span className="text-[10px] text-muted-foreground">{pt.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Price Input */}
      {selectedType?.showInput && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-primary" />
            Valor (R$)
          </label>
          <Input
            type="number"
            placeholder="0,00"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            min={0}
            step="0.01"
            className={cn(
              "h-12 text-lg font-semibold rounded-xl",
              error && "border-destructive"
            )}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
