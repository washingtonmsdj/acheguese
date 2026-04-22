import React, { useMemo, useState } from "react";
import {
  MapPin,
  Plus,
  Store,
  Trees,
  ShoppingCart,
  GraduationCap,
  Church,
  Coffee,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import {
  BoardingPointService,
  type BoardingPointSummary,
} from "@/core/mobility/services";

export interface BoardingPoint {
  id: string;
  name: string;
  description: string;
  type:
    | "mercado"
    | "praca"
    | "padaria"
    | "escola"
    | "igreja"
    | "cafe"
    | "outro";
  address: string;
  distance?: string;
  popular: boolean;
  rides_count: number;
}

const typeConfig: Record<
  BoardingPoint["type"],
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  mercado: {
    icon: <ShoppingCart className="h-4 w-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Mercado",
  },
  praca: {
    icon: <Trees className="h-4 w-4" />,
    color: "text-green-400",
    bg: "bg-green-500/10",
    label: "Praca",
  },
  padaria: {
    icon: <Coffee className="h-4 w-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "Padaria",
  },
  escola: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    label: "Escola",
  },
  igreja: {
    icon: <Church className="h-4 w-4" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    label: "Igreja",
  },
  cafe: {
    icon: <Coffee className="h-4 w-4" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    label: "Cafe",
  },
  outro: {
    icon: <Store className="h-4 w-4" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    label: "Outro",
  },
};

type FilterType = "todos" | BoardingPoint["type"];

interface BoardingPointsPanelProps {
  selectable?: boolean;
  selectedId?: string;
  onSelect?: (point: BoardingPoint) => void;
}

function mapSummaryToBoardingPoint(point: BoardingPointSummary): BoardingPoint {
  return {
    id: point.id,
    name: point.name,
    description: point.description,
    type: point.type,
    address: point.address,
    popular: point.popular,
    rides_count: point.rides_count,
  };
}

export function BoardingPointsPanel({
  selectable,
  selectedId,
  onSelect,
}: BoardingPointsPanelProps) {
  const [filter, setFilter] = useState<FilterType>("todos");
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestAddress, setSuggestAddress] = useState("");

  const { data: pointsData = [] } = useQuery({
    queryKey: ["mobility", "boarding-points"],
    queryFn: () => BoardingPointService.listMostUsedPoints(20),
    staleTime: 5 * 60 * 1000,
  });

  const points = useMemo(
    () => pointsData.map(mapSummaryToBoardingPoint),
    [pointsData],
  );

  const filters: { value: FilterType; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "padaria", label: "Padarias" },
    { value: "praca", label: "Pracas" },
    { value: "mercado", label: "Mercados" },
    { value: "escola", label: "Escolas" },
    { value: "igreja", label: "Igrejas" },
  ];

  const filtered =
    filter === "todos" ? points : points.filter((point) => point.type === filter);

  const handleSuggest = async () => {
    if (!suggestName || !suggestAddress) {
      return;
    }

    const result = await BoardingPointService.submitSuggestion({
      name: suggestName,
      address: suggestAddress,
    });

    if (result.accepted) {
      toast.success("Sugestao enviada para analise.");
      setSuggestName("");
      setSuggestAddress("");
      setShowSuggestForm(false);
      return;
    }

    toast.info("Sugestoes de novos pontos estao indisponiveis no momento.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Pontos de embarque</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Locais recorrentes para facilitar o encontro com o motorista
          </p>
        </div>
        {!selectable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSuggestForm((value) => !value)}
            className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-xs h-8"
          >
            <Plus className="h-3 w-3 mr-1" /> Sugerir ponto
          </Button>
        )}
      </div>

      {showSuggestForm && (
        <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 space-y-3">
          <p className="text-xs font-semibold text-teal-400">Sugerir novo ponto</p>
          <input
            value={suggestName}
            onChange={(event) => setSuggestName(event.target.value)}
            placeholder="Nome do ponto"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-teal-500/50"
          />
          <input
            value={suggestAddress}
            onChange={(event) => setSuggestAddress(event.target.value)}
            placeholder="Endereco ou referencia"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-teal-500/50"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSuggest}
              className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl text-xs h-8 flex-1"
            >
              Enviar sugestao
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSuggestForm(false)}
              className="text-gray-400 rounded-xl text-xs h-8"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              filter === item.value
                ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((point) => {
          const config = typeConfig[point.type];
          const isSelected = selectedId === point.id;

          return (
            <div
              key={point.id}
              onClick={() => selectable && onSelect?.(point)}
              className={cn(
                "relative rounded-2xl border p-4 transition-all",
                selectable && "cursor-pointer",
                isSelected
                  ? "border-teal-500/50 bg-teal-500/10"
                  : "border-white/10 bg-[#1E2529] hover:border-white/20",
              )}
            >
              {point.popular && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 text-[0.55rem] px-1.5 h-4">
                    Popular
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    config.bg,
                  )}
                >
                  <span className={config.color}>{config.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{point.name}</p>
                    <Badge
                      className={cn(
                        "text-[0.55rem] px-1.5 h-4 border border-transparent",
                        config.bg,
                        config.color,
                      )}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{point.description}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3 text-teal-400" />
                      {point.address}
                    </span>
                    {point.distance && (
                      <span className="flex items-center gap-1 text-xs text-teal-400 font-medium">
                        <Navigation className="h-3 w-3" />
                        {point.distance}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500">
                      {point.rides_count} corridas neste ponto
                    </span>
                  </div>
                </div>

                {selectable && (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5",
                      isSelected ? "border-teal-400 bg-teal-400" : "border-white/20",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
