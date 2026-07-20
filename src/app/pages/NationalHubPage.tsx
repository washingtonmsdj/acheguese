import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { LAUNCH_CITY_PATH, TERRITORY_CONFIG } from "@/config/territory";

type CityEntry = {
  uf: string;
  slug: string;
  name: string;
  region: string;
  path: string;
  status: "live" | "soon";
  tagline?: string;
};

const CITIES: CityEntry[] = [
  {
    uf: (TERRITORY_CONFIG.launch.state || "ba").toUpperCase(),
    slug: TERRITORY_CONFIG.launch.city || "salvador",
    name: TERRITORY_CONFIG.launch.name || "Salvador",
    region: "Nordeste",
    path: LAUNCH_CITY_PATH,
    status: "live",
    tagline: "Comunidade oficial ativa",
  },
];

const UPCOMING: Array<Pick<CityEntry, "name" | "region">> = [
  { name: "Recife", region: "Nordeste" },
  { name: "Fortaleza", region: "Nordeste" },
  { name: "São Paulo", region: "Sudeste" },
  { name: "Rio de Janeiro", region: "Sudeste" },
  { name: "Belo Horizonte", region: "Sudeste" },
];

export default function NationalHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ORDAX — Escolha sua cidade</title>
        <meta
          name="description"
          content="Explore as cidades atendidas pela ORDAX e entre na comunidade oficial da sua região."
        />
        <link rel="canonical" href="/inicio" />
      </Helmet>

      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Sparkles className="h-3 w-3" /> Hub nacional
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Escolha sua cidade
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
            Cada cidade tem sua própria landing oficial, comunidade, eventos,
            comércios e alertas locais. Comece pela sua.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Cidades disponíveis</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city) => (
            <Card
              key={`${city.uf}-${city.slug}`}
              className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {city.uf} · {city.region}
                    </div>
                    <h3 className="mt-1 text-2xl font-bold">{city.name}</h3>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">
                    Ao vivo
                  </Badge>
                </div>
                {city.tagline ? (
                  <p className="text-sm text-muted-foreground">{city.tagline}</p>
                ) : null}
                <Button asChild className="mt-auto w-full gap-2">
                  <Link to={city.path} aria-label={`Abrir landing de ${city.name}`}>
                    Entrar na cidade
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-6 text-xl font-semibold">Em breve</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.map((city) => (
            <div
              key={city.name}
              className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{city.name}</div>
                <div className="text-xs text-muted-foreground">{city.region}</div>
              </div>
              <Badge variant="outline" className="text-xs">
                Em breve
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
