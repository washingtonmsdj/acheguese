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
export default function AchegueSeHomePage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [cityQuery, setCityQuery] = useState<string>(
    `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`,
  );

  const canSubmitCity = useMemo(
    () => cityQuery.trim().length > 1,
    [cityQuery],
  );

  const goToLaunchCity = () => navigate(LAUNCH_CITY_PATH);

  const handleUseLocation = async () => {
    const ok = await geo.requestPermission();
    if (ok) goToLaunchCity();
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
            disabled={geo.loading}
            className="h-14 w-full gap-2 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25"
          >
            {geo.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
            Usar minha localização
          </Button>

          {geo.error ? (
            <p className="text-center text-xs text-destructive">{geo.error}</p>
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
