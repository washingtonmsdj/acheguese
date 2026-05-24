import { useCallback, useEffect, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  TryOnCategory, TryOnGender,
  type TryOnStyle,
} from '../domain/types';
import { TRYON_UPLOAD_LIMITS } from '../constants/tryonConfig';

interface Props {
  onSubmit: (file: File, opts: {
    category: TryOnCategory;
    targetGender: TryOnGender;
    style: TryOnStyle;
    variations: number;
  }) => void;
  disabled?: boolean;
}

const categoryLabels: Partial<Record<TryOnCategory, string>> = {
  clothing_upper: 'Camiseta / Blusa (parte de cima)',
  clothing_lower: 'Calça / Saia (parte de baixo)',
  clothing_full: 'Vestido / Conjunto (corpo inteiro)',
  swimwear: 'Moda praia (biquíni / sunga)',
};

export function TryOnUploadPanel({ onSubmit, disabled }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<TryOnCategory>(TryOnCategory.CLOTHING_UPPER);
  const [gender, setGender] = useState<TryOnGender>(TryOnGender.NEUTRAL);
  const [style, setStyle] = useState<TryOnStyle>('casual');
  const [variations, setVariations] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (!TRYON_UPLOAD_LIMITS.acceptedMimeTypes.includes(f.type as typeof TRYON_UPLOAD_LIMITS.acceptedMimeTypes[number])) { setError('Formato inválido. Use PNG, JPG ou WEBP.'); return; }
    if (f.size > TRYON_UPLOAD_LIMITS.maxImageBytes) { setError('Arquivo muito grande (máx 8MB).'); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    accept(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <Card className="p-6 space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition"
        onClick={() => document.getElementById('tryon-file')?.click()}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="produto" className="max-h-56 mx-auto rounded" />
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              onClick={(e) => {
                e.stopPropagation();
                if (preview) URL.revokeObjectURL(preview);
                setFile(null);
                setPreview(null);
              }}
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-10 w-10" />
            <p>Arraste a foto do produto aqui ou clique para selecionar</p>
            <p className="text-xs">PNG, JPG, WEBP — até 8MB</p>
          </div>
        )}
        <input
          id="tryon-file"
          type="file"
          accept={TRYON_UPLOAD_LIMITS.acceptedMimeTypes.join(',')}
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TryOnCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Gênero do modelo</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as TryOnGender)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">Neutro</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as TryOnStyle)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="sport">Esportivo</SelectItem>
              <SelectItem value="beach">Praia</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="streetwear">Streetwear</SelectItem>
              <SelectItem value="elegant">Elegante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Variações</Label>
          <span className="text-sm font-medium">{variations}</span>
        </div>
        <Slider
          value={[variations]}
          min={1}
          max={4}
          step={1}
          onValueChange={([value]) => setVariations(value)}
        />
        <p className="text-xs text-muted-foreground">
          Cada variação executa uma geração no Replicate e aumenta o custo proporcionalmente.
        </p>
      </div>

      <Button
        className="w-full"
        disabled={!file || disabled}
        onClick={() => file && onSubmit(file, { category, targetGender: gender, style, variations })}
      >
        Gerar imagens com IA
      </Button>
    </Card>
  );
}
