/**
 * AdminTerritoryContent
 *
 * Painel admin híbrido: campos editáveis + botão para regenerar com IA.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTerritoryAIContent, type TerritoryAIContent } from '@/core/territorial/hooks/useTerritoryAIContent';
import { territorialGroupService } from '@/core/territorial';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { toast } from 'sonner';
import {
  Sparkles, Save, Loader2, Plus, Trash2,
  BookOpen, Users, Calendar, Building2,
} from 'lucide-react';

type TerritoryEvent = NonNullable<TerritoryAIContent['events']>[number];

export default function AdminTerritoryContent() {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  const { content, isLoading, generateWithAI, updateContent } = useTerritoryAIContent(slug);
  const { data: territoryGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['admin', 'territory-content', 'active-groups'],
    queryFn: () => territorialGroupService.listAllGroups(),
    staleTime: 5 * 60 * 1000,
  });

  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [economy, setEconomy] = useState('');
  const [population, setPopulation] = useState('');
  const [area, setArea] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [events, setEvents] = useState<TerritoryEvent[]>([]);

  const sortedGroups = useMemo(
    () => [...territoryGroups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [territoryGroups],
  );

  const selectedGroup = useMemo(
    () => sortedGroups.find((group) => group.slug === slug) ?? null,
    [sortedGroups, slug],
  );

  const selectedMembers = useMemo(
    () => selectedGroup?.members.map((member) => member.name).filter(Boolean) ?? [],
    [selectedGroup],
  );

  useEffect(() => {
    if (slug || sortedGroups.length === 0) return;
    const firstGroup = sortedGroups[0];
    setSlug(firstGroup.slug);
    setName(firstGroup.name);
  }, [slug, sortedGroups]);

  useEffect(() => {
    if (content) {
      const demographics = (content.demographics || {}) as {
        economy?: string;
        estimated_population?: number;
        area_km2?: number;
        main_characteristics?: string[];
      };
      setDescription(content.description || '');
      setHistory(content.history || '');
      setEconomy(demographics.economy || '');
      setPopulation(String(demographics.estimated_population || ''));
      setArea(String(demographics.area_km2 || ''));
      setCharacteristics((demographics.main_characteristics || []).join(', '));
      setEvents(content.events || []);
    } else {
      setDescription('');
      setHistory('');
      setEconomy('');
      setPopulation('');
      setArea('');
      setCharacteristics('');
      setEvents([]);
    }
  }, [content]);

  const handleSave = async () => {
    if (!slug) {
      toast.error('Selecione um território antes de salvar.');
      return;
    }

    try {
      await updateContent.mutateAsync({
        description,
        history,
        demographics: {
          ...content?.demographics,
          estimated_population: population ? Number(population) : undefined,
          area_km2: area ? Number(area) : undefined,
          economy,
          main_characteristics: characteristics.split(',').map(s => s.trim()).filter(Boolean),
        },
        events,
      });
      toast.success('Conteúdo salvo com sucesso!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  };

  const handleRegenerate = async () => {
    if (!slug || !name) {
      toast.error('Selecione um território antes de regenerar.');
      return;
    }

    try {
      await generateWithAI.mutateAsync({
        territory_slug: slug,
        territory_name: name,
        members: selectedMembers,
      });
      toast.success('Conteúdo regenerado com IA!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar conteúdo');
    }
  };

  const addEvent = () => {
    setEvents([...events, { name: '', description: '', frequency: '', category: 'cultura' }]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: string, value: string) => {
    setEvents(events.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Conteúdo do Território</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o conteúdo IA da landing page territorial com base nos grupos ativos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={generateWithAI.isPending}
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
            disabled={updateContent.isPending}
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

      {/* Territory selector */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Território
        </h2>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Grupo territorial ativo</label>
          <select
            value={slug}
            onChange={(event) => {
              const group = sortedGroups.find((item) => item.slug === event.target.value);
              setSlug(group?.slug ?? '');
              setName(group?.name ?? '');
            }}
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-do-territorio" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do território" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {selectedMembers.length > 0
            ? `${selectedMembers.length} bairros vinculados: ${selectedMembers.join(', ')}`
            : 'Nenhum bairro vinculado ao grupo selecionado.'}
        </p>
        {content?.ai_generated_at && (
          <p className="text-[10px] text-muted-foreground">
            Última geração IA: {new Date(content.ai_generated_at).toLocaleString('pt-BR')}
            {content.is_manual_override && ' · Editado manualmente'}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-teal-500" />
          Descrição
        </h2>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Descrição do bairro..."
          className="text-sm"
        />
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-500" />
          História
        </h2>
        <Textarea
          value={history}
          onChange={(e) => setHistory(e.target.value)}
          rows={4}
          placeholder="História do bairro..."
          className="text-sm"
        />
      </div>

      {/* Demographics */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          Dados Demográficos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">População estimada</label>
            <Input
              type="number"
              value={population}
              onChange={(e) => setPopulation(e.target.value)}
              placeholder="ex: 45000"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Área (km²)</label>
            <Input
              type="number"
              step="0.1"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="ex: 2.5"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Economia local</label>
          <Textarea
            value={economy}
            onChange={(e) => setEconomy(e.target.value)}
            rows={2}
            placeholder="Descrição da economia local..."
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Características (separadas por vírgula)</label>
          <Input
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
            placeholder="Diversidade cultural, Comércio ativo, ..."
          />
        </div>
      </div>

      {/* Events */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            Eventos e Cultura ({events.length})
          </h2>
          <Button variant="outline" size="sm" onClick={addEvent} className="gap-1">
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="space-y-3">
          {events.map((event, i) => (
            <div key={i} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={event.name}
                  onChange={(e) => updateEvent(i, 'name', e.target.value)}
                  placeholder="Nome do evento"
                  className="text-sm flex-1"
                />
                <select
                  value={event.category}
                  onChange={(e) => updateEvent(i, 'category', e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1.5 bg-background"
                >
                  <option value="cultura">Cultura</option>
                  <option value="esporte">Esporte</option>
                  <option value="religioso">Religioso</option>
                  <option value="comunitário">Comunitário</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => removeEvent(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={event.description}
                  onChange={(e) => updateEvent(i, 'description', e.target.value)}
                  placeholder="Descrição breve"
                  className="text-xs"
                />
                <Input
                  value={event.frequency}
                  onChange={(e) => updateEvent(i, 'frequency', e.target.value)}
                  placeholder="Frequência (anual, mensal...)"
                  className="text-xs"
                />
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum evento cadastrado. Clique em "Adicionar" ou "Regenerar com IA".
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
