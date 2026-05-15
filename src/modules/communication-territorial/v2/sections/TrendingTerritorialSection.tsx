import { Link } from "react-router-dom";
import { TrendingUp, MessageCircle, Heart, Share2 } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

export function TrendingTerritorialSection() {
  const trendingPosts = [
    {
      id: 1,
      channel: "Portal Nordeste",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=t1",
      title: "Nova linha de onibus conecta Nordeste de Amaralina ao Centro",
      excerpt: "Moradores comemoram a chegada da linha 305 que facilita o deslocamento...",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop",
      likes: 342,
      comments: 87,
      shares: 45,
      timeAgo: "ha 2 horas",
    },
    {
      id: 2,
      channel: "Radio Comunitaria",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=t2",
      title: "Festa junina reune mais de 2 mil pessoas na praca",
      excerpt: "Evento organizado pela comunidade teve apresentacoes culturais e comidas tipicas...",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop",
      likes: 567,
      comments: 123,
      shares: 89,
      timeAgo: "ha 4 horas",
    },
    {
      id: 3,
      channel: "Jornal do Bairro",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=t3",
      title: "Prefeitura anuncia reforma de escola municipal",
      excerpt: "Investimento de R$ 2 milhoes vai modernizar estrutura e criar novos espacos...",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=250&fit=crop",
      likes: 234,
      comments: 56,
      shares: 34,
      timeAgo: "ha 6 horas",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Trending Territorial</h2>
          </div>
          <p className="text-muted-foreground">O que esta movimentando seu territorio agora</p>
        </div>
      </div>

      <div className="space-y-4">
        {trendingPosts.map((post) => (
          <Link key={post.id} to={`/comunicacao/post/${post.id}`}>
            <Card className="group transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="h-48 overflow-hidden rounded-t-lg sm:h-auto sm:w-48 sm:rounded-l-lg sm:rounded-tr-none">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 p-4 sm:py-4 sm:pl-0 sm:pr-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.channel.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{post.channel}</p>
                        <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{post.comments}</span>
                      <span className="flex items-center gap-1"><Share2 className="h-4 w-4" />{post.shares}</span>
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
