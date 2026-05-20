import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Flame, Clock, TrendingUp } from "lucide-react";
import type { AgentPublicationView } from "../../types/agentPageViewModels";

interface AgentWeekHighlightsProps {
  publications: AgentPublicationView[];
}

/**
 * AgentWeekHighlights
 * 
 * Destaques da semana - conteúdo em evidência.
 * Layout editorial premium com cards grandes e visuais.
 */
export function AgentWeekHighlights({ publications }: AgentWeekHighlightsProps) {
  
  // Mock highlights - em produção viria do backend
  const highlights = [
    {
      id: 1,
      title: "Novo projeto de revitalização da praça central é aprovado pela comunidade",
      excerpt: "Moradores participam de assembleia e decidem prioridades para o espaço público",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      category: "Urbanismo",
      readTime: "5 min",
      views: "2.3k",
      trending: true,
    },
    {
      id: 2,
      title: "Festival de cultura local reúne mais de 3 mil pessoas no fim de semana",
      excerpt: "Evento celebrou tradições e talentos da região com shows, gastronomia e arte",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop",
      category: "Cultura",
      readTime: "4 min",
      views: "1.8k",
      trending: true,
    },
    {
      id: 3,
      title: "Novo centro de saúde começa a atender a partir da próxima semana",
      excerpt: "Unidade amplia acesso a serviços médicos e especialidades para a comunidade",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop",
      category: "Saúde",
      readTime: "3 min",
      views: "1.5k",
      trending: false,
    },
  ];

  return (
    <section className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Destaques da Semana
            </h2>
          </div>
          <p className="text-muted-foreground">
            O que está movimentando a região
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Featured Main (2 columns) */}
        <Card className="lg:col-span-2 group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
          <div className="relative h-80 overflow-hidden">
            <img 
              src={highlights[0].image}
              alt={highlights[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/90 backdrop-blur-sm">
                  {highlights[0].category}
                </Badge>
                {highlights[0].trending && (
                  <Badge variant="secondary" className="gap-1 bg-orange-500/90 text-white backdrop-blur-sm">
                    <TrendingUp className="h-3 w-3" />
                    Em alta
                  </Badge>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">
                {highlights[0].title}
              </h3>
              
              <p className="text-slate-200 line-clamp-2">
                {highlights[0].excerpt}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {highlights[0].readTime}
                </span>
                <span>{highlights[0].views} visualizações</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Secondary Highlights */}
        <div className="space-y-6">
          {highlights.slice(1).map((highlight) => (
            <Card key={highlight.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="flex gap-4 p-4">
                <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <img 
                    src={highlight.image}
                    alt={highlight.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {highlight.category}
                    </Badge>
                    {highlight.trending && (
                      <Badge variant="secondary" className="gap-1 text-xs bg-orange-500/10 text-orange-700">
                        <TrendingUp className="h-3 w-3" />
                        Em alta
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {highlight.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {highlight.readTime}
                    </span>
                    <span>{highlight.views} views</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>

    </section>
  );
}
