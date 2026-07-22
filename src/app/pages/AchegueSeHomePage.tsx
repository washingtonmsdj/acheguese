import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TERRITORY_CONFIG, LAUNCH_CITY_PATH } from "@/config/territory";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { cn } from "@/shared/utils/cn";

/**
 * AchegueSeHomePage — Splash/entry canônica em "/".
 *
 * Layout mobile-first inspirado no mockup do produto:
 *   Logo + nome  →  tagline  →  input de cidade  →  CTA principal (usar minha localização)
 *   →  divisor "ou"  →  CTA secundário (escolher cidade).
 *
 * Não redireciona automaticamente para a cidade de lançamento — a home passa
 * a ser esta tela de acolhimento.
 */
interface ReverseGeocodeAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  state?: string;
  state_code?: string;
  country_code?: string;
  "ISO3166-2-lvl4"?: string;
}

const BR_STATE_TO_UF: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", "amapá": "AP", amazonas: "AM",
  bahia: "BA", ceara: "CE", "ceará": "CE", "distrito federal": "DF",
  "espirito santo": "ES", "espírito santo": "ES", goias: "GO", "goiás": "GO",
  maranhao: "MA", "maranhão": "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
  "minas gerais": "MG", para: "PA", "pará": "PA", paraiba: "PB", "paraíba": "PB",
  parana: "PR", "paraná": "PR", pernambuco: "PE", piaui: "PI", "piauí": "PI",
  "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS",
  rondonia: "RO", "rondônia": "RO", roraima: "RR", "santa catarina": "SC",
  "sao paulo": "SP", "são paulo": "SP", sergipe: "SE", tocantins: "TO",
};

function extractUf(addr: ReverseGeocodeAddress): string | null {
  const iso = addr["ISO3166-2-lvl4"];
  if (iso && iso.startsWith("BR-")) return iso.slice(3).toUpperCase();
  if (addr.state_code) return addr.state_code.toUpperCase();
  if (addr.state) {
    const key = addr.state.toLowerCase();
    if (BR_STATE_TO_UF[key]) return BR_STATE_TO_UF[key];
  }
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=pt-BR`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: ReverseGeocodeAddress };
    const addr = data.address ?? {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
    const uf = extractUf(addr);
    if (city && uf) return `${city}, ${uf}`;
    if (city) return city;
    return null;
  } catch {
    return null;
  }
}

export default function AchegueSeHomePage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [cityQuery, setCityQuery] = useState<string>(
    `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`,
  );
  const [resolvingCity, setResolvingCity] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);

  const canSubmitCity = useMemo(
    () => cityQuery.trim().length > 1,
    [cityQuery],
  );

  const goToLaunchCity = () => navigate(LAUNCH_CITY_PATH);

  const handleUseLocation = async () => {
    setReverseError(null);
    const ok = await geo.requestPermission();
    if (!ok) return;
    // Read fresh coords via getCurrentPosition to avoid state race
    if (!("geolocation" in navigator)) return;
    setResolvingCity(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (label) {
          setCityQuery(label);
        } else {
          setReverseError("Não foi possível identificar sua cidade automaticamente.");
        }
        setResolvingCity(false);
      },
      () => {
        setReverseError("Não foi possível ler sua localização.");
        setResolvingCity(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* Glows suaves de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <main
        id="main-content"
        className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between px-6 pb-10 pt-16"
      >
        {/* Brand */}
        <section className="flex flex-col items-center text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <MapPin
                className="h-12 w-12 text-primary"
                strokeWidth={2.5}
                fill="hsl(var(--primary) / 0.15)"
              />
              <Heart
                className="absolute top-2.5 h-4 w-4 text-primary-foreground"
                fill="currentColor"
              />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            achegue-se
          </h1>
          <p className="mt-6 max-w-[16rem] text-base leading-relaxed text-muted-foreground">
            Descubra o que acontece perto de você.
          </p>
        </section>

        {/* Ações */}
        <section className="mt-10 w-full space-y-4">
          <label htmlFor="home-city" className="sr-only">
            Sua cidade
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
              aria-hidden
            />
            <Input
              id="home-city"
              value={cityQuery}
              onChange={(event) => setCityQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSubmitCity) goToLaunchCity();
              }}
              placeholder="Sua cidade"
              className="h-14 rounded-2xl border-border/60 bg-card pl-12 pr-12 text-base shadow-sm"
              autoComplete="address-level2"
              inputMode="text"
            />
            <button
              type="button"
              aria-label="Confirmar cidade"
              onClick={goToLaunchCity}
              disabled={!canSubmitCity}
              className={cn(
                "absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition",
                canSubmitCity
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/50",
              )}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleUseLocation}
            disabled={geo.loading || resolvingCity}
            className="h-14 w-full gap-2 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25"
          >
            {geo.loading || resolvingCity ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
            {resolvingCity ? "Identificando cidade..." : "Usar minha localização"}
          </Button>

          {geo.error || reverseError ? (
            <p className="text-center text-xs text-destructive">
              {geo.error || reverseError}
            </p>
          ) : null}

          <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate("/inicio")}
            className="h-14 w-full rounded-2xl border-border/60 bg-card text-base font-semibold"
          >
            Escolher cidade
          </Button>
        </section>

        <footer className="mt-10 text-center text-[11px] text-muted-foreground/70">
          {TERRITORY_CONFIG.launch.name}, {TERRITORY_CONFIG.launch.state.toUpperCase()} ·
          comunidade hiperlocal
        </footer>
      </main>
    </div>
  );
}
