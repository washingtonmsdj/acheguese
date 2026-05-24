import React from "react";
import { Award, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { FormField } from "./shared";

export interface SalaryStepProps {
  ocultarSalario: boolean;
  setOcultarSalario: (value: boolean) => void;
  salarioMin: string;
  setSalarioMin: (value: string) => void;
  salarioMax: string;
  setSalarioMax: (value: string) => void;
  salaryDisplay: string;
  urgente: boolean;
  setUrgente: (value: boolean) => void;
}

export function SalaryStep({
  ocultarSalario,
  setOcultarSalario,
  salarioMin,
  setSalarioMin,
  salarioMax,
  setSalarioMax,
  salaryDisplay,
  urgente,
  setUrgente,
}: SalaryStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">Ocultar salário</p>
          <p className="text-[10px] text-muted-foreground">Exibir como "A combinar" para candidatos</p>
        </div>
        <Switch checked={ocultarSalario} onCheckedChange={setOcultarSalario} />
      </div>

      {!ocultarSalario && (
        <div className="space-y-4">
          <FormField label="Faixa Salarial (R$)">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Mínimo"
                value={salarioMin}
                onChange={(e) => setSalarioMin(e.target.value)}
                className="h-12 text-sm rounded-xl"
                min={0}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={salarioMax}
                onChange={(e) => setSalarioMax(e.target.value)}
                className="h-12 text-sm rounded-xl"
                min={0}
              />
            </div>
          </FormField>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground px-1">
            <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Vagas com salário informado recebem até 3x mais candidaturas</span>
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground mb-1">Prévia do salário:</p>
        <p className="text-lg font-bold text-primary">{salaryDisplay}</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-warning" />
            Vaga Urgente
          </p>
          <p className="text-[10px] text-muted-foreground">Destaca com selo de urgência na listagem</p>
        </div>
        <Switch checked={urgente} onCheckedChange={setUrgente} />
      </div>

      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Destaque Premium</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Coloque sua vaga no topo dos resultados por 7 dias.
        </p>
        <Button variant="outline" size="sm" className="rounded-xl text-xs" disabled>
          Em breve
        </Button>
      </div>
    </div>
  );
}
