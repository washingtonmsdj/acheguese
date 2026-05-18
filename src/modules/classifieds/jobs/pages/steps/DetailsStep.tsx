import React from "react";
import { Award, GraduationCap, Plus, Tag, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { EditableBulletList, EditableChipList } from "./shared";

export interface DetailsStepProps {
  tagInput: string;
  setTagInput: (value: string) => void;
  tags: string[];
  addTag: () => void;
  removeTag: (index: number) => void;
  reqInput: string;
  setReqInput: (value: string) => void;
  requisitos: string[];
  addRequisito: () => void;
  removeRequisito: (index: number) => void;
  beneficios: string[];
  toggleBenefit: (value: string) => void;
  benInput: string;
  setBenInput: (value: string) => void;
  addBeneficio: () => void;
  removeBeneficioByValue: (value: string) => void;
  suggestedBenefits: string[];
}

export function DetailsStep({
  tagInput,
  setTagInput,
  tags,
  addTag,
  removeTag,
  reqInput,
  setReqInput,
  requisitos,
  addRequisito,
  removeRequisito,
  beneficios,
  toggleBenefit,
  benInput,
  setBenInput,
  addBeneficio,
  removeBeneficioByValue,
  suggestedBenefits,
}: DetailsStepProps) {
  return (
    <div className="space-y-6">
      <EditableChipList
        label="Habilidades / Tags"
        icon={<Tag className="h-4 w-4 text-primary" />}
        inputValue={tagInput}
        items={tags}
        placeholder="Ex: React, Excel, Atendimento..."
        onInputChange={setTagInput}
        onAdd={addTag}
        onRemove={removeTag}
        chipClassName="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1"
      />

      <EditableBulletList
        label="Requisitos"
        icon={<GraduationCap className="h-4 w-4 text-accent" />}
        inputValue={reqInput}
        items={requisitos}
        placeholder="Ex: 3+ anos de experiência, CNH B..."
        onInputChange={setReqInput}
        onAdd={addRequisito}
        onRemove={removeRequisito}
      />

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Award className="h-4 w-4 text-success" />
          Benefícios
        </label>

        <div className="flex flex-wrap gap-1.5">
          {suggestedBenefits.map((b) => (
            <button
              key={b}
              onClick={() => toggleBenefit(b)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all",
                beneficios.includes(b)
                  ? "bg-success/15 border-success/40 text-success"
                  : "bg-card border-border text-muted-foreground hover:border-success/30",
              )}
            >
              {beneficios.includes(b) ? "✓ " : ""}
              {b}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Outro benefício..."
            value={benInput}
            onChange={(e) => setBenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBeneficio())}
            className="h-11 text-sm rounded-xl flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={addBeneficio} className="rounded-xl h-11 px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {beneficios.filter((b) => !suggestedBenefits.includes(b)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {beneficios
              .filter((b) => !suggestedBenefits.includes(b))
              .map((b, i) => (
                <span key={i} className="text-xs bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  {b}
                  <button onClick={() => removeBeneficioByValue(b)} aria-label={`Remover ${b}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
