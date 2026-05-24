import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { CHANNEL_KIND_LABELS, type CommunicationChannel } from "../types";

type VerifiedChannelsSectionProps = {
  channels?: CommunicationChannel[];
};

export function VerifiedChannelsSection({ channels = [] }: VerifiedChannelsSectionProps) {
  const verifiedChannels = channels
    .filter((channel) => channel.verification_status === "verified")
    .slice(0, 6);

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <ShieldCheck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Canais verificados</h2>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Agentes de comunicação aprovados pela governança da plataforma.
          </p>
        </div>
        <Link to="/comunicacao/solicitar" className="text-sm font-medium text-primary hover:opacity-80">
          Solicitar verificação
        </Link>
      </div>

      {verifiedChannels.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {verifiedChannels.map((channel) => (
            <Link key={channel.id} to={`/comunicacao/agente/${channel.slug}`}>
              <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                <CardContent className="space-y-1.5 p-2.5 text-center sm:space-y-2 sm:p-3 md:space-y-3 md:p-4">
                  <div className="relative inline-block">
                    <Avatar className="mx-auto h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                      <AvatarFallback>{channel.public_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary sm:-bottom-1 sm:-right-1 sm:h-5 sm:w-5 md:h-6 md:w-6">
                      <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="line-clamp-2 min-h-[2.2rem] text-xs font-semibold text-foreground group-hover:text-primary sm:min-h-[2.5rem] sm:text-sm md:min-h-[2.8rem]">
                      {channel.public_name}
                    </h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {CHANNEL_KIND_LABELS[channel.channel_kind]}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Confiabilidade {channel.reliability_score}/100
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum canal verificado ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Canais aprovados serão exibidos automaticamente quando houver dados reais.
          </p>
        </div>
      )}
    </section>
  );
}
