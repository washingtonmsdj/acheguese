import { useQuery } from "@tanstack/react-query";
import { getUserClassifieds } from "@/modules/classifieds/services";
import type { ClassifiedData } from "@/modules/classifieds/services";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tag, Plus, Edit, Loader2, MapPin, DollarSign } from "lucide-react";

interface UserClassifiedsSectionProps {
  profileId: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
}

export function UserClassifiedsSection({
  profileId,
  onCreateNew,
  onEdit,
}: UserClassifiedsSectionProps) {
  const { data: classifieds = [], isLoading } = useQuery<ClassifiedData[]>({
    queryKey: ["user-classifieds", profileId],
    queryFn: async () => {
      if (!profileId) {
        return [];
      }

      return getUserClassifieds(profileId);
    },
    enabled: Boolean(profileId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (classifieds.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Tag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Nenhum classificado cadastrado</h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            Anuncie produtos, serviços ou oportunidades para sua comunidade.
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Classificado
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeClassifieds = classifieds.filter((classified) => classified.is_active);
  const inactiveClassifieds = classifieds.filter((classified) => !classified.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold font-display">
          <Tag className="h-5 w-5" />
          Meus Classificados
          <Badge variant="secondary">{classifieds.length}</Badge>
        </h2>

        <Button onClick={onCreateNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Classificado
        </Button>
      </div>

      {activeClassifieds.length > 0 && (
        <ClassifiedBlock
          title={`Ativos (${activeClassifieds.length})`}
          classifieds={activeClassifieds}
          onEdit={onEdit}
        />
      )}

      {inactiveClassifieds.length > 0 && (
        <ClassifiedBlock
          title={`Inativos (${inactiveClassifieds.length})`}
          classifieds={inactiveClassifieds}
          onEdit={onEdit}
          inactive
        />
      )}
    </div>
  );
}

function ClassifiedBlock({
  title,
  classifieds,
  onEdit,
  inactive = false,
}: {
  title: string;
  classifieds: ClassifiedData[];
  onEdit: (id: string) => void;
  inactive?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>

      <div className="grid gap-4">
        {classifieds.map((classified) => (
          <Card
            key={classified.id}
            className={inactive ? "opacity-60 hover:opacity-100 transition-opacity" : "hover:shadow-md transition-shadow"}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">
                      {classified.title || "Sem título"}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {classified.description || "Sem descrição"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={inactive ? "secondary" : "default"}>
                      {inactive ? "Inativo" : "Ativo"}
                    </Badge>

                    <Badge variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {classified.category || "Sem categoria"}
                    </Badge>

                    {(classified.neighborhood || classified.location) && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {classified.neighborhood || classified.location}
                      </Badge>
                    )}

                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {classified.price}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(classified.id)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
