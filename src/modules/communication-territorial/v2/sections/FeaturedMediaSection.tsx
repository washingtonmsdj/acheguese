import { Link } from "react-router-dom";
import { Radio, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { CHANNEL_KIND_LABELS, type CommunicationChannel } from "@/core/communication-territorial";

type FeaturedMediaSectionProps = {
  channels?: CommunicationChannel[];
};

const mockFeaturedMedia = [
    {
      id: 1,
      name: "Portal Nordeste de Amaralina",
      type: "Portal Local",
      description: "Noticias, eventos e cultura do Complexo do Nordeste",
      followers: 12500,
      activeNow: true,
      verified: true,
      coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=portal1",
      recentActivity: "Publicou ha 15 minutos",
      engagement: "Alta",
    },
    {
      id: 2,
      name: "Radio Comunitaria Amaralina",
      type: "Radio",
      description: "A voz da comunidade no ar desde 1998",
      followers: 8300,
      activeNow: true,
      verified: true,
      coverImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=400&fit=crop",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=radio1",
      recentActivity: "Ao vivo agora",
      engagement: "Muito Alta",
    },
    {
      id: 3,
      name: "Coletivo Cultural Barra",
      type: "Coletivo",
      description: "Arte, cultura e resistencia na Barra",
      followers: 5200,
      activeNow: false,
      verified: false,
      coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=coletivo1",
      recentActivity: "Publicou ha 2 horas",
      engagement: "Media",
    },
    {
      id: 4,
      name: "Jornal do Bairro Salvador",
      type: "Jornal Regional",
      description: "Jornalismo local independente e investigativo",
      followers: 15800,
      activeNow: true,
      verified: true,
      coverImage: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=jornal1",
      recentActivity: "Publicou ha 30 minutos",
      engagement: "Muito Alta",
    },
];

export function FeaturedMediaSection({ channels }: FeaturedMediaSectionProps) {
  const ssotFeaturedMedia = (channels ?? []).slice(0, 4).map((channel, idx) => ({
    id: channel.id,
    name: channel.public_name,
    type: CHANNEL_KIND_LABELS[channel.channel_kind],
    description: channel.description,
    followers: Math.max(1000, channel.reliability_score * 120),
    activeNow: channel.status === "active",
    verified: channel.verification_status === "verified",
    coverImage: mockFeaturedMedia[idx % mockFeaturedMedia.length].coverImage,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${channel.slug || channel.id}`,
    recentActivity: "Atualizado recentemente",
    engagement: `Confiabilidade ${channel.reliability_score}/100`,
  }));

  const featuredMedia = ssotFeaturedMedia.length ? ssotFeaturedMedia : mockFeaturedMedia;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Midias em Destaque</h2>
          <p className="mt-1 text-muted-foreground">Agentes de comunicacao mais ativos do seu territorio</p>
        </div>
        <Link to="/comunicacao/explorar" className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
          Ver todos
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {featuredMedia.map((media) => (
          <Link key={media.id} to={`/comunicacao/canal/${media.id}`}>
            <Card className="group h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
              <div className="relative h-40 overflow-hidden sm:h-48">
                <img
                  src={media.coverImage}
                  alt={media.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute right-2 top-2 flex gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
                  {media.activeNow ? (
                    <Badge className="border-0 bg-primary text-primary-foreground shadow-lg text-xs">
                      <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground sm:mr-1.5 sm:h-2 sm:w-2" />
                      Ativo agora
                    </Badge>
                  ) : null}
                  {media.verified ? (
                    <Badge className="border-0 bg-secondary text-secondary-foreground shadow-lg text-xs">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </Badge>
                  ) : null}
                </div>
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                  <img src={media.avatar} alt={media.name} className="h-12 w-12 rounded-xl border-4 border-background shadow-lg sm:h-16 sm:w-16" />
                </div>
              </div>

              <CardContent className="p-4 sm:p-5">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                      {media.name}
                    </h3>
                    <Badge variant="secondary" className="mt-1.5 text-xs">
                      <Radio className="mr-1 h-3 w-3" />
                      {media.type}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{media.description}</p>
                  <div className="flex items-center gap-3 border-t pt-2 text-xs sm:gap-4 sm:text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="font-medium">{media.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>{media.engagement}</span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-xs text-muted-foreground">{media.recentActivity}</span>
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
