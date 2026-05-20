import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import type { AgentChannelView, AgentTerritoryView } from "../../types/agentPageViewModels";
import { 
  ShieldCheck, 
  MapPin, 
  Bell, 
  Share2, 
  MessageSquare,
  Radio,
  Newspaper,
  Tv,
  Megaphone,
  Sparkles,
  Settings
} from "lucide-react";

interface AgentHeroSectionProps {
  agent: AgentChannelView;
  territories: AgentTerritoryView[];
  isChannelManager?: boolean;
}

/**
 * AgentHeroSection
 * 
 * Hero principal com capa forte e dinâmica.
 * Transmite identidade de portal moderno e mídia territorial ativa.
 */
export function AgentHeroSection({ agent, territories, isChannelManager }: AgentHeroSectionProps) {
  const navigate = useNavigate();
  
  // Ícone baseado no tipo de canal
  const getChannelIcon = (kind: string) => {
    const iconClass = "h-6 w-6";
    switch (kind) {
      case "radio": return <Radio className={iconClass} />;
      case "newspaper": return <Newspaper className={iconClass} />;
      case "tv": return <Tv className={iconClass} />;
      default: return <Megaphone className={iconClass} />;
    }
  };

  // Comunidade principal (primeira do array)
  const mainTerritory = territories[0]?.location;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl">
          
          {/* Top Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="gap-2 px-3 py-1.5 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              {getChannelIcon(agent.channel_kind)}
              <span className="font-medium">Portal Territorial</span>
            </Badge>
            
            {agent.verification_status === "verified" && (
              <Badge className="gap-2 px-3 py-1.5 bg-primary/90 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
                Verificado
              </Badge>
            )}

            {mainTerritory && (
              <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-white/5 text-white border-white/20 backdrop-blur-sm">
                <MapPin className="h-4 w-4" />
                {mainTerritory.name}
              </Badge>
            )}

            <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-white/5 text-white border-white/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Mídia Comunitária
            </Badge>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 border-4 border-white/20 shadow-2xl ring-4 ring-white/10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${agent.id}`} />
                  <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-primary to-primary/80 text-white">
                    {agent.public_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {agent.verification_status === "verified" && (
                  <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-slate-900 bg-primary shadow-lg">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-6">
              
              {/* Title & Slogan */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {agent.public_name}
                </h1>
                
                {agent.description && (
                  <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
                    {agent.description}
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                {isChannelManager && (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="gap-2 bg-white/90 hover:bg-white text-slate-900 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/central/comunicacao/${agent.slug}`)}
                  >
                    <Settings className="h-5 w-5" />
                    Gerenciar Canal
                  </Button>
                )}
                
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                  <Bell className="h-5 w-5" />
                  Seguir Portal
                </Button>
                
                <Button size="lg" variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                  <MessageSquare className="h-5 w-5" />
                  Enviar Informação
                </Button>
                
                <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </Button>
              </div>

              {/* Quick Stats Preview */}
              {/* 
                NOTA SSOT: Estes valores são mockados para demonstração.
                No schema atual não existem campos de followers/views/engagement.
                Opções futuras:
                1. Adicionar tabela communication_channel_stats
                2. Calcular em tempo real via agregações
                3. Usar serviço de analytics externo
              */}
              <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    {agent.metadata?.mock_stats?.followers
                      ? `${(agent.metadata.mock_stats.followers / 1000).toFixed(1)}k`
                      : '12.5k'}
                  </p>
                  <p className="text-sm text-slate-400">Seguidores</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{territories.length}</p>
                  <p className="text-sm text-slate-400">Comunidades</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">847</p>
                  <p className="text-sm text-slate-400">Publicações</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{agent.reliability_score}</p>
                  <p className="text-sm text-slate-400">Confiabilidade</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>

    </section>
  );
}
