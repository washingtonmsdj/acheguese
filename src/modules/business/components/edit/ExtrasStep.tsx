import {
  ArrowLeft,
  CreditCard,
  Globe2,
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PAYMENT_METHODS } from "@/core/business/constants";
import { getBusinessCreateFieldCopy } from "@/modules/business/components/create/businessCreateCopy";

const FORMAS_PAGAMENTO = PAYMENT_METHODS.map(({ label }) => label);

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
    <section className="overflow-hidden rounded-[26px] border border-territory-border bg-territory-surface">
      <div className="border-b border-territory-border bg-gradient-to-br from-territory-brand/10 via-territory-surface to-territory-surface px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-territory-brand/10 text-territory-brand">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-territory-brand/80">
              Etapa 3
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-territory-ink">
              Apresentação e detalhes
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-territory-muted">
              Finalize a vitrine da empresa com imagem, canais digitais e informações úteis para clientes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-[22px] border border-territory-border bg-territory-raised/70 p-4">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-territory-brand" />
            <Label className="text-sm font-semibold text-territory-ink">Imagem de capa</Label>
          </div>
          <p className="mt-1 text-sm leading-5 text-territory-muted">
            Use uma imagem horizontal que represente bem o ambiente, produto ou serviço da empresa.
          </p>

          {capaPreview ? (
            <div className="mt-4 overflow-hidden rounded-[18px] border border-territory-border bg-territory-raised">
              <img src={capaPreview} alt="Capa da empresa" className="h-36 w-full object-cover sm:h-44" />
            </div>
          ) : (
            <div className="mt-4 flex h-32 items-center justify-center rounded-[18px] border border-dashed border-territory-border bg-territory-raised/30 text-territory-muted">
              <div className="text-center">
                <ImagePlus className="mx-auto h-6 w-6" />
                <p className="mt-2 text-xs">Nenhuma capa adicionada</p>
              </div>
            </div>
          )}

          <input
            ref={capaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCapaChange}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => capaRef.current?.click()}
              disabled={uploading}
              className="gap-2 rounded-xl border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : capaPreview ? "Trocar capa" : "Adicionar capa"}
            </Button>
            <p className="text-xs text-territory-muted">Recomendado: 1200×400 px · até 5 MB.</p>
          </div>
        </div>

        <div className="border-t border-territory-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-territory-brand" />
            <div>
              <h3 className="text-sm font-semibold text-territory-ink">Canais digitais</h3>
              <p className="mt-0.5 text-xs text-territory-muted">
                Adicione somente canais que você mantém atualizados.
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            <Input
              placeholder={copy.websitePlaceholder}
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
            <Input
              placeholder={copy.instagramPlaceholder}
              value={instagram}
              onChange={(e) => onInstagramChange(e.target.value)}
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
            <Input
              placeholder={copy.facebookPlaceholder}
              value={facebook}
              onChange={(e) => onFacebookChange(e.target.value)}
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
          </div>
        </div>

        <div className="border-t border-territory-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-territory-brand" />
            <div>
              <h3 className="text-sm font-semibold text-territory-ink">Formas de pagamento</h3>
              <p className="mt-0.5 text-xs text-territory-muted">
                Marque as opções aceitas pela empresa atualmente.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FORMAS_PAGAMENTO.map((forma) => {
              const checked = selectedPagamentos.includes(forma);
              return (
                <label
                  key={forma}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm transition-colors",
                    checked
                      ? "border-territory-brand/25 bg-territory-brand/[0.06] text-territory-ink"
                      : "border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised/70",
                  ].join(" ")}
                >
                  <Checkbox
                    id={forma}
                    checked={checked}
                    className="border-territory-border data-[state=checked]:bg-territory-brand data-[state=checked]:text-territory-on-image"
                    onCheckedChange={(nextChecked) => {
                      if (nextChecked) {
                        onPagamentosChange(Array.from(new Set([...selectedPagamentos, forma])));
                      } else {
                        onPagamentosChange(selectedPagamentos.filter((f) => f !== forma));
                      }
                    }}
                  />
                  <span className="font-medium">{forma}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-t border-territory-border pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="especialidades">Especialidades</Label>
            <Input
              id="especialidades"
              value={especialidades}
              onChange={(e) => onEspecialidadesChange(e.target.value)}
              placeholder={copy.specialtiesPlaceholder}
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
            <p className="text-xs leading-5 text-territory-muted">Separe vários itens por vírgula.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilidades">Facilidades</Label>
            <Input
              id="facilidades"
              value={facilidades}
              onChange={(e) => onFacilidadesChange(e.target.value)}
              placeholder={copy.facilitiesPlaceholder}
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
            <p className="text-xs leading-5 text-territory-muted">Ex.: estacionamento, acessibilidade, Wi-Fi.</p>
          </div>
        </div>

        <div className="business-edit-actions flex flex-col-reverse gap-3 border-t border-territory-border pt-5 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-xl border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:min-w-32"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="gap-2 rounded-xl bg-territory-sun text-territory-ink hover:bg-territory-sun/90 sm:min-w-44"
          >
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
      </div>
    </section>
  );
}
