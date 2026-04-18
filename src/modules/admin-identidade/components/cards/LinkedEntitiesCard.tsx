/**
 * LinkedEntitiesCard Component
 * 
 * Card de entidades vinculadas
 */

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { LinkedEntitiesCardProps } from "../../sections/types";
import { label } from "../../utils";

export function LinkedEntitiesCard({ entities }: LinkedEntitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vinculos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {entities.length ? (
          entities.map((entity) => (
            <div key={`${entity.kind}-${entity.id}`} className="rounded-lg border p-3">
              <div className="font-medium">{entity.title}</div>
              <div className="text-muted-foreground">{entity.subtitle || label(entity.kind)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{entity.status}</Badge>
                {entity.metadata.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
            Nenhuma entidade vinculada.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
