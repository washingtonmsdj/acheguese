import { Link } from "react-router-dom";
import { Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function CommunitiesInMotionSection() {
  const communities = [
    { id: 1, name: "Nordeste de Amaralina", activeChannels: 12, publications: 45, growth: "+23%", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop" },
    { id: 2, name: "Barra", activeChannels: 8, publications: 32, growth: "+18%", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop" },
    { id: 3, name: "Pelourinho", activeChannels: 15, publications: 67, growth: "+31%", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=300&fit=crop" },
    { id: 4, name: "Rio Vermelho", activeChannels: 10, publications: 38, growth: "+15%", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" },
  ];

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Comunidades em Movimento</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Territórios com maior atividade de comunicação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {communities.map((community) => (
          <Link key={community.id} to={`/comunicacao/ba/salvador/${community.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <Card className="group overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
                <img src={community.image} alt={community.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <Badge className="absolute right-2 top-2 border-0 bg-primary text-primary-foreground text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {community.growth}
                </Badge>
                <h3 className="absolute bottom-2 left-2 text-sm sm:text-base font-bold text-primary-foreground">{community.name}</h3>
              </div>
              <CardContent className="p-2.5 sm:p-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">{community.activeChannels} canais</span>
                  <span className="text-muted-foreground">{community.publications} posts</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}


