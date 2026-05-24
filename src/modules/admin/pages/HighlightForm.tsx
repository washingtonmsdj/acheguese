/**
 * HighlightForm
 *
 * Formulário de criação/edição de destaque territorial.
 * Modal simples, validação inline, sem dependência de lib de form.
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type {
  TerritorialHighlight,
  CreateHighlightInput,
  HighlightType,
  HighlightTerritoryType,
  HighlightStatus,
} from '@/core/territorial/highlights/types';

const HIGHLIGHT_TYPES: Array<{ value: HighlightType; label: string }> = [
  { value: 'business',   label: 'Empresa' },
  { value: 'service',    label: 'Serviço' },
  { value: 'classified', label: 'Classificado' },
  { value: 'event',      label: 'Evento' },
  { value: 'creator',    label: 'Criador/Influencer' },
  { value: 'notice',     label: 'Aviso/Comunicado' },
];

interface Props {
  defaultTerritory: { type: HighlightTerritoryType; ref_id: string; label: string };
  initial: TerritorialHighlight | null;
  onClose: () => void;
  onSave: (input: CreateHighlightInput) => void;
  isSaving: boolean;
  error: string | null;
}

type FormState = {
  highlight_type: HighlightType;
  entity_id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  position: string;
  status: HighlightStatus;
  starts_at: string;
  ends_at: string;
};

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string | undefined {
  if (!val) return undefined;
  return new Date(val).toISOString();
}

export function HighlightForm({ defaultTerritory, initial, onClose, onSave, isSaving, error }: Props) {
  const [form, setForm] = useState<FormState>({
    highlight_type: initial?.highlight_type ?? 'notice',
    entity_id:      initial?.entity_id ?? '',
    title:          initial?.title ?? '',
    subtitle:       initial?.subtitle ?? '',
    image_url:      initial?.image_url ?? '',
    cta_label:      initial?.cta_label ?? '',
    cta_url:        initial?.cta_url ?? '',
    position:       String(initial?.position ?? 0),
    status:         initial?.status ?? 'active',
    starts_at:      toDatetimeLocal(initial?.starts_at),
    ends_at:        toDatetimeLocal(initial?.ends_at),
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset quando troca de initial
  useEffect(() => {
    setForm({
      highlight_type: initial?.highlight_type ?? 'notice',
      entity_id:      initial?.entity_id ?? '',
      title:          initial?.title ?? '',
      subtitle:       initial?.subtitle ?? '',
      image_url:      initial?.image_url ?? '',
      cta_label:      initial?.cta_label ?? '',
      cta_url:        initial?.cta_url ?? '',
      position:       String(initial?.position ?? 0),
      status:         initial?.status ?? 'active',
      starts_at:      toDatetimeLocal(initial?.starts_at),
      ends_at:        toDatetimeLocal(initial?.ends_at),
    });
    setValidationError(null);
  }, [initial]);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Título é obrigatório';
    if ((form.cta_label && !form.cta_url) || (!form.cta_label && form.cta_url)) {
      return 'CTA requer label e URL juntos';
    }
    if (form.starts_at && form.ends_at && new Date(form.starts_at) >= new Date(form.ends_at)) {
      return 'Data de início deve ser anterior à data de fim';
    }
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) { setValidationError(err); return; }

    const input: CreateHighlightInput = {
      territory_type:   defaultTerritory.type,
      territory_ref_id: defaultTerritory.ref_id,
      highlight_type:   form.highlight_type,
      entity_id:        form.entity_id.trim() || undefined,
      title:            form.title.trim(),
      subtitle:         form.subtitle.trim() || undefined,
      image_url:        form.image_url.trim() || undefined,
      cta_label:        form.cta_label.trim() || undefined,
      cta_url:          form.cta_url.trim() || undefined,
      position:         parseInt(form.position) || 0,
      status:           form.status,
      starts_at:        fromDatetimeLocal(form.starts_at),
      ends_at:          fromDatetimeLocal(form.ends_at),
    };
    onSave(input);
  }

  const displayError = validationError ?? error;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold">
            {initial ? 'Editar destaque' : 'Novo destaque'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{defaultTerritory.label}</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Tipo */}
          <div>
            <Label className="text-xs">Tipo de destaque *</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {HIGHLIGHT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('highlight_type', t.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                    form.highlight_type === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="hl-title" className="text-xs">Título *</Label>
            <Input
              id="hl-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Mutirão de limpeza na comunidade"
              className="mt-1 text-sm"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <Label htmlFor="hl-subtitle" className="text-xs">Subtítulo</Label>
            <Textarea
              id="hl-subtitle"
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="Descrição curta opcional"
              rows={2}
              className="mt-1 text-sm resize-none"
            />
          </div>

          {/* Imagem */}
          <div>
            <Label htmlFor="hl-image" className="text-xs">URL da imagem</Label>
            <Input
              id="hl-image"
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="https://..."
              className="mt-1 text-sm"
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="hl-cta-label" className="text-xs">Label do CTA</Label>
              <Input
                id="hl-cta-label"
                value={form.cta_label}
                onChange={(e) => set('cta_label', e.target.value)}
                placeholder="Ex: Saiba mais"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="hl-cta-url" className="text-xs">URL do CTA</Label>
              <Input
                id="hl-cta-url"
                value={form.cta_url}
                onChange={(e) => set('cta_url', e.target.value)}
                placeholder="https://..."
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Entity ID */}
          <div>
            <Label htmlFor="hl-entity" className="text-xs">
              ID da entidade <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="hl-entity"
              value={form.entity_id}
              onChange={(e) => set('entity_id', e.target.value)}
              placeholder="UUID do business, professional, etc."
              className="mt-1 text-sm font-mono"
            />
          </div>

          {/* Position + Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="hl-position" className="text-xs">Posição</Label>
              <Input
                id="hl-position"
                type="number"
                min={0}
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <div className="flex gap-2 mt-1.5">
                {(['active', 'inactive'] as HighlightStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${
                      form.status === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {s === 'active' ? 'Ativo' : 'Inativo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="hl-starts" className="text-xs">Início</Label>
              <Input
                id="hl-starts"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="hl-ends" className="text-xs">Fim (expiração)</Label>
              <Input
                id="hl-ends"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {displayError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-border sticky bottom-0 bg-card">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="flex-1">
            {isSaving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Criar destaque'}
          </Button>
        </div>
      </div>
    </div>
  );
}
