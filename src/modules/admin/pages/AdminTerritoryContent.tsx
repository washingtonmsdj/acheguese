/**
 * AdminTerritoryContent
 *
 * Conteúdo editorial territorial administrado por broker autenticado.
 * Identidade territorial vem do grupo canônico; o browser edita apenas conteúdo.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { territorialGroupService } from "@/core/territorial";
import { useTerritoryAIContentAdmin } from "@/core/territorial/hooks/useTerritoryAIContentAdmin";
import type {
  TerritoryEvent,
  TerritoryEventCategory,
} from "@/core/territorial/services/TerritorialAIService";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Building2,
  Calendar,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default function AdminTerritoryContent() {
  const [slug, setSlug] = useState("");

  const { content, isLoading, generateWithAI, updateContent } =
    useTerritoryAIContentAdmin(slug || null);

  const { data: territoryGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ["admin", "territory-content", "active-groups"],
    queryFn: () => territorialGroupService.listAllGroups(),
    staleTime: 5 * 60 * 1000,
  });

  const [description, setDescription] = useState("");
  const [history, setHistory] = useState("");
  const [economy, setEconomy] = useState("");
  const [population, setPopulation] = useState("");
  const [area, setArea] = useState("");
  const [characteristics, setCharacteristics] = useState("");
  const [events, setEvents] = useState<TerritoryEvent[]>([]);

  const sortedGroups = useMemo(
    () =>
      [...territoryGroups].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    [territoryGroups],
  );

  const selectedGroup = useMemo(
    () => sortedGroups.find((group) => group.slug === slug) ?? null,
    [sortedGroups, slug],
  );

  const selectedMembers = useMemo(
    () =>
      selectedGroup?.members
        .map((member) => member.name)
        .filter(Boolean) ?? [],
    [selectedGroup],
  );

  useEffect(() => {
    if (slug || sortedGroups.length === 0) return;
    setSlug(sortedGroups[0].slug);
  }, [slug, sortedGroups]);

  useEffect(() => {
    if (!content) {
      setDescription("");
      setHistory("");
      setEconomy("");
      setPopulation("");
      setArea("");
      setCharacteristics("");
      setEvents([]);
      return;
    }

    setDescription(content.description ?? "");
    setHistory(content.history ?? "");
    setEconomy(content.demographics.economy ?? "");
    setPopulation(
      content.demographics.estimated_population === undefined
        ? ""
        : String(content.demographics.estimated_population),
    );
    setArea(
      content.demographics.area_km2 === undefined
        ? ""
        : String(content.demographics.area_km2),
    );
    setCharacteristics(
      (content.demographics.main_characteristics ?? []).join(", "),
    );
    setEvents(content.events ?? []);
  }, [content]);

  const handleSave = async () => {
    if (!selectedGroup) {
      toast.error("Selecione um território antes de salvar.");
      return;
    }

    try {
      await updateContent.mutateAsync({
        description: description.trim() || null,
        history: history.trim() || null,
        demographics: {
          estimated_population: optionalNumber(population),
          area_km2: optionalNumber(area),
          density: content?.demographics.density,
          infrastructure: content?.demographics.infrastructure,
          economy: economy.trim() || undefined,
          main_characteristics: characteristics
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        },
        events,
      });
      toast.success("Conteúdo salvo com sucesso.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  };

  const handleRegenerate = async () => {
    if (!selectedGroup) {
      toast.error("Selecione um território antes de regenerar.");
      return;
    }

    try {
      await generateWithAI.mutateAsync();
      toast.success("Conteúdo regenerado com IA.");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar conteúdo",
      );
    }
  };

  const addEvent = () => {
    setEvents((current) => [
      ...current,
      {
        name: "",
        description: "",
        frequency: "",
        category: "cultura",
      },
    ]);
  };

  const removeEvent = (index: number) => {
    setEvents((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateEvent = <K extends keyof TerritoryEvent>(
    index: number,
    field: K,
    value: TerritoryEvent[K],
  ) => {
    setEvents((current) =>
      current.map((event, itemIndex) =>
        itemIndex === index ? { ...event, [field]: value } : event,
      ),
    );
  };

  if (isLoading || isGroupsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Conteúdo do Território
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conteúdo editorial da landing territorial, com geração e edição
            administradas no backend.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={!selectedGroup || generateWithAI.isPending}
            className="gap-2"
          >
            {generateWithAI.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Regenerar com IA
          </Button>

          <Button
            onClick={handleSave}
            disabled={!selectedGroup || updateContent.isPending}
            className="gap-2"
          >
            {updateContent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Território
        </h2>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Grupo territorial ativo
          </label>
          <select
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Selecione um grupo territorial</option>
            {sortedGroups.map((group) => (
              <option key={group.id} value={group.slug}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium">{selectedGroup.name}</p>
            <p className="text-[11px] text-muted-foreground">
              /{selectedGroup.slug}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {selectedMembers.length > 0
                ? `${selectedMembers.length} bairros vinculados: ${selectedMembers.join(", ")}`
                : "Nenhum bairro vinculado ao grupo selecionado."}
            </p>
          </div>
        )}

        {content?.ai_generated_at && (
          <p className="text-[10px] text-muted-foreground">
            Última geração IA:{" "}
            {new Date(content.ai_generated_at).toLocaleString("pt-BR")}
            {content.is_manual_override && " · Editado manualmente"}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-teal-500" />
          Descrição
        </h2>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          placeholder="Descrição do território..."
          className="text-sm"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-500" />
          História
        </h2>
        <Textarea
          value={history}
          onChange={(event) => setHistory(event.target.value)}
          rows={4}
          placeholder="História do território..."
          className="text-sm"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          Dados demográficos
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              População estimada
            </label>
            <Input
              type="number"
              min="0"
              value={population}
              onChange={(event) => setPopulation(event.target.value)}
              placeholder="ex: 45000"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Área (km²)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="ex: 2.5"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Economia local
          </label>
          <Textarea
            value={economy}
            onChange={(event) => setEconomy(event.target.value)}
            rows={2}
            placeholder="Descrição da economia local..."
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Características (separadas por vírgula)
          </label>
          <Input
            value={characteristics}
            onChange={(event) => setCharacteristics(event.target.value)}
            placeholder="Diversidade cultural, Comércio ativo, ..."
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            Eventos e cultura ({events.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={addEvent}
            className="gap-1"
          >
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-muted/30 border border-border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={event.name}
                  onChange={(inputEvent) =>
                    updateEvent(index, "name", inputEvent.target.value)
                  }
                  placeholder="Nome do evento"
                  className="text-sm flex-1"
                />

                <select
                  value={event.category}
                  onChange={(inputEvent) =>
                    updateEvent(
                      index,
                      "category",
                      inputEvent.target.value as TerritoryEventCategory,
                    )
                  }
                  className="text-xs border border-border rounded-md px-2 py-1.5 bg-background"
                >
                  <option value="cultura">Cultura</option>
                  <option value="esporte">Esporte</option>
                  <option value="religioso">Religioso</option>
                  <option value="comunitário">Comunitário</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvent(index)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={event.description}
                  onChange={(inputEvent) =>
                    updateEvent(index, "description", inputEvent.target.value)
                  }
                  placeholder="Descrição breve"
                  className="text-xs"
                />
                <Input
                  value={event.frequency}
                  onChange={(inputEvent) =>
                    updateEvent(index, "frequency", inputEvent.target.value)
                  }
                  placeholder="Frequência (anual, mensal...)"
                  className="text-xs"
                />
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum evento cadastrado. Adicione manualmente ou regenere com IA.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
