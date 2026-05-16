import { Link } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function PublicUtilitySection() {
  const utilities = [
    { id: 1, title: "Interrupção no fornecimento de água", type: "Alerta", priority: "high", time: "há 30 min", area: "Nordeste de Amaralina" },
    { id: 2, title: "Vacinação contra gripe disponível", type: "Saúde", priority: "medium", time: "há 2 horas", area: "Todos os bairros" },
    { id: 3, title: "Alteração no itinerário de ônibus", type: "Transporte", priority: "medium", time: "há 4 horas", area: "Linha 305" },
    { id: 4, title: "Inscrições abertas para curso gratuito", type: "Educação", priority: "low", time: "há 6 horas", area: "Centro Cultural" },
  ];

  const priorityTone = {
    high: "bg-primary",
    medium: "bg-secondary",
    low: "bg-muted-foreground",
  } as const;

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Utilidade Pública</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Avisos e informações importantes para a comunidade</p>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {utilities.map((item) => (
          <Link key={item.id} to={`/comunicacao/utilidade/${item.id}`}>
            <Card className="group transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className={`h-8 w-8 sm:h-10 sm:w-10 ${priorityTone[item.priority as keyof typeof priorityTone]} flex-shrink-0 rounded-full flex items-center justify-center`}>
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <h3 className="mb-1 text-sm sm:text-base font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.area}</p>
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
