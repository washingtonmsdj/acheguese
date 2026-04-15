import React, { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Car,
  Volume2,
  Moon,
  Globe,
} from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  defaultValue: boolean;
}

const settings: SettingItem[] = [
  {
    id: "notifications",
    icon: Bell,
    label: "Notificações de pedidos",
    description: "Receba alertas quando novos pedidos surgirem",
    color: "text-teal-400",
    defaultValue: true,
  },
  {
    id: "sound",
    icon: Volume2,
    label: "Som de novos pedidos",
    description: "Toque sonoro ao receber pedido",
    color: "text-cyan-400",
    defaultValue: true,
  },
  {
    id: "entregas",
    icon: Car,
    label: "Aceitar entregas",
    description: "Receber pedidos de entrega além de viagens",
    color: "text-amber-400",
    defaultValue: true,
  },
  {
    id: "night_mode",
    icon: Moon,
    label: "Modo noturno automático",
    description: "Ajustar interface em horários noturnos",
    color: "text-purple-400",
    defaultValue: false,
  },
  {
    id: "safe_mode",
    icon: Shield,
    label: "Modo seguro",
    description: "Confirmar identidade do passageiro",
    color: "text-red-400",
    defaultValue: false,
  },
];

export function DriverSettingsPanel() {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.id, s.defaultValue])),
  );

  const toggle = (id: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(
        `${next[id] ? "Ativado" : "Desativado"}: ${settings.find((s) => s.id === id)?.label}`,
      );
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#1E2529] overflow-hidden">
      <div className="flex items-center gap-2 p-2 border-b border-white/5">
        <Settings className="h-3 w-3 text-teal-400" />
        <h3 className="text-xs font-bold text-white">Configurações</h3>
      </div>
      <div className="divide-y divide-white/5">
        {settings.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-2 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center bg-white/5",
                )}
              >
                <s.icon className={cn("h-2.5 w-2.5", s.color)} />
              </div>
              <div>
                <p className="text-[0.6rem] font-semibold text-white">
                  {s.label}
                </p>
                <p className="text-[0.5rem] text-gray-500 leading-tight">
                  {s.description}
                </p>
              </div>
            </div>
            <Switch
              checked={values[s.id]}
              onCheckedChange={() => toggle(s.id)}
              className="data-[state=checked]:bg-teal-500 scale-70"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
