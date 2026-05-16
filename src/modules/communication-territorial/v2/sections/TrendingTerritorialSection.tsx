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
      title: "Nova linha de ônibus conecta Nordeste de Amaralina ao Centro",
      excerpt: "Moradores comemoram a chegada da linha 305 que facilita o deslocamento...",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop",
      likes: 342,
      comments: 87,
      shares: 45,
      timeAgo: "há 2 horas",
    },
    {
      id: 2,
      channel: "Rádio Comunitária",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=t2",
      title: "Festa junina reúne mais de 2 mil pessoas na praça",
      excerpt: "Evento organizado pela comunidade teve apresentações culturais e comidas típicas...",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop",
      likes: 567,
      comments: 123,
      shares: 89,
      timeAgo: "há 4 horas",
    },
    {
      id: 3,
      channel: "Jornal do Bairro",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=t3",
      title: "Prefeitura anuncia reforma de escola municipal",
      excerpt: "Investimento de R$ 2 milhões vai modernizar estrutura e criar novos espaços...",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=250&fit=crop",
      likes: 234,
      comments: 56,
      shares: 34,
      timeAgo: "há 6 horas",
    },
  ];

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Trending Territorial</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">O que está movimentando seu território agora</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {trendingPosts.map((post) => (
          <Link key={post.id} to={`/comunicacao/post/${post.id}`}>
            <Card className="group transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="p-0">
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
                  <div className="h-40 sm:h-44 md:h-auto overflow-hidden rounded-t-lg sm:w-40 md:w-48 sm:rounded-l-lg sm:rounded-tr-none flex-shrink-0">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 p-3 sm:p-4 sm:py-4 sm:pl-0 sm:pr-4">
                    <div className="mb-2 sm:mb-3 flex items-center gap-2">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.channel.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">{post.channel}</p>
                        <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                      </div>
                    </div>
                    <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg md:text-xl font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{post.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{post.comments}</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{post.shares}</span>
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
