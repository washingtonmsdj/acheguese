// @ts-nocheck
﻿import { useRef } from "react";
import { Building2, Globe, Loader2, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";

interface ExtrasStepProps {
  capaPreview: string | null;
  website: string;
  instagram: string;
  facebook: string;
  selectedPagamentos: string[];
  especialidades: string;
  facilidades: string;
  status: string;
  errors: Record<string, string>;
  isCreating: boolean;
  onCapaChange: (file: File | null) => void;
  onWebsiteChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
  onFacebookChange: (value: string) => void;
  onPagamentosChange: (pagamentos: string[]) => void;
  onEspecialidadesChange: (value: string) => void;
  onFacilidadesChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
}

const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Cartao de Debito",
  "Cartao de Credito",
  "Vale Refeicao",
  "Vale Alimentacao",
  "Transferencia Bancaria",
];

export function ExtrasStep({
  capaPreview,
  website,
  instagram,
  facebook,
  selectedPagamentos,
  especialidades,
  facilidades,
  status,
  errors,
  isCreating,
  onCapaChange,
  onWebsiteChange,
  onInstagramChange,
  onFacebookChange,
  onPagamentosChange,
  onEspecialidadesChange,
  onFacilidadesChange,
  onStatusChange,
  onBack,
  onCreate,
}: ExtrasStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePagamentoToggle = (forma: string, checked: boolean) => {
    if (checked) {
      onPagamentosChange(Array.from(new Set([...selectedPagamentos, forma])));
      return;
    }

    onPagamentosChange(selectedPagamentos.filter((item) => item !== forma));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Midia, canais publicos e operacao complementar
        </CardTitle>
        <CardDescription>
          Ajustes finais para enriquecer a pagina publica e o dashboard sem duplicar regra de negocio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Imagem de capa</Label>
          {capaPreview && (
            <div className="relative h-36 overflow-hidden rounded-xl border">
              <img src={capaPreview} alt="Capa da empresa" className="h-full w-full object-cover" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onCapaChange(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {capaPreview ? "Trocar capa" : "Adicionar capa"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Opcional. Recomendado para dashboard e pagina publica.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://empresa.com.br"
              value={website}
              onChange={(event) => onWebsiteChange(event.target.value)}
            />
            {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              placeholder="@empresa ou URL"
              value={instagram}
              onChange={(event) => onInstagramChange(event.target.value)}
            />
            {errors.instagram && <p className="text-xs text-destructive">{errors.instagram}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              placeholder="pagina ou URL"
              value={facebook}
              onChange={(event) => onFacebookChange(event.target.value)}
            />
            {errors.facebook && <p className="text-xs text-destructive">{errors.facebook}</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <Label>Formas de pagamento</Label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <label key={forma} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={selectedPagamentos.includes(forma)}
                  onCheckedChange={(checked) => handlePagamentoToggle(forma, Boolean(checked))}
                />
                <span>{forma}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidades">Especialidades</Label>
          <Input
            id="especialidades"
            value={especialidades}
            onChange={(event) => onEspecialidadesChange(event.target.value)}
            placeholder="Ex: massas artesanais, cafe da manha, entrega rapida"
          />
          <p className="text-xs text-muted-foreground">Separe por virgula.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilidades">Facilidades</Label>
          <Input
            id="facilidades"
            value={facilidades}
            onChange={(event) => onFacilidadesChange(event.target.value)}
            placeholder="Ex: estacionamento, acessibilidade, wifi, pet friendly"
          />
          <p className="text-xs text-muted-foreground">Separe por virgula.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status inicial</Label>
          <select
            id="status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="active">Ativa e publicada</option>
            <option value="pending">Pendente / revisar depois</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="flex-1 gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Criar empresa
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
