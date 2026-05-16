import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

export function LocalNewsSection() {
  const news = [
    { id: 1, title: "Prefeitura anuncia obras de infraestrutura", excerpt: "Investimento de R$ 5 milhões em melhorias urbanas", time: "há 1 hora", source: "Jornal do Bairro" },
    { id: 2, title: "Escola municipal recebe prêmio nacional", excerpt: "Projeto de educação ambiental é reconhecido", time: "há 3 horas", source: "Portal Nordeste" },
    { id: 3, title: "Nova ciclovia conecta bairros", excerpt: "Mobilidade sustentável ganha reforço na região", time: "há 5 horas", source: "Rádio Comunitária" },
    { id: 4, title: "Campanha de vacinação é prorrogada", excerpt: "Postos de saúde funcionam em horário estendido", time: "há 7 horas", source: "TV Comunitária" },
  ];

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
            <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Notícias Locais</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Informação que impacta seu dia a dia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {news.map((item) => (
          <Link key={item.id} to={`/comunicacao/noticia/${item.id}`}>
            <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="space-y-1.5 sm:space-y-2 p-3 sm:p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{item.source}</span>
                  <span className="flex-shrink-0">{item.time}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
