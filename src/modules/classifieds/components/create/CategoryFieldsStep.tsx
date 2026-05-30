/**
 * 🔧 STEP: Campos Dinâmicos por Categoria
 *
 * Renderiza campos específicos com base na categoria selecionada.
 * ✅ SSOT — importa de constants/category-fields
 */

import React from "react";
import { Settings2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getCategoryFields, hasCategoryFields } from "@/modules/classifieds/constants/category-fields";
import { getCategoryLabel } from "@/modules/classifieds/constants/categories";
import { getRecordValue } from "@/shared/utils/recordLookup";

interface CategoryFieldsStepProps {
  category: string;
  details: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function CategoryFieldsStep({ category, details, onChange }: CategoryFieldsStepProps) {
  const fields = getCategoryFields(category);

  if (!hasCategoryFields(category) || fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Esta categoria não possui campos adicionais.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-foreground">
          Detalhes de {getCategoryLabel(category)}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => {
          const fieldValue = getRecordValue(details, field.key) ?? "";

          return (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </label>

              {field.type === "select" ? (
                <Select
                  value={fieldValue}
                  onValueChange={(v) => onChange(field.key, v)}
                >
                  <SelectTrigger className="h-10 text-sm rounded-xl">
                    <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={fieldValue}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="h-10 text-sm rounded-xl"
                  />
                  {field.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {field.suffix}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
