/**
 * OpeningHoursSection
 * 
 * Seção de horários de funcionamento.
 * Inclui: editor de horários para 7 dias da semana com atalhos rápidos.
 */

import { Clock } from "lucide-react";
import { OpeningHoursEditor } from "../OpeningHoursEditor";

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

interface OpeningHoursSectionProps {
  data: OpeningHours;
  onChange: (data: OpeningHours) => void;
  className?: string;
}

export function OpeningHoursSection({
  data,
  onChange,
  className,
}: OpeningHoursSectionProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Horários de Funcionamento
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os horários de atendimento da sua empresa
        </p>
      </div>

      {/* Opening Hours Editor */}
      <OpeningHoursEditor
        hours={data}
        onChange={onChange}
      />

      {/* Info */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-600 mb-2">
          💡 Dicas para horários
        </h4>
        <ul className="text-xs text-blue-600/80 space-y-1.5">
          <li>• Use os atalhos rápidos para configurar horários comuns</li>
          <li>• Marque como "Fechado" os dias que não funciona</li>
          <li>• Você pode copiar o horário de um dia para todos os outros</li>
          <li>• Os horários são exibidos na página pública da empresa</li>
        </ul>
      </div>
    </div>
  );
}
