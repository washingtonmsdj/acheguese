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
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revise seu cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview do profissional"
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
                <CategoryIcon className="h-8 w-8 text-primary" />
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {form.name || "Seu nome"}
                </h3>
                <p className="text-sm font-medium text-primary">
                  {form.subcategory || "Titulo do servico"}
                </p>
              </div>

              <Badge variant="outline" className="w-fit gap-1 text-xs">
                <CategoryIcon className="h-3.5 w-3.5" />
                {categoryLabel}
              </Badge>
            </div>
          </div>

          <Separator />

          {form.description ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Descricao
              </p>
              <p className="text-sm leading-6 text-foreground">{form.description}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {form.experienceYears ? (
              <div>
                <p className="text-xs text-muted-foreground">Experiencia</p>
                <p className="font-medium">{form.experienceYears} anos</p>
              </div>
            ) : null}
            {form.priceRange ? (
              <div>
                <p className="text-xs text-muted-foreground">Preco</p>
                <p className="font-medium">{form.priceRange}</p>
              </div>
            ) : null}
            {form.availableHours ? (
              <div>
                <p className="text-xs text-muted-foreground">Horario</p>
                <p className="font-medium">{form.availableHours}</p>
              </div>
            ) : null}
            {form.education ? (
              <div>
                <p className="text-xs text-muted-foreground">Formacao</p>
                <p className="font-medium">{form.education}</p>
              </div>
            ) : null}
          </div>

          {form.serviceAreaLocationIds.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Bairros atendidos</p>
              <div className="flex flex-wrap gap-2">
                {serviceAreaOptions
                  .filter((area) => form.serviceAreaLocationIds.includes(area.id))
                  .map((area) => (
                    <Badge key={area.id} variant="secondary" className="text-xs">
                      {area.name}
                    </Badge>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {form.phone ? (
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium">{form.phone}</p>
              </div>
            ) : null}
            {form.whatsapp ? (
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{form.whatsapp}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-border/70 bg-background/30 px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
        Ao cadastrar, seu perfil profissional ficara disponivel para a comunidade.
      </div>
    </div>
  );
}
