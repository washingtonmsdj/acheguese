import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
  MessageCircle,
  Pencil,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import type {
  Profile,
  ProfileType,
} from "@/core/profiles/services/multi-profile/types";
import {
  buildProfileEditUrl,
  buildPublicProfileUrl,
} from "@/core/profiles/utils/publicProfileUrl";
import { getProfileTypeLabel } from "@/core/profiles/utils/profileDomainRules";
import { centralRoutes } from "@/core/routing/config/centralRoutes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type ProfileFilter =
  | "all"
  | "personal"
  | "business"
  | "professional"
  | "driver"
  | "communication_channel";

const FILTERS: ReadonlyArray<{ value: ProfileFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "personal", label: "Pessoal" },
  { value: "business", label: "Negócios" },
  { value: "professional", label: "Profissionais" },
  { value: "driver", label: "Mobilidade" },
  { value: "communication_channel", label: "Comunicação" },
];

const PROFILE_ACTIVATION_OPTIONS = [
  {
    label: "Criar perfil de negócio",
    description: "Cadastre uma empresa e gerencie a operação pela Central.",
    icon: Building2,
    href: centralRoutes.empresas.create,
  },
  {
    label: "Ativar perfil profissional",
    description: "Acesse a área profissional para configurar sua atuação.",
    icon: Briefcase,
    href: centralRoutes.profissional.home,
  },
  {
    label: "Ativar como motorista",
    description: "Inicie ou continue seu cadastro para corridas.",
    icon: Car,
    href: centralRoutes.motorista.cadastro,
  },
  {
    label: "Ativar como entregador",
    description: "Inicie ou continue seu cadastro para entregas.",
    icon: Bike,
    href: centralRoutes.motoboy.cadastro,
  },
] as const;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfileTypeIcon({ type }: { type: ProfileType }) {
  const Icon =
    type === "business"
      ? Building2
      : type === "professional"
        ? Briefcase
        : type === "driver"
          ? Car
          : type === "communication_channel"
            ? MessageCircle
            : UserRound;

  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

function ManagedProfileCard({
  profile,
  active,
  switching,
  onSwitch,
}: {
  profile: Profile;
  active: boolean;
  switching: boolean;
  onSwitch: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const handle = profile.handle?.trim();
  const canOpenPublicProfile =
    profile.profile_type === "personal" && profile.is_public === true && Boolean(handle);
  const territory = [profile.neighborhood, profile.city]
    .filter(Boolean)
    .join(", ");
  const summary = profile.short_bio || profile.bio;
  const displayName = profile.display_name || "Perfil sem nome";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-territory-surface p-4 transition-colors",
        active
          ? "border-territory-brand/45 ring-1 ring-territory-brand/10"
          : "border-territory-border hover:border-territory-brand/30",
      )}
      aria-busy={switching || undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="h-14 w-14 shrink-0 border border-territory-border bg-territory-raised sm:h-16 sm:w-16">
          <AvatarImage src={profile.avatar_url || undefined} alt="" />
          <AvatarFallback className="bg-territory-raised text-base font-bold text-territory-ink">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate font-heading text-base font-bold text-territory-ink sm:text-lg">
              {displayName}
            </h3>
            {profile.verified ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-territory-brand"
                aria-label="Perfil verificado"
              />
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-territory-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-territory-brand/10 px-2 py-1 font-semibold text-territory-brand">
              <ProfileTypeIcon type={profile.profile_type} />
              {getProfileTypeLabel(profile)}
            </span>
            {active ? (
              <span className="rounded-full bg-territory-sun/35 px-2 py-1 font-semibold text-territory-ink">
                Perfil ativo
              </span>
            ) : null}
            {profile.is_public === true ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                Público
              </span>
            ) : profile.is_public === false ? (
              <span className="rounded-full bg-territory-raised px-2 py-1 font-semibold text-territory-muted">
                Privado
              </span>
            ) : null}
          </div>

          {handle ? (
            <p className="mt-2 truncate text-sm text-territory-muted">@{handle}</p>
          ) : null}
          {summary ? (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-territory-muted">
              {summary}
            </p>
          ) : null}
          {territory ? (
            <p className="mt-2 truncate text-xs text-territory-muted">
              {territory}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-territory-border pt-3">
        {!active ? (
          <Button
            type="button"
            size="sm"
            className="min-h-10 bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
            onClick={() => void onSwitch()}
            disabled={switching}
            aria-label={`Usar ${displayName} como perfil ativo`}
          >
            {switching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {switching ? "Trocando..." : "Usar este perfil"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-10 border-territory-border bg-territory-surface text-territory-ink"
          onClick={() => navigate(buildProfileEditUrl(profile.id))}
          disabled={switching}
          aria-label={`Editar ${displayName}`}
        >
          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
        {canOpenPublicProfile ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-10 text-territory-brand"
            onClick={() => navigate(buildPublicProfileUrl(handle!))}
            disabled={switching}
            aria-label={`Ver perfil público de ${displayName}`}
          >
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            Ver público
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function ManagedProfilesPanel() {
  const navigate = useNavigate();
  const { activeProfile, allProfiles, switchProfile } = useMultiProfileContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProfileFilter>("all");
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = normalizeSearch(search);

    return allProfiles.filter((profile) => {
      const matchesFilter = filter === "all" || profile.profile_type === filter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const haystack = normalizeSearch(
        [
          profile.display_name,
          profile.handle,
          profile.short_bio,
          profile.bio,
          profile.neighborhood,
          profile.city,
          getProfileTypeLabel(profile),
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(normalizedQuery);
    });
  }, [allProfiles, filter, search]);

  const handleSwitch = async (profile: Profile) => {
    if (switchingProfileId || profile.id === activeProfile?.id) return;

    setSwitchingProfileId(profile.id);
    try {
      const changed = await switchProfile(profile.id);
      if (changed) {
        toast.success(`Perfil ativo: ${profile.display_name || "Perfil"}`);
        return;
      }
      toast.error("Não foi possível trocar o perfil ativo agora.");
    } catch {
      toast.error("Não foi possível trocar o perfil ativo agora.");
    } finally {
      setSwitchingProfileId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  return (
    <section aria-labelledby="managed-profiles-title">
      <div className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="managed-profiles-title" className="font-heading text-lg font-bold text-territory-ink">
              Seus perfis
            </h2>
            <p className="mt-1 text-sm leading-5 text-territory-muted">
              Busque, troque a identidade ativa e abra somente as ações disponíveis para cada perfil.
            </p>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Buscar perfil pelo nome, usuário ou território</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar perfil"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-territory-border bg-territory-surface pl-10 pr-3 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/15"
            />
          </label>
        </div>

        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          role="group"
          aria-label="Filtrar perfis por tipo"
        >
          {FILTERS.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
                  selected
                    ? "bg-territory-brand text-white"
                    : "bg-territory-raised text-territory-ink hover:bg-territory-border",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3" aria-live="polite" aria-busy={switchingProfileId !== null || undefined}>
        {filteredProfiles.map((profile) => (
          <ManagedProfileCard
            key={profile.id}
            profile={profile}
            active={profile.id === activeProfile?.id}
            switching={profile.id === switchingProfileId}
            onSwitch={() => handleSwitch(profile)}
          />
        ))}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-territory-border bg-territory-surface px-4 py-10 text-center">
            <p className="font-semibold text-territory-ink">Nenhum perfil encontrado</p>
            <p className="mt-1 text-sm text-territory-muted">
              Ajuste a busca ou selecione outro tipo de perfil.
            </p>
            {(search || filter !== "all") ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 min-h-10 rounded-xl px-3 text-sm font-semibold text-territory-brand hover:bg-territory-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <details className="group mt-4 rounded-2xl border border-territory-border bg-territory-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand [&::-webkit-details-marker]:hidden">
          Criar ou ativar outro perfil
          <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="grid gap-2 border-t border-territory-border p-3 sm:grid-cols-2 sm:p-4">
          {PROFILE_ACTIVATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => navigate(option.href)}
                className="flex min-h-16 items-start gap-3 rounded-xl border border-territory-border bg-territory-raised p-3 text-left transition-colors hover:border-territory-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-territory-ink">{option.label}</span>
                  <span className="mt-1 block text-xs leading-4 text-territory-muted">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </details>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-territory-border bg-territory-brand/5 p-4 text-sm text-territory-muted">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <p>
          A troca de perfil, a edição e a visualização pública respeitam as permissões e o estado real de cada identidade.
        </p>
      </div>
    </section>
  );
}
