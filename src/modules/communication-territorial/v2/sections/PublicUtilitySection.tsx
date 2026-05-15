import { Link } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function PublicUtilitySection() {
  const utilities = [
    { id: 1, title: "Interrupcao no fornecimento de agua", type: "Alerta", priority: "high", time: "ha 30 min", area: "Nordeste de Amaralina" },
    { id: 2, title: "Vacinacao contra gripe disponivel", type: "Saude", priority: "medium", time: "ha 2 horas", area: "Todos os bairros" },
    { id: 3, title: "Alteracao no itinerario de onibus", type: "Transporte", priority: "medium", time: "ha 4 horas", area: "Linha 305" },
    { id: 4, title: "Inscricoes abertas para curso gratuito", type: "Educacao", priority: "low", time: "ha 6 horas", area: "Centro Cultural" },
  ];

  const priorityTone = {
    high: "bg-primary",
    medium: "bg-secondary",
    low: "bg-muted-foreground",
  } as const;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Utilidade Publica</h2>
          </div>
          <p className="text-muted-foreground">Avisos e informacoes importantes para a comunidade</p>
        </div>
      </div>

      <div className="space-y-3">
        {utilities.map((item) => (
          <Link key={item.id} to={`/comunicacao/utilidade/${item.id}`}>
            <Card className="group transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 ${priorityTone[item.priority as keyof typeof priorityTone]} flex-shrink-0 rounded-full flex items-center justify-center`}>
                    <Info className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.area}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
