import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { TrustEventsQueue } from "@/core/admin/components/TrustEventsQueue";

export default function AdminClassificadosDenuncias() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-display">
            Denuncias de comentarios de classificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta pagina usa a trilha canonica de confianca (`trust_events`) para moderacao de
            comentarios/perguntas de anuncios, sem fila paralela.
          </p>
        </CardContent>
      </Card>

      <TrustEventsQueue
        initialContextFilter="classified"
        lockContextFilter
        initialOnlyOpenEvents
        lockOnlyOpenEvents
        initialOnlyClassifiedCommentReports
        lockOnlyClassifiedCommentReports
        hideScoreSummary
      />
    </div>
  );
}

