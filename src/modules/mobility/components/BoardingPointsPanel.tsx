import type { KeyboardEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Church,
  Coffee,
  GraduationCap,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  ShoppingCart,
  Store,
  Trees,
} from "lucide-react";
import { TIMEOUTS } from "@/core/mobility/constants";
import {
  BoardingPointService,
  type BoardingPointSummary,
} from "@/core/mobility/services";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

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
  rides_count: number;
}

const typeConfig: Record<
  BoardingPoint["type"],
  { icon: ReactNode; color: string; bg: string; label: string }
> = {
  mercado: {
    icon: <ShoppingCart className="h-4 w-4" aria-hidden="true" />,
    color: "text-category-business",
    bg: "bg-category-business/12",
    label: "Mercado",
  },
  praca: {
    icon: <Trees className="h-4 w-4" aria-hidden="true" />,
    color: "text-category-civic",
    bg: "bg-category-civic/12",
    label: "Praça",
  },
  padaria: {
    icon: <Coffee className="h-4 w-4" aria-hidden="true" />,
    color: "text-category-gastronomy",
    bg: "bg-category-gastronomy/12",
    label: "Padaria",
  },
  escola: {
    icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
    color: "text-info",
    bg: "bg-info/10",
    label: "Escola",
  },
  igreja: {
    icon: <Church className="h-4 w-4" aria-hidden="true" />,
    color: "text-category-discussion",
    bg: "bg-category-discussion/12",
    label: "Igreja",
  },
  cafe: {
    icon: <Coffee className="h-4 w-4" aria-hidden="true" />,
    color: "text-category-gastronomy",
    bg: "bg-category-gastronomy/12",
    label: "Café",
  },
  outro: {
    icon: <Store className="h-4 w-4" aria-hidden="true" />,
    color: "text-primary",
    bg: "bg-primary/10",
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
    rides_count: point.rides_count,
  };
}

export function BoardingPointsPanel({
  selectable = false,
  selectedId,
  onSelect,
}: BoardingPointsPanelProps) {
  const [filter, setFilter] = useState<FilterType>("todos");
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestAddress, setSuggestAddress] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  const pointsQuery = useQuery({
    queryKey: ["mobility", "boarding-points"],
    queryFn: () => BoardingPointService.listRecentFrequentPoints(20),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  const points = useMemo(
    () => (pointsQuery.data ?? []).map(mapSummaryToBoardingPoint),
    [pointsQuery.data],
  );

  const filters: { value: FilterType; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "padaria", label: "Padarias" },
    { value: "praca", label: "Praças" },
    { value: "mercado", label: "Mercados" },
    { value: "escola", label: "Escolas" },
    { value: "igreja", label: "Igrejas" },
  ];

  const filtered =
    filter === "todos" ? points : points.filter((point) => point.type === filter);

  const handleSuggest = async () => {
    const name = suggestName.trim();
    const address = suggestAddress.trim();
    if (!name || !address || submittingSuggestion) return;

    setSubmittingSuggestion(true);
    try {
      const result = await BoardingPointService.submitSuggestion({ name, address });

      if (!result.accepted) {
        toast.info("Sugestões de novos pontos estão indisponíveis no momento.");
        return;
      }

      toast.success("Sugestão enviada para análise.");
      setSuggestName("");
      setSuggestAddress("");
      setShowSuggestForm(false);
    } catch {
      toast.error("Não foi possível enviar a sugestão agora.");
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const selectPoint = (point: BoardingPoint) => {
    if (selectable) onSelect?.(point);
  };

  const handlePointKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    point: BoardingPoint,
  ) => {
    if (!selectable || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    selectPoint(point);
  };

  return (
    <section className="space-y-4" aria-label="Pontos de embarque">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Pontos de embarque</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Locais recorrentes nas corridas recentes para facilitar o encontro com o motorista.
          </p>
        </div>
        {!selectable ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowSuggestForm((value) => !value)}
            aria-expanded={showSuggestForm}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Sugerir ponto
          </Button>
        ) : null}
      </div>

      {showSuggestForm ? (
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">Sugerir novo ponto</p>
          <Input
            value={suggestName}
            onChange={(event) => setSuggestName(event.target.value)}
            placeholder="Nome do ponto"
            maxLength={80}
          />
          <Input
            value={suggestAddress}
            onChange={(event) => setSuggestAddress(event.target.value)}
            placeholder="Endereço ou referência"
            maxLength={180}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSuggest()}
              disabled={
                submittingSuggestion ||
                !suggestName.trim() ||
                !suggestAddress.trim()
              }
              className="flex-1"
            >
              {submittingSuggestion ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Enviar sugestão
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowSuggestForm(false)}
              disabled={submittingSuggestion}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === item.value
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            aria-pressed={filter === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>

      {pointsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando pontos...
        </div>
      ) : pointsQuery.isError ? (
        <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Não foi possível carregar os pontos de embarque
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void pointsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
          <MapPin
            className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            Nenhum ponto nesta categoria
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tente outro filtro ou sugira um novo ponto.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((point) => {
            const config = typeConfig[point.type];
            const isSelected = selectedId === point.id;

            return (
              <div
                key={point.id}
                onClick={() => selectPoint(point)}
                onKeyDown={(event) => handlePointKeyDown(event, point)}
                role={selectable ? "button" : undefined}
                tabIndex={selectable ? 0 : undefined}
                aria-pressed={selectable ? isSelected : undefined}
                className={cn(
                  "relative rounded-2xl border bg-card p-4 text-card-foreground transition-colors",
                  selectable &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/25",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      config.bg,
                      config.color,
                    )}
                  >
                    {config.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {point.name}
                      </p>
                      <Badge
                        className={cn(
                          "h-4 border border-transparent px-1.5 text-[0.6rem]",
                          config.bg,
                          config.color,
                        )}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {point.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
                        {point.address}
                      </span>
                      {point.distance ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <Navigation className="h-3 w-3" aria-hidden="true" />
                          {point.distance}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {point.rides_count} ocorrências na amostra recente
                    </p>
                  </div>

                  {selectable ? (
                    <div
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
