import { Link } from "react-router-dom";
import { TrendingUp, MapPin, Radio, Calendar, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

export function TerritorialSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Radio className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Tem um canal de comunicacao?</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre seu portal, radio ou coletivo e alcance sua comunidade.
            </p>
          </div>
          <Button className="w-full">Cadastrar canal</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Topicos em Alta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { tag: "#FestaSaoJoao", posts: 234 },
            { tag: "#NovaLinhaBus", posts: 189 },
            { tag: "#ReformaEscola", posts: 156 },
            { tag: "#MobilidadeUrbana", posts: 142 },
            { tag: "#CulturaLocal", posts: 128 },
          ].map((topic, idx) => (
            <Link
              key={idx}
              to={`/comunicacao/topico/${topic.tag.slice(1)}`}
              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{topic.tag}</p>
                <p className="text-xs text-muted-foreground">{topic.posts} publicacoes</p>
              </div>
              <Badge variant="secondary">{idx + 1}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Seu Territorio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Localizacao atual</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs">Alterar</Button>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="font-semibold text-foreground">Nordeste de Amaralina</p>
              <p className="text-xs text-muted-foreground">Salvador, Bahia</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Canais ativos na regiao</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=t${i}`} />
                    <AvatarFallback>C{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">+8 canais</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Proximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Festival de Musica", date: "15 Jun", time: "19h" },
            { title: "Feira de Artesanato", date: "18 Jun", time: "10h" },
            { title: "Cinema na Praca", date: "20 Jun", time: "20h" },
          ].map((event, idx) => (
            <Link
              key={idx}
              to={`/eventos/${idx + 1}`}
              className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                <span className="text-xs font-medium text-primary">{event.date.split(" ")[1]}</span>
                <span className="text-xs text-primary">{event.date.split(" ")[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Alertas Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Interrupcao de agua</p>
                <p className="text-xs text-muted-foreground">Nordeste de Amaralina - ate 18h</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Ver todos os alertas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
