import React from "react";
import { ShieldCheck, Users, BadgeCheck, Home } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type TrustPreference = "qualquer" | "verificado" | "vizinho";

interface TrustRideFilterProps {
  value: TrustPreference;
  onChange: (v: TrustPreference) => void;
}

const options: {
  value: TrustPreference;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    value: "qualquer",
    label: "Qualquer motorista",
    desc: "Mais rápido, maior disponibilidade",
    icon: <Users className="h-4 w-4" />,
    color: "text-gray-300",
    border: "border-white/20",
    bg: "bg-white/5",
  },
  {
    value: "verificado",
    label: "Apenas verificados ✔",
    desc: "CNH e veículo confirmados",
    icon: <BadgeCheck className="h-4 w-4" />,
    color: "text-teal-400",
    border: "border-teal-400/40",
    bg: "bg-teal-400/10",
  },
  {
    value: "vizinho",
    label: "Só vizinhos 🏘️",
    desc: "Motoristas do mesmo bairro",
    icon: <Home className="h-4 w-4" />,
    color: "text-blue-400",
    border: "border-blue-400/40",
    bg: "bg-blue-400/10",
  },
];

export function TrustRideFilter({ value, onChange }: TrustRideFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
        <span className="text-xs text-gray-400 font-medium">
          Corrida de Confiança
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full",
              value === opt.value
                ? cn(opt.bg, opt.border, opt.color)
                : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-400",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                value === opt.value ? opt.bg : "bg-white/5",
              )}
            >
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[0.6rem] opacity-70 mt-0.5">{opt.desc}</p>
            </div>
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                value === opt.value
                  ? "border-current bg-current/30"
                  : "border-white/20",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
