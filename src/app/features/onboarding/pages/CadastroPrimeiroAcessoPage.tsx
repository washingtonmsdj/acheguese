import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  clearPendingSignupContext,
  getPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { ProfileRow } from "@/core/profiles/services/types";
import { SUPPORT_PATH } from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

interface TerritoryOption {
  id: string;
  name: string;
}

interface ConceptSelectProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: TerritoryOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

/**
 * Controle nativo do fluxo de primeiro acesso.
 * O indicador é desenhado com bordas CSS para manter esta superfície sem SVG
 * ou pacote de ícones genérico e preservar semântica/acessibilidade do select.
 */
function ConceptSelect({
  id,
  label,
  value,
  placeholder,
  options,
  disabled = false,
  onChange,
}: ConceptSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-[#b9c5c6] bg-white px-3 pr-10 text-[13px] text-[#173d41] shadow-none outline-none transition-colors focus:border-[#0b5b59] focus:ring-2 focus:ring-[#0b5b59]/20 disabled:cursor-not-allowed disabled:bg-[#f2f3f0] disabled:text-[#819092]"
        >
          <option value="">{placeholder}</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-[65%] rotate-45 border-b-2 border-r-2 border-[#446063]"
        />
      </div>
    </div>
  );
}

export default function CadastroPrimeiroAcessoPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [showTerritoryForm, setShowTerritoryForm] = useState(false);
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [saving, setSaving] = useState(false);
  const [territorySaved, setTerritorySaved] = useState(false);

  const redirectTo = useMemo(
    () => resolveSafeInternalPath(getPendingSignupRedirect(), "/"),
    [],
  );
  const { states, cities, neighborhoods, loadingStates, loadingCities, loadingNeighborhoods } =
    useLocationCascade(stateId || null, cityId || null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    setProfileLoadError(false);
    try {
      const result = await profileService.getRequiredActiveProfile(user.id);
      setProfile(result);
    } catch {
      setProfile(null);
      setProfileLoadError(true);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login?confirmed=1", { replace: true });
      return;
    }
    void loadProfile();
  }, [loadProfile, navigate, user]);

  const leaveFirstAccess = (target: string) => {
    clearPendingSignupContext();
    navigate(target, { replace: true });
  };

  const saveTerritory = async () => {
    if (!profile || !stateId || !cityId || !neighborhoodId) {
      toast({
        title: "Escolha estado, cidade e bairro",
        variant: "destructive",
      });
      return;
    }

    const state = states.find((item) => item.id === stateId);
    const city = cities.find((item) => item.id === cityId);
    const neighborhood = neighborhoods.find((item) => item.id === neighborhoodId);
    if (!state || !city || !neighborhood) return;

    setSaving(true);
    try {
      const updated = await profileService.updateProfile(profile.id, {
        state: state.name,
        city: city.name,
        neighborhood: neighborhood.name,
        location_id: neighborhood.id,
        main_territory_location_id: neighborhood.id,
        public_location_visibility: "hidden",
      });
      setProfile(updated);
      await refreshUser();
      setTerritorySaved(true);
      setShowTerritoryForm(false);
      toast({ title: "Território atualizado" });
    } catch {
      toast({
        title: "Não foi possível salvar agora",
        description: "Você pode tentar novamente ou completar seu perfil depois.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#fffdfa] text-[#486367]">
        <div role="status" className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5d3] border-t-[#0b5b59] motion-reduce:animate-none" />
          Preparando sua conta…
        </div>
      </div>
    );
  }

  if (profileLoadError || !profile) {
    return (
      <>
        <Helmet>
          <title>Preparar perfil | Achegue-se</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33]">
          <AuthBrandHeader showBack={false} />
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[430px] px-6 pb-8 pt-6 focus:outline-none">
            <section className="rounded-2xl border border-[#d8dfdd] bg-white p-5 shadow-[0_18px_55px_rgba(17,55,59,.06)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f2e7] text-[#b27b00]">
                <AuthConceptIcon name="info" />
              </span>
              <h1 className="mt-4 font-heading text-[25px] font-extrabold tracking-[-0.035em]">Seu acesso foi confirmado.</h1>
              <p className="mt-2 text-[13px] leading-5 text-[#607477]">
                Ainda não conseguimos carregar seu perfil pessoal. Isso pode acontecer por alguns segundos logo após a criação da conta.
              </p>
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="mt-5 h-11 w-full rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
              >
                Tentar carregar novamente
              </button>
              <Link
                to={SUPPORT_PATH}
                className="mx-auto mt-3 flex min-h-10 w-fit items-center gap-2 rounded px-2 text-[12px] text-[#0b4e52] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
              >
                <AuthConceptIcon name="help" />
                Preciso de ajuda
              </Link>
            </section>
          </main>
          <AuthFooter />
        </div>
      </>
    );
  }

  const displayName = profile.display_name || profile.name || user?.email?.split("@")[0] || "você";
  const username = profile.username ? `@${profile.username.replace(/^@/, "")}` : null;

  return (
    <>
      <Helmet>
        <title>Primeiro acesso | Achegue-se</title>
        <meta
          name="description"
          content="Conclua seu primeiro acesso, retome o que estava fazendo e informe seu território se quiser."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_18%_28%,rgba(216,234,224,.45),transparent_30%),#fffdfa]">
        <AuthBrandHeader showBack={false} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-7 pt-2 focus:outline-none lg:max-w-[760px] lg:pt-7"
        >
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dff5e8] text-[#0b5b59]">
              <span style={{ transform: "scale(1.35)" }}><AuthConceptIcon name="check" /></span>
            </span>
            <h1 className="mt-3 font-heading text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-[#0b3b3f] lg:text-[34px]">
              Tudo pronto, {displayName.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-[13px] text-[#405b5e]">Sua conta foi criada com sucesso.</p>
          </div>

          <div className="lg:mt-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
            <div>
              <section className="mt-4 flex items-center gap-3 rounded-xl border border-[#d5dcda] bg-white p-3 lg:mt-0 lg:p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eeec] text-[#0b5b59]">
                  <AuthConceptIcon name="person" />
                </span>
                <div>
                  <p className="text-[13px] font-bold">{displayName}</p>
                  {username ? <p className="text-[11px] text-[#607477]">{username}</p> : null}
                  <p className="text-[11px] text-[#607477]">Perfil pessoal</p>
                </div>
              </section>

              {redirectTo !== "/" ? (
                <section className="mt-3 rounded-xl bg-[#eef8f2] p-3 lg:p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff3e8] text-[#0b5b59]">
                      <AuthConceptIcon name="chat" />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold">Sua conversa está esperando</p>
                      <p className="text-[11px] leading-4 text-[#4c6862]">Continue de onde parou sem precisar completar seu perfil agora.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => leaveFirstAccess(redirectTo)}
                    className="mt-3 h-10 w-full rounded-[9px] bg-[#ffc91a] text-[13px] font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
                  >
                    Continuar para a conversa
                  </button>
                  <button
                    type="button"
                    onClick={() => leaveFirstAccess(redirectTo)}
                    className="mx-auto mt-1 block min-h-9 rounded px-2 text-[11px] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
                  >
                    Completar meu perfil depois
                  </button>
                </section>
              ) : (
                <Link
                  to="/"
                  onClick={() => clearPendingSignupContext()}
                  className="mt-3 flex h-10 items-center justify-center rounded-[9px] bg-[#ffc91a] text-[12px] font-bold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
                >
                  Explorar o Achegue-se
                </Link>
              )}

              <Link to="/conta" onClick={() => clearPendingSignupContext()} className="mt-3 flex min-h-11 items-center gap-3 rounded-xl bg-[#f3f1ea] px-3 text-[11px] font-medium text-[#315356] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                <AuthConceptIcon name="users" className="text-[#0b5b59]" />
                Outros perfis ficam em Meus perfis.
              </Link>
            </div>

            <section className="mt-3 rounded-xl border border-[#d5dcda] bg-white p-3 lg:mt-0 lg:p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8eeec] text-[#0b5b59]">
                  <AuthConceptIcon name="pin" />
                </span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold">Seu vínculo com o território</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#607477]">
                    Conte pra gente sua cidade e bairro para ver conteúdos mais relevantes.
                  </p>
                </div>
              </div>

              {territorySaved ? (
                <div role="status" className="mt-3 rounded-lg bg-[#eaf7ef] px-3 py-2 text-[11px] font-medium text-[#276a4d]">
                  Cidade e bairro salvos. A localização pública continua oculta por padrão.
                </div>
              ) : null}

              {showTerritoryForm ? (
                <div className="mt-4 space-y-3">
                  <ConceptSelect
                    id="first-access-state"
                    label="Estado"
                    value={stateId}
                    placeholder={loadingStates ? "Carregando…" : "Selecione"}
                    options={states}
                    disabled={loadingStates || saving}
                    onChange={(value) => {
                      setStateId(value);
                      setCityId("");
                      setNeighborhoodId("");
                    }}
                  />
                  <ConceptSelect
                    id="first-access-city"
                    label="Cidade"
                    value={cityId}
                    placeholder={loadingCities ? "Carregando…" : "Selecione"}
                    options={cities}
                    disabled={!stateId || loadingCities || saving}
                    onChange={(value) => {
                      setCityId(value);
                      setNeighborhoodId("");
                    }}
                  />
                  <ConceptSelect
                    id="first-access-neighborhood"
                    label="Bairro"
                    value={neighborhoodId}
                    placeholder={loadingNeighborhoods ? "Carregando…" : "Selecione"}
                    options={neighborhoods}
                    disabled={!cityId || loadingNeighborhoods || saving}
                    onChange={setNeighborhoodId}
                  />
                  <button type="button" onClick={() => void saveTerritory()} disabled={saving || !neighborhoodId} className="h-10 w-full rounded-[9px] bg-[#0b5b59] text-[12px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 disabled:opacity-55">
                    {saving ? "Salvando…" : "Salvar cidade e bairro"}
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <button type="button" onClick={() => setShowTerritoryForm(true)} className="h-10 w-full rounded-[9px] border border-[#31575a] bg-white text-[12px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                    Informar cidade e bairro
                  </button>
                  <button type="button" onClick={() => leaveFirstAccess(redirectTo)} className="h-10 w-full rounded-[9px] border border-[#31575a] bg-white text-[12px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                    Agora não
                  </button>
                </div>
              )}
              <p className="mt-2 text-[10.5px] leading-4 text-[#607477]">Você pode explorar o Achegue-se mesmo morando em outro lugar.</p>
            </section>
          </div>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
