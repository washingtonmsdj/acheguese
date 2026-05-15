import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

export function LocalNewsSection() {
  const news = [
    { id: 1, title: "Prefeitura anuncia obras de infraestrutura", excerpt: "Investimento de R$ 5 milhoes em melhorias urbanas", time: "ha 1 hora", source: "Jornal do Bairro" },
    { id: 2, title: "Escola municipal recebe premio nacional", excerpt: "Projeto de educacao ambiental e reconhecido", time: "ha 3 horas", source: "Portal Nordeste" },
    { id: 3, title: "Nova ciclovia conecta bairros", excerpt: "Mobilidade sustentavel ganha reforco na regiao", time: "ha 5 horas", source: "Radio Comunitaria" },
    { id: 4, title: "Campanha de vacinacao e prorrogada", excerpt: "Postos de saude funcionam em horario estendido", time: "ha 7 horas", source: "TV Comunitaria" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Noticias Locais</h2>
          </div>
          <p className="text-muted-foreground">Informacao que impacta seu dia a dia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {news.map((item) => (
          <Link key={item.id} to={`/comunicacao/noticia/${item.id}`}>
            <Card className="group transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>{item.time}</span>
                </div>
                <h3 className="font-bold text-foreground transition-colors group-hover:text-primary">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.excerpt}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
