import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";

export function VerifiedChannelsSection() {
  const verifiedChannels = [
    { id: 1, name: "Portal Nordeste", type: "Portal", followers: "12.5k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v1" },
    { id: 2, name: "Radio Comunitaria", type: "Radio", followers: "8.3k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v2" },
    { id: 3, name: "Jornal do Bairro", type: "Jornal", followers: "15.8k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v3" },
    { id: 4, name: "TV Comunitaria", type: "TV", followers: "6.2k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v4" },
    { id: 5, name: "Coletivo Cultural", type: "Coletivo", followers: "4.1k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v5" },
    { id: 6, name: "Pagina do Bairro", type: "Pagina", followers: "9.7k", avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=v6" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Canais Verificados</h2>
          </div>
          <p className="text-muted-foreground">Agentes de comunicacao aprovados e confiaveis</p>
        </div>
        <Link to="/comunicacao/verificados" className="text-sm font-medium text-primary hover:opacity-80">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {verifiedChannels.map((channel) => (
          <Link key={channel.id} to={`/comunicacao/empresa/${channel.id}`}>
            <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="space-y-2 p-3 text-center sm:space-y-3 sm:p-4">
                <div className="relative inline-block">
                  <Avatar className="mx-auto h-14 w-14 sm:h-16 sm:w-16">
                    <AvatarImage src={channel.avatar} />
                    <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary sm:h-6 sm:w-6">
                    <ShieldCheck className="h-3 w-3 text-primary-foreground sm:h-3.5 sm:w-3.5" />
                  </div>
                </div>
                <div>
                  <h3 className="min-h-[2.5rem] line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary sm:min-h-[2.8rem] sm:text-sm">
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
