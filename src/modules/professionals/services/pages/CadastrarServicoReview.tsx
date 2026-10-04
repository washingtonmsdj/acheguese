import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  getServiceCategoryIcon,
  getServiceCategoryLabel,
} from "@/modules/professionals/services/domain/professionalCategories";
import type { ServiceAreaOption } from "@/modules/professionals/services/hooks/useServiceAreaOptions";
import type { ProfessionalServiceFormState } from "./CadastrarServicoPage.model";

type CadastrarServicoReviewProps = {
  form: ProfessionalServiceFormState;
  photoPreview: string | null;
  serviceAreaOptions: ServiceAreaOption[];
};

export function CadastrarServicoReview({
  form,
  photoPreview,
  serviceAreaOptions,
}: CadastrarServicoReviewProps) {
  const CategoryIcon = getServiceCategoryIcon(form.category);
  const categoryLabel = getServiceCategoryLabel(form.category) || form.category;

  return (
    <div className="space-y-5 text-territory-ink">
      <Card className="border-territory-brand/20 bg-territory-brand/5 text-territory-ink shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-territory-ink">Revise seu cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Prévia do profissional"
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-territory-raised">
                <CategoryIcon className="h-8 w-8 text-territory-brand" aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-territory-ink">
                  {form.name || "Seu nome"}
                </h3>
                <p className="text-sm font-medium text-territory-brand">
                  {form.subcategory || "Título do serviço"}
                </p>
              </div>

              <Badge
                variant="outline"
                className="w-fit gap-1 border-territory-border bg-territory-surface text-xs text-territory-ink"
              >
                <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {categoryLabel}
              </Badge>
            </div>
          </div>

          <Separator className="bg-territory-border" />

          {form.description ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-territory-muted">
                Descrição
              </p>
              <p className="text-sm leading-6 text-territory-ink">{form.description}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {form.experienceYears ? (
              <div>
                <p className="text-xs text-territory-muted">Experiência</p>
                <p className="font-medium text-territory-ink">{form.experienceYears} anos</p>
              </div>
            ) : null}
            {form.priceRange ? (
              <div>
                <p className="text-xs text-territory-muted">Preço</p>
                <p className="font-medium text-territory-ink">{form.priceRange}</p>
              </div>
            ) : null}
            {form.availableHours ? (
              <div>
                <p className="text-xs text-territory-muted">Horário</p>
                <p className="font-medium text-territory-ink">{form.availableHours}</p>
              </div>
            ) : null}
            {form.education ? (
              <div>
                <p className="text-xs text-territory-muted">Formação</p>
                <p className="font-medium text-territory-ink">{form.education}</p>
              </div>
            ) : null}
          </div>

          {form.serviceAreaLocationIds.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-territory-muted">Bairros atendidos</p>
              <div className="flex flex-wrap gap-2">
                {serviceAreaOptions
                  .filter((area) => form.serviceAreaLocationIds.includes(area.id))
                  .map((area) => (
                    <Badge
                      key={area.id}
                      variant="secondary"
                      className="bg-territory-raised text-xs text-territory-ink"
                    >
                      {area.name}
                    </Badge>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {form.phone ? (
              <div>
                <p className="text-xs text-territory-muted">Telefone</p>
                <p className="font-medium text-territory-ink">{form.phone}</p>
              </div>
            ) : null}
            {form.whatsapp ? (
              <div>
                <p className="text-xs text-territory-muted">WhatsApp</p>
                <p className="font-medium text-territory-ink">{form.whatsapp}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-territory-border bg-territory-surface/70 px-4 py-3 text-center text-xs leading-5 text-territory-muted">
        Ao cadastrar, seu perfil profissional ficará disponível para a comunidade.
      </div>
    </div>
  );
}
