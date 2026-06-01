import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  getServiceCategoryIcon,
  getServiceCategoryLabel,
} from "@/modules/professionals/services/domain/professionalCategories";
import type { ProfessionalServiceFormState } from "./CadastrarServicoPage.model";

type CadastrarServicoReviewProps = {
  form: ProfessionalServiceFormState;
  photoPreview: string | null;
};

export function CadastrarServicoReview({
  form,
  photoPreview,
}: CadastrarServicoReviewProps) {
  const CategoryIcon = getServiceCategoryIcon(form.category);
  const categoryLabel = getServiceCategoryLabel(form.category) || form.category;

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revise seu cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center">
                <CategoryIcon className="h-7 w-7 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-bold">{form.name || "Seu nome"}</h3>
              <p className="text-sm text-primary font-medium">
                {form.subcategory || "Título do serviço"}
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                <CategoryIcon className="mr-1 h-3.5 w-3.5" />
                {categoryLabel}
              </Badge>
            </div>
          </div>

          <Separator />

          {form.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Descrição
              </p>
              <p className="text-sm">{form.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {form.experienceYears && (
              <div>
                <p className="text-xs text-muted-foreground">Experiência</p>
                <p className="font-medium">{form.experienceYears} anos</p>
              </div>
            )}
            {form.priceRange && (
              <div>
                <p className="text-xs text-muted-foreground">Preço</p>
                <p className="font-medium">{form.priceRange}</p>
              </div>
            )}
            {form.availableHours && (
              <div>
                <p className="text-xs text-muted-foreground">Horário</p>
                <p className="font-medium">{form.availableHours}</p>
              </div>
            )}
            {form.education && (
              <div>
                <p className="text-xs text-muted-foreground">Formação</p>
                <p className="font-medium">{form.education}</p>
              </div>
            )}
          </div>

          {form.serviceAreas.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Bairros atendidos
              </p>
              <div className="flex flex-wrap gap-1">
                {form.serviceAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {form.phone && (
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium">{form.phone}</p>
              </div>
            )}
            {form.whatsapp && (
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{form.whatsapp}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Ao cadastrar, seu perfil profissional ficará disponível para a
        comunidade.
      </p>
    </>
  );
}
