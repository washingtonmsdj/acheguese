import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { CHANNEL_KIND_LABELS, type CommunicationChannel } from "../../types";

type VerifiedChannelsSectionProps = {
  channels?: CommunicationChannel[];
};

const mockVerifiedChannels = [
    { id: 1, name: "Portal Nordeste", type: "Portal", followers: "12.5k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v1" },
    { id: 2, name: "Rádio Comunitária", type: "Rádio", followers: "8.3k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v2" },
    { id: 3, name: "Jornal do Bairro", type: "Jornal", followers: "15.8k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v3" },
    { id: 4, name: "TV Comunitária", type: "TV", followers: "6.2k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v4" },
    { id: 5, name: "Coletivo Cultural", type: "Coletivo", followers: "4.1k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v5" },
    { id: 6, name: "Página do Bairro", type: "Página", followers: "9.7k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v6" },
];

export function VerifiedChannelsSection({ channels }: VerifiedChannelsSectionProps) {
  const ssotVerifiedChannels = (channels ?? [])
    .filter((channel) => channel.verification_status === "verified")
    .slice(0, 6)
    .map((channel) => ({
      id: channel.id,
      slug: channel.slug,
      name: channel.public_name,
      type: CHANNEL_KIND_LABELS[channel.channel_kind],
      followers: `${Math.max(1, Math.round(channel.reliability_score / 8))}k`,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${channel.slug || channel.id}`,
    }));

  const verifiedChannels = ssotVerifiedChannels.length ? ssotVerifiedChannels : mockVerifiedChannels;

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Canais Verificados</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Agentes de comunicação aprovados e confiáveis</p>
        </div>
        <Link to="/comunicacao/verificados" className="text-sm font-medium text-primary hover:opacity-80">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {verifiedChannels.map((channel) => (
          <Link key={channel.id} to={`/comunicacao/agente/${channel.slug || channel.id}`}>
            <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="space-y-1.5 sm:space-y-2 md:space-y-3 p-2.5 sm:p-3 md:p-4 text-center">
                <div className="relative inline-block">
                  <Avatar className="mx-auto h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                    <AvatarImage src={channel.avatar} />
                    <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded-full border-2 border-background bg-primary">
                    <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="min-h-[2.2rem] sm:min-h-[2.5rem] md:min-h-[2.8rem] line-clamp-2 text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary">
                    {channel.name}
                  </h3>
                  <Badge variant="secondary" className="mt-1 text-xs">{channel.type}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{channel.followers} seguidores</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
