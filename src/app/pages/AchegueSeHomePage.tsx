import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Navigation,
  X,
} from "lucide-react";

const OFFICIAL_LOGO_SRC = "/images/logo-icon.png";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TERRITORY_CONFIG, LAUNCH_CITY_PATH } from "@/config/territory";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { cn } from "@/shared/utils/cn";

/**
 * AchegueSeHomePage — Splash/entry canônica em "/".
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

interface ResolvedLocation {
  label: string;
  lat: number;
  lng: number;
}

interface CitySuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
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

const LS_KEY = "achegue-se:last-city";

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

function buildLabel(addr: ReverseGeocodeAddress): string | null {
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
  const uf = extractUf(addr);
  if (city && uf) return `${city}, ${uf}`;
  if (city) return city;
  return null;
}

async function reverseGeocode(
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=pt-BR`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: ReverseGeocodeAddress };
  return buildLabel(data.address ?? {});
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  address?: ReverseGeocodeAddress;
  display_name?: string;
}

async function searchCities(
  query: string,
  signal: AbortSignal,
): Promise<CitySuggestion[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
    `&countrycodes=br&featuretype=city&limit=6&accept-language=pt-BR` +
    `&city=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimSearchItem[];
  const seen = new Set<string>();
  const out: CitySuggestion[] = [];
  for (const item of data) {
    const label = buildLabel(item.address ?? {}) ?? item.display_name ?? null;
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({
      id: String(item.place_id),
      label,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  }
  return out;
}

function readStoredCity(): ResolvedLocation | string | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResolvedLocation>;
    if (parsed && typeof parsed.label === "string") {
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return { label: parsed.label, lat: parsed.lat, lng: parsed.lng };
      }
      return parsed.label;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatGeolocationError(err: string | null): string | null {
  if (!err) return null;
  const lower = err.toLowerCase();
  if (lower.includes("denied") || lower.includes("permission")) {
    return "Permissão de localização negada. Ative-a nas configurações do navegador (ícone do cadeado → Permissões → Localização) e tente novamente.";
  }
  if (lower.includes("unavailable")) {
    return "Não foi possível determinar sua posição. Verifique se o GPS/Wi-Fi está ativo e tente novamente.";
  }
  if (lower.includes("timeout")) {
    return "A localização demorou demais para responder. Tente novamente em uma área com melhor sinal.";
  }
  if (lower.includes("suportada")) {
    return "Seu dispositivo ou navegador não oferece suporte à geolocalização. Digite sua cidade manualmente abaixo.";
  }
  return err;
}

export default function AchegueSeHomePage() {
  const navigate = useNavigate();
  const geo = useGeolocation();

  const initial = useMemo(() => {
    const stored = readStoredCity();
    if (stored && typeof stored === "object") {
      return { query: stored.label, resolved: stored as ResolvedLocation };
    }
    if (typeof stored === "string" && stored.trim()) {
      return { query: stored, resolved: null };
    }
    return {
      query: `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`,
      resolved: null,
    };
  }, []);

  const [cityQuery, setCityQuery] = useState<string>(initial.query);
  const [resolved, setResolved] = useState<ResolvedLocation | null>(initial.resolved);
  const [resolvingCity, setResolvingCity] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const reverseAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const manualEditRef = useRef(false);

  const canSubmitCity = useMemo(() => cityQuery.trim().length > 1, [cityQuery]);

  const persistCity = useCallback((label: string, coords?: ResolvedLocation | null) => {
    try {
      const payload = coords ? coords : { label };
      window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, []);

  const cancelPendingRequests = useCallback(() => {
    reverseAbortRef.current?.abort();
    reverseAbortRef.current = null;
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelPendingRequests(), [cancelPendingRequests]);

  // Debounced autocomplete for manual edits
  useEffect(() => {
    if (!manualEditRef.current) return;
    const q = cityQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    const timeout = window.setTimeout(async () => {
      try {
        const results = await searchCities(q, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch {
        /* aborted or network */
      }
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cityQuery]);

  const goToLaunchCity = (label?: string, coords?: ResolvedLocation | null) => {
    const finalLabel = (label ?? cityQuery).trim();
    if (finalLabel) persistCity(finalLabel, coords ?? resolved);
    navigate(LAUNCH_CITY_PATH);
  };

  const handleUseLocation = async () => {
    setReverseError(null);
    setResolved(null);
    if (!("geolocation" in navigator)) {
      setReverseError(
        "Seu dispositivo ou navegador não oferece suporte à geolocalização. Digite sua cidade manualmente abaixo.",
      );
      return;
    }
    const ok = await geo.requestPermission();
    if (!ok) return;

    setResolvingCity(true);
    manualEditRef.current = false;
    setShowSuggestions(false);

    const controller = new AbortController();
    reverseAbortRef.current?.abort();
    reverseAbortRef.current = controller;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const label = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          if (label) {
            setCityQuery(label);
            setResolved({
              label,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } else {
            setReverseError("Não foi possível identificar sua cidade automaticamente.");
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setReverseError("Falha ao consultar o serviço de localização. Tente novamente.");
          }
        } finally {
          if (!controller.signal.aborted) setResolvingCity(false);
        }
      },
      (err) => {
        const codeMap: Record<number, string> = {
          1: "Permissão de localização negada. Ative-a nas configurações do navegador (ícone do cadeado → Permissões → Localização) e tente novamente.",
          2: "Não foi possível determinar sua posição. Verifique se o GPS/Wi-Fi está ativo e tente novamente.",
          3: "A localização demorou demais para responder. Tente novamente em uma área com melhor sinal.",
        };
        setReverseError(codeMap[err.code] ?? err.message);
        setResolvingCity(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleManualChange = (value: string) => {
    manualEditRef.current = true;
    // Any manual edit invalidates the geocode result and cancels pending requests
    cancelPendingRequests();
    setResolved(null);
    setResolvingCity(false);
    setReverseError(null);
    setCityQuery(value);
  };

  const handlePickSuggestion = (s: CitySuggestion) => {
    manualEditRef.current = false;
    setSuggestions([]);
    setShowSuggestions(false);
    setCityQuery(s.label);
    setResolved({ label: s.label, lat: s.lat, lng: s.lng });
  };

  const geoErrorLabel = formatGeolocationError(geo.error);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <main
        id="main-content"
        className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between px-6 pb-10 pt-16"
      >
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
              onChange={(event) => handleManualChange(event.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Small delay so clicks on suggestion register first
                window.setTimeout(() => setShowSuggestions(false), 150);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSubmitCity) {
                  setShowSuggestions(false);
                  goToLaunchCity();
                }
                if (event.key === "Escape") setShowSuggestions(false);
              }}
              placeholder="Sua cidade"
              className="h-14 rounded-2xl border-border/60 bg-card pl-12 pr-12 text-base shadow-sm"
              autoComplete="off"
              inputMode="text"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="home-city-suggestions"
            />
            <button
              type="button"
              aria-label="Confirmar cidade"
              onClick={() => goToLaunchCity()}
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

            {showSuggestions && suggestions.length > 0 ? (
              <ul
                id="home-city-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-border/60 bg-popover p-1 shadow-lg"
              >
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={cityQuery === s.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickSuggestion(s)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Mini preview do local resolvido via geocode */}
          {resolved ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Local encontrado
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {resolved.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    lat {resolved.lat.toFixed(5)} · lng {resolved.lng.toFixed(5)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Descartar local encontrado"
                  onClick={() => setResolved(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-background/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => goToLaunchCity(resolved.label, resolved)}
                className="mt-3 h-9 w-full gap-2 rounded-xl"
              >
                <Check className="h-4 w-4" />
                Confirmar {resolved.label}
              </Button>
            </div>
          ) : null}

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

          {geoErrorLabel || reverseError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-relaxed text-destructive"
            >
              {geoErrorLabel || reverseError}
            </div>
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
