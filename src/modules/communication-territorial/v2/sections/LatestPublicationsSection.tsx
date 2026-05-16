import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { PUBLICATION_TYPE_LABELS, type CommunicationPublication } from "../../types";

type LatestPublicationsSectionProps = {
  publications?: CommunicationPublication[];
};

const mockPublications = [
    { id: 1, channel: "Portal Nordeste", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p1", title: "Mutirão de limpeza mobiliza comunidade", category: "Ação Social", time: "há 15 min" },
    { id: 2, channel: "Rádio Comunitária", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p2", title: "Entrevista com artista local sobre novo projeto", category: "Cultura", time: "há 30 min" },
    { id: 3, channel: "Jornal do Bairro", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p3", title: "Novo posto de saúde será inaugurado em agosto", category: "Saúde", time: "há 1 hora" },
    { id: 4, channel: "Coletivo Cultural", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p4", title: "Oficina gratuita de grafite para jovens", category: "Educação", time: "há 2 horas" },
    { id: 5, channel: "TV Comunitária", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p5", title: "Reportagem especial sobre mobilidade urbana", category: "Mobilidade", time: "há 3 horas" },
    { id: 6, channel: "Página do Bairro", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=p6", title: "Feira de economia solidária acontece no fim de semana", category: "Economia", time: "há 4 horas" },
];

function formatTimeAgo(value?: string | null): string {
  if (!value) return "agora";
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(ms / 60000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `há ${hours} hora${hours > 1 ? "s" : ""}`;
}

export function LatestPublicationsSection({ publications: ssotPublications }: LatestPublicationsSectionProps) {
  const publications = (ssotPublications ?? []).length
    ? (ssotPublications ?? []).slice(0, 6).map((pub) => ({
        id: pub.id,
        channel: pub.channel?.public_name ?? "Canal",
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${pub.channel?.slug || pub.channel_id}`,
        title: pub.title,
        category: PUBLICATION_TYPE_LABELS[pub.publication_type],
        time: formatTimeAgo(pub.published_at ?? pub.created_at),
      }))
    : mockPublications;

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Últimas Publicações</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Conteúdo mais recente dos canais do seu território</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {publications.map((pub) => (
          <Link key={pub.id} to={`/comunicacao/post/${pub.id}`}>
            <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="space-y-2 sm:space-y-2.5 md:space-y-3 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarImage src={pub.avatar} />
                    <AvatarFallback>{pub.channel.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-medium text-foreground">{pub.channel}</p>
                    <p className="text-xs text-muted-foreground">{pub.time}</p>
                  </div>
                </div>
                <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground transition-colors group-hover:text-primary min-h-[2.5rem] sm:min-h-[3rem]">
                  {pub.title}
                </h3>
                <Badge variant="secondary" className="text-xs">{pub.category}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
