import { BadgeCheck, Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { SafeImage } from "@/shared/components/security/SafeImage";
import { getServiceCategoryIcon } from "@/modules/professionals/services/domain/professionalCategories";
import type { ProfessionalData } from "@/modules/professionals/services/hooks/useProfessionalDetail";

interface ProfessionalHeaderProps {
  professional: ProfessionalData;
}

export function ProfessionalHeader({ professional }: ProfessionalHeaderProps) {
  const CategoryIcon = getServiceCategoryIcon(professional.category);

  return (
    <div className="relative">
      {professional.banner_url ? (
        <div className="h-32 w-full overflow-hidden">
          <SafeImage
            src={professional.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
      )}

      <div
        className={`px-4 ${professional.banner_url ? "-mt-12" : "-mt-4"} pb-4 flex flex-col items-center text-center relative z-10`}
      >
        {professional.photo ? (
          <SafeImage
            src={professional.photo}
            alt={professional.name}
            className="h-24 w-24 rounded-2xl object-cover border-4 border-background shadow-lg mb-3"
          />
        ) : (
          <div className="h-24 w-24 rounded-2xl bg-secondary border-4 border-background shadow-lg flex items-center justify-center mb-3">
            <CategoryIcon className="h-10 w-10 text-primary" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold font-display">
            {professional.name}
          </h2>
          {professional.is_verified && (
            <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />
          )}
        </div>

        <p className="text-sm text-primary font-medium">
          {professional.service}
        </p>

        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap justify-center">
          <span className="flex items-center gap-0.5">
            <Star className="h-4 w-4 text-warning fill-warning" />
            {professional.rating ? professional.rating.toFixed(1) : "0.0"} (
            {professional.total_avaliacoes})
          </span>
          {professional.neighborhood && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-4 w-4" />
              {professional.neighborhood}
              {professional.city && `, ${professional.city}`}
            </span>
          )}
          {professional.experience_years && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-4 w-4" />
              {professional.experience_years} anos
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {professional.price_medio && (
            <Badge variant="secondary" className="text-xs font-semibold">
              {professional.price_medio}
            </Badge>
          )}
          {professional.is_accepting_clients ? (
            <Badge className="bg-success/10 text-success border-success/20 text-xs">
              Aceitando clientes
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Indisponível
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
