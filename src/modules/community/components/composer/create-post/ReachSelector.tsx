import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Home, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";

interface ReachSelectorProps {
  selectedReach: "street" | "neighborhood" | "city";
  onReachChange: (reach: "street" | "neighborhood" | "city") => void;
  canPostToCity: boolean;
  userLevel: string;
}

const REACH_OPTIONS = [
  {
    value: "street" as const,
    label: "RUA",
    icon: Home,
    color: "#FBBF24",
    borderColor: "yellow-400",
    description: "🏠 Somente vizinhos da sua rua",
  },
  {
    value: "neighborhood" as const,
    label: "BAIRRO",
    icon: MapPin,
    color: "#4FD1C5",
    borderColor: "teal-400",
    description: "📍 Moradores do seu bairro",
  },
  {
    value: "city" as const,
    label: "CIDADE",
    icon: Building2,
    color: "#60A5FA",
    borderColor: "blue-400",
    description: "🏙️ Toda a cidade",
  },
];

export function ReachSelector({
  selectedReach,
  onReachChange,
  canPostToCity,
  userLevel,
}: ReachSelectorProps) {
  const handleCityClick = () => {
    if (!canPostToCity) {
      toast.error(
        "Apenas usuários nível Ouro ou verificados podem postar para toda a cidade",
      );
      return;
    }
    onReachChange("city");
  };

  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold" style={{ color: "#FFFFFF" }}>
        Quem deve ver isso?
      </Label>
      <div className="grid grid-cols-3 gap-1">
        {REACH_OPTIONS.map(
          ({ value, label, icon: Icon, color, borderColor }) => (
            <Button
              key={value}
              type="button"
              onClick={() =>
                value === "city" ? handleCityClick() : onReachChange(value)
              }
              disabled={value === "city" && !canPostToCity}
              className={`rounded-lg h-8 font-bold text-[9px] transition-all border flex flex-col items-center justify-center gap-0 ${
                selectedReach === value
                  ? `border-${borderColor} bg-${borderColor}/10`
                  : `border-${borderColor}/30 bg-transparent`
              } ${value === "city" && !canPostToCity ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ color }}
            >
              <Icon className="h-2.5 w-2.5" />
              <span className="mt-0.5">{label}</span>
            </Button>
          ),
        )}
      </div>
      <p className="text-[8px] mt-0.5" style={{ color: "#9CA3AF" }}>
        {REACH_OPTIONS.find((opt) => opt.value === selectedReach)?.description}
      </p>
      {!canPostToCity && (
        <p
          className="text-[8px] mt-1 p-1.5 rounded"
          style={{
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            color: "#FBBF24",
          }}
        >
          🔒 Nível {userLevel.toUpperCase()}: Posts para cidade requerem nível
          Ouro (100+ reputação) ou verificação
        </p>
      )}
    </div>
  );
}
