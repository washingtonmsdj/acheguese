import { CheckSquare, Filter, Square } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  CONTEXT_LABELS,
  type TrustContextFilter,
} from "./TrustEventsQueue.constants";

interface TrustEventsQueueFiltersProps {
  contextCounts: Record<TrustContextFilter, number>;
  contextFilter: TrustContextFilter;
  lockContextFilter: boolean;
  onlyOpenEvents: boolean;
  lockOnlyOpenEvents: boolean;
  onlyClassifiedCommentReports: boolean;
  lockOnlyClassifiedCommentReports: boolean;
  criticalClassifiedEvents: number;
  openClassifiedCommentReports: number;
  selectedEventsCount: number;
  filteredEventsCount: number;
  onContextFilterChange: (filter: TrustContextFilter) => void;
  onOnlyOpenEventsChange: (value: boolean) => void;
  onOnlyClassifiedCommentReportsChange: (value: boolean) => void;
  onToggleSelectAllFiltered: () => void;
}

export function TrustEventsQueueFilters({
  contextCounts,
  contextFilter,
  lockContextFilter,
  onlyOpenEvents,
  lockOnlyOpenEvents,
  onlyClassifiedCommentReports,
  lockOnlyClassifiedCommentReports,
  criticalClassifiedEvents,
  openClassifiedCommentReports,
  selectedEventsCount,
  filteredEventsCount,
  onContextFilterChange,
  onOnlyOpenEventsChange,
  onOnlyClassifiedCommentReportsChange,
  onToggleSelectAllFiltered,
}: TrustEventsQueueFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Badge variant={criticalClassifiedEvents > 0 ? "destructive" : "outline"}>
        Classificados graves: {criticalClassifiedEvents}
      </Badge>
      <Badge variant={openClassifiedCommentReports > 0 ? "secondary" : "outline"}>
        Denuncias de comentarios abertas: {openClassifiedCommentReports}
      </Badge>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filtrar contexto
      </div>
      {!lockContextFilter &&
        Object.keys(CONTEXT_LABELS).map((key) => {
          const filter = key as TrustContextFilter;
          return (
            <Button
              key={filter}
              type="button"
              size="sm"
              variant={contextFilter === filter ? "default" : "outline"}
              onClick={() => onContextFilterChange(filter)}
              className="h-8"
            >
              {CONTEXT_LABELS[filter]} ({contextCounts[filter]})
            </Button>
          );
        })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onToggleSelectAllFiltered}
        className="h-8"
      >
        {selectedEventsCount === filteredEventsCount && filteredEventsCount > 0 ? (
          <CheckSquare className="mr-1 h-3.5 w-3.5" />
        ) : (
          <Square className="mr-1 h-3.5 w-3.5" />
        )}
        Selecionar todos ({selectedEventsCount})
      </Button>
      {!lockOnlyOpenEvents && (
        <div className="ml-auto flex items-center gap-2 rounded-md border px-2 py-1">
          <Switch
            id="trust-queue-only-open"
            checked={onlyOpenEvents}
            onCheckedChange={onOnlyOpenEventsChange}
          />
          <Label htmlFor="trust-queue-only-open" className="text-xs text-muted-foreground">
            Apenas pendentes
          </Label>
        </div>
      )}
      {!lockOnlyClassifiedCommentReports && (
        <div className="flex items-center gap-2 rounded-md border px-2 py-1">
          <Switch
            id="trust-queue-only-classified-comment-reports"
            checked={onlyClassifiedCommentReports}
            onCheckedChange={onOnlyClassifiedCommentReportsChange}
          />
          <Label
            htmlFor="trust-queue-only-classified-comment-reports"
            className="text-xs text-muted-foreground"
          >
            Apenas denuncias de comentario
          </Label>
        </div>
      )}
    </div>
  );
}
