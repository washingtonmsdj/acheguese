import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { FileText, Clock, Eye, MessageSquare, Share2, Bookmark } from "lucide-react";
import type { AgentChannelView, AgentPublicationView } from "../../types/agentPageViewModels";

interface AgentLatestPublicationsProps {
  publications: AgentPublicationView[];
  agent: AgentChannelView;
}

type PublicationDisplayItem = {
  id: string | number;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  views: number;
  comments: number;
  image?: string;
};

export function AgentLatestPublications({ publications, agent }: AgentLatestPublicationsProps) {
  // Mock data para demonstração
  const mockPublications: PublicationDisplayItem[] = [
    {
      id: 1,
      title: "Prefeitura anuncia obras de infraestrutura para o bairro",
      excerpt: "Investimento de R$ 2 milhões contemplará pavimentação, drenagem e iluminação pública em diversas ruas da região.",
      category: "Infraestrutura",
      publishedAt: "Há 2 horas",
      views: 1234,
      comments: 45,
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Escola municipal recebe prêmio de excelência educacional",
      excerpt: "Instituição foi reconhecida por projeto inovador de ensino que integra tecnologia e práticas sustentáveis.",
      category: "Educação",
      publishedAt: "Há 5 horas",
      views: 892,
      comments: 23,
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Feira de agricultura familiar acontece neste sábado",
      excerpt: "Produtores locais oferecerão produtos orgânicos e artesanais na praça central, das 7h às 13h.",
      category: "Economia Local",
      publishedAt: "Há 8 horas",
      views: 654,
      comments: 12,
      image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop",
    },
  ];

  const ssotPublications: PublicationDisplayItem[] = publications.map((pub) => ({
    id: pub.id,
    title: pub.title || "Publicacao",
    excerpt: pub.summary || pub.body || "",
    category: pub.publication_type || "Conteudo",
    publishedAt: pub.published_at ? new Date(pub.published_at).toLocaleString("pt-BR") : "Recente",
    views: 0,
    comments: 0,
  }));
  const displayPublications = ssotPublications.length > 0 ? ssotPublications : mockPublications;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">Últimas Publicações</h2>
          </div>
          <p className="text-muted-foreground">Feed editorial atualizado</p>
        </div>
        <Button variant="outline">Ver todas</Button>
      </div>

      <div className="space-y-4">
        {displayPublications.slice(0, 5).map((pub) => (
          <Card key={pub.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {pub.image && (
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden sm:rounded-l-lg">
                    <img 
                      src={pub.image}
                      alt={pub.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                
                <div className="flex-1 p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{pub.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pub.publishedAt}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {pub.title}
                    </h3>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {pub.excerpt}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {pub.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {pub.comments}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
