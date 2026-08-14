import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Globe2,
  MapPin,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";

import type { ProfileRow as Profile } from "@/core/profiles/services/types";

interface ProfilePublicPageProps {
  profile: Profile;
}

type PublicLocationVisibility = "hidden" | "city_only" | "district";

type ProfileWithPublicLocation = Profile & {
  public_location_visibility?: PublicLocationVisibility | null;
  public_city?: string | null;
  public_state?: string | null;
  public_neighborhood?: string | null;
};

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMemberSince(date?: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function buildLocationLabel(profile: ProfileWithPublicLocation): string | null {
  const visibility = profile.public_location_visibility ?? "city_only";
  if (visibility === "hidden") return null;

  const cityState = [profile.public_city, profile.public_state]
    .filter(Boolean)
    .join(" / ");

  if (visibility === "district") {
    return (
      [profile.public_neighborhood, cityState].filter(Boolean).join(", ") ||
      null
    );
  }

  return cityState || null;
}

export function ProfilePublicPage({ profile }: ProfilePublicPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const publicProfile = profile as ProfileWithPublicLocation;
  const locationLabel = useMemo(
    () => buildLocationLabel(publicProfile),
    [publicProfile],
  );
  const memberSince = formatMemberSince(profile.created_at);
  const displayName = profile.name || profile.username || "Perfil";
  const publicHandle = profile.username ? `@${profile.username}` : null;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(appUrls.home);
  };

  const handleShare = async () => {
    const url = new URL(
      buildPublicProfileUrl(profile.username),
      window.location.origin,
    ).toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${displayName}`,
          text: profile.bio || `Confira o perfil de ${displayName}`,
          url,
        });
        return;
      } catch {
        // O cancelamento do compartilhamento nativo não é uma falha da página.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do perfil copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  return (
    <>
      <Helmet>
        <title>{displayName} | Perfil público no Achegue-se</title>
        <meta
          name="description"
          content={profile.bio || `Perfil público de ${displayName}`}
        />
        <meta property="og:title" content={displayName} />
        <meta
          property="og:description"
          content={profile.bio || `Perfil público de ${displayName}`}
        />
        {profile.avatar_url ? (
          <meta property="og:image" content={profile.avatar_url} />
        ) : null}
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main className="mx-auto w-full max-w-[1080px] px-3 pb-24 pt-4 sm:px-6 sm:pt-6 md:pb-10 lg:px-8 lg:pt-8">
          <header className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="min-h-11 text-territory-ink hover:bg-territory-raised"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="outline"
              className="min-h-11 border-territory-border bg-territory-surface text-territory-ink"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </header>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <section className="overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-surface">
              <div className="border-b border-territory-border bg-territory-raised p-5 sm:p-7">
                <p className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                  <Globe2 className="h-4 w-4" />
                  Perfil público
                </p>
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <Avatar className="h-28 w-28 border border-territory-border bg-territory-surface sm:h-32 sm:w-32">
                    <AvatarImage src={profile.avatar_url || undefined} alt="" />
                    <AvatarFallback className="bg-territory-surface text-3xl font-semibold text-territory-ink">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-heading text-3xl font-semibold leading-tight text-territory-ink sm:text-4xl">
                        {displayName}
                      </h1>
                      {profile.verified ? (
                        <CheckCircle2
                          className="h-5 w-5 text-territory-brand"
                          aria-label="Perfil verificado"
                        />
                      ) : null}
                    </div>
                    {publicHandle ? (
                      <p className="mt-2 text-base text-territory-muted">
                        {publicHandle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {profile.bio ? (
                  <p className="max-w-3xl text-base leading-7 text-territory-ink sm:text-lg">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="rounded-territory border border-dashed border-territory-border bg-territory-raised p-4 text-sm text-territory-muted">
                    Este perfil ainda não publicou uma apresentação.
                  </p>
                )}

                {locationLabel || memberSince ? (
                  <dl className="mt-6 grid gap-3 border-t border-territory-border pt-5 sm:grid-cols-2">
                    {locationLabel ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-territory-brand" />
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-territory-muted">
                            Localização compartilhada
                          </dt>
                          <dd className="mt-1 text-sm text-territory-ink">
                            {locationLabel}
                          </dd>
                        </div>
                      </div>
                    ) : null}
                    {memberSince ? (
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 text-territory-brand" />
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-territory-muted">
                            No Achegue-se desde
                          </dt>
                          <dd className="mt-1 text-sm text-territory-ink">
                            {memberSince}
                          </dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            </section>

            <aside className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-territory-brand" />
                <h2 className="font-heading text-lg font-semibold text-territory-ink">
                  Sobre esta página
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-territory-muted">
                Esta é a apresentação pública escolhida por esta pessoa. Dados
                de acesso, contato privado e endereço completo nunca aparecem
                aqui.
              </p>
              {profile.verified ? (
                <p className="mt-4 rounded-territory bg-territory-brand/10 p-3 text-sm font-medium text-territory-brand">
                  Identidade verificada no Achegue-se.
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="mt-5 min-h-11 w-full border-territory-border bg-territory-surface text-territory-ink"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar perfil
              </Button>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
