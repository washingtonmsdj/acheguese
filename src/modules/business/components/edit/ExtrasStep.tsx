import { Building2, Upload, Save, Loader2 } from "lucide-react";
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

// SSOT: Usa constantes centralizadas de formas de pagamento
const formasPagamento = getPaymentMethodLabels();

interface ExtrasStepProps {
  capaPreview: string | null;
  capaRef: React.RefObject<HTMLInputElement>;
  onCapaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  capaPreview,
  capaRef,
  onCapaChange,
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informações Extras
        </CardTitle>
        <CardDescription>Complete o perfil da sua empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Imagem de Capa</Label>
          {capaPreview && (
            <div className="relative h-32 rounded-lg overflow-hidden mb-2">
              <img
                src={capaPreview}
                alt="Capa"
                className="w-full h-full object-cover"
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
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {capaPreview ? "Trocar Capa" : "Adicionar Capa"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Recomendado: 1200x400px, máximo 5MB
          </p>
        </div>

        <div className="space-y-4">
          <Label>Redes Sociais</Label>
          <Input
            placeholder="Website (https://...)"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
          />
          <Input
            placeholder="Instagram (@user)"
            value={instagram}
            onChange={(e) => onInstagramChange(e.target.value)}
          />
          <Input
            placeholder="Facebook (facebook.com/...)"
            value={facebook}
            onChange={(e) => onFacebookChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Formas de Pagamento</Label>
          <div className="grid grid-cols-2 gap-2">
            {formasPagamento.map((forma) => (
              <div key={forma} className="flex items-center space-x-2">
                <Checkbox
                  id={forma}
                  checked={selectedPagamentos.includes(forma)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onPagamentosChange([...selectedPagamentos, forma]);
                    } else {
                      onPagamentosChange(
                        selectedPagamentos.filter((f) => f !== forma),
                      );
                    }
                  }}
                />
                <label
                  htmlFor={forma}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {forma}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidades">Especialidades</Label>
          <Input
            id="especialidades"
            value={especialidades}
            onChange={(e) => onEspecialidadesChange(e.target.value)}
            placeholder="Ex: Pizza, Massas, Sobremesas (separado por vírgula)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilidades">Facilidades</Label>
          <Input
            id="facilidades"
            value={facilidades}
            onChange={(e) => onFacilidadesChange(e.target.value)}
            placeholder="Ex: Estacionamento, Wi-Fi, Acessibilidade (separado por vírgula)"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={onSave} disabled={saving} className="flex-1 gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
