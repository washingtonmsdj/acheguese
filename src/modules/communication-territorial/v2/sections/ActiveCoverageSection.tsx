import { Link } from "react-router-dom";
import { Radio, MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

export function ActiveCoverageSection() {
  const activeCoverage = [
    {
      id: 1,
      title: "Festa de Sao Joao no Nordeste de Amaralina",
      channel: "Portal Nordeste",
      channelAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=portal1",
      location: "Nordeste de Amaralina",
      startedAt: "ha 45 minutos",
      viewers: 234,
      type: "Ao Vivo",
      thumbnail: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Inauguracao da nova praca comunitaria",
      channel: "Radio Comunitaria",
      channelAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=radio1",
      location: "Barra",
      startedAt: "ha 20 minutos",
      viewers: 156,
      type: "Ao Vivo",
      thumbnail: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Entrevista com lider comunitario sobre mobilidade",
      channel: "Jornal do Bairro",
      channelAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=jornal1",
      location: "Salvador",
      startedAt: "ha 10 minutos",
      viewers: 89,
      type: "Ao Vivo",
      thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Cobertura Ativa Agora</h2>
          </div>
          <p className="text-muted-foreground">Acompanhe o que esta acontecendo no seu territorio em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {activeCoverage.map((coverage) => (
          <Link key={coverage.id} to={`/comunicacao/cobertura/${coverage.id}`}>
            <Card className="group overflow-hidden border-2 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <div className="relative h-40 overflow-hidden">
                <img src={coverage.thumbnail} alt={coverage.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <Badge className="absolute left-2 top-2 border-0 bg-primary text-primary-foreground shadow-lg">
                  <Radio className="mr-1 h-3 w-3 animate-pulse" />
                  {coverage.type}
                </Badge>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
                  <Users className="h-3 w-3 text-primary-foreground" />
                  <span className="text-xs font-medium text-primary-foreground">{coverage.viewers}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-primary-foreground">{coverage.title}</h3>
                </div>
              </div>

              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={coverage.channelAvatar} />
                    <AvatarFallback>{coverage.channel.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{coverage.channel}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {coverage.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {coverage.startedAt}
                      </span>
                    </div>
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
