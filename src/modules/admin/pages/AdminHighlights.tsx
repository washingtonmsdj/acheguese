/**
 * AdminHighlights
 *
 * Gestão de destaques editoriais territoriais.
 * MVP operacional: listar, criar, editar, ativar/desativar, remover, reordenar.
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useHighlightsAdmin } from '@/core/territorial/highlights/useHighlightsAdmin';
import { useTerritoryOptions } from '@/core/territorial/highlights/useTerritoryOptions';
import { HighlightForm } from '@/modules/admin/pages/HighlightForm';
import type { TerritorialHighlight, HighlightQuery } from '@/core/territorial/highlights/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function highlightStatus(h: TerritorialHighlight): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (h.status === 'inactive') return 'inactive';
  const now = Date.now();
  if (h.starts_at && new Date(h.starts_at).getTime() > now) return 'scheduled';
  if (h.ends_at   && new Date(h.ends_at).getTime()   < now) return 'expired';
  return 'active';
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:    { label: 'Ativo',       className: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  scheduled: { label: 'Programado',  className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  expired:   { label: 'Expirado',    className: 'bg-muted text-muted-foreground border-border' },
  inactive:  { label: 'Inativo',     className: 'bg-muted text-muted-foreground border-border' },
};
const STATUS_BADGE_MAP = new Map(Object.entries(STATUS_BADGE));

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Row ──────────────────────────────────────────────────────────────────────

function HighlightRow({
  h,
  onEdit,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  h: TerritorialHighlight;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const st = highlightStatus(h);
  const badge = STATUS_BADGE_MAP.get(st) ?? STATUS_BADGE.inactive;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-border/80 transition-colors">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
          aria-label="Mover para cima"
        >
          <ChevronDown className="h-3 w-3 rotate-180" />
        </button>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
          aria-label="Mover para baixo"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Position */}
      <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">{h.position}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground truncate">{h.title}</span>
          <span className="text-[10px] text-muted-foreground capitalize">{h.highlight_type}</span>
        </div>
        {h.subtitle && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{h.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <span>{formatDate(h.starts_at)} → {formatDate(h.ends_at)}</span>
        </div>
      </div>

      {/* Status badge */}
      <Badge className={`text-[10px] px-1.5 py-0.5 border flex-shrink-0 ${badge.className}`}>
        {badge.label}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={h.status === 'active' ? 'Desativar' : 'Ativar'}
        >
          {h.status === 'active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function AdminHighlights() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TerritorialHighlight | null>(null);

  // Carrega territórios dinamicamente — sem hardcode
  const { data: territories = [], isLoading: loadingTerritories } = useTerritoryOptions();

  const territory = territories.at(selectedIdx) ?? null;
  const query: HighlightQuery | null = territory
    ? {
        territory_type:   territory.type,
        territory_ref_id: territory.ref_id,
        only_valid:       false,
      }
    : null;

  const { highlights, isLoading, create, update, setStatus, remove, reorder } =
    useHighlightsAdmin(query ?? { territory_type: 'location', territory_ref_id: '', only_valid: false });

  function handleMoveUp(idx: number) {
    if (idx === 0) return;
    const reordered = [...highlights];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(idx - 1, 0, moved);
    reorder.mutate(reordered.map((h, i) => ({ id: h.id, position: i })));
  }

  function handleMoveDown(idx: number) {
    if (idx === highlights.length - 1) return;
    const reordered = [...highlights];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(idx + 1, 0, moved);
    reorder.mutate(reordered.map((h, i) => ({ id: h.id, position: i })));
  }

  function handleDelete(id: string) {
    if (!confirm('Remover este destaque?')) return;
    remove.mutate(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Destaques Territoriais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conteúdo editorial da vitrine pública por bairro/região
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" />
          Novo destaque
        </Button>
      </div>

      {/* Seletor de território */}
      <div className="flex flex-wrap gap-2">
        {loadingTerritories ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando territórios...
          </div>
        ) : territories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum território disponível.</p>
        ) : (
          territories.map((t, i) => (
            <button
              key={t.ref_id}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                i === selectedIdx
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-border/80'
              }`}
            >
              {t.type === 'group' ? '⬡ ' : '◎ '}{t.label}
            </button>
          ))
        )}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
        ) : highlights.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
            Nenhum destaque para este território.
            <br />
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="mt-2 text-teal-500 hover:text-teal-400 text-xs underline"
            >
              Criar o primeiro
            </button>
          </div>
        ) : (
          highlights.map((h, idx) => (
            <HighlightRow
              key={h.id}
              h={h}
              isFirst={idx === 0}
              isLast={idx === highlights.length - 1}
              onEdit={() => { setEditing(h); setShowForm(true); }}
              onToggle={() =>
                setStatus.mutate({ id: h.id, status: h.status === 'active' ? 'inactive' : 'active' })
              }
              onDelete={() => handleDelete(h.id)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
            />
          ))
        )}
      </div>

      {/* Form modal */}
      {showForm && territory && (
        <HighlightForm
          defaultTerritory={territory}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(input) => {
            if (editing) {
              update.mutate(
                { id: editing.id, input },
                { onSuccess: () => { setShowForm(false); setEditing(null); } },
              );
            } else {
              create.mutate(input, {
                onSuccess: () => { setShowForm(false); },
              });
            }
          }}
          isSaving={create.isPending || update.isPending}
          error={create.error?.message ?? update.error?.message ?? null}
        />
      )}
    </div>
  );
}
