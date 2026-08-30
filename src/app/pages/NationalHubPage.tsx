import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LAUNCH_CITY_PATH, TERRITORY_CONFIG } from "@/core/routing/config/territory";

type CityEntry = {
  uf: string;
  slug: string;
  name: string;
  region: string;
  path: string;
  status: "live" | "soon";
  tagline?: string;
};

const LAUNCH_UF = (TERRITORY_CONFIG.launch.state || "ba").toUpperCase();
const LAUNCH_SLUG = TERRITORY_CONFIG.launch.city || "salvador";
const LAUNCH_NAME = TERRITORY_CONFIG.launch.name || "Salvador";

const LIVE_CITIES: CityEntry[] = [
  {
    uf: LAUNCH_UF,
    slug: LAUNCH_SLUG,
    name: LAUNCH_NAME,
    region: "Nordeste",
    path: LAUNCH_CITY_PATH,
    status: "live",
    tagline: "Comunidade oficial ativa",
  },
];

const UPCOMING_CITIES: CityEntry[] = [
  { uf: "PE", slug: "recife", name: "Recife", region: "Nordeste", path: "/pe/recife", status: "soon" },
  { uf: "CE", slug: "fortaleza", name: "Fortaleza", region: "Nordeste", path: "/ce/fortaleza", status: "soon" },
  { uf: "PB", slug: "joao-pessoa", name: "João Pessoa", region: "Nordeste", path: "/pb/joao-pessoa", status: "soon" },
  { uf: "RN", slug: "natal", name: "Natal", region: "Nordeste", path: "/rn/natal", status: "soon" },
  { uf: "AL", slug: "maceio", name: "Maceió", region: "Nordeste", path: "/al/maceio", status: "soon" },
  { uf: "SE", slug: "aracaju", name: "Aracaju", region: "Nordeste", path: "/se/aracaju", status: "soon" },
  { uf: "MA", slug: "sao-luis", name: "São Luís", region: "Nordeste", path: "/ma/sao-luis", status: "soon" },
  { uf: "PI", slug: "teresina", name: "Teresina", region: "Nordeste", path: "/pi/teresina", status: "soon" },
  { uf: "SP", slug: "sao-paulo", name: "São Paulo", region: "Sudeste", path: "/sp/sao-paulo", status: "soon" },
  { uf: "RJ", slug: "rio-de-janeiro", name: "Rio de Janeiro", region: "Sudeste", path: "/rj/rio-de-janeiro", status: "soon" },
  { uf: "MG", slug: "belo-horizonte", name: "Belo Horizonte", region: "Sudeste", path: "/mg/belo-horizonte", status: "soon" },
  { uf: "ES", slug: "vitoria", name: "Vitória", region: "Sudeste", path: "/es/vitoria", status: "soon" },
  { uf: "PR", slug: "curitiba", name: "Curitiba", region: "Sul", path: "/pr/curitiba", status: "soon" },
  { uf: "RS", slug: "porto-alegre", name: "Porto Alegre", region: "Sul", path: "/rs/porto-alegre", status: "soon" },
  { uf: "SC", slug: "florianopolis", name: "Florianópolis", region: "Sul", path: "/sc/florianopolis", status: "soon" },
  { uf: "DF", slug: "brasilia", name: "Brasília", region: "Centro-Oeste", path: "/df/brasilia", status: "soon" },
  { uf: "GO", slug: "goiania", name: "Goiânia", region: "Centro-Oeste", path: "/go/goiania", status: "soon" },
  { uf: "MT", slug: "cuiaba", name: "Cuiabá", region: "Centro-Oeste", path: "/mt/cuiaba", status: "soon" },
  { uf: "MS", slug: "campo-grande", name: "Campo Grande", region: "Centro-Oeste", path: "/ms/campo-grande", status: "soon" },
  { uf: "AM", slug: "manaus", name: "Manaus", region: "Norte", path: "/am/manaus", status: "soon" },
  { uf: "PA", slug: "belem", name: "Belém", region: "Norte", path: "/pa/belem", status: "soon" },
  { uf: "AC", slug: "rio-branco", name: "Rio Branco", region: "Norte", path: "/ac/rio-branco", status: "soon" },
  { uf: "RO", slug: "porto-velho", name: "Porto Velho", region: "Norte", path: "/ro/porto-velho", status: "soon" },
  { uf: "RR", slug: "boa-vista", name: "Boa Vista", region: "Norte", path: "/rr/boa-vista", status: "soon" },
  { uf: "AP", slug: "macapa", name: "Macapá", region: "Norte", path: "/ap/macapa", status: "soon" },
  { uf: "TO", slug: "palmas", name: "Palmas", region: "Norte", path: "/to/palmas", status: "soon" },
];

const ALL_CITIES: CityEntry[] = [...LIVE_CITIES, ...UPCOMING_CITIES];
const REGIONS = ["Todas", "Nordeste", "Sudeste", "Sul", "Centro-Oeste", "Norte"] as const;
const PAGE_SIZE = 12;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function NationalHubPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Todas");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return ALL_CITIES.filter((city) => {
      if (region !== "Todas" && city.region !== region) return false;
      if (!q) return true;
      return (
        normalize(city.name).includes(q) ||
        normalize(city.uf).includes(q) ||
        normalize(city.region).includes(q)
      );
    });
  }, [query, region]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleRegionChange = (next: (typeof REGIONS)[number]) => {
    setRegion(next);
    setPage(1);
  };

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

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar cidade, UF ou região..."
                className="h-11 pl-9"
                aria-label="Buscar cidade"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {REGIONS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={item === region ? "default" : "outline"}
                  onClick={() => handleRegionChange(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filtered.length} {filtered.length === 1 ? "cidade" : "cidades"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
        </div>

        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
            Nenhuma cidade encontrada com esses filtros.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((city) => {
              const isLive = city.status === "live";
              return (
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
                      {isLive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">
                          Ao vivo
                        </Badge>
                      ) : (
                        <Badge variant="outline">Em breve</Badge>
                      )}
                    </div>
                    {city.tagline ? (
                      <p className="text-sm text-muted-foreground">{city.tagline}</p>
                    ) : null}
                    {isLive ? (
                      <Button asChild className="mt-auto w-full gap-2">
                        <Link to={city.path} aria-label={`Abrir landing de ${city.name}`}>
                          Entrar na cidade
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="mt-auto w-full" variant="outline">
                        Em breve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                size="sm"
                variant={pageNumber === currentPage ? "default" : "outline"}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
