/**
 * OpeningHoursEditor
 * 
 * Editor visual de horários de funcionamento.
 * Suporta copiar para todos os dias, dias fechados e validação.
 */

import { useState } from "react";
import { Clock, Copy, X, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

interface DaySchedule {
  open?: string;
  close?: string;
  closed?: boolean;
}

interface OpeningHours {
  segunda?: DaySchedule;
  terca?: DaySchedule;
  quarta?: DaySchedule;
  quinta?: DaySchedule;
  sexta?: DaySchedule;
  sabado?: DaySchedule;
  domingo?: DaySchedule;
}

interface OpeningHoursEditorProps {
  hours: OpeningHours;
  onChange: (hours: OpeningHours) => void;
  className?: string;
}

const DAYS = [
  { key: "segunda", label: "Segunda-feira", short: "Seg" },
  { key: "terca", label: "Terça-feira", short: "Ter" },
  { key: "quarta", label: "Quarta-feira", short: "Qua" },
  { key: "quinta", label: "Quinta-feira", short: "Qui" },
  { key: "sexta", label: "Sexta-feira", short: "Sex" },
  { key: "sabado", label: "Sábado", short: "Sáb" },
  { key: "domingo", label: "Domingo", short: "Dom" },
];

export function OpeningHoursEditor({
  hours,
  onChange,
  className,
}: OpeningHoursEditorProps) {
  const [copyFromDay, setCopyFromDay] = useState<string | null>(null);

  const handleDayChange = (
    day: string,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day as keyof OpeningHours],
        [field]: value,
      },
    };
    onChange(newHours);
  };

  const handleCopyToAll = (sourceDay: string) => {
    const sourceSchedule = hours[sourceDay as keyof OpeningHours];
    if (!sourceSchedule) return;

    const newHours = { ...hours };
    DAYS.forEach((day) => {
      newHours[day.key as keyof OpeningHours] = { ...sourceSchedule };
    });

    onChange(newHours);
    toast.success(`Horário de ${DAYS.find(d => d.key === sourceDay)?.label} copiado para todos os dias`);
    setCopyFromDay(null);
  };

  const handleToggleClosed = (day: string, closed: boolean) => {
    handleDayChange(day, "closed", closed);
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const isValidSchedule = (schedule: DaySchedule): boolean => {
    if (schedule.closed) return true;
    if (!schedule.open || !schedule.close) return false;
    return validateTime(schedule.open) && validateTime(schedule.close);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Horário de Funcionamento
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure os horários de abertura e fechamento para cada dia
          </p>
        </div>
      </div>

      {/* Days list */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const schedule = hours[day.key as keyof OpeningHours] || {};
          const isClosed = schedule.closed || false;
          const isValid = isValidSchedule(schedule);

          return (
            <div
              key={day.key}
              className={cn(
                "rounded-xl border bg-card p-4 transition-all",
                isClosed ? "border-border bg-secondary/30" : "border-border"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Day name */}
                <div className="w-32 shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {day.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{day.short}</p>
                </div>

                {/* Closed toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={!isClosed}
                    onCheckedChange={(checked) =>
                      handleToggleClosed(day.key, !checked)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {isClosed ? "Fechado" : "Aberto"}
                  </span>
                </div>

                {/* Time inputs */}
                {!isClosed && (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={schedule.open || ""}
                        onChange={(e) =>
                          handleDayChange(day.key, "open", e.target.value)
                        }
                        className="h-9"
                        placeholder="09:00"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">até</span>
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={schedule.close || ""}
                        onChange={(e) =>
                          handleDayChange(day.key, "close", e.target.value)
                        }
                        className="h-9"
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isClosed && isValid && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToAll(day.key)}
                      title="Copiar para todos os dias"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Status indicator */}
                  {!isClosed && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      {isValid ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const weekdaySchedule = { open: "09:00", close: "18:00", closed: false };
            const newHours = { ...hours };
            ["segunda", "terca", "quarta", "quinta", "sexta"].forEach((day) => {
              newHours[day as keyof OpeningHours] = weekdaySchedule;
            });
            onChange(newHours);
            toast.success("Horário comercial aplicado (Seg-Sex 9h-18h)");
          }}
        >
          Horário Comercial (9h-18h)
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const allDaySchedule = { open: "00:00", close: "23:59", closed: false };
            const newHours = { ...hours };
            DAYS.forEach((day) => {
              newHours[day.key as keyof OpeningHours] = allDaySchedule;
            });
            onChange(newHours);
            toast.success("Aberto 24h aplicado para todos os dias");
          }}
        >
          24 Horas (Todos os dias)
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const newHours = { ...hours };
            ["sabado", "domingo"].forEach((day) => {
              newHours[day as keyof OpeningHours] = { closed: true };
            });
            onChange(newHours);
            toast.success("Finais de semana marcados como fechado");
          }}
        >
          Fechar Finais de Semana
        </Button>
      </div>

      {/* Help text */}
      <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">💡 Dicas:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Use o botão <Copy className="h-3 w-3 inline-block" /> para copiar o horário de um dia para todos</li>
          <li>Desative o switch para marcar um dia como fechado</li>
          <li>Use os atalhos rápidos para configurações comuns</li>
        </ul>
      </div>
    </div>
  );
}
