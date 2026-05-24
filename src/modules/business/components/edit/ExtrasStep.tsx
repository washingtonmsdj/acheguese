import { Building2, Loader2, Save, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { getPaymentMethodLabels } from "@/core/business/constants";
import { getBusinessCreateFieldCopy } from "@/modules/business/components/create/businessCreateCopy";

// SSOT: usa constantes centralizadas de formas de pagamento.
const FORMAS_PAGAMENTO = getPaymentMethodLabels();

interface ExtrasStepProps {
  category?: string;
  capaPreview: string | null;
  capaRef: React.RefObject<HTMLInputElement>;
  onCapaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  website: string;
  onWebsiteChange: (value: string) => void;
  instagram: string;
  onInstagramChange: (value: string) => void;
  facebook: string;
  onFacebookChange: (value: string) => void;
  selectedPagamentos: string[];
  onPagamentosChange: (pagamentos: string[]) => void;
  especialidades: string;
  onEspecialidadesChange: (value: string) => void;
  facilidades: string;
  onFacilidadesChange: (value: string) => void;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function ExtrasStep({
  category,
  capaPreview,
  capaRef,
  onCapaChange,
  uploading = false,
  website,
  onWebsiteChange,
  instagram,
  onInstagramChange,
  facebook,
  onFacebookChange,
  selectedPagamentos,
  onPagamentosChange,
  especialidades,
  onEspecialidadesChange,
  facilidades,
  onFacilidadesChange,
  saving,
  onBack,
  onSave,
}: ExtrasStepProps) {
  const copy = getBusinessCreateFieldCopy(category);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informações complementares
        </CardTitle>
        <CardDescription>Finalize dados públicos e comerciais da sua empresa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Imagem de capa</Label>
          {capaPreview && (
            <div className="relative mb-2 h-32 overflow-hidden rounded-lg">
              <img
                src={capaPreview}
                alt="Capa"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <input
            ref={capaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCapaChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => capaRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : capaPreview ? "Trocar capa" : "Adicionar capa"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Recomendado: 1200x400px, máximo 5 MB.
          </p>
        </div>

        <div className="space-y-4">
          <Label>Canais digitais</Label>
          <Input
            placeholder={copy.websitePlaceholder}
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
          />
          <Input
            placeholder={copy.instagramPlaceholder}
            value={instagram}
            onChange={(e) => onInstagramChange(e.target.value)}
          />
          <Input
            placeholder={copy.facebookPlaceholder}
            value={facebook}
            onChange={(e) => onFacebookChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Formas de pagamento</Label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <label key={forma} className="flex items-center space-x-2 rounded-lg border p-3">
                <Checkbox
                  id={forma}
                  checked={selectedPagamentos.includes(forma)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onPagamentosChange(Array.from(new Set([...selectedPagamentos, forma])));
                    } else {
                      onPagamentosChange(selectedPagamentos.filter((f) => f !== forma));
                    }
                  }}
                />
                <span className="text-sm leading-none">{forma}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidades">Especialidades</Label>
          <Input
            id="especialidades"
            value={especialidades}
            onChange={(e) => onEspecialidadesChange(e.target.value)}
            placeholder={copy.specialtiesPlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilidades">Facilidades</Label>
          <Input
            id="facilidades"
            value={facilidades}
            onChange={(e) => onFacilidadesChange(e.target.value)}
            placeholder={copy.facilitiesPlaceholder}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button type="button" onClick={onSave} disabled={saving} className="flex-1 gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
