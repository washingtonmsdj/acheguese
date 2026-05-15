import { Link } from "react-router-dom";
import { Play, Eye } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function MultimediaContentSection() {
  const videos = [
    { id: 1, title: "Documentario: Historia do Nordeste de Amaralina", channel: "TV Comunitaria", views: "2.3k", duration: "15:42", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=250&fit=crop" },
    { id: 2, title: "Entrevista com artista local", channel: "Radio Comunitaria", views: "1.8k", duration: "22:15", thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=250&fit=crop" },
    { id: 3, title: "Cobertura: Festa Junina 2024", channel: "Portal Nordeste", views: "3.1k", duration: "18:30", thumbnail: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop" },
    { id: 4, title: "Tutorial: Como participar das acoes comunitarias", channel: "Coletivo Cultural", views: "956", duration: "8:45", thumbnail: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Conteudo Multimedia</h2>
          </div>
          <p className="text-muted-foreground">Videos e podcasts produzidos pela comunidade</p>
        </div>
        <Link to="/comunicacao/videos" className="text-sm font-medium text-primary hover:opacity-80">Ver todos</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <Link key={video.id} to={`/comunicacao/video/${video.id}`}>
            <Card className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-6 w-6 text-primary-foreground" fill="currentColor" />
                  </div>
                </div>
                <Badge className="absolute bottom-2 right-2 border-0 bg-foreground text-xs text-background">
                  {video.duration}
                </Badge>
              </div>
              <CardContent className="space-y-2 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{video.channel}</span>
                  <span className="flex flex-shrink-0 items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {video.views}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
