import { useRef } from "react";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Globe2,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PAYMENT_METHODS } from "@/core/business/constants";
import { getBusinessCreateFieldCopy } from "./businessCreateCopy";

interface ExtrasStepProps {
  category: string;
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

const FORMAS_PAGAMENTO = PAYMENT_METHODS.map(({ label }) => label);

export function ExtrasStep({
  category,
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
  const copy = getBusinessCreateFieldCopy(category);

  const handlePagamentoToggle = (forma: string, checked: boolean) => {
    if (checked) {
      onPagamentosChange(Array.from(new Set([...selectedPagamentos, forma])));
      return;
    }
    onPagamentosChange(selectedPagamentos.filter((item) => item !== forma));
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Etapa 3
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Apresentação e detalhes
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Finalize a vitrine do seu {copy.entityNoun} com imagem, canais digitais e informações úteis para quem encontrar a página.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold text-foreground">Imagem de capa</Label>
          </div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Use uma imagem horizontal que represente bem a empresa. Você poderá trocar depois.
          </p>

          {capaPreview ? (
            <div className="mt-4 overflow-hidden rounded-[18px] border border-border bg-muted">
              <img
                src={capaPreview}
                alt="Capa da empresa"
                className="h-36 w-full object-cover sm:h-44"
              />
            </div>
          ) : (
            <div className="mt-4 flex h-32 items-center justify-center rounded-[18px] border border-dashed border-border bg-muted/30 text-muted-foreground">
              <div className="text-center">
                <ImagePlus className="mx-auto h-6 w-6" />
                <p className="mt-2 text-xs">Nenhuma capa adicionada</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onCapaChange(event.target.files?.[0] ?? null)}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {capaPreview ? "Trocar capa" : "Adicionar capa"}
            </Button>
            <p className="text-xs text-muted-foreground">Opcional · imagem horizontal recomendada.</p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Canais digitais</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Informe somente canais que estejam ativos e atualizados.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                id="website"
                placeholder={copy.websitePlaceholder}
                value={website}
                onChange={(event) => onWebsiteChange(event.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.website ? <p className="mt-1 text-xs text-destructive">{errors.website}</p> : null}
            </div>
            <div>
              <Input
                id="instagram"
                placeholder={copy.instagramPlaceholder}
                value={instagram}
                onChange={(event) => onInstagramChange(event.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.instagram ? <p className="mt-1 text-xs text-destructive">{errors.instagram}</p> : null}
            </div>
            <div>
              <Input
                id="facebook"
                placeholder={copy.facebookPlaceholder}
                value={facebook}
                onChange={(event) => onFacebookChange(event.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.facebook ? <p className="mt-1 text-xs text-destructive">{errors.facebook}</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Formas de pagamento</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Marque as opções aceitas normalmente pela empresa.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {FORMAS_PAGAMENTO.map((forma) => {
              const checked = selectedPagamentos.includes(forma);
              return (
                <label
                  key={forma}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    checked
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-border bg-background/50 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      handlePagamentoToggle(forma, Boolean(nextChecked))
                    }
                  />
                  <span className="font-medium">{forma}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="especialidades">Especialidades</Label>
            <Input
              id="especialidades"
              value={especialidades}
              onChange={(event) => onEspecialidadesChange(event.target.value)}
              placeholder={copy.specialtiesPlaceholder}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Separe os itens por vírgula.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilidades">Facilidades</Label>
            <Input
              id="facilidades"
              value={facilidades}
              onChange={(event) => onFacilidadesChange(event.target.value)}
              placeholder={copy.facilitiesPlaceholder}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Separe os itens por vírgula.</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-border bg-background/60 p-4">
          <Label htmlFor="status">Publicação inicial</Label>
          <select
            id="status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="active">Publicar agora</option>
            <option value="pending">Salvar para revisar depois</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Você poderá ajustar essas informações depois pela Central da empresa.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2 sm:flex-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="gap-2 sm:flex-1"
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
      </div>
    </section>
  );
}
