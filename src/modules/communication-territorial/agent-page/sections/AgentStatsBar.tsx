import { Card } from "@/shared/components/ui/card";
import { 
  Users, 
  MapPin, 
  FileText, 
  Calendar,
  TrendingUp,
  Eye,
  Heart,
  Share2
} from "lucide-react";
import type {
  AgentChannelView,
  AgentPublicationView,
  AgentTerritoryView,
} from "../../types/agentPageViewModels";

interface AgentStatsBarProps {
  agent: AgentChannelView;
  publications: AgentPublicationView[];
  territories: AgentTerritoryView[];
}

/**
 * AgentStatsBar
 * 
 * Barra de estatísticas principais do agente.
 * Indicadores de atividade, alcance e engajamento.
 */
export function AgentStatsBar({ agent, publications, territories }: AgentStatsBarProps) {
  
  const stats = [
    {
      icon: Users,
      label: "Seguidores",
      value: "12.5k",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      icon: MapPin,
      label: "Alcance Territorial",
      value: `${territories.length} comunidades`,
      trend: "Ativo",
      trendUp: true,
    },
    {
      icon: FileText,
      label: "Publicações",
      value: publications.length.toString(),
      trend: "Esta semana: 12",
      trendUp: true,
    },
    {
      icon: Calendar,
      label: "Eventos Divulgados",
      value: "24",
      trend: "Este mês",
      trendUp: true,
    },
    {
      icon: Eye,
      label: "Visualizações",
      value: "45.2k",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      icon: Heart,
      label: "Engajamento",
      value: "3.8k",
      trend: "+5.3%",
      trendUp: true,
    },
    {
      icon: Share2,
      label: "Compartilhamentos",
      value: "1.2k",
      trend: "+18.7%",
      trendUp: true,
    },
    {
      icon: TrendingUp,
      label: "Confiabilidade",
      value: agent.reliability_score,
      trend: "Verificado",
      trendUp: true,
    },
  ];

  return (
    <section className="border-y bg-white shadow-sm sticky top-0 z-30 backdrop-blur-lg bg-white/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Desktop: Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 min-w-max lg:justify-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-bold text-foreground">
                        {stat.value}
                      </p>
                      {stat.trend && (
                        <span className={`text-xs font-medium ${
                          stat.trendUp ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {stat.trend}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
